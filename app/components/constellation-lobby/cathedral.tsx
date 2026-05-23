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
 *     `FlythroughLayer === 2`. Owns the card grid plus the per-mode header.
 *     Strictly gated by the lobby on `currentLayer === 2` so the panel never
 *     bleeds into the member layers.
 *   - `CathedralFilterRail` — top-of-screen filter strip rendered in library
 *     mode (search + risk chips + sort chips).
 *   - `CathedralDetailOverlay` — the per-card detail card mounted when a
 *     deck/library door is opened. Hosts the mode-specific CTA the lobby
 *     wires in (Drop / Add).
 *
 * The cathedral has no booking state of its own — the lobby builds a single
 * `doors` array, tags each entry with its mode-specific role, and routes the
 * click target back up.
 */

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { LobbyScenario } from "./types";

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
export type DoorKind = "deck" | "library" | "draw";

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
  reducedMotion,
}: {
  /** When false, the panel unmounts entirely so the canvas reads cleanly. */
  open: boolean;
  mode: CathedralMode;
  doors: DoorEntry[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
}) {
  const enterDuration = reducedMotion ? 0.001 : 0.36;
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cathedral-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: enterDuration, ease: [0.22, 0.8, 0.2, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-[124px] top-[156px] z-20 px-6"
        >
          <div className="pointer-events-auto mx-auto flex h-full max-w-[1180px] flex-col">
            <CathedralHeader mode={mode} doorCount={doors.length} />
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

function CathedralHeader({ mode, doorCount }: { mode: CathedralMode; doorCount: number }) {
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
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0">
        <div className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose/80">
          // cathedral
        </div>
        <h2 className="mt-1 font-display text-display-md leading-none text-aura-paper">{title}</h2>
        <p className="mt-2 font-sans text-label text-white/65">{subtitle}</p>
      </div>
      <div className="shrink-0 text-right font-mono text-micro uppercase tracking-[0.22em] text-white/55">
        {counter}
      </div>
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
  reducedMotion,
}: {
  doors: DoorEntry[];
  mode: CathedralMode;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
}) {
  // Library can run long — pack 4 columns. Auto + deck stay at 3 so the
  // cards breathe and the slot tag has room to read.
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
 * CathedralCard — one scenario card.
 *
 * Layout (top → bottom):
 *   [eyebrow tag · slot label]              [in-deck pip, if library]
 *   [Title — Bricolage display]
 *   [Venue — mono micro]
 *   ─────────────────────────
 *   [3 axis meters: R / W / C, each a 3-segment bar in the axis's tint]
 *   ─────────────────────────
 *   [room-read pill — jewel tone]            [$cost — display sm]
 *
 * A 2px tinted strip runs down the left edge keyed to the room read so the
 * grid scans as three temperaments before the eye gets to any titles.
 * ========================================================================== */

function CathedralCard({
  entry,
  mode,
  selected,
  hovered,
  onSelect,
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
    <motion.button
      type="button"
      onClick={interactive ? onSelect : undefined}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      disabled={!interactive}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: enterDuration, ease: [0.22, 0.8, 0.2, 1], delay: indexDelay }}
      whileHover={interactive && !reducedMotion ? { y: -3 } : undefined}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-card text-left transition-shadow duration-200 aura-liquid-glass aura-liquid-glass-ink disabled:cursor-not-allowed ${
        selected ? "shadow-cta ring-2 ring-aura-rose/85" : "ring-1 ring-white/10"
      } ${entry.disabled === true ? "opacity-45" : ""} ${
        entry.alreadyInDeck === true && !selected ? "opacity-70" : ""
      } ${hovered && !selected ? "ring-white/30" : ""}`}
    >
      <span aria-hidden className={`pointer-events-none absolute inset-0 ${tint.glowBg}`} />
      <span aria-hidden className={`absolute left-0 top-0 h-full w-[3px] ${tint.strip}`} />

      <div className="relative px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${tint.eyebrow}`}
          >
            {tag}
          </span>
          {entry.alreadyInDeck === true ? (
            <span className="rounded-pill border border-aura-rose/35 bg-aura-rose/15 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-rose/90">
              in deck
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 font-display text-display-sm leading-tight text-aura-paper">
          {entry.scenario.title}
        </h3>
        <p className="mt-1 font-mono text-micro uppercase tracking-[0.16em] text-white/55">
          {entry.scenario.venue}
        </p>
      </div>

      <div className="relative mx-5 my-1 border-t border-white/10" />

      <div className="relative space-y-2 px-5 py-3">
        <AxisMeter label="R" value={entry.scenario.axes.risk} kind="risk" />
        <AxisMeter label="W" value={entry.scenario.axes.intimacy} kind="warmth" />
        <AxisMeter label="C" value={entry.scenario.axes.chaos} kind="chaos" />
      </div>

      <div className="relative mx-5 border-t border-white/10" />

      <div className="relative flex items-center justify-between gap-3 px-5 py-3">
        <span
          className={`inline-flex rounded-pill border px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] ${tint.pill}`}
        >
          {entry.scenario.roomRead}
        </span>
        <span className="font-display text-display-sm leading-none text-aura-paper">
          ${entry.scenario.cost}
        </span>
      </div>

      {entry.disabled === true ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_6px,transparent_6px_12px)]"
        />
      ) : null}
    </motion.button>
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
  // `value` is 1/2/3 (low/medium/high) per `riskToNumber` in the lobby.
  // Render 3 segments so the meter mirrors the data exactly.
  const segments = 3;
  const filled = Math.max(0, Math.min(segments, Math.round(value)));
  const fillBg =
    kind === "risk" ? "bg-aura-rose" : kind === "warmth" ? "bg-aura-violet" : "bg-aura-amber";
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-white/55">
        {label}
      </span>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-1.5 flex-1 rounded-full ${i < filled ? fillBg : "bg-white/10"}`}
          />
        ))}
      </div>
    </div>
  );
}

function roomReadTint(roomRead: LobbyScenario["roomRead"]): {
  strip: string;
  pill: string;
  eyebrow: string;
  glowBg: string;
} {
  if (roomRead === "promising") {
    return {
      strip: "bg-aura-rose",
      pill: "bg-aura-rose/15 border-aura-rose/40 text-aura-rose/95",
      eyebrow: "text-aura-rose/90",
      glowBg: "bg-[radial-gradient(circle_at_85%_-10%,rgba(244,63,94,0.18),transparent_60%)]",
    };
  }
  if (roomRead === "volatile") {
    return {
      strip: "bg-aura-amber",
      pill: "bg-aura-amber/15 border-aura-amber/40 text-aura-amber/95",
      eyebrow: "text-aura-amber/90",
      glowBg: "bg-[radial-gradient(circle_at_85%_-10%,rgba(245,158,11,0.18),transparent_60%)]",
    };
  }
  return {
    strip: "bg-aura-emerald",
    pill: "bg-aura-emerald/15 border-aura-emerald/40 text-aura-emerald/95",
    eyebrow: "text-aura-emerald/90",
    glowBg: "bg-[radial-gradient(circle_at_85%_-10%,rgba(16,185,129,0.18),transparent_60%)]",
  };
}

function topTagFor(entry: DoorEntry, mode: CathedralMode): string {
  if (entry.kind === "deck") return entry.slotLabel ?? "deck slot";
  if (entry.kind === "draw") return mode === "auto" ? "tonight's draw" : "scenario";
  return "library";
}

/* ============================================================================
 * CathedralFilterRail — HTML overlay above the canvas in library mode.
 * Search + risk chips + sort chips. The control surface mirrors the legacy
 * LibraryFilterRail; the cathedral grid below it reacts to the filter state.
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

export function CathedralFilterRail({
  open,
  matchCount,
  search,
  riskFilter,
  sortMode,
  onSearchChange,
  onRiskFilterChange,
  onSortChange,
}: {
  open: boolean;
  matchCount: number;
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  onSearchChange: (next: string) => void;
  onRiskFilterChange: (next: RiskFilter) => void;
  onSortChange: (next: SortMode) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="filter-rail"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
          className="pointer-events-none absolute inset-x-0 top-20 z-30 px-6"
        >
          <div className="pointer-events-auto mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 rounded-pill aura-liquid-glass aura-liquid-glass-ink px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
                // library cathedral
              </span>
              <span className="font-display text-label text-aura-paper">
                {matchCount} {matchCount === 1 ? "card" : "cards"}
              </span>
            </div>
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
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
