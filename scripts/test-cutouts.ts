/**
 * Live smoke test for the cutout pipeline — hits the real fal.ai/remove.bg
 * APIs (costs about a cent per run). Covers the two production failure modes:
 * already-transparent sources coming back blank, and photos coming back with
 * the background still baked in.
 *
 * Run: npx tsx scripts/test-cutouts.ts
 * Outputs land in scripts/test-output/ for a visual check.
 */
import { promises as fs } from "fs";
import path from "path";
import { PNG } from "pngjs";

async function loadDotenv() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {
    // ignore — env may be set externally
  }
}

const OUT_DIR = path.join(process.cwd(), "scripts", "test-output");

// A real-world transparent PNG (Wikimedia's PNG transparency demo dice).
const TRANSPARENT_SOURCE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";

interface Stats {
  opaqueFraction: number;
  transparentFraction: number;
  borderOpaqueFraction: number;
}

function statsOf(buffer: Buffer): Stats | null {
  let png: PNG;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    return null;
  }
  const { width, height, data } = png;
  let opaque = 0;
  let transparent = 0;
  const total = width * height;
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a > 32) opaque++;
    else if (a < 8) transparent++;
  }
  const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];
  let borderOpaque = 0;
  let borderTotal = 0;
  for (let x = 0; x < width; x++) {
    borderTotal += 2;
    if (alphaAt(x, 0) >= 128) borderOpaque++;
    if (alphaAt(x, height - 1) >= 128) borderOpaque++;
  }
  for (let y = 0; y < height; y++) {
    borderTotal += 2;
    if (alphaAt(0, y) >= 128) borderOpaque++;
    if (alphaAt(width - 1, y) >= 128) borderOpaque++;
  }
  return {
    opaqueFraction: opaque / total,
    transparentFraction: transparent / total,
    borderOpaqueFraction: borderOpaque / borderTotal,
  };
}

function flattenOntoWhite(input: Buffer): Buffer {
  const png = PNG.sync.read(input);
  const flat = new PNG({ width: png.width, height: png.height });
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255;
    flat.data[i] = Math.round(png.data[i] * a + 255 * (1 - a));
    flat.data[i + 1] = Math.round(png.data[i + 1] * a + 255 * (1 - a));
    flat.data[i + 2] = Math.round(png.data[i + 2] * a + 255 * (1 - a));
    flat.data[i + 3] = 255;
  }
  return PNG.sync.write(flat);
}

function describe(stats: Stats | null): string {
  if (!stats) return "NOT A DECODABLE PNG";
  return (
    `opaque ${(stats.opaqueFraction * 100).toFixed(1)}%, ` +
    `transparent ${(stats.transparentFraction * 100).toFixed(1)}%, ` +
    `border opaque ${(stats.borderOpaqueFraction * 100).toFixed(1)}%`
  );
}

/** A usable cutout: visible subject, real transparency, mostly clear border. */
function isGoodCutout(stats: Stats | null): boolean {
  return (
    !!stats &&
    stats.opaqueFraction > 0.02 &&
    stats.transparentFraction > 0.05 &&
    stats.borderOpaqueFraction < 0.5
  );
}

async function main() {
  await loadDotenv();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const { processBuffer } = await import("../src/lib/bg-removal");

  console.log("Downloading test source (transparent PNG)...");
  const res = await fetch(TRANSPARENT_SOURCE_URL);
  if (!res.ok) throw new Error(`Could not download test image: ${res.status}`);
  const transparentSource = Buffer.from(await res.arrayBuffer());
  const whiteBgSource = flattenOntoWhite(transparentSource);
  await fs.writeFile(path.join(OUT_DIR, "source-transparent.png"), transparentSource);
  await fs.writeFile(path.join(OUT_DIR, "source-white-bg.png"), whiteBgSource);

  let failures = 0;
  const check = (label: string, ok: boolean, detail: string) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${label} — ${detail}`);
    if (!ok) failures++;
  };

  // Case 1: already-transparent source. Historically this produced a blank
  // image because BiRefNet got the raw transparent PNG.
  console.log("\n[1/3] Already-transparent PNG through the pipeline...");
  try {
    const out = await processBuffer(transparentSource, { engine: "auto" });
    await fs.writeFile(path.join(OUT_DIR, "result-transparent-input.png"), out);
    const stats = statsOf(out);
    check("transparent input keeps its subject", isGoodCutout(stats), describe(stats));
  } catch (err) {
    check("transparent input keeps its subject", false, String(err));
  }

  // Case 2: white-background photo. The classic case — background must
  // actually come off, never be saved baked-in.
  console.log("\n[2/3] White-background image through the pipeline...");
  try {
    const out = await processBuffer(whiteBgSource, { engine: "auto" });
    await fs.writeFile(path.join(OUT_DIR, "result-white-bg-input.png"), out);
    const stats = statsOf(out);
    check("white background gets removed", isGoodCutout(stats), describe(stats));
  } catch (err) {
    check("white background gets removed", false, String(err));
  }

  // Case 3: junk input (an HTML page pretending to be an image) must produce
  // a clear error, not a saved blank item.
  console.log("\n[3/3] Non-image input is rejected cleanly...");
  try {
    await processBuffer(Buffer.from("<!doctype html><html><body>hotlink blocked</body></html>"), {
      engine: "auto",
    });
    check("non-image input rejected", false, "pipeline accepted an HTML page");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    check("non-image input rejected", /not a supported image/i.test(msg), msg);
  }

  console.log(
    failures === 0
      ? "\nAll cutout smoke tests passed. Visual results in scripts/test-output/."
      : `\n${failures} test(s) FAILED. Inspect scripts/test-output/.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
