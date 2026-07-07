# Cutout Aura

Clean, transparent cutouts of anything. Search the web, remove the background,
build a library. Next.js 16 + Supabase + Stripe.

- Marketing site at `/`, app at `/app`, auth at `/login`.
- Shares its Supabase project (database, storage, users) with the Cutout Aura
  mobile app (`../cutout-library`).
- Free plan: 10 cutouts/month, local @imgly engine. Pro ($9/mo via Stripe):
  300 cutouts/month, premium remove.bg engine.

## One-time setup

### 1. Environment

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Already set (shared project) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Already set (shared project) |
| `SUPABASE_SECRET_KEY` | Supabase dashboard > Project Settings > API Keys > secret key (`sb_secret_...`) |
| `SERPER_API_KEY` | serper.dev (free 2,500 searches/mo) |
| `REMOVE_BG_API_KEY` | remove.bg/api (Pro engine) |
| `STRIPE_SECRET_KEY` | Stripe dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Created with the webhook (step 4) |
| `STRIPE_PRICE_PRO_MONTHLY` | Created with the product (step 4) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, prod URL in prod |
| `BG_ENGINE_IMGLY_ENABLED` | `true`; set `false` in prod if imgly cannot run there |

### 2. Database migration

Run `supabase/migrations/0002_web_public_and_billing.sql` in the Supabase SQL
editor (dashboard > SQL Editor > paste > run). It is additive and idempotent:
adds `public_items`, `stripe_subscriptions`, `bg_removals.web_count`, and the
quota functions. The mobile app is unaffected.

(The same file is mirrored to `../cutout-library/supabase/migrations/` so that
repo's migration history stays canonical.)

### 3. Auth redirect URLs

Supabase dashboard > Authentication > URL Configuration:

- Site URL: your production domain (once you have it).
- Additional redirect URLs: `http://localhost:3000/auth/callback` and
  `https://<prod-domain>/auth/callback`.

Google is already enabled on the project (used by the mobile app); no Google
Cloud changes needed.

### 4. Stripe

1. Create product "Cutout Aura Pro" with a $9/month recurring price. Put the
   price id in `STRIPE_PRICE_PRO_MONTHLY`.
2. Enable the customer portal (Settings > Billing > Customer portal).
3. Webhook endpoint `https://<domain>/api/billing/webhook` with events:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
   Put the signing secret in `STRIPE_WEBHOOK_SECRET`.

Local testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`
(use the printed `whsec_` as `STRIPE_WEBHOOK_SECRET`), card `4242 4242 4242 4242`.

### 5. Seed the starter library

Uploads local PNGs to the `cutouts` bucket under `starter/` and fills
`public_items`. Defaults to a curated 10-item pack; `--all` migrates the full
216-item catalog. Idempotent; needs `SUPABASE_SECRET_KEY`.

```bash
npm run migrate:supabase          # curated pack
npm run migrate:supabase -- --all # everything
```

After confirming the starter library works in the app, the local copies
(`data/catalog.json`, `public/foods/`) and the legacy scripts
(`scripts/migrate-existing.ts`, `scripts/seed-*.ts`) can be deleted. Keep
`public/marketing/cutouts/` - the landing page uses those.

## Develop

```bash
npm run dev
```

## Deploy (Vercel)

1. Import the repo, set every env var from `.env.local` (with prod values for
   `NEXT_PUBLIC_APP_URL`, `STRIPE_WEBHOOK_SECRET`).
2. `api/add` needs long function duration (background removal can take 30s+).
   Vercel Pro with fluid compute covers the configured `maxDuration = 120`.
3. The @imgly engine gate: the local ONNX model may exceed serverless bundle
   limits. If the deploy fails or `api/add` times out on the imgly path, set
   `BG_ENGINE_IMGLY_ENABLED=false`; free-tier adds then fall back to remove.bg
   (mind per-image API costs) - or move the imgly path to a small worker.
4. After the first deploy: set the Supabase Site URL + prod redirect URL
   (step 3) and create the prod Stripe webhook (step 4).

## Architecture notes

- `src/proxy.ts` guards `/app/*` (Next 16 proxy + @supabase/ssr session refresh).
- API routes re-check auth with `getUser()`; the browser reads `items` /
  `public_items` directly through RLS.
- Storage paths: `cutouts/<user_id>/<category>/<slug>.png` for user items
  (folder-must-match-uid RLS), `cutouts/starter/...` for the public library
  (service-role writes only).
- Quota: `consume_web_bg_quota()` atomically increments
  `bg_removals.web_count`; `skip`-engine adds are unmetered. The mobile app's
  `count` column is untouched.
- Web billing lives in `stripe_subscriptions`; the mobile app's RevenueCat
  `profiles.pro_until` is never written by this app.
