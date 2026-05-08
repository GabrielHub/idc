import {
  gameSaveSchema,
  shiftStateSchema,
  type DateScenario,
  type GameSave,
  type ShiftState,
} from "../domain/game";
import { starterScenarios } from "../fixtures";
import { getActiveShift, normalizeStarterScenarioId } from "./game-seed";
import { replaceById } from "./utils";

export type ScenarioPowerInput = {
  scenarioId: string;
  now?: Date;
};

export type ScenarioPowerResult = {
  save: GameSave;
  shift: ShiftState;
};

export type ScenarioPowerAvailability = {
  canHold: boolean;
  canDiscard: boolean;
  canRequestLowPressure: boolean;
  lowPressureSwapTargetId: string | undefined;
  reason: string | undefined;
};

const POWER_BLOCKED_REASONS = {
  shiftClosed: "Cupid powers are unavailable on a closed shift.",
  alreadyUsed: "Cupid already filed a deck power for this shift.",
  activeDate: "Resolve the active date before filing a deck power.",
  notInHand: "That scenario is not in today's drawn hand.",
  cannotEmptyHand: "Cupid needs at least one room booked for today.",
  alreadyLowPressure: "That room is already low pressure.",
  noLowPressureLeft: "Procurement has no quiet rooms left to swap in.",
};

export function isLowPressureScenario(scenario: DateScenario | undefined): boolean {
  return scenario?.card.tags.includes("low_pressure") ?? false;
}

const STARTER_SCENARIOS_BY_ID: ReadonlyMap<string, DateScenario> = new Map(
  starterScenarios.map((scenario) => [scenario.id, scenario]),
);

export function findScenarioFixture(scenarioId: string): DateScenario | undefined {
  return STARTER_SCENARIOS_BY_ID.get(normalizeStarterScenarioId(scenarioId));
}

export function evaluateScenarioPowers({
  shift,
  selectedScenarioId,
  hasActiveDate,
}: {
  shift: ShiftState;
  selectedScenarioId: string | undefined;
  hasActiveDate: boolean;
}): ScenarioPowerAvailability {
  if (shift.status !== "active") {
    return blocked(POWER_BLOCKED_REASONS.shiftClosed);
  }

  if (shift.deckPower !== undefined) {
    return blocked(POWER_BLOCKED_REASONS.alreadyUsed);
  }

  if (hasActiveDate) {
    return blocked(POWER_BLOCKED_REASONS.activeDate);
  }

  if (selectedScenarioId === undefined || !shift.drawnScenarioIds.includes(selectedScenarioId)) {
    return blocked(POWER_BLOCKED_REASONS.notInHand);
  }

  const drawnHandHasRoom = shift.drawnScenarioIds.length > 1;
  const selectedScenario = findScenarioFixture(selectedScenarioId);
  const selectedIsLowPressure = isLowPressureScenario(selectedScenario);
  const swapTargetId = findLowPressureSwapTargetId({
    scenarioDeckIds: shift.scenarioDeck.scenarioIds,
    drawnScenarioIds: shift.drawnScenarioIds,
  });
  const canRequestLowPressure = !selectedIsLowPressure && swapTargetId !== undefined;

  return {
    canHold: drawnHandHasRoom,
    canDiscard: drawnHandHasRoom,
    canRequestLowPressure,
    lowPressureSwapTargetId: swapTargetId,
    reason:
      drawnHandHasRoom || canRequestLowPressure ? undefined : POWER_BLOCKED_REASONS.cannotEmptyHand,
  };
}

export function holdScenarioForTomorrow(
  save: GameSave,
  input: ScenarioPowerInput,
): ScenarioPowerResult {
  const { activeShift, timestamp } = requirePowerContext(save, input);
  requireScenarioInHand(activeShift, input.scenarioId);

  if (activeShift.drawnScenarioIds.length <= 1) {
    throw new Error(POWER_BLOCKED_REASONS.cannotEmptyHand);
  }

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    drawnScenarioIds: activeShift.drawnScenarioIds.filter((id) => id !== input.scenarioId),
    heldScenarioId: input.scenarioId,
    deckPower: {
      kind: "hold",
      scenarioId: input.scenarioId,
      usedAt: timestamp,
    },
  });

  return persistShift(save, updatedShift, timestamp);
}

