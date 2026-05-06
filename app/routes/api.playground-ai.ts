import { z } from "zod";

import {
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  aiProviderSchema,
  aiReasoningLevelSchema,
  dateMessageSchema,
  dateSessionSchema,
  memoryRecordSchema,
  pairStateSchema,
  type AiProvider,
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
  listOllamaModelInventory,
  type AiRuntimeConfig,
} from "../services/ai/model-service.server";
import {
  modelDefaultsForProvider,
  recommendedOllamaChatModels,
} from "../services/ai/model-catalog";
import { buildCharacterPromptPacket, type CharacterPromptPacket } from "../services/date-prompts";
import { createSeedGameSave, makePairId } from "../services/game-seed";
import { evaluateMatchFit, pairRuleHits } from "../services/match-fit";
import { errorToMessage, isRecord, jsonResponse as json } from "../services/utils";

const playgroundActionSchema = z.enum(["generate", "preview"]);
const playgroundModeSchema = z.enum(["dateConversation", "memberChat"]);
const playgroundChatMessageSchema = z.object({
  role: z.enum(["tester", "member"]),
  text: z.string().min(1),
});

const basePlaygroundRequestSchema = z.object({
  mode: playgroundModeSchema,
  action: playgroundActionSchema.default("generate"),
  provider: aiProviderSchema.default("ollama"),
  model: z.string().min(1),
  gatewayApiKey: z.string().optional(),
  ollamaBaseURL: z.string().min(1).optional(),
  gatewayBaseURL: z.string().min(1).optional(),
  reasoningLevel: aiReasoningLevelSchema.default("off"),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  topK: z.number().int().min(1).max(200),
  numCtx: z.number().int().min(2048).max(262144),
  maxOutputTokens: z.number().int().min(24).max(512),
  systemOverride: z.string().default(""),
  promptOverride: z.string().default(""),
});

const datePlaygroundRequestSchema = basePlaygroundRequestSchema.extend({
  mode: z.literal("dateConversation"),
  memberId: z.string().min(1),
  partnerId: z.string().min(1),
  scenarioId: z.string().min(1),
  dateHealth: z.number().int().min(0).max(100),
  spark: z.number().int().min(0).max(100),
  strain: z.number().int().min(0).max(100),
  transcriptText: z.string(),
  memoryText: z.string(),
  includeCurrentAsk: z.boolean(),
  turnCount: z.number().int().min(1).max(6).default(1),
});

const memberChatPlaygroundRequestSchema = basePlaygroundRequestSchema.extend({
  mode: z.literal("memberChat"),
  memberId: z.string().min(1),
  testerMessage: z.string().default(""),
  chatMessages: z.array(playgroundChatMessageSchema).default([]),
});

const playgroundAiRequestSchema = z.preprocess(
  addLegacyDateMode,
  z.discriminatedUnion("mode", [datePlaygroundRequestSchema, memberChatPlaygroundRequestSchema]),
);

type DatePlaygroundInput = z.infer<typeof datePlaygroundRequestSchema>;
type MemberChatPlaygroundInput = z.infer<typeof memberChatPlaygroundRequestSchema>;
type PlaygroundChatMessage = z.infer<typeof playgroundChatMessageSchema>;

type PlaygroundGeneratedTurn = {
  speakerId: string;
  speakerName: string;
  text: string;
};

type PromptPreviewPayload = {
  system: string;
  prompt: string;
  model: string;
  providerMode: AiProvider;
  sampling: {
    temperature: number;
    topP: number;
    topK: number;
  };
  limits: {
    numCtx: number;
    maxOutputTokens: number;
  };
  reasoningLevel: string;
};

const DEFAULT_DATE_PLAYGROUND_SETTINGS = {
  mode: "dateConversation",
  action: "generate",
  provider: "ollama",
  model: "gemma4:26b",
  reasoningLevel: "off",
  temperature: 1,
  topP: 0.95,
  topK: 64,
  numCtx: 16384,
  maxOutputTokens: 160,
  memberId: "jenna-pike",
  partnerId: "vhool",
  scenarioId: "temporal-coffee-shop",
  dateHealth: 62,
  spark: 55,
  strain: 24,
  transcriptText: [
    "Vhool: The coffee has reversed into its bean form. This is either flirting or inventory.",
    "Jenna: I was hoping for normal, but I can work with inventory if it stays polite.",
  ].join("\n"),
  memoryText: "Jenna remembers that Vhool treated soup as a sincere planning document.",
  includeCurrentAsk: true,
  turnCount: 4,
  systemOverride: "",
  promptOverride: "",
} satisfies DatePlaygroundInput;

