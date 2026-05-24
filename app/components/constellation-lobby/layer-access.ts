import type { FlythroughLayer } from "./types";

export type LayerNavigationMode = "planning" | "committed" | "free";

export function layerDisabledReason(
  layer: FlythroughLayer,
  mode: LayerNavigationMode,
): string | undefined {
  if (mode === "planning" && layer === 2) {
    return "Commit a pair to draw tonight's rooms.";
  }
  if (mode === "committed" && layer !== 2) {
    return "Pair is committed for this shift.";
  }
  return undefined;
}

export function isLayerEnabled(layer: FlythroughLayer, mode: LayerNavigationMode): boolean {
  return layerDisabledReason(layer, mode) === undefined;
}

export function normalizeLayer(layer: FlythroughLayer, mode: LayerNavigationMode): FlythroughLayer {
  if (isLayerEnabled(layer, mode)) return layer;
  if (mode === "planning") return 1;
  if (mode === "committed") return 2;
  return layer;
}
