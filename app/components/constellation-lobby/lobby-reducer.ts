/**
 * Lobby planning reducer. Collapses the booking-selection state (focus,
 * partner, intent, scenario), the cathedral mode (auto / deck / library),
 * and the flythrough layer into a single typed machine.
 *
 * What the reducer replaces:
 *
 *   - 6 `useState`s plus a `useRef` for previous-pair-key in the old
 *     `useLobbyPlanningState` hook.
 *   - 3 sync `useEffect`s that watched `activeBooking` and pair changes to
 *     reset intent / scenario / partner mid-flight.
 *   - 1 auto-advance `useEffect` (`focus_selected` → layer 1,
 *     `committed_pair` → layer 2).
 *   - 1 layer-normalize `useEffect` driven by navigationMode changes.
 *   - The ad-hoc `clearBookingSelection`, `handleDateBookNavToggle`, and
 *     `closeDateBook` helpers — every transition lives in the reducer now.
 *
 * Out of scope for this reducer (kept as separate state in the parent):
 *
 *   - viewMode + archiveSelection — orthogonal axis to the planning flow.
 *   - expandedDoorId — cathedral peek, transient.
 *   - filterState / openCaseMemberId / activeStarId / hoveredDoorId etc. —
 *     local UI state that doesn't interact with the booking transitions.
 *   - lobbyMode / reselect-draft — its own sub-app via `useLobbyReselect`.
 */

import { useEffect, useMemo, useReducer, type Dispatch } from "react";

import type { MatchmakingIntent, ShiftState } from "../../domain/game";
import { makePairId } from "../../services/game-seed";
import type { CathedralMode } from "./cathedral";
import { isLayerEnabled, type LayerNavigationMode } from "./layer-access";
import type { FlythroughLayer, LobbyState } from "./types";

type ActiveBooking = NonNullable<ShiftState["activeBooking"]>;

/**
 * Phase encodes the four planning states with their data dependencies
 * inlined. The old `lobbyState` enum was a discriminator derived from four
 * nullable fields; this makes the data dependencies the type system can
 * verify.
 */
export type LobbyPhase =
  | { kind: "idle" }
  | { kind: "focus_selected"; focusId: string }
  | { kind: "partner_selected"; focusId: string; partnerId: string }
  | { kind: "committed_pair"; focusId: string; partnerId: string }
  | { kind: "scenario_chosen"; focusId: string; partnerId: string; scenarioId: string };

export type LobbyReducerState = {
  phase: LobbyPhase;
  matchmakingIntent: MatchmakingIntent | null;
  scenarioMode: CathedralMode;
  currentLayer: FlythroughLayer;
};

export type LobbyAction =
  | { type: "syncBooking"; booking: ActiveBooking | null; focusedMemberIds: readonly string[] }
  | { type: "selectFocus"; memberId: string }
  | { type: "selectPartner"; memberId: string }
  | { type: "setIntent"; intent: MatchmakingIntent | null }
  | { type: "selectScenario"; scenarioId: string | null }
  | { type: "cancelPair"; dropFocus?: boolean }
  | { type: "selectLayer"; layer: FlythroughLayer; navigationMode: LayerNavigationMode }
  | { type: "openDateBook"; mode: "deck" | "library" }
  | { type: "closeDateBook" };

export function initialLobbyState(input: {
  activeBooking: ActiveBooking | null;
}): LobbyReducerState {
  const { activeBooking } = input;
  if (activeBooking === null) {
    return {
      phase: { kind: "idle" },
      matchmakingIntent: null,
      scenarioMode: "auto",
      currentLayer: 0,
    };
  }
  const focusId = activeBooking.focusMemberId;
  const partnerId = activeBooking.participantIds[1] ?? null;
  if (partnerId === null) {
    return {
      phase: { kind: "focus_selected", focusId },
      matchmakingIntent: activeBooking.matchmakingIntent ?? null,
      scenarioMode: "auto",
      currentLayer: 2,
    };
  }
  return {
    phase: { kind: "committed_pair", focusId, partnerId },
    matchmakingIntent: activeBooking.matchmakingIntent ?? null,
    scenarioMode: "auto",
    currentLayer: 2,
  };
}

