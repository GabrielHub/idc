import {
  budgetReviewSchema,
  DECK_SIZE_MAX,
  DECK_SIZE_MIN,
  MAX_BUDGET_CAP,
  MIN_BUDGET_CAP,
  scenarioTagSchema,
  type BudgetDiscountOffer,
  type BudgetReason,
  type BudgetReview,
  type CompanyGoal,
  type DateScenario,
  type GameSave,
  type MemberRequest,
  type MemberRequestTag,
  type ScenarioTag,
} from "../domain/game";
import { clamp } from "./utils";

export {
  STARTER_BUDGET_CAP,
  MIN_BUDGET_CAP,
  MAX_BUDGET_CAP,
  DECK_SIZE_MIN,
  DECK_SIZE_MAX,
} from "../domain/game";

export const PERFORMANCE_REVIEW_INTERVAL = 5;
export const CLOSURE_BUDGET_BUMP = 15;
export const MEMBER_QUIT_BUDGET_CUT = -10;
export const REQUEST_DISCOUNT_PERCENT = 30 as const;
export const CLOSURE_DISCOUNT_PERCENT = 50 as const;
export const COMPANY_GOAL_DISCOUNT_PERCENT = 15 as const;
export const MIN_EFFECTIVE_COST = 1;

export type DeckBudgetStatus = "within_budget" | "over_budget" | "invalid_size";

export type DeckBudgetSnapshot = {
  status: DeckBudgetStatus;
  cardIds: readonly string[];
  budgetCap: number;
  effectiveCosts: Record<string, number>;
  spend: number;
  remaining: number;
  size: number;
};

const REQUEST_TAG_TO_SCENARIO_TAGS: Partial<Record<MemberRequestTag, ScenarioTag[]>> = {
  normal_date: ["low_pressure"],
  low_pressure: ["low_pressure"],
  career_fatigue: ["low_pressure"],
  privacy: ["low_pressure"],
  quiet_date: ["low_pressure"],
  career: ["career"],
  career_intense: ["career"],
  decisiveness: ["career"],
  memory: ["memory"],
  cosmic: ["cosmic"],
  prophecy_averse: ["low_pressure"],
  sincerity: ["low_pressure", "domestic"],
  performative: ["public"],
  grounded: ["domestic"],
  structure: ["low_pressure"],
  fae: ["haunted"],
  cryptid: ["haunted"],
  deity: ["cosmic"],
};

export function effectiveScenarioCost(
  scenario: DateScenario,
  offers: readonly BudgetDiscountOffer[],
): number {
  let bestPercent = 0;
  for (const offer of offers) {
    if (!isOfferApplicableToScenario(offer, scenario)) {
      continue;
    }
    if (offer.percentOff > bestPercent) {
      bestPercent = offer.percentOff;
    }
  }
  if (bestPercent === 0) {
    return scenario.card.cost;
  }
  const discounted = Math.round(scenario.card.cost * (1 - bestPercent / 100));
  return Math.max(MIN_EFFECTIVE_COST, discounted);
}

export function isOfferApplicableToScenario(
  offer: BudgetDiscountOffer,
  scenario: DateScenario,
): boolean {
  if (offer.scenarioIds.includes(scenario.id)) {
    return true;
  }
  for (const tag of offer.scenarioTagIds) {
    if (scenario.card.tags.includes(tag)) {
      return true;
    }
  }
  return false;
}

export function computeEffectiveCosts(
  scenarios: readonly DateScenario[],
  offers: readonly BudgetDiscountOffer[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const scenario of scenarios) {
    out[scenario.id] = effectiveScenarioCost(scenario, offers);
  }
  return out;
}

export function currentDeckSpend(
  cardIds: readonly string[],
  effectiveCosts: Record<string, number>,
): number {
  let total = 0;
  for (const cardId of cardIds) {
    total += effectiveCosts[cardId] ?? 0;
  }
  return total;
}

export function remainingBudget(
  cardIds: readonly string[],
  effectiveCosts: Record<string, number>,
  budgetCap: number,
): number {
  return budgetCap - currentDeckSpend(cardIds, effectiveCosts);
}

