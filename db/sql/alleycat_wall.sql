-- Alleycat proof wall and proof upload support.
-- Run in Supabase SQL editor after messenger_mode.sql.

create table if not exists public.messenger_proof_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  run_id uuid not null references public.messenger_runs(id) on delete cascade,
  manifest_id uuid not null references public.messenger_manifests(id) on delete cascade,
  checkpoint_id text not null,
  checkpoint_name text not null,
  city_slug text not null,
  city_name text not null,
  rider_name text not null,
  media_type text not null default 'image',
  storage_path text not null unique,
  public_url text not null,
  location_label text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (run_id, checkpoint_id)
);

create index if not exists messenger_proof_posts_created_at_idx on public.messenger_proof_posts(created_at desc);
create index if not exists messenger_proof_posts_user_id_idx on public.messenger_proof_posts(user_id);
create index if not exists messenger_proof_posts_city_slug_idx on public.messenger_proof_posts(city_slug);

alter table if exists public.messenger_proof_posts enable row level security;
revoke all on table public.messenger_proof_posts from anon, authenticated;

drop policy if exists "messenger_proof_posts_select_own" on public.messenger_proof_posts;
create policy "messenger_proof_posts_select_own"
on public.messenger_proof_posts
for select
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'alleycat-proofs', 'alleycat-proofs', true, 6291456, array['image/jpeg', 'image/png', 'image/webp']
where not exists (
  select 1 from storage.buckets where id = 'alleycat-proofs'
);

drop policy if exists "alleycat_proofs_insert_own" on storage.objects;
create policy "alleycat_proofs_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'alleycat-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "alleycat_proofs_update_own" on storage.objects;
create policy "alleycat_proofs_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'alleycat-proofs'
  and owner = auth.uid()
)
with check (
  bucket_id = 'alleycat-proofs'
  and owner = auth.uid()
);

drop policy if exists "alleycat_proofs_delete_own" on storage.objects;
create policy "alleycat_proofs_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'alleycat-proofs'
  and owner = auth.uid()
);
