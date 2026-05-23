# Food Image Library

Personal library of transparent-background food images for Instagram reels. Browse a grid, filter by category/tag, click to download, or bulk-zip selections. Add new items by pasting a URL or searching Google Images — background removal happens locally and automatically.

## Quick start

```bash
npm install
npm run migrate          # import existing PNGs from ~/Downloads/Food images/
npm run dev              # http://localhost:3000
```

## Adding new food images

Two ways:

1. **Paste URL** (works immediately, no setup): in the app, click `+ Add Food`, switch to the "Paste URL" tab, paste an image address (right-click any image in your browser → "Copy image address"), fill in name + category, save. The image is fetched server-side, background is auto-removed, and it lands in the library.
2. **Google Search** (needs API key setup, see below): type a query like "oikos triple zero vanilla", pick the best result from 8 thumbnails, save.

## remove.bg setup (recommended — best background-removal quality)

The free local `@imgly` model struggles with branded product photography (gradient backgrounds, light halos). [remove.bg](https://www.remove.bg/api) is built exactly for this case.

1. Sign up at https://www.remove.bg/api and grab an API key
2. Add to `.env.local`:

```
REMOVE_BG_API_KEY=your_key_here
```

Free tier: 50 images/month — plenty for ad-hoc adds. After that it's pay-as-you-go (~$0.20/credit at the smallest pack).

When the key is set, the app uses remove.bg by default. Without it, the app falls back to `@imgly` automatically. The dialog lets you override per-image if you want to save a credit on something that's already transparent.

**Bulk seed** (~150 items) defaults to `@imgly` to avoid burning your remove.bg quota. To use remove.bg for the bulk seed anyway, run `SEED_USE_REMOVE_BG=1 npm run seed:bulk`.

## Image search setup (Serper.dev — required for search + bulk seed)

Google closed their Custom Search JSON API to new projects in 2026, so we use Serper.dev which returns actual Google image results.

1. Sign up at https://serper.dev (just an email, no credit card)
2. Copy your API key from the dashboard
3. Add to `.env.local`:

```bash
cp .env.local.example .env.local
# edit .env.local
SERPER_API_KEY=...
```

Free tier: 2,500 queries/month.

## Bulk seed (one-time, builds the starter library)

After CSE is configured:

```bash
npm run seed:bulk
```

Reads `scripts/seed-list.ts` (~150 curated items: branded protein bars, drinks, yogurts, fast food, whole foods, junk for contrast, meal plates), queries CSE, downloads the first transparent PNG result, removes the background, saves into the library. Edit `seed-list.ts` to customize the list before running. Re-running is safe — it skips items already added.

## How it works

- **Catalog**: `data/catalog.json` is the source of truth — one entry per image with `{id, name, category, tags, file, source, added}`
- **Images**: served from `public/foods/[category]/[slug].png`
- **Background removal**: `@imgly/background-removal-node` (ONNX model, runs locally, ~2-5s per image, free, no API limits)
- **Search**: Google Custom Search API filtered to `fileType=png&imgColorType=trans`

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide icons, JSZip.
