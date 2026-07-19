import { createClient } from "@/lib/supabase/server";
import type { ProfileStats } from "@/types";

export async function getProfileStats(): Promise<ProfileStats> {
  const supabase = await createClient();

  const [albumsRes, photosRes] = await Promise.all([
    supabase.from("albums").select("id, title, location"),
    supabase.from("photos").select("album_id, is_favorite, size_bytes"),
  ]);
  if (albumsRes.error) throw albumsRes.error;
  if (photosRes.error) throw photosRes.error;

  const albums = albumsRes.data;
  const photos = photosRes.data;

  const places = new Set(
    albums.map((a) => a.location?.trim().toLowerCase()).filter(Boolean),
  );

  const favByAlbum = new Map<string, number>();
  let favoritePhotos = 0;
  let storageBytes = 0;
  for (const p of photos) {
    storageBytes += p.size_bytes;
    if (p.is_favorite) {
      favoritePhotos += 1;
      favByAlbum.set(p.album_id, (favByAlbum.get(p.album_id) ?? 0) + 1);
    }
  }

  let favoriteMemory: ProfileStats["favoriteMemory"] = null;
  let best = 0;
  for (const a of albums) {
    const n = favByAlbum.get(a.id) ?? 0;
    if (n > best) {
      best = n;
      favoriteMemory = { id: a.id, title: a.title };
    }
  }

  return {
    albums: albums.length,
    photos: photos.length,
    favoritePhotos,
    places: places.size,
    trips: albums.filter((a) => a.location).length,
    storageBytes,
    favoriteMemory,
  };
}
