import {
  DEFAULT_GATEWAY_BASE_URL,
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
  type PlayerKnowledgeRecord,
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
import { gatewayImageInputSupported, ollamaImageInputSupported } from "./ai/model-catalog";

export { DateStreamAbortedError } from "./ai/model-service";
import { applyMemberQuitBudgetCut } from "./budget";
import { retrieveRelevantMemories, searchCupidMemory } from "./cupid-memory";
import {
  applyJudgeToMembers,
  applyJudgeToPrivateDateState,
  applyJudgeToPairState,
  applyDateFinalReportToMembers,
  canCutDateShort,
  clearActiveBookingForShift,
  createClosureNearMissMemoryRecord,
  createCutShortMemberMemoryRecords,
  createCutShortSystemMessage,
  exchangeIndexForTurn,
  finalizeDateSession,
  findMemberRequestById,
  isAtJudgeBoundary,
  latestJudgedExchangeIndex,
  linkFinalReportMemoryRecords,
  markPairDateComplete,
  messagesSinceLastJudge,
  requireDateSession,
  requireMember,
  requirePairState,
  requireScenario,
  resolveDateEndReason,
  resolveEndedDateSentiment,
  resolvePlayerCutShortStatus,
  shouldJudgePendingExchange,
  type DateEngineResult,
} from "./date-engine";
import { getActiveShift } from "./game-seed";
import {
  buildCharacterPromptPacket,
  buildJudgePromptPacket,
  buildSummarizerPromptPacket,
  checkCupidCorporateCopy,
  collectRecentSpeakerLines,
  hasNearDuplicateRecentLine,
  hasRepeatedApprovalPhrase,
  RECENT_LINE_GUARD_COUNT,
  withCharacterVisibilityRetryGuard,
  type CharacterPromptImageAttachment,
  type CharacterPromptPacket,
  type JudgePromptMode,
  type JudgePromptPacket,
  type SummarizerPromptPacket,
} from "./date-prompts";
import {
  describeHiddenInfoLeak,
  detectHiddenInfoLeak,
  type HiddenInfoLeak,
} from "./hidden-info-guard";
import { applyMatchFitToJudgeSnapshot, evaluateMatchFit } from "./match-fit";
import { applyCompletedDatePairMemoryEffects, applyJudgePairMemoryEffects } from "./pair-memory";
import {
  applyJudgeReveals,
  buildRevealCandidates,
  filterExchangeEligibleRevealCandidates,
  validateUsedEvidenceIds,
  visibleReadsForMember,
  visibleReadsForPair,
  type RevealCandidate,
} from "./player-knowledge";
import {
  projectMemberSpeechPlain,
  sanitizeCharacterMarkdownInput,
  type MarkupAbuseDetection,
} from "./character-markdown";
import {
  cleanMemberFacingText,
  scrubPlayerSafeCopy,
  stripForbiddenPunctuation,
} from "./player-safe-copy";
import { clamp, clampScore, errorToMessage, escapeRegex, isRecord, replaceById } from "./utils";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

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
      type: "characterDone";
      speakerId: string;
      sequenceIndex: number;
      turnIndex: number;
      text: string;
    }
  | {
      type: "characterFailed";
      speakerId: string;
      sequenceIndex: number;
      turnIndex: number;
      message: string;
    }
  | {
      type: "characterCanceled";
      speakerId: string;
      sequenceIndex: number;
      turnIndex: number;
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
const SCENARIO_BACKGROUND_MANIFEST_PATH = "/assets/scenarios/manifest.json";
const AVATAR_PATH_SUFFIX = "/avatar.png";
const PORTRAIT_PATH_SUFFIX = "/portrait.png";

let scenarioBackgroundIdCache: ReadonlySet<string> | null = null;
let scenarioBackgroundIdRequest: Promise<ReadonlySet<string>> | null = null;
const gatewayImageInputSupportCache = new Map<string, boolean>();

const defaultLocalAiDateRuntime: LocalAiDateRuntime = {
  generateCharacterTurn: ({ packet, config, tools }) =>
    generateCharacterTurn({ packet, config, tools }),
  streamCharacterTurn: ({ packet, config, tools, abortSignal, onTextDelta }) =>
    streamCharacterTurnWithLocalAi({
      packet,
      config,
      onTextDelta,
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

export async function cutDateShortWithLocalAi(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
): Promise<LocalAiDateEngineResult> {
  await persistAcceptedInputSave(save, repository);
  return cutDateShortWithLocalAiInternal(save, repository, input);
}

export async function cutDateShortWithLocalAiStream(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
  emit: (event: LocalAiDateStreamEvent) => Promise<void> | void,
): Promise<LocalAiDateEngineResult> {
  await persistAcceptedInputSave(save, repository);
  return cutDateShortWithLocalAiInternal(save, repository, input, emit);
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
    knownPairReads: visibleReadsForPair(save, pairState.id),
  });
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
      partnerKnowledge: visibleReadsForMember(save, partner.id),
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
    knownReads: save.playerKnowledge,
  });
  const eligibleCandidates = filterExchangeEligibleRevealCandidates({
    candidates: revealCandidates,
    exchangeMessages: pendingRevealMessages,
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
  });
  const judgeSnapshotWithReveals = judgeSnapshotSchema.parse({
    ...localAiJudgeSnapshot,
    usedEvidenceIds: acceptedEvidenceIds,
  });
  const judgeSnapshot = applyMatchFitToJudgeSnapshot({
    session,
    pairState,
    judgeSnapshot: judgeSnapshotWithReveals,
  });
  const judgedPairState = applyJudgeToPairState(pairState, judgeSnapshot);
  const pairMemoryResult = applyJudgePairMemoryEffects({
    pairState: judgedPairState,
    judgeSnapshot,
    timestamp,
  });
  const updatedPairState = pairMemoryResult.pairState;
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
  const nextEndReason = resolveDateEndReason({
    previousEndReason: session.endReason,
    nextStatus,
    isEndingEarly,
  });
  const nextPlaybackState = nextStatus === "active" ? session.playbackState : "ended";
  const privateStateByCharacter = applyJudgeToPrivateDateState(
    session,
    judgeSnapshot,
    nextDateHealth,
  );
  const baseUpdatedSession = dateSessionSchema.parse({
    ...session,
    currentTurn,
    dateHealth: nextDateHealth,
    status: nextStatus,
    endSentiment: nextEndSentiment,
    endReason: nextEndReason,
    playbackState: nextPlaybackState,
    transcript,
    privateStateByCharacter,
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
    revealedAt: timestamp,
  });
  const finalPairState =
    completedSession.finalReport === undefined
      ? updatedPairState
      : markPairDateComplete(updatedPairState, completedSession);
  const completedPairMemoryResult =
    completedSession.finalReport === undefined
      ? { pairState: finalPairState, memories: [] }
      : applyCompletedDatePairMemoryEffects({
          pairState: finalPairState,
          session: completedSession,
          timestamp,
        });
  const finalMembers =
    completedSession.finalReport === undefined
      ? updatedMembers
      : applyDateFinalReportToMembers(
          updatedMembers,
          completedSession,
          getActiveShift(save).shiftNumber,
        );
  const shiftsAfterCompletion =
    completedSession.finalReport === undefined
      ? save.shifts
      : clearActiveBookingForShift(save.shifts, save.activeShiftId);
  const nextSave = gameSaveSchema.parse({
    ...save,
    members: finalMembers,
    pairStates: replaceById(save.pairStates, completedPairMemoryResult.pairState),
    dateSessions: replaceById(save.dateSessions, completedSession),
    memories: [
      ...save.memories,
      ...pairMemoryResult.memories,
      ...completedPairMemoryResult.memories,
      ...completion.memories,
    ],
    playerKnowledge: revealResult.save.playerKnowledge,
    shifts: shiftsAfterCompletion,
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

async function cutDateShortWithLocalAiInternal(
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

  if (!canCutDateShort(session)) {
    throw new Error("Cupid can cut a date short after two filed reads while the date is paused.");
  }

  const scenario = requireScenario(session.scenarioId);
  const pairState = requirePairState(save, session.pairId);
  const members = session.participants.map((memberId) => requireMember(save, memberId));
  const focusRequest = findMemberRequestById(session.focusRequestId);
  const cutShortMessage = createCutShortSystemMessage(session, timestamp);
  const transcript = [...session.transcript, cutShortMessage];
  const cutSession = dateSessionSchema.parse({
    ...session,
    transcript,
  });
  const matchFit = evaluateMatchFit({
    members,
    scenario,
    pairState,
    activeRequests: focusRequest === undefined ? [] : [focusRequest],
    knownPairReads: visibleReadsForPair(save, pairState.id),
  });
  const exchangeMessages = messagesForCutShortJudge(session, transcript);
  const pendingRevealMessages = exchangeMessages;
  const exchangeIndex = session.judgeSnapshots.length;

  if (emit !== undefined) {
    await emit({ type: "judgeStart", exchangeIndex });
  }

  const revealCandidates = buildRevealCandidates({
    members,
    scenario,
    pairState,
    focusRequest,
    matchFit,
    knownReads: save.playerKnowledge,
  });
  const eligibleCandidates = filterExchangeEligibleRevealCandidates({
    candidates: revealCandidates,
    exchangeMessages: pendingRevealMessages,
  });
  const localAiJudgeSnapshot = await createLocalAiJudgeSnapshot({
    runtime,
    config,
    session: cutSession,
    pairState,
    scenario,
    exchangeMessages,
    exchangeIndex,
    members,
    revealCandidates: eligibleCandidates,
    mode: "player_cut_short",
  });
  const acceptedEvidenceIds = computeAcceptedEvidenceIds({
    proposed: localAiJudgeSnapshot.usedEvidenceIds,
    candidates: eligibleCandidates,
  });
  const judgeSnapshotWithReveals = judgeSnapshotSchema.parse({
    ...localAiJudgeSnapshot,
    usedEvidenceIds: acceptedEvidenceIds,
  });
  const judgeSnapshot = applyMatchFitToJudgeSnapshot({
    session: cutSession,
    pairState,
    judgeSnapshot: judgeSnapshotWithReveals,
  });
  const judgedPairState = applyJudgeToPairState(pairState, judgeSnapshot);
  const pairMemoryResult = applyJudgePairMemoryEffects({
    pairState: judgedPairState,
    judgeSnapshot,
    timestamp,
  });
  const updatedPairState = pairMemoryResult.pairState;
  const updatedMembers = applyJudgeToMembers(save.members, judgeSnapshot);
  const nextDateHealth = clampScore(session.dateHealth + judgeSnapshot.dateHealthDelta);
  const cutShortStatus = resolvePlayerCutShortStatus({
    nextDateHealth,
    judgeSnapshot,
  });
  const privateStateByCharacter = applyJudgeToPrivateDateState(
    cutSession,
    judgeSnapshot,
    nextDateHealth,
  );
  const baseUpdatedSession = dateSessionSchema.parse({
    ...cutSession,
    currentTurn: session.currentTurn,
    dateHealth: nextDateHealth,
    status: cutShortStatus.status,
    endSentiment: cutShortStatus.endSentiment,
    endReason: cutShortStatus.endReason,
    playbackState: "ended",
    privateStateByCharacter,
    judgeSnapshots: [...session.judgeSnapshots, judgeSnapshot],
  });
  const completion = await createLocalAiFinalSession({
    runtime,
    config,
    session: baseUpdatedSession,
    pairState: updatedPairState,
    members,
    scenario,
    completedAt: timestamp,
  });
  warningMessages.push(...completion.warningMessages);
  const completedSession = completion.session;
  const revealResult = applyJudgeReveals({
    save,
    candidates: eligibleCandidates,
    acceptedIds: judgeSnapshot.usedEvidenceIds,
    judgeSnapshot,
    revealedAt: timestamp,
  });
  const finalPairState = markPairDateComplete(updatedPairState, completedSession);
  const completedPairMemoryResult = applyCompletedDatePairMemoryEffects({
    pairState: finalPairState,
    session: completedSession,
    timestamp,
  });
  const cutShortMemberMemories = createCutShortMemberMemoryRecords(
    completedSession,
    members,
    scenario,
    timestamp,
  );
  const finalSession = linkFinalReportMemoryRecords(
    completedSession,
    cutShortMemberMemories.map((memory) => memory.id),
  );
  const finalMembers = applyDateFinalReportToMembers(
    updatedMembers,
    finalSession,
    getActiveShift(save).shiftNumber,
  );
  const saveWithCutShortDate = gameSaveSchema.parse({
    ...save,
    members: finalMembers,
    pairStates: replaceById(save.pairStates, completedPairMemoryResult.pairState),
    dateSessions: replaceById(save.dateSessions, finalSession),
    memories: [
      ...save.memories,
      ...pairMemoryResult.memories,
      ...completedPairMemoryResult.memories,
      ...completion.memories,
      ...cutShortMemberMemories,
    ],
    playerKnowledge: revealResult.save.playerKnowledge,
    shifts: clearActiveBookingForShift(save.shifts, save.activeShiftId),
    updatedAt: timestamp,
  });
  const nextSave = gameSaveSchema.parse(
    applyMemberQuitBudgetCut({
      previousSave: save,
      nextSave: saveWithCutShortDate,
      shift: getActiveShift(save).shiftNumber,
    }),
  );

  await repository.saveGame(nextSave);

  return {
    save: nextSave,
    session: finalSession,
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
  partnerKnowledge,
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
  partnerKnowledge: readonly PlayerKnowledgeRecord[];
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
    const tools = createCharacterToolHandlers({
      repository,
      runtime,
      config,
      session,
      speaker,
    });
    const sequenceIndex = session.transcript.length;
    const turnIndex = session.currentTurn + 1;
    const recentSpeakerLines = collectRecentSpeakerLines(
      session.transcript,
      speaker.id,
      RECENT_LINE_GUARD_COUNT,
    );
    const warningMessages: string[] = [];
    const promptInputs = await prepareCharacterPromptInputs({
      repository,
      runtime,
      config,
      session,
      speaker,
      partner,
      scenario,
    });

    async function runAttempt(
      repetitionRetry: { repeatedLine: string } | undefined,
      rhythmRetry: { repeatedPhrase: string; recentLine: string } | undefined,
      visibilityRetry: boolean,
    ): Promise<{ text: string; generation: GeneratedTextResult }> {
      const basePacket = buildCharacterPromptPacket({
        member: speaker,
        partner,
        scenario,
        session,
        pairState,
        memoryPack: promptInputs.memoryPack,
        focusRequest,
        partnerKnowledge,
        repetitionRetry,
        rhythmRetry,
        imageAttachments: promptInputs.imageAttachments,
      });
      const packet = visibilityRetry ? withCharacterVisibilityRetryGuard(basePacket) : basePacket;
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
      const leak = detectHiddenInfoLeak(projectMemberSpeechPlain(text), [speaker, partner]);

      if (leak !== null) {
        throw new HiddenInfoLeakError(leak);
      }

      return { text, generation };
    }

    async function runVisibleAttempt(
      repetitionRetry: { repeatedLine: string } | undefined,
      rhythmRetry: { repeatedPhrase: string; recentLine: string } | undefined,
    ): Promise<{ text: string; generation: GeneratedTextResult }> {
      try {
        return await runAttempt(repetitionRetry, rhythmRetry, false);
      } catch (error) {
        if (error instanceof HiddenInfoLeakError) {
          warningMessages.push(
            `Cupid asked ${speaker.name} to rewrite a line that echoed hidden fixture text: ${describeHiddenInfoLeak(error.leak)}.`,
          );

          return runAttempt(repetitionRetry, rhythmRetry, true);
        }

        if (!(error instanceof EmptyPerformerMessageError)) {
          throw error;
        }

        warningMessages.push(
          `Cupid asked ${speaker.name} to retry an empty AI line before filing the turn.`,
        );

        return runAttempt(repetitionRetry, rhythmRetry, true);
      }
    }

    const projectedRecentSpeakerLines = recentSpeakerLines.map(projectMemberSpeechPlain);

    let attempt = await runVisibleAttempt(undefined, undefined);
    let attemptProjected = projectMemberSpeechPlain(attempt.text);
    const initialRepeat = hasNearDuplicateRecentLine({
      text: attemptProjected,
      recentLines: projectedRecentSpeakerLines,
    });

    if (initialRepeat !== null) {
      warningMessages.push(
        `Cupid asked ${speaker.name} to rewrite a near duplicate line before filing the turn.`,
      );
      const retry = await runVisibleAttempt(initialRepeat, undefined);
      const retryProjected = projectMemberSpeechPlain(retry.text);
      const stillRepeats = hasNearDuplicateRecentLine({
        text: retryProjected,
        recentLines: projectedRecentSpeakerLines,
      });

      if (stillRepeats === null) {
        attempt = retry;
        attemptProjected = retryProjected;
      } else {
        warningMessages.push(
          `${speaker.name} stayed on the same line after the rewrite. Cupid filed the turn anyway.`,
        );
      }
    }

    const repeatedApproval = hasRepeatedApprovalPhrase({
      text: attemptProjected,
      recentLines: projectedRecentSpeakerLines,
    });

    if (repeatedApproval !== null) {
      warningMessages.push(
        `Cupid asked ${speaker.name} to rewrite a repeated approval phrase before filing the turn.`,
      );
      const retry = await runVisibleAttempt(undefined, repeatedApproval);
      const retryProjected = projectMemberSpeechPlain(retry.text);
      const stillRepeats = hasRepeatedApprovalPhrase({
        text: retryProjected,
        recentLines: projectedRecentSpeakerLines,
      });

      if (stillRepeats === null) {
        attempt = retry;
      } else {
        warningMessages.push(
          `${speaker.name} reused the same approval phrase after the rewrite. Cupid filed the turn anyway.`,
        );
      }
    }

    const text = attempt.text;
    const generation = attempt.generation;
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
        type: "characterDelta",
        speakerId: speaker.id,
        sequenceIndex,
        turnIndex,
        textDelta: text,
      });
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
      warningMessages: [...warningMessages, ...(generation.warningMessages ?? [])],
    };
  } catch (error) {
    if (error instanceof DateStreamAbortedError) {
      throw error;
    }

    throw new Error(`AI performer failed for ${speaker.name}: ${errorToMessage(error)}`);
  }
}

