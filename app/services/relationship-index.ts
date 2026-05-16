/* ====================================================================
 * Relationship index
 *
 * In-memory shape over GameSave.pairStates that gives services intent
 * based access to pair relationships. The save still owns persistence;
 * the index just stops every consumer from re-scanning the dense pair
 * array. It also lets the rest of the app stop treating "no edge"
 * as a missing fixture: untouched pairs are surfaced as projections.
 *
 * Design notes:
 *   - Persisted PairEdge records live in save.pairStates. The schema is
 *     identical to PairState today (PairEdge is an alias) so old call
 *     sites keep typing.
 *   - PairProjection wraps the same fields plus a `source` discriminator
 *     so callers can tell a projected pair from a persisted edge.
 *   - getPairProjection always returns a value (persisted edge or a
 *     fresh projection); materializePairEdge collapses a projection into
 *     a persisted PairEdge ready to write back.
 *   - This file is a pure derivation of save state. It does not own
 *     any save mutation; callers still pipe writes through the existing
 *     replaceById path.
 * ==================================================================== */

import type {
  DateSession,
  GameSave,
  Member,
  PairEdge,
  PairProjection,
  PairProjectionSource,
} from "../domain/game";
import { buildPairProjection, freezePairProjection, makePairId, sortMemberIds } from "./game-seed";
import { pushIntoBucket } from "./utils";

export type CompletedDateSession = DateSession & {
  finalReport: NonNullable<DateSession["finalReport"]>;
};

export function buildLatestCompletedSessionMap(
  sessions: readonly DateSession[],
): Map<string, CompletedDateSession> {
  const latest = new Map<string, CompletedDateSession>();
  for (const session of sessions) {
    if (!hasFinalReport(session)) continue;
    const existing = latest.get(session.pairId);
    if (
      existing === undefined ||
      session.finalReport.completedAt > existing.finalReport.completedAt
    ) {
      latest.set(session.pairId, session);
    }
  }
  return latest;
}

export type RelationshipIndex = {
  /** The save snapshot this index was built from. Used for cache identity. */
  readonly source: GameSave;
  readonly edgesByPairId: ReadonlyMap<string, PairEdge>;
  readonly edgesByMemberId: ReadonlyMap<string, readonly PairEdge[]>;
  readonly membersById: ReadonlyMap<string, Member>;
  /** Pair ids whose latest completed date final report is marked readyToClose. */
  readonly closureReadyPairIds: ReadonlySet<string>;
  /** Edges sorted by latest activity, most recent first. */
  readonly recentEdges: readonly PairEdge[];
};

export function buildRelationshipIndex(save: GameSave): RelationshipIndex {
  const edgesByPairId = new Map<string, PairEdge>();
  const edgesByMemberId = new Map<string, PairEdge[]>();
  const recentEdges: PairEdge[] = [];

  for (const edge of save.pairStates) {
    edgesByPairId.set(edge.id, edge);
    pushIntoBucket(edgesByMemberId, edge.participantIds[0], edge);
    pushIntoBucket(edgesByMemberId, edge.participantIds[1], edge);
    recentEdges.push(edge);
  }

  const latestCompletedSessionByPair = buildLatestCompletedSessionMap(save.dateSessions);

  recentEdges.sort((left, right) => {
    const leftActivity = latestCompletedSessionByPair.get(left.id)?.finalReport.completedAt ?? "";
    const rightActivity = latestCompletedSessionByPair.get(right.id)?.finalReport.completedAt ?? "";
    if (leftActivity === rightActivity) {
      return left.id.localeCompare(right.id);
    }
    return leftActivity < rightActivity ? 1 : -1;
  });

  const closureReadyPairIds = new Set<string>();
  for (const [pairId, session] of latestCompletedSessionByPair) {
    if (session.finalReport.readyToClose === true && edgesByPairId.has(pairId)) {
      closureReadyPairIds.add(pairId);
    }
  }

  return {
    source: save,
    edgesByPairId,
    edgesByMemberId,
    membersById: new Map(save.members.map((member) => [member.id, member] as const)),
    closureReadyPairIds,
    recentEdges,
  };
}

