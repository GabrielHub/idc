import { AnimatePresence, motion } from "motion/react";

import { DECK_SIZE_MAX } from "../../domain/game";
import type { FlythroughLayer, RosterSubview, ViewMode } from "./types";
import type { CathedralMode } from "./cathedral";
import type { DeckAxisLevels } from "./deck-composition";

type DeckBookShards = {
  slotCount: number;
  slotTone: "rose" | "neutral";
  spend: number;
  budgetCap: number;
  budgetTone: "rose" | "neutral";
  axes: DeckAxisLevels;
  pressure?: { lowPressure: number; highPressure: number };
};

export function ContextualPillRail({
  scenarioMode,
  bookingLocked,
  deckRepairBlocked,
  currentLayer,
  rosterSubview,
  filterActive,
  deckBookShards,
  reselectMode,
  canReselect,
  viewMode,
  archiveEdgeCount,
  archiveSelectionActive,
  onToggleDateBook,
  onOpenLens,
  onToggleReselect,
  onRosterSubviewChange,
  onToggleArchive,
  onClearArchiveSelection,
}: {
  scenarioMode: CathedralMode;
  bookingLocked: boolean;
  deckRepairBlocked: boolean;
  currentLayer: FlythroughLayer;
  rosterSubview: RosterSubview;
  filterActive: boolean;
  deckBookShards: DeckBookShards;
  reselectMode: boolean;
  canReselect: boolean;
  viewMode: ViewMode;
  archiveEdgeCount: number;
  archiveSelectionActive: boolean;
  onToggleDateBook: () => void;
  onOpenLens: () => void;
  onToggleReselect: () => void;
  onRosterSubviewChange: (next: RosterSubview) => void;
  onToggleArchive: () => void;
  onClearArchiveSelection: (() => void) | undefined;
}) {
  const inArchive = viewMode === "archive";
  const dateBookActive = !inArchive && scenarioMode !== "auto";
  const showDeckShards = !inArchive && (scenarioMode === "deck" || scenarioMode === "library");
  const showRosterPills = !inArchive && currentLayer === 1;

  const dateBookLabel =
    scenarioMode === "deck"
      ? "Date book · deck"
      : scenarioMode === "library"
        ? "Date book · library"
        : "Date book";
  const dateBookTone = dateBookActive
    ? "aura-liquid-glass-rose"
    : deckRepairBlocked
      ? "aura-liquid-glass-amber"
      : "";

  const archiveLabel = inArchive
    ? archiveEdgeCount === 0
      ? "Pairs · empty"
      : `Pairs · ${archiveEdgeCount}`
    : "Pairs";
  const archiveTone = inArchive ? "aura-liquid-glass-violet" : "";

  return (
    <div className="pointer-events-none absolute right-6 top-5 z-30 flex flex-col items-end gap-2">
      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onToggleArchive}
          aria-label={archiveLabel}
          aria-pressed={inArchive}
          className={`cursor-pointer aura-liquid-glass aura-liquid-glass-hover ${archiveTone} rounded-full px-3.5 py-1.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper`}
        >
          {archiveLabel}
        </button>
        {inArchive && archiveSelectionActive && onClearArchiveSelection !== undefined ? (
          <button
            type="button"
            onClick={onClearArchiveSelection}
            aria-label="Clear archive selection"
            className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3.5 py-1.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper"
          >
            Clear focus
          </button>
        ) : null}
        {inArchive ? null : (
          <button
            type="button"
            onClick={onToggleDateBook}
            disabled={bookingLocked}
            aria-label={dateBookLabel}
            className={`cursor-pointer aura-liquid-glass aura-liquid-glass-hover ${dateBookTone} rounded-full px-3.5 py-1.5 font-mono uppercase tracking-[0.18em] text-aura-paper text-micro disabled:cursor-not-allowed disabled:opacity-55`}
          >
            {dateBookLabel}
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {showDeckShards ? (
          <motion.div
            key="deck-shards"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto flex flex-wrap items-center justify-end gap-2"
          >
            <PillShard
              eyebrow="slots"
              value={`${deckBookShards.slotCount} / ${DECK_SIZE_MAX}`}
              tone={deckBookShards.slotTone}
            />
            <PillShard
              eyebrow="budget"
              value={`${deckBookShards.spend} / ${deckBookShards.budgetCap}`}
              tone={deckBookShards.budgetTone}
            />
            <AxesPill axes={deckBookShards.axes} />
            {deckBookShards.pressure === undefined ? null : (
              <PressurePill pressure={deckBookShards.pressure} />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {showRosterPills ? (
          <motion.div
            key="roster-pills"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto flex flex-wrap items-center justify-end gap-2"
          >
            <RosterSubviewToggle subview={rosterSubview} onChange={onRosterSubviewChange} />
            <button
              type="button"
              onClick={onOpenLens}
              className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3.5 py-1.5 font-mono uppercase tracking-[0.18em] text-aura-paper text-micro"
              aria-label="Open roster lens"
            >
              Lens · {filterActive ? "active" : "all"}
            </button>
            {canReselect ? (
              <button
                type="button"
                onClick={onToggleReselect}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 font-mono uppercase tracking-[0.18em] text-aura-paper text-micro ${
                  reselectMode
                    ? "aura-liquid-glass aura-liquid-glass-rose"
                    : "aura-liquid-glass aura-liquid-glass-hover"
                }`}
                aria-label={reselectMode ? "Cancel reselect" : "Reselect focus rack"}
              >
                {reselectMode ? "Cancel reselect" : "Reselect leads"}
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PillShard({
  eyebrow,
  value,
  tone,
}: {
  eyebrow: string;
  value: string;
  tone: "rose" | "neutral";
}) {
  const toneClass = tone === "rose" ? "aura-liquid-glass-rose" : "";
  const valueClass = tone === "rose" ? "text-aura-rose" : "text-aura-paper";
  return (
    <div className={`aura-liquid-glass ${toneClass} rounded-full px-3 py-1 leading-tight`}>
      <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
        {eyebrow}
      </span>
      <span className={`ml-1.5 font-display text-label ${valueClass}`}>{value}</span>
    </div>
  );
}

function AxesPill({ axes }: { axes: DeckAxisLevels }) {
  return (
    <div className="aura-liquid-glass rounded-full px-3 py-1 leading-tight flex items-center gap-1.5">
      <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">axes</span>
      <AxisDot label="R" level={axes.risk} />
      <AxisDot label="I" level={axes.intimacy} />
      <AxisDot label="C" level={axes.chaos} />
    </div>
  );
}

function AxisDot({ label, level }: { label: string; level: "low" | "medium" | "high" }) {
  const dot =
    level === "high" ? "bg-aura-rose" : level === "medium" ? "bg-aura-amber" : "bg-aura-emerald";
  const text =
    level === "high"
      ? "text-aura-rose"
      : level === "medium"
        ? "text-aura-amber"
        : "text-aura-emerald";
  return (
    <span className={`inline-flex items-center gap-1 font-display text-label ${text}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      <span>{label}</span>
    </span>
  );
}

function PressurePill({ pressure }: { pressure: { lowPressure: number; highPressure: number } }) {
  return (
    <div className="aura-liquid-glass rounded-full px-3 py-1 leading-tight">
      <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
        pressure
      </span>
      <span className="ml-1.5 font-display text-label text-aura-paper">
        {pressure.lowPressure} <span className="text-white/45">low</span> · {pressure.highPressure}{" "}
        <span className="text-white/45">high</span>
      </span>
    </div>
  );
}

function RosterSubviewToggle({
  subview,
  onChange,
}: {
  subview: RosterSubview;
  onChange: (next: RosterSubview) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Roster subview"
      className="aura-liquid-glass rounded-full p-1 flex items-center gap-1"
    >
      <button
        type="button"
        onClick={() => onChange("eligibles")}
        className={`cursor-pointer rounded-full px-3 py-0.5 font-mono text-micro uppercase tracking-[0.18em] transition ${
          subview === "eligibles"
            ? "aura-liquid-glass-rose text-aura-paper"
            : "text-white/65 hover:text-aura-paper"
        }`}
        aria-pressed={subview === "eligibles"}
      >
        Eligibles
      </button>
      <button
        type="button"
        onClick={() => onChange("off_tonight")}
        className={`cursor-pointer rounded-full px-3 py-0.5 font-mono text-micro uppercase tracking-[0.18em] transition ${
          subview === "off_tonight"
            ? "aura-liquid-glass-rose text-aura-paper"
            : "text-white/65 hover:text-aura-paper"
        }`}
        aria-pressed={subview === "off_tonight"}
      >
        Off tonight
      </button>
    </div>
  );
}
