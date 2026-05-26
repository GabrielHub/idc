import type {
  DateSession,
  Member,
  PairState,
  ShiftAvailabilityProfile,
  ShiftFollowUpReservation,
  ShiftState,
} from "../domain/game";
import { createNamespacedRandom, randomIndex } from "./utils";
import { dateSessionShiftNumber, isMemberInCooldown } from "./shift-planning";

export const SHIFT_PARTNER_SLATE_SIZE = 8;

// How many shifts back a `pursue` filing stays warm enough to bypass cooldown
// on the previous partner. Filings older than this fall back to normal
// scheduling.
export const FOLLOW_UP_RIPENESS_SHIFTS = 2;

function isPursueWithinRipeness(session: DateSession, currentShiftNumber: number): boolean {
  if (session.finalReport?.appliedFollowUp !== "pursue") return false;
  const sessionShift = dateSessionShiftNumber(session);
  if (sessionShift === null) return false;
  const shiftsSince = currentShiftNumber - sessionShift;
  return shiftsSince >= 1 && shiftsSince <= FOLLOW_UP_RIPENESS_SHIFTS;
}

export type ShiftPartnerUnavailableReason =
  | "focus_case"
  | "cooldown"
  | "closed"
  | "closed_lane"
  | "quit"
  | "off_shift";

export type SelectShiftPartnerMemberIdsInput = {
  members: readonly Member[];
  focusedMemberIds: readonly string[];
  shiftNumber: number;
  priorityPartnerMemberIds?: readonly string[];
  cooldownExemptMemberIds?: readonly string[];
  pairStates?: readonly PairState[];
};

function isCooldownBlocking(
  member: Member,
  shiftNumber: number,
  cooldownExemptIds: ReadonlySet<string>,
): boolean {
  if (cooldownExemptIds.has(member.id)) return false;
  return isMemberInCooldown(member, shiftNumber);
}

export type SelectShiftFollowUpReservationsInput = {
  members: readonly Member[];
  focusedMemberIds: readonly string[];
  dateSessions: readonly DateSession[];
  pairStates?: readonly PairState[];
  shiftNumber: number;
};

