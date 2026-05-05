import { gameSaveSchema, shiftStateSchema, type GameSave } from "../domain/game";
import { SHIFT_FEATURED_MEMBER_COUNT } from "./shift-planning";

export function buildFeaturedMemberIds(
  save: GameSave,
  requiredMemberIds: readonly string[] | undefined,
): string[] {
  const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);
  const candidateMemberIds = [
    ...(requiredMemberIds ?? []),
    ...(activeShift?.featuredMemberIds ?? []),
    ...save.members.map((member) => member.id),
  ];
  const featuredMemberIds: string[] = [];
  const desiredCount = Math.min(SHIFT_FEATURED_MEMBER_COUNT, save.members.length);

  for (const memberId of candidateMemberIds) {
    if (
      featuredMemberIds.length >= desiredCount ||
      featuredMemberIds.includes(memberId) ||
      !save.members.some((member) => member.id === memberId)
    ) {
      continue;
    }

    featuredMemberIds.push(memberId);
  }

  return featuredMemberIds;
}

export function withFeaturedMembers(save: GameSave, requiredMemberIds: string[]): GameSave {
  const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);

  if (activeShift === undefined) {
    throw new Error("Expected an active shift.");
  }

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    featuredMemberIds: buildFeaturedMemberIds(save, requiredMemberIds),
  });

  return gameSaveSchema.parse({
    ...save,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}
