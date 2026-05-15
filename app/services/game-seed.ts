import {
  DEFAULT_TUTORIAL_STATE,
  gameConfigSchema,
  gameSaveSchema,
  memberSchema,
  SAVE_SCHEMA_VERSION,
  scenarioDeckSchema,
  shiftStateSchema,
  STARTER_BUDGET_CAP,
  type DateSession,
  type GameConfig,
  type GameSave,
  type Member,
  type MemoryRecord,
  type PairState,
  type PairStats,
  type ScenarioDeck,
  type ShiftState,
} from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import { createInitialScenarioDeck } from "./deck";
import {
  hydrateFeaturedMemberIds,
  selectFeaturedMemberRequestIds,
  selectShiftCompanyGoalIds,
} from "./shift-planning";
import { arraysShallowEqual, clampScore } from "./utils";

const STARTER_SCENARIO_IDS = starterScenarios.map((scenario) => scenario.id);
const SCENARIO_ID_REPLACEMENTS: Record<string, string> = {
  "alternate-ex-double-date": "phantom-doorbell-suite",
};

export type CreateSeedGameSaveOptions = {
  config?: GameConfig;
  random?: () => number;
};

export function createSeedGameSave(
  now = new Date(),
  options: CreateSeedGameSaveOptions = {},
): GameSave {
  const timestamp = now.toISOString();
  const config = gameConfigSchema.parse(options.config ?? {});
  const members = STARTER_FIXTURE_MEMBERS;
  const pairStates = createSeedPairStates(members);
  const scenarioDeck = createInitialScenarioDeck(starterScenarios);
  const focusedMemberIds: string[] = [];
  const activeShift: ShiftState = {
    id: "shift-1",
    shiftNumber: 1,
    status: "active",
    dateSlotsTotal: config.shiftDateSlots,
    dateSlotsUsed: 0,
    featuredMemberIds: focusedMemberIds,
    drawnScenarioIds: [],
    companyGoalIds: selectShiftCompanyGoalIds({
      members,
      shiftNumber: 1,
      dateSlotsTotal: config.shiftDateSlots,
    }),
    memberRequestIds: selectFeaturedMemberRequestIds({
      members,
      featuredMemberIds: focusedMemberIds,
      shiftNumber: 1,
    }),
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
    focusedMemberIds,
    scenarioDeck,
    closureCount: 0,
    softWinSeen: false,
    budgetCap: STARTER_BUDGET_CAP,
    budgetPeriodId: "budget-period-shift-0",
    budgetDiscountOffers: [],
    budgetHistory: [
      {
        shift: 0,
        previousCap: STARTER_BUDGET_CAP,
        newCap: STARTER_BUDGET_CAP,
        reasons: [
          {
            kind: "starter",
            label: "Starter cap",
            delta: 0,
          },
        ],
      },
    ],
    lastBudgetReviewShift: 0,
    tutorial: DEFAULT_TUTORIAL_STATE,
    managerQuipHistory: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export type HydrateFixtureOwnedMemberDataResult = {
  save: GameSave;
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

  const scenarioDeckResult = hydrateScenarioDeck(save.scenarioDeck);
  if (scenarioDeckResult !== save.scenarioDeck) dirty = true;

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
      scenarioDeck: scenarioDeckResult,
    }),
    dirty: true,
  };
}

function fixtureMemberMatchesState(fixtureMember: Member, savedMember: Member): boolean {
  return (
    savedMember.name === fixtureMember.name &&
    savedMember.firstName === fixtureMember.firstName &&
    savedMember.characterHeightInInches === fixtureMember.characterHeightInInches &&
    savedMember.standeeRenderHeightInInches === fixtureMember.standeeRenderHeightInInches &&
    savedMember.origin === fixtureMember.origin &&
    savedMember.species === fixtureMember.species &&
    savedMember.dimension === fixtureMember.dimension &&
    savedMember.realityStatus === fixtureMember.realityStatus &&
    savedMember.bio === fixtureMember.bio &&
    savedMember.datingProfile === fixtureMember.datingProfile &&
    savedMember.visualDescription === fixtureMember.visualDescription &&
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
    arraysShallowEqual(before.drawnScenarioIds, after.drawnScenarioIds)
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

function hydrateScenarioDeck(scenarioDeck: ScenarioDeck): ScenarioDeck {
  const knownScenarioIds = new Set(STARTER_SCENARIO_IDS);
  const seen = new Set<string>();
  const cardIds: string[] = [];

  for (const cardId of scenarioDeck.cardIds) {
    const normalized = normalizeStarterScenarioId(cardId);
    if (!knownScenarioIds.has(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    cardIds.push(normalized);
  }

  if (cardIds.length !== scenarioDeck.cardIds.length) {
    return scenarioDeckSchema.parse({ cardIds });
  }
  return scenarioDeck;
}

function hydrateShiftScenarioIds(shift: ShiftState, members: Member[]): ShiftState {
  return shiftStateSchema.parse({
    ...shift,
    featuredMemberIds: hydrateFeaturedMemberIds({ shift, members }),
    drawnScenarioIds: normalizeScenarioIds(shift.drawnScenarioIds),
  });
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
        agreements: [],
        openLoops: [],
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
        agreements: [],
        openLoops: [],
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
      text: "Cupid has opened the office with a 40 member roster and a budgeted Date Book.",
      tags: ["baseline", "shift"],
      importance: 2,
      createdAt: timestamp,
    },
  ];
}
