import { useMemo, useState } from "react";

import type { DateScenario, GameSave } from "../domain/game";
import { SCENARIO_DECK_RETIREMENT_SHIFTS } from "../domain/game";
import { listLibraryCards, softComposeWarnings } from "../services/deck";
import { GhostButton, Hairline, PrimaryButton } from "./dashboard-atoms";
import { ScenarioCard } from "./scenario-card";

export type CasebookCanvasProps = {
  save: GameSave;
  currentShift: number;
  scenarios: DateScenario[];
  isActionPending: boolean;
  onPickLibrary: (libraryCardId: string) => void;
  onSwap: (deckCardId: string, libraryCardId: string) => void;
  onBack: () => void;
};

type Selection =
  | { kind: "none" }
  | { kind: "deck"; cardId: string }
  | { kind: "library"; cardId: string };

export function CasebookCanvas({
  save,
  currentShift,
  scenarios,
  isActionPending,
  onPickLibrary,
  onSwap,
  onBack,
}: CasebookCanvasProps) {
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [showRetired, setShowRetired] = useState(false);

  const pendingLibraryPick = save.scenarioDeck.pendingLibraryPick;
  const scenarioById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario])),
    [scenarios],
  );
  const deckScenarios = save.scenarioDeck.cardIds.map((id) => scenarioById.get(id));
  const library = useMemo(() => listLibraryCards(save, scenarios), [save, scenarios]);
  const visibleLibrary = library.filter((entry) => {
    if (entry.availableOnShift !== null && entry.availableOnShift > currentShift) {
      return showRetired;
    }
    return true;
  });
  const warnings = useMemo(
    () => softComposeWarnings(save.scenarioDeck, scenarios),
    [save.scenarioDeck, scenarios],
  );

  function handleDeckClick(cardId: string) {
    if (pendingLibraryPick !== undefined) return;
    if (selection.kind === "library") {
      onSwap(cardId, selection.cardId);
      setSelection({ kind: "none" });
      return;
    }
    if (selection.kind === "deck" && selection.cardId === cardId) {
      setSelection({ kind: "none" });
      return;
    }
    setSelection({ kind: "deck", cardId });
  }

  function handleLibraryClick(libraryEntry: {
    scenarioId: string;
    availableOnShift: number | null;
  }) {
    if (libraryEntry.availableOnShift !== null && libraryEntry.availableOnShift > currentShift) {
      return;
    }
    if (pendingLibraryPick !== undefined) {
      onPickLibrary(libraryEntry.scenarioId);
      setSelection({ kind: "none" });
      return;
    }
    if (selection.kind === "deck") {
      onSwap(selection.cardId, libraryEntry.scenarioId);
      setSelection({ kind: "none" });
      return;
    }
    if (selection.kind === "library" && selection.cardId === libraryEntry.scenarioId) {
      setSelection({ kind: "none" });
      return;
    }
    setSelection({ kind: "library", cardId: libraryEntry.scenarioId });
  }

  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 pb-32 pt-12 lg:px-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
            // casebook.deck
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-aura-ink lg:text-4xl">
            Filing cabinet
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            Twelve cards face up. Voluntary swaps retire the dropped card for{" "}
            {SCENARIO_DECK_RETIREMENT_SHIFTS} shifts.
          </p>
        </div>
        <GhostButton onClick={onBack}>← Back to office</GhostButton>
      </header>

      {pendingLibraryPick !== undefined ? (
        <div className="mb-6 rounded-2xl border border-aura-rose/40 bg-aura-rose/5 px-4 py-3 text-sm text-aura-rose">
          Pending library pick: a slot opened after you played{" "}
          <strong>
            {scenarioById.get(pendingLibraryPick.playedCardId)?.title ??
              pendingLibraryPick.playedCardId}
          </strong>
          . Choose any library card. No retirement penalty.
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="mb-6 space-y-1 text-xs text-aura-muted">
          {warnings.map((warning) => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      ) : null}

      <Hairline />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
            Active deck ({save.scenarioDeck.cardIds.length})
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {deckScenarios.map((scenario, index) => {
              const cardId = save.scenarioDeck.cardIds[index];
              if (scenario === undefined || cardId === undefined) return null;
              const isSelected = selection.kind === "deck" && selection.cardId === cardId;
              return (
                <li key={cardId}>
                  <ScenarioCard
                    scenario={scenario}
                    state={isSelected ? "selected" : "default"}
                    onClick={() => handleDeckClick(cardId)}
                  />
                </li>
              );
            })}
            {pendingLibraryPick !== undefined ? (
              <li>
                <div className="grid h-full place-items-center rounded-2xl border-2 border-dashed border-aura-rose/40 bg-white/40 p-6 text-center font-mono text-xs uppercase tracking-[0.24em] text-aura-rose">
                  open slot. pick from library
                </div>
              </li>
            ) : null}
          </ul>
        </section>

        <aside>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
              Library drawer
            </h2>
            <button
              type="button"
              data-sfx="click"
              onClick={() => setShowRetired((value) => !value)}
              className="cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/30"
            >
              {showRetired ? "Hide retired" : "Show retired"}
            </button>
          </div>
          <p className="mt-1 text-xs text-aura-muted">
            {selection.kind === "deck" && pendingLibraryPick === undefined
              ? "Pick the scenario to swap in. The dropped card retires."
              : "Pick a library scenario to slot it in."}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {visibleLibrary.map((entry) => {
              const scenario = scenarioById.get(entry.scenarioId);
              if (scenario === undefined) return null;
              const isRetired =
                entry.availableOnShift !== null && entry.availableOnShift > currentShift;
              const isSelected =
                selection.kind === "library" && selection.cardId === entry.scenarioId;
              return (
                <li key={entry.scenarioId}>
                  <ScenarioCard
                    scenario={scenario}
                    state={isRetired ? "retired" : isSelected ? "selected" : "default"}
                    availableOnShift={entry.availableOnShift}
                    currentShift={currentShift}
                    onClick={() => handleLibraryClick(entry)}
                  />
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {selection.kind === "deck" && pendingLibraryPick === undefined ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
          <div className="aura-glass-strong pointer-events-auto flex items-center gap-4 rounded-pill px-5 py-3 shadow-aura-soft">
            <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
              dropping{" "}
              <strong className="text-aura-ink">
                {scenarioById.get(selection.cardId)?.title ?? selection.cardId}
              </strong>
              . Pick a library card.
            </p>
            <GhostButton onClick={() => setSelection({ kind: "none" })}>Cancel</GhostButton>
          </div>
        </div>
      ) : null}

      {selection.kind === "library" && pendingLibraryPick === undefined ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
          <div className="aura-glass-strong pointer-events-auto flex items-center gap-4 rounded-pill px-5 py-3 shadow-aura-soft">
            <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
              swap in{" "}
              <strong className="text-aura-ink">
                {scenarioById.get(selection.cardId)?.title ?? selection.cardId}
              </strong>
              . Pick a deck card to drop.
            </p>
            <GhostButton onClick={() => setSelection({ kind: "none" })}>Cancel</GhostButton>
          </div>
        </div>
      ) : null}

      {pendingLibraryPick === undefined && selection.kind !== "none" ? (
        <p className="mt-6 text-center text-xs text-aura-muted">
          Voluntary swaps retire the dropped card for {SCENARIO_DECK_RETIREMENT_SHIFTS} shifts.
        </p>
      ) : null}

      {isActionPending ? (
        <p className="mt-4 text-center font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          filing change...
        </p>
      ) : null}
      <PrimaryButton onClick={onBack}>Close cabinet</PrimaryButton>
    </section>
  );
}
