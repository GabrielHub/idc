import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { type DateScenario, type Member, type MemoryRecord, type PairState } from "../domain/game";
import { PAIR_CLOSURE_TAG } from "../services/closures";
import { scrubPlayerSafeCopy } from "../services/player-safe-copy";
import {
  EASE_OUT_QUART,
  Eyebrow,
  GhostButton,
  pad2,
  Portrait,
  SelectInput,
} from "./dashboard-atoms";
import { PairBoard } from "./pair-board";

export type NotesProps = {
  memories: MemoryRecord[];
  members: Member[];
  pairStates: PairState[];
  scenarios: DateScenario[];
  shiftCount: number;
};

type NotesScopeFilter = "all" | "pairs" | "scenarios";

const NOTES_SCOPE_FILTERS: { id: NotesScopeFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "pairs", label: "pairs" },
  { id: "scenarios", label: "scenarios" },
];

const PAIR_NOTE_SCOPES = new Set<MemoryRecord["scope"]>(["pair", "date"]);

export function NotesView({ memories, members, pairStates, scenarios, shiftCount }: NotesProps) {
  const [scopeFilter, setScopeFilter] = useState<NotesScopeFilter>("all");
  const [selectedPairId, setSelectedPairId] = useState<string | "any">("any");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | "any">("any");

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const pairStateById = useMemo(
    () => new Map(pairStates.map((pair) => [pair.id, pair])),
    [pairStates],
  );
  const scenarioById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario])),
    [scenarios],
  );

  const visibleMemories = useMemo(
    () => memories.filter(isPlayerVisibleNote).sort(sortMemoriesNewestFirst),
    [memories],
  );

  const pairOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const memory of visibleMemories) {
      if (!PAIR_NOTE_SCOPES.has(memory.scope) || memory.pairId === undefined) continue;
      if (seen.has(memory.pairId)) continue;
      seen.set(memory.pairId, {
        id: memory.pairId,
        label: pairLabel(memory.pairId, memberById, pairStateById),
      });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleMemories, memberById, pairStateById]);

  const scenarioOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const memory of visibleMemories) {
      if (memory.scope !== "scenario" || memory.scenarioId === undefined) continue;
      if (seen.has(memory.scenarioId)) continue;
      const scenario = scenarioById.get(memory.scenarioId);
      seen.set(memory.scenarioId, {
        id: memory.scenarioId,
        label: scenario?.title ?? memory.scenarioId,
      });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleMemories, scenarioById]);

  const filteredMemories = useMemo(() => {
    return visibleMemories.filter((memory) => {
      if (scopeFilter === "pairs" && !PAIR_NOTE_SCOPES.has(memory.scope)) return false;
      if (scopeFilter === "scenarios" && memory.scope !== "scenario") return false;
      if (selectedPairId !== "any" && memory.pairId !== selectedPairId) return false;
      if (selectedScenarioId !== "any" && memory.scenarioId !== selectedScenarioId) return false;
      return true;
    });
  }, [visibleMemories, scopeFilter, selectedPairId, selectedScenarioId]);

  const totalCount = visibleMemories.length;
  const shownCount = filteredMemories.length;
  const hasFilters =
    scopeFilter !== "all" || selectedPairId !== "any" || selectedScenarioId !== "any";

  function clearNotesFilters() {
    setScopeFilter("all");
    setSelectedPairId("any");
    setSelectedScenarioId("any");
  }

  return (
    <ViewFrame wide>
      <SectionHeader
        eyebrow={`// notes.${pad2(shiftCount)}`}
        title="Case notes"
        meta={`${pad2(totalCount)} on file`}
        tooltip="Public pair and scenario memories Cupid can share. Private member files and judge-only records stay sealed."
      />

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(44rem,1fr)_minmax(26rem,34rem)]">
        <div className="min-w-0 xl:sticky xl:top-6">
          <PairBoard
            members={members}
            pairStates={pairStates}
            memories={memories}
            scenarios={scenarios}
            shiftCount={shiftCount}
          />
        </div>

        <section className="min-w-0 xl:sticky xl:top-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-aura-hairline pb-3">
            <div className="space-y-1">
              <Eyebrow>// archive.notes</Eyebrow>
              <h3 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-ink">
                Filed notes
              </h3>
            </div>
            <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
              date and scenario cards
            </p>
          </header>

          <NotesFilterRail
            scopeFilter={scopeFilter}
            onScopeFilterChange={(next) => {
              setScopeFilter(next);
              if (next === "pairs") setSelectedScenarioId("any");
              if (next === "scenarios") setSelectedPairId("any");
            }}
            pairOptions={pairOptions}
            selectedPairId={selectedPairId}
            onSelectedPairChange={setSelectedPairId}
            scenarioOptions={scenarioOptions}
            selectedScenarioId={selectedScenarioId}
            onSelectedScenarioChange={setSelectedScenarioId}
            totalCount={totalCount}
            shownCount={shownCount}
            hasFilters={hasFilters}
            onClearFilters={clearNotesFilters}
          />

          {totalCount === 0 ? (
            <NotesEmptyTile
              title="No public notes yet"
              subhead="Cupid files pair and scenario memories after dates wrap. Run a shift to start the archive."
            />
          ) : filteredMemories.length === 0 ? (
            <NotesEmptyTile
              title="No notes match this filter"
              subhead="Loosen the filter to see more of the case archive."
              action={<GhostButton onClick={clearNotesFilters}>Reset filters</GhostButton>}
            />
          ) : (
            <NotesArchive
              memories={filteredMemories}
              memberById={memberById}
              pairStateById={pairStateById}
              scenarioById={scenarioById}
            />
          )}
        </section>
      </div>
    </ViewFrame>
  );
}

