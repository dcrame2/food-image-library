/**
 * Bulk-seed: iterates SEED_LIST, queries Google CSE, downloads first PNG,
 * runs @imgly background removal, saves into public/foods/[category]/.
 *
 * Idempotent — skips items already in catalog.json. Re-runnable to retry failures.
 *
 * Env required: GOOGLE_CSE_API_KEY, GOOGLE_CSE_CX (see README.md).
 * Run: npm run seed:bulk
 */
import { promises as fs } from "fs";
import path from "path";
import { SEED_LIST } from "./seed-list";
import { searchImages } from "../src/lib/google-cse";
import { fetchAndRemoveBackground } from "../src/lib/bg-removal";
import { upsertItem, slugify, foodFilePath, hasItem, FoodItem } from "../src/lib/catalog";

async function loadDotenv() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {
    // ignore — env may be set externally
  }
}

async function processOne(entry: (typeof SEED_LIST)[number], index: number) {
  const slug = slugify(entry.name);
  const prefix = `[${index + 1}/${SEED_LIST.length}] ${entry.name}`;

  if (await hasItem(slug)) {
    console.log(`${prefix} — skip (already in catalog)`);
    return { status: "skip" as const };
  }

  let results;
  try {
    results = await searchImages(entry.query, { transparent: true, num: 5 });
  } catch (err) {
    console.error(`${prefix} — search failed: ${(err as Error).message}`);
    return { status: "error" as const, reason: "search" };
  }

  if (results.length === 0) {
    console.warn(`${prefix} — no results`);
    return { status: "error" as const, reason: "no-results" };
  }

  // Try each result in order until one downloads + processes successfully
  for (const r of results) {
    try {
      const png = await fetchAndRemoveBackground(r.link);
      const { absolute, publicPath } = foodFilePath(entry.category, slug);
      await fs.mkdir(path.dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, png);

      const item: FoodItem = {
        id: slug,
        name: entry.name,
        category: entry.category,
        tags: entry.tags,
        file: publicPath,
        source: r.link,
        added: new Date().toISOString().slice(0, 10),
      };
      await upsertItem(item);
      console.log(`${prefix} ✓`);
      return { status: "ok" as const };
    } catch (err) {
      console.warn(`${prefix} — retry (${(err as Error).message.slice(0, 80)})`);
      continue;
    }
  }

  console.error(`${prefix} — all results failed`);
  return { status: "error" as const, reason: "process" };
}

async function main() {
  await loadDotenv();
  if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_CX) {
    console.error(
      "ERROR: GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX must be set in .env.local. See README.md.",
    );
    process.exit(1);
  }

  console.log(`Seeding ${SEED_LIST.length} items…\n`);
  const stats = { ok: 0, skip: 0, error: 0 };

  for (let i = 0; i < SEED_LIST.length; i++) {
    const result = await processOne(SEED_LIST[i], i);
    stats[result.status]++;
    // Small delay between iterations to be polite to CSE rate limits
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone. ${stats.ok} added, ${stats.skip} skipped, ${stats.error} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
