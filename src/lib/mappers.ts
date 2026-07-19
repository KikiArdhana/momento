import type { Tables } from "@/types/database";
import type { Album, Photo } from "@/types";

export function toAlbum(row: Tables<"albums">): Album {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    coverImage: row.cover_image,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPhoto(row: Tables<"photos">): Photo {
  return {
    id: row.id,
    albumId: row.album_id,
    url: row.url,
    storagePath: row.storage_path,
    width: row.width,
    height: row.height,
    isFavorite: row.is_favorite,
    note: row.note,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}
