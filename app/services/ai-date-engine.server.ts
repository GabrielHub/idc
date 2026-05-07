import {
  dateMessageSchema,
  dateSessionSchema,
  gameSaveSchema,
  memoryCandidateSchema,
  memoryRecordSchema,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type MemoryCandidate,
  type MemoryRecord,
  type PairState,
} from "../domain/game";
import type { GameRepository } from "../repositories/game-repository";
import {
  type AiRuntimeConfig,
  type GeneratedTextResult,
  embedMemoryText,
  generateCharacterTurn,
  judgeDateExchange,
  streamCharacterTurn as streamCharacterTurnWithLocalAi,
  summarizeDateMemories,
} from "./ai/model-service.server";
import { retrieveRelevantMemories } from "./cupid-memory";
import {
  applyJudgeToMembers,
  applyJudgeToPairState,
  applyDateFinalReportToMembers,
  createNonCharacterMessage,
  finalizeDateSession,
  findMemberRequestById,
  markPairDateComplete,
  requireDateSession,
  requireMember,
  requirePairState,
  requireScenario,
  type DateEngineResult,
} from "./date-engine";
import {
  buildCharacterPromptPacket,
  buildJudgePromptPacket,
  buildSummarizerPromptPacket,
  type CharacterPromptPacket,
  type JudgePromptPacket,
  type SummarizerPromptPacket,
} from "./date-prompts";
import { applyMatchFitToJudgeSnapshot, evaluateMatchFit, pairRuleHits } from "./match-fit";
import { clampScore, errorToMessage, replaceById } from "./utils";

export type LocalAiDateRuntime = {
  generateCharacterTurn(input: {
    packet: CharacterPromptPacket;
    config: Partial<AiRuntimeConfig>;
  }): Promise<GeneratedTextResult>;
  streamCharacterTurn?(input: {
    packet: CharacterPromptPacket;
    config: Partial<AiRuntimeConfig>;
    onTextDelta: (delta: string) => Promise<void> | void;
    onReasoningDelta?: (delta: string) => Promise<void> | void;
  }): Promise<GeneratedTextResult>;
  judgeDateExchange(input: {
    packet: JudgePromptPacket;
    dateSessionId: string;
    exchangeIndex: number;
    config: Partial<AiRuntimeConfig>;
  }): Promise<JudgeSnapshot>;
  summarizeDateMemories(input: {
    packet: SummarizerPromptPacket;
    config: Partial<AiRuntimeConfig>;
  }): Promise<MemoryCandidate[]>;
  embedMemoryText(input: {
    text: string;
    config: Partial<AiRuntimeConfig>;
  }): Promise<{ embedding: number[]; model: string; dimensions: number }>;
};

export type LocalAiDateStreamEvent =
  | {
      type: "characterStart";
      speakerId: string;
      speakerName: string;
      sequenceIndex: number;
      turnIndex: number;
    }
  | {
      type: "characterDelta";
      speakerId: string;
      sequenceIndex: number;
      turnIndex: number;
      textDelta: string;
    }
  | {
      type: "characterReasoningDelta";
      speakerId: string;
      sequenceIndex: number;
      turnIndex: number;
      textDelta: string;
    }
  | {
      type: "characterDone";
      speakerId: string;
      sequenceIndex: number;
      turnIndex: number;
      text: string;
    }
  | {
      type: "judgeStart";
      exchangeIndex: number;
    };

export type CharacterAiTelemetry = {
  characterGenerationCount: number;
  characterToolCallCount: number;
  characterToolResultCount: number;
  characterPromptCharacters: number;
  characterEstimatedPromptTokens: number;
  characterInputTokens: number;
  characterOutputTokens: number;
  characterTotalTokens: number;
  providerWarningCount: number;
};

export type LocalAiDateEngineResult = DateEngineResult & {
  runtimeMode: "local_ai";
  warningMessages: string[];
  aiTelemetry: CharacterAiTelemetry;
};

