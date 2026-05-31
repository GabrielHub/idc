import {
  gameSaveSchema,
  memoryRecordSchema,
  type DateFinalReport,
  type DateSession,
  type GameSave,
  type Member,
  type MemoryRecord,
  type PairState,
} from "../domain/game";
import { applyClosureBudgetBump, applyMemberQuitBudgetCut } from "./budget";
import { attachClosureCardOffer } from "./deck";
import { syncActiveShiftFocusCases } from "./focus-cases";
import { buildLatestCompletedSessionMap } from "./relationship-index";
import { clampScore } from "./utils";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

export const CLIENT_LOSS_LIMIT_BASE = 3;
export const SOFT_WIN_THRESHOLD = 5;
export const CLOSURE_RETENTION_BUMP = 5;
export const PAIR_CLOSURE_TAG = "pair_closure";
export const CLOSURE_SUMMARY_MAX_LENGTH = 360;
export const CLOSURE_SUMMARY_MIN_LENGTH = 24;

export const CLOSURE_THRESHOLD = {
  chemistry: 68,
  trust: 68,
  relationshipHealth: 70,
  strainMax: 42,
  conflictMax: 42,
  minCompletedDates: 2,
} as const;

export const DECISIVE_CLOSURE_THRESHOLD = {
  dateHealth: 72,
  chemistry: 64,
  trust: 64,
  relationshipHealth: 68,
  strainMax: 48,
  conflictMax: 48,
  minCompletedDates: 2,
} as const;

export function isPairClosureMemory(memory: MemoryRecord): boolean {
  return memory.scope === "pair" && memory.tags.includes(PAIR_CLOSURE_TAG);
}

const DASH_PATTERN = /[\u2013\u2014]/u;
const CUPID_EDITORIALIZE_PATTERN =
  /\b(?:cupid|the company|the agency|the app|matchmak\w*|the office)\b/iu;
const STAT_NUMBER_PATTERN =
  /\b(?:date health|spark|strain|chemistry|trust|stability|conflict|relationship health|health)\s*[:=]?\s*-?\d+\b/iu;
const RAW_NUMERIC_DELTA_PATTERN = /\b[-+]?\d+\s*%/u;

export type ClosureReadinessMember = Pick<Member, "id"> & {
  state: Pick<Member["state"], "status">;
};

export type ClosureReadinessInput = {
  pairState: Pick<PairState, "stats" | "completedDateIds" | "participantIds"> &
    Partial<Pick<PairState, "agreements" | "openLoops">>;
  outcome: DateFinalReport["outcome"];
  completedDateCount: number;
  members: readonly ClosureReadinessMember[];
  finalDateHealth?: number;
};

/** Hard rule for closure readiness. See app/docs/gameplay/case-management.tsx "Case closures" and "Win conditions". */
export function evaluateClosureReadiness({
  pairState,
  outcome,
  completedDateCount,
  members,
  finalDateHealth,
}: ClosureReadinessInput): boolean {
  if (outcome !== "second_date") {
    return false;
  }

  const meetsCleanDateCount = completedDateCount >= CLOSURE_THRESHOLD.minCompletedDates;
  const meetsDecisiveDateCount = completedDateCount >= DECISIVE_CLOSURE_THRESHOLD.minCompletedDates;
  if (!meetsCleanDateCount && !meetsDecisiveDateCount) {
    return false;
  }

  const { stats } = pairState;
  const cleanStats =
    meetsCleanDateCount &&
    stats.chemistry >= CLOSURE_THRESHOLD.chemistry &&
    stats.trust >= CLOSURE_THRESHOLD.trust &&
    stats.relationshipHealth >= CLOSURE_THRESHOLD.relationshipHealth &&
    stats.strain <= CLOSURE_THRESHOLD.strainMax &&
    stats.conflict <= CLOSURE_THRESHOLD.conflictMax;
  const decisiveStats =
    finalDateHealth !== undefined &&
    finalDateHealth >= DECISIVE_CLOSURE_THRESHOLD.dateHealth &&
    meetsDecisiveDateCount &&
    stats.chemistry >= DECISIVE_CLOSURE_THRESHOLD.chemistry &&
    stats.trust >= DECISIVE_CLOSURE_THRESHOLD.trust &&
    stats.relationshipHealth >= DECISIVE_CLOSURE_THRESHOLD.relationshipHealth &&
    stats.strain <= DECISIVE_CLOSURE_THRESHOLD.strainMax &&
    stats.conflict <= DECISIVE_CLOSURE_THRESHOLD.conflictMax;

  if (!cleanStats && !decisiveStats) return false;
  if (pairState.agreements?.some((agreement) => agreement.status === "broken") === true) {
    return false;
  }
  const openLoopCount = pairState.openLoops?.filter((loop) => loop.status === "open").length ?? 0;
  if (openLoopCount > 1) {
    return false;
  }
  if (openLoopCount === 1 && !canCarryOneOpenLoopForClosure(stats)) return false;

  const membersById = new Map(members.map((member) => [member.id, member] as const));
  for (const participantId of pairState.participantIds) {
    const member = membersById.get(participantId);
    if (member === undefined || member.state.status !== "active") {
      return false;
    }
  }

  return true;
}