async function prepareCharacterPromptInputs({
  repository,
  runtime,
  config,
  session,
  speaker,
  partner,
  scenario,
}: {
  repository: GameRepository;
  runtime: LocalAiDateRuntime;
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
}): Promise<{
  memoryPack: Awaited<ReturnType<typeof retrieveRelevantMemories>>;
  imageAttachments: CharacterPromptImageAttachment[];
}> {
  const memoryQuery = buildMemoryQuery(session, speaker, partner, scenario);
  const [queryEmbedding, imageAttachments] = await Promise.all([
    createRuntimeQueryEmbedding({
      runtime,
      config,
      query: memoryQuery,
    }),
    loadFirstTurnImageAttachments({
      config,
      session,
      partner,
      scenario,
    }),
  ]);
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

  return { memoryPack, imageAttachments };
}

async function loadFirstTurnImageAttachments({
  config,
  session,
  partner,
  scenario,
}: {
  config: Partial<AiRuntimeConfig>;
  session: DateSession;
  partner: Member;
  scenario: DateScenario;
}): Promise<CharacterPromptImageAttachment[]> {
  if (typeof config.chatModel !== "string" || session.currentTurn !== 0) {
    return [];
  }

  if (!(await runtimeModelSupportsImageInput(config))) {
    return [];
  }

  const [partnerPortrait, scenarioBackground] = await Promise.all([
    loadPartnerDatePortraitAttachment(partner),
    loadScenarioBackgroundAttachment(scenario),
  ]);

  return [partnerPortrait, scenarioBackground].filter(isCharacterPromptImageAttachment);
}

