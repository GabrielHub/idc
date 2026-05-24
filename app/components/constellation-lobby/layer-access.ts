import {
  OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER,
  SCENARIO_FLYTHROUGH_LAYER,
  type FlythroughLayer,
} from "./types";

export type LayerNavigationMode = "planning" | "committed" | "free";

export function layerDisabledReason(
  layer: FlythroughLayer,
  mode: LayerNavigationMode,
): string | undefined {
  if (mode === "planning" && layer === SCENARIO_FLYTHROUGH_LAYER) {
    return "Commit a pair to draw tonight's rooms.";
  }
  if (mode === "committed" && layer !== SCENARIO_FLYTHROUGH_LAYER) {
    return "Pair is committed for this shift.";
  }
  return undefined;
}

export function isLayerEnabled(layer: FlythroughLayer, mode: LayerNavigationMode): boolean {
  return layerDisabledReason(layer, mode) === undefined;
}

export function normalizeLayer(layer: FlythroughLayer, mode: LayerNavigationMode): FlythroughLayer {
  if (isLayerEnabled(layer, mode)) return layer;
  if (mode === "planning") return OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER;
  if (mode === "committed") return SCENARIO_FLYTHROUGH_LAYER;
  return layer;
}
