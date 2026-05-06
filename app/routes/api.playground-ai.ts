import { z } from "zod";

import {
  dateMessageSchema,
  dateSessionSchema,
  memoryRecordSchema,
  pairStateSchema,
  type DateMessage,
  type DateScenario,
  type Member,
  type MemoryRecord,
  type PairState,
} from "../domain/game";
import { memberRequests, starterMembers, starterScenarios } from "../fixtures";
import { sanitizeCharacterText } from "../services/ai-date-engine.server";
import {
  generateCharacterTurn,
  type LocalAiProviderMode,
} from "../services/ai/ollama-provider.server";
import { buildCharacterPromptPacket, type CharacterPromptPacket } from "../services/date-prompts";
import { createSeedGameSave, makePairId } from "../services/game-seed";
import { evaluateMatchFit, pairRuleHits } from "../services/match-fit";
import { errorToMessage } from "../services/utils";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

const playgroundAiRequestSchema = z.object({
  memberId: z.string().min(1),
  partnerId: z.string().min(1),
  scenarioId: z.string().min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  topK: z.number().int().min(1).max(200),
  numCtx: z.number().int().min(2048).max(262144),
  maxOutputTokens: z.number().int().min(24).max(512),
  dateHealth: z.number().int().min(0).max(100),
  spark: z.number().int().min(0).max(100),
  strain: z.number().int().min(0).max(100),
  transcriptText: z.string(),
  memoryText: z.string(),
  includeCurrentAsk: z.boolean(),
  turnCount: z.number().int().min(1).max(6).default(1),
});

const ollamaTagsSchema = z.object({
  models: z.array(
    z
      .object({
        name: z.string().min(1),
        size: z.number().optional(),
        modified_at: z.string().optional(),
      })
      .passthrough(),
  ),
});

export async function loader() {
  const models = await listLocalModels();

  return json({
    models,
    defaults: {
      model: "gemma4:26b",
      temperature: 1,
      topP: 0.95,
      topK: 64,
      numCtx: 16384,
      maxOutputTokens: 160,
    },
  });
}

export async function action({ request }: { request: Request }) {
  try {
    const input = playgroundAiRequestSchema.parse(await request.json());
    const member = requireMember(input.memberId);
    const partner = requireMember(input.partnerId);
    const scenario = starterScenarios.find((candidate) => candidate.id === input.scenarioId);

    if (scenario === undefined) {
      throw new Error(`Scenario not found: ${input.scenarioId}`);
    }

    if (member.id === partner.id) {
      throw new Error("Pick two different members for the prompt test.");
    }

    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const pairId = makePairId(member.id, partner.id);
    const participantIds: [string, string] = [member.id, partner.id];
    const pairState =
      save.pairStates.find((candidate) => candidate.id === pairId) ??
      pairStateSchema.parse({
        id: pairId,
        participantIds,
        stats: {
          chemistry: 50,
          trust: 50,
          stability: 50,
          conflict: 20,
          weirdnessTolerance: 50,
          spark: input.spark,
          strain: input.strain,
          relationshipHealth: 50,
        },
        completedDateIds: [],
        scenarioUseCounts: {},
      });
    const tunedPairState = pairStateSchema.parse({
      ...pairState,
      stats: {
        ...pairState.stats,
        spark: input.spark,
        strain: input.strain,
      },
    });
    const transcript = buildTranscriptMessages({
      text: input.transcriptText,
      member,
      partner,
      dateSessionId: "playground-ai-session",
    });
    const pairMemories = buildMemoryRecords(input.memoryText, pairId, scenario.id, participantIds);
    const activeRequests = [member, partner]
      .map((candidate) =>
        candidate.state.currentRequestId === undefined
          ? undefined
          : memberRequests.find((request) => request.id === candidate.state.currentRequestId),
      )
      .filter((request) => request !== undefined);
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState: tunedPairState,
      activeRequests,
    });
    const startedAt = performance.now();
    const run = await runPlaygroundConversation({
      member,
      partner,
      scenario,
      pairState: tunedPairState,
      pairMemories,
      participantIds,
      initialTranscript: transcript,
      turnCount: input.turnCount,
      includeCurrentAsk: input.includeCurrentAsk,
      dateHealth: input.dateHealth,
      frictionRuleHits: pairRuleHits(matchFit),
      generationConfig: {
        performerModel: input.model,
        contextWindowTokens: input.numCtx,
        requestTimeoutMs: 90_000,
      },
      generationOptions: {
        temperature: input.temperature,
        topP: input.topP,
        topK: input.topK,
        numCtx: input.numCtx,
        maxOutputTokens: input.maxOutputTokens,
      },
    });
    const elapsedMs = Math.round(performance.now() - startedAt);
    const promptCharacters = run.promptCharacters;

    return json({
      text: formatGeneratedTurns(run.turns),
      turns: run.turns,
      model: run.model,
      providerMode: run.providerMode,
      elapsedMs,
      promptCharacters,
      approximatePromptTokens: Math.ceil(promptCharacters / 4),
      matchFit,
      system: run.lastPacket.system,
      prompt: run.lastPacket.prompt,
    });
  } catch (error) {
    return json({ error: errorToMessage(error) }, { status: 400 });
  }
}