export function lobbyReducer(state: LobbyReducerState, action: LobbyAction): LobbyReducerState {
  switch (action.type) {
    case "syncBooking":
      return syncBooking(state, action.booking, action.focusedMemberIds);
    case "selectFocus":
      return selectFocus(state, action.memberId);
    case "selectPartner":
      return selectPartner(state, action.memberId);
    case "setIntent":
      // Intent has no phase implications; preserve everything else.
      return { ...state, matchmakingIntent: action.intent };
    case "selectScenario":
      return selectScenario(state, action.scenarioId);
    case "cancelPair":
      return cancelPair(state, action.dropFocus ?? false);
    case "selectLayer":
      return selectLayer(state, action.layer, action.navigationMode);
    case "openDateBook":
      return { ...state, scenarioMode: action.mode, currentLayer: 2 };
    case "closeDateBook":
      // Choose the layer to return to when leaving the cathedral. Layer 0
      // is the focus picker, 1 is the roster (where partners are picked),
      // and 2 is the cathedral itself. Without this mapping, focus_selected
      // / partner_selected players would land on layer 0 even though their
      // pair was being assembled on layer 1.
      if (state.scenarioMode === "auto") return state;
      return { ...state, scenarioMode: "auto", currentLayer: cathedralExitLayer(state.phase) };
  }
}

function syncBooking(
  state: LobbyReducerState,
  booking: ActiveBooking | null,
  focusedMemberIds: readonly string[],
): LobbyReducerState {
  if (booking !== null) {
    const focusId = booking.focusMemberId;
    const partnerId = booking.participantIds[1];
    if (partnerId === undefined) return state;
    // Preserve scenario_chosen if it already matches the booking — the
    // player picked a scenario, we don't want to roll back to committed_pair
    // when a save round-trip re-emits the same activeBooking.
    if (
      state.phase.kind === "scenario_chosen" &&
      state.phase.focusId === focusId &&
      state.phase.partnerId === partnerId
    ) {
      return state;
    }
    return {
      phase: { kind: "committed_pair", focusId, partnerId },
      matchmakingIntent: booking.matchmakingIntent ?? null,
      scenarioMode: "auto",
      currentLayer: 2,
    };
  }
  // Booking is null. If we were on a committed phase, fall back depending
  // on whether the focus still exists on the focused roster.
  if (state.phase.kind === "committed_pair" || state.phase.kind === "scenario_chosen") {
    const focusId = state.phase.focusId;
    const phase: LobbyPhase = focusedMemberIds.includes(focusId)
      ? { kind: "focus_selected", focusId }
      : { kind: "idle" };
    return {
      phase,
      matchmakingIntent: null,
      scenarioMode: "auto",
      currentLayer: phase.kind === "idle" ? 0 : 1,
    };
  }
  // Drop focus if it left the focused roster between renders.
  if (state.phase.kind === "focus_selected" && !focusedMemberIds.includes(state.phase.focusId)) {
    return { ...state, phase: { kind: "idle" }, currentLayer: 0 };
  }
  if (state.phase.kind === "partner_selected" && !focusedMemberIds.includes(state.phase.focusId)) {
    return {
      ...state,
      phase: { kind: "idle" },
      matchmakingIntent: null,
      currentLayer: 0,
    };
  }
  return state;
}

function selectFocus(state: LobbyReducerState, memberId: string): LobbyReducerState {
  // Auto-advance to layer 1 (the roster slab) so the partner picker opens.
  return {
    ...state,
    phase: { kind: "focus_selected", focusId: memberId },
    currentLayer: 1,
  };
}

function selectPartner(state: LobbyReducerState, memberId: string): LobbyReducerState {
  if (state.phase.kind === "idle") return state;
  // Picking a different partner mid-flight resets intent + scenario (the old
  // hook tracked this via previousPairSelectionKeyRef). Same-pair re-selects
  // are idempotent.
  const focusId =
    state.phase.kind === "focus_selected" ||
    state.phase.kind === "partner_selected" ||
    state.phase.kind === "committed_pair" ||
    state.phase.kind === "scenario_chosen"
      ? state.phase.focusId
      : null;
  if (focusId === null) return state;
  const previousPartnerId =
    state.phase.kind === "partner_selected" ||
    state.phase.kind === "committed_pair" ||
    state.phase.kind === "scenario_chosen"
      ? state.phase.partnerId
      : null;
  const pairChanged =
    previousPartnerId === null ||
    makePairId(focusId, previousPartnerId) !== makePairId(focusId, memberId);
  return {
    ...state,
    phase: { kind: "partner_selected", focusId, partnerId: memberId },
    matchmakingIntent: pairChanged ? null : state.matchmakingIntent,
  };
}

