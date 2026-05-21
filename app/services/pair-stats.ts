import {
  pairStatsSchema,
  RELATIONSHIP_STATS,
  type JudgeSnapshot,
  type PairState,
  type PairStats,
  type RelationshipStat,
} from "../domain/game";
import { clampDelta, clampScore } from "./utils";

export type PrimaryRelationshipStat = Exclude<RelationshipStat, "relationshipHealth" | "strain">;

export type PrimaryStatDeltas = Partial<Record<PrimaryRelationshipStat, number>>;

const DERIVED_RELATIONSHIP_STATS = new Set<RelationshipStat>(["relationshipHealth", "strain"]);

export function isDerivedRelationshipStat(stat: RelationshipStat): boolean {
  return DERIVED_RELATIONSHIP_STATS.has(stat);
}

export function derivePairStats(stats: PairStats): PairStats {
  const strain = clampScore(Math.round((stats.conflict + (100 - stats.stability)) / 2));
  const relationshipHealth = clampScore(
    Math.round((stats.chemistry + stats.trust + stats.stability + (100 - stats.conflict)) / 4),
  );

  return pairStatsSchema.parse({
    ...stats,
    strain,
    relationshipHealth,
  });
}

export function applyPrimaryPairStatDeltas(
  stats: PairStats,
  deltas: Partial<Record<RelationshipStat, number>>,
): PairStats {
  const nextStats = { ...stats };

  for (const stat of RELATIONSHIP_STATS) {
    if (isDerivedRelationshipStat(stat)) {
      continue;
    }

    nextStats[stat] = clampScore(nextStats[stat] + (deltas[stat] ?? 0));
  }

  return derivePairStats(pairStatsSchema.parse(nextStats));
}

export function deriveJudgeSnapshotPairStatDeltas(
  pairState: PairState,
  judgeSnapshot: JudgeSnapshot,
): JudgeSnapshot {
  const nextStats = applyPrimaryPairStatDeltas(pairState.stats, judgeSnapshot.statDeltas);
  const nextStatDeltas: Partial<Record<RelationshipStat, number>> = {};

  for (const stat of RELATIONSHIP_STATS) {
    if (isDerivedRelationshipStat(stat)) {
      nextStatDeltas[stat] = clampDelta(nextStats[stat] - pairState.stats[stat]);
      continue;
    }

    if (judgeSnapshot.statDeltas[stat] !== undefined) {
      nextStatDeltas[stat] = judgeSnapshot.statDeltas[stat];
    }
  }

  return {
    ...judgeSnapshot,
    statDeltas: nextStatDeltas,
  };
}