export function getEdge(index: RelationshipIndex, pairId: string): PairEdge | undefined {
  return index.edgesByPairId.get(pairId);
}

export function getPairProjectionByPairId(
  index: RelationshipIndex,
  pairId: string,
): PairProjection | undefined {
  const persisted = index.edgesByPairId.get(pairId);
  if (persisted !== undefined) {
    return pairEdgeToProjection(persisted, "persisted");
  }
  const participants = parsePairId(pairId);
  if (participants === undefined) return undefined;
  const [firstId, secondId] = participants;
  const first = index.membersById.get(firstId);
  const second = index.membersById.get(secondId);
  if (first === undefined || second === undefined) return undefined;
  return buildPairProjection(first, second);
}

export function getPairProjectionByMembers(
  index: RelationshipIndex,
  firstMemberId: string,
  secondMemberId: string,
): PairProjection | undefined {
  return getPairProjectionByPairId(index, makePairId(firstMemberId, secondMemberId));
}

/**
 * Returns a persisted edge if one exists in `save`, otherwise derives a fresh
 * projection from the two members. Useful inside services that need a
 * PairState shape without forcing materialization yet.
 */
export function getPairProjectionFromSave(
  save: GameSave,
  pairId: string,
): PairProjection | undefined {
  const persisted = save.pairStates.find((candidate) => candidate.id === pairId);
  if (persisted !== undefined) {
    return pairEdgeToProjection(persisted, "persisted");
  }
  const participants = parsePairId(pairId);
  if (participants === undefined) return undefined;
  const [firstId, secondId] = participants;
  const first = save.members.find((member) => member.id === firstId);
  const second = save.members.find((member) => member.id === secondId);
  if (first === undefined || second === undefined) return undefined;
  return buildPairProjection(first, second);
}

/**
 * Strips the projection metadata so the result can be written back through
 * existing pair-write paths (replaceById on save.pairStates inserts on miss).
 */
export function materializePairEdge(projection: PairProjection): PairEdge {
  return {
    id: projection.id,
    participantIds: [projection.participantIds[0], projection.participantIds[1]],
    stats: { ...projection.stats },
    completedDateIds: [...projection.completedDateIds],
    scenarioUseCounts: { ...projection.scenarioUseCounts },
    agreements: projection.agreements.map((agreement) => ({ ...agreement })),
    openLoops: projection.openLoops.map((loop) => ({ ...loop })),
  };
}

export function listEdgesForMember(
  index: RelationshipIndex,
  memberId: string,
): readonly PairEdge[] {
  return index.edgesByMemberId.get(memberId) ?? [];
}

export function listClosureCandidatePairIds(index: RelationshipIndex): readonly string[] {
  return Array.from(index.closureReadyPairIds);
}

function parsePairId(pairId: string): [string, string] | undefined {
  const separator = pairId.indexOf("__");
  if (separator === -1) return undefined;
  const first = pairId.slice(0, separator);
  const second = pairId.slice(separator + 2);
  if (first.length === 0 || second.length === 0) return undefined;
  return sortMemberIds(first, second);
}

function hasFinalReport(session: DateSession): session is CompletedDateSession {
  return session.finalReport !== undefined;
}

function pairEdgeToProjection(edge: PairEdge, source: PairProjectionSource): PairProjection {
  const projection: PairProjection = {
    id: edge.id,
    participantIds: [edge.participantIds[0], edge.participantIds[1]],
    stats: { ...edge.stats },
    completedDateIds: [...edge.completedDateIds],
    scenarioUseCounts: { ...edge.scenarioUseCounts },
    agreements: edge.agreements.map((agreement) => ({ ...agreement })),
    openLoops: edge.openLoops.map((loop) => ({ ...loop })),
    source,
  };
  return freezePairProjection(projection);
}
