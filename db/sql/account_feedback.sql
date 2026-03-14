create table if not exists public.account_feedback (
  id bigserial primary key,
  user_id uuid not null,
  email text,
  rider_name text,
  feedback text not null,
  source text not null default 'account',
  created_at timestamptz not null default now()
);

alter table if exists public.account_feedback enable row level security;
revoke all on table public.account_feedback from anon, authenticated;

drop policy if exists "account_feedback_insert_own" on public.account_feedback;
create policy "account_feedback_insert_own"
on public.account_feedback
for insert
to authenticated
with check (auth.uid() = user_id);
