create extension if not exists pgcrypto;

create table if not exists public.night_ride_sessions (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null,
  creator_email text,
  creator_rider_name text,
  session_type text not null default 'single' check (session_type in ('single', 'crew')),
  mode text not null check (mode in ('loop', 'roulette')),
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  unit text not null check (unit in ('km', 'mi')),
  distance_km numeric(6,2) not null,
  ride_city text,
  crew_name text,
  crew_members jsonb not null default '[]'::jsonb,
  origin_label text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  destination_label text,
  destination_lat double precision,
  destination_lng double precision,
  share_code text not null unique,
  route_url text not null,
  route_payload jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists night_ride_sessions_creator_idx
  on public.night_ride_sessions(creator_user_id, created_at desc);

create index if not exists night_ride_sessions_created_idx
  on public.night_ride_sessions(created_at desc);

alter table public.night_ride_sessions
  add column if not exists session_type text not null default 'single';

alter table public.night_ride_sessions
  add column if not exists ride_city text;

alter table public.night_ride_sessions
  add column if not exists crew_name text;

alter table public.night_ride_sessions
  add column if not exists crew_members jsonb not null default '[]'::jsonb;

create table if not exists public.night_ride_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.night_ride_sessions(id) on delete cascade,
  user_id uuid not null,
  rider_name text,
  joined_via text not null default 'code',
  credits_spent integer not null default 1,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists night_ride_participants_session_idx
  on public.night_ride_participants(session_id, created_at desc);

create table if not exists public.night_ride_posts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.night_ride_sessions(id) on delete set null,
  user_id uuid,
  rider_name text not null,
  crew_name text,
  city_name text,
  route_title text,
  distance_km numeric(6,2),
  caption text,
  storage_path text,
  image_url text not null,
  aspect_ratio text not null default '1:1',
  is_public boolean not null default true,
  moderation_status text not null default 'live' check (moderation_status in ('live', 'hidden', 'flagged')),
  created_at timestamptz not null default now()
);

create index if not exists night_ride_posts_public_idx
  on public.night_ride_posts(is_public, created_at desc);

alter table public.night_ride_posts
  add column if not exists crew_name text;

alter table public.night_ride_posts
  add column if not exists route_title text;

alter table public.night_ride_posts
  add column if not exists distance_km numeric(6,2);

alter table public.night_ride_posts
  add column if not exists storage_path text;

alter table public.night_ride_posts
  add column if not exists aspect_ratio text not null default '1:1';

alter table public.night_ride_posts
  add column if not exists moderation_status text not null default 'live';

insert into storage.buckets (id, name, public)
values ('night-ride-posts', 'night-ride-posts', true)
on conflict (id) do nothing;

drop policy if exists "night ride posts public read" on storage.objects;
create policy "night ride posts public read"
on storage.objects
for select
using (bucket_id = 'night-ride-posts');

drop policy if exists "night ride posts auth upload" on storage.objects;
create policy "night ride posts auth upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'night-ride-posts');

drop policy if exists "night ride posts auth update own" on storage.objects;
create policy "night ride posts auth update own"
on storage.objects
for update
to authenticated
using (bucket_id = 'night-ride-posts' and owner = auth.uid())
with check (bucket_id = 'night-ride-posts' and owner = auth.uid());

drop policy if exists "night ride posts auth delete own" on storage.objects;
create policy "night ride posts auth delete own"
on storage.objects
for delete
to authenticated
using (bucket_id = 'night-ride-posts' and owner = auth.uid());
