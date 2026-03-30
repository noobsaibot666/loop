-- Multi-bike support for account profiles, builders, and run history.
-- Run after user_profiles.sql, messenger_mode.sql, account_history.sql, and night_rides_shadow.sql.

create extension if not exists pgcrypto;

create table if not exists public.user_bikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bike_name text not null,
  bike_ratio text not null,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_bikes_user_idx
  on public.user_bikes(user_id, sort_order asc, created_at asc);

alter table if exists public.user_profiles
  add column if not exists primary_bike_id uuid;

alter table if exists public.messenger_runs
  add column if not exists bike_id uuid,
  add column if not exists bike_name text,
  add column if not exists bike_ratio text;

alter table if exists public.loop_history
  add column if not exists bike_id uuid,
  add column if not exists bike_name text,
  add column if not exists bike_ratio text;

alter table if exists public.night_ride_sessions
  add column if not exists bike_id uuid,
  add column if not exists bike_name text,
  add column if not exists bike_ratio text;

alter table if exists public.night_ride_posts
  add column if not exists bike_id uuid,
  add column if not exists bike_name text,
  add column if not exists bike_ratio text;

alter table if exists public.user_bikes enable row level security;
revoke all on table public.user_bikes from anon, authenticated;

drop policy if exists "user_bikes_select_own" on public.user_bikes;
create policy "user_bikes_select_own"
on public.user_bikes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_bikes_insert_own" on public.user_bikes;
create policy "user_bikes_insert_own"
on public.user_bikes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_bikes_update_own" on public.user_bikes;
create policy "user_bikes_update_own"
on public.user_bikes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_bikes_delete_own" on public.user_bikes;
create policy "user_bikes_delete_own"
on public.user_bikes
for delete
to authenticated
using (auth.uid() = user_id);