async function runtimeModelSupportsImageInput(config: Partial<AiRuntimeConfig>): Promise<boolean> {
  if (config.aiProvider === "ollama") {
    return typeof config.chatModel === "string" && ollamaImageInputSupported(config.chatModel);
  }

  if (config.aiProvider === "gateway") {
    return gatewayModelSupportsImageInput(config);
  }

  return false;
}

async function gatewayModelSupportsImageInput(config: Partial<AiRuntimeConfig>): Promise<boolean> {
  const modelId = config.chatModel;

  if (typeof modelId !== "string") {
    return false;
  }

  const cacheKey = `${config.gatewayBaseURL ?? "default"}:${modelId}`;
  const cached = gatewayImageInputSupportCache.get(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const discovered = await discoverGatewayModelImageInputSupport(config, modelId);
  const supported = discovered ?? gatewayImageInputSupported(modelId);
  gatewayImageInputSupportCache.set(cacheKey, supported);
  return supported;
}

async function discoverGatewayModelImageInputSupport(
  config: Partial<AiRuntimeConfig>,
  modelId: string,
): Promise<boolean | null> {
  if (!canFetchPublicAssets()) {
    return null;
  }

  try {
    const response = await globalThis.fetch(gatewayModelListUrl(config.gatewayBaseURL), {
      cache: "force-cache",
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload) || !Array.isArray(payload.data)) {
      return null;
    }

    for (const entry of payload.data) {
      if (!isRecord(entry) || entry.id !== modelId) {
        continue;
      }

      return gatewayModelEntrySupportsImageInput(entry);
    }

    return null;
  } catch {
    return null;
  }
}

function gatewayModelListUrl(baseURL: string | undefined): string {
  try {
    const url = new URL(baseURL ?? DEFAULT_GATEWAY_BASE_URL);
    return `${url.origin}/v1/models`;
  } catch {
    return "https://ai-gateway.vercel.sh/v1/models";
  }
}

function gatewayModelEntrySupportsImageInput(entry: Record<string, unknown>): boolean {
  const tagValues = Array.isArray(entry.tags) ? entry.tags : [];
  const tags = new Set(tagValues.filter((tag): tag is string => typeof tag === "string"));
  const architecture = entry.architecture;
  const inputModalities =
    isRecord(architecture) && Array.isArray(architecture.input_modalities)
      ? architecture.input_modalities.filter(
          (modality): modality is string => typeof modality === "string",
        )
      : [];

  return tags.has("vision") || tags.has("file-input") || inputModalities.includes("image");
}

function isCharacterPromptImageAttachment(
  value: CharacterPromptImageAttachment | null,
): value is CharacterPromptImageAttachment {
  return value !== null;
}

async function loadPartnerDatePortraitAttachment(
  partner: Member,
): Promise<CharacterPromptImageAttachment | null> {
  const portraitPath = readyPartnerPortraitPath(partner);

  if (portraitPath === null) {
    return null;
  }

  return fetchImageAttachment({
    path: portraitPath,
    mediaType: "image/png",
    description: `${partner.name}'s full-body date portrait`,
  });
}

function readyPartnerPortraitPath(partner: Member): string | null {
  const asset = partner.portraits.neutral.portrait;

  if (asset.model === "pending") {
    return null;
  }

  return preferPortraitPath(asset.cutoutPath);
}

function preferPortraitPath(cutoutPath: string): string {
  if (cutoutPath.endsWith(AVATAR_PATH_SUFFIX)) {
    return `${cutoutPath.slice(0, -AVATAR_PATH_SUFFIX.length)}${PORTRAIT_PATH_SUFFIX}`;
  }

  return cutoutPath;
}

async function loadScenarioBackgroundAttachment(
  scenario: DateScenario,
): Promise<CharacterPromptImageAttachment | null> {
  const hasBackground = await scenarioBackgroundExists(scenario.id);

  if (!hasBackground) {
    return null;
  }

  return fetchImageAttachment({
    path: `/assets/scenarios/${scenario.id}/background.webp`,
    mediaType: "image/webp",
    description: `${scenario.title}, the date backdrop`,
  });
}

async function scenarioBackgroundExists(scenarioId: string): Promise<boolean> {
  const ids = await loadScenarioBackgroundIds();
  return ids.has(scenarioId);
}

async function loadScenarioBackgroundIds(): Promise<ReadonlySet<string>> {
  if (!canFetchPublicAssets()) {
    return new Set();
  }

  if (scenarioBackgroundIdCache !== null) {
    return scenarioBackgroundIdCache;
  }

  scenarioBackgroundIdRequest ??= globalThis
    .fetch(SCENARIO_BACKGROUND_MANIFEST_PATH, { cache: "force-cache" })
    .then((response) => (response.ok ? response.json() : { backgrounds: [] }))
    .then((value: unknown) => {
      scenarioBackgroundIdCache = parseScenarioBackgroundIds(value);
      return scenarioBackgroundIdCache;
    })
    .catch(() => {
      scenarioBackgroundIdCache = new Set();
      return scenarioBackgroundIdCache;
    });

  return scenarioBackgroundIdRequest;
}

function parseScenarioBackgroundIds(value: unknown): ReadonlySet<string> {
  if (!isRecord(value) || !Array.isArray(value.backgrounds)) {
    return new Set();
  }

  return new Set(
    value.backgrounds.filter((background): background is string => typeof background === "string"),
  );
}

async function fetchImageAttachment({
  path,
  mediaType,
  description,
}: {
  path: string;
  mediaType: CharacterPromptImageAttachment["mediaType"];
  description: string;
}): Promise<CharacterPromptImageAttachment | null> {
  if (!canFetchPublicAssets()) {
    return null;
  }

  try {
    const response = await globalThis.fetch(path, { cache: "force-cache" });

    if (!response.ok) {
      return null;
    }

    const image = new Uint8Array(await response.arrayBuffer());

    if (image.byteLength === 0) {
      return null;
    }

    return {
      description,
      image,
      mediaType,
    };
  } catch {
    return null;
  }
}

function canFetchPublicAssets(): boolean {
  return typeof window !== "undefined" && typeof globalThis.fetch === "function";
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

  try {
    return await runtime.streamCharacterTurn({
      packet,
      config,
      tools,
      abortSignal,
      onTextDelta: () => undefined,
    });
  } catch (error) {
    if (isDateStreamAbort(error)) {
      await emit({
        type: "characterCanceled",
        speakerId: speaker.id,
        sequenceIndex,
        turnIndex,
      });
      throw error instanceof DateStreamAbortedError ? error : new DateStreamAbortedError();
    }

    await emit({
      type: "characterFailed",
      speakerId: speaker.id,
      sequenceIndex,
      turnIndex,
      message: errorToMessage(error),
    });
    throw error;
  }
}

function isDateStreamAbort(error: unknown): boolean {
  return (
    error instanceof DateStreamAbortedError ||
    (error instanceof Error && error.name === "AbortError")
  );
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
  mode = "exchange",
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
  mode?: JudgePromptMode;
}): Promise<JudgeSnapshot> {
  try {
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages,
      exchangeIndex,
      members,
      revealCandidates,
      mode,
    });

    const judgeSnapshot = await runtime.judgeDateExchange({
      packet,
      dateSessionId: session.id,
      exchangeIndex,
      config,
    });

    return sanitizeJudgeSnapshot(
      judgeSnapshot,
      session,
      { members, scenario },
      {
        allowEndSentimentWithoutEarlyEnd: mode === "player_cut_short",
      },
    );
  } catch (error) {
    throw new Error(`AI Cupid analysis failed: ${errorToMessage(error)}`);
  }
}

