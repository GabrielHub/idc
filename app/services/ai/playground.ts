import {
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  dateMessageSchema,
  dateFinalReportSchema,
  dateSessionSchema,
  memoryRecordSchema,
  pairStateSchema,
  type AiProvider,
  type AiReasoningLevel,
  type DateMessage,
  type DateScenario,
  type Member,
  type MemoryRecord,
  type PairState,
} from "../../domain/game";
import { memberRequests, starterMembers, starterScenarios } from "../../fixtures";
import { EmptyPerformerMessageError, sanitizeCharacterText } from "../ai-date-engine";
import {
  buildJudgePromptPacket,
  buildCharacterPromptPacket,
  withCharacterVisibilityRetryGuard,
  type CharacterPromptPacket,
} from "../date-prompts";
import { createSeedGameSave, makePairId, sortMemberIds } from "../game-seed";
import { evaluateMatchFit } from "../match-fit";
import { derivePairTrajectory } from "../pair-trajectory";
import { escapeRegex } from "../utils";
import { previewFollowUpEffects } from "../date-engine";
import {
  modelDefaultsForProvider,
  recommendedOllamaChatModels,
  type OllamaModelSummary,
} from "./model-catalog";
import {
  type AiGenerationOptions,
  generateCharacterTurn,
  listOllamaModelInventory,
  type AiRuntimeConfig,
  type GeneratedTextResult,
} from "./model-service";
import {
  findPlaygroundSeedPack,
  PLAYGROUND_SEED_PACKS,
  type PlaygroundSeedPack,
} from "./playground-seeds";

export type PlaygroundAction = "generate" | "preview";
export type FeatureBenchPlaygroundMode = "extractorBench" | "judgeBench" | "followUpBench";
export type PlaygroundMode = "dateConversation" | "memberChat" | FeatureBenchPlaygroundMode;
export type PlaygroundChatMessage = {
  role: "tester" | "member";
  text: string;
};

type BasePlaygroundInput = {
  action: PlaygroundAction;
  provider: AiProvider;
  model: string;
  gatewayApiKey?: string;
  ollamaBaseURL?: string;
  gatewayBaseURL?: string;
  reasoningLevel: AiReasoningLevel;
  temperature: number;
  topP: number;
  topK: number;
  numCtx: number;
  maxOutputTokens: number;
  systemOverride: string;
  promptOverride: string;
};

type AnyPlaygroundInput =
  | DatePlaygroundInput
  | MemberChatPlaygroundInput
  | FeatureBenchPlaygroundInput;

export type DatePlaygroundInput = BasePlaygroundInput & {
  mode: "dateConversation";
  memberId: string;
  partnerId: string;
  scenarioId: string;
  dateHealth: number;
  spark: number;
  strain: number;
  transcriptText: string;
  memoryText: string;
  includeCurrentAsk: boolean;
  turnCount: number;
};

export type MemberChatPlaygroundInput = BasePlaygroundInput & {
  mode: "memberChat";
  memberId: string;
  testerMessage: string;
  chatMessages: PlaygroundChatMessage[];
};

export type FeatureBenchPlaygroundInput = BasePlaygroundInput & {
  mode: FeatureBenchPlaygroundMode;
  seedId: string;
};

export type PlaygroundGeneratedTurn = {
  speakerId: string;
  speakerName: string;
  text: string;
};

