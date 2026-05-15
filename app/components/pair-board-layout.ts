/* ====================================================================
 * Pair Board layout helpers
 *
 * Pure functions: graph derivation from gameplay state, radial-by-degree
 * placement, bezier control points, deterministic per-pair curvature, and
 * a stable hash for drift seeds. No React, no DOM, no side effects, so
 * this file is trivially unit-testable and the visual layer in
 * pair-board.tsx stays focused on render and interaction.
 *
 * Coordinates are normalized to a unit square (0..1). The renderer
 * multiplies by the live container size at paint time, so the layout is
 * resolution-independent and ResizeObserver-safe.
 * ==================================================================== */

import type { MemoryRecord, Member, PairState } from "../domain/game";
import { hashSeedUint32, pushIntoBucket } from "../services/utils";

export type PairBoardPoint = {
  x: number;
  y: number;
};

export type PairBoardNode = {
  member: Member;
  degree: number;
  ringColor: string;
  basePosition: PairBoardPoint;
  driftSeed: number;
  ringTier: 0 | 1 | 2;
};

export type PairBoardEdge = {
  pairId: string;
  a: string;
  b: string;
  noteCount: number;
  topImportance: 1 | 2 | 3 | 4 | 5;
  latestNote: MemoryRecord;
  latestNoteAt: number;
  health: number;
  curvature: number;
};

export type PairBoardNodeNoteSummary = {
  topImportance: 1 | 2 | 3 | 4 | 5;
  latestNoteAt: number;
};

export type PairBoardGraphMeta = {
  filedPairs: number;
  isolatedMembers: Member[];
};

export type PairBoardGraph = {
  nodes: PairBoardNode[];
  edges: PairBoardEdge[];
  nodeById: Map<string, PairBoardNode>;
  edgeById: Map<string, PairBoardEdge>;
  notesByPair: Map<string, MemoryRecord[]>;
  incidentEdgesByNode: Map<string, PairBoardEdge[]>;
  nodeNoteSummaryByNode: Map<string, PairBoardNodeNoteSummary>;
  meta: PairBoardGraphMeta;
};

export type DerivePairGraphOptions = {
  minDegree: number;
};

const FALLBACK_RING_COLOR = "#f43f5e";

const RING_TIER_RADII: readonly number[] = [0.14, 0.28, 0.4];

const DEGREE_THRESHOLD_INNER = 4;
const DEGREE_THRESHOLD_MIDDLE = 2;

const PI2 = Math.PI * 2;

