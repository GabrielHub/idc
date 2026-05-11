import {
  dateMessageSchema,
  dateSessionSchema,
  gameConfigSchema,
  gameSaveSchema,
  memberSchema,
  memoryRecordSchema,
  pairStateSchema,
  SAVE_SCHEMA_VERSION,
  scenarioDeckSchema,
  shiftStateSchema,
  type DateMessage,
  type DateSession,
  type GameConfig,
  type GameSave,
  type Member,
  type MemoryRecord,
  type PairState,
  type ScenarioDeck,
  type ShiftState,
} from "../domain/game";
import {
  createSeedGameSave,
  getActiveShift,
  hydrateFixtureOwnedMemberData,
} from "../services/game-seed";
import { pushIntoBucket, replaceById } from "../services/utils";
import { cosineSimilarity } from "../services/vector-memory";
import type { GameRepository, MemorySearchFilters } from "./game-repository";
import type { RawSaveStore } from "./raw-save-store";

const SAVE_KEY_PREFIX = "idc.cupid.save.v";
export const CURRENT_SAVE_KEY = `${SAVE_KEY_PREFIX}${SAVE_SCHEMA_VERSION}`;
export const LEGACY_SAVE_KEYS = Array.from(
  { length: Math.max(0, SAVE_SCHEMA_VERSION - 1) },
  (_, index) => `${SAVE_KEY_PREFIX}${index + 1}`,
);

const DEFAULT_SAVE_KEY = CURRENT_SAVE_KEY;
const DEFAULT_WRITE_DEBOUNCE_MS = 750;
const TRANSCRIPT_ARCHIVE_SUFFIX = ".transcript.";

export type LocalGameRepositoryOptions = {
  // Set to 0 in tests to make writes synchronous.
  writeDebounceMs?: number;
};

