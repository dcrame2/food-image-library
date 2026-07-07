import { CATEGORIES } from "@/lib/categories";

/** Category value for items saved without a collection. */
export const UNSORTED = "unsorted";

/**
 * Display label for a collection/category slug. Starter items use the legacy
 * taxonomy labels; user collections are free-text slugs, prettified.
 */
export function collectionLabel(slug: string): string {
  const known = CATEGORIES.find((c) => c.id === slug);
  if (known) return known.label;
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
