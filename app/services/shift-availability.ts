import type { Member, ShiftAvailabilityProfile, ShiftState } from "../domain/game";
import { createNamespacedRandom, randomIndex } from "./utils";
import { isMemberInCooldown } from "./shift-planning";

export const SHIFT_PARTNER_SLATE_SIZE = 8;

export type ShiftPartnerUnavailableReason =
  | "focus_case"
  | "cooldown"
  | "closed"
  | "quit"
  | "off_shift";

export type SelectShiftPartnerMemberIdsInput = {
  members: readonly Member[];
  focusedMemberIds: readonly string[];
  shiftNumber: number;
};

export type ShiftPartnerAvailabilityReasonInput = {
  member: Member;
  shiftNumber: number;
  focusedMemberIds: readonly string[];
  availablePartnerMemberIds: readonly string[];
};

const PROFILE_BASE_SCORE: Record<ShiftAvailabilityProfile, number> = {
  steady: 51,
  busy_public: 42,
  career_locked: 44,
  soft_schedule: 55,
  formal_calendar: 48,
  weird_erratic: 46,
};

const PROFILE_RHYTHM: Record<ShiftAvailabilityProfile, { every: number; on: number; off: number }> =
  {
    steady: { every: 2, on: 12, off: 2 },
    busy_public: { every: 4, on: 24, off: -6 },
    career_locked: { every: 3, on: 19, off: -3 },
    soft_schedule: { every: 2, on: 16, off: 1 },
    formal_calendar: { every: 3, on: 22, off: -4 },
    weird_erratic: { every: 5, on: 28, off: -8 },
  };

const PROFILE_CAP = 4;
const IDENTITY_CAP = 7;

type Candidate = {
  member: Member;
  profile: ShiftAvailabilityProfile;
  identity: "ordinary_human" | "non_human" | "other";
  score: number;
  index: number;
};

