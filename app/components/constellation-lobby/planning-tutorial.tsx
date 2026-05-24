import { useEffect, useRef, type RefObject } from "react";

import type { GameSave, MatchmakingIntent, Member, ShiftState } from "../../domain/game";
import { isMemberInCooldown } from "../../services/shift-planning";
import { tutorialCopy, type TutorialCopyId } from "../../services/tutorial-copy";
import { useTutorialStep, type TutorialStepHandle } from "../../services/tutorial";
import {
  TutorialCoachMark,
  TutorialPulseRing,
  TutorialSpotlight,
  type CoachMarkFixedPosition,
} from "../tutorial";
import type { CathedralMode } from "./cathedral";
import type { FlythroughLayer, ViewMode } from "./types";

// Layer-anchored steps (focus, partner) pin to a top-right corner instead of
// floating beside the bottom-left LayerIndicator. The indicator sits inside
// the constellation field, and the default `placement="right"` popup landed
// on top of focused star portraits. The pulse ring still highlights the real
// pill; only the explanatory card moves to clear space.
const LAYER_COACH_FIXED_POSITION: CoachMarkFixedPosition = { right: 24, top: 96 };

type AnchorKey =
  | "layerIndicatorRef"
  | "layerFocusRef"
  | "layerRosterRef"
  | "layerCathedralRef"
  | "sideRailRef"
  | "intentRailRef"
  | "cathedralPanelRef"
  | "beginButtonRef"
  | "fileShiftButtonRef"
  | "contextualRailRef"
  | "dateBookPillRef"
  | "closureCalloutRef";

type ButtonAnchor =
  | "layerFocusRef"
  | "layerRosterRef"
  | "layerCathedralRef"
  | "beginButtonRef"
  | "fileShiftButtonRef"
  | "dateBookPillRef";

const BUTTON_ANCHORS = new Set<AnchorKey>([
  "layerFocusRef",
  "layerRosterRef",
  "layerCathedralRef",
  "beginButtonRef",
  "fileShiftButtonRef",
  "dateBookPillRef",
]);

function isButtonAnchor(key: AnchorKey): key is ButtonAnchor {
  return BUTTON_ANCHORS.has(key);
}

export type PlanningTutorialRefs = {
  layerIndicatorRef: RefObject<HTMLDivElement | null>;
  layerFocusRef: RefObject<HTMLButtonElement | null>;
  layerRosterRef: RefObject<HTMLButtonElement | null>;
  layerCathedralRef: RefObject<HTMLButtonElement | null>;
  sideRailRef: RefObject<HTMLDivElement | null>;
  intentRailRef: RefObject<HTMLDivElement | null>;
  cathedralPanelRef: RefObject<HTMLDivElement | null>;
  beginButtonRef: RefObject<HTMLButtonElement | null>;
  fileShiftButtonRef: RefObject<HTMLButtonElement | null>;
  contextualRailRef: RefObject<HTMLDivElement | null>;
  dateBookPillRef: RefObject<HTMLButtonElement | null>;
  closureCalloutRef: RefObject<HTMLDivElement | null>;
};

/**
 * Per-step render config. The overlay layer uses this to compose pulse rings,
 * spotlights, and coach marks consistently without each step rolling its own
 * JSX.
 */
type StepRender = {
  anchor: AnchorKey;
  placement: "right" | "left" | "top" | "bottom";
  fixedPosition?: CoachMarkFixedPosition;
  pulseRing?: { padding: number; radius: number; tone?: "amber" };
  spotlight?: { padding: number; radius: number };
  hasPrimary?: boolean;
  /** When this id is also active, this step yields. */
  suppressIfActive?: TutorialCopyId;
};

/**
 * Gating context shared by every step's `shouldActivate` and
 * `autoCompleteWhen` predicate. Derived once per render so the predicates can
 * stay tiny.
 */
