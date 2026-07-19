"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { geocodeLocation } from "@/lib/geocode";

export interface AlbumFormState {
  error: string | null;
}

export async function updateAlbum(
  albumId: string,
  _prev: AlbumFormState,
  formData: FormData,
): Promise<AlbumFormState> {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give this memory a title." };

  // Coordinates: exact ones from a picked suggestion (hidden fields)
  // when available; otherwise geocode the typed text. Re-saving an old
  // album without a pin fixes it automatically.
  const location = String(formData.get("location") ?? "").trim() || null;
  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lngRaw = String(formData.get("longitude") ?? "").trim();
  const picked =
    latRaw && lngRaw && !Number.isNaN(Number(latRaw)) && !Number.isNaN(Number(lngRaw))
      ? { latitude: Number(latRaw), longitude: Number(lngRaw) }
      : null;
  const coords = picked ?? (location ? await geocodeLocation(location) : null);

  const { error } = await supabase
    .from("albums")
    .update({
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      location,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      date: String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10),
    })
    .eq("id", albumId);

  if (error) return { error: "Couldn't save changes. Try again." };

  revalidatePath("/");
  revalidatePath("/map");
  revalidatePath(`/albums/${albumId}`);
  redirect(`/albums/${albumId}`);
}

export async function deleteAlbum(albumId: string) {
  const supabase = await createClient();

  // Remove storage objects first (seed rows have no real objects).
  const { data: photoRows } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("album_id", albumId);
  const paths = (photoRows ?? [])
    .map((p) => p.storage_path)
    .filter((p) => !p.startsWith("seed/"));
  if (paths.length > 0) {
    await supabase.storage.from("photos").remove(paths);
  }

  // Row cascade removes photos, tags links, and bookmarks.
  const { error } = await supabase.from("albums").delete().eq("id", albumId);
  if (error) throw error;

  revalidatePath("/");
  redirect("/");
}