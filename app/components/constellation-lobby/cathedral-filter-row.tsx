import type { RiskFilter, SortMode } from "./cathedral-types";

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

export function CathedralFilterRow({
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
