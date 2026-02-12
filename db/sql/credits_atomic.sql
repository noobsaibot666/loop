-- Atomic credit consumption for user-based quotas.
-- Run in Supabase SQL editor.

create table if not exists public.user_credits (
  user_id uuid primary key,
  free_used integer not null default 0,
  credits integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.consume_user_credit(
  p_user_id uuid,
  p_free_limit integer default 3
)
returns table (
  allowed boolean,
  free_used integer,
  credits_remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_used integer := 0;
  v_credits integer := 0;
begin
  if p_user_id is null then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.user_credits(user_id, free_used, credits)
  values (p_user_id, 0, 0)
  on conflict (user_id) do nothing;

  select uc.free_used, uc.credits
    into v_free_used, v_credits
  from public.user_credits uc
  where uc.user_id = p_user_id
  for update;

  if v_free_used < p_free_limit then
    v_free_used := v_free_used + 1;
    update public.user_credits
      set free_used = v_free_used, updated_at = now()
      where user_id = p_user_id;
    return query select true, v_free_used, v_credits;
    return;
  end if;

  if v_credits > 0 then
    v_credits := v_credits - 1;
    update public.user_credits
      set credits = v_credits, updated_at = now()
      where user_id = p_user_id;
    return query select true, v_free_used, v_credits;
    return;
  end if;

  return query select false, v_free_used, v_credits;
end;
$$;

revoke all on function public.consume_user_credit(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_user_credit(uuid, integer) to service_role;
