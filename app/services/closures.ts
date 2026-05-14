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
import { syncActiveShiftFocusCases } from "./focus-cases";
import { clampScore } from "./utils";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

export const CLIENT_LOSS_LIMIT_BASE = 3;
export const SOFT_WIN_THRESHOLD = 5;
export const CLOSURE_RETENTION_BUMP = 5;
export const PAIR_CLOSURE_TAG = "pair_closure";
export const CLOSURE_SUMMARY_MAX_LENGTH = 360;
export const CLOSURE_SUMMARY_MIN_LENGTH = 24;

export const CLOSURE_THRESHOLD = {
  chemistry: 75,
  trust: 75,
  relationshipHealth: 75,
  strainMax: 30,
  conflictMax: 30,
  minCompletedDates: 3,
} as const;

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
  pairState: Pick<PairState, "stats" | "completedDateIds" | "participantIds">;
  outcome: DateFinalReport["outcome"];
  completedDateCount: number;
  members: readonly ClosureReadinessMember[];
};

/** Hard rule for closure readiness. See app/docs/gameplay/case-management.tsx "Case closures" and "Win conditions". */
export function evaluateClosureReadiness({
  pairState,
  outcome,
  completedDateCount,
  members,
}: ClosureReadinessInput): boolean {
  if (outcome !== "second_date") {
    return false;
  }

  if (completedDateCount < CLOSURE_THRESHOLD.minCompletedDates) {
    return false;
  }

  const { stats } = pairState;
  if (stats.chemistry < CLOSURE_THRESHOLD.chemistry) return false;
  if (stats.trust < CLOSURE_THRESHOLD.trust) return false;
  if (stats.relationshipHealth < CLOSURE_THRESHOLD.relationshipHealth) return false;
  if (stats.strain > CLOSURE_THRESHOLD.strainMax) return false;
  if (stats.conflict > CLOSURE_THRESHOLD.conflictMax) return false;

  const membersById = new Map(members.map((member) => [member.id, member] as const));
  for (const participantId of pairState.participantIds) {
    const member = membersById.get(participantId);
    if (member === undefined || member.state.status !== "active") {
      return false;
    }
  }

  return true;
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
    if (report === undefined || report.readyToClose !== true) continue;

    const stillReady = evaluateClosureReadiness({
      pairState,
      outcome: report.outcome,
      completedDateCount: pairState.completedDateIds.length,
      members: [first, second],
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
    .filter((memory) => memory.scope === "pair" && memory.tags.includes(PAIR_CLOSURE_TAG))
    .sort(
      (first, second) =>
        first.createdAt.localeCompare(second.createdAt) || first.id.localeCompare(second.id),
    );
}

function buildLatestCompletedSessionMap(
  sessions: readonly DateSession[],
): Map<string, DateSession> {
  const latest = new Map<string, DateSession>();
  for (const session of sessions) {
    if (session.finalReport === undefined) continue;
    const existing = latest.get(session.pairId);
    if (
      existing === undefined ||
      session.finalReport.completedAt > existing.finalReport!.completedAt
    ) {
      latest.set(session.pairId, session);
    }
  }
  return latest;
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

  const closedSave = gameSaveSchema.parse({
    ...save,
    members: updatedMembers,
    memories: [...save.memories, closureMemory],
    focusedMemberIds,
    closureCount: save.closureCount + 1,
    updatedAt: timestamp,
  });

  return syncActiveShiftFocusCases(closedSave);
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
