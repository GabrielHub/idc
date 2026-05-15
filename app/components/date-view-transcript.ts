import type {
  DateMessage,
  DateScenario,
  DateSession,
  JudgeSnapshot,
  Member,
  PlayerKnowledgeRecord,
} from "../domain/game";
import { exchangeIndexForTurn, formatCupidInterventionText } from "../services/date-engine";
import { collectRecentSpeakerLines, hasNearDuplicateRecentLine } from "../services/date-prompts";
import type { ReactionIntensity, ReactionKind, ReactionSignal } from "./date-reactions";

export type StreamingDraftMessage = {
  id: string;
  speakerId: string;
  speakerName: string;
  sequenceIndex: number;
  turnIndex: number;
  text: string;
  status: "streaming" | "done";
};

export type TranscriptItem = {
  id: string;
  order: number;
  label: string;
  text: string;
  tone: "member" | "scenario" | "cupid" | "system" | "judge";
  reveals?: PlayerKnowledgeRecord[];
  member?: Member;
  targetName?: string;
  isDraft?: boolean;
  isStreaming?: boolean;
};

const STREAMING_ECHO_GUARD_COUNT = 3;
const STREAMING_ECHO_PREFIX_MIN_LENGTH = 8;
const STREAMING_ECHO_JACCARD_THRESHOLD = 0.6;

export function buildTranscriptItems(
  session: DateSession,
  members: Member[],
  scenario: DateScenario | undefined,
  streamingDrafts: StreamingDraftMessage[],
  playerKnowledge: PlayerKnowledgeRecord[] = [],
): TranscriptItem[] {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const messageItems: TranscriptItem[] = session.transcript.map((message) => {
    if (message.kind === "character") {
      const member = memberById.get(message.speakerId);
      return {
        id: `turn-${message.sequenceIndex}`,
        order: message.sequenceIndex * 10,
        label: member?.firstName ?? "Member",
        tone: "member",
        text: message.text,
        member,
      };
    }

    return {
      id: `turn-${message.sequenceIndex}`,
      order: message.sequenceIndex * 10,
      ...buildNonCharacterLabel(message, session, members, scenario),
      tone: message.kind,
      text: message.text,
    };
  });
  const lastSequenceByExchange = new Map<number, number>();
  for (const message of session.transcript) {
    if (message.kind !== "character") {
      continue;
    }
    const exchangeIndex = exchangeIndexForTurn(message.turnIndex);
    const previous = lastSequenceByExchange.get(exchangeIndex) ?? 0;
    if (message.sequenceIndex > previous) {
      lastSequenceByExchange.set(exchangeIndex, message.sequenceIndex);
    }
  }
  const judgeItems: TranscriptItem[] = session.judgeSnapshots.map((snapshot) => {
    const reveals = playerKnowledge.filter((record) => record.judgeSnapshotId === snapshot.id);

    return {
      id: `turn-judge-${snapshot.exchangeIndex}`,
      order: (lastSequenceByExchange.get(snapshot.exchangeIndex) ?? 0) * 10 + 5,
      label: "Judge note",
      tone: "judge",
      text: snapshot.playerSummary,
      reveals,
    };
  });
  const committedSequenceIndexes = new Set(
    session.transcript.map((message) => message.sequenceIndex),
  );
  const draftItems: TranscriptItem[] = streamingDrafts
    .filter((draft) => !committedSequenceIndexes.has(draft.sequenceIndex))
    .flatMap((draft) => {
      const member = memberById.get(draft.speakerId);
      const visibleText = visibleStreamingDraftText(session, draft);
      const isStreaming = draft.status === "streaming";

      if (visibleText.trim().length === 0) {
        return [];
      }

      return [
        {
          id: draft.id,
          order: draft.sequenceIndex * 10,
          label: member?.firstName ?? draft.speakerName,
          tone: "member",
          text: visibleText,
          member,
          isDraft: true,
          isStreaming,
        },
      ];
    });

  return [...messageItems, ...draftItems, ...judgeItems].sort(
    (first, second) => first.order - second.order,
  );
}

function visibleStreamingDraftText(session: DateSession, draft: StreamingDraftMessage): string {
  if (draft.status !== "streaming" || draft.text.trim().length === 0) {
    return draft.text;
  }

  const recentLines = collectRecentSpeakerLines(
    session.transcript,
    draft.speakerId,
    STREAMING_ECHO_GUARD_COUNT,
  );

  if (recentLines.some((line) => isStreamingEchoOfRecentLine(draft.text, line))) {
    return "";
  }

  return draft.text;
}

function isStreamingEchoOfRecentLine(draftText: string, recentLine: string): boolean {
  const draft = normalizeStreamingEchoText(draftText);
  const recent = normalizeStreamingEchoText(recentLine);

  if (draft.length === 0 || recent.length === 0) {
    return false;
  }

  if (draft.length >= STREAMING_ECHO_PREFIX_MIN_LENGTH && recent.startsWith(draft)) {
    return true;
  }

  return (
    hasNearDuplicateRecentLine({
      text: draftText,
      recentLines: [recentLine],
      jaccardThreshold: STREAMING_ECHO_JACCARD_THRESHOLD,
    }) !== null
  );
}