export function discardDrawnScenario(
  save: GameSave,
  input: ScenarioPowerInput,
): ScenarioPowerResult {
  const { activeShift, timestamp } = requirePowerContext(save, input);
  requireScenarioInHand(activeShift, input.scenarioId);

  if (activeShift.drawnScenarioIds.length <= 1) {
    throw new Error(POWER_BLOCKED_REASONS.cannotEmptyHand);
  }

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    drawnScenarioIds: activeShift.drawnScenarioIds.filter((id) => id !== input.scenarioId),
    deckPower: {
      kind: "discard",
      scenarioId: input.scenarioId,
      usedAt: timestamp,
    },
  });

  return persistShift(save, updatedShift, timestamp);
}

export function requestLowPressureScenario(
  save: GameSave,
  input: ScenarioPowerInput,
): ScenarioPowerResult {
  const { activeShift, timestamp } = requirePowerContext(save, input);
  requireScenarioInHand(activeShift, input.scenarioId);

  const targetScenario = findScenarioFixture(input.scenarioId);

  if (isLowPressureScenario(targetScenario)) {
    throw new Error(POWER_BLOCKED_REASONS.alreadyLowPressure);
  }

  const swapInScenarioId = findLowPressureSwapTargetId({
    scenarioDeckIds: activeShift.scenarioDeck.scenarioIds,
    drawnScenarioIds: activeShift.drawnScenarioIds,
  });

  if (swapInScenarioId === undefined) {
    throw new Error(POWER_BLOCKED_REASONS.noLowPressureLeft);
  }

  const drawnScenarioIds = activeShift.drawnScenarioIds.map((id) =>
    id === input.scenarioId ? swapInScenarioId : id,
  );

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    drawnScenarioIds,
    deckPower: {
      kind: "request_low_pressure",
      scenarioId: input.scenarioId,
      swappedScenarioId: swapInScenarioId,
      usedAt: timestamp,
    },
  });

  return persistShift(save, updatedShift, timestamp);
}

export function applyHeldScenarioToDrawnIds({
  drawnScenarioIds,
  heldScenarioId,
  scenarioLibraryIds,
  shiftDateSlots,
}: {
  drawnScenarioIds: string[];
  heldScenarioId: string | undefined;
  scenarioLibraryIds: readonly string[];
  shiftDateSlots: number;
}): string[] {
  if (heldScenarioId === undefined || !scenarioLibraryIds.includes(heldScenarioId)) {
    return drawnScenarioIds;
  }

  const filtered = drawnScenarioIds.filter((id) => id !== heldScenarioId);
  return [heldScenarioId, ...filtered].slice(0, shiftDateSlots);
}

function findLowPressureSwapTargetId({
  scenarioDeckIds,
  drawnScenarioIds,
}: {
  scenarioDeckIds: readonly string[];
  drawnScenarioIds: readonly string[];
}): string | undefined {
  const drawnSet = new Set(drawnScenarioIds);

  for (const scenarioId of scenarioDeckIds) {
    if (drawnSet.has(scenarioId)) {
      continue;
    }

    if (isLowPressureScenario(findScenarioFixture(scenarioId))) {
      return scenarioId;
    }
  }

  return undefined;
}

function requirePowerContext(
  save: GameSave,
  input: ScenarioPowerInput,
): { activeShift: ShiftState; timestamp: string } {
  const activeShift = getActiveShift(save);

  if (activeShift.status !== "active") {
    throw new Error(POWER_BLOCKED_REASONS.shiftClosed);
  }

  if (activeShift.deckPower !== undefined) {
    throw new Error(POWER_BLOCKED_REASONS.alreadyUsed);
  }

  if (
    save.dateSessions.some(
      (session) =>
        session.id.startsWith(`date-${activeShift.shiftNumber}-`) && session.status === "active",
    )
  ) {
    throw new Error(POWER_BLOCKED_REASONS.activeDate);
  }

  return {
    activeShift,
    timestamp: (input.now ?? new Date()).toISOString(),
  };
}

function requireScenarioInHand(shift: ShiftState, scenarioId: string): void {
  if (!shift.drawnScenarioIds.includes(scenarioId)) {
    throw new Error(POWER_BLOCKED_REASONS.notInHand);
  }
}

function persistShift(save: GameSave, shift: ShiftState, timestamp: string): ScenarioPowerResult {
  const nextSave = gameSaveSchema.parse({
    ...save,
    shifts: replaceById(save.shifts, shift),
    updatedAt: timestamp,
  });

  return { save: nextSave, shift };
}

function blocked(reason: string): ScenarioPowerAvailability {
  return {
    canHold: false,
    canDiscard: false,
    canRequestLowPressure: false,
    lowPressureSwapTargetId: undefined,
    reason,
  };
}