export type ShiftPartnerAvailabilityReasonInput = {
  member: Member;
  shiftNumber: number;
  focusedMemberIds: readonly string[];
  availablePartnerMemberIds: readonly string[];
  cooldownExemptMemberIds?: readonly string[];
  pairStates?: readonly PairState[];
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
  priorityPartnerMemberIds = [],
  cooldownExemptMemberIds = [],
  pairStates = [],
}: SelectShiftPartnerMemberIdsInput): string[] {
  const focusedSet = new Set(focusedMemberIds);
  const cooldownExemptSet = new Set(cooldownExemptMemberIds);
  const candidates = members
    .filter(
      (member) =>
        member.state.status === "active" &&
        !focusedSet.has(member.id) &&
        !hasClosedLaneWithFocus(member.id, focusedSet, pairStates) &&
        !isCooldownBlocking(member, shiftNumber, cooldownExemptSet),
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

  const priorityCandidates = selectPriorityCandidates(candidates, priorityPartnerMemberIds);

  return selectWithCompositionPreferences(candidates, targetCount, priorityCandidates).map(
    (candidate) => candidate.member.id,
  );
}

export function selectShiftFollowUpReservations({
  members,
  focusedMemberIds,
  dateSessions,
  pairStates = [],
  shiftNumber,
}: SelectShiftFollowUpReservationsInput): ShiftFollowUpReservation[] {
  const memberById = new Map(members.map((member) => [member.id, member] as const));
  const focusedSet = new Set(focusedMemberIds);

  // Collect every eligible (focus, partner, session) candidate, then award
  // reservations globally by session recency. When two focuses share a pursue
  // partner, the most recent pursue wins regardless of focus iteration order.
  type Candidate = {
    focusMemberId: string;
    partnerMemberId: string;
    session: DateSession;
    completedAt: string;
  };
  const candidates: Candidate[] = [];

  for (const focusMemberId of focusedMemberIds) {
    const focusMember = memberById.get(focusMemberId);
    if (focusMember === undefined || focusMember.state.status !== "active") continue;
    const focusOnlySet = new Set([focusMemberId]);

    const eligibleSessions = dateSessions.filter(
      (session) =>
        session.participants.includes(focusMemberId) &&
        session.status !== "active" &&
        session.finalReport !== undefined &&
        isPursueWithinRipeness(session, shiftNumber),
    );

    for (const session of eligibleSessions) {
      const partnerId = session.participants.find((memberId) => memberId !== focusMemberId);
      if (partnerId === undefined || focusedSet.has(partnerId)) continue;
      const partner = memberById.get(partnerId);
      if (partner === undefined || partner.state.status !== "active") continue;
      if (hasClosedLaneWithFocus(partner.id, focusOnlySet, pairStates)) continue;

      candidates.push({
        focusMemberId,
        partnerMemberId: partnerId,
        session,
        completedAt: session.finalReport?.completedAt ?? "",
      });
    }
  }

  candidates.sort((first, second) => second.completedAt.localeCompare(first.completedAt));

  const claimedPartners = new Set<string>();
  const claimedFocuses = new Set<string>();
  const reservations: ShiftFollowUpReservation[] = [];
  for (const candidate of candidates) {
    if (claimedPartners.has(candidate.partnerMemberId)) continue;
    if (claimedFocuses.has(candidate.focusMemberId)) continue;
    claimedPartners.add(candidate.partnerMemberId);
    claimedFocuses.add(candidate.focusMemberId);
    reservations.push({
      focusMemberId: candidate.focusMemberId,
      partnerMemberId: candidate.partnerMemberId,
      sourceDateSessionId: candidate.session.id,
    });
  }

  return reservations;
}

export function followUpPartnerMemberIds(
  reservations: readonly ShiftFollowUpReservation[],
): string[] {
  return reservations.map((reservation) => reservation.partnerMemberId);
}

export function hasFollowUpReservation({
  reservations,
  focusMemberId,
  partnerMemberId,
}: {
  reservations: readonly ShiftFollowUpReservation[];
  focusMemberId: string;
  partnerMemberId: string;
}): boolean {
  return reservations.some(
    (reservation) =>
      reservation.focusMemberId === focusMemberId &&
      reservation.partnerMemberId === partnerMemberId,
  );
}

export function hydrateAvailablePartnerMemberIds({
  shift,
  members,
  focusedMemberIds,
  priorityPartnerMemberIds = [],
  cooldownExemptMemberIds = [],
  pairStates = [],
}: {
  shift: ShiftState;
  members: readonly Member[];
  focusedMemberIds: readonly string[];
  priorityPartnerMemberIds?: readonly string[];
  cooldownExemptMemberIds?: readonly string[];
  pairStates?: readonly PairState[];
}): string[] {
  const eligible = eligiblePartnerMemberIds({
    persistedMemberIds: shift.availablePartnerMemberIds,
    members,
    focusedMemberIds,
    shiftNumber: shift.shiftNumber,
    cooldownExemptMemberIds,
    pairStates,
  });

  if (shift.status !== "active") {
    return eligible;
  }

  return repairShiftPartnerMemberIds({
    members,
    focusedMemberIds,
    shiftNumber: shift.shiftNumber,
    priorityPartnerMemberIds,
    cooldownExemptMemberIds,
    pairStates,
    persistedMemberIds: eligible,
  });
}

export function repairShiftPartnerMemberIds({
  members,
  focusedMemberIds,
  shiftNumber,
  priorityPartnerMemberIds = [],
  cooldownExemptMemberIds = [],
  pairStates = [],
  persistedMemberIds,
}: SelectShiftPartnerMemberIdsInput & { persistedMemberIds: readonly string[] }): string[] {
  const expectedCount = Math.min(
    SHIFT_PARTNER_SLATE_SIZE,
    eligiblePartnerCount({
      members,
      focusedMemberIds,
      shiftNumber,
      cooldownExemptMemberIds,
      pairStates,
    }),
  );
  const prioritizedIds = eligiblePriorityPartnerMemberIds({
    members,
    focusedMemberIds,
    shiftNumber,
    priorityPartnerMemberIds,
    cooldownExemptMemberIds,
    pairStates,
  });
  const repaired = mergePartnerIds(prioritizedIds, persistedMemberIds, expectedCount);

  if (repaired.length >= expectedCount) {
    return repaired;
  }

  const seen = new Set(repaired);
  for (const memberId of selectShiftPartnerMemberIds({
    members,
    focusedMemberIds,
    shiftNumber,
    priorityPartnerMemberIds,
    cooldownExemptMemberIds,
    pairStates,
  })) {
    if (repaired.length >= expectedCount) break;
    if (seen.has(memberId)) continue;
    seen.add(memberId);
    repaired.push(memberId);
  }

  return repaired;
}

function selectPriorityCandidates(
  candidates: readonly Candidate[],
  priorityPartnerMemberIds: readonly string[],
): Candidate[] {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.member.id, candidate]));
  const selected = new Set<string>();
  const priorityCandidates: Candidate[] = [];

  for (const memberId of priorityPartnerMemberIds) {
    if (selected.has(memberId)) continue;
    const candidate = candidatesById.get(memberId);
    if (candidate === undefined) continue;
    selected.add(memberId);
    priorityCandidates.push(candidate);
  }

  return priorityCandidates;
}

