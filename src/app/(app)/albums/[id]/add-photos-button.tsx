"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { compressImage, fileExtension } from "@/lib/image";

/**
 * Adds more photos to an existing album: compress → upload → insert,
 * with progress reported through a single updating toast. On success
 * the route refreshes so the collage regenerates with the new photos.
 */
export function AddPhotosButton({ albumId }: { albumId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList) {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    setBusy(true);
    const toastId = toast.loading(`Uploading 0 of ${images.length}…`);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Your session expired. Sign in again.", { id: toastId });
      setBusy(false);
      return;
    }

    let uploaded = 0;
    let failed = 0;
    for (const file of images) {
      try {
        const compressed = await compressImage(file);
        const path = `${user.id}/${albumId}/${crypto.randomUUID()}.${fileExtension(compressed.type)}`;
        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(path, compressed.blob, { contentType: compressed.type });
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
        const { error: insertError } = await supabase.from("photos").insert({
          album_id: albumId,
          user_id: user.id,
          storage_path: path,
          url: pub.publicUrl,
          width: compressed.width,
          height: compressed.height,
          size_bytes: compressed.blob.size,
        });
        if (insertError) throw insertError;

        uploaded += 1;
        toast.loading(`Uploading ${uploaded} of ${images.length}…`, { id: toastId });
      } catch {
        failed += 1;
      }
    }

    setBusy(false);
    if (uploaded > 0) {
      toast.success(
        failed > 0
          ? `${uploaded} added, ${failed} failed`
          : `${uploaded} ${uploaded === 1 ? "photo" : "photos"} added`,
        { id: toastId },
      );
      router.refresh();
    } else {
      toast.error("Upload failed. Check your connection.", { id: toastId });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Add photos to this memory"
        className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-[18px] animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="size-[18px]" aria-hidden />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}