function computeAcceptedEvidenceIds({
  proposed,
  candidates,
}: {
  proposed: readonly string[] | undefined;
  candidates: readonly RevealCandidate[];
}): string[] {
  return validateUsedEvidenceIds(proposed, candidates);
}

function messagesForCutShortJudge(
  session: DateSession,
  transcript: readonly DateMessage[],
): DateMessage[] {
  const sinceLastJudge = messagesSinceLastJudge(session, transcript);

  if (sinceLastJudge.some((message) => message.kind === "character")) {
    return sinceLastJudge;
  }

  const latestExchangeIndex = latestJudgedExchangeIndex(session);
  const recentCharacterMessages =
    latestExchangeIndex < 0
      ? []
      : transcript.filter(
          (message) =>
            message.kind === "character" &&
            exchangeIndexForTurn(message.turnIndex) === latestExchangeIndex,
        );

  return [...recentCharacterMessages, ...sinceLastJudge];
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
    const closureNearMissMemory = createClosureNearMissMemoryRecord({
      session: completedSession,
      pairState,
      members,
      createdAt: completedAt,
    });
    const memoriesWithClosureNearMiss =
      closureNearMissMemory === null ? memories : [...memories, closureNearMissMemory];
    const linkedSession = linkFinalReportMemoryRecords(
      completedSession,
      memoriesWithClosureNearMiss.map((memory) => memory.id),
    );

    return {
      session: linkedSession,
      memories: memoriesWithClosureNearMiss,
      warningMessages: [],
    };
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
    const closureNearMissMemory = createClosureNearMissMemoryRecord({
      session: completedSession,
      pairState,
      members,
      createdAt: completedAt,
    });
    const memories =
      closureNearMissMemory === null ? [fallbackMemory] : [fallbackMemory, closureNearMissMemory];
    const linkedSession = linkFinalReportMemoryRecords(
      completedSession,
      memories.map((memory) => memory.id),
    );

    return {
      session: linkedSession,
      memories,
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
  const cutShortNote =
    session.endReason === "player_cut_short"
      ? " Cupid cut the date short and filed the final read as part of the case note."
      : "";
  const text = `${summary}${cutShortNote} Recommended follow-up: ${followUp}. Cupid filed a basic case note after the memory clerk missed the structured form.`;
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
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
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
    const scenario = requireScenario(session.scenarioId);
    const transcriptTokens = buildTranscriptGroundingTokens(session);
    const normalizedCandidates = candidates
      .map((candidate) =>
        normalizeMemoryCandidate(candidate, session, { scenario, members, transcriptTokens }),
      )
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
  context: {
    scenario: DateScenario;
    members: readonly Member[];
    transcriptTokens: ReadonlySet<string>;
  },
): MemoryCandidate {
  const participantIds = new Set(session.participants);
  const subjectIds = candidate.subjectIds.filter((memberId) => participantIds.has(memberId));
  const fallbackSubjectIds = subjectIds.length === 0 ? [...session.participants] : subjectIds;
  const cleanedText = scrubPlayerSafeCopy(candidate.text);
  const hiddenLeak = detectHiddenInfoLeak(cleanedText, context.members, {
    includeSingleLabels: true,
  });
  const memoryCheck = checkCupidCorporateCopy(cleanedText, { maxLength: 320 });
  const memoryTextIsUsable =
    hiddenLeak === null &&
    memoryCheck.ok &&
    memoryTextIsGroundedInTranscript(cleanedText, context.transcriptTokens);
  const memoryText = memoryTextIsUsable
    ? cleanedText
    : buildDeterministicMemoryText({
        scenario: context.scenario,
        members: context.members,
      });
  const tags = Array.from(
    new Set([...candidate.tags, "ai_summary", ...(memoryTextIsUsable ? [] : ["fallback_summary"])]),
  ).slice(0, 8);

  return memoryCandidateSchema.parse({
    ...candidate,
    scope: "pair",
    visibility: "public",
    subjectIds: fallbackSubjectIds,
    visibleToMemberIds: undefined,
    pairId: session.pairId,
    scenarioId: session.scenarioId,
    dateSessionId: session.id,
    text: memoryText,
    tags,
    importance: Math.min(5, Math.max(1, candidate.importance)),
  });
}

const GROUNDING_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "and",
  "before",
  "because",
  "both",
  "cupid",
  "date",
  "during",
  "each",
  "from",
  "into",
  "that",
  "their",
  "them",
  "they",
  "this",
  "through",
  "with",
]);

