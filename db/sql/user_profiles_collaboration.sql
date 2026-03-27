-- Collaboration request fields on top of user_profiles.
-- Run this after db/sql/user_profiles.sql

alter table if exists public.user_profiles
  add column if not exists collaboration_note text,
  add column if not exists collaboration_status text,
  add column if not exists collaboration_requested_at timestamptz;
