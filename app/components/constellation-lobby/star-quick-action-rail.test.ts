import { describe, expect, it } from "vitest";

import {
  BUTTON_RADIUS_PX,
  quickActionArcAngles,
  quickActionOrbitRadiusPx,
} from "./star-quick-action-rail";

describe("quick action rail geometry", () => {
  it("orbits just outside the avatar disc edge, hugging it across sizes", () => {
    const big = quickActionOrbitRadiusPx(120);
    const small = quickActionOrbitRadiusPx(40);
    // Sits outside the disc edge (radius + a gap + the button's own radius).
    expect(big).toBeGreaterThan(120 + BUTTON_RADIUS_PX);
    expect(small).toBeGreaterThan(40 + BUTTON_RADIUS_PX);
    // Tracks the avatar so it hugs rather than floating at a fixed distance.
    expect(big).toBeGreaterThan(small);
  });

  it("floors the orbit so a three-button arc never overlaps on a tiny avatar", () => {
    const tiny = quickActionOrbitRadiusPx(1);
    // Floor keeps adjacent buttons clear of each other.
    expect(tiny).toBeGreaterThanOrEqual(BUTTON_RADIUS_PX * 2.5);
  });

  it("places three actions on a right-side arc from top to bottom", () => {
    const angles = quickActionArcAngles(3);
    const orbit = quickActionOrbitRadiusPx(60);
    const positions = angles.map(
      (angle) => [Math.cos(angle) * orbit, Math.sin(angle) * orbit] as const,
    );
    const xCoordinates = new Set(positions.map(([x]) => x.toFixed(3)));
    const orbitRadii = positions.map(([x, y]) => Math.hypot(x, y));

    // Fanned across an arc, not stacked in a vertical line.
    expect(xCoordinates.size).toBeGreaterThan(1);
    // Top action is highest, middle sits at center height, bottom is lowest.
    expect(positions[0]![1]).toBeGreaterThan(positions[1]![1]);
    expect(positions[1]![1]).toBeCloseTo(0);
    expect(positions[2]![1]).toBeLessThan(positions[1]![1]);
    // All on the avatar's right side.
    expect(positions.every(([x]) => x > 0)).toBe(true);
    // Equal radius — a clean arc, not a ragged one.
    expect(orbitRadii[0]).toBeCloseTo(orbitRadii[1]!);
    expect(orbitRadii[2]).toBeCloseTo(orbitRadii[1]!);
  });

  it("centers a single action at 3 o'clock", () => {
    const angles = quickActionArcAngles(1);
    expect(angles).toHaveLength(1);
    expect(angles[0]).toBeCloseTo(0);
  });
});
