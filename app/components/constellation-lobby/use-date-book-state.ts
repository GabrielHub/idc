import { useCallback, useEffect, useState, type Dispatch } from "react";

import type { LobbyAction } from "./lobby-reducer";
import type { CathedralMode, RiskFilter, SortMode } from "./cathedral";

/**
 * Owns the cathedral / date book panel UI state that lives outside the planning
 * reducer: which door is peeked open, which door is hover-bloomed, and the
 * library filter controls.
 *
 * Also owns the side-effect logic that keeps the date book coherent:
 *
 *   - closes the deck/library back to auto when ESC fires AND no other overlay
 *     owns the channel — the overlay-open guard prevents racing the case-file,
 *     notes, and closure panels;
 *   - cycles auto → deck → library → auto on the Date book pill toggle;
 *   - resets `expandedDoorId` and exits deck/library when `closeDateBook` is
 *     called via the panel's Close button or the ESC handler.
 *
 * The "drop a stale selectedScenarioId when the draw rotates" effect lives in
 * the orchestrator because it needs `drawnLobbyScenarios` from useCathedralModel,
 * which itself reads library/expandedDoor state out of this hook — pulling that
 * effect down would create a circular dep.
 *
 * `scenarioMode` is read from the planning reducer because the cathedral mode
 * lives there; this hook coordinates the panel's transient state around it.
 */
export function useDateBookState({
  scenarioMode,
  dispatch,
  isOverlayOpen,
  disabled,
}: {
  scenarioMode: CathedralMode;
  dispatch: Dispatch<LobbyAction>;
  /**
   * True when any modal/case-file owns the ESC channel. Suppresses the
   * date-book ESC handler so the other overlay handles ESC first.
   */
  isOverlayOpen: boolean;
  /**
   * Blocks the Date book pill toggle from opening when a booking is active
   * (the deck/library can't be edited mid-date). The Close path stays open
   * so a panel mid-open still has a way out.
   */
  disabled: boolean;
}) {
  const [expandedDoorId, setExpandedDoorId] = useState<string | null>(null);
  const [hoveredDoorId, setHoveredDoorId] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryRiskFilter, setLibraryRiskFilter] = useState<RiskFilter>("any");
  const [librarySort, setLibrarySort] = useState<SortMode>("alpha");

  /**
   * Close the date book — drop deck/library mode back to auto so the
   * cathedral reads as tonight's draw again. Drives the panel header's
   * Close button, the Escape key, and the canvas-area click-outside. In
   * auto mode this is a no-op so a stray ESC or canvas click never warps
   * the camera away from the player's current focus/roster slab.
   */
  const closeDateBook = useCallback(() => {
    if (scenarioMode === "auto") return;
    setExpandedDoorId(null);
    dispatch({ type: "closeDateBook" });
  }, [dispatch, scenarioMode]);

  /**
   * Date book pill toggle. Three-mode cycle: auto → deck → library → auto.
   * The reducer drives `currentLayer` through each transition; this hook
   * clears the parent-owned `expandedDoorId` so a peek doesn't survive the
   * cycle.
   */
  const handleDateBookNavToggle = useCallback(() => {
    if (disabled) return;
    setExpandedDoorId(null);
    if (scenarioMode === "auto") {
      dispatch({ type: "openDateBook", mode: "deck" });
    } else if (scenarioMode === "deck") {
      dispatch({ type: "openDateBook", mode: "library" });
    } else {
      dispatch({ type: "closeDateBook" });
    }
  }, [disabled, dispatch, scenarioMode]);

  /**
   * Header tab switch inside the open panel — drop the peek and tell the
   * reducer which mode the player wants next. Wraps the dispatch so the
   * orchestrator doesn't repeat the expandedDoorId reset at every call site.
   */
  const setScenarioMode = useCallback(
    (mode: "deck" | "library") => {
      setExpandedDoorId(null);
      dispatch({ type: "openDateBook", mode });
    },
    [dispatch],
  );

  // Escape closes the date book back to auto when no other overlay owns the
  // ESC channel.
  useEffect(() => {
    if (scenarioMode === "auto") return;
    if (isOverlayOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDateBook();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [scenarioMode, isOverlayOpen, closeDateBook]);

  return {
    expandedDoorId,
    setExpandedDoorId,
    hoveredDoorId,
    setHoveredDoorId,
    librarySearch,
    setLibrarySearch,
    libraryRiskFilter,
    setLibraryRiskFilter,
    librarySort,
    setLibrarySort,
    closeDateBook,
    handleDateBookNavToggle,
    setScenarioMode,
  };
}
