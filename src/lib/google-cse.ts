export interface CSEImageResult {
  title: string;
  link: string;
  thumbnail: string;
  contextLink: string;
  width: number;
  height: number;
}

interface CSERawItem {
  title: string;
  link: string;
  image?: {
    thumbnailLink: string;
    contextLink: string;
    width: number;
    height: number;
  };
}

interface CSERawResponse {
  items?: CSERawItem[];
  error?: { message: string; code: number };
}

export interface CSESearchOptions {
  /** Bias toward transparent PNGs. Default true. */
  transparent?: boolean;
  /** How many results to return (max 10 per request). */
  num?: number;
}

export class CSEConfigError extends Error {}

export async function searchImages(
  query: string,
  options: CSESearchOptions = {},
): Promise<CSEImageResult[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx) {
    throw new CSEConfigError(
      "GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX must be set in .env.local. See README.md.",
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: query,
    searchType: "image",
    fileType: "png",
    num: String(Math.min(options.num ?? 6, 10)),
    safe: "active",
  });
  if (options.transparent !== false) {
    params.set("imgColorType", "trans");
  }

  const url = `https://customsearch.googleapis.com/customsearch/v1?${params.toString()}`;
  const res = await fetch(url);
  const data = (await res.json()) as CSERawResponse;

  if (data.error) {
    throw new Error(`Google CSE error: ${data.error.message}`);
  }

  return (data.items ?? [])
    .filter((item): item is CSERawItem & { image: NonNullable<CSERawItem["image"]> } =>
      Boolean(item.image),
    )
    .map((item) => ({
      title: item.title,
      link: item.link,
      thumbnail: item.image.thumbnailLink,
      contextLink: item.image.contextLink,
      width: item.image.width,
      height: item.image.height,
    }));
}
