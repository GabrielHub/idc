import {
  activeDateBookingSchema,
  dateFinalReportSchema,
  dateSessionSchema,
  gameSaveSchema,
  judgeSnapshotSchema,
  memoryRecordSchema,
  pairStatsSchema,
  RELATIONSHIP_STATS,
  shiftReportSchema,
  shiftStateSchema,
  type ActiveDateBooking,
  type CompanyGoal,
  type CupidIntervention,
  type DateFinalReport,
  type DateMessage,
  type DateScenario,
  type DeckCoverageEntry,
  type EndSentiment,
  type DateSession,
  type EventDraft,
  type FollowUpAction,
  type GameSave,
  type GoalMetric,
  type GoalScoreStatus,
  type JudgeSnapshot,
  type Member,
  type MemoryRecord,
  type PairState,
  type PairStats,
  type MemberRequest,
  type PlaybackState,
  type RelationshipStat,
  type ScenarioEvent,
  type ScenarioEventKind,
  SCENARIO_EVENT_KINDS,
  type ScenarioTag,
  type ShiftGoalResult,
  type ShiftReport,
  type ShiftState,
} from "../domain/game";
import { companyGoals, memberRequests, starterScenarios } from "../fixtures";
import {
  findMemberInSave,
  getActiveShift,
  makePairId,
  normalizeStarterScenarioId,
} from "./game-seed";
import {
  applyMatchFitToJudgeSnapshot,
  evaluateMatchFit,
  scenarioRoomReadFromMatchFit,
} from "./match-fit";
import {
  applyJudgeReveals,
  buildRevealCandidates,
  filterExchangeEligibleRevealCandidates,
  selectDeterministicRevealIds,
  visibleReadsForPair,
} from "./player-knowledge";
import {
  applyCompletedDatePairMemoryEffects,
  applyFollowUpPairMemoryEffects,
  applyJudgePairMemoryEffects,
} from "./pair-memory";
import { derivePairTrajectory } from "./pair-trajectory";
import {
  CLIENT_LOSS_LIMIT_BASE,
  CLOSURE_THRESHOLD,
  clientLossLimit,
  evaluateClosureReadiness,
} from "./closures";
import {
  activeBudgetDiscountOffers,
  applyBudgetChange,
  applyMemberQuitBudgetCut,
  buildPerformanceReviewReasons,
  computeEffectiveCosts,
  deriveDeckBudgetStatus,
  rotateBudgetPeriod,
  shouldRunPerformanceReview,
} from "./budget";
import { drawHandForBooking } from "./deck";
import {
  isMemberInCooldown,
  pickNextMemberRequestId,
  selectFeaturedMemberRequestIds,
  selectShiftCompanyGoalIds,
} from "./shift-planning";
import { clampDelta, clampScore, pushIntoBucket, replaceById, shuffleInPlace } from "./utils";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

export { PERFORMANCE_REVIEW_INTERVAL } from "./budget";

export type StartDateInput = {
  focusMemberId: string;
  firstMemberId: string;
  secondMemberId: string;
  scenarioId: string;
  now?: Date;
};

export type AdvanceDateInput = {
  dateSessionId: string;
  turnCount?: 1 | 2;
  now?: Date;
};

export type InterventionInput = {
  dateSessionId: string;
  targetMemberId: string;
  text: string;
  now?: Date;
};

export type FollowUpInput = {
  dateSessionId: string;
  action: FollowUpAction;
};

export type DateEngineResult = {
  save: GameSave;
  session: DateSession;
};

const CHARACTER_TURN_LIMIT = 24;
const CHARACTER_TURNS_PER_EXCHANGE = 2;
export const JUDGE_TURN_INTERVAL = 6;
export const MAX_NUDGES_PER_DATE = 3;
export const EVENT_DRAFT_OFFERED_PER_KIND = 2;
export const EVENT_DRAFT_OFFERED = EVENT_DRAFT_OFFERED_PER_KIND * SCENARIO_EVENT_KINDS.length;
export const EVENT_DRAFT_PICKED = 3;
export const CLOSURE_NEAR_MISS_TAG = "closure_near_miss";
export { CLIENT_LOSS_LIMIT_BASE, CLOSURE_THRESHOLD, clientLossLimit };

export type OutcomeStateDeltas = {
  retention: number;
  mood: number;
  burnout: number;
};

const FINAL_OUTCOME_DELTAS: Record<DateFinalReport["outcome"], OutcomeStateDeltas> = {
  second_date: { retention: 2, mood: 3, burnout: -2 },
  mixed: { retention: -3, mood: -1, burnout: 1 },
  cool_down: { retention: -7, mood: -4, burnout: 4 },
  bad_fit: { retention: -14, mood: -7, burnout: 6 },
  early_end: { retention: -18, mood: -9, burnout: 8 },
};

export type CommitDateBookingInput = {
  focusMemberId: string;
  partnerMemberId: string;
  now?: Date;
};

export type CommitDateBookingResult = {
  save: GameSave;
  booking: ActiveDateBooking;
};

export function commitDateBooking(
  save: GameSave,
  input: CommitDateBookingInput,
): CommitDateBookingResult {
  if (input.focusMemberId === input.partnerMemberId) {
    throw new Error("Cupid requires two different members for a match.");
  }

  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const activeShift = getActiveShift(save);

  if (activeShift.status !== "active") {
    throw new Error("No active shift is available.");
  }

  if (activeShift.activeBooking !== undefined) {
    throw new Error("This shift already has a committed booking.");
  }

  if (hasActiveDateInShift(save, activeShift.shiftNumber)) {
    throw new Error("Resolve the active date before assigning another match.");
  }

  if (activeShift.dateSlotsUsed >= activeShift.dateSlotsTotal) {
    throw new Error("This shift's date is already booked.");
  }

  const focusMember = requireMember(save, input.focusMemberId);
  const partnerMember = requireMember(save, input.partnerMemberId);

  if (isCampaignLost(save)) {
    throw new Error("Cupid has lost too many clients to book another date.");
  }

  if (focusMember.state.status !== "active" || partnerMember.state.status !== "active") {
    throw new Error("Cupid cannot book closed or quit members.");
  }

  if (!save.focusedMemberIds.includes(focusMember.id)) {
    throw new Error("The focused member is not on the case board.");
  }

  if (
    isMemberInCooldown(focusMember, activeShift.shiftNumber) ||
    isMemberInCooldown(partnerMember, activeShift.shiftNumber)
  ) {
    throw new Error("One of the members is still in cooldown from a recent date.");
  }

  const offers = activeBudgetDiscountOffers(save);
  const effectiveCosts = computeEffectiveCosts(starterScenarios, offers);
  const status = deriveDeckBudgetStatus({
    cardIds: save.scenarioDeck.cardIds,
    effectiveCosts,
    budgetCap: save.budgetCap,
  });

  if (status.status !== "within_budget") {
    throw new Error(
      status.status === "over_budget"
        ? "Date book is over budget. Drop cards before booking."
        : "Date book is not at a legal size. Adjust the deck before booking.",
    );
  }

  const pairId = makePairId(focusMember.id, partnerMember.id);
  const drawnIds = drawHandForBooking({
    deck: save.scenarioDeck,
    shiftNumber: activeShift.shiftNumber,
    pairId,
  });

  if (drawnIds.length < 3) {
    throw new Error("Cupid could not draw three scenarios from the active deck.");
  }

  const drawnTuple: [string, string, string] = [drawnIds[0], drawnIds[1], drawnIds[2]];
  const bookingId = `booking-${activeShift.shiftNumber}-${pairId}`;
  const participantTuple: [string, string] = [focusMember.id, partnerMember.id];
  const booking = activeDateBookingSchema.parse({
    id: bookingId,
    status: "scenario_selection",
    shiftNumber: activeShift.shiftNumber,
    focusMemberId: focusMember.id,
    participantIds: participantTuple,
    pairId,
    deckSnapshot: {
      cardIds: [...save.scenarioDeck.cardIds],
      budgetCap: save.budgetCap,
      budgetPeriodId: save.budgetPeriodId,
      effectiveCosts,
      discountOfferIds: offers.map((offer) => offer.id),
    },
    drawnScenarioIds: drawnTuple,
    committedAt: timestamp,
  });

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    drawnScenarioIds: drawnTuple,
    activeBooking: booking,
    dateSlotsUsed: activeShift.dateSlotsUsed + 1,
  });

  const nextSave = gameSaveSchema.parse({
    ...save,
    shifts: replaceById(save.shifts, updatedShift),
    updatedAt: timestamp,
  });

  return { save: nextSave, booking };
}

export function clearActiveBooking(save: GameSave): GameSave {
  const activeShift = getActiveShift(save);
  const booking = activeShift.activeBooking;
  if (booking === undefined) {
    return save;
  }
  if (booking.status === "session_active") {
    throw new Error("Resolve the active date session before clearing the booking.");
  }
  const { activeBooking: _booking, ...rest } = activeShift;
  const updatedShift = shiftStateSchema.parse({
    ...rest,
    dateSlotsUsed: Math.max(0, activeShift.dateSlotsUsed - 1),
    drawnScenarioIds: [],
  });
  return gameSaveSchema.parse({
    ...save,
    shifts: replaceById(save.shifts, updatedShift),
  });
}

export type StartDateSessionFromBookingInput = {
  scenarioId: string;
  now?: Date;
};

export function startDateSessionFromBooking(
  save: GameSave,
  input: StartDateSessionFromBookingInput,
): DateEngineResult {
  const activeShift = getActiveShift(save);
  const booking = activeShift.activeBooking;

  if (booking === undefined) {
    throw new Error("Cupid has no committed booking on this shift.");
  }

  if (booking.status === "session_active") {
    throw new Error("This booking is already running a date session.");
  }

  if (!booking.drawnScenarioIds.includes(input.scenarioId)) {
    throw new Error("That scenario is not in today's drawn hand.");
  }

  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const scenario = requireScenario(input.scenarioId);
  const focusMember = requireMember(save, booking.focusMemberId);
  const otherMemberId = booking.participantIds.find((id) => id !== booking.focusMemberId);
  if (otherMemberId === undefined) {
    throw new Error("Booking participant data is invalid.");
  }
  const otherMember = requireMember(save, otherMemberId);
  const pairState = requirePairState(save, booking.pairId);
  const focusRequest = findFocusRequest(activeShift, focusMember.id);
  const activeRequests = focusRequest === undefined ? [] : [focusRequest];
  const matchFit = evaluateMatchFit({
    members: [focusMember, otherMember],
    scenario,
    pairState,
    activeRequests,
    knownPairReads: visibleReadsForPair(save, pairState.id),
  });
  const participants: [string, string] = [focusMember.id, otherMember.id];
  const sessionId = `${shiftSessionPrefix(activeShift.shiftNumber)}${activeShift.dateSlotsUsed}-${booking.pairId}-${scenario.id}`;
  const openingMessage: DateMessage = {
    id: `${sessionId}-msg-0`,
    dateSessionId: sessionId,
    kind: "scenario",
    turnIndex: 0,
    sequenceIndex: 0,
    text: scenario.publicBrief.openingSituation,
    createdAt: timestamp,
  };
  const privateStateByCharacter = Object.fromEntries(
    participants.map((memberId) => {
      const member = memberId === focusMember.id ? focusMember : otherMember;
      return [
        memberId,
        {
          mood: member.state.mood,
          comfort: 62,
          intent: "trying",
        },
      ];
    }),
  );
  const eventDraft = drawScenarioEventOffer(scenario, Math.random, {
    pairState,
    completedSessions: save.dateSessions,
  });
  const draftIsTrivial = eventDraft.offered.length <= EVENT_DRAFT_PICKED;
  const initialEventDraft: EventDraft = draftIsTrivial
    ? { offered: eventDraft.offered, picked: [...eventDraft.offered] }
    : eventDraft;
  const initialPlaybackState: PlaybackState = draftIsTrivial ? "paused" : "drafting";
  const session = dateSessionSchema.parse({
    id: sessionId,
    pairId: booking.pairId,
    scenarioId: scenario.id,
    focusMemberId: focusMember.id,
    focusRequestId: focusRequest?.id,
    turnLimit: save.config.defaultDateMessageLimit ?? CHARACTER_TURN_LIMIT,
    currentTurn: 0,
    dateHealth: clampScore(startingDateHealth(pairState) + matchFit.startingDateHealthDelta),
    status: "active",
    runtimeMode: "local_ai",
    participants,
    transcript: [openingMessage],
    privateStateByCharacter,
    judgeSnapshots: [],
    eventDraft: initialEventDraft,
    eventsTriggered: [],
    playbackState: initialPlaybackState,
    endSentiment: null,
    interventions: [],
  });
  const updatedBooking = activeDateBookingSchema.parse({
    ...booking,
    status: "session_active",
    dateSessionId: sessionId,
  });
  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    activeBooking: updatedBooking,
  });

  const nextSave = gameSaveSchema.parse({
    ...save,
    dateSessions: [...save.dateSessions, session],
    shifts: replaceById(save.shifts, updatedShift),
    updatedAt: timestamp,
  });

  return { save: nextSave, session };
}

