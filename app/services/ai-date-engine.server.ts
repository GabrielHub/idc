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
import { starterScenarios } from "../fixtures";
import type { GameRepository } from "../repositories/game-repository";
import {
  type CharacterMemoryToolExecution,
  type GeneratedTextResult,
  type LocalAiRuntimeConfig,
  embedMemoryText,
  generateCharacterTurn,
  judgeDateExchange,
  summarizeDateMemories,
} from "./ai/ollama-provider.server";
import { retrieveRelevantMemories, searchCupidMemory } from "./cupid-memory";
import {
  applyJudgeToMembers,
  applyJudgeToPairState,
  clampScore,
  createCharacterMessage,
  createDateMemoryRecords,
  createNonCharacterMessage,
  finalizeDateSession,
  judgeExchangeDeterministically,
  markPairDateComplete,
  replaceById,
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
import { createDeterministicEmbedding } from "./vector-memory";

export type LocalAiDateRuntime = {
  generateCharacterTurn(input: {
    packet: CharacterPromptPacket;
    config: Partial<LocalAiRuntimeConfig>;
    memoryTool: CharacterMemoryToolExecution;
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

export type LocalAiDateEngineResult = DateEngineResult & {
  runtimeMode: "local_ai";
  warningMessages: string[];
  aiTelemetry: {
    characterGenerationCount: number;
    characterToolCallCount: number;
    characterToolResultCount: number;
    deterministicFallbackCount: number;
  };
};

type LocalAiDateEngineInput = {
  dateSessionId: string;
  now?: Date;
  config?: Partial<LocalAiRuntimeConfig>;
  runtime?: LocalAiDateRuntime;
};

const DEFAULT_MEMORY_LIMIT = 4;
const CHARACTER_MESSAGE_MAX_LENGTH = 720;

const defaultLocalAiDateRuntime: LocalAiDateRuntime = {
  generateCharacterTurn: ({ packet, config, memoryTool }) =>
    generateCharacterTurn(packet, config, memoryTool),
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
  const runtime = input.runtime ?? defaultLocalAiDateRuntime;
  const config = input.config ?? save.config;
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const warningMessages: string[] = [];
  const telemetry = {
    characterGenerationCount: 0,
    characterToolCallCount: 0,
    characterToolResultCount: 0,
    deterministicFallbackCount: 0,
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

  await repository.saveGame(save);

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
    const characterResult = await createLocalAiCharacterMessage({
      repository,
      runtime,
      config,
      session: { ...workingSession, transcript, currentTurn },
      speaker,
      partner,
      scenario,
      pairState,
      createdAt: timestamp,
      warningMessages,
    });

    telemetry.characterGenerationCount += 1;
    telemetry.characterToolCallCount += characterResult.toolCallCount;
    telemetry.characterToolResultCount += characterResult.toolResultCount;
    telemetry.deterministicFallbackCount += characterResult.usedDeterministicFallback ? 1 : 0;

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
  const judgeSnapshot = await createLocalAiJudgeSnapshot({
    runtime,
    config,
    session,
    pairState,
    members,
    scenario,
    exchangeMessages,
    exchangeIndex: session.judgeSnapshots.length,
    warningMessages,
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
          warningMessages,
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
  let nextSave = save;
  let nextSession = requireDateSession(save, input.dateSessionId);
  const warningMessages: string[] = [];
  const telemetry = {
    characterGenerationCount: 0,
    characterToolCallCount: 0,
    characterToolResultCount: 0,
    deterministicFallbackCount: 0,
  };

  while (nextSession.status === "active") {
    const result = await advanceDateExchangeWithLocalAi(nextSave, repository, {
      ...input,
      now: input.now,
    });
    nextSave = result.save;
    nextSession = result.session;
    warningMessages.push(...result.warningMessages);
    telemetry.characterGenerationCount += result.aiTelemetry.characterGenerationCount;
    telemetry.characterToolCallCount += result.aiTelemetry.characterToolCallCount;
    telemetry.characterToolResultCount += result.aiTelemetry.characterToolResultCount;
    telemetry.deterministicFallbackCount += result.aiTelemetry.deterministicFallbackCount;
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
  warningMessages,
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
  warningMessages: string[];
}): Promise<{
  message: DateMessage;
  toolCallCount: number;
  toolResultCount: number;
  usedDeterministicFallback: boolean;
}> {
  try {
    const memoryQuery = buildMemoryQuery(session, speaker, partner, scenario);
    const queryEmbedding = await createRuntimeQueryEmbedding({
      runtime,
      config,
      query: memoryQuery,
      warningMessages,
    });
    const memoryPack = await retrieveRelevantMemories(repository, {
      characterId: speaker.id,
      partnerId: partner.id,
      pairId: session.pairId,
      scenarioId: session.scenarioId,
      dateSessionId: session.id,
      query: memoryQuery,
      queryEmbedding,
      limit: DEFAULT_MEMORY_LIMIT,
    });
    const currentMemoryPack = {
      ...memoryPack,
      recentTranscript: session.transcript.slice(-8),
    };
    const packet = buildCharacterPromptPacket({
      member: speaker,
      partner,
      scenario,
      session,
      pairState,
      memoryPack: currentMemoryPack,
    });
    const memoryTool: CharacterMemoryToolExecution = async (toolInput) => {
      const toolQueryEmbedding = await createRuntimeQueryEmbedding({
        runtime,
        config,
        query: toolInput.query,
        warningMessages,
      });

      return searchCupidMemory(repository, {
        characterId: speaker.id,
        pairId: session.pairId,
        scenarioId: session.scenarioId,
        query: toolInput.query,
        queryEmbedding: toolQueryEmbedding,
        scope: toolInput.scope,
        limit: toolInput.limit,
      });
    };
    const generation = await runtime.generateCharacterTurn({
      packet,
      config,
      memoryTool,
    });
    const text = sanitizeCharacterText(generation.text);
    const message = dateMessageSchema.parse({
      id: `${session.id}-msg-${session.transcript.length}`,
      dateSessionId: session.id,
      kind: "character",
      speakerId: speaker.id,
      turnIndex: session.currentTurn + 1,
      sequenceIndex: session.transcript.length,
      text,
      createdAt,
    });

    return {
      message,
      toolCallCount: generation.toolCallCount,
      toolResultCount: generation.toolResultCount,
      usedDeterministicFallback: false,
    };
  } catch (error) {
    warningMessages.push(
      `Local AI performer fallback for ${speaker.name}: ${errorToMessage(error)}`,
    );

    return {
      message: createCharacterMessage({
        session,
        speaker,
        partner,
        scenario,
        pairState,
        createdAt,
      }),
      toolCallCount: 0,
      toolResultCount: 0,
      usedDeterministicFallback: true,
    };
  }
}

async function createLocalAiJudgeSnapshot({
  runtime,
  config,
  session,
  pairState,
  members,
  scenario,
  exchangeMessages,
  exchangeIndex,
  warningMessages,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<LocalAiRuntimeConfig>;
  session: DateSession;
  pairState: PairState;
  members: Member[];
  scenario: DateScenario;
  exchangeMessages: DateMessage[];
  exchangeIndex: number;
  warningMessages: string[];
}): Promise<JudgeSnapshot> {
  try {
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages,
    });

    const judgeSnapshot = await runtime.judgeDateExchange({
      packet,
      dateSessionId: session.id,
      exchangeIndex,
      config,
    });

    return sanitizeJudgeSnapshot(judgeSnapshot, session);
  } catch (error) {
    warningMessages.push(`Local AI judge fallback: ${errorToMessage(error)}`);
    return sanitizeJudgeSnapshot(
      judgeExchangeDeterministically({
        session,
        pairState,
        members,
        scenario,
        exchangeMessages,
        exchangeIndex,
      }),
      session,
    );
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
  warningMessages,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<LocalAiRuntimeConfig>;
  session: DateSession;
  pairState: PairState;
  members: Member[];
  scenario: DateScenario;
  completedAt: string;
  warningMessages: string[];
}): Promise<{ session: DateSession; memories: MemoryRecord[] }> {
  const memories = await createLocalAiMemoryRecords({
    runtime,
    config,
    session,
    members,
    scenario,
    createdAt: completedAt,
    warningMessages,
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
  scenario,
  createdAt,
  warningMessages,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<LocalAiRuntimeConfig>;
  session: DateSession;
  members: Member[];
  scenario: DateScenario;
  createdAt: string;
  warningMessages: string[];
}): Promise<MemoryRecord[]> {
  try {
    const packet = buildSummarizerPromptPacket({
      session,
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
    warningMessages.push(`Local AI memory fallback: ${errorToMessage(error)}`);
    return createDateMemoryRecords(session, members, scenario, createdAt);
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
  const fallbackSet = new Set(fallbackSubjectIds);
  const filteredIds = visibleToMemberIds.filter(
    (memberId) => allowedSet.has(memberId) && fallbackSet.has(memberId),
  );

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

function requireMember(save: GameSave, memberId: string): Member {
  const member = save.members.find((candidate) => candidate.id === memberId);

  if (member === undefined) {
    throw new Error(`Member not found: ${memberId}`);
  }

  return member;
}

function requireScenario(scenarioId: string): DateScenario {
  const scenario = starterScenarios.find((candidate) => candidate.id === scenarioId);

  if (scenario === undefined) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  return scenario;
}

function requirePairState(save: GameSave, pairId: string): PairState {
  const pairState = save.pairStates.find((candidate) => candidate.id === pairId);

  if (pairState === undefined) {
    throw new Error(`Pair state not found: ${pairId}`);
  }

  return pairState;
}

function requireDateSession(save: GameSave, dateSessionId: string): DateSession {
  const session = save.dateSessions.find((candidate) => candidate.id === dateSessionId);

  if (session === undefined) {
    throw new Error(`Date session not found: ${dateSessionId}`);
  }

  return session;
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
  warningMessages,
}: {
  runtime: LocalAiDateRuntime;
  config: Partial<LocalAiRuntimeConfig>;
  query: string;
  warningMessages: string[];
}): Promise<number[]> {
  try {
    const result = await runtime.embedMemoryText({
      text: query,
      config,
    });

    return result.embedding;
  } catch (error) {
    warningMessages.push(`Local AI query embedding fallback: ${errorToMessage(error)}`);
    return createDeterministicEmbedding(query);
  }
}

function sanitizeCharacterText(text: string): string {
  const trimmedText = text
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  if (trimmedText.length === 0) {
    throw new Error("Performer returned an empty message.");
  }

  if (trimmedText.length <= CHARACTER_MESSAGE_MAX_LENGTH) {
    return trimmedText;
  }

  return `${trimmedText.slice(0, CHARACTER_MESSAGE_MAX_LENGTH - 3)}...`;
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
