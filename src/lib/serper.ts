/**
 * Serper.dev image search client.
 *
 * Setup: sign up at https://serper.dev → grab API key → put in .env.local as
 * SERPER_API_KEY. Free tier is 2,500 queries/month. No card required.
 *
 * Docs: https://serper.dev/playground
 */

export interface ImageSearchResult {
  title: string;
  /** Full-size image URL — what we download + run through bg-removal */
  link: string;
  /** Thumbnail URL for the picker UI */
  thumbnail: string;
  /** Source page URL (the page hosting the image) */
  contextLink: string;
  width: number;
  height: number;
}

interface SerperImage {
  title?: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  thumbnailUrl?: string;
  source?: string;
  domain?: string;
  link?: string;
}

interface SerperResponse {
  images?: SerperImage[];
  error?: string;
}

export interface ImageSearchOptions {
  /** How many results to return (max 10). */
  num?: number;
  /** Bias toward transparent PNGs by appending hint terms. */
  transparent?: boolean;
}

export class ImageSearchConfigError extends Error {}

export function isImageSearchConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY);
}

export async function searchImages(
  query: string,
  options: ImageSearchOptions = {},
): Promise<ImageSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new ImageSearchConfigError(
      "SERPER_API_KEY must be set in .env.local. Sign up at https://serper.dev.",
    );
  }

  // Append hints to bias toward transparent PNGs since Serper doesn't
  // expose a `transparent` filter the way Google CSE did.
  const q =
    options.transparent !== false && !/transparent|png/i.test(query)
      ? `${query} transparent png`
      : query;

  const res = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q, num: Math.min(options.num ?? 8, 10) }),
  });
  const data = (await res.json()) as SerperResponse;

  if (!res.ok || data.error) {
    throw new Error(`Serper error (${res.status}): ${data.error ?? "unknown"}`);
  }

  return (data.images ?? []).map((img) => ({
    title: img.title ?? img.source ?? "Untitled",
    link: img.imageUrl,
    thumbnail: img.thumbnailUrl ?? img.imageUrl,
    contextLink: img.link ?? "",
    width: img.imageWidth ?? 0,
    height: img.imageHeight ?? 0,
  }));
}
