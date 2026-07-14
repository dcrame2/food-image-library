import { PNG } from "pngjs";
import { removeBgFromBuffer, isRemoveBgConfigured } from "./remove-bg";
import { removeBgViaFal, isFalConfigured } from "./fal-bg";

export type BgEngine = "auto" | "remove-bg" | "imgly" | "skip";

export interface BgRemovalOptions {
  /**
   * Which engine to use:
   *  - "auto" (default): fal.ai BiRefNet, then remove.bg, then local @imgly.
   *    Each result is validated; a blank or still-opaque output falls through
   *    to the next engine instead of being saved.
   *  - "remove-bg": force remove.bg (errors if no key)
   *  - "imgly": force local @imgly (free, lower quality)
   *  - "skip": don't run bg-removal at all (source is already transparent)
   */
  engine?: BgEngine;
  /**
   * If true (default), runs a post-process alpha-boost pass that pushes near-0
   * alpha to 0 and near-255 alpha to 255. Fixes soft-edge artifacts. Only
   * applied when @imgly was used — fal/remove.bg output is already clean.
   */
  alphaBoost?: boolean;
}

/** fal takes the image inline as base64 JSON; oversized payloads get rejected,
 * so large files route straight to remove.bg's multipart upload instead. */
const FAL_MAX_INPUT_BYTES = 8 * 1024 * 1024;

export async function fetchAndRemoveBackground(
  url: string,
  options: BgRemovalOptions = {},
): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const inputBuffer = Buffer.from(await response.arrayBuffer());

  // Hotlink-protected hosts return an HTML page or tiny placeholder with a
  // 200 — catch that here with a message the user can act on.
  if (!sniffImageMime(inputBuffer)) {
    throw new Error(
      "That URL did not return a usable image (the site may block direct downloads). Save the image and upload it instead.",
    );
  }
  return processBuffer(inputBuffer, options);
}

