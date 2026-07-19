"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { AlbumSummary } from "@/types";

/**
 * Leaflet touches `window` at import time, so the map must be
 * client-only — loaded dynamically with SSR disabled.
 */
const MemoryMap = dynamic(() => import("./memory-map"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-stone" aria-label="Loading map" />
    </div>
  ),
});

export function MapClient({ albums }: { albums: AlbumSummary[] }) {
  return <MemoryMap albums={albums} />;
}
