import type { DateScenario } from "../../domain/game";
import type { DeckAxisLevels } from "./deck-composition";
import type { LobbyScenario } from "./types";

export type DeckBookShards = {
  slotCount: number;
  slotTone: "rose" | "neutral";
  spend: number;
  budgetCap: number;
  budgetTone: "rose" | "neutral";
  axes: DeckAxisLevels;
  pressure?: { lowPressure: number; highPressure: number };
};

export type CathedralMode = "auto" | "deck" | "library";

type DoorKind = "deck" | "library" | "draw";

export type DoorEntry = {
  scenario: LobbyScenario;
  kind: DoorKind;
  slotLabel?: string;
  disabled?: boolean;
  alreadyInDeck?: boolean;
};

export type RiskFilter = "any" | "low" | "medium" | "high";
export type SortMode = "alpha" | "risk" | "intimacy" | "chaos" | "cost";

export type LibraryFilterControls = {
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  onSearchChange: (next: string) => void;
  onRiskFilterChange: (next: RiskFilter) => void;
  onSortChange: (next: SortMode) => void;
};

export type RoomReadTint = {
  strip: string;
  pill: string;
  eyebrow: string;
  fallbackBg: string;
  innerGlow: string;
  jambGlow: string;
};

export type CathedralDetailScenario = DateScenario;
