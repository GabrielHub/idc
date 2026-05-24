import { AnimatePresence, motion } from "motion/react";
import { useState, type Ref } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";
import type { FlythroughLayer, RosterSubview, ViewMode } from "./types";
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
}) {
  const inArchive = viewMode === "archive";
  const dateBookActive = !inArchive && scenarioMode !== "auto";
  const showRosterPills = !inArchive && currentLayer === 1;
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

  const rosterToolRows: CapsuleRow[] = [
    {
      key: "lens",
      label: `Lens · ${filterActive ? "active" : "all"}`,
      active: filterActive,
      activeSurface: "aura-liquid-glass-violet",
      onClick: onOpenLens,
    },
    ...(canReselect ? [{ key: "manage", label: "Manage cases", onClick: onToggleReselect }] : []),
  ];

  return (
    <div className="pointer-events-none absolute right-6 top-5 z-30 flex flex-col items-end gap-2">
      <div className="pointer-events-auto flex flex-wrap items-start justify-end gap-2">
        {inArchive ? null : (
          <button
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
        <CollapsibleCapsule
          label="records"
          ariaOpenLabel="Open records"
          ariaCloseLabel="Collapse records"
          containerTone={inArchive ? "aura-liquid-glass-violet" : ""}
          statusDotClass={inArchive ? "bg-aura-violet" : null}
          rows={recordRows}
        />
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
          title={fileShiftBlockedReason}
          className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover aura-liquid-glass-amber rounded-full px-3.5 py-1.5 font-mono text-sm uppercase tracking-[0.18em] text-aura-paper disabled:cursor-not-allowed disabled:opacity-55"
        >
          {fileShiftBlockedReason === undefined ? "File shift" : "Shift blocked"}
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {showRosterPills ? (
          <motion.div
            key="roster-pills"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto flex flex-wrap items-start justify-end gap-2"
          >
            <RosterSubviewToggle subview={rosterSubview} onChange={onRosterSubviewChange} />
            <CollapsibleCapsule
              label="tools"
              ariaOpenLabel="Open roster tools"
              ariaCloseLabel="Collapse roster tools"
              statusDotClass={filterActive ? "bg-aura-rose" : null}
              rows={rosterToolRows}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
 * Shared chrome for the top-of-canvas pills that collapse to a chevron and
 * expand into a column of row buttons. Used for Records (Notes / Shift
 * archive / Pairs) and Roster tools (Lens / Manage cases). Keeps the
 * collapse/expand motion, status-dot indicator, and row dismissal contract
 * in one place so both pills stay visually identical.
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
