import type { DateSession, PairState } from "../domain/game";
import { computeDateStatChange } from "./date-stat-change";
import { derivePairTrajectory, type PairTrajectoryState } from "./pair-trajectory";

/**
 * Pair-edge enrichment for the archive constellation tooltip: the stat swing
 * from the pair's most recent completed date, plus the qualitative trajectory
 * state. Both are grounded in persisted gameplay (judge snapshots + outcome
 * deltas, and the same trajectory classifier the date prompts use) — no
 * invented "dates to closure" estimate.
 */

export type EdgeLastDateDelta = {
  chemistry: number;
  trust: number;
  strain: number;
};

export type EdgeClosureDetail = {
  /** Stat change from the pair's last completed date, or null when none on file. */
  lastDate: EdgeLastDateDelta | null;
  trajectory: PairTrajectoryState;
};

export function deriveEdgeClosureDetail({
  pairState,
  dateSessions,
}: {
  pairState: PairState;
  dateSessions: readonly DateSession[];
}): EdgeClosureDetail {
  const completedSessions = dateSessions.filter(
    (session) => session.pairId === pairState.id && session.finalReport !== undefined,
  );
  const lastCompletedId = pairState.completedDateIds.at(-1);
  const lastSession =
    lastCompletedId === undefined
      ? undefined
      : completedSessions.find((session) => session.id === lastCompletedId);
  const lastDate = lastSession === undefined ? null : extractLastDateDelta(lastSession);
  const trajectory = derivePairTrajectory({ pairState, completedSessions }).state;
  return { lastDate, trajectory };
}

function extractLastDateDelta(session: DateSession): EdgeLastDateDelta | null {
  const change = computeDateStatChange(session);
  const delta: EdgeLastDateDelta = {
    chemistry: change.pair.chemistry ?? 0,
    trust: change.pair.trust ?? 0,
    strain: change.pair.strain ?? 0,
  };
  if (delta.chemistry === 0 && delta.trust === 0 && delta.strain === 0) return null;
  return delta;
}
