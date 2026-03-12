create extension if not exists pgcrypto;

create table if not exists public.city_requests (
  id uuid primary key default gen_random_uuid(),
  requested_city text,
  requested_location text,
  note text,
  requester_email text,
  status text not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table if exists public.city_requests enable row level security;
revoke all on table public.city_requests from anon, authenticated;
