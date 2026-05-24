import { describe, expect, it } from "vitest";

import { gameSaveSchema, memberSchema, type GameSave, type Member } from "../domain/game";
import { createSeedGameSave, getActiveShift } from "./game-seed";
import { resolveFocusSelectionAffordance } from "./focus-selection-affordance";

describe("resolveFocusSelectionAffordance", () => {
  it("blocks lead selection for a cooling focused member", () => {
    const { save, member, shiftNumber } = buildFocusedJenna({ cooling: true });

    const affordance = resolveFocusSelectionAffordance({
      member,
      focused: save.focusedMemberIds.includes(member.id),
      focusId: null,
      partnerId: null,
      activeBooking: null,
      shiftNumber,
    });

    expect(affordance.canMakeLead).toBe(false);
    expect(affordance.inCooldown).toBe(true);
    expect(affordance.statusBadge).toBe("cooling");
    expect(affordance.blockReason).toBe("In cooldown until next shift");
  });

  it("allows lead selection when the focused member is active and not cooling", () => {
    const { save, member, shiftNumber } = buildFocusedJenna({ cooling: false });

    const affordance = resolveFocusSelectionAffordance({
      member,
      focused: save.focusedMemberIds.includes(member.id),
      focusId: null,
      partnerId: null,
      activeBooking: null,
      shiftNumber,
    });

    expect(affordance.canMakeLead).toBe(true);
    expect(affordance.inCooldown).toBe(false);
    expect(affordance.statusBadge).toBe("focus");
    expect(affordance.blockReason).toBeUndefined();
  });
});

function buildFocusedJenna({ cooling }: { cooling: boolean }): {
  save: GameSave;
  member: Member;
  shiftNumber: number;
} {
  const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
  const shift = { ...getActiveShift(seed), shiftNumber: 2 };
  const save = gameSaveSchema.parse({
    ...seed,
    focusedMemberIds: ["jenna-pike", "vhool", "sienna-bae", "kade-sumner"],
    members: seed.members.map((member) => {
      if (member.id !== "jenna-pike") return member;
      const baseState = { ...member.state, status: "active" as const };
      if (cooling) {
        return memberSchema.parse({
          ...member,
          state: { ...baseState, lastDateShift: 1 },
        });
      }
      const { lastDateShift: _drop, ...stateWithoutLastDate } = baseState;
      return memberSchema.parse({
        ...member,
        state: stateWithoutLastDate,
      });
    }),
    shifts: seed.shifts.map((candidate) => (candidate.id === shift.id ? shift : candidate)),
  });
  const member = save.members.find((candidate) => candidate.id === "jenna-pike");
  if (member === undefined) throw new Error("Expected Jenna fixture.");
  return { save, member, shiftNumber: getActiveShift(save).shiftNumber };
}
