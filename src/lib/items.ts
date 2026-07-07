import type { Item, PublicItem } from "@/lib/database.types";

/** Unified view over a user's own `items` and the shared `public_items`. */
export interface LibraryItem {
  id: string;
  name: string;
  slug: string;
  /** Free-text collection slug for owned items; legacy taxonomy id for starter items. */
  category: string;
  tags: string[];
  storagePath: string;
  publicUrl: string;
  addedAt: string;
  /** true = the signed-in user's own item; false = starter library item. */
  owned: boolean;
}

export function publicUrlFor(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cutouts/${storagePath}`;
}

/**
 * Direct-download URL. Supabase serves Content-Disposition: attachment for the
 * `?download=` param; a plain anchor `download` attribute is ignored
 * cross-origin, so this is the only reliable desktop download path.
 */
export function downloadUrlFor(storagePath: string, filename: string): string {
  return `${publicUrlFor(storagePath)}?download=${encodeURIComponent(filename)}`;
}

export function fromOwnedRow(row: Item): LibraryItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    tags: row.tags,
    storagePath: row.storage_path,
    publicUrl: publicUrlFor(row.storage_path),
    addedAt: row.added_at,
    owned: true,
  };
}

export function fromPublicRow(row: PublicItem): LibraryItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    tags: row.tags,
    storagePath: row.storage_path,
    publicUrl: publicUrlFor(row.storage_path),
    addedAt: row.added_at,
    owned: false,
  };
}
