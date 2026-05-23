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

## Google CSE setup (one-time, ~5 min — required for search + bulk seed)

1. Go to https://programmablesearchengine.google.com → **Create a search engine**
   - Sites to search: choose **Search the entire web**
   - Toggle **Image search** ON
2. Copy the **Search engine ID** (this is your `CX`) from the control panel
3. Go to https://console.cloud.google.com/apis/library/customsearch.googleapis.com → enable Custom Search API
4. Go to https://console.cloud.google.com/apis/credentials → create an **API key**
5. Copy `.env.local.example` to `.env.local` and paste in both values:

```bash
cp .env.local.example .env.local
# edit .env.local
GOOGLE_CSE_API_KEY=...
GOOGLE_CSE_CX=...
```

Free tier: 100 queries/day.

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