export function derivePairGraph(
  members: readonly Member[],
  pairStates: readonly PairState[],
  memories: readonly MemoryRecord[],
  options: DerivePairGraphOptions,
): PairBoardGraph {
  const memberById = new Map(members.map((member) => [member.id, member]));

  const filedNotesByPair = new Map<string, MemoryRecord[]>();
  for (const memory of memories) {
    if (memory.scope !== "pair") continue;
    if (memory.visibility !== "public") continue;
    if (memory.pairId === undefined) continue;
    pushIntoBucket(filedNotesByPair, memory.pairId, memory);
  }

  const allEdges: PairBoardEdge[] = [];
  let filedPairCount = 0;

  for (const pair of pairStates) {
    const [a, b] = pair.participantIds;
    if (memberById.get(a) === undefined || memberById.get(b) === undefined) continue;

    const filedNotes = filedNotesByPair.get(pair.id) ?? [];
    if (filedNotes.length === 0) continue;
    filedPairCount += 1;

    const sortedByDate = [...filedNotes].sort((left, right) => {
      const lt = Date.parse(left.createdAt);
      const rt = Date.parse(right.createdAt);
      return rt - lt;
    });
    const latestNote = sortedByDate[0];
    if (latestNote === undefined) continue;
    const latestNoteAt = Date.parse(latestNote.createdAt);
    const topImportance = clampImportance(
      filedNotes.reduce<number>((acc, note) => Math.max(acc, note.importance), 1),
    );

    allEdges.push({
      pairId: pair.id,
      a,
      b,
      noteCount: filedNotes.length,
      topImportance,
      latestNote,
      latestNoteAt,
      health: pair.stats.relationshipHealth,
      curvature: deterministicCurvature(pair.id),
    });
  }

  const degreeByMember = new Map<string, number>();
  for (const edge of allEdges) {
    degreeByMember.set(edge.a, (degreeByMember.get(edge.a) ?? 0) + 1);
    degreeByMember.set(edge.b, (degreeByMember.get(edge.b) ?? 0) + 1);
  }

  const minDegreeThreshold = Math.max(1, options.minDegree);
  // Threshold of 1 keeps every node that has any edge, so the filter is a
  // no-op and the post-filter degree map equals the pre-filter one.
  const filtersOut = minDegreeThreshold > 1;

  let visibleEdges: PairBoardEdge[];
  let visibleDegree: Map<string, number>;
  if (filtersOut) {
    const visibleMemberIds = new Set<string>();
    for (const [memberId, degree] of degreeByMember) {
      if (degree >= minDegreeThreshold) visibleMemberIds.add(memberId);
    }
    visibleEdges = allEdges.filter(
      (edge) => visibleMemberIds.has(edge.a) && visibleMemberIds.has(edge.b),
    );
    visibleDegree = new Map<string, number>();
    for (const memberId of visibleMemberIds) {
      const degree = degreeByMember.get(memberId);
      if (degree !== undefined) {
        visibleDegree.set(memberId, degree);
      }
    }
  } else {
    visibleEdges = allEdges;
    visibleDegree = degreeByMember;
  }

  const incidentEdgesByNode = new Map<string, PairBoardEdge[]>();
  const nodeNoteSummaryByNode = new Map<string, PairBoardNodeNoteSummary>();
  for (const edge of visibleEdges) {
    pushIntoBucket(incidentEdgesByNode, edge.a, edge);
    pushIntoBucket(incidentEdgesByNode, edge.b, edge);
    rollupNoteSummary(nodeNoteSummaryByNode, edge.a, edge);
    rollupNoteSummary(nodeNoteSummaryByNode, edge.b, edge);
  }

  const visibleMembers = members.filter((member) => visibleDegree.has(member.id));
  const isolatedMembers = members.filter((member) => !visibleDegree.has(member.id));

  const layoutNodes = layoutRadialByDegree(visibleMembers, visibleEdges, visibleDegree);
  const sortedEdges = visibleEdges
    .slice()
    .sort((left, right) => right.topImportance - left.topImportance);

  return {
    nodes: layoutNodes,
    edges: sortedEdges,
    nodeById: new Map(layoutNodes.map((node) => [node.member.id, node])),
    edgeById: new Map(sortedEdges.map((edge) => [edge.pairId, edge])),
    notesByPair: filedNotesByPair,
    incidentEdgesByNode,
    nodeNoteSummaryByNode,
    meta: {
      filedPairs: filedPairCount,
      isolatedMembers,
    },
  };
}

function rollupNoteSummary(
  bucket: Map<string, PairBoardNodeNoteSummary>,
  memberId: string,
  edge: PairBoardEdge,
): void {
  const existing = bucket.get(memberId);
  if (existing === undefined) {
    bucket.set(memberId, {
      topImportance: edge.topImportance,
      latestNoteAt: edge.latestNoteAt,
    });
    return;
  }
  if (edge.topImportance > existing.topImportance) {
    existing.topImportance = edge.topImportance;
  }
  if (edge.latestNoteAt > existing.latestNoteAt) {
    existing.latestNoteAt = edge.latestNoteAt;
  }
}

