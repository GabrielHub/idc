import { useEffect, useRef, useState, type Ref } from "react";
import { motion } from "motion/react";

import type { FlythroughLayer } from "./types";

const FLYTHROUGH_LAYER_LABELS: Record<FlythroughLayer, string> = {
  0: "Focused cases",
  1: "Roster",
  2: "Date cathedral",
};

export function LayerIndicator({
  currentLayer,
  onLayerSelect,
  containerRef,
  layerRefs,
}: {
  currentLayer: FlythroughLayer;
  onLayerSelect: (layer: FlythroughLayer) => void;
  containerRef?: Ref<HTMLDivElement>;
  layerRefs?: Partial<Record<FlythroughLayer, Ref<HTMLButtonElement>>>;
}) {
  const layers: FlythroughLayer[] = [0, 1, 2];
  const [isHovering, setIsHovering] = useState(false);
  const [showOnLayerChange, setShowOnLayerChange] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setShowOnLayerChange(true);
    const id = window.setTimeout(() => setShowOnLayerChange(false), 1600);
    return () => window.clearTimeout(id);
  }, [currentLayer]);

  const expanded = isHovering || showOnLayerChange;

  return (
    <div ref={containerRef} className="pointer-events-none absolute bottom-6 left-6 z-30">
      <div
        className="pointer-events-auto flex flex-col items-start gap-1.5"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {layers.map((layer) => {
          const active = layer === currentLayer;
          const label = FLYTHROUGH_LAYER_LABELS[layer];
          return (
            <button
              key={layer}
              ref={layerRefs?.[layer]}
              type="button"
              onClick={() => onLayerSelect(layer)}
              aria-label={`Jump to layer ${layer + 1}: ${label}`}
              className="aura-liquid-glass flex cursor-pointer items-center rounded-full px-2 py-2"
            >
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full transition-colors ${
                  active ? "bg-aura-rose shadow-[0_0_8px_rgba(244,63,94,0.7)]" : "bg-white/55"
                }`}
              />
              <motion.span
                initial={false}
                animate={{
                  width: expanded ? "auto" : 0,
                  opacity: expanded ? 1 : 0,
                  marginLeft: expanded ? 8 : 0,
                }}
                transition={{
                  duration: 0.26,
                  ease: [0.22, 1, 0.36, 1],
                  delay: expanded ? layer * 0.06 : (layers.length - 1 - layer) * 0.04,
                }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span
                  className={`pr-0.5 font-mono text-micro uppercase leading-none tracking-[0.18em] ${
                    active ? "text-aura-paper" : "text-white/75"
                  }`}
                >
                  {label}
                </span>
              </motion.span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
