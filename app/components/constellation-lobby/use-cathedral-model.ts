import { useMemo } from "react";

import type { DateScenario, GameSave, ShiftState } from "../../domain/game";
import {
  activeBudgetDiscountOffers,
  computeEffectiveCosts,
  deriveDeckBudgetStatus,
} from "../../services/budget";
import { deckIsRepairBlocked, unlockedScenarioIds } from "../../services/deck";
import { starterScenarios } from "../../fixtures";
import type { CathedralMode, RiskFilter, SortMode } from "./cathedral";
import { computeDeckComposition } from "./deck-composition";
import { buildCathedralDoors, filterScenarioLibrary } from "./scenario-doors";
import { toLobbyScenario } from "./star-model";

export function useCathedralModel({
  save,
  shift,
  drawnScenarios,
  scenarioMode,
  librarySearch,
  libraryRiskFilter,
  librarySort,
  expandedDoorId,
}: {
  save: GameSave;
  shift: ShiftState;
  drawnScenarios: readonly DateScenario[];
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
  const lobbyScenarios = useMemo(() => drawnScenarios.map(toLobbyScenario), [drawnScenarios]);
  const flythroughScenariosForLayer = useMemo(() => {
    if (lobbyScenarios.length > 0) return lobbyScenarios;
    return save.scenarioDeck.cardIds
      .slice(0, 3)
      .map((id) => scenarioById.get(id))
      .filter((scenario): scenario is DateScenario => scenario !== undefined)
      .map(toLobbyScenario);
  }, [lobbyScenarios, save.scenarioDeck.cardIds, scenarioById]);

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
    lobbyScenarios,
    flythroughScenariosForLayer,
    filteredLibrary,
    cathedralDoors,
    expandedScenario,
  };
}
