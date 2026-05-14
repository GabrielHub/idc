import {
  memoryRecordSchema,
  pairStateSchema,
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

const MAX_AGREEMENT_CANDIDATES_PER_JUDGE = 2;
const MAX_AGREEMENT_UPDATES_PER_JUDGE = 3;
const MAX_OPEN_LOOP_CANDIDATES_PER_JUDGE = 2;
const MAX_OPEN_LOOP_UPDATES_PER_JUDGE = 3;

export type ApplyJudgePairMemoryEffectsInput = {
  pairState: PairState;
  judgeSnapshot: JudgeSnapshot;
  timestamp: string;
};

export type ApplyJudgePairMemoryEffectsResult = {
  pairState: PairState;
  memories: MemoryRecord[];
};

export function applyJudgePairMemoryEffects({
  pairState,
  judgeSnapshot,
  timestamp,
}: ApplyJudgePairMemoryEffectsInput): ApplyJudgePairMemoryEffectsResult {
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
        judgeSnapshot,
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
        judgeSnapshot,
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
        judgeSnapshot,
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
        judgeSnapshot,
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

function buildPairMemory({
  id,
  pairState,
  text,
  tags,
  importance,
  judgeSnapshot,
  timestamp,
}: {
  id: string;
  pairState: PairState;
  text: string;
  tags: string[];
  importance: number;
  judgeSnapshot: JudgeSnapshot;
  timestamp: string;
}): MemoryRecord {
  const embedding = createDeterministicEmbedding(text);

  return memoryRecordSchema.parse({
    id: `memory-${id}`,
    scope: "pair",
    visibility: "public",
    subjectIds: pairState.participantIds,
    pairId: pairState.id,
    dateSessionId: judgeSnapshot.dateSessionId,
    text,
    tags,
    importance,
    createdAt: timestamp,
    embedding,
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: embedding.length,
  });
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
