import type {
  DateSession,
  DateMessage,
  GameSave,
  Member,
  MemoryRecord,
  MemoryScope,
  MemoryVisibility,
  PairState,
  ScenarioDeckState,
  ShiftState,
} from "../domain/game";

export type MemoryViewer =
  | {
      role: "character";
      memberId: string;
    }
  | {
      role: "judge";
    };

export type MemorySearchFilters = {
  subjectIds?: string[];
  pairId?: string;
  scenarioId?: string;
  dateSessionId?: string;
  scopes?: MemoryScope[];
  visibilities?: MemoryVisibility[];
  tags?: string[];
  embeddingModel?: string;
  embeddingDimensions?: number;
  viewer: MemoryViewer;
};

export type MemorySearchResult = {
  memory: MemoryRecord;
  score: number;
};

export interface GameRepository {
  loadGame(): Promise<GameSave | null>;
  saveGame(save: GameSave): Promise<void>;
  resetGame(now?: Date): Promise<GameSave>;
  deleteSave(): Promise<void>;
  listMembers(): Promise<Member[]>;
  saveMember(member: Member): Promise<void>;
  getActiveShift(): Promise<ShiftState | null>;
  saveShift(shift: ShiftState): Promise<void>;
  saveActiveScenarioDeck(scenarioDeck: ScenarioDeckState): Promise<void>;
  listPairStates(): Promise<PairState[]>;
  getPairState(pairId: string): Promise<PairState | null>;
  savePairState(pairState: PairState): Promise<void>;
  listDateSessions(): Promise<DateSession[]>;
  getDateSession(dateSessionId: string): Promise<DateSession | null>;
  saveDateSession(dateSession: DateSession): Promise<void>;
  appendDateMessage(dateSessionId: string, message: DateMessage): Promise<DateSession>;
  listMemories(): Promise<MemoryRecord[]>;
  saveMemory(memory: MemoryRecord): Promise<void>;
  saveMemories(memories: MemoryRecord[]): Promise<void>;
  searchMemoriesByVector(
    embedding: number[],
    filters: MemorySearchFilters,
    limit: number,
  ): Promise<MemorySearchResult[]>;
}