function createEmptyCharacterTelemetry(): CharacterAiTelemetry {
  return {
    characterGenerationCount: 0,
    characterToolCallCount: 0,
    characterToolResultCount: 0,
    characterPromptCharacters: 0,
    characterEstimatedPromptTokens: 0,
    characterInputTokens: 0,
    characterOutputTokens: 0,
    characterTotalTokens: 0,
    providerWarningCount: 0,
  };
}

function mergeCharacterTelemetry(into: CharacterAiTelemetry, from: CharacterAiTelemetry): void {
  for (const key of Object.keys(into) as Array<keyof CharacterAiTelemetry>) {
    into[key] += from[key];
  }
}

type LocalAiDateEngineInput = {
  dateSessionId: string;
  now?: Date;
  config?: Partial<AiRuntimeConfig>;
  runtime?: LocalAiDateRuntime;
};

const DEFAULT_MEMORY_LIMIT = 2;
const CHARACTER_MESSAGE_MAX_LENGTH = 260;

const defaultLocalAiDateRuntime: LocalAiDateRuntime = {
  generateCharacterTurn: ({ packet, config }) => generateCharacterTurn(packet, config),
  streamCharacterTurn: ({ packet, config, onTextDelta, onReasoningDelta }) =>
    streamCharacterTurnWithLocalAi(packet, config, onTextDelta, onReasoningDelta),
  judgeDateExchange: ({ packet, dateSessionId, exchangeIndex, config }) =>
    judgeDateExchange({ packet, dateSessionId, exchangeIndex, config }),
  summarizeDateMemories: ({ packet, config }) => summarizeDateMemories(packet, config),
  embedMemoryText: ({ text, config }) => embedMemoryText(text, config),
};

export async function advanceDateExchangeWithLocalAi(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
): Promise<LocalAiDateEngineResult> {
  await persistAcceptedInputSave(save, repository);
  return advanceDateExchangeWithLocalAiInternal(save, repository, input);
}

export async function advanceDateExchangeWithLocalAiStream(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
  emit: (event: LocalAiDateStreamEvent) => Promise<void> | void,
): Promise<LocalAiDateEngineResult> {
  await persistAcceptedInputSave(save, repository);
  return advanceDateExchangeWithLocalAiInternal(save, repository, input, emit);
}