export async function readGameConfigFromStore(
  store: RawSaveStore,
  saveKey = DEFAULT_SAVE_KEY,
): Promise<GameConfig> {
  const raw = await store.read(saveKey);

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

type MemoryIndex = {
  all: readonly MemoryRecord[];
  byPairId: Map<string, MemoryRecord[]>;
  byScenarioId: Map<string, MemoryRecord[]>;
  bySubjectId: Map<string, MemoryRecord[]>;
};

export class LocalGameRepository implements GameRepository {
  private readonly legacySaveKeys: string[];
  private readonly writeDebounceMs: number;
  private legacySavesCleared = false;

  private cachedSave: GameSave | null = null;
  private memoryIndex: MemoryIndex | null = null;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private writeInFlight: Promise<void> | null = null;
  private pendingFlush: Promise<void> | null = null;
  private flushHooksAbort: AbortController | null = null;
  private readonly archivedTranscriptIds: Set<string> = new Set();

  constructor(
    private readonly store: RawSaveStore,
    private readonly saveKey = DEFAULT_SAVE_KEY,
    legacySaveKeys?: string[],
    options: LocalGameRepositoryOptions = {},
  ) {
    this.legacySaveKeys = legacySaveKeys ?? (saveKey === DEFAULT_SAVE_KEY ? LEGACY_SAVE_KEYS : []);
    this.writeDebounceMs = options.writeDebounceMs ?? DEFAULT_WRITE_DEBOUNCE_MS;
  }

  async loadGame(): Promise<GameSave | null> {
    if (this.cachedSave !== null) {
      return this.cachedSave;
    }

    const currentSave = await this.loadGameFromKey(this.saveKey);

    if (currentSave !== null) {
      this.cachedSave = currentSave.save;
      if (currentSave.needsWrite) {
        // Migration writes bypass the debouncer so old-schema bytes never linger.
        await this.runWriteNow(currentSave.save);
      }
      return currentSave.save;
    }

    for (const legacySaveKey of this.legacySaveKeys) {
      const rawLegacySave = await this.store.read(legacySaveKey);

      if (rawLegacySave !== null) {
        throw new Error(
          `Unsupported local save key ${legacySaveKey}. Alpha saves start fresh after schema changes.`,
        );
      }
    }

    return null;
  }

  async saveGame(save: GameSave): Promise<void> {
    const stamped = stampUpdatedAt(save);
    this.cachedSave = stamped;

    if (this.writeDebounceMs <= 0) {
      await this.runWriteNow(stamped);
      return;
    }

    this.scheduleWrite();
  }

  async replaceGame(save: GameSave): Promise<GameSave> {
    const stamped = stampUpdatedAt(save);
    this.cancelScheduledWrite();
    await this.settleWriteInFlight();
    await this.deleteTranscriptArchivesForSaveKey(this.saveKey);
    this.archivedTranscriptIds.clear();
    this.memoryIndex = null;
    this.cachedSave = stamped;
    await this.runWriteNow(stamped);
    return stamped;
  }

  async resetGame(now = new Date()): Promise<GameSave> {
    const save = createSeedGameSave(now);
    this.cancelScheduledWrite();
    await this.settleWriteInFlight();
    await this.deleteTranscriptArchivesForSaveKey(this.saveKey);
    this.archivedTranscriptIds.clear();
    this.memoryIndex = null;
    this.cachedSave = save;
    await this.runWriteNow(save);
    return save;
  }

  async deleteSave(): Promise<void> {
    this.cancelScheduledWrite();
    await this.settleWriteInFlight();
    this.cachedSave = null;
    this.memoryIndex = null;
    this.archivedTranscriptIds.clear();
    if (this.flushHooksAbort !== null) {
      this.flushHooksAbort.abort();
      this.flushHooksAbort = null;
    }
    await this.deleteTranscriptArchivesForSaveKey(this.saveKey);
    await Promise.all(
      this.legacySaveKeys.map((legacySaveKey) =>
        this.deleteTranscriptArchivesForSaveKey(legacySaveKey),
      ),
    );
    await this.store.delete(this.saveKey);
    await this.deleteLegacySaves();
  }

  async backupSave(now: Date = new Date()): Promise<string | null> {
    await this.flush();

    const source = await this.findSaveToBackup();

    if (source === null) {
      return null;
    }

    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const backupKey = `${source.key}.bak.${stamp}`;
    const backupRaw = await this.rawForBackup(source);

    try {
      await this.store.write(backupKey, backupRaw);
      return backupKey;
    } catch {
      return null;
    }
  }

  async flush(): Promise<void> {
    // Coalesce concurrent flush callers (browser hooks fire beforeunload +
    // pagehide back-to-back). The shared promise reads the latest cachedSave
    // at write time, so callers between the start and end of a flush still
    // get their state persisted.
    if (this.pendingFlush !== null) return this.pendingFlush;
    this.pendingFlush = this.runFlush().finally(() => {
      this.pendingFlush = null;
    });
    return this.pendingFlush;
  }

  private async runFlush(): Promise<void> {
    if (this.writeTimer !== null) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    if (this.cachedSave === null) {
      if (this.writeInFlight !== null) await this.writeInFlight;
      return;
    }
    await this.runWriteNow(this.cachedSave);
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

  async saveScenarioDeck(scenarioDeck: ScenarioDeck): Promise<void> {
    const parsedScenarioDeck = scenarioDeckSchema.parse(scenarioDeck);
    await this.updateSave((save) => ({
      ...save,
      scenarioDeck: parsedScenarioDeck,
    }));
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
    const index = this.getMemoryIndex(save);
    const candidates = pickIndexedCandidates(index, filters);

    const results: Array<{ memory: MemoryRecord; score: number }> = [];
    for (const memory of candidates) {
      if (memory.embedding === undefined) continue;
      if (!matchesMemoryFilters(memory, filters)) continue;
      results.push({
        memory,
        score: cosineSimilarity(embedding, memory.embedding),
      });
    }

    results.sort(
      (first, second) =>
        second.score - first.score || first.memory.id.localeCompare(second.memory.id),
    );
    return results.slice(0, limit);
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

  private async findSaveToBackup(): Promise<{ key: string; raw: string } | null> {
    for (const key of [this.saveKey, ...this.legacySaveKeys]) {
      const raw = await this.store.read(key);

      if (raw !== null) {
        return { key, raw };
      }
    }

    return null;
  }

  private async rawForBackup(source: { key: string; raw: string }): Promise<string> {
    try {
      const parsed: unknown = JSON.parse(source.raw);
      const parsedSave = gameSaveSchema.parse(parsed);
      const restored = await this.restoreArchivedTranscriptsForKey(source.key, parsedSave, false);
      const hydrated = hydrateFixtureOwnedMemberData(restored.save);
      return JSON.stringify(hydrated.save);
    } catch {
      return source.raw;
    }
  }

  private async loadGameFromKey(
    saveKey: string,
  ): Promise<{ save: GameSave; needsWrite: boolean } | null> {
    const raw = await this.store.read(saveKey);

    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    const parsedSave = gameSaveSchema.parse(parsed);
    const restored = await this.restoreArchivedTranscriptsForKey(saveKey, parsedSave, true);
    const hydrationResult = hydrateFixtureOwnedMemberData(restored.save);

    return {
      save: hydrationResult.save,
      needsWrite: hydrationResult.dirty || restored.restoredAny,
    };
  }

  private async writeGameToKey(saveKey: string, save: GameSave): Promise<void> {
    const parsed = gameSaveSchema.parse(save);
    const persistable = await this.archiveCompletedTranscripts(parsed);
    await this.store.write(saveKey, JSON.stringify(persistable));
  }

  private async deleteLegacySaves(): Promise<void> {
    for (const legacySaveKey of this.legacySaveKeys) {
      await this.store.delete(legacySaveKey);
    }
    this.legacySavesCleared = true;
  }

  // -- Cache + debouncer plumbing -----------------------------------

  private cancelScheduledWrite(): void {
    if (this.writeTimer === null) return;
    clearTimeout(this.writeTimer);
    this.writeTimer = null;
  }

  private async settleWriteInFlight(): Promise<void> {
    if (this.writeInFlight === null) return;
    try {
      await this.writeInFlight;
    } catch {
      return;
    }
  }

  private scheduleWrite(): void {
    if (this.writeTimer !== null) return;
    this.installFlushHooks();
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      const save = this.cachedSave;
      if (save === null) return;
      void this.runWriteNow(save);
    }, this.writeDebounceMs);
  }

  private async runWriteNow(save: GameSave): Promise<void> {
    this.cancelScheduledWrite();
    const previousWrite = this.writeInFlight ?? Promise.resolve();
    const writePromise = previousWrite
      .catch(() => {})
      .then(async () => {
        // Persist the latest cached save, not the one we were scheduled
        // with: any saveGame between scheduling and writing has already
        // updated cachedSave.
        const latest = this.cachedSave ?? save;
        await this.writeGameToKey(this.saveKey, latest);
        if (!this.legacySavesCleared) {
          await this.deleteLegacySaves();
        }
      });
    const trackedWrite = writePromise.finally(() => {
      if (this.writeInFlight === trackedWrite) {
        this.writeInFlight = null;
      }
    });
    this.writeInFlight = trackedWrite;
    await this.writeInFlight;
  }

  private installFlushHooks(): void {
    if (this.flushHooksAbort !== null) return;
    if (typeof window === "undefined") return;
    const controller = new AbortController();
    this.flushHooksAbort = controller;
    const flush = () => {
      void this.flush();
    };
    // beforeunload + pagehide cover navigation/tab close. visibilitychange
    // catches tab-hide on mobile where pagehide is unreliable.
    window.addEventListener("beforeunload", flush, { signal: controller.signal });
    window.addEventListener("pagehide", flush, { signal: controller.signal });
    if (typeof document !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.visibilityState === "hidden") flush();
        },
        { signal: controller.signal },
      );
    }
  }

  // -- Memory index -------------------------------------------------

  private getMemoryIndex(save: GameSave): MemoryIndex {
    if (this.memoryIndex !== null && this.memoryIndex.all === save.memories) {
      return this.memoryIndex;
    }
    this.memoryIndex = buildMemoryIndex(save.memories);
    return this.memoryIndex;
  }

  // -- Transcript archive -------------------------------------------

  private transcriptArchiveKey(dateSessionId: string): string {
    return this.transcriptArchiveKeyForSaveKey(this.saveKey, dateSessionId);
  }

  private transcriptArchiveKeyForSaveKey(saveKey: string, dateSessionId: string): string {
    return `${saveKey}${TRANSCRIPT_ARCHIVE_SUFFIX}${dateSessionId}`;
  }

  private async deleteTranscriptArchivesForSaveKey(saveKey: string): Promise<void> {
    const archiveKeys = await this.store.listKeys(`${saveKey}${TRANSCRIPT_ARCHIVE_SUFFIX}`);
    await Promise.all(archiveKeys.map((archiveKey) => this.store.delete(archiveKey)));
  }

  private async archiveCompletedTranscripts(save: GameSave): Promise<GameSave> {
    const pending: Array<{ index: number; id: string; json: string }> = [];
    for (let index = 0; index < save.dateSessions.length; index += 1) {
      const session = save.dateSessions[index];
      if (session.status === "active") continue;
      if (session.transcript.length === 0) {
        continue;
      }
      if (!this.archivedTranscriptIds.has(session.id)) {
        pending.push({
          index,
          id: session.id,
          json: JSON.stringify(session.transcript),
        });
      } else {
        pending.push({ index, id: session.id, json: "" });
      }
    }
    if (pending.length === 0) return save;

    const archiveResults = await Promise.all(
      pending.map(async (entry) => {
        if (entry.json === "") return { entry, ok: true };
        try {
          await this.store.write(this.transcriptArchiveKey(entry.id), entry.json);
          this.archivedTranscriptIds.add(entry.id);
          return { entry, ok: true };
        } catch {
          // If the archive write fails, leave the transcript in the live
          // save and retry on the next flush.
          return { entry, ok: false };
        }
      }),
    );

    let mutated: GameSave | null = null;
    for (const { entry, ok } of archiveResults) {
      if (!ok) continue;
      if (mutated === null) {
        mutated = { ...save, dateSessions: [...save.dateSessions] };
      }
      mutated.dateSessions[entry.index] = {
        ...save.dateSessions[entry.index],
        transcript: [],
      };
    }
    return mutated ?? save;
  }

  private async restoreArchivedTranscriptsForKey(
    saveKey: string,
    save: GameSave,
    markArchived: boolean,
  ): Promise<{ save: GameSave; restoredAny: boolean }> {
    const candidates: Array<{ index: number; id: string }> = [];
    for (let index = 0; index < save.dateSessions.length; index += 1) {
      const session = save.dateSessions[index];
      const isCompleted = session.status === "completed" || session.status === "ended_early";
      if (!isCompleted) continue;
      // Inline transcript still present from older save formats; archived on next flush.
      if (session.transcript.length > 0) continue;
      candidates.push({ index, id: session.id });
    }
    if (candidates.length === 0) return { save, restoredAny: false };

    const restored = await Promise.all(
      candidates.map(async (entry) => ({
        entry,
        archived: await this.readTranscriptArchive(saveKey, entry.id),
      })),
    );

    let nextSessions: DateSession[] | null = null;
    let restoredAny = false;
    for (const { entry, archived } of restored) {
      if (archived === null || archived.length === 0) continue;
      if (markArchived) {
        this.archivedTranscriptIds.add(entry.id);
      }
      if (nextSessions === null) {
        nextSessions = [...save.dateSessions];
      }
      nextSessions[entry.index] = {
        ...save.dateSessions[entry.index],
        transcript: archived,
      };
      restoredAny = true;
    }
    if (nextSessions === null) return { save, restoredAny: false };
    // Skip a Zod re-parse: archived values were schema-validated on read and the rest of save is unchanged.
    return { save: { ...save, dateSessions: nextSessions }, restoredAny };
  }

  private async readTranscriptArchive(
    saveKey: string,
    dateSessionId: string,
  ): Promise<DateMessage[] | null> {
    const raw = await this.store.read(this.transcriptArchiveKeyForSaveKey(saveKey, dateSessionId));
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const messages: DateMessage[] = [];
      for (const candidate of parsed) {
        const message = dateMessageSchema.safeParse(candidate);
        if (message.success) {
          messages.push(message.data);
        }
      }
      return messages;
    } catch {
      return null;
    }
  }
}

