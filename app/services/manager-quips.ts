import type { DateSession, GameSave, ManagerQuipHistoryRecord, PairState } from "../domain/game";
import {
  MANAGER_QUIP_CATALOG,
  MANAGER_QUIP_TRIGGER_GROUP_BY_KEY,
  MANAGER_RETENTION_WARNING_THRESHOLD,
  type ManagerQuip,
  type ManagerQuipCadence,
  type ManagerQuipTriggerKey,
} from "../fixtures/manager-quips";
import { derivePairTrajectory } from "./pair-trajectory";

export type ManagerQuipResolveResult = {
  quipId: string;
  triggerKey: ManagerQuipTriggerKey;
  cadence: ManagerQuipCadence;
  surfaceKey?: string;
  historyRecord: ManagerQuipHistoryRecord;
};

export type ManagerQuipResolveInput = {
  triggerKey: ManagerQuipTriggerKey;
  history: readonly ManagerQuipHistoryRecord[];
  currentShiftNumber: number;
  sessionPlayedQuipIds?: ReadonlySet<string>;
  surfaceKey?: string;
  now?: Date;
  random?: () => number;
};

const HISTORY_RETENTION_SHIFTS = 1;

export function resolveManagerQuip(
  input: ManagerQuipResolveInput,
): ManagerQuipResolveResult | null {
  const group = MANAGER_QUIP_TRIGGER_GROUP_BY_KEY[input.triggerKey];
  if (group === undefined) {
    return null;
  }

  const surfaceKey = normalizeSurfaceKey(input.surfaceKey);
  if (
    !shouldFire(
      group.cadence,
      input.triggerKey,
      surfaceKey,
      input.currentShiftNumber,
      input.history,
    )
  ) {
    return null;
  }

  const variants = MANAGER_QUIP_CATALOG.filter((quip) => quip.triggerKey === input.triggerKey);
  if (variants.length === 0) {
    return null;
  }

  const sessionPlayed = input.sessionPlayedQuipIds ?? new Set<string>();
  const random = input.random ?? Math.random;
  const chosen = pickVariant(variants, sessionPlayed, random);
  const now = input.now ?? new Date();
  const historyRecord: ManagerQuipHistoryRecord = {
    quipId: chosen.id,
    triggerKey: input.triggerKey,
    cadence: group.cadence,
    shiftNumber: Math.max(1, Math.floor(input.currentShiftNumber)),
    firedAt: now.toISOString(),
    ...(surfaceKey === undefined ? {} : { surfaceKey }),
  };

  return {
    quipId: chosen.id,
    triggerKey: input.triggerKey,
    cadence: group.cadence,
    surfaceKey,
    historyRecord,
  };
}

export function pruneManagerQuipHistory(
  history: readonly ManagerQuipHistoryRecord[],
  currentShiftNumber: number,
): ManagerQuipHistoryRecord[] {
  const keepBeyondShift = currentShiftNumber - HISTORY_RETENTION_SHIFTS;
  return history.filter((record) => {
    if (record.cadence === "rare") return true;
    return record.shiftNumber >= keepBeyondShift;
  });
}

export function appendManagerQuipHistory(
  history: readonly ManagerQuipHistoryRecord[],
  record: ManagerQuipHistoryRecord,
  currentShiftNumber: number,
): ManagerQuipHistoryRecord[] {
  const pruned = pruneManagerQuipHistory(history, currentShiftNumber);
  return [...pruned, record];
}

function shouldFire(
  cadence: ManagerQuipCadence,
  triggerKey: ManagerQuipTriggerKey,
  surfaceKey: string | undefined,
  currentShiftNumber: number,
  history: readonly ManagerQuipHistoryRecord[],
): boolean {
  if (cadence === "rare") {
    return !history.some((record) => record.triggerKey === triggerKey);
  }
  if (cadence === "regular") {
    return !history.some(
      (record) => record.triggerKey === triggerKey && record.shiftNumber === currentShiftNumber,
    );
  }
  // episodic
  if (surfaceKey === undefined) {
    return !history.some(
      (record) => record.triggerKey === triggerKey && record.surfaceKey === undefined,
    );
  }
  return !history.some(
    (record) => record.triggerKey === triggerKey && record.surfaceKey === surfaceKey,
  );
}

