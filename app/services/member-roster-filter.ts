import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import { caseFileNumber } from "../components/member-card";
import { getMemberQuitRiskStatus } from "./date-engine";
import { sortMembersByCuratedRosterOrder } from "./member-roster-order";
import { buildVisibleMemberProfile } from "./player-knowledge";
import { isMemberInCooldown } from "./shift-planning";

export type MemberSortKey = "default" | "name" | "tallest" | "shortest";
export type MemberFocusFilter = "all" | "focused" | "not-focused";
export type MemberAvailabilityFilter = "all" | "bookable" | "cooldown";
export type MemberAttentionFilter = "all" | "confidence-low" | "closed-file-risk";
export type MemberClosureFilter = "all" | "ready";
export type MemberStatusFilter = "all" | "active" | "closed" | "quit";

export type MemberRosterFilterState = {
  search: string;
  focus: MemberFocusFilter;
  availability: MemberAvailabilityFilter;
  attention: MemberAttentionFilter;
  closure: MemberClosureFilter;
  status: MemberStatusFilter;
  sort: MemberSortKey;
};

export const DEFAULT_MEMBER_ROSTER_FILTER_STATE: MemberRosterFilterState = {
  search: "",
  focus: "all",
  availability: "all",
  attention: "all",
  closure: "all",
  status: "all",
  sort: "default",
};

export const MEMBER_FOCUS_FILTER_OPTIONS: ReadonlyArray<{
  value: MemberFocusFilter;
  label: string;
}> = [
  { value: "all", label: "Any focus" },
  { value: "focused", label: "On focus" },
  { value: "not-focused", label: "Off focus" },
];

export const MEMBER_AVAILABILITY_FILTER_OPTIONS: ReadonlyArray<{
  value: MemberAvailabilityFilter;
  label: string;
}> = [
  { value: "all", label: "Any availability" },
  { value: "bookable", label: "Bookable this shift" },
  { value: "cooldown", label: "On cooldown" },
];

export const MEMBER_ATTENTION_FILTER_OPTIONS: ReadonlyArray<{
  value: MemberAttentionFilter;
  label: string;
}> = [
  { value: "all", label: "Any attention" },
  { value: "confidence-low", label: "Confidence low" },
  { value: "closed-file-risk", label: "Closed-file risk" },
];

export const MEMBER_CLOSURE_FILTER_OPTIONS: ReadonlyArray<{
  value: MemberClosureFilter;
  label: string;
}> = [
  { value: "all", label: "Any closure" },
  { value: "ready", label: "Ready to close" },
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

export type MemberRosterFilterContext = {
  focusedMemberIds?: readonly string[];
  activeShiftNumber?: number;
  readyClosureMemberIds?: ReadonlySet<string>;
};

export function matchesFocusFilter(
  member: Member,
  focus: MemberFocusFilter,
  focusedMemberIds: readonly string[] | undefined,
): boolean {
  if (focus === "all") return true;
  const isFocused = focusedMemberIds?.includes(member.id) === true;
  return focus === "focused" ? isFocused : !isFocused;
}

export function matchesAvailabilityFilter(
  member: Member,
  availability: MemberAvailabilityFilter,
  activeShiftNumber: number | undefined,
): boolean {
  if (availability === "all") return true;
  if (member.state.status !== "active") return false;
  if (activeShiftNumber === undefined) return false;
  const inCooldown = isMemberInCooldown(member, activeShiftNumber);
  return availability === "cooldown" ? inCooldown : !inCooldown;
}

export function matchesAttentionFilter(member: Member, attention: MemberAttentionFilter): boolean {
  if (attention === "all") return true;
  if (member.state.status !== "active") return false;
  const risk = getMemberQuitRiskStatus(member);
  if (attention === "confidence-low") return risk === "client_confidence_low";
  return risk === "closed_file_risk";
}

export function matchesClosureFilter(
  member: Member,
  closure: MemberClosureFilter,
  readyClosureMemberIds: ReadonlySet<string> | undefined,
): boolean {
  if (closure === "all") return true;
  return readyClosureMemberIds?.has(member.id) === true;
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
} & MemberRosterSearchOptions &
  MemberRosterFilterContext;

export function applyMemberRosterFilters(
  members: readonly Member[],
  filterState: MemberRosterFilterState,
  options: ApplyMemberFiltersOptions = {},
): Member[] {
  const baseSort = options.baseSort ?? sortMembersByCuratedRosterOrder;
  const filtered = members.filter(
    (member) =>
      matchesStatusFilter(member, filterState.status) &&
      matchesFocusFilter(member, filterState.focus, options.focusedMemberIds) &&
      matchesAvailabilityFilter(member, filterState.availability, options.activeShiftNumber) &&
      matchesAttentionFilter(member, filterState.attention) &&
      matchesClosureFilter(member, filterState.closure, options.readyClosureMemberIds) &&
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
    filterState.focus !== "all" ||
    filterState.availability !== "all" ||
    filterState.attention !== "all" ||
    filterState.closure !== "all" ||
    filterState.status !== "all" ||
    filterState.sort !== "default"
  );
}
