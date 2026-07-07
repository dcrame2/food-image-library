/**
 * One-time (idempotent) migration of the local catalog into Supabase as the
 * public starter library.
 *
 * By default uploads only the curated STARTER_PICKS below. Pass --all to
 * migrate the entire local catalog.
 *
 * For each item in data/catalog.json:
 *   1. Read public/foods/<category>/<slug>.png
 *   2. Upload to the `cutouts` bucket at starter/<category>/<slug>.png (upsert)
 *   3. Upsert a row into public_items (conflict on slug,category)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 * Run: npm run migrate:supabase          (curated starter pack)
 *      npm run migrate:supabase -- --all (full catalog)
 */
import { promises as fs } from "fs";
import path from "path";
import { PNG } from "pngjs";
import ws from "ws";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

// Curated, visually strong, category-diverse starter pack.
const STARTER_PICKS = new Set([
  "hoka-clifton-10s",
  "fairlife-protein-shake",
  "dairy-queen-blizzard",
  "greek-yogurt-with-fruit",
  "glazed-donut",
  "red-bull",
  "latte",
  "avocado",
  "mcdonald-s-french-fries",
  "cheetos",
  "maurten-gels",
  "gu-gel",
  "nike-hoodie",
  "nerds-clusers",
  "clif-bloks",
  "running-waffles",
  "pickle-juice-shots",
  "coca-cola",
  "monster-energy",
  "water-bottle",
  "green-smoothie",
  "chocolate-chip-cookie",
  "cinnamon-roll",
  "chick-fil-a-nuggets",
  "taco-bell-doritos-locos-taco",
  "chipotle-burrito-bowl",
  "strawberries",
  "banana",
  "watermelon",
  "reese-s-peanut-butter-cups",
]);

async function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const raw = await fs.readFile(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  file: string;
  source?: string;
  added: string;
}

function pngDimensions(buf: Buffer): { width: number; height: number } | null {
  try {
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height };
  } catch {
    return null;
  }
}

async function main() {
  await loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node 20 has no native WebSocket; the client insists on a transport even
    // though this script never uses realtime.
    realtime: { transport: ws as unknown as new (...args: unknown[]) => WebSocket },
  });

  const catalogRaw = await fs.readFile(
    path.join(process.cwd(), "data", "catalog.json"),
    "utf-8",
  );
  const all: CatalogItem[] = JSON.parse(catalogRaw).items ?? [];
  const useAll = process.argv.includes("--all");
  const items = useAll ? all : all.filter((i) => STARTER_PICKS.has(i.id));

  if (!useAll) {
    const missing = [...STARTER_PICKS].filter((id) => !all.some((i) => i.id === id));
    if (missing.length > 0) {
      console.warn(`Warning: picks not found in catalog: ${missing.join(", ")}`);
    }
  }
  console.log(
    `Migrating ${items.length} item(s) to the starter library${useAll ? " (full catalog)" : " (curated pack; use --all for everything)"}...`,
  );

  let uploaded = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const item of items) {
    const localPath = path.join(process.cwd(), "public", item.file);
    const storagePath = `starter/${item.category}/${item.id}.png`;
    try {
      const buf = await fs.readFile(localPath);
      const dims = pngDimensions(buf);

      const { error: uploadError } = await supabase.storage
        .from("cutouts")
        .upload(storagePath, buf, { contentType: "image/png", upsert: true });
      if (uploadError) throw new Error(`upload: ${uploadError.message}`);

      const { error: rowError } = await supabase.from("public_items").upsert(
        {
          name: item.name,
          slug: item.id,
          category: item.category,
          tags: item.tags,
          storage_path: storagePath,
          source_url:
            item.source && !item.source.startsWith("file://") ? item.source : null,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          bytes: buf.byteLength,
          added_at: new Date(item.added).toISOString(),
        },
        { onConflict: "slug,category" },
      );
      if (rowError) throw new Error(`row: ${rowError.message}`);

      uploaded++;
      process.stdout.write(`\r${uploaded + failed}/${items.length}`);
    } catch (err) {
      failed++;
      failures.push(`${item.id}: ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. ${uploaded} migrated, ${failed} failed.`);
  if (failures.length > 0) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
