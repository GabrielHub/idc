/**
 * Pure viewport-fit math for the constellation lobby's morphing detail card.
 *
 * The card anchors to its star's projected screen point and opens downward at a
 * fixed width, so a star near a canvas edge — most visibly the bottom roster
 * row — pushes the card off screen. These helpers compute the minimum translate
 * that pulls the card's bounding box back inside the canvas. They take plain
 * rectangles (no DOM, React, or Three dependency) so the clamp stays unit
 * testable; the imperative wiring lives in `active-card-anchor.tsx`.
 */

export type FitRect = { left: number; right: number; top: number; bottom: number };
export type FitOffset = { x: number; y: number };

/**
 * Minimal 1D shift that brings the segment `[start, end]` inside `[lo, hi]`:
 *   - `0` when it already fits,
 *   - the smallest signed nudge that pulls the overflowing edge into range,
 *   - when the segment is longer than the slot, pins `start` to `lo` so the
 *     card's leading edge (its popped portrait and identity row) stays visible
 *     and the overflow falls off the trailing edge instead.
 */
export function fitAxisOffset(start: number, end: number, lo: number, hi: number): number {
  const lowerNudge = lo - start; // shift must be >= this to keep start >= lo
  const upperNudge = hi - end; // shift must be <= this to keep end <= hi
  if (lowerNudge > upperNudge) return lowerNudge;
  return Math.max(lowerNudge, Math.min(0, upperNudge));
}

/**
 * Minimal 2D translate that brings `rect` within `bounds` inset by `margin` on
 * every side. Returns `{ x: 0, y: 0 }` when the rect already fits.
 */
export function fitRectOffset(rect: FitRect, bounds: FitRect, margin: number): FitOffset {
  return {
    x: fitAxisOffset(rect.left, rect.right, bounds.left + margin, bounds.right - margin),
    y: fitAxisOffset(rect.top, rect.bottom, bounds.top + margin, bounds.bottom - margin),
  };
}
