import type { DateMessage, DateSession, MemoryRecord } from "../domain/game";
import type { GameRepository, MemorySearchFilters } from "../repositories/game-repository";
import { createDeterministicEmbedding } from "./vector-memory";

export type MemoryRetrievalInput = {
  characterId: string;
  partnerId: string;
  pairId: string;
  scenarioId: string;
  dateSessionId?: string;
  session?: DateSession;
  query: string;
  queryEmbedding?: number[];
  queryEmbeddingModel?: string;
  queryEmbeddingDimensions?: number;
  limit?: number;
  recentTranscriptLimit?: number;
};

export type MemoryPack = {
  self: MemoryRecord[];
  pair: MemoryRecord[];
  scenario: MemoryRecord[];
  recentTranscript: DateMessage[];
};

export type SearchCupidMemoryInput = {
  characterId: string;
  pairId: string;
  scenarioId: string;
  query: string;
  queryEmbedding?: number[];
  queryEmbeddingModel?: string;
  queryEmbeddingDimensions?: number;
  scope: Array<"self" | "pair" | "scenario">;
  limit: number;
};

export type SearchCupidMemoryResult = {
  id: string;
  text: string;
  score: number;
  scope: MemoryRecord["scope"];
  tags: string[];
};

export async function retrieveRelevantMemories(
  repository: GameRepository,
  input: MemoryRetrievalInput,
): Promise<MemoryPack> {
  const limit = input.limit ?? 4;
  const queryEmbedding = input.queryEmbedding ?? createDeterministicEmbedding(input.query);
  const embeddingFilters = embeddingCompatibilityFilters(input);
  const viewer = { role: "character" as const, memberId: input.characterId };
  const sessionPromise: Promise<DateSession | null> =
    input.session !== undefined
      ? Promise.resolve(input.session)
      : input.dateSessionId === undefined
        ? Promise.resolve(null)
        : repository.getDateSession(input.dateSessionId);
  const [self, pair, scenario, dateSession] = await Promise.all([
    searchVisibleMemories(
      repository,
      queryEmbedding,
      input.characterId,
      {
        ...embeddingFilters,
        subjectIds: [input.characterId],
        scopes: ["member"],
        visibilities: ["public", "member_private"],
        viewer,
      },
      limit,
    ),
    searchVisibleMemories(
      repository,
      queryEmbedding,
      input.characterId,
      {
        ...embeddingFilters,
        pairId: input.pairId,
        scopes: ["pair", "date"],
        visibilities: ["public", "member_private"],
        viewer,
      },
      limit,
    ),
    searchVisibleMemories(
      repository,
      queryEmbedding,
      input.characterId,
      {
        ...embeddingFilters,
        scenarioId: input.scenarioId,
        pairId: input.pairId,
        scopes: ["scenario"],
        visibilities: ["public", "member_private"],
        viewer,
      },
      limit,
    ),
    sessionPromise,
  ]);
  const recentTranscript = dateSession?.transcript.slice(-(input.recentTranscriptLimit ?? 8)) ?? [];

  return {
    self,
    pair,
    scenario,
    recentTranscript,
  };
}

export async function searchCupidMemory(
  repository: GameRepository,
  input: SearchCupidMemoryInput,
): Promise<SearchCupidMemoryResult[]> {
  const boundedLimit = Math.min(Math.max(input.limit, 1), 5);
  const queryEmbedding = input.queryEmbedding ?? createDeterministicEmbedding(input.query);
  const results = (
    await Promise.all(
      buildToolFilters(input).map((filters) =>
        repository.searchMemoriesByVector(queryEmbedding, filters, boundedLimit),
      ),
    )
  )
    .flat()
    .sort(
      (first, second) =>
        second.score - first.score || first.memory.id.localeCompare(second.memory.id),
    );
  const seenMemoryIds = new Set<string>();

  return results
    .filter((result) => canCharacterSeeMemory(result.memory, input.characterId))
    .filter((result) => {
      if (seenMemoryIds.has(result.memory.id)) {
        return false;
      }

      seenMemoryIds.add(result.memory.id);
      return true;
    })
    .slice(0, boundedLimit)
    .map((result) => ({
      id: result.memory.id,
      text: truncateMemoryText(result.memory.text),
      score: Number(result.score.toFixed(4)),
      scope: result.memory.scope,
      tags: result.memory.tags,
    }));
}

async function searchVisibleMemories(
  repository: GameRepository,
  queryEmbedding: number[],
  characterId: string,
  filters: MemorySearchFilters,
  limit: number,
): Promise<MemoryRecord[]> {
  const results = await repository.searchMemoriesByVector(queryEmbedding, filters, limit);
  return results
    .filter((result) => canCharacterSeeMemory(result.memory, characterId))
    .map((result) => result.memory);
}

function buildToolFilters(input: SearchCupidMemoryInput): MemorySearchFilters[] {
  const scopes = input.scope;
  const baseFilters: Pick<
    MemorySearchFilters,
    "embeddingDimensions" | "embeddingModel" | "visibilities" | "viewer"
  > = {
    ...embeddingCompatibilityFilters(input),
    visibilities: ["public", "member_private"],
    viewer: { role: "character", memberId: input.characterId },
  };
  const filters: MemorySearchFilters[] = [];

  if (scopes.includes("self")) {
    filters.push({
      ...baseFilters,
      subjectIds: [input.characterId],
      scopes: ["member"],
    });
  }

  if (scopes.includes("pair")) {
    filters.push({
      ...baseFilters,
      pairId: input.pairId,
      scopes: ["pair", "date"],
    });
  }

  if (scopes.includes("scenario")) {
    filters.push({
      ...baseFilters,
      scenarioId: input.scenarioId,
      pairId: input.pairId,
      scopes: ["scenario"],
    });
  }

  return filters;
}

function embeddingCompatibilityFilters(input: {
  queryEmbeddingModel?: string;
  queryEmbeddingDimensions?: number;
}): Pick<MemorySearchFilters, "embeddingDimensions" | "embeddingModel"> {
  return {
    embeddingModel: input.queryEmbeddingModel,
    embeddingDimensions: input.queryEmbeddingDimensions,
  };
}

function canCharacterSeeMemory(memory: MemoryRecord, characterId: string): boolean {
  if (memory.visibility === "judge_only") {
    return false;
  }

  if (memory.visibility === "public") {
    return true;
  }

  return (memory.visibleToMemberIds ?? memory.subjectIds).includes(characterId);
}

function truncateMemoryText(text: string): string {
  if (text.length <= 360) {
    return text;
  }

  return `${text.slice(0, 357)}...`;
}
