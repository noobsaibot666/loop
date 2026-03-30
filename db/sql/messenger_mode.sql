-- Messenger Mode schema for premium manifest challenges.
-- Run in Supabase SQL editor before using the Messenger endpoints in production.

create extension if not exists pgcrypto;

create table if not exists public.messenger_manifests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_challenge_id uuid,
  city_slug text not null,
  city_name text not null,
  difficulty text,
  style text not null,
  manifest_title text not null,
  estimated_minutes integer not null,
  ghost_seconds integer,
  checkpoint_count integer not null,
  manifest jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messenger_runs (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.messenger_manifests(id) on delete cascade,
  user_id uuid not null,
  bike_id uuid,
  bike_name text,
  bike_ratio text,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  finish_seconds integer,
  created_at timestamptz not null default now()
);

create table if not exists public.messenger_run_checkins (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.messenger_runs(id) on delete cascade,
  checkpoint_id text not null,
  rider_lat double precision,
  rider_lng double precision,
  distance_meters integer,
  checked_in_at timestamptz not null default now(),
  unique (run_id, checkpoint_id)
);

create table if not exists public.messenger_challenges (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null,
  claimed_by_user_id uuid,
  manifest_id uuid not null references public.messenger_manifests(id) on delete cascade,
  code text not null unique,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messenger_challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.messenger_challenges(id) on delete cascade,
  user_id uuid not null,
  manifest_id uuid not null references public.messenger_manifests(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

alter table if exists public.messenger_manifests
  add column if not exists source_challenge_id uuid;

alter table if exists public.messenger_manifests
  alter column difficulty drop not null,
  alter column ghost_seconds drop not null;

alter table if exists public.messenger_run_checkins
  add column if not exists rider_lat double precision,
  add column if not exists rider_lng double precision,
  add column if not exists distance_meters integer;

alter table if exists public.messenger_manifests enable row level security;
alter table if exists public.messenger_runs enable row level security;
alter table if exists public.messenger_run_checkins enable row level security;
alter table if exists public.messenger_challenges enable row level security;
alter table if exists public.messenger_challenge_entries enable row level security;

revoke all on table public.messenger_manifests from anon, authenticated;
revoke all on table public.messenger_runs from anon, authenticated;
revoke all on table public.messenger_run_checkins from anon, authenticated;
revoke all on table public.messenger_challenges from anon, authenticated;
revoke all on table public.messenger_challenge_entries from anon, authenticated;

drop policy if exists "messenger_manifests_select_own" on public.messenger_manifests;
create policy "messenger_manifests_select_own"
on public.messenger_manifests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "messenger_runs_select_own" on public.messenger_runs;
create policy "messenger_runs_select_own"
on public.messenger_runs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "messenger_checkins_select_own" on public.messenger_run_checkins;
create policy "messenger_checkins_select_own"
on public.messenger_run_checkins
for select
to authenticated
using (
  exists (
    select 1
    from public.messenger_runs mr
    where mr.id = messenger_run_checkins.run_id
      and mr.user_id = auth.uid()
  )
);

drop policy if exists "messenger_challenges_select_own" on public.messenger_challenges;
create policy "messenger_challenges_select_own"
on public.messenger_challenges
for select
to authenticated
using (auth.uid() = creator_user_id or auth.uid() = claimed_by_user_id);

drop policy if exists "messenger_challenge_entries_select_own" on public.messenger_challenge_entries;
create policy "messenger_challenge_entries_select_own"
on public.messenger_challenge_entries
for select
to authenticated
using (auth.uid() = user_id);