type PlanningContext = {
  inAutoMode: boolean;
  focusId: string | null;
  partnerId: string | null;
  activeBooking: ShiftState["activeBooking"] | null;
  matchmakingIntent: MatchmakingIntent | null;
  selectedScenarioId: string | null;
  currentLayer: FlythroughLayer;
  bookingLocked: boolean;
  deckRepairBlocked: boolean;
  dateBookEditingUnlocked: boolean;
  readyClosurePairCount: number;
  fileShiftReady: boolean;
  shiftActive: boolean;
  focusedCooling: boolean;
};

type PlanningStepConfig = {
  id: TutorialCopyId;
  category: "required" | "lazy";
  shouldActivate: (ctx: PlanningContext) => boolean;
  /** Optional auto-completion predicate — fires `complete()` when true. */
  autoCompleteWhen?: (ctx: PlanningContext) => boolean;
  render: StepRender;
};

/**
 * The whole planning tutorial as data. Adding a new step is: append to this
 * array (with copy in `TUTORIAL_COPY`) and add a ref to the refs bag. The
 * hook and the renderer pick up the new step automatically.
 *
 * Required-path ordering is the safety net for transient overlaps: the
 * renderer takes the first active "required" step and dormant the rest.
 */
const PLANNING_STEPS: readonly PlanningStepConfig[] = [
  {
    id: "planning.layer-nav",
    category: "required",
    shouldActivate: (c) => c.focusId === null && c.activeBooking === null && c.inAutoMode,
    render: {
      anchor: "layerIndicatorRef",
      placement: "right",
      fixedPosition: LAYER_COACH_FIXED_POSITION,
      pulseRing: { padding: 10, radius: 28 },
      hasPrimary: true,
    },
  },
  {
    id: "planning.focus",
    category: "required",
    shouldActivate: (c) =>
      c.focusId === null &&
      c.inAutoMode &&
      // Defer to layer-nav until it completes — focus is the next step on the
      // required path. The original hook chained on `layerNavStep.done`, but
      // since the renderer's `requiredOverlays.find(Boolean)` only ever shows
      // one card at a time, this gate is functionally equivalent.
      true,
    render: {
      anchor: "layerFocusRef",
      placement: "right",
      fixedPosition: LAYER_COACH_FIXED_POSITION,
      pulseRing: { padding: 6, radius: 999 },
    },
  },
  {
    id: "planning.partner",
    category: "required",
    shouldActivate: (c) => c.focusId !== null && c.partnerId === null && c.inAutoMode,
    render: {
      anchor: "layerRosterRef",
      placement: "right",
      fixedPosition: LAYER_COACH_FIXED_POSITION,
      pulseRing: { padding: 6, radius: 999 },
    },
  },
  {
    id: "planning.intent",
    category: "required",
    shouldActivate: (c) =>
      c.focusId !== null && c.partnerId !== null && c.activeBooking === null && c.inAutoMode,
    // Intent is optional — auto-complete the moment the player files any
    // intent (so we don't tail them with "pick an intent" copy) or moves on
    // to picking the room. The coach mark teaches the rail; using it is
    // their call.
    autoCompleteWhen: (c) =>
      c.matchmakingIntent !== null || c.currentLayer === 2 || c.selectedScenarioId !== null,
    render: {
      anchor: "intentRailRef",
      placement: "top",
      hasPrimary: true,
    },
  },
  {
    id: "planning.commit",
    category: "required",
    shouldActivate: (c) =>
      c.focusId !== null &&
      c.partnerId !== null &&
      c.activeBooking === null &&
      c.currentLayer < 2 &&
      c.inAutoMode,
    autoCompleteWhen: (c) => c.currentLayer === 2 || c.selectedScenarioId !== null,
    render: {
      anchor: "sideRailRef",
      placement: "left",
      hasPrimary: true,
    },
  },
  {
    id: "planning.scenario",
    category: "required",
    // Gate on inAutoMode like every sibling planning step. Without it the
    // coach-mark fires over the deck/library cathedral too, where library
    // clicks open the detail overlay for adding to the deck rather than
    // picking tonight's scenario — the copy "open one to lock it" no longer
    // matches what the cards actually do.
    shouldActivate: (c) =>
      c.partnerId !== null &&
      c.activeBooking !== null &&
      c.selectedScenarioId === null &&
      c.currentLayer === 2 &&
      c.inAutoMode,
    render: {
      anchor: "cathedralPanelRef",
      placement: "top",
      spotlight: { padding: 12, radius: 28 },
    },
  },
  {
    id: "planning.begin",
    category: "required",
    shouldActivate: (c) =>
      c.partnerId !== null &&
      c.selectedScenarioId !== null &&
      c.activeBooking !== null &&
      c.inAutoMode,
    render: {
      anchor: "beginButtonRef",
      placement: "top",
      pulseRing: { padding: 6, radius: 999 },
    },
  },
  {
    id: "planning.file-shift",
    category: "required",
    shouldActivate: (c) => c.shiftActive && c.fileShiftReady && c.inAutoMode,
    render: {
      anchor: "fileShiftButtonRef",
      placement: "bottom",
      pulseRing: { padding: 6, radius: 999, tone: "amber" },
    },
  },
  // Lazy / edge-case steps. None of these block the required path — they
  // gate on situations the player may or may not run into (cooldown, repair,
  // closure ready, locked deck). Each fires at most once per save.
  {
    id: "lazy.contextual-rail",
    category: "lazy",
    // Wait until the player has settled on a focus so this doesn't pile on
    // top of the layer-nav / focus intro. After that, fire on any layer.
    shouldActivate: (c) => c.focusId !== null && c.activeBooking === null && c.inAutoMode,
    render: {
      anchor: "contextualRailRef",
      placement: "left",
      hasPrimary: true,
    },
  },
  {
    id: "lazy.date-book",
    category: "lazy",
    // Date book step fires the first time the player is back on auto mode
    // after deck editing unlocks. The coach mark anchors the Date book pill,
    // which only exists on auto mode — gating on deck mode (the previous
    // trigger) hid the coach mark behind its own unmount.
    shouldActivate: (c) => c.inAutoMode && c.dateBookEditingUnlocked,
    render: {
      anchor: "dateBookPillRef",
      placement: "left",
      pulseRing: { padding: 6, radius: 999 },
      hasPrimary: true,
    },
  },
  {
    id: "lazy.cooldown-block",
    category: "lazy",
    shouldActivate: (c) =>
      c.focusedCooling && c.currentLayer === 0 && c.activeBooking === null && c.inAutoMode,
    render: {
      anchor: "layerFocusRef",
      placement: "right",
      fixedPosition: LAYER_COACH_FIXED_POSITION,
      pulseRing: { padding: 6, radius: 999, tone: "amber" },
      hasPrimary: true,
    },
  },
  {
    id: "lazy.closure-ready",
    category: "lazy",
    shouldActivate: (c) => c.readyClosurePairCount > 0 && c.activeBooking === null && c.inAutoMode,
    render: {
      anchor: "closureCalloutRef",
      placement: "right",
      hasPrimary: true,
    },
  },
  // Repair takes precedence over locked: both gate on the Date book pill, but
  // a repair-blocked deck is the more urgent ask. `dateBookLocked.render`
  // sets `suppressIfActive: "lazy.datebook.repair"` so it yields cleanly.
  {
    id: "lazy.datebook.repair",
    category: "lazy",
    shouldActivate: (c) => c.deckRepairBlocked && c.inAutoMode,
    render: {
      anchor: "dateBookPillRef",
      placement: "left",
      pulseRing: { padding: 6, radius: 999, tone: "amber" },
      hasPrimary: true,
    },
  },
  {
    id: "lazy.datebook.locked",
    category: "lazy",
    shouldActivate: (c) =>
      c.bookingLocked && c.dateBookEditingUnlocked && !c.deckRepairBlocked && c.inAutoMode,
    render: {
      anchor: "dateBookPillRef",
      placement: "left",
      hasPrimary: true,
      suppressIfActive: "lazy.datebook.repair",
    },
  },
];

