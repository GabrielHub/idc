import type { DateMessage, DateSession, MemoryRecord } from "../domain/game";
import type {
  GameRepository,
  MemorySearchFilters,
  MemorySearchResult,
} from "../repositories/game-repository";
import {
  matchesListFilter,
  matchesSingleFilter,
  matchesSubjectFilter,
  matchesTags,
} from "./memory-filters";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

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

const VECTOR_SCORE_FLOOR = 0.05;
const LEXICAL_SCORE_FLOOR = 0.12;

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
      {
        query: input.query,
        queryEmbedding,
      },
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
      {
        query: input.query,
        queryEmbedding,
      },
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
      {
        query: input.query,
        queryEmbedding,
      },
      input.characterId,
      {
        ...embeddingFilters,
        scenarioId: input.scenarioId,
        scopes: ["scenario"],
        visibilities: ["public", "member_private"],
        viewer,
      },
      limit,
    ),
    sessionPromise,
  ]);

  return {
    self,
    pair,
    scenario,
    recentTranscript: dateSession?.transcript ?? [],
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
        searchMemoryResults(repository, {
          query: input.query,
          queryEmbedding,
          filters,
          characterId: input.characterId,
          limit: boundedLimit,
        }),
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
      tags: [],
    }));
}

async function searchVisibleMemories(
  repository: GameRepository,
  query: {
    query: string;
    queryEmbedding: number[];
  },
  characterId: string,
  filters: MemorySearchFilters,
  limit: number,
): Promise<MemoryRecord[]> {
  const results = await searchMemoryResults(repository, {
    ...query,
    characterId,
    filters,
    limit,
  });
  return results.map((result) => result.memory);
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

async function searchMemoryResults(
  repository: GameRepository,
  input: {
    query: string;
    queryEmbedding: number[];
    filters: MemorySearchFilters;
    characterId: string;
    limit: number;
  },
): Promise<MemorySearchResult[]> {
  const results = new Map<string, MemorySearchResult>();

  function addResult(result: MemorySearchResult): void {
    if (!canCharacterSeeMemory(result.memory, input.characterId)) {
      return;
    }

    if (result.score < VECTOR_SCORE_FLOOR) {
      return;
    }

    const existing = results.get(result.memory.id);
    if (existing === undefined || result.score > existing.score) {
      results.set(result.memory.id, result);
    }
  }

  const deterministicEmbedding = createDeterministicEmbedding(input.query);
  const deterministicFilters: MemorySearchFilters = {
    ...input.filters,
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: deterministicEmbedding.length,
  };
  const [primaryResults, deterministicResults] = await Promise.all([
    repository.searchMemoriesByVector(input.queryEmbedding, input.filters, input.limit),
    repository.searchMemoriesByVector(deterministicEmbedding, deterministicFilters, input.limit),
  ]);
  for (const result of primaryResults) {
    addResult(result);
  }
  for (const result of deterministicResults) {
    addResult({ ...result, score: result.score - 0.01 });
  }

  if (results.size < input.limit) {
    const lexicalResults = await searchMemoriesByLexicalFallback(repository, input);
    for (const result of lexicalResults) {
      const existing = results.get(result.memory.id);
      if (existing === undefined || result.score > existing.score) {
        results.set(result.memory.id, result);
      }
    }
  }

  return [...results.values()]
    .sort(
      (first, second) =>
        second.score - first.score || first.memory.id.localeCompare(second.memory.id),
    )
    .slice(0, input.limit);
}

async function searchMemoriesByLexicalFallback(
  repository: GameRepository,
  input: {
    query: string;
    filters: MemorySearchFilters;
    characterId: string;
    limit: number;
  },
): Promise<MemorySearchResult[]> {
  const queryTokens = tokenizeForLexicalSearch(input.query);
  if (queryTokens.length === 0) {
    return [];
  }

  const memories = await repository.listMemories();
  return memories
    .filter((memory) => matchesMemoryFiltersIgnoringEmbedding(memory, input.filters))
    .filter((memory) => canCharacterSeeMemory(memory, input.characterId))
    .map((memory) => ({
      memory,
      score: lexicalMemoryScore(memory, queryTokens),
    }))
    .filter((result) => result.score >= LEXICAL_SCORE_FLOOR)
    .sort(
      (first, second) =>
        second.score - first.score || first.memory.id.localeCompare(second.memory.id),
    )
    .slice(0, input.limit);
}

function matchesMemoryFiltersIgnoringEmbedding(
  memory: MemoryRecord,
  filters: MemorySearchFilters,
): boolean {
  return (
    matchesSubjectFilter(memory, filters.subjectIds) &&
    matchesSingleFilter(memory.pairId, filters.pairId) &&
    matchesSingleFilter(memory.scenarioId, filters.scenarioId) &&
    matchesSingleFilter(memory.dateSessionId, filters.dateSessionId) &&
    matchesListFilter(memory.scope, filters.scopes) &&
    matchesListFilter(memory.visibility, filters.visibilities) &&
    matchesTags(memory.tags, filters.tags)
  );
}

function lexicalMemoryScore(memory: MemoryRecord, queryTokens: readonly string[]): number {
  const memoryTokens = new Set(tokenizeForLexicalSearch(memory.text));
  if (memoryTokens.size === 0) {
    return 0;
  }

  let hits = 0;
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) {
      hits += 1;
    }
  }

  if (hits === 0) {
    return 0;
  }

  const coverage = hits / queryTokens.length;
  return coverage * (1 + memory.importance / 10);
}

function tokenizeForLexicalSearch(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().match(/[a-z0-9_]{3,}/g) ?? []));
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
