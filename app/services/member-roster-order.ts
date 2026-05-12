import type { Member } from "../domain/game";

// Curated like a case-file rack: first screen sells range, later rows alternate grounded and strange.
export const CURATED_MEMBER_ROSTER_ORDER: readonly string[] = [
  "jenna-pike",
  "vhool",
  "kade-sumner",
  "mr-whiskers",
  "opal-sunday",
  "venus",
  "gideon-glass",
  "meridian-vale",
  "aldric-vale-marsh",
  "sana-karim",
  "epsy",
  "marcus-pellish",
  "cassie-conners",
  "calvin-hewes",
  "gabriel-tan",
  "sera-vohn",
  "mei-sato",
  "decimus-marius-tullio",
  "eleanor-ash",
  "alex-yoon",
  "bai-wenshu",
  "mira-park",
  "cthala",
  "ryan-doyle",
  "naia-velorae",
  "noah-kim",
  "reaver",
  "derek-halsey",
  "cha-yusung",
  "tasha-rell",
  "idris-mahari",
  "toby-wenz",
  "brady-strait",
];

type CuratedMember = Pick<Member, "id" | "firstName">;
type RosterGroup = "focused" | "active" | "closed" | "quit";

const CURATED_MEMBER_ROSTER_RANK = new Map(
  CURATED_MEMBER_ROSTER_ORDER.map((memberId, index) => [memberId, index] as const),
);

const ROSTER_GROUP_RANK: Record<RosterGroup, number> = {
  focused: 0,
  active: 1,
  closed: 2,
  quit: 3,
};

export function compareMembersByCuratedRosterOrder(
  first: CuratedMember,
  second: CuratedMember,
): number {
  const rankDelta = curatedRankFor(first.id) - curatedRankFor(second.id);
  if (rankDelta !== 0) return rankDelta;

  return first.firstName.localeCompare(second.firstName) || first.id.localeCompare(second.id);
}

export function sortMembersByCuratedRosterOrder<TMember extends CuratedMember>(
  members: readonly TMember[],
): TMember[] {
  return [...members].sort(compareMembersByCuratedRosterOrder);
}

export function sortMembersForRoster(
  members: readonly Member[],
  focusedMemberIds: readonly string[],
): Member[] {
  const focusedSet = new Set(focusedMemberIds);

  return [...members].sort((first, second) => {
    const groupDelta =
      ROSTER_GROUP_RANK[rosterGroupFor(first, focusedSet)] -
      ROSTER_GROUP_RANK[rosterGroupFor(second, focusedSet)];
    if (groupDelta !== 0) return groupDelta;

    return compareMembersByCuratedRosterOrder(first, second);
  });
}

export function moveSuggestedMemberFirst<TMember extends CuratedMember>(
  members: readonly TMember[],
  suggestedMemberId: string | null,
): TMember[] {
  const sortedMembers = sortMembersByCuratedRosterOrder(members);

  if (suggestedMemberId === null) {
    return sortedMembers;
  }

  const suggestedMember = sortedMembers.find((member) => member.id === suggestedMemberId);
  if (suggestedMember === undefined) {
    return sortedMembers;
  }

  return [suggestedMember, ...sortedMembers.filter((member) => member.id !== suggestedMember.id)];
}

function curatedRankFor(memberId: string): number {
  return CURATED_MEMBER_ROSTER_RANK.get(memberId) ?? CURATED_MEMBER_ROSTER_ORDER.length;
}

function rosterGroupFor(member: Member, focusedMemberIds: ReadonlySet<string>): RosterGroup {
  if (member.state.status === "closed") return "closed";
  if (member.state.status === "quit") return "quit";
  if (focusedMemberIds.has(member.id)) return "focused";
  return "active";
}
