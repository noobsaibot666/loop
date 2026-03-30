alter table if exists public.messenger_manifests
  alter column difficulty drop not null,
  alter column ghost_seconds drop not null;
