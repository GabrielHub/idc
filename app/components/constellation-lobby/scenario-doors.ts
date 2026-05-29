import type { DateScenario } from "../../domain/game";
import type { DoorEntry } from "./cathedral";
import type { LobbyScenario } from "./types";
import { toLobbyScenario } from "./star-model";

export function buildCathedralDoors({
  mode,
  deckCardIds,
  scenarioById,
  effectiveCosts,
  drawnScenarios,
}: {
  mode: "auto" | "deck";
  deckCardIds: readonly string[];
  scenarioById: ReadonlyMap<string, DateScenario>;
  effectiveCosts: Readonly<Record<string, number>>;
  drawnScenarios: readonly LobbyScenario[];
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
  return drawnScenarios.map((scenario) => ({ scenario, kind: "draw" as const }));
}

export function scenarioWithEffectiveCost(
  scenario: DateScenario,
  effectiveCosts: Readonly<Record<string, number>>,
): LobbyScenario {
  return { ...toLobbyScenario(scenario), cost: effectiveCosts[scenario.id] ?? scenario.card.cost };
}
