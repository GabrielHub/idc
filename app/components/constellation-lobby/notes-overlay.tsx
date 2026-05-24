/**
 * Full-viewport aura-liquid-glass overlay that mounts the existing NotesArchive
 * + NotesFilterRail (and PairDossierCard when scoped to a pair). The
 * constellation canvas stays dimmed behind via the overlay's scrim.
 *
 * Entry points:
 *   - TopBar Notes NavShard → opens with `initialPairFocusId === null`
 *   - PairDossierShard click → opens with `initialPairFocusId === pairId`
 *
 * Escape / scrim click close the overlay. Pair archive rendering is NOT mounted
 * — the dropped Files room's pair archive responsibility now lives in the
 * constellation scene itself. ShiftArchive lives in its own overlay surfaced
 * from the File-shift NavShard flow (see shift-archive-overlay.tsx).
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
import { EASE_OUT_QUART, GhostButton } from "../dashboard-atoms";
import { NotesArchive, NotesEmptyTile } from "../notes-cards";
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
            className="absolute inset-0 cursor-pointer bg-aura-ink/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="absolute inset-x-6 inset-y-6 lg:inset-x-12 lg:inset-y-10 flex flex-col overflow-hidden rounded-card aura-liquid-glass"
          >
            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div>
                <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
                  // archive.notes
                </div>
                <h2 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-paper">
                  Case notes
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-4 py-1.5 font-display text-label text-aura-paper"
                aria-label="Close notes overlay"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto bg-aura-paper px-6 py-6 lg:px-10 lg:py-8">
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
                  pairStateById={pairEdgeById}
                  scenarioById={scenarioById}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
