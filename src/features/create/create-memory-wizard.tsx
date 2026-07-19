"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Star,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { compressImage, fileExtension } from "@/lib/image";
import { geocodeLocation } from "@/lib/geocode";
import { Field, inputClass } from "@/components/ui/field";
import {
  LocationAutocomplete,
  type PlaceSelection,
} from "@/components/ui/location-autocomplete";
import { cn } from "@/lib/utils";

type Draft = {
  file: File;
  previewUrl: string;
  favorite: boolean;
};

type Details = {
  title: string;
  description: string;
  location: string;
  date: string;
  tags: string;
};

type UploadStatus = "waiting" | "compressing" | "uploading" | "done" | "error";

const STEPS = ["Photos", "Details", "Create"] as const;

export function CreateMemoryWizard() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [details, setDetails] = useState<Details>({
    title: "",
    description: "",
    location: "",
    date: new Date().toISOString().slice(0, 10),
    tags: "",
  });
  // Coordinates from a picked suggestion — exact, no geocoding needed.
  const [pickedPlace, setPickedPlace] = useState<PlaceSelection | null>(null);
  const [statuses, setStatuses] = useState<UploadStatus[]>([]);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Release object URLs on unmount.
  useEffect(
    () => () => drafts.forEach((d) => URL.revokeObjectURL(d.previewUrl)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const addFiles = useCallback((files: FileList | File[]) => {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      toast.error("Only image files can be added.");
      return;
    }
    setDrafts((prev) => [
      ...prev,
      ...images.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        favorite: false,
      })),
    ]);
  }, []);

  function removeDraft(index: number) {
    setDrafts((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function toggleFavorite(index: number) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, favorite: !d.favorite } : d)),
    );
  }

  async function createMemory() {
    if (creating) return;
    setCreating(true);
    setStep(2);
    setStatuses(drafts.map(() => "waiting"));

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Your session expired. Sign in again.");
      setCreating(false);
      return;
    }

    // 1. Coordinates: exact ones from the picked suggestion when
    //    available; otherwise geocode whatever was typed as a fallback.
    const coords =
      pickedPlace ??
      (details.location.trim() ? await geocodeLocation(details.location) : null);
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .insert({
        user_id: user.id,
        title: details.title.trim(),
        description: details.description.trim() || null,
        location: details.location.trim() || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        date: details.date,
      })
      .select("id")
      .single();

    if (albumError || !album) {
      toast.error("Couldn't create the memory. Try again.");
      setCreating(false);
      setStep(1);
      return;
    }

    // 2. Compress + upload each photo, collecting rows.
    const rows: {
      album_id: string;
      user_id: string;
      storage_path: string;
      url: string;
      width: number;
      height: number;
      is_favorite: boolean;
      size_bytes: number;
    }[] = [];

    const setStatus = (i: number, s: UploadStatus) =>
      setStatuses((prev) => prev.map((v, idx) => (idx === i ? s : v)));

    let failures = 0;
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i]!;
      try {
        setStatus(i, "compressing");
        const compressed = await compressImage(draft.file);

        setStatus(i, "uploading");
        const path = `${user.id}/${album.id}/${crypto.randomUUID()}.${fileExtension(compressed.type)}`;
        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(path, compressed.blob, { contentType: compressed.type });
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
        rows.push({
          album_id: album.id,
          user_id: user.id,
          storage_path: path,
          url: pub.publicUrl,
          width: compressed.width,
          height: compressed.height,
          is_favorite: draft.favorite,
          size_bytes: compressed.blob.size,
        });
        setStatus(i, "done");
      } catch {
        failures += 1;
        setStatus(i, "error");
      }
    }

    if (rows.length === 0) {
      await supabase.from("albums").delete().eq("id", album.id);
      toast.error("No photos could be uploaded. Check your connection and try again.");
      setCreating(false);
      setStep(0);
      return;
    }

    // 3. Photo rows + cover (first favorite, else first photo).
    const { error: photosError } = await supabase.from("photos").insert(rows);
    if (photosError) {
      toast.error("Photos uploaded but couldn't be saved. Try again.");
      setCreating(false);
      return;
    }
    const cover = rows.find((r) => r.is_favorite) ?? rows[0]!;
    await supabase.from("albums").update({ cover_image: cover.url }).eq("id", album.id);

    // 4. Tags.
    const tagNames = [
      ...new Set(
        details.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0 && t.length <= 40),
      ),
    ];
    if (tagNames.length > 0) {
      const { data: tagRows } = await supabase
        .from("tags")
        .upsert(
          tagNames.map((name) => ({ user_id: user.id, name })),
          { onConflict: "user_id,name", ignoreDuplicates: false },
        )
        .select("id");
      if (tagRows && tagRows.length > 0) {
        await supabase
          .from("album_tags")
          .insert(tagRows.map((t) => ({ album_id: album.id, tag_id: t.id })));
      }
    }

    if (failures > 0) {
      toast.warning(`${failures} ${failures === 1 ? "photo" : "photos"} failed to upload.`);
    } else {
      toast.success("Memory created");
    }
    router.push(`/albums/${album.id}`);
    router.refresh();
  }

  const doneCount = statuses.filter((s) => s === "done" || s === "error").length;
  const progress = drafts.length === 0 ? 0 : Math.round((doneCount / drafts.length) * 100);

  return (
    <div className="pt-8 md:pt-12">
      {/* Stepper */}
      <ol className="flex items-center gap-2" aria-label="Create memory steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={step === i ? "step" : undefined}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium",
                i < step && "bg-sand text-stone",
                i === step && "bg-blush text-rose-deep",
                i > step && "text-stone/60",
              )}
            >
              {i < step ? <Check className="size-3.5" aria-hidden /> : `${i + 1}.`} {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mt-8"
        >
          {/* ---------- Step 1: photos ---------- */}
          {step === 0 && (
            <div>
              <div
                role="button"
                tabIndex={0}
                aria-label="Add photos"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                  dragOver ? "border-rose bg-blush/50" : "border-border bg-card",
                )}
              >
                <UploadCloud className="size-8 text-rose" aria-hidden />
                <div>
                  <p className="font-medium text-ink">Drop photos here, or tap to browse</p>
                  <p className="mt-1 text-sm text-stone">
                    They'll be compressed before upload. Tap a photo to mark it a favorite.
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {drafts.length > 0 && (
                <>
                  <p className="mt-6 text-sm text-stone">
                    {drafts.length} {drafts.length === 1 ? "photo" : "photos"} selected
                  </p>
                  <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {drafts.map((d, i) => (
                      <li key={d.previewUrl} className="group relative aspect-square overflow-hidden rounded-lg bg-sand">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={d.previewUrl}
                          alt={`Selected photo ${i + 1}`}
                          className="size-full cursor-pointer object-cover"
                          onClick={() => toggleFavorite(i)}
                        />
                        {d.favorite && (
                          <span className="pointer-events-none absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-paper/85">
                            <Star className="size-3.5 fill-rose text-rose" aria-hidden />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDraft(i)}
                          aria-label={`Remove photo ${i + 1}`}
                          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/50 text-white"
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <button
                type="button"
                disabled={drafts.length === 0}
                onClick={() => setStep(1)}
                className="mt-8 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-medium text-paper shadow-soft transition-transform active:scale-[0.99] disabled:opacity-40"
              >
                Continue <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          )}

          {/* ---------- Step 2: details ---------- */}
          {step === 1 && (
            <form
              className="max-w-xl space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void createMemory();
              }}
            >
              <Field label="Title" htmlFor="c-title">
                <input
                  id="c-title"
                  required
                  maxLength={120}
                  value={details.title}
                  onChange={(e) => setDetails({ ...details, title: e.target.value })}
                  placeholder="Dieng Trip"
                  className={inputClass}
                />
              </Field>
              <Field label="Description" htmlFor="c-description">
                <textarea
                  id="c-description"
                  rows={3}
                  maxLength={2000}
                  value={details.description}
                  onChange={(e) => setDetails({ ...details, description: e.target.value })}
                  placeholder="What made this one worth remembering?"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Location"
                htmlFor="c-location"
                hint="Start typing and pick a place — even cafés and restaurants"
              >
                <LocationAutocomplete
                  id="c-location"
                  value={details.location}
                  onChange={(v) => {
                    setDetails({ ...details, location: v });
                    setPickedPlace(null); // typing again invalidates the pick
                  }}
                  onSelect={(place) => {
                    setDetails((d) => ({ ...d, location: place.label }));
                    setPickedPlace(place);
                  }}
                  placeholder="Dieng, Wonosobo"
                />
              </Field>
              <Field label="Date" htmlFor="c-date">
                <input
                  id="c-date"
                  type="date"
                  required
                  value={details.date}
                  onChange={(e) => setDetails({ ...details, date: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Tags" htmlFor="c-tags" hint="Separate with commas — travel, friends">
                <input
                  id="c-tags"
                  value={details.tags}
                  onChange={(e) => setDetails({ ...details, tags: e.target.value })}
                  placeholder="travel, nature"
                  className={inputClass}
                />
              </Field>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="inline-flex h-13 items-center gap-2 rounded-xl border border-border bg-card px-6 text-[15px] font-medium text-ink"
                >
                  <ArrowLeft className="size-4" aria-hidden /> Back
                </button>
                <button
                  type="submit"
                  className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-medium text-paper shadow-soft transition-transform active:scale-[0.99]"
                >
                  Create memory
                </button>
              </div>
            </form>
          )}

          {/* ---------- Step 3: upload progress ---------- */}
          {step === 2 && (
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blush">
                {progress < 100 ? (
                  <Loader2 className="size-7 animate-spin text-rose-deep" aria-hidden />
                ) : (
                  <ImagePlus className="size-7 text-rose-deep" aria-hidden />
                )}
              </div>
              <h2 className="display mt-4 text-2xl text-ink">
                {progress < 100 ? "Building your memory…" : "Opening your album…"}
              </h2>
              <p className="mt-1 text-sm text-stone">
                {doneCount} of {drafts.length} photos uploaded
              </p>

              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
                className="mt-6 h-2 overflow-hidden rounded-full bg-sand"
              >
                <div
                  className="h-full rounded-full bg-rose transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <ul className="mt-6 grid grid-cols-6 gap-2" aria-label="Per-photo status">
                {drafts.map((d, i) => (
                  <li key={d.previewUrl} className="relative aspect-square overflow-hidden rounded-md bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.previewUrl} alt="" className="size-full object-cover" />
                    <span
                      className={cn(
                        "absolute inset-0 flex items-center justify-center transition-opacity",
                        statuses[i] === "done" ? "bg-black/0" : "bg-black/40",
                      )}
                    >
                      {statuses[i] === "compressing" || statuses[i] === "uploading" ? (
                        <Loader2 className="size-4 animate-spin text-white" aria-hidden />
                      ) : statuses[i] === "error" ? (
                        <X className="size-4 text-white" aria-label="Failed" />
                      ) : statuses[i] === "done" ? (
                        <Check className="size-4 text-white drop-shadow" aria-label="Uploaded" />
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}