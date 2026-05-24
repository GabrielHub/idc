/**
 * Archive-mode star position resolver. In archive mode the lobby flips from
 * the Poisson field layout (tonight's flythrough) to a graph layout — same
 * stars, new positions. Inner-tier (highly paired) members pull forward,
 * outer-tier members recede, isolated members ring the periphery so they
 * stay legible without crowding the constellation.
 *
 * Pure: takes the graph derived by pair-board-layout.derivePairGraph and a
 * star, returns a world-space target. The lobby's StarSprite lerps from its
 * tonight-mode target to this one over the mode transition.
 */

import { hashSeedUint32 } from "../../services/utils";
import type { PairBoardEdge, PairBoardGraph, PairBoardNode } from "../pair-board-layout";
import type { Vec3 } from "./types";

export type PairEdgeRenderSpec = {
  edge: PairBoardEdge;
  from: Vec3;
  to: Vec3;
  control: Vec3;
};

/** Unit-square (0..1) -> world X (~-11..+11). */
const ARCHIVE_X_SCALE = 22;
/** Unit-square (0..1) -> world Y (+6..-6, flipped to match screen Y). */
const ARCHIVE_Y_SCALE = -12;

/**
 * Per-ring-tier Z offset. Inner tier (high degree) pulls toward the camera;
 * outer tier recedes. Keeps the graph planar enough to read at idle archive
 * framing while still giving DoF a depth to bite into.
 */
const TIER_Z_OFFSET: Record<0 | 1 | 2, number> = {
  0: 1.5,
  1: 0,
  2: -1.5,
};

/** Z for members with no filed-note pairs — pushed behind the active graph. */
const ISOLATED_Z = -4.5;

/** Radius (unit-square) for the periphery ring isolated members orbit on. */
const ISOLATED_RING_RADIUS = 0.55;

export function computeArchiveStarPosition(
  memberId: string,
  graph: PairBoardGraph,
  isolatedIndex: number | null,
): Vec3 {
  const node = graph.nodeById.get(memberId);
  if (node !== undefined) {
    return nodeWorldPosition(node);
  }
  if (isolatedIndex === null) {
    return { x: 0, y: 0, z: ISOLATED_Z };
  }
  return isolatedRingPosition(memberId, isolatedIndex, graph.meta.isolatedMembers.length);
}

function nodeWorldPosition(node: PairBoardNode): Vec3 {
  return {
    x: (node.basePosition.x - 0.5) * ARCHIVE_X_SCALE,
    y: (node.basePosition.y - 0.5) * ARCHIVE_Y_SCALE,
    z: TIER_Z_OFFSET[node.ringTier],
  };
}

function isolatedRingPosition(memberId: string, index: number, total: number): Vec3 {
  const seedOffset = (hashSeedUint32(memberId) % 1000) / 1000;
  // Distribute isolated members along a periphery ring; per-member seed
  // offset breaks symmetry so identical isolation counts don't collide on
  // re-render order.
  const slot = total === 0 ? 0 : (index + seedOffset * 0.3) / Math.max(total, 1);
  const angle = slot * Math.PI * 2;
  const ux = 0.5 + Math.cos(angle) * ISOLATED_RING_RADIUS;
  const uy = 0.5 + Math.sin(angle) * ISOLATED_RING_RADIUS;
  return {
    x: (ux - 0.5) * ARCHIVE_X_SCALE,
    y: (uy - 0.5) * ARCHIVE_Y_SCALE,
    z: ISOLATED_Z,
  };
}

/**
 * Build the world-space render specs for every visible edge in the graph,
 * given the per-member archive positions. Edges whose endpoints aren't in
 * the position map (e.g. a member dropped from the graph) are skipped.
 */
export function buildArchiveEdgeSpecs(
  edges: readonly PairBoardEdge[],
  positions: ReadonlyMap<string, Vec3>,
): PairEdgeRenderSpec[] {
  const specs: PairEdgeRenderSpec[] = [];
  for (const edge of edges) {
    const from = positions.get(edge.a);
    const to = positions.get(edge.b);
    if (from === undefined || to === undefined) continue;
    const { control } = archiveEdgeMidpoint(from, to, edge.curvature);
    specs.push({ edge, from, to, control });
  }
  return specs;
}

/**
 * World-space midpoint of the curved 3D edge between two graph nodes. The
 * 2D bezier control offset (perpendicular to the chord, scaled by the
 * deterministic curvature) lifts the midpoint off the chord; we keep Z
 * planar between the two endpoints so the curve bows in the XY plane.
 */
function archiveEdgeMidpoint(
  from: Vec3,
  to: Vec3,
  curvature: number,
): { mid: Vec3; control: Vec3 } {
  const mx = (from.x + to.x) * 0.5;
  const my = (from.y + to.y) * 0.5;
  const mz = (from.z + to.z) * 0.5;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  // Perpendicular in XY plane; scale matches the 2D bezier offset
  // (curvature * 0.18) but in world units rather than unit-square.
  const nx = -dy / length;
  const ny = dx / length;
  const offset = curvature * 4;
  const control: Vec3 = {
    x: mx + nx * offset,
    y: my + ny * offset,
    z: mz,
  };
  const mid: Vec3 = {
    x: 0.25 * from.x + 0.5 * control.x + 0.25 * to.x,
    y: 0.25 * from.y + 0.5 * control.y + 0.25 * to.y,
    z: mz,
  };
  return { mid, control };
}
