/**
 * Momento domain types — the contract between services, hooks, and UI.
 * Raw rows live in types/database.ts; these are app-level shapes.
 */

export type UUID = string;

export interface UserProfile {
  id: UUID;
  displayName: string;
  avatarUrl: string | null;
  togetherSince: string | null; // ISO date
  createdAt: string;
}

export interface Album {
  id: UUID;
  userId: UUID;
  title: string;
  description: string | null;
  coverImage: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  date: string; // ISO date — when the memory happened
  createdAt: string;
  updatedAt: string;
}

/** Album enriched with the aggregates the UI needs. */
export interface AlbumSummary extends Album {
  photoCount: number;
  favoriteCount: number;
  isBookmarked: boolean;
  tags: Tag[];
}

export interface Photo {
  id: UUID;
  albumId: UUID;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  isFavorite: boolean;
  note: string | null;
  sizeBytes: number;
  createdAt: string;
}

export interface Tag {
  id: UUID;
  name: string;
}

export type SortOption =
  | "newest"
  | "oldest"
  | "location"
  | "favorites"
  | "most_photos"
  | "least_photos";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  location: "Location",
  favorites: "Favorites",
  most_photos: "Most photos",
  least_photos: "Least photos",
};

export interface ProfileStats {
  albums: number;
  photos: number;
  favoritePhotos: number;
  places: number;
  trips: number;
  storageBytes: number;
  favoriteMemory: { id: UUID; title: string } | null;
}

/** Orientation classification used by the collage engine. */
export type PhotoOrientation = "portrait" | "landscape" | "square";

export function orientationOf(p: Pick<Photo, "width" | "height">): PhotoOrientation {
  const ratio = p.width / p.height;
  if (ratio > 1.1) return "landscape";
  if (ratio < 0.9) return "portrait";
  return "square";
}
