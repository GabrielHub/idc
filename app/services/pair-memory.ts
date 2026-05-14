import {
  memoryRecordSchema,
  pairStateSchema,
  type DateSession,
  type FollowUpAction,
  type JudgeSnapshot,
  type MemoryRecord,
  type OpenLoop,
  type OpenLoopStatus,
  type PairAgreement,
  type PairAgreementStatus,
  type PairState,
} from "../domain/game";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

export const PAIR_AGREEMENT_TAG = "pair_agreement";
export const AGREEMENT_HONORED_TAG = "agreement_honored";
export const AGREEMENT_BROKEN_TAG = "agreement_broken";
export const OPEN_LOOP_TAG = "open_loop";
export const OPEN_LOOP_RESOLVED_TAG = "open_loop_resolved";
export const OPEN_LOOP_DROPPED_TAG = "open_loop_dropped";

const FOLLOW_UP_TAG = "follow_up";
const MAX_AGREEMENT_CANDIDATES_PER_JUDGE = 2;
const MAX_AGREEMENT_UPDATES_PER_JUDGE = 3;
const MAX_OPEN_LOOP_CANDIDATES_PER_JUDGE = 2;
const MAX_OPEN_LOOP_UPDATES_PER_JUDGE = 3;
const COMPLETED_DATES_TO_HONOR_AGREEMENT = 2;

export type PairSpotlightItem = {
  kind: "agreement" | "open_loop";
  id: string;
  text: string;
  guidance: string;
  priority: number;
};

export type ApplyJudgePairMemoryEffectsInput = {
  pairState: PairState;
  judgeSnapshot: JudgeSnapshot;
  timestamp: string;
};

export type PairMemoryEffectsResult = {
  pairState: PairState;
  memories: MemoryRecord[];
};

export type ApplyCompletedDatePairMemoryEffectsInput = {
  pairState: PairState;
  session: DateSession;
  timestamp: string;
};

export type ApplyFollowUpPairMemoryEffectsInput = {
  pairState: PairState;
  session: DateSession;
  action: FollowUpAction;
  timestamp: string;
};

export function applyJudgePairMemoryEffects({
  pairState,
  judgeSnapshot,
  timestamp,
}: ApplyJudgePairMemoryEffectsInput): PairMemoryEffectsResult {
  let agreements = pairState.agreements;
  let openLoops = pairState.openLoops;
  const memories: MemoryRecord[] = [];
  const createdAgreementKeys = new Set(agreements.map((entry) => textKey(entry.text)));
  const createdOpenLoopKeys = new Set(openLoops.map((entry) => textKey(entry.text)));

  for (const update of judgeSnapshot.agreementUpdates.slice(0, MAX_AGREEMENT_UPDATES_PER_JUDGE)) {
    const existing = agreements.find((agreement) => agreement.id === update.agreementId);
    if (existing === undefined || existing.status !== "active") continue;

    const updated: PairAgreement = {
      ...existing,
      status: update.status,
      resolvedAt: timestamp,
    };
    agreements = agreements.map((agreement) =>
      agreement.id === existing.id ? updated : agreement,
    );
    memories.push(
      buildPairMemory({
        id: `${updated.id}-${updated.status}`,
        pairState,
        text: formatAgreementMemoryText(updated, update.note),
        tags: agreementTagsForStatus(updated.status),
        importance: updated.status === "broken" ? 5 : 4,
        dateSessionId: judgeSnapshot.dateSessionId,
        timestamp,
      }),
    );
  }

  for (const candidate of judgeSnapshot.agreementCandidates.slice(
    0,
    MAX_AGREEMENT_CANDIDATES_PER_JUDGE,
  )) {
    const text = cleanCandidateText(candidate.text);
    const key = textKey(text);
    if (createdAgreementKeys.has(key)) continue;
    createdAgreementKeys.add(key);

    const agreement: PairAgreement = {
      id: `agreement-${pairState.id}-${judgeSnapshot.id}-${agreements.length + 1}`,
      text,
      status: "active",
      sourceDateSessionId: judgeSnapshot.dateSessionId,
      sourceJudgeSnapshotId: judgeSnapshot.id,
      createdAt: timestamp,
    };
    agreements = [...agreements, agreement];
    memories.push(
      buildPairMemory({
        id: agreement.id,
        pairState,
        text: formatAgreementMemoryText(agreement),
        tags: agreementTagsForStatus(agreement.status),
        importance: 3,
        dateSessionId: judgeSnapshot.dateSessionId,
        timestamp,
      }),
    );
  }

  for (const update of judgeSnapshot.openLoopUpdates.slice(0, MAX_OPEN_LOOP_UPDATES_PER_JUDGE)) {
    const existing = openLoops.find((loop) => loop.id === update.openLoopId);
    if (existing === undefined || existing.status !== "open") continue;

    const updated: OpenLoop = {
      ...existing,
      status: update.status,
      resolvedAt: timestamp,
    };
    openLoops = openLoops.map((loop) => (loop.id === existing.id ? updated : loop));
    memories.push(
      buildPairMemory({
        id: `${updated.id}-${updated.status}`,
        pairState,
        text: formatOpenLoopMemoryText(updated, update.note),
        tags: openLoopTagsForStatus(updated.status),
        importance: updated.status === "resolved" ? 4 : 3,
        dateSessionId: judgeSnapshot.dateSessionId,
        timestamp,
      }),
    );
  }

  for (const candidate of judgeSnapshot.openLoopCandidates.slice(
    0,
    MAX_OPEN_LOOP_CANDIDATES_PER_JUDGE,
  )) {
    const text = cleanCandidateText(candidate.text);
    const key = textKey(text);
    if (createdOpenLoopKeys.has(key)) continue;
    createdOpenLoopKeys.add(key);

    const openLoop: OpenLoop = {
      id: `open-loop-${pairState.id}-${judgeSnapshot.id}-${openLoops.length + 1}`,
      text,
      status: "open",
      sourceDateSessionId: judgeSnapshot.dateSessionId,
      sourceJudgeSnapshotId: judgeSnapshot.id,
      createdAt: timestamp,
    };
    openLoops = [...openLoops, openLoop];
    memories.push(
      buildPairMemory({
        id: openLoop.id,
        pairState,
        text: formatOpenLoopMemoryText(openLoop),
        tags: openLoopTagsForStatus(openLoop.status),
        importance: 3,
        dateSessionId: judgeSnapshot.dateSessionId,
        timestamp,
      }),
    );
  }

  const nextPairState =
    agreements === pairState.agreements && openLoops === pairState.openLoops
      ? pairState
      : pairStateSchema.parse({ ...pairState, agreements, openLoops });

  return { pairState: nextPairState, memories };
}

