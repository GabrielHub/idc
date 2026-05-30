/**
 * Archive-mode star position resolver. In archive mode the lobby flips from
 * the Poisson field layout (tonight's flythrough) to a graph layout — same
 * stars, new positions. Inner-tier (highly paired) members pull forward,
 * outer-tier members recede, isolated members ring the periphery so they
 * stay legible without crowding the constellation.
 *
 * Pure: takes the graph derived by pair-archive-graph.derivePairArchiveGraph and a
 * star, returns a world-space target. The lobby's StarSprite lerps from its
 * tonight-mode target to this one over the mode transition.
 */

import { clamp, hashSeedUint32 } from "../../services/utils";
import type {
  PairArchiveEdge,
  PairArchiveGraph,
  PairArchiveNode,
} from "../../services/pair-archive-graph";
import type { Vec3 } from "./types";

export type PairEdgeRenderSpec = {
  edge: PairArchiveEdge;
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

/**
 * Deterministic 0..1 fraction from a member id. Used to break layout symmetry
 * (ring slot / fallback spoke angle) so members with identical placement inputs
 * don't stack on the same point across re-renders.
 */
function seededUnitFraction(memberId: string): number {
  return (hashSeedUint32(memberId) % 1000) / 1000;
}

export function computeArchiveStarPosition(
  memberId: string,
  graph: PairArchiveGraph,
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

function nodeWorldPosition(node: PairArchiveNode): Vec3 {
  return {
    x: (node.basePosition.x - 0.5) * ARCHIVE_X_SCALE,
    y: (node.basePosition.y - 0.5) * ARCHIVE_Y_SCALE,
    z: TIER_Z_OFFSET[node.ringTier],
  };
}

function isolatedRingPosition(memberId: string, index: number, total: number): Vec3 {
  const seedOffset = seededUnitFraction(memberId);
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
  edges: readonly PairArchiveEdge[],
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
 * Curve-bow shaping. The control point sits perpendicular to the chord, lifted
 * by a fraction of the chord length so every edge bows by the same *visual*
 * proportion — short edges between adjacent stars arc gently, long edges across
 * the field arc generously, and two pairs sharing a node still split apart
 * (their curvatures carry opposite sign). A flat per-edge constant (the old
 * `curvature * 4`) over-bowed short edges into loops and left long ones nearly
 * straight; scaling by length keeps the whole board reading as one hand.
 */
const EDGE_BOW_CHORD_FRACTION = 0.16;
const EDGE_BOW_MIN = 0.45;
const EDGE_BOW_MAX = 3.2;

/**
 * World-space midpoint of the curved 3D edge between two graph nodes. The
 * bezier control offset (perpendicular to the chord, scaled by the chord
 * length and the deterministic per-pair curvature) lifts the midpoint off the
 * chord; we keep Z planar between the two endpoints so the curve bows in the
 * XY plane.
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
  const nx = -dy / length;
  const ny = dx / length;
  const bow = Math.min(EDGE_BOW_MAX, Math.max(EDGE_BOW_MIN, length * EDGE_BOW_CHORD_FRACTION));
  const offset = curvature * bow;
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

/* ============================================================================
 * Ego layout — clicking a star pulls it to the center of the field and arranges
 * its filed partners in a ring around it, so the player reads "this member and
 * everyone they've dated" as a single clean spoke diagram. Non-incident members
 * are pushed out past the ring and recede (the Scene fades them via the
 * isolation set), clearing the field so the ego's pairs draw unobstructed.
 * ========================================================================== */

const EGO_FOCUS_Z = 2;
const EGO_PARTNER_Z = 0;
const EGO_BACKGROUND_Z = -3.6;
const EGO_RING_BASE_RADIUS_X = 4.6;
const EGO_RING_BASE_RADIUS_Y = 3.2;
const EGO_RING_PER_PARTNER_X = 0.42;
const EGO_RING_PER_PARTNER_Y = 0.26;
const EGO_RING_MIN_RADIUS_X = 3.6;
const EGO_RING_MIN_RADIUS_Y = 2.7;
const EGO_RING_MAX_RADIUS_X = 8.6;
const EGO_RING_MAX_RADIUS_Y = 5.2;
/** Background members park this multiple of the ring radius out from center. */
const EGO_BACKGROUND_RADIUS_SCALE = 1.62;

export type ArchiveEgoLayout = {
  positions: Map<string, Vec3>;
  ringRadiusX: number;
  ringRadiusY: number;
};

/**
 * Build the centered ego layout for a focused member.
 *
 *   - `focusMemberId` lands at world origin, pulled forward in Z so it reads as
 *     the nearest, largest star.
 *   - `partnerIds` (already ordered by the caller — newest filed first reads
 *     best) fan out on an ellipse around the origin, starting at twelve o'clock
 *     and walking clockwise.
 *   - every other id in `basePositions` is pushed out past the ring along its
 *     existing direction from center (seeded fallback when it sat at origin) and
 *     dropped back in Z so the ego's spokes are unobstructed.
 *
 * Pure: returns a fresh position map plus the ring radii the camera uses to
 * frame the orbit.
 */
export function archiveEgoLayout(input: {
  focusMemberId: string;
  partnerIds: readonly string[];
  basePositions: ReadonlyMap<string, Vec3>;
}): ArchiveEgoLayout {
  const { focusMemberId, partnerIds, basePositions } = input;
  const partnerSet = new Set(partnerIds);
  const count = partnerIds.length;
  const ringRadiusX = clamp(
    EGO_RING_BASE_RADIUS_X + count * EGO_RING_PER_PARTNER_X,
    EGO_RING_MIN_RADIUS_X,
    EGO_RING_MAX_RADIUS_X,
  );
  const ringRadiusY = clamp(
    EGO_RING_BASE_RADIUS_Y + count * EGO_RING_PER_PARTNER_Y,
    EGO_RING_MIN_RADIUS_Y,
    EGO_RING_MAX_RADIUS_Y,
  );

  const positions = new Map<string, Vec3>();
  positions.set(focusMemberId, { x: 0, y: 0, z: EGO_FOCUS_Z });

  partnerIds.forEach((partnerId, index) => {
    // Start at twelve o'clock (world +Y is up) and walk clockwise so the
    // newest-filed partner leads the ring in reading order.
    const angle = Math.PI / 2 - (count <= 0 ? 0 : (index / count) * Math.PI * 2);
    positions.set(partnerId, {
      x: Math.cos(angle) * ringRadiusX,
      y: Math.sin(angle) * ringRadiusY,
      z: EGO_PARTNER_Z,
    });
  });

  const backgroundRadiusX = ringRadiusX * EGO_BACKGROUND_RADIUS_SCALE;
  const backgroundRadiusY = ringRadiusY * EGO_BACKGROUND_RADIUS_SCALE;
  for (const [memberId, base] of basePositions) {
    if (memberId === focusMemberId || partnerSet.has(memberId)) continue;
    const dist = Math.hypot(base.x, base.y);
    let ux: number;
    let uy: number;
    if (dist < 1e-3) {
      // Degenerate (a member that sat at center): spread on a seeded angle so
      // overlapping background stars don't stack on the same spoke.
      const angle = seededUnitFraction(memberId) * Math.PI * 2;
      ux = Math.cos(angle);
      uy = Math.sin(angle);
    } else {
      ux = base.x / dist;
      uy = base.y / dist;
    }
    positions.set(memberId, {
      x: ux * backgroundRadiusX,
      y: uy * backgroundRadiusY,
      z: EGO_BACKGROUND_Z,
    });
  }

  return { positions, ringRadiusX, ringRadiusY };
}