export type PlanningTutorialSteps = Readonly<Record<TutorialCopyId, TutorialStepHandle>>;

export function usePlanningTutorial(input: {
  save: GameSave;
  shift: ShiftState;
  focusedMembers: Member[];
  focusId: string | null;
  partnerId: string | null;
  activeBooking: ShiftState["activeBooking"] | null;
  matchmakingIntent: MatchmakingIntent | null;
  selectedScenarioId: string | null;
  currentLayer: FlythroughLayer;
  scenarioMode: CathedralMode;
  bookingLocked: boolean;
  deckRepairBlocked: boolean;
  dateBookEditingUnlocked: boolean;
  readyClosurePairCount: number;
  fileShiftReady: boolean;
  onTutorialUpdate: (next: GameSave) => void;
}): { refs: PlanningTutorialRefs; steps: PlanningTutorialSteps } {
  // Almost every coach mark below anchors to a ref that lives inside
  // LobbyHudLayer. The lobby unmounts that whole HUD when the Date Book is
  // open in deck/library mode, so HUD-anchored steps must wait for auto mode
  // — otherwise their target ref is null and `useTargetRect` makes the coach
  // mark render nothing, blocking the step's "Got it" forever. The scenario
  // step (cathedralPanelRef) is the only one that lives outside the HUD.
  const inAutoMode = input.scenarioMode === "auto";
  const focusedCooling = input.focusedMembers.some((member) =>
    isMemberInCooldown(member, input.shift.shiftNumber),
  );

  const ctx: PlanningContext = {
    inAutoMode,
    focusId: input.focusId,
    partnerId: input.partnerId,
    activeBooking: input.activeBooking,
    matchmakingIntent: input.matchmakingIntent,
    selectedScenarioId: input.selectedScenarioId,
    currentLayer: input.currentLayer,
    bookingLocked: input.bookingLocked,
    deckRepairBlocked: input.deckRepairBlocked,
    dateBookEditingUnlocked: input.dateBookEditingUnlocked,
    readyClosurePairCount: input.readyClosurePairCount,
    fileShiftReady: input.fileShiftReady,
    shiftActive: input.shift.status === "active",
    focusedCooling,
  };

  // PLANNING_STEPS is a module-scope constant — iteration is stable across
  // renders, so calling useTutorialStep in this loop satisfies the rules of
  // hooks.
  const steps = {} as Record<TutorialCopyId, TutorialStepHandle>;
  for (const config of PLANNING_STEPS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    steps[config.id] = useTutorialStep(
      input.save,
      config.id,
      config.shouldActivate(ctx),
      input.onTutorialUpdate,
    );
  }

  // Auto-complete pass. The effect runs every render and checks each step's
  // optional autoCompleteWhen predicate; firing complete() on the matching
  // step is idempotent (useTutorialStep guards against re-completion).
  useEffect(() => {
    for (const config of PLANNING_STEPS) {
      if (config.autoCompleteWhen === undefined) continue;
      const handle = steps[config.id];
      if (!handle.active) continue;
      if (config.autoCompleteWhen(ctx)) handle.complete();
    }
    // The effect needs to see every ctx field the predicates can read. We
    // intentionally exclude `steps` (a fresh object each render); the handle
    // mutations the effect performs only matter for the *next* render, and
    // any state change that flipped a predicate will also re-trigger this
    // effect via its own ctx dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ctx.inAutoMode,
    ctx.focusId,
    ctx.partnerId,
    ctx.activeBooking,
    ctx.matchmakingIntent,
    ctx.selectedScenarioId,
    ctx.currentLayer,
    ctx.bookingLocked,
    ctx.deckRepairBlocked,
    ctx.dateBookEditingUnlocked,
    ctx.readyClosurePairCount,
    ctx.fileShiftReady,
    ctx.shiftActive,
    ctx.focusedCooling,
  ]);

  const layerIndicatorRef = useRef<HTMLDivElement | null>(null);
  const layerFocusRef = useRef<HTMLButtonElement | null>(null);
  const layerRosterRef = useRef<HTMLButtonElement | null>(null);
  const layerCathedralRef = useRef<HTMLButtonElement | null>(null);
  const sideRailRef = useRef<HTMLDivElement | null>(null);
  const intentRailRef = useRef<HTMLDivElement | null>(null);
  const cathedralPanelRef = useRef<HTMLDivElement | null>(null);
  const beginButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileShiftButtonRef = useRef<HTMLButtonElement | null>(null);
  const contextualRailRef = useRef<HTMLDivElement | null>(null);
  const dateBookPillRef = useRef<HTMLButtonElement | null>(null);
  const closureCalloutRef = useRef<HTMLDivElement | null>(null);

  return {
    refs: {
      layerIndicatorRef,
      layerFocusRef,
      layerRosterRef,
      layerCathedralRef,
      sideRailRef,
      intentRailRef,
      cathedralPanelRef,
      beginButtonRef,
      fileShiftButtonRef,
      contextualRailRef,
      dateBookPillRef,
      closureCalloutRef,
    },
    steps,
  };
}

