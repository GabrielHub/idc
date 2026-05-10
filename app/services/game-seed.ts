import {
  gameConfigSchema,
  gameSaveSchema,
  memberSchema,
  SAVE_SCHEMA_VERSION,
  scenarioDeckStateSchema,
  shiftStateSchema,
  type DateSession,
  type DeckPowerUsage,
  type GameSave,
  type Member,
  type MemoryRecord,
  type PairState,
  type PairStats,
  type ScenarioDeckState,
  type ShiftState,
} from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import {
  hydrateFeaturedMemberIds,
  selectFeaturedMemberIds,
  selectFeaturedMemberRequestIds,
  selectShiftCompanyGoalIds,
} from "./shift-planning";
import { arraysShallowEqual, clampScore } from "./utils";

const STARTER_DECK_MAX_SIZE = starterScenarios.length;
const STARTER_SCENARIO_IDS = starterScenarios.map((scenario) => scenario.id);
const SCENARIO_ID_REPLACEMENTS: Record<string, string> = {
  "alternate-ex-double-date": "phantom-doorbell-suite",
};

export type CreateSeedGameSaveOptions = {
  randomizeScenarioDeck?: boolean;
  random?: () => number;
};

export function createSeedGameSave(
  now = new Date(),
  options: CreateSeedGameSaveOptions = {},
): GameSave {
  const timestamp = now.toISOString();
  const random = options.random ?? Math.random;
  const config = gameConfigSchema.parse({});
  const members = STARTER_FIXTURE_MEMBERS;
  const pairStates = createSeedPairStates(members);
  const scenarioIds =
    options.randomizeScenarioDeck === true
      ? shuffleScenarioIds(STARTER_SCENARIO_IDS, random)
      : [...STARTER_SCENARIO_IDS];
  const featuredMemberIds = selectFeaturedMemberIds({
    members,
    random,
  });
  const drawnScenarioIds = scenarioIds.slice(0, config.shiftDateSlots);
  const offeredScenarioIds = scenarioIds.slice(config.shiftDateSlots, config.shiftDateSlots * 2);
  const activeShift: ShiftState = {
    id: "shift-1",
    shiftNumber: 1,
    status: "active",
    dateSlotsTotal: config.shiftDateSlots,
    dateSlotsUsed: 0,
    featuredMemberIds,
    drawnScenarioIds,
    companyGoalIds: selectShiftCompanyGoalIds({
      members,
      shiftNumber: 1,
      dateSlotsTotal: config.shiftDateSlots,
    }),
    memberRequestIds: selectFeaturedMemberRequestIds({
      members,
      featuredMemberIds,
      shiftNumber: 1,
    }),
    scenarioDeck: {
      scenarioIds,
      maxSize: STARTER_DECK_MAX_SIZE,
      offeredScenarioIds,
    },
    startedAt: timestamp,
  };

  return gameSaveSchema.parse({
    version: SAVE_SCHEMA_VERSION,
    config,
    members,
    pairStates,
    dateSessions: [],
    shifts: [activeShift],
    activeShiftId: activeShift.id,
    memories: createStarterMemories(timestamp),
    playerKnowledge: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export type HydrateFixtureOwnedMemberDataResult = {
  save: GameSave;
  // True when hydration changed any field; the repository uses this to decide whether to write back.
  dirty: boolean;
};

export function hydrateFixtureOwnedMemberData(save: GameSave): HydrateFixtureOwnedMemberDataResult {
  const fixtureMembers = STARTER_FIXTURE_MEMBERS;
  const savedMembersById = new Map(save.members.map((member) => [member.id, member] as const));
  let dirty = false;

  const hydratedFixtureMembers = fixtureMembers.map((fixtureMember) => {
    const savedMember = savedMembersById.get(fixtureMember.id);

    if (savedMember === undefined) {
      dirty = true;
      return fixtureMember;
    }

    // Skip the schema parse when the saved member already matches the fixture; parse is the hot cost.
    if (fixtureMemberMatchesState(fixtureMember, savedMember)) {
      return savedMember;
    }

    dirty = true;
    return memberSchema.parse({
      ...fixtureMember,
      state: savedMember.state,
    });
  });
  const customMembers: Member[] = [];
  for (const member of save.members) {
    if (!STARTER_MEMBERS_BY_ID.has(member.id)) {
      customMembers.push(member);
    }
  }
  const members =
    customMembers.length === 0
      ? hydratedFixtureMembers
      : [...hydratedFixtureMembers, ...customMembers];

  if (save.members.length !== members.length) {
    dirty = true;
  }

  const pairResult = hydratePairStates(save.pairStates, members);
  if (pairResult.dirty) dirty = true;

  const dateSessionResult = mapWithDirty(save.dateSessions, hydrateDateSessionScenarioId);
  if (dateSessionResult.dirty) dirty = true;

  const shiftsResult = mapWithDirty(
    save.shifts,
    (shift) => hydrateShiftScenarioIds(shift, members),
    shiftsEqual,
  );
  if (shiftsResult.dirty) dirty = true;

  const memoriesResult = mapWithDirty(save.memories, hydrateMemoryScenarioId);
  if (memoriesResult.dirty) dirty = true;

  if (!dirty) {
    return { save, dirty: false };
  }

  return {
    save: gameSaveSchema.parse({
      ...save,
      members,
      pairStates: pairResult.pairStates,
      dateSessions: dateSessionResult.items,
      shifts: shiftsResult.items,
      memories: memoriesResult.items,
    }),
    dirty: true,
  };
}

function fixtureMemberMatchesState(fixtureMember: Member, savedMember: Member): boolean {
  return (
    savedMember.name === fixtureMember.name &&
    savedMember.firstName === fixtureMember.firstName &&
    savedMember.origin === fixtureMember.origin &&
    savedMember.species === fixtureMember.species &&
    savedMember.dimension === fixtureMember.dimension &&
    savedMember.realityStatus === fixtureMember.realityStatus &&
    savedMember.bio === fixtureMember.bio &&
    savedMember.datingProfile === fixtureMember.datingProfile &&
    arraysShallowEqual(savedMember.tags, fixtureMember.tags) &&
    arraysShallowEqual(savedMember.preferences, fixtureMember.preferences) &&
    arraysShallowEqual(savedMember.dealbreakers, fixtureMember.dealbreakers) &&
    arraysShallowEqual(savedMember.relationshipNeeds, fixtureMember.relationshipNeeds) &&
    arraysShallowEqual(savedMember.secrets, fixtureMember.secrets) &&
    deepEqualByJson(savedMember.voice, fixtureMember.voice) &&
    deepEqualByJson(savedMember.portraits, fixtureMember.portraits) &&
    deepEqualByJson(savedMember.chatBubble, fixtureMember.chatBubble)
  );
}

function deepEqualByJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === undefined || right === undefined) return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

function mapWithDirty<T>(
  items: readonly T[],
  hydrate: (item: T) => T,
  // Defaults to reference identity (works when hydrate returns the same reference on no-op).
  equals: (before: T, after: T) => boolean = (a, b) => a === b,
): { items: T[]; dirty: boolean } {
  let dirty = false;
  const next = items.map((item) => {
    const hydrated = hydrate(item);
    if (!equals(item, hydrated)) dirty = true;
    return hydrated;
  });
  return { items: dirty ? next : (items as T[]), dirty };
}

function shiftsEqual(before: ShiftState, after: ShiftState): boolean {
  return (
    arraysShallowEqual(before.featuredMemberIds, after.featuredMemberIds) &&
    arraysShallowEqual(before.drawnScenarioIds, after.drawnScenarioIds) &&
    arraysShallowEqual(before.scenarioDeck.scenarioIds, after.scenarioDeck.scenarioIds) &&
    arraysShallowEqual(
      before.scenarioDeck.offeredScenarioIds ?? [],
      after.scenarioDeck.offeredScenarioIds ?? [],
    ) &&
    before.scenarioDeck.maxSize === after.scenarioDeck.maxSize &&
    before.heldScenarioId === after.heldScenarioId &&
    before.deckPower?.scenarioId === after.deckPower?.scenarioId &&
    before.deckPower?.swappedScenarioId === after.deckPower?.swappedScenarioId
  );
}

export function getActiveShift(save: GameSave): ShiftState {
  return (
    save.shifts.find((shift) => shift.id === save.activeShiftId) ??
    save.shifts[save.shifts.length - 1]
  );
}

const STARTER_FIXTURE_MEMBERS: Member[] = starterMembers.map((member) =>
  memberSchema.parse(member),
);

const STARTER_MEMBERS_BY_ID = new Map(
  STARTER_FIXTURE_MEMBERS.map((member) => [member.id, member] as const),
);

// Pair structure (ids, participantIds, base useCounts) only depends on the
// static fixtures, so build it once at module load. Pair stats use live
// member state and stay per-call inside hydratePairStates.
const STARTER_SEED_PAIR_STRUCTURE: ReadonlyArray<{
  id: string;
  participantIds: [string, string];
  scenarioUseCounts: Record<string, number>;
}> = (() => {
  const entries: Array<{
    id: string;
    participantIds: [string, string];
    scenarioUseCounts: Record<string, number>;
  }> = [];
  const baseUseCounts: Record<string, number> = {};
  for (const scenario of starterScenarios) {
    baseUseCounts[scenario.id] = 0;
  }
  for (let firstIndex = 0; firstIndex < STARTER_FIXTURE_MEMBERS.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < STARTER_FIXTURE_MEMBERS.length;
      secondIndex += 1
    ) {
      const first = STARTER_FIXTURE_MEMBERS[firstIndex];
      const second = STARTER_FIXTURE_MEMBERS[secondIndex];
      const participantIds = sortMemberIds(first.id, second.id);
      entries.push({
        id: makePairId(first.id, second.id),
        participantIds,
        // Defensive copy so per-pair mutations don't bleed into the cached base counts.
        scenarioUseCounts: { ...baseUseCounts },
      });
    }
  }
  return entries;
})();

function isStarterRoster(members: readonly Member[]): boolean {
  return (
    members.length === STARTER_FIXTURE_MEMBERS.length &&
    members.every((member) => STARTER_MEMBERS_BY_ID.has(member.id))
  );
}

function hydrateScenarioDeckState(scenarioDeck: ScenarioDeckState): ScenarioDeckState {
  const scenarioIds = appendMissingStarterScenarioIds(
    normalizeScenarioIds(scenarioDeck.scenarioIds),
  );

  return scenarioDeckStateSchema.parse({
    ...scenarioDeck,
    scenarioIds,
    maxSize: Math.max(scenarioDeck.maxSize, STARTER_DECK_MAX_SIZE, scenarioIds.length),
    offeredScenarioIds: normalizeScenarioIds(scenarioDeck.offeredScenarioIds),
  });
}

function hydrateShiftScenarioIds(shift: ShiftState, members: Member[]): ShiftState {
  return shiftStateSchema.parse({
    ...shift,
    featuredMemberIds: hydrateFeaturedMemberIds({ shift, members }),
    drawnScenarioIds: normalizeScenarioIds(shift.drawnScenarioIds),
    scenarioDeck: hydrateScenarioDeckState(shift.scenarioDeck),
    deckPower: hydrateDeckPowerUsage(shift.deckPower),
    heldScenarioId:
      shift.heldScenarioId === undefined
        ? undefined
        : normalizeStarterScenarioId(shift.heldScenarioId),
  });
}

function hydrateDeckPowerUsage(deckPower: DeckPowerUsage | undefined): DeckPowerUsage | undefined {
  if (deckPower === undefined) {
    return undefined;
  }

  const hydratedUsage: DeckPowerUsage = {
    ...deckPower,
    scenarioId: normalizeStarterScenarioId(deckPower.scenarioId),
  };

  if (deckPower.swappedScenarioId === undefined) {
    return hydratedUsage;
  }

  return {
    ...hydratedUsage,
    swappedScenarioId: normalizeStarterScenarioId(deckPower.swappedScenarioId),
  };
}

function appendMissingStarterScenarioIds(scenarioIds: string[]): string[] {
  const hydratedScenarioIds = [...scenarioIds];
  const existingScenarioIds = new Set(hydratedScenarioIds);

  for (const scenarioId of STARTER_SCENARIO_IDS) {
    if (existingScenarioIds.has(scenarioId)) {
      continue;
    }

    hydratedScenarioIds.push(scenarioId);
    existingScenarioIds.add(scenarioId);
  }

  return hydratedScenarioIds;
}

export function normalizeStarterScenarioId(scenarioId: string): string {
  return SCENARIO_ID_REPLACEMENTS[scenarioId] ?? scenarioId;
}

function normalizeScenarioIds(scenarioIds: readonly string[]): string[] {
  const normalizedScenarioIds: string[] = [];
  const seenScenarioIds = new Set<string>();

  for (const scenarioId of scenarioIds) {
    const normalizedScenarioId = normalizeStarterScenarioId(scenarioId);

    if (seenScenarioIds.has(normalizedScenarioId)) {
      continue;
    }

    normalizedScenarioIds.push(normalizedScenarioId);
    seenScenarioIds.add(normalizedScenarioId);
  }

  return normalizedScenarioIds;
}

function hydrateDateSessionScenarioId(session: DateSession): DateSession {
  const scenarioId = normalizeStarterScenarioId(session.scenarioId);

  return scenarioId === session.scenarioId ? session : { ...session, scenarioId };
}

function hydrateMemoryScenarioId(memory: MemoryRecord): MemoryRecord {
  if (memory.scenarioId === undefined) {
    return memory;
  }

  const scenarioId = normalizeStarterScenarioId(memory.scenarioId);

  return scenarioId === memory.scenarioId ? memory : { ...memory, scenarioId };
}

function shuffleScenarioIds(scenarioIds: readonly string[], random: () => number): string[] {
  const shuffledScenarioIds = [...scenarioIds];

  for (let currentIndex = shuffledScenarioIds.length - 1; currentIndex > 0; currentIndex -= 1) {
    const swapIndex = randomIndex(random, currentIndex + 1);
    const currentScenarioId = shuffledScenarioIds[currentIndex];
    const swapScenarioId = shuffledScenarioIds[swapIndex];

    if (currentScenarioId === undefined || swapScenarioId === undefined) {
      throw new Error("Scenario shuffle lookup failed.");
    }

    shuffledScenarioIds[currentIndex] = swapScenarioId;
    shuffledScenarioIds[swapIndex] = currentScenarioId;
  }

  return shuffledScenarioIds;
}

function randomIndex(random: () => number, exclusiveMax: number): number {
  const randomValue = random();

  if (!Number.isFinite(randomValue)) {
    throw new Error("Scenario shuffle random source returned a non-finite value.");
  }

  const scaledIndex = Math.floor(randomValue * exclusiveMax);

  return Math.min(Math.max(scaledIndex, 0), exclusiveMax - 1);
}

export function findMemberInSave(save: GameSave, memberId: string): Member | undefined {
  return save.members.find((member) => member.id === memberId);
}

export function makePairId(firstMemberId: string, secondMemberId: string): string {
  const [first, second] = sortMemberIds(firstMemberId, secondMemberId);
  return `${first}__${second}`;
}

export function sortMemberIds(firstMemberId: string, secondMemberId: string): [string, string] {
  return firstMemberId <= secondMemberId
    ? [firstMemberId, secondMemberId]
    : [secondMemberId, firstMemberId];
}

function createSeedPairStates(members: Member[]): PairState[] {
  const memberById = new Map(members.map((member) => [member.id, member]));
  if (isStarterRoster(members)) {
    return STARTER_SEED_PAIR_STRUCTURE.map((entry) => {
      const first = memberById.get(entry.participantIds[0]);
      const second = memberById.get(entry.participantIds[1]);
      if (first === undefined || second === undefined) {
        throw new Error("Starter pair seed lookup failed.");
      }
      return {
        id: entry.id,
        participantIds: entry.participantIds,
        stats: createInitialPairStats(first, second),
        completedDateIds: [],
        scenarioUseCounts: { ...entry.scenarioUseCounts },
      };
    });
  }

  const pairStates: PairState[] = [];
  for (let firstIndex = 0; firstIndex < members.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < members.length; secondIndex += 1) {
      const first = members[firstIndex];
      const second = members[secondIndex];
      const participantIds = sortMemberIds(first.id, second.id);
      const scenarioUseCounts: Record<string, number> = {};

      for (const scenario of starterScenarios) {
        scenarioUseCounts[scenario.id] = 0;
      }

      pairStates.push({
        id: makePairId(first.id, second.id),
        participantIds,
        stats: createInitialPairStats(first, second),
        completedDateIds: [],
        scenarioUseCounts,
      });
    }
  }
  return pairStates;
}

