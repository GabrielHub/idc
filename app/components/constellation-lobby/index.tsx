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
 * Files fold (this iteration):
 *   - HoverDetailCard receives a recentNotesSlot via the Scene's
 *     renderHoverCard render-prop — production cards surface 1-2 most-
 *     recent player-visible memories alongside the dating-profile snippet.
 *   - SideRail's pairDossierSlot mounts the PairDossierShard when a pair
 *     is committed (focus + partner). The shard click opens the Notes
 *     glass overlay scoped to that pair.
 *   - Notes glass overlay (NotesOverlay) replaces the standalone Files
 *     room. onOpenClosures and onOpenFollowUps now open this overlay
 *     instead of routing to the dropped /files room.
 *   - Shift archive overlay (ShiftArchiveOverlay) surfaces past shifts
 *     during the File-shift flow, replacing the old Files-room archive.
 *
 * Still deliberately rough:
 *   - Planning tutorial routing completes the right steps, but visual
 *     coachmark placement on the 3D surfaces still needs a polish pass.
 *   - Closure uses a player-editable fallback summary panel until the AI
 *     generated summary affordance is reintroduced in the lobby.
 */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "motion/react";

import { Scene } from "./canvas-convention";
import { LayerIndicator } from "./layer-indicator";
import { BottomDock, CalloutCluster, SideRail } from "./lobby-hud";
import { ShiftBriefDock } from "./shift-brief-dock";
import type { DateScenario, GameSave, Member, ShiftState } from "../../domain/game";
import { starterScenarios } from "../../fixtures";
import { makePairId } from "../../services/game-seed";
import {
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  isMemberRosterFilterActive,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import { NotesOverlay } from "./notes-overlay";
import { ShiftArchiveOverlay } from "./shift-archive-overlay";
import { ShiftSkipConfirm } from "./shift-skip-confirm";
import { ClosurePanel } from "./closure-panel";
import { CaseFilePanel } from "./case-file-panel";
import { LensPanel } from "./lens-panel";
import { CaseManagerScreen } from "../case-manager-screen";
import { ArchiveEdgeTooltip } from "./archive-edge-tooltip";
import { ContextualPillRail } from "./contextual-pill-rail";
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
import { useRosterFold } from "./use-roster-fold";
import { useRosterKeyNavigation } from "./use-roster-key-navigation";
import { useShiftFilingState } from "./use-shift-filing-state";
import { PlanningTutorialOverlays, usePlanningTutorial } from "./planning-tutorial";
import { LobbyDossierSlot } from "./lobby-dossier-slot";
import { CathedralScenarioDetail } from "./cathedral-scenario-detail";
import type {
  ArchiveSelection,
  FlythroughLayer,
  LobbyState,
  RosterSubview,
  StarMark,
  ViewMode,
} from "./types";
import { CathedralPanel, type CathedralMode, type RiskFilter, type SortMode } from "./cathedral";
import type { ReadyClosurePair } from "../../services/closures";

type ScenarioMode = CathedralMode;

type ConstellationLobbyProps = {
  save: GameSave;
  shift: ShiftState;
  focusedMembers: Member[];
  drawnScenarios: DateScenario[];
  isActionPending: boolean;
  bookingLocked: boolean;
  readyClosurePairCount?: number;
  readyClosurePairs?: readonly ReadyClosurePair[];
  pendingFollowUpCount?: number;
  readyClosurePairIds?: ReadonlySet<string>;
  onBeginDate: (input: {
    focusMemberId: string;
    partnerMemberId: string;
    scenarioId: string;
  }) => void;
  onCancelBooking: () => void;
  onAddDeckCard: (cardId: string) => void;
  onRemoveDeckCard: (cardId: string) => void;
  onClosePair?: (input: { pairId: string; summary: string }) => Promise<boolean>;
  onCompleteShift?: () => void;
  /**
   * Open the Notes overlay focused on closure-ready pairs. Replaces the
   * dropped /files room navigation; the parent can pass a no-op to opt
   * out of the closure-pending callout.
   */
  onOpenClosures?: () => void;
  /**
   * Open the Notes overlay focused on pending follow-up dates. Replaces
   * the dropped /files room navigation; the parent can pass a no-op to
   * opt out of the follow-up callout.
   */
  onOpenFollowUps?: () => void;
  /**
   * Open a completed date session back into the live-date system so the
   * player can file a follow-up action. When provided, the lobby renders
   * one rose-tone callout per pending pair (instead of the aggregate
   * follow-ups callout) and routes the action through this handler.
   */
  onOpenDateSession?: (dateSessionId: string) => void;
  /** Roster fold context — used for the Lens panel's "ready to close" chip. */
  readyClosureMemberIds?: ReadonlySet<string>;
  /** Dev unveil toggle — when on, the case file ignores sealed gating. */
  revealAllMemberDetails?: boolean;
  onTutorialUpdate: (next: GameSave) => void;
  /** Roster fold focus operations — required to drive the folded affordances. */
  onAddFocus?: (memberId: string) => void;
  onRemoveFocus?: (memberId: string) => void;
  onReselectFocus?: (nextFocusIds: string[]) => void;
  /**
   * Slot for the shell chrome pills (punch out, AI status, settings, mute).
   * The lobby renders this in the top-left corner so the canvas can own the
   * frame; cupid-shell hides its own ShellChrome cream bar when the lobby is
   * the active screen and passes the same pills through here instead.
   */
  chromeSlot?: ReactNode;
};

const EMPTY_READY_CLOSURE_IDS: ReadonlySet<string> = new Set();

export function ConstellationLobby({
  save,
  shift,
  focusedMembers,
  drawnScenarios,
  isActionPending,
  bookingLocked,
  readyClosurePairCount = 0,
  readyClosurePairs = [],
  pendingFollowUpCount = 0,
  readyClosurePairIds = EMPTY_READY_CLOSURE_IDS,
  onBeginDate,
  onCancelBooking,
  onAddDeckCard,
  onRemoveDeckCard,
  onClosePair,
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
}: ConstellationLobbyProps) {
  const reducedMotion = useReducedMotion() === true;
  const activeBooking = shift.activeBooking ?? null;

  // Layer 0 reads as a picker — the 4 focused leads sit on the focus slab and
  // the player taps one to commit it as this shift's focus case. Do not
  // auto-pick from `focusedMembers[0]`; that collapses the picker into a
  // single-portrait "focus locked" screen on first render. The only legitimate
  // initial focus is a resumed `activeBooking` — restoring an in-flight pair.
  const [focusId, setFocusId] = useState<string | null>(activeBooking?.focusMemberId ?? null);
  useEffect(() => {
    setFocusId((current) => {
      if (activeBooking?.focusMemberId !== undefined) return activeBooking.focusMemberId;
      if (current !== null && save.focusedMemberIds.includes(current)) return current;
      return null;
    });
  }, [activeBooking, save.focusedMemberIds]);
  // `participantIds` is `[focus, partner]` by convention — pull the second
  // slot to seed the partner state for an in-flight booking.
  const [partnerId, setPartnerId] = useState<string | null>(
    activeBooking?.participantIds[1] ?? null,
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
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
  const {
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
  } = usePlanningTutorial({
    save,
    focusId,
    partnerId,
    activeBooking,
    selectedScenarioId,
    currentLayer,
    shift,
    fileShiftReady,
    onTutorialUpdate,
  });
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("auto");
  /**
   * Roster-slab subview controls which cohort the constellation spotlights on
   * layer 1. Defaults to "eligibles" — tonight's available partners lead the
   * eye, off-tonight members recede. The two-segment pill on layer 1 flips
   * this so the player can scan rested members without leaving the slab.
   */
  const [rosterSubview, setRosterSubview] = useState<RosterSubview>("eligibles");

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
    onCaseFileClose: () => setOpenCaseMemberId(null),
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

  const stars = useMemo(
    () => buildLobbyStars(save.members, shift, focusedMembers),
    [save.members, shift, focusedMembers],
  );

  // Explicit LobbyState union — without it, TS narrows the return type to
  // exclude "callout_heavy" (the lobby doesn't produce it today) and
  // downstream comparisons lose their full-union read.
  const lobbyState = useMemo<LobbyState>(() => {
    if (focusId === null) return "idle";
    if (partnerId === null) return "focus_selected";
    if (activeBooking === null) return "partner_selected";
    if (selectedScenarioId === null) return "committed_pair";
    return "scenario_chosen";
  }, [focusId, partnerId, activeBooking, selectedScenarioId]);

  const focusStar = useMemo(
    () => (focusId === null ? undefined : stars.find((s) => s.member.id === focusId)),
    [stars, focusId],
  );
  const partnerStar = useMemo(
    () => (partnerId === null ? undefined : stars.find((s) => s.member.id === partnerId)),
    [stars, partnerId],
  );

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
    cathedralDoors,
    expandedScenario,
  } = useCathedralModel({
    save,
    shift,
    drawnScenarios,
    scenarioMode,
    librarySearch,
    libraryRiskFilter,
    librarySort,
    expandedDoorId,
  });

  const handleBeginDate = () => {
    if (isActionPending) return;
    if (focusId === null || partnerId === null) return;
    if (selectedScenarioId === null) return;
    if (commitStep.active) commitStep.complete();
    if (beginStep.active) beginStep.complete();
    onBeginDate({
      focusMemberId: focusId,
      partnerMemberId: partnerId,
      scenarioId: selectedScenarioId,
    });
  };

  const handleCancelPair = () => {
    setPartnerId(null);
    setSelectedScenarioId(null);
    setScenarioMode("auto");
    if (activeBooking !== null) onCancelBooking();
  };

  const handleDateBookNavToggle = () => {
    if (bookingLocked) return;
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
      setCurrentLayer(lobbyState === "committed_pair" ? 2 : 0);
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
    setCurrentLayer(lobbyState === "committed_pair" ? 2 : 0);
  }, [scenarioMode, lobbyState]);

  // Auto-advance the flythrough as the booking assembles: focus pick warps to
  // the roster slab so the partner picker opens, and a committed pair warps to
  // the cathedral so the player picks tonight's scenario inside the nave
  // instead of through a floating overlay. Each fires once per state
  // transition; subsequent wheel/keyboard input is free to scroll back to an
  // earlier layer (e.g. to switch focus from the cluster on layer 0).
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

  const committedPairId = useMemo<string | null>(() => {
    if (activeBooking !== null) return activeBooking.pairId;
    if (focusId === null || partnerId === null) return null;
    return makePairId(focusId, partnerId);
  }, [activeBooking, focusId, partnerId]);
  const {
    readyPair: closureReadyPair,
    readyPairIndex: closureReadyPairIndex,
    fallbackSummary: fallbackClosureSummary,
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

  const { focusedSet, eligiblePartnerIds, offTonightIds, filteredMembers, filterMatchedIds } =
    useRosterFold({
      save,
      shift,
      filterState,
      revealAllMemberDetails,
      readyClosureMemberIds,
      reselectDraft,
    });

  const isOverlayOpen = modalOverlayOpen || openCaseMemberId !== null;
  useRosterKeyNavigation({
    viewMode,
    isOverlayOpen,
    rosterSubview,
    eligiblePartnerIds,
    offTonightIds,
    activeStarId,
    currentLayer,
    onLayerChange: setCurrentLayer,
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

  // Click handlers wired into Scene: in reselect, toggle the draft directly
  // (the card concept doesn't fit there — the dock is the affordance). In
  // browse, click morphs the star into its `HoverDetailCard`; the card's
  // buttons drive focus/partner selection and case-file zoom.
  const handleStarClick = useCallback(
    (star: StarMark) => {
      if (lobbyMode === "reselect") {
        if (star.member.state.status !== "active") return;
        toggleReselectMember(star.member.id);
        return;
      }
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
    [lobbyMode, viewMode],
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

  const openDeckFromCallout = useCallback(() => setScenarioMode("deck"), []);
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

  const showCallouts = callouts.length > 0;

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
      <div className="relative min-h-screen w-full text-aura-paper">
        {chromeSlot === undefined ? null : (
          <div className="pointer-events-none absolute left-6 top-5 z-50 flex items-center gap-2">
            <div className="pointer-events-auto flex items-center gap-2">{chromeSlot}</div>
          </div>
        )}
        <CaseManagerScreen
          members={save.members}
          save={save}
          draftIds={reselectDraft}
          baselineFocusedIds={reselectBaseline}
          playerKnowledge={save.playerKnowledge}
          isActionPending={isActionPending}
          revealAllMemberDetails={revealAllMemberDetails}
          onTutorialUpdate={onTutorialUpdate}
          onToggleMember={toggleReselectMember}
          onCancel={cancelReselect}
          onConfirm={confirmReselect}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a0f2e] text-aura-paper">
      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.6]}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, 17], fov: 38, near: 0.1, far: 80 }}
          onPointerMissed={() => {
            setActiveStarId(null);
            // Clicking the canvas around the panel (or stars between cards)
            // counts as "outside" the date book — drop deck/library back to
            // auto so the player has a frictionless exit without hunting for
            // the date-book pill.
            closeDateBook();
          }}
        >
          <Suspense fallback={null}>
            <Scene
              state={lobbyState}
              stars={stars}
              focusStar={focusStar}
              partnerStar={partnerStar}
              cameraTarget={cameraTarget}
              showAuras={true}
              showParallax={true}
              reducedMotion={reducedMotion}
              renderHoverCard={renderHoverCard}
              starClickHandlers={{
                onStarClick: handleStarClick,
                onStarDoubleClick: handleStarDoubleClick,
                eligiblePartnerIds,
                filterMatchedIds,
              }}
              activeStarId={activeStarId}
              onActiveStarChange={setActiveStarId}
              currentLayer={currentLayer}
              onLayerChange={setCurrentLayer}
              focusedIds={focusedSet}
              offTonightSet={offTonightIds}
              rosterSubview={rosterSubview}
              viewMode={viewMode}
              archiveData={
                viewMode === "archive"
                  ? { positions: archivePositions, edges: archiveEdges }
                  : undefined
              }
              archiveSelection={archiveSelection}
              archiveIsolation={archiveIsolation}
              onArchiveEdgeClick={(pairId) => setArchiveSelection({ kind: "pair", pairId })}
              renderArchiveEdgeTooltip={(edge) => (
                <ArchiveEdgeTooltip edge={edge} memberById={memberByIdMap} />
              )}
            />
          </Suspense>
        </Canvas>
      </div>
      {chromeSlot === undefined ? null : (
        <div className="pointer-events-none absolute left-6 top-5 z-30 flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-2">{chromeSlot}</div>
        </div>
      )}
      {viewMode === "tonight" ? (
        <LayerIndicator
          currentLayer={currentLayer}
          onLayerSelect={setCurrentLayer}
          containerRef={layerIndicatorRef}
          layerRefs={{ 0: layerFocusRef, 1: layerRosterRef, 2: layerCathedralRef }}
        />
      ) : null}
      <SideRail
        focus={focusStar}
        partner={partnerStar}
        pairDossierSlot={pairDossierSlot}
        containerRef={sideRailRef}
      />
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
        deckBookShards={scenarioMode === "auto" ? undefined : deckBookShards}
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
      <CathedralScenarioDetail
        scenario={expandedScenario}
        mode={scenarioMode}
        save={save}
        effectiveCosts={effectiveCosts}
        bookingLocked={bookingLocked}
        isActionPending={isActionPending}
        onAddDeckCard={onAddDeckCard}
        onRemoveDeckCard={onRemoveDeckCard}
        onClose={() => setExpandedDoorId(null)}
      />
      {showCallouts ? <CalloutCluster callouts={callouts} /> : null}
      <BottomDock
        state={lobbyState}
        selectedScenarioId={selectedScenarioId}
        beginDisabled={isActionPending}
        onBeginDate={handleBeginDate}
        onCancelPair={handleCancelPair}
        beginButtonRef={beginButtonRef}
      />
      <ShiftBriefDock rows={shiftBriefRows} />
      <NotesOverlay
        open={notesOverlay.open}
        memories={save.memories}
        members={save.members}
        pairEdges={save.pairStates}
        scenarios={starterScenarios}
        playerKnowledge={save.playerKnowledge}
        readyClosurePairIds={readyClosurePairIds}
        initialPairFocusId={notesOverlay.pairFocusId}
        onClose={closeNotesOverlay}
      />
      <ShiftArchiveOverlay
        open={isShiftArchiveOpen}
        shifts={save.shifts}
        members={save.members}
        onClose={() => setIsShiftArchiveOpen(false)}
      />

      <ContextualPillRail
        scenarioMode={scenarioMode}
        bookingLocked={bookingLocked}
        deckRepairBlocked={deckRepairBlocked}
        currentLayer={currentLayer}
        rosterSubview={rosterSubview}
        filterActive={isMemberRosterFilterActive(filterState)}
        canReselect={onReselectFocus !== undefined}
        viewMode={viewMode}
        archiveEdgeCount={archiveEdges.length}
        fileShiftBlockedReason={fileShiftBlockedReason}
        onCompleteShift={() => {
          if (noDatesThisShift) {
            setSkipShiftConfirmOpen(true);
            return;
          }
          if (fileShiftStep.active) fileShiftStep.complete();
          onCompleteShift?.();
        }}
        onOpenNotes={() => openNotesOverlay(null)}
        onOpenShiftArchive={() => setIsShiftArchiveOpen(true)}
        onToggleDateBook={handleDateBookNavToggle}
        onOpenLens={() => setIsLensOpen(true)}
        onToggleReselect={() => (lobbyMode === "reselect" ? cancelReselect() : enterReselect())}
        onRosterSubviewChange={setRosterSubview}
        onToggleArchive={() =>
          setViewMode((current) => (current === "archive" ? "tonight" : "archive"))
        }
        onClearArchiveSelection={
          archiveSelection === null ? undefined : () => setArchiveSelection(null)
        }
        archiveSelectionActive={archiveSelection !== null}
        fileShiftButtonRef={fileShiftButtonRef}
      />

      <ClosurePanel
        readyPair={closureReadyPair}
        defaultSummary={fallbackClosureSummary}
        isActionPending={isActionPending}
        queuePosition={closureReadyPairIndex < 0 ? undefined : closureReadyPairIndex + 1}
        queueTotal={readyClosurePairs.length === 0 ? undefined : readyClosurePairs.length}
        onPrevious={closureReadyPairIndex > 0 ? openPreviousClosure : undefined}
        onNext={
          closureReadyPairIndex >= 0 && closureReadyPairIndex < readyClosurePairs.length - 1
            ? openNextClosure
            : undefined
        }
        onClose={() => setClosurePairId(null)}
        onConfirm={async (input) => {
          const filed = await onClosePair?.(input);
          if (filed === true) {
            setClosurePairId(null);
          }
        }}
      />

      <PlanningTutorialOverlays
        steps={{ focusStep, partnerStep, commitStep, scenarioStep, beginStep, fileShiftStep }}
        refs={{
          layerIndicatorRef,
          layerFocusRef,
          layerRosterRef,
          layerCathedralRef,
          sideRailRef,
          cathedralPanelRef,
          beginButtonRef,
          fileShiftButtonRef,
        }}
        viewMode={viewMode}
      />

      <LensPanel
        isOpen={isLensOpen}
        filterState={filterState}
        matchCount={filteredMembers.length}
        totalCount={save.members.length}
        onChange={setFilterState}
        onClose={() => setIsLensOpen(false)}
      />

      {openCaseMember === null ? null : (
        <CaseFilePanel
          member={openCaseMember}
          playerKnowledge={save.playerKnowledge}
          revealAllDetails={revealAllMemberDetails}
          save={save}
          isFocused={focusedSet.has(openCaseMember.id)}
          status={
            openCaseMember.state.status === "closed"
              ? "closed"
              : openCaseMember.state.status === "quit"
                ? "quit"
                : "active"
          }
          primaryAction={caseFilePrimaryAction}
          onClose={() => setOpenCaseMemberId(null)}
        />
      )}

      <ShiftSkipConfirm
        open={skipShiftConfirmOpen}
        shiftNumber={shift.shiftNumber}
        isActionPending={isActionPending}
        onCancel={() => setSkipShiftConfirmOpen(false)}
        onConfirm={() => {
          setSkipShiftConfirmOpen(false);
          if (fileShiftStep.active) fileShiftStep.complete();
          onCompleteShift?.();
        }}
      />
    </div>
  );
}
