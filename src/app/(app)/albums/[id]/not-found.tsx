import { BookX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function AlbumNotFound() {
  return (
    <EmptyState
      icon={BookX}
      title="Memory not found"
      description="This page doesn't exist, or the memory was deleted."
      action={{ href: "/", label: "Back to your book" }}
    />
  );
}
