import { AnimatePresence, motion } from "motion/react";
import type { Ref } from "react";

import type { FlythroughLayer, RosterSubview, ViewMode } from "./types";
import type { CathedralMode } from "./cathedral";

export function ContextualPillRail({
  scenarioMode,
  bookingLocked,
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
  const showArchivePill = archiveEdgeCount > 0;

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

  const archiveLabel = inArchive ? `Pairs · ${archiveEdgeCount}` : "Pairs";
  const archiveTone = inArchive ? "aura-liquid-glass-violet" : "";

  return (
    <div className="pointer-events-none absolute right-6 top-5 z-30 flex flex-col items-end gap-2">
      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        {showArchivePill ? (
          <button
            type="button"
            onClick={onToggleArchive}
            aria-label={archiveLabel}
            aria-pressed={inArchive}
            className={`cursor-pointer aura-liquid-glass aura-liquid-glass-hover ${archiveTone} rounded-full px-3.5 py-1.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper`}
          >
            {archiveLabel}
          </button>
        ) : null}
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
        <button
          type="button"
          onClick={onOpenNotes}
          aria-label="Open notes archive"
          className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3.5 py-1.5 font-mono text-sm uppercase tracking-[0.18em] text-aura-paper"
        >
          Notes
        </button>
        <button
          type="button"
          onClick={onOpenShiftArchive}
          aria-label="Open shift archive"
          className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3.5 py-1.5 font-mono text-sm uppercase tracking-[0.18em] text-aura-paper"
        >
          Archive
        </button>
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
                className="cursor-pointer rounded-full px-3.5 py-1.5 font-mono uppercase tracking-[0.18em] text-aura-paper text-micro aura-liquid-glass aura-liquid-glass-hover"
                aria-label="Manage cases"
              >
                Manage cases
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
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