export function applyCompletedDatePairMemoryEffects({
  pairState,
  session,
  timestamp,
}: ApplyCompletedDatePairMemoryEffectsInput): PairMemoryEffectsResult {
  if (session.status !== "completed") {
    return { pairState, memories: [] };
  }

  let agreements = pairState.agreements;
  const memories: MemoryRecord[] = [];

  for (const agreement of pairState.agreements) {
    if (agreement.status !== "active") continue;

    const laterCompletedDates = completedDatesAfterSource(pairState, agreement.sourceDateSessionId);
    if (laterCompletedDates < COMPLETED_DATES_TO_HONOR_AGREEMENT) continue;

    const honored: PairAgreement = {
      ...agreement,
      status: "honored",
      resolvedAt: timestamp,
    };
    agreements = agreements.map((entry) => (entry.id === agreement.id ? honored : entry));
    memories.push(
      buildPairMemory({
        id: `${honored.id}-honored-${session.id}`,
        pairState,
        text: formatAgreementMemoryText(honored, "The pair kept it across later dates."),
        tags: agreementTagsForStatus(honored.status),
        importance: 4,
        dateSessionId: session.id,
        timestamp,
      }),
    );
  }

  if (memories.length === 0) {
    return { pairState, memories };
  }

  return {
    pairState: pairStateSchema.parse({ ...pairState, agreements }),
    memories,
  };
}

