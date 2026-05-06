import { z } from "zod";

import {
  dateMessageSchema,
  dateSessionSchema,
  gameConfigSchema,
  gameSaveSchema,
  memberSchema,
  memberStateSchema,
  memoryRecordSchema,
  pairStateSchema,
  SAVE_SCHEMA_VERSION,
  scenarioDeckStateSchema,
  shiftStateSchema,
  type DateMessage,
  type DateSession,
  type GameConfig,
  type GameSave,
  type Member,
  type MemoryRecord,
  type PairState,
  type ScenarioDeckState,
  type ShiftState,
} from "../domain/game";
import { starterMembers } from "../fixtures";
import {
  createSeedGameSave,
  getActiveShift,
  hydrateFixtureOwnedMemberData,
} from "../services/game-seed";
import { replaceById } from "../services/utils";
import { cosineSimilarity } from "../services/vector-memory";
import type { GameRepository, KeyValueStorage, MemorySearchFilters } from "./game-repository";

const SAVE_KEY_PREFIX = "idc.cupid.save.v";
export const CURRENT_SAVE_KEY = `${SAVE_KEY_PREFIX}${SAVE_SCHEMA_VERSION}`;
export const LEGACY_SAVE_KEYS = Array.from(
  { length: Math.max(0, SAVE_SCHEMA_VERSION - 1) },
  (_, index) => `${SAVE_KEY_PREFIX}${index + 1}`,
);

const DEFAULT_SAVE_KEY = CURRENT_SAVE_KEY;

const persistedSaveWithLooseMembersSchema = gameSaveSchema.extend({
  members: z.array(
    z
      .object({
        id: z.string().min(1),
        state: memberStateSchema.optional(),
      })
      .passthrough(),
  ),
});

export function readGameConfigFromStorage(
  storage: KeyValueStorage,
  saveKey = DEFAULT_SAVE_KEY,
): GameConfig {
  const raw = storage.getItem(saveKey);

  if (raw === null) {
    return gameConfigSchema.parse({});
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null || !("config" in parsed)) {
      return gameConfigSchema.parse({});
    }

    return gameConfigSchema.parse(parsed.config);
  } catch {
    return gameConfigSchema.parse({});
  }
}

export class MemoryStorageDriver implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

export function createBrowserStorageDriver(): KeyValueStorage {
  if (typeof window === "undefined") {
    return new MemoryStorageDriver();
  }

  return window.localStorage;
}

