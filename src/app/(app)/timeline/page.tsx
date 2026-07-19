import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CREATE_ROUTE } from "@/config/nav";
import { listAlbumSummaries } from "@/services/albums";
import { formatMonth, yearOf } from "@/lib/format";
import type { AlbumSummary } from "@/types";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const albums = await listAlbumSummaries(); // already newest-first

  if (albums.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nothing on the timeline"
        description="Your memories will line up here, year by year, once you create your first one."
        action={{ href: CREATE_ROUTE, label: "Create a memory" }}
      />
    );
  }

  const byYear = new Map<number, AlbumSummary[]>();
  for (const a of albums) {
    const y = yearOf(a.date);
    byYear.set(y, [...(byYear.get(y) ?? []), a]);
  }

  return (
    <div className="pt-8 md:pt-12">
      <h1 className="chapter-heading text-3xl text-ink">Timeline</h1>

      {[...byYear.entries()].map(([year, list]) => (
        <section key={year} aria-label={`Memories from ${year}`} className="mt-10">
          <h2 className="chapter-heading text-[44px] leading-none text-ink/85">{year}</h2>
          <ol className="relative mt-6 space-y-6 border-l-2 border-blush pl-6">
            {list.map((album) => (
              <li key={album.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[31px] top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-paper bg-rose"
                />
                <Link
                  href={`/albums/${album.id}`}
                  className="flex items-center gap-4 rounded-xl bg-card p-3 shadow-soft transition-shadow hover:shadow-lifted"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {album.coverImage ? (
                      <Image
                        src={album.coverImage}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ImageIcon className="size-5 text-stone/50" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="display truncate text-lg text-ink">{album.title}</h3>
                    <p className="text-sm text-stone">
                      {formatMonth(album.date)}
                      {album.location ? ` · ${album.location}` : ""} · {album.photoCount}{" "}
                      {album.photoCount === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
