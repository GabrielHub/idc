import { useCallback, useEffect, useState } from "react";

import type { ArchiveSelection, ViewMode } from "./types";

/**
 * Owns archive view-mode state and the guard that clears `archiveSelection`
 * whenever the player flips back to tonight so re-entry reads as a fresh
 * look-around.
 *
 * The orchestrator owns the "no filed-note pairs left, exit archive" guard
 * because that one depends on archive-graph-derived data (edge count) and
 * naturally lives next to the useArchiveView call.
 */
export function useArchiveMode() {
  const [viewMode, setViewMode] = useState<ViewMode>("tonight");
  const [archiveSelection, setArchiveSelection] = useState<ArchiveSelection>(null);

  useEffect(() => {
    if (viewMode === "tonight") setArchiveSelection(null);
  }, [viewMode]);

  const toggleArchive = useCallback(() => {
    setViewMode((current) => (current === "archive" ? "tonight" : "archive"));
  }, []);
  const clearArchiveSelection = useCallback(() => setArchiveSelection(null), []);

  return {
    viewMode,
    archiveSelection,
    setArchiveSelection,
    toggleArchive,
    clearArchiveSelection,
  };
}
