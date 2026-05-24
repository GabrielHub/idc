import { describe, expect, it } from "vitest";

import { gameSaveSchema, type MemoryRecord } from "../domain/game";
import { derivePairArchiveGraph } from "./pair-archive-graph";
import {
  createSyntheticGameSave,
  generateSyntheticRoster,
  sampleSyntheticPairIds,
} from "./relationship-graph-scale";
import { buildRelationshipIndex, getPairProjectionByPairId } from "./relationship-index";

const SEED_DATE = new Date("2026-05-15T12:00:00.000Z");
const ROSTER_SIZES = [40, 100, 250] as const;

describe("relationship graph scale benches", () => {
  for (const size of ROSTER_SIZES) {
    it(`seeds a ${size}-member save without dense pair storage`, () => {
      const roster = generateSyntheticRoster({ size });
      expect(roster).toHaveLength(size);
      const ids = new Set(roster.map((member) => member.id));
      expect(ids.size).toBe(size);

      const save = createSyntheticGameSave(size, SEED_DATE);
      // Sparse model: a fresh save with N members carries zero pair edges.
      expect(save.pairStates).toEqual([]);
      // Serialized JSON should stay linear in roster size, not in N^2 pairs.
      // A dense 250-member save with seeded scenario counters would add
      // ~250*249/2 * 56 = 1.7M bytes of empty zero counters alone, so the
      // bound is well below that threshold while leaving headroom for member
      // fixture growth as authored registers and tics expand during the voice
      // tuning pass. Cap bumped from 3M to 3.5M after the Cha Yusung register
      // rewrite expanded from a single phrase to a full webtoon-cadence spec,
      // then to 3.6M after Saffron Vex, Mjolnir, and Concord joined the roster
      // with full-spec voice registers, then to 3.8M when structured voice
      // fields made member mechanics and constraints first-class save payload.
      const serialized = JSON.stringify(save);
      expect(serialized.length).toBeLessThan(3_800_000);
    });

    it(`parses a ${size}-member save through gameSaveSchema`, () => {
      const save = createSyntheticGameSave(size, SEED_DATE);
      const reparsed = gameSaveSchema.parse(JSON.parse(JSON.stringify(save)));
      expect(reparsed.members).toHaveLength(size);
      expect(reparsed.pairStates).toEqual([]);
    });

    it(`looks up pair projections via the relationship index at ${size} members`, () => {
      const save = createSyntheticGameSave(size, SEED_DATE);
      const index = buildRelationshipIndex(save);
      const pairIds = sampleSyntheticPairIds(save.members, 64);
      expect(pairIds.length).toBeGreaterThan(0);

      for (const pairId of pairIds) {
        const projection = getPairProjectionByPairId(index, pairId);
        expect(projection).not.toBeUndefined();
        expect(projection!.source).toBe("projected");
        expect(projection!.completedDateIds).toEqual([]);
        expect(Object.keys(projection!.scenarioUseCounts)).toEqual([]);
      }
    });

    it(`derives a Pair archive graph at ${size} members from materialized edges only`, () => {
      const save = createSyntheticGameSave(size, SEED_DATE);
      // Materialize a handful of edges so the bench measures the real
      // derivation cost: Pair archive only renders pairs with filed memories
      // that map to a persisted edge.
      const sampledPairIds = sampleSyntheticPairIds(save.members, 8);
      const index = buildRelationshipIndex(save);
      const materializedEdges = sampledPairIds.flatMap((pairId) => {
        const projection = getPairProjectionByPairId(index, pairId);
        if (projection === undefined) return [];
        const { source: _source, ...edge } = projection;
        return [edge];
      });
      const memories: MemoryRecord[] = materializedEdges.map((edge, memIndex) => ({
        id: `memory-${edge.id}-bench-${memIndex}`,
        scope: "pair",
        visibility: "public",
        subjectIds: [...edge.participantIds],
        pairId: edge.id,
        text: `Pair archive bench memory ${memIndex + 1}.`,
        tags: ["bench"],
        importance: (memIndex % 5) + 1,
        createdAt: `2026-05-15T12:0${memIndex}:00.000Z`,
      }));
      const graph = derivePairArchiveGraph(save.members, materializedEdges, memories, {
        minDegree: 1,
      });
      expect(graph.edges.length).toBe(materializedEdges.length);
      // The bench is about scale, not exact layout. Sanity: nodes only carry
      // members touched by the materialized edges; the rest are isolated.
      const visibleMemberIds = new Set(
        materializedEdges.flatMap((edge) => [...edge.participantIds]),
      );
      expect(graph.nodes.length).toBe(visibleMemberIds.size);
      expect(graph.meta.isolatedMembers.length).toBe(save.members.length - visibleMemberIds.size);
    });
  }
});