export class LocalGameRepository implements GameRepository {
  private readonly legacySaveKeys: string[];

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly saveKey = DEFAULT_SAVE_KEY,
    legacySaveKeys?: string[],
  ) {
    this.legacySaveKeys = legacySaveKeys ?? (saveKey === DEFAULT_SAVE_KEY ? LEGACY_SAVE_KEYS : []);
  }

  async loadGame(): Promise<GameSave | null> {
    const currentSave = this.loadGameFromKey(this.saveKey);

    if (currentSave !== null) {
      if (currentSave.needsWrite) {
        this.writeGameToKey(this.saveKey, currentSave.save);
      }

      return currentSave.save;
    }

    for (const legacySaveKey of this.legacySaveKeys) {
      const legacySave = this.loadGameFromKey(legacySaveKey);

      if (legacySave === null) {
        continue;
      }

      this.writeGameToKey(this.saveKey, legacySave.save);
      this.storage.removeItem(legacySaveKey);
      this.deleteLegacySaves();
      return legacySave.save;
    }

    return null;
  }

  async saveGame(save: GameSave): Promise<void> {
    this.writeGameToKey(this.saveKey, { ...save, updatedAt: new Date().toISOString() });
    this.deleteLegacySaves();
  }

  async resetGame(now = new Date()): Promise<GameSave> {
    const save = createSeedGameSave(now);
    await this.saveGame(save);
    return save;
  }

  async deleteSave(): Promise<void> {
    this.storage.removeItem(this.saveKey);
    this.deleteLegacySaves();
  }

  async listMembers(): Promise<Member[]> {
    return (await this.requireGame()).members;
  }

  async saveMember(member: Member): Promise<void> {
    const parsedMember = memberSchema.parse(member);
    await this.updateSave((save) => ({
      ...save,
      members: replaceById(save.members, parsedMember),
    }));
  }

  async getActiveShift(): Promise<ShiftState | null> {
    const save = await this.loadGame();
    return save === null ? null : getActiveShift(save);
  }

  async saveShift(shift: ShiftState): Promise<void> {
    const parsedShift = shiftStateSchema.parse(shift);
    await this.updateSave((save) => ({
      ...save,
      shifts: replaceById(save.shifts, parsedShift),
    }));
  }

  async saveActiveScenarioDeck(scenarioDeck: ScenarioDeckState): Promise<void> {
    const parsedScenarioDeck = scenarioDeckStateSchema.parse(scenarioDeck);
    await this.updateSave((save) => {
      const activeShift = getActiveShift(save);
      const nextShift = {
        ...activeShift,
        scenarioDeck: parsedScenarioDeck,
      };

      return {
        ...save,
        shifts: replaceById(save.shifts, nextShift),
      };
    });
  }

  async listPairStates(): Promise<PairState[]> {
    return (await this.requireGame()).pairStates;
  }

  async getPairState(pairId: string): Promise<PairState | null> {
    return (
      (await this.requireGame()).pairStates.find((pairState) => pairState.id === pairId) ?? null
    );
  }

  async savePairState(pairState: PairState): Promise<void> {
    const parsedPairState = pairStateSchema.parse(pairState);
    await this.updateSave((save) => ({
      ...save,
      pairStates: replaceById(save.pairStates, parsedPairState),
    }));
  }

  async listDateSessions(): Promise<DateSession[]> {
    return (await this.requireGame()).dateSessions;
  }

  async getDateSession(dateSessionId: string): Promise<DateSession | null> {
    return (
      (await this.requireGame()).dateSessions.find((session) => session.id === dateSessionId) ??
      null
    );
  }

  async saveDateSession(dateSession: DateSession): Promise<void> {
    const parsedDateSession = dateSessionSchema.parse(dateSession);
    await this.updateSave((save) => ({
      ...save,
      dateSessions: replaceById(save.dateSessions, parsedDateSession),
    }));
  }

  async appendDateMessage(dateSessionId: string, message: DateMessage): Promise<DateSession> {
    const parsedMessage = dateMessageSchema.parse(message);
    let nextDateSession: DateSession | null = null;

    await this.updateSave((save) => {
      const existingSession = save.dateSessions.find((session) => session.id === dateSessionId);

      if (existingSession === undefined) {
        throw new Error(`Date session not found: ${dateSessionId}`);
      }

      const updatedSession = dateSessionSchema.parse({
        ...existingSession,
        transcript: [...existingSession.transcript, parsedMessage],
        currentTurn:
          parsedMessage.kind === "character"
            ? existingSession.currentTurn + 1
            : existingSession.currentTurn,
      });
      nextDateSession = updatedSession;

      return {
        ...save,
        dateSessions: replaceById(save.dateSessions, updatedSession),
      };
    });

    if (nextDateSession === null) {
      throw new Error(`Date session not found: ${dateSessionId}`);
    }

    return nextDateSession;
  }

  async listMemories(): Promise<MemoryRecord[]> {
    return (await this.requireGame()).memories;
  }

  async saveMemory(memory: MemoryRecord): Promise<void> {
    const parsedMemory = memoryRecordSchema.parse(memory);
    await this.updateSave((save) => ({
      ...save,
      memories: replaceById(save.memories, parsedMemory),
    }));
  }

  async saveMemories(memories: MemoryRecord[]): Promise<void> {
    const parsedMemories = memories.map((memory) => memoryRecordSchema.parse(memory));
    await this.updateSave((save) => {
      let nextMemories = save.memories;

      for (const memory of parsedMemories) {
        nextMemories = replaceById(nextMemories, memory);
      }

      return { ...save, memories: nextMemories };
    });
  }

  async searchMemoriesByVector(
    embedding: number[],
    filters: MemorySearchFilters,
    limit: number,
  ): Promise<Array<{ memory: MemoryRecord; score: number }>> {
    const save = await this.requireGame();

    return save.memories
      .filter((memory) => matchesMemoryFilters(memory, filters))
      .filter((memory) => memory.embedding !== undefined)
      .map((memory) => ({
        memory,
        score: cosineSimilarity(embedding, memory.embedding ?? []),
      }))
      .sort(
        (first, second) =>
          second.score - first.score || first.memory.id.localeCompare(second.memory.id),
      )
      .slice(0, limit);
  }

  private async requireGame(): Promise<GameSave> {
    const save = await this.loadGame();

    if (save !== null) {
      return save;
    }

    return this.resetGame();
  }

  private async updateSave(mutator: (save: GameSave) => GameSave): Promise<void> {
    const save = await this.requireGame();
    await this.saveGame(mutator(save));
  }

  private loadGameFromKey(saveKey: string): { save: GameSave; needsWrite: boolean } | null {
    const raw = this.storage.getItem(saveKey);

    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    const parsedSave = parsePersistedGameSave(parsed);
    const hydratedSave = hydrateFixtureOwnedMemberData(parsedSave.save);

    return {
      save: hydratedSave,
      needsWrite:
        parsedSave.migrated || JSON.stringify(parsedSave.save) !== JSON.stringify(hydratedSave),
    };
  }

  private writeGameToKey(saveKey: string, save: GameSave): void {
    const parsed = gameSaveSchema.parse(save);
    this.storage.setItem(saveKey, JSON.stringify(parsed));
  }

  private deleteLegacySaves(): void {
    for (const legacySaveKey of this.legacySaveKeys) {
      this.storage.removeItem(legacySaveKey);
    }
  }
}

