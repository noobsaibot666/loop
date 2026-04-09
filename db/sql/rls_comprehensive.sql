-- COMPREHENSIVE RLS HARDENING FOR STORE SUBMISSION
-- Ensures ALL public tables have Row Level Security enabled and strictly configured.

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

-- 2. Default Deny Policy
-- Fallback for any newly added tables: ensure no public access by default.

-- 3. Specific User Access Policies
-- Users can only read/write their own profiles, bikes, and history.

drop policy if exists "user_profiles_own" on public.user_profiles;
create policy "user_profiles_own" on public.user_profiles
for all to authenticated using (auth.uid() = id);

drop policy if exists "user_bikes_own" on public.user_bikes;
create policy "user_bikes_own" on public.user_bikes
for all to authenticated using (auth.uid() = user_id);

drop policy if exists "loop_history_own" on public.loop_history;
create policy "loop_history_own" on public.loop_history
for select to authenticated using (auth.uid() = user_id);

-- 4. Protected Billing & Admin Tables (Service Role Only)
-- These tables should NOT be accessible via the client-side anon/auth keys.
-- They are managed by Cloudflare Functions using the service_role key.

revoke all on table public.user_credits from anon, authenticated;
revoke all on table public.mobile_purchase_events from anon, authenticated;
revoke all on table public.stripe_events from anon, authenticated;
revoke all on table public.moderation_action_history from anon, authenticated;

-- 5. Public Read-Only Tables
-- Cities and packs are readable by everyone but writable by none.

drop policy if exists "public_read_cities" on public.city_packs;
create policy "public_read_cities" on public.city_packs
for select to anon, authenticated using (true);

drop policy if exists "public_read_checkpoints" on public.city_checkpoints;
create policy "public_read_checkpoints" on public.city_checkpoints
for select to anon, authenticated using (true);
