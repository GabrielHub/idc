import { useEffect, useRef, type RefObject } from "react";

import { isLayerEnabled, type LayerNavigationMode } from "./layer-access";
import { advanceFlythroughLayer, flythroughLayerDirectionFromKey } from "./math";
import { SCENARIO_FLYTHROUGH_LAYER, type FlythroughLayer } from "./types";

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

export function useLayerNavigation({
  currentLayer,
  cathedralScrollRef,
  onLayerChange,
  navigationMode = "free",
  layers,
}: {
  currentLayer: FlythroughLayer | undefined;
  cathedralScrollRef?: RefObject<HTMLDivElement | null>;
  onLayerChange?: (next: FlythroughLayer) => void;
  navigationMode?: LayerNavigationMode;
  layers?: readonly FlythroughLayer[];
}) {
  const currentLayerRef = useRef<FlythroughLayer | undefined>(currentLayer);
  const lastLayerAdvanceRef = useRef(0);

  useEffect(() => {
    currentLayerRef.current = currentLayer;
  }, [currentLayer]);

  useEffect(() => {
    if (onLayerChange === undefined) return;

    const advanceLayer = (direction: 1 | -1) => {
      const current = currentLayerRef.current ?? 0;
      let next = advanceFlythroughLayer(current, direction, layers);
      while (next !== current && !isLayerEnabled(next, navigationMode)) {
        const candidate = advanceFlythroughLayer(next, direction, layers);
        if (candidate === next) return;
        next = candidate;
      }
      if (next !== currentLayerRef.current) {
        onLayerChange(next);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      const dominantDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 4) return;
      if (currentLayerRef.current === SCENARIO_FLYTHROUGH_LAYER) {
        const panel = cathedralScrollRef?.current;
        if (dominantDelta >= 0) {
          const current = currentLayerRef.current;
          const next = advanceFlythroughLayer(current, 1, layers);
          const hasNextLayer = next !== current && isLayerEnabled(next, navigationMode);
          const panelCanScrollDown =
            panel !== undefined &&
            panel !== null &&
            panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1;
          if (!hasNextLayer || panelCanScrollDown) return;
        } else if (panel !== undefined && panel !== null && panel.scrollTop > 0) {
          return;
        }
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
  }, [cathedralScrollRef, layers, navigationMode, onLayerChange]);
}
