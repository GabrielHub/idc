import type { DateScenario, GameSave } from "../../domain/game";
import { listLibraryCards } from "../../services/deck";
import type { DoorEntry, RiskFilter, SortMode } from "./cathedral";
import type { LobbyScenario } from "./types";
import { toLobbyScenario } from "./star-model";

const RISK_RANK = { low: 0, medium: 1, high: 2 } as const;

export function filterScenarioLibrary({
  save,
  scenarios,
  scenarioById,
  unlockedLibraryIds,
  search,
  riskFilter,
  sort,
  effectiveCosts,
}: {
  save: GameSave;
  scenarios: readonly DateScenario[];
  scenarioById: ReadonlyMap<string, DateScenario>;
  unlockedLibraryIds: ReadonlySet<string>;
  search: string;
  riskFilter: RiskFilter;
  sort: SortMode;
  effectiveCosts: Readonly<Record<string, number>>;
}): ReturnType<typeof listLibraryCards> {
  const term = search.trim().toLowerCase();
  const filtered = listLibraryCards(save, scenarios).filter((entry) => {
    const scenario = scenarioById.get(entry.scenarioId);
    if (scenario === undefined) return false;
    if (!unlockedLibraryIds.has(scenario.id)) return false;
    if (riskFilter !== "any" && scenario.card.risk !== riskFilter) return false;
    if (term.length > 0) {
      const haystack = `${scenario.title} ${scenario.publicBrief.location}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
  return [...filtered].sort((a, b) => {
    const sa = scenarioById.get(a.scenarioId);
    const sb = scenarioById.get(b.scenarioId);
    if (sa === undefined || sb === undefined) return 0;
    if (sort === "alpha") return sa.title.localeCompare(sb.title);
    if (sort === "cost") {
      return (effectiveCosts[sa.id] ?? sa.card.cost) - (effectiveCosts[sb.id] ?? sb.card.cost);
    }
    if (sort === "risk") return RISK_RANK[sa.card.risk] - RISK_RANK[sb.card.risk];
    if (sort === "intimacy") {
      return RISK_RANK[sa.card.intimacy] - RISK_RANK[sb.card.intimacy];
    }
    return RISK_RANK[sa.card.chaos] - RISK_RANK[sb.card.chaos];
  });
}

export function buildCathedralDoors({
  mode,
  deckCardIds,
  scenarioById,
  effectiveCosts,
  filteredLibrary,
  lobbyScenarios,
  flythroughScenarios,
}: {
  mode: "auto" | "deck" | "library";
  deckCardIds: readonly string[];
  scenarioById: ReadonlyMap<string, DateScenario>;
  effectiveCosts: Readonly<Record<string, number>>;
  filteredLibrary: ReturnType<typeof listLibraryCards>;
  lobbyScenarios: readonly LobbyScenario[];
  flythroughScenarios: readonly LobbyScenario[];
}): DoorEntry[] {
  if (mode === "deck") {
    return deckCardIds
      .map((id, idx) => {
        const scenario = scenarioById.get(id);
        if (scenario === undefined) return null;
        return {
          scenario: scenarioWithEffectiveCost(scenario, effectiveCosts),
          kind: "deck" as const,
          slotLabel: `slot ${idx + 1}`,
        };
      })
      .filter((entry) => entry !== null);
  }
  if (mode === "library") {
    const inDeck = new Set(deckCardIds);
    return filteredLibrary
      .map((entry) => {
        const scenario = scenarioById.get(entry.scenarioId);
        if (scenario === undefined) return null;
        return {
          scenario: scenarioWithEffectiveCost(scenario, effectiveCosts),
          kind: "library" as const,
          alreadyInDeck: inDeck.has(scenario.id),
        };
      })
      .filter((entry) => entry !== null);
  }
  if (lobbyScenarios.length > 0) {
    return lobbyScenarios.map((scenario) => ({ scenario, kind: "draw" as const }));
  }
  return flythroughScenarios.map((scenario) => ({ scenario, kind: "draw" as const }));
}

function scenarioWithEffectiveCost(
  scenario: DateScenario,
  effectiveCosts: Readonly<Record<string, number>>,
): LobbyScenario {
  return { ...toLobbyScenario(scenario), cost: effectiveCosts[scenario.id] ?? scenario.card.cost };
}
