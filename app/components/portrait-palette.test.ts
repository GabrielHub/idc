import { describe, expect, it } from "vitest";

import { createPaletteFromImageData } from "./portrait-palette";

type PixelColor = readonly [number, number, number, number];

describe("portrait palette extraction", () => {
  it("uses vivid accents instead of large neutral areas", () => {
    const data = pixels([
      { color: [28, 28, 32, 255], count: 3_000 },
      { color: [244, 45, 174, 255], count: 60 },
      { color: [28, 195, 235, 255], count: 54 },
      { color: [93, 58, 220, 255], count: 48 },
    ]);

    const palette = createPaletteFromImageData(data);

    expect(palette).toBeDefined();
    if (palette === undefined) return;

    expect(chroma(palette.from)).toBeGreaterThan(48);
    expect(chroma(palette.via)).toBeGreaterThan(42);
    expect(chroma(palette.to)).toBeGreaterThan(42);
    expect(chroma(palette.accent)).toBeGreaterThan(90);
  });

  it("returns undefined when the image has no usable color", () => {
    const data = pixels([
      { color: [255, 255, 255, 255], count: 400 },
      { color: [22, 22, 22, 255], count: 160 },
      { color: [180, 180, 180, 255], count: 80 },
      { color: [255, 255, 255, 0], count: 40 },
    ]);

    expect(createPaletteFromImageData(data)).toBeUndefined();
  });

  it("builds companion colors when only one tiny accent is present", () => {
    const data = pixels([
      { color: [30, 30, 32, 255], count: 2_400 },
      { color: [238, 35, 52, 255], count: 18 },
    ]);

    const palette = createPaletteFromImageData(data);

    expect(palette).toBeDefined();
    if (palette === undefined) return;

    expect(chroma(palette.accent)).toBeGreaterThan(90);
    expect(hueSpread([palette.from, palette.via, palette.to])).toBeGreaterThan(26);
  });
});

function pixels(blocks: readonly { color: PixelColor; count: number }[]): Uint8ClampedArray {
  const values: number[] = [];
  for (const block of blocks) {
    for (let index = 0; index < block.count; index += 1) {
      values.push(...block.color);
    }
  }
  return Uint8ClampedArray.from(values);
}

function chroma(css: string): number {
  const [r, g, b] = rgbChannels(css);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function hueSpread(colors: readonly string[]): number {
  const hues = colors.map((color) => hueFromRgb(rgbChannels(color)));
  let spread = 0;
  for (const hue of hues) {
    for (const otherHue of hues) {
      const distance = Math.abs(hue - otherHue);
      spread = Math.max(spread, Math.min(distance, 360 - distance));
    }
  }
  return spread;
}

function rgbChannels(css: string): readonly [number, number, number] {
  const channels = css.match(/\d+/g)?.slice(0, 3).map(Number);
  if (channels === undefined || channels.length !== 3) {
    throw new Error(`Expected rgb color, received ${css}`);
  }
  return [channels[0]!, channels[1]!, channels[2]!];
}

function hueFromRgb([rValue, gValue, bValue]: readonly [number, number, number]): number {
  const r = rValue / 255;
  const g = gValue / 255;
  const b = bValue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chromaValue = max - min;
  if (chromaValue === 0) return 0;
  if (max === r) return normalizeHue(((g - b) / chromaValue) * 60);
  if (max === g) return normalizeHue(((b - r) / chromaValue + 2) * 60);
  return normalizeHue(((r - g) / chromaValue + 4) * 60);
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}
