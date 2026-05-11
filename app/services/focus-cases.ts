import { gameSaveSchema, shiftStateSchema, type GameSave, type Member } from "../domain/game";
import { selectFeaturedMemberRequestIds } from "./shift-planning";
import { clampScore } from "./utils";

export const FOCUS_CASE_LIMIT = 4;
export const FOCUS_SWAP_RETENTION_PENALTY = 25;

export function canBeFocusCase(member: Member): boolean {
  return member.state.status === "active";
}

export function selectInitialFocusCases(save: GameSave, memberIds: readonly string[]): GameSave {
  const uniqueIds = Array.from(new Set(memberIds));

  if (uniqueIds.length !== FOCUS_CASE_LIMIT) {
    throw new Error(`Cupid requires exactly ${FOCUS_CASE_LIMIT} focus cases to begin.`);
  }

  const membersById = new Map(save.members.map((member) => [member.id, member] as const));

  for (const memberId of uniqueIds) {
    const member = membersById.get(memberId);
    if (member === undefined) {
      throw new Error(`Focus case ${memberId} is not on the roster.`);
    }
    if (!canBeFocusCase(member)) {
      throw new Error(`${member.firstName} cannot be focused. Pick an active member.`);
    }
  }

  return { ...save, focusedMemberIds: uniqueIds };
}

export function addFocusCase(save: GameSave, memberId: string): GameSave {
  if (save.focusedMemberIds.includes(memberId)) {
    throw new Error("That member is already a focus case.");
  }

  if (save.focusedMemberIds.length >= FOCUS_CASE_LIMIT) {
    throw new Error("All focus slots are full. Close or swap a case first.");
  }

  const member = save.members.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Member ${memberId} is not on the roster.`);
  }
  if (!canBeFocusCase(member)) {
    throw new Error(`${member.firstName} cannot be focused. Pick an active member.`);
  }

  return { ...save, focusedMemberIds: [...save.focusedMemberIds, memberId] };
}

export function removeFocusCase(save: GameSave, memberId: string): GameSave {
  if (!save.focusedMemberIds.includes(memberId)) {
    return save;
  }

  return {
    ...save,
    focusedMemberIds: save.focusedMemberIds.filter((id) => id !== memberId),
  };
}

export function swapFocusCase(save: GameSave, oldId: string, newId: string): GameSave {
  if (!save.focusedMemberIds.includes(oldId)) {
    throw new Error(`Member ${oldId} is not a current focus case.`);
  }

  if (save.focusedMemberIds.includes(newId)) {
    throw new Error("That member is already a focus case.");
  }

  if (oldId === newId) {
    throw new Error("Pick a different member to swap in.");
  }

  const incoming = save.members.find((candidate) => candidate.id === newId);
  if (incoming === undefined) {
    throw new Error(`Member ${newId} is not on the roster.`);
  }
  if (!canBeFocusCase(incoming)) {
    throw new Error(`${incoming.firstName} cannot be focused. Pick an active member.`);
  }

  const updatedFocus = save.focusedMemberIds.map((id) => (id === oldId ? newId : id));
  const updatedMembers = save.members.map((member) => {
    if (member.id !== oldId) {
      return member;
    }
    const retention = clampScore(member.state.retention - FOCUS_SWAP_RETENTION_PENALTY);

    return {
      ...member,
      state: {
        ...member.state,
        retention,
        recentDateResult:
          retention === 0
            ? "Client file closed. Member quit the app."
            : "Case rotated off the focus board. Client confidence fell.",
        status: retention === 0 ? "quit" : member.state.status,
      },
    };
  });

  return { ...save, focusedMemberIds: updatedFocus, members: updatedMembers };
}

export function reselectFocusCases(save: GameSave, nextIds: readonly string[]): GameSave {
  const uniqueIds = Array.from(new Set(nextIds));

  if (uniqueIds.length !== FOCUS_CASE_LIMIT) {
    throw new Error(`Cupid runs on exactly ${FOCUS_CASE_LIMIT} focus cases.`);
  }

  const membersById = new Map(save.members.map((member) => [member.id, member] as const));

  for (const memberId of uniqueIds) {
    const member = membersById.get(memberId);
    if (member === undefined) {
      throw new Error(`Focus case ${memberId} is not on the roster.`);
    }
    if (!canBeFocusCase(member)) {
      throw new Error(`${member.firstName} cannot be focused. Pick an active member.`);
    }
  }

  const nextSet = new Set(uniqueIds);
  const droppedActiveIds = save.focusedMemberIds.filter((id) => {
    if (nextSet.has(id)) return false;
    const member = membersById.get(id);
    return member !== undefined && member.state.status === "active";
  });

  if (droppedActiveIds.length === 0) {
    return { ...save, focusedMemberIds: uniqueIds };
  }

  const droppedSet = new Set(droppedActiveIds);
  const updatedMembers = save.members.map((member) => {
    if (!droppedSet.has(member.id)) {
      return member;
    }
    const retention = clampScore(member.state.retention - FOCUS_SWAP_RETENTION_PENALTY);
    return {
      ...member,
      state: {
        ...member.state,
        retention,
        recentDateResult:
          retention === 0
            ? "Client file closed. Member quit the app."
            : "Case rotated off the focus board. Client confidence fell.",
        status: retention === 0 ? "quit" : member.state.status,
      },
    };
  });

  return { ...save, focusedMemberIds: uniqueIds, members: updatedMembers };
}

export function previewReselectDrops(save: GameSave, nextIds: readonly string[]): Member[] {
  const nextSet = new Set(nextIds);
  const membersById = new Map(save.members.map((member) => [member.id, member] as const));
  return save.focusedMemberIds
    .filter((id) => !nextSet.has(id))
    .map((id) => membersById.get(id))
    .filter((member): member is Member => member !== undefined && member.state.status === "active");
}

export function getFocusedMembers(save: GameSave): Member[] {
  const membersById = new Map(save.members.map((member) => [member.id, member] as const));
  return save.focusedMemberIds
    .map((memberId) => membersById.get(memberId))
    .filter((member): member is Member => member !== undefined);
}

export function syncActiveShiftFocusCases(save: GameSave): GameSave {
  const activeShift =
    save.shifts.find((shift) => shift.id === save.activeShiftId) ??
    save.shifts[save.shifts.length - 1];

  if (activeShift === undefined) {
    return save;
  }

  const activeMemberIds = new Set(
    save.members.filter((member) => member.state.status === "active").map((member) => member.id),
  );
  const activeFocusedMemberIds = save.focusedMemberIds.filter((memberId) =>
    activeMemberIds.has(memberId),
  );
  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    featuredMemberIds: save.focusedMemberIds,
    memberRequestIds: selectFeaturedMemberRequestIds({
      members: save.members,
      featuredMemberIds: activeFocusedMemberIds,
      shiftNumber: activeShift.shiftNumber,
    }),
  });

  return gameSaveSchema.parse({
    ...save,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}
