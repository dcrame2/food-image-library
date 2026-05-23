import { promises as fs } from "fs";
import path from "path";
import { CategoryId } from "./categories";

export interface FoodItem {
  id: string;
  name: string;
  category: CategoryId;
  tags: string[];
  file: string;
  source?: string;
  added: string;
}

export interface Catalog {
  items: FoodItem[];
}

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.json");

export async function readCatalog(): Promise<Catalog> {
  try {
    const raw = await fs.readFile(CATALOG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Catalog;
    if (!parsed.items) return { items: [] };
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { items: [] };
    }
    throw err;
  }
}

export async function writeCatalog(catalog: Catalog): Promise<void> {
  await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true });
  await fs.writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
}

export async function upsertItem(item: FoodItem): Promise<Catalog> {
  const catalog = await readCatalog();
  const idx = catalog.items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    catalog.items[idx] = item;
  } else {
    catalog.items.push(item);
  }
  catalog.items.sort((a, b) => a.name.localeCompare(b.name));
  await writeCatalog(catalog);
  return catalog;
}

export async function hasItem(id: string): Promise<boolean> {
  const catalog = await readCatalog();
  return catalog.items.some((i) => i.id === id);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function foodFilePath(category: CategoryId, slug: string): {
  absolute: string;
  publicPath: string;
} {
  const filename = `${slug}.png`;
  return {
    absolute: path.join(process.cwd(), "public", "foods", category, filename),
    publicPath: `/foods/${category}/${filename}`,
  };
}
