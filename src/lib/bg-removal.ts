import { removeBackground } from "@imgly/background-removal-node";

let warmed = false;

export interface BgRemovalOptions {
  // If false, skips bg-removal and just returns the input PNG as-is.
  // Useful when we trust the source is already transparent.
  skip?: boolean;
}

/**
 * Downloads the image at `url` and returns a transparent-background PNG buffer.
 * The @imgly library uses an ONNX U2Net-style model that runs locally.
 * First call downloads ~80MB of model weights and is slow (~30s).
 * Subsequent calls are fast (~2-5s per image).
 */
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

  if (options.skip) return inputBuffer;
  return removeBackgroundFromBuffer(inputBuffer);
}

export async function removeBackgroundFromBuffer(input: Buffer): Promise<Buffer> {
  // @imgly expects a Blob in Node. Cast through as it accepts Blob-like objects.
  const blob = new Blob([new Uint8Array(input)], { type: "image/png" });
  const outBlob = (await removeBackground(blob, {
    output: { format: "image/png", quality: 0.9 },
  })) as Blob;
  const outBuf = Buffer.from(await outBlob.arrayBuffer());
  warmed = true;
  return outBuf;
}

export function isWarmed(): boolean {
  return warmed;
}
