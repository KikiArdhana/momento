"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImageUp,
  Loader2,
  Share2,
  Star,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import type { Photo } from "@/types";
import { downloadImage } from "@/lib/download";
import { cn } from "@/lib/utils";

type PhotoViewerProps = {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onToggleFavorite: (photo: Photo) => Promise<void>;
  onDelete: (photo: Photo) => Promise<void>;
  onSetCover?: (photo: Photo) => Promise<void>;
};

const SWIPE_THRESHOLD = 80;

export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
  onToggleFavorite,
  onDelete,
  onSetCover,
}: PhotoViewerProps) {
  const [zoomed, setZoomed] = useState(false);
  const [busy, setBusy] = useState<"download" | "delete" | null>(null);
  const [direction, setDirection] = useState(0);
  const reduceMotion = useReducedMotion();
  const photo = photos[index];

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0 || next >= photos.length) return;
      setDirection(delta);
      setZoomed(false);
      onIndexChange(next);
    },
    [index, photos.length, onIndexChange],
  );

  // Keyboard: arrows navigate, Escape closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Lock page scroll behind the viewer.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!photo) return null;

  async function handleDownload() {
    if (!photo) return;
    setBusy("download");
    try {
      await downloadImage(photo.url, `momento-${photo.id}.jpg`);
    } catch {
      toast.error("Download failed. Check your connection.");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (!photo) return;
    try {
      if (navigator.share) {
        await navigator.share({ url: photo.url, title: "A memory from Momento" });
      } else {
        await navigator.clipboard.writeText(photo.url);
        toast.success("Photo link copied");
      }
    } catch {
      // Person dismissed the share sheet — not an error.
    }
  }

  async function handleDelete() {
    if (!photo) return;
    if (!window.confirm("Delete this photo? This can't be undone.")) return;
    setBusy("delete");
    try {
      await onDelete(photo);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
    >
      {/* Top bar */}
      <div className="z-10 flex items-center justify-between p-4 text-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="flex size-10 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
        >
          <X className="size-5" aria-hidden />
        </button>
        <span className="text-sm tabular-nums text-white/70">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          aria-pressed={zoomed}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
        >
          {zoomed ? <ZoomOut className="size-5" aria-hidden /> : <ZoomIn className="size-5" aria-hidden />}
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={photo.id}
            custom={direction}
            initial={reduceMotion ? false : { x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            drag={zoomed ? true : "x"}
            dragConstraints={zoomed ? undefined : { left: 0, right: 0 }}
            dragElastic={zoomed ? 0.1 : 0.6}
            onDragEnd={(_, info) => {
              if (zoomed) return;
              if (info.offset.x < -SWIPE_THRESHOLD) go(1);
              else if (info.offset.x > SWIPE_THRESHOLD) go(-1);
            }}
            className={cn(
              "flex h-full w-full items-center justify-center",
              zoomed ? "cursor-grab active:cursor-grabbing" : "",
            )}
          >
            <motion.div
              animate={{ scale: zoomed ? 2 : 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onDoubleClick={() => setZoomed((z) => !z)}
              className="relative max-h-full max-w-full"
            >
              <Image
                src={photo.url}
                alt=""
                width={photo.width}
                height={photo.height}
                sizes="100vw"
                priority
                draggable={false}
                className="max-h-[calc(100dvh-180px)] w-auto max-w-full select-none object-contain"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Desktop arrows */}
        {index > 0 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 md:flex"
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 md:flex"
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        )}
      </div>

      {/* Action bar */}
      <div
        className="z-10 flex items-center justify-center gap-3 p-4"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <ViewerAction
          label={photo.isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => onToggleFavorite(photo)}
        >
          <Star
            className={cn("size-5", photo.isFavorite && "fill-rose text-rose")}
            aria-hidden
          />
        </ViewerAction>
        <ViewerAction label="Download photo" onClick={handleDownload}>
          {busy === "download" ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Download className="size-5" aria-hidden />
          )}
        </ViewerAction>
        <ViewerAction label="Share photo" onClick={handleShare}>
          <Share2 className="size-5" aria-hidden />
        </ViewerAction>
        {onSetCover && (
          <ViewerAction
            label="Use as album cover"
            onClick={() => void onSetCover(photo)}
          >
            <ImageUp className="size-5" aria-hidden />
          </ViewerAction>
        )}
        <ViewerAction label="Delete photo" onClick={handleDelete} danger>
          {busy === "delete" ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-5" aria-hidden />
          )}
        </ViewerAction>
      </div>
    </div>
  );
}

function ViewerAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur",
        "transition-all hover:bg-white/20 active:scale-90",
        danger && "hover:bg-red-500/30",
      )}
    >
      {children}
    </button>
  );
}