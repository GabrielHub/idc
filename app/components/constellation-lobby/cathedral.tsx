/**
 * Cathedral HUD overlays for the constellation lobby's date-book layer.
 *
 * The cathedral used to render as a 3D nave with stained-glass doors lining
 * an aisle inside the R3F canvas. That treatment ate the canvas, fought the
 * background glow, and the Drei `Text` labels lost legibility at the back
 * of the nave. The redesign keeps the cathedral metaphor (a focused room
 * where the player picks tonight's scenario) but renders the card grid as
 * a flat HTML overlay built from the Aura liquid-glass language — real
 * webfonts, jewel-tone room-read tints, proper hierarchy.
 *
 * Exports:
 *   - `CathedralPanel` — DOM overlay that mounts when the player is on
 *     `FlythroughLayer === 2`. Owns the card grid plus the per-mode header,
 *     which carries the title, deck telemetry pills, the date-book close
 *     button, and (in library mode) the search + risk + sort filter row.
 *     Strictly gated by the lobby on `currentLayer === 2` so the panel never
 *     bleeds into the member layers.
 *   - `CathedralDetailOverlay` — the per-card detail card mounted when a
 *     deck/library door is opened. Hosts the mode-specific CTA the lobby
 *     wires in (Drop / Add).
 *
 * The cathedral has no booking state of its own — the lobby builds a single
 * `doors` array, tags each entry with its mode-specific role, and routes the
 * click target back up.
 */

