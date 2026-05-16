import { describe, expect, it } from "vitest";

import {
  memoryRecordSchema,
  pairStateSchema,
  type MemoryRecord,
  type Member,
  type PairState,
} from "../domain/game";
import { bradyStrait, jennaPike, vhool } from "../fixtures/members";
import { makePairId, sortMemberIds } from "../services/game-seed";
import { derivePairGraph } from "./pair-board-layout";

const BOARD_MEMBERS = [jennaPike, vhool, bradyStrait];

describe("derivePairGraph", () => {
  it("leaves unfiled pair edges off the board", () => {
    const filedPair = buildPairState(jennaPike, vhool);
    const unfiledPair = buildPairState(jennaPike, bradyStrait);

    const graph = derivePairGraph(
      BOARD_MEMBERS,
      [filedPair, unfiledPair],
      [buildPairMemory(filedPair)],
      { minDegree: 1 },
    );

    expect(graph.edges.map((edge) => edge.pairId)).toEqual([filedPair.id]);
    expect(graph.meta.filedPairs).toBe(1);
    expect(graph.nodes.map((node) => node.member.id).sort()).toEqual(
      [jennaPike.id, vhool.id].sort(),
    );
    expect(graph.meta.isolatedMembers.map((member) => member.id)).toEqual([bradyStrait.id]);
  });

  it("returns an empty board when pair edges have no public notes", () => {
    const graph = derivePairGraph(
      BOARD_MEMBERS,
      [buildPairState(jennaPike, vhool), buildPairState(jennaPike, bradyStrait)],
      [],
      { minDegree: 1 },
    );

    expect(graph.edges).toHaveLength(0);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.meta.filedPairs).toBe(0);
    expect(graph.meta.isolatedMembers.map((member) => member.id).sort()).toEqual(
      BOARD_MEMBERS.map((member) => member.id).sort(),
    );
  });

  it("ignores pair notes without materialized edges", () => {
    const filedPair = buildPairState(jennaPike, vhool);

    const graph = derivePairGraph(BOARD_MEMBERS, [], [buildPairMemory(filedPair)], {
      minDegree: 1,
    });

    expect(graph.edges).toHaveLength(0);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.meta.filedPairs).toBe(0);
  });

  it("keeps one-pair spokes off the board when filtering for hubs", () => {
    const firstPair = buildPairState(jennaPike, vhool);
    const secondPair = buildPairState(jennaPike, bradyStrait);

    const graph = derivePairGraph(
      BOARD_MEMBERS,
      [firstPair, secondPair],
      [buildPairMemory(firstPair), buildPairMemory(secondPair)],
      { minDegree: 2 },
    );

    expect(graph.nodes.map((node) => node.member.id)).toEqual([jennaPike.id]);
    expect(graph.nodes[0]?.degree).toBe(2);
    expect(graph.edges).toHaveLength(0);
    expect(graph.meta.filedPairs).toBe(2);
    expect(graph.meta.isolatedMembers.map((member) => member.id).sort()).toEqual(
      [vhool.id, bradyStrait.id].sort(),
    );
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

function buildPairMemory(pair: PairState): MemoryRecord {
  return memoryRecordSchema.parse({
    id: `memory-${pair.id}`,
    scope: "pair",
    visibility: "public",
    subjectIds: pair.participantIds,
    pairId: pair.id,
    scenarioId: "temporal-coffee-shop",
    dateSessionId: "date-session-1",
    text: "Jenna and Vhool filed a clean first exchange. The table survived procurement.",
    tags: ["date_summary"],
    importance: 4,
    createdAt: "2026-05-05T12:00:00.000Z",
  });
}
