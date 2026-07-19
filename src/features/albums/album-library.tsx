"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpDown, Bookmark, X } from "lucide-react";
import { SORT_LABELS, type AlbumSummary, type SortOption } from "@/types";
import { yearOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlbumCard } from "./album-card";

/**
 * The book itself: albums grouped into year "chapters", with search,
 * sort, and a bookmarked-only filter. Filtering runs client-side over
 * the summaries — instant, and personal libraries are small.
 */
export function AlbumLibrary({ albums }: { albums: AlbumSummary[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = albums.filter((a) => {
      if (bookmarkedOnly && !a.isBookmarked) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        String(yearOf(a.date)).includes(q) ||
        a.tags.some((t) => t.name.toLowerCase().includes(q))
      );
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "newest": return b.date.localeCompare(a.date);
        case "oldest": return a.date.localeCompare(b.date);
        case "location": return (a.location ?? "\uffff").localeCompare(b.location ?? "\uffff");
        case "favorites": return b.favoriteCount - a.favoriteCount;
        case "most_photos": return b.photoCount - a.photoCount;
        case "least_photos": return a.photoCount - b.photoCount;
      }
    });
    return list;
  }, [albums, query, sort, bookmarkedOnly]);

  // Chapters only make sense in chronological sorts.
  const chaptered = sort === "newest" || sort === "oldest";
  const groups = useMemo(() => {
    if (!chaptered) return [["All memories", visible]] as const;
    const map = new Map<number, AlbumSummary[]>();
    for (const a of visible) {
      const y = yearOf(a.date);
      map.set(y, [...(map.get(y) ?? []), a]);
    }
    return [...map.entries()].map(([y, list]) => [String(y), list] as const);
  }, [visible, chaptered]);

  return (
    <div className="mt-9">
      {/* Search + controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories, places, tags…"
            aria-label="Search memories"
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-[15px] text-ink placeholder:text-stone/70 shadow-soft outline-none focus:border-rose"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
            aria-label={`Sort: ${SORT_LABELS[sort]}`}
            className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-ink shadow-soft"
          >
            <ArrowUpDown className="size-[18px]" aria-hidden />
          </button>
          {sortOpen && (
            <ul
              role="listbox"
              aria-label="Sort memories"
              className="absolute right-0 top-14 z-30 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lifted"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <li key={opt} role="option" aria-selected={sort === opt}>
                  <button
                    type="button"
                    onClick={() => {
                      setSort(opt);
                      setSortOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm",
                      sort === opt ? "bg-blush text-rose-deep" : "text-ink hover:bg-sand",
                    )}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => setBookmarkedOnly((v) => !v)}
          aria-pressed={bookmarkedOnly}
          aria-label="Show bookmarked only"
          className={cn(
            "flex size-12 items-center justify-center rounded-full border shadow-soft transition-colors",
            bookmarkedOnly
              ? "border-rose bg-blush text-rose-deep"
              : "border-border bg-card text-ink",
          )}
        >
          <Bookmark className={cn("size-[18px]", bookmarkedOnly && "fill-rose-deep")} aria-hidden />
        </button>
      </div>

      {/* Results */}
      {visible.length === 0 ? (
        <div className="flex min-h-[30dvh] flex-col items-center justify-center gap-3 text-center">
          <p className="display text-xl text-ink">Nothing matches</p>
          <p className="max-w-xs text-sm text-stone">
            No memories match your search. Clear it to see everything again.
          </p>
          {(query || bookmarkedOnly) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setBookmarkedOnly(false);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sand px-4 text-sm font-medium text-ink"
            >
              <X className="size-4" aria-hidden /> Clear search
            </button>
          )}
        </div>
      ) : (
        groups.map(([label, list]) => (
          <section key={label} aria-label={`Memories from ${label}`} className="mt-14 first:mt-12">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="chapter-heading text-[40px] leading-none text-ink/85">
                {label}
              </h2>
              <p className="shrink-0 text-xs text-stone">
                {list.length} {list.length === 1 ? "memory" : "memories"}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
              {list.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}