export function canAddToDeck({
  cardId,
  cardIds,
  effectiveCosts,
  budgetCap,
}: {
  cardId: string;
  cardIds: readonly string[];
  effectiveCosts: Record<string, number>;
  budgetCap: number;
}): { ok: true } | { ok: false; reason: "duplicate" | "deck_full" | "over_budget" | "unknown" } {
  if (cardIds.includes(cardId)) {
    return { ok: false, reason: "duplicate" };
  }
  if (cardIds.length >= DECK_SIZE_MAX) {
    return { ok: false, reason: "deck_full" };
  }
  const cost = effectiveCosts[cardId];
  if (cost === undefined) {
    return { ok: false, reason: "unknown" };
  }
  if (cost > remainingBudget(cardIds, effectiveCosts, budgetCap)) {
    return { ok: false, reason: "over_budget" };
  }
  return { ok: true };
}

export function deriveDeckBudgetStatus({
  cardIds,
  effectiveCosts,
  budgetCap,
}: {
  cardIds: readonly string[];
  effectiveCosts: Record<string, number>;
  budgetCap: number;
}): DeckBudgetSnapshot {
  const size = cardIds.length;
  const spend = currentDeckSpend(cardIds, effectiveCosts);
  const remaining = budgetCap - spend;
  let status: DeckBudgetStatus;

  if (size < DECK_SIZE_MIN || size > DECK_SIZE_MAX) {
    status = "invalid_size";
  } else if (spend > budgetCap) {
    status = "over_budget";
  } else {
    status = "within_budget";
  }

  return {
    status,
    cardIds,
    budgetCap,
    effectiveCosts,
    spend,
    remaining,
    size,
  };
}

export function snapshotDeckForSave(
  save: GameSave,
  scenarios: readonly DateScenario[],
): DeckBudgetSnapshot {
  const offers = activeBudgetDiscountOffers(save);
  const effectiveCosts = computeEffectiveCosts(scenarios, offers);
  return deriveDeckBudgetStatus({
    cardIds: save.scenarioDeck.cardIds,
    effectiveCosts,
    budgetCap: save.budgetCap,
  });
}

export function activeBudgetDiscountOffers(save: GameSave): BudgetDiscountOffer[] {
  return save.budgetDiscountOffers.filter((offer) => offer.budgetPeriodId === save.budgetPeriodId);
}

export type ApplyBudgetChangeInput = {
  previousCap: number;
  reasons: readonly BudgetReason[];
  shift: number;
};

export type ApplyBudgetChangeResult = {
  review: BudgetReview;
  newCap: number;
};

export function applyBudgetChange(input: ApplyBudgetChangeInput): ApplyBudgetChangeResult {
  const proposedDelta = input.reasons.reduce((total, reason) => total + reason.delta, 0);
  const newCap = clamp(input.previousCap + proposedDelta, MIN_BUDGET_CAP, MAX_BUDGET_CAP);
  const review = budgetReviewSchema.parse({
    shift: input.shift,
    previousCap: input.previousCap,
    newCap,
    reasons: input.reasons,
  });
  return { review, newCap };
}

export function recordBudgetEvent(save: GameSave, reason: BudgetReason, shift: number): GameSave {
  const { review, newCap } = applyBudgetChange({
    previousCap: save.budgetCap,
    reasons: [reason],
    shift,
  });
  return {
    ...save,
    budgetCap: newCap,
    budgetHistory: [...save.budgetHistory, review],
  };
}

export function applyClosureBudgetBump(save: GameSave, shift: number): GameSave {
  return recordBudgetEvent(
    save,
    {
      kind: "closure",
      label: "Closure filed",
      delta: CLOSURE_BUDGET_BUMP,
    },
    shift,
  );
}

export function applyMemberQuitBudgetCut({
  previousSave,
  nextSave,
  shift,
}: {
  previousSave: GameSave;
  nextSave: GameSave;
  shift: number;
}): GameSave {
  const previousQuit = new Set(
    previousSave.members.filter((member) => member.state.status === "quit").map((m) => m.id),
  );
  const newlyQuit = nextSave.members.filter(
    (member) => member.state.status === "quit" && !previousQuit.has(member.id),
  );
  if (newlyQuit.length === 0) {
    return nextSave;
  }
  let updated = nextSave;
  for (const member of newlyQuit) {
    updated = recordBudgetEvent(
      updated,
      {
        kind: "member_quit",
        label: `${member.firstName} closed their file`,
        delta: MEMBER_QUIT_BUDGET_CUT,
      },
      shift,
    );
  }
  return updated;
}

