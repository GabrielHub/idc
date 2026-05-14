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
 * deck are injected before booking so test fixtures stay terse.
 */
export function startAndDraftDateSession(save: GameSave, input: StartDateInput): DateEngineResult {
  const ready = ensureScenarioInDeck(save, input.scenarioId);
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
 * Updates focus cases and the active shift's featuredMemberIds. Tests that need
 * a known focus list call this before booking a date.
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
 * Ensures a scenarioId is in the active deck. The booking flow draws the hand
 * from the deck at commit time, so tests just need the card present.
 */
export function ensureScenarioInDeck(save: GameSave, scenarioId: string): GameSave {
  let cardIds: string[];
  if (save.scenarioDeck.cardIds.includes(scenarioId)) {
    cardIds = [...save.scenarioDeck.cardIds];
  } else if (save.scenarioDeck.cardIds.length === 0) {
    cardIds = [scenarioId];
  } else {
    cardIds = [...save.scenarioDeck.cardIds];
    cardIds[cardIds.length - 1] = scenarioId;
  }

  const updatedDeck = scenarioDeckSchema.parse({ cardIds });

  return gameSaveSchema.parse({
    ...save,
    scenarioDeck: updatedDeck,
  });
}

/**
 * Back-compat name. The new booking flow no longer separates the drawn hand
 * from the deck; ensureScenarioInDeck is now the only call.
 */
export function ensureScenarioInHand(save: GameSave, scenarioId: string): GameSave {
  return ensureScenarioInDeck(save, scenarioId);
}
