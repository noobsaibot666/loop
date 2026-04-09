-- COMPREHENSIVE RLS HARDENING FOR STORE SUBMISSION (Safe Version)
-- Ensures ALL public tables have Row Level Security enabled and strictly configured.
-- This version uses IF EXISTS guards to prevent errors if tables aren't deployed yet.

-- 1. Enable RLS on all tables
alter table if exists public.account_feedback enable row level security;
alter table if exists public.city_checkpoints enable row level security;
alter table if exists public.city_packs enable row level security;
alter table if exists public.city_requests enable row level security;
alter table if exists public.community_membership_events enable row level security;
alter table if exists public.community_memberships enable row level security;
alter table if exists public.loop_history enable row level security;
alter table if exists public.messenger_challenge_entries enable row level security;
alter table if exists public.messenger_challenges enable row level security;
alter table if exists public.messenger_manifests enable row level security;
alter table if exists public.messenger_proof_posts enable row level security;
alter table if exists public.messenger_run_checkins enable row level security;
alter table if exists public.messenger_runs enable row level security;
alter table if exists public.mobile_product_catalog enable row level security;
alter table if exists public.mobile_purchase_events enable row level security;
alter table if exists public.moderation_action_history enable row level security;
alter table if exists public.night_ride_participants enable row level security;
alter table if exists public.night_ride_posts enable row level security;
alter table if exists public.night_ride_sessions enable row level security;
alter table if exists public.stripe_events enable row level security;
alter table if exists public.stripe_sessions enable row level security;
alter table if exists public.user_bikes enable row level security;
alter table if exists public.user_credits enable row level security;
alter table if exists public.user_profiles enable row level security;

-- 2. Specific User Access Policies
-- Users can only read/write their own profiles, bikes, and history.

drop policy if exists "user_profiles_own" on public.user_profiles;
do $$ begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'user_profiles') then
    create policy "user_profiles_own" on public.user_profiles
    for all to authenticated using (auth.uid() = user_id);
  end if;
end $$;

drop policy if exists "user_bikes_own" on public.user_bikes;
do $$ begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'user_bikes') then
    create policy "user_bikes_own" on public.user_bikes
    for all to authenticated using (auth.uid() = user_id);
  end if;
end $$;

drop policy if exists "loop_history_own" on public.loop_history;
do $$ begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'loop_history') then
    create policy "loop_history_own" on public.loop_history
    for select to authenticated using (auth.uid() = user_id);
  end if;
end $$;

-- 3. Protected Billing & Admin Tables (Service Role Only)
-- These tables should NOT be accessible via the client-side anon/auth keys.

do $$ 
begin
  -- Credits
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'user_credits') then
    revoke all on table public.user_credits from anon, authenticated;
  end if;
  
  -- Mobile Billing
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'mobile_purchase_events') then
    revoke all on table public.mobile_purchase_events from anon, authenticated;
  end if;
  
  -- Stripe
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'stripe_events') then
    revoke all on table public.stripe_events from anon, authenticated;
  end if;
  
  -- Moderation
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'moderation_action_history') then
    revoke all on table public.moderation_action_history from anon, authenticated;
  end if;
end $$;

-- 4. Public Read-Only Tables
-- Cities and packs are readable by everyone but writable by none.

drop policy if exists "public_read_cities" on public.city_packs;
do $$ begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'city_packs') then
    create policy "public_read_cities" on public.city_packs
    for select to anon, authenticated using (true);
  end if;
end $$;

drop policy if exists "public_read_checkpoints" on public.city_checkpoints;
do $$ begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'city_checkpoints') then
    create policy "public_read_checkpoints" on public.city_checkpoints
    for select to anon, authenticated using (true);
  end if;
end $$;
