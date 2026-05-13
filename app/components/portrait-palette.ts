import { type CSSProperties, useEffect, useMemo, useState } from "react";

import type { Member } from "../domain/game";
import { hashSeedUint32 } from "../services/utils";
import { readyPortraitPath, selectPortraitAsset } from "./date-presentation-signals";

/**
 * Per-character gradient derived from the neutral portrait. Used as a soft
 * tint behind the standee on member cards and as the modal halo. The sampler
 * favors chroma and color separation over raw pixel area so small design
 * accents can steer the Aura wash.
 */
export type PortraitPalette = {
  from: string;
  via: string;
  to: string;
  accent: string;
};

const FALLBACK_PALETTE: PortraitPalette = {
  from: "rgb(254, 226, 232)",
  via: "rgb(252, 232, 248)",
  to: "rgb(236, 232, 255)",
  accent: "rgb(244, 114, 182)",
};

const PALETTE_CACHE = new Map<string, PortraitPalette>();
const PENDING = new Map<string, Promise<PortraitPalette | undefined>>();

const FALLBACK_VARIANTS: readonly PortraitPalette[] = [
  {
    from: "rgb(254, 226, 232)",
    via: "rgb(252, 232, 248)",
    to: "rgb(236, 232, 255)",
    accent: "rgb(244, 114, 182)",
  },
  {
    from: "rgb(255, 240, 217)",
    via: "rgb(254, 226, 232)",
    to: "rgb(252, 232, 248)",
    accent: "rgb(251, 146, 60)",
  },
  {
    from: "rgb(224, 240, 255)",
    via: "rgb(236, 232, 255)",
    to: "rgb(254, 226, 232)",
    accent: "rgb(96, 165, 250)",
  },
  {
    from: "rgb(220, 246, 232)",
    via: "rgb(224, 240, 255)",
    to: "rgb(236, 232, 255)",
    accent: "rgb(52, 211, 153)",
  },
  {
    from: "rgb(236, 232, 255)",
    via: "rgb(252, 232, 248)",
    to: "rgb(255, 240, 217)",
    accent: "rgb(168, 85, 247)",
  },
  {
    from: "rgb(252, 232, 248)",
    via: "rgb(254, 226, 232)",
    to: "rgb(224, 240, 255)",
    accent: "rgb(217, 70, 239)",
  },
];

function fallbackFor(seed: string): PortraitPalette {
  const variants = FALLBACK_VARIANTS;
  return variants[hashSeedUint32(`palette:${seed}`) % variants.length] ?? FALLBACK_PALETTE;
}

export function memberPortraitPath(member: Member): string | undefined {
  return readyPortraitPath(selectPortraitAsset(member, "portrait", "neutral"));
}

type PaletteCssVarName =
  | "--char-from"
  | "--char-via"
  | "--char-to"
  | "--char-accent"
  | "--char-from-wash"
  | "--char-via-wash"
  | "--char-to-wash"
  | "--char-accent-wash"
  | "--char-accent-glow";

type PortraitPaletteCssVars = CSSProperties & Record<PaletteCssVarName, string>;

export function paletteToCssVars(palette: PortraitPalette): CSSProperties {
  const vars: PortraitPaletteCssVars = {
    "--char-from": palette.from,
    "--char-via": palette.via,
    "--char-to": palette.to,
    "--char-accent": palette.accent,
    "--char-from-wash": rgbCssWithAlpha(palette.from, 0.5),
    "--char-via-wash": rgbCssWithAlpha(palette.via, 0.46),
    "--char-to-wash": rgbCssWithAlpha(palette.to, 0.5),
    "--char-accent-wash": rgbCssWithAlpha(palette.accent, 0.38),
    "--char-accent-glow": rgbCssWithAlpha(palette.accent, 0.5),
  };
  return vars;
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
  score: number;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
};

type ScoredColor = RgbColor &
  HslColor & {
    chroma: number;
    count: number;
    score: number;
  };

function samplePalette(image: HTMLImageElement): PortraitPalette | undefined {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  if (naturalWidth <= 0 || naturalHeight <= 0) return undefined;

  const targetWidth = 96;
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
  return createPaletteFromImageData(imageData.data);
}

