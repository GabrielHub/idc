import type { DateScenario } from "../../domain/game";

export type DeckComposition = {
  risk: { low: number; medium: number; high: number };
  intimacy: { low: number; medium: number; high: number };
  chaos: { low: number; medium: number; high: number };
  lowPressure: number;
  highPressure: number;
};

export type DeckAxisLevels = {
  risk: "low" | "medium" | "high";
  intimacy: "low" | "medium" | "high";
  chaos: "low" | "medium" | "high";
};

export function computeDeckComposition(
  cardIds: readonly string[],
  scenarioById: ReadonlyMap<string, DateScenario>,
): DeckComposition {
  const composition: DeckComposition = {
    risk: { low: 0, medium: 0, high: 0 },
    intimacy: { low: 0, medium: 0, high: 0 },
    chaos: { low: 0, medium: 0, high: 0 },
    lowPressure: 0,
    highPressure: 0,
  };
  for (const id of cardIds) {
    const scenario = scenarioById.get(id);
    if (scenario === undefined) continue;
    composition.risk[scenario.card.risk] += 1;
    composition.intimacy[scenario.card.intimacy] += 1;
    composition.chaos[scenario.card.chaos] += 1;
    if (scenario.card.tags.includes("low_pressure")) composition.lowPressure += 1;
    if (scenario.card.tags.includes("high_pressure")) composition.highPressure += 1;
  }
  return composition;
}

export function pickHeaviestAxisLevel(composition: DeckComposition): DeckAxisLevels {
  return {
    risk: heaviestLevel(composition.risk),
    intimacy: heaviestLevel(composition.intimacy),
    chaos: heaviestLevel(composition.chaos),
  };
}

function heaviestLevel(counts: {
  low: number;
  medium: number;
  high: number;
}): "low" | "medium" | "high" {
  if (counts.high >= counts.medium && counts.high >= counts.low) return "high";
  if (counts.medium >= counts.low) return "medium";
  return "low";
}