import { useEffect, useState, type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";

import { DECK_SIZE_MAX } from "../../domain/game";
import { loadScenarioBackdropIds, scenarioBackdropPath } from "../scenario-backdrop";
import type { DeckAxisLevels } from "./deck-composition";
import type { LobbyScenario } from "./types";

/**
 * Aggregate deck telemetry the lobby hands to the cathedral header in
 * deck / library mode. Lives here (not in the pill rail) because the header
 * is where the player reads it — pulling it out of the top-right floating
 * cluster keeps the centered cathedral visual as the single point of focus.
 */
export type DeckBookShards = {
  slotCount: number;
  slotTone: "rose" | "neutral";
  spend: number;
  budgetCap: number;
  budgetTone: "rose" | "neutral";
  axes: DeckAxisLevels;
  pressure?: { lowPressure: number; highPressure: number };
};

/**
 * The state machine the lobby is in when the cathedral is mounted. Drives
 * the card eyebrow + which CTA the detail overlay surfaces.
 */
export type CathedralMode = "auto" | "deck" | "library";

/**
 * One card in the cathedral grid. The lobby builds these from its deck +
 * library + draw state; the cathedral renders them in order.
 *
 * - `kind="deck"` → currently in the player's deck; detail overlay shows Drop.
 * - `kind="library"` → unlocked but not in the deck; detail overlay shows Add.
 * - `kind="draw"` → tonight's drawn scenarios for the committed pair; the
 *   click flow routes through `selectedScenarioId` (BottomDock Begin date).
 */
type DoorKind = "deck" | "library" | "draw";

export type DoorEntry = {
  scenario: LobbyScenario;
  kind: DoorKind;
  /** Slot index (1-based) for deck cards; absent for library / draw. */
  slotLabel?: string;
  /** When true, the card reads as gated — dim, striped, no pointer cursor. */
  disabled?: boolean;
  /** When true (library), the scenario is already in the deck. */
  alreadyInDeck?: boolean;
};

export type RiskFilter = "any" | "low" | "medium" | "high";
export type SortMode = "alpha" | "risk" | "intimacy" | "chaos" | "cost";

/**
 * Library-mode filter controls bundled as one prop. The lobby passes this
 * exactly when `mode === "library"`; the cathedral renders the filter row
 * whenever it's present and otherwise hides it.
 */
export type LibraryFilterControls = {
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  onSearchChange: (next: string) => void;
  onRiskFilterChange: (next: RiskFilter) => void;
  onSortChange: (next: SortMode) => void;
};

/* ============================================================================
 * CathedralPanel — the 2D card overlay.
 * ========================================================================== */

export function CathedralPanel({
  open,
  mode,
  doors,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onOpenDetail,
  onClose,
  reducedMotion,
  containerRef,
  deckBookShards,
  libraryFilter,
}: {
  /** When false, the panel unmounts entirely so the canvas reads cleanly. */
  open: boolean;
  mode: CathedralMode;
  doors: DoorEntry[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  /**
   * Open the per-card detail overlay without firing the primary select
   * action. Drives the doorway "peek" affordance (info glyph in the lintel)
   * so the body click can stay on its mode-specific job (select for auto,
   * open detail for deck/library) while the player still has a read-only
   * peek path in every mode.
   */
  onOpenDetail: (id: string) => void;
  /**
   * Close the date book — returns the panel to auto mode (tonight's draw).
   * Surface only in deck / library; auto mode is the cathedral's natural
   * resting state and doesn't need a close affordance.
   */
  onClose?: () => void;
  reducedMotion: boolean;
  containerRef?: Ref<HTMLDivElement>;
  /** Deck telemetry rendered into the header in deck / library mode. */
  deckBookShards?: DeckBookShards;
  /**
   * Library filter state. Passed only in library mode; when present the
   * cathedral renders a filter row inside the panel header. Used to live in
   * a separate floating CathedralFilterRail that stacked above the panel;
   * merged in so the date book reads as one unified card.
   */
  libraryFilter?: LibraryFilterControls;
}) {
  const enterDuration = reducedMotion ? 0.001 : 0.36;
  const filterRow = libraryFilter === undefined ? null : <CathedralFilterRow {...libraryFilter} />;
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cathedral-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: enterDuration, ease: [0.22, 0.8, 0.2, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-[124px] top-24 z-20 px-6"
        >
          <div
            ref={containerRef}
            className="pointer-events-auto mx-auto flex h-full max-w-[1180px] flex-col"
          >
            <CathedralHeader
              mode={mode}
              doorCount={doors.length}
              deckBookShards={deckBookShards}
              onClose={onClose}
              filterRow={filterRow}
            />
            <div className="cathedral-scroll mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              {doors.length === 0 ? (
                <CathedralEmptyState mode={mode} />
              ) : (
                <CathedralGrid
                  doors={doors}
                  mode={mode}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onHover={onHover}
                  onSelect={onSelect}
                  onOpenDetail={onOpenDetail}
                  reducedMotion={reducedMotion}
                />
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CathedralHeader({
  mode,
  doorCount,
  deckBookShards,
  onClose,
  filterRow,
}: {
  mode: CathedralMode;
  doorCount: number;
  deckBookShards?: DeckBookShards;
  onClose?: () => void;
  filterRow?: ReactNode;
}) {
  const title =
    mode === "auto" ? "Tonight's draw" : mode === "deck" ? "Deck composition" : "Scenario library";
  const subtitle =
    mode === "auto"
      ? "Pick the scenario that leads the pair tonight."
      : mode === "deck"
        ? "Tap a card to drop it from the deck."
        : "Tap a card to add it to the deck.";
  const counter =
    mode === "auto"
      ? `${doorCount} drawn`
      : mode === "deck"
        ? `${doorCount} ${doorCount === 1 ? "card" : "cards"} staged`
        : `${doorCount} ${doorCount === 1 ? "match" : "matches"}`;
  // Shards encode the deck count via the slots pill, so the bare counter is
  // redundant once they're present. Auto mode never shows shards and falls
  // back to the counter inline with the eyebrow.
  const showShards = deckBookShards !== undefined;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose/80">
            // cathedral · <span className="text-white/55">{counter}</span>
          </div>
          <h2 className="mt-1 font-display text-display-md leading-none text-aura-paper">
            {title}
          </h2>
          <p className="mt-2 font-sans text-label text-white/65">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {onClose === undefined ? null : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close date book"
              className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3.5 py-1.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper"
            >
              ← Close
            </button>
          )}
          {showShards ? <DeckShardsRow shards={deckBookShards} /> : null}
        </div>
      </div>
      {filterRow}
    </div>
  );
}

/* ============================================================================
 * DeckShardsRow — deck telemetry pills (slots / budget / axes / pressure)
 * rendered inside the cathedral header in deck and library modes. Used to
 * live as a floating cluster in the top-right; pulled inline so the centered
 * cathedral visual carries the information instead of overlay chrome.
 * ========================================================================== */

function DeckShardsRow({ shards }: { shards: DeckBookShards }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <PillShard
        eyebrow="slots"
        value={`${shards.slotCount} / ${DECK_SIZE_MAX}`}
        tone={shards.slotTone}
      />
      <PillShard
        eyebrow="budget"
        value={`${shards.spend} / ${shards.budgetCap}`}
        tone={shards.budgetTone}
      />
      <AxesPill axes={shards.axes} />
      {shards.pressure === undefined ? null : <PressurePill pressure={shards.pressure} />}
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

function CathedralEmptyState({ mode }: { mode: CathedralMode }) {
  const copy =
    mode === "deck"
      ? "Deck is empty — open the library to add cards."
      : mode === "library"
        ? "No library cards match this filter."
        : "Pair a focus + partner to draw tonight's scenarios.";
  return (
    <div className="flex h-full items-center justify-center">
      <div className="aura-liquid-glass aura-liquid-glass-ink rounded-card px-6 py-5 text-center">
        <div className="font-mono text-micro uppercase tracking-[0.28em] text-white/55">
          // cathedral empty
        </div>
        <p className="mt-2 font-sans text-label text-aura-paper/85">{copy}</p>
      </div>
    </div>
  );
}

function CathedralGrid({
  doors,
  mode,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onOpenDetail,
  reducedMotion,
}: {
  doors: DoorEntry[];
  mode: CathedralMode;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  reducedMotion: boolean;
}) {
  // Cards are portrait/doorway-shaped now. Library can still run long — pack
  // 4 columns on wide screens so the row scans broadly; auto + deck stay at 3
  // so each doorway has presence and the threshold plaque has room to read.
  const cols = mode === "library" ? "lg:grid-cols-4 md:grid-cols-3" : "md:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cols}`}>
      {doors.map((entry, idx) => (
        <CathedralCard
          key={entry.scenario.id}
          entry={entry}
          mode={mode}
          selected={selectedId === entry.scenario.id}
          hovered={hoveredId === entry.scenario.id}
          onSelect={() => onSelect(entry.scenario.id)}
          onOpenDetail={() => onOpenDetail(entry.scenario.id)}
          onHoverEnter={() => onHover(entry.scenario.id)}
          onHoverLeave={() => onHover(null)}
          indexDelay={reducedMotion ? 0 : Math.min(idx, 11) * 0.02}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

/* ============================================================================
 * CathedralCard — one scenario card, rendered as a doorway into the scene.
 *
 * Layout (front → back, top → bottom):
 *
 *   ┌─────────────────────────────────┐ ← top lintel (frosted, dark)
 *   │ SLOT 1     [in deck] $3   [ i ] │
 *   ├─────────────────────────────────┤
 *   │ ║                             ║ │
 *   │ ║   scenario backdrop image    ║│ ← the view through the threshold,
 *   │ ║   (blurred + saturated;      ║│   blurred so titles stay legible
 *   │ ║   procedural gradient when   ║│
 *   │ ║   the manifest hasn't        ║│
 *   │ ║   approved one yet)          ║│
 *   │ ║                             ║ │
 *   ├─────────────────────────────────┤ ← threshold plaque (frosted)
 *   │ DMV, A Number Ticket            │
 *   │ ROW C, THE WAITING AREA AT...   │
 *   │ R ▮▮▯  W ▮▯▯  C ▮▯▯     STEADY │
 *   └─────────────────────────────────┘
 *
 * The left and right edges carry 2px room-read-tinted strips — the door
 * jambs — that bloom inward on hover so the card reads as "stepping
 * through" rather than "tapping a tile".
 *
 * Click model:
 *   - Body click → onSelect (mode-specific: auto = lock for tonight,
 *     deck/library = open detail with the Drop/Add CTA).
 *   - Info glyph in the lintel → onOpenDetail (always a read-only peek into
 *     the detail overlay, including auto mode where the body click would
 *     otherwise lock the scenario immediately).
 * ========================================================================== */

function CathedralCard({
  entry,
  mode,
  selected,
  hovered,
  onSelect,
  onOpenDetail,
  onHoverEnter,
  onHoverLeave,
  indexDelay,
  reducedMotion,
}: {
  entry: DoorEntry;
  mode: CathedralMode;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  indexDelay: number;
  reducedMotion: boolean;
}) {
  const tint = roomReadTint(entry.scenario.roomRead);
  const interactive = entry.disabled !== true;
  const tag = topTagFor(entry, mode);
  const enterDuration = reducedMotion ? 0.001 : 0.32;

  return (
    <motion.article
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: enterDuration, ease: [0.22, 0.8, 0.2, 1], delay: indexDelay }}
      whileHover={interactive && !reducedMotion ? { y: -3 } : undefined}
      className={`group/door relative flex aspect-[4/5] flex-col overflow-hidden rounded-card text-left transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70 ${interactive ? "cursor-pointer" : "cursor-not-allowed"} ${
        selected ? "shadow-cta ring-2 ring-aura-rose/85" : "ring-1 ring-white/10"
      } ${entry.disabled === true ? "opacity-45" : ""} ${
        entry.alreadyInDeck === true && !selected ? "opacity-80" : ""
      } ${hovered && !selected ? "ring-white/30" : ""}`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={!interactive}
        aria-label={`${entry.scenario.title} — ${entry.scenario.venue}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-card border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70 disabled:cursor-not-allowed"
      />

      <CardScenarioBackdrop
        scenarioId={entry.scenario.id}
        hovered={hovered}
        reducedMotion={reducedMotion}
        tint={tint}
      />

      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-10 h-full w-[2px] ${tint.strip} transition-[box-shadow,opacity] duration-300 ${
          hovered && !reducedMotion ? `opacity-100 ${tint.jambGlow}` : "opacity-90"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute right-0 top-0 z-10 h-full w-[2px] ${tint.strip} transition-[box-shadow,opacity] duration-300 ${
          hovered && !reducedMotion ? `opacity-100 ${tint.jambGlow}` : "opacity-90"
        }`}
      />

      <div className="pointer-events-none relative z-20 flex items-start justify-between gap-2 px-4 pt-3 pb-2">
        {tag ? (
          <span
            className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] ${tint.eyebrow}`}
          >
            {tag}
          </span>
        ) : (
          <span aria-hidden />
        )}
        <div className="flex items-center gap-2">
          {entry.alreadyInDeck === true ? (
            <span className="rounded-pill border border-aura-rose/45 bg-aura-rose/25 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-rose backdrop-blur-md">
              in deck
            </span>
          ) : null}
          <span className="font-display text-display-sm leading-none text-aura-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            ${entry.scenario.cost}
          </span>
          {interactive ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail();
              }}
              aria-label={`Open ${entry.scenario.title} details`}
              className="pointer-events-auto cursor-pointer rounded-full bg-white/15 p-1.5 text-aura-paper ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/25 hover:ring-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70"
            >
              <DoorPeekGlyph />
            </button>
          ) : null}
        </div>
      </div>

      {/* Middle is just the view through the door — flex spacer that lets the
       * backdrop image breathe between lintel and threshold. */}
      <div className="relative z-0 min-h-0 flex-1" />

      <div className="pointer-events-none relative z-20 mt-auto bg-[linear-gradient(180deg,rgba(7,4,26,0)_0%,rgba(7,4,26,0.6)_30%,rgba(7,4,26,0.92)_100%)] px-4 pb-3 pt-6 backdrop-blur-[2px]">
        <h3 className="font-display text-display-sm leading-tight text-aura-paper drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          {entry.scenario.title}
        </h3>
        <p className="mt-1 font-mono text-micro uppercase tracking-[0.16em] text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {entry.scenario.venue}
        </p>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <AxisMeter label="R" value={entry.scenario.axes.risk} kind="risk" />
            <AxisMeter label="W" value={entry.scenario.axes.intimacy} kind="warmth" />
            <AxisMeter label="C" value={entry.scenario.axes.chaos} kind="chaos" />
          </div>
          <span
            className={`inline-flex shrink-0 rounded-pill border px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] backdrop-blur-md ${tint.pill}`}
          >
            {entry.scenario.roomRead}
          </span>
        </div>
      </div>

      {entry.disabled === true ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_6px,transparent_6px_12px)]"
        />
      ) : null}
    </motion.article>
  );
}

/* ============================================================================
 * CardScenarioBackdrop — per-card image fill used as the "view through the
 * doorway". Reads the scenario asset manifest to know if an approved
 * background exists for this scenario id; falls back to a procedural,
 * room-read-tinted gradient when one hasn't shipped yet so cards still feel
 * like portals instead of empty plates.
 *
 * Kept inline in cathedral.tsx (not extracted to scenario-backdrop.tsx)
 * because the card variant is leaner than the full-page backdrop layer:
 * no particles, no pointer parallax, just a still image with a tasteful
 * blur and a hover scale. The full-page component does too much for a
 * 280-by-360 thumbnail.
 * ========================================================================== */

function CardScenarioBackdrop({
  scenarioId,
  hovered,
  reducedMotion,
  tint,
}: {
  scenarioId: string;
  hovered: boolean;
  reducedMotion: boolean;
  tint: RoomReadTint;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    void loadScenarioBackdropIds().then((ids) => {
      if (cancelled) return;
      setSrc(ids.has(scenarioId) ? scenarioBackdropPath(scenarioId) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  const hoverScale = hovered && !reducedMotion ? "scale-[1.045]" : "scale-100";

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {src === null ? (
        <span className={`absolute inset-0 ${tint.fallbackBg}`} />
      ) : (
        <img
          src={src}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setSrc(null)}
          className={`absolute inset-0 size-full object-cover blur-[3px] saturate-[1.15] contrast-[1.02] transition-[transform,opacity] duration-[600ms] ease-out ${hoverScale} ${loaded ? "opacity-95" : "opacity-0"}`}
        />
      )}
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(7,4,26,0)_0%,rgba(7,4,26,0.18)_55%,rgba(7,4,26,0.55)_100%)]" />
      <span
        className={`absolute inset-0 transition-opacity duration-300 ${
          hovered && !reducedMotion ? "opacity-100" : "opacity-0"
        } ${tint.innerGlow}`}
      />
    </span>
  );
}

function DoorPeekGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6.4" />
      <path d="M8 7.2v3.4" />
      <circle cx="8" cy="5.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AxisMeter({
  label,
  value,
  kind,
}: {
  label: string;
  value: number;
  kind: "risk" | "warmth" | "chaos";
}) {
  // `value` is 1/2/3 (low/medium/high) per `riskToNumber` in star-model.ts.
  // Render 3 segments so the meter mirrors the data exactly.
  const segments = 3;
  const filled = Math.max(0, Math.min(segments, Math.round(value)));
  const fillBg =
    kind === "risk" ? "bg-aura-rose" : kind === "warmth" ? "bg-aura-violet" : "bg-aura-amber";
  const fullName = kind === "risk" ? "Risk" : kind === "warmth" ? "Warmth" : "Chaos";
  const levelName = filled <= 1 ? "low" : filled === 2 ? "medium" : "high";
  const blurb =
    kind === "risk"
      ? "How likely the room is to skew the night — embarrassment, conflict, an exit."
      : kind === "warmth"
        ? "How intimately the table runs — eye contact, quiet stretches, lean-in beats."
        : "How chaotic the room is — interruptions, side characters, unexpected turns.";

  return (
    <div className="group/axis relative flex items-center gap-2">
      <span className="w-3 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-white/75">
        {label}
      </span>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-1.5 flex-1 rounded-full ${i < filled ? fillBg : "bg-white/15"}`}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-full left-0 z-40 mb-2 w-max max-w-[220px] -translate-y-0.5 opacity-0 transition-opacity duration-150 group-hover/axis:opacity-100">
        <div className="aura-liquid-glass aura-liquid-glass-ink rounded-card px-3 py-2 shadow-cta ring-1 ring-white/15">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/65">
            {fullName} · {levelName}
          </div>
          <p className="mt-1 font-sans text-label leading-snug text-aura-paper/90">{blurb}</p>
        </div>
      </div>
    </div>
  );
}

type RoomReadTint = {
  strip: string;
  pill: string;
  eyebrow: string;
  fallbackBg: string;
  innerGlow: string;
  jambGlow: string;
};

function roomReadTint(roomRead: LobbyScenario["roomRead"]): RoomReadTint {
  if (roomRead === "promising") {
    return {
      strip: "bg-aura-rose",
      pill: "bg-aura-rose/25 border-aura-rose/50 text-aura-rose",
      eyebrow: "text-aura-rose",
      fallbackBg:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(244,63,94,0.55)_0%,rgba(124,30,60,0.45)_55%,rgba(20,8,28,0.95)_100%)]",
      innerGlow:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(244,63,94,0.22)_0%,rgba(244,63,94,0)_60%)]",
      jambGlow: "shadow-[0_0_22px_rgba(244,63,94,0.7)]",
    };
  }
  if (roomRead === "volatile") {
    return {
      strip: "bg-aura-amber",
      pill: "bg-aura-amber/25 border-aura-amber/50 text-aura-amber",
      eyebrow: "text-aura-amber",
      fallbackBg:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(245,158,11,0.55)_0%,rgba(120,60,12,0.45)_55%,rgba(20,12,8,0.95)_100%)]",
      innerGlow:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(245,158,11,0.22)_0%,rgba(245,158,11,0)_60%)]",
      jambGlow: "shadow-[0_0_22px_rgba(245,158,11,0.7)]",
    };
  }
  return {
    strip: "bg-aura-emerald",
    pill: "bg-aura-emerald/25 border-aura-emerald/50 text-aura-emerald",
    eyebrow: "text-aura-emerald",
    fallbackBg:
      "bg-[radial-gradient(ellipse_at_50%_45%,rgba(16,185,129,0.45)_0%,rgba(10,60,46,0.5)_55%,rgba(8,16,20,0.95)_100%)]",
    innerGlow:
      "bg-[radial-gradient(ellipse_at_50%_45%,rgba(16,185,129,0.22)_0%,rgba(16,185,129,0)_60%)]",
    jambGlow: "shadow-[0_0_22px_rgba(16,185,129,0.7)]",
  };
}

