-- User profile fields for wall metadata and account editing.
-- Run in Supabase SQL editor after the existing Alleycat wall schema.

create table if not exists public.user_profiles (
  user_id uuid primary key,
  rider_name text,
  home_location text,
  primary_bike_id uuid,
  bike_name text,
  bike_ratio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.user_profiles enable row level security;
revoke all on table public.user_profiles from anon, authenticated;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table if exists public.messenger_proof_posts
  add column if not exists bike_name text,
  add column if not exists bike_ratio text;
