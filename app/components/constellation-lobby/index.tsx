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
import { useArchiveMode } from "./use-archive-mode";
import { useArchiveView } from "./use-archive-view";
import { useCathedralModel } from "./use-cathedral-model";
import { useCaseFileAction } from "./use-case-file-action";
import { useDateBookState } from "./use-date-book-state";
import { renderLobbyHoverCard, type HoverCardContext } from "./hover-card-renderer";
import { useLobbyOverlays } from "./use-lobby-overlays";
import { useLobbyCallouts } from "./use-lobby-callouts";
import { useLobbyReselect } from "./use-lobby-reselect";
import { useLobbyState } from "./lobby-reducer";
import { deriveRosterFold } from "./roster-fold";
import { useRosterKeyNavigation } from "./use-roster-key-navigation";
import { deriveShiftFilingState } from "./shift-filing-state";
import { usePlanningTutorial } from "./planning-tutorial";
import { LobbyDossierSlot } from "./lobby-dossier-slot";
import { LobbyOverlays } from "./lobby-overlays";
import { ReselectCaseManagerView } from "./reselect-case-manager-view";
import {
  SCENARIO_FLYTHROUGH_LAYER,
  flythroughLayerForRosterSubview,
  rosterSubviewForFlythroughLayer,
  type FlythroughLayer,
  type RosterSubview,
  type StarMark,
} from "./types";
import { CathedralPanel } from "./cathedral";
import { EMPTY_READY_CLOSURE_IDS, type ConstellationLobbyProps } from "./props";
import type { LayerNavigationMode } from "./layer-access";

