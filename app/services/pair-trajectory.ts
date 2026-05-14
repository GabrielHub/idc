import type { DateSession, PairState } from "../domain/game";
import { CLOSURE_THRESHOLD } from "./closures";

export type PairTrajectoryState =
  | "steady"
  | "warming"
  | "recovering"
  | "stuck"
  | "brittle"
  | "closure_runway";

export type PairTrajectory = {
  state: PairTrajectoryState;
  performerGuidance: string;
  judgeGuidance: string;
};

export function derivePairTrajectory({
  pairState,
  currentSession,
  completedSessions = [],
}: {
  pairState: PairState;
  currentSession?: DateSession;
  completedSessions?: readonly DateSession[];
}): PairTrajectory {
  const activeAgreements = pairState.agreements.filter(
    (agreement) => agreement.status === "active",
  );
  const brokenAgreements = pairState.agreements.filter(
    (agreement) => agreement.status === "broken",
  );
  const openLoops = pairState.openLoops.filter((loop) => loop.status === "open");
  const resolvedLoops = pairState.openLoops.filter((loop) => loop.status === "resolved");
  const recentSessions = completedSessions
    .filter((session) => session.pairId === pairState.id && session.finalReport !== undefined)
    .slice(-3);
  const currentSnapshots = currentSession?.judgeSnapshots ?? [];
  const recentSnapshots = [
    ...recentSessions.flatMap((session) => session.judgeSnapshots),
    ...currentSnapshots,
  ].slice(-4);
  const totalDateHealthDelta = recentSnapshots.reduce(
    (total, snapshot) => total + snapshot.dateHealthDelta,
    0,
  );
  const hasRecentRepair = recentSessions.some(
    (session) => session.finalReport?.appliedFollowUp === "repair",
  );
  const hasRecentSecondDate = recentSessions.some(
    (session) => session.finalReport?.outcome === "second_date",
  );
  const hasRecentEarlyEnd = recentSessions.some((session) => session.status === "ended_early");

  if (isClosureRunway(pairState, recentSessions.length, hasRecentSecondDate)) {
    return trajectory(
      "closure_runway",
      "The file is close to leaving together. Give concrete future intent room to surface without forcing ceremony.",
      "Watch for a clean future-facing yes, honored agreements, and low-strain specificity.",
    );
  }

  if (
    pairState.stats.strain >= 70 ||
    pairState.stats.conflict >= 70 ||
    brokenAgreements.length > 0 ||
    hasRecentEarlyEnd
  ) {
    return trajectory(
      "brittle",
      "The file is fragile. Respect active agreements and do not make the unresolved item carry the whole date.",
      "Score repeat breaches, public pressure, or ignored boundaries sharply. Reward specific repair.",
    );
  }

  if (hasRecentRepair || resolvedLoops.length > 0) {
    return trajectory(
      "recovering",
      "The pair has repair material on file. Let follow-through matter more than fresh charm.",
      "Reward concrete follow-through on prior repair. Penalize cosmetic apology without changed behavior.",
    );
  }

  if (
    openLoops.length >= 2 ||
    (recentSessions.length >= 2 && Math.abs(totalDateHealthDelta) <= 2)
  ) {
    return trajectory(
      "stuck",
      "The file is circling. Pick up one unresolved item or make one clean choice instead of reopening logistics.",
      "Reward movement on an unresolved item. Penalize repeating the same plan, dodge, or question.",
    );
  }

  if (totalDateHealthDelta >= 6 || pairState.stats.relationshipHealth >= 65) {
    return trajectory(
      "warming",
      "The file has usable warmth. Let interest become specific without smoothing over active agreements.",
      "Reward specific warmth, clean listening, and agreement follow-through.",
    );
  }

  if (activeAgreements.length > 0 || openLoops.length > 0) {
    return trajectory(
      "steady",
      "The file has prior commitments. Keep them present as table stakes, not as a speech topic.",
      "Treat honored agreements and useful loop movement as stronger evidence than generic rapport.",
    );
  }

  return trajectory(
    "steady",
    "No special pair trajectory is filed. Judge the exchange on concrete moves.",
    "Use the exchange evidence, not expected chemistry.",
  );
}

function trajectory(
  state: PairTrajectoryState,
  performerGuidance: string,
  judgeGuidance: string,
): PairTrajectory {
  return { state, performerGuidance, judgeGuidance };
}

function isClosureRunway(
  pairState: PairState,
  recentCompletedDateCount: number,
  hasRecentSecondDate: boolean,
): boolean {
  const completedDateCount = Math.max(pairState.completedDateIds.length, recentCompletedDateCount);
  return (
    completedDateCount >= CLOSURE_THRESHOLD.minCompletedDates - 1 &&
    hasRecentSecondDate &&
    pairState.stats.chemistry >= CLOSURE_THRESHOLD.chemistry - 6 &&
    pairState.stats.trust >= CLOSURE_THRESHOLD.trust - 6 &&
    pairState.stats.relationshipHealth >= CLOSURE_THRESHOLD.relationshipHealth - 6 &&
    pairState.stats.strain <= CLOSURE_THRESHOLD.strainMax + 8 &&
    pairState.stats.conflict <= CLOSURE_THRESHOLD.conflictMax + 8
  );
}
