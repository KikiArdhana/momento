-- ============================================================
-- Momento · storage
-- One public bucket "photos". Objects live under {user_id}/...,
-- so writes are restricted to your own folder.
--
-- Note: "public" means readable by anyone holding the URL —
-- URLs contain unguessable UUIDs, and this is what lets
-- next/image optimize without auth headers. If you later want
-- hard-private media, we switch to signed URLs in the service
-- layer without touching the UI.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760, -- 10 MB per file (client compresses before upload, Milestone 4)
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
)
on conflict (id) do nothing;

create policy "photos bucket: public read"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "photos bucket: upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "photos bucket: update own"
  on storage.objects for update
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "photos bucket: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
