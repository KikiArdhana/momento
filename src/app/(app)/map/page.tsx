import type { Metadata } from "next";
import { Map as MapIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CREATE_ROUTE } from "@/config/nav";
import { listAlbumSummaries } from "@/services/albums";
import { MapClient } from "@/features/map/map-client";

export const metadata: Metadata = { title: "Map" };

export default async function MapPage() {
  const albums = (await listAlbumSummaries()).filter(
    (a) => a.latitude !== null && a.longitude !== null,
  );

  if (albums.length === 0) {
    return (
      <EmptyState
        icon={MapIcon}
        title="No places yet"
        description="Add coordinates to a memory and it will appear here as a pin on your map."
        action={{ href: CREATE_ROUTE, label: "Create a memory" }}
      />
    );
  }

  return <MapClient albums={albums} />;
}
