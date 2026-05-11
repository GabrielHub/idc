import {
  gameSaveSchema,
  scenarioDeckSchema,
  shiftStateSchema,
  type GameSave,
} from "../domain/game";
import {
  EVENT_DRAFT_PICKED,
  pickScenarioEvents,
  startDateSession,
  type DateEngineResult,
  type StartDateInput,
} from "./date-engine";
import { FOCUS_CASE_LIMIT } from "./focus-cases";
import { getActiveShift } from "./game-seed";

/**
 * Starts a date session and immediately drafts the first three offered events
 * so tests can run against a paused, post-draft session. Scenarios outside the
 * drawn hand are injected before booking so test fixtures stay terse.
 */
export function startAndDraftDateSession(save: GameSave, input: StartDateInput): DateEngineResult {
  const ready = ensureScenarioInHand(save, input.scenarioId);
  const started = startDateSession(ready, input);

  if (started.session.playbackState !== "drafting") {
    return started;
  }

  const picks = started.session.eventDraft.offered.slice(0, EVENT_DRAFT_PICKED);

  return pickScenarioEvents(started.save, {
    dateSessionId: started.session.id,
    pickedEventIds: picks,
  });
}

export function buildFeaturedMemberIds(
  save: GameSave,
  requiredMemberIds: readonly string[] | undefined,
): string[] {
  const activeShift = getActiveShift(save);
  const candidateMemberIds = [
    ...(requiredMemberIds ?? []),
    ...save.focusedMemberIds,
    ...activeShift.featuredMemberIds,
    ...save.members.map((member) => member.id),
  ];
  const featuredMemberIds: string[] = [];
  const desiredCount = Math.min(FOCUS_CASE_LIMIT, save.members.length);

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

/**
 * Updates focus cases, the active shift's featuredMemberIds, and ensures the
 * required scenarios are in the deck/hand for tests that need a known set of
 * focused members.
 */
export function withFeaturedMembers(save: GameSave, requiredMemberIds: string[]): GameSave {
  const activeShift = getActiveShift(save);
  const featuredMemberIds = buildFeaturedMemberIds(save, requiredMemberIds);
  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    featuredMemberIds,
  });

  return gameSaveSchema.parse({
    ...save,
    focusedMemberIds: featuredMemberIds.slice(0, FOCUS_CASE_LIMIT),
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}

/**
 * Ensures a scenarioId is in the active shift's drawn hand and the deck. Useful
 * for tests that pre-seed a specific scenario for the date booking path.
 */
export function ensureScenarioInHand(save: GameSave, scenarioId: string): GameSave {
  const activeShift = getActiveShift(save);

  const drawn = activeShift.drawnScenarioIds.includes(scenarioId)
    ? activeShift.drawnScenarioIds
    : [...activeShift.drawnScenarioIds, scenarioId];

  let cardIds: string[];
  if (save.scenarioDeck.cardIds.includes(scenarioId)) {
    cardIds = [...save.scenarioDeck.cardIds];
  } else {
    const drawnSet = new Set(drawn);
    const replaceableIndex = save.scenarioDeck.cardIds.findIndex((id) => !drawnSet.has(id));
    if (replaceableIndex === -1) {
      throw new Error(
        `Cannot inject ${scenarioId}: every deck slot is already pinned by the drawn hand.`,
      );
    }
    cardIds = save.scenarioDeck.cardIds.map((id, index) =>
      index === replaceableIndex ? scenarioId : id,
    );
  }

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    drawnScenarioIds: drawn,
  });

  const updatedDeck = scenarioDeckSchema.parse({
    cardIds,
    pendingLibraryPick: save.scenarioDeck.pendingLibraryPick,
    retiredCards: save.scenarioDeck.retiredCards,
  });

  return gameSaveSchema.parse({
    ...save,
    scenarioDeck: updatedDeck,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}