export type BudgetReviewSignalsInput = {
  save: GameSave;
  shiftNumber: number;
  closuresSinceLastReview: number;
  quitsSinceLastReview: number;
  averageActiveRetention: number;
  averagePairHealth: number | null;
  averagePairFriction: number | null;
  requestFulfillmentRate: number;
};

export function buildPerformanceReviewReasons(input: BudgetReviewSignalsInput): BudgetReason[] {
  const reasons: BudgetReason[] = [];

  if (input.closuresSinceLastReview !== 0) {
    reasons.push({
      kind: "performance_closures",
      label: `${input.closuresSinceLastReview} closure${input.closuresSinceLastReview === 1 ? "" : "s"} this window`,
      delta: input.closuresSinceLastReview * 6,
    });
  }

  if (input.quitsSinceLastReview !== 0) {
    reasons.push({
      kind: "performance_quits",
      label: `${input.quitsSinceLastReview} client file${input.quitsSinceLastReview === 1 ? "" : "s"} closed`,
      delta: input.quitsSinceLastReview * -6,
    });
  }

  const retentionDelta = retentionDeltaFromAverage(input.averageActiveRetention);
  if (retentionDelta !== 0) {
    reasons.push({
      kind: "performance_retention",
      label: `Retention floor at ${Math.round(input.averageActiveRetention)}`,
      delta: retentionDelta,
    });
  }

  const healthDelta =
    input.averagePairHealth === null ? 0 : pairHealthDeltaFromAverage(input.averagePairHealth);
  if (input.averagePairHealth !== null && healthDelta !== 0) {
    reasons.push({
      kind: "performance_pair_health",
      label: `Pair health at ${Math.round(input.averagePairHealth)}`,
      delta: healthDelta,
    });
  }

  const frictionDelta =
    input.averagePairFriction === null
      ? 0
      : pairFrictionDeltaFromAverage(input.averagePairFriction);
  if (input.averagePairFriction !== null && frictionDelta !== 0) {
    reasons.push({
      kind: "performance_pair_friction",
      label: `Pair friction at ${Math.round(input.averagePairFriction)}`,
      delta: frictionDelta,
    });
  }

  const requestDelta = requestFulfillmentDelta(input.requestFulfillmentRate);
  if (requestDelta !== 0) {
    const percent = Math.round(input.requestFulfillmentRate * 100);
    reasons.push({
      kind: "performance_request_fulfillment",
      label: `${percent}% of asks honored`,
      delta: requestDelta,
    });
  }

  return reasons;
}

function retentionDeltaFromAverage(average: number): number {
  if (average >= 85) return 5;
  if (average >= 70) return 2;
  if (average >= 50) return 0;
  if (average >= 30) return -3;
  return -6;
}

function pairHealthDeltaFromAverage(average: number): number {
  if (average >= 70) return 4;
  if (average >= 55) return 1;
  if (average >= 40) return 0;
  return -3;
}

function pairFrictionDeltaFromAverage(average: number): number {
  if (average <= 25) return 2;
  if (average <= 45) return 0;
  if (average <= 60) return -2;
  return -5;
}

function requestFulfillmentDelta(rate: number): number {
  if (rate >= 0.85) return 4;
  if (rate >= 0.6) return 1;
  if (rate >= 0.4) return 0;
  if (rate >= 0.2) return -3;
  return -5;
}

export type PerformanceReviewInput = BudgetReviewSignalsInput;

export function shouldRunPerformanceReview({
  save,
  shiftNumber,
}: {
  save: Pick<GameSave, "lastBudgetReviewShift">;
  shiftNumber: number;
}): boolean {
  return shiftNumber - save.lastBudgetReviewShift >= PERFORMANCE_REVIEW_INTERVAL;
}

export type GenerateBudgetDiscountOffersInput = {
  save: GameSave;
  scenarios: readonly DateScenario[];
  shiftNumber: number;
  budgetPeriodId: string;
  expiresAtReviewShift: number;
  focusedMemberRequests: readonly MemberRequest[];
  recentClosurePairTags: readonly ScenarioTag[];
  activeCompanyGoals: readonly CompanyGoal[];
};

