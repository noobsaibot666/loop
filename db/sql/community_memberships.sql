-- Community membership billing state
-- Run in Supabase SQL editor before enabling Stripe subscription checkout.

create table if not exists public.community_memberships (
  user_id uuid primary key,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text,
  plan_code text not null default 'discord_access',
  status text not null default 'pending',
  price_cents integer not null default 500,
  currency text not null default 'usd',
  interval text not null default 'month',
  discord_invite_url text,
  discord_user_id text,
  discord_username text,
  discord_linked_at timestamptz,
  discord_role_status text,
  discord_access_granted_at timestamptz,
  discord_access_revoked_at timestamptz,
  discord_link_state text,
  discord_link_state_expires_at timestamptz,
  discord_last_error text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_memberships_status_idx
  on public.community_memberships(status);

create index if not exists community_memberships_period_end_idx
  on public.community_memberships(current_period_end desc);

create unique index if not exists community_memberships_discord_user_uidx
  on public.community_memberships(discord_user_id)
  where discord_user_id is not null;

create index if not exists community_memberships_discord_link_state_idx
  on public.community_memberships(discord_link_state)
  where discord_link_state is not null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_community_memberships_updated_at on public.community_memberships;
create trigger set_community_memberships_updated_at
before update on public.community_memberships
for each row
execute function public.set_updated_at();

alter table public.community_memberships enable row level security;

drop policy if exists "community_memberships_select_own" on public.community_memberships;
create policy "community_memberships_select_own"
on public.community_memberships
for select
using (auth.uid() = user_id);

drop policy if exists "community_memberships_no_client_write" on public.community_memberships;
create policy "community_memberships_no_client_write"
on public.community_memberships
for all
using (false)
with check (false);
