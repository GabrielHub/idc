import {
  MEMBER_IDENTITY_TAGS,
  type GoalMetric,
  type Member,
  type MemberTag,
  type ShiftState,
} from "../domain/game";
import { companyGoals, memberRequests } from "../fixtures/goals";

export const SHIFT_FEATURED_MEMBER_COUNT = 4;
const SHIFT_COMPANY_GOAL_COUNT = 2;

export function selectFeaturedMemberIds({
  members,
  shiftNumber,
  count = SHIFT_FEATURED_MEMBER_COUNT,
}: {
  members: readonly Member[];
  shiftNumber: number;
  count?: number;
}): string[] {
  const desiredCount = Math.min(count, members.length);

  if (desiredCount === 0) {
    return [];
  }

  const shuffledMembers = seededSortMembers(members, `shift:${shiftNumber}:featured`);
  const featuredMembers = shuffledMembers.slice(0, desiredCount);

  for (const tag of MEMBER_IDENTITY_TAGS) {
    ensureIdentityTag(featuredMembers, shuffledMembers, tag);
  }

  return featuredMembers.map((member) => member.id);
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

  const shuffledMembers = seededSortMembers(members, `shift:${shift.shiftNumber}:featured`);

  for (const member of shuffledMembers) {
    if (featuredMembers.length >= desiredCount) {
      break;
    }

    if (!featuredMembers.some((selected) => selected.id === member.id)) {
      featuredMembers.push(member);
    }
  }

  featuredMembers.splice(desiredCount);

  for (const tag of MEMBER_IDENTITY_TAGS) {
    ensureIdentityTag(featuredMembers, shuffledMembers, tag);
  }

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
  const possibleGoals = companyGoals.filter((goal) =>
    isCompanyGoalPossible(goal.metric, goal.target, members, dateSlotsTotal),
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
    .map(
      (member) =>
        memberRequests.find((request) => request.id === member.state.currentRequestId) ??
        memberRequests.find((request) => request.memberId === member.id),
    )
    .filter((request): request is (typeof memberRequests)[number] => request !== undefined);

  return seededSortById(requests, `shift:${shiftNumber}:requests`).map((request) => request.id);
}

function ensureIdentityTag(
  featuredMembers: Member[],
  shuffledMembers: readonly Member[],
  tag: MemberTag,
) {
  if (featuredMembers.some((member) => member.tags.includes(tag))) {
    return;
  }

  const replacement = shuffledMembers.find(
    (member) =>
      member.tags.includes(tag) && !featuredMembers.some((selected) => selected.id === member.id),
  );

  if (replacement === undefined) {
    return;
  }

  const protectedTags = MEMBER_IDENTITY_TAGS.filter((candidate) => candidate !== tag);
  const replacementIndex = findReplacementIndex(featuredMembers, protectedTags);

  featuredMembers[replacementIndex] = replacement;
}

function findReplacementIndex(
  featuredMembers: readonly Member[],
  protectedTags: readonly MemberTag[],
): number {
  for (let index = featuredMembers.length - 1; index >= 0; index -= 1) {
    const member = featuredMembers[index];

    if (
      member !== undefined &&
      protectedTags.every((tag) =>
        featuredMembers.some(
          (candidate, candidateIndex) => candidateIndex !== index && candidate.tags.includes(tag),
        ),
      )
    ) {
      return index;
    }
  }

  return Math.max(0, featuredMembers.length - 1);
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

function seededSortMembers(members: readonly Member[], seed: string): Member[] {
  return seededSortById(members, seed);
}

function seededSortById<TValue extends { id: string }>(
  values: readonly TValue[],
  seed: string,
): TValue[] {
  return [...values].sort((first, second) => {
    const firstScore = seededScore(`${seed}:${first.id}`);
    const secondScore = seededScore(`${seed}:${second.id}`);

    return firstScore - secondScore || first.id.localeCompare(second.id);
  });
}

function seededScore(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
