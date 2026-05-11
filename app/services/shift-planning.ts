import { type GoalMetric, type Member, type ShiftState } from "../domain/game";
import { companyGoals, memberRequests } from "../fixtures/goals";
import { hashSeedUint32, shuffleInPlace } from "./utils";

export const SHIFT_FEATURED_MEMBER_COUNT = 4;
const SHIFT_COMPANY_GOAL_COUNT = 2;
type RandomSource = () => number;

export function selectFeaturedMemberIds({
  members,
  count = SHIFT_FEATURED_MEMBER_COUNT,
  random = Math.random,
}: {
  members: readonly Member[];
  count?: number;
  random?: RandomSource;
}): string[] {
  const activeMembers = members.filter(isMemberRetained);
  const desiredCount = Math.min(count, activeMembers.length);

  if (desiredCount === 0) {
    return [];
  }

  return shuffleMembers(activeMembers, random)
    .slice(0, desiredCount)
    .map((member) => member.id);
}

export function hydrateFeaturedMemberIds({
  shift,
  members,
}: {
  shift: ShiftState;
  members: readonly Member[];
}): string[] {
  const desiredCount = Math.min(SHIFT_FEATURED_MEMBER_COUNT, members.length);

  if (desiredCount === 0) {
    return [];
  }

  const memberById = new Map(members.map((member) => [member.id, member] as const));
  const featuredMembers: Member[] = [];

  for (const memberId of shift.featuredMemberIds) {
    const member = memberById.get(memberId);

    if (member === undefined || featuredMembers.some((selected) => selected.id === member.id)) {
      continue;
    }

    featuredMembers.push(member);
  }

  const shuffledMembers = seededSortById(members, `shift:${shift.shiftNumber}:featured`);

  for (const member of shuffledMembers) {
    if (featuredMembers.length >= desiredCount) {
      break;
    }

    if (!featuredMembers.some((selected) => selected.id === member.id)) {
      featuredMembers.push(member);
    }
  }

  featuredMembers.splice(desiredCount);

  return featuredMembers.map((member) => member.id);
}

export function selectShiftCompanyGoalIds({
  members,
  shiftNumber,
  dateSlotsTotal,
}: {
  members: readonly Member[];
  shiftNumber: number;
  dateSlotsTotal: number;
}): string[] {
  const activeMembers = members.filter(isMemberRetained);
  const possibleGoals = companyGoals.filter((goal) =>
    isCompanyGoalPossible(goal.metric, goal.target, activeMembers, dateSlotsTotal),
  );

  return seededSortById(possibleGoals, `shift:${shiftNumber}:goals`)
    .slice(0, SHIFT_COMPANY_GOAL_COUNT)
    .map((goal) => goal.id);
}

export function selectFeaturedMemberRequestIds({
  members,
  featuredMemberIds,
  shiftNumber,
}: {
  members: readonly Member[];
  featuredMemberIds: readonly string[];
  shiftNumber: number;
}): string[] {
  const featuredMembers = resolveMembers(members, featuredMemberIds);
  const requests = featuredMembers
    .map((member) => resolveCurrentMemberRequest(member))
    .filter((request): request is (typeof memberRequests)[number] => request !== undefined);

  return seededSortById(requests, `shift:${shiftNumber}:requests`).map((request) => request.id);
}

export function getMemberRequestPoolIds(memberId: string): string[] {
  return memberRequests
    .filter((request) => request.memberId === memberId)
    .map((request) => request.id);
}

export function pickNextMemberRequestId(
  memberId: string,
  currentRequestId: string | undefined,
): string | undefined {
  const poolIds = getMemberRequestPoolIds(memberId);

  if (poolIds.length === 0) {
    return undefined;
  }

  if (poolIds.length === 1) {
    return poolIds[0];
  }

  if (currentRequestId === undefined) {
    return poolIds[0];
  }

  const currentIndex = poolIds.indexOf(currentRequestId);

  if (currentIndex === -1) {
    return poolIds[0];
  }

  return poolIds[(currentIndex + 1) % poolIds.length];
}

function resolveCurrentMemberRequest(member: Member) {
  return (
    memberRequests.find((request) => request.id === member.state.currentRequestId) ??
    memberRequests.find((request) => request.memberId === member.id)
  );
}

function isCompanyGoalPossible(
  metric: GoalMetric,
  target: number,
  members: readonly Member[],
  dateSlotsTotal: number,
): boolean {
  if (metric === "completedDates" || metric === "positiveOutcomeDates") {
    return target <= dateSlotsTotal;
  }

  if (metric === "earlyEndedDates") {
    return true;
  }

  if (metric === "ordinaryNonHumanDates") {
    return (
      target <= dateSlotsTotal &&
      members.some((member) => member.tags.includes("ordinary_human")) &&
      members.some((member) => member.tags.includes("non_human"))
    );
  }

  if (metric === "improvedMembers") {
    return target <= members.length;
  }

  return members.length > 0;
}

function resolveMembers(members: readonly Member[], memberIds: readonly string[]): Member[] {
  return memberIds
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is Member => member !== undefined);
}

function isMemberRetained(member: Member): boolean {
  return member.state.retention > 0;
}

function shuffleMembers(members: readonly Member[], random: RandomSource): Member[] {
  const shuffledMembers = [...members];
  shuffleInPlace(shuffledMembers, random);
  return shuffledMembers;
}

function seededSortById<TValue extends { id: string }>(
  values: readonly TValue[],
  seed: string,
): TValue[] {
  return [...values].sort((first, second) => {
    const firstScore = hashSeedUint32(`${seed}:${first.id}`);
    const secondScore = hashSeedUint32(`${seed}:${second.id}`);

    return firstScore - secondScore || first.id.localeCompare(second.id);
  });
}
