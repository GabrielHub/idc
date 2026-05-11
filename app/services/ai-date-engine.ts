import {
  dateMessageSchema,
  dateSessionSchema,
  gameSaveSchema,
  judgeSnapshotSchema,
  memoryCandidateSchema,
  memoryRecordSchema,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type FollowUpAction,
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
  type CharacterToolHandlers,
  type GeneratedTextResult,
  DateStreamAbortedError,
  embedMemoryText,
  generateCharacterTurn,
  judgeDateExchange,
  streamCharacterTurn as streamCharacterTurnWithLocalAi,
  summarizeDateMemories,
} from "./ai/model-service";

export { DateStreamAbortedError } from "./ai/model-service";
import { retrieveRelevantMemories, searchCupidMemory } from "./cupid-memory";
import {
  applyJudgeToMembers,
  applyJudgeToPairState,
  applyDateFinalReportToMembers,
  exchangeIndexForTurn,
  finalizeDateSession,
  findMemberRequestById,
  isAtJudgeBoundary,
  latestJudgedExchangeIndex,
  markPairDateComplete,
  messagesSinceLastJudge,
  requireDateSession,
  requireMember,
  requirePairState,
  requireScenario,
  resolveEndedDateSentiment,
  shouldJudgePendingExchange,
  type DateEngineResult,
} from "./date-engine";
import { getActiveShift } from "./game-seed";
import {
  buildCharacterPromptPacket,
  buildJudgePromptPacket,
  buildSummarizerPromptPacket,
  cleanMemberFacingText,
  type CharacterPromptPacket,
  type JudgePromptPacket,
  type SummarizerPromptPacket,
} from "./date-prompts";
import {
  applyMatchFitToJudgeSnapshot,
  evaluateMatchFit,
  pairRuleHits,
  type MatchFitResult,
} from "./match-fit";
import {
  applyJudgeReveals,
  buildRevealCandidates,
  filterExchangeEligibleRevealCandidates,
  validateUsedEvidenceIds,
  type RevealCandidate,
} from "./player-knowledge";
import { clampScore, errorToMessage, replaceById } from "./utils";
import { createDeterministicEmbedding } from "./vector-memory";

