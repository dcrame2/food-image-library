/**
 * remove.bg API client.
 *
 * Setup: get a key from https://www.remove.bg/api → drop into .env.local as
 * REMOVE_BG_API_KEY. Free tier is 50 images/month. Pay-as-you-go after that.
 *
 * Docs: https://www.remove.bg/api
 */

export class RemoveBgNotConfiguredError extends Error {}
export class RemoveBgQuotaExceededError extends Error {}

export interface RemoveBgOptions {
  /** "auto" lets remove.bg pick; "product" is best for branded packaging shots. */
  type?: "auto" | "product" | "person" | "car";
  /**
   * "auto" — full resolution up to ~25MP, costs 1 credit
   * "preview" — up to 0.25MP, FREE (always — doesn't touch your monthly quota)
   *
   * For Instagram reels, "auto" is what you want. Use "preview" for testing.
   */
  size?: "auto" | "preview" | "small" | "regular" | "medium" | "hd" | "4k" | "full";
}

export function isRemoveBgConfigured(): boolean {
  return Boolean(process.env.REMOVE_BG_API_KEY);
}

/**
 * Sends an already-downloaded image buffer to remove.bg and returns the
 * transparent-background PNG.
 */
export async function removeBgFromBuffer(
  input: Buffer,
  options: RemoveBgOptions = {},
): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) throw new RemoveBgNotConfiguredError("REMOVE_BG_API_KEY not set");

  const form = new FormData();
  form.append("image_file", new Blob([new Uint8Array(input)]), "image.png");
  form.append("size", options.size ?? "auto");
  form.append("type", options.type ?? "auto");
  form.append("format", "png");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });

  if (res.status === 402) {
    throw new RemoveBgQuotaExceededError(
      "remove.bg quota exceeded — falling back to @imgly. Top up at remove.bg/dashboard.",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`remove.bg ${res.status}: ${text.slice(0, 200)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}