export function ConstellationLobby({
  save,
  shift,
  focusedMembers,
  drawnScenarios,
  isActionPending,
  bookingLocked,
  aiReady,
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
  onDismissClosureError,
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
  // Closure callouts and the shift brief only surface pairs that include a
  // currently-focused member, so the player isn't pestered about closures they
  // can't act on tonight. Filter once here and read `focusedReadyClosurePairs`
  // everywhere downstream.
  const focusedReadyClosurePairs = useMemo(() => {
    const focusedIds = new Set(focusedMembers.map((m) => m.id));
    return readyClosurePairs.filter((entry) =>
      entry.participants.some((p) => focusedIds.has(p.id)),
    );
  }, [focusedMembers, readyClosurePairs]);
  const readyClosurePairCount = focusedReadyClosurePairs.length;
  const { fileShiftReady, fileShiftBlockedReason, noDatesThisShift, shiftBriefRows } = useMemo(
    () =>
      deriveShiftFilingState({
        save,
        shift,
        readyClosurePairCount,
        pendingFollowUpCount,
      }),
    [save, shift, readyClosurePairCount, pendingFollowUpCount],
  );

  /**
   * One reducer owns the planning flow: booking selection (focus / partner /
   * intent / scenario), the cathedral mode (auto / deck / library), and the
   * flythrough layer (0/1/2/3). External activeBooking changes flow in via
   * `syncBooking`. See `lobby-reducer.ts` for the full transition table.
   */
  const { projection, dispatch } = useLobbyState({
    activeBooking,
    focusedMemberIds: save.focusedMemberIds,
  });
  const {
    focusId,
    partnerId,
    matchmakingIntent,
    selectedScenarioId,
    lobbyState,
    scenarioMode,
    currentLayer,
  } = projection;
  const layerNavigationMode: LayerNavigationMode =
    scenarioMode !== "auto" ? "free" : activeBooking !== null ? "committed" : "planning";
  const handleLayerSelect = useCallback(
    (layer: FlythroughLayer) => {
      const nextRosterSubview = rosterSubviewForFlythroughLayer(layer);
      if (nextRosterSubview !== undefined) setRosterSubview(nextRosterSubview);
      dispatch({ type: "selectLayer", layer, navigationMode: layerNavigationMode });
    },
    [dispatch, layerNavigationMode],
  );
  /**
   * Roster-slab subview controls which cohort the constellation spotlights on
   * the roster layers. Defaults to "eligibles" — tonight's available partners
   * lead the eye, off-tonight members recede. The two-segment pill and
   * flythrough layers both write this state so the UI stays synchronized.
   */
  const [rosterSubview, setRosterSubview] = useState<RosterSubview>("eligibles");
  const handleRosterSubviewChange = useCallback(
    (next: RosterSubview) => {
      setRosterSubview(next);
      dispatch({
        type: "selectLayer",
        layer: flythroughLayerForRosterSubview(next),
        navigationMode: layerNavigationMode,
      });
    },
    [dispatch, layerNavigationMode],
  );

  const stars = useMemo(
    () => buildLobbyStars(save.members, shift, focusedMembers),
    [save.members, shift, focusedMembers],
  );
  const focusStar = useMemo(
    () => (focusId === null ? undefined : stars.find((star) => star.member.id === focusId)),
    [stars, focusId],
  );
  const partnerStar = useMemo(
    () => (partnerId === null ? undefined : stars.find((star) => star.member.id === partnerId)),
    [stars, partnerId],
  );
  const committedPairId = activeBooking !== null ? activeBooking.pairId : null;

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
  // Lifted up here so useDateBookState can read it for its ESC guard. The
  // case-file is its own state below; modal overlays come from the hook.
  const isOverlayOpen = modalOverlayOpen || openCaseMemberId !== null;

  // Stable so useLobbyReselect's enterReselect doesn't rebuild every render —
  // an inline arrow here cascaded identity churn through handleToggleReselect
  // and any HUD prop that read it.
  const handleCaseFileClose = useCallback(() => setOpenCaseMemberId(null), []);
  const {
    lobbyMode,
    reselectDraft,
    reselectBaseline,
    enterReselect,
    requestReselectWithCandidate,
    cancelReselect,
    toggleReselectMember,
    confirmReselect,
  } = useLobbyReselect({
    save,
    onReselectFocus,
    onCaseFileClose: handleCaseFileClose,
  });

  // Cathedral / date book panel transient state — expandedDoor peek, hover,
  // library filter controls — plus the open/close/cycle helpers and the ESC
  // handler that returns to auto when no other overlay owns ESC.
  const {
    expandedDoorId,
    setExpandedDoorId,
    hoveredDoorId,
    setHoveredDoorId,
    librarySearch,
    setLibrarySearch,
    libraryRiskFilter,
    setLibraryRiskFilter,
    librarySort,
    setLibrarySort,
    closeDateBook,
    handleDateBookNavToggle,
    setScenarioMode,
  } = useDateBookState({ scenarioMode, dispatch, isOverlayOpen, disabled: bookingLocked });

  // Archive view: stars re-flow into a pair-graph layout and constellation
  // edges etch between paired stars. Orthogonal to LobbyState — the player
  // can flip in/out of archive regardless of focus/partner selection. The
  // hook owns the viewMode + selection state and the "tonight clears the
  // archive selection" effect; the no-edges exit-guard lives below because
  // it depends on derived archive data.
  const { viewMode, archiveSelection, setArchiveSelection, toggleArchive, clearArchiveSelection } =
    useArchiveMode();

  const { archivePositions, archiveEdges, archiveIsolation, cameraTarget, incidentEdgesByNode } =
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
      // useArchiveMode exposes `toggleArchive` but no direct setter — calling
      // it flips the mode regardless of current state. Guarded by the if so
      // this only fires while we're actually stuck in archive.
      toggleArchive();
    }
  }, [viewMode, hasArchiveEdges, toggleArchive]);

  // Planning-view pair edges: faint constellation lines between every
  // persisted pair (note-filed or not) so the player sees relationships at
  // a glance without flipping to the Records archive.
  const planningPairs = useMemo(
    () =>
      save.pairStates.map((pair) => ({
        pairId: pair.id,
        participantIds: pair.participantIds,
        health: pair.stats.relationshipHealth,
      })),
    [save.pairStates],
  );

  const {
    effectiveCosts,
    budgetStatus,
    deckRepairBlocked,
    deckComposition,
    deckComposeWarnings,
    drawnLobbyScenarios,
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
  const focusStep = planningTutorial.steps["planning.focus"];
  const partnerStep = planningTutorial.steps["planning.partner"];
  const commitStep = planningTutorial.steps["planning.commit"];
  const scenarioStep = planningTutorial.steps["planning.scenario"];
  const beginStep = planningTutorial.steps["planning.begin"];
  const fileShiftStep = planningTutorial.steps["planning.file-shift"];

  useEffect(() => {
    if (scenarioMode !== "auto" || selectedScenarioId === null) return;
    if (drawnLobbyScenarios.some((scenario) => scenario.id === selectedScenarioId)) return;
    dispatch({ type: "selectScenario", scenarioId: null });
  }, [dispatch, drawnLobbyScenarios, scenarioMode, selectedScenarioId]);

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

  // Cancellation has two paths: the reducer cleans up the in-flight booking
  // selection (focus / partner / intent / scenario / layer / scenarioMode);
  // and when an external activeBooking is live, the parent's
  // `onCancelBooking` mutates the save (the new activeBooking=null then flows
  // back through syncBooking next render). The expandedDoorId is owned
  // outside the reducer so we still clear it here for symmetry with
  // closeDateBook / handleDateBookNavToggle.
  const handleCancelPair = useCallback(() => {
    dispatch({ type: "cancelPair" });
    setExpandedDoorId(null);
    if (activeBooking !== null) onCancelBooking();
  }, [activeBooking, dispatch, onCancelBooking]);
  const handleClearFocus = useCallback(() => {
    dispatch({ type: "cancelPair", dropFocus: true });
    setExpandedDoorId(null);
    if (activeBooking !== null) onCancelBooking();
  }, [activeBooking, dispatch, onCancelBooking]);
  const handleClearPartner = handleCancelPair;

  // Deck / library mode reads as a dedicated screen — the surrounding HUD
  // (chrome pills, layer dots, focus/partner rail, callouts, bottom dock,
  // contextual pill rail) recedes so the cathedral panel owns the frame.
  // The panel's own "← Close" button is the way back out.
  const dateBookOpen = scenarioMode !== "auto";

  const handleOpenClosures = useCallback(() => {
    const firstReady = focusedReadyClosurePairs[0];
    if (firstReady !== undefined && onClosePair !== undefined) {
      openClosurePanel(firstReady.pairState.id);
    } else {
      openNotesOverlay(null);
    }
    onOpenClosures?.();
  }, [focusedReadyClosurePairs, onClosePair, onOpenClosures, openClosurePanel, openNotesOverlay]);
  const handleOpenFollowUps = useCallback(() => {
    openNotesOverlay(null);
    onOpenFollowUps?.();
  }, [onOpenFollowUps, openNotesOverlay]);

  const closureReadyPairIndex =
    closurePairId === null
      ? -1
      : focusedReadyClosurePairs.findIndex((ready) => ready.pairState.id === closurePairId);
  const closureReadyPair =
    closureReadyPairIndex < 0 ? null : (focusedReadyClosurePairs[closureReadyPairIndex] ?? null);
  const openPreviousClosure = useCallback(() => {
    if (closureReadyPairIndex <= 0) return;
    setClosurePairId(focusedReadyClosurePairs[closureReadyPairIndex - 1]?.pairState.id ?? null);
  }, [closureReadyPairIndex, focusedReadyClosurePairs, setClosurePairId]);
  const openNextClosure = useCallback(() => {
    if (closureReadyPairIndex < 0 || closureReadyPairIndex >= focusedReadyClosurePairs.length - 1) {
      return;
    }
    setClosurePairId(focusedReadyClosurePairs[closureReadyPairIndex + 1]?.pairState.id ?? null);
  }, [closureReadyPairIndex, focusedReadyClosurePairs, setClosurePairId]);
  // The closure error message is owned by the parent shell, so panel-local
  // transitions (close, Previous, Next) leak the prior pair's error into the
  // next view if we don't clear it here. Dismiss whenever the active pair
  // changes; a fresh confirm attempt will re-populate the error if it fails.
  useEffect(() => {
    onDismissClosureError?.();
  }, [closurePairId, onDismissClosureError]);

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
  } = useMemo(
    () =>
      deriveRosterFold({
        save,
        shift,
        filterState,
        revealAllMemberDetails,
        readyClosureMemberIds,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      save.focusedMemberIds,
      save.members,
      save.playerKnowledge,
      shift.availablePartnerMemberIds,
      shift.shiftNumber,
      filterState,
      revealAllMemberDetails,
      readyClosureMemberIds,
    ],
  );

  // Drop partnerId if it's no longer in eligiblePartnerIds (status flipped to
  // closed, cooldown entry, focused-set mutation). Without this the Begin
  // button stays enabled with a stale pick and `commitDateBooking` throws
  // "That member is not on tonight's roster." after the player clicks.
  useEffect(() => {
    if (activeBooking !== null) return;
    if (partnerId === null) return;
    if (eligiblePartnerIds.has(partnerId)) return;
    dispatch({ type: "cancelPair" });
  }, [activeBooking, dispatch, partnerId, eligiblePartnerIds]);

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

  const handleMakeLead = useCallback(
    (memberId: string) => {
      dispatch({ type: "selectFocus", memberId });
      setActiveStarId(null);
    },
    [dispatch],
  );
  const handleMakePartner = useCallback(
    (memberId: string) => {
      dispatch({ type: "selectPartner", memberId });
      setActiveStarId(null);
    },
    [dispatch],
  );
  const handleMakeFocus = useMemo(
    () =>
      onAddFocus === undefined
        ? undefined
        : (memberId: string) => {
            onAddFocus(memberId);
            // Set this member as the lead only if there's no current lead —
            // mirrors the previous `setFocusId((current) => current ?? id)`
            // pattern that preserved an existing pick when the player added
            // more focused members.
            if (focusId === null) dispatch({ type: "selectFocus", memberId });
            setActiveStarId(null);
          },
    [dispatch, focusId, onAddFocus],
  );
  const hoverCardContext: HoverCardContext = {
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
    openCaseAndDismiss,
    onMakeLead: handleMakeLead,
    onMakePartner: handleMakePartner,
    onMakeFocus: handleMakeFocus,
  };
  const renderHoverCard = ({ star }: { star: StarMark }) =>
    renderLobbyHoverCard(hoverCardContext, star);

  const { openCaseMember, caseFilePrimaryAction } = useCaseFileAction({
    save,
    openCaseMemberId,
    focusedSet,
    onAddFocus,
    onRemoveFocus,
    onReselectFocus,
    setOpenCaseMemberId,
    requestReselectWithCandidate,
  });

  const memberByIdMap = useMemo(
    () => new Map(save.members.map((member) => [member.id, member] as const)),
    [save.members],
  );

  const pairDossierSlot = (
    <LobbyDossierSlot
      save={save}
      memberById={memberByIdMap}
      incidentEdgesByNode={incidentEdgesByNode}
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
        onSelect={(intent) => dispatch({ type: "setIntent", intent })}
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

  const openDeckFromCallout = useCallback(() => setScenarioMode("deck"), [setScenarioMode]);
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
      // Toggle: clicking the already-selected scenario clears it.
      const nextId = selectedScenarioId === id ? null : id;
      dispatch({ type: "selectScenario", scenarioId: nextId });
      return;
    }
    setExpandedDoorId((current) => (current === id ? null : id));
  };

  // Reselect mode hand-off: the constellation field steps aside for a dedicated
  // editor. The chrome slot still renders so the player isn't stranded outside
  // the app shell — but the leading back button retargets to cancelReselect so
  // it closes this screen instead of punching out of the shift.
  if (lobbyMode === "reselect" && reselectDraft !== null && reselectBaseline !== null) {
    return (
      <ReselectCaseManagerView
        chromeSlot={chromeSlot?.({ onBack: cancelReselect })}
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
        disableScrollLayerNav={disableScrollLayerNav || dateBookOpen}
        planningPairs={planningPairs}
      />
      {!dateBookOpen ? (
        <LobbyHudLayer
          chromeSlot={chromeSlot?.()}
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
          onRosterSubviewChange={handleRosterSubviewChange}
          onToggleArchive={toggleArchive}
          onClearArchiveSelection={archiveSelection === null ? undefined : clearArchiveSelection}
        />
      ) : null}
      <CathedralPanel
        open={viewMode === "tonight" && currentLayer === SCENARIO_FLYTHROUGH_LAYER}
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
        // Deck/Library tab toggle in the panel header — lets the player drop
        // staged cards and add new ones from the library without bouncing
        // through the lobby.
        onChangeMode={scenarioMode === "auto" ? undefined : setScenarioMode}
        reducedMotion={reducedMotion}
        containerRef={cathedralPanelRef}
        scrollRef={cathedralScrollRef}
        deckBookShards={scenarioMode === "auto" ? undefined : deckBookShards}
        // Surface deck-composition advisories in both deck and library modes
        // so the player can see what's missing from the deck while picking
        // additions from the library — not just while staring at the deck.
        composeWarnings={scenarioMode === "auto" ? undefined : deckComposeWarnings}
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
          queueTotal:
            focusedReadyClosurePairs.length === 0 ? undefined : focusedReadyClosurePairs.length,
          onPrevious: closureReadyPairIndex > 0 ? openPreviousClosure : undefined,
          onNext:
            closureReadyPairIndex >= 0 &&
            closureReadyPairIndex < focusedReadyClosurePairs.length - 1
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
