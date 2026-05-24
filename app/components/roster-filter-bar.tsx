import { SelectInput } from "./dashboard-atoms";
import {
  MEMBER_ATTENTION_FILTER_OPTIONS,
  MEMBER_AVAILABILITY_FILTER_OPTIONS,
  MEMBER_CLOSURE_FILTER_OPTIONS,
  MEMBER_FOCUS_FILTER_OPTIONS,
  MEMBER_SORT_OPTIONS,
  MEMBER_STATUS_FILTER_OPTIONS,
  type MemberAttentionFilter,
  type MemberAvailabilityFilter,
  type MemberClosureFilter,
  type MemberFocusFilter,
  type MemberRosterFilterState,
  type MemberSortKey,
  type MemberStatusFilter,
} from "../services/member-roster-filter";

export type RosterFilterBarProps = {
  filterState: MemberRosterFilterState;
  onChange: (next: MemberRosterFilterState) => void;
  showCaseOperations?: boolean;
  searchPlaceholder?: string;
  resultLabel?: string;
  /**
   * "light" (default) for dashboard/onboarding surfaces; "dark" for lobby-style
   * dark scenes (e.g. the case manager) so the bar uses aura-liquid-glass and
   * legible light text instead of the white aura-glass + slate-ink combo.
   */
  tone?: "light" | "dark";
};

export function RosterFilterBar({
  filterState,
  onChange,
  showCaseOperations = false,
  searchPlaceholder = "Search the roster",
  resultLabel,
  tone = "light",
}: RosterFilterBarProps) {
  function patch(partial: Partial<MemberRosterFilterState>) {
    onChange({ ...filterState, ...partial });
  }

  const dark = tone === "dark";
  const searchPillClass = dark
    ? "group aura-liquid-glass flex cursor-text items-center gap-2.5 rounded-pill px-4 py-2"
    : "group aura-glass flex cursor-text items-center gap-2.5 rounded-pill px-4 py-2";
  const searchInputClass = dark
    ? "w-56 bg-transparent text-sm text-aura-paper placeholder:text-white/55 focus:outline-none"
    : "w-56 bg-transparent text-sm text-aura-ink placeholder:text-aura-faint focus:outline-none";
  const resultLabelClass = dark
    ? "font-mono text-micro uppercase tracking-[0.22em] text-white/55"
    : "font-mono text-micro uppercase tracking-[0.22em] text-aura-faint";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className={searchPillClass}>
        <SearchIcon tone={tone} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={filterState.search}
          onChange={(event) => patch({ search: event.target.value })}
          className={searchInputClass}
        />
      </label>

      {showCaseOperations ? (
        <>
          <SelectInput<MemberFocusFilter>
            label="Focus"
            layout="toolbar"
            tone={tone}
            value={filterState.focus}
            options={MEMBER_FOCUS_FILTER_OPTIONS}
            onChange={(value) => patch({ focus: value })}
          />

          <SelectInput<MemberAvailabilityFilter>
            label="Availability"
            layout="toolbar"
            tone={tone}
            value={filterState.availability}
            options={MEMBER_AVAILABILITY_FILTER_OPTIONS}
            onChange={(value) => patch({ availability: value })}
          />

          <SelectInput<MemberAttentionFilter>
            label="Attention"
            layout="toolbar"
            tone={tone}
            value={filterState.attention}
            options={MEMBER_ATTENTION_FILTER_OPTIONS}
            onChange={(value) => patch({ attention: value })}
          />

          <SelectInput<MemberClosureFilter>
            label="Closure"
            layout="toolbar"
            tone={tone}
            value={filterState.closure}
            options={MEMBER_CLOSURE_FILTER_OPTIONS}
            onChange={(value) => patch({ closure: value })}
          />

          <SelectInput<MemberStatusFilter>
            label="Status"
            layout="toolbar"
            tone={tone}
            value={filterState.status}
            options={MEMBER_STATUS_FILTER_OPTIONS}
            onChange={(value) => patch({ status: value })}
          />
        </>
      ) : null}

      <SelectInput<MemberSortKey>
        label="Sort"
        layout="toolbar"
        tone={tone}
        value={filterState.sort}
        options={MEMBER_SORT_OPTIONS}
        onChange={(value) => patch({ sort: value })}
      />

      {resultLabel === undefined ? null : <span className={resultLabelClass}>{resultLabel}</span>}
    </div>
  );
}

export function RosterFilterEmptyState() {
  return (
    <div className="rounded-card border border-aura-hairline bg-white/70 px-8 py-16 text-center shadow-quiet">
      <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-faint">
        // no matches
      </p>
      <p className="mt-3 text-body text-aura-muted">
        No members match the current filters. Try clearing them.
      </p>
    </div>
  );
}

function SearchIcon({ tone }: { tone: "light" | "dark" }) {
  const colorClass = tone === "dark" ? "text-white/60" : "text-aura-faint";
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-4 ${colorClass} transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-focus-within:-rotate-6 group-focus-within:scale-110`}
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