function eligiblePriorityPartnerMemberIds({
  members,
  focusedMemberIds,
  shiftNumber,
  priorityPartnerMemberIds,
  cooldownExemptMemberIds,
  pairStates,
}: Required<SelectShiftPartnerMemberIdsInput>): string[] {
  const memberById = new Map(members.map((member) => [member.id, member] as const));
  const focusedSet = new Set(focusedMemberIds);
  const cooldownExemptSet = new Set(cooldownExemptMemberIds);
  const selected = new Set<string>();
  const eligibleIds: string[] = [];

  for (const memberId of priorityPartnerMemberIds) {
    if (selected.has(memberId)) continue;
    const member = memberById.get(memberId);
    if (member === undefined || member.state.status !== "active") continue;
    if (focusedSet.has(member.id)) continue;
    if (hasClosedLaneWithFocus(member.id, focusedSet, pairStates)) continue;
    if (isCooldownBlocking(member, shiftNumber, cooldownExemptSet)) continue;
    selected.add(memberId);
    eligibleIds.push(memberId);
  }

  return eligibleIds;
}

function mergePartnerIds(
  priorityPartnerMemberIds: readonly string[],
  partnerMemberIds: readonly string[],
  limit: number,
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const memberId of priorityPartnerMemberIds) {
    if (merged.length >= limit) break;
    if (seen.has(memberId)) continue;
    seen.add(memberId);
    merged.push(memberId);
  }

  for (const memberId of partnerMemberIds) {
    if (merged.length >= limit) break;
    if (seen.has(memberId)) continue;
    seen.add(memberId);
    merged.push(memberId);
  }

  return merged;
}

export function shiftPartnerUnavailableReason({
  member,
  shiftNumber,
  focusedMemberIds,
  availablePartnerMemberIds,
  cooldownExemptMemberIds = [],
  pairStates = [],
}: ShiftPartnerAvailabilityReasonInput): ShiftPartnerUnavailableReason | null {
  if (member.state.status === "closed") return "closed";
  if (member.state.status === "quit") return "quit";
  if (focusedMemberIds.includes(member.id)) return "focus_case";
  if (hasClosedLaneWithFocus(member.id, new Set(focusedMemberIds), pairStates)) {
    return "closed_lane";
  }
  const cooldownExemptSet = new Set(cooldownExemptMemberIds);
  if (isCooldownBlocking(member, shiftNumber, cooldownExemptSet)) return "cooldown";
  if (!availablePartnerMemberIds.includes(member.id)) return "off_shift";
  return null;
}

