import { describe, expect, it } from "vitest";

import { fitAxisOffset, fitRectOffset } from "./viewport-fit";

describe("fitAxisOffset", () => {
  it("returns 0 when the segment already fits", () => {
    expect(fitAxisOffset(20, 80, 0, 100)).toBe(0);
  });

  it("pushes a trailing-edge overflow back (negative shift)", () => {
    // [60, 160] in slot [0, 100] overflows the high edge by 60.
    expect(fitAxisOffset(60, 160, 0, 100)).toBe(-60);
  });

  it("pushes a leading-edge overflow back (positive shift)", () => {
    // [-30, 70] in slot [0, 100] overflows the low edge by 30.
    expect(fitAxisOffset(-30, 70, 0, 100)).toBe(30);
  });

  it("applies the minimal nudge, not an over-correction", () => {
    // Only 10px past the high edge -> shift exactly -10, leaving it flush.
    expect(fitAxisOffset(40, 110, 0, 100)).toBe(-10);
  });

  it("pins the leading edge when the segment is larger than the slot", () => {
    // 140-wide segment cannot fit a 100-wide slot: pin start to lo (shift +20),
    // accepting overflow off the trailing edge so the card top stays visible.
    expect(fitAxisOffset(-20, 120, 0, 100)).toBe(20);
  });
});

describe("fitRectOffset", () => {
  const bounds = { left: 0, top: 0, right: 1920, bottom: 1080 };

  it("leaves a centered rect untouched", () => {
    const rect = { left: 800, right: 1140, top: 400, bottom: 760 };
    expect(fitRectOffset(rect, bounds, 16)).toEqual({ x: 0, y: 0 });
  });

  it("lifts a bottom-row card up so its full height clears the margin", () => {
    // Card bottom (1020) is 64px past the bottom margin (1080 - 16 = 1064)?
    // 1020 < 1064 so it fits vertically; use a taller overflow instead.
    const rect = { left: 800, right: 1140, top: 760, bottom: 1200 };
    const offset = fitRectOffset(rect, bounds, 16);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(1064 - 1200); // -136: lift so bottom rests at 1064
    expect(rect.bottom + offset.y).toBe(1064);
  });

  it("slides an edge card inward on both axes at once", () => {
    // Hugs the right and bottom: overflow on x and y simultaneously.
    const rect = { left: 1700, right: 2040, top: 900, bottom: 1340 };
    const offset = fitRectOffset(rect, bounds, 16);
    expect(rect.right + offset.x).toBe(1904); // 1920 - 16
    expect(rect.bottom + offset.y).toBe(1064); // 1080 - 16
  });
});
