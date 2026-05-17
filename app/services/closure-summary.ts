import type { GameSave, Member, MemoryRecord, PairState } from "../domain/game";
import { starterScenarios } from "../fixtures";
import {
  CLOSURE_SUMMARY_MAX_LENGTH,
  ClosureSummaryValidationError,
  PAIR_CLOSURE_TAG,
  validateClosureSummary,
  type ReadyClosurePair,
} from "./closures";
import { buildClosureSummaryPromptPacket, type ClosureSummaryPromptPacket } from "./date-prompts";
import { generateClosureSummaryText, type AiRuntimeConfig } from "./ai/model-service";

const FALLBACK_RETRY_LIMIT = 1;

export type ClosureSummaryRuntime = {
  generateClosureSummary(input: {
    packet: ClosureSummaryPromptPacket;
    config: Partial<AiRuntimeConfig>;
  }): Promise<string>;
};

export type GenerateClosureSummaryInput = {
  save: GameSave;
  ready: ReadyClosurePair;
  config?: Partial<AiRuntimeConfig>;
  runtime?: ClosureSummaryRuntime;
};

const defaultClosureSummaryRuntime: ClosureSummaryRuntime = {
  generateClosureSummary: ({ packet, config }) => generateClosureSummaryText(packet, config),
};

export async function generateClosureSummary({
  save,
  ready,
  config,
  runtime = defaultClosureSummaryRuntime,
}: GenerateClosureSummaryInput): Promise<string> {
  const packet = buildClosureSummaryPromptPacketForReady({ save, ready });
  let lastValidationError: ClosureSummaryValidationError | null = null;

  for (let attempt = 0; attempt <= FALLBACK_RETRY_LIMIT; attempt += 1) {
    const raw = await runtime.generateClosureSummary({
      packet: attempt === 0 ? packet : appendRetryGuidance(packet, lastValidationError),
      config: config ?? save.config,
    });
    const candidate = normalizeClosureSummary(raw);

    try {
      validateClosureSummary(candidate);
      return candidate;
    } catch (error) {
      if (error instanceof ClosureSummaryValidationError) {
        lastValidationError = error;
        continue;
      }
      throw error;
    }
  }

  throw new ClosureSummaryValidationError(
    lastValidationError?.message ??
      "Closure summary generation failed after retries. Try again in a moment.",
  );
}

function buildClosureSummaryPromptPacketForReady({
  save,
  ready,
}: {
  save: GameSave;
  ready: ReadyClosurePair;
}): ClosureSummaryPromptPacket {
  const pairMemories = save.memories
    .filter(
      (memory: MemoryRecord) =>
        memory.scope === "pair" &&
        memory.visibility === "public" &&
        memory.pairId === ready.pairState.id &&
        !memory.tags.includes(PAIR_CLOSURE_TAG),
    )
    .map((memory) => ({
      text: memory.text,
      tags: memory.tags,
      importance: memory.importance,
    }));
  const scenario = starterScenarios.find(
    (candidate) => candidate.id === ready.dateSession.scenarioId,
  );

  return buildClosureSummaryPromptPacket({
    members: ready.participants,
    pairId: ready.pairState.id,
    pairMemories,
    lastFinalReport: {
      outcome: ready.finalReport.outcome,
      summary: ready.finalReport.summary,
      statSummary: ready.finalReport.statSummary,
    },
    lastSessionScenarioTitle: scenario?.title ?? ready.dateSession.scenarioId,
  });
}

function appendRetryGuidance(
  packet: ClosureSummaryPromptPacket,
  error: ClosureSummaryValidationError | null,
): ClosureSummaryPromptPacket {
  if (error === null) {
    return packet;
  }

  return {
    system: packet.system,
    prompt: [
      packet.prompt,
      "",
      "<retry_guard>",
      `Previous draft failed validation: ${error.message} Rewrite in plain prose without those issues.`,
      "</retry_guard>",
    ].join("\n"),
  };
}

/** Trims wrappers like "Closure summary:" or quotes and collapses whitespace. */
export function normalizeClosureSummary(raw: string): string {
  const stripped = raw
    .replace(/^\s*(?:closure summary|summary|note)\s*[:-]\s*/i, "")
    .replace(/^["'`“]+|["'`”]+$/g, "")
    .trim();

  if (stripped.length === 0) {
    return stripped;
  }

  const collapsed = stripped.replace(/\s+/g, " ");
  if (collapsed.length <= CLOSURE_SUMMARY_MAX_LENGTH) {
    return collapsed;
  }

  const truncated = collapsed.slice(0, CLOSURE_SUMMARY_MAX_LENGTH);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  );

  if (lastSentenceEnd >= CLOSURE_SUMMARY_MAX_LENGTH / 2) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }

  return truncated.trim();
}

export function buildFallbackClosureSummary({
  participants,
  pairState,
}: {
  participants: [Member, Member];
  pairState: Pick<PairState, "completedDateIds">;
}): string {
  const [first, second] = participants;
  const completed = pairState.completedDateIds.length;
  const datesLine =
    completed >= 2
      ? `After ${completed} dates on file, ${first.firstName} and ${second.firstName} are leaving together.`
      : `${first.firstName} and ${second.firstName} are leaving together.`;

  return [
    datesLine,
    `They want a quiet weeknight and the next argument to be about groceries.`,
  ].join(" ");
}