async function advanceDateExchangeWithLocalAiInternal(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
  emit?: (event: LocalAiDateStreamEvent) => Promise<void> | void,
): Promise<LocalAiDateEngineResult> {
  const runtime = input.runtime ?? defaultLocalAiDateRuntime;
  const config = input.config ?? save.config;
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const warningMessages: string[] = [];
  const telemetry = createEmptyCharacterTelemetry();
  const session = dateSessionSchema.parse({
    ...requireDateSession(save, input.dateSessionId),
    runtimeMode: "local_ai",
  });

  if (session.status !== "active") {
    return {
      save,
      session,
      runtimeMode: "local_ai",
      warningMessages,
      aiTelemetry: telemetry,
    };
  }

  const scenario = requireScenario(session.scenarioId);
  const pairState = requirePairState(save, session.pairId);
  const members = session.participants.map((memberId) => requireMember(save, memberId));
  const focusRequest = findMemberRequestById(session.focusRequestId);
  const matchFit = evaluateMatchFit({
    members,
    scenario,
    pairState,
    activeRequests: focusRequest === undefined ? [] : [focusRequest],
  });
  const frictionRuleHits = pairRuleHits(matchFit);
  const transcript = [...session.transcript];
  let currentTurn = session.currentTurn;
  let workingSession = session;

  for (let index = 0; index < 2 && currentTurn < session.turnLimit; index += 1) {
    const nextTurn = currentTurn + 1;
    const beat = scenario.director.beats.find((candidate) => candidate.atTurn === nextTurn);

    if (beat !== undefined) {
      transcript.push(
        createNonCharacterMessage(
          { ...workingSession, transcript, currentTurn },
          "scenario",
          beat.characterVisibleText,
          timestamp,
        ),
      );
    }

    const speaker = members[currentTurn % members.length];
    const partner = members[(currentTurn + 1) % members.length];
    const characterSession = { ...workingSession, transcript, currentTurn };
    const characterResult = await createLocalAiCharacterMessage({
      repository,
      runtime,
      config,
      session: characterSession,
      speaker,
      partner,
      scenario,
      pairState,
      focusRequest,
      frictionRuleHits,
      createdAt: timestamp,
      emit,
    });

    telemetry.characterGenerationCount += 1;
    telemetry.characterToolCallCount += characterResult.toolCallCount;
    telemetry.characterToolResultCount += characterResult.toolResultCount;
    telemetry.characterPromptCharacters += characterResult.promptCharacters;
    telemetry.characterEstimatedPromptTokens += characterResult.estimatedPromptTokens;
    telemetry.characterInputTokens += characterResult.inputTokens;
    telemetry.characterOutputTokens += characterResult.outputTokens;
    telemetry.characterTotalTokens += characterResult.totalTokens;
    telemetry.providerWarningCount += characterResult.warningMessages.length;
    warningMessages.push(...characterResult.warningMessages);

    transcript.push(characterResult.message);
    currentTurn += 1;
    workingSession = { ...workingSession, transcript, currentTurn };
  }

  const lastJudgedExchangeIndex = latestJudgedExchangeIndex(session);
  const exchangeMessages = transcript.filter(
    (message) =>
      message.kind === "character" &&
      exchangeIndexForTurn(message.turnIndex) > lastJudgedExchangeIndex,
  );
  const shouldJudgeExchange = shouldJudgePendingExchange({
    currentTurn,
    turnLimit: session.turnLimit,
    exchangeMessages,
  });

  if (!shouldJudgeExchange) {
    const updatedSession = dateSessionSchema.parse({
      ...session,
      currentTurn,
      transcript,
    });
    const nextSave = gameSaveSchema.parse({
      ...save,
      dateSessions: replaceById(save.dateSessions, updatedSession),
      updatedAt: timestamp,
    });

    await repository.saveGame(nextSave);

    return {
      save: nextSave,
      session: updatedSession,
      runtimeMode: "local_ai",
      warningMessages,
      aiTelemetry: telemetry,
    };
  }

  const exchangeIndex = exchangeIndexForTurn(currentTurn);
  if (emit !== undefined) {
    await emit({ type: "judgeStart", exchangeIndex });
  }
  const localAiJudgeSnapshot = await createLocalAiJudgeSnapshot({
    runtime,
    config,
    session,
    pairState,
    scenario,
    exchangeMessages,
    exchangeIndex,
    members,
  });
  const judgeSnapshot = applyMatchFitToJudgeSnapshot({
    session,
    pairState,
    members,
    judgeSnapshot: localAiJudgeSnapshot,
    fit: matchFit,
  });
  const updatedPairState = applyJudgeToPairState(pairState, judgeSnapshot);
  const updatedMembers = applyJudgeToMembers(save.members, judgeSnapshot);
  const nextDateHealth = clampScore(session.dateHealth + judgeSnapshot.dateHealthDelta);
  const baseUpdatedSession = dateSessionSchema.parse({
    ...session,
    currentTurn,
    dateHealth: nextDateHealth,
    status: nextDateHealth <= 0 || judgeSnapshot.shouldEndEarly ? "ended_early" : session.status,
    transcript,
    judgeSnapshots: [...session.judgeSnapshots, judgeSnapshot],
  });
  const shouldFinish =
    baseUpdatedSession.status === "ended_early" || currentTurn >= session.turnLimit;
  const completion =
    shouldFinish === true
      ? await createLocalAiFinalSession({
          runtime,
          config,
          session: {
            ...baseUpdatedSession,
            status: baseUpdatedSession.status === "ended_early" ? "ended_early" : "completed",
          },
          pairState: updatedPairState,
          members,
          scenario,
          completedAt: timestamp,
        })
      : {
          session: baseUpdatedSession,
          memories: [] satisfies MemoryRecord[],
        };
  const completedSession = completion.session;
  const finalPairState =
    completedSession.finalReport === undefined
      ? updatedPairState
      : markPairDateComplete(updatedPairState, completedSession);
  const finalMembers =
    completedSession.finalReport === undefined
      ? updatedMembers
      : applyDateFinalReportToMembers(updatedMembers, completedSession);
  const nextSave = gameSaveSchema.parse({
    ...save,
    members: finalMembers,
    pairStates: replaceById(save.pairStates, finalPairState),
    dateSessions: replaceById(save.dateSessions, completedSession),
    memories: [...save.memories, ...completion.memories],
    updatedAt: timestamp,
  });

  await repository.saveGame(nextSave);

  return {
    save: nextSave,
    session: completedSession,
    runtimeMode: "local_ai",
    warningMessages,
    aiTelemetry: telemetry,
  };
}