export type LocalAiDateRuntime = {
  generateCharacterTurn(input: {
    packet: CharacterPromptPacket;
    config: Partial<AiRuntimeConfig>;
    tools?: CharacterToolHandlers;
  }): Promise<GeneratedTextResult>;
  streamCharacterTurn?(input: {
    packet: CharacterPromptPacket;
    config: Partial<AiRuntimeConfig>;
    tools?: CharacterToolHandlers;
    abortSignal?: AbortSignal;
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
  turnCount?: 1 | 2;
  now?: Date;
  config?: Partial<AiRuntimeConfig>;
  runtime?: LocalAiDateRuntime;
  abortSignal?: AbortSignal;
  shouldStopAfterCurrentTurn?: () => boolean;
};

const DEFAULT_MEMORY_LIMIT = 2;
const CHARACTER_MESSAGE_MAX_LENGTH = 260;

const defaultLocalAiDateRuntime: LocalAiDateRuntime = {
  generateCharacterTurn: ({ packet, config, tools }) =>
    generateCharacterTurn({ packet, config, tools }),
  streamCharacterTurn: ({ packet, config, tools, abortSignal, onTextDelta, onReasoningDelta }) =>
    streamCharacterTurnWithLocalAi({
      packet,
      config,
      onTextDelta,
      onReasoningDelta,
      abortSignal,
      tools,
    }),
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

  if (
    session.status !== "active" ||
    session.playbackState === "drafting" ||
    session.playbackState === "ended"
  ) {
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
  const turnCount = input.turnCount ?? 2;

  for (let index = 0; index < turnCount && currentTurn < session.turnLimit; index += 1) {
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
      abortSignal: input.abortSignal,
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

    if (input.shouldStopAfterCurrentTurn?.() === true || isAtJudgeBoundary(currentTurn)) {
      break;
    }
  }

  const lastJudgedExchangeIndex = latestJudgedExchangeIndex(session);
  const exchangeMessages = transcript.filter(
    (message) =>
      message.kind === "character" &&
      exchangeIndexForTurn(message.turnIndex) > lastJudgedExchangeIndex,
  );
  const pendingRevealMessages = messagesSinceLastJudge(session, transcript);
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
  const revealCandidates = buildRevealCandidates({
    members,
    scenario,
    pairState,
    focusRequest,
    matchFit,
  });
  const eligibleCandidates = filterExchangeEligibleRevealCandidates({
    candidates: revealCandidates,
    matchFit,
    exchangeMessages: pendingRevealMessages,
    triggeredEventIds: session.eventsTriggered,
    focusRequest,
  });
  const localAiJudgeSnapshot = await createLocalAiJudgeSnapshot({
    runtime,
    config,
    session,
    pairState,
    scenario,
    exchangeMessages,
    exchangeIndex,
    members,
    revealCandidates: eligibleCandidates,
  });
  const acceptedEvidenceIds = computeAcceptedEvidenceIds({
    proposed: localAiJudgeSnapshot.usedEvidenceIds,
    candidates: eligibleCandidates,
    matchFit,
  });
  const judgeSnapshotWithReveals = judgeSnapshotSchema.parse({
    ...localAiJudgeSnapshot,
    usedEvidenceIds: acceptedEvidenceIds,
  });
  const judgeSnapshot = applyMatchFitToJudgeSnapshot({
    session,
    pairState,
    members,
    judgeSnapshot: judgeSnapshotWithReveals,
    fit: matchFit,
  });
  const updatedPairState = applyJudgeToPairState(pairState, judgeSnapshot);
  const updatedMembers = applyJudgeToMembers(save.members, judgeSnapshot);
  const nextDateHealth = clampScore(session.dateHealth + judgeSnapshot.dateHealthDelta);
  const isEndingEarly = nextDateHealth <= 0 || judgeSnapshot.shouldEndEarly;
  const isCompletingNaturally = !isEndingEarly && currentTurn >= session.turnLimit;
  const nextStatus = isEndingEarly
    ? "ended_early"
    : isCompletingNaturally
      ? "completed"
      : session.status;
  const nextEndSentiment = isEndingEarly
    ? resolveEndedDateSentiment(nextDateHealth, judgeSnapshot)
    : session.endSentiment;
  const nextPlaybackState = nextStatus === "active" ? session.playbackState : "ended";
  const baseUpdatedSession = dateSessionSchema.parse({
    ...session,
    currentTurn,
    dateHealth: nextDateHealth,
    status: nextStatus,
    endSentiment: nextEndSentiment,
    playbackState: nextPlaybackState,
    transcript,
    judgeSnapshots: [...session.judgeSnapshots, judgeSnapshot],
  });
  const shouldFinish = nextStatus !== "active";
  const completion =
    shouldFinish === true
      ? await createLocalAiFinalSession({
          runtime,
          config,
          session: baseUpdatedSession,
          pairState: updatedPairState,
          members,
          scenario,
          completedAt: timestamp,
        })
      : {
          session: baseUpdatedSession,
          memories: [] satisfies MemoryRecord[],
          warningMessages: [] satisfies string[],
        };
  warningMessages.push(...completion.warningMessages);
  const completedSession = completion.session;
  const revealResult = applyJudgeReveals({
    save,
    candidates: eligibleCandidates,
    acceptedIds: judgeSnapshot.usedEvidenceIds,
    judgeSnapshot,
    source: matchFit.hardStop !== null ? "hard_stop" : "judge",
    revealedAt: timestamp,
  });
  const finalPairState =
    completedSession.finalReport === undefined
      ? updatedPairState
      : markPairDateComplete(updatedPairState, completedSession);
  const finalMembers =
    completedSession.finalReport === undefined
      ? updatedMembers
      : applyDateFinalReportToMembers(
          updatedMembers,
          completedSession,
          getActiveShift(save).shiftNumber,
        );
  const nextSave = gameSaveSchema.parse({
    ...save,
    members: finalMembers,
    pairStates: replaceById(save.pairStates, finalPairState),
    dateSessions: replaceById(save.dateSessions, completedSession),
    memories: [...save.memories, ...completion.memories],
    playerKnowledge: revealResult.save.playerKnowledge,
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

  if (nextSession.playbackState === "drafting") {
    throw new Error("Pick scenario events before resolving the date.");
  }

  while (nextSession.status === "active") {
    const result = await advanceDateExchangeWithLocalAiInternal(nextSave, repository, input, emit);

    if (result.session.currentTurn === nextSession.currentTurn) {
      break;
    }

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
  abortSignal,
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
  abortSignal?: AbortSignal;
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
    const tools = createCharacterToolHandlers({
      repository,
      runtime,
      config,
      session,
      speaker,
    });
    const sequenceIndex = session.transcript.length;
    const turnIndex = session.currentTurn + 1;

    const generation =
      emit === undefined
        ? await runtime.generateCharacterTurn({ packet, config, tools })
        : await streamCharacterMessage({
            runtime,
            packet,
            config,
            tools,
            speaker,
            sequenceIndex,
            turnIndex,
            emit,
            abortSignal,
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
    if (error instanceof DateStreamAbortedError) {
      throw error;
    }

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

function createCharacterToolHandlers({
  repository,
  runtime,
  config,
  session,
  speaker,
}: {
  repository: GameRepository;
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  speaker: Member;
}): CharacterToolHandlers {
  return {
    searchCupidMemory: async ({ query, scope, limit }) => {
      const queryEmbedding = await createRuntimeQueryEmbedding({
        runtime,
        config,
        query,
      });
      const memories = await searchCupidMemory(repository, {
        characterId: speaker.id,
        pairId: session.pairId,
        scenarioId: session.scenarioId,
        query,
        queryEmbedding: queryEmbedding.embedding,
        queryEmbeddingModel: queryEmbedding.model,
        queryEmbeddingDimensions: queryEmbedding.dimensions,
        scope,
        limit,
      });

      return { memories };
    },
  };
}

async function streamCharacterMessage({
  runtime,
  packet,
  config,
  tools,
  speaker,
  sequenceIndex,
  turnIndex,
  emit,
  abortSignal,
}: {
  runtime: LocalAiDateRuntime;
  packet: CharacterPromptPacket;
  config: Partial<AiRuntimeConfig>;
  tools: CharacterToolHandlers;
  speaker: Member;
  sequenceIndex: number;
  turnIndex: number;
  emit: (event: LocalAiDateStreamEvent) => Promise<void> | void;
  abortSignal?: AbortSignal;
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
    tools,
    abortSignal,
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
  revealCandidates,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  pairState: PairState;
  scenario: DateScenario;
  exchangeMessages: DateMessage[];
  exchangeIndex: number;
  members: Member[];
  revealCandidates?: readonly RevealCandidate[];
}): Promise<JudgeSnapshot> {
  try {
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages,
      members,
      revealCandidates,
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

function computeAcceptedEvidenceIds({
  proposed,
  candidates,
  matchFit,
}: {
  proposed: readonly string[] | undefined;
  candidates: readonly RevealCandidate[];
  matchFit: MatchFitResult;
}): string[] {
  const validated = validateUsedEvidenceIds(proposed, candidates);

  if (matchFit.hardStop === null) {
    return validated;
  }

  const hardStopCandidate = candidates.find(
    (candidate) => candidate.source === "hard_stop" && candidate.readKind === "boundary",
  );
  const accepted = [...validated];

  if (hardStopCandidate !== undefined && !accepted.includes(hardStopCandidate.id)) {
    accepted.unshift(hardStopCandidate.id);
  }

  const scenarioPressure = candidates.find(
    (candidate) => candidate.readKind === "scenario_pressure",
  );

  if (scenarioPressure !== undefined && !accepted.includes(scenarioPressure.id)) {
    accepted.push(scenarioPressure.id);
  }

  return accepted.slice(0, 3);
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
}): Promise<{ session: DateSession; memories: MemoryRecord[]; warningMessages: string[] }> {
  try {
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

    return { session: completedSession, memories, warningMessages: [] };
  } catch {
    const fallbackMemoryId = `memory-${session.id}-ai-fallback`;
    const completedSession = finalizeDateSession({
      session,
      pairState,
      members,
      scenario,
      completedAt,
      memoryRecordIds: [fallbackMemoryId],
    });
    const fallbackMemory = createLocalAiFallbackMemoryRecord({
      id: fallbackMemoryId,
      session: completedSession,
      members,
      scenario,
      createdAt: completedAt,
    });

    return {
      session: completedSession,
      memories: [fallbackMemory],
      warningMessages: [
        "AI memory filing used a deterministic fallback case note. Structured memory output failed, but the date was filed.",
      ],
    };
  }
}

function createLocalAiFallbackMemoryRecord({
  id,
  session,
  members,
  scenario,
  createdAt,
}: {
  id: string;
  session: DateSession;
  members: Member[];
  scenario: DateScenario;
  createdAt: string;
}): MemoryRecord {
  const report = session.finalReport;
  const followUp =
    report === undefined ? "standard review" : formatFallbackFollowUp(report.recommendedFollowUp);
  const summary =
    report === undefined
      ? `${members[0].firstName} and ${members[1].firstName} completed ${scenario.title}.`
      : `${report.summary} ${report.statSummary}`;
  const text = `${summary} Recommended follow-up: ${followUp}. Cupid filed a basic case note after the memory clerk missed the structured form.`;
  const embedding = createDeterministicEmbedding(text);

  return memoryRecordSchema.parse({
    id,
    scope: "pair",
    visibility: "public",
    subjectIds: session.participants,
    pairId: session.pairId,
    scenarioId: scenario.id,
    dateSessionId: session.id,
    text,
    tags: ["date_summary", "fallback_summary"],
    importance: 3,
    createdAt,
    embedding,
    embeddingModel: "deterministic-local",
    embeddingDimensions: embedding.length,
  });
}

function formatFallbackFollowUp(action: FollowUpAction): string {
  if (action === "encourage") {
    return "Encourage";
  }

  if (action === "cool_down") {
    return "Cool down";
  }

  if (action === "mark_bad_fit") {
    return "Mark bad fit";
  }

  return "Repair";
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
  const participantIds = new Set(session.participants);
  const subjectIds = candidate.subjectIds.filter((memberId) => participantIds.has(memberId));
  const fallbackSubjectIds = subjectIds.length === 0 ? [...session.participants] : subjectIds;
  const visibleToMemberIds =
    candidate.visibility === "member_private"
      ? normalizeVisibleMemberIds(candidate.visibleToMemberIds, fallbackSubjectIds, [
          ...session.participants,
        ])
      : undefined;

  return memoryCandidateSchema.parse({
    ...candidate,
    subjectIds: fallbackSubjectIds,
    visibleToMemberIds,
    pairId: session.pairId,
    scenarioId: session.scenarioId,
    dateSessionId: session.id,
    text: normalizeMemoryText(candidate.text),
    tags: Array.from(new Set([...candidate.tags, "ai_summary"])).slice(0, 8),
    importance: Math.min(5, Math.max(1, candidate.importance)),
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
    endSentiment: judgeSnapshot.shouldEndEarly ? judgeSnapshot.endSentiment : null,
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

export class EmptyPerformerMessageError extends Error {
  constructor() {
    super("Performer returned an empty message.");
    this.name = "EmptyPerformerMessageError";
  }
}

export function sanitizeCharacterText(text: string, speakerName: string): string {
  const trimmedText = normalizeForbiddenPunctuation(text)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(speakerLabelPattern(speakerName), "")
    .trim();
  const memberFacingText = cleanMemberFacingText(trimmedText).trim();

  if (memberFacingText.length === 0) {
    throw new EmptyPerformerMessageError();
  }

  if (memberFacingText.length <= CHARACTER_MESSAGE_MAX_LENGTH) {
    return memberFacingText;
  }

  return `${memberFacingText.slice(0, CHARACTER_MESSAGE_MAX_LENGTH - 3)}...`;
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

function normalizeMemoryText(text: string): string {
  return normalizeForbiddenPunctuation(text)
    .replace(/\bFinal Date Health was \d+\.?/giu, "Cupid filed a nonnumeric comfort note.")
    .replace(/\bwith Date Health delta [-+]?\d+\.?/giu, "with a filed comfort movement.")
    .replace(/\bSpark \d+\.?\s*/giu, "")
    .replace(/\bStrain \d+\.?\s*/giu, "")
    .replace(/\bHealth \d+\.?\s*/giu, "")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
