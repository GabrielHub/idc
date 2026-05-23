import { useEffect, useRef, type RefObject } from "react";

import type { GameSave, ShiftState } from "../../domain/game";
import { useTutorialStep, type TutorialStepHandle } from "../../services/tutorial";
import {
  TutorialCoachMark,
  TutorialPulseRing,
  TutorialSpotlight,
  type CoachMarkFixedPosition,
} from "../tutorial";
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
  cathedralPanelRef: RefObject<HTMLDivElement | null>;
  beginButtonRef: RefObject<HTMLButtonElement | null>;
  fileShiftButtonRef: RefObject<HTMLButtonElement | null>;
};

export type PlanningTutorialSteps = {
  focusStep: TutorialStepHandle;
  partnerStep: TutorialStepHandle;
  commitStep: TutorialStepHandle;
  scenarioStep: TutorialStepHandle;
  beginStep: TutorialStepHandle;
  fileShiftStep: TutorialStepHandle;
};

export function usePlanningTutorial({
  save,
  focusId,
  partnerId,
  activeBooking,
  selectedScenarioId,
  currentLayer,
  shift,
  fileShiftReady,
  onTutorialUpdate,
}: {
  save: GameSave;
  focusId: string | null;
  partnerId: string | null;
  activeBooking: ShiftState["activeBooking"] | null;
  selectedScenarioId: string | null;
  currentLayer: FlythroughLayer;
  shift: ShiftState;
  fileShiftReady: boolean;
  onTutorialUpdate: (next: GameSave) => void;
}): { refs: PlanningTutorialRefs; steps: PlanningTutorialSteps } {
  const focusStep = useTutorialStep(save, "planning.focus", focusId === null, onTutorialUpdate);
  const partnerStep = useTutorialStep(
    save,
    "planning.partner",
    focusId !== null && partnerId === null,
    onTutorialUpdate,
  );
  const commitStep = useTutorialStep(
    save,
    "planning.commit",
    focusId !== null && partnerId !== null && activeBooking === null && currentLayer < 2,
    onTutorialUpdate,
  );
  const scenarioStep = useTutorialStep(
    save,
    "planning.scenario",
    partnerId !== null && selectedScenarioId === null && currentLayer === 2,
    onTutorialUpdate,
  );
  const beginStep = useTutorialStep(
    save,
    "planning.begin",
    partnerId !== null && selectedScenarioId !== null && activeBooking === null,
    onTutorialUpdate,
  );
  const fileShiftStep = useTutorialStep(
    save,
    "planning.file-shift",
    shift.status === "active" && fileShiftReady,
    onTutorialUpdate,
  );

  const layerIndicatorRef = useRef<HTMLDivElement | null>(null);
  const layerFocusRef = useRef<HTMLButtonElement | null>(null);
  const layerRosterRef = useRef<HTMLButtonElement | null>(null);
  const layerCathedralRef = useRef<HTMLButtonElement | null>(null);
  const sideRailRef = useRef<HTMLDivElement | null>(null);
  const cathedralPanelRef = useRef<HTMLDivElement | null>(null);
  const beginButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileShiftButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!commitStep.active) return;
    if (currentLayer === 2 || selectedScenarioId !== null) {
      commitStep.complete();
    }
  }, [commitStep, currentLayer, selectedScenarioId]);

  return {
    refs: {
      layerIndicatorRef,
      layerFocusRef,
      layerRosterRef,
      layerCathedralRef,
      sideRailRef,
      cathedralPanelRef,
      beginButtonRef,
      fileShiftButtonRef,
    },
    steps: { focusStep, partnerStep, commitStep, scenarioStep, beginStep, fileShiftStep },
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
  const { focusStep, partnerStep, commitStep, scenarioStep, beginStep, fileShiftStep } = steps;
  const {
    layerFocusRef,
    layerRosterRef,
    sideRailRef,
    cathedralPanelRef,
    beginButtonRef,
    fileShiftButtonRef,
  } = refs;

  return (
    <>
      {focusStep.active && viewMode === "tonight" ? (
        <>
          <TutorialPulseRing target={layerFocusRef} padding={6} radius={999} />
          <TutorialCoachMark
            target={layerFocusRef}
            placement="right"
            fixedPosition={LAYER_COACH_FIXED_POSITION}
            title="Pick tonight's lead"
            body="The four focus cases sit on this layer. Click any star to confirm it as the lead. The other three wait on file."
            stepIndex={0}
            stepCount={5}
            dismissLabel="Skip tour"
            onDismiss={focusStep.dismiss}
          />
        </>
      ) : null}

      {!focusStep.active && partnerStep.active && viewMode === "tonight" ? (
        <>
          <TutorialPulseRing target={layerRosterRef} padding={6} radius={999} />
          <TutorialCoachMark
            target={layerRosterRef}
            placement="right"
            fixedPosition={LAYER_COACH_FIXED_POSITION}
            title="Roll to the roster, pick a partner"
            body="Scroll one notch down - or tap this pill - to surface tonight's eligible partners. Click a brightened star to lock the pair."
            stepIndex={1}
            stepCount={5}
            dismissLabel="Skip tour"
            onDismiss={partnerStep.dismiss}
          />
        </>
      ) : null}

      {!focusStep.active && !partnerStep.active && commitStep.active && viewMode === "tonight" ? (
        <TutorialCoachMark
          target={sideRailRef}
          placement="left"
          title="Pair queued. Roll to the cathedral"
          body="Both members are on file. Tonight's commit is implicit - once you pick a room and press Begin, the pair locks and the date opens."
          stepIndex={2}
          stepCount={5}
          primaryLabel="Got it"
          onPrimary={commitStep.complete}
          dismissLabel="Skip tour"
          onDismiss={commitStep.dismiss}
        />
      ) : null}

      {!focusStep.active &&
      !partnerStep.active &&
      !commitStep.active &&
      scenarioStep.active &&
      viewMode === "tonight" ? (
        <>
          <TutorialSpotlight target={cathedralPanelRef} padding={12} radius={28} />
          <TutorialCoachMark
            target={cathedralPanelRef}
            placement="top"
            title="Pick the room"
            body="These are tonight's drawn scenarios. Open one to lock it. Room read is a warning, not a verdict - Cupid still waits for transcript evidence."
            stepIndex={3}
            stepCount={5}
            dismissLabel="Skip tour"
            onDismiss={scenarioStep.dismiss}
          />
        </>
      ) : null}

      {!focusStep.active &&
      !partnerStep.active &&
      !commitStep.active &&
      !scenarioStep.active &&
      beginStep.active &&
      viewMode === "tonight" ? (
        <>
          <TutorialPulseRing target={beginButtonRef} padding={6} radius={999} />
          <TutorialCoachMark
            target={beginButtonRef}
            placement="top"
            title="Begin the date"
            body="Begin commits the pair, snapshots the deck, and opens the room. The deck is locked once the date starts."
            stepIndex={4}
            stepCount={5}
            dismissLabel="Skip tour"
            onDismiss={beginStep.dismiss}
          />
        </>
      ) : null}

      {fileShiftStep.active ? (
        <>
          <TutorialPulseRing target={fileShiftButtonRef} padding={6} radius={999} tone="amber" />
          <TutorialCoachMark
            target={fileShiftButtonRef}
            placement="bottom"
            title="File the shift"
            body="One shift, one date. File it when the date is settled. If you skip the open roster instead, Cupid files the lead ask as sitting and applies the mood penalty."
            dismissLabel="Skip tour"
            onDismiss={fileShiftStep.dismiss}
          />
        </>
      ) : null}
    </>
  );
}