export async function completeDateSessionWithLocalAi(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
): Promise<LocalAiDateEngineResult> {
  await persistAcceptedInputSave(save, repository);
  return completeDateSessionWithLocalAiInternal(save, repository, input);
}

export async function completeDateSessionWithLocalAiStream(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
  emit: (event: LocalAiDateStreamEvent) => Promise<void> | void,
): Promise<LocalAiDateEngineResult> {
  await persistAcceptedInputSave(save, repository);
  return completeDateSessionWithLocalAiInternal(save, repository, input, emit);
}

async function completeDateSessionWithLocalAiInternal(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
  emit?: (event: LocalAiDateStreamEvent) => Promise<void> | void,
): Promise<LocalAiDateEngineResult> {
  let nextSave = save;
  let nextSession = requireDateSession(save, input.dateSessionId);
  const warningMessages: string[] = [];
  const telemetry = createEmptyCharacterTelemetry();

  while (nextSession.status === "active") {
    const result = await advanceDateExchangeWithLocalAiInternal(nextSave, repository, input, emit);
    nextSave = result.save;
    nextSession = result.session;
    warningMessages.push(...result.warningMessages);
    mergeCharacterTelemetry(telemetry, result.aiTelemetry);
  }

  return {
    save: nextSave,
    session: nextSession,
    runtimeMode: "local_ai",
    warningMessages,
    aiTelemetry: telemetry,
  };
}

async function persistAcceptedInputSave(save: GameSave, repository: GameRepository): Promise<void> {
  // The accepted caller state is recoverable even if the AI provider fails before the next commit.
  await repository.saveGame(save);
}

async function createLocalAiCharacterMessage({
  repository,
  runtime,
  config,
  session,
  speaker,
  partner,
  scenario,
  pairState,
  focusRequest,
  frictionRuleHits,
  createdAt,
  emit,
}: {
  repository: GameRepository;
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  focusRequest: MemberRequest | undefined;
  frictionRuleHits: readonly string[];
  createdAt: string;
  emit?: (event: LocalAiDateStreamEvent) => Promise<void> | void;
}): Promise<{
  message: DateMessage;
  toolCallCount: number;
  toolResultCount: number;
  promptCharacters: number;
  estimatedPromptTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  warningMessages: string[];
}> {
  try {
    const packet = await buildCharacterPacketForTurn({
      repository,
      runtime,
      config,
      session,
      speaker,
      partner,
      scenario,
      pairState,
      focusRequest,
      frictionRuleHits,
    });
    const sequenceIndex = session.transcript.length;
    const turnIndex = session.currentTurn + 1;

    const generation =
      emit === undefined
        ? await runtime.generateCharacterTurn({ packet, config })
        : await streamCharacterMessage({
            runtime,
            packet,
            config,
            speaker,
            sequenceIndex,
            turnIndex,
            emit,
          });
    const text = sanitizeCharacterText(generation.text, speaker.name);
    const message = dateMessageSchema.parse({
      id: `${session.id}-msg-${sequenceIndex}`,
      dateSessionId: session.id,
      kind: "character",
      speakerId: speaker.id,
      turnIndex,
      sequenceIndex,
      text,
      createdAt,
    });

    if (emit !== undefined) {
      await emit({
        type: "characterDone",
        speakerId: speaker.id,
        sequenceIndex,
        turnIndex,
        text,
      });
    }

    return {
      message,
      toolCallCount: generation.toolCallCount,
      toolResultCount: generation.toolResultCount,
      promptCharacters: generation.promptCharacters ?? 0,
      estimatedPromptTokens: generation.estimatedPromptTokens ?? 0,
      inputTokens: generation.usage?.inputTokens ?? 0,
      outputTokens: generation.usage?.outputTokens ?? 0,
      totalTokens: generation.usage?.totalTokens ?? 0,
      warningMessages: generation.warningMessages ?? [],
    };
  } catch (error) {
    throw new Error(`AI performer failed for ${speaker.name}: ${errorToMessage(error)}`);
  }
}