export function isMemberOnTonightBoard({
  member,
  shiftNumber,
  focusedMemberIds,
  availablePartnerMemberIds,
  cooldownExemptMemberIds = [],
  pairStates = [],
}: ShiftPartnerAvailabilityReasonInput): boolean {
  const cooldownExemptSet = new Set(cooldownExemptMemberIds);
  const focusedSet = new Set(focusedMemberIds);
  return (
    member.state.status === "active" &&
    (focusedSet.has(member.id) || !hasClosedLaneWithFocus(member.id, focusedSet, pairStates)) &&
    !isCooldownBlocking(member, shiftNumber, cooldownExemptSet) &&
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
  cooldownExemptMemberIds = [],
  pairStates = [],
}: {
  members: readonly Member[];
  shiftNumber: number;
  focusedMemberIds: readonly string[];
  availablePartnerMemberIds: readonly string[];
  cooldownExemptMemberIds?: readonly string[];
  pairStates?: readonly PairState[];
}): ShiftPartnerClassification {
  const available: Member[] = [];
  const unavailable: ShiftPartnerClassification["unavailable"] = [];

  for (const member of members) {
    const reason = shiftPartnerUnavailableReason({
      member,
      shiftNumber,
      focusedMemberIds,
      availablePartnerMemberIds,
      cooldownExemptMemberIds,
      pairStates,
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
 * identity composition. `reservedIds` are pre-locked picks (e.g., follow-up
 * priorities) that contribute to PROFILE_CAP / IDENTITY_CAP accounting so the
 * remaining slate is balanced around them. When the eligible pool is too thin
 * to satisfy the caps, fill order beats composition.
 */
function selectWithCompositionPreferences(
  candidates: readonly Candidate[],
  targetCount: number,
  priorityCandidates: readonly Candidate[] = [],
): Candidate[] {
  const reservedIds = new Set(priorityCandidates.map((candidate) => candidate.member.id));
  const reservedOrder = new Map(
    priorityCandidates.map((candidate, index) => [candidate.member.id, index] as const),
  );
  const cappedPass = selectRespectingCaps(candidates, targetCount, priorityCandidates, reservedIds);
  const selected =
    cappedPass.length < targetCount
      ? topUpRemaining(cappedPass, candidates, targetCount)
      : cappedPass;

  // Reserved priorities lead the slate (preserving their input order), then
  // the rest follow in score order so the slate stays stable for the player.
  const reserved = selected
    .filter((candidate) => reservedIds.has(candidate.member.id))
    .sort(
      (first, second) =>
        (reservedOrder.get(first.member.id) ?? 0) - (reservedOrder.get(second.member.id) ?? 0),
    );
  const rest = [...selected]
    .filter((candidate) => !reservedIds.has(candidate.member.id))
    .sort((first, second) => first.index - second.index);
  return [...reserved, ...rest];
}

function selectRespectingCaps(
  candidates: readonly Candidate[],
  targetCount: number,
  priorityCandidates: readonly Candidate[],
  reservedIds: ReadonlySet<string>,
): Candidate[] {
  const selected: Candidate[] = [];
  const profileCounts = new Map<ShiftAvailabilityProfile, number>();
  const identityCounts = new Map<Candidate["identity"], number>();

  // Reserved priorities are locked into the slate first and count against the
  // composition caps so the remaining picks stay balanced around them.
  for (const candidate of priorityCandidates) {
    if (selected.length >= targetCount) break;
    selected.push(candidate);
    profileCounts.set(candidate.profile, (profileCounts.get(candidate.profile) ?? 0) + 1);
    identityCounts.set(candidate.identity, (identityCounts.get(candidate.identity) ?? 0) + 1);
  }

  for (const candidate of candidates) {
    if (selected.length >= targetCount) break;
    if (reservedIds.has(candidate.member.id)) continue;
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
  cooldownExemptMemberIds = [],
  pairStates = [],
}: SelectShiftPartnerMemberIdsInput): number {
  const focusedSet = new Set(focusedMemberIds);
  const cooldownExemptSet = new Set(cooldownExemptMemberIds);
  return members.filter(
    (member) =>
      member.state.status === "active" &&
      !focusedSet.has(member.id) &&
      !hasClosedLaneWithFocus(member.id, focusedSet, pairStates) &&
      !isCooldownBlocking(member, shiftNumber, cooldownExemptSet),
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
  cooldownExemptMemberIds = [],
  pairStates = [],
}: {
  persistedMemberIds: readonly string[];
  members: readonly Member[];
  focusedMemberIds: readonly string[];
  shiftNumber: number;
  cooldownExemptMemberIds?: readonly string[];
  pairStates?: readonly PairState[];
}): string[] {
  const membersById = new Map(members.map((member) => [member.id, member] as const));
  const focusedSet = new Set(focusedMemberIds);
  const cooldownExemptSet = new Set(cooldownExemptMemberIds);
  const seen = new Set<string>();
  const validIds: string[] = [];

  for (const memberId of persistedMemberIds) {
    if (seen.has(memberId)) continue;
    const member = membersById.get(memberId);
    if (member === undefined) continue;
    if (member.state.status !== "active") continue;
    if (focusedSet.has(member.id)) continue;
    if (hasClosedLaneWithFocus(member.id, focusedSet, pairStates)) continue;
    if (isCooldownBlocking(member, shiftNumber, cooldownExemptSet)) continue;
    seen.add(memberId);
    validIds.push(memberId);
  }

  return validIds;
}

function hasClosedLaneWithFocus(
  memberId: string,
  focusedSet: ReadonlySet<string>,
  pairStates: readonly PairState[],
): boolean {
  return pairStates.some(
    (pairState) =>
      pairState.laneStatus === "closed" &&
      pairState.participantIds.includes(memberId) &&
      pairState.participantIds.some((participantId) => focusedSet.has(participantId)),
  );
}

function identityForMember(member: Member): Candidate["identity"] {
  if (member.tags.includes("ordinary_human")) return "ordinary_human";
  if (member.tags.includes("non_human")) return "non_human";
  return "other";
}
