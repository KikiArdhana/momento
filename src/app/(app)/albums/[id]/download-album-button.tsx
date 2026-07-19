"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toPhoto } from "@/lib/mappers";
import { generateAlbumPoster, type PosterAlbum } from "@/lib/poster";

/**
 * Exports the album as an aesthetic poster JPG: serif title, meta,
 * description, and a mini collage — favorites featured first.
 */
export function DownloadAlbumButton({ album }: { album: PosterAlbum }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    const toastId = toast.loading("Designing your poster…");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("album_id", album.id)
        .order("is_favorite", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(9);
      if (error || !data || data.length === 0) {
        throw new Error("No photos to include.");
      }

      const blob = await generateAlbumPoster(album, data.map(toPhoto));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `momento-${slugify(album.title)}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Poster saved", { id: toastId });
    } catch {
      toast.error("Couldn't create the poster. Try again.", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      aria-label="Download this memory as a poster"
      className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-[18px] animate-spin" aria-hidden />
      ) : (
        <Download className="size-[18px]" aria-hidden />
      )}
    </button>
  );
}

function slugify(s: string): string {
  return (
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "album"
  );
}