export function PlanningTutorialOverlays({
  steps,
  refs,
  viewMode,
}: {
  steps: PlanningTutorialSteps;
  refs: PlanningTutorialRefs;
  viewMode: ViewMode;
}) {
  const inTonight = viewMode === "tonight";

  // Required path: ordered list of overlays, first active wins. Each entry's
  // gating (`step.active` + `inTonight` unless it's the file-shift step,
  // which fires across views) controls whether it can claim the screen.
  const requiredCandidates = PLANNING_STEPS.filter((config) => config.category === "required");
  const firstActiveRequired = requiredCandidates.find((config) => {
    const handle = steps[config.id];
    if (!handle.active) return false;
    // fileShiftStep is the only required entry that fires outside `inTonight`.
    if (config.id === "planning.file-shift") return true;
    return inTonight;
  });

  const lazyCandidates = PLANNING_STEPS.filter((config) => config.category === "lazy");
  const showLazies = firstActiveRequired === undefined && inTonight;
  const activeLazyIds = new Set(
    lazyCandidates.filter((config) => steps[config.id].active).map((config) => config.id),
  );

  return (
    <>
      {firstActiveRequired !== undefined ? (
        <StepOverlay
          key={firstActiveRequired.id}
          config={firstActiveRequired}
          handle={steps[firstActiveRequired.id]}
          refs={refs}
        />
      ) : null}
      {showLazies
        ? lazyCandidates.map((config) => {
            const handle = steps[config.id];
            if (!handle.active) return null;
            if (
              config.render.suppressIfActive !== undefined &&
              activeLazyIds.has(config.render.suppressIfActive)
            ) {
              return null;
            }
            return <StepOverlay key={config.id} config={config} handle={handle} refs={refs} />;
          })
        : null}
    </>
  );
}

