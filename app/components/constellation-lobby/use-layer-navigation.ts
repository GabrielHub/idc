import { useEffect, useRef, type RefObject } from "react";

import { advanceFlythroughLayer, flythroughLayerDirectionFromKey } from "./math";
import type { FlythroughLayer, ViewMode } from "./types";

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

export function useLayerNavigation({
  currentLayer,
  viewMode,
  cathedralScrollRef,
  onLayerChange,
}: {
  currentLayer: FlythroughLayer | undefined;
  viewMode: ViewMode;
  cathedralScrollRef?: RefObject<HTMLDivElement | null>;
  onLayerChange?: (next: FlythroughLayer) => void;
}) {
  const currentLayerRef = useRef<FlythroughLayer | undefined>(currentLayer);
  const lastLayerAdvanceRef = useRef(0);

  useEffect(() => {
    currentLayerRef.current = currentLayer;
  }, [currentLayer]);

  useEffect(() => {
    if (onLayerChange === undefined) return;
    if (viewMode === "archive") return;

    const advanceLayer = (direction: 1 | -1) => {
      const next = advanceFlythroughLayer(currentLayerRef.current ?? 0, direction);
      if (next !== currentLayerRef.current) {
        onLayerChange(next);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      const dominantDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 4) return;
      if (currentLayerRef.current === 2) {
        if (dominantDelta >= 0) return;
        const panel = cathedralScrollRef?.current;
        if (panel !== undefined && panel !== null && panel.scrollTop > 0) return;
      }
      event.preventDefault();
      const now = performance.now();
      if (now - lastLayerAdvanceRef.current < 220) return;
      lastLayerAdvanceRef.current = now;
      advanceLayer(dominantDelta > 0 ? 1 : -1);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditableEventTarget(event.target)) return;
      const direction = flythroughLayerDirectionFromKey(event.code);
      if (direction === null) return;
      event.preventDefault();
      const now = performance.now();
      if (event.repeat && now - lastLayerAdvanceRef.current < 160) return;
      lastLayerAdvanceRef.current = now;
      advanceLayer(direction);
    };

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverscroll = root.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      root.style.overscrollBehavior = previousRootOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [cathedralScrollRef, onLayerChange, viewMode]);
}
