import { useEffect, useMemo, useState } from "react";

import type { Member } from "../domain/game";
import { hashSeedUint32 } from "../services/utils";
import { readyPortraitPath, selectPortraitAsset } from "./date-presentation-signals";

/**
 * Per-character gradient derived from the neutral portrait. Used as a soft
 * tint behind the standee on member cards and as the modal halo. Three RGB
 * stops are sampled from the dominant non-neutral pixels and pastelized so
 * the palette stays in the Aura range instead of turning saturated.
 */
export type PortraitPalette = {
  from: string;
  via: string;
  to: string;
};

const FALLBACK_PALETTE: PortraitPalette = {
  from: "rgb(254, 226, 232)",
  via: "rgb(252, 232, 248)",
  to: "rgb(236, 232, 255)",
};

const PALETTE_CACHE = new Map<string, PortraitPalette>();
const PENDING = new Map<string, Promise<PortraitPalette | undefined>>();

const FALLBACK_VARIANTS: readonly PortraitPalette[] = [
  { from: "rgb(254, 226, 232)", via: "rgb(252, 232, 248)", to: "rgb(236, 232, 255)" },
  { from: "rgb(255, 240, 217)", via: "rgb(254, 226, 232)", to: "rgb(252, 232, 248)" },
  { from: "rgb(224, 240, 255)", via: "rgb(236, 232, 255)", to: "rgb(254, 226, 232)" },
  { from: "rgb(220, 246, 232)", via: "rgb(224, 240, 255)", to: "rgb(236, 232, 255)" },
  { from: "rgb(236, 232, 255)", via: "rgb(252, 232, 248)", to: "rgb(255, 240, 217)" },
  { from: "rgb(252, 232, 248)", via: "rgb(254, 226, 232)", to: "rgb(224, 240, 255)" },
];

function fallbackFor(seed: string): PortraitPalette {
  const variants = FALLBACK_VARIANTS;
  return variants[hashSeedUint32(`palette:${seed}`) % variants.length] ?? FALLBACK_PALETTE;
}

export function memberPortraitPath(member: Member): string | undefined {
  return readyPortraitPath(selectPortraitAsset(member, "portrait", "neutral"));
}

export function paletteToCssVars(palette: PortraitPalette): React.CSSProperties {
  return {
    "--char-from": palette.from,
    "--char-via": palette.via,
    "--char-to": palette.to,
  } as React.CSSProperties;
}

export function usePortraitPalette(member: Member): PortraitPalette {
  const path = useMemo(() => memberPortraitPath(member), [member]);
  const seedFallback = useMemo(() => fallbackFor(member.id), [member.id]);

  const [palette, setPalette] = useState<PortraitPalette>(() => {
    if (path !== undefined && PALETTE_CACHE.has(path)) {
      return PALETTE_CACHE.get(path) ?? seedFallback;
    }
    return seedFallback;
  });

  useEffect(() => {
    if (path === undefined) {
      setPalette(seedFallback);
      return;
    }
    const cached = PALETTE_CACHE.get(path);
    if (cached !== undefined) {
      setPalette(cached);
      return;
    }
    let cancelled = false;
    extractPaletteFromImage(path).then((sampled) => {
      if (cancelled) return;
      if (sampled !== undefined) {
        setPalette(sampled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [path, seedFallback]);

  return palette;
}

export function extractPaletteFromImage(path: string): Promise<PortraitPalette | undefined> {
  const cached = PALETTE_CACHE.get(path);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  const pending = PENDING.get(path);
  if (pending !== undefined) {
    return pending;
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(undefined);
  }

  const promise = loadAndSample(path)
    .then((palette) => {
      if (palette !== undefined) {
        PALETTE_CACHE.set(path, palette);
      }
      return palette;
    })
    .finally(() => {
      PENDING.delete(path);
    });
  PENDING.set(path, promise);
  return promise;
}

function loadAndSample(path: string): Promise<PortraitPalette | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        resolve(samplePalette(image));
      } catch {
        resolve(undefined);
      }
    };
    image.onerror = () => resolve(undefined);
    image.src = path;
  });
}

type Bucket = {
  r: number;
  g: number;
  b: number;
  count: number;
};

function samplePalette(image: HTMLImageElement): PortraitPalette | undefined {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  if (naturalWidth <= 0 || naturalHeight <= 0) return undefined;

  const targetWidth = 80;
  const targetHeight = Math.max(1, Math.round((naturalHeight / naturalWidth) * targetWidth));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx === null) return undefined;
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  } catch {
    return undefined;
  }
  const data = imageData.data;

  const buckets = new Map<string, Bucket>();
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const a = data[index + 3] ?? 0;
    if (a < 200) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    const sat = max - min;

    if (lum > 238) continue;
    if (lum < 26) continue;
    if (sat < 16 && lum > 210) continue;

    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const existing = buckets.get(key);
    if (existing !== undefined) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  if (sorted.length === 0) return undefined;

  const picks: { r: number; g: number; b: number }[] = [];
  for (const bucket of sorted) {
    if (picks.length >= 3) break;
    const r = Math.round(bucket.r / bucket.count);
    const g = Math.round(bucket.g / bucket.count);
    const b = Math.round(bucket.b / bucket.count);
    if (picks.some((pick) => colorDistance(pick, { r, g, b }) < 60)) {
      continue;
    }
    picks.push({ r, g, b });
  }
  if (picks.length === 0) return undefined;
  while (picks.length < 3) {
    picks.push(picks[picks.length - 1]!);
  }

  return {
    from: pastelize(picks[0]!, 0.32),
    via: pastelize(picks[1]!, 0.28),
    to: pastelize(picks[2]!, 0.34),
  };
}

function pastelize(color: { r: number; g: number; b: number }, saturation: number): string {
  const r = Math.round(color.r * saturation + 255 * (1 - saturation));
  const g = Math.round(color.g * saturation + 255 * (1 - saturation));
  const b = Math.round(color.b * saturation + 255 * (1 - saturation));
  return `rgb(${r}, ${g}, ${b})`;
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
