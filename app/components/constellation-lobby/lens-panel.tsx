/**
 * Lens panel — search + categorical filters for the constellation lobby.
 * Replaces the Roster room's filter bar, but only dims non-matching stars
 * in the field rather than removing them. Opened from TopBar's Roster shard;
 * closes via ESC or scrim click. The result count chip and clear-all chip
 * surface the active filter state at a glance.
 *
 * Five categorical chips mirror `MemberRosterFilterState` minus `sort` (the
 * 3D field is the layout — there is no sort axis to honor):
 *   - status (all / active / closed / cancelled)
 *   - focus (all / on focus / off focus)
 *   - availability (all / on tonight's board / on cooldown)
 *   - attention (all / confidence low / closed-file risk)
 *   - closure (all / ready to close)
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

import {
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  isMemberRosterFilterActive,
  MEMBER_ATTENTION_FILTER_OPTIONS,
  MEMBER_AVAILABILITY_FILTER_OPTIONS,
  MEMBER_CLOSURE_FILTER_OPTIONS,
  MEMBER_FOCUS_FILTER_OPTIONS,
  MEMBER_STATUS_FILTER_OPTIONS,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import { AuraButton } from "../aura-button";

export type LensPanelProps = {
  isOpen: boolean;
  filterState: MemberRosterFilterState;
  matchCount: number;
  totalCount: number;
  onChange: (next: MemberRosterFilterState) => void;
  onClose: () => void;
};

export function LensPanel({
  isOpen,
  filterState,
  matchCount,
  totalCount,
  onChange,
  onClose,
}: LensPanelProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const filterActive = isMemberRosterFilterActive(filterState);

  function patch(partial: Partial<MemberRosterFilterState>) {
    onChange({ ...filterState, ...partial });
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="lens-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 0.8, 0.2, 1] }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-[#07041a]/45 backdrop-blur-[1px]"
        >
          <motion.div
            key="lens-panel"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Roster lens"
            className="aura-liquid-glass absolute left-1/2 top-[84px] z-10 w-[min(720px,calc(100vw-3rem))] -translate-x-1/2 rounded-card p-5"
          >
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose/85">
                  // roster.lens
                </p>
                <span className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
                  {matchCount} of {totalCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {filterActive ? (
                  <AuraButton
                    tooltip="Clear all roster filters"
                    onClick={() => onChange(DEFAULT_MEMBER_ROSTER_FILTER_STATE)}
                    className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper"
                  >
                    Clear all
                  </AuraButton>
                ) : null}
                <AuraButton
                  tooltip="Close lens"
                  onClick={onClose}
                  className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover grid size-8 place-items-center rounded-full text-white/80"
                >
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
                    <path
                      d="M3 3L13 13M13 3L3 13"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </AuraButton>
              </div>
            </header>

            <label className="mt-4 flex items-center gap-2.5 rounded-pill border border-white/15 bg-white/8 px-4 py-2">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search the roster — name, file number, profile…"
                value={filterState.search}
                onChange={(event) => patch({ search: event.target.value })}
                className="w-full bg-transparent text-sm text-aura-paper placeholder:text-white/45 focus:outline-none"
              />
              {filterState.search.length > 0 ? (
                <AuraButton
                  tooltip="Clear search"
                  onClick={() => patch({ search: "" })}
                  className="cursor-pointer text-white/55 hover:text-aura-paper"
                >
                  <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
                    <path
                      d="M3 3L13 13M13 3L3 13"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </AuraButton>
              ) : null}
            </label>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChipGroup
                label="Status"
                value={filterState.status}
                options={MEMBER_STATUS_FILTER_OPTIONS}
                onPick={(value) => patch({ status: value })}
              />
              <ChipGroup
                label="Focus"
                value={filterState.focus}
                options={MEMBER_FOCUS_FILTER_OPTIONS}
                onPick={(value) => patch({ focus: value })}
              />
              <ChipGroup
                label="Availability"
                value={filterState.availability}
                options={MEMBER_AVAILABILITY_FILTER_OPTIONS}
                onPick={(value) => patch({ availability: value })}
              />
              <ChipGroup
                label="Attention"
                value={filterState.attention}
                options={MEMBER_ATTENTION_FILTER_OPTIONS}
                onPick={(value) => patch({ attention: value })}
              />
              <ChipGroup
                label="Closure"
                value={filterState.closure}
                options={MEMBER_CLOSURE_FILTER_OPTIONS}
                onPick={(value) => patch({ closure: value })}
              />
            </div>

            <p className="mt-4 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
              Non-matching cases stay in the field — they just dim out.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type ChipGroupOption<T> = { value: T; label: string };

function ChipGroup<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<ChipGroupOption<T>>;
  onPick: (next: T) => void;
}) {
  return (
    <div>
      <p className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <AuraButton
              key={option.value}
              tooltip={`${label}: ${option.label}`}
              onClick={() => onPick(option.value)}
              className={`cursor-pointer rounded-full px-3 py-1 font-mono text-micro uppercase tracking-[0.18em] ring-1 transition ${
                active
                  ? "bg-aura-rose/25 text-aura-rose ring-aura-rose/40"
                  : "bg-white/8 text-white/75 ring-white/15 hover:bg-white/14 hover:text-aura-paper"
              }`}
            >
              {option.label}
            </AuraButton>
          );
        })}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 text-white/55"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 L13.5 13.5" strokeLinecap="round" />
    </svg>
  );
}
