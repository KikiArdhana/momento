import { createClient } from "@/lib/supabase/server";
import { toAlbum, toPhoto } from "@/lib/mappers";
import type { Album, AlbumSummary, Photo, Tag } from "@/types";

export const PHOTOS_PAGE_SIZE = 60;

/**
 * All albums for the signed-in user, enriched with photo counts,
 * favorite counts, bookmark state, and tags — three round-trips total,
 * aggregated in memory (personal-library scale).
 */
export async function listAlbumSummaries(): Promise<AlbumSummary[]> {
  const supabase = await createClient();

  const [albumsRes, photosRes, favsRes] = await Promise.all([
    supabase
      .from("albums")
      .select("*, album_tags(tags(id, name))")
      .order("date", { ascending: false }),
    supabase.from("photos").select("album_id, is_favorite"),
    supabase.from("favorites").select("album_id"),
  ]);

  if (albumsRes.error) throw albumsRes.error;
  if (photosRes.error) throw photosRes.error;
  if (favsRes.error) throw favsRes.error;

  const counts = new Map<string, { photos: number; favorites: number }>();
  for (const p of photosRes.data) {
    const c = counts.get(p.album_id) ?? { photos: 0, favorites: 0 };
    c.photos += 1;
    if (p.is_favorite) c.favorites += 1;
    counts.set(p.album_id, c);
  }
  const bookmarked = new Set(favsRes.data.map((f) => f.album_id));

  return albumsRes.data.map((row) => {
    const joined = (row.album_tags ?? []) as unknown as { tags: Tag | null }[];
    const tags = joined.map((j) => j.tags).filter((t): t is Tag => t !== null);
    const c = counts.get(row.id) ?? { photos: 0, favorites: 0 };
    return {
      ...toAlbum(row),
      photoCount: c.photos,
      favoriteCount: c.favorites,
      isBookmarked: bookmarked.has(row.id),
      tags,
    };
  });
}

export async function getAlbum(id: string): Promise<Album | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAlbum(data) : null;
}

export async function getAlbumPhotos(
  albumId: string,
  page = 0,
): Promise<{ photos: Photo[]; total: number }> {
  const supabase = await createClient();
  const from = page * PHOTOS_PAGE_SIZE;
  const { data, count, error } = await supabase
    .from("photos")
    .select("*", { count: "exact" })
    .eq("album_id", albumId)
    .order("created_at", { ascending: true })
    .range(from, from + PHOTOS_PAGE_SIZE - 1);
  if (error) throw error;
  return { photos: (data ?? []).map(toPhoto), total: count ?? 0 };
}
