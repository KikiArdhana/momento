"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import type { Photo } from "@/types";
import { computeCollage } from "@/lib/collage";

const GAP = 16;

type PhotoCollageProps = {
  photos: Photo[];
  seed: string;
  onPhotoClick: (index: number) => void;
  /** Rendered under the last row; used as the infinite-scroll sentinel. */
  sentinel?: React.ReactNode;
};

/**
 * Renders the Auto Collage Engine's output. Measures its own width
 * (ResizeObserver) and recomputes the pure layout on resize or when
 * photos change. Rows fade in as they enter the viewport.
 */
export function PhotoCollage({ photos, seed, onPhotoClick, sentinel }: PhotoCollageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(
    () => computeCollage(photos, width, { gap: GAP, seed }),
    [photos, width, seed],
  );

  return (
    <div ref={containerRef}>
      {width > 0 && (
        <div className="flex flex-col" style={{ gap: GAP }}>
          {rows.map((row, r) => (
            <motion.div
              key={r}
              className="flex"
              style={{ gap: GAP }}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {row.tiles.map((tile) => (
                <button
                  key={tile.photo.id}
                  type="button"
                  onClick={() => onPhotoClick(tile.index)}
                  aria-label={`Open photo ${tile.index + 1} of ${photos.length}`}
                  className="group relative block overflow-hidden rounded-xl bg-sand outline-none focus-visible:ring-2 focus-visible:ring-rose"
                  style={{ width: tile.width, height: tile.height }}
                >
                  <Image
                    src={tile.photo.url}
                    alt=""
                    width={Math.round(tile.width)}
                    height={Math.round(tile.height)}
                    sizes={`${Math.round(tile.width)}px`}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  {tile.photo.isFavorite && (
                    <span className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-paper/80 backdrop-blur">
                      <Star className="size-3.5 fill-rose text-rose" aria-hidden />
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          ))}
        </div>
      )}
      {sentinel}
    </div>
  );
}
