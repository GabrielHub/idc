import {
  gameConfigSchema,
  gameSaveSchema,
  memberSchema,
  type GameSave,
  type Member,
  type PairState,
  type PairStats,
  type ShiftState,
} from "../domain/game";
import { companyGoals, memberRequests, starterMembers, starterScenarios } from "../fixtures";

const SAVE_VERSION = 1;
const STARTER_DECK_MAX_SIZE = 8;

export function createSeedGameSave(now = new Date()): GameSave {
  const timestamp = now.toISOString();
  const members = starterMembers.map((member) => memberSchema.parse(member));
  const pairStates = createSeedPairStates(members);
  const drawnScenarioIds = starterScenarios.slice(0, 3).map((scenario) => scenario.id);
  const offeredScenarioIds = starterScenarios.slice(3, 6).map((scenario) => scenario.id);
  const activeShift: ShiftState = {
    id: "shift-1",
    shiftNumber: 1,
    status: "active",
    dateSlotsTotal: 3,
    dateSlotsUsed: 0,
    drawnScenarioIds,
    companyGoalIds: companyGoals.slice(0, 2).map((goal) => goal.id),
    memberRequestIds: memberRequests.slice(0, 3).map((request) => request.id),
    scenarioDeck: {
      scenarioIds: starterScenarios.map((scenario) => scenario.id),
      maxSize: STARTER_DECK_MAX_SIZE,
      offeredScenarioIds,
    },
    startedAt: timestamp,
  };

  return gameSaveSchema.parse({
    version: SAVE_VERSION,
    config: gameConfigSchema.parse({}),
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

export function getActiveShift(save: GameSave): ShiftState {
  return (
    save.shifts.find((shift) => shift.id === save.activeShiftId) ??
    save.shifts[save.shifts.length - 1]
  );
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
      text: "Cupid has opened shift one with six starter members and a three scenario hand.",
      tags: ["baseline", "shift"],
      importance: 2,
      createdAt: timestamp,
    },
  ];
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, value));
}
