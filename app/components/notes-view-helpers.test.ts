import { describe, expect, it } from "vitest";

import {
  memoryRecordSchema,
  pairStateSchema,
  playerKnowledgeRecordSchema,
  type MemoryRecord,
  type Member,
  type PairState,
  type PlayerKnowledgeRecord,
} from "../domain/game";
import { bradyStrait, jennaPike, vhool } from "../fixtures/members";
import { CLOSURE_NEAR_MISS_TAG } from "../services/date-engine";
import { makePairId, sortMemberIds } from "../services/game-seed";
import {
  buildPairDossier,
  derivePairFocusInitialFilter,
  resolveInitialPairBoardSelection,
} from "./notes-view-helpers";

const PAIR_ID = makePairId(jennaPike.id, vhool.id);

describe("derivePairFocusInitialFilter", () => {
  it("returns null when no pair focus is set", () => {
    expect(derivePairFocusInitialFilter(null)).toBeNull();
    expect(derivePairFocusInitialFilter(undefined)).toBeNull();
    expect(derivePairFocusInitialFilter("")).toBeNull();
  });

  it("preselects the pair filter when a pair id arrives", () => {
    expect(derivePairFocusInitialFilter(PAIR_ID)).toEqual({
      scopeFilter: "pairs",
      selectedPairId: PAIR_ID,
    });
  });
});

describe("resolveInitialPairBoardSelection", () => {
  it("returns none when no initial pair id is supplied", () => {
    expect(resolveInitialPairBoardSelection(null, new Set([PAIR_ID]))).toEqual({ kind: "none" });
    expect(resolveInitialPairBoardSelection(undefined, new Set([PAIR_ID]))).toEqual({
      kind: "none",
    });
  });

  it("returns none when the requested edge is not on the board", () => {
    expect(resolveInitialPairBoardSelection(PAIR_ID, new Set())).toEqual({ kind: "none" });
  });

  it("returns the edge selection when the pair has a visible edge", () => {
    expect(resolveInitialPairBoardSelection(PAIR_ID, new Set([PAIR_ID]))).toEqual({
      kind: "edge",
      pairId: PAIR_ID,
    });
  });
});

