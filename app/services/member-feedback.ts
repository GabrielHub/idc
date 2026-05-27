import { MEMBER_RETENTION_WARNING_THRESHOLD, type Member, type PairState } from "../domain/game";
import { CLOSURE_THRESHOLD } from "./closures";

export type RiskZone = "steady" | "cooling" | "at-risk";

export type RiskTone = "emerald" | "amber" | "rose";

export type RiskZoneInfo = {
  zone: RiskZone;
  tone: RiskTone;
  label: string;
  rationale: string;
};

const STEADY_FLOOR = 60;

export function riskZoneForMember(member: Pick<Member, "state">): RiskZoneInfo {
  const retention = member.state.retention;

  if (retention < MEMBER_RETENTION_WARNING_THRESHOLD) {
    return {
      zone: "at-risk",
      tone: "rose",
      label: "At risk",
      rationale:
        "Confidence is critical. Another rough date or missed ask will push them off the app.",
    };
  }

  if (retention < STEADY_FLOOR) {
    return {
      zone: "cooling",
      tone: "amber",
      label: "Cooling off",
      rationale:
        "Confidence is slipping. Cover their lead ask and book matches with healthy pair stats to recover.",
    };
  }

  return {
    zone: "steady",
    tone: "emerald",
    label: "Steady",
    rationale: "Confidence is holding. Keep booking thoughtfully.",
  };
}

export type ClosureAxisKey = "chemistry" | "trust" | "relationshipHealth";

export type ClosureProgressAxis = {
  key: ClosureAxisKey;
  value: number;
  threshold: number;
  ratio: number;
  met: boolean;
};

export type ClosureProgress = {
  overall: number;
  axes: Record<ClosureAxisKey, ClosureProgressAxis>;
  datesCompleted: number;
  datesNeeded: number;
  blockers: string[];
};

export function closureProgressForPair(
  pairState: Pick<PairState, "stats" | "completedDateIds">,
): ClosureProgress {
  const { stats } = pairState;
  const axes: Record<ClosureAxisKey, ClosureProgressAxis> = {
    chemistry: makeAxis("chemistry", stats.chemistry, CLOSURE_THRESHOLD.chemistry),
    trust: makeAxis("trust", stats.trust, CLOSURE_THRESHOLD.trust),
    relationshipHealth: makeAxis(
      "relationshipHealth",
      stats.relationshipHealth,
      CLOSURE_THRESHOLD.relationshipHealth,
    ),
  };

  const datesCompleted = pairState.completedDateIds.length;
  const datesNeeded = CLOSURE_THRESHOLD.minCompletedDates;
  const dateRatio = Math.min(1, datesCompleted / datesNeeded);

  const strainRatio = makeMaxAxisRatio(stats.strain, CLOSURE_THRESHOLD.strainMax);
  const conflictRatio = makeMaxAxisRatio(stats.conflict, CLOSURE_THRESHOLD.conflictMax);
  const ratios = [
    axes.chemistry.ratio,
    axes.trust.ratio,
    axes.relationshipHealth.ratio,
    dateRatio,
    strainRatio,
    conflictRatio,
  ];
  const overall = Math.round(Math.min(...ratios) * 100);

  const blockers: string[] = [];
  if (!axes.chemistry.met) blockers.push("chemistry");
  if (!axes.trust.met) blockers.push("trust");
  if (!axes.relationshipHealth.met) blockers.push("health");
  if (stats.strain > CLOSURE_THRESHOLD.strainMax) blockers.push("strain");
  if (stats.conflict > CLOSURE_THRESHOLD.conflictMax) blockers.push("conflict");
  if (datesCompleted < datesNeeded) blockers.push("dates");

  return {
    overall,
    axes,
    datesCompleted,
    datesNeeded,
    blockers,
  };
}

function makeAxis(key: ClosureAxisKey, value: number, threshold: number): ClosureProgressAxis {
  const ratio = Math.min(1, Math.max(0, value / threshold));
  return {
    key,
    value,
    threshold,
    ratio,
    met: value >= threshold,
  };
}

function makeMaxAxisRatio(value: number, threshold: number): number {
  if (value <= threshold) return 1;
  return Math.min(1, Math.max(0, (100 - value) / (100 - threshold)));
}