function stampUpdatedAt(save: GameSave): GameSave {
  return { ...save, updatedAt: new Date().toISOString() };
}

function buildMemoryIndex(memories: readonly MemoryRecord[]): MemoryIndex {
  const byPairId = new Map<string, MemoryRecord[]>();
  const byScenarioId = new Map<string, MemoryRecord[]>();
  const bySubjectId = new Map<string, MemoryRecord[]>();
  for (const memory of memories) {
    if (memory.pairId !== undefined) {
      pushIntoBucket(byPairId, memory.pairId, memory);
    }
    if (memory.scenarioId !== undefined) {
      pushIntoBucket(byScenarioId, memory.scenarioId, memory);
    }
    for (const subjectId of memory.subjectIds) {
      pushIntoBucket(bySubjectId, subjectId, memory);
    }
  }
  return { all: memories, byPairId, byScenarioId, bySubjectId };
}

function pickIndexedCandidates(
  index: MemoryIndex,
  filters: MemorySearchFilters,
): readonly MemoryRecord[] {
  if (filters.pairId !== undefined) {
    return index.byPairId.get(filters.pairId) ?? [];
  }
  if (filters.scenarioId !== undefined) {
    return index.byScenarioId.get(filters.scenarioId) ?? [];
  }
  if (filters.subjectIds !== undefined && filters.subjectIds.length > 0) {
    const seed = filters.subjectIds[0];
    return index.bySubjectId.get(seed) ?? [];
  }
  return index.all;
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
