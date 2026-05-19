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
  subnotes: string[];
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
  const subnotes = buildTrajectorySubnotes({
    pairState,
    openLoopCount: openLoops.length,
    brokenAgreementCount: brokenAgreements.length,
    totalDateHealthDelta,
    hasRecentEarlyEnd,
  });

  if (isClosureRunway(pairState, recentSessions.length, hasRecentSecondDate)) {
    return {
      state: "closure_runway",
      performerGuidance:
        "The file is close to leaving together. Give concrete future intent room to surface without forcing ceremony.",
      judgeGuidance:
        "Watch for a clean future-facing yes, honored agreements, and low-strain specificity.",
      subnotes,
    };
  }

  if (
    pairState.stats.strain >= 70 ||
    pairState.stats.conflict >= 70 ||
    brokenAgreements.length > 0 ||
    hasRecentEarlyEnd
  ) {
    return {
      state: "brittle",
      performerGuidance:
        "The file is fragile. Respect active agreements and do not make the unresolved item carry the whole date.",
      judgeGuidance:
        "Score repeat breaches, public pressure, or ignored boundaries sharply. Reward specific repair.",
      subnotes,
    };
  }

  if (hasRecentRepair || resolvedLoops.length > 0) {
    return {
      state: "recovering",
      performerGuidance:
        "The pair has repair material on file. Let follow-through matter more than fresh charm.",
      judgeGuidance:
        "Reward concrete follow-through on prior repair. Penalize cosmetic apology without changed behavior.",
      subnotes,
    };
  }

  if (
    openLoops.length >= 2 ||
    (recentSessions.length >= 2 && Math.abs(totalDateHealthDelta) <= 2)
  ) {
    return {
      state: "stuck",
      performerGuidance:
        "The file is circling. Pick up one unresolved item or make one clean choice instead of reopening logistics.",
      judgeGuidance:
        "Reward movement on an unresolved item. Penalize repeating the same plan, dodge, or question.",
      subnotes,
    };
  }

  if (totalDateHealthDelta >= 6) {
    return {
      state: "warming",
      performerGuidance:
        "The file has usable warmth. Let interest become specific without smoothing over active agreements.",
      judgeGuidance: "Reward specific warmth, clean listening, and agreement follow-through.",
      subnotes,
    };
  }

  if (activeAgreements.length > 0 || openLoops.length > 0) {
    return {
      state: "steady",
      performerGuidance:
        "The file has prior commitments. Keep them present as table stakes, not as a speech topic.",
      judgeGuidance:
        "Treat honored agreements and useful loop movement as stronger evidence than generic rapport.",
      subnotes,
    };
  }

  return {
    state: "steady",
    performerGuidance:
      "No special pair trajectory is filed. Evaluate the exchange on concrete moves.",
    judgeGuidance: "Use the exchange evidence, not expected chemistry.",
    subnotes,
  };
}

function buildTrajectorySubnotes({
  pairState,
  openLoopCount,
  brokenAgreementCount,
  totalDateHealthDelta,
  hasRecentEarlyEnd,
}: {
  pairState: PairState;
  openLoopCount: number;
  brokenAgreementCount: number;
  totalDateHealthDelta: number;
  hasRecentEarlyEnd: boolean;
}): string[] {
  const notes: string[] = [];

  if (pairState.stats.spark >= 70 && pairState.stats.trust < 55) {
    notes.push("Warmth is outrunning trust. Reward concrete follow-through over charm.");
  }

  if (brokenAgreementCount > 0) {
    notes.push(
      "A broken agreement is still shaping the file. Repair needs action, not apology copy.",
    );
  }

  if (openLoopCount >= 2) {
    notes.push(
      "Several unresolved items are open. One useful answer matters more than new material.",
    );
  }

  if (pairState.stats.strain > CLOSURE_THRESHOLD.strainMax) {
    notes.push("Closure pressure is blocked by strain. Let calm specificity count.");
  }

  if (pairState.stats.conflict > CLOSURE_THRESHOLD.conflictMax) {
    notes.push("Closure pressure is blocked by conflict. Reward a clean choice that lowers heat.");
  }

  if (hasRecentEarlyEnd) {
    notes.push("The last hard stop still echoes. Do not treat a smooth opener as full repair.");
  }

  if (totalDateHealthDelta <= -6) {
    notes.push(
      "Recent Cupid movement is cooling. Look for changed behavior before granting momentum.",
    );
  }

  return notes.slice(0, 4);
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
