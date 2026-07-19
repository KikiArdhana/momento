-- ============================================================
-- Momento · initial schema
-- Tables: profiles, albums, photos, tags, album_tags, favorites
-- Location is denormalized on albums (one place per memory).
-- favorites = album bookmarks; photos.is_favorite = starred photos.
-- ============================================================

-- ---------- helpers ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
-- One row per auth user, created automatically on signup.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  together_since date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile from Google metadata on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- albums ----------

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 2000),
  cover_image text,
  location text check (char_length(location) <= 200),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A pin needs both coordinates or neither.
  constraint albums_coords_pair check ((latitude is null) = (longitude is null))
);

create index albums_user_date_idx on public.albums (user_id, date desc);
create index albums_user_location_idx on public.albums (user_id, location);

create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

-- ---------- photos ----------
-- user_id is denormalized so RLS never needs a join.

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  url text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  is_favorite boolean not null default false,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index photos_album_idx on public.photos (album_id, created_at);
create index photos_album_favorites_idx on public.photos (album_id) where is_favorite;

-- ---------- tags ----------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.album_tags (
  album_id uuid not null references public.albums (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (album_id, tag_id)
);

-- ---------- favorites (album bookmarks) ----------

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id uuid not null references public.albums (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, album_id)
);

-- ============================================================
-- Row Level Security — every table, owner-only access.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.tags enable row level security;
alter table public.album_tags enable row level security;
alter table public.favorites enable row level security;

-- profiles
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- albums
create policy "albums: read own" on public.albums
  for select using (auth.uid() = user_id);
create policy "albums: insert own" on public.albums
  for insert with check (auth.uid() = user_id);
create policy "albums: update own" on public.albums
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "albums: delete own" on public.albums
  for delete using (auth.uid() = user_id);

-- photos
create policy "photos: read own" on public.photos
  for select using (auth.uid() = user_id);
create policy "photos: insert own" on public.photos
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.albums a
      where a.id = album_id and a.user_id = auth.uid()
    )
  );
create policy "photos: update own" on public.photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "photos: delete own" on public.photos
  for delete using (auth.uid() = user_id);

-- tags
create policy "tags: read own" on public.tags
  for select using (auth.uid() = user_id);
create policy "tags: insert own" on public.tags
  for insert with check (auth.uid() = user_id);
create policy "tags: delete own" on public.tags
  for delete using (auth.uid() = user_id);

-- album_tags (ownership checked through the album)
create policy "album_tags: read own" on public.album_tags
  for select using (
    exists (select 1 from public.albums a where a.id = album_id and a.user_id = auth.uid())
  );
create policy "album_tags: insert own" on public.album_tags
  for insert with check (
    exists (select 1 from public.albums a where a.id = album_id and a.user_id = auth.uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );
create policy "album_tags: delete own" on public.album_tags
  for delete using (
    exists (select 1 from public.albums a where a.id = album_id and a.user_id = auth.uid())
  );

-- favorites
create policy "favorites: read own" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites: insert own" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites: delete own" on public.favorites
  for delete using (auth.uid() = user_id);
