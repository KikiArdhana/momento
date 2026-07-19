/**
 * Client-side image compression: downscale to a max edge and re-encode
 * before upload. Keeps memory sane and uploads fast on mobile data.
 */

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
}

const MAX_EDGE = 2048;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap) bitmap.close();

  const type = "image/webp";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode image."))),
      type,
      QUALITY,
    );
  });

  // If webp encoding somehow produced a larger file, keep the original.
  if (blob.size >= file.size && scale === 1) {
    return { blob: file, width, height, type: file.type };
  }
  return { blob, width, height, type };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // e.g. HEIC in some browsers — fall through to <img> decoding
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function fileExtension(type: string): string {
  switch (type) {
    case "image/webp": return "webp";
    case "image/png": return "png";
    case "image/avif": return "avif";
    default: return "jpg";
  }
}
