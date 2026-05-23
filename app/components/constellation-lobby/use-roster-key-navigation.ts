import { useEffect } from "react";

import type { FlythroughLayer, RosterSubview, ViewMode } from "./types";

export function useRosterKeyNavigation({
  viewMode,
  isOverlayOpen,
  rosterSubview,
  eligiblePartnerIds,
  offTonightIds,
  activeStarId,
  currentLayer,
  onLayerChange,
  onActiveStarChange,
}: {
  viewMode: ViewMode;
  isOverlayOpen: boolean;
  rosterSubview: RosterSubview;
  eligiblePartnerIds: ReadonlySet<string>;
  offTonightIds: ReadonlySet<string>;
  activeStarId: string | null;
  currentLayer: FlythroughLayer;
  onLayerChange: (next: FlythroughLayer) => void;
  onActiveStarChange: (next: string | null) => void;
}) {
  useEffect(() => {
    if (viewMode === "archive") return;
    if (isOverlayOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      const direction = directionFromKey(event.key);
      if (direction === null) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.closest("input, textarea, select, [contenteditable='true']") !== null) {
          return;
        }
      }
      const cohort =
        rosterSubview === "off_tonight"
          ? Array.from(offTonightIds)
          : Array.from(eligiblePartnerIds);
      if (cohort.length === 0) return;
      event.preventDefault();
      if (currentLayer !== 1) onLayerChange(1);
      const currentIdx = activeStarId === null ? -1 : cohort.indexOf(activeStarId);
      const nextIdx =
        currentIdx === -1
          ? direction === 1
            ? 0
            : cohort.length - 1
          : (currentIdx + direction + cohort.length) % cohort.length;
      onActiveStarChange(cohort[nextIdx] ?? null);
    };
    window.addEventListener("keydown", handleKey, { capture: true });
    return () => window.removeEventListener("keydown", handleKey, { capture: true });
  }, [
    viewMode,
    isOverlayOpen,
    rosterSubview,
    eligiblePartnerIds,
    offTonightIds,
    activeStarId,
    currentLayer,
    onLayerChange,
    onActiveStarChange,
  ]);
}

function directionFromKey(key: string): 1 | -1 | null {
  if (key === "ArrowRight" || key === "ArrowDown") return 1;
  if (key === "ArrowLeft" || key === "ArrowUp") return -1;
  return null;
}