const DEFAULT_MEMBER_CHAT_SETTINGS = {
  mode: "memberChat",
  action: "generate",
  provider: "gateway",
  model: modelDefaultsForProvider("gateway").chatModel,
  reasoningLevel: modelDefaultsForProvider("gateway").reasoningLevel,
  temperature: 0.8,
  topP: 0.95,
  topK: 64,
  numCtx: 8192,
  maxOutputTokens: 180,
  memberId: "jenna-pike",
  testerMessage: "What would make a date feel normal enough to trust?",
  chatMessages: [],
  systemOverride: "",
  promptOverride: "",
} satisfies MemberChatPlaygroundInput;

export async function loader() {
  const inventory = await listOllamaModelInventory();
  const models = recommendedOllamaChatModels(inventory.models);
  const datePrompt = buildDatePlaygroundPrompt(DEFAULT_DATE_PLAYGROUND_SETTINGS);
  const memberPrompt = buildMemberChatPrompt(DEFAULT_MEMBER_CHAT_SETTINGS);

  return json({
    models,
    defaults: DEFAULT_DATE_PLAYGROUND_SETTINGS,
    memberChatDefaults: DEFAULT_MEMBER_CHAT_SETTINGS,
    previews: {
      dateConversation: toPromptPreview(datePrompt.packet, DEFAULT_DATE_PLAYGROUND_SETTINGS),
      memberChat: toPromptPreview(memberPrompt.packet, DEFAULT_MEMBER_CHAT_SETTINGS),
    },
  });
}

export async function action({ request }: { request: Request }) {
  try {
    const input = playgroundAiRequestSchema.parse(await request.json());

    if (input.mode === "memberChat") {
      return json(await handleMemberChat(input));
    }

    return json(await handleDateConversation(input));
  } catch (error) {
    return json({ error: errorToMessage(error) }, { status: 400 });
  }
}

async function handleDateConversation(input: DatePlaygroundInput) {
  const startedAt = performance.now();
  const preview = buildDatePlaygroundPrompt(input);

  if (input.action === "preview") {
    return {
      mode: input.mode,
      text: "",
      turns: [],
      model: input.model,
      providerMode: input.provider,
      elapsedMs: 0,
      promptCharacters: preview.promptCharacters,
      approximatePromptTokens: Math.ceil(preview.promptCharacters / 4),
      matchFit: preview.matchFit,
      system: preview.packet.system,
      prompt: preview.packet.prompt,
      preview: toPromptPreview(preview.packet, input),
    };
  }

  const run = await runPlaygroundConversation({
    ...preview,
    input,
  });
  const elapsedMs = Math.round(performance.now() - startedAt);
  const promptCharacters = run.promptCharacters;

  return {
    mode: input.mode,
    text: formatGeneratedTurns(run.turns),
    turns: run.turns,
    model: run.model,
    providerMode: run.providerMode,
    elapsedMs,
    promptCharacters,
    approximatePromptTokens: Math.ceil(promptCharacters / 4),
    matchFit: preview.matchFit,
    system: run.lastPacket.system,
    prompt: run.lastPacket.prompt,
    preview: toPromptPreview(run.lastPacket, input),
  };
}

async function handleMemberChat(input: MemberChatPlaygroundInput) {
  const member = requireMember(input.memberId);
  const startedAt = performance.now();
  const prompt = buildMemberChatPrompt(input);

  if (input.action === "preview") {
    return {
      mode: input.mode,
      text: "",
      turns: [],
      chatMessages: input.chatMessages,
      model: input.model,
      providerMode: input.provider,
      elapsedMs: 0,
      promptCharacters: prompt.promptCharacters,
      approximatePromptTokens: Math.ceil(prompt.promptCharacters / 4),
      system: prompt.packet.system,
      prompt: prompt.packet.prompt,
      preview: toPromptPreview(prompt.packet, input),
    };
  }

  const result = await generateCharacterTurn(
    prompt.packet,
    runtimeConfigFromPlaygroundInput(input),
    generationOptionsFromInput(input),
  );
  const text = sanitizeCharacterText(result.text, member.name);
  const elapsedMs = Math.round(performance.now() - startedAt);
  const chatMessages = appendMemberReply(input, text);

  return {
    mode: input.mode,
    text,
    turns: [
      {
        speakerId: member.id,
        speakerName: member.name,
        text,
      },
    ],
    chatMessages,
    model: result.model,
    providerMode: result.providerMode,
    elapsedMs,
    promptCharacters: prompt.promptCharacters,
    approximatePromptTokens: Math.ceil(prompt.promptCharacters / 4),
    system: prompt.packet.system,
    prompt: prompt.packet.prompt,
    preview: toPromptPreview(prompt.packet, input),
  };
}

