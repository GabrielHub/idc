import { describe, expect, it } from "vitest";

import { memberRequests } from "../fixtures";
import { createSeedGameSave } from "./game-seed";
import {
  addFocusCase,
  canBeFocusCase,
  FOCUS_CASE_LIMIT,
  FOCUS_SWAP_RETENTION_PENALTY,
  getFocusedMembers,
  removeFocusCase,
  selectInitialFocusCases,
  syncActiveShiftFocusCases,
  swapFocusCase,
} from "./focus-cases";

function pickInitialIds(save: ReturnType<typeof createSeedGameSave>): string[] {
  return save.members
    .filter(canBeFocusCase)
    .slice(0, FOCUS_CASE_LIMIT)
    .map((member) => member.id);
}

describe("focus cases service", () => {
  it("selectInitialFocusCases rejects fewer than 4 selected", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save).slice(0, 3);
    expect(() => selectInitialFocusCases(save, ids)).toThrow();
  });

  it("selectInitialFocusCases rejects more than 4 selected", () => {
    const save = createSeedGameSave();
    const ids = save.members
      .filter(canBeFocusCase)
      .slice(0, 5)
      .map((member) => member.id);
    expect(() => selectInitialFocusCases(save, ids)).toThrow();
  });

  it("selectInitialFocusCases stores exactly 4 ids", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save);
    const next = selectInitialFocusCases(save, ids);
    expect(next.focusedMemberIds).toEqual(ids);
    expect(getFocusedMembers(next)).toHaveLength(FOCUS_CASE_LIMIT);
  });

  it("addFocusCase fills an open slot", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save).slice(0, 3);
    const partial = { ...save, focusedMemberIds: ids };
    const extra = save.members.filter(canBeFocusCase)[3];
    if (extra === undefined) {
      throw new Error("Expected at least 4 active members in starter roster.");
    }
    const next = addFocusCase(partial, extra.id);
    expect(next.focusedMemberIds).toHaveLength(4);
    expect(next.focusedMemberIds).toContain(extra.id);
  });

  it("addFocusCase rejects when 4 cases already exist", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save);
    const seeded = selectInitialFocusCases(save, ids);
    const extra = save.members.filter(canBeFocusCase)[4];
    if (extra === undefined) {
      throw new Error("Expected at least 5 active members in starter roster.");
    }
    expect(() => addFocusCase(seeded, extra.id)).toThrow();
  });

  it("removeFocusCase frees the slot without retention penalty", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save);
    const seeded = selectInitialFocusCases(save, ids);
    const removed = ids[0];
    if (removed === undefined) {
      throw new Error("Expected at least one focus id.");
    }
    const next = removeFocusCase(seeded, removed);
    expect(next.focusedMemberIds).not.toContain(removed);
    const member = next.members.find((candidate) => candidate.id === removed);
    expect(member?.state.retention).toBe(100);
  });

  it("swapFocusCase deducts 25 retention from the dropped member", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save);
    const seeded = selectInitialFocusCases(save, ids);
    const droppedId = ids[0];
    const incoming = save.members.filter(canBeFocusCase)[4];
    if (droppedId === undefined || incoming === undefined) {
      throw new Error("Expected enough active members.");
    }
    const before = save.members.find((member) => member.id === droppedId)?.state.retention ?? 100;
    const next = swapFocusCase(seeded, droppedId, incoming.id);
    const afterMember = next.members.find((member) => member.id === droppedId);

    expect(next.focusedMemberIds).toHaveLength(4);
    expect(next.focusedMemberIds).toContain(incoming.id);
    expect(next.focusedMemberIds).not.toContain(droppedId);
    expect(afterMember?.state.retention).toBe(Math.max(0, before - FOCUS_SWAP_RETENTION_PENALTY));
  });

  it("swapFocusCase marks the dropped member quit when retention reaches zero", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save);
    const droppedId = ids[0];
    const incoming = save.members.filter(canBeFocusCase)[4];

    if (droppedId === undefined || incoming === undefined) {
      throw new Error("Expected enough active members.");
    }

    const seeded = selectInitialFocusCases(
      {
        ...save,
        members: save.members.map((member) =>
          member.id === droppedId
            ? { ...member, state: { ...member.state, retention: FOCUS_SWAP_RETENTION_PENALTY } }
            : member,
        ),
      },
      ids,
    );
    const next = swapFocusCase(seeded, droppedId, incoming.id);
    const dropped = next.members.find((member) => member.id === droppedId);

    expect(dropped?.state.retention).toBe(0);
    expect(dropped?.state.status).toBe("quit");
    expect(dropped?.state.recentDateResult).toBe("Client file closed. Member quit the app.");
  });

  it("syncActiveShiftFocusCases mirrors focus cases and assigns their requests", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save);
    const next = syncActiveShiftFocusCases(selectInitialFocusCases(save, ids));
    const activeShift = next.shifts.find((shift) => shift.id === next.activeShiftId);
    if (activeShift === undefined) {
      throw new Error("Expected an active shift.");
    }

    expect(activeShift.featuredMemberIds).toEqual(ids);
    expect(activeShift.memberRequestIds).toHaveLength(ids.length);
    for (const requestId of activeShift.memberRequestIds) {
      const request = memberRequests.find((candidate) => candidate.id === requestId);
      expect(request).toBeDefined();
      expect(ids).toContain(request?.memberId);
    }
  });

  it("syncActiveShiftFocusCases preserves open focus slots", () => {
    const save = createSeedGameSave();
    const ids = pickInitialIds(save);
    const removedId = ids[0];
    if (removedId === undefined) {
      throw new Error("Expected a focus id.");
    }
    const seeded = syncActiveShiftFocusCases(selectInitialFocusCases(save, ids));
    const next = syncActiveShiftFocusCases(removeFocusCase(seeded, removedId));
    const activeShift = next.shifts.find((shift) => shift.id === next.activeShiftId);
    if (activeShift === undefined) {
      throw new Error("Expected an active shift.");
    }

    expect(next.focusedMemberIds).toHaveLength(FOCUS_CASE_LIMIT - 1);
    expect(activeShift.featuredMemberIds).toEqual(next.focusedMemberIds);
    expect(activeShift.memberRequestIds).toHaveLength(FOCUS_CASE_LIMIT - 1);
  });

  it("canBeFocusCase requires active status", () => {
    const save = createSeedGameSave();
    const member = save.members[0];
    if (member === undefined) {
      throw new Error("Expected at least one member.");
    }
    expect(canBeFocusCase(member)).toBe(true);

    const closed = { ...member, state: { ...member.state, status: "closed" as const } };
    expect(canBeFocusCase(closed)).toBe(false);

    const quit = { ...member, state: { ...member.state, status: "quit" as const } };
    expect(canBeFocusCase(quit)).toBe(false);
  });
});