function hydratePairStates(
  savedPairStates: PairState[],
  members: Member[],
): { pairStates: PairState[]; dirty: boolean } {
  if (isStarterRoster(members) && savedPairStates.length === STARTER_SEED_PAIR_STRUCTURE.length) {
    const fastPath = hydratePairStatesStarterFast(savedPairStates);
    if (fastPath !== null) return fastPath;
  }

  const savedPairStatesById = new Map(
    savedPairStates.map((pairState) => [pairState.id, pairState] as const),
  );
  const seededPairStates = createSeedPairStates(members);
  const seededPairStateIds = new Set(seededPairStates.map((pairState) => pairState.id));
  let dirty = false;
  const hydratedPairStates = seededPairStates.map((seedPairState) => {
    const savedPairState = savedPairStatesById.get(seedPairState.id);

    if (savedPairState === undefined) {
      dirty = true;
      return seedPairState;
    }

    const counts = hydrateScenarioUseCounts(savedPairState.scenarioUseCounts);
    if (counts !== savedPairState.scenarioUseCounts) dirty = true;
    return {
      ...seedPairState,
      ...savedPairState,
      participantIds: seedPairState.participantIds,
      scenarioUseCounts: {
        ...seedPairState.scenarioUseCounts,
        ...counts,
      },
    };
  });
  const orphanPairStates: PairState[] = [];
  for (const pairState of savedPairStates) {
    if (seededPairStateIds.has(pairState.id)) continue;
    const counts = hydrateScenarioUseCounts(pairState.scenarioUseCounts);
    if (counts !== pairState.scenarioUseCounts) dirty = true;
    orphanPairStates.push({
      ...pairState,
      scenarioUseCounts: counts,
    });
  }

  if (savedPairStates.length !== hydratedPairStates.length + orphanPairStates.length) {
    dirty = true;
  }

  return { pairStates: [...hydratedPairStates, ...orphanPairStates], dirty };
}