const GROUNDED_TOKEN_OVERLAP_MIN = 2;

function buildTranscriptGroundingTokens(session: DateSession): ReadonlySet<string> {
  const transcriptText = session.transcript.map((message) => message.text).join(" ");

  return new Set(tokenizeGroundingText(transcriptText));
}

function memoryTextIsGroundedInTranscript(
  text: string,
  transcriptTokens: ReadonlySet<string>,
): boolean {
  if (transcriptTokens.size === 0) {
    return true;
  }

  const textTokens = tokenizeGroundingText(text);
  let sharedTokens = 0;

  for (const token of textTokens) {
    if (transcriptTokens.has(token)) {
      sharedTokens += 1;
    }
  }

  return sharedTokens >= GROUNDED_TOKEN_OVERLAP_MIN;
}

function tokenizeGroundingText(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().match(/[a-z0-9_]{4,}/g) ?? [])).filter(
    (token) => !GROUNDING_STOP_WORDS.has(token),
  );
}

export function buildDeterministicMemoryText({
  scenario,
  members,
}: {
  scenario: DateScenario;
  members: readonly Member[];
}): string {
  const [first, second] = members;

  if (first === undefined || second === undefined) {
    return `Cupid filed a quiet note from ${scenario.title}.`;
  }

  return `${first.firstName} and ${second.firstName} sat through ${scenario.title}. Cupid filed the moves without further notes.`;
}

