"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Album } from "@/types";
import { updateAlbum, type AlbumFormState } from "../actions";
import { Field, inputClass } from "@/components/ui/field";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";

const initialState: AlbumFormState = { error: null };

export function EditAlbumForm({ album }: { album: Album }) {
  const action = updateAlbum.bind(null, album.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [location, setLocation] = useState(album.location ?? "");
  // Keep the album's existing pin unless the location text changes.
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: album.latitude,
    lng: album.longitude,
  });

  return (
    <form action={formAction} className="mt-6 max-w-xl space-y-5">
      <Field label="Title" htmlFor="title">
        <input id="title" name="title" required maxLength={120} defaultValue={album.title} className={inputClass} />
      </Field>
      <Field label="Description" htmlFor="description">
        <textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={album.description ?? ""} className={inputClass} />
      </Field>
      <Field
        label="Location"
        htmlFor="location"
        hint="Start typing and pick a place — even cafés and restaurants"
      >
        <LocationAutocomplete
          id="location"
          value={location}
          onChange={(v) => {
            setLocation(v);
            setCoords({ lat: null, lng: null }); // free-typed → re-geocode on save
          }}
          onSelect={(place) => {
            setLocation(place.label);
            setCoords({ lat: place.latitude, lng: place.longitude });
          }}
          placeholder="Dieng, Wonosobo"
        />
        {/* Submitted alongside the visible field */}
        <input type="hidden" name="location" value={location} />
        <input type="hidden" name="latitude" value={coords.lat ?? ""} />
        <input type="hidden" name="longitude" value={coords.lng ?? ""} />
      </Field>
      <Field label="Date" htmlFor="date">
        <input id="date" name="date" type="date" required defaultValue={album.date} className={inputClass} />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-paper shadow-soft transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save changes
        </button>
        <Link
          href={`/albums/${album.id}`}
          className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 text-[15px] font-medium text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}