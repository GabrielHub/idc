import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import type { GameSave, MatchmakingIntent, Member, ShiftState } from "../../domain/game";
import { isMemberInCooldown } from "../../services/shift-planning";
import { tutorialCopy } from "../../services/tutorial-copy";
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

export type PlanningTutorialSteps = {
  layerNavStep: TutorialStepHandle;
  focusStep: TutorialStepHandle;
  partnerStep: TutorialStepHandle;
  intentStep: TutorialStepHandle;
  commitStep: TutorialStepHandle;
  scenarioStep: TutorialStepHandle;
  beginStep: TutorialStepHandle;
  fileShiftStep: TutorialStepHandle;
  contextualRailStep: TutorialStepHandle;
  dateBookStep: TutorialStepHandle;
  cooldownBlockStep: TutorialStepHandle;
  closureReadyStep: TutorialStepHandle;
  dateBookLockedStep: TutorialStepHandle;
  dateBookRepairStep: TutorialStepHandle;
};

export function usePlanningTutorial({
  save,
  shift,
  focusedMembers,
  focusId,
  partnerId,
  activeBooking,
  matchmakingIntent,
  selectedScenarioId,
  currentLayer,
  scenarioMode,
  bookingLocked,
  deckRepairBlocked,
  dateBookEditingUnlocked,
  readyClosurePairCount,
  fileShiftReady,
  onTutorialUpdate,
}: {
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
  // LobbyHudLayer (LayerIndicator, SideRail, ContextualPillRail, BottomDock,
  // CalloutCluster). The lobby unmounts that whole HUD when the Date Book is
  // open in deck/library mode, so HUD-anchored steps must wait for auto mode
  // — otherwise their target ref is null and `useTargetRect` makes the coach
  // mark render nothing, blocking the step's "Got it" forever. The scenario
  // step (cathedralPanelRef) is the only one that lives outside the HUD.
  const inAutoMode = scenarioMode === "auto";

  // Required-path steps. Ordered first focus pick → partner pick → intent
  // file → commit guidance → scenario pick → begin date → file shift. The
  // layer-nav step lands BEFORE the focus pick so the player learns that the
  // constellation is depth-traversed; the focus step then waits for it.
  const layerNavStep = useTutorialStep(
    save,
    "planning.layer-nav",
    focusId === null && activeBooking === null && inAutoMode,
    onTutorialUpdate,
  );
  const focusStep = useTutorialStep(
    save,
    "planning.focus",
    focusId === null && layerNavStep.done && inAutoMode,
    onTutorialUpdate,
  );
  const partnerStep = useTutorialStep(
    save,
    "planning.partner",
    focusId !== null && partnerId === null && inAutoMode,
    onTutorialUpdate,
  );
  const intentStep = useTutorialStep(
    save,
    "planning.intent",
    focusId !== null && partnerId !== null && activeBooking === null && inAutoMode,
    onTutorialUpdate,
  );
  const commitStep = useTutorialStep(
    save,
    "planning.commit",
    focusId !== null &&
      partnerId !== null &&
      activeBooking === null &&
      currentLayer < 2 &&
      intentStep.done &&
      inAutoMode,
    onTutorialUpdate,
  );
  const scenarioStep = useTutorialStep(
    save,
    "planning.scenario",
    // Gate on inAutoMode like every sibling planning step. Without it the
    // coach-mark fires over the deck/library cathedral too, where library
    // clicks open the detail overlay for adding to the deck rather than
    // picking tonight's scenario — the copy "open one to lock it" no longer
    // matches what the cards actually do.
    partnerId !== null &&
      activeBooking !== null &&
      selectedScenarioId === null &&
      currentLayer === 2 &&
      inAutoMode,
    onTutorialUpdate,
  );
  const beginStep = useTutorialStep(
    save,
    "planning.begin",
    partnerId !== null && selectedScenarioId !== null && activeBooking !== null && inAutoMode,
    onTutorialUpdate,
  );
  const fileShiftStep = useTutorialStep(
    save,
    "planning.file-shift",
    shift.status === "active" && fileShiftReady && inAutoMode,
    onTutorialUpdate,
  );

  // Lazy / edge-case steps. None of these block the required path — they
  // gate on situations the player may or may not run into (cooldown, repair,
  // closure ready, locked deck). Each fires at most once per save.
  const contextualRailStep = useTutorialStep(
    save,
    "lazy.contextual-rail",
    // Wait until the player has settled on a focus so this doesn't pile on
    // top of the layer-nav / focus intro. After that, fire on any layer.
    focusId !== null && activeBooking === null && inAutoMode,
    onTutorialUpdate,
  );
  // Date book step fires the first time the player is back on auto mode
  // after deck editing unlocks. The coach mark anchors the Date book pill,
  // which only exists on auto mode — gating on deck mode (the previous
  // trigger) hid the coach mark behind its own unmount.
  const dateBookStep = useTutorialStep(
    save,
    "lazy.date-book",
    inAutoMode && dateBookEditingUnlocked,
    onTutorialUpdate,
  );
  const focusedCoolingMember = focusedMembers.find((member) =>
    isMemberInCooldown(member, shift.shiftNumber),
  );
  const cooldownBlockStep = useTutorialStep(
    save,
    "lazy.cooldown-block",
    focusedCoolingMember !== undefined &&
      currentLayer === 0 &&
      activeBooking === null &&
      inAutoMode,
    onTutorialUpdate,
  );
  const closureReadyStep = useTutorialStep(
    save,
    "lazy.closure-ready",
    readyClosurePairCount > 0 && activeBooking === null && inAutoMode,
    onTutorialUpdate,
  );
  // Repair takes precedence over locked: both gate on the Date book pill, but
  // a repair-blocked deck is the more urgent ask. Folding `!deckRepairBlocked`
  // into the locked gate keeps `dateBookLockedStep.active` honest for the
  // activity registry instead of relying on render-time suppression alone.
  const dateBookRepairStep = useTutorialStep(
    save,
    "lazy.datebook.repair",
    deckRepairBlocked && inAutoMode,
    onTutorialUpdate,
  );
  const dateBookLockedStep = useTutorialStep(
    save,
    "lazy.datebook.locked",
    bookingLocked && dateBookEditingUnlocked && !deckRepairBlocked && inAutoMode,
    onTutorialUpdate,
  );

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

  // Step handles from useTutorialStep are fresh objects every render; depend
  // on the primitive `active` field and the stable `complete` callback so the
  // effect doesn't re-run on every parent render.
  const commitStepActive = commitStep.active;
  const commitStepComplete = commitStep.complete;
  useEffect(() => {
    if (!commitStepActive) return;
    if (currentLayer === 2 || selectedScenarioId !== null) {
      commitStepComplete();
    }
  }, [commitStepActive, commitStepComplete, currentLayer, selectedScenarioId]);

  // Intent is optional — auto-complete the step the moment the player files
  // any intent (so we don't tail them with "pick an intent" copy) or moves
  // on to picking the room. The coach mark teaches the rail; using it is
  // their call.
  const intentStepActive = intentStep.active;
  const intentStepComplete = intentStep.complete;
  useEffect(() => {
    if (!intentStepActive) return;
    if (matchmakingIntent !== null || currentLayer === 2 || selectedScenarioId !== null) {
      intentStepComplete();
    }
  }, [intentStepActive, intentStepComplete, matchmakingIntent, currentLayer, selectedScenarioId]);

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
    steps: {
      layerNavStep,
      focusStep,
      partnerStep,
      intentStep,
      commitStep,
      scenarioStep,
      beginStep,
      fileShiftStep,
      contextualRailStep,
      dateBookStep,
      cooldownBlockStep,
      closureReadyStep,
      dateBookLockedStep,
      dateBookRepairStep,
    },
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
  const {
    layerNavStep,
    focusStep,
    partnerStep,
    intentStep,
    commitStep,
    scenarioStep,
    beginStep,
    fileShiftStep,
    contextualRailStep,
    dateBookStep,
    cooldownBlockStep,
    closureReadyStep,
    dateBookLockedStep,
    dateBookRepairStep,
  } = steps;
  const {
    layerIndicatorRef,
    layerFocusRef,
    layerRosterRef,
    sideRailRef,
    intentRailRef,
    cathedralPanelRef,
    beginButtonRef,
    fileShiftButtonRef,
    contextualRailRef,
    dateBookPillRef,
    closureCalloutRef,
  } = refs;

  const inTonight = viewMode === "tonight";
  const layerNavCopy = tutorialCopy("planning.layer-nav");
  const focusCopy = tutorialCopy("planning.focus");
  const partnerCopy = tutorialCopy("planning.partner");
  const intentCopy = tutorialCopy("planning.intent");
  const commitCopy = tutorialCopy("planning.commit");
  const scenarioCopy = tutorialCopy("planning.scenario");
  const beginCopy = tutorialCopy("planning.begin");
  const fileShiftCopy = tutorialCopy("planning.file-shift");
  const contextualRailCopy = tutorialCopy("lazy.contextual-rail");
  const dateBookCopy = tutorialCopy("lazy.date-book");
  const cooldownBlockCopy = tutorialCopy("lazy.cooldown-block");
  const closureReadyCopy = tutorialCopy("lazy.closure-ready");
  const dateBookRepairCopy = tutorialCopy("lazy.datebook.repair");
  const dateBookLockedCopy = tutorialCopy("lazy.datebook.locked");

  // Required path: ordered list of overlays, first active wins. Each entry's
  // gating predicate (`step.active && inTonight` plus any step-specific
  // condition) controls whether it can claim the screen; `requiredOverlays
  // .find(Boolean)` then picks the first claimant and the rest stay dormant.
  // The required steps are mutually exclusive by their useTutorialStep gates
  // (focusId, partnerId, intentStep.done, currentLayer, selectedScenarioId
  // transitions), so the array ordering is the safety net — it enforces a
  // single visible coach mark even if two steps briefly overlap during a
  // state transition.
  //
  // fileShiftStep is the only entry that fires outside `inTonight` — it
  // anchors on the file-shift button in whatever view the player is in.
  const requiredOverlays: ReactNode[] = [
    layerNavStep.active && inTonight && (
      <>
        <TutorialPulseRing target={layerIndicatorRef} padding={10} radius={28} />
        <TutorialCoachMark
          target={layerIndicatorRef}
          placement="right"
          fixedPosition={LAYER_COACH_FIXED_POSITION}
          title={layerNavCopy.title}
          body={layerNavCopy.body}
          stepIndex={layerNavCopy.stepIndex}
          stepCount={layerNavCopy.stepCount}
          primaryLabel={layerNavCopy.primaryLabel}
          onPrimary={layerNavStep.complete}
          dismissLabel="Skip tour"
          onDismiss={layerNavStep.dismiss}
        />
      </>
    ),
    focusStep.active && inTonight && (
      <>
        <TutorialPulseRing target={layerFocusRef} padding={6} radius={999} />
        <TutorialCoachMark
          target={layerFocusRef}
          placement="right"
          fixedPosition={LAYER_COACH_FIXED_POSITION}
          title={focusCopy.title}
          body={focusCopy.body}
          stepIndex={focusCopy.stepIndex}
          stepCount={focusCopy.stepCount}
          dismissLabel="Skip tour"
          onDismiss={focusStep.dismiss}
        />
      </>
    ),
    partnerStep.active && inTonight && (
      <>
        <TutorialPulseRing target={layerRosterRef} padding={6} radius={999} />
        <TutorialCoachMark
          target={layerRosterRef}
          placement="right"
          fixedPosition={LAYER_COACH_FIXED_POSITION}
          title={partnerCopy.title}
          body={partnerCopy.body}
          stepIndex={partnerCopy.stepIndex}
          stepCount={partnerCopy.stepCount}
          dismissLabel="Skip tour"
          onDismiss={partnerStep.dismiss}
        />
      </>
    ),
    intentStep.active && inTonight && (
      <TutorialCoachMark
        target={intentRailRef}
        placement="top"
        title={intentCopy.title}
        body={intentCopy.body}
        stepIndex={intentCopy.stepIndex}
        stepCount={intentCopy.stepCount}
        primaryLabel={intentCopy.primaryLabel}
        onPrimary={intentStep.complete}
        dismissLabel="Skip tour"
        onDismiss={intentStep.dismiss}
      />
    ),
    commitStep.active && inTonight && (
      <TutorialCoachMark
        target={sideRailRef}
        placement="left"
        title={commitCopy.title}
        body={commitCopy.body}
        stepIndex={commitCopy.stepIndex}
        stepCount={commitCopy.stepCount}
        primaryLabel={commitCopy.primaryLabel}
        onPrimary={commitStep.complete}
        dismissLabel="Skip tour"
        onDismiss={commitStep.dismiss}
      />
    ),
    scenarioStep.active && inTonight && (
      <>
        <TutorialSpotlight target={cathedralPanelRef} padding={12} radius={28} />
        <TutorialCoachMark
          target={cathedralPanelRef}
          placement="top"
          title={scenarioCopy.title}
          body={scenarioCopy.body}
          stepIndex={scenarioCopy.stepIndex}
          stepCount={scenarioCopy.stepCount}
          dismissLabel="Skip tour"
          onDismiss={scenarioStep.dismiss}
        />
      </>
    ),
    beginStep.active && inTonight && (
      <>
        <TutorialPulseRing target={beginButtonRef} padding={6} radius={999} />
        <TutorialCoachMark
          target={beginButtonRef}
          placement="top"
          title={beginCopy.title}
          body={beginCopy.body}
          stepIndex={beginCopy.stepIndex}
          stepCount={beginCopy.stepCount}
          dismissLabel="Skip tour"
          onDismiss={beginStep.dismiss}
        />
      </>
    ),
    fileShiftStep.active && (
      <>
        <TutorialPulseRing target={fileShiftButtonRef} padding={6} radius={999} tone="amber" />
        <TutorialCoachMark
          target={fileShiftButtonRef}
          placement="bottom"
          title={fileShiftCopy.title}
          body={fileShiftCopy.body}
          dismissLabel="Skip tour"
          onDismiss={fileShiftStep.dismiss}
        />
      </>
    ),
  ];
  const activeRequired = requiredOverlays.find(Boolean);

  // Lazy / edge-case overlays stay parked behind a single requiredPathActive
  // gate. Multiple lazies can be on screen at once because each anchors a
  // different surface; the one exception is dateBookLockedStep yielding to
  // dateBookRepairStep (they share the Date book pill, repair is the more
  // urgent fix).
  const lazyOverlays = activeRequired === undefined && inTonight && (
    <>
      {contextualRailStep.active ? (
        <TutorialCoachMark
          target={contextualRailRef}
          placement="left"
          title={contextualRailCopy.title}
          body={contextualRailCopy.body}
          primaryLabel={contextualRailCopy.primaryLabel}
          onPrimary={contextualRailStep.complete}
          dismissLabel="Skip tour"
          onDismiss={contextualRailStep.dismiss}
        />
      ) : null}

      {dateBookStep.active ? (
        <>
          <TutorialPulseRing target={dateBookPillRef} padding={6} radius={999} />
          <TutorialCoachMark
            target={dateBookPillRef}
            placement="left"
            title={dateBookCopy.title}
            body={dateBookCopy.body}
            primaryLabel={dateBookCopy.primaryLabel}
            onPrimary={dateBookStep.complete}
            dismissLabel="Skip tour"
            onDismiss={dateBookStep.dismiss}
          />
        </>
      ) : null}

      {cooldownBlockStep.active ? (
        <>
          <TutorialPulseRing target={layerFocusRef} padding={6} radius={999} tone="amber" />
          <TutorialCoachMark
            target={layerFocusRef}
            placement="right"
            fixedPosition={LAYER_COACH_FIXED_POSITION}
            title={cooldownBlockCopy.title}
            body={cooldownBlockCopy.body}
            primaryLabel={cooldownBlockCopy.primaryLabel}
            onPrimary={cooldownBlockStep.complete}
            dismissLabel="Skip tour"
            onDismiss={cooldownBlockStep.dismiss}
          />
        </>
      ) : null}

      {closureReadyStep.active ? (
        <TutorialCoachMark
          target={closureCalloutRef}
          placement="right"
          title={closureReadyCopy.title}
          body={closureReadyCopy.body}
          primaryLabel={closureReadyCopy.primaryLabel}
          onPrimary={closureReadyStep.complete}
          dismissLabel="Skip tour"
          onDismiss={closureReadyStep.dismiss}
        />
      ) : null}

      {dateBookRepairStep.active ? (
        <>
          <TutorialPulseRing target={dateBookPillRef} padding={6} radius={999} tone="amber" />
          <TutorialCoachMark
            target={dateBookPillRef}
            placement="left"
            title={dateBookRepairCopy.title}
            body={dateBookRepairCopy.body}
            primaryLabel={dateBookRepairCopy.primaryLabel}
            onPrimary={dateBookRepairStep.complete}
            dismissLabel="Skip tour"
            onDismiss={dateBookRepairStep.dismiss}
          />
        </>
      ) : null}

      {!dateBookRepairStep.active && dateBookLockedStep.active ? (
        <TutorialCoachMark
          target={dateBookPillRef}
          placement="left"
          title={dateBookLockedCopy.title}
          body={dateBookLockedCopy.body}
          primaryLabel={dateBookLockedCopy.primaryLabel}
          onPrimary={dateBookLockedStep.complete}
          dismissLabel="Skip tour"
          onDismiss={dateBookLockedStep.dismiss}
        />
      ) : null}
    </>
  );

  return (
    <>
      {activeRequired}
      {lazyOverlays}
    </>
  );
}