function StepOverlay({
  config,
  handle,
  refs,
}: {
  config: PlanningStepConfig;
  handle: TutorialStepHandle;
  refs: PlanningTutorialRefs;
}) {
  const copy = tutorialCopy(config.id);
  const render = config.render;
  const anchorKey = render.anchor;
  const targetRef = refs[anchorKey];
  return (
    <>
      {render.pulseRing !== undefined ? (
        isButtonAnchor(anchorKey) ? (
          <TutorialPulseRing
            target={refs[anchorKey]}
            padding={render.pulseRing.padding}
            radius={render.pulseRing.radius}
            tone={render.pulseRing.tone}
          />
        ) : (
          <TutorialPulseRing
            target={
              targetRef as RefObject<HTMLDivElement | null> | RefObject<HTMLButtonElement | null>
            }
            padding={render.pulseRing.padding}
            radius={render.pulseRing.radius}
            tone={render.pulseRing.tone}
          />
        )
      ) : null}
      {render.spotlight !== undefined ? (
        <TutorialSpotlight
          target={targetRef}
          padding={render.spotlight.padding}
          radius={render.spotlight.radius}
        />
      ) : null}
      <TutorialCoachMark
        target={targetRef}
        placement={render.placement}
        fixedPosition={render.fixedPosition}
        title={copy.title}
        body={copy.body}
        stepIndex={copy.stepIndex}
        stepCount={copy.stepCount}
        primaryLabel={render.hasPrimary === true ? copy.primaryLabel : undefined}
        onPrimary={render.hasPrimary === true ? handle.complete : undefined}
        dismissLabel="Skip tour"
        onDismiss={handle.dismiss}
      />
    </>
  );
}
