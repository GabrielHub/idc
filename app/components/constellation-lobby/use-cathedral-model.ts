import { useMemo } from "react";

import type { DateScenario, GameSave, ScenarioDeck, ShiftState } from "../../domain/game";
import {
  activeBudgetDiscountOffers,
  computeEffectiveCosts,
  deriveDeckBudgetStatus,
} from "../../services/budget";
import {
  deckIsRepairBlocked,
  drawHandForBooking,
  softComposeWarnings,
  unlockedScenarioIds,
} from "../../services/deck";
import { starterScenarios } from "../../fixtures";
import {
  evaluateMatchFit,
  scenarioRoomReadFromMatchFit,
  type ScenarioRoomRead,
} from "../../services/match-fit";
import { getPairProjectionFromSave, materializePairEdge } from "../../services/relationship-index";
import { makePairId } from "../../services/game-seed";
import type { CathedralMode, RiskFilter, SortMode } from "./cathedral";
import { computeDeckComposition } from "./deck-composition";
import { buildCathedralDoors, filterScenarioLibrary } from "./scenario-doors";
import { toLobbyScenario } from "./star-model";

export function useCathedralModel({
  save,
  shift,
  drawnScenarios,
  previewPairId,
  focusId,
  partnerId,
  scenarioMode,
  librarySearch,
  libraryRiskFilter,
  librarySort,
  expandedDoorId,
}: {
  save: GameSave;
  shift: ShiftState;
  drawnScenarios: readonly DateScenario[];
  previewPairId: string | null;
  /**
   * Focus + partner ids when both are picked. Used to evaluate the room read
   * per scenario via evaluateMatchFit. When either is null the cathedral
   * falls back to the neutral "steady" read because no pair context exists
   * yet.
   */
  focusId: string | null;
  partnerId: string | null;
  scenarioMode: CathedralMode;
  librarySearch: string;
  libraryRiskFilter: RiskFilter;
  librarySort: SortMode;
  expandedDoorId: string | null;
}) {
  const scenarioById = useMemo(
    () => new Map(starterScenarios.map((scenario) => [scenario.id, scenario])),
    [],
  );
  const offers = useMemo(() => activeBudgetDiscountOffers(save), [save]);
  const effectiveCosts = useMemo(() => computeEffectiveCosts(starterScenarios, offers), [offers]);
  const budgetStatus = useMemo(
    () =>
      deriveDeckBudgetStatus({
        cardIds: save.scenarioDeck.cardIds,
        effectiveCosts,
        budgetCap: save.budgetCap,
      }),
    [save.scenarioDeck.cardIds, save.budgetCap, effectiveCosts],
  );
  const deckRepairBlocked = useMemo(() => deckIsRepairBlocked(save, starterScenarios), [save]);
  const deckComposition = useMemo(
    () => computeDeckComposition(save.scenarioDeck.cardIds, scenarioById),
    [save.scenarioDeck.cardIds, scenarioById],
  );
  // Soft advisories for the deck (no-low-pressure, no-high-pressure, etc.).
  // Surfaced by the cathedral header so the player sees the same heads-up
  // pills the old DateBookHeader rendered.
  const deckComposeWarnings = useMemo(
    () => softComposeWarnings(save.scenarioDeck, starterScenarios),
    [save.scenarioDeck],
  );
  // Per-scenario room read for the current pair. When focus + partner are
  // both picked we resolve the pair (persisted or projected), then run
  // evaluateMatchFit per scenario and project the result to the player-safe
  // Room Read pip ("steady" / "promising" / "volatile"). Without a pair
  // there's no context for the read, so every scenario falls back to "steady".
  const roomReadByScenarioId = useMemo<ReadonlyMap<string, ScenarioRoomRead>>(() => {
    if (focusId === null || partnerId === null) return new Map();
    const focusMember = save.members.find((m) => m.id === focusId);
    const partnerMember = save.members.find((m) => m.id === partnerId);
    if (focusMember === undefined || partnerMember === undefined) return new Map();
    const pairId = makePairId(focusId, partnerId);
    const projection = getPairProjectionFromSave(save, pairId);
    if (projection === undefined) return new Map();
    const pairState = materializePairEdge(projection);
    const reads = new Map<string, ScenarioRoomRead>();
    for (const scenario of starterScenarios) {
      const fit = evaluateMatchFit({
        members: [focusMember, partnerMember],
        scenario,
        pairState,
      });
      reads.set(scenario.id, scenarioRoomReadFromMatchFit(fit));
    }
    return reads;
  }, [focusId, partnerId, save]);
  const toLobby = (scenario: DateScenario) =>
    toLobbyScenario(scenario, roomReadByScenarioId.get(scenario.id) ?? "steady");
  const lobbyScenarios = useMemo(
    () => drawnScenarios.map(toLobby),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawnScenarios, roomReadByScenarioId],
  );
  const flythroughScenariosForLayer = useMemo(
    () =>
      buildAutoModeScenarios({
        drawnScenarios,
        deck: save.scenarioDeck,
        shiftNumber: shift.shiftNumber,
        previewPairId,
        scenarioById,
      }).map(toLobby),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      drawnScenarios,
      save.scenarioDeck,
      shift.shiftNumber,
      previewPairId,
      scenarioById,
      roomReadByScenarioId,
    ],
  );

  const unlockedLibraryIds = useMemo(
    () => unlockedScenarioIds({ closureCount: save.closureCount, shiftNumber: shift.shiftNumber }),
    [save.closureCount, shift.shiftNumber],
  );
  const filteredLibrary = useMemo(
    () =>
      filterScenarioLibrary({
        save,
        scenarios: starterScenarios,
        scenarioById,
        unlockedLibraryIds,
        search: librarySearch,
        riskFilter: libraryRiskFilter,
        sort: librarySort,
        effectiveCosts,
      }),
    [
      save,
      scenarioById,
      librarySearch,
      libraryRiskFilter,
      librarySort,
      unlockedLibraryIds,
      effectiveCosts,
    ],
  );
  const cathedralDoors = useMemo(
    () =>
      buildCathedralDoors({
        mode: scenarioMode,
        deckCardIds: save.scenarioDeck.cardIds,
        scenarioById,
        effectiveCosts,
        filteredLibrary,
        lobbyScenarios,
        flythroughScenarios: flythroughScenariosForLayer,
      }),
    [
      scenarioMode,
      save.scenarioDeck.cardIds,
      scenarioById,
      effectiveCosts,
      filteredLibrary,
      lobbyScenarios,
      flythroughScenariosForLayer,
    ],
  );
  const expandedScenario = useMemo(
    () => (expandedDoorId === null ? null : (scenarioById.get(expandedDoorId) ?? null)),
    [expandedDoorId, scenarioById],
  );

  return {
    scenarioById,
    effectiveCosts,
    budgetStatus,
    deckRepairBlocked,
    deckComposition,
    deckComposeWarnings,
    lobbyScenarios,
    flythroughScenariosForLayer,
    filteredLibrary,
    cathedralDoors,
    expandedScenario,
  };
}

export function buildAutoModeScenarios({
  drawnScenarios,
  deck,
  shiftNumber,
  previewPairId,
  scenarioById,
}: {
  drawnScenarios: readonly DateScenario[];
  deck: ScenarioDeck;
  shiftNumber: number;
  previewPairId: string | null;
  scenarioById: ReadonlyMap<string, DateScenario>;
}): DateScenario[] {
  if (drawnScenarios.length > 0) return [...drawnScenarios];

  const scenarioIds =
    previewPairId === null
      ? deck.cardIds.slice(0, 3)
      : drawHandForBooking({ deck, shiftNumber, pairId: previewPairId });

  return scenarioIds
    .map((id) => scenarioById.get(id))
    .filter((scenario): scenario is DateScenario => scenario !== undefined);
}
