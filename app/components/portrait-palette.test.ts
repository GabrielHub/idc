import { describe, expect, it } from "vitest";

import { PRECOMPUTED_PORTRAIT_PALETTES } from "./portrait-palettes.generated";
import { resolvePortraitPalette } from "./portrait-palette";

describe("portrait palette manifest", () => {
  it("stores valid rgb colors", () => {
    const invalidColors = Object.values(PRECOMPUTED_PORTRAIT_PALETTES)
      .flatMap((palette) => [palette.from, palette.via, palette.to, palette.accent])
      .filter((color) => !/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/.test(color));

    expect(invalidColors).toEqual([]);
  });

  it("falls back for members missing from the generated manifest", () => {
    const palette = resolvePortraitPalette({ id: "future-member" });

    expect(palette.from).toMatch(/^rgb\(/);
    expect(palette.accent).toMatch(/^rgb\(/);
  });
});