function sanitizeJudgeSnapshot(
  judgeSnapshot: JudgeSnapshot,
  session: DateSession,
  context: { members: readonly Member[]; scenario: DateScenario },
  options: { allowEndSentimentWithoutEarlyEnd?: boolean } = {},
): JudgeSnapshot {
  const memberMoodDeltas = normalizeParticipantMemberMoodDeltas(
    judgeSnapshot.memberMoodDeltas,
    session.participants,
  );
  const shouldKeepEndSentiment =
    judgeSnapshot.shouldEndEarly || options.allowEndSentimentWithoutEarlyEnd === true;
  const cleanedSummary = scrubPlayerSafeCopy(judgeSnapshot.playerSummary);
  const summaryLeak = detectHiddenInfoLeak(cleanedSummary, context.members, {
    includeSingleLabels: true,
  });
  const summaryCheck = checkCupidCorporateCopy(cleanedSummary, { maxLength: 320 });
  const playerSummary =
    summaryLeak === null && summaryCheck.ok
      ? cleanedSummary
      : buildDeterministicJudgeSummary({
          scenario: context.scenario,
          members: context.members,
          judgeSnapshot,
        });
  const cleanedMoments = judgeSnapshot.notableMoments
    .map((moment) => scrubPlayerSafeCopy(moment))
    .filter((moment) => moment.length > 0);
  const sanitizedMoments = cleanedMoments.map((moment) =>
    detectHiddenInfoLeak(moment, context.members, { includeSingleLabels: true }) === null &&
    checkCupidCorporateCopy(moment, { maxLength: 220 }).ok
      ? moment
      : buildDeterministicNotableMoment({
          scenario: context.scenario,
          judgeSnapshot,
        }),
  );
  const notableMoments =
    sanitizedMoments.length === 0
      ? [
          buildDeterministicNotableMoment({
            scenario: context.scenario,
            judgeSnapshot,
          }),
        ]
      : sanitizedMoments;

  return {
    ...judgeSnapshot,
    endSentiment: shouldKeepEndSentiment ? judgeSnapshot.endSentiment : null,
    memberMoodDeltas,
    earlyEndReason: sanitizeEarlyEndReason(judgeSnapshot, context.members),
    notableMoments,
    playerSummary,
  };
}

