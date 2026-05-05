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
  type MemoryCandidate,
  type MemoryRecord,
  type PairState,
} from "../domain/game";
import type { GameRepository } from "../repositories/game-repository";
import {
  type GeneratedTextResult,
  type LocalAiRuntimeConfig,
  embedMemoryText,
  generateCharacterTurn,
  judgeDateExchange,
  streamCharacterTurn as streamCharacterTurnWithLocalAi,
  summarizeDateMemories,
} from "./ai/ollama-provider.server";
import { retrieveRelevantMemories } from "./cupid-memory";
import {
  applyJudgeToMembers,
  applyJudgeToPairState,
  createNonCharacterMessage,
  finalizeDateSession,
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
import { clampScore, errorToMessage, replaceById } from "./utils";

export type LocalAiDateRuntime = {
  generateCharacterTurn(input: {
    packet: CharacterPromptPacket;
    config: Partial<LocalAiRuntimeConfig>;
  }): Promise<GeneratedTextResult>;
  streamCharacterTurn?(input: {
    packet: CharacterPromptPacket;
    config: Partial<LocalAiRuntimeConfig>;
    onTextDelta: (delta: string) => Promise<void> | void;
  }): Promise<GeneratedTextResult>;
  judgeDateExchange(input: {
    packet: JudgePromptPacket;
    dateSessionId: string;
    exchangeIndex: number;
    config: Partial<LocalAiRuntimeConfig>;
  }): Promise<JudgeSnapshot>;
  summarizeDateMemories(input: {
    packet: SummarizerPromptPacket;
    config: Partial<LocalAiRuntimeConfig>;
  }): Promise<MemoryCandidate[]>;
  embedMemoryText(input: {
    text: string;
    config: Partial<LocalAiRuntimeConfig>;
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
      type: "judgeStart";
      exchangeIndex: number;
    };

export type LocalAiDateEngineResult = DateEngineResult & {
  runtimeMode: "local_ai";
  warningMessages: string[];
  aiTelemetry: {
    characterGenerationCount: number;
    characterToolCallCount: number;
    characterToolResultCount: number;
  };
};

type LocalAiDateEngineInput = {
  dateSessionId: string;
  now?: Date;
  config?: Partial<LocalAiRuntimeConfig>;
  runtime?: LocalAiDateRuntime;
};

const DEFAULT_MEMORY_LIMIT = 2;
const CHARACTER_RECENT_TRANSCRIPT_LIMIT = 4;
const CHARACTER_MESSAGE_MAX_LENGTH = 360;

const defaultLocalAiDateRuntime: LocalAiDateRuntime = {
  generateCharacterTurn: ({ packet, config }) => generateCharacterTurn(packet, config),
  streamCharacterTurn: ({ packet, config, onTextDelta }) =>
    streamCharacterTurnWithLocalAi(packet, config, onTextDelta),
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
  return advanceDateExchangeWithLocalAiInternal(save, repository, input);
}

export async function advanceDateExchangeWithLocalAiStream(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
  emit: (event: LocalAiDateStreamEvent) => Promise<void> | void,
): Promise<LocalAiDateEngineResult> {
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
  const telemetry = {
    characterGenerationCount: 0,
    characterToolCallCount: 0,
    characterToolResultCount: 0,
  };
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
  const transcript = [...session.transcript];
  const firstNewSequenceIndex = transcript.length;
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
      createdAt: timestamp,
      emit,
    });

    telemetry.characterGenerationCount += 1;
    telemetry.characterToolCallCount += characterResult.toolCallCount;
    telemetry.characterToolResultCount += characterResult.toolResultCount;

    transcript.push(characterResult.message);
    currentTurn += 1;
    workingSession = dateSessionSchema.parse({
      ...workingSession,
      transcript,
      currentTurn,
    });
  }

  const exchangeMessages = transcript
    .slice(firstNewSequenceIndex)
    .filter((message) => message.kind === "character");
  const exchangeIndex = session.judgeSnapshots.length;
  if (emit !== undefined) {
    await emit({ type: "judgeStart", exchangeIndex });
  }
  const judgeSnapshot = await createLocalAiJudgeSnapshot({
    runtime,
    config,
    session,
    pairState,
    scenario,
    exchangeMessages,
    exchangeIndex,
    members,
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
  const nextSave = gameSaveSchema.parse({
    ...save,
    members: updatedMembers,
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
  return completeDateSessionWithLocalAiInternal(save, repository, input);
}

export async function completeDateSessionWithLocalAiStream(
  save: GameSave,
  repository: GameRepository,
  input: LocalAiDateEngineInput,
  emit: (event: LocalAiDateStreamEvent) => Promise<void> | void,
): Promise<LocalAiDateEngineResult> {
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
  const telemetry = {
    characterGenerationCount: 0,
    characterToolCallCount: 0,
    characterToolResultCount: 0,
  };

  while (nextSession.status === "active") {
    const result = await advanceDateExchangeWithLocalAiInternal(nextSave, repository, input, emit);
    nextSave = result.save;
    nextSession = result.session;
    warningMessages.push(...result.warningMessages);
    telemetry.characterGenerationCount += result.aiTelemetry.characterGenerationCount;
    telemetry.characterToolCallCount += result.aiTelemetry.characterToolCallCount;
    telemetry.characterToolResultCount += result.aiTelemetry.characterToolResultCount;
  }

  return {
    save: nextSave,
    session: nextSession,
    runtimeMode: "local_ai",
    warningMessages,
    aiTelemetry: telemetry,
  };
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
  createdAt,
  emit,
}: {
  repository: GameRepository;
  runtime: LocalAiDateRuntime;
  config: Partial<LocalAiRuntimeConfig>;
  session: DateSession;
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  createdAt: string;
  emit?: (event: LocalAiDateStreamEvent) => Promise<void> | void;
}): Promise<{
  message: DateMessage;
  toolCallCount: number;
  toolResultCount: number;
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
    };
  } catch (error) {
    throw new Error(`Local AI performer failed for ${speaker.name}: ${errorToMessage(error)}`);
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
}: {
  repository: GameRepository;
  runtime: LocalAiDateRuntime;
  config: Partial<LocalAiRuntimeConfig>;
  session: DateSession;
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
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
    queryEmbedding,
    limit: DEFAULT_MEMORY_LIMIT,
    recentTranscriptLimit: CHARACTER_RECENT_TRANSCRIPT_LIMIT,
  });

  return buildCharacterPromptPacket({
    member: speaker,
    partner,
    scenario,
    session,
    pairState,
    memoryPack: {
      ...memoryPack,
      recentTranscript: session.transcript.slice(-CHARACTER_RECENT_TRANSCRIPT_LIMIT),
    },
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
  config: Partial<LocalAiRuntimeConfig>;
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
      if (delta.length === 0) {
        return;
      }

      await emit({
        type: "characterDelta",
        speakerId: speaker.id,
        sequenceIndex,
        turnIndex,
        textDelta: delta,
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
  config: Partial<LocalAiRuntimeConfig>;
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
    throw new Error(`Local AI judge failed: ${errorToMessage(error)}`);
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
  config: Partial<LocalAiRuntimeConfig>;
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
  config: Partial<LocalAiRuntimeConfig>;
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
    throw new Error(`Local AI memory filing failed: ${errorToMessage(error)}`);
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
  config: Partial<LocalAiRuntimeConfig>;
  query: string;
}): Promise<number[]> {
  try {
    const result = await runtime.embedMemoryText({
      text: query,
      config,
    });

    return result.embedding;
  } catch (error) {
    throw new Error(`Local AI memory search failed: ${errorToMessage(error)}`);
  }
}

function sanitizeCharacterText(text: string, speakerName: string): string {
  const speakerLabelPattern = new RegExp(`^${escapeRegex(speakerName)}\\s*:\\s*`, "i");
  const trimmedText = text
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(speakerLabelPattern, "")
    .trim();

  if (trimmedText.length === 0) {
    throw new Error("Performer returned an empty message.");
  }

  if (trimmedText.length <= CHARACTER_MESSAGE_MAX_LENGTH) {
    return trimmedText;
  }

  return `${trimmedText.slice(0, CHARACTER_MESSAGE_MAX_LENGTH - 3)}...`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