async function buildCharacterPacketForTurn({
  repository,
  runtime,
  config,
  session,
  speaker,
  partner,
  scenario,
  pairState,
  focusRequest,
  frictionRuleHits,
}: {
  repository: GameRepository;
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  focusRequest: MemberRequest | undefined;
  frictionRuleHits: readonly string[];
}): Promise<CharacterPromptPacket> {
  const memoryQuery = buildMemoryQuery(session, speaker, partner, scenario);
  const queryEmbedding = await createRuntimeQueryEmbedding({
    runtime,
    config,
    query: memoryQuery,
  });
  const memoryPack = await retrieveRelevantMemories(repository, {
    characterId: speaker.id,
    partnerId: partner.id,
    pairId: session.pairId,
    scenarioId: session.scenarioId,
    dateSessionId: session.id,
    session,
    query: memoryQuery,
    queryEmbedding: queryEmbedding.embedding,
    queryEmbeddingModel: queryEmbedding.model,
    queryEmbeddingDimensions: queryEmbedding.dimensions,
    limit: DEFAULT_MEMORY_LIMIT,
  });

  return buildCharacterPromptPacket({
    member: speaker,
    partner,
    scenario,
    session,
    pairState,
    memoryPack,
    focusRequest,
    frictionRuleHits,
  });
}

async function streamCharacterMessage({
  runtime,
  packet,
  config,
  speaker,
  sequenceIndex,
  turnIndex,
  emit,
}: {
  runtime: LocalAiDateRuntime;
  packet: CharacterPromptPacket;
  config: Partial<AiRuntimeConfig>;
  speaker: Member;
  sequenceIndex: number;
  turnIndex: number;
  emit: (event: LocalAiDateStreamEvent) => Promise<void> | void;
}): Promise<GeneratedTextResult> {
  if (runtime.streamCharacterTurn === undefined) {
    throw new Error("Runtime does not support streaming character turns.");
  }

  await emit({
    type: "characterStart",
    speakerId: speaker.id,
    speakerName: speaker.name,
    sequenceIndex,
    turnIndex,
  });

  return runtime.streamCharacterTurn({
    packet,
    config,
    onTextDelta: async (delta) => {
      const textDelta = stripForbiddenPunctuation(delta);

      if (textDelta.length === 0) {
        return;
      }

      await emit({
        type: "characterDelta",
        speakerId: speaker.id,
        sequenceIndex,
        turnIndex,
        textDelta,
      });
    },
    onReasoningDelta: async (delta) => {
      const textDelta = stripForbiddenPunctuation(delta);

      if (textDelta.length === 0) {
        return;
      }

      await emit({
        type: "characterReasoningDelta",
        speakerId: speaker.id,
        sequenceIndex,
        turnIndex,
        textDelta,
      });
    },
  });
}