function sanitizeEarlyEndReason(
  judgeSnapshot: Pick<JudgeSnapshot, "shouldEndEarly" | "earlyEndReason">,
  members: readonly Member[],
): string | undefined {
  if (!judgeSnapshot.shouldEndEarly || judgeSnapshot.earlyEndReason === undefined) {
    return undefined;
  }

  const cleaned = scrubPlayerSafeCopy(judgeSnapshot.earlyEndReason);
  if (detectHiddenInfoLeak(cleaned, members, { includeSingleLabels: true }) !== null) {
    return undefined;
  }

  return cleaned.length === 0 ? undefined : cleaned;
}

function normalizeParticipantMemberMoodDeltas(
  proposed: JudgeSnapshot["memberMoodDeltas"],
  participantIds: readonly string[],
): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (const memberId of participantIds) {
    normalized[memberId] = clamp(proposed[memberId] ?? 0, -8, 8);
  }

  return normalized;
}

export function buildDeterministicJudgeSummary({
  scenario,
  members,
  judgeSnapshot,
}: {
  scenario: DateScenario;
  members: readonly Member[];
  judgeSnapshot: Pick<JudgeSnapshot, "dateHealthDelta" | "exchangeIndex" | "shouldEndEarly">;
}): string {
  const [first, second] = members;
  const pair =
    first === undefined || second === undefined
      ? "The pair"
      : `${first.firstName} and ${second.firstName}`;
  const exchangeLabel = `exchange ${judgeSnapshot.exchangeIndex + 1}`;

  if (judgeSnapshot.shouldEndEarly === true) {
    return `Cupid stopped ${exchangeLabel}. ${pair} cut ${scenario.title} short.`;
  }

  const direction = describeDateHealthDirection(judgeSnapshot.dateHealthDelta);
  return `Cupid filed ${exchangeLabel}. ${pair} ${direction} at ${scenario.title}.`;
}

function describeDateHealthDirection(delta: number): string {
  if (delta >= 4) {
    return "warmed the room";
  }
  if (delta >= 1) {
    return "held the room";
  }
  if (delta <= -4) {
    return "stalled the room";
  }
  if (delta <= -1) {
    return "drifted in the room";
  }
  return "kept the room flat";
}