/**
 * Compatibility wrapper for the previous one-shot flow. Internally commits the
 * booking and starts the session. The booking is committed, the deterministic
 * draw is overridden so the requested scenario lands in the hand for the
 * caller (tests usually want a known scenario), and then the session starts.
 */
export function startDateSession(save: GameSave, input: StartDateInput): DateEngineResult {
  const committed = commitDateBooking(save, {
    focusMemberId: input.focusMemberId,
    partnerMemberId:
      input.firstMemberId === input.focusMemberId ? input.secondMemberId : input.firstMemberId,
    now: input.now,
  });
  const activeShift = getActiveShift(committed.save);
  const booking = activeShift.activeBooking;
  if (booking === undefined) {
    throw new Error("Booking unexpectedly missing after commit.");
  }
  if (!booking.drawnScenarioIds.includes(input.scenarioId)) {
    // Test-only callers may need a specific scenario in the drawn hand. Pin
    // the requested scenario at slot 0 and pad the rest from the booking's
    // existing draw so the hand is still three cards.
    const padding = booking.drawnScenarioIds.filter((id) => id !== input.scenarioId);
    const adjustedDraw: [string, string, string] = [
      input.scenarioId,
      padding[0] ?? booking.drawnScenarioIds[1] ?? booking.drawnScenarioIds[0],
      padding[1] ?? booking.drawnScenarioIds[2] ?? booking.drawnScenarioIds[0],
    ];
    if (!booking.deckSnapshot.cardIds.includes(input.scenarioId)) {
      throw new Error("Requested scenario is not in the active deck.");
    }
    const updatedBooking = activeDateBookingSchema.parse({
      ...booking,
      drawnScenarioIds: adjustedDraw,
    });
    const updatedShift = shiftStateSchema.parse({
      ...activeShift,
      drawnScenarioIds: adjustedDraw,
      activeBooking: updatedBooking,
    });
    const adjustedSave = gameSaveSchema.parse({
      ...committed.save,
      shifts: replaceById(committed.save.shifts, updatedShift),
    });
    return startDateSessionFromBooking(adjustedSave, {
      scenarioId: input.scenarioId,
      now: input.now,
    });
  }
  return startDateSessionFromBooking(committed.save, {
    scenarioId: input.scenarioId,
    now: input.now,
  });
}

export function canAddCupidIntervention(session: DateSession): boolean {
  if (session.status !== "active" || session.playbackState !== "paused") {
    return false;
  }

  return session.interventions.length < MAX_NUDGES_PER_DATE;
}

export function findActiveInterventionForMember(
  session: DateSession,
  memberId: string,
): CupidIntervention | undefined {
  for (let index = session.interventions.length - 1; index >= 0; index -= 1) {
    const intervention = session.interventions[index];

    if (intervention === undefined || intervention.targetMemberId !== memberId) {
      continue;
    }

    if (!hasMemberSpokenSinceIntervention(session, intervention)) {
      return intervention;
    }
  }

  return undefined;
}

export function isInterventionActiveForMember(session: DateSession, memberId: string): boolean {
  return findActiveInterventionForMember(session, memberId) !== undefined;
}

export function isInterventionMessageActiveForMember(
  session: DateSession,
  message: DateMessage,
  memberId: string,
): boolean {
  if (message.kind !== "cupid" || message.targetMemberId !== memberId) {
    return false;
  }

  return isCurrentInterventionMessage(session, message, memberId);
}

export function isCurrentInterventionMessage(
  session: DateSession,
  message: DateMessage,
  memberId: string,
): boolean {
  if (message.kind !== "cupid" || message.targetMemberId !== memberId) {
    return false;
  }

  const intervention = session.interventions.find(
    (candidate) =>
      candidate.usedAtTurn === message.turnIndex && candidate.targetMemberId === memberId,
  );

  if (intervention === undefined) {
    return false;
  }

  return !hasMemberSpokenSinceIntervention(session, intervention);
}

function hasMemberSpokenSinceIntervention(
  session: DateSession,
  intervention: CupidIntervention,
): boolean {
  return session.transcript.some(
    (message) =>
      message.kind === "character" &&
      message.speakerId === intervention.targetMemberId &&
      message.turnIndex > intervention.usedAtTurn,
  );
}

export function findScenarioEventById(
  scenario: DateScenario,
  eventId: string,
): ScenarioEvent | undefined {
  return scenario.director.events.find((event) => event.id === eventId);
}

export function lastTriggeredEvent(
  scenario: DateScenario,
  session: DateSession,
): ScenarioEvent | undefined {
  const lastId = session.eventsTriggered.at(-1);

  if (lastId === undefined) {
    return undefined;
  }

  return findScenarioEventById(scenario, lastId);
}

export function isAtExchangeBoundary(currentTurn: number): boolean {
  return currentTurn % CHARACTER_TURNS_PER_EXCHANGE === 0;
}

export function isAtJudgeBoundary(currentTurn: number): boolean {
  return currentTurn > 0 && currentTurn % JUDGE_TURN_INTERVAL === 0;
}

export function addCupidIntervention(save: GameSave, input: InterventionInput): DateEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const session = requireDateSession(save, input.dateSessionId);

  if (session.status !== "active") {
    throw new Error("Cupid interventions are only available during active dates.");
  }

  if (session.playbackState !== "paused") {
    throw new Error("Pause the date before filing a nudge.");
  }

  if (session.interventions.length >= MAX_NUDGES_PER_DATE) {
    throw new Error("Cupid has used all available nudges on this date.");
  }

  if (!session.participants.includes(input.targetMemberId)) {
    throw new Error("Cupid can only nudge one of the active date members.");
  }

  const trimmedText = input.text.trim();

  if (trimmedText.length === 0 || trimmedText.length > 240) {
    throw new Error("Cupid interventions must be between 1 and 240 characters.");
  }

  const interventionId = `${session.id}-nudge-${session.interventions.length + 1}`;
  const interventionMessage: DateMessage = {
    id: `${session.id}-msg-${session.transcript.length}`,
    dateSessionId: session.id,
    kind: "cupid",
    turnIndex: session.currentTurn,
    sequenceIndex: session.transcript.length,
    text: formatCupidInterventionText(trimmedText),
    createdAt: timestamp,
    targetMemberId: input.targetMemberId,
  };
  const newIntervention: CupidIntervention = {
    id: interventionId,
    text: trimmedText,
    usedAtTurn: session.currentTurn,
    targetMemberId: input.targetMemberId,
  };
  const updatedSession = dateSessionSchema.parse({
    ...session,
    transcript: [...session.transcript, interventionMessage],
    interventions: [...session.interventions, newIntervention],
  });
  const nextSave = replaceDateSession(save, updatedSession, timestamp);

  return { save: nextSave, session: updatedSession };
}

export function formatCupidInterventionText(text: string): string {
  return `Cupid suggests: ${text}`;
}

export type DrawScenarioEventContext = {
  pairState?: PairState;
  completedSessions?: readonly DateSession[];
};

export function drawScenarioEventOffer(
  scenario: DateScenario,
  randomFn: () => number = Math.random,
  context: DrawScenarioEventContext = {},
): EventDraft {
  const buckets = new Map<ScenarioEventKind, ScenarioEvent[]>();

  for (const event of scenario.director.events) {
    pushIntoBucket(buckets, event.kind, event);
  }

  const offered: string[] = [];

  for (const kind of SCENARIO_EVENT_KINDS) {
    const bucket = buckets.get(kind) ?? [];
    shuffleInPlace(bucket, randomFn);
    const rankedBucket = rankScenarioEventBucket(bucket, kind, context);

    const targetCount = Math.min(EVENT_DRAFT_OFFERED_PER_KIND, rankedBucket.length);

    for (let index = 0; index < targetCount; index += 1) {
      const event = rankedBucket[index];

      if (event !== undefined) {
        offered.push(event.id);
      }
    }
  }

  return {
    offered,
    picked: null,
  };
}

function rankScenarioEventBucket(
  bucket: readonly ScenarioEvent[],
  kind: ScenarioEventKind,
  context: DrawScenarioEventContext,
): ScenarioEvent[] {
  if (context.pairState === undefined) {
    return [...bucket];
  }

  const trajectory = derivePairTrajectory({
    pairState: context.pairState,
    completedSessions: context.completedSessions ?? [],
  });
  const openLoopCount = context.pairState.openLoops.filter((loop) => loop.status === "open").length;

  return [...bucket]
    .map((event, index) => ({
      event,
      index,
      score: scoreScenarioEventForPair(event, kind, trajectory.state, openLoopCount),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.event);
}

function scoreScenarioEventForPair(
  event: ScenarioEvent,
  kind: ScenarioEventKind,
  trajectoryState: ReturnType<typeof derivePairTrajectory>["state"],
  openLoopCount: number,
): number {
  const text = [event.title, event.event, event.characterVisibleText, event.directorInstruction]
    .join(" ")
    .toLowerCase();
  let score = 0;

  if (trajectoryState === "brittle") {
    if (kind === "ambient") score += 2;
    if (hasEventKeyword(text, ["quiet", "small", "care", "repair", "offer", "calm"])) score += 3;
    if (hasEventKeyword(text, ["pressure", "public", "loud", "deadline", "trap"])) score -= 3;
  }

  if (trajectoryState === "stuck" || openLoopCount > 0) {
    if (hasEventKeyword(text, ["choice", "question", "plan", "return", "again", "offer"])) {
      score += 3;
    }
    if (hasEventKeyword(text, ["unfinished", "almost", "answer", "asks"])) score += 2;
  }

  if (trajectoryState === "closure_runway") {
    if (kind === "reveal") score += 1;
    if (hasEventKeyword(text, ["future", "together", "leave", "next", "home", "return"])) {
      score += 4;
    }
    if (hasEventKeyword(text, ["panic", "pressure", "public"])) score -= 2;
  }

  if (trajectoryState === "recovering") {
    if (hasEventKeyword(text, ["repair", "offer", "care", "quiet", "small"])) score += 2;
  }

  return score;
}

function hasEventKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export type PickScenarioEventsInput = {
  dateSessionId: string;
  pickedEventIds: string[];
  now?: Date;
};

export function pickScenarioEvents(
  save: GameSave,
  input: PickScenarioEventsInput,
): DateEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const session = requireDateSession(save, input.dateSessionId);

  if (session.playbackState !== "drafting") {
    throw new Error("Scenario events can only be drafted before the date begins.");
  }

  const offered = new Set(session.eventDraft.offered);
  const allowedPickCount = Math.min(EVENT_DRAFT_PICKED, session.eventDraft.offered.length);
  const uniquePicks = Array.from(new Set(input.pickedEventIds));

  if (uniquePicks.length !== allowedPickCount) {
    throw new Error(`Cupid drafts exactly ${allowedPickCount} events for this date.`);
  }

  for (const eventId of uniquePicks) {
    if (!offered.has(eventId)) {
      throw new Error(`Event ${eventId} was not offered in this draft.`);
    }
  }

  const updatedSession = dateSessionSchema.parse({
    ...session,
    eventDraft: {
      offered: session.eventDraft.offered,
      picked: uniquePicks,
    },
    playbackState: "paused",
  });
  const nextSave = replaceDateSession(save, updatedSession, timestamp);

  return { save: nextSave, session: updatedSession };
}

export type TriggerScenarioEventInput = {
  dateSessionId: string;
  eventId: string;
  now?: Date;
};

export function triggerScenarioEvent(
  save: GameSave,
  input: TriggerScenarioEventInput,
): DateEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const session = requireDateSession(save, input.dateSessionId);
  const scenario = requireScenario(session.scenarioId);

  if (session.status !== "active") {
    throw new Error("Scenario events can only be triggered during an active date.");
  }

  if (session.playbackState !== "paused") {
    throw new Error("Pause the date before dropping a scenario event.");
  }

  const picked = session.eventDraft.picked;

  if (picked === null) {
    throw new Error("Cupid has not drafted scenario events for this date yet.");
  }

  if (!picked.includes(input.eventId)) {
    throw new Error("That scenario event is not in this date's drafted lineup.");
  }

  if (session.eventsTriggered.includes(input.eventId)) {
    throw new Error("That scenario event was already triggered on this date.");
  }

  const event = findScenarioEventById(scenario, input.eventId);

  if (event === undefined) {
    throw new Error(`Scenario event ${input.eventId} not found in scenario ${scenario.id}.`);
  }

  const eventMessage = createNonCharacterMessage(
    session,
    "scenario",
    event.characterVisibleText,
    timestamp,
  );
  const updatedSession = dateSessionSchema.parse({
    ...session,
    transcript: [...session.transcript, eventMessage],
    eventsTriggered: [...session.eventsTriggered, input.eventId],
  });
  const nextSave = replaceDateSession(save, updatedSession, timestamp);

  return { save: nextSave, session: updatedSession };
}

