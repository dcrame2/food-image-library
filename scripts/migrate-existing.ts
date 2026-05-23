/**
 * One-time migration: imports transparent PNGs from ~/Downloads/Food images/
 * into public/foods/[category]/ and populates data/catalog.json.
 *
 * Uses keyword matching on the source filename to pick a category + tags.
 * Skips files already present in the catalog (idempotent on slug).
 *
 * Run: npm run migrate
 */
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { upsertItem, slugify, foodFilePath, readCatalog, FoodItem } from "../src/lib/catalog";
import { CategoryId } from "../src/lib/categories";

const SOURCE = path.join(os.homedir(), "Downloads", "Food images");

interface Mapping {
  match: RegExp;
  name: string;
  category: CategoryId;
  tags: string[];
}

// Order matters: more-specific patterns first.
const MAPPINGS: Mapping[] = [
  // Branded snacks (from Snacks/ subfolder)
  { match: /legendary[_ -]donuts?/i, name: "Legendary Protein Donuts", category: "branded", tags: ["protein-bar", "healthy", "high-protein", "snack"] },
  { match: /catalina[_ -]crunch/i, name: "Catalina Crunch", category: "branded", tags: ["healthy", "snack", "breakfast"] },
  { match: /kloud[_ -]popcorn/i, name: "Kloud Popcorn", category: "branded", tags: ["snack", "healthy"] },
  { match: /cinammon[_ -]toast[_ -]crunch/i, name: "Cinnamon Toast Crunch", category: "branded", tags: ["junk", "breakfast", "snack"] },
  { match: /doritos/i, name: "Doritos", category: "branded", tags: ["junk", "snack"] },
  { match: /oreos/i, name: "Oreos", category: "branded", tags: ["junk", "snack", "dessert"] },
  { match: /sour[_ -]patch/i, name: "Sour Patch Kids", category: "branded", tags: ["junk", "snack"] },
  { match: /ben[_ -]and[_ -]jerr/i, name: "Ben & Jerry's", category: "branded", tags: ["junk", "dessert"] },
  { match: /sugar[_ -]free[_ -]candy/i, name: "Sugar Free Candy", category: "snacks", tags: ["snack"] },
  { match: /fronzen[_ -]?one|frozen[_ -]?one/i, name: "Frozen Treat", category: "desserts", tags: ["dessert"] },

  // Proteins
  { match: /\b(steak)\b/i, name: "Steak", category: "proteins", tags: ["healthy", "high-protein"] },
  { match: /\b(chicken)\b/i, name: "Chicken", category: "proteins", tags: ["healthy", "high-protein"] },
  { match: /\b(salmon)\b/i, name: "Salmon", category: "proteins", tags: ["healthy", "high-protein"] },
  { match: /pork[_ -]bacon/i, name: "Pork Bacon", category: "proteins", tags: ["breakfast"] },
  { match: /turkey[_ -]bacon/i, name: "Turkey Bacon", category: "proteins", tags: ["healthy", "high-protein", "breakfast"] },

  // Eggs
  { match: /hard[_ -]boiled[_ -]egg/i, name: "Hard Boiled Egg", category: "proteins", tags: ["healthy", "high-protein", "breakfast"] },
  { match: /cooked[_ -]egg/i, name: "Cooked Egg", category: "proteins", tags: ["healthy", "high-protein", "breakfast"] },

  // Carbs
  { match: /white[_ -]rice/i, name: "White Rice", category: "carbs", tags: [] },
  { match: /alfredo[_ -]pasta/i, name: "Alfredo Pasta", category: "meals", tags: [] },
  { match: /cinnamon[_ -]toast[_ -]bread/i, name: "Cinnamon Toast Bread", category: "breakfast", tags: ["breakfast"] },
  { match: /pb[_ -]pretzels/i, name: "PB Pretzels", category: "snacks", tags: ["snack"] },
  { match: /rice[_ -]cake/i, name: "Rice Cake", category: "snacks", tags: ["healthy", "low-cal", "snack"] },
  { match: /cauliflower[_ -]rice/i, name: "Cauliflower Rice", category: "veggies", tags: ["healthy", "low-cal", "keto"] },

  // Fruits/Veggies
  { match: /avacado|avocado/i, name: "Avocado", category: "fruits", tags: ["healthy"] },
  { match: /banana/i, name: "Banana", category: "fruits", tags: ["healthy", "pre-workout"] },
  { match: /broccoli/i, name: "Broccoli", category: "veggies", tags: ["healthy", "low-cal"] },
  { match: /berries/i, name: "Berries", category: "fruits", tags: ["healthy"] },
  { match: /all[_ -]fruits/i, name: "Mixed Fruits", category: "fruits", tags: ["healthy"] },
  { match: /watermelon/i, name: "Watermelon", category: "fruits", tags: ["healthy", "low-cal"] },
  { match: /pineapple/i, name: "Pineapple", category: "fruits", tags: ["healthy"] },

  // Dairy
  { match: /greek[_ -]yogurt/i, name: "Greek Yogurt", category: "dairy", tags: ["healthy", "high-protein", "breakfast"] },
  { match: /light[_ -]yogurt/i, name: "Light Yogurt", category: "dairy", tags: ["healthy", "low-cal"] },
  { match: /frozen[_ -](yogurt|togurt)/i, name: "Frozen Yogurt", category: "desserts", tags: ["dessert"] },

  // Drinks
  { match: /black[_ -]coffee/i, name: "Black Coffee", category: "drinks", tags: ["coffee", "pre-workout", "low-cal"] },
  { match: /latte/i, name: "Latte", category: "drinks", tags: ["coffee"] },
  { match: /almond[_ -]milk/i, name: "Almond Milk", category: "drinks", tags: ["healthy", "low-cal"] },

  // Meals
  { match: /\b(burger)\b/i, name: "Burger", category: "meals", tags: ["fast-food"] },
  { match: /\b(pizza)\b/i, name: "Pizza", category: "meals", tags: ["junk"] },

  // Sweet
  { match: /protein[_ -]donut/i, name: "Protein Donut", category: "branded", tags: ["protein-bar", "snack", "healthy"] },
];