export function canCarryOneOpenLoopForClosure(stats: PairState["stats"]): boolean {
  return (
    stats.trust >= CLOSURE_THRESHOLD.trust + 8 &&
    stats.relationshipHealth >= CLOSURE_THRESHOLD.relationshipHealth + 6 &&
    stats.strain <= CLOSURE_THRESHOLD.strainMax - 10 &&
    stats.conflict <= CLOSURE_THRESHOLD.conflictMax - 10
  );
}

export function clientLossLimit(save: Pick<GameSave, "closureCount">): number {
  return CLIENT_LOSS_LIMIT_BASE + save.closureCount;
}

export function isSoftWinReached(save: Pick<GameSave, "closureCount">): boolean {
  return save.closureCount >= SOFT_WIN_THRESHOLD;
}

export function shouldShowSoftWin(save: Pick<GameSave, "closureCount" | "softWinSeen">): boolean {
  return isSoftWinReached(save) && save.softWinSeen !== true;
}

export function shouldShowSoftWinForActiveShift(save: GameSave): boolean {
  if (!shouldShowSoftWin(save)) {
    return false;
  }

  const thresholdClosure = getClosureMemoriesByCreatedAt(save)[SOFT_WIN_THRESHOLD - 1];
  if (thresholdClosure === undefined) {
    return false;
  }

  const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);
  if (activeShift === undefined) {
    return false;
  }

  return activeShift.startedAt > thresholdClosure.createdAt;
}

export function markSoftWinSeen(save: GameSave, now: Date = new Date()): GameSave {
  if (save.softWinSeen === true) {
    return save;
  }

  return gameSaveSchema.parse({
    ...save,
    softWinSeen: true,
    updatedAt: now.toISOString(),
  });
}

export type ReadyClosurePair = {
  pairState: PairState;
  participants: [Member, Member];
  finalReport: DateFinalReport;
  dateSession: DateSession;
};

export function getReadyClosurePairs(save: GameSave): ReadyClosurePair[] {
  const membersById = new Map(save.members.map((member) => [member.id, member] as const));
  const latestSessionByPairId = buildLatestCompletedSessionMap(save.dateSessions);
  const ready: ReadyClosurePair[] = [];

  for (const pairState of save.pairStates) {
    const [firstId, secondId] = pairState.participantIds;
    const first = membersById.get(firstId);
    const second = membersById.get(secondId);

    if (first === undefined || second === undefined) continue;
    if (first.state.status !== "active" || second.state.status !== "active") continue;

    const latestSession = latestSessionByPairId.get(pairState.id);
    if (latestSession === undefined) continue;

    const report = latestSession.finalReport;
    if (report.readyToClose !== true) continue;

    const stillReady = evaluateClosureReadiness({
      pairState,
      outcome: report.outcome,
      completedDateCount: pairState.completedDateIds.length,
      members: [first, second],
      finalDateHealth: latestSession.dateHealth,
    });

    if (!stillReady) continue;

    ready.push({
      pairState,
      participants: [first, second],
      finalReport: report,
      dateSession: latestSession,
    });
  }

  return ready;
}

function getClosureMemoriesByCreatedAt(save: Pick<GameSave, "memories">): MemoryRecord[] {
  return save.memories
    .filter(isPairClosureMemory)
    .sort(
      (first, second) =>
        first.createdAt.localeCompare(second.createdAt) || first.id.localeCompare(second.id),
    );
}

export type ClosurePairInput = {
  save: GameSave;
  pairId: string;
  summary: string;
  now?: Date;
};