function hydratePairStatesStarterFast(
  savedPairStates: PairState[],
): { pairStates: PairState[]; dirty: boolean } | null {
  const savedById = new Map(savedPairStates.map((pair) => [pair.id, pair] as const));
  for (const entry of STARTER_SEED_PAIR_STRUCTURE) {
    if (!savedById.has(entry.id)) return null;
  }
  let dirty = false;
  const normalized = savedPairStates.map((pair) => {
    const counts = hydrateScenarioUseCounts(pair.scenarioUseCounts);
    if (counts === pair.scenarioUseCounts) return pair;
    dirty = true;
    return { ...pair, scenarioUseCounts: counts };
  });
  return { pairStates: dirty ? normalized : savedPairStates, dirty };
}

function hydrateScenarioUseCounts(
  scenarioUseCounts: Record<string, number>,
): Record<string, number> {
  let needsRebuild = false;
  for (const scenarioId of Object.keys(scenarioUseCounts)) {
    if (normalizeStarterScenarioId(scenarioId) !== scenarioId) {
      needsRebuild = true;
      break;
    }
  }
  // Return same reference when no retired ids found, so upstream change detection short-circuits.
  if (!needsRebuild) return scenarioUseCounts;

  const hydratedScenarioUseCounts: Record<string, number> = {};
  for (const [scenarioId, count] of Object.entries(scenarioUseCounts)) {
    const normalizedScenarioId = normalizeStarterScenarioId(scenarioId);
    hydratedScenarioUseCounts[normalizedScenarioId] =
      (hydratedScenarioUseCounts[normalizedScenarioId] ?? 0) + count;
  }

  return hydratedScenarioUseCounts;
}

function createInitialPairStats(first: Member, second: Member): PairStats {
  const chemistry = clampScore(Math.round((first.state.openness + second.state.openness) / 2));
  const conflict = clampScore(Math.round((first.state.burnout + second.state.burnout) / 2));
  const weirdnessTolerance = first.species === second.species ? 45 : 62;
  const trust = clampScore(Math.round((first.state.mood + second.state.mood) / 2) - 5);
  const stability = clampScore(100 - conflict + 8);
  const spark = clampScore(Math.round((chemistry + weirdnessTolerance) / 2));
  const strain = conflict;
  const relationshipHealth = clampScore(
    Math.round((trust + stability + spark + (100 - strain)) / 4),
  );

  return {
    chemistry,
    trust,
    stability,
    conflict,
    weirdnessTolerance,
    spark,
    strain,
    relationshipHealth,
  };
}

function createStarterMemories(timestamp: string) {
  return [
    {
      id: "memory-company-baseline",
      scope: "company",
      visibility: "public",
      subjectIds: [],
      text: "Cupid has opened shift one with seventeen starter members and a three scenario hand.",
      tags: ["baseline", "shift"],
      importance: 2,
      createdAt: timestamp,
    },
  ];
}