function pickVariant(
  variants: readonly ManagerQuip[],
  sessionPlayedQuipIds: ReadonlySet<string>,
  random: () => number,
): ManagerQuip {
  const fresh = variants.filter((quip) => !sessionPlayedQuipIds.has(quip.id));
  const pool = fresh.length > 0 ? fresh : variants;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
  return pool[index];
}

function normalizeSurfaceKey(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export type PairTrajectoryDiffInput = {
  previousPairState: PairState | undefined;
  nextPairState: PairState;
  previousCompletedSessions?: readonly DateSession[];
  nextCompletedSessions: readonly DateSession[];
  currentSession?: DateSession;
};

export function pairEnteredBrittleTrajectory({
  previousPairState,
  nextPairState,
  previousCompletedSessions,
  nextCompletedSessions,
  currentSession,
}: PairTrajectoryDiffInput): boolean {
  const nextTrajectory = derivePairTrajectory({
    pairState: nextPairState,
    completedSessions: nextCompletedSessions,
    currentSession,
  });

  if (nextTrajectory.state !== "brittle") {
    return false;
  }

  if (previousPairState === undefined) {
    return true;
  }

  const previousTrajectory = derivePairTrajectory({
    pairState: previousPairState,
    completedSessions: previousCompletedSessions ?? nextCompletedSessions,
    currentSession,
  });

  return previousTrajectory.state !== "brittle";
}

export type ActiveMemberRetentionDip = {
  memberId: string;
  previousRetention: number;
  nextRetention: number;
};

type SaveMember = GameSave["members"][number];

export function detectRetentionWarningDip(
  previousSave: GameSave | undefined,
  nextSave: GameSave,
  previousById?: ReadonlyMap<string, SaveMember>,
): ActiveMemberRetentionDip | null {
  if (previousSave === undefined) {
    return null;
  }
  const lookup = previousById ?? indexMembersById(previousSave.members);
  for (const nextMember of nextSave.members) {
    if (nextMember.state.status !== "active") continue;
    const previousMember = lookup.get(nextMember.id);
    if (previousMember === undefined) continue;
    if (previousMember.state.status !== "active") continue;
    if (
      previousMember.state.retention >= MANAGER_RETENTION_WARNING_THRESHOLD &&
      nextMember.state.retention < MANAGER_RETENTION_WARNING_THRESHOLD
    ) {
      return {
        memberId: nextMember.id,
        previousRetention: previousMember.state.retention,
        nextRetention: nextMember.state.retention,
      };
    }
  }
  return null;
}

export function detectMemberQuitTransition(
  previousSave: GameSave | undefined,
  nextSave: GameSave,
  previousById?: ReadonlyMap<string, SaveMember>,
): string | null {
  if (previousSave === undefined) {
    return null;
  }
  const lookup = previousById ?? indexMembersById(previousSave.members);
  for (const nextMember of nextSave.members) {
    if (nextMember.state.status !== "quit") continue;
    const previousMember = lookup.get(nextMember.id);
    if (previousMember === undefined) continue;
    if (previousMember.state.status !== "quit") {
      return nextMember.id;
    }
  }
  return null;
}

export function detectFocusSwapDropOfActive(
  previousSave: GameSave | undefined,
  nextSave: GameSave,
  previousById?: ReadonlyMap<string, SaveMember>,
  nextById?: ReadonlyMap<string, SaveMember>,
): string | null {
  if (previousSave === undefined) {
    return null;
  }
  const previousFocus = new Set(previousSave.focusedMemberIds);
  const nextFocus = new Set(nextSave.focusedMemberIds);
  const previousLookup = previousById ?? indexMembersById(previousSave.members);
  const nextLookup = nextById ?? indexMembersById(nextSave.members);
  for (const previousId of previousFocus) {
    if (nextFocus.has(previousId)) continue;
    const previous = previousLookup.get(previousId);
    const next = nextLookup.get(previousId);
    if (previous === undefined || next === undefined) continue;
    if (previous.state.status !== "active") continue;
    if (next.state.status !== "active") continue;
    return previousId;
  }
  return null;
}

export function indexMembersById(members: readonly SaveMember[]): ReadonlyMap<string, SaveMember> {
  return new Map(members.map((member) => [member.id, member] as const));
}

export function shouldFireSoftWinQuip(
  history: readonly ManagerQuipHistoryRecord[],
  closureCount: number,
): boolean {
  if (closureCount < 5) return false;
  return !history.some((record) => record.triggerKey === "campaign.closures.five");
}
