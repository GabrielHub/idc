import { describe, expect, it } from "vitest";

import { dateSessionSchema, gameSaveSchema, type DateSession, type PairEdge } from "../domain/game";
import { jennaPike, vhool } from "../fixtures/members";
import { createSeedGameSave, hydrateFixtureOwnedMemberData, makePairId } from "./game-seed";
import {
  buildRelationshipIndex,
  getPairProjectionByPairId,
  getPairProjectionFromSave,
  listClosureCandidatePairIds,
  materializePairEdge,
} from "./relationship-index";

const SEED_DATE = new Date("2026-05-15T12:00:00.000Z");
const PAIR_ID = makePairId(jennaPike.id, vhool.id);

describe("relationship index", () => {
  it("lists closure candidates from the latest completed report only", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const edge = buildPersistedEdge(seed);
    const oldReadySession = buildCompletedSession({
      edge,
      id: "date-old-ready",
      completedAt: "2026-05-15T13:00:00.000Z",
      readyToClose: true,
    });
    const newerNotReadySession = buildCompletedSession({
      edge,
      id: "date-new-not-ready",
      completedAt: "2026-05-15T14:00:00.000Z",
      readyToClose: false,
    });
    const save = gameSaveSchema.parse({
      ...seed,
      pairStates: [edge],
      dateSessions: [oldReadySession, newerNotReadySession],
    });

    const index = buildRelationshipIndex(save);

    expect(listClosureCandidatePairIds(index)).toEqual([]);

    const newestReadySession = buildCompletedSession({
      edge,
      id: "date-new-ready",
      completedAt: "2026-05-15T15:00:00.000Z",
      readyToClose: true,
    });
    const readySave = gameSaveSchema.parse({
      ...seed,
      pairStates: [edge],
      dateSessions: [oldReadySession, newerNotReadySession, newestReadySession],
    });

    expect(listClosureCandidatePairIds(buildRelationshipIndex(readySave))).toEqual([PAIR_ID]);
  });

  it("keeps pair projections as frozen clones", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const edge = buildPersistedEdge(seed);
    const save = gameSaveSchema.parse({
      ...seed,
      pairStates: [edge],
    });

    const index = buildRelationshipIndex(save);
    const projection = getPairProjectionByPairId(index, PAIR_ID);

    expect(projection).not.toBeUndefined();
    expect(projection!.source).toBe("persisted");
    expect(Object.isFrozen(projection)).toBe(true);
    expect(Object.isFrozen(projection!.participantIds)).toBe(true);
    expect(Object.isFrozen(projection!.stats)).toBe(true);
    expect(Object.isFrozen(projection!.completedDateIds)).toBe(true);
    expect(Object.isFrozen(projection!.scenarioUseCounts)).toBe(true);
    expect(projection!.completedDateIds).not.toBe(edge.completedDateIds);
    expect(projection!.agreements).not.toBe(edge.agreements);

    const materialized = materializePairEdge(projection!);
    materialized.completedDateIds.push("date-third");
    materialized.scenarioUseCounts["temporal-coffee-shop"] = 3;

    expect(projection!.completedDateIds).toEqual(["date-old-ready", "date-new-not-ready"]);
    expect(projection!.scenarioUseCounts["temporal-coffee-shop"]).toBe(2);
  });

  it("hydrates stale persisted derived pair stats", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const edge = buildPersistedEdge(seed);
    const staleEdge = gameSaveSchema.parse({
      ...seed,
      pairStates: [
        {
          ...edge,
          stats: {
            ...edge.stats,
            relationshipHealth: 0,
            strain: 100,
          },
        },
      ],
    }).pairStates[0];

    if (staleEdge === undefined) {
      throw new Error("Expected stale edge.");
    }

    const result = hydrateFixtureOwnedMemberData(
      gameSaveSchema.parse({
        ...seed,
        pairStates: [staleEdge],
      }),
    );
    const hydratedEdge = result.save.pairStates[0];

    if (hydratedEdge === undefined) {
      throw new Error("Expected hydrated edge.");
    }

    expect(result.dirty).toBe(true);
    expect(hydratedEdge.stats.relationshipHealth).toBe(
      Math.round(
        (edge.stats.chemistry +
          edge.stats.trust +
          edge.stats.stability +
          (100 - edge.stats.conflict)) /
          4,
      ),
    );
    expect(hydratedEdge.stats.strain).toBe(
      Math.round((edge.stats.conflict + (100 - edge.stats.stability)) / 2),
    );
    expect(hydratedEdge.stats.chemistry).toBe(edge.stats.chemistry);
    expect(hydratedEdge.scenarioUseCounts).toEqual(edge.scenarioUseCounts);
  });
});

function buildPersistedEdge(seed: ReturnType<typeof createSeedGameSave>): PairEdge {
  const projection = getPairProjectionFromSave(seed, PAIR_ID);
  if (projection === undefined) {
    throw new Error("Seed pair projection missing.");
  }
  const edge = materializePairEdge(projection);
  return {
    ...edge,
    completedDateIds: ["date-old-ready", "date-new-not-ready"],
    scenarioUseCounts: {
      "temporal-coffee-shop": 2,
    },
    agreements: [
      {
        id: "agreement-1",
        text: "Use the helmet policy once and then eat the pasta.",
        status: "active",
        createdAt: "2026-05-15T12:30:00.000Z",
      },
    ],
    openLoops: [
      {
        id: "loop-1",
        text: "Ask what Vhool thinks of romance paperwork.",
        status: "open",
        createdAt: "2026-05-15T12:45:00.000Z",
      },
    ],
  };
}

function buildCompletedSession({
  edge,
  id,
  completedAt,
  readyToClose,
}: {
  edge: PairEdge;
  id: string;
  completedAt: string;
  readyToClose: boolean;
}): DateSession {
  return dateSessionSchema.parse({
    id,
    pairId: edge.id,
    scenarioId: "temporal-coffee-shop",
    focusMemberId: edge.participantIds[0],
    turnLimit: 24,
    currentTurn: 24,
    dateHealth: readyToClose ? 88 : 62,
    status: "completed",
    runtimeMode: "local_ai",
    participants: edge.participantIds,
    transcript: [],
    privateStateByCharacter: {
      [edge.participantIds[0]]: { mood: 60, comfort: 60, intent: "trying" },
      [edge.participantIds[1]]: { mood: 60, comfort: 60, intent: "trying" },
    },
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    interventions: [],
    finalReport: {
      id: `report-${id}`,
      dateSessionId: id,
      completedAt,
      outcome: readyToClose ? "second_date" : "mixed",
      summary: "The pair filed a result with the office.",
      statSummary: "Cupid filed a player safe summary.",
      recommendedFollowUp: "pursue",
      memoryRecordIds: [],
      readyToClose,
    },
  });
}
