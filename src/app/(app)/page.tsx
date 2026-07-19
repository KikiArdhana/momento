import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ImagePlus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CREATE_ROUTE } from "@/config/nav";
import { getCurrentProfile } from "@/services/profiles";
import { listAlbumSummaries } from "@/services/albums";
import { AlbumLibrary } from "@/features/albums/album-library";

export const metadata: Metadata = { title: "Home" };

function greetingForHour(hour: number): string {
  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const [profile, albums] = await Promise.all([
    getCurrentProfile(),
    listAlbumSummaries(),
  ]);
  const firstName = profile?.displayName.split(" ")[0];
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="pt-8 md:pt-12">
      <header className="space-y-6">
        <h1 className="chapter-heading text-[34px] leading-tight text-ink md:text-4xl">
          {greeting}
          {firstName ? `, ${firstName}` : ""} <span aria-hidden>👋</span>
        </h1>
      </header>

      {albums.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="Your story starts here"
          description="Create your first memory and Momento will turn it into a chapter of your book."
          action={{ href: CREATE_ROUTE, label: "Create a memory" }}
          className="min-h-[50dvh]"
        />
      ) : (
        <AlbumLibrary albums={albums} />
      )}
    </div>
  );
}
