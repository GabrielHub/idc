import {
  STARTER_BUDGET_CAP,
  type CompanyGoal,
  type DateScenario,
  type GameSave,
  type MemberRequest,
} from "../domain/game";
import { computeEffectiveCosts, rotateBudgetPeriod } from "./budget";
import { createDraftedScenarioDeck, STARTER_CATALOG_IDS } from "./deck";
import { selectInitialFocusCases } from "./focus-cases";
import { getActiveShift } from "./game-seed";

export type CompleteInitialOnboardingInput = {
  save: GameSave;
  focusedMemberIds: readonly string[];
  scenarioDeckCardIds: readonly string[];
  scenarios: readonly DateScenario[];
  memberRequests: readonly MemberRequest[];
  companyGoals: readonly CompanyGoal[];
};

export function completeInitialOnboarding({
  save,
  focusedMemberIds,
  scenarioDeckCardIds,
  scenarios,
  memberRequests,
  companyGoals,
}: CompleteInitialOnboardingInput): GameSave {
  const starterDeck = createDraftedScenarioDeck({
    cardIds: scenarioDeckCardIds,
    catalog: scenarios,
    catalogIds: STARTER_CATALOG_IDS,
    budgetCap: STARTER_BUDGET_CAP,
    effectiveCosts: computeEffectiveCosts(scenarios, []),
  });
  const withDeck: GameSave = {
    ...save,
    scenarioDeck: starterDeck,
    shifts: save.shifts.map((shift) =>
      shift.id === save.activeShiftId ? { ...shift, drawnScenarioIds: [] as string[] } : shift,
    ),
  };
  const withFocus = selectInitialFocusCases(withDeck, focusedMemberIds);
  const requestsById = new Map(memberRequests.map((request) => [request.id, request] as const));
  const focusedMemberRequests = withFocus.focusedMemberIds
    .map((memberId) => withFocus.members.find((member) => member.id === memberId))
    .map((member) =>
      member?.state.currentRequestId === undefined
        ? undefined
        : requestsById.get(member.state.currentRequestId),
    )
    .filter((request): request is MemberRequest => request !== undefined);
  const activeShift = getActiveShift(withFocus);
  const activeCompanyGoalIds = new Set(activeShift.companyGoalIds);

  return rotateBudgetPeriod({
    save: withFocus,
    shiftNumber: 1,
    scenarios,
    focusedMemberRequests,
    recentClosurePairTags: [],
    activeCompanyGoals: companyGoals.filter((goal) => activeCompanyGoalIds.has(goal.id)),
  });
}