export type PromptPreviewPayload = {
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

export type PlaygroundResult = {
  mode: PlaygroundMode;
  text: string;
  turns: PlaygroundGeneratedTurn[];
  chatMessages?: PlaygroundChatMessage[];
  model: string;
  providerMode: AiProvider;
  elapsedMs: number;
  promptCharacters: number;
  approximatePromptTokens: number;
  matchFit?: ReturnType<typeof evaluateMatchFit>;
  seed?: PlaygroundSeedPack;
  system: string;
  prompt: string;
  preview: PromptPreviewPayload;
};

export type PlaygroundDefaults = {
  models: OllamaModelSummary[];
  defaults: DatePlaygroundInput;
  memberChatDefaults: MemberChatPlaygroundInput;
  featureBenchDefaults: FeatureBenchPlaygroundInput;
  seedPacks: readonly PlaygroundSeedPack[];
  previews: {
    dateConversation: PromptPreviewPayload;
    memberChat: PromptPreviewPayload;
    extractorBench: PromptPreviewPayload;
    judgeBench: PromptPreviewPayload;
    followUpBench: PromptPreviewPayload;
  };
};

export type DatePlaygroundGenerationRuntime = {
  generateCharacterTurn(input: {
    packet: CharacterPromptPacket;
    config?: Partial<AiRuntimeConfig>;
    options?: AiGenerationOptions;
  }): Promise<GeneratedTextResult>;
};

export type MemberChatGenerationRuntime = DatePlaygroundGenerationRuntime;
export type FeatureBenchGenerationRuntime = DatePlaygroundGenerationRuntime;

const MODEL_SERVICE_DATE_PLAYGROUND_RUNTIME: DatePlaygroundGenerationRuntime = {
  generateCharacterTurn,
};

const MODEL_SERVICE_MEMBER_CHAT_RUNTIME: MemberChatGenerationRuntime = {
  generateCharacterTurn,
};

const MODEL_SERVICE_FEATURE_BENCH_RUNTIME: FeatureBenchGenerationRuntime = {
  generateCharacterTurn,
};

export const DEFAULT_DATE_PLAYGROUND_SETTINGS = {
  mode: "dateConversation",
  action: "generate",
  provider: "ollama",
  model: "gemma4:26b",
  reasoningLevel: "off",
  temperature: 1,
  topP: 0.95,
  topK: 64,
  numCtx: 16384,
  maxOutputTokens: 512,
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

export const DEFAULT_MEMBER_CHAT_SETTINGS = {
  mode: "memberChat",
  action: "generate",
  provider: "gateway",
  model: modelDefaultsForProvider("gateway").chatModel,
  reasoningLevel: "none",
  temperature: 0.8,
  topP: 0.95,
  topK: 64,
  numCtx: 8192,
  maxOutputTokens: 256,
  memberId: "jenna-pike",
  testerMessage: "What would make a date feel normal enough to trust?",
  chatMessages: [],
  systemOverride: "",
  promptOverride: "",
} satisfies MemberChatPlaygroundInput;

export const DEFAULT_FEATURE_BENCH_SETTINGS = {
  mode: "extractorBench",
  action: "generate",
  provider: "ollama",
  model: "gemma4:26b",
  reasoningLevel: "off",
  temperature: 0.6,
  topP: 0.9,
  topK: 40,
  numCtx: 16384,
  maxOutputTokens: 520,
  seedId: PLAYGROUND_SEED_PACKS[0]?.id ?? "agreement-no-filming",
  systemOverride: "",
  promptOverride: "",
} satisfies FeatureBenchPlaygroundInput;

export async function loadPlaygroundDefaults(): Promise<PlaygroundDefaults> {
  const inventory = await listOllamaModelInventory();
  const models = recommendedOllamaChatModels(inventory.models);
  const datePrompt = buildDatePlaygroundPrompt(DEFAULT_DATE_PLAYGROUND_SETTINGS);
  const memberPrompt = buildMemberChatPrompt(DEFAULT_MEMBER_CHAT_SETTINGS);
  const extractorPrompt = buildFeatureBenchPrompt(DEFAULT_FEATURE_BENCH_SETTINGS);
  const judgePrompt = buildFeatureBenchPrompt({
    ...DEFAULT_FEATURE_BENCH_SETTINGS,
    mode: "judgeBench",
  });
  const followUpPrompt = buildFeatureBenchPrompt({
    ...DEFAULT_FEATURE_BENCH_SETTINGS,
    mode: "followUpBench",
  });

  return {
    models,
    defaults: DEFAULT_DATE_PLAYGROUND_SETTINGS,
    memberChatDefaults: DEFAULT_MEMBER_CHAT_SETTINGS,
    featureBenchDefaults: DEFAULT_FEATURE_BENCH_SETTINGS,
    seedPacks: PLAYGROUND_SEED_PACKS,
    previews: {
      dateConversation: toPromptPreview(datePrompt.packet, DEFAULT_DATE_PLAYGROUND_SETTINGS),
      memberChat: toPromptPreview(memberPrompt.packet, DEFAULT_MEMBER_CHAT_SETTINGS),
      extractorBench: toPromptPreview(extractorPrompt.packet, DEFAULT_FEATURE_BENCH_SETTINGS),
      judgeBench: toPromptPreview(judgePrompt.packet, {
        ...DEFAULT_FEATURE_BENCH_SETTINGS,
        mode: "judgeBench",
      }),
      followUpBench: toPromptPreview(followUpPrompt.packet, {
        ...DEFAULT_FEATURE_BENCH_SETTINGS,
        mode: "followUpBench",
      }),
    },
  };
}

export async function runPlaygroundDateConversation(
  input: DatePlaygroundInput,
  runtime: DatePlaygroundGenerationRuntime = MODEL_SERVICE_DATE_PLAYGROUND_RUNTIME,
): Promise<PlaygroundResult> {
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
    runtime,
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

export async function runPlaygroundMemberChat(
  input: MemberChatPlaygroundInput,
  runtime: MemberChatGenerationRuntime = MODEL_SERVICE_MEMBER_CHAT_RUNTIME,
): Promise<PlaygroundResult> {
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

  const generation = await generateMemberChatReply({
    packet: prompt.packet,
    input,
    member,
    runtime,
  });
  const elapsedMs = Math.round(performance.now() - startedAt);
  const chatMessages = appendMemberReply(input, generation.text);

  return {
    mode: input.mode,
    text: generation.text,
    turns: [
      {
        speakerId: member.id,
        speakerName: member.name,
        text: generation.text,
      },
    ],
    chatMessages,
    model: generation.result.model,
    providerMode: generation.result.providerMode,
    elapsedMs,
    promptCharacters: prompt.promptCharacters,
    approximatePromptTokens: Math.ceil(prompt.promptCharacters / 4),
    system: prompt.packet.system,
    prompt: prompt.packet.prompt,
    preview: toPromptPreview(prompt.packet, input),
  };
}

export async function runPlaygroundFeatureBench(
  input: FeatureBenchPlaygroundInput,
  runtime: FeatureBenchGenerationRuntime = MODEL_SERVICE_FEATURE_BENCH_RUNTIME,
): Promise<PlaygroundResult> {
  const startedAt = performance.now();
  const bench = buildFeatureBenchPrompt(input);

  if (input.action === "preview") {
    return {
      mode: input.mode,
      text: "",
      turns: [],
      model: input.model,
      providerMode: input.provider,
      elapsedMs: 0,
      promptCharacters: bench.promptCharacters,
      approximatePromptTokens: Math.ceil(bench.promptCharacters / 4),
      matchFit: bench.matchFit,
      seed: bench.seed,
      system: bench.packet.system,
      prompt: bench.packet.prompt,
      preview: toPromptPreview(bench.packet, input),
    };
  }

  const generation = await runtime.generateCharacterTurn({
    packet: bench.packet,
    config: runtimeConfigFromPlaygroundInput(input),
    options: generationOptionsFromInput(input),
  });
  const elapsedMs = Math.round(performance.now() - startedAt);
  const text = generation.text.trim();

  return {
    mode: input.mode,
    text,
    turns: [
      {
        speakerId: input.mode,
        speakerName: featureBenchLabel(input.mode),
        text,
      },
    ],
    model: generation.model,
    providerMode: generation.providerMode,
    elapsedMs,
    promptCharacters: bench.promptCharacters,
    approximatePromptTokens: Math.ceil(bench.promptCharacters / 4),
    matchFit: bench.matchFit,
    seed: bench.seed,
    system: bench.packet.system,
    prompt: bench.packet.prompt,
    preview: toPromptPreview(bench.packet, input),
  };
}

type MemberChatRetryReason = "empty" | "clipped" | "fragment" | "presentation";

const MEMBER_CHAT_RETRY_CHAR_LIMIT = 170;
const MEMBER_CHAT_FINAL_RETRY_CHAR_LIMIT = 140;
const MEMBER_CHAT_RETRY_MIN_TOKENS = 128;
const MEMBER_CHAT_FINAL_RETRY_MAX_TOKENS = 96;
const MEMBER_CHAT_FINAL_RETRY_MAX_TEMPERATURE = 0.4;

async function generateMemberChatReply({
  packet,
  input,
  member,
  runtime,
}: {
  packet: CharacterPromptPacket;
  input: MemberChatPlaygroundInput;
  member: Member;
  runtime: MemberChatGenerationRuntime;
}): Promise<{ result: GeneratedTextResult; text: string }> {
  const result = await runtime.generateCharacterTurn({
    packet,
    config: runtimeConfigFromPlaygroundInput(input),
    options: generationOptionsFromInput(input),
  });

  const firstAttempt = inspectMemberChatReply(result.text, member);

  if (firstAttempt.outcome === "ok") {
    return { result, text: firstAttempt.text };
  }

  const retryPacket: CharacterPromptPacket = {
    ...packet,
    prompt: [
      packet.prompt,
      "",
      memberChatRetryReasonText(firstAttempt.reason),
      "Rewrite the reply as plain chat.",
      `Use one complete conversational sentence under ${MEMBER_CHAT_RETRY_CHAR_LIMIT} characters.`,
      "Start with message content. No labels, brackets, Markdown, HTML, bullets, stage directions, setup text, or notes.",
    ].join("\n"),
  };
  const retryResult = await runtime.generateCharacterTurn({
    packet: retryPacket,
    config: runtimeConfigFromPlaygroundInput(input),
    options: generationOptionsFromInput({
      ...input,
      maxOutputTokens: Math.max(input.maxOutputTokens, MEMBER_CHAT_RETRY_MIN_TOKENS),
    }),
  });

  const secondAttempt = inspectMemberChatReply(retryResult.text, member);

  if (secondAttempt.outcome === "ok") {
    return { result: retryResult, text: secondAttempt.text };
  }

  const finalRetryPacket: CharacterPromptPacket = {
    ...packet,
    prompt: [
      packet.prompt,
      "",
      `Final retry. Write exactly one short complete chat sentence under ${MEMBER_CHAT_FINAL_RETRY_CHAR_LIMIT} characters.`,
      "Use plain text only. Start with the answer. No labels, brackets, Markdown, HTML, bullets, stage directions, setup text, or notes.",
    ].join("\n"),
  };
  const finalRetryResult = await runtime.generateCharacterTurn({
    packet: finalRetryPacket,
    config: runtimeConfigFromPlaygroundInput(input),
    options: generationOptionsFromInput({
      ...input,
      temperature: Math.min(input.temperature, MEMBER_CHAT_FINAL_RETRY_MAX_TEMPERATURE),
      maxOutputTokens: MEMBER_CHAT_FINAL_RETRY_MAX_TOKENS,
    }),
  });

  return {
    result: finalRetryResult,
    text: memberChatFinalText(finalRetryResult.text, member, input),
  };
}

type MemberChatReplyInspection =
  | { outcome: "ok"; text: string }
  | { outcome: "retry"; reason: MemberChatRetryReason };

function inspectMemberChatReply(rawText: string, member: Member): MemberChatReplyInspection {
  try {
    const text = sanitizeCharacterText(rawText, member.name);

    if (!shouldRetryMemberChatMessage(text, member)) {
      return { outcome: "ok", text };
    }

    return { outcome: "retry", reason: memberChatRetryReasonForText(text, member) };
  } catch (error) {
    if (!isEmptyPerformerMessage(error)) {
      throw error;
    }

    return { outcome: "retry", reason: "empty" };
  }
}

function isEmptyPerformerMessage(error: unknown): boolean {
  return error instanceof EmptyPerformerMessageError;
}

function isClippedMemberChatMessage(text: string): boolean {
  return /(?:\.\.\.|…)$/.test(text.trim());
}

const FRAGMENT_TRAILING_WORDS = new Set([
  "a",
  "about",
  "after",
  "an",
  "and",
  "at",
  "because",
  "before",
  "but",
  "by",
  "for",
  "from",
  "give",
  "if",
  "in",
  "like",
  "make",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "through",
  "to",
  "when",
  "while",
  "with",
  "your",
]);

function shouldRetryMemberChatMessage(text: string, member: Member): boolean {
  return (
    isClippedMemberChatMessage(text) ||
    isFragmentMemberChatMessage(text) ||
    hasForbiddenMemberChatPresentation(text, member)
  );
}

function memberChatRetryReasonForText(
  text: string,
  member: Member,
): Exclude<MemberChatRetryReason, "empty"> {
  if (isClippedMemberChatMessage(text)) {
    return "clipped";
  }

  if (isFragmentMemberChatMessage(text)) {
    return "fragment";
  }

  return hasForbiddenMemberChatPresentation(text, member) ? "presentation" : "fragment";
}

function isFragmentMemberChatMessage(text: string): boolean {
  const trimmedText = text.trim();

  if (/[.!?][)"'\]]*$/.test(trimmedText)) {
    return false;
  }

  if (trimmedText.length < 40 || /[,;:]$/.test(trimmedText)) {
    return true;
  }

  const trailingWord = trimmedText.match(/\b[\p{Letter}']+$/u)?.[0].toLowerCase();

  return trailingWord !== undefined && FRAGMENT_TRAILING_WORDS.has(trailingWord);
}

const MEMBER_CHAT_PRESENTATION_PATTERNS: readonly RegExp[] = [
  /[*_`]/,
  /^\s*>/,
  /^\s*(?:[-+*]|\d+[.)])\s+/,
  /^\s*[<{]/,
  /<\/?[a-z][\w:-]*(?:\s+[^>]*)?>/i,
  /^\s*(?:assistant|user|system|member|tester|other person|reply|answer|message|speaker|stage|direction|narration)\s*:/i,
  /^\s*\([^)]{1,80}\)\s*/,
  /^\s*\[[^\]]{1,80}\]\s*/,
  /\b(?:as an ai|as a language model|stage direction)\b/i,
];

function hasForbiddenMemberChatPresentation(text: string, member: Member): boolean {
  if (memberChatSpeakerLabelPattern(member).test(text)) {
    return true;
  }

  return MEMBER_CHAT_PRESENTATION_PATTERNS.some((pattern) => pattern.test(text));
}

function memberChatSpeakerLabelPattern(member: Member): RegExp {
  const labels = [member.firstName, member.name, member.id]
    .map((label) => label.trim())
    .filter((label) => label.length > 0)
    .map(escapeRegex);

  return new RegExp(`^\\s*(?:${labels.join("|")})\\s*:`, "i");
}

function memberChatRetryReasonText(reason: MemberChatRetryReason): string {
  if (reason === "empty") {
    return "The previous reply had no visible chat message after cleanup.";
  }

  if (reason === "fragment") {
    return "The previous reply stopped as a fragment.";
  }

  if (reason === "presentation") {
    return "The previous reply used markup, labels, or stage directions.";
  }

  return "The previous reply appeared cut off before a complete message.";
}

function finishTerminalPunctuation(text: string): string {
  const trimmedText = text.trim();

  if (!/[,;:]$/.test(trimmedText)) {
    return trimmedText;
  }

  return `${trimmedText.slice(0, -1).trim()}.`;
}

function memberChatFinalText(
  text: string,
  member: Member,
  input: MemberChatPlaygroundInput,
): string {
  try {
    const finalText = finishTerminalPunctuation(sanitizeCharacterText(text, member.name));

    if (!shouldRetryMemberChatMessage(finalText, member)) {
      return finalText;
    }
  } catch (error) {
    if (!isEmptyPerformerMessage(error)) {
      throw error;
    }
  }

  return fallbackMemberChatText(member, input);
}

function fallbackMemberChatText(member: Member, input: MemberChatPlaygroundInput): string {
  const latestTesterText = latestMemberChatTesterText(input);

  if (/\b(?:plan|meet|date|coffee|dinner|normal|trust)\b/i.test(latestTesterText)) {
    return "A clear time, a quiet table, and no surprise audience. I can work with that.";
  }

  const firstName = member.firstName.trim();
  const subject = firstName.length > 0 ? firstName : "I";

  if (subject !== "I" && /\b(?:who are you|your name|name)\b/i.test(latestTesterText)) {
    return `${subject}. One clean question at a time, please. I do better when the room stops moving.`;
  }

  return "I need one clean question at a time. Ask it plainly and I will answer.";
}

function latestMemberChatTesterText(input: MemberChatPlaygroundInput): string {
  const latestDraft = input.testerMessage.trim();

  if (latestDraft.length > 0) {
    return latestDraft;
  }

  for (let index = input.chatMessages.length - 1; index >= 0; index -= 1) {
    const message = input.chatMessages[index];

    if (message?.role === "tester") {
      return message.text;
    }
  }

  return "";
}

const DATE_PLAYGROUND_EMPTY_RETRY_MIN_TOKENS = 512;

function packetCharacterCount(packet: CharacterPromptPacket): number {
  return packet.system.length + packet.prompt.length;
}

async function generatePlaygroundCharacterTurn({
  packet,
  input,
  speaker,
  runtime,
}: {
  packet: CharacterPromptPacket;
  input: DatePlaygroundInput;
  speaker: Member;
  runtime: DatePlaygroundGenerationRuntime;
}): Promise<{
  result: GeneratedTextResult;
  text: string;
  packet: CharacterPromptPacket;
  promptCharactersConsumed: number;
}> {
  const result = await runtime.generateCharacterTurn({
    packet,
    config: runtimeConfigFromPlaygroundInput(input),
    options: generationOptionsFromInput(input),
  });
  const initialPacketCharacters = packetCharacterCount(packet);

  try {
    return {
      result,
      text: sanitizeCharacterText(result.text, speaker.name),
      packet,
      promptCharactersConsumed: initialPacketCharacters,
    };
  } catch (error) {
    if (!isEmptyPerformerMessage(error)) {
      throw error;
    }
  }

  const retryPacket = withCharacterVisibilityRetryGuard(packet);
  const retryResult = await runtime.generateCharacterTurn({
    packet: retryPacket,
    config: runtimeConfigFromPlaygroundInput(input),
    options: generationOptionsFromInput({
      ...input,
      maxOutputTokens: Math.max(input.maxOutputTokens, DATE_PLAYGROUND_EMPTY_RETRY_MIN_TOKENS),
    }),
  });

  return {
    result: retryResult,
    text: sanitizeCharacterText(retryResult.text, speaker.name),
    packet: retryPacket,
    promptCharactersConsumed: initialPacketCharacters + packetCharacterCount(retryPacket),
  };
}

async function runPlaygroundConversation({
  input,
  runtime,
  member,
  partner,
  scenario,
  pairState,
  pairMemories,
  participantIds,
  initialTranscript,
  dateHealth,
}: {
  input: DatePlaygroundInput;
  runtime: DatePlaygroundGenerationRuntime;
  member: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  pairMemories: MemoryRecord[];
  participantIds: [string, string];
  initialTranscript: DateMessage[];
  dateHealth: number;
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
          recentTranscript: transcript,
        },
        focusRequest,
        memorySearchAvailable: false,
      }),
      input,
    );
    const generated = await generatePlaygroundCharacterTurn({
      packet,
      input,
      speaker,
      runtime,
    });
    promptCharacters += generated.promptCharactersConsumed;
    const result = generated.result;
    const text = generated.text;
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
    lastPacket = generated.packet;
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
        recentTranscript: transcript,
      },
      focusRequest,
      memorySearchAvailable: false,
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
    matchFit,
    packet,
    promptCharacters: packet.system.length + packet.prompt.length,
  };
}

function buildFeatureBenchPrompt(input: FeatureBenchPlaygroundInput): {
  seed: PlaygroundSeedPack;
  packet: CharacterPromptPacket;
  promptCharacters: number;
  matchFit: ReturnType<typeof evaluateMatchFit>;
} {
  const seed = findPlaygroundSeedPack(input.seedId);
  const context = buildSeedContext(seed);
  const packet = applyPlaygroundOverrides(featurePacketForMode(input.mode, seed, context), input);

  return {
    seed,
    packet,
    promptCharacters: packet.system.length + packet.prompt.length,
    matchFit: context.matchFit,
  };
}

function buildSeedContext(seed: PlaygroundSeedPack) {
  const member = requireMember(seed.memberId);
  const partner = requireMember(seed.partnerId);
  const scenario = starterScenarios.find((candidate) => candidate.id === seed.scenarioId);

  if (scenario === undefined) {
    throw new Error(`Scenario not found: ${seed.scenarioId}`);
  }

  const participantIds = sortMemberIds(member.id, partner.id);
  const pairId = makePairId(member.id, partner.id);
  const transcript = buildTranscriptMessages({
    text: seed.transcriptText,
    member,
    partner,
    dateSessionId: "playground-ai-session",
  });
  const pairMemories = buildMemoryRecords(seed.memoryText, pairId, scenario.id, participantIds);
  const pairState = pairStateSchema.parse({
    id: pairId,
    participantIds,
    stats: {
      chemistry: Math.max(0, Math.min(100, seed.spark + 2)),
      trust: 55,
      stability: Math.max(0, Math.min(100, 100 - seed.strain)),
      conflict: seed.strain,
      weirdnessTolerance: member.species === partner.species ? 45 : 62,
      spark: seed.spark,
      strain: seed.strain,
      relationshipHealth: Math.round((seed.dateHealth + seed.spark + (100 - seed.strain)) / 3),
    },
    completedDateIds: seed.expected.outcome === "second_date" ? ["seed-prior-date-1"] : [],
    scenarioUseCounts: { [scenario.id]: seed.expected.judgePressure === "high" ? 1 : 0 },
    agreements: seed.expected.agreements.map((text, index) => ({
      id: `agreement-seed-${seed.id}-${index + 1}`,
      text,
      status: "active",
      sourceDateSessionId: "seed-prior-date-1",
      sourceJudgeSnapshotId: `judge-seed-${index + 1}`,
      createdAt: "2026-05-05T12:00:00.000Z",
    })),
    openLoops: seed.expected.openLoops.map((text, index) => ({
      id: `open-loop-seed-${seed.id}-${index + 1}`,
      text,
      status: "open",
      sourceDateSessionId: "seed-prior-date-1",
      sourceJudgeSnapshotId: `judge-seed-${index + 1}`,
      createdAt: "2026-05-05T12:00:00.000Z",
    })),
  });
  const session = buildPlaygroundSession({
    input: {
      ...DEFAULT_DATE_PLAYGROUND_SETTINGS,
      memberId: member.id,
      partnerId: partner.id,
      scenarioId: scenario.id,
      dateHealth: seed.dateHealth,
      spark: seed.spark,
      strain: seed.strain,
      transcriptText: seed.transcriptText,
      memoryText: seed.memoryText,
      includeCurrentAsk: seed.includeCurrentAsk,
      turnCount: seed.turnCount,
    },
    pairState,
    participantIds,
    transcript,
    currentTurn: transcript.filter((message) => message.kind === "character").length,
    speaker: member,
    member,
    partner,
    dateHealth: seed.dateHealth,
  });
  const finalReport = dateFinalReportSchema.parse({
    id: `final-playground-${seed.id}`,
    dateSessionId: session.id,
    completedAt: "2026-05-05T12:30:00.000Z",
    outcome: seed.expected.outcome,
    summary: `${member.firstName} and ${partner.firstName} filed a playground case.`,
    statSummary: "Case read: playground seed for tuning.",
    recommendedFollowUp: seed.expected.followUpAction,
    memoryRecordIds: [],
    readyToClose: false,
  });
  const completedSession = dateSessionSchema.parse({
    ...session,
    status: seed.expected.outcome === "early_end" ? "ended_early" : "completed",
    finalReport,
  });
  const activeRequests = seed.includeCurrentAsk
    ? [member, partner]
        .map((candidate) =>
          candidate.state.currentRequestId === undefined
            ? undefined
            : memberRequests.find((request) => request.id === candidate.state.currentRequestId),
        )
        .filter((request) => request !== undefined)
    : [];
  const matchFit = evaluateMatchFit({
    members: [member, partner],
    scenario,
    pairState,
    activeRequests,
  });

  return {
    member,
    partner,
    scenario,
    pairState,
    transcript,
    pairMemories,
    session,
    completedSession,
    matchFit,
  };
}

function featurePacketForMode(
  mode: FeatureBenchPlaygroundMode,
  seed: PlaygroundSeedPack,
  context: ReturnType<typeof buildSeedContext>,
): CharacterPromptPacket {
  if (mode === "judgeBench") {
    return buildJudgePromptPacket({
      scenario: context.scenario,
      session: context.session,
      pairState: context.pairState,
      exchangeMessages: context.transcript,
      members: [context.member, context.partner],
      revealCandidates: [],
    });
  }

  if (mode === "followUpBench") {
    const preview = previewFollowUpEffects(
      context.pairState,
      context.completedSession,
      seed.expected.followUpAction,
    );
    const trajectory = derivePairTrajectory({
      pairState: context.pairState,
      currentSession: context.completedSession,
      completedSessions: [context.completedSession],
    });

    return {
      system: [
        "You are testing IDC follow-up consequences.",
        "Explain whether the recommended follow-up matches the case data.",
        "Return concise JSON only. Do not include hidden stat labels in player copy.",
      ].join("\n"),
      prompt: [
        `Seed: ${seed.title}.`,
        `Pair: ${context.member.name} and ${context.partner.name}.`,
        `Outcome: ${seed.expected.outcome}. Follow-up: ${seed.expected.followUpAction}.`,
        `Active agreements: ${formatSeedAgreements(context.pairState)}.`,
        `Open loops: ${formatSeedOpenLoops(context.pairState)}.`,
        `Trajectory guidance: ${trajectory.judgeGuidance}`,
        `Computed preview: ${JSON.stringify(preview)}`,
        `Seed notes: ${seed.notes}`,
        'Return JSON shape: {"fit":"good|bad","reason":"short note","tuningNotes":["short note"]}.',
      ].join("\n"),
    };
  }

  return {
    system: [
      "You are the IDC pair memory extractor.",
      "Read a date transcript and propose bounded pair agreements and open loops.",
      "Return JSON only. Do not score the date, reveal hidden tags, or include exact stats.",
    ].join("\n"),
    prompt: [
      `Seed: ${seed.title}.`,
      `Pair: ${context.member.name} and ${context.partner.name}.`,
      `Scenario: ${context.scenario.title}.`,
      `Existing pair memories: ${context.pairMemories.map((memory) => memory.text).join(" ") || "None."}`,
      `Transcript:\n${seed.transcriptText}`,
      `Expected tuning target: ${JSON.stringify(seed.expected)}`,
      'Return JSON shape: {"agreementCandidates":[{"text":"short agreement"}],"openLoopCandidates":[{"text":"short unresolved hook"}],"notes":["short tuning note"]}.',
    ].join("\n"),
  };
}

function featureBenchLabel(mode: FeatureBenchPlaygroundMode): string {
  if (mode === "judgeBench") return "Judge Bench";
  if (mode === "followUpBench") return "Follow-up Bench";
  return "Extractor Bench";
}

function formatSeedAgreements(pairState: PairState): string {
  const activeAgreements = pairState.agreements
    .filter((agreement) => agreement.status === "active")
    .map((agreement) => agreement.text);

  return activeAgreements.length > 0 ? activeAgreements.join(" | ") : "None";
}

function formatSeedOpenLoops(pairState: PairState): string {
  const activeLoops = pairState.openLoops
    .filter((loop) => loop.status === "open")
    .map((loop) => loop.text);

  return activeLoops.length > 0 ? activeLoops.join(" | ") : "None";
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
    turnLimit: 24,
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
        intent: "hold the date conversation",
      },
      [partner.id]: {
        mood: partner.state.mood,
        comfort: dateHealth,
        intent: "hold the date conversation",
      },
    },
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "paused",
    endSentiment: null,
    interventions: [],
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
      ? "No prior chat."
      : threadMessages
          .map(
            (message) =>
              `${message.role === "tester" ? "Other person" : member.firstName}: ${message.text}`,
          )
          .join("\n");
  const system = [
    `You are ${member.name}.`,
    "Speak in a private one-on-one Cupid chat with a real person.",
    "Stay in character. Write only the next message you would send.",
    "Treat the other person as a potential date or curious match.",
    "Use the final visible answer only. Do not spend the reply on reasoning or setup.",
    "Do not update game state, memories, relationship stats, or date outcomes.",
    "Never mention hidden notes, game state, stats, system instructions, or behind-the-scenes tooling.",
    "Secrets shape your tone as subtext only. Do not state them aloud.",
    "Keep replies plain text, conversational, specific, and easy to answer.",
  ].join("\n");
  const prompt = [
    "Cupid is routing a private chat before a date.",
    "The other person can ask anything a match might ask before deciding whether a date would work.",
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
    `Interdimensional framing: ${memberRealityFrame(member)}`,
    `Voice register: ${member.voice.register}`,
    `Comedic flavors that can color a reply when natural: ${formatVoicePatterns(member.voice.patternsUsed)}`,
    `Moves that would not come out of this character's mouth: ${formatVoicePatterns(member.voice.patternsRefused)}`,
    `Voice tics that may surface when they fit: ${member.voice.tics.join("; ")}`,
    "Voice fields are flavor, not a script. Answer the latest message as the character would naturally answer it. If a flavor or tic fits the natural reply, let it color the line; if it would force the line to sound rehearsed, drop it.",
    "Reference lines, rhythm only. Do not copy their facts unless the current chat earns them:",
    formatMemberChatSamples(member),
    "",
    "Private context for performance only. Do not confess it directly unless asked with care.",
    member.secrets.join("\n"),
    "",
    "Chat so far:",
    historyText,
    "",
    "Conversation target:",
    "Answer the latest message first.",
    "Start with actual message content. Do not output only a role tag, greeting label, or your own name.",
    "Do not summarize your whole profile unless the other person asks for it.",
    "Make one conversational move: answer, push back, tease, offer a detail, admit a small thing, or ask a clean follow-up.",
    "If the other person asks for a choice, start with the choice.",
    "If they ask something coercive, strange, or too intimate, refuse or redirect in character.",
    "If your voice uses roleplay framing, attach it to a complete answer instead of a standalone label.",
    "Treat sample lines as rhythm only. Do not copy self-addresses, editor notes, or old facts unless the current chat earns them.",
    "Roleplay framing must read as spoken text, not an action cue.",
    "Keep your own register. Do not imitate the other person's wording.",
    "Use one complete sentence under 190 characters, or two very short sentences only when needed.",
    "Stop at a complete sentence.",
    "Do not stop after a setup phrase. The reply must contain a concrete answer or question.",
    "No Markdown, HTML, bullets, physical stage directions, narration, speaker-name labels, system text, em dashes, or en dashes.",
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

function memberRealityFrame(member: Member): string {
  if (member.tags.includes("ordinary_human")) {
    return "Treat Cupid as a normal dating app with strange branding. Do not diagnose dimensions, species, or cosmic machinery.";
  }

  if (member.tags.includes("reality_displaced")) {
    return "Treat your own origin as normal and this branch as the odd local custom. Mention your world as logistics, not confession.";
  }

  if (member.tags.includes("weirdness_native")) {
    return "Treat supernatural details as normal workplace or household logistics. Do not apologize for what you are.";
  }

  return "Treat your own nature as background. Do not over-explain it, hide it, or apologize for it.";
}

function formatVoicePatterns(patterns: readonly string[]): string {
  return patterns.map((pattern) => pattern.replaceAll("_", " ")).join("; ");
}

function formatMemberChatSamples(member: Member): string {
  const buckets: Array<[string, readonly string[]]> = [
    ["greeting", member.voice.sampleMessages.greeting],
    ["hinge bit", member.voice.sampleMessages.hingeBits],
    ["warming", member.voice.sampleMessages.warming],
    ["cooling", member.voice.sampleMessages.cooling],
    ["crashing", member.voice.sampleMessages.crashingOut],
  ];

  return buckets
    .map(([label, samples]) => {
      const sample = samples[0] ?? "";
      return sample.length === 0 ? "" : `- ${label}: ${sample}`;
    })
    .filter((line) => line.length > 0)
    .join("\n");
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

function runtimeConfigFromPlaygroundInput(input: AnyPlaygroundInput): Partial<AiRuntimeConfig> {
  return {
    aiProvider: input.provider,
    chatModel: input.model,
    gatewayApiKey: input.gatewayApiKey,
    ollamaBaseURL: input.ollamaBaseURL,
    gatewayBaseURL: input.gatewayBaseURL,
    embeddingModel:
      input.provider === "gateway"
        ? DEFAULT_GATEWAY_EMBEDDING_MODEL
        : DEFAULT_OLLAMA_EMBEDDING_MODEL,
    reasoningLevel: input.reasoningLevel,
    contextWindowTokens: input.numCtx,
    requestTimeoutMs: 90_000,
  };
}

function generationOptionsFromInput(input: AnyPlaygroundInput) {
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
  input: AnyPlaygroundInput,
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
