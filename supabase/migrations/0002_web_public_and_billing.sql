-- Cutout Library schema v2: web app additions
-- Additive only. Safe alongside the mobile app's usage of items/profiles/bg_removals.
--
-- 1. public_items: curated starter library, readable by everyone, writable only
--    with the service role. Images live in the existing public `cutouts` bucket
--    under 'starter/<category>/<slug>.png' (a folder no auth.uid() can claim).
-- 2. stripe_subscriptions: web billing state, fully separate from RevenueCat's
--    profiles.pro_until.
-- 3. bg_removals.web_count: web quota counter; mobile upserts {user_id, month,
--    count} and never touches this column.
-- 4. consume_web_bg_quota / refund_web_bg_quota: atomic check-and-increment,
--    service-role only.

-- public_items ------------------------------------------------------------
create table if not exists public.public_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text not null,
  tags text[] not null default '{}',
  storage_path text not null,
  source_url text,
  width int,
  height int,
  bytes int,
  added_at timestamptz not null default now(),
  unique (slug, category)
);

create index if not exists public_items_cat_idx on public.public_items (category);
create index if not exists public_items_tags_gin_idx on public.public_items using gin (tags);

alter table public.public_items enable row level security;

drop policy if exists "public items read" on public.public_items;
create policy "public items read" on public.public_items
  for select using (true);
-- No insert/update/delete policies: service role only.

-- stripe_subscriptions ----------------------------------------------------
create table if not exists public.stripe_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  stripe_subscription_id text unique,
  price_id text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.stripe_subscriptions enable row level security;

drop policy if exists "own subscription read" on public.stripe_subscriptions;
create policy "own subscription read" on public.stripe_subscriptions
  for select using (auth.uid() = user_id);
-- Writes only via the Stripe webhook with the service role.

-- web quota counter --------------------------------------------------------
alter table public.bg_removals add column if not exists web_count int not null default 0;

-- Atomic check-and-increment: inserts the month row on first use, otherwise
-- increments only while under the limit. Null RETURNING means the limit was hit.
create or replace function public.consume_web_bg_quota(p_user uuid, p_month text, p_limit int)
returns table (allowed boolean, used int)
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if p_limit <= 0 then
    select bg.web_count into v_count from public.bg_removals bg
      where bg.user_id = p_user and bg.month = p_month;
    return query select false, coalesce(v_count, 0);
    return;
  end if;

  insert into public.bg_removals as bg (user_id, month, count, web_count)
  values (p_user, p_month, 0, 1)
  on conflict (user_id, month) do update
    set web_count = bg.web_count + 1
    where bg.web_count < p_limit
  returning bg.web_count into v_count;

  if v_count is null then
    select bg.web_count into v_count from public.bg_removals bg
      where bg.user_id = p_user and bg.month = p_month;
    return query select false, coalesce(v_count, 0);
  else
    return query select true, v_count;
  end if;
end $$;

-- Refund one unit when processing fails after the quota was consumed.
create or replace function public.refund_web_bg_quota(p_user uuid, p_month text)
returns void
language sql security definer set search_path = public as $$
  update public.bg_removals
    set web_count = greatest(web_count - 1, 0)
    where user_id = p_user and month = p_month;
$$;

revoke execute on function public.consume_web_bg_quota(uuid, text, int) from anon, authenticated;
revoke execute on function public.refund_web_bg_quota(uuid, text) from anon, authenticated;