export function buildDeterministicNotableMoment({
  scenario,
  judgeSnapshot,
}: {
  scenario: DateScenario;
  judgeSnapshot: Pick<JudgeSnapshot, "dateHealthDelta" | "exchangeIndex">;
}): string {
  const direction = describeDateHealthDirection(judgeSnapshot.dateHealthDelta);
  return `${scenario.title}: pair ${direction}.`;
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

export class HiddenInfoLeakError extends Error {
  readonly leak: HiddenInfoLeak;

  constructor(leak: HiddenInfoLeak) {
    super(`Performer echoed hidden fixture text: ${describeHiddenInfoLeak(leak)}.`);
    this.name = "HiddenInfoLeakError";
    this.leak = leak;
  }
}

export type CharacterTextSanitizationResult = {
  text: string;
  markupAbuses: MarkupAbuseDetection[];
};

export function sanitizeCharacterText(text: string, speakerName: string): string {
  return sanitizeCharacterTextWithReport(text, speakerName).text;
}

export function sanitizeCharacterTextWithReport(
  text: string,
  speakerName: string,
): CharacterTextSanitizationResult {
  const markdownPass = sanitizeCharacterMarkdownInput(text);
  const balancedText = stripUnbalancedDoubleQuotes(markdownPass.text);
  const lines = balancedText.split("\n");
  const cleaned: string[] = [];
  let firstNonEmptyHandled = false;

  for (const rawLine of lines) {
    if (rawLine.length === 0) {
      cleaned.push("");
      continue;
    }

    let line = stripForbiddenPunctuation(rawLine);
    line = line.replace(/[^\S\n]+/g, " ").trim();

    if (!firstNonEmptyHandled && line.length > 0) {
      line = line.replace(/^["']/, "");
      line = line.replace(speakerLabelPattern(speakerName), "").trim();
      firstNonEmptyHandled = true;
    }

    if (line.length === 0) {
      cleaned.push("");
      continue;
    }

    line = stripPerformerActionNarration(line);
    line = cleanMemberFacingText(line).trim();

    cleaned.push(line);
  }

  for (let index = cleaned.length - 1; index >= 0; index -= 1) {
    if (cleaned[index].length > 0) {
      cleaned[index] = cleaned[index].replace(/["']$/, "").trim();
      break;
    }
  }

  while (cleaned.length > 0 && cleaned[0] === "") {
    cleaned.shift();
  }
  while (cleaned.length > 0 && cleaned[cleaned.length - 1] === "") {
    cleaned.pop();
  }

  const collapsed: string[] = [];
  let lastBlank = false;
  for (const line of cleaned) {
    if (line === "") {
      if (!lastBlank) {
        collapsed.push("");
      }
      lastBlank = true;
    } else {
      collapsed.push(line);
      lastBlank = false;
    }
  }

  const finalText = collapsed.join("\n");

  if (finalText.length === 0) {
    throw new EmptyPerformerMessageError();
  }

  return { text: finalText, markupAbuses: markdownPass.abuses };
}

function stripUnbalancedDoubleQuotes(text: string): string {
  const quoteCount = text.match(/"/g)?.length ?? 0;

  if (quoteCount % 2 === 0) {
    return text;
  }

  return text.replace(/"/g, "");
}

const BARE_ACTION_VERBS = [
  "laughs",
  "smiles",
  "nods",
  "shrugs",
  "pauses",
  "sighs",
  "looks",
  "glances",
  "leans",
  "blinks",
  "winces",
  "grimaces",
  "breathes",
  "swallows",
] as const;

const FIRST_PERSON_ACTION_VERBS: readonly { base: string; ing: string }[] = [
  { base: "slide", ing: "sliding" },
  { base: "release", ing: "releasing" },
  { base: "press", ing: "pressing" },
  { base: "tap", ing: "tapping" },
  { base: "push", ing: "pushing" },
  { base: "set", ing: "setting" },
  { base: "hand", ing: "handing" },
  { base: "pass", ing: "passing" },
  { base: "open", ing: "opening" },
  { base: "close", ing: "closing" },
  { base: "lift", ing: "lifting" },
  { base: "lower", ing: "lowering" },
  { base: "pull", ing: "pulling" },
  { base: "place", ing: "placing" },
  { base: "pick", ing: "picking" },
  { base: "reach", ing: "reaching" },
  { base: "move", ing: "moving" },
  { base: "turn", ing: "turning" },
  { base: "scroll", ing: "scrolling" },
  { base: "type", ing: "typing" },
  { base: "enter", ing: "entering" },
];

const ACTION_NARRATION_PATTERN = new RegExp(
  `^(?:(?:${BARE_ACTION_VERBS.join("|")})|I\\s+(?:(?:${FIRST_PERSON_ACTION_VERBS.map(
    (verb) => verb.base,
  ).join("|")})|(?:am|will be)\\s+(?:${FIRST_PERSON_ACTION_VERBS.map((verb) => verb.ing).join(
    "|",
  )})))\\b`,
  "i",
);

function stripPerformerActionNarration(text: string): string {
  const sentenceMatches = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const keptSentences = sentenceMatches.filter((sentence) => {
    const normalizedSentence = sentence.trim();

    if (normalizedSentence.length === 0) {
      return false;
    }

    return !ACTION_NARRATION_PATTERN.test(normalizedSentence);
  });

  return keptSentences
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}