export type TogglePlaybackInput = {
  dateSessionId: string;
  desiredState: PlaybackState;
  now?: Date;
};

export function togglePlayback(save: GameSave, input: TogglePlaybackInput): DateEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const session = requireDateSession(save, input.dateSessionId);

  if (session.status !== "active") {
    throw new Error("Playback toggles only apply to active dates.");
  }

  if (input.desiredState !== "paused" && input.desiredState !== "playing") {
    throw new Error("Playback can only flip between paused and playing.");
  }

  if (session.playbackState === "drafting") {
    throw new Error("Pick scenario events before starting playback.");
  }

  if (session.playbackState === "ended") {
    throw new Error("This date has already ended.");
  }

  const updatedSession = dateSessionSchema.parse({
    ...session,
    playbackState: input.desiredState,
  });
  const nextSave = replaceDateSession(save, updatedSession, timestamp);

  return { save: nextSave, session: updatedSession };
}

export function advanceDateExchange(save: GameSave, input: AdvanceDateInput): DateEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const session = requireDateSession(save, input.dateSessionId);

  if (session.status !== "active") {
    return { save, session };
  }

  if (session.playbackState === "drafting" || session.playbackState === "ended") {
    return { save, session };
  }

  const scenario = requireScenario(session.scenarioId);
  const pairState = requirePairState(save, session.pairId);
  const members = session.participants.map((memberId) => requireMember(save, memberId));
  const focusRequest = findMemberRequestById(session.focusRequestId);
  const transcript = [...session.transcript];
  let currentTurn = session.currentTurn;
  const turnCount = input.turnCount ?? CHARACTER_TURNS_PER_EXCHANGE;

  for (let index = 0; index < turnCount && currentTurn < session.turnLimit; index += 1) {
    const speaker = members[currentTurn % members.length];
    const partner = members[(currentTurn + 1) % members.length];
    transcript.push(
      createCharacterMessage({
        session: { ...session, transcript, currentTurn },
        speaker,
        partner,
        scenario,
        pairState,
        createdAt: timestamp,
      }),
    );
    currentTurn += 1;

    if (isAtJudgeBoundary(currentTurn)) {
      break;
    }
  }

  const lastJudgedExchangeIndex = latestJudgedExchangeIndex(session);
  const exchangeMessages = transcript.filter(
    (message) =>
      message.kind === "character" &&
      exchangeIndexForTurn(message.turnIndex) > lastJudgedExchangeIndex,
  );
  const pendingRevealMessages = messagesSinceLastJudge(session, transcript);
  const shouldJudgeExchange = shouldJudgePendingExchange({
    currentTurn,
    turnLimit: session.turnLimit,
    exchangeMessages,
  });

  if (!shouldJudgeExchange) {
    const updatedSession = dateSessionSchema.parse({
      ...session,
      currentTurn,
      transcript,
    });
    const nextSave = gameSaveSchema.parse({
      ...save,
      dateSessions: replaceById(save.dateSessions, updatedSession),
      updatedAt: timestamp,
    });

    return { save: nextSave, session: updatedSession };
  }

  const exchangeIndex = exchangeIndexForTurn(currentTurn);
  const deterministicJudgeSnapshot = judgeExchangeDeterministically({
    session,
    pairState,
    members,
    scenario,
    exchangeMessages,
    exchangeIndex,
  });
  const matchFit = evaluateMatchFit({
    members,
    scenario,
    pairState,
    activeRequests: focusRequest === undefined ? [] : [focusRequest],
    knownPairReads: visibleReadsForPair(save, pairState.id),
  });
  const judgeSnapshotBeforeReveals = applyMatchFitToJudgeSnapshot({
    session,
    pairState,
    judgeSnapshot: deterministicJudgeSnapshot,
  });
  const revealCandidates = buildRevealCandidates({
    members,
    scenario,
    pairState,
    focusRequest,
    matchFit,
  });
  const eligibleCandidates = filterExchangeEligibleRevealCandidates({
    candidates: revealCandidates,
    exchangeMessages: pendingRevealMessages,
  });
  const deterministicAcceptedIds = selectDeterministicRevealIds({
    candidates: eligibleCandidates,
    judgeSnapshot: judgeSnapshotBeforeReveals,
  });
  const judgeSnapshot = judgeSnapshotSchema.parse({
    ...judgeSnapshotBeforeReveals,
    usedEvidenceIds: deterministicAcceptedIds,
  });
  const judgedPairState = applyJudgeToPairState(pairState, judgeSnapshot);
  const pairMemoryResult = applyJudgePairMemoryEffects({
    pairState: judgedPairState,
    judgeSnapshot,
    timestamp,
  });
  const updatedPairState = pairMemoryResult.pairState;
  const updatedMembers = applyJudgeToMembers(save.members, judgeSnapshot);
  const nextDateHealth = clampScore(session.dateHealth + judgeSnapshot.dateHealthDelta);
  const isEndingEarly = nextDateHealth <= 0 || judgeSnapshot.shouldEndEarly;
  const isCompletingNaturally = !isEndingEarly && currentTurn >= session.turnLimit;
  const nextStatus = isEndingEarly
    ? "ended_early"
    : isCompletingNaturally
      ? "completed"
      : session.status;
  const nextEndSentiment = isEndingEarly
    ? resolveEndedDateSentiment(nextDateHealth, judgeSnapshot)
    : session.endSentiment;
  const nextPlaybackState = nextStatus === "active" ? session.playbackState : "ended";
  const baseUpdatedSession = dateSessionSchema.parse({
    ...session,
    currentTurn,
    dateHealth: nextDateHealth,
    status: nextStatus,
    endSentiment: nextEndSentiment,
    playbackState: nextPlaybackState,
    transcript,
    judgeSnapshots: [...session.judgeSnapshots, judgeSnapshot],
  });
  const revealResult = applyJudgeReveals({
    save,
    candidates: eligibleCandidates,
    acceptedIds: deterministicAcceptedIds,
    judgeSnapshot,
    revealedAt: timestamp,
  });
  const shouldFinish = nextStatus !== "active";
  const completedSession = shouldFinish
    ? finalizeDateSession({
        session: baseUpdatedSession,
        pairState: updatedPairState,
        members,
        scenario,
        completedAt: timestamp,
      })
    : baseUpdatedSession;
  const finalPairState =
    completedSession.finalReport === undefined
      ? updatedPairState
      : markPairDateComplete(updatedPairState, completedSession);
  const completedPairMemoryResult =
    completedSession.finalReport === undefined
      ? { pairState: finalPairState, memories: [] }
      : applyCompletedDatePairMemoryEffects({
          pairState: finalPairState,
          session: completedSession,
          timestamp,
        });
  const dateMemoryRecords =
    completedSession.finalReport === undefined
      ? []
      : createDateMemoryRecords(
          completedSession,
          members,
          scenario,
          timestamp,
          completedPairMemoryResult.pairState,
        );
  const finalSession = linkFinalReportMemoryRecords(
    completedSession,
    dateMemoryRecords.map((memory) => memory.id),
  );
  const finalMemories =
    finalSession.finalReport === undefined
      ? [...save.memories, ...pairMemoryResult.memories]
      : [
          ...save.memories,
          ...pairMemoryResult.memories,
          ...completedPairMemoryResult.memories,
          ...dateMemoryRecords,
        ];
  const finalMembers =
    finalSession.finalReport === undefined
      ? updatedMembers
      : applyDateFinalReportToMembers(
          updatedMembers,
          finalSession,
          getActiveShift(save).shiftNumber,
        );
  const shiftsAfterCompletion =
    finalSession.finalReport === undefined
      ? save.shifts
      : clearActiveBookingForShift(save.shifts, save.activeShiftId);
  const saveWithCompletedDate = gameSaveSchema.parse({
    ...save,
    members: finalMembers,
    pairStates: replaceById(save.pairStates, completedPairMemoryResult.pairState),
    dateSessions: replaceById(save.dateSessions, finalSession),
    memories: finalMemories,
    playerKnowledge: revealResult.save.playerKnowledge,
    shifts: shiftsAfterCompletion,
    updatedAt: timestamp,
  });
  const nextSave = gameSaveSchema.parse(
    applyMemberQuitBudgetCut({
      previousSave: save,
      nextSave: saveWithCompletedDate,
      shift: getActiveShift(save).shiftNumber,
    }),
  );

  return { save: nextSave, session: finalSession };
}

export function clearActiveBookingForShift(
  shifts: readonly ShiftState[],
  activeShiftId: string,
): ShiftState[] {
  return shifts.map((shift) => {
    if (shift.id !== activeShiftId || shift.activeBooking === undefined) {
      return shift;
    }
    const { activeBooking: _booking, ...rest } = shift;
    return shiftStateSchema.parse(rest);
  });
}

export function completeDateSession(
  save: GameSave,
  dateSessionId: string,
  now = new Date(),
): DateEngineResult {
  let nextSave = save;
  let nextSession = requireDateSession(save, dateSessionId);

  if (nextSession.playbackState === "drafting") {
    throw new Error("Pick scenario events before resolving the date.");
  }

  while (nextSession.status === "active") {
    const result = advanceDateExchange(nextSave, {
      dateSessionId,
      now,
    });

    if (result.session.currentTurn === nextSession.currentTurn) {
      break;
    }

    nextSave = result.save;
    nextSession = result.session;
  }

  return { save: nextSave, session: nextSession };
}

export function applyFollowUpAction(save: GameSave, input: FollowUpInput): DateEngineResult {
  const timestamp = new Date().toISOString();
  const session = requireDateSession(save, input.dateSessionId);

  if (session.finalReport === undefined) {
    throw new Error("Follow-up actions require a completed date report.");
  }

  if (session.finalReport.appliedFollowUp !== undefined) {
    throw new Error("Cupid already filed the follow-up for this date.");
  }

  const pairState = requirePairState(save, session.pairId);
  const effects = resolveFollowUpEffects(pairState, session, input.action);
  const pairStateWithStats = {
    ...pairState,
    stats: pairStatsSchema.parse(adjustStats(pairState.stats, effects.statDeltas)),
  };
  const pairMemoryResult = applyFollowUpPairMemoryEffects({
    pairState: pairStateWithStats,
    session,
    action: input.action,
    timestamp,
  });
  const updatedPairState = pairMemoryResult.pairState;
  const updatedSession = dateSessionSchema.parse({
    ...session,
    finalReport: dateFinalReportSchema.parse({
      ...session.finalReport,
      appliedFollowUp: input.action,
    }),
  });
  const updatedMembers = applyFollowUpToMembers(save.members, session, effects.memberDeltas);
  const saveWithFollowUp = gameSaveSchema.parse({
    ...save,
    members: updatedMembers,
    pairStates: replaceById(save.pairStates, updatedPairState),
    dateSessions: replaceById(save.dateSessions, updatedSession),
    memories: [...save.memories, ...pairMemoryResult.memories],
    updatedAt: timestamp,
  });
  const nextSave = gameSaveSchema.parse(
    applyMemberQuitBudgetCut({
      previousSave: save,
      nextSave: saveWithFollowUp,
      shift: getActiveShift(save).shiftNumber,
    }),
  );

  return { save: nextSave, session: updatedSession };
}