export function closePair({ save, pairId, summary, now = new Date() }: ClosurePairInput): GameSave {
  const trimmedSummary = summary.trim();
  validateClosureSummary(trimmedSummary);

  const pairState = save.pairStates.find((candidate) => candidate.id === pairId);
  if (pairState === undefined) {
    throw new Error(`Pair ${pairId} is not on the case board.`);
  }

  const ready = getReadyClosurePairs(save).find((entry) => entry.pairState.id === pairId);
  if (ready === undefined) {
    throw new Error("Closure rejected. The pair no longer meets the closure threshold.");
  }

  const timestamp = now.toISOString();
  const participantIds = new Set(pairState.participantIds);
  const closureMemory = buildClosureMemoryRecord({
    pairState,
    summary: trimmedSummary,
    dateSession: ready.dateSession,
    timestamp,
  });

  const updatedMembers = save.members.map((member) => {
    if (participantIds.has(member.id)) {
      return {
        ...member,
        state: {
          ...member.state,
          status: "closed" as const,
          recentDateResult: "Case closed. The pair left Cupid together.",
        },
      };
    }

    if (member.state.status === "active") {
      const retention = clampScore(member.state.retention + CLOSURE_RETENTION_BUMP);
      if (retention === member.state.retention) {
        return member;
      }

      return {
        ...member,
        state: {
          ...member.state,
          retention,
        },
      };
    }

    return member;
  });

  const focusedMemberIds = save.focusedMemberIds.filter(
    (memberId) => !participantIds.has(memberId),
  );

  const activeShiftNumber =
    save.shifts.find((shift) => shift.id === save.activeShiftId)?.shiftNumber ?? 1;
  const withBudgetBump = applyClosureBudgetBump(
    {
      ...save,
      members: updatedMembers,
      memories: [...save.memories, closureMemory],
      focusedMemberIds,
      closureCount: save.closureCount + 1,
      updatedAt: timestamp,
    },
    activeShiftNumber,
  );
  const withQuitCutCheck = applyMemberQuitBudgetCut({
    previousSave: save,
    nextSave: withBudgetBump,
    shift: activeShiftNumber,
  });
  const closedSave = gameSaveSchema.parse({
    ...withQuitCutCheck,
    updatedAt: timestamp,
  });

  // Filing a closure is the win moment: draw the larger closure offer with a
  // one-time reshuffle off the pile.
  return syncActiveShiftFocusCases(attachClosureCardOffer(closedSave));
}

function buildClosureMemoryRecord({
  pairState,
  summary,
  dateSession,
  timestamp,
}: {
  pairState: PairState;
  summary: string;
  dateSession: DateSession;
  timestamp: string;
}): MemoryRecord {
  const embedding = createDeterministicEmbedding(summary);

  return memoryRecordSchema.parse({
    id: `memory-${pairState.id}-${PAIR_CLOSURE_TAG}-${timestamp}`,
    scope: "pair",
    visibility: "public",
    subjectIds: pairState.participantIds,
    pairId: pairState.id,
    scenarioId: dateSession.scenarioId,
    dateSessionId: dateSession.id,
    text: summary,
    tags: [PAIR_CLOSURE_TAG, "date_summary"],
    importance: 5,
    createdAt: timestamp,
    embedding,
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: embedding.length,
  });
}

export class ClosureSummaryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClosureSummaryValidationError";
  }
}

export function validateClosureSummary(summary: string): void {
  const trimmed = summary.trim();

  if (trimmed.length < CLOSURE_SUMMARY_MIN_LENGTH) {
    throw new ClosureSummaryValidationError(
      `Closure summary is too short (min ${CLOSURE_SUMMARY_MIN_LENGTH} characters).`,
    );
  }

  if (trimmed.length > CLOSURE_SUMMARY_MAX_LENGTH) {
    throw new ClosureSummaryValidationError(
      `Closure summary is too long (max ${CLOSURE_SUMMARY_MAX_LENGTH} characters).`,
    );
  }

  if (DASH_PATTERN.test(trimmed)) {
    throw new ClosureSummaryValidationError("Closure summary may not contain em or en dashes.");
  }

  if (CUPID_EDITORIALIZE_PATTERN.test(trimmed)) {
    throw new ClosureSummaryValidationError(
      "Closure summary must focus on the pair, not on Cupid or the app.",
    );
  }

  if (STAT_NUMBER_PATTERN.test(trimmed)) {
    throw new ClosureSummaryValidationError(
      "Closure summary must not include exact stat numbers (Date Health, Spark, Strain, etc.).",
    );
  }

  if (RAW_NUMERIC_DELTA_PATTERN.test(trimmed)) {
    throw new ClosureSummaryValidationError("Closure summary must not include raw percentages.");
  }
}