export function layoutRadialByDegree(
  members: readonly Member[],
  edges: readonly PairBoardEdge[],
  degreeByMember: Map<string, number>,
): PairBoardNode[] {
  if (members.length === 0) return [];

  const sorted = [...members].sort((left, right) => {
    const dDiff = (degreeByMember.get(right.id) ?? 0) - (degreeByMember.get(left.id) ?? 0);
    if (dDiff !== 0) return dDiff;
    return left.id.localeCompare(right.id);
  });

  const tierBuckets: Member[][] = [[], [], []];
  for (const member of sorted) {
    const degree = degreeByMember.get(member.id) ?? 0;
    const tier = degree >= DEGREE_THRESHOLD_INNER ? 0 : degree >= DEGREE_THRESHOLD_MIDDLE ? 1 : 2;
    tierBuckets[tier].push(member);
  }

  // Greedy adjacency: try to put connected pairs on adjacent angular slots
  // within their tier so the eye reads pairings as physical proximity. We
  // walk edges in importance order and snap whichever endpoint still has a
  // free slot in its tier next to the partner.
  const positions = new Map<string, PairBoardPoint>();
  const ringTierByMember = new Map<string, 0 | 1 | 2>();
  const sortedEdges = [...edges].sort((left, right) => right.topImportance - left.topImportance);

  for (let tier = 0; tier < tierBuckets.length; tier += 1) {
    const bucket = tierBuckets[tier];
    if (bucket.length === 0) continue;

    const radius = RING_TIER_RADII[tier];
    const slotCount = Math.max(bucket.length, tier === 0 ? 3 : tier === 1 ? 6 : 10);
    const offset = tier * 0.083 * PI2;
    const placedAtSlot = new Map<number, Member>();
    const remaining = new Set(bucket.map((member) => member.id));

    function nextFreeSlot(seedSlot: number): number {
      for (let probe = 0; probe < slotCount; probe += 1) {
        const slot = (seedSlot + probe) % slotCount;
        if (!placedAtSlot.has(slot)) return slot;
      }
      return seedSlot;
    }

    function placeMember(member: Member, slot: number) {
      const angle = offset + (slot / slotCount) * PI2;
      positions.set(member.id, {
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius,
      });
      ringTierByMember.set(member.id, tier as 0 | 1 | 2);
      placedAtSlot.set(slot, member);
      remaining.delete(member.id);
    }

    // First pass: place neighbors next to each other when they're both in
    // this tier and neither is placed yet.
    let nextSeed = 0;
    for (const edge of sortedEdges) {
      const aMember = bucket.find((member) => member.id === edge.a);
      const bMember = bucket.find((member) => member.id === edge.b);
      if (aMember === undefined || bMember === undefined) continue;
      if (!remaining.has(aMember.id) || !remaining.has(bMember.id)) continue;
      const slotA = nextFreeSlot(nextSeed);
      placeMember(aMember, slotA);
      const slotB = nextFreeSlot(slotA + 1);
      placeMember(bMember, slotB);
      nextSeed = slotB + 2;
    }

    // Second pass: distribute remaining members evenly into still-open slots.
    const stillRemaining = bucket.filter((member) => remaining.has(member.id));
    let cursor = nextSeed % slotCount;
    for (const member of stillRemaining) {
      const slot = nextFreeSlot(cursor);
      placeMember(member, slot);
      cursor = slot + 1;
    }
  }

  // Light repulsion: nudge any two nodes within an overlap radius apart so
  // small clusters don't collide. We never cross tiers.
  const minDistance = 0.11;
  const ids = sorted.map((member) => member.id);
  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const idA = ids[i];
        const idB = ids[j];
        const a = positions.get(idA);
        const b = positions.get(idB);
        if (a === undefined || b === undefined) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq === 0) {
          positions.set(idB, { x: b.x + 0.01, y: b.y + 0.01 });
          continue;
        }
        const dist = Math.sqrt(distSq);
        if (dist >= minDistance) continue;
        const push = (minDistance - dist) * 0.5;
        const ux = dx / dist;
        const uy = dy / dist;
        positions.set(idA, { x: a.x - ux * push * 0.5, y: a.y - uy * push * 0.5 });
        positions.set(idB, { x: b.x + ux * push * 0.5, y: b.y + uy * push * 0.5 });
      }
    }
  }

  return sorted.map((member) => {
    const basePosition = positions.get(member.id) ?? { x: 0.5, y: 0.5 };
    return {
      member,
      degree: degreeByMember.get(member.id) ?? 0,
      ringColor: member.chatBubble?.accentColor ?? FALLBACK_RING_COLOR,
      basePosition,
      driftSeed: hashUnit(member.id),
      ringTier: ringTierByMember.get(member.id) ?? 2,
    };
  });
}