export function completeShift(
  save: GameSave,
  now = new Date(),
): { save: GameSave; report: ShiftReport } {
  const timestamp = now.toISOString();
  const activeShift = getActiveShift(save);
  const shiftDateSessions = save.dateSessions.filter((session) =>
    sessionBelongsToShift(session, activeShift.shiftNumber),
  );

  if (activeShift.activeBooking !== undefined) {
    throw new Error("Resolve or cancel the active booking before filing the shift.");
  }

  if (shiftDateSessions.some((session) => session.status === "active")) {
    throw new Error("Resolve active dates before ending the shift.");
  }

  const completedDates = shiftDateSessions.filter((session) => session.status !== "active");
  const earlyEndedDates = completedDates.filter((session) => session.status === "ended_early");
  const ignoredRequests = findIgnoredShiftRequests(activeShift, completedDates);
  const goalMetrics = buildShiftGoalMetrics({
    shift: activeShift,
    dateSessions: save.dateSessions,
    members: save.members,
    memberMoodAdjustments: buildIgnoredRequestMoodAdjustments(ignoredRequests),
  });
  const goalResults = activeShift.companyGoalIds.map((goalId) => scoreGoal(goalId, goalMetrics));
  const deckCoverage = buildDeckCoverage({ save, shift: activeShift });
  const penalizedMembers = applyIgnoredRequestPenalties(save.members, ignoredRequests);
  const updatedMembers = rotateMemberRequestsForShift(
    penalizedMembers,
    activeShift,
    completedDates,
  );
  const saveAfterMembers: GameSave = {
    ...save,
    members: updatedMembers,
  };
  const saveAfterQuitCuts = applyMemberQuitBudgetCut({
    previousSave: save,
    nextSave: saveAfterMembers,
    shift: activeShift.shiftNumber,
  });

  let saveWithBudgetReview = saveAfterQuitCuts;
  let budgetReviewForReport: ShiftReport["budgetReview"] | undefined;
  if (
    shouldRunPerformanceReview({
      save: saveAfterQuitCuts,
      shiftNumber: activeShift.shiftNumber,
    })
  ) {
    const reviewResult = runPerformanceReview(saveAfterQuitCuts, activeShift.shiftNumber);
    saveWithBudgetReview = reviewResult.save;
    budgetReviewForReport = reviewResult.review;
  }

  const report = shiftReportSchema.parse({
    id: `report-${activeShift.id}`,
    shiftId: activeShift.id,
    completedAt: timestamp,
    completedDates: completedDates.length,
    earlyEndedDates: earlyEndedDates.length,
    ordinaryNonHumanDates: goalMetrics.ordinaryNonHumanDates,
    memberMoodDelta: goalMetrics.memberMoodDelta,
    goalResults,
    ignoredRequestIds: ignoredRequests.map((request) => request.id),
    offeredScenarioIds: [],
    summary: buildShiftSummary(
      completedDates.length,
      earlyEndedDates.length,
      goalMetrics.memberMoodDelta,
    ),
    hrNote: buildShiftHrNote({
      completedDates,
      ignoredRequests,
      members: save.members,
    }),
    budgetReview: budgetReviewForReport,
    deckCoverage,
  });
  const { activeBooking: _activeBooking, ...shiftWithoutBooking } = activeShift;
  const updatedShift = shiftStateSchema.parse({
    ...shiftWithoutBooking,
    status: "completed",
    completedAt: timestamp,
    report,
  });
  const nextSave = gameSaveSchema.parse({
    ...saveWithBudgetReview,
    shifts: replaceById(saveWithBudgetReview.shifts, updatedShift),
    updatedAt: timestamp,
  });

  return { save: nextSave, report };
}

function runPerformanceReview(
  save: GameSave,
  shiftNumber: number,
): { save: GameSave; review: NonNullable<ShiftReport["budgetReview"]> } {
  const windowStart = save.lastBudgetReviewShift;
  const closuresSinceLastReview = countClosuresInWindow(save, windowStart);
  const quitsSinceLastReview = countQuitEventsInWindow(save, windowStart);
  const averageActiveRetention = averageRetention(save.members);
  const { averageHealth, averageFriction } = pairStatsAverages(save.pairStates);
  const requestFulfillmentRate = recentRequestFulfillmentRate(save, windowStart);

  const reasons = buildPerformanceReviewReasons({
    save,
    shiftNumber,
    closuresSinceLastReview,
    quitsSinceLastReview,
    averageActiveRetention,
    averagePairHealth: averageHealth,
    averagePairFriction: averageFriction,
    requestFulfillmentRate,
  });

  const { newCap, review } = applyBudgetChange({
    previousCap: save.budgetCap,
    reasons,
    shift: shiftNumber,
  });

  const focusedRequests = save.focusedMemberIds
    .map((memberId) => findCurrentRequestForMember(save.members, memberId))
    .filter((request): request is MemberRequest => request !== undefined);
  const recentClosureTags = collectRecentClosurePairTags(save, windowStart);
  const reviewShift = save.shifts.find((shift) => shift.shiftNumber === shiftNumber);
  const activeCompanyGoalIds = new Set(reviewShift?.companyGoalIds ?? []);
  const activeCompanyGoals = companyGoals.filter((goal) => activeCompanyGoalIds.has(goal.id));

  const withRotatedPeriod = rotateBudgetPeriod({
    save: {
      ...save,
      budgetCap: newCap,
      budgetHistory: [...save.budgetHistory, review],
      lastBudgetReviewShift: shiftNumber,
    },
    shiftNumber,
    scenarios: starterScenarios,
    focusedMemberRequests: focusedRequests,
    recentClosurePairTags: recentClosureTags,
    activeCompanyGoals,
  });

  return { save: withRotatedPeriod, review };
}

function countClosuresInWindow(save: GameSave, windowStart: number): number {
  return save.budgetHistory.filter(
    (entry) =>
      entry.shift > windowStart && entry.reasons.some((reason) => reason.kind === "closure"),
  ).length;
}

function countQuitEventsInWindow(save: GameSave, windowStart: number): number {
  let count = 0;
  for (const entry of save.budgetHistory) {
    if (entry.shift <= windowStart) continue;
    for (const reason of entry.reasons) {
      if (reason.kind === "member_quit") count += 1;
    }
  }
  return count;
}

function averageRetention(members: readonly Member[]): number {
  const active = members.filter((member) => member.state.status === "active");
  if (active.length === 0) return 0;
  const total = active.reduce((sum, member) => sum + member.state.retention, 0);
  return total / active.length;
}

function pairStatsAverages(pairStates: readonly PairState[]): {
  averageHealth: number;
  averageFriction: number;
} {
  if (pairStates.length === 0) {
    return { averageHealth: 0, averageFriction: 0 };
  }
  let healthSum = 0;
  let frictionSum = 0;
  for (const pair of pairStates) {
    healthSum += pair.stats.relationshipHealth;
    frictionSum += pair.stats.strain;
  }
  return {
    averageHealth: healthSum / pairStates.length,
    averageFriction: frictionSum / pairStates.length,
  };
}

function recentRequestFulfillmentRate(save: GameSave, windowStart: number): number {
  let asked = 0;
  let fulfilled = 0;
  for (const shift of save.shifts) {
    if (shift.shiftNumber <= windowStart || shift.report === undefined) continue;
    asked += shift.memberRequestIds.length;
    const ignored = shift.report.ignoredRequestIds.length;
    fulfilled += Math.max(0, shift.memberRequestIds.length - ignored);
  }
  if (asked === 0) return 1;
  return fulfilled / asked;
}

function findCurrentRequestForMember(
  members: readonly Member[],
  memberId: string,
): MemberRequest | undefined {
  const member = members.find((candidate) => candidate.id === memberId);
  if (member === undefined) return undefined;
  if (member.state.currentRequestId === undefined) return undefined;
  return memberRequests.find((request) => request.id === member.state.currentRequestId);
}