function selectScenario(state: LobbyReducerState, scenarioId: string | null): LobbyReducerState {
  if (state.phase.kind !== "committed_pair" && state.phase.kind !== "scenario_chosen") {
    return state;
  }
  if (scenarioId === null) {
    return state.phase.kind === "scenario_chosen"
      ? {
          ...state,
          phase: {
            kind: "committed_pair",
            focusId: state.phase.focusId,
            partnerId: state.phase.partnerId,
          },
        }
      : state;
  }
  return {
    ...state,
    phase: {
      kind: "scenario_chosen",
      focusId: state.phase.focusId,
      partnerId: state.phase.partnerId,
      scenarioId,
    },
  };
}

function cancelPair(state: LobbyReducerState, dropFocus: boolean): LobbyReducerState {
  // Cancel collapses to focus_selected (preserving the focus) or idle (when
  // dropFocus is true). Always returns to scenarioMode "auto" so a cancel
  // mid-deck-edit also exits the deck. Layer collapses to 0 when focus is
  // dropped; otherwise we land on layer 1 where the partner picker lives.
  if (dropFocus) {
    return {
      phase: { kind: "idle" },
      matchmakingIntent: null,
      scenarioMode: "auto",
      currentLayer: 0,
    };
  }
  if (state.phase.kind === "idle") {
    return { ...state, scenarioMode: "auto" };
  }
  const focusId =
    state.phase.kind === "focus_selected" ||
    state.phase.kind === "partner_selected" ||
    state.phase.kind === "committed_pair" ||
    state.phase.kind === "scenario_chosen"
      ? state.phase.focusId
      : null;
  if (focusId === null) return state;
  return {
    phase: { kind: "focus_selected", focusId },
    matchmakingIntent: null,
    scenarioMode: "auto",
    currentLayer: 1,
  };
}

function selectLayer(
  state: LobbyReducerState,
  layer: FlythroughLayer,
  navigationMode: LayerNavigationMode,
): LobbyReducerState {
  if (!isLayerEnabled(layer, navigationMode)) return state;
  return { ...state, currentLayer: layer };
}

function cathedralExitLayer(phase: LobbyPhase): FlythroughLayer {
  if (phase.kind === "committed_pair" || phase.kind === "scenario_chosen") return 2;
  if (phase.kind === "focus_selected" || phase.kind === "partner_selected") return 1;
  return 0;
}

/**
 * Public projection of the reducer state. Mirrors the field surface the old
 * `useLobbyPlanningState` returned so callers can ignore the phase ADT.
 */
export type LobbyProjection = {
  focusId: string | null;
  partnerId: string | null;
  matchmakingIntent: MatchmakingIntent | null;
  selectedScenarioId: string | null;
  lobbyState: LobbyState;
  scenarioMode: CathedralMode;
  currentLayer: FlythroughLayer;
};

export function projectLobby(state: LobbyReducerState): LobbyProjection {
  return {
    focusId:
      state.phase.kind === "focus_selected" ||
      state.phase.kind === "partner_selected" ||
      state.phase.kind === "committed_pair" ||
      state.phase.kind === "scenario_chosen"
        ? state.phase.focusId
        : null,
    partnerId:
      state.phase.kind === "partner_selected" ||
      state.phase.kind === "committed_pair" ||
      state.phase.kind === "scenario_chosen"
        ? state.phase.partnerId
        : null,
    matchmakingIntent: state.matchmakingIntent,
    selectedScenarioId: state.phase.kind === "scenario_chosen" ? state.phase.scenarioId : null,
    lobbyState: lobbyStateForPhase(state.phase),
    scenarioMode: state.scenarioMode,
    currentLayer: state.currentLayer,
  };
}

function lobbyStateForPhase(phase: LobbyPhase): LobbyState {
  switch (phase.kind) {
    case "idle":
      return "idle";
    case "focus_selected":
      return "focus_selected";
    case "partner_selected":
      return "partner_selected";
    case "committed_pair":
      return "committed_pair";
    case "scenario_chosen":
      return "scenario_chosen";
  }
}

export function useLobbyState(input: {
  activeBooking: ActiveBooking | null;
  focusedMemberIds: readonly string[];
}): { state: LobbyReducerState; projection: LobbyProjection; dispatch: Dispatch<LobbyAction> } {
  const { activeBooking, focusedMemberIds } = input;
  const [state, dispatch] = useReducer(lobbyReducer, { activeBooking }, initialLobbyState);
  // Sync from external commits / focus mutations. Bundling both into one
  // syncBooking action keeps the dependency clear: the reducer always sees
  // the same activeBooking + focusedMemberIds it would have observed via
  // useEffect deps.
  useEffect(() => {
    dispatch({ type: "syncBooking", booking: activeBooking, focusedMemberIds });
  }, [activeBooking, focusedMemberIds]);
  const projection = useMemo(() => projectLobby(state), [state]);
  return { state, projection, dispatch };
}
