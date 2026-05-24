import { useMemo } from "react";

import type { GameSave, Member, ShiftState } from "../../domain/game";
import { FOCUS_CASE_LIMIT, FOCUS_SWAP_RETENTION_PENALTY } from "../../services/focus-cases";
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
  reselectDraft,
}: {
  save: GameSave;
  shift: ShiftState;
  filterState: MemberRosterFilterState;
  revealAllMemberDetails: boolean;
  readyClosureMemberIds: ReadonlySet<string> | undefined;
  reselectDraft: readonly string[] | null;
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
  const draftCount = reselectDraft?.length ?? 0;
  const draftFull = draftCount >= FOCUS_CASE_LIMIT;
  const reselectDrops = useMemo<Member[]>(() => {
    if (reselectDraft === null) return [];
    const draftIds = new Set(reselectDraft);
    const byId = new Map(save.members.map((m) => [m.id, m] as const));
    return save.focusedMemberIds
      .filter((id) => !draftIds.has(id))
      .map((id) => byId.get(id))
      .filter((m): m is Member => m !== undefined && m.state.status === "active");
  }, [reselectDraft, save.focusedMemberIds, save.members]);

  return {
    focusedSet,
    eligiblePartnerIds,
    offTonightIds,
    unavailabilityReasonById,
    filteredMembers,
    filterMatchedIds,
    draftCount,
    draftFull,
    reselectDrops,
    totalDropCost: reselectDrops.length * FOCUS_SWAP_RETENTION_PENALTY,
  };
}