interface Skip {
  match: RegExp;
}
const SKIP: Skip[] = [
  // Social-media UI assets — not food
  { match: /ig[_ -](follow|like|share)[_ -]button/i },
];

function pickMapping(filename: string): Mapping | null {
  if (SKIP.some((s) => s.match.test(filename))) return null;
  for (const m of MAPPINGS) {
    if (m.match.test(filename)) return m;
  }
  return null;
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.isFile() && /\.png$/i.test(e.name)) out.push(full);
  }
  return out;
}

async function main() {
  console.log(`Scanning ${SOURCE}…`);
  let files: string[];
  try {
    files = await walk(SOURCE);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`Source folder not found: ${SOURCE}`);
      process.exit(1);
    }
    throw err;
  }
  console.log(`Found ${files.length} PNG files`);

  const existing = (await readCatalog()).items;
  const existingIds = new Set(existing.map((i) => i.id));

  let imported = 0;
  let skipped = 0;
  let unmapped: string[] = [];

  for (const file of files) {
    const base = path.basename(file);
    const mapping = pickMapping(base);
    if (!mapping) {
      if (!SKIP.some((s) => s.match.test(base))) unmapped.push(base);
      skipped++;
      continue;
    }

    const slug = slugify(mapping.name);
    if (existingIds.has(slug)) {
      skipped++;
      continue;
    }

    const { absolute, publicPath } = foodFilePath(mapping.category, slug);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.copyFile(file, absolute);

    const item: FoodItem = {
      id: slug,
      name: mapping.name,
      category: mapping.category,
      tags: mapping.tags,
      file: publicPath,
      source: `file://${file}`,
      added: new Date().toISOString().slice(0, 10),
    };
    await upsertItem(item);
    existingIds.add(slug);
    imported++;
    console.log(`  + ${mapping.name} (${mapping.category})`);
  }

  console.log(`\nImported ${imported} new items, skipped ${skipped}.`);
  if (unmapped.length > 0) {
    console.log(`\nUnmapped files (add patterns to MAPPINGS in scripts/migrate-existing.ts):`);
    for (const u of unmapped) console.log(`  ? ${u}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
