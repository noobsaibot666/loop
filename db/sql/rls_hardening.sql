-- RLS hardening for free-tier protection.
-- Goal: block direct anon scraping of app tables and keep access through Cloudflare Functions (service_role).

alter table if exists public.user_credits enable row level security;
alter table if exists public.donations enable row level security;
alter table if exists public.saved_setups enable row level security;
alter table if exists public.device_usage enable row level security;

-- Remove broad client table privileges if they exist.
revoke all on table public.user_credits from anon, authenticated;
revoke all on table public.donations from anon, authenticated;
revoke all on table public.saved_setups from anon, authenticated;
revoke all on table public.device_usage from anon, authenticated;

-- Users may read only their own setups if needed in the future.
drop policy if exists "saved_setups_select_own" on public.saved_setups;
create policy "saved_setups_select_own"
on public.saved_setups
for select
to authenticated
using (auth.uid() = user_id);

-- Explicitly deny client writes to protected billing/usage tables.
drop policy if exists "user_credits_no_client_access" on public.user_credits;
create policy "user_credits_no_client_access"
on public.user_credits
for all
to authenticated
using (false)
with check (false);

drop policy if exists "donations_no_client_access" on public.donations;
create policy "donations_no_client_access"
on public.donations
for all
to authenticated
using (false)
with check (false);

drop policy if exists "device_usage_no_client_access" on public.device_usage;
create policy "device_usage_no_client_access"
on public.device_usage
for all
to authenticated
using (false)
with check (false);

