import type { Member, MemoryRecord, PairState, PlayerKnowledgeRecord } from "../domain/game";
import { CLOSURE_NEAR_MISS_TAG } from "../services/date-engine";
import type { PairBoardSelection } from "./pair-board-shared";

export type NotesScopeFilter = "all" | "pairs" | "scenarios";

type HasIdLookup = { has(id: string): boolean };

export type PairFocusInitialFilter = {
  scopeFilter: NotesScopeFilter;
  selectedPairId: string;
};

export function derivePairFocusInitialFilter(
  pairFocusId: string | null | undefined,
): PairFocusInitialFilter | null {
  if (pairFocusId === null || pairFocusId === undefined || pairFocusId.length === 0) {
    return null;
  }
  return { scopeFilter: "pairs", selectedPairId: pairFocusId };
}

export function resolveInitialPairBoardSelection(
  initialEdgePairId: string | null | undefined,
  edges: HasIdLookup,
): PairBoardSelection {
  if (initialEdgePairId === null || initialEdgePairId === undefined) {
    return { kind: "none" };
  }
  if (!edges.has(initialEdgePairId)) {
    return { kind: "none" };
  }
  return { kind: "edge", pairId: initialEdgePairId };
}

export type PairDossier = {
  pairId: string;
  participants: [Member, Member];
  publicPairNotes: MemoryRecord[];
  pairReads: PlayerKnowledgeRecord[];
  closureReady: boolean;
  closureNearMiss: boolean;
};

export type BuildPairDossierInput = {
  pairId: string;
  pairState: PairState | undefined;
  memberById: ReadonlyMap<string, Member>;
  memories: readonly MemoryRecord[];
  playerKnowledge: readonly PlayerKnowledgeRecord[];
  readyClosurePairIds: ReadonlySet<string>;
};

export function buildPairDossier(input: BuildPairDossierInput): PairDossier | null {
  const { pairId, pairState, memberById, memories, playerKnowledge, readyClosurePairIds } = input;
  if (pairState === undefined) return null;

  const first = memberById.get(pairState.participantIds[0]);
  const second = memberById.get(pairState.participantIds[1]);
  if (first === undefined || second === undefined) return null;

  const publicPairNotes: MemoryRecord[] = [];
  let closureNearMiss = false;
  let hasVisibleBoardEdge = false;
  for (const memory of memories) {
    if (memory.pairId !== pairId) continue;
    if (memory.visibility !== "public") continue;
    if (memory.scope !== "pair" && memory.scope !== "date") continue;
    publicPairNotes.push(memory);
    if (memory.scope !== "pair") continue;
    if (!closureNearMiss && memory.tags.includes(CLOSURE_NEAR_MISS_TAG)) {
      closureNearMiss = true;
    }
    if (!hasVisibleBoardEdge && memory.subjectIds.every((id) => memberById.has(id))) {
      hasVisibleBoardEdge = true;
    }
  }

  if (hasVisibleBoardEdge) return null;

  publicPairNotes.sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));

  const pairReads = playerKnowledge.filter(
    (record) => record.subjectKind === "pair" && record.subjectId === pairId,
  );

  const closureReady = readyClosurePairIds.has(pairId);

  return {
    pairId,
    participants: [first, second],
    publicPairNotes,
    pairReads,
    closureReady,
    closureNearMiss,
  };
}