function ViewFrame({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className={`mx-auto w-full pb-40 pt-6 ${
        wide ? "max-w-canvas px-0" : "max-w-4xl px-6 lg:px-10"
      }`}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  meta,
  tooltip,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  tooltip: React.ReactNode;
}) {
  return (
    <header className="border-b border-aura-hairline pb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="group relative">
          <h2
            tabIndex={0}
            className="cursor-help font-display text-display-lg font-semibold leading-[0.92] tracking-tight text-aura-ink outline-none focus-visible:text-aura-rose"
          >
            {title}
          </h2>
          <div
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-max max-w-md translate-y-1 rounded-card border border-aura-hairline bg-white/95 px-4 py-2.5 opacity-0 shadow-card backdrop-blur-sm transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            <p className="aura-accent text-lead leading-snug text-aura-muted">
              &ldquo;{tooltip}&rdquo;
            </p>
          </div>
        </div>
        <p className="flex items-baseline gap-2 font-mono text-micro font-semibold uppercase tracking-[0.28em]">
          <span className="text-aura-rose">{eyebrow}</span>
          <span aria-hidden className="text-aura-faint/60">
            ·
          </span>
          <span className="text-aura-faint">{meta}</span>
        </p>
      </div>
    </header>
  );
}

function NotesArchive({
  memories,
  memberById,
  pairStateById,
  scenarioById,
}: {
  memories: MemoryRecord[];
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
}) {
  const [featured, ...rest] = memories;

  return (
    <div className="relative mt-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-3 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-aura-rose/45 via-aura-hairline-strong to-transparent lg:block"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[14px] top-3 hidden size-2 rounded-full bg-aura-rose/70 shadow-[0_0_0_4px_rgba(255,253,249,0.85)] lg:block"
      />

      {featured === undefined ? null : (
        <FeaturedNoteCard
          memory={featured}
          memberById={memberById}
          pairStateById={pairStateById}
          scenarioById={scenarioById}
          rank={memories.length}
        />
      )}

      {rest.length === 0 ? null : (
        <ul className="mt-6 grid gap-5">
          <AnimatePresence initial={false}>
            {rest.map((memory, index) => (
              <NoteCard
                key={memory.id}
                memory={memory}
                index={index}
                memberById={memberById}
                pairStateById={pairStateById}
                scenarioById={scenarioById}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function NotesFilterRail({
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
  pairOptions: { id: string; label: string }[];
  selectedPairId: string | "any";
  onSelectedPairChange: (id: string | "any") => void;
  scenarioOptions: { id: string; label: string }[];
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
  options: { id: string; label: string }[];
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

type NoteScopeKey = "pair" | "date" | "scenario" | "closure";

type ScopePalette = {
  label: string;
  ribbon: string;
  rail: string;
  watermark: string;
  glyphRing: string;
  glyphFill: string;
  caseDot: string;
};

const NOTE_SCOPE_PALETTE: Record<NoteScopeKey, ScopePalette> = {
  pair: {
    label: "PAIR FILE",
    ribbon: "bg-aura-rose/95 text-white",
    rail: "bg-aura-rose",
    watermark: "text-aura-rose",
    glyphRing: "ring-aura-rose/35",
    glyphFill: "from-rose-100 via-aura-paper to-fuchsia-50",
    caseDot: "bg-aura-rose",
  },
  date: {
    label: "DATE FILE",
    ribbon: "bg-aura-fuchsia/95 text-white",
    rail: "bg-aura-fuchsia",
    watermark: "text-aura-fuchsia",
    glyphRing: "ring-aura-fuchsia/35",
    glyphFill: "from-fuchsia-100 via-aura-paper to-violet-50",
    caseDot: "bg-aura-fuchsia",
  },
  scenario: {
    label: "SCENARIO FILE",
    ribbon: "bg-aura-amber/95 text-white",
    rail: "bg-aura-amber",
    watermark: "text-aura-amber",
    glyphRing: "ring-aura-amber/40",
    glyphFill: "from-amber-100 via-aura-paper to-rose-50",
    caseDot: "bg-aura-amber",
  },
  closure: {
    label: "CASE CLOSED",
    ribbon: "bg-aura-ink text-white",
    rail: "bg-gradient-to-b from-aura-rose via-aura-fuchsia to-aura-amber",
    watermark: "text-aura-rose",
    glyphRing: "ring-aura-rose/50",
    glyphFill: "from-aura-cream via-rose-50 to-fuchsia-100",
    caseDot: "bg-aura-ink",
  },
};

function isPairClosureMemory(memory: MemoryRecord): boolean {
  return memory.scope === "pair" && memory.tags.includes(PAIR_CLOSURE_TAG);
}

function paletteForMemory(memory: MemoryRecord): ScopePalette {
  if (isPairClosureMemory(memory)) {
    return NOTE_SCOPE_PALETTE.closure;
  }
  return paletteForScope(memory.scope);
}

function paletteForScope(scope: MemoryRecord["scope"]): ScopePalette {
  if (scope === "pair" || scope === "date" || scope === "scenario") {
    return NOTE_SCOPE_PALETTE[scope];
  }
  return NOTE_SCOPE_PALETTE.pair;
}

function caseNumberFor(memory: MemoryRecord): string {
  if (isPairClosureMemory(memory)) {
    const cleaned = memory.id.replace(/[^0-9a-zA-Z]/g, "");
    const tail = cleaned.slice(-4).toUpperCase().padStart(4, "0");
    return `C-CL-${tail}`;
  }
  const prefix = memory.scope === "pair" ? "PR" : memory.scope === "date" ? "DT" : "SC";
  const cleaned = memory.id.replace(/[^0-9a-zA-Z]/g, "");
  const tail = cleaned.slice(-4).toUpperCase().padStart(4, "0");
  return `C-${prefix}-${tail}`;
}

function splitNoteLead(text: string): { lead: string; tail: string } {
  const trimmed = text.trim();
  const breaks = [". ", "? ", "! "]
    .map((token) => trimmed.indexOf(token))
    .filter((index) => index > 0);
  if (breaks.length === 0) {
    return { lead: trimmed, tail: "" };
  }
  const cut = Math.min(...breaks);
  return { lead: trimmed.slice(0, cut + 1), tail: trimmed.slice(cut + 2) };
}

function FeaturedNoteCard({
  memory,
  memberById,
  pairStateById,
  scenarioById,
  rank,
}: {
  memory: MemoryRecord;
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
  rank: number;
}) {
  const palette = paletteForMemory(memory);
  const pairMembers =
    memory.pairId === undefined
      ? []
      : (pairStateById.get(memory.pairId)?.participantIds ?? [])
          .map((id) => memberById.get(id))
          .filter((m): m is Member => Boolean(m));
  const scenario =
    memory.scenarioId === undefined ? undefined : scenarioById.get(memory.scenarioId);
  const title = noteCardTitle(memory, pairMembers, scenario);
  const subhead = noteCardSubhead(memory, scenario);
  const { lead, tail } = splitNoteLead(scrubPlayerSafeCopy(memory.text));
  const caseNumber = caseNumberFor(memory);
  const tagLabels = visibleMemoryTagLabels(memory);

  return (
    <motion.article
      key={memory.id}
      layout
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.46, ease: EASE_OUT_QUART }}
      className={`aura-glass-strong relative overflow-hidden rounded-card ring-1 ${palette.glyphRing}`}
    >
      <NoteCardWatermark palette={palette} scope={memory.scope} large />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 ${palette.rail} opacity-60`}
      />
      <ImportanceRail value={memory.importance} palette={palette} large />

      <div className="relative z-10 px-6 pb-8 pl-11 pt-0">
        <div className="-mt-px flex items-start justify-between gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-b-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.26em] shadow-quiet ${palette.ribbon}`}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-white/85" />
            {palette.label}
          </span>
          <FiledStamp date={memory.createdAt} />
        </div>

        <div className="mt-6 grid gap-6">
          <div className="flex flex-col items-start gap-3">
            {pairMembers.length > 0 ? (
              <div className="flex -space-x-5">
                {pairMembers.map((member, idx) => (
                  <span
                    key={member.id}
                    className={`rounded-full border-[3px] border-white/90 bg-white shadow-quiet ${idx === 0 ? "rotate-[-3deg]" : "rotate-[2deg]"}`}
                  >
                    <Portrait member={member} variant="card" />
                  </span>
                ))}
              </div>
            ) : (
              <ScenarioGlyph
                title={scenario?.title ?? memory.scenarioId ?? "S"}
                palette={palette}
                large
              />
            )}
            <div className="space-y-1">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
                Filed {formatNoteTimestamp(memory.createdAt)}
              </p>
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-muted">
                Lead case · {pad2(rank)} on file
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-ink">
              {title}
            </h3>
            {subhead === null ? null : (
              <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-rose">
                {subhead}
              </p>
            )}
            <p className="aura-accent mt-5 text-lead leading-snug text-aura-ink/90">{lead}</p>
            {tail === "" ? null : (
              <p className="mt-4 max-w-prose text-body leading-relaxed text-aura-ink/80">{tail}</p>
            )}
            {tagLabels.length === 0 ? null : (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {tagLabels.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2.5 py-1 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4 border-t border-aura-hairline pt-4">
          <p className="flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
            <span aria-hidden className={`size-1.5 rounded-full ${palette.caseDot}`} />
            Reviewed by Cupid
          </p>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted">
            ref · {caseNumber}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function NoteCard({
  memory,
  index,
  memberById,
  pairStateById,
  scenarioById,
}: {
  memory: MemoryRecord;
  index: number;
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
}) {
  const palette = paletteForMemory(memory);
  const pairMembers =
    memory.pairId === undefined
      ? []
      : (pairStateById.get(memory.pairId)?.participantIds ?? [])
          .map((id) => memberById.get(id))
          .filter((m): m is Member => Boolean(m));
  const scenario =
    memory.scenarioId === undefined ? undefined : scenarioById.get(memory.scenarioId);
  const title = noteCardTitle(memory, pairMembers, scenario);
  const subhead = noteCardSubhead(memory, scenario);
  const { lead, tail } = splitNoteLead(scrubPlayerSafeCopy(memory.text));
  const caseNumber = caseNumberFor(memory);
  const tagLabels = visibleMemoryTagLabels(memory);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.34, delay: Math.min(index, 6) * 0.04, ease: EASE_OUT_QUART }}
      className="list-none"
    >
      <article
        className={`aura-glass aura-glass-lift relative h-full overflow-hidden rounded-card ring-1 ${palette.glyphRing}`}
      >
        <NoteCardWatermark palette={palette} scope={memory.scope} />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${palette.rail} opacity-55`}
        />
        <ImportanceRail value={memory.importance} palette={palette} />

        <div className="relative z-10 flex h-full min-h-full flex-col gap-4 px-5 pb-5 pl-9 pt-0 lg:px-6 lg:pl-11">
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-b-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] shadow-quiet ${palette.ribbon}`}
            >
              <span aria-hidden className="size-1 rounded-full bg-white/85" />
              {palette.label}
            </span>
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
              {caseNumber}
            </span>
          </div>

          <div className="flex items-start gap-4">
            {pairMembers.length > 0 ? (
              <div className="flex shrink-0 -space-x-3">
                {pairMembers.map((member, idx) => (
                  <span
                    key={member.id}
                    className={`rounded-full border-2 border-white/90 bg-white shadow-quiet ${idx === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"}`}
                  >
                    <Portrait member={member} variant="thumb" />
                  </span>
                ))}
              </div>
            ) : (
              <ScenarioGlyph
                title={scenario?.title ?? memory.scenarioId ?? "S"}
                palette={palette}
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 font-display text-display-sm font-semibold leading-[1.05] tracking-tight text-aura-ink">
                {title}
              </h3>
              {subhead === null ? null : (
                <p className="mt-1 line-clamp-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
                  {subhead}
                </p>
              )}
              <p className="mt-1 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
                Filed {formatNoteTimestamp(memory.createdAt)}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="aura-accent line-clamp-2 text-lead leading-snug text-aura-ink/90">
              {lead}
            </p>
            {tail === "" ? null : (
              <p className="mt-2 line-clamp-2 text-body leading-relaxed text-aura-ink/75">{tail}</p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-aura-hairline pt-3">
            {tagLabels.length === 0 ? (
              <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
                no tags filed
              </span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {tagLabels.slice(0, 3).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2 py-0.5 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-muted">
                      {tag}
                    </span>
                  </li>
                ))}
                {tagLabels.length > 3 ? (
                  <li className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                    +{tagLabels.length - 3}
                  </li>
                ) : null}
              </ul>
            )}
            <span className="flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              <span aria-hidden className={`size-1 rounded-full ${palette.caseDot}`} />
              {pad2(memory.importance)}/05
            </span>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

function ImportanceRail({
  value,
  palette,
  large = false,
}: {
  value: number;
  palette: ScopePalette;
  large?: boolean;
}) {
  const filled = Math.max(1, Math.min(5, value));
  return (
    <div
      aria-label={`Importance ${filled} of 5`}
      title={`Importance ${filled} of 5`}
      className={`pointer-events-none absolute left-3 flex flex-col gap-1 ${large ? "inset-y-9 w-[3px]" : "inset-y-7 w-[2.5px]"}`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const isLit = 5 - i <= filled;
        return (
          <span
            key={i}
            aria-hidden
            className={`flex-1 rounded-full ${isLit ? palette.rail : "bg-aura-hairline"}`}
          />
        );
      })}
    </div>
  );
}

function FiledStamp({ date }: { date: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none inline-flex -rotate-[7deg] flex-col items-center justify-center gap-0.5 rounded-md border-2 border-aura-rose/45 px-3 py-1.5 font-mono font-semibold uppercase tracking-[0.32em] text-aura-rose/65"
    >
      <span className="text-micro leading-none">Filed</span>
      <span className="text-micro leading-none tracking-[0.18em] text-aura-rose/55">
        {formatStampDate(date)}
      </span>
    </span>
  );
}

function formatStampDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  const day = parsed.toLocaleDateString(undefined, { day: "2-digit" });
  const month = parsed.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  return `${day} ${month}`;
}

function NoteCardWatermark({
  palette,
  scope,
  large = false,
}: {
  palette: ScopePalette;
  scope: MemoryRecord["scope"];
  large?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute opacity-[0.07] ${large ? "-bottom-12 -right-10 size-64" : "-bottom-10 -right-8 size-44"}`}
    >
      <svg viewBox="0 0 100 100" className={`size-full ${palette.watermark}`} fill="currentColor">
        {scope === "scenario" ? (
          <path d="M50 8 L60 38 L92 40 L66 60 L74 92 L50 74 L26 92 L34 60 L8 40 L40 38 Z" />
        ) : (
          <path d="M50 86 C22 64 12 48 12 33 C12 22 22 14 32 14 C40 14 47 19 50 26 C53 19 60 14 68 14 C78 14 88 22 88 33 C88 48 78 64 50 86 Z" />
        )}
      </svg>
    </div>
  );
}

function ScenarioGlyph({
  title,
  palette,
  large = false,
}: {
  title: string;
  palette: ScopePalette;
  large?: boolean;
}) {
  const initials =
    title
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part.replace(/[^a-zA-Z0-9]/g, "").charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";

  return (
    <div
      aria-hidden
      className={`relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br ring-2 ${palette.glyphFill} ${palette.glyphRing} ${large ? "size-28 shadow-quiet" : "size-12"}`}
    >
      <span aria-hidden className="absolute inset-1 rounded-full ring-1 ring-white/60" />
      <span aria-hidden className="absolute inset-2.5 rounded-full ring-1 ring-aura-hairline" />
      <span
        className={`relative font-display font-semibold tracking-tight text-aura-ink/85 ${large ? "text-display-md" : "text-base"}`}
      >
        {initials}
      </span>
    </div>
  );
}

function NotesEmptyTile({
  title,
  subhead,
  action,
}: {
  title: string;
  subhead: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-10 grid place-items-center rounded-card border border-dashed border-aura-hairline bg-white/40 px-6 py-12 text-center">
      <div className="max-w-md space-y-3">
        <Eyebrow>// archive.empty</Eyebrow>
        <h3 className="font-display text-display-md font-semibold tracking-tight text-aura-ink">
          {title}
        </h3>
        <p className="text-label text-aura-muted">{subhead}</p>
        {action === undefined ? null : <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

function isPlayerVisibleNote(memory: MemoryRecord): boolean {
  if (memory.visibility !== "public") return false;
  return memory.scope === "pair" || memory.scope === "date" || memory.scope === "scenario";
}

const MEMORY_TAG_LABELS: Record<string, string> = {
  date: "date",
  date_summary: "date summary",
  ai_summary: "AI filing",
  fallback_summary: "fallback filing",
  scenario_repeat: "repeat room",
  pair_closure: "closure",
  low: "low risk",
  medium: "medium risk",
  high: "high risk",
};

function visibleMemoryTagLabels(memory: MemoryRecord): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const tag of memory.tags) {
    const label = MEMORY_TAG_LABELS[tag];

    if (label === undefined || seen.has(label)) {
      continue;
    }

    seen.add(label);
    labels.push(label);
  }

  return labels;
}

function sortMemoriesNewestFirst(first: MemoryRecord, second: MemoryRecord): number {
  const firstIsClosure = isPairClosureMemory(first);
  const secondIsClosure = isPairClosureMemory(second);
  if (firstIsClosure !== secondIsClosure) {
    return firstIsClosure ? -1 : 1;
  }
  if (first.createdAt === second.createdAt) {
    return second.importance - first.importance;
  }
  return first.createdAt < second.createdAt ? 1 : -1;
}

function noteCardTitle(
  memory: MemoryRecord,
  pairMembers: Member[],
  scenario: DateScenario | undefined,
): string {
  if (memory.scope === "scenario") {
    return scenario?.title ?? memory.scenarioId ?? "Date plan file";
  }
  return (
    joinPairFirstNames(pairMembers.map((member) => member.firstName)) ??
    memory.pairId ??
    "Pair file"
  );
}

function noteCardSubhead(memory: MemoryRecord, scenario: DateScenario | undefined): string | null {
  if (memory.scope === "scenario") {
    return null;
  }
  if (scenario === undefined) {
    return null;
  }
  return scenario.title;
}

function pairLabel(
  pairId: string,
  memberById: Map<string, Member>,
  pairStateById: Map<string, PairState>,
): string {
  const participantIds = pairStateById.get(pairId)?.participantIds ?? [];
  const names = participantIds
    .map((id) => memberById.get(id)?.firstName)
    .filter((name): name is string => name !== undefined);
  return joinPairFirstNames(names) ?? pairId;
}

function joinPairFirstNames(names: readonly string[]): string | null {
  if (names.length >= 2) return `${names[0]} & ${names[1]}`;
  if (names.length === 1) return names[0];
  return null;
}

function formatNoteTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
