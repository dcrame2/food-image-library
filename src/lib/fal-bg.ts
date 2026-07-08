import "server-only";

/**
 * Background removal via fal.ai's BiRefNet v2 model.
 *
 * Economics: roughly half a cent per image versus remove.bg's ~$0.20, which
 * is what makes the 300/month Pro quota viable at $9. Quality on products and
 * food is comparable; remove.bg keeps a small edge on hair/fur, so it stays
 * available as a fallback engine.
 */

const FAL_ENDPOINT = "https://fal.run/fal-ai/birefnet/v2";

export function isFalConfigured(): boolean {
  return Boolean(process.env.FAL_KEY);
}

export async function removeBgViaFal(input: Buffer): Promise<Buffer> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not set");

  const dataUri = `data:image/png;base64,${input.toString("base64")}`;

  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: dataUri,
      model: "General Use (Light)",
      refine_foreground: true,
      output_format: "png",
      // Inline result as a data URI: one round trip, nothing persisted.
      sync_mode: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`fal.ai background removal failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as { image?: { url?: string } };
  const url = json.image?.url;
  if (!url) throw new Error("fal.ai returned no image");

  if (url.startsWith("data:")) {
    const base64 = url.slice(url.indexOf(",") + 1);
    return Buffer.from(base64, "base64");
  }

  const imageRes = await fetch(url);
  if (!imageRes.ok) {
    throw new Error(`Failed to download fal.ai result: ${imageRes.status}`);
  }
  return Buffer.from(await imageRes.arrayBuffer());
}
