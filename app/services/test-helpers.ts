import { gameSaveSchema, shiftStateSchema, type GameSave } from "../domain/game";
import {
  EVENT_DRAFT_PICKED,
  pickScenarioEvents,
  startDateSession,
  type DateEngineResult,
  type StartDateInput,
} from "./date-engine";
import { SHIFT_FEATURED_MEMBER_COUNT } from "./shift-planning";

/**
 * Starts a date session and immediately drafts the first three offered events
 * so tests can run against a paused, post-draft session. Real flows route the
 * draft through the player; tests skip it for brevity.
 */
export function startAndDraftDateSession(save: GameSave, input: StartDateInput): DateEngineResult {
  const started = startDateSession(save, input);

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