function topTagFor(entry: DoorEntry, mode: CathedralMode): string {
  if (entry.kind === "deck") return entry.slotLabel ?? "deck slot";
  if (entry.kind === "draw") return mode === "auto" ? "" : "scenario";
  return "library";
}

/* ============================================================================
 * CathedralFilterRow — inline filter controls rendered inside the cathedral
 * panel header in library mode. Used to live as a separate floating rail
 * (CathedralFilterRail) above the panel; folded in so the date book reads
 * as one unified surface and the duplicate eyebrow + match counter drops.
 * Search + risk chips + sort chips, in that order.
 * ========================================================================== */

const RISK_FILTER_OPTIONS: ReadonlyArray<{ value: RiskFilter; label: string }> = [
  { value: "any", label: "Any" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

const SORT_OPTIONS: ReadonlyArray<{ value: SortMode; label: string }> = [
  { value: "alpha", label: "A→Z" },
  { value: "cost", label: "Cost" },
  { value: "risk", label: "Risk" },
  { value: "intimacy", label: "Warmth" },
  { value: "chaos", label: "Chaos" },
];

function CathedralFilterRow({
  search,
  riskFilter,
  sortMode,
  onSearchChange,
  onRiskFilterChange,
  onSortChange,
}: {
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  onSearchChange: (next: string) => void;
  onRiskFilterChange: (next: RiskFilter) => void;
  onSortChange: (next: SortMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search title or venue"
        className="aura-liquid-glass-ink cursor-text rounded-pill px-3.5 py-1.5 font-sans text-label text-aura-paper placeholder:font-mono placeholder:text-micro placeholder:uppercase placeholder:tracking-[0.18em] placeholder:text-white/45 focus:outline-none"
      />
      <FilterChipGroup
        label="Risk"
        value={riskFilter}
        options={RISK_FILTER_OPTIONS}
        onChange={onRiskFilterChange}
      />
      <FilterChipGroup
        label="Sort"
        value={sortMode}
        options={SORT_OPTIONS}
        onChange={onSortChange}
      />
    </div>
  );
}

function FilterChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-pill aura-liquid-glass aura-liquid-glass-ink px-1 py-0.5">
      <span className="px-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white/55">
        {label}
      </span>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] transition ${
              isActive
                ? "bg-aura-rose text-white"
                : "text-white/70 hover:bg-white/12 hover:text-aura-paper"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * CathedralDetailOverlay — bottom-anchored detail card that mounts when a
 * deck/library card is opened. Hosts the per-mode CTA the lobby passes in.
 * ========================================================================== */

export function CathedralDetailOverlay({
  open,
  title,
  venue,
  summary,
  riskLabel,
  intimacyLabel,
  chaosLabel,
  cost,
  eyebrow,
  cta,
  note,
  onClose,
}: {
  open: boolean;
  title: string;
  venue: string;
  summary: string;
  riskLabel: string;
  intimacyLabel: string;
  chaosLabel: string;
  cost: number;
  eyebrow: string;
  cta: ReactNode;
  note?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="detail"
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-[120px] z-40 px-6"
        >
          <div className="pointer-events-auto mx-auto max-w-[680px] rounded-card aura-liquid-glass aura-liquid-glass-rose p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 leading-tight">
                <div className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
                  {eyebrow}
                </div>
                <div className="mt-1 font-display text-display-md text-aura-paper">{title}</div>
                <div className="mt-1 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
                  {venue}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close detail"
                className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3 py-1.5 font-display text-label text-aura-paper"
              >
                Close
              </button>
            </div>
            <p className="mt-3 font-sans text-label text-white/80">{summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-micro uppercase tracking-[0.18em] text-white/65">
              <span>risk · {riskLabel}</span>
              <span>warmth · {intimacyLabel}</span>
              <span>chaos · {chaosLabel}</span>
              <span>cost · {cost}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {cta}
              {note === undefined ? null : (
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-amber">
                  {note}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