async function createLocalAiJudgeSnapshot({
  runtime,
  config,
  session,
  pairState,
  scenario,
  exchangeMessages,
  exchangeIndex,
  members,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  pairState: PairState;
  scenario: DateScenario;
  exchangeMessages: DateMessage[];
  exchangeIndex: number;
  members: Member[];
}): Promise<JudgeSnapshot> {
  try {
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages,
      members,
    });

    const judgeSnapshot = await runtime.judgeDateExchange({
      packet,
      dateSessionId: session.id,
      exchangeIndex,
      config,
    });

    return sanitizeJudgeSnapshot(judgeSnapshot, session);
  } catch (error) {
    throw new Error(`AI judge failed: ${errorToMessage(error)}`);
  }
}

async function createLocalAiFinalSession({
  runtime,
  config,
  session,
  pairState,
  members,
  scenario,
  completedAt,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  pairState: PairState;
  members: Member[];
  scenario: DateScenario;
  completedAt: string;
}): Promise<{ session: DateSession; memories: MemoryRecord[] }> {
  const memories = await createLocalAiMemoryRecords({
    runtime,
    config,
    session,
    members,
    createdAt: completedAt,
  });
  const completedSession = finalizeDateSession({
    session,
    pairState,
    members,
    scenario,
    completedAt,
    memoryRecordIds: memories.map((memory) => memory.id),
  });

  return { session: completedSession, memories };
}

async function createLocalAiMemoryRecords({
  runtime,
  config,
  session,
  members,
  createdAt,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  members: Member[];
  createdAt: string;
}): Promise<MemoryRecord[]> {
  try {
    const packet = buildSummarizerPromptPacket({
      session,
      members,
      finalJudgeSnapshot: session.judgeSnapshots.at(-1),
    });
    const candidates = await runtime.summarizeDateMemories({
      packet,
      config,
    });
    const normalizedCandidates = candidates
      .map((candidate) => normalizeMemoryCandidate(candidate, session))
      .slice(0, 6);

    if (normalizedCandidates.length === 0) {
      throw new Error("Summarizer returned no memory candidates.");
    }

    return await Promise.all(
      normalizedCandidates.map(async (candidate, index) => {
        const embedding = await runtime.embedMemoryText({
          text: candidate.text,
          config,
        });

        return memoryRecordSchema.parse({
          ...candidate,
          id: `memory-${session.id}-ai-${index + 1}`,
          createdAt,
          embedding: embedding.embedding,
          embeddingModel: embedding.model,
          embeddingDimensions: embedding.dimensions,
        });
      }),
    );
  } catch (error) {
    throw new Error(`AI memory filing failed: ${errorToMessage(error)}`);
  }
}

function normalizeMemoryCandidate(
  candidate: MemoryCandidate,
  session: DateSession,
): MemoryCandidate {
  const parsedCandidate = memoryCandidateSchema.parse(candidate);
  const participantIds = new Set(session.participants);
  const subjectIds = parsedCandidate.subjectIds.filter((memberId) => participantIds.has(memberId));
  const fallbackSubjectIds = subjectIds.length === 0 ? [...session.participants] : subjectIds;
  const visibleToMemberIds =
    parsedCandidate.visibility === "member_private"
      ? normalizeVisibleMemberIds(parsedCandidate.visibleToMemberIds, fallbackSubjectIds, [
          ...session.participants,
        ])
      : undefined;

  return memoryCandidateSchema.parse({
    ...parsedCandidate,
    subjectIds: fallbackSubjectIds,
    visibleToMemberIds,
    pairId: session.pairId,
    scenarioId: session.scenarioId,
    dateSessionId: session.id,
    text: normalizeForbiddenPunctuation(parsedCandidate.text),
    tags: Array.from(new Set([...parsedCandidate.tags, "ai_summary"])).slice(0, 8),
    importance: Math.min(5, Math.max(1, parsedCandidate.importance)),
  });
}

function normalizeVisibleMemberIds(
  visibleToMemberIds: string[] | undefined,
  fallbackSubjectIds: string[],
  allowedMemberIds: string[],
): string[] {
  if (visibleToMemberIds === undefined || visibleToMemberIds.length === 0) {
    return fallbackSubjectIds;
  }

  const allowedSet = new Set(allowedMemberIds);
  const filteredIds = visibleToMemberIds.filter((memberId) => allowedSet.has(memberId));

  return filteredIds.length === 0 ? fallbackSubjectIds : filteredIds;
}

