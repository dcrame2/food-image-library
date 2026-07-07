import { PNG } from "pngjs";
import {
  removeBgFromBuffer,
  isRemoveBgConfigured,
  RemoveBgQuotaExceededError,
} from "./remove-bg";

export type BgEngine = "auto" | "remove-bg" | "imgly" | "skip";

export interface BgRemovalOptions {
  /**
   * Which engine to use:
   *  - "auto" (default): remove.bg if API key is set, otherwise @imgly
   *  - "remove-bg": force remove.bg (errors if no key)
   *  - "imgly": force local @imgly (free, lower quality)
   *  - "skip": don't run bg-removal at all (source is already transparent)
   */
  engine?: BgEngine;
  /**
   * If true (default), auto-detects whether the source PNG is already transparent
   * (alpha < 250 in any corner). If so, skips bg-removal — running an already-
   * transparent image through any model often degrades quality.
   */
  autoDetect?: boolean;
  /**
   * If true (default), runs a post-process alpha-boost pass that pushes near-0
   * alpha to 0 and near-255 alpha to 255. Fixes soft-edge artifacts. Only
   * applied when @imgly was used — remove.bg output is already clean.
   */
  alphaBoost?: boolean;
}

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
  const arrayBuf = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuf);
  return processBuffer(inputBuffer, options);
}

export async function processBuffer(
  input: Buffer,
  options: BgRemovalOptions = {},
): Promise<Buffer> {
  const { engine = "auto", autoDetect = true, alphaBoost = true } = options;

  if (engine === "skip") return input;

  if (autoDetect && isAlreadyTransparent(input)) {
    return alphaBoost ? boostAlpha(input) : input;
  }

  const resolvedEngine = engine === "auto" ? (isRemoveBgConfigured() ? "remove-bg" : "imgly") : engine;

  if (resolvedEngine === "remove-bg") {
    try {
      // remove.bg output is professionally clean — no need to alpha-boost.
      return await removeBgFromBuffer(input, { type: "auto", size: "auto" });
    } catch (err) {
      if (err instanceof RemoveBgQuotaExceededError && engine === "auto") {
        console.warn("remove.bg quota exceeded, falling back to @imgly");
        // fall through to @imgly
      } else {
        throw err;
      }
    }
  }

  // @imgly path
  const after = await imglyRemove(input);
  return alphaBoost ? boostAlpha(after) : after;
}

async function imglyRemove(input: Buffer): Promise<Buffer> {
  // Loaded lazily so the native onnxruntime binary is only required when imgly
  // is actually the selected engine. On serverless (Vercel) imgly is disabled
  // via BG_ENGINE_IMGLY_ENABLED=false, so this import never runs there.
  const { removeBackground } = await import("@imgly/background-removal-node");
  const blob = new Blob([new Uint8Array(input)], { type: "image/png" });
  const outBlob = (await removeBackground(blob, {
    model: "medium",
    output: { format: "image/png", quality: 1.0 },
  })) as Blob;
  return Buffer.from(await outBlob.arrayBuffer());
}

function isAlreadyTransparent(buffer: Buffer): boolean {
  let decoded;
  try {
    decoded = PNG.sync.read(buffer);
  } catch {
    return false;
  }
  const { width, height, data } = decoded;
  const px = (x: number, y: number) => data[(y * width + x) * 4 + 3];
  const corners = [px(0, 0), px(width - 1, 0), px(0, height - 1), px(width - 1, height - 1)];
  return corners.some((a) => a < 250);
}

function boostAlpha(buffer: Buffer): Buffer {
  let png;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    return buffer;
  }
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
