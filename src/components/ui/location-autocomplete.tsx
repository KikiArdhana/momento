"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export interface PlaceSelection {
  label: string;
  latitude: number;
  longitude: number;
}

type LocationAutocompleteProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Fired when the person picks a real suggestion (coords included). */
  onSelect: (place: PlaceSelection) => void;
  placeholder?: string;
};

type Suggestion = {
  key: string;
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
};

/**
 * Search-as-you-type place picker backed by Photon (komoot) — a free,
 * keyless OSM autocomplete API that includes small POIs (restaurants,
 * cafés, landmarks). Debounced 300ms, aborts stale requests, full
 * keyboard support (↑ ↓ Enter Esc).
 */
export function LocationAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
}: LocationAutocompleteProps) {
  const listboxId = useId();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  // Debounced search.
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          features?: {
            properties?: Record<string, string>;
            geometry?: { coordinates?: [number, number] };
          }[];
        };
        const next = (data.features ?? [])
          .map(toSuggestion)
          .filter((s): s is Suggestion => s !== null);
        setSuggestions(dedupe(next));
        setOpen(next.length > 0);
        setHighlight(-1);
      } catch {
        // Aborted or offline — keep whatever the person typed.
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function pick(s: Suggestion) {
    const label = s.detail ? `${s.name}, ${s.detail}` : s.name;
    skipNextSearch.current = true; // don't re-search the picked label
    onChange(label);
    onSelect({ label, latitude: s.latitude, longitude: s.longitude });
    setOpen(false);
    setSuggestions([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      const s = suggestions[highlight];
      if (s) pick(s);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        maxLength={200}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={cn(inputClass, "pr-10")}
      />
      {loading && (
        <Loader2
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-stone"
          aria-hidden
        />
      )}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Place suggestions"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lifted"
        >
          {suggestions.map((s, i) => (
            <li key={s.key} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onClick={() => pick(s)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left",
                  i === highlight ? "bg-blush" : "hover:bg-sand",
                )}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-rose" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {s.name}
                  </span>
                  {s.detail && (
                    <span className="block truncate text-xs text-stone">{s.detail}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
          <li className="px-3.5 pb-1 pt-1.5 text-[10px] text-stone/70">
            Suggestions by OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function toSuggestion(f: {
  properties?: Record<string, string>;
  geometry?: { coordinates?: [number, number] };
}): Suggestion | null {
  const p = f.properties ?? {};
  const coords = f.geometry?.coordinates;
  const name = p.name || p.street;
  if (!name || !coords) return null;
  const [longitude, latitude] = coords;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;

  const detail = [p.district, p.city ?? p.county, p.state, p.country]
    .filter((part): part is string => Boolean(part) && part !== name)
    .filter((part, i, arr) => arr.indexOf(part) === i)
    .slice(0, 3)
    .join(", ");

  return {
    key: `${name}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
    name,
    detail,
    latitude,
    longitude,
  };
}

function dedupe(list: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    if (seen.has(s.key)) return false;
    seen.add(s.key);
    return true;
  });
}