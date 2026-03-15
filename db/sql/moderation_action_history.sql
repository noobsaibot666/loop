create table if not exists public.moderation_action_history (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  admin_email text not null,
  action text not null,
  target_type text not null,
  target_id text,
  target_label text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_action_history_created_at_idx
  on public.moderation_action_history(created_at desc);

create index if not exists moderation_action_history_target_idx
  on public.moderation_action_history(target_type, target_id);