function normalizeStreamingEchoText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildNonCharacterLabel(
  message: Extract<DateMessage, { kind: "scenario" | "cupid" | "system" }>,
  session: DateSession,
  members: Member[],
  scenario: DateScenario | undefined,
): { label: string; targetName?: string } {
  if (message.kind === "scenario") {
    return { label: scenario?.title ?? "Date plan" };
  }

  if (message.kind === "cupid") {
    const matchingIntervention = session.interventions.find(
      (intervention) =>
        message.turnIndex === intervention.usedAtTurn &&
        message.text === formatCupidInterventionText(intervention.text),
    );
    const targetId = message.targetMemberId ?? matchingIntervention?.targetMemberId;
    const target =
      targetId === undefined ? undefined : members.find((member) => member.id === targetId);

    return { label: "private nudge", targetName: target?.firstName };
  }

  return { label: "System" };
}

export function buildReactionSignals(
  judgeSnapshots: readonly JudgeSnapshot[],
  leftMemberId: string,
  rightMemberId: string,
): ReactionSignal[] {
  const latestJudge = judgeSnapshots.at(-1);

  if (latestJudge === undefined) {
    return [];
  }

  const signals: ReactionSignal[] = [];
  const participants = [
    { memberId: leftMemberId, side: "left" as const },
    { memberId: rightMemberId, side: "right" as const },
  ];
  const dateDelta = latestJudge.dateHealthDelta;
  const sparkDelta = latestJudge.statDeltas.spark ?? 0;
  const chemistryDelta = latestJudge.statDeltas.chemistry ?? 0;
  const trustDelta = latestJudge.statDeltas.trust ?? 0;
  const stabilityDelta = latestJudge.statDeltas.stability ?? 0;
  const relationshipDelta = latestJudge.statDeltas.relationshipHealth ?? 0;
  const strainDelta = latestJudge.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge.statDeltas.conflict ?? 0;
  const textSignal = [latestJudge.playerSummary, ...latestJudge.notableMoments]
    .join(" ")
    .toLowerCase();
  const sharedPositive = Math.max(dateDelta, sparkDelta, chemistryDelta, relationshipDelta);
  const sharedCare = Math.max(trustDelta, stabilityDelta);
  const sharedTrouble = Math.max(-dateDelta, strainDelta, conflictDelta);

  for (const participant of participants) {
    const moodDelta = latestJudge.memberMoodDeltas[participant.memberId] ?? 0;

    if (sharedPositive > 0 || moodDelta > 0) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "spark",
        Math.max(sharedPositive, moodDelta),
      );
    }

    if (sparkDelta >= 3 || chemistryDelta >= 3 || moodDelta >= 3) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "love",
        Math.max(sparkDelta, chemistryDelta, moodDelta),
      );
    }

    if (sharedCare >= 3) {
      pushReaction(signals, latestJudge, participant.side, "love", sharedCare);
    }

    if (
      textSignal.includes("laugh") ||
      textSignal.includes("joke") ||
      textSignal.includes("funny")
    ) {
      pushReaction(signals, latestJudge, participant.side, "laugh", 3);
    }

    if (sharedTrouble >= 4 || latestJudge.shouldEndEarly) {
      pushReaction(signals, latestJudge, participant.side, "anger", sharedTrouble);
    } else if (sharedTrouble > 0) {
      pushReaction(signals, latestJudge, participant.side, "warning", sharedTrouble);
    }

    if (moodDelta <= -3) {
      pushReaction(signals, latestJudge, participant.side, "cry", Math.abs(moodDelta));
    }
  }

  return signals;
}

export function buildNudgeSuggestions(judgeSnapshots: readonly JudgeSnapshot[]): string[] {
  const latestJudge = judgeSnapshots.at(-1);
  const baseSuggestions = [
    "Ask one specific follow-up before changing topic.",
    "Move past logistics and name one honest feeling.",
    "Ground the room in a practical choice both people can answer.",
  ];

  if (latestJudge === undefined) {
    return baseSuggestions;
  }

  const strainDelta = latestJudge.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge.statDeltas.conflict ?? 0;
  const sparkDelta = latestJudge.statDeltas.spark ?? 0;
  const trustDelta = latestJudge.statDeltas.trust ?? 0;

  if (latestJudge.shouldEndEarly || strainDelta >= 4 || conflictDelta >= 4) {
    return [
      "Name the boundary and offer a clean exit.",
      "Ask one specific follow-up before changing topic.",
      "Ground the room in a practical choice both people can answer.",
    ];
  }

  if (sparkDelta <= 0 && trustDelta <= 0) {
    return [
      "Ask one specific follow-up before changing topic.",
      "Move past logistics and name one honest feeling.",
      "Let the partner choose the next small plan.",
    ];
  }

  return baseSuggestions;
}

function pushReaction(
  signals: ReactionSignal[],
  judgeSnapshot: JudgeSnapshot,
  side: ReactionSignal["side"],
  kind: ReactionKind,
  value: number,
) {
  const sideCount = signals.filter((signal) => signal.side === side).length;

  if (sideCount >= 4 || signals.some((signal) => signal.side === side && signal.kind === kind)) {
    return;
  }

  signals.push({
    id: `${judgeSnapshot.id}-${side}-${kind}`,
    side,
    kind,
    intensity: reactionIntensity(value),
  });
}

function reactionIntensity(value: number): ReactionIntensity {
  const magnitude = Math.abs(value);

  if (magnitude >= 6) {
    return 3;
  }

  if (magnitude >= 3) {
    return 2;
  }

  return 1;
}

export function readKindLabel(read: PlayerKnowledgeRecord): string {
  if (read.readKind === "pair_dynamic") {
    return read.confidence === "confirmed" ? "confirmed pair read" : "filed pair read";
  }

  if (read.readKind === "scenario_pressure") {
    return read.confidence === "confirmed" ? "confirmed room read" : "filed room read";
  }

  return read.confidence === "confirmed" ? `confirmed ${read.readKind}` : `filed ${read.readKind}`;
}