async function runPlaygroundConversation({
  input,
  member,
  partner,
  scenario,
  pairState,
  pairMemories,
  participantIds,
  initialTranscript,
  dateHealth,
  frictionRuleHits,
}: {
  input: DatePlaygroundInput;
  member: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  pairMemories: MemoryRecord[];
  participantIds: [string, string];
  initialTranscript: DateMessage[];
  dateHealth: number;
  frictionRuleHits: readonly string[];
}): Promise<{
  turns: PlaygroundGeneratedTurn[];
  lastPacket: CharacterPromptPacket;
  promptCharacters: number;
  model: string;
  providerMode: AiProvider;
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
  let model = input.model;
  let providerMode: AiProvider = input.provider;

  for (let index = 0; index < input.turnCount; index += 1) {
    const speaker = members[nextSpeakerIndex];
    const listener = members[1 - nextSpeakerIndex];
    const session = buildPlaygroundSession({
      input,
      pairState,
      participantIds,
      transcript,
      currentTurn,
      speaker,
      member,
      partner,
      dateHealth,
    });
    const focusRequest =
      input.includeCurrentAsk && speaker.state.currentRequestId !== undefined
        ? memberRequests.find((candidate) => candidate.id === speaker.state.currentRequestId)
        : undefined;
    const packet = applyPlaygroundOverrides(
      buildCharacterPromptPacket({
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
      }),
      input,
    );
    promptCharacters += packet.system.length + packet.prompt.length;
    const result = await generateCharacterTurn(
      packet,
      runtimeConfigFromPlaygroundInput(input),
      generationOptionsFromInput(input),
    );
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

function buildDatePlaygroundPrompt(input: DatePlaygroundInput) {
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
  const session = buildPlaygroundSession({
    input,
    pairState: tunedPairState,
    participantIds,
    transcript,
    currentTurn: transcript.filter((message) => message.kind === "character").length,
    speaker: member,
    member,
    partner,
    dateHealth: input.dateHealth,
  });
  const focusRequest =
    input.includeCurrentAsk && member.state.currentRequestId !== undefined
      ? memberRequests.find((candidate) => candidate.id === member.state.currentRequestId)
      : undefined;
  const packet = applyPlaygroundOverrides(
    buildCharacterPromptPacket({
      member,
      partner,
      scenario,
      session,
      pairState: tunedPairState,
      memoryPack: {
        self: [],
        pair: pairMemories,
        scenario: [],
        recentTranscript: transcript.slice(-8),
      },
      focusRequest,
      frictionRuleHits: pairRuleHits(matchFit),
    }),
    input,
  );

  return {
    member,
    partner,
    scenario,
    pairState: tunedPairState,
    pairMemories,
    participantIds,
    initialTranscript: transcript,
    dateHealth: input.dateHealth,
    frictionRuleHits: pairRuleHits(matchFit),
    matchFit,
    packet,
    promptCharacters: packet.system.length + packet.prompt.length,
  };
}

function buildPlaygroundSession({
  input,
  pairState,
  participantIds,
  transcript,
  currentTurn,
  speaker,
  member,
  partner,
  dateHealth,
}: {
  input: DatePlaygroundInput;
  pairState: PairState;
  participantIds: [string, string];
  transcript: DateMessage[];
  currentTurn: number;
  speaker: Member;
  member: Member;
  partner: Member;
  dateHealth: number;
}) {
  return dateSessionSchema.parse({
    id: "playground-ai-session",
    pairId: pairState.id,
    scenarioId: input.scenarioId,
    focusMemberId: speaker.id,
    focusRequestId:
      input.includeCurrentAsk && speaker.state.currentRequestId !== undefined
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
}

function buildMemberChatPrompt(input: MemberChatPlaygroundInput): {
  packet: CharacterPromptPacket;
  promptCharacters: number;
} {
  const member = requireMember(input.memberId);
  const latestTesterMessage = input.testerMessage.trim();
  const threadMessages =
    latestTesterMessage.length === 0
      ? input.chatMessages
      : [...input.chatMessages, { role: "tester" as const, text: latestTesterMessage }];
  const historyText =
    threadMessages.length === 0
      ? "No prior interview transcript."
      : threadMessages
          .map(
            (message) =>
              `${message.role === "tester" ? "Cupid QA" : member.firstName}: ${message.text}`,
          )
          .join("\n");
  const system = [
    `You are ${member.name}, speaking in a private Cupid QA playground interview.`,
    "Stay in character. Answer the tester directly.",
    "Do not update game state, memories, relationship stats, or date outcomes.",
    "Keep replies useful for prompt testing and under the output limit.",
  ].join("\n");
  const prompt = [
    "Cupid QA is interviewing one member outside gameplay.",
    "",
    `Member: ${member.name}`,
    `Origin: ${member.origin}`,
    `Species: ${member.species}`,
    `Reality status: ${member.realityStatus}`,
    `Bio: ${member.bio}`,
    `Dating profile: ${member.datingProfile}`,
    `Relationship needs: ${member.relationshipNeeds.join("; ")}`,
    `Preferences: ${member.preferences.join("; ")}`,
    `Dealbreakers: ${member.dealbreakers.join("; ")}`,
    `Voice register: ${member.voice.register}`,
    `Voice tics: ${member.voice.tics.join("; ")}`,
    `Sample opener lines: ${member.voice.sampleMessages.opener.join(" / ")}`,
    "",
    "Private subtext for performance only. Do not confess it directly unless asked with care.",
    member.secrets.join("\n"),
    "",
    "Interview transcript:",
    historyText,
    "",
    "Reply as the member now.",
  ].join("\n");
  const packet = applyPlaygroundOverrides(
    {
      system,
      prompt,
    },
    input,
  );

  return {
    packet,
    promptCharacters: packet.system.length + packet.prompt.length,
  };
}

function applyPlaygroundOverrides<TPacket extends CharacterPromptPacket>(
  packet: TPacket,
  input: { systemOverride: string; promptOverride: string },
): TPacket {
  return {
    ...packet,
    system: input.systemOverride.trim().length > 0 ? input.systemOverride : packet.system,
    prompt: input.promptOverride.trim().length > 0 ? input.promptOverride : packet.prompt,
  };
}

function runtimeConfigFromPlaygroundInput(
  input: DatePlaygroundInput | MemberChatPlaygroundInput,
): Partial<AiRuntimeConfig> {
  return {
    aiProvider: input.provider,
    chatModel: input.model,
    embeddingModel:
      input.provider === "gateway"
        ? DEFAULT_GATEWAY_EMBEDDING_MODEL
        : DEFAULT_OLLAMA_EMBEDDING_MODEL,
    reasoningLevel: input.reasoningLevel,
    ollamaBaseURL: input.ollamaBaseURL,
    gatewayBaseURL: input.gatewayBaseURL,
    gatewayApiKey: input.gatewayApiKey,
    contextWindowTokens: input.numCtx,
    requestTimeoutMs: 90_000,
  };
}

function generationOptionsFromInput(input: DatePlaygroundInput | MemberChatPlaygroundInput) {
  return {
    temperature: input.temperature,
    topP: input.topP,
    topK: input.topK,
    numCtx: input.numCtx,
    maxOutputTokens: input.maxOutputTokens,
  };
}

function toPromptPreview(
  packet: CharacterPromptPacket,
  input: DatePlaygroundInput | MemberChatPlaygroundInput,
): PromptPreviewPayload {
  return {
    system: packet.system,
    prompt: packet.prompt,
    model: input.model,
    providerMode: input.provider,
    sampling: {
      temperature: input.temperature,
      topP: input.topP,
      topK: input.topK,
    },
    limits: {
      numCtx: input.numCtx,
      maxOutputTokens: input.maxOutputTokens,
    },
    reasoningLevel: input.reasoningLevel,
  };
}

function appendMemberReply(
  input: MemberChatPlaygroundInput,
  text: string,
): PlaygroundChatMessage[] {
  const testerMessage = input.testerMessage.trim();
  const nextMessages =
    testerMessage.length === 0
      ? input.chatMessages
      : [...input.chatMessages, { role: "tester" as const, text: testerMessage }];

  return [...nextMessages, { role: "member", text }];
}

function formatGeneratedTurns(turns: PlaygroundGeneratedTurn[]): string {
  return turns.map((turn) => `${turn.speakerName}: ${turn.text}`).join("\n");
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

function addLegacyDateMode(value: unknown): unknown {
  if (!isRecord(value) || "mode" in value) {
    return value;
  }

  return {
    ...value,
    mode: "dateConversation",
    action: "generate",
    provider: "ollama",
    reasoningLevel: "off",
  };
}
