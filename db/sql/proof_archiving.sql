-- Archive support for Wall of Fame moderation.
-- Run in Supabase SQL editor before using month archive controls.

alter table if exists public.messenger_proof_posts
  add column if not exists archived_at timestamptz;

create index if not exists messenger_proof_posts_archived_at_idx
  on public.messenger_proof_posts(archived_at);
