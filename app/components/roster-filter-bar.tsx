import { SelectInput } from "./dashboard-atoms";
import {
  MEMBER_HEIGHT_BUCKET_OPTIONS,
  MEMBER_SORT_OPTIONS,
  MEMBER_STATUS_FILTER_OPTIONS,
  type MemberHeightBucket,
  type MemberRosterFilterState,
  type MemberSortKey,
  type MemberStatusFilter,
} from "../services/member-roster-filter";

export type RosterFilterBarProps = {
  filterState: MemberRosterFilterState;
  onChange: (next: MemberRosterFilterState) => void;
  showStatus?: boolean;
  searchPlaceholder?: string;
  resultLabel?: string;
};

export function RosterFilterBar({
  filterState,
  onChange,
  showStatus = false,
  searchPlaceholder = "Search the roster",
  resultLabel,
}: RosterFilterBarProps) {
  function patch(partial: Partial<MemberRosterFilterState>) {
    onChange({ ...filterState, ...partial });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="aura-glass flex cursor-text items-center gap-2.5 rounded-pill px-4 py-2">
        <SearchIcon />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={filterState.search}
          onChange={(event) => patch({ search: event.target.value })}
          className="w-56 bg-transparent text-sm text-aura-ink placeholder:text-aura-faint focus:outline-none"
        />
      </label>

      {showStatus ? (
        <SelectInput<MemberStatusFilter>
          label="Status"
          layout="toolbar"
          value={filterState.status}
          options={MEMBER_STATUS_FILTER_OPTIONS}
          onChange={(value) => patch({ status: value })}
        />
      ) : null}

      <SelectInput<MemberHeightBucket>
        label="Height"
        layout="toolbar"
        value={filterState.height}
        options={MEMBER_HEIGHT_BUCKET_OPTIONS}
        onChange={(value) => patch({ height: value })}
      />

      <SelectInput<MemberSortKey>
        label="Sort"
        layout="toolbar"
        value={filterState.sort}
        options={MEMBER_SORT_OPTIONS}
        onChange={(value) => patch({ sort: value })}
      />

      {resultLabel === undefined ? null : (
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {resultLabel}
        </span>
      )}
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 text-aura-faint"
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
