import { GhostButton, pad2, SelectInput } from "./dashboard-atoms";
import type { NotesScopeFilter } from "./notes-view-helpers";

export type NotesScopeOption = { id: string; label: string };

const NOTES_SCOPE_FILTERS: { id: NotesScopeFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "pairs", label: "pairs" },
  { id: "scenarios", label: "scenarios" },
];

export function NotesFilterRail({
  scopeFilter,
  onScopeFilterChange,
  pairOptions,
  selectedPairId,
  onSelectedPairChange,
  scenarioOptions,
  selectedScenarioId,
  onSelectedScenarioChange,
  totalCount,
  shownCount,
  hasFilters,
  onClearFilters,
}: {
  scopeFilter: NotesScopeFilter;
  onScopeFilterChange: (next: NotesScopeFilter) => void;
  pairOptions: NotesScopeOption[];
  selectedPairId: string | "any";
  onSelectedPairChange: (id: string | "any") => void;
  scenarioOptions: NotesScopeOption[];
  selectedScenarioId: string | "any";
  onSelectedScenarioChange: (id: string | "any") => void;
  totalCount: number;
  shownCount: number;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const showPairPicker = scopeFilter !== "scenarios" && pairOptions.length > 0;
  const showScenarioPicker = scopeFilter !== "pairs" && scenarioOptions.length > 0;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="inline-flex items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
        {NOTES_SCOPE_FILTERS.map((filter) => {
          const active = scopeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              data-sfx="click"
              onClick={() => onScopeFilterChange(filter.id)}
              aria-pressed={active}
              className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                active
                  ? "bg-aura-ink text-white shadow-quiet"
                  : "text-aura-muted hover:text-aura-ink"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {showPairPicker ? (
        <NotesScopePicker
          label="Pair"
          value={selectedPairId}
          options={pairOptions}
          onChange={onSelectedPairChange}
        />
      ) : null}

      {showScenarioPicker ? (
        <NotesScopePicker
          label="Date plan"
          value={selectedScenarioId}
          options={scenarioOptions}
          onChange={onSelectedScenarioChange}
        />
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {pad2(shownCount)} of {pad2(totalCount)} shown
        </span>
        {hasFilters ? <GhostButton onClick={onClearFilters}>Reset filters</GhostButton> : null}
      </div>
    </div>
  );
}

function NotesScopePicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | "any";
  options: NotesScopeOption[];
  onChange: (id: string | "any") => void;
}) {
  const selectOptions = [
    { value: "any", label: "any" },
    ...options.map((option) => ({ value: option.id, label: option.label })),
  ];

  return (
    <SelectInput
      label={label}
      value={value}
      options={selectOptions}
      layout="inline"
      onChange={onChange}
    />
  );
}
