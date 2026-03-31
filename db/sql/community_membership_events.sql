create extension if not exists pgcrypto;

create table if not exists public.community_membership_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_type text not null,
  membership_status text,
  discord_role_status text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists community_membership_events_created_at_idx
  on public.community_membership_events(created_at desc);

create index if not exists community_membership_events_user_id_idx
  on public.community_membership_events(user_id, created_at desc);

create index if not exists community_membership_events_type_idx
  on public.community_membership_events(event_type, created_at desc);

alter table if exists public.community_membership_events enable row level security;
revoke all on table public.community_membership_events from anon, authenticated;

drop policy if exists "community_membership_events_no_client_access" on public.community_membership_events;
create policy "community_membership_events_no_client_access"
on public.community_membership_events
for all
using (false)
with check (false);
