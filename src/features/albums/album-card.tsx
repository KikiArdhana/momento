"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, ImageIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { AlbumSummary } from "@/types";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Compact editorial card, designed for a 2-up mobile grid: tall 4:5
 * cover, location as a small pill over the photo, one tight meta line.
 */
export function AlbumCard({ album }: { album: AlbumSummary }) {
  const [bookmarked, setBookmarked] = useState(album.isBookmarked);

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = next
      ? await supabase.from("favorites").insert({ user_id: user.id, album_id: album.id })
      : await supabase.from("favorites").delete().match({ user_id: user.id, album_id: album.id });
    if (error) {
      setBookmarked(!next);
      toast.error("Couldn't update bookmark. Try again.");
    }
  }

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group block overflow-hidden rounded-xl bg-card shadow-soft transition-shadow duration-300 hover:shadow-lifted"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        {album.coverImage ? (
          <Image
            src={album.coverImage}
            alt={`Cover of ${album.title}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="size-8 text-stone/50" aria-hidden />
          </div>
        )}

        {/* Soft bottom scrim so the location pill always reads */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent"
        />

        {album.location && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex max-w-[85%] items-center gap-1 rounded-full bg-paper/85 px-2.5 py-1 backdrop-blur">
            <MapPin className="size-3 shrink-0 text-rose" aria-hidden />
            <span className="truncate text-[11px] font-medium text-ink">
              {album.location}
            </span>
          </span>
        )}

        <button
          type="button"
          onClick={toggleBookmark}
          aria-label={bookmarked ? `Remove bookmark from ${album.title}` : `Bookmark ${album.title}`}
          aria-pressed={bookmarked}
          className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-paper/85 backdrop-blur transition-transform active:scale-90"
        >
          <Bookmark
            className={cn(
              "size-4 transition-colors",
              bookmarked ? "fill-rose text-rose" : "text-ink",
            )}
            aria-hidden
          />
        </button>
      </div>

      <div className="space-y-0.5 px-3.5 pb-4 pt-3">
        <h3 className="display truncate text-[16px] leading-snug text-ink">
          {album.title}
        </h3>
        <p className="truncate text-xs text-stone">
          {formatDate(album.date)} · {album.photoCount}{" "}
          {album.photoCount === 1 ? "photo" : "photos"}
        </p>
      </div>
    </Link>
  );
}