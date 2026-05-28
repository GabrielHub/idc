import { DECK_SIZE_MAX, type DateScenario, type GameSave } from "../../domain/game";
import { canAddToDeck } from "../../services/budget";
import { AuraButton } from "../aura-button";
import { CathedralDetailOverlay, type CathedralMode } from "./cathedral";

export function CathedralScenarioDetail({
  scenario,
  mode,
  save,
  effectiveCosts,
  bookingLocked,
  isActionPending,
  onAddDeckCard,
  onRemoveDeckCard,
  onClose,
}: {
  scenario: DateScenario | null;
  mode: CathedralMode;
  save: GameSave;
  effectiveCosts: Readonly<Record<string, number>>;
  bookingLocked: boolean;
  isActionPending: boolean;
  onAddDeckCard: (cardId: string) => void;
  onRemoveDeckCard: (cardId: string) => void;
  onClose: () => void;
}) {
  if (scenario === null) return null;
  const detail = buildDetail({
    scenario,
    mode,
    save,
    effectiveCosts,
    bookingLocked,
    isActionPending,
    onAddDeckCard,
    onRemoveDeckCard,
    onClose,
  });
  if (detail === null) return null;
  return (
    <CathedralDetailOverlay
      open={true}
      scenario={scenario}
      cost={detail.effectiveCost}
      eyebrow={detail.eyebrow}
      cta={detail.cta}
      note={detail.note}
      onClose={onClose}
    />
  );
}

function buildDetail({
  scenario,
  mode,
  save,
  effectiveCosts,
  bookingLocked,
  isActionPending,
  onAddDeckCard,
  onRemoveDeckCard,
  onClose,
}: {
  scenario: DateScenario;
  mode: CathedralMode;
  save: GameSave;
  effectiveCosts: Readonly<Record<string, number>>;
  bookingLocked: boolean;
  isActionPending: boolean;
  onAddDeckCard: (cardId: string) => void;
  onRemoveDeckCard: (cardId: string) => void;
  onClose: () => void;
}) {
  const effective = effectiveCosts[scenario.id] ?? scenario.card.cost;
  if (mode === "auto") {
    // Auto mode is the "tonight's draw" picker: clicking the card body locks
    // the scenario for the BottomDock Begin button. The detail overlay opens
    // from the lintel peek glyph as a read-only brief — no CTA, because the
    // selection action belongs to the card body, not this surface.
    return {
      eyebrow: "// tonight's draw",
      cta: null,
      note: undefined,
      effectiveCost: effective,
    };
  }
  if (mode === "deck") {
    const dropDisabled = bookingLocked || isActionPending;
    return {
      eyebrow: "// deck slot",
      cta: (
        <AuraButton
          tooltip={
            dropDisabled
              ? "Deck edits are locked while Cupid is working"
              : `Drop card and refund ${effective}`
          }
          onClick={() => {
            onRemoveDeckCard(scenario.id);
            onClose();
          }}
          disabled={dropDisabled}
          className="cursor-pointer disabled:cursor-not-allowed aura-liquid-cta rounded-full px-5 py-2 font-display text-label disabled:opacity-55"
        >
          Drop card · refund {effective}
        </AuraButton>
      ),
      note: bookingLocked ? "booking active · edits locked until the date resolves" : undefined,
      effectiveCost: effective,
    };
  }
  if (mode !== "library") return null;
  const inDeck = save.scenarioDeck.cardIds.includes(scenario.id);
  const deckFull = save.scenarioDeck.cardIds.length >= DECK_SIZE_MAX;
  const add = canAddToDeck({
    cardId: scenario.id,
    cardIds: save.scenarioDeck.cardIds,
    effectiveCosts,
    budgetCap: save.budgetCap,
  });
  const canAddNow = add.ok && !inDeck && !deckFull;
  const reason = inDeck
    ? "Already in deck."
    : deckFull
      ? "Deck is at the slot cap. Drop a card first."
      : !add.ok && add.reason === "over_budget"
        ? "Adding this card would exceed remaining budget."
        : undefined;
  const addDisabled = !canAddNow || isActionPending || bookingLocked;
  return {
    eyebrow: "// library card",
    cta: (
      <AuraButton
        tooltip={reason ?? `Add to deck and spend ${effective}`}
        onClick={() => {
          onAddDeckCard(scenario.id);
          onClose();
        }}
        disabled={addDisabled}
        className="cursor-pointer disabled:cursor-not-allowed aura-liquid-cta rounded-full px-5 py-2 font-display text-label disabled:opacity-55"
      >
        Add to deck · spend {effective}
      </AuraButton>
    ),
    note: reason,
    effectiveCost: effective,
  };
}
