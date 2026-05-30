/**
 * Edge LOD — keeps the constellation legible at every camera distance and
 * caps total edge work when the graph grows large.
 *
 * Two independent axes:
 *   1. Distance bands (near / mid / far) modulate per-frame fidelity:
 *      segment count, width, opacity, and whether the midpoint Html anchor is
 *      mounted.
 *   2. Importance budget caps the total number of edges shown. When the graph
 *      has more filed pairs than the budget, low-importance edges drop out at
 *      build time so the per-frame work stays bounded.
 */

import type { PairArchiveEdge } from "../../services/pair-archive-graph";

type EdgeLodBand = "near" | "mid" | "far";

export type EdgeLodSpec = {
  band: EdgeLodBand;
  segmentCount: number;
  widthScale: number;
  opacityScale: number;
  mountHtml: boolean;
  mountHitSleeve: boolean;
};

/** Max edges drawn at once. Beyond this, low-importance edges drop out. */
const EDGE_BUDGET = 80;

/** Distance-band thresholds (camera-to-midpoint distance, world units). */
const NEAR_THRESHOLD = 12;
const MID_THRESHOLD = 22;

/**
 * Far-band edges still need to read as a graph. Low-importance lines recede,
 * but the global edge budget is the only place that removes edges entirely.
 */
const FAR_BAND_IMPORTANCE_BOOST = 3;

export function classifyEdgeLod(
  edge: PairArchiveEdge,
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
  // Far band — keep every budgeted edge visible so the board still reads as a
  // relationship graph at a glance. Low-importance edges recede instead of
  // disappearing, and the hit sleeve stays mounted so hovering can pull the
  // edge into near-band detail.
  const boosted = edge.topImportance >= FAR_BAND_IMPORTANCE_BOOST;
  return {
    band: "far",
    segmentCount: 12,
    widthScale: boosted ? 0.42 : 0.32,
    opacityScale: boosted ? 0.62 : 0.46,
    mountHtml: false,
    mountHitSleeve: true,
  };
}

/**
 * Cull edges that exceed the budget before they hit the scene graph. Sort
 * by importance (desc) then recency (desc) so the most-narratively-loaded
 * pairs survive. Pure — runs once per archive-mode mount.
 */
export function applyImportanceBudget(
  edges: readonly PairArchiveEdge[],
  budget: number = EDGE_BUDGET,
): readonly PairArchiveEdge[] {
  if (edges.length <= budget) return edges;
  const sorted = [...edges].sort((a, b) => {
    if (b.topImportance !== a.topImportance) return b.topImportance - a.topImportance;
    return b.latestNoteAt - a.latestNoteAt;
  });
  return sorted.slice(0, budget);
}
