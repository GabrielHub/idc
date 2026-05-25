import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode, type Ref } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";
import {
  isRosterFlythroughLayer,
  type FlythroughLayer,
  type RosterSubview,
  type ViewMode,
} from "./types";
import type { CathedralMode } from "./cathedral";

export function ContextualPillRail({
  scenarioMode,
  bookingLocked,
  dateBookDisabledReason,
  deckRepairBlocked,
  currentLayer,
  rosterSubview,
  filterActive,
  canReselect,
  viewMode,
  archiveEdgeCount,
  archiveSelectionActive,
  fileShiftBlockedReason,
  showRecords,
  onCompleteShift,
  onOpenNotes,
  onOpenShiftArchive,
  onToggleDateBook,
  onOpenLens,
  onToggleReselect,
  onRosterSubviewChange,
  onToggleArchive,
  onClearArchiveSelection,
  fileShiftButtonRef,
  containerRef,
  dateBookPillRef,
}: {
  scenarioMode: CathedralMode;
  bookingLocked: boolean;
  dateBookDisabledReason?: string;
  deckRepairBlocked: boolean;
  currentLayer: FlythroughLayer;
  rosterSubview: RosterSubview;
  filterActive: boolean;
  canReselect: boolean;
  viewMode: ViewMode;
  archiveEdgeCount: number;
  archiveSelectionActive: boolean;
  fileShiftBlockedReason?: string;
  showRecords: boolean;
  onCompleteShift: () => void;
  onOpenNotes: () => void;
  onOpenShiftArchive: () => void;
  onToggleDateBook: () => void;
  onOpenLens: () => void;
  onToggleReselect: () => void;
  onRosterSubviewChange: (next: RosterSubview) => void;
  onToggleArchive: () => void;
  onClearArchiveSelection: (() => void) | undefined;
  fileShiftButtonRef?: Ref<HTMLButtonElement>;
  containerRef?: Ref<HTMLDivElement>;
  dateBookPillRef?: Ref<HTMLButtonElement>;
}) {
  const inArchive = viewMode === "archive";
  const dateBookActive = !inArchive && scenarioMode !== "auto";
  const showRosterPills = !inArchive && isRosterFlythroughLayer(currentLayer);
  // No filed-note pairs exist yet — the archive has nothing to show, so hide
  // its entry pill entirely. The lobby auto-exits archive view in the same
  // edge case, so the pill never needs to render as a way back out.
  const showPairsEntry = archiveEdgeCount > 0;

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

  const recordRows: CapsuleRow[] = [
    { key: "notes", label: "Notes", onClick: onOpenNotes },
    { key: "shift-archive", label: "Shift archive", onClick: onOpenShiftArchive },
    ...(showPairsEntry
      ? [
          {
            key: "pairs",
            label: inArchive ? `Pairs · ${archiveEdgeCount}` : "Pairs",
            active: inArchive,
            activeSurface: "aura-liquid-glass-violet" as const,
            onClick: onToggleArchive,
          },
        ]
      : []),
    ...(inArchive && archiveSelectionActive && onClearArchiveSelection !== undefined
      ? [{ key: "clear-focus", label: "Clear focus", onClick: onClearArchiveSelection }]
      : []),
  ];

  return (
    <>
      <div ref={containerRef} className="pointer-events-none absolute right-6 top-5 z-30">
        <div className="pointer-events-auto flex flex-wrap items-start justify-end gap-2">
          {inArchive ? null : (
            <button
              ref={dateBookPillRef}
              type="button"
              onClick={onToggleDateBook}
              disabled={bookingLocked || dateBookDisabledReason !== undefined}
              aria-label={
                dateBookDisabledReason === undefined
                  ? dateBookLabel
                  : `${dateBookLabel} blocked: ${dateBookDisabledReason}`
              }
              title={dateBookDisabledReason}
              className={`cursor-pointer aura-liquid-glass aura-liquid-glass-hover ${dateBookTone} rounded-full px-3.5 py-1.5 font-mono uppercase tracking-[0.18em] text-aura-paper text-micro disabled:cursor-not-allowed disabled:opacity-55`}
            >
              {dateBookLabel}
            </button>
          )}
          {showRecords ? (
            <CollapsibleCapsule
              label="records"
              ariaOpenLabel="Open records"
              ariaCloseLabel="Collapse records"
              containerTone={inArchive ? "aura-liquid-glass-violet" : ""}
              statusDotClass={inArchive ? "bg-aura-violet" : null}
              rows={recordRows}
            />
          ) : null}
          <button
            ref={fileShiftButtonRef}
            type="button"
            onClick={onCompleteShift}
            disabled={fileShiftBlockedReason !== undefined}
            aria-label={
              fileShiftBlockedReason === undefined
                ? "File shift"
                : `File shift blocked: ${fileShiftBlockedReason}`
            }
            title={
              fileShiftBlockedReason === undefined
                ? "File shift"
                : `File shift blocked: ${fileShiftBlockedReason}`
            }
            className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover aura-liquid-glass-amber grid size-9 place-items-center rounded-full text-aura-paper disabled:cursor-not-allowed disabled:opacity-55"
          >
            <FileShiftGlyph />
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {showRosterPills ? (
          <motion.div
            key="roster-pills"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-2"
          >
            <RosterSubviewToggle subview={rosterSubview} onChange={onRosterSubviewChange} />
            <RoundIconButton
              label={`Filter roster · ${filterActive ? "active" : "all"}`}
              onClick={onOpenLens}
              active={filterActive}
              activeSurface="aura-liquid-glass-violet"
            >
              <FilterGlyph />
            </RoundIconButton>
            {canReselect ? (
              <RoundIconButton label="Edit case picks" onClick={onToggleReselect}>
                <EditGlyph />
              </RoundIconButton>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

type CapsuleRow = {
  key: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeSurface?: string;
};

/**
 * Pill that collapses to a labeled chevron and expands into a column of row
 * buttons. Used for the Records cluster (Notes / Shift archive / Pairs) in the
 * top-right rail. The filter and edit icon buttons in the top-center roster
 * row used to share this chrome before they became single-tap icon pills.
 */
function CollapsibleCapsule({
  label,
  ariaOpenLabel,
  ariaCloseLabel,
  containerTone = "",
  statusDotClass,
  rows,
}: {
  label: string;
  ariaOpenLabel: string;
  ariaCloseLabel: string;
  containerTone?: string;
  statusDotClass: string | null;
  rows: readonly CapsuleRow[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.34, ease: EASE_OUT_QUART } }}
      animate={{ borderRadius: expanded ? 18 : 9999 }}
      className={`overflow-hidden aura-liquid-glass aura-liquid-glass-hover ${containerTone} ${
        expanded ? "w-[200px]" : "w-fit"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? ariaCloseLabel : ariaOpenLabel}
        className={`flex w-full cursor-pointer items-center gap-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-paper ${
          expanded ? "px-4 pt-2.5 pb-2" : "px-3.5 py-1.5"
        }`}
      >
        {!expanded && statusDotClass !== null ? (
          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`} aria-hidden />
        ) : null}
        <span className="flex-1 text-left">{label}</span>
        <ChevronGlyph open={expanded} />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="rows"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
            className="flex flex-col gap-1 px-2 pb-2"
          >
            {rows.map((row) => (
              <CapsuleRowButton
                key={row.key}
                row={row}
                onActivate={() => {
                  setExpanded(false);
                  row.onClick();
                }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function CapsuleRowButton({ row, onActivate }: { row: CapsuleRow; onActivate: () => void }) {
  const activeClass =
    row.active === true
      ? `${row.activeSurface ?? "aura-liquid-glass-violet"} text-aura-paper`
      : "text-white/75 hover:bg-white/10 hover:text-aura-paper";
  return (
    <button
      type="button"
      onClick={onActivate}
      aria-pressed={row.active}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-left font-mono text-micro uppercase tracking-[0.18em] transition ${activeClass}`}
    >
      {row.label}
    </button>
  );
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      fill="none"
      className={`size-3 shrink-0 text-aura-paper/75 transition ${open ? "" : "rotate-180"}`}
    >
      <path
        d="M3.5 5.5L7 9L10.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoundIconButton({
  label,
  onClick,
  active = false,
  activeSurface,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  activeSurface?: string;
  children: ReactNode;
}) {
  const tone = active ? (activeSurface ?? "aura-liquid-glass-violet") : "";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`cursor-pointer aura-liquid-glass aura-liquid-glass-hover ${tone} grid size-9 place-items-center rounded-full text-aura-paper transition`}
    >
      {children}
    </button>
  );
}

function FilterGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className="size-3.5 text-aura-paper">
      <path
        d="M2.25 3.5h11.5L9.5 8.6v4.4l-3-1.4V8.6L2.25 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileShiftGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className="size-4 text-aura-paper">
      <path
        d="M3 4l-1 5.5v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3L13 4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M2 9.5h3.5l1 1.5h3l1-1.5H14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className="size-3.5 text-aura-paper">
      <path
        d="M10.6 2.6l2.8 2.8M2.75 13.25l3-.55 7.05-7.05a1.5 1.5 0 0 0 0-2.12l-.93-.93a1.5 1.5 0 0 0-2.12 0L2.7 9.7l-.5 3 .55-.45Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
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