function parsePersistedGameSave(parsed: unknown): { save: GameSave; migrated: boolean } {
  const currentSave = gameSaveSchema.safeParse(parsed);

  if (currentSave.success) {
    return migrateDefaultLocalAiConfig(currentSave.data, false);
  }

  const looseSave = persistedSaveWithLooseMembersSchema.parse(parsed);
  const savedMemberStateById = new Map(
    looseSave.members
      .filter((member) => member.state !== undefined)
      .map((member) => [member.id, member.state] as const),
  );
  const starterMemberIds = new Set(starterMembers.map((member) => member.id));
  const migratedFixtureMembers = starterMembers.map((fixtureMember) => {
    const parsedFixtureMember = memberSchema.parse(fixtureMember);
    const savedState = savedMemberStateById.get(parsedFixtureMember.id);

    if (savedState === undefined) {
      return parsedFixtureMember;
    }

    return memberSchema.parse({
      ...parsedFixtureMember,
      state: savedState,
    });
  });
  const customMembers: Member[] = [];

  for (const savedMember of looseSave.members) {
    if (starterMemberIds.has(savedMember.id)) {
      continue;
    }

    const parsedMember = memberSchema.safeParse(savedMember);

    if (parsedMember.success) {
      customMembers.push(parsedMember.data);
    }
  }

  return migrateDefaultLocalAiConfig(
    gameSaveSchema.parse({
      ...looseSave,
      members: [...migratedFixtureMembers, ...customMembers],
    }),
    true,
  );
}

function migrateDefaultLocalAiConfig(
  save: GameSave,
  alreadyMigrated: boolean,
): { save: GameSave; migrated: boolean } {
  return { save, migrated: alreadyMigrated };
}

function matchesMemoryFilters(memory: MemoryRecord, filters: MemorySearchFilters): boolean {
  return (
    matchesViewer(memory, filters.viewer) &&
    matchesSubjectFilter(memory, filters.subjectIds) &&
    matchesSingleFilter(memory.pairId, filters.pairId) &&
    matchesSingleFilter(memory.scenarioId, filters.scenarioId) &&
    matchesSingleFilter(memory.dateSessionId, filters.dateSessionId) &&
    matchesListFilter(memory.scope, filters.scopes) &&
    matchesListFilter(memory.visibility, filters.visibilities) &&
    matchesSingleFilter(memory.embeddingModel, filters.embeddingModel) &&
    matchesNumberFilter(memory.embeddingDimensions, filters.embeddingDimensions) &&
    matchesTags(memory.tags, filters.tags)
  );
}

function matchesViewer(memory: MemoryRecord, viewer: MemorySearchFilters["viewer"]): boolean {
  if (viewer.role === "judge") {
    return true;
  }

  if (memory.visibility === "judge_only") {
    return false;
  }

  if (memory.visibility === "public") {
    return true;
  }

  return (memory.visibleToMemberIds ?? memory.subjectIds).includes(viewer.memberId);
}

function matchesSubjectFilter(memory: MemoryRecord, subjectIds: string[] | undefined): boolean {
  if (subjectIds === undefined || subjectIds.length === 0) {
    return true;
  }

  return subjectIds.some((subjectId) => memory.subjectIds.includes(subjectId));
}

function matchesSingleFilter(value: string | undefined, filter: string | undefined): boolean {
  return filter === undefined || value === filter;
}

function matchesNumberFilter(value: number | undefined, filter: number | undefined): boolean {
  return filter === undefined || value === filter;
}

function matchesListFilter<TValue extends string>(
  value: TValue,
  filter: TValue[] | undefined,
): boolean {
  return filter === undefined || filter.length === 0 || filter.includes(value);
}

function matchesTags(memoryTags: string[], filterTags: string[] | undefined): boolean {
  if (filterTags === undefined || filterTags.length === 0) {
    return true;
  }

  return filterTags.every((tag) => memoryTags.includes(tag));
}
