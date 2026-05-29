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
import { reconcileDrawState } from "./deck";
import { FOCUS_CASE_LIMIT } from "./focus-cases";
import { getActiveShift } from "./game-seed";
import { SHIFT_PARTNER_SLATE_SIZE, selectShiftPartnerMemberIds } from "./shift-availability";
import { starterScenarios } from "../fixtures";

/**
 * Starts a date session and immediately drafts the first three offered events
 * so tests can run against a paused, post-draft session. Scenarios outside the
 * deck are injected before booking so test fixtures stay terse.
 */
export function startAndDraftDateSession(save: GameSave, input: StartDateInput): DateEngineResult {
  const partnerMemberId =
    input.firstMemberId === input.focusMemberId ? input.secondMemberId : input.firstMemberId;
  const ready = withAvailablePartner(ensureScenarioInDeck(save, input.scenarioId), partnerMemberId);
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
  const focusRequiredMemberIds =
    requiredMemberIds === undefined || requiredMemberIds.length <= 2
      ? (requiredMemberIds ?? []).slice(0, 1)
      : requiredMemberIds;
  const candidateMemberIds = [
    ...focusRequiredMemberIds,
    ...save.focusedMemberIds,
    ...activeShift.featuredMemberIds,
  ];
  const featuredMemberIds: string[] = [];
  const desiredCount = Math.min(FOCUS_CASE_LIMIT, candidateMemberIds.length);

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
  const focusedMemberIds = featuredMemberIds.slice(0, FOCUS_CASE_LIMIT);
  const forcedPartnerIds = requiredMemberIds.filter(
    (memberId) => !focusedMemberIds.includes(memberId),
  );
  const selectedPartnerIds = selectShiftPartnerMemberIds({
    members: save.members,
    focusedMemberIds,
    shiftNumber: activeShift.shiftNumber,
  });
  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    featuredMemberIds,
    availablePartnerMemberIds: buildForcedPartnerSlate(save, [
      ...forcedPartnerIds,
      ...selectedPartnerIds,
    ]),
  });

  return gameSaveSchema.parse({
    ...save,
    focusedMemberIds,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}

export function withAvailablePartner(save: GameSave, partnerMemberId: string): GameSave {
  const activeShift = getActiveShift(save);
  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    availablePartnerMemberIds: buildForcedPartnerSlate(save, [
      partnerMemberId,
      ...activeShift.availablePartnerMemberIds,
    ]),
  });

  return gameSaveSchema.parse({
    ...save,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}

function buildForcedPartnerSlate(save: GameSave, memberIds: readonly string[]): string[] {
  const activeIds = new Set(
    save.members.filter((member) => member.state.status === "active").map((member) => member.id),
  );
  const seen = new Set<string>();
  const slate: string[] = [];

  for (const memberId of memberIds) {
    if (slate.length >= SHIFT_PARTNER_SLATE_SIZE) break;
    if (seen.has(memberId) || !activeIds.has(memberId)) continue;
    seen.add(memberId);
    slate.push(memberId);
  }

  return slate;
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

  // Swapping a card into the deck would otherwise leave the swapped-in card in
  // both the deck and the draw pile and orphan the displaced one. Reconcile so
  // deck ∪ pile ∪ offer keeps partitioning the catalog and the save stays clean
  // (no repair write on the next load).
  const withDeck = { ...save, scenarioDeck: scenarioDeckSchema.parse({ cardIds }) };
  const reconciled = reconcileDrawState(withDeck, starterScenarios);

  return gameSaveSchema.parse({
    ...withDeck,
    scenarioDeck: reconciled.scenarioDeck,
    drawPile: reconciled.drawPile,
    pendingCardOffer: reconciled.pendingCardOffer,
  });
}

/**
 * Back-compat name. The new booking flow no longer separates the drawn hand
 * from the deck; ensureScenarioInDeck is now the only call.
 */
export function ensureScenarioInHand(save: GameSave, scenarioId: string): GameSave {
  return ensureScenarioInDeck(save, scenarioId);
}
