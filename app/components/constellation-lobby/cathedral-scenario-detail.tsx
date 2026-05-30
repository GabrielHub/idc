import { DECK_SIZE_MIN, type DateScenario } from "../../domain/game";
import { AuraButton } from "../aura-button";
import { CathedralDetailOverlay, type CathedralMode } from "./cathedral";

export function CathedralScenarioDetail({
  scenario,
  mode,
  effectiveCosts,
  bookingLocked,
  isActionPending,
  deckCardCount,
  onRemoveDeckCard,
  onClose,
}: {
  scenario: DateScenario | null;
  mode: CathedralMode;
  effectiveCosts: Readonly<Record<string, number>>;
  bookingLocked: boolean;
  isActionPending: boolean;
  deckCardCount: number;
  onRemoveDeckCard: (cardId: string) => void;
  onClose: () => void;
}) {
  if (scenario === null) return null;
  const detail = buildDetail({
    scenario,
    mode,
    effectiveCosts,
    bookingLocked,
    isActionPending,
    deckCardCount,
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
  effectiveCosts,
  bookingLocked,
  isActionPending,
  deckCardCount,
  onRemoveDeckCard,
  onClose,
}: {
  scenario: DateScenario;
  mode: CathedralMode;
  effectiveCosts: Readonly<Record<string, number>>;
  bookingLocked: boolean;
  isActionPending: boolean;
  deckCardCount: number;
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
  const atMinDeck = deckCardCount <= DECK_SIZE_MIN;
  const dropBlockedReason =
    bookingLocked || isActionPending
      ? "Date Book edits are locked while Cupid is working"
      : atMinDeck
        ? `Date Book needs ${DECK_SIZE_MIN} room cards. Draw new room cards before dropping.`
        : undefined;
  const dropDisabled = dropBlockedReason !== undefined;
  return {
    eyebrow: "// room card",
    cta: (
      <AuraButton
        tooltip={dropBlockedReason ?? `Drop room card and refund ${effective}`}
        onClick={() => {
          onRemoveDeckCard(scenario.id);
          onClose();
        }}
        disabled={dropDisabled}
        className="cursor-pointer disabled:cursor-not-allowed aura-liquid-cta rounded-full px-5 py-2 font-display text-label disabled:opacity-55"
      >
        Drop room card · refund {effective}
      </AuraButton>
    ),
    note: bookingLocked
      ? "booking active · Date Book locked until the date resolves"
      : atMinDeck
        ? `Date Book at ${DECK_SIZE_MIN}-room minimum · draw new room cards before dropping`
        : undefined,
    effectiveCost: effective,
  };
}