type PlaygroundGeneratedTurn = {
  speakerId: string;
  speakerName: string;
  text: string;
};

async function runPlaygroundConversation({
  member,
  partner,
  scenario,
  pairState,
  pairMemories,
  participantIds,
  initialTranscript,
  turnCount,
  includeCurrentAsk,
  dateHealth,
  frictionRuleHits,
  generationConfig,
  generationOptions,
}: {
  member: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  pairMemories: MemoryRecord[];
  participantIds: [string, string];
  initialTranscript: DateMessage[];
  turnCount: number;
  includeCurrentAsk: boolean;
  dateHealth: number;
  frictionRuleHits: readonly string[];
  generationConfig: Parameters<typeof generateCharacterTurn>[1];
  generationOptions: Parameters<typeof generateCharacterTurn>[2];
}): Promise<{
  turns: PlaygroundGeneratedTurn[];
  lastPacket: CharacterPromptPacket;
  promptCharacters: number;
  model: string;
  providerMode: LocalAiProviderMode;
}> {
  const transcript = [...initialTranscript];
  const members: [Member, Member] = [member, partner];
  let currentTurn = 0;
  let nextSpeakerIndex = 0;
  for (const message of transcript) {
    if (message.kind === "character") {
      currentTurn += 1;
      nextSpeakerIndex = message.speakerId === member.id ? 1 : 0;
    }
  }
  const turns: PlaygroundGeneratedTurn[] = [];
  let lastPacket!: CharacterPromptPacket;
  let promptCharacters = 0;
  let model = generationConfig?.performerModel ?? "";
  let providerMode: LocalAiProviderMode = "ollama";

  for (let index = 0; index < turnCount; index += 1) {
    const speaker = members[nextSpeakerIndex];
    const listener = members[1 - nextSpeakerIndex];
    const session = dateSessionSchema.parse({
      id: "playground-ai-session",
      pairId: pairState.id,
      scenarioId: scenario.id,
      focusMemberId: speaker.id,
      focusRequestId:
        includeCurrentAsk && speaker.state.currentRequestId !== undefined
          ? speaker.state.currentRequestId
          : undefined,
      turnLimit: 30,
      currentTurn,
      dateHealth,
      status: "active",
      runtimeMode: "local_ai",
      participants: participantIds,
      transcript,
      privateStateByCharacter: {
        [member.id]: {
          mood: member.state.mood,
          comfort: dateHealth,
          intent: "test prompt in the AI playground",
        },
        [partner.id]: {
          mood: partner.state.mood,
          comfort: dateHealth,
          intent: "test prompt in the AI playground",
        },
      },
      judgeSnapshots: [],
    });
    const focusRequest =
      includeCurrentAsk && speaker.state.currentRequestId !== undefined
        ? memberRequests.find((candidate) => candidate.id === speaker.state.currentRequestId)
        : undefined;
    const packet = buildCharacterPromptPacket({
      member: speaker,
      partner: listener,
      scenario,
      session,
      pairState,
      memoryPack: {
        self: [],
        pair: pairMemories,
        scenario: [],
        recentTranscript: transcript.slice(-8),
      },
      focusRequest,
      frictionRuleHits,
    });
    promptCharacters += packet.system.length + packet.prompt.length;
    const result = await generateCharacterTurn(packet, generationConfig, generationOptions);
    const text = sanitizeCharacterText(result.text, speaker.name);
    currentTurn += 1;
    transcript.push(
      dateMessageSchema.parse({
        id: `playground-ai-session-generated-${index + 1}`,
        dateSessionId: "playground-ai-session",
        turnIndex: currentTurn,
        sequenceIndex: transcript.length,
        kind: "character",
        speakerId: speaker.id,
        text,
        createdAt: "2026-05-05T12:00:00.000Z",
      }),
    );
    lastPacket = packet;
    model = result.model;
    providerMode = result.providerMode;
    turns.push({
      speakerId: speaker.id,
      speakerName: speaker.name,
      text,
    });
    nextSpeakerIndex = 1 - nextSpeakerIndex;
  }

  return {
    turns,
    lastPacket,
    promptCharacters,
    model,
    providerMode,
  };
}

