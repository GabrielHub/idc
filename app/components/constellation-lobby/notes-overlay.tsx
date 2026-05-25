/**
 * Full-viewport aura-liquid-glass overlay that mounts the existing NotesArchive
 * + NotesFilterRail (and PairDossierCard when scoped to a pair). The
 * constellation canvas stays dimmed behind via the overlay's scrim.
 *
 * Entry points:
 *   - Records / Notes opens with `initialPairFocusId === null`
 *   - PairDossierShard click opens with `initialPairFocusId === pairId`
 *
 * Escape / scrim click close the overlay. Pair graph rendering stays in the
 * constellation scene; pair dossier notes render here.
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import type {
  DateScenario,
  Member,
  MemoryRecord,
  PairEdge,
  PlayerKnowledgeRecord,
} from "../../domain/game";
import { AmbientMesh } from "../ambient-mesh";
import { EASE_OUT_QUART } from "../dashboard-atoms";
import { NotesArchive, NotesArchiveResetButton, NotesEmptyTile } from "../notes-cards";
import { NotesFilterRail, type NotesScopeOption } from "../notes-filter-rail";
import { PairDossierCard } from "../notes-dossier";
import {
  isPlayerVisibleNote,
  PAIR_NOTE_SCOPES,
  pairLabel,
  sortMemoriesNewestFirst,
} from "../notes-format";
import {
  buildPairDossier,
  derivePairFocusInitialFilter,
  type NotesScopeFilter,
  type PairDossier,
} from "../notes-view-helpers";

export type NotesOverlayProps = {
  open: boolean;
  memories: readonly MemoryRecord[];
  members: readonly Member[];
  pairEdges: readonly PairEdge[];
  scenarios: readonly DateScenario[];
  playerKnowledge: readonly PlayerKnowledgeRecord[];
  readyClosurePairIds: ReadonlySet<string>;
  initialPairFocusId: string | null;
  onClose: () => void;
};

export function NotesOverlay({
  open,
  memories,
  members,
  pairEdges,
  scenarios,
  playerKnowledge,
  readyClosurePairIds,
  initialPairFocusId,
  onClose,
}: NotesOverlayProps) {
  const initialFilter = useMemo(
    () => derivePairFocusInitialFilter(initialPairFocusId),
    [initialPairFocusId],
  );
  const [scopeFilter, setScopeFilter] = useState<NotesScopeFilter>(
    initialFilter?.scopeFilter ?? "all",
  );
  const [selectedPairId, setSelectedPairId] = useState<string | "any">(
    initialFilter?.selectedPairId ?? "any",
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | "any">("any");

  // Re-seed filters when the overlay opens with a new initial pair focus.
  useEffect(() => {
    if (!open) return;
    const next = derivePairFocusInitialFilter(initialPairFocusId);
    if (next === null) {
      setScopeFilter("all");
      setSelectedPairId("any");
      setSelectedScenarioId("any");
      return;
    }
    setScopeFilter(next.scopeFilter);
    setSelectedPairId(next.selectedPairId);
    setSelectedScenarioId("any");
  }, [open, initialPairFocusId]);

  // Escape closes the overlay.
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const pairEdgeById = useMemo(() => new Map(pairEdges.map((p) => [p.id, p])), [pairEdges]);
  const scenarioById = useMemo(() => new Map(scenarios.map((s) => [s.id, s])), [scenarios]);

  const pairDossier = useMemo<PairDossier | null>(() => {
    if (initialPairFocusId === null || initialPairFocusId.length === 0) return null;
    return buildPairDossier({
      pairId: initialPairFocusId,
      pairState: pairEdgeById.get(initialPairFocusId),
      memberById,
      memories,
      playerKnowledge,
      readyClosurePairIds,
    });
  }, [
    initialPairFocusId,
    memories,
    memberById,
    pairEdgeById,
    playerKnowledge,
    readyClosurePairIds,
  ]);

  const visibleMemories = useMemo(
    () => memories.filter(isPlayerVisibleNote).slice().sort(sortMemoriesNewestFirst),
    [memories],
  );

  const pairOptions = useMemo<NotesScopeOption[]>(() => {
    const seen = new Map<string, NotesScopeOption>();
    for (const memory of visibleMemories) {
      if (!PAIR_NOTE_SCOPES.has(memory.scope) || memory.pairId === undefined) continue;
      if (seen.has(memory.pairId)) continue;
      seen.set(memory.pairId, {
        id: memory.pairId,
        label: pairLabel(memory.pairId, memberById, pairEdgeById),
      });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleMemories, memberById, pairEdgeById]);

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
    <AnimatePresence>
      {open ? (
        <motion.div
          key="notes-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Case notes archive"
        >
          {/* Scrim — dims the constellation canvas behind. */}
          <button
            type="button"
            aria-label="Close notes overlay"
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-[#07041a]/65 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="absolute inset-x-6 inset-y-6 isolate flex flex-col overflow-hidden rounded-card bg-[#07041a] text-aura-paper lg:inset-x-12 lg:inset-y-10"
          >
            <AmbientMesh containment="absolute" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close notes overlay"
              className="aura-liquid-glass aura-liquid-glass-hover absolute right-5 top-5 z-20 cursor-pointer rounded-full px-4 py-1.5 font-display text-label text-aura-paper"
            >
              Close
            </button>

            <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-16 pt-14 lg:px-12 lg:pt-16">
              <header className="mx-auto max-w-[88rem] text-center">
                <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
                  // archive.notes
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-aura-paper lg:text-display-md">
                  Case notes
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-body text-white/70">
                  Cupid files pair and scenario memories after dates wrap. Filter the archive, scan
                  what is on file, and lean on it when planning the next shift.
                </p>
              </header>

              <div className="mx-auto mt-10 max-w-[88rem]">
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
                    action={<NotesArchiveResetButton onClick={clearNotesFilters} />}
                  />
                ) : (
                  <NotesArchive
                    memories={filteredMemories}
                    memberById={memberById}
                    pairStateById={pairEdgeById}
                    scenarioById={scenarioById}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
