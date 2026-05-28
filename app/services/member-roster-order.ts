import type { Member } from "../domain/game";

// Curated like a case-file rack: every row of four trades silhouettes (ordinary, cosmic, animal,
// armored, object-headed) so a scrolling player never sees two of the same register stacked.
export const CURATED_MEMBER_ROSTER_ORDER: readonly string[] = [
  "jenna-pike",
  "vhool",
  "sienna-bae",
  "mr-whiskers",
  "morrigan",
  "aldric-vale-marsh",
  "five-flower",
  "anansi",
  "venus",
  "kade-sumner",
  "eleanor-ash",
  "naia-velorae",
  "cthala",
  "mei-sato",
  "brady-strait",
  "mjolnir",
  "opal-sunday",
  "anubis",
  "epsy",
  "decimus-marius-tullio",
  "rostin",
  "saffron-vex",
  "john-pork",
  "tasha-rell",
  "ruby",
  "imani-wallace",
  "gideon-glass",
  "cassia-six",
  "fred-stavropoulos",
  "calvin-hewes",
  "nawal-marrash",
  "concord",
  "bai-wenshu",
  "junie-marrow",
  "cha-yusung",
  "marlee-hines",
  "cassie-conners",
  "derek-halsey",
  "maeve",
  "noah-kim",
  "toastimus-crouton-vance",
  "meridian-vale",
  "sera-vohn",
  "gabriel-tan",
  "reaver",
  "daiven-patel",
  "aegis",
  "idris-mahari",
  "ryan-doyle",
  "mira-park",
  "alex-yoon",
  "sana-karim",
  "marcus-pellish",
  "toby-wenz",
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

function curatedRankFor(memberId: string): number {
  return CURATED_MEMBER_ROSTER_RANK.get(memberId) ?? CURATED_MEMBER_ROSTER_ORDER.length;
}

function rosterGroupFor(member: Member, focusedMemberIds: ReadonlySet<string>): RosterGroup {
  if (member.state.status === "closed") return "closed";
  if (member.state.status === "quit") return "quit";
  if (focusedMemberIds.has(member.id)) return "focused";
  return "active";
}
