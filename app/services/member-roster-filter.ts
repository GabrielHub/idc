import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import { caseFileNumber } from "../components/member-card";
import { sortMembersByCuratedRosterOrder } from "./member-roster-order";
import { buildVisibleMemberProfile } from "./player-knowledge";

export type MemberSortKey = "default" | "name" | "tallest" | "shortest";
export type MemberHeightBucket = "all" | "short" | "average" | "tall" | "very-tall";
export type MemberStatusFilter = "all" | "active" | "closed" | "quit";

export type MemberRosterFilterState = {
  search: string;
  height: MemberHeightBucket;
  status: MemberStatusFilter;
  sort: MemberSortKey;
};

export const DEFAULT_MEMBER_ROSTER_FILTER_STATE: MemberRosterFilterState = {
  search: "",
  height: "all",
  status: "all",
  sort: "default",
};

export const MEMBER_HEIGHT_BUCKET_OPTIONS: ReadonlyArray<{
  value: MemberHeightBucket;
  label: string;
}> = [
  { value: "all", label: "All heights" },
  { value: "short", label: `Under 5'6"` },
  { value: "average", label: `5'6" to 5'11"` },
  { value: "tall", label: `6'0" to 6'5"` },
  { value: "very-tall", label: `6'6" or taller` },
];

export const MEMBER_SORT_OPTIONS: ReadonlyArray<{ value: MemberSortKey; label: string }> = [
  { value: "default", label: "Curated order" },
  { value: "name", label: "Name A to Z" },
  { value: "tallest", label: "Tallest first" },
  { value: "shortest", label: "Shortest first" },
];

export const MEMBER_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: MemberStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All cases" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "quit", label: "Cancelled" },
];

type HeightRange = { min: number; max: number };

const HEIGHT_BUCKET_RANGE: Record<Exclude<MemberHeightBucket, "all">, HeightRange> = {
  short: { min: 0, max: 65 },
  average: { min: 66, max: 71 },
  tall: { min: 72, max: 77 },
  "very-tall": { min: 78, max: Number.POSITIVE_INFINITY },
};

export function matchesHeightBucket(heightInInches: number, bucket: MemberHeightBucket): boolean {
  if (bucket === "all") return true;
  const range = HEIGHT_BUCKET_RANGE[bucket];
  return heightInInches >= range.min && heightInInches <= range.max;
}

export function matchesStatusFilter(member: Member, status: MemberStatusFilter): boolean {
  if (status === "all") return true;
  return member.state.status === status;
}

export type MemberRosterSearchOptions = {
  playerKnowledge?: readonly PlayerKnowledgeRecord[];
  revealAllMemberDetails?: boolean;
};

export function matchesSearch(
  member: Member,
  query: string,
  options: MemberRosterSearchOptions = {},
): boolean {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return true;
  const profile = buildVisibleMemberProfile(member, options.playerKnowledge ?? [], {
    visibilityMode: options.revealAllMemberDetails === true ? "dev_unveiled" : "earned",
  });
  const haystack = [
    member.firstName,
    member.name,
    caseFileNumber(member.id),
    ...profile.publicFragments,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(trimmed);
}

type ApplyMemberFiltersOptions = {
  baseSort?: (members: Member[]) => Member[];
} & MemberRosterSearchOptions;

export function applyMemberRosterFilters(
  members: readonly Member[],
  filterState: MemberRosterFilterState,
  options: ApplyMemberFiltersOptions = {},
): Member[] {
  const baseSort = options.baseSort ?? sortMembersByCuratedRosterOrder;
  const filtered = members.filter(
    (member) =>
      matchesStatusFilter(member, filterState.status) &&
      matchesHeightBucket(member.characterHeightInInches, filterState.height) &&
      matchesSearch(member, filterState.search, options),
  );

  if (filterState.sort === "name") {
    return [...filtered].sort(
      (first, second) =>
        first.firstName.localeCompare(second.firstName) || first.id.localeCompare(second.id),
    );
  }

  if (filterState.sort === "tallest" || filterState.sort === "shortest") {
    const direction = filterState.sort === "tallest" ? -1 : 1;
    return [...filtered].sort((first, second) => {
      const heightDelta =
        (first.characterHeightInInches - second.characterHeightInInches) * direction;
      if (heightDelta !== 0) return heightDelta;
      return first.firstName.localeCompare(second.firstName);
    });
  }

  return baseSort(filtered);
}

export function isMemberRosterFilterActive(filterState: MemberRosterFilterState): boolean {
  return (
    filterState.search.trim().length > 0 ||
    filterState.height !== "all" ||
    filterState.status !== "all" ||
    filterState.sort !== "default"
  );
}