describe("buildPairDossier", () => {
  const members: Member[] = [jennaPike, vhool, bradyStrait];
  const memberById = new Map(members.map((member) => [member.id, member]));

  it("returns null when no pair state is provided", () => {
    const dossier = buildPairDossier({
      pairId: PAIR_ID,
      pairState: undefined,
      memberById,
      memories: [],
      playerKnowledge: [],
      readyClosurePairIds: new Set(),
    });
    expect(dossier).toBeNull();
  });

  it("returns null when a participant is missing from the roster", () => {
    const pairState = buildPairState(jennaPike, vhool);
    const dossier = buildPairDossier({
      pairId: PAIR_ID,
      pairState,
      memberById: new Map([[jennaPike.id, jennaPike]]),
      memories: [],
      playerKnowledge: [],
      readyClosurePairIds: new Set(),
    });
    expect(dossier).toBeNull();
  });

  it("returns null when a visible board edge memory exists for the pair", () => {
    const pairState = buildPairState(jennaPike, vhool);
    const visibleEdgeMemory = buildPairMemory(pairState, {
      id: "memory-visible-edge",
      tags: ["date_summary"],
    });
    const dossier = buildPairDossier({
      pairId: PAIR_ID,
      pairState,
      memberById,
      memories: [visibleEdgeMemory],
      playerKnowledge: [],
      readyClosurePairIds: new Set(),
    });
    expect(dossier).toBeNull();
  });

  it("collects player-safe pair data without surfacing raw stats", () => {
    const pairState: PairState = {
      ...buildPairState(jennaPike, vhool),
      agreements: [],
      openLoops: [],
    };

    const olderNote = buildPairMemory(pairState, {
      id: "memory-old",
      scope: "date",
      tags: ["date_summary"],
      text: "First exchange landed quietly.",
      createdAt: "2026-04-30T12:00:00.000Z",
    });
    const newerNote = buildPairMemory(pairState, {
      id: "memory-new",
      scope: "date",
      tags: ["date_summary"],
      text: "Second exchange held the line.",
      createdAt: "2026-05-05T12:00:00.000Z",
    });
    const privateNote = buildPairMemory(pairState, {
      id: "memory-private",
      scope: "pair",
      visibility: "judge_only",
      tags: ["date_summary"],
      text: "Private judge note.",
      createdAt: "2026-05-04T12:00:00.000Z",
    });
    const otherPairNote = buildPairMemory(buildPairState(jennaPike, bradyStrait), {
      id: "memory-other-pair",
      scope: "pair",
      tags: ["date_summary"],
      text: "Different pair.",
      createdAt: "2026-05-03T12:00:00.000Z",
    });

    const reads: PlayerKnowledgeRecord[] = [
      buildPairRead({
        id: "read-pair",
        readId: "dynamic:repeat-room",
        readText: "This pair has worked this room before.",
      }),
      playerKnowledgeRecordSchema.parse({
        id: "read-other-subject",
        subjectKind: "member",
        subjectId: jennaPike.id,
        readKind: "comfort",
        readId: "comfort:clear-plan",
        readText: "Jenna settles when the plan stays clear.",
        confidence: "filed",
        source: "judge",
        revealedAt: "2026-05-05T12:00:00.000Z",
      }),
    ];

    const dossier = buildPairDossier({
      pairId: PAIR_ID,
      pairState,
      memberById,
      memories: [olderNote, newerNote, privateNote, otherPairNote],
      playerKnowledge: reads,
      readyClosurePairIds: new Set([PAIR_ID]),
    });

    expect(dossier).not.toBeNull();
    if (dossier === null) return;

    expect(dossier.participants.map((member) => member.id)).toEqual([jennaPike.id, vhool.id]);
    expect(dossier.publicPairNotes.map((note) => note.id)).toEqual(["memory-new", "memory-old"]);
    expect(dossier.pairReads.map((read) => read.readId)).toEqual(["dynamic:repeat-room"]);
    expect(dossier.closureReady).toBe(true);
    expect(dossier.closureNearMiss).toBe(false);

    const dossierJson = JSON.stringify(dossier);
    expect(dossierJson).not.toMatch(/spark/i);
    expect(dossierJson).not.toMatch(/strain/i);
    expect(dossierJson).not.toMatch(/relationshipHealth/);
  });

  it("does not expose canonical agreements or open loops without filed public notes", () => {
    const pairState: PairState = {
      ...buildPairState(jennaPike, vhool),
      agreements: [
        {
          id: "agreement-active",
          text: "No unfiled agreement should appear here.",
          status: "active",
          createdAt: "2026-05-05T12:00:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-open",
          text: "No unfiled loop should appear here.",
          status: "open",
          createdAt: "2026-05-05T12:00:00.000Z",
        },
      ],
    };

    const dossier = buildPairDossier({
      pairId: PAIR_ID,
      pairState,
      memberById,
      memories: [],
      playerKnowledge: [],
      readyClosurePairIds: new Set(),
    });

    expect(JSON.stringify(dossier)).not.toMatch(/unfiled/i);
  });

  it("flags closure_near_miss when a near-miss memory references a non-roster subject", () => {
    const pairState = buildPairState(jennaPike, vhool);
    const nearMiss = memoryRecordSchema.parse({
      id: "memory-near-miss",
      scope: "pair",
      visibility: "public",
      subjectIds: ["unknown-non-roster-id"],
      pairId: PAIR_ID,
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "date-session-1",
      text: "Jenna and Vhool nearly cleared closure.",
      tags: [CLOSURE_NEAR_MISS_TAG, "date_summary"],
      importance: 4,
      createdAt: "2026-05-05T12:00:00.000Z",
    });
    const dossier = buildPairDossier({
      pairId: PAIR_ID,
      pairState,
      memberById,
      memories: [nearMiss],
      playerKnowledge: [],
      readyClosurePairIds: new Set(),
    });
    expect(dossier?.closureNearMiss).toBe(true);
    expect(dossier?.closureReady).toBe(false);
  });
});

function buildPairState(first: Member, second: Member): PairState {
  return pairStateSchema.parse({
    id: makePairId(first.id, second.id),
    participantIds: sortMemberIds(first.id, second.id),
    stats: {
      chemistry: 50,
      trust: 50,
      stability: 50,
      conflict: 20,
      weirdnessTolerance: 50,
      spark: 50,
      strain: 20,
      relationshipHealth: 50,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  });
}

function buildPairMemory(
  pair: PairState,
  overrides: Partial<MemoryRecord> & { id: string },
): MemoryRecord {
  return memoryRecordSchema.parse({
    id: overrides.id,
    scope: overrides.scope ?? "pair",
    visibility: overrides.visibility ?? "public",
    subjectIds: pair.participantIds,
    pairId: pair.id,
    scenarioId: overrides.scenarioId ?? "temporal-coffee-shop",
    dateSessionId: overrides.dateSessionId ?? "date-session-1",
    text: overrides.text ?? "A filed pair note.",
    tags: overrides.tags ?? ["date_summary"],
    importance: overrides.importance ?? 4,
    createdAt: overrides.createdAt ?? "2026-05-05T12:00:00.000Z",
  });
}

function buildPairRead(overrides: {
  id: string;
  readId: string;
  readText: string;
}): PlayerKnowledgeRecord {
  return playerKnowledgeRecordSchema.parse({
    id: overrides.id,
    subjectKind: "pair",
    subjectId: PAIR_ID,
    readKind: "pair_dynamic",
    readId: overrides.readId,
    readText: overrides.readText,
    confidence: "filed",
    source: "judge",
    revealedAt: "2026-05-05T12:00:00.000Z",
  });
}
