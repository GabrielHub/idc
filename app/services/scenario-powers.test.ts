import { describe, expect, it } from "vitest";

import { type ShiftState } from "../domain/game";
import { starterScenarios } from "../fixtures";
import {
  startDateSession,
  startNextShift,
  completeShift,
  completeDateSession,
  applyFollowUpAction,
} from "./date-engine";
import { createSeedGameSave } from "./game-seed";
import {
  discardDrawnScenario,
  evaluateScenarioPowers,
  findScenarioFixture,
  holdScenarioForTomorrow,
  isLowPressureScenario,
  requestLowPressureScenario,
} from "./scenario-powers";
import { withFeaturedMembers } from "./test-helpers";

const NOW = new Date("2026-05-08T09:00:00.000Z");

function withDrawnScenarios(shift: ShiftState, scenarioIds: string[]): ShiftState {
  return {
    ...shift,
    drawnScenarioIds: scenarioIds,
  };
}

function getActiveShiftFromSave(save: ReturnType<typeof createSeedGameSave>): ShiftState {
  const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);

  if (activeShift === undefined) {
    throw new Error("Expected an active shift in test fixture.");
  }

  return activeShift;
}

describe("scenario deck powers", () => {
  it("identifies low pressure scenarios from the fixture library", () => {
    expect(isLowPressureScenario(findScenarioFixture("temporal-coffee-shop"))).toBe(true);
    expect(isLowPressureScenario(findScenarioFixture("prophecy-karaoke"))).toBe(false);
    expect(isLowPressureScenario(findScenarioFixture("not-a-real-scenario"))).toBe(false);
  });

  it("holds a drawn scenario and carries it into the next shift", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);
    const activeShift = getActiveShiftFromSave(save);
    const heldId = activeShift.drawnScenarioIds[1];

    if (heldId === undefined) {
      throw new Error("Expected at least two drawn scenarios.");
    }

    const heldResult = holdScenarioForTomorrow(save, { scenarioId: heldId, now: NOW });

    expect(heldResult.shift.drawnScenarioIds).not.toContain(heldId);
    expect(heldResult.shift.heldScenarioId).toBe(heldId);
    expect(heldResult.shift.deckPower).toEqual({
      kind: "hold",
      scenarioId: heldId,
      usedAt: NOW.toISOString(),
    });

    const remainingId = heldResult.shift.drawnScenarioIds[0] ?? "temporal-coffee-shop";
    const started = startDateSession(heldResult.save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: remainingId,
    });
    const completed = completeDateSession(started.save, started.session.id);
    const followUp = applyFollowUpAction(completed.save, {
      dateSessionId: started.session.id,
      action: "repair",
    });
    const closed = completeShift(followUp.save, NOW);
    const next = startNextShift(closed.save, NOW);

    expect(next.shift.drawnScenarioIds[0]).toBe(heldId);
    expect(next.shift.drawnScenarioIds).toHaveLength(closed.save.config.shiftDateSlots);
    expect(new Set(next.shift.drawnScenarioIds).size).toBe(next.shift.drawnScenarioIds.length);
  });

  it("rejects holding when the drawn hand has only one room left", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);
    const trimmedShift = withDrawnScenarios(getActiveShiftFromSave(save), ["temporal-coffee-shop"]);
    const trimmedSave = {
      ...save,
      shifts: save.shifts.map((shift) => (shift.id === trimmedShift.id ? trimmedShift : shift)),
    };

    expect(() =>
      holdScenarioForTomorrow(trimmedSave, { scenarioId: "temporal-coffee-shop", now: NOW }),
    ).toThrow(/at least one room/);
  });

  it("allows a quiet room swap when it is the only remaining card", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);
    const trimmedShift = withDrawnScenarios(getActiveShiftFromSave(save), ["prophecy-karaoke"]);
    const trimmedSave = {
      ...save,
      shifts: save.shifts.map((shift) => (shift.id === trimmedShift.id ? trimmedShift : shift)),
    };

    const availability = evaluateScenarioPowers({
      shift: trimmedShift,
      selectedScenarioId: "prophecy-karaoke",
      hasActiveDate: false,
    });

    expect(availability.canHold).toBe(false);
    expect(availability.canDiscard).toBe(false);
    expect(availability.canRequestLowPressure).toBe(true);
    expect(availability.reason).toBeUndefined();

    const result = requestLowPressureScenario(trimmedSave, {
      scenarioId: "prophecy-karaoke",
      now: NOW,
    });

    expect(result.shift.drawnScenarioIds).toHaveLength(1);
    expect(result.shift.drawnScenarioIds[0]).not.toBe("prophecy-karaoke");
    expect(isLowPressureScenario(findScenarioFixture(result.shift.drawnScenarioIds[0] ?? ""))).toBe(
      true,
    );
  });

  it("discards a drawn scenario without touching the deck library", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);
    const activeShift = getActiveShiftFromSave(save);
    const targetId = activeShift.drawnScenarioIds[0];

    if (targetId === undefined) {
      throw new Error("Expected a drawn scenario.");
    }

    const result = discardDrawnScenario(save, { scenarioId: targetId, now: NOW });

    expect(result.shift.drawnScenarioIds).not.toContain(targetId);
    expect(result.shift.scenarioDeck.scenarioIds).toContain(targetId);
    expect(result.shift.deckPower?.kind).toBe("discard");
    expect(result.shift.heldScenarioId).toBeUndefined();
  });

  it("blocks a second deck power once one has been filed", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);
    const activeShift = getActiveShiftFromSave(save);
    const firstId = activeShift.drawnScenarioIds[0];
    const secondId = activeShift.drawnScenarioIds[1];

    if (firstId === undefined || secondId === undefined) {
      throw new Error("Expected at least two drawn scenarios.");
    }

    const filed = discardDrawnScenario(save, { scenarioId: firstId, now: NOW });

    expect(() => holdScenarioForTomorrow(filed.save, { scenarioId: secondId, now: NOW })).toThrow(
      /already filed a deck power/,
    );
  });

  it("swaps a high pressure room for the first unused low pressure room", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);
    const activeShift = getActiveShiftFromSave(save);
    const drawnWithHighPressure = ["prophecy-karaoke", "temporal-coffee-shop", "diner-eleven-pm"];
    const stagedShift = withDrawnScenarios(activeShift, drawnWithHighPressure);
    const stagedSave = {
      ...save,
      shifts: save.shifts.map((shift) => (shift.id === stagedShift.id ? stagedShift : shift)),
    };

    const result = requestLowPressureScenario(stagedSave, {
      scenarioId: "prophecy-karaoke",
      now: NOW,
    });
    const swappedId = result.shift.deckPower?.swappedScenarioId;

    expect(swappedId).toBeDefined();
    expect(result.shift.drawnScenarioIds).not.toContain("prophecy-karaoke");
    expect(
      swappedId === undefined ? false : result.shift.drawnScenarioIds.includes(swappedId),
    ).toBe(true);
    expect(isLowPressureScenario(findScenarioFixture(swappedId ?? ""))).toBe(true);
  });

  it("rejects requesting a quiet room when the chosen card is already low pressure", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);

    expect(() =>
      requestLowPressureScenario(save, { scenarioId: "temporal-coffee-shop", now: NOW }),
    ).toThrow(/already low pressure/);
  });

  it("evaluates power availability without mutating state", () => {
    const save = withFeaturedMembers(createSeedGameSave(NOW), ["jenna-pike", "vhool"]);
    const activeShift = getActiveShiftFromSave(save);
    const lowPressureId = activeShift.drawnScenarioIds.find((id) =>
      isLowPressureScenario(findScenarioFixture(id)),
    );

    const lowPressurePicked = evaluateScenarioPowers({
      shift: activeShift,
      selectedScenarioId: lowPressureId,
      hasActiveDate: false,
    });

    expect(lowPressurePicked.canHold).toBe(true);
    expect(lowPressurePicked.canDiscard).toBe(true);
    expect(lowPressurePicked.canRequestLowPressure).toBe(false);

    const noSelection = evaluateScenarioPowers({
      shift: activeShift,
      selectedScenarioId: undefined,
      hasActiveDate: false,
    });

    expect(noSelection.canHold).toBe(false);
    expect(noSelection.canDiscard).toBe(false);
    expect(noSelection.canRequestLowPressure).toBe(false);

    const hostileShift: ShiftState = { ...activeShift, status: "completed" };
    const closedShift = evaluateScenarioPowers({
      shift: hostileShift,
      selectedScenarioId: lowPressureId,
      hasActiveDate: false,
    });

    expect(closedShift.canHold).toBe(false);
    expect(closedShift.reason).toMatch(/closed shift/);
  });

  it("seeds the starter library with at least one low pressure room available for swaps", () => {
    const lowPressureCount = starterScenarios.filter(isLowPressureScenario).length;

    expect(lowPressureCount).toBeGreaterThan(3);
  });
});
