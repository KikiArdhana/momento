"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAlbum } from "./actions";

export function DeleteAlbumButton({ albumId }: { albumId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      toast("Delete this memory and all its photos?", {
        action: {
          label: "Delete",
          onClick: () =>
            startTransition(async () => {
              try {
                await deleteAlbum(albumId);
              } catch {
                toast.error("Couldn't delete the memory. Try again.");
              }
            }),
        },
        onDismiss: () => setConfirming(false),
        onAutoClose: () => setConfirming(false),
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Delete memory"
      className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-red-500/60 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-[18px] animate-spin" aria-hidden />
      ) : (
        <Trash2 className="size-[18px]" aria-hidden />
      )}
    </button>
  );
}