export function createPaletteFromImageData(data: Uint8ClampedArray): PortraitPalette | undefined {
  const colorBuckets = new Map<string, Bucket>();
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const a = data[index + 3] ?? 0;
    if (a < 190) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const luma = relativeLuma({ r, g, b });
    const hsl = rgbToHsl({ r, g, b });

    if (luma > 250) continue;
    if (luma < 12 && chroma < 28) continue;
    if (!isUsefulColor(hsl, chroma, luma)) continue;

    addBucketPixel(colorBuckets, colorBucketKey(hsl), { r, g, b }, pixelScore(hsl, chroma));
  }

  const candidates = bucketCandidates(colorBuckets);
  const picks = selectPalettePicks(candidates);
  if (picks.length === 0) return undefined;

  return buildPortraitPalette(picks);
}

function addBucketPixel(
  buckets: Map<string, Bucket>,
  key: string,
  color: RgbColor,
  score: number,
): void {
  const existing = buckets.get(key);
  if (existing !== undefined) {
    existing.r += color.r;
    existing.g += color.g;
    existing.b += color.b;
    existing.count += 1;
    existing.score += score;
    return;
  }

  buckets.set(key, { ...color, count: 1, score });
}

function bucketCandidates(buckets: Map<string, Bucket>): ScoredColor[] {
  return Array.from(buckets.values())
    .map((bucket) => {
      const color = {
        r: Math.round(bucket.r / bucket.count),
        g: Math.round(bucket.g / bucket.count),
        b: Math.round(bucket.b / bucket.count),
      };
      const hsl = rgbToHsl(color);
      const chroma = Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);
      return {
        ...color,
        ...hsl,
        chroma,
        count: bucket.count,
        score: Math.sqrt(bucket.count) * (bucket.score / bucket.count),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function selectPalettePicks(candidates: readonly ScoredColor[]): RgbColor[] {
  const picks: ScoredColor[] = [];
  collectDiversePicks(candidates, picks, 48);
  if (picks.length < 3) {
    collectDiversePicks(candidates, picks, 30);
  }

  const colors: RgbColor[] = picks.map(({ r, g, b }) => ({ r, g, b }));
  while (colors.length > 0 && colors.length < 3) {
    colors.push(deriveCompanionColor(colors[0]!, colors.length));
  }

  return colors.slice(0, 3);
}

function collectDiversePicks(
  candidates: readonly ScoredColor[],
  picks: ScoredColor[],
  minDistance: number,
): void {
  for (const candidate of candidates) {
    if (picks.length >= 3) return;
    if (picks.some((pick) => sameCandidate(pick, candidate))) continue;
    if (picks.every((pick) => separatesFromPick(candidate, pick, minDistance))) {
      picks.push(candidate);
    }
  }
}

function sameCandidate(a: ScoredColor, b: ScoredColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

function separatesFromPick(
  candidate: ScoredColor,
  pick: ScoredColor,
  minDistance: number,
): boolean {
  const distance = colorDistance(candidate, pick);
  const hueGap = hueDistance(candidate.h, pick.h);
  return distance >= minDistance && (hueGap >= 18 || Math.abs(candidate.l - pick.l) >= 0.18);
}

function buildPortraitPalette(picks: readonly RgbColor[]): PortraitPalette {
  const from = picks[0]!;
  const via = picks[1] ?? deriveCompanionColor(from, 1);
  const to = picks[2] ?? deriveCompanionColor(from, 2);
  const accent = mostSaturated([from, via, to]);

  return {
    from: rgbToCss(auraStop(from, 0.82, 0.76, 0.34, 0.68)),
    via: rgbToCss(auraStop(via, 0.86, 0.72, 0.3, 0.64)),
    to: rgbToCss(auraStop(to, 0.83, 0.72, 0.32, 0.66)),
    accent: rgbToCss(auraStop(accent, 0.63, 0.95, 0.46, 0.84)),
  };
}

function mostSaturated(colors: readonly RgbColor[]): RgbColor {
  return colors.reduce((best, color) => {
    const bestHsl = rgbToHsl(best);
    const colorHsl = rgbToHsl(color);
    const bestChroma = Math.max(best.r, best.g, best.b) - Math.min(best.r, best.g, best.b);
    const colorChroma = Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);
    return colorHsl.s + colorChroma / 255 > bestHsl.s + bestChroma / 255 ? color : best;
  });
}

function auraStop(
  color: RgbColor,
  lightness: number,
  saturationScale: number,
  minSaturation: number,
  maxSaturation: number,
): RgbColor {
  const hsl = rgbToHsl(color);
  const saturation = clamp(hsl.s * saturationScale + 0.08, minSaturation, maxSaturation);
  return hslToRgb(hsl.h, saturation, lightness);
}

function deriveCompanionColor(color: RgbColor, index: number): RgbColor {
  const hsl = rgbToHsl(color);
  const hueOffset = index === 1 ? 34 : -42;
  const saturation = clamp(Math.max(hsl.s, 0.38) * (index === 1 ? 0.88 : 0.76), 0.32, 0.72);
  const lightness = clamp(hsl.l + (index === 1 ? 0.04 : 0.14), 0.36, 0.7);
  return hslToRgb(hsl.h + hueOffset, saturation, lightness);
}

function isUsefulColor(hsl: HslColor, chroma: number, luma: number): boolean {
  if (hsl.s >= 0.18 && chroma >= 26 && luma <= 244) return true;
  return hsl.s >= 0.12 && chroma >= 18 && luma <= 236;
}

function colorBucketKey(hsl: HslColor): string {
  const hue = Math.round(hsl.h / 16);
  const saturation = Math.round(hsl.s * 5);
  const lightness = Math.round(hsl.l * 6);
  return `${hue},${saturation},${lightness}`;
}

function pixelScore(hsl: HslColor, chroma: number): number {
  const midtone = clamp(1 - Math.abs(hsl.l - 0.54) * 1.35, 0.38, 1);
  const chromaBoost = 0.65 + hsl.s * 2.6 + Math.min(chroma / 64, 1.6);
  const vividBoost = hsl.s > 0.55 ? 1.25 : 1;
  return midtone * chromaBoost * vividBoost;
}

function colorDistance(a: RgbColor, b: RgbColor): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function hueDistance(a: number, b: number): number {
  const raw = Math.abs(normalizeHue(a) - normalizeHue(b));
  return Math.min(raw, 360 - raw);
}

function rgbToHsl(color: RgbColor): HslColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lightness = (max + min) / 2;

  if (chroma === 0) {
    return { h: 0, s: 0, l: lightness };
  }

  const saturation = chroma / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / chroma) % 6;
  } else if (max === g) {
    hue = (b - r) / chroma + 2;
  } else {
    hue = (r - g) / chroma + 4;
  }

  return { h: normalizeHue(hue * 60), s: saturation, l: lightness };
}

function hslToRgb(hue: number, saturation: number, lightness: number): RgbColor {
  const normalizedHue = normalizeHue(hue);
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = normalizedHue / 60;
  const second = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (huePrime < 1) {
    r1 = chroma;
    g1 = second;
  } else if (huePrime < 2) {
    r1 = second;
    g1 = chroma;
  } else if (huePrime < 3) {
    g1 = chroma;
    b1 = second;
  } else if (huePrime < 4) {
    g1 = second;
    b1 = chroma;
  } else if (huePrime < 5) {
    r1 = second;
    b1 = chroma;
  } else {
    r1 = chroma;
    b1 = second;
  }

  const match = lightness - chroma / 2;
  return {
    r: Math.round((r1 + match) * 255),
    g: Math.round((g1 + match) * 255),
    b: Math.round((b1 + match) * 255),
  };
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

function relativeLuma(color: RgbColor): number {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
}

function rgbToCss(color: RgbColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function rgbCssWithAlpha(rgb: string, alpha: number): string {
  const channels = rgb.match(/\d+/g)?.slice(0, 3);
  if (channels === undefined || channels.length !== 3) {
    return rgb;
  }
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
