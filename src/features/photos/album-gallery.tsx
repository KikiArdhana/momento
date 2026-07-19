"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Images, Loader2, MapPin, Shuffle, Star } from "lucide-react";
import { toast } from "sonner";
import type { Photo } from "@/types";
import { toPhoto } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/client";
import { PhotoCollage } from "@/features/collage/photo-collage";
import { PhotoViewer } from "@/features/photos/photo-viewer";

const PAGE_SIZE = 60;

type AlbumGalleryProps = {
  albumId: string;
  initialPhotos: Photo[];
  total: number;
  location?: string | null;
};

/**
 * Owns the album's photo state: the collage (with shuffleable layout),
 * the fullscreen viewer, favorite/cover/delete mutations, and infinite
 * scroll via an IntersectionObserver sentinel.
 */
export function AlbumGallery({ albumId, initialPhotos, total, location }: AlbumGalleryProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = photos.length < total;
  const favoriteCount = photos.filter((p) => p.isFavorite).length;

  // Layout seed: album id by default; shuffles persist per album.
  const seedKey = `momento-layout-${albumId}`;
  const [seed, setSeed] = useState(albumId);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(seedKey);
      if (saved) setSeed(saved);
    } catch {
      // private mode — default seed is fine
    }
  }, [seedKey]);

  function shuffleLayout() {
    const next = `${albumId}-${Math.random().toString(36).slice(2, 8)}`;
    setSeed(next);
    try {
      localStorage.setItem(seedKey, next);
    } catch {
      // not persisted, still shuffled for this visit
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || photos.length >= total) return;
    setLoadingMore(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("album_id", albumId)
      .order("created_at", { ascending: true })
      .range(photos.length, photos.length + PAGE_SIZE - 1);
    setLoadingMore(false);
    if (error) {
      toast.error("Couldn't load more photos.");
      return;
    }
    setPhotos((prev) => [...prev, ...data.map(toPhoto)]);
  }, [albumId, photos.length, total, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  async function toggleFavorite(photo: Photo) {
    const next = !photo.isFavorite;
    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, isFavorite: next } : p)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("photos")
      .update({ is_favorite: next })
      .eq("id", photo.id);
    if (error) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, isFavorite: !next } : p)),
      );
      toast.error("Couldn't update favorite.");
    }
  }

  async function setAsCover(photo: Photo) {
    const supabase = createClient();
    const { error } = await supabase
      .from("albums")
      .update({ cover_image: photo.url })
      .eq("id", albumId);
    if (error) {
      toast.error("Couldn't update the cover.");
      return;
    }
    toast.success("Cover updated");
    router.refresh(); // hero re-renders with the new cover
  }

  async function deletePhoto(photo: Photo) {
    const supabase = createClient();
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      toast.error("Couldn't delete photo.");
      return;
    }
    // Storage cleanup — seed photos ("seed/…") have nothing to remove.
    if (!photo.storagePath.startsWith("seed/")) {
      await supabase.storage.from("photos").remove([photo.storagePath]);
    }
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== photo.id);
      setViewerIndex((idx) => {
        if (idx === null) return idx;
        if (next.length === 0) return null;
        return Math.min(idx, next.length - 1);
      });
      return next;
    });
    toast.success("Photo deleted");
  }

  return (
    <>
      {/* Stats + layout toolbar — one aligned row */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <dl className="flex flex-wrap items-center gap-2">
          <StatPill
            icon={Images}
            label={`${total} ${total === 1 ? "Photo" : "Photos"}`}
          />
          <StatPill
            icon={Star}
            label={`${favoriteCount} ${favoriteCount === 1 ? "Favorite" : "Favorites"}`}
          />
        </dl>
        <button
          type="button"
          onClick={shuffleLayout}
          aria-label="Shuffle collage layout"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-ink shadow-soft transition-transform active:scale-[0.97]"
        >
          <Shuffle className="size-4 text-rose" aria-hidden />
          Shuffle layout
        </button>
      </div>

      <PhotoCollage
        photos={photos}
        seed={seed}
        onPhotoClick={setViewerIndex}
        sentinel={
          hasMore ? (
            <div ref={sentinelRef} className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-stone" aria-label="Loading more photos" />
            </div>
          ) : null
        }
      />
      {viewerIndex !== null && photos.length > 0 && (
        <PhotoViewer
          photos={photos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onToggleFavorite={toggleFavorite}
          onDelete={deletePhoto}
          onSetCover={setAsCover}
        />
      )}
    </>
  );
}

function StatPill({
  icon: Icon,
  label,
}: {
  icon: typeof Images;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-sand px-3.5 py-2">
      <Icon className="size-4 text-rose" aria-hidden />
      <dd className="text-sm font-medium text-ink">{label}</dd>
    </div>
  );
}