function sanitizeJudgeSnapshot(judgeSnapshot: JudgeSnapshot, session: DateSession): JudgeSnapshot {
  const participantIds = new Set(session.participants);
  const memberMoodDeltas = Object.fromEntries(
    Object.entries(judgeSnapshot.memberMoodDeltas).filter(([memberId]) =>
      participantIds.has(memberId),
    ),
  );

  return {
    ...judgeSnapshot,
    memberMoodDeltas,
    earlyEndReason:
      judgeSnapshot.earlyEndReason === undefined
        ? undefined
        : normalizeForbiddenPunctuation(judgeSnapshot.earlyEndReason),
    notableMoments: judgeSnapshot.notableMoments.map((moment) =>
      normalizeForbiddenPunctuation(moment),
    ),
    playerSummary: normalizeForbiddenPunctuation(judgeSnapshot.playerSummary),
  };
}

function buildMemoryQuery(
  session: DateSession,
  speaker: Member,
  partner: Member,
  scenario: DateScenario,
): string {
  const recentText = session.transcript
    .slice(-4)
    .map((message) => message.text)
    .join(" ");

  return `${speaker.name} ${partner.name} ${scenario.title} ${recentText}`;
}

function shouldJudgePendingExchange({
  currentTurn,
  turnLimit,
  exchangeMessages,
}: {
  currentTurn: number;
  turnLimit: number;
  exchangeMessages: DateMessage[];
}): boolean {
  if (exchangeMessages.length === 0) {
    return false;
  }

  return exchangeMessages.length >= 2 || currentTurn >= turnLimit;
}

function latestJudgedExchangeIndex(session: DateSession): number {
  return session.judgeSnapshots.reduce(
    (latest, snapshot) => Math.max(latest, snapshot.exchangeIndex),
    -1,
  );
}

function exchangeIndexForTurn(turnIndex: number): number {
  return Math.max(0, Math.floor((turnIndex - 1) / 2));
}

async function createRuntimeQueryEmbedding({
  runtime,
  config,
  query,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  query: string;
}): Promise<{ embedding: number[]; model: string; dimensions: number }> {
  try {
    return await runtime.embedMemoryText({
      text: query,
      config,
    });
  } catch (error) {
    throw new Error(`AI memory search failed: ${errorToMessage(error)}`);
  }
}

const speakerLabelPatternCache = new Map<string, RegExp>();

function speakerLabelPattern(speakerName: string): RegExp {
  let cached = speakerLabelPatternCache.get(speakerName);
  if (cached === undefined) {
    cached = new RegExp(`^${escapeRegex(speakerName)}\\s*:\\s*`, "i");
    speakerLabelPatternCache.set(speakerName, cached);
  }
  return cached;
}

export function sanitizeCharacterText(text: string, speakerName: string): string {
  const trimmedText = normalizeForbiddenPunctuation(text)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(speakerLabelPattern(speakerName), "")
    .trim();

  if (trimmedText.length === 0) {
    throw new Error("Performer returned an empty message.");
  }

  if (trimmedText.length <= CHARACTER_MESSAGE_MAX_LENGTH) {
    return trimmedText;
  }

  return `${trimmedText.slice(0, CHARACTER_MESSAGE_MAX_LENGTH - 3)}...`;
}

const FORBIDDEN_DASH_PATTERN = /[\u2014\u2013]/;

function stripForbiddenPunctuation(text: string): string {
  if (!FORBIDDEN_DASH_PATTERN.test(text)) {
    return text;
  }

  return text
    .replace(/[\u2014\u2013]/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .replace(/\s{2,}/g, " ");
}

function normalizeForbiddenPunctuation(text: string): string {
  return stripForbiddenPunctuation(text).trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
