-- DB-backed Alleycat city content studio.
-- Run after messenger_mode.sql.

create table if not exists public.city_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  route_note text,
  finish_label text,
  safety_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.city_checkpoints (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.city_packs(id) on delete cascade,
  slug text not null unique,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  district text,
  category text,
  vibe text,
  hint text not null,
  task_local text not null,
  task_fast text not null,
  task_chaotic text not null,
  sort_weight integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists city_checkpoints_pack_id_idx on public.city_checkpoints(pack_id);
create index if not exists city_checkpoints_active_idx on public.city_checkpoints(pack_id, is_active, sort_weight);

alter table if exists public.city_packs enable row level security;
alter table if exists public.city_checkpoints enable row level security;

revoke all on table public.city_packs from anon, authenticated;
revoke all on table public.city_checkpoints from anon, authenticated;
