alter table if exists public.community_memberships
  add column if not exists discord_user_id text,
  add column if not exists discord_username text,
  add column if not exists discord_linked_at timestamptz,
  add column if not exists discord_role_status text,
  add column if not exists discord_access_granted_at timestamptz,
  add column if not exists discord_access_revoked_at timestamptz,
  add column if not exists discord_link_state text,
  add column if not exists discord_link_state_expires_at timestamptz,
  add column if not exists discord_last_error text;

create unique index if not exists community_memberships_discord_user_uidx
  on public.community_memberships(discord_user_id)
  where discord_user_id is not null;

create index if not exists community_memberships_discord_link_state_idx
  on public.community_memberships(discord_link_state)
  where discord_link_state is not null;