function collectRecentClosurePairTags(save: GameSave, windowStart: number): ScenarioTag[] {
  const tags: ScenarioTag[] = [];
  for (const session of save.dateSessions) {
    if (session.finalReport === undefined) continue;
    const matched = save.shifts.find((shift) => sessionBelongsToShift(session, shift.shiftNumber));
    if (matched === undefined || matched.shiftNumber <= windowStart) continue;
    const scenario = starterScenarios.find((candidate) => candidate.id === session.scenarioId);
    if (scenario === undefined) continue;
    for (const tag of scenario.card.tags) {
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  return tags.slice(0, 3);
}

function buildDeckCoverage({
  save,
  shift,
}: {
  save: GameSave;
  shift: ShiftState;
}): DeckCoverageEntry[] {
  if (shift.featuredMemberIds.length === 0) {
    return [];
  }

  const drawnScenarios = shift.drawnScenarioIds
    .map((id) => starterScenarios.find((scenario) => scenario.id === id))
    .filter((scenario): scenario is DateScenario => scenario !== undefined);

  if (drawnScenarios.length === 0) {
    return shift.featuredMemberIds.map((memberId) => ({
      focusMemberId: memberId,
      status: "no_draw" as const,
      label: "No hand drawn this shift",
    }));
  }

  return shift.featuredMemberIds.map((memberId) => {
    const member = save.members.find((candidate) => candidate.id === memberId);
    if (member === undefined) {
      return {
        focusMemberId: memberId,
        status: "no_draw" as const,
        label: "Member missing from save",
      };
    }
    const eligiblePartners = save.members.filter(
      (candidate) => candidate.id !== memberId && candidate.state.status === "active",
    );
    let promisingForMember = false;
    let bookedForMember = false;
    for (const session of save.dateSessions) {
      if (!sessionBelongsToShift(session, shift.shiftNumber)) continue;
      if (session.focusMemberId === memberId) {
        bookedForMember = true;
        break;
      }
    }
    for (const scenario of drawnScenarios) {
      for (const partner of eligiblePartners) {
        const pairState = save.pairStates.find(
          (candidate) => candidate.id === makePairId(member.id, partner.id),
        );
        if (pairState === undefined) continue;
        try {
          const fit = evaluateMatchFit({
            members: [member, partner],
            scenario,
            pairState,
            activeRequests: [],
            knownPairReads: visibleReadsForPair(save, pairState.id),
          });
          if (scenarioRoomReadFromMatchFit(fit) === "promising") {
            promisingForMember = true;
            break;
          }
        } catch {
          continue;
        }
      }
      if (promisingForMember) break;
    }
    const status = bookedForMember
      ? ("served" as const)
      : promisingForMember
        ? ("served" as const)
        : ("missed" as const);
    const label =
      status === "served"
        ? bookedForMember
          ? "Booked tonight"
          : "Hand covered the case"
        : "No promising card for this case";
    return {
      focusMemberId: memberId,
      status,
      label,
    };
  });
}

export function buildShiftGoalMetrics({
  shift,
  dateSessions,
  members,
  memberMoodAdjustments,
}: {
  shift: ShiftState;
  dateSessions: readonly DateSession[];
  members: readonly Member[];
  memberMoodAdjustments?: ReadonlyMap<string, number>;
}): Record<GoalMetric, number> {
  const shiftDateSessions = dateSessions.filter((session) =>
    sessionBelongsToShift(session, shift.shiftNumber),
  );
  const completedDates = shiftDateSessions.filter((session) => session.status !== "active");
  const earlyEndedDates = completedDates.filter((session) => session.status === "ended_early");
  const ordinaryNonHumanDates = completedDates.filter((session) => {
    const participants = session.participants
      .map((memberId) => members.find((member) => member.id === memberId))
      .filter((member): member is Member => member !== undefined);

    return (
      participants.some(isOrdinaryHuman) && participants.some((member) => !isOrdinaryHuman(member))
    );
  });
  const positiveOutcomeDates = completedDates.filter(
    (session) => session.finalReport?.outcome === "second_date",
  );
  const memberMoodDeltas = collectShiftMemberMoodDeltas(completedDates);
  if (memberMoodAdjustments !== undefined) {
    for (const [memberId, delta] of memberMoodAdjustments) {
      memberMoodDeltas.set(memberId, (memberMoodDeltas.get(memberId) ?? 0) + delta);
    }
  }
  const memberMoodDelta = Array.from(memberMoodDeltas.values()).reduce(
    (total, delta) => total + delta,
    0,
  );
  const improvedMembers = Array.from(memberMoodDeltas.values()).filter((delta) => delta > 0).length;

  return {
    completedDates: completedDates.length,
    earlyEndedDates: earlyEndedDates.length,
    ordinaryNonHumanDates: ordinaryNonHumanDates.length,
    memberMoodDelta,
    positiveOutcomeDates: positiveOutcomeDates.length,
    improvedMembers,
  };
}

export function isMemberRetained(member: Member): boolean {
  return member.state.status !== "quit" && member.state.retention > 0;
}

export function isMemberActive(member: Member): boolean {
  return member.state.status === "active";
}

export function isMemberClosed(member: Member): boolean {
  return member.state.status === "closed";
}

export function isMemberQuit(member: Member): boolean {
  return member.state.status === "quit";
}

export function getQuitMembers(members: readonly Member[]): Member[] {
  return members.filter(isMemberQuit);
}

export type MemberQuitRiskStatus =
  | "file_stable"
  | "client_confidence_low"
  | "closed_file_risk"
  | "file_closed";

export const MEMBER_QUIT_RISK_STABLE_FLOOR = 61;
export const MEMBER_QUIT_RISK_LOW_FLOOR = 26;

export const MEMBER_QUIT_RISK_LABEL: Record<MemberQuitRiskStatus, string> = {
  file_stable: "File stable",
  client_confidence_low: "Client confidence low",
  closed_file_risk: "Closed-file risk",
  file_closed: "Client file closed",
};

export function getMemberQuitRiskStatus(member: Member): MemberQuitRiskStatus {
  const retention = member.state.retention;
  if (retention <= 0) return "file_closed";
  if (retention < MEMBER_QUIT_RISK_LOW_FLOOR) return "closed_file_risk";
  if (retention < MEMBER_QUIT_RISK_STABLE_FLOOR) return "client_confidence_low";
  return "file_stable";
}

export function isCampaignLost(save: Pick<GameSave, "members" | "closureCount">): boolean {
  return getQuitMembers(save.members).length >= clientLossLimit(save);
}

export type GoalProgressStatus = GoalScoreStatus | "open";

export type GoalProgressSnapshot = {
  goalId: string;
  status: GoalProgressStatus;
  label: string;
};

export function buildGoalProgressSnapshots({
  goals,
  shiftStatus,
  metrics,
  shiftReport,
}: {
  goals: readonly CompanyGoal[];
  shiftStatus: ShiftState["status"];
  metrics: Record<GoalMetric, number>;
  shiftReport: ShiftReport | undefined;
}): GoalProgressSnapshot[] {
  return goals.map((goal) => {
    const reportedResult = shiftReport?.goalResults.find((result) => result.goalId === goal.id);

    if (reportedResult !== undefined) {
      return {
        goalId: goal.id,
        status: reportedResult.status,
        label: formatGoalProgress(goal.metric, reportedResult.progress, reportedResult.target),
      };
    }

    const progressValue = metrics[goal.metric];

    return {
      goalId: goal.id,
      status: evaluateGoalProgress(goal, progressValue, shiftStatus),
      label: formatGoalProgress(goal.metric, progressValue, goal.target),
    };
  });
}

export function fallbackGoalProgress(goal: CompanyGoal): GoalProgressSnapshot {
  return {
    goalId: goal.id,
    status: "open",
    label: formatGoalProgress(goal.metric, 0, goal.target),
  };
}

function evaluateGoalProgress(
  goal: CompanyGoal,
  progress: number,
  shiftStatus: ShiftState["status"],
): GoalProgressStatus {
  if (goal.metric === "earlyEndedDates") {
    if (progress > goal.target) {
      return "missed";
    }

    return shiftStatus === "completed" ? "met" : "open";
  }

  if (progress >= goal.target) {
    return "met";
  }

  return shiftStatus === "completed" ? "missed" : "open";
}

const GOAL_PROGRESS_TEMPLATES: Record<GoalMetric, (progress: number, target: number) => string> = {
  earlyEndedDates: (progress) => (progress === 1 ? "1 early end" : `${progress} early ends`),
  memberMoodDelta: (progress, target) =>
    `${progress > 0 ? `+${progress}` : `${progress}`} / +${target} mood`,
  ordinaryNonHumanDates: (progress, target) => `${progress} / ${target} cross-reality`,
  positiveOutcomeDates: (progress, target) => `${progress} / ${target} good reports`,
  improvedMembers: (progress, target) => `${progress} / ${target} happier`,
  completedDates: (progress, target) => `${progress} / ${target} dates`,
};

function formatGoalProgress(metric: GoalMetric, progress: number, target: number): string {
  return GOAL_PROGRESS_TEMPLATES[metric](progress, target);
}

export type StartNextShiftOptions = {
  random?: () => number;
};

export function startNextShift(
  save: GameSave,
  now = new Date(),
  _options: StartNextShiftOptions = {},
): { save: GameSave; shift: ShiftState } {
  const activeShift = getActiveShift(save);

  if (activeShift.status !== "completed") {
    throw new Error("File the active shift before opening the next shift.");
  }

  const timestamp = now.toISOString();
  const nextShiftNumber = Math.max(...save.shifts.map((shift) => shift.shiftNumber)) + 1;
  const membersById = new Map(save.members.map((member) => [member.id, member] as const));
  const featuredMemberIds = save.focusedMemberIds.filter((memberId) => {
    const member = membersById.get(memberId);
    return member !== undefined && isMemberActive(member);
  });
  const companyGoalIds = selectShiftCompanyGoalIds({
    members: save.members,
    shiftNumber: nextShiftNumber,
    dateSlotsTotal: save.config.shiftDateSlots,
  });
  const memberRequestIds = selectFeaturedMemberRequestIds({
    members: save.members,
    featuredMemberIds,
    shiftNumber: nextShiftNumber,
  });
  const nextShift = shiftStateSchema.parse({
    id: `shift-${nextShiftNumber}`,
    shiftNumber: nextShiftNumber,
    status: "active",
    dateSlotsTotal: save.config.shiftDateSlots,
    dateSlotsUsed: 0,
    featuredMemberIds,
    drawnScenarioIds: [],
    companyGoalIds,
    memberRequestIds,
    startedAt: timestamp,
  });
  const nextSave = gameSaveSchema.parse({
    ...save,
    shifts: [...save.shifts, nextShift],
    activeShiftId: nextShift.id,
    updatedAt: timestamp,
  });

  return { save: nextSave, shift: nextShift };
}

export function createCharacterMessage({
  session,
  speaker,
  partner,
  scenario,
  pairState,
  createdAt,
}: {
  session: DateSession;
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  createdAt: string;
}): DateMessage {
  const turnIndex = session.currentTurn + 1;
  const repeatCount = pairState.scenarioUseCounts[scenario.id] ?? 0;
  const activeIntervention = findActiveInterventionForMember(session, speaker.id);
  const text = deterministicCharacterText({
    speaker,
    partner,
    scenario,
    session,
    turnIndex,
    repeatCount,
    interventionText: activeIntervention?.text,
  });

  return {
    id: `${session.id}-msg-${session.transcript.length}`,
    dateSessionId: session.id,
    kind: "character",
    speakerId: speaker.id,
    turnIndex,
    sequenceIndex: session.transcript.length,
    text,
    createdAt,
  };
}

export function createNonCharacterMessage(
  session: DateSession,
  kind: "scenario" | "cupid" | "system",
  text: string,
  createdAt: string,
): DateMessage {
  return {
    id: `${session.id}-msg-${session.transcript.length}`,
    dateSessionId: session.id,
    kind,
    turnIndex: session.currentTurn,
    sequenceIndex: session.transcript.length,
    text,
    createdAt,
  };
}

function deterministicCharacterText({
  speaker,
  partner,
  scenario,
  session,
  turnIndex,
  repeatCount,
  interventionText,
}: {
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  session: DateSession;
  turnIndex: number;
  repeatCount: number;
  interventionText: string | undefined;
}): string {
  const sample = speaker.voice.sampleMessages.opener[0] ?? "";
  const eventHint = lastTriggeredEvent(scenario, session);
  const repeatLine =
    repeatCount > 0
      ? ` I recognize this setup, which is either romantic or procurement missed a checkbox.`
      : "";
  const interventionLine =
    interventionText === undefined
      ? ""
      : ` Cupid said "${interventionText}", and I am treating that as advice.`;

  if (turnIndex <= 2) {
    return `${sample} ${partner.name}, this is apparently ${scenario.publicBrief.location}.${repeatLine}`;
  }

  if (eventHint !== undefined && turnIndex % 4 === 0) {
    return `${speaker.name} looks at ${partner.name}. ${eventHint.characterVisibleText} I can work with this if we stay specific.${interventionLine}`;
  }

  if (speaker.tags.includes("weirdness_native")) {
    return `I am attempting a small honest question for ${partner.name}. It has fewer teeth than my usual questions.${repeatLine}${interventionLine}`;
  }

  if (speaker.tags.includes("career_focused")) {
    return `Status update for ${partner.name}: the date remains active, the environment is unusual, and I am still listening.${repeatLine}${interventionLine}`;
  }

  if (speaker.tags.includes("prophecy_averse")) {
    return `I would like to choose the next sentence myself, preferably before the room files paperwork about destiny.${repeatLine}${interventionLine}`;
  }

  if (speaker.tags.includes("memory_sensitive") || speaker.tags.includes("grief_sensitive")) {
    return `For the record, ${partner.name}, being remembered would be enough for this part of the evening.${repeatLine}${interventionLine}`;
  }

  return `anyway ${partner.name}, I am trying to be normal about ${scenario.title}, which may be the first documented problem.${repeatLine}${interventionLine}`;
}

export function judgeExchangeDeterministically({
  session,
  pairState,
  members,
  scenario,
  exchangeMessages,
  exchangeIndex,
}: {
  session: DateSession;
  pairState: PairState;
  members: Member[];
  scenario: DateScenario;
  exchangeMessages: DateMessage[];
  exchangeIndex: number;
}): JudgeSnapshot {
  const scenarioRiskPenalty =
    scenario.card.risk === "high" ? -7 : scenario.card.risk === "medium" ? -3 : 2;
  const interventionBonus = session.interventions.some((intervention) =>
    exchangeMessages.some(
      (message) =>
        message.kind === "character" &&
        message.speakerId === intervention.targetMemberId &&
        message.turnIndex > intervention.usedAtTurn,
    ),
  )
    ? 3
    : 0;
  const repeatPenalty = (pairState.scenarioUseCounts[scenario.id] ?? 0) > 0 ? -5 : 0;
  const listeningBonus = exchangeMessages.some((message) =>
    members.some((member) => message.text.includes(member.name)),
  )
    ? 4
    : 0;
  const dateHealthDelta = scenarioRiskPenalty + interventionBonus + listeningBonus + repeatPenalty;
  const shouldEndEarly = session.dateHealth + dateHealthDelta <= 0;
  const statDeltas = {
    chemistry: clampDelta(2 + listeningBonus),
    trust: clampDelta(1 + interventionBonus),
    stability: clampDelta(scenarioRiskPenalty > 0 ? 2 : -1),
    conflict: clampDelta(Math.abs(Math.min(scenarioRiskPenalty, 0))),
    weirdnessTolerance: clampDelta(scenario.card.chaos === "high" ? 3 : 1),
    spark: clampDelta(2),
    strain: clampDelta(Math.abs(Math.min(scenarioRiskPenalty + repeatPenalty, 0))),
    relationshipHealth: clampDelta(Math.round(dateHealthDelta / 2)),
  };
  const memberMoodDeltas = Object.fromEntries(
    members.map((member) => [member.id, clampDelta(Math.round(dateHealthDelta / 4))]),
  );
  const memoryCandidates = [
    {
      scope: "pair",
      visibility: "public",
      subjectIds: session.participants,
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${members[0].name} and ${members[1].name} produced a ${formatDateHealthShift(dateHealthDelta)} exchange at ${scenario.title}.`,
      tags: ["date", scenario.card.risk],
      importance: Math.min(5, Math.max(1, Math.abs(dateHealthDelta) >= 6 ? 4 : 2)),
    },
  ];

  return judgeSnapshotSchema.parse({
    id: `judge-${session.id}-${exchangeIndex}`,
    dateSessionId: session.id,
    exchangeIndex,
    dateHealthDelta,
    statDeltas,
    memberMoodDeltas,
    shouldEndEarly,
    earlyEndReason: shouldEndEarly ? "Date Health reached zero." : undefined,
    endSentiment: shouldEndEarly ? "negative" : null,
    notableMoments: exchangeMessages.map((message) => message.text).slice(0, 2),
    playerSummary: buildJudgeSummary(dateHealthDelta, repeatPenalty, interventionBonus),
    memoryCandidates,
  });
}

export function finalizeDateSession({
  session,
  pairState,
  members,
  scenario,
  completedAt,
  memoryRecordIds,
}: {
  session: DateSession;
  pairState: PairState;
  members: Member[];
  scenario: DateScenario;
  completedAt: string;
  memoryRecordIds?: string[];
}): DateSession {
  const outcome = deriveDateOutcome(session, pairState);
  const recommendedFollowUp = followUpForOutcome(outcome);
  const completedDateCount = pairState.completedDateIds.includes(session.id)
    ? pairState.completedDateIds.length
    : pairState.completedDateIds.length + 1;
  const readyToClose = evaluateClosureReadiness({
    pairState,
    outcome,
    completedDateCount,
    members,
  });
  const closureNearMiss = shouldFileClosureNearMiss({
    pairState,
    outcome,
    completedDateCount,
    members,
  });
  const report: DateFinalReport = dateFinalReportSchema.parse({
    id: `final-${session.id}`,
    dateSessionId: session.id,
    completedAt,
    outcome,
    summary: `${members[0].firstName} and ${members[1].firstName} completed ${scenario.title}. ${finalReportStatusLine(session, outcome)}`,
    statSummary: closureNearMiss
      ? closureNearMissCaseSummary(pairState)
      : finalReportCaseSummary(outcome),
    recommendedFollowUp,
    memoryRecordIds: memoryRecordIds ?? [
      `memory-${session.id}-pair`,
      `memory-${session.id}-${members[0].id}`,
      `memory-${session.id}-${members[1].id}`,
      `memory-${session.id}-scenario`,
    ],
    readyToClose,
  });

  return dateSessionSchema.parse({
    ...session,
    finalReport: report,
    playbackState: "ended",
  });
}

export function linkFinalReportMemoryRecords(
  session: DateSession,
  memoryRecordIds: readonly string[],
): DateSession {
  if (session.finalReport === undefined || memoryRecordIds.length === 0) {
    return session;
  }

  const mergedIds = mergeMemoryRecordIds(session.finalReport.memoryRecordIds, memoryRecordIds);
  if (mergedIds.length === session.finalReport.memoryRecordIds.length) {
    return session;
  }

  const finalReport: DateFinalReport = dateFinalReportSchema.parse({
    ...session.finalReport,
    memoryRecordIds: mergedIds,
  });

  return dateSessionSchema.parse({
    ...session,
    finalReport,
  });
}

function mergeMemoryRecordIds(currentIds: readonly string[], nextIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const id of [...currentIds, ...nextIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }

  return merged;
}

export function resolveEndedDateSentiment(
  nextDateHealth: number,
  judgeSnapshot: Pick<JudgeSnapshot, "endSentiment">,
): EndSentiment {
  if (nextDateHealth <= 0) {
    return "negative";
  }

  return judgeSnapshot.endSentiment ?? "negative";
}

export function createDateMemoryRecords(
  session: DateSession,
  members: Member[],
  scenario: DateScenario,
  createdAt: string,
  pairState?: PairState,
): MemoryRecord[] {
  const records = [
    {
      id: `memory-${session.id}-pair`,
      scope: "pair",
      visibility: "public",
      subjectIds: session.participants,
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${members[0].name} and ${members[1].name} completed ${scenario.title}. Cupid filed the date as ${formatOutcomeForMemory(session.finalReport?.outcome)}.`,
      tags: ["date_summary"],
      importance: 4,
      createdAt,
    },
    ...members.map((member) => ({
      id: `memory-${session.id}-${member.id}`,
      scope: "member",
      visibility: "member_private",
      subjectIds: [member.id],
      visibleToMemberIds: [member.id],
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${member.name} privately remembers ${scenario.title} as ${session.status === "ended_early" ? "a date that lost momentum" : "a completed Cupid date"} with ${members.find((candidate) => candidate.id !== member.id)?.name}.`,
      tags: ["private_date_memory", scenario.id],
      importance: 3,
      createdAt,
    })),
    {
      id: `memory-${session.id}-scenario`,
      scope: "scenario",
      visibility: "public",
      subjectIds: session.participants,
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${members[0].firstName} and ${members[1].firstName} have used ${scenario.title}. Repeat bookings should mention that Cupid has a file.`,
      tags: ["scenario_repeat"],
      importance: 3,
      createdAt,
    },
  ];

  const parsedRecords = records.map((record) => {
    const embedding = createDeterministicEmbedding(record.text);

    return memoryRecordSchema.parse({
      ...record,
      embedding,
      embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
      embeddingDimensions: embedding.length,
    });
  });

  const closureNearMiss =
    pairState === undefined
      ? null
      : createClosureNearMissMemoryRecord({
          session,
          pairState,
          members,
          createdAt,
        });

  return closureNearMiss === null ? parsedRecords : [...parsedRecords, closureNearMiss];
}

export function applyJudgeToPairState(
  pairState: PairState,
  judgeSnapshot: JudgeSnapshot,
): PairState {
  const nextStats = { ...pairState.stats };

  for (const stat of RELATIONSHIP_STATS) {
    nextStats[stat] = clampScore(nextStats[stat] + (judgeSnapshot.statDeltas[stat] ?? 0));
  }

  return {
    ...pairState,
    stats: pairStatsSchema.parse(nextStats),
  };
}

export function applyJudgeToMembers(members: Member[], judgeSnapshot: JudgeSnapshot): Member[] {
  return members.map((member) => ({
    ...member,
    state: {
      ...member.state,
      mood: clampScore(member.state.mood + (judgeSnapshot.memberMoodDeltas[member.id] ?? 0)),
      recentDateResult:
        judgeSnapshot.memberMoodDeltas[member.id] === undefined
          ? member.state.recentDateResult
          : judgeSnapshot.playerSummary,
    },
  }));
}

type MemberStateDeltas = {
  mood: number;
  burnout: number;
  retention: number;
  recentDateResult: string;
};

export function applyDateFinalReportToMembers(
  members: Member[],
  session: DateSession,
  shiftNumber: number,
): Member[] {
  const outcome = session.finalReport?.outcome;

  if (outcome === undefined) {
    return members;
  }

  const afterDeltas = applyStateDeltasToMembers(members, session.participants, {
    ...FINAL_OUTCOME_DELTAS[outcome],
    recentDateResult: finalOutcomeMemberResult(outcome),
  });
  const participantIds = new Set(session.participants);

  return afterDeltas.map((member) =>
    participantIds.has(member.id)
      ? { ...member, state: { ...member.state, lastDateShift: shiftNumber } }
      : member,
  );
}

function applyFollowUpToMembers(
  members: Member[],
  session: DateSession,
  deltas: OutcomeStateDeltas,
): Member[] {
  return applyStateDeltasToMembers(members, session.participants, {
    ...deltas,
    recentDateResult: "Follow-up filed. Client file stabilized.",
  });
}

function applyIgnoredRequestPenalties(
  members: Member[],
  ignoredRequests: readonly MemberRequest[],
): Member[] {
  return members.map((member) => {
    const ignoredPenalty = ignoredRequests
      .filter((request) => request.memberId === member.id)
      .reduce((total, request) => total + request.moodPenaltyIfIgnored, 0);

    if (ignoredPenalty === 0) {
      return member;
    }

    return applyMemberStateDeltas(member, {
      mood: -ignoredPenalty,
      burnout: Math.ceil(ignoredPenalty / 2),
      retention: -ignoredPenalty,
      recentDateResult: "Request ignored. Client confidence fell.",
    });
  });
}

function rotateMemberRequestsForShift(
  members: Member[],
  shift: ShiftState,
  completedDates: readonly DateSession[],
): Member[] {
  const shiftRequestIds = new Set(shift.memberRequestIds);
  const memberIdsToRotate = new Set<string>();

  for (const requestId of shiftRequestIds) {
    const request = memberRequests.find((candidate) => candidate.id === requestId);

    if (request !== undefined) {
      memberIdsToRotate.add(request.memberId);
    }
  }

  if (memberIdsToRotate.size === 0) {
    return members;
  }

  const addressedRequestIds = new Set(
    completedDates
      .map((session) => session.focusRequestId)
      .filter((requestId): requestId is string => requestId !== undefined),
  );

  return members.map((member) => {
    if (!memberIdsToRotate.has(member.id) || !isMemberRetained(member)) {
      return member;
    }

    const currentRequestId = member.state.currentRequestId;
    const wasAddressed =
      currentRequestId !== undefined && addressedRequestIds.has(currentRequestId);
    const wasIgnored =
      currentRequestId !== undefined &&
      shiftRequestIds.has(currentRequestId) &&
      !addressedRequestIds.has(currentRequestId);

    if (!wasAddressed && !wasIgnored) {
      return member;
    }

    const nextRequestId = pickNextMemberRequestId(member.id, currentRequestId);

    if (nextRequestId === undefined || nextRequestId === currentRequestId) {
      return member;
    }

    return {
      ...member,
      state: {
        ...member.state,
        currentRequestId: nextRequestId,
      },
    };
  });
}

export function markPairDateComplete(pairState: PairState, session: DateSession): PairState {
  return {
    ...pairState,
    completedDateIds: pairState.completedDateIds.includes(session.id)
      ? pairState.completedDateIds
      : [...pairState.completedDateIds, session.id],
    scenarioUseCounts: {
      ...pairState.scenarioUseCounts,
      [session.scenarioId]: (pairState.scenarioUseCounts[session.scenarioId] ?? 0) + 1,
    },
  };
}

function applyStateDeltasToMembers(
  members: Member[],
  participantIds: readonly string[],
  deltas: MemberStateDeltas,
): Member[] {
  const participantIdSet = new Set(participantIds);

  return members.map((member) =>
    participantIdSet.has(member.id) ? applyMemberStateDeltas(member, deltas) : member,
  );
}

function applyMemberStateDeltas(member: Member, deltas: MemberStateDeltas): Member {
  if (!isMemberActive(member)) {
    return member;
  }

  const retention = clampScore(member.state.retention + deltas.retention);
  const hasQuit = retention === 0;
  const recentDateResult = hasQuit
    ? "Client file closed. Member quit the app."
    : deltas.recentDateResult;

  return {
    ...member,
    state: {
      ...member.state,
      mood: clampScore(member.state.mood + deltas.mood),
      burnout: clampScore(member.state.burnout + deltas.burnout),
      retention,
      recentDateResult,
      status: hasQuit ? "quit" : member.state.status,
    },
  };
}

function finalOutcomeMemberResult(outcome: DateFinalReport["outcome"]): string {
  if (outcome === "second_date") {
    return "Date landed well. Client file stabilized.";
  }

  if (outcome === "bad_fit") {
    return "Bad fit filed. Client confidence fell.";
  }

  if (outcome === "early_end") {
    return "Date ended early. Client confidence fell.";
  }

  if (outcome === "cool_down") {
    return "Cool down recommended. Client confidence fell.";
  }

  return "Mixed date filed. Client file under review.";
}

export type PrimaryStatDeltas = Partial<
  Record<Exclude<RelationshipStat, "relationshipHealth" | "strain">, number>
>;

export type FollowUpEffectPreview = {
  action: FollowUpAction;
  outcome: DateFinalReport["outcome"];
  statDeltas: PrimaryStatDeltas;
  memberDeltas: OutcomeStateDeltas;
  nextStats: PairStats;
  reasons: string[];
};

export function previewFollowUpEffects(
  pairState: PairState,
  session: DateSession,
  action: FollowUpAction,
): FollowUpEffectPreview {
  const effects = resolveFollowUpEffects(pairState, session, action);

  return {
    action,
    outcome: requireFinalOutcome(session),
    statDeltas: effects.statDeltas,
    memberDeltas: effects.memberDeltas,
    nextStats: adjustStats(pairState.stats, effects.statDeltas),
    reasons: effects.reasons,
  };
}

function resolveFollowUpEffects(
  pairState: PairState,
  session: DateSession,
  action: FollowUpAction,
): {
  statDeltas: PrimaryStatDeltas;
  memberDeltas: OutcomeStateDeltas;
  reasons: string[];
} {
  const outcome = requireFinalOutcome(session);
  const lastJudge = session.judgeSnapshots.at(-1);
  const highStrain =
    pairState.stats.strain >= 60 ||
    pairState.stats.conflict >= 60 ||
    (lastJudge?.statDeltas.strain ?? 0) >= 4 ||
    (lastJudge?.statDeltas.conflict ?? 0) >= 4;
  const boundaryPressure =
    session.status === "ended_early" ||
    lastJudge?.shouldEndEarly === true ||
    lastJudge?.usedEvidenceIds.some((id) => id.includes(":boundary:")) === true;
  const brokenAgreementCount = pairState.agreements.filter(
    (agreement) => agreement.status === "broken",
  ).length;
  const openLoopCount = pairState.openLoops.filter((loop) => loop.status === "open").length;
  const reasons: string[] = [`outcome:${outcome}`];

  if (action === "encourage") {
    const positive = outcome === "second_date";
    if (positive) reasons.push("warm file");
    else reasons.push("encourage against caution");

    return {
      statDeltas: positive
        ? { chemistry: 7, trust: 4, stability: 1, spark: 7 }
        : { chemistry: 2, trust: 1, conflict: 2, spark: 3 },
      memberDeltas: positive
        ? { retention: 3, mood: 3, burnout: -2 }
        : { retention: -2, mood: -1, burnout: 2 },
      reasons,
    };
  }

  if (action === "cool_down") {
    if (highStrain) reasons.push("strain relief");
    if (openLoopCount > 0) reasons.push("unresolved item left open");

    return {
      statDeltas: highStrain
        ? { chemistry: -2, stability: 7, conflict: -8, spark: -4 }
        : { chemistry: -3, stability: 4, conflict: -5, spark: -3 },
      memberDeltas: highStrain
        ? { retention: 5, mood: 2, burnout: -4 }
        : { retention: 4, mood: 1, burnout: -2 },
      reasons,
    };
  }

  if (action === "repair") {
    if (boundaryPressure) reasons.push("boundary repair");
    if (brokenAgreementCount > 0) reasons.push("agreement repair");

    return {
      statDeltas:
        boundaryPressure || brokenAgreementCount > 0
          ? { trust: 10, stability: 5, conflict: -9, spark: 1 }
          : { trust: 7, stability: 4, conflict: -6 },
      memberDeltas:
        boundaryPressure || brokenAgreementCount > 0
          ? { retention: 10, mood: 4, burnout: -4 }
          : { retention: 8, mood: 3, burnout: -3 },
      reasons,
    };
  }

  const protective = outcome === "bad_fit" || outcome === "early_end" || highStrain;
  if (protective) reasons.push("protective bad fit filing");
  else reasons.push("premature bad fit filing");

  return {
    statDeltas: protective
      ? { chemistry: -8, trust: -1, stability: 5, conflict: -3, spark: -10 }
      : { chemistry: -6, trust: -3, stability: 1, conflict: 4, spark: -8 },
    memberDeltas: protective
      ? { retention: 7, mood: 1, burnout: -2 }
      : { retention: -3, mood: -2, burnout: 2 },
    reasons,
  };
}

function requireFinalOutcome(session: DateSession): DateFinalReport["outcome"] {
  const outcome = session.finalReport?.outcome;
  if (outcome === undefined) {
    throw new Error("Follow-up actions require a completed date report.");
  }
  return outcome;
}

function adjustStats(stats: PairStats, deltas: PrimaryStatDeltas): PairStats {
  const nextStats = { ...stats };

  for (const stat of RELATIONSHIP_STATS) {
    if (stat === "relationshipHealth" || stat === "strain") {
      continue;
    }
    nextStats[stat] = clampScore(nextStats[stat] + (deltas[stat] ?? 0));
  }

  nextStats.relationshipHealth = clampScore(
    Math.round(
      (nextStats.chemistry + nextStats.trust + nextStats.stability + (100 - nextStats.conflict)) /
        4,
    ),
  );
  nextStats.strain = clampScore(Math.round((nextStats.conflict + (100 - nextStats.stability)) / 2));

  return pairStatsSchema.parse(nextStats);
}

function scoreGoal(goalId: string, metrics: Record<GoalMetric, number>): ShiftGoalResult {
  const goal = companyGoals.find((candidate) => candidate.id === goalId);

  if (goal === undefined) {
    return {
      goalId,
      status: "missed",
      progress: 0,
      target: 0,
      summary: "Retired goal skipped.",
    };
  }

  const progress = metrics[goal.metric];
  const met = goal.metric === "earlyEndedDates" ? progress <= goal.target : progress >= goal.target;

  return {
    goalId,
    status: met ? "met" : "missed",
    progress,
    target: goal.target,
    summary: met ? `${goal.title}: met.` : `${goal.title}: missed.`,
  };
}

function collectShiftMemberMoodDeltas(sessions: DateSession[]): Map<string, number> {
  const deltas = new Map<string, number>();

  for (const session of sessions) {
    for (const snapshot of session.judgeSnapshots) {
      for (const [memberId, delta] of Object.entries(snapshot.memberMoodDeltas)) {
        deltas.set(memberId, (deltas.get(memberId) ?? 0) + delta);
      }
    }
  }

  return deltas;
}

function findFocusRequest(shift: ShiftState, focusMemberId: string) {
  return memberRequests.find(
    (request) => request.memberId === focusMemberId && shift.memberRequestIds.includes(request.id),
  );
}

function findIgnoredShiftRequests(
  shift: ShiftState,
  completedDates: readonly DateSession[],
): MemberRequest[] {
  const addressedRequestIds = new Set(
    completedDates
      .map((session) => session.focusRequestId)
      .filter((requestId): requestId is string => requestId !== undefined),
  );

  return memberRequests.filter(
    (request) =>
      shift.memberRequestIds.includes(request.id) && !addressedRequestIds.has(request.id),
  );
}

function buildIgnoredRequestMoodAdjustments(
  ignoredRequests: readonly MemberRequest[],
): Map<string, number> {
  const adjustments = new Map<string, number>();

  for (const request of ignoredRequests) {
    adjustments.set(
      request.memberId,
      (adjustments.get(request.memberId) ?? 0) - request.moodPenaltyIfIgnored,
    );
  }

  return adjustments;
}

function shiftSessionPrefix(shiftNumber: number): string {
  return `date-${shiftNumber}-`;
}

function sessionBelongsToShift(session: DateSession, shiftNumber: number): boolean {
  return session.id.startsWith(shiftSessionPrefix(shiftNumber));
}

function hasActiveDateInShift(save: GameSave, shiftNumber: number): boolean {
  return save.dateSessions.some(
    (session) => sessionBelongsToShift(session, shiftNumber) && session.status === "active",
  );
}

function buildJudgeSummary(
  dateHealthDelta: number,
  repeatPenalty: number,
  interventionBonus: number,
): string {
  if (dateHealthDelta > 4) {
    return "Exchange improved. Cupid may use a normal form.";
  }

  if (repeatPenalty < 0) {
    return "Repeat room noticed. Procurement has been informed.";
  }

  if (interventionBonus > 0) {
    return "Intervention helped. Date Health stabilized.";
  }

  if (dateHealthDelta < 0) {
    return "Date Health down. Recommend Repair if this pair matters.";
  }

  return "Date Health stable. Continue monitoring.";
}

export function shouldJudgePendingExchange({
  currentTurn,
  turnLimit,
  exchangeMessages,
}: {
  currentTurn: number;
  turnLimit: number;
  exchangeMessages: DateMessage[];
}): boolean {
  if (exchangeMessages.length === 0) {
    return false;
  }

  return isAtJudgeBoundary(currentTurn) || currentTurn >= turnLimit;
}

export function latestJudgedExchangeIndex(session: DateSession): number {
  return session.judgeSnapshots.reduce(
    (latest, snapshot) => Math.max(latest, snapshot.exchangeIndex),
    -1,
  );
}

export function messagesSinceLastJudge(
  session: DateSession,
  transcript: readonly DateMessage[],
): DateMessage[] {
  const lastJudgedExchange = latestJudgedExchangeIndex(session);

  if (lastJudgedExchange < 0) {
    return transcript.filter((message) => message.sequenceIndex > 0);
  }

  const judgedSequenceCutoff = transcript
    .filter(
      (message) =>
        message.kind === "character" &&
        exchangeIndexForTurn(message.turnIndex) <= lastJudgedExchange,
    )
    .reduce((latest, message) => Math.max(latest, message.sequenceIndex), 0);

  return transcript.filter((message) => message.sequenceIndex > judgedSequenceCutoff);
}

export function exchangeIndexForTurn(turnIndex: number): number {
  return Math.max(0, Math.ceil(turnIndex / JUDGE_TURN_INTERVAL) - 1);
}

export function exchangeIndexForPendingTurn(
  exchangeMessages: readonly DateMessage[],
  fallbackExchangeIndex: number,
): number {
  const firstCharacterMessage = exchangeMessages.find((message) => message.kind === "character");

  if (firstCharacterMessage === undefined) {
    return fallbackExchangeIndex;
  }

  return exchangeIndexForTurn(firstCharacterMessage.turnIndex);
}

function buildShiftSummary(
  completedDates: number,
  earlyEndedDates: number,
  memberMoodDelta: number,
): string {
  const completedLabel = completedDates === 1 ? "date" : "dates";
  return `${completedDates} ${completedLabel} completed. ${earlyEndedDates} ended early. Member Mood delta ${memberMoodDelta}. Filing.`;
}

const OUTCOME_RANK: Record<DateFinalReport["outcome"], number> = {
  early_end: 0,
  bad_fit: 1,
  cool_down: 2,
  mixed: 3,
  second_date: 4,
};

type HrNoteLabels = {
  highlight: (names: string) => string;
  incident: (names: string) => string;
  soleFiling: (names: string) => string;
  fullBoard: (total: number) => string;
};

const HR_NOTE_LABELS: Record<DateFinalReport["outcome"], HrNoteLabels> = {
  second_date: {
    highlight: (names) => `Highlight: ${names} cleared for a second date.`,
    incident: (names) => `Lowlight: ${names}, second date.`,
    soleFiling: (names) => `Sole filing: ${names} cleared for a second date.`,
    fullBoard: (total) => `Clean board: ${total} dates cleared for a second pass.`,
  },
  mixed: {
    highlight: (names) => `Best of the board: ${names}, mixed but standing.`,
    incident: (names) => `Lowlight: ${names}, mixed.`,
    soleFiling: (names) => `Sole filing: ${names} closed mixed.`,
    fullBoard: (total) => `Full board: ${total} dates closed mixed.`,
  },
  cool_down: {
    highlight: (names) => `Best of the board: ${names}, cool down filed.`,
    incident: (names) => `Incident: ${names} flagged for cool down.`,
    soleFiling: (names) => `Sole filing: ${names} flagged for cool down.`,
    fullBoard: (total) => `Full board: ${total} dates flagged for cool down.`,
  },
  bad_fit: {
    highlight: (names) => `Best of the board: ${names}, marked bad fit.`,
    incident: (names) => `Incident: ${names} filed bad fit.`,
    soleFiling: (names) => `Sole filing: ${names} marked bad fit.`,
    fullBoard: (total) => `Full incident board: ${total} bad fits filed.`,
  },
  early_end: {
    highlight: (names) => `Best of the board: ${names}, walked early.`,
    incident: (names) => `Incident: ${names} ended early. Standard cleanup is on schedule.`,
    soleFiling: (names) => `Sole filing: ${names} ended early. Standard cleanup is on schedule.`,
    fullBoard: (total) => `Full incident board: ${total} dates ended early. Cleanup on schedule.`,
  },
};

type RankedOutcome = { session: DateSession; report: DateFinalReport };

function buildShiftHrNote({
  completedDates,
  ignoredRequests,
  members,
}: {
  completedDates: readonly DateSession[];
  ignoredRequests: readonly MemberRequest[];
  members: readonly Member[];
}): string {
  const ranked: RankedOutcome[] = completedDates.flatMap((session) =>
    session.finalReport === undefined ? [] : [{ session, report: session.finalReport }],
  );
  const askLine = formatIgnoredAsksLine(ignoredRequests.length);

  if (ranked.length === 0) {
    return `No dates filed. ${askLine}`;
  }

  const memberById = new Map(members.map((member) => [member.id, member]));
  const sortedAsc = [...ranked].sort(
    (left, right) => OUTCOME_RANK[left.report.outcome] - OUTCOME_RANK[right.report.outcome],
  );
  const worst = sortedAsc[0];
  const best = sortedAsc[sortedAsc.length - 1];

  if (best.report.outcome === worst.report.outcome) {
    const labels = HR_NOTE_LABELS[best.report.outcome];
    const line =
      ranked.length === 1
        ? labels.soleFiling(formatPairNames(best.session, memberById))
        : labels.fullBoard(ranked.length);
    return `${line} ${askLine}`;
  }

  const highlight = HR_NOTE_LABELS[best.report.outcome].highlight(
    formatPairNames(best.session, memberById),
  );
  const incident = HR_NOTE_LABELS[worst.report.outcome].incident(
    formatPairNames(worst.session, memberById),
  );
  return `${highlight} ${incident} ${askLine}`;
}

function formatIgnoredAsksLine(count: number): string {
  if (count === 0) {
    return "All member asks closed.";
  }
  return `${count} member ${count === 1 ? "ask" : "asks"} left on the floor. HR cc'd.`;
}

function formatPairNames(session: DateSession, memberById: ReadonlyMap<string, Member>): string {
  const [firstId, secondId] = session.participants;
  const firstName = memberById.get(firstId)?.firstName ?? "Member";
  const secondName = memberById.get(secondId)?.firstName ?? "Member";
  return `${firstName} and ${secondName}`;
}

function followUpForOutcome(outcome: DateFinalReport["outcome"]): FollowUpAction {
  if (outcome === "second_date") {
    return "encourage";
  }

  if (outcome === "cool_down") {
    return "cool_down";
  }

  if (outcome === "early_end") {
    return "repair";
  }

  return outcome === "bad_fit" ? "mark_bad_fit" : "repair";
}

function isBadFitOutcome(stats: PairStats): boolean {
  return (
    stats.relationshipHealth <= 25 ||
    (stats.chemistry <= 25 && stats.trust <= 30 && stats.conflict >= 70)
  );
}

function deriveDateOutcome(session: DateSession, pairState: PairState): DateFinalReport["outcome"] {
  if (session.status === "ended_early") {
    return session.endSentiment === "positive" ? "second_date" : "early_end";
  }

  if (pairState.stats.relationshipHealth >= 65) {
    return "second_date";
  }

  if (isBadFitOutcome(pairState.stats)) {
    return "bad_fit";
  }

  if (pairState.stats.strain >= 70) {
    return "cool_down";
  }

  return "mixed";
}

function finalReportStatusLine(session: DateSession, outcome: DateFinalReport["outcome"]): string {
  if (session.status === "ended_early" && session.endSentiment === "positive") {
    return "Date ended early with a positive exit. Cupid filed it as efficient.";
  }

  if (session.status === "ended_early") {
    return "Date ended early. Standard cleanup is on schedule.";
  }

  if (outcome === "second_date") {
    return "Second booking signal is strong enough to survive paperwork.";
  }

  if (outcome === "cool_down") {
    return "The file needs air before Cupid touches the calendar again.";
  }

  if (outcome === "bad_fit") {
    return "The mismatch is material. Cupid closed the romantic lane.";
  }

  return "Cupid filed the result as mixed and left the pen uncapped.";
}

export function shouldFileClosureNearMiss({
  pairState,
  outcome,
  completedDateCount,
  members,
}: {
  pairState: PairState;
  outcome: DateFinalReport["outcome"];
  completedDateCount: number;
  members: readonly Member[];
}): boolean {
  if (outcome === "bad_fit" || outcome === "early_end") {
    return false;
  }

  if (completedDateCount < CLOSURE_THRESHOLD.minCompletedDates) {
    return false;
  }

  const membersById = new Map(members.map((member) => [member.id, member] as const));
  for (const participantId of pairState.participantIds) {
    const member = membersById.get(participantId);
    if (member === undefined || member.state.status !== "active") {
      return false;
    }
  }

  const { stats } = pairState;
  const nearStats =
    stats.chemistry >= CLOSURE_THRESHOLD.chemistry - 6 &&
    stats.trust >= CLOSURE_THRESHOLD.trust - 6 &&
    stats.relationshipHealth >= CLOSURE_THRESHOLD.relationshipHealth - 6;
  if (!nearStats) {
    return false;
  }

  if (
    evaluateClosureReadiness({
      pairState,
      outcome,
      completedDateCount,
      members,
    })
  ) {
    return false;
  }

  const hasBrokenAgreement = pairState.agreements.some(
    (agreement) => agreement.status === "broken",
  );
  const hasOpenLoop = pairState.openLoops.some((loop) => loop.status === "open");

  return (
    stats.strain > CLOSURE_THRESHOLD.strainMax ||
    stats.conflict > CLOSURE_THRESHOLD.conflictMax ||
    hasBrokenAgreement ||
    hasOpenLoop
  );
}

export function createClosureNearMissMemoryRecord({
  session,
  pairState,
  members,
  createdAt,
}: {
  session: DateSession;
  pairState: PairState;
  members: readonly Member[];
  createdAt: string;
}): MemoryRecord | null {
  const outcome = session.finalReport?.outcome;
  if (outcome === undefined) {
    return null;
  }

  const completedDateCount = pairState.completedDateIds.includes(session.id)
    ? pairState.completedDateIds.length
    : pairState.completedDateIds.length + 1;
  if (!shouldFileClosureNearMiss({ pairState, outcome, completedDateCount, members })) {
    return null;
  }

  const [first, second] = members;
  if (first === undefined || second === undefined) {
    return null;
  }

  const text = `${first.firstName} and ${second.firstName} nearly cleared closure. Cupid kept the file open for pressure cleanup.`;
  const embedding = createDeterministicEmbedding(text);

  return memoryRecordSchema.parse({
    id: `memory-${session.id}-${CLOSURE_NEAR_MISS_TAG}`,
    scope: "pair",
    visibility: "public",
    subjectIds: session.participants,
    pairId: session.pairId,
    scenarioId: session.scenarioId,
    dateSessionId: session.id,
    text,
    tags: [CLOSURE_NEAR_MISS_TAG, "date_summary"],
    importance: 4,
    createdAt,
    embedding,
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: embedding.length,
  });
}

function closureNearMissCaseSummary(pairState: PairState): string {
  const blockers: string[] = [];

  if (pairState.stats.strain > CLOSURE_THRESHOLD.strainMax) blockers.push("strain");
  if (pairState.stats.conflict > CLOSURE_THRESHOLD.conflictMax) blockers.push("conflict");
  if (pairState.agreements.some((agreement) => agreement.status === "broken")) {
    blockers.push("a broken agreement");
  }
  if (pairState.openLoops.some((loop) => loop.status === "open")) {
    blockers.push("an unresolved item");
  }

  const blockerText = blockers.length === 0 ? "file pressure" : joinPlainList(blockers.slice(0, 2));
  return `Case read: the pair nearly cleared closure, but ${blockerText} kept the file open.`;
}

function finalReportCaseSummary(outcome: DateFinalReport["outcome"]): string {
  if (outcome === "second_date") {
    return "Case read: the pair left with enough mutual signal for a second booking.";
  }

  if (outcome === "cool_down") {
    return "Case read: the room ran hot. Give the pair space before the next booking.";
  }

  if (outcome === "bad_fit") {
    return "Case read: the mismatch is material. Do not force another room without a new reason.";
  }

  if (outcome === "early_end") {
    return "Case read: a boundary ended the date. Repair the client file before rebooking.";
  }

  return "Case read: the pair produced useful notes but needs a cautious follow-up.";
}

function joinPlainList(items: readonly string[]): string {
  const [first, second] = items;
  if (first === undefined) return "";
  if (second === undefined) return first;
  return `${first} and ${second}`;
}

function formatOutcomeForMemory(outcome: DateFinalReport["outcome"] | undefined): string {
  if (outcome === "second_date") {
    return "cleared for a second booking";
  }

  if (outcome === "cool_down") {
    return "a cool-down file";
  }

  if (outcome === "bad_fit") {
    return "a bad-fit file";
  }

  if (outcome === "early_end") {
    return "an early-end incident";
  }

  return "a mixed case";
}

function formatDateHealthShift(delta: number): string {
  if (delta >= 6) {
    return "strong positive";
  }

  if (delta >= 2) {
    return "positive";
  }

  if (delta <= -6) {
    return "sharp negative";
  }

  if (delta <= -2) {
    return "negative";
  }

  return "stable";
}

function replaceDateSession(save: GameSave, session: DateSession, timestamp: string): GameSave {
  return gameSaveSchema.parse({
    ...save,
    dateSessions: replaceById(save.dateSessions, session),
    updatedAt: timestamp,
  });
}

export function requireMember(save: GameSave, memberId: string): Member {
  const member = findMemberInSave(save, memberId);

  if (member === undefined) {
    throw new Error(`Member not found: ${memberId}`);
  }

  return member;
}

export function requireScenario(scenarioId: string): DateScenario {
  const normalizedScenarioId = normalizeStarterScenarioId(scenarioId);
  const scenario = starterScenarios.find((candidate) => candidate.id === normalizedScenarioId);

  if (scenario === undefined) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  return scenario;
}

export function requirePairState(save: GameSave, pairId: string): PairState {
  const pairState = save.pairStates.find((candidate) => candidate.id === pairId);

  if (pairState === undefined) {
    throw new Error(`Pair state not found: ${pairId}`);
  }

  return pairState;
}

export function requireDateSession(save: GameSave, dateSessionId: string): DateSession {
  const session = save.dateSessions.find((candidate) => candidate.id === dateSessionId);

  if (session === undefined) {
    throw new Error(`Date session not found: ${dateSessionId}`);
  }

  return session;
}

export function findMemberRequestById(requestId: string | undefined) {
  if (requestId === undefined) {
    return undefined;
  }

  return memberRequests.find((request) => request.id === requestId);
}

function startingDateHealth(pairState: PairState): number {
  return clampScore(
    Math.round((pairState.stats.relationshipHealth + pairState.stats.stability) / 2),
  );
}

function isOrdinaryHuman(member: Member): boolean {
  return member.tags.includes("ordinary_human");
}
