import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbum } from "@/services/albums";
import { EditAlbumForm } from "./edit-album-form";

export const metadata: Metadata = { title: "Edit memory" };

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  return (
    <div className="pt-8 md:pt-12">
      <h1 className="chapter-heading text-3xl text-ink">Edit memory</h1>
      <EditAlbumForm album={album} />
    </div>
  );
}
