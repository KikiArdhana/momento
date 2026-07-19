import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Pencil } from "lucide-react";
import { getAlbum, getAlbumPhotos } from "@/services/albums";
import { formatDate } from "@/lib/format";
import { AlbumGallery } from "@/features/photos/album-gallery";
import { DeleteAlbumButton } from "./delete-album-button";
import { AddPhotosButton } from "./add-photos-button";
import { DownloadAlbumButton } from "./download-album-button";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const album = await getAlbum(id);
  return { title: album?.title ?? "Memory" };
}

export default async function AlbumDetailPage({ params }: Params) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  const { photos, total } = await getAlbumPhotos(id);

  return (
    <article className="pt-4 md:pt-8">
      {/* Hero */}
      <header className="relative -mx-[var(--gutter)] overflow-hidden md:mx-0 md:rounded-xl">
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] md:aspect-[21/10]">
          {album.coverImage ? (
            <Image
              src={album.coverImage}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          ) : (
            <div className="size-full bg-sand" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/25" />

          {/* Top actions */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Link
              href="/"
              aria-label="Back to home"
              className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </Link>
            <div className="flex gap-2">
              <AddPhotosButton albumId={album.id} />
              <DownloadAlbumButton
                album={{
                  id: album.id,
                  title: album.title,
                  description: album.description,
                  location: album.location,
                  date: album.date,
                }}
              />
              <Link
                href={`/albums/${album.id}/edit`}
                aria-label="Edit memory"
                className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
              >
                <Pencil className="size-[18px]" aria-hidden />
              </Link>
              <DeleteAlbumButton albumId={album.id} />
            </div>
          </div>

          {/* Title block */}
          <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-8">
            <h1 className="chapter-heading text-4xl leading-tight md:text-5xl">
              {album.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden />
                {formatDate(album.date)}
              </span>
              {album.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden />
                  {album.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Description */}
      {album.description && (
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink/85">
          {album.description}
        </p>
      )}

      {/* The collage */}
      <div className="mt-8">
        <AlbumGallery
          key={`${album.id}-${total}`}
          albumId={album.id}
          initialPhotos={photos}
          total={total}
          location={album.location}
        />
      </div>
    </article>
  );
}