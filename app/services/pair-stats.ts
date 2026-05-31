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
export type AppliedPairStatProjection = {
  stats: PairStats;
  statDeltas: Partial<Record<RelationshipStat, number>>;
};

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
  return projectPrimaryPairStatDeltas(stats, deltas).stats;
}

// Judge snapshots store applied deltas after projection. Replaying them into
// pair state must not scale a second time.
export function applyAppliedPairStatDeltas(
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

export function projectPrimaryPairStatDeltas(
  stats: PairStats,
  deltas: Partial<Record<RelationshipStat, number>>,
): AppliedPairStatProjection {
  const nextStats = { ...stats };
  const nextStatDeltas: Partial<Record<RelationshipStat, number>> = {};

  for (const stat of RELATIONSHIP_STATS) {
    if (isDerivedRelationshipStat(stat)) {
      continue;
    }

    const currentValue = nextStats[stat];
    const rawDelta = deltas[stat] ?? 0;
    const nextValue = clampScore(currentValue + scalePrimaryPairStatDelta(currentValue, rawDelta));
    const appliedDelta = clampDelta(nextValue - currentValue);
    nextStats[stat] = nextValue;

    if (appliedDelta !== 0) {
      nextStatDeltas[stat] = appliedDelta;
    }
  }

  const projectedStats = derivePairStats(pairStatsSchema.parse(nextStats));
  for (const stat of RELATIONSHIP_STATS) {
    if (!isDerivedRelationshipStat(stat)) {
      continue;
    }

    const appliedDelta = clampDelta(projectedStats[stat] - stats[stat]);
    if (appliedDelta !== 0) {
      nextStatDeltas[stat] = appliedDelta;
    }
  }

  return { stats: projectedStats, statDeltas: nextStatDeltas };
}

export function scalePrimaryPairStatDelta(currentValue: number, rawDelta: number): number {
  if (rawDelta === 0) {
    return 0;
  }

  const magnitude = Math.abs(rawDelta);
  const ease =
    rawDelta > 0 ? 0.72 + ((100 - currentValue) / 100) * 0.6 : 0.72 + (currentValue / 100) * 0.72;
  const scaled = Math.round(magnitude * ease);

  return rawDelta > 0 ? Math.max(1, scaled) : -Math.max(1, scaled);
}

export function deriveJudgeSnapshotPairStatDeltas(
  pairState: PairState,
  judgeSnapshot: JudgeSnapshot,
): JudgeSnapshot {
  const projection = projectPrimaryPairStatDeltas(pairState.stats, judgeSnapshot.statDeltas);

  return {
    ...judgeSnapshot,
    statDeltas: projection.statDeltas,
  };
}
