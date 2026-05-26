import type { GameSave, Member, ShiftState } from "../../domain/game";
import {
  applyMemberRosterFilters,
  isMemberRosterFilterActive,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import {
  followUpPartnerMemberIds,
  shiftPartnerUnavailableReason,
  type ShiftPartnerUnavailableReason,
} from "../../services/shift-availability";
import { isMemberInCooldown } from "../../services/shift-planning";

export type RosterFold = {
  focusedSet: ReadonlySet<string>;
  eligiblePartnerIds: ReadonlySet<string>;
  offTonightIds: ReadonlySet<string>;
  unavailabilityReasonById: ReadonlyMap<string, ShiftPartnerUnavailableReason>;
  filteredMembers: readonly Member[];
  filterMatchedIds: ReadonlySet<string> | undefined;
  followUpPartnerIds: ReadonlySet<string>;
};

/**
 * Pure derivation of the folded roster affordances the constellation lobby
 * needs: focused set, eligible partners, off-tonight cohort, per-member
 * unavailability reason for hover-card block copy, and the lens-filtered
 * roster slice.
 */
export function deriveRosterFold({
  save,
  shift,
  filterState,
  revealAllMemberDetails,
  readyClosureMemberIds,
}: {
  save: GameSave;
  shift: ShiftState;
  filterState: MemberRosterFilterState;
  revealAllMemberDetails: boolean;
  readyClosureMemberIds: ReadonlySet<string> | undefined;
}): RosterFold {
  const focusedSet = new Set(save.focusedMemberIds);
  const availableSet = new Set(shift.availablePartnerMemberIds);
  const followUpPartnerIds = new Set(followUpPartnerMemberIds(shift.followUpReservations));
  const eligiblePartnerIds = new Set<string>();
  const offTonightIds = new Set<string>();
  for (const member of save.members) {
    if (member.state.status !== "active") continue;
    if (focusedSet.has(member.id)) continue;
    if (isMemberInCooldown(member, shift.shiftNumber) && !followUpPartnerIds.has(member.id)) {
      continue;
    }
    if (availableSet.has(member.id)) eligiblePartnerIds.add(member.id);
    else offTonightIds.add(member.id);
  }

  // Per-member unavailability reason for the hover card. The lobby surfaces
  // it through the hover detail's blockReason so the player understands
  // whether a partner is career-locked, in cooldown, or simply off-rotation
  // this shift.
  const unavailabilityReasonById = new Map<string, ShiftPartnerUnavailableReason>();
  for (const member of save.members) {
    const reason = shiftPartnerUnavailableReason({
      member,
      shiftNumber: shift.shiftNumber,
      focusedMemberIds: save.focusedMemberIds,
      availablePartnerMemberIds: shift.availablePartnerMemberIds,
      cooldownExemptMemberIds: [...followUpPartnerIds],
      pairStates: save.pairStates,
    });
    if (reason !== null) unavailabilityReasonById.set(member.id, reason);
  }

  const filteredMembers = applyMemberRosterFilters(save.members, filterState, {
    playerKnowledge: save.playerKnowledge,
    revealAllMemberDetails,
    focusedMemberIds: save.focusedMemberIds,
    availablePartnerMemberIds: shift.availablePartnerMemberIds,
    followUpPartnerMemberIds: [...followUpPartnerIds],
    pairStates: save.pairStates,
    activeShiftNumber: shift.shiftNumber,
    readyClosureMemberIds,
  });
  const filterMatchedIds = isMemberRosterFilterActive(filterState)
    ? new Set(filteredMembers.map((m) => m.id))
    : undefined;

  return {
    focusedSet,
    eligiblePartnerIds,
    offTonightIds,
    unavailabilityReasonById,
    filteredMembers,
    filterMatchedIds,
    followUpPartnerIds,
  };
}