export async function processBuffer(
  input: Buffer,
  options: BgRemovalOptions = {},
): Promise<Buffer> {
  const { engine = "auto", alphaBoost = true } = options;

  if (engine === "skip") return input;

  const mime = sniffImageMime(input);
  if (!mime) {
    throw new Error("That file is not a supported image. Use a PNG, JPG, or WebP.");
  }

  // Segmentation models expect an opaque photo. An already-transparent PNG
  // (common: image search is biased toward "transparent png" results) makes
  // BiRefNet return an empty or mangled mask — the "blank cutout" failure.
  // Flatten real transparency onto white first so every engine sees a normal
  // photo; keep the original around as a last-resort result since it was
  // already a usable cutout.
  let workInput = input;
  let workMime = mime;
  let inputWasCleanCutout = false;
  if (mime === "image/png") {
    const decoded = decodePng(input);
    if (decoded) {
      const stats = alphaStats(decoded);
      if (stats.transparentFraction > 0.01) {
        inputWasCleanCutout = isCleanCutout(stats);
        workInput = flattenOntoWhite(decoded);
        workMime = "image/png";
      }
    }
  }

  const ladder = engineLadder(engine, workInput.byteLength);
  const failures: string[] = [];

  for (const step of ladder) {
    let out: Buffer;
    try {
      out =
        step === "fal"
          ? await removeBgViaFal(workInput, workMime)
          : step === "remove-bg"
            ? await removeBgFromBuffer(workInput, { type: "auto", size: "auto" })
            : await imglyRemove(workInput);
    } catch (err) {
      // With no engine left to fall back to, surface the real error
      // (e.g. the remove.bg quota message) instead of the generic one.
      if (ladder.length === 1) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${step}: ${msg}`);
      console.warn(`bg-removal engine ${step} failed:`, msg);
      continue;
    }

    const problem = cutoutProblem(out);
    if (!problem) {
      return step === "imgly" && alphaBoost ? boostAlpha(out) : out;
    }
    failures.push(`${step}: ${problem}`);
    console.warn(`bg-removal engine ${step} returned a bad result: ${problem}`);
  }

  if (inputWasCleanCutout) {
    console.warn(
      "bg-removal: all engines failed but the source was already a clean cutout — keeping it as-is.",
      failures,
    );
    return input;
  }

  console.error("bg-removal: all engines failed", failures);
  throw new Error(
    "We couldn't get a clean cutout from this image. Try a different photo where the subject is clearly visible.",
  );
}

type EngineStep = "fal" | "remove-bg" | "imgly";

function imglyEnabled(): boolean {
  return process.env.BG_ENGINE_IMGLY_ENABLED !== "false";
}

function engineLadder(engine: BgEngine, inputBytes: number): EngineStep[] {
  if (engine === "remove-bg") return ["remove-bg"];
  if (engine === "imgly") return ["imgly"];

  const ladder: EngineStep[] = [];
  if (isFalConfigured() && inputBytes <= FAL_MAX_INPUT_BYTES) ladder.push("fal");
  if (isRemoveBgConfigured()) ladder.push("remove-bg");
  if (imglyEnabled()) ladder.push("imgly");
  if (ladder.length === 0) {
    throw new Error("Background removal is not configured on this server.");
  }
  return ladder;
}

async function imglyRemove(input: Buffer): Promise<Buffer> {
  // On serverless (Vercel) imgly is disabled via BG_ENGINE_IMGLY_ENABLED=false;
  // fail with a clear message instead of a native-module import crash.
  if (!imglyEnabled()) {
    throw new Error(
      "Background removal is temporarily unavailable. Please try again later.",
    );
  }
  // Loaded lazily so the native onnxruntime binary is only required when imgly
  // is actually the selected engine.
  const { removeBackground } = await import("@imgly/background-removal-node");
  const blob = new Blob([new Uint8Array(input)], { type: "image/png" });
  const outBlob = (await removeBackground(blob, {
    model: "medium",
    output: { format: "image/png", quality: 1.0 },
  })) as Blob;
  return Buffer.from(await outBlob.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Input/output inspection
// ---------------------------------------------------------------------------

export function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand.startsWith("avi")) return "image/avif";
    if (brand.startsWith("hei") || brand.startsWith("mif")) return "image/heic";
  }
  if (buf[0] === 0x42 && buf[1] === 0x4d) return "image/bmp";
  return null;
}

interface AlphaStats {
  /** Fraction of all pixels with alpha > 32 (a visible subject exists). */
  opaqueFraction: number;
  /** Fraction of all pixels with alpha < 8 (real transparency exists). */
  transparentFraction: number;
  /** Fraction of the border ring with alpha >= 128 (background still baked in). */
  borderOpaqueFraction: number;
}

function decodePng(buffer: Buffer): PNG | null {
  try {
    const png = PNG.sync.read(buffer);
    return png.width >= 2 && png.height >= 2 ? png : null;
  } catch {
    return null;
  }
}

function alphaStats(png: PNG): AlphaStats {
  const { width, height, data } = png;
  let opaque = 0;
  let transparent = 0;
  const totalSampled = Math.ceil((width * height) / 4);
  // Sample every 4th pixel — plenty for fractions, 4x cheaper on big images.
  for (let i = 3, seen = 0; seen < totalSampled; i += 16, seen++) {
    const a = data[i];
    if (a > 32) opaque++;
    else if (a < 8) transparent++;
  }

  const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];
  let borderOpaque = 0;
  let borderTotal = 0;
  const stepX = Math.max(1, Math.floor(width / 64));
  const stepY = Math.max(1, Math.floor(height / 64));
  for (let x = 0; x < width; x += stepX) {
    borderTotal += 2;
    if (alphaAt(x, 0) >= 128) borderOpaque++;
    if (alphaAt(x, height - 1) >= 128) borderOpaque++;
  }
  for (let y = 0; y < height; y += stepY) {
    borderTotal += 2;
    if (alphaAt(0, y) >= 128) borderOpaque++;
    if (alphaAt(width - 1, y) >= 128) borderOpaque++;
  }

  return {
    opaqueFraction: opaque / totalSampled,
    transparentFraction: transparent / totalSampled,
    borderOpaqueFraction: borderOpaque / borderTotal,
  };
}

/**
 * The two ways engines fail in practice, checked on every output before it is
 * accepted: a blank image (mask matched nothing) and an untouched image
 * (background never removed — the "white background" failure). Returns a
 * human-readable problem, or null when the cutout is usable.
 */
function cutoutProblem(output: Buffer): string | null {
  const png = decodePng(output);
  if (!png) return "output is not a decodable PNG";
  const stats = alphaStats(png);
  if (stats.opaqueFraction < 0.002) return "cutout came back empty";
  if (stats.transparentFraction < 0.01 && stats.borderOpaqueFraction > 0.9) {
    return "background was not removed";
  }
  return null;
}

/** True when the image already looks like a finished cutout: transparent
 * border ring plus a substantial amount of fully transparent background. */
function isCleanCutout(stats: AlphaStats): boolean {
  return (
    stats.borderOpaqueFraction <= 0.2 &&
    stats.transparentFraction >= 0.15 &&
    stats.opaqueFraction >= 0.01
  );
}

function flattenOntoWhite(png: PNG): Buffer {
  const flat = new PNG({ width: png.width, height: png.height });
  const src = png.data;
  const dst = flat.data;
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3] / 255;
    dst[i] = Math.round(src[i] * a + 255 * (1 - a));
    dst[i + 1] = Math.round(src[i + 1] * a + 255 * (1 - a));
    dst[i + 2] = Math.round(src[i + 2] * a + 255 * (1 - a));
    dst[i + 3] = 255;
  }
  return PNG.sync.write(flat);
}

function boostAlpha(buffer: Buffer): Buffer {
  const png = decodePng(buffer);
  if (!png) return buffer;
  const { data } = png;
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a < 32) data[i] = 0;
    else if (a > 224) data[i] = 255;
    else {
      const t = (a - 32) / (224 - 32);
      const boosted = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      data[i] = Math.round(boosted * 255);
    }
  }
  return PNG.sync.write(png);
}
