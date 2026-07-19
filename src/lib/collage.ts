/**
 * Auto Collage Engine.
 *
 * A pure, deterministic layout algorithm: given photos (with intrinsic
 * dimensions), a container width, and a seed, it produces rows of
 * exactly-sized tiles. Properties:
 *
 * - Aspect ratios are preserved exactly (justified-rows technique:
 *   photos in a row share one height, scaled so widths fill the row).
 * - Rows mix 1 / 2 / 3 columns depending on orientation mix — a lone
 *   landscape favorite can become a full-bleed hero row.
 * - Target row heights jitter per-row via a seeded PRNG, so the rhythm
 *   feels organic and never repeats — but the same album always
 *   renders the same collage (seed = album id).
 * - Pure function ⇒ trivially unit-testable.
 */
import type { Photo } from "@/types";
import { hashString, mulberry32 } from "./random";

export interface CollageTile {
  photo: Photo;
  /** Index of the photo in the original input array (for the viewer). */
  index: number;
  width: number;
  height: number;
}

export interface CollageRow {
  tiles: CollageTile[];
  height: number;
}

export interface CollageOptions {
  gap?: number; // px between tiles — spec: 16
  seed?: string;
}

const GAP_DEFAULT = 16;

export function computeCollage(
  photos: Photo[],
  containerWidth: number,
  { gap = GAP_DEFAULT, seed = "momento" }: CollageOptions = {},
): CollageRow[] {
  if (photos.length === 0 || containerWidth <= 0) return [];

  const rng = mulberry32(hashString(seed));
  const rows: CollageRow[] = [];

  // Base row height scales with viewport: ~3 tiles per row on desktop,
  // ~2 on mobile, clamped to sane bounds.
  const base = clamp(containerWidth / 3.1, 170, 320);

  let i = 0;
  while (i < photos.length) {
    const remaining = photos.length - i;
    const first = photos[i]!;
    const firstAr = first.width / first.height;

    // Occasionally promote a landscape favorite (or, rarely, any
    // landscape) to a full-width hero row.
    const heroChance = first.isFavorite ? 0.5 : 0.12;
    if (firstAr > 1.15 && remaining > 1 && rng() < heroChance) {
      const height = Math.min(containerWidth / firstAr, containerWidth * 0.72);
      rows.push({
        tiles: [{ photo: first, index: i, width: height * firstAr, height }],
        height,
      });
      i += 1;
      continue;
    }

    // Jittered target height for this row (±22%).
    const target = base * (0.78 + rng() * 0.44);

    // Greedily add photos until the justified height drops to target.
    const tiles: { photo: Photo; index: number; ar: number }[] = [];
    let arSum = 0;
    while (i < photos.length && tiles.length < 3) {
      const p = photos[i]!;
      const ar = p.width / p.height;
      const nextArSum = arSum + ar;
      const nextHeight =
        (containerWidth - gap * tiles.length) / nextArSum;
      if (tiles.length > 0 && nextHeight < target * 0.72) break;
      tiles.push({ photo: p, index: i, ar });
      arSum = nextArSum;
      i += 1;
      if (nextHeight <= target) break;
    }

    const innerWidth = containerWidth - gap * (tiles.length - 1);
    let height = innerWidth / arSum;

    // Don't let a sparse final row blow up huge.
    const isLastRow = i >= photos.length;
    if (isLastRow && height > base * 1.35) height = base * 1.15;

    rows.push({
      tiles: tiles.map((t) => ({
        photo: t.photo,
        index: t.index,
        width: t.ar * height,
        height,
      })),
      height,
    });
  }

  return rows;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
