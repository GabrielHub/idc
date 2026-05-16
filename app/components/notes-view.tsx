import { motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  type DateScenario,
  type Member,
  type MemoryRecord,
  type PairState,
  type PlayerKnowledgeRecord,
  type ShiftState,
} from "../domain/game";
import { EASE_OUT_QUART, Eyebrow, GhostButton, pad2 } from "./dashboard-atoms";
import { NotesArchive, NotesEmptyTile } from "./notes-cards";
import { NotesFilterRail, type NotesScopeOption } from "./notes-filter-rail";
import { PairDossierCard } from "./notes-dossier";
import {
  isPlayerVisibleNote,
  PAIR_NOTE_SCOPES,
  pairLabel,
  sortMemoriesNewestFirst,
} from "./notes-format";
import {
  buildPairDossier,
  derivePairFocusInitialFilter,
  type NotesScopeFilter,
  type PairDossier,
} from "./notes-view-helpers";
import { PairBoard } from "./pair-board";
import { ShiftArchive } from "./shift-archive";

export type NotesProps = {
  memories: MemoryRecord[];
  members: Member[];
  pairStates: PairState[];
  scenarios: DateScenario[];
  shifts: ShiftState[];
  pairFocusId?: string | null;
  playerKnowledge?: PlayerKnowledgeRecord[];
  readyClosurePairIds?: ReadonlySet<string>;
};

export function NotesView({
  memories,
  members,
  pairStates,
  scenarios,
  shifts,
  pairFocusId,
  playerKnowledge,
  readyClosurePairIds,
}: NotesProps) {
  const shiftCount = shifts.length;
  const initialFilter = derivePairFocusInitialFilter(pairFocusId);
  const [scopeFilter, setScopeFilter] = useState<NotesScopeFilter>(
    initialFilter?.scopeFilter ?? "all",
  );
  const [selectedPairId, setSelectedPairId] = useState<string | "any">(
    initialFilter?.selectedPairId ?? "any",
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | "any">("any");

  useEffect(() => {
    const next = derivePairFocusInitialFilter(pairFocusId);
    if (next === null) return;
    setScopeFilter(next.scopeFilter);
    setSelectedPairId(next.selectedPairId);
    setSelectedScenarioId("any");
  }, [pairFocusId]);

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

  const pairDossier = useMemo<PairDossier | null>(() => {
    if (pairFocusId === undefined || pairFocusId === null || pairFocusId.length === 0) {
      return null;
    }
    return buildPairDossier({
      pairId: pairFocusId,
      pairState: pairStateById.get(pairFocusId),
      memberById,
      memories,
      playerKnowledge: playerKnowledge ?? [],
      readyClosurePairIds: readyClosurePairIds ?? new Set<string>(),
    });
  }, [pairFocusId, memories, memberById, pairStateById, playerKnowledge, readyClosurePairIds]);

  const visibleMemories = useMemo(
    () => memories.filter(isPlayerVisibleNote).sort(sortMemoriesNewestFirst),
    [memories],
  );

  const pairOptions = useMemo<NotesScopeOption[]>(() => {
    const seen = new Map<string, NotesScopeOption>();
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

  const scenarioOptions = useMemo<NotesScopeOption[]>(() => {
    const seen = new Map<string, NotesScopeOption>();
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
            initialEdgePairId={pairFocusId ?? null}
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

          {pairDossier === null ? null : <PairDossierCard dossier={pairDossier} />}

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

      <ShiftArchive shifts={shifts} members={members} />
    </ViewFrame>
  );
}

function ViewFrame({ children, wide }: { children: ReactNode; wide?: boolean }) {
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
  tooltip: ReactNode;
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
