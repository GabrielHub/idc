import {
  memoryRecordSchema,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type Member,
  type MemoryRecord,
} from "../domain/game";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

export const TRANSCRIPT_CHUNK_TAG = "transcript_chunk";

const TRANSCRIPT_CHUNK_SIZE = 4;
const TRANSCRIPT_CHUNK_OVERLAP = 1;
const TRANSCRIPT_CHUNK_LIMIT = 6;

export type DateTranscriptMemoryDraft = Omit<
  MemoryRecord,
  "createdAt" | "embedding" | "embeddingModel" | "embeddingDimensions"
>;

export function createDateTranscriptMemoryDrafts(
  session: DateSession,
  members: Member[],
  scenario: DateScenario,
): DateTranscriptMemoryDraft[] {
  const memorySourceMessages = session.transcript.filter(
    (message) => message.kind === "character" || message.kind === "scenario",
  );
  if (memorySourceMessages.length === 0) {
    return [];
  }

  const speakerLabels = new Map(members.map((member) => [member.id, member.name] as const));
  const chunks: DateTranscriptMemoryDraft[] = [];
  const chunkStarts = selectTranscriptChunkStarts(memorySourceMessages.length);

  for (const start of chunkStarts) {
    const chunkMessages = memorySourceMessages.slice(start, start + TRANSCRIPT_CHUNK_SIZE);
    const chunkNumber = chunks.length + 1;
    chunks.push({
      id: `memory-${session.id}-transcript-${chunkNumber}`,
      scope: "date",
      visibility: "member_private",
      subjectIds: [...session.participants],
      visibleToMemberIds: [...session.participants],
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: [
        `${scenario.title} remembered exchange ${chunkNumber}:`,
        ...chunkMessages.map((message) => formatTranscriptMemoryLine(message, speakerLabels)),
      ].join("\n"),
      tags: [TRANSCRIPT_CHUNK_TAG, "date_context", scenario.id],
      importance: 2,
    });
  }

  return chunks;
}

function selectTranscriptChunkStarts(messageCount: number): number[] {
  const step = Math.max(1, TRANSCRIPT_CHUNK_SIZE - TRANSCRIPT_CHUNK_OVERLAP);
  const starts: number[] = [];

  for (let start = 0; start < messageCount; start += step) {
    starts.push(start);
  }

  if (starts.length <= TRANSCRIPT_CHUNK_LIMIT) {
    return starts;
  }

  const tailStart = starts[starts.length - 1];
  if (tailStart === undefined) {
    return starts;
  }
  return [...starts.slice(0, TRANSCRIPT_CHUNK_LIMIT - 1), tailStart];
}

export function createDateTranscriptMemoryRecords(
  session: DateSession,
  members: Member[],
  scenario: DateScenario,
  createdAt: string,
): MemoryRecord[] {
  return createDateTranscriptMemoryDrafts(session, members, scenario).map((draft) => {
    const embedding = createDeterministicEmbedding(draft.text);

    return memoryRecordSchema.parse({
      ...draft,
      createdAt,
      embedding,
      embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
      embeddingDimensions: embedding.length,
    });
  });
}

function formatTranscriptMemoryLine(
  message: DateMessage,
  speakerLabels: ReadonlyMap<string, string>,
): string {
  if (message.kind === "character") {
    return `${speakerLabels.get(message.speakerId) ?? "Member"}: ${message.text}`;
  }

  return `Scene: ${message.text}`;
}
