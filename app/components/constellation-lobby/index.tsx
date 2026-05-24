/**
 * Production constellation lobby. Drop-in replacement for the old
 * PreDateCanvas: accepts the same prop bag CupidShellInner already hands
 * down, manages its own selection state (focus / partner / scenario /
 * intent), and routes Begin-date through a single atomic parent action.
 *
 * This composes the shared canvas convention (Scene, SideRail, BottomDock,
 * CalloutCluster, LayerIndicator) plus the production-only CathedralPanel,
 * ContextualPillRail, and various overlays (notes, shift-archive, closure,
 * case-file, lens, planning-tutorial). The old spike route has been retired;
 * this file is the production owner that renders through CupidShell.
 *
 *   - Planning tutorial routing completes the right steps, but visual
 *     coachmark placement on the 3D surfaces still needs a polish pass.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { IntentRail } from "./intent-rail";
import { LobbyCanvasLayer } from "./lobby-canvas-layer";
import { LobbyHudLayer } from "./lobby-hud-layer";
import { dateBookEditingUnlocked } from "../../services/deck";
import { makePairId } from "../../services/game-seed";
import {
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import { pickHeaviestAxisLevel } from "./deck-composition";
import { buildLobbyStars } from "./star-model";
import { useArchiveView } from "./use-archive-view";
import { useCathedralModel } from "./use-cathedral-model";
import { useCaseFileAction } from "./use-case-file-action";
import { useClosureQueue } from "./use-closure-queue";
import { useHoverCardRenderer } from "./use-hover-card-renderer";
import { useLobbyOverlays } from "./use-lobby-overlays";
import { useLobbyCallouts } from "./use-lobby-callouts";
import { useLobbyReselect } from "./use-lobby-reselect";
import { useLobbyPlanningState } from "./use-lobby-planning-state";
import { useRosterFold } from "./use-roster-fold";
import { useRosterKeyNavigation } from "./use-roster-key-navigation";
import { useShiftFilingState } from "./use-shift-filing-state";
import { usePlanningTutorial } from "./planning-tutorial";
import { LobbyDossierSlot } from "./lobby-dossier-slot";
import { LobbyOverlays } from "./lobby-overlays";
import { ReselectCaseManagerView } from "./reselect-case-manager-view";
import type { ArchiveSelection, FlythroughLayer, RosterSubview, StarMark, ViewMode } from "./types";
import { CathedralPanel, type CathedralMode, type RiskFilter, type SortMode } from "./cathedral";
import { EMPTY_READY_CLOSURE_IDS, type ConstellationLobbyProps } from "./props";
import { isLayerEnabled, normalizeLayer, type LayerNavigationMode } from "./layer-access";

type ScenarioMode = CathedralMode;

export function ConstellationLobby({
  save,
  shift,
  focusedMembers,
  drawnScenarios,
  isActionPending,
  bookingLocked,
  aiReady,
  readyClosurePairCount = 0,
  readyClosurePairs = [],
  pendingFollowUpCount = 0,
  readyClosurePairIds = EMPTY_READY_CLOSURE_IDS,
  onCommitPair,
  onBeginDate,
  onCancelBooking,
  onAddDeckCard,
  onRemoveDeckCard,
  onClosePair,
  closureErrorMessage = null,
  onCompleteShift,
  onOpenClosures,
  onOpenFollowUps,
  onOpenDateSession,
  readyClosureMemberIds,
  revealAllMemberDetails = false,
  onTutorialUpdate,
  onAddFocus,
  onRemoveFocus,
  onReselectFocus,
  chromeSlot,
  onDeckOverBudgetBlocked,
  disableScrollLayerNav = false,
}: ConstellationLobbyProps) {
  const reducedMotion = useReducedMotion() === true;
  const activeBooking = shift.activeBooking ?? null;

  const cathedralScrollRef = useRef<HTMLDivElement | null>(null);
  /**
   * Flythrough layer the player has scrolled into. 0 = focus cases, 1 =
   * tonight's eligibles, 2 = cathedral / scenarios. The Scene mounts a wheel
   * handler that calls `setCurrentLayer` per scroll tick, throttled so a
   * single wheel notch advances one layer. Declared above the tutorial gates
   * so `planning.commit` / `planning.scenario` can key off the layer.
   */
  const [currentLayer, setCurrentLayer] = useState<FlythroughLayer>(0);
  const { fileShiftReady, fileShiftBlockedReason, noDatesThisShift, shiftBriefRows } =
    useShiftFilingState({
      save,
      shift,
      readyClosurePairCount,
      pendingFollowUpCount,
    });
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("auto");
  const layerNavigationMode: LayerNavigationMode =
    scenarioMode !== "auto" ? "free" : activeBooking !== null ? "committed" : "planning";
  useEffect(() => {
    setCurrentLayer((current) => normalizeLayer(current, layerNavigationMode));
  }, [layerNavigationMode]);
  const handleLayerSelect = useCallback(
    (layer: FlythroughLayer) => {
      if (!isLayerEnabled(layer, layerNavigationMode)) return;
      setCurrentLayer(layer);
    },
    [layerNavigationMode],
  );
  /**
   * Roster-slab subview controls which cohort the constellation spotlights on
   * layer 1. Defaults to "eligibles" — tonight's available partners lead the
   * eye, off-tonight members recede. The two-segment pill on layer 1 flips
   * this so the player can scan rested members without leaving the slab.
   */
  const [rosterSubview, setRosterSubview] = useState<RosterSubview>("eligibles");

  const stars = useMemo(
    () => buildLobbyStars(save.members, shift, focusedMembers),
    [save.members, shift, focusedMembers],
  );
  const {
    focusId,
    setFocusId,
    partnerId,
    setPartnerId,
    matchmakingIntent,
    setMatchmakingIntent,
    selectedScenarioId,
    setSelectedScenarioId,
    lobbyState,
    focusStar,
    partnerStar,
    committedPairId,
    resetBookingSelection,
  } = useLobbyPlanningState({ save, activeBooking, stars, onCancelBooking });

  const [openCaseMemberId, setOpenCaseMemberId] = useState<string | null>(null);
  // Active star whose `HoverDetailCard` is morphed open. Click-driven (not
  // hover), since the bigger detail card is too eager to flash on every
  // pointer pass through the dense field.
  const [activeStarId, setActiveStarId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<MemberRosterFilterState>(
    DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  );

  const {
    notesOverlay,
    isShiftArchiveOpen,
    closurePairId,
    isLensOpen,
    skipShiftConfirmOpen,
    isOverlayOpen: modalOverlayOpen,
    openNotesOverlay,
    closeNotesOverlay,
    openClosurePanel,
    setIsShiftArchiveOpen,
    setClosurePairId,
    setIsLensOpen,
    setSkipShiftConfirmOpen,
  } = useLobbyOverlays();

  // Stable so useLobbyReselect's enterReselect doesn't rebuild every render —
  // an inline arrow here cascaded identity churn through handleToggleReselect
  // and any HUD prop that read it.
  const handleCaseFileClose = useCallback(() => setOpenCaseMemberId(null), []);
  const {
    lobbyMode,
    reselectDraft,
    reselectBaseline,
    enterReselect,
    cancelReselect,
    toggleReselectMember,
    confirmReselect,
    setReselectBaseline,
    setReselectDraft,
    setLobbyMode,
  } = useLobbyReselect({
    save,
    onReselectFocus,
    onCaseFileClose: handleCaseFileClose,
  });

  // Cathedral state. The cathedral is the layer-2 surface that renders all
  // date cards as 3D doors lining a nave. `expandedDoorId` is the door the
  // player has opened (single-clicked) so the detail overlay can mount with
  // the right scenario context. The hover id drives the door's hover bloom.
  // Library filter/sort state lifts out of the old `LibraryModePanel`; the
  // cathedral panel's own header surfaces these as a filter row in library
  // mode (folded in from a separate floating rail).
  const [expandedDoorId, setExpandedDoorId] = useState<string | null>(null);
  const [hoveredDoorId, setHoveredDoorId] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryRiskFilter, setLibraryRiskFilter] = useState<RiskFilter>("any");
  const [librarySort, setLibrarySort] = useState<SortMode>("alpha");

  // Archive view: stars re-flow into a pair-graph layout and constellation
  // edges etch between paired stars. Orthogonal to LobbyState — the player
  // can flip in/out of archive regardless of focus/partner selection.
  const [viewMode, setViewMode] = useState<ViewMode>("tonight");
  const [archiveSelection, setArchiveSelection] = useState<ArchiveSelection>(null);
  // Exiting archive clears the archive's own selection so re-entry reads
  // as a fresh look-around.
  useEffect(() => {
    if (viewMode === "tonight") setArchiveSelection(null);
  }, [viewMode]);

  const { archiveGraph, archivePositions, archiveEdges, archiveIsolation, cameraTarget } =
    useArchiveView({
      save,
      viewMode,
      archiveSelection,
      currentLayer,
      focusStar,
    });

  // The Pairs pill is hidden when no filed-note pairs exist. If the player is
  // somehow in archive view as that count drops to zero (e.g. last note edited
  // out), kick them back to tonight so they don't get stranded with no way
  // out.
  const hasArchiveEdges = archiveEdges.length > 0;
  useEffect(() => {
    if (viewMode === "archive" && !hasArchiveEdges) {
      setViewMode("tonight");
    }
  }, [viewMode, hasArchiveEdges]);

  const {
    effectiveCosts,
    budgetStatus,
    deckRepairBlocked,
    deckComposition,
    deckComposeWarnings,
    flythroughScenariosForLayer,
    cathedralDoors,
    expandedScenario,
  } = useCathedralModel({
    save,
    shift,
    drawnScenarios,
    focusId,
    partnerId,
    scenarioMode,
    librarySearch,
    libraryRiskFilter,
    librarySort,
    expandedDoorId,
  });
  const dateBookEditingIsUnlocked = dateBookEditingUnlocked(save);
  const dateBookLockedUntilFirstReport = !dateBookEditingIsUnlocked && !deckRepairBlocked;
  const dateBookDisabledReason = bookingLocked
    ? "Booking active. Edits unlock after the date resolves."
    : dateBookLockedUntilFirstReport
      ? "Date Book edits unlock after the first date report."
      : undefined;

  const planningTutorial = usePlanningTutorial({
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
    dateBookEditingUnlocked: dateBookEditingIsUnlocked,
    readyClosurePairCount,
    fileShiftReady,
    onTutorialUpdate,
  });
  const {
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
  } = planningTutorial.refs;
  const { focusStep, partnerStep, commitStep, scenarioStep, beginStep, fileShiftStep } =
    planningTutorial.steps;

  useEffect(() => {
    if (scenarioMode !== "auto" || selectedScenarioId === null) return;
    if (flythroughScenariosForLayer.some((scenario) => scenario.id === selectedScenarioId)) return;
    setSelectedScenarioId(null);
  }, [flythroughScenariosForLayer, scenarioMode, selectedScenarioId]);

  const handleCommitPair = () => {
    if (isActionPending) return;
    if (focusId === null || partnerId === null) return;
    if (commitStep.active) commitStep.complete();
    onCommitPair({
      focusMemberId: focusId,
      partnerMemberId: partnerId,
      matchmakingIntent: matchmakingIntent ?? undefined,
    });
  };

  const handleBeginDate = () => {
    if (isActionPending) return;
    if (focusId === null || partnerId === null) return;
    if (activeBooking === null) return;
    if (selectedScenarioId === null) return;
    if (beginStep.active) beginStep.complete();
    onBeginDate({
      focusMemberId: focusId,
      partnerMemberId: partnerId,
      scenarioId: selectedScenarioId,
      matchmakingIntent: matchmakingIntent ?? undefined,
    });
  };

  // Single reset for any "drop the in-flight selection" path. `dropFocus`
  // distinguishes the focus-X click (which also clears the focused case)
  // from the partner-X / Cancel-pair click (which only unwinds back to the
  // partner picker). Centralising avoids the drift that crept in when the
  // three call sites grew independently.
  const clearBookingSelection = useCallback(
    ({ dropFocus = false }: { dropFocus?: boolean } = {}) => {
      resetBookingSelection({ dropFocus });
      setScenarioMode("auto");
      // The cathedral detail overlay is resolved from `expandedDoorId` via
      // useCathedralModel — leaving it set keeps the detail panel mounted
      // over an empty lobby after cancel. Clear it here so the cancel path
      // is symmetric with closeDateBook / handleDateBookNavToggle.
      setExpandedDoorId(null);
      // Dropping focus collapses lobbyState to "idle"; the auto-advance
      // effect below only handles focus_selected / committed_pair, so the
      // player would otherwise stay on layer 1 with no focus picker visible.
      if (dropFocus) setCurrentLayer(0);
    },
    [resetBookingSelection],
  );
  const handleCancelPair = useCallback(() => clearBookingSelection(), [clearBookingSelection]);
  const handleClearFocus = useCallback(
    () => clearBookingSelection({ dropFocus: true }),
    [clearBookingSelection],
  );
  const handleClearPartner = handleCancelPair;

  // Choose the layer to return to when leaving the cathedral / date book.
  // Layer 0 is the focus picker, 1 is the roster (where partners are picked),
  // and 2 is the cathedral itself. Without this mapping the old code dumped
  // partner_selected / focus_selected players back to layer 0 even though
  // their pair was being assembled on layer 1.
  const cathedralExitLayer: FlythroughLayer =
    lobbyState === "committed_pair" || lobbyState === "scenario_chosen"
      ? 2
      : lobbyState === "focus_selected" || lobbyState === "partner_selected"
        ? 1
        : 0;

  const handleDateBookNavToggle = () => {
    if (dateBookDisabledReason !== undefined) return;
    setScenarioMode((current) => {
      if (current === "auto") {
        // Entering the deck warps the camera into the cathedral so the door
        // array reads as the active surface, not a popover.
        setCurrentLayer(2);
        setExpandedDoorId(null);
        return "deck";
      }
      if (current === "deck") {
        setCurrentLayer(2);
        setExpandedDoorId(null);
        return "library";
      }
      // library → auto: leave the cathedral; the lobby state decides which
      // member-layer slab the camera should return to.
      setCurrentLayer(cathedralExitLayer);
      setExpandedDoorId(null);
      return "auto";
    });
  };

  /**
   * Close the date book — drop deck/library mode back to auto so the
   * cathedral reads as tonight's draw again. Drives the panel header's
   * Close button, the Escape key, and the canvas-area click-outside. In
   * auto mode this is a no-op so a stray ESC or canvas click never warps
   * the camera away from the player's current focus/roster slab.
   */
  const closeDateBook = useCallback(() => {
    if (scenarioMode === "auto") return;
    setScenarioMode("auto");
    setExpandedDoorId(null);
    setCurrentLayer(cathedralExitLayer);
  }, [scenarioMode, cathedralExitLayer]);

  // Deck / library mode reads as a dedicated screen — the surrounding HUD
  // (chrome pills, layer dots, focus/partner rail, callouts, bottom dock,
  // contextual pill rail) recedes so the cathedral panel owns the frame.
  // The panel's own "← Close" button is the way back out.
  const dateBookOpen = scenarioMode !== "auto";

  // Auto-advance the flythrough as the booking assembles: focus pick warps to
  // the roster slab so the partner picker opens, and a committed pair warps to
  // the cathedral so the player picks tonight's scenario inside the nave
  // instead of through a floating overlay. Before commit, layers 0/1 remain
  // available; after commit, the cathedral owns navigation until the date
  // resolves.
  useEffect(() => {
    if (lobbyState === "focus_selected") setCurrentLayer(1);
    if (lobbyState === "committed_pair") setCurrentLayer(2);
  }, [lobbyState]);

  const handleOpenClosures = useCallback(() => {
    const firstReady = readyClosurePairs[0];
    if (firstReady !== undefined && onClosePair !== undefined) {
      openClosurePanel(firstReady.pairState.id);
    } else {
      openNotesOverlay(null);
    }
    onOpenClosures?.();
  }, [onClosePair, onOpenClosures, openClosurePanel, openNotesOverlay, readyClosurePairs]);
  const handleOpenFollowUps = useCallback(() => {
    openNotesOverlay(null);
    onOpenFollowUps?.();
  }, [onOpenFollowUps, openNotesOverlay]);

  const {
    readyPair: closureReadyPair,
    readyPairIndex: closureReadyPairIndex,
    openPrevious: openPreviousClosure,
    openNext: openNextClosure,
  } = useClosureQueue({ closurePairId, readyClosurePairs, setClosurePairId });

  // ===========================================================================
  // Roster fold derived state — folded affordances that used to live in the
  // Roster room: focused set, eligible partners, lens filter, reselect-mode
  // draft. The hover-card renderer below uses these to build a knowledge-
  // gated card with context-aware focus CTAs alongside the Files agent's
  // recent-notes slot.
  // ===========================================================================

  const {
    focusedSet,
    eligiblePartnerIds,
    offTonightIds,
    unavailabilityReasonById,
    filteredMembers,
    filterMatchedIds,
  } = useRosterFold({
    save,
    shift,
    filterState,
    revealAllMemberDetails,
    readyClosureMemberIds,
  });

  // Drop partnerId if it's no longer in eligiblePartnerIds (status flipped to
  // closed, cooldown entry, focused-set mutation). Without this the Begin
  // button stays enabled with a stale pick and `commitDateBooking` throws
  // "That member is not on tonight's roster." after the player clicks.
  useEffect(() => {
    if (activeBooking !== null) return;
    if (partnerId === null) return;
    if (eligiblePartnerIds.has(partnerId)) return;
    setPartnerId(null);
  }, [activeBooking, partnerId, eligiblePartnerIds]);

  // Fire the manager-quip "deck over budget" trigger on the false→true
  // transition. Tracks the previous value via ref so the dispatch happens
  // exactly once per crossing and doesn't refire on unrelated re-renders.
  const deckRepairBlockedPrevRef = useRef(false);
  useEffect(() => {
    if (deckRepairBlocked && !deckRepairBlockedPrevRef.current) {
      onDeckOverBudgetBlocked?.();
    }
    deckRepairBlockedPrevRef.current = deckRepairBlocked;
  }, [deckRepairBlocked, onDeckOverBudgetBlocked]);

  // Pair-mood lookup for the focus's eligible partners — relationshipHealth
  // (0..100) keyed by partner id, used by the canvas to color the constellation
  // spokes between the centered focus and each ringed partner. Untouched pairs
  // (no persisted PairState) are simply absent from the map; the renderer
  // falls back to a neutral midline so they still get a steady-violet spoke.
  const pairMoodByPartnerId = useMemo(() => {
    if (focusId === null || eligiblePartnerIds.size === 0) return undefined;
    const pairStateById = new Map(save.pairStates.map((p) => [p.id, p] as const));
    const map = new Map<string, number>();
    for (const partnerId of eligiblePartnerIds) {
      const pair = pairStateById.get(makePairId(focusId, partnerId));
      if (pair !== undefined) map.set(partnerId, pair.stats.relationshipHealth);
    }
    return map;
  }, [focusId, eligiblePartnerIds, save.pairStates]);

  const isOverlayOpen = modalOverlayOpen || openCaseMemberId !== null;
  useRosterKeyNavigation({
    viewMode,
    isOverlayOpen,
    rosterSubview,
    eligiblePartnerIds,
    offTonightIds,
    activeStarId,
    currentLayer,
    onLayerChange: handleLayerSelect,
    onActiveStarChange: setActiveStarId,
  });

  // Escape closes the date book back to auto when no other overlay owns the
  // ESC channel. The overlay-open guard keeps the case file, notes, and
  // closure panels free to handle their own ESC without us racing them.
  useEffect(() => {
    if (scenarioMode === "auto") return;
    if (isOverlayOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDateBook();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [scenarioMode, isOverlayOpen, closeDateBook]);

  // Click handlers wired into Scene. In browse, click morphs the star into
  // its `HoverDetailCard`; the card's buttons drive focus/partner selection
  // and case-file zoom.
  const handleStarClick = useCallback(
    (star: StarMark) => {
      // Archive mode: clicking a star isolates that member — camera centers
      // on them via computeArchiveCameraTarget, incident edges/partners stay
      // bright, the rest of the field dims. Same-star click clears so the
      // pulled-back idle view returns.
      if (viewMode === "archive") {
        setActiveStarId(null);
        setArchiveSelection((current) =>
          current?.kind === "member" && current.memberId === star.member.id
            ? null
            : { kind: "member", memberId: star.member.id },
        );
        return;
      }
      setActiveStarId((prev) => (prev === star.member.id ? null : star.member.id));
    },
    [viewMode],
  );

  // Double-click is a power-user shortcut that skips the card and opens the
  // full case-file overlay directly.
  const handleStarDoubleClick = useCallback((star: StarMark) => {
    setActiveStarId(null);
    setOpenCaseMemberId(star.member.id);
  }, []);

  // Opening the case file from anywhere also dismisses the inline card so the
  // two layers don't fight for attention.
  const openCaseAndDismiss = useCallback((memberId: string) => {
    setActiveStarId(null);
    setOpenCaseMemberId(memberId);
  }, []);

  const renderHoverCard = useHoverCardRenderer({
    save,
    focusedSet,
    revealAllMemberDetails,
    focusId,
    partnerId,
    activeBooking,
    eligiblePartnerIds,
    unavailabilityReasonById,
    shiftNumber: shift.shiftNumber,
    focusStep,
    partnerStep,
    onAddFocus,
    openCaseAndDismiss,
    setFocusId,
    setPartnerId,
    setActiveStarId,
  });

  const { openCaseMember, caseFilePrimaryAction } = useCaseFileAction({
    save,
    openCaseMemberId,
    focusedSet,
    onAddFocus,
    onRemoveFocus,
    onReselectFocus,
    setOpenCaseMemberId,
    setReselectBaseline,
    setReselectDraft,
    setLobbyMode,
  });

  const memberByIdMap = useMemo(
    () => new Map(save.members.map((member) => [member.id, member] as const)),
    [save.members],
  );

  const pairDossierSlot = (
    <LobbyDossierSlot
      save={save}
      memberById={memberByIdMap}
      archiveGraph={archiveGraph}
      archiveSelection={viewMode === "archive" ? archiveSelection : null}
      committedPairId={committedPairId}
      readyClosurePairIds={readyClosurePairIds}
      onArchiveSelectionChange={setArchiveSelection}
      onOpenNotes={openNotesOverlay}
      onOpenClosure={onClosePair === undefined ? undefined : openClosurePanel}
    />
  );

  const intentSlot =
    focusStar === undefined || partnerStar === undefined ? undefined : (
      <IntentRail
        selectedIntent={matchmakingIntent}
        locked={activeBooking !== null}
        onSelect={setMatchmakingIntent}
      />
    );

  /**
   * Deck-composition shards rendered only while the player is in date book
   * mode. The old TopBar surfaced these globally; we now keep the canvas
   * clean and surface slots / budget / axes / pressure inside the cathedral
   * panel header, next to the close button, so the deck reads as one card.
   */
  const deckBookShards = useMemo(() => {
    const heaviest = pickHeaviestAxisLevel(deckComposition);
    return {
      slotCount: save.scenarioDeck.cardIds.length,
      slotTone: budgetStatus.status === "invalid_size" ? ("rose" as const) : ("neutral" as const),
      spend: budgetStatus.spend,
      budgetCap: save.budgetCap,
      budgetTone: budgetStatus.status === "over_budget" ? ("rose" as const) : ("neutral" as const),
      axes: heaviest,
      pressure:
        deckComposition.lowPressure > 0 || deckComposition.highPressure > 0
          ? {
              lowPressure: deckComposition.lowPressure,
              highPressure: deckComposition.highPressure,
            }
          : undefined,
    };
  }, [
    save.scenarioDeck.cardIds.length,
    save.budgetCap,
    budgetStatus.status,
    budgetStatus.spend,
    deckComposition,
  ]);

  const openDeckFromCallout = useCallback(() => {
    setScenarioMode("deck");
    // Without this the HUD unmounts (dateBookOpen = scenarioMode !== "auto")
    // but CathedralPanel.open evaluates `currentLayer === 2` to false on the
    // first paint after a click from layer 0/1, leaving the player on an
    // empty constellation field.
    setCurrentLayer(2);
    setExpandedDoorId(null);
  }, []);
  const callouts = useLobbyCallouts({
    deckRepairBlocked,
    readyClosurePairCount,
    pendingFollowUpCount,
    save,
    shift,
    onOpenDateSession,
    onOpenClosures: handleOpenClosures,
    onOpenFollowUps: handleOpenFollowUps,
    onOpenDeck: openDeckFromCallout,
  });

  const handleCompleteShiftFromHud = useCallback(() => {
    if (noDatesThisShift) {
      setSkipShiftConfirmOpen(true);
      return;
    }
    if (fileShiftStep.active) fileShiftStep.complete();
    onCompleteShift?.();
  }, [fileShiftStep, noDatesThisShift, onCompleteShift, setSkipShiftConfirmOpen]);
  const handleToggleReselect = useCallback(() => {
    if (lobbyMode === "reselect") {
      cancelReselect();
      return;
    }
    enterReselect();
  }, [cancelReselect, enterReselect, lobbyMode]);
  const handleToggleArchive = useCallback(() => {
    setViewMode((current) => (current === "archive" ? "tonight" : "archive"));
  }, []);
  const handleClearArchiveSelection = useCallback(() => setArchiveSelection(null), []);

  /**
   * Door click routes to one of two flows. In auto mode (committed pair
   * picking tonight's scenario) the click sets `selectedScenarioId` so the
   * BottomDock's Begin-date button can fire. In deck / library mode the
   * click opens the detail overlay so the player can read the brief and
   * fire the mode-specific CTA (Drop / Add).
   */
  const handleDoorClick = (id: string) => {
    if (scenarioMode === "auto") {
      if (scenarioStep.active) scenarioStep.complete();
      setSelectedScenarioId((current) => (current === id ? null : id));
      return;
    }
    setExpandedDoorId((current) => (current === id ? null : id));
  };

  // Reselect mode hand-off: the constellation field steps aside for a dedicated
  // editor. The chrome slot (Punch Out / AI status / settings) still renders so
  // the player isn't stranded outside the app shell.
  if (lobbyMode === "reselect" && reselectDraft !== null && reselectBaseline !== null) {
    return (
      <ReselectCaseManagerView
        chromeSlot={chromeSlot}
        save={save}
        draftIds={reselectDraft}
        baselineFocusedIds={reselectBaseline}
        isActionPending={isActionPending}
        revealAllMemberDetails={revealAllMemberDetails}
        onTutorialUpdate={onTutorialUpdate}
        onToggleMember={toggleReselectMember}
        onCancel={cancelReselect}
        onConfirm={confirmReselect}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a0f2e] text-aura-paper">
      <LobbyCanvasLayer
        lobbyState={lobbyState}
        stars={stars}
        focusStar={focusStar}
        partnerStar={partnerStar}
        cameraTarget={cameraTarget}
        reducedMotion={reducedMotion}
        renderHoverCard={renderHoverCard}
        starClickHandlers={{
          onStarClick: handleStarClick,
          onStarDoubleClick: handleStarDoubleClick,
          eligiblePartnerIds,
          filterMatchedIds,
          onClearFocus: activeBooking === null ? handleClearFocus : undefined,
        }}
        activeStarId={activeStarId}
        onActiveStarChange={setActiveStarId}
        currentLayer={currentLayer}
        onLayerChange={handleLayerSelect}
        layerNavigationMode={layerNavigationMode}
        cathedralScrollRef={cathedralScrollRef}
        focusedIds={focusedSet}
        offTonightSet={offTonightIds}
        rosterSubview={rosterSubview}
        pairMoodByPartnerId={pairMoodByPartnerId}
        viewMode={viewMode}
        archiveData={
          viewMode === "archive" ? { positions: archivePositions, edges: archiveEdges } : undefined
        }
        archiveSelection={archiveSelection}
        archiveIsolation={archiveIsolation}
        memberById={memberByIdMap}
        onArchivePairSelect={(pairId) => setArchiveSelection({ kind: "pair", pairId })}
        onPointerMissed={() => {
          setActiveStarId(null);
          closeDateBook();
        }}
        disableScrollLayerNav={disableScrollLayerNav}
      />
      {!dateBookOpen ? (
        <LobbyHudLayer
          chromeSlot={chromeSlot}
          viewMode={viewMode}
          currentLayer={currentLayer}
          refs={{
            layerIndicatorRef,
            layerFocusRef,
            layerRosterRef,
            layerCathedralRef,
            sideRailRef,
            intentRailRef,
            beginButtonRef,
            fileShiftButtonRef,
            contextualRailRef,
            dateBookPillRef,
            closureCalloutRef,
          }}
          focus={focusStar}
          partner={partnerStar}
          intentSlot={intentSlot}
          pairDossierSlot={pairDossierSlot}
          callouts={callouts}
          lobbyState={lobbyState}
          selectedScenarioId={selectedScenarioId}
          isActionPending={isActionPending}
          aiReady={aiReady}
          shiftBriefRows={shiftBriefRows}
          scenarioMode={scenarioMode}
          bookingLocked={bookingLocked}
          dateBookDisabledReason={dateBookDisabledReason}
          deckRepairBlocked={deckRepairBlocked}
          rosterSubview={rosterSubview}
          filterState={filterState}
          canReselect={onReselectFocus !== undefined}
          archiveEdgeCount={archiveEdges.length}
          fileShiftBlockedReason={fileShiftBlockedReason}
          archiveSelectionActive={archiveSelection !== null}
          onLayerSelect={handleLayerSelect}
          layerNavigationMode={layerNavigationMode}
          onClearFocus={activeBooking === null ? handleClearFocus : undefined}
          onClearPartner={activeBooking === null ? handleClearPartner : undefined}
          onCommitPair={handleCommitPair}
          onBeginDate={handleBeginDate}
          onCancelPair={handleCancelPair}
          onCompleteShift={handleCompleteShiftFromHud}
          onOpenNotes={() => openNotesOverlay(null)}
          onOpenShiftArchive={() => setIsShiftArchiveOpen(true)}
          onToggleDateBook={handleDateBookNavToggle}
          onOpenLens={() => setIsLensOpen(true)}
          onToggleReselect={handleToggleReselect}
          onRosterSubviewChange={setRosterSubview}
          onToggleArchive={handleToggleArchive}
          onClearArchiveSelection={
            archiveSelection === null ? undefined : handleClearArchiveSelection
          }
        />
      ) : null}
      <CathedralPanel
        open={viewMode === "tonight" && currentLayer === 2}
        mode={scenarioMode}
        doors={cathedralDoors}
        selectedId={scenarioMode === "auto" ? selectedScenarioId : expandedDoorId}
        hoveredId={hoveredDoorId}
        onHover={setHoveredDoorId}
        onSelect={handleDoorClick}
        // Info-glyph peek: every mode routes here so the player can read a
        // scenario without committing. Auto mode's body click still locks the
        // pick for tonight — the peek is the additive path.
        onOpenDetail={setExpandedDoorId}
        // Close button surfaces only in deck/library — auto mode is the
        // cathedral's natural resting state and doesn't need a back affordance.
        onClose={scenarioMode === "auto" ? undefined : closeDateBook}
        reducedMotion={reducedMotion}
        containerRef={cathedralPanelRef}
        scrollRef={cathedralScrollRef}
        deckBookShards={scenarioMode === "auto" ? undefined : deckBookShards}
        // Surface deck-composition advisories in deck mode so the player gets
        // the same heads-up cues the old DateBookHeader rendered.
        composeWarnings={scenarioMode === "deck" ? deckComposeWarnings : undefined}
        libraryFilter={
          scenarioMode === "library"
            ? {
                search: librarySearch,
                riskFilter: libraryRiskFilter,
                sortMode: librarySort,
                onSearchChange: setLibrarySearch,
                onRiskFilterChange: setLibraryRiskFilter,
                onSortChange: setLibrarySort,
              }
            : undefined
        }
      />
      <LobbyOverlays
        save={save}
        notesOverlay={notesOverlay}
        readyClosurePairIds={readyClosurePairIds}
        closeNotesOverlay={closeNotesOverlay}
        isShiftArchiveOpen={isShiftArchiveOpen}
        setIsShiftArchiveOpen={setIsShiftArchiveOpen}
        closure={{
          readyPair: closureReadyPair,
          errorMessage: closureErrorMessage,
          queuePosition: closureReadyPairIndex < 0 ? undefined : closureReadyPairIndex + 1,
          queueTotal: readyClosurePairs.length === 0 ? undefined : readyClosurePairs.length,
          onPrevious: closureReadyPairIndex > 0 ? openPreviousClosure : undefined,
          onNext:
            closureReadyPairIndex >= 0 && closureReadyPairIndex < readyClosurePairs.length - 1
              ? openNextClosure
              : undefined,
          onClose: () => setClosurePairId(null),
          onConfirm: async (input) => {
            const filed = await onClosePair?.(input);
            if (filed === true) {
              setClosurePairId(null);
            }
          },
        }}
        planning={planningTutorial}
        viewMode={viewMode}
        lens={{
          isOpen: isLensOpen,
          filterState,
          matchCount: filteredMembers.length,
          totalCount: save.members.length,
          onChange: setFilterState,
          onClose: () => setIsLensOpen(false),
        }}
        openCaseMember={openCaseMember}
        caseFilePrimaryAction={caseFilePrimaryAction}
        revealAllMemberDetails={revealAllMemberDetails}
        focusedSet={focusedSet}
        closeCaseFile={() => setOpenCaseMemberId(null)}
        skipShiftConfirmOpen={skipShiftConfirmOpen}
        setSkipShiftConfirmOpen={setSkipShiftConfirmOpen}
        shiftNumber={shift.shiftNumber}
        isActionPending={isActionPending}
        onCompleteShift={onCompleteShift}
        onFileShiftTutorialComplete={() => {
          if (fileShiftStep.active) fileShiftStep.complete();
        }}
        scenarioDetail={{
          scenario: expandedScenario,
          mode: scenarioMode,
          save,
          effectiveCosts,
          bookingLocked,
          isActionPending,
          onAddDeckCard,
          onRemoveDeckCard,
          onClose: () => setExpandedDoorId(null),
        }}
      />
    </div>
  );
}