function formatGeneratedTurns(turns: PlaygroundGeneratedTurn[]): string {
  return turns.map((turn) => `${turn.speakerName}: ${turn.text}`).join("\n");
}

const OLLAMA_TAGS_TIMEOUT_MS = 5_000;

async function listLocalModels(): Promise<
  Array<{ name: string; size?: number; modifiedAt?: string }>
> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TAGS_TIMEOUT_MS);

  try {
    const response = await fetch(`${DEFAULT_OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const parsed = ollamaTagsSchema.safeParse(await response.json());

    if (!parsed.success) {
      return [];
    }

    return parsed.data.models
      .map((model) => ({
        name: model.name,
        size: model.size,
        modifiedAt: model.modified_at,
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildTranscriptMessages({
  text,
  member,
  partner,
  dateSessionId,
}: {
  text: string;
  member: Member;
  partner: Member;
  dateSessionId: string;
}): DateMessage[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const messages: DateMessage[] = [];

  lines.forEach((line, index) => {
    const parsedLine = parseTranscriptLine(line, member, partner, index);

    messages.push(
      dateMessageSchema.parse({
        id: `${dateSessionId}-input-${index + 1}`,
        dateSessionId,
        turnIndex:
          parsedLine.kind === "character"
            ? messages.filter((message) => message.kind === "character").length + 1
            : 0,
        sequenceIndex: index,
        kind: parsedLine.kind,
        speakerId: parsedLine.speakerId,
        text: parsedLine.text,
        createdAt: "2026-05-05T12:00:00.000Z",
      }),
    );
  });

  return messages;
}

function parseTranscriptLine(
  line: string,
  member: Member,
  partner: Member,
  index: number,
): { kind: DateMessage["kind"]; speakerId?: string; text: string } {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex < 0) {
    const fallbackSpeaker = index % 2 === 0 ? partner.id : member.id;

    return {
      kind: "character",
      speakerId: fallbackSpeaker,
      text: line,
    };
  }

  const label = line.slice(0, separatorIndex).trim().toLowerCase();
  const text = line.slice(separatorIndex + 1).trim();

  if (label === "cupid") {
    return { kind: "cupid", text };
  }

  if (label === "scene" || label === "venue") {
    return { kind: "scenario", text };
  }

  if (matchesMemberLabel(label, member)) {
    return { kind: "character", speakerId: member.id, text };
  }

  if (matchesMemberLabel(label, partner)) {
    return { kind: "character", speakerId: partner.id, text };
  }

  return {
    kind: "character",
    speakerId: index % 2 === 0 ? partner.id : member.id,
    text,
  };
}

function matchesMemberLabel(label: string, member: Member): boolean {
  const labels = [member.id, member.name, member.firstName].map((value) => value.toLowerCase());

  return labels.includes(label);
}

function buildMemoryRecords(
  text: string,
  pairId: string,
  scenarioId: string,
  participantIds: [string, string],
): MemoryRecord[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 4)
    .map((line, index) =>
      memoryRecordSchema.parse({
        id: `playground-memory-${index + 1}`,
        scope: "pair",
        visibility: "public",
        subjectIds: participantIds,
        pairId,
        scenarioId,
        text: line,
        tags: ["playground"],
        importance: 3,
        createdAt: "2026-05-05T12:00:00.000Z",
      }),
    );
}

function requireMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);

  if (member === undefined) {
    throw new Error(`Member not found: ${memberId}`);
  }

  return member;
}

function json(value: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(value), {
    ...init,
    headers,
  });
}