export function generateBudgetDiscountOffers(
  input: GenerateBudgetDiscountOffersInput,
): BudgetDiscountOffer[] {
  const offers: BudgetDiscountOffer[] = [];
  let nextIndex = 0;

  for (const request of input.focusedMemberRequests) {
    const tags = uniqueTags(request.tags.flatMap((tag) => REQUEST_TAG_TO_SCENARIO_TAGS[tag] ?? []));
    if (tags.length === 0) {
      continue;
    }
    nextIndex += 1;
    offers.push({
      id: `${input.budgetPeriodId}-offer-request-${nextIndex}`,
      budgetPeriodId: input.budgetPeriodId,
      kind: "request",
      label: `Ask coverage: ${tags.join(", ")}`,
      scenarioTagIds: tags,
      scenarioIds: [],
      percentOff: REQUEST_DISCOUNT_PERCENT,
      startsAtShift: input.shiftNumber,
      expiresAtReviewShift: input.expiresAtReviewShift,
    });
  }

  if (input.recentClosurePairTags.length > 0) {
    const tags = uniqueTags([...input.recentClosurePairTags]);
    nextIndex += 1;
    offers.push({
      id: `${input.budgetPeriodId}-offer-closure-${nextIndex}`,
      budgetPeriodId: input.budgetPeriodId,
      kind: "closure",
      label: `Closure echo: ${tags.join(", ")}`,
      scenarioTagIds: tags,
      scenarioIds: [],
      percentOff: CLOSURE_DISCOUNT_PERCENT,
      startsAtShift: input.shiftNumber,
      expiresAtReviewShift: input.expiresAtReviewShift,
    });
  }

  for (const goal of input.activeCompanyGoals) {
    const tags = collectGoalScenarioTags(goal);
    if (tags.length === 0) {
      continue;
    }
    nextIndex += 1;
    offers.push({
      id: `${input.budgetPeriodId}-offer-goal-${nextIndex}`,
      budgetPeriodId: input.budgetPeriodId,
      kind: "company_goal",
      label: `Goal incentive: ${goal.title}`,
      scenarioTagIds: tags,
      scenarioIds: [],
      percentOff: COMPANY_GOAL_DISCOUNT_PERCENT,
      startsAtShift: input.shiftNumber,
      expiresAtReviewShift: input.expiresAtReviewShift,
    });
  }

  return offers;
}

function collectGoalScenarioTags(goal: CompanyGoal): ScenarioTag[] {
  const fromTags = goal.tags
    .map((tag) => coerceScenarioTag(tag))
    .filter((tag): tag is ScenarioTag => tag !== null);
  return uniqueTags(fromTags);
}

function coerceScenarioTag(value: string): ScenarioTag | null {
  const result = scenarioTagSchema.safeParse(value);
  return result.success ? result.data : null;
}

function uniqueTags(tags: readonly ScenarioTag[]): ScenarioTag[] {
  return Array.from(new Set(tags));
}

export function rotateBudgetPeriod({
  save,
  shiftNumber,
  scenarios,
  focusedMemberRequests,
  recentClosurePairTags,
  activeCompanyGoals,
}: {
  save: GameSave;
  shiftNumber: number;
  scenarios: readonly DateScenario[];
  focusedMemberRequests: readonly MemberRequest[];
  recentClosurePairTags: readonly ScenarioTag[];
  activeCompanyGoals: readonly CompanyGoal[];
}): GameSave {
  const nextPeriodId = nextBudgetPeriodId(shiftNumber);
  const offers = generateBudgetDiscountOffers({
    save,
    scenarios,
    shiftNumber,
    budgetPeriodId: nextPeriodId,
    expiresAtReviewShift: shiftNumber + PERFORMANCE_REVIEW_INTERVAL,
    focusedMemberRequests,
    recentClosurePairTags,
    activeCompanyGoals,
  });
  return {
    ...save,
    budgetPeriodId: nextPeriodId,
    budgetDiscountOffers: offers,
  };
}

function nextBudgetPeriodId(shiftNumber: number): string {
  return `budget-period-shift-${shiftNumber}`;
}
