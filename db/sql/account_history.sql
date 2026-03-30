-- Account history support for persisted Loop runs.
-- Run in Supabase SQL editor after the core V1 schema.

create table if not exists public.loop_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  loop_point text not null,
  distance_km numeric not null,
  unit text not null,
  terrain text not null,
  surface text not null,
  vibe text not null,
  route_url text not null,
  bike_id uuid,
  bike_name text,
  bike_ratio text,
  created_at timestamptz not null default now()
);

create index if not exists loop_history_user_id_idx on public.loop_history(user_id);
create index if not exists loop_history_created_at_idx on public.loop_history(created_at desc);

alter table if exists public.loop_history enable row level security;
revoke all on table public.loop_history from anon, authenticated;

drop policy if exists "loop_history_select_own" on public.loop_history;
create policy "loop_history_select_own"
on public.loop_history
for select
to authenticated
using (auth.uid() = user_id);
