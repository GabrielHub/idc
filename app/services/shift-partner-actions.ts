import { gameSaveSchema, shiftStateSchema, type GameSave } from "../domain/game";
import { followUpPartnerMemberIds, shiftPartnerUnavailableReason } from "./shift-availability";

export function swapShiftPartner(
  save: GameSave,
  {
    outgoingPartnerMemberId,
    incomingPartnerMemberId,
    swappedAt = new Date().toISOString(),
  }: {
    outgoingPartnerMemberId: string;
    incomingPartnerMemberId: string;
    swappedAt?: string;
  },
): GameSave {
  const activeShift =
    save.shifts.find((shift) => shift.id === save.activeShiftId) ??
    save.shifts[save.shifts.length - 1];

  if (activeShift === undefined) {
    throw new Error("No active shift is available for partner swapping.");
  }
  if (activeShift.status !== "active") {
    throw new Error("Partner swaps are only available during an active shift.");
  }
  if (activeShift.activeBooking !== undefined) {
    throw new Error("The roster is locked once a pair is committed.");
  }
  if (activeShift.partnerSwap !== undefined) {
    throw new Error("Cupid gets one partner roster swap per shift.");
  }
  if (outgoingPartnerMemberId === incomingPartnerMemberId) {
    throw new Error("Pick a different off-shift member to swap in.");
  }
  if (!activeShift.availablePartnerMemberIds.includes(outgoingPartnerMemberId)) {
    throw new Error("Pick a partner from tonight's roster to swap out.");
  }
  if (activeShift.availablePartnerMemberIds.includes(incomingPartnerMemberId)) {
    throw new Error("That member is already on tonight's partner roster.");
  }
  if (
    followUpPartnerMemberIds(activeShift.followUpReservations).includes(outgoingPartnerMemberId)
  ) {
    throw new Error("Follow-up reservations are pinned for this shift.");
  }

  const incomingMember = save.members.find((member) => member.id === incomingPartnerMemberId);
  if (incomingMember === undefined) {
    throw new Error(`Member ${incomingPartnerMemberId} is not on the roster.`);
  }

  const incomingReason = shiftPartnerUnavailableReason({
    member: incomingMember,
    shiftNumber: activeShift.shiftNumber,
    focusedMemberIds: save.focusedMemberIds,
    availablePartnerMemberIds: activeShift.availablePartnerMemberIds,
    cooldownExemptMemberIds: followUpPartnerMemberIds(activeShift.followUpReservations),
    pairStates: save.pairStates,
  });
  if (incomingReason !== "off_shift") {
    throw new Error("Only off-shift active members can be swapped onto tonight's roster.");
  }

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    availablePartnerMemberIds: activeShift.availablePartnerMemberIds.map((memberId) =>
      memberId === outgoingPartnerMemberId ? incomingPartnerMemberId : memberId,
    ),
    partnerSwap: {
      outgoingPartnerMemberId,
      incomingPartnerMemberId,
      swappedAt,
    },
  });

  return gameSaveSchema.parse({
    ...save,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}
