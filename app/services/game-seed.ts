import {
  gameConfigSchema,
  gameSaveSchema,
  memberSchema,
  SAVE_SCHEMA_VERSION,
  scenarioDeckStateSchema,
  shiftStateSchema,
  type GameSave,
  type Member,
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
import { clampScore } from "./utils";

const STARTER_DECK_MAX_SIZE = starterScenarios.length;

export function createSeedGameSave(now = new Date()): GameSave {
  const timestamp = now.toISOString();
  const config = gameConfigSchema.parse({});
  const members = starterMembers.map((member) => memberSchema.parse(member));
  const pairStates = createSeedPairStates(members);
  const featuredMemberIds = selectFeaturedMemberIds({
    members,
    shiftNumber: 1,
  });
  const drawnScenarioIds = starterScenarios
    .slice(0, config.shiftDateSlots)
    .map((scenario) => scenario.id);
  const offeredScenarioIds = starterScenarios
    .slice(config.shiftDateSlots, config.shiftDateSlots * 2)
    .map((scenario) => scenario.id);
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
      scenarioIds: starterScenarios.map((scenario) => scenario.id),
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
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function hydrateFixtureOwnedMemberData(save: GameSave): GameSave {
  const savedMembersById = new Map(save.members.map((member) => [member.id, member] as const));
  const fixtureMembers = starterMembers.map((fixtureMember) => {
    const parsedFixtureMember = memberSchema.parse(fixtureMember);
    const savedMember = savedMembersById.get(parsedFixtureMember.id);

    if (savedMember === undefined) {
      return parsedFixtureMember;
    }

    return memberSchema.parse({
      ...parsedFixtureMember,
      state: savedMember.state,
    });
  });
  const customMembers = save.members.filter((member) => !STARTER_MEMBERS_BY_ID.has(member.id));
  const members = [...fixtureMembers, ...customMembers];
  const pairStates = hydratePairStates(save.pairStates, members);
  const shifts = save.shifts.map((shift) =>
    shiftStateSchema.parse({
      ...shift,
      featuredMemberIds: hydrateFeaturedMemberIds({ shift, members }),
      scenarioDeck: hydrateScenarioDeckState(shift.scenarioDeck),
    }),
  );

  return gameSaveSchema.parse({
    ...save,
    members,
    pairStates,
    shifts,
  });
}

export function getActiveShift(save: GameSave): ShiftState {
  return (
    save.shifts.find((shift) => shift.id === save.activeShiftId) ??
    save.shifts[save.shifts.length - 1]
  );
}

const STARTER_MEMBERS_BY_ID = new Map(
  starterMembers.map((member) => [member.id, memberSchema.parse(member)]),
);

const STARTER_SCENARIO_IDS = starterScenarios.map((scenario) => scenario.id);

function hydrateScenarioDeckState(scenarioDeck: ScenarioDeckState): ScenarioDeckState {
  const scenarioIds = appendMissingStarterScenarioIds(scenarioDeck.scenarioIds);

  return scenarioDeckStateSchema.parse({
    ...scenarioDeck,
    scenarioIds,
    maxSize: Math.max(scenarioDeck.maxSize, STARTER_DECK_MAX_SIZE, scenarioIds.length),
  });
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

function hydratePairStates(savedPairStates: PairState[], members: Member[]): PairState[] {
  const savedPairStatesById = new Map(
    savedPairStates.map((pairState) => [pairState.id, pairState] as const),
  );
  const seededPairStates = createSeedPairStates(members);
  const seededPairStateIds = new Set(seededPairStates.map((pairState) => pairState.id));
  const hydratedPairStates = seededPairStates.map((seedPairState) => {
    const savedPairState = savedPairStatesById.get(seedPairState.id);

    if (savedPairState === undefined) {
      return seedPairState;
    }

    return {
      ...seedPairState,
      ...savedPairState,
      participantIds: seedPairState.participantIds,
      scenarioUseCounts: {
        ...seedPairState.scenarioUseCounts,
        ...savedPairState.scenarioUseCounts,
      },
    };
  });
  const orphanPairStates = savedPairStates.filter(
    (pairState) => !seededPairStateIds.has(pairState.id),
  );

  return [...hydratedPairStates, ...orphanPairStates];
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
