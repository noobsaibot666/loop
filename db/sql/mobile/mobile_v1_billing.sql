-- LOOP Mobile V1 Billing
-- Date: 2026-03-19
-- Purpose:
--   Add mobile-native purchase catalog and audited RevenueCat purchase events.
-- Depends on:
--   RevenueCat webhook delivery using Supabase user ids as app_user_id values.
-- Rollback:
--   Drop mobile_purchase_events and mobile_product_catalog if mobile billing is fully removed.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.mobile_product_catalog (
  store_product_id text primary key,
  display_name text not null,
  offering_id text not null default 'default',
  platform text not null default 'shared',
  store text not null default 'app_store',
  credits_to_grant integer not null check (credits_to_grant > 0),
  price_cents integer not null default 0,
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mobile_purchase_events (
  event_id text primary key,
  user_id uuid not null,
  app_user_id text not null,
  store_product_id text not null,
  store_transaction_id text,
  original_transaction_id text,
  event_type text not null,
  platform text,
  store text,
  environment text,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  credits_to_grant integer not null default 0,
  status text not null default 'received',
  purchased_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_purchase_events_user_id_idx on public.mobile_purchase_events(user_id);
create index if not exists mobile_purchase_events_status_idx on public.mobile_purchase_events(status);
create index if not exists mobile_purchase_events_product_idx on public.mobile_purchase_events(store_product_id);
create index if not exists mobile_purchase_events_purchased_at_idx on public.mobile_purchase_events(purchased_at desc nulls last);

drop trigger if exists set_mobile_product_catalog_updated_at on public.mobile_product_catalog;
create trigger set_mobile_product_catalog_updated_at
before update on public.mobile_product_catalog
for each row
execute function public.set_updated_at();

drop trigger if exists set_mobile_purchase_events_updated_at on public.mobile_purchase_events;
create trigger set_mobile_purchase_events_updated_at
before update on public.mobile_purchase_events
for each row
execute function public.set_updated_at();

alter table public.mobile_product_catalog enable row level security;
alter table public.mobile_purchase_events enable row level security;

drop policy if exists "mobile_product_catalog_select_all" on public.mobile_product_catalog;
create policy "mobile_product_catalog_select_all"
on public.mobile_product_catalog
for select
using (true);

drop policy if exists "mobile_product_catalog_no_client_write" on public.mobile_product_catalog;
create policy "mobile_product_catalog_no_client_write"
on public.mobile_product_catalog
for all
using (false)
with check (false);

drop policy if exists "mobile_purchase_events_select_own" on public.mobile_purchase_events;
create policy "mobile_purchase_events_select_own"
on public.mobile_purchase_events
for select
using (auth.uid() = user_id);

drop policy if exists "mobile_purchase_events_no_client_write" on public.mobile_purchase_events;
create policy "mobile_purchase_events_no_client_write"
on public.mobile_purchase_events
for all
using (false)
with check (false);

-- Insert the real App Store / Google Play product ids after they are created.
-- Example:
-- insert into public.mobile_product_catalog (
--   store_product_id,
--   display_name,
--   offering_id,
--   platform,
--   store,
--   credits_to_grant,
--   price_cents,
--   currency
-- ) values
--   ('loop_credits_10', '10 LOOP credits', 'default', 'ios', 'app_store', 10, 500, 'USD'),
--   ('loop_credits_10', '10 LOOP credits', 'default', 'android', 'play_store', 10, 500, 'USD')
-- on conflict (store_product_id) do update
-- set display_name = excluded.display_name,
--     offering_id = excluded.offering_id,
--     platform = excluded.platform,
--     store = excluded.store,
--     credits_to_grant = excluded.credits_to_grant,
--     price_cents = excluded.price_cents,
--     currency = excluded.currency,
--     is_active = true;