export function applyFollowUpPairMemoryEffects({
  pairState,
  session,
  action,
  timestamp,
}: ApplyFollowUpPairMemoryEffectsInput): PairMemoryEffectsResult {
  let agreements = pairState.agreements;
  let openLoops = pairState.openLoops;
  const memories: MemoryRecord[] = [];
  const outcome = session.finalReport?.outcome;
  const activeAgreements = agreements.filter((agreement) => agreement.status === "active");
  const brokenAgreements = agreements.filter((agreement) => agreement.status === "broken");
  const activeOpenLoops = openLoops.filter((loop) => loop.status === "open");
  const boundaryPressure =
    session.status === "ended_early" ||
    session.judgeSnapshots.at(-1)?.shouldEndEarly === true ||
    session.judgeSnapshots.some((snapshot) =>
      snapshot.usedEvidenceIds.some((id) => id.includes(":boundary:")),
    );

  function pushAgreementFollowUp(text: string, memoText: string, importance: number): void {
    const created = createFollowUpAgreement({
      pairState,
      agreements,
      session,
      action,
      timestamp,
      text,
    });
    if (created === null) return;
    agreements = [...agreements, created];
    memories.push(
      buildPairMemory({
        id: created.id,
        pairState,
        text: formatAgreementMemoryText(created, memoText),
        tags: [...agreementTagsForStatus(created.status), FOLLOW_UP_TAG],
        importance,
        dateSessionId: session.id,
        timestamp,
      }),
    );
  }

  function pushOpenLoopFollowUp(text: string, memoText: string, importance: number): void {
    const created = createFollowUpOpenLoop({
      pairState,
      openLoops,
      session,
      action,
      timestamp,
      text,
    });
    if (created === null) return;
    openLoops = [...openLoops, created];
    memories.push(
      buildPairMemory({
        id: created.id,
        pairState,
        text: formatOpenLoopMemoryText(created, memoText),
        tags: [...openLoopTagsForStatus(created.status), FOLLOW_UP_TAG],
        importance,
        dateSessionId: session.id,
        timestamp,
      }),
    );
  }

  if (action === "repair") {
    if (brokenAgreements.length > 0 || boundaryPressure) {
      pushAgreementFollowUp(
        "Repair stays slow before another booking.",
        "Follow-up filed repair pressure.",
        4,
      );
    }
  } else if (action === "cool_down") {
    if (
      activeOpenLoops.length > 0 ||
      pairState.stats.strain >= 60 ||
      pairState.stats.conflict >= 60 ||
      outcome === "cool_down" ||
      outcome === "early_end"
    ) {
      pushOpenLoopFollowUp(
        "Whether time away lets the pair return without reopening the same pressure.",
        "Follow-up filed cooling space.",
        3,
      );
    }
  } else if (action === "encourage") {
    if (outcome === "second_date") {
      pushOpenLoopFollowUp(
        "Whether the pair follows through on the next booking without overexplaining it.",
        "Follow-up filed next-booking momentum.",
        3,
      );
    }
  } else {
    for (const agreement of activeAgreements) {
      const retired: PairAgreement = {
        ...agreement,
        status: "retired",
        resolvedAt: timestamp,
      };
      agreements = agreements.map((entry) => (entry.id === agreement.id ? retired : entry));
      memories.push(
        buildPairMemory({
          id: `${retired.id}-retired-${session.id}`,
          pairState,
          text: formatAgreementMemoryText(retired, "Cupid closed the romantic lane."),
          tags: [...agreementTagsForStatus(retired.status), FOLLOW_UP_TAG],
          importance: 3,
          dateSessionId: session.id,
          timestamp,
        }),
      );
    }

    for (const openLoop of activeOpenLoops) {
      const dropped: OpenLoop = {
        ...openLoop,
        status: "dropped",
        resolvedAt: timestamp,
      };
      openLoops = openLoops.map((entry) => (entry.id === openLoop.id ? dropped : entry));
      memories.push(
        buildPairMemory({
          id: `${dropped.id}-dropped-${session.id}`,
          pairState,
          text: formatOpenLoopMemoryText(dropped, "Cupid closed the romantic lane."),
          tags: [...openLoopTagsForStatus(dropped.status), FOLLOW_UP_TAG],
          importance: 3,
          dateSessionId: session.id,
          timestamp,
        }),
      );
    }
  }

  if (memories.length === 0) {
    return { pairState, memories };
  }

  return {
    pairState: pairStateSchema.parse({ ...pairState, agreements, openLoops }),
    memories,
  };
}

export function selectPairSpotlightItem(pairState: PairState): PairSpotlightItem | null {
  const candidates: PairSpotlightItem[] = [];

  for (const agreement of pairState.agreements) {
    if (agreement.status !== "active") continue;
    const age = completedDatesAfterSource(pairState, agreement.sourceDateSessionId);
    candidates.push({
      kind: "agreement",
      id: agreement.id,
      text: agreement.text,
      guidance: `Keep this active agreement present as table stakes: ${agreement.text}`,
      priority: 60 + age * 10,
    });
  }

  const openLoops = pairState.openLoops.filter((loop) => loop.status === "open");
  for (const loop of openLoops) {
    const age = completedDatesAfterSource(pairState, loop.sourceDateSessionId);
    candidates.push({
      kind: "open_loop",
      id: loop.id,
      text: loop.text,
      guidance: `Give this unresolved item a chance to move: ${loop.text}`,
      priority: 70 + age * 12 + (openLoops.length >= 2 ? 8 : 0),
    });
  }

  return (
    candidates.sort(
      (first, second) => second.priority - first.priority || first.id.localeCompare(second.id),
    )[0] ?? null
  );
}

