import { useMemo } from "react";

import type { GameSave, ShiftState } from "../../domain/game";
import {
  applyMemberRosterFilters,
  isMemberRosterFilterActive,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import {
  shiftPartnerUnavailableReason,
  type ShiftPartnerUnavailableReason,
} from "../../services/shift-availability";
import { isMemberInCooldown } from "../../services/shift-planning";

export function useRosterFold({
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
}) {
  const focusedSet = useMemo(() => new Set(save.focusedMemberIds), [save.focusedMemberIds]);
  const eligiblePartnerIds = useMemo<ReadonlySet<string>>(() => {
    const availableSet = new Set(shift.availablePartnerMemberIds);
    const ids = new Set<string>();
    for (const member of save.members) {
      if (member.state.status !== "active") continue;
      if (focusedSet.has(member.id)) continue;
      if (!availableSet.has(member.id)) continue;
      if (isMemberInCooldown(member, shift.shiftNumber)) continue;
      ids.add(member.id);
    }
    return ids;
  }, [save.members, focusedSet, shift.availablePartnerMemberIds, shift.shiftNumber]);
  const offTonightIds = useMemo<ReadonlySet<string>>(() => {
    const availableSet = new Set(shift.availablePartnerMemberIds);
    const ids = new Set<string>();
    for (const member of save.members) {
      if (member.state.status !== "active") continue;
      if (focusedSet.has(member.id)) continue;
      if (availableSet.has(member.id)) continue;
      if (isMemberInCooldown(member, shift.shiftNumber)) continue;
      ids.add(member.id);
    }
    return ids;
  }, [save.members, shift.availablePartnerMemberIds, shift.shiftNumber, focusedSet]);
  // Per-member unavailability reason for the hover card. The lobby surfaces
  // it through the hover detail's blockReason so the player understands
  // whether a partner is career-locked, in cooldown, or simply off-rotation
  // this shift.
  const unavailabilityReasonById = useMemo<
    ReadonlyMap<string, ShiftPartnerUnavailableReason>
  >(() => {
    const map = new Map<string, ShiftPartnerUnavailableReason>();
    for (const member of save.members) {
      const reason = shiftPartnerUnavailableReason({
        member,
        shiftNumber: shift.shiftNumber,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: shift.availablePartnerMemberIds,
      });
      if (reason !== null) map.set(member.id, reason);
    }
    return map;
  }, [save.members, save.focusedMemberIds, shift.availablePartnerMemberIds, shift.shiftNumber]);
  const filteredMembers = useMemo(
    () =>
      applyMemberRosterFilters(save.members, filterState, {
        playerKnowledge: save.playerKnowledge,
        revealAllMemberDetails,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: shift.availablePartnerMemberIds,
        activeShiftNumber: shift.shiftNumber,
        readyClosureMemberIds,
      }),
    [
      save.members,
      filterState,
      save.playerKnowledge,
      revealAllMemberDetails,
      save.focusedMemberIds,
      shift.availablePartnerMemberIds,
      shift.shiftNumber,
      readyClosureMemberIds,
    ],
  );
  const filterMatchedIds = useMemo<ReadonlySet<string> | undefined>(() => {
    if (!isMemberRosterFilterActive(filterState)) return undefined;
    return new Set(filteredMembers.map((m) => m.id));
  }, [filteredMembers, filterState]);
  return {
    focusedSet,
    eligiblePartnerIds,
    offTonightIds,
    unavailabilityReasonById,
    filteredMembers,
    filterMatchedIds,
  };
}