export function selectShiftPartnerMemberIds({
  members,
  focusedMemberIds,
  shiftNumber,
}: SelectShiftPartnerMemberIdsInput): string[] {
  const focusedSet = new Set(focusedMemberIds);
  const candidates = members
    .filter(
      (member) =>
        member.state.status === "active" &&
        !focusedSet.has(member.id) &&
        !isMemberInCooldown(member, shiftNumber),
    )
    .map((member) => {
      const profile = availabilityProfileForMember(member);
      return {
        member,
        profile,
        identity: identityForMember(member),
        score: logisticsScoreForMember(member, profile, shiftNumber),
      };
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.member.firstName.localeCompare(second.member.firstName) ||
        first.member.id.localeCompare(second.member.id),
    )
    .map((candidate, index) => ({ ...candidate, index }));

  const targetCount = Math.min(SHIFT_PARTNER_SLATE_SIZE, candidates.length);
  if (targetCount === 0) {
    return [];
  }

  return selectWithCompositionPreferences(candidates, targetCount).map(
    (candidate) => candidate.member.id,
  );
}

export function hydrateAvailablePartnerMemberIds({
  shift,
  members,
  focusedMemberIds,
}: {
  shift: ShiftState;
  members: readonly Member[];
  focusedMemberIds: readonly string[];
}): string[] {
  const eligible = eligiblePartnerMemberIds({
    persistedMemberIds: shift.availablePartnerMemberIds,
    members,
    focusedMemberIds,
    shiftNumber: shift.shiftNumber,
  });

  if (shift.status !== "active") {
    return eligible;
  }

  return repairShiftPartnerMemberIds({
    members,
    focusedMemberIds,
    shiftNumber: shift.shiftNumber,
    persistedMemberIds: eligible,
  });
}

export function repairShiftPartnerMemberIds({
  members,
  focusedMemberIds,
  shiftNumber,
  persistedMemberIds,
}: SelectShiftPartnerMemberIdsInput & { persistedMemberIds: readonly string[] }): string[] {
  const expectedCount = Math.min(
    SHIFT_PARTNER_SLATE_SIZE,
    eligiblePartnerCount({ members, focusedMemberIds, shiftNumber }),
  );
  if (persistedMemberIds.length >= expectedCount) {
    return persistedMemberIds.slice(0, expectedCount);
  }

  const seen = new Set(persistedMemberIds);
  const repaired = [...persistedMemberIds];
  for (const memberId of selectShiftPartnerMemberIds({ members, focusedMemberIds, shiftNumber })) {
    if (repaired.length >= expectedCount) break;
    if (seen.has(memberId)) continue;
    seen.add(memberId);
    repaired.push(memberId);
  }

  return repaired;
}

export function shiftPartnerUnavailableReason({
  member,
  shiftNumber,
  focusedMemberIds,
  availablePartnerMemberIds,
}: ShiftPartnerAvailabilityReasonInput): ShiftPartnerUnavailableReason | null {
  if (member.state.status === "closed") return "closed";
  if (member.state.status === "quit") return "quit";
  if (focusedMemberIds.includes(member.id)) return "focus_case";
  if (isMemberInCooldown(member, shiftNumber)) return "cooldown";
  if (!availablePartnerMemberIds.includes(member.id)) return "off_shift";
  return null;
}

export function isMemberOnTonightBoard({
  member,
  shiftNumber,
  focusedMemberIds,
  availablePartnerMemberIds,
}: ShiftPartnerAvailabilityReasonInput): boolean {
  return (
    member.state.status === "active" &&
    !isMemberInCooldown(member, shiftNumber) &&
    (focusedMemberIds.includes(member.id) || availablePartnerMemberIds.includes(member.id))
  );
}

export type ShiftPartnerClassification = {
  available: Member[];
  unavailable: Array<{ member: Member; reason: ShiftPartnerUnavailableReason }>;
};

/**
 * Single-pass classifier over the roster. Every member ends up in exactly one
 * bucket: an `available` partner for tonight's board, or an `unavailable`
 * entry tagged with the player-facing reason. The complement invariant is
 * structural — callers cannot get it wrong.
 */
export function classifyShiftPartners({
  members,
  shiftNumber,
  focusedMemberIds,
  availablePartnerMemberIds,
}: {
  members: readonly Member[];
  shiftNumber: number;
  focusedMemberIds: readonly string[];
  availablePartnerMemberIds: readonly string[];
}): ShiftPartnerClassification {
  const available: Member[] = [];
  const unavailable: ShiftPartnerClassification["unavailable"] = [];

  for (const member of members) {
    const reason = shiftPartnerUnavailableReason({
      member,
      shiftNumber,
      focusedMemberIds,
      availablePartnerMemberIds,
    });
    if (reason === null) {
      available.push(member);
    } else {
      unavailable.push({ member, reason });
    }
  }

  return { available, unavailable };
}

export function availabilityProfileForMember(member: Member): ShiftAvailabilityProfile {
  return member.shiftAvailabilityProfile;
}

function logisticsScoreForMember(
  member: Member,
  profile: ShiftAvailabilityProfile,
  shiftNumber: number,
): number {
  const rhythm = PROFILE_RHYTHM[profile];
  const offset =
    rhythm.every <= 1
      ? 0
      : randomIndex(
          rhythm.every,
          createNamespacedRandom("shift-availability-rhythm", [profile, member.id]),
        );
  const rhythmScore = (shiftNumber + offset) % rhythm.every === 0 ? rhythm.on : rhythm.off;
  const jitter = createNamespacedRandom("shift-availability-jitter", [shiftNumber, member.id])();

  return (
    PROFILE_BASE_SCORE[profile] +
    rhythmScore +
    recentDateScore(member, shiftNumber) +
    stateLogisticsScore(member) +
    jitter * 8
  );
}

function recentDateScore(member: Member, shiftNumber: number): number {
  const lastDateShift = member.state.lastDateShift;
  if (lastDateShift === undefined) return 0;
  const shiftsSince = shiftNumber - lastDateShift;
  if (shiftsSince <= 1) return -100;
  if (shiftsSince === 2) return -12;
  if (shiftsSince >= 5) return 6;
  return 0;
}

function stateLogisticsScore(member: Member): number {
  const burnoutDrag = member.state.burnout >= 70 ? -10 : member.state.burnout >= 50 ? -5 : 0;
  const retentionUrgency = member.state.retention <= 25 ? 12 : member.state.retention <= 45 ? 6 : 0;
  const moodDrag = member.state.mood <= 25 ? -4 : 0;
  return burnoutDrag + retentionUrgency + moodDrag;
}

/**
 * Selects up to `targetCount` candidates with soft caps on profile and
 * identity composition. First pass honors PROFILE_CAP / IDENTITY_CAP; second
 * pass tops up from remaining candidates without caps when the slate would
 * otherwise come up short. The caps are preferences, not invariants — when
 * the eligible pool is thin, fill order beats composition.
 */
function selectWithCompositionPreferences(
  candidates: readonly Candidate[],
  targetCount: number,
): Candidate[] {
  const cappedPass = selectRespectingCaps(candidates, targetCount);
  const selected =
    cappedPass.length < targetCount
      ? topUpRemaining(cappedPass, candidates, targetCount)
      : cappedPass;

  return [...selected].sort((first, second) => first.index - second.index);
}

function selectRespectingCaps(candidates: readonly Candidate[], targetCount: number): Candidate[] {
  const selected: Candidate[] = [];
  const profileCounts = new Map<ShiftAvailabilityProfile, number>();
  const identityCounts = new Map<Candidate["identity"], number>();

  for (const candidate of candidates) {
    if (selected.length >= targetCount) break;
    const profileCount = profileCounts.get(candidate.profile) ?? 0;
    const identityCount = identityCounts.get(candidate.identity) ?? 0;
    if (profileCount >= PROFILE_CAP || identityCount >= IDENTITY_CAP) continue;
    selected.push(candidate);
    profileCounts.set(candidate.profile, profileCount + 1);
    identityCounts.set(candidate.identity, identityCount + 1);
  }

  return selected;
}

function topUpRemaining(
  initialSelected: readonly Candidate[],
  candidates: readonly Candidate[],
  targetCount: number,
): Candidate[] {
  const selected = [...initialSelected];
  const selectedIds = new Set(selected.map((candidate) => candidate.member.id));

  for (const candidate of candidates) {
    if (selected.length >= targetCount) break;
    if (selectedIds.has(candidate.member.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.member.id);
  }

  return selected;
}

function eligiblePartnerCount({
  members,
  focusedMemberIds,
  shiftNumber,
}: SelectShiftPartnerMemberIdsInput): number {
  const focusedSet = new Set(focusedMemberIds);
  return members.filter(
    (member) =>
      member.state.status === "active" &&
      !focusedSet.has(member.id) &&
      !isMemberInCooldown(member, shiftNumber),
  ).length;
}

/**
 * Filters a persisted slate down to the ids that still satisfy partner
 * eligibility: present in the roster, active, not focused, not in cooldown.
 * Membership in the slate itself is *not* a criterion — that would be a
 * tautology — so this drops stale entries from older saves.
 */
function eligiblePartnerMemberIds({
  persistedMemberIds,
  members,
  focusedMemberIds,
  shiftNumber,
}: {
  persistedMemberIds: readonly string[];
  members: readonly Member[];
  focusedMemberIds: readonly string[];
  shiftNumber: number;
}): string[] {
  const membersById = new Map(members.map((member) => [member.id, member] as const));
  const focusedSet = new Set(focusedMemberIds);
  const seen = new Set<string>();
  const validIds: string[] = [];

  for (const memberId of persistedMemberIds) {
    if (seen.has(memberId)) continue;
    const member = membersById.get(memberId);
    if (member === undefined) continue;
    if (member.state.status !== "active") continue;
    if (focusedSet.has(member.id)) continue;
    if (isMemberInCooldown(member, shiftNumber)) continue;
    seen.add(memberId);
    validIds.push(memberId);
  }

  return validIds;
}

function identityForMember(member: Member): Candidate["identity"] {
  if (member.tags.includes("ordinary_human")) return "ordinary_human";
  if (member.tags.includes("non_human")) return "non_human";
  return "other";
}
