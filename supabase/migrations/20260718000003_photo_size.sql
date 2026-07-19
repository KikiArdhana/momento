-- Track file size so Profile can report real storage usage.
alter table public.photos
  add column if not exists size_bytes bigint not null default 0 check (size_bytes >= 0);