export function bezierMidpoint(
  a: PairBoardPoint,
  b: PairBoardPoint,
  curvature: number,
): PairBoardPoint {
  const control = bezierControlPoint(a, b, curvature);
  return {
    x: 0.25 * a.x + 0.5 * control.x + 0.25 * b.x,
    y: 0.25 * a.y + 0.5 * control.y + 0.25 * b.y,
  };
}

export function bezierControlPoint(
  a: PairBoardPoint,
  b: PairBoardPoint,
  curvature: number,
): PairBoardPoint {
  const mx = (a.x + b.x) * 0.5;
  const my = (a.y + b.y) * 0.5;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const offset = curvature * 0.18;
  return {
    x: mx + nx * offset,
    y: my + ny * offset,
  };
}

export function bezierPathD(
  a: PairBoardPoint,
  b: PairBoardPoint,
  curvature: number,
  width: number,
  height: number,
): string {
  const control = bezierControlPoint(a, b, curvature);
  const ax = a.x * width;
  const ay = a.y * height;
  const bx = b.x * width;
  const by = b.y * height;
  const cx = control.x * width;
  const cy = control.y * height;
  return `M ${ax.toFixed(2)} ${ay.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
}

export function pointAlongBezier(
  a: PairBoardPoint,
  b: PairBoardPoint,
  curvature: number,
  t: number,
): PairBoardPoint {
  const control = bezierControlPoint(a, b, curvature);
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * a.x + 2 * oneMinusT * t * control.x + t * t * b.x,
    y: oneMinusT * oneMinusT * a.y + 2 * oneMinusT * t * control.y + t * t * b.y,
  };
}

function deterministicCurvature(seed: string): number {
  // Map 0..1 to -1..1 with sign deterministic per pair so two parallel pairs bow apart.
  return hashUnit(seed) * 2 - 1;
}

function hashUnit(seed: string): number {
  return (hashSeedUint32(seed) % 1_000_003) / 1_000_003;
}

function clampImportance(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

export function edgeStrokeWidth(edge: PairBoardEdge): number {
  return 1.5 + edge.topImportance * 0.55;
}

export function edgeBaseOpacity(edge: PairBoardEdge): number {
  const healthShare = Math.max(0, Math.min(1, edge.health / 100));
  return 0.34 + healthShare * 0.5;
}

// Radii are matched 1:1 to Portrait component variants so the avatar
// inside the bubble fills its frame the same way the rest of the app
// renders members. Portrait sizing is fixed at the variant level
// (thumb=48, row=64, card=96), so any other radius would either crop
// the image or leave a hollow ring. Keep these in lockstep with the
// PortraitVariant chosen in pair-board.tsx::PairNode.
export function nodeBaseRadius(degree: number): number {
  if (degree >= 4) return 48;
  if (degree >= 2) return 32;
  return 24;
}

export type PairBoardNodePortraitVariant = "thumb" | "row" | "card";

export function nodePortraitVariant(degree: number): PairBoardNodePortraitVariant {
  if (degree >= 4) return "card";
  if (degree >= 2) return "row";
  return "thumb";
}

export function describeRecency(latestNoteAt: number, now: number): string {
  if (latestNoteAt === 0) return "no notes filed";
  const ms = Math.max(0, now - latestNoteAt);
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "filed just now";
  if (minutes < 60) return `filed ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `filed ${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `filed ${days}d ago`;
  const weeks = Math.round(days / 7);
  return `filed ${weeks}w ago`;
}
