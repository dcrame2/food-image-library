import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Canonical prod domain fallback: a localhost fallback here would leak
  // localhost URLs into the live sitemap if the env var is ever unset.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.cutoutaura.com";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
