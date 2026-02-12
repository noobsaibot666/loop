-- Stripe reliability migration
-- Run in Supabase SQL editor before relying on full idempotency.

create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_sessions (
  session_id text primary key,
  user_id uuid not null,
  amount_cents integer not null default 0,
  credits_to_grant integer not null default 0,
  status text not null default 'checkout_created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_sessions_user_id_idx on public.stripe_sessions(user_id);
create index if not exists stripe_sessions_status_idx on public.stripe_sessions(status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_stripe_sessions_updated_at on public.stripe_sessions;
create trigger set_stripe_sessions_updated_at
before update on public.stripe_sessions
for each row
execute function public.set_updated_at();

alter table public.stripe_events enable row level security;
alter table public.stripe_sessions enable row level security;

-- Users can read only their own stripe session rows via authenticated JWT.
drop policy if exists "stripe_sessions_select_own" on public.stripe_sessions;
create policy "stripe_sessions_select_own"
on public.stripe_sessions
for select
using (auth.uid() = user_id);

-- No direct client writes/deletes on these audit tables.
drop policy if exists "stripe_sessions_no_client_write" on public.stripe_sessions;
create policy "stripe_sessions_no_client_write"
on public.stripe_sessions
for all
using (false)
with check (false);

drop policy if exists "stripe_events_no_client_access" on public.stripe_events;
create policy "stripe_events_no_client_access"
on public.stripe_events
for all
using (false)
with check (false);
