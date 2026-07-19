/**
 * Album poster generator — renders an aesthetic, shareable JPG of an
 * album: paper background, serif title, meta line, short description,
 * and a mini collage (reusing the Auto Collage Engine), finished with
 * a small footer. Pure client-side canvas; no server involved.
 */
import type { Photo } from "@/types";
import { computeCollage } from "@/lib/collage";

export interface PosterAlbum {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  date: string; // ISO
}

const W = 1200;
const H = 1600;
const MARGIN = 90;
const GAP = 18;
const RADIUS = 26;

const PAPER = "#fdfbf8";
const INK = "#2c2521";
const STONE = "#8a7f76";
const ROSE = "#c08b80";
const BORDER = "#ece4d8";

export async function generateAlbumPoster(
  album: PosterAlbum,
  photos: Photo[],
): Promise<Blob> {
  const [display, sans] = await resolveFonts();
  const images = await loadImages(photos);
  if (images.size === 0) throw new Error("No photos could be loaded.");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  // Paper
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  let y = MARGIN + 10;
  const innerW = W - MARGIN * 2;

  // Eyebrow
  ctx.fillStyle = ROSE;
  ctx.font = `600 22px ${sans}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("A MOMENTO MEMORY", MARGIN, y);
  ctx.letterSpacing = "0px";
  y += 58;

  // Title (italic serif, up to 2 lines)
  ctx.fillStyle = INK;
  ctx.font = `italic 600 84px ${display}`;
  y = drawWrapped(ctx, album.title, MARGIN, y, innerW, 92, 2) + 18;

  // Meta line
  const meta = [formatPosterDate(album.date), album.location]
    .filter(Boolean)
    .join("  ·  ");
  ctx.fillStyle = STONE;
  ctx.font = `500 30px ${sans}`;
  ctx.fillText(meta, MARGIN, y);
  y += 30;

  // Description (up to 3 lines)
  if (album.description) {
    y += 28;
    ctx.fillStyle = STONE;
    ctx.font = `400 30px ${sans}`;
    y = drawWrapped(ctx, album.description, MARGIN, y, innerW, 44, 3);
  }
  y += 42;

  // Mini collage — fill remaining space above the footer.
  const footerH = 110;
  const collageBottom = H - MARGIN - footerH;
  const usable = photos.filter((p) => images.has(p.id));
  const rows = computeCollage(usable.slice(0, 9), innerW, {
    gap: GAP,
    seed: `poster-${album.id}`,
  });

  for (const row of rows) {
    if (y + row.height > collageBottom) break;
    let x = MARGIN;
    for (const tile of row.tiles) {
      const img = images.get(tile.photo.id);
      if (img) {
        drawCover(ctx, img, x, y, tile.width, row.height, RADIUS);
      }
      x += tile.width + GAP;
    }
    y += row.height + GAP;
  }

  // Footer
  const fy = H - MARGIN - 44;
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, fy - 34);
  ctx.lineTo(W - MARGIN, fy - 34);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = `italic 600 34px ${display}`;
  ctx.fillText("Momento", MARGIN, fy + 8);

  ctx.fillStyle = STONE;
  ctx.font = `500 26px ${sans}`;
  const right = `${photos.length} ${photos.length === 1 ? "photo" : "photos"} · ${album.date.slice(0, 4)}`;
  ctx.textAlign = "right";
  ctx.fillText(right, W - MARGIN, fy + 8);
  ctx.textAlign = "left";

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export image."))),
      "image/jpeg",
      0.92,
    );
  });
}

/* ------------------------------------------------------------------ */

/** Reads the real (next/font) family names from the CSS variables. */
async function resolveFonts(): Promise<[string, string]> {
  await document.fonts.ready;
  const styles = getComputedStyle(document.documentElement);
  const display =
    styles.getPropertyValue("--font-fraunces").trim() || "Georgia, serif";
  const sans =
    styles.getPropertyValue("--font-figtree").trim() || "system-ui, sans-serif";
  return [display, sans];
}

async function loadImages(photos: Photo[]): Promise<Map<string, HTMLImageElement>> {
  const entries = await Promise.all(
    photos.slice(0, 12).map(
      (p) =>
        new Promise<[string, HTMLImageElement] | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous"; // required for canvas export
          img.onload = () => resolve([p.id, img]);
          img.onerror = () => resolve(null);
          img.src = p.url;
        }),
    ),
  );
  return new Map(entries.filter((e): e is [string, HTMLImageElement] => e !== null));
}

/** drawImage with cover-crop + rounded corners. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

/** Word-wraps text; returns the y after the last line drawn. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let lines = 0;

  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]!;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines += 1;
      if (lines === maxLines) {
        ctx.fillText(truncateToWidth(ctx, `${line}…`, maxWidth), x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = words[i]!;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(truncateToWidth(ctx, line, maxWidth), x, y);
    y += lineHeight;
  }
  return y;
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

function formatPosterDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}