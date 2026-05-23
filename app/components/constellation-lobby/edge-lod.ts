/**
 * Edge LOD — keeps the constellation legible at every camera distance and
 * caps total edge work when the graph grows large.
 *
 * Two independent axes:
 *   1. Distance bands (near / mid / far) modulate per-frame fidelity:
 *      segment count, width, opacity, and whether the hover halo + midpoint
 *      Html anchor are mounted at all.
 *   2. Importance budget caps the total number of edges shown. When the graph
 *      has more filed pairs than the budget, low-importance edges drop out at
 *      build time so the per-frame work stays bounded.
 */

import type { PairBoardEdge } from "../pair-board-layout";

export type EdgeLodBand = "near" | "mid" | "far";

export type EdgeLodSpec = {
  band: EdgeLodBand;
  segmentCount: number;
  widthScale: number;
  opacityScale: number;
  mountHtml: boolean;
  mountHitSleeve: boolean;
};

/** Max edges drawn at once. Beyond this, low-importance edges drop out. */
export const EDGE_BUDGET = 80;

/** Distance-band thresholds (camera-to-midpoint distance, world units). */
const NEAR_THRESHOLD = 12;
const MID_THRESHOLD = 22;

/** Min importance kept in the far band (lower tiers cull). */
const FAR_BAND_MIN_IMPORTANCE = 3;

export function classifyEdgeLod(
  edge: PairBoardEdge,
  cameraDistance: number,
  isHovered: boolean,
  isSelected: boolean,
): EdgeLodSpec | null {
  // Hovered or selected edges always render at near-band fidelity regardless
  // of camera distance — the player has committed attention to this edge.
  if (isHovered || isSelected) {
    return {
      band: "near",
      segmentCount: 32,
      widthScale: 1,
      opacityScale: 1,
      mountHtml: true,
      mountHitSleeve: true,
    };
  }

  if (cameraDistance < NEAR_THRESHOLD) {
    return {
      band: "near",
      segmentCount: 32,
      widthScale: 1,
      opacityScale: 1,
      mountHtml: true,
      mountHitSleeve: true,
    };
  }
  if (cameraDistance < MID_THRESHOLD) {
    return {
      band: "mid",
      segmentCount: 16,
      widthScale: 0.5,
      opacityScale: 0.7,
      mountHtml: false,
      mountHitSleeve: true,
    };
  }
  // Far band — only top-importance edges survive.
  if (edge.topImportance < FAR_BAND_MIN_IMPORTANCE) return null;
  return {
    band: "far",
    segmentCount: 8,
    widthScale: 0.3,
    opacityScale: 0.4,
    mountHtml: false,
    mountHitSleeve: false,
  };
}

/**
 * Cull edges that exceed the budget before they hit the scene graph. Sort
 * by importance (desc) then recency (desc) so the most-narratively-loaded
 * pairs survive. Pure — runs once per archive-mode mount.
 */
export function applyImportanceBudget(
  edges: readonly PairBoardEdge[],
  budget: number = EDGE_BUDGET,
): readonly PairBoardEdge[] {
  if (edges.length <= budget) return edges;
  const sorted = [...edges].sort((a, b) => {
    if (b.topImportance !== a.topImportance) return b.topImportance - a.topImportance;
    return b.latestNoteAt - a.latestNoteAt;
  });
  return sorted.slice(0, budget);
}