function buildPairMemory({
  id,
  pairState,
  text,
  tags,
  importance,
  dateSessionId,
  timestamp,
}: {
  id: string;
  pairState: PairState;
  text: string;
  tags: string[];
  importance: number;
  dateSessionId: string;
  timestamp: string;
}): MemoryRecord {
  const embedding = createDeterministicEmbedding(text);

  return memoryRecordSchema.parse({
    id: `memory-${id}`,
    scope: "pair",
    visibility: "public",
    subjectIds: pairState.participantIds,
    pairId: pairState.id,
    dateSessionId,
    text,
    tags,
    importance,
    createdAt: timestamp,
    embedding,
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: embedding.length,
  });
}

function createFollowUpAgreement({
  pairState,
  agreements,
  session,
  action,
  timestamp,
  text,
}: {
  pairState: PairState;
  agreements: readonly PairAgreement[];
  session: DateSession;
  action: FollowUpAction;
  timestamp: string;
  text: string;
}): PairAgreement | null {
  const key = textKey(text);
  if (agreements.some((agreement) => textKey(agreement.text) === key)) {
    return null;
  }

  return {
    id: `agreement-${pairState.id}-follow-up-${session.id}-${action}`,
    text,
    status: "active",
    sourceDateSessionId: session.id,
    createdAt: timestamp,
  };
}

function createFollowUpOpenLoop({
  pairState,
  openLoops,
  session,
  action,
  timestamp,
  text,
}: {
  pairState: PairState;
  openLoops: readonly OpenLoop[];
  session: DateSession;
  action: FollowUpAction;
  timestamp: string;
  text: string;
}): OpenLoop | null {
  const key = textKey(text);
  if (openLoops.some((loop) => textKey(loop.text) === key)) {
    return null;
  }

  return {
    id: `open-loop-${pairState.id}-follow-up-${session.id}-${action}`,
    text,
    status: "open",
    sourceDateSessionId: session.id,
    createdAt: timestamp,
  };
}

function completedDatesAfterSource(
  pairState: PairState,
  sourceDateSessionId: string | undefined,
): number {
  if (sourceDateSessionId === undefined) {
    return 0;
  }

  const sourceIndex = pairState.completedDateIds.indexOf(sourceDateSessionId);
  if (sourceIndex === -1) {
    return 0;
  }

  return Math.max(0, pairState.completedDateIds.length - sourceIndex - 1);
}

function cleanCandidateText(text: string): string {
  return text
    .replace(/[\u2013\u2014]/gu, ",")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 220);
}

function textKey(text: string): string {
  return cleanCandidateText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function agreementTagsForStatus(status: PairAgreementStatus): string[] {
  if (status === "honored") return [PAIR_AGREEMENT_TAG, AGREEMENT_HONORED_TAG];
  if (status === "broken") return [PAIR_AGREEMENT_TAG, AGREEMENT_BROKEN_TAG];
  if (status === "retired") return [PAIR_AGREEMENT_TAG, "agreement_retired"];
  return [PAIR_AGREEMENT_TAG];
}

function openLoopTagsForStatus(status: OpenLoopStatus): string[] {
  if (status === "resolved") return [OPEN_LOOP_TAG, OPEN_LOOP_RESOLVED_TAG];
  if (status === "dropped") return [OPEN_LOOP_TAG, OPEN_LOOP_DROPPED_TAG];
  return [OPEN_LOOP_TAG];
}

function formatAgreementMemoryText(agreement: PairAgreement, note?: string): string {
  const suffix = note === undefined ? "" : ` ${cleanCandidateText(note)}`;
  if (agreement.status === "honored") return `Agreement honored: ${agreement.text}.${suffix}`;
  if (agreement.status === "broken") return `Agreement broken: ${agreement.text}.${suffix}`;
  if (agreement.status === "retired") return `Agreement retired: ${agreement.text}.${suffix}`;
  return `Agreement filed: ${agreement.text}.`;
}

function formatOpenLoopMemoryText(openLoop: OpenLoop, note?: string): string {
  const suffix = note === undefined ? "" : ` ${cleanCandidateText(note)}`;
  if (openLoop.status === "resolved") return `Open loop resolved: ${openLoop.text}.${suffix}`;
  if (openLoop.status === "dropped") return `Open loop dropped: ${openLoop.text}.${suffix}`;
  return `Open loop filed: ${openLoop.text}.`;
}
