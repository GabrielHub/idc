/**
 * Production constellation lobby. Drop-in replacement for the old
 * PreDateCanvas: accepts the same prop bag CupidShellInner already hands
 * down, manages its own selection state (focus / partner / scenario /
 * intent), and routes Begin-date through the existing onCommitPair →
 * onStartDate sequence.
 *
 * This composes the shared canvas convention (Scene, TopBar, SideRail,
 * BottomDock, ScenarioPanel, CalloutCluster). The old spike route has been
 * retired; this file is now the production owner that / renders through
 * CupidShell, while the convention module remains the temporary single source
 * of truth for the visual language.
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
 * Out of scope for this fold:
 *   - Match-fit-driven eligibility (currently any active+ready member can
 *     be a partner; matches the spike's looseness, not real game rules)
 *   - AI readiness and tutorial coachmark routing
 *   - Closure / end-shift wiring (NotesOverlay does not yet surface a
 *     "file closure" action; cupid-shell's old closure handlers were
 *     removed when the rooms were dropped — re-wire through the lobby's
 *     onOpenClosures path when the closure UI is redesigned)
 */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "motion/react";

import {
  BottomDock,
  CalloutCluster,
  HoverDetailCard,
  LayerIndicator,
  Scene,
  SideRail,
} from "./canvas-convention";
import { caseFileNumber } from "../member-card-atoms";
import type {
  DateScenario,
  GameSave,
  MatchmakingIntent,
  Member,
  PlayerKnowledgeRecord,
  ShiftState,
} from "../../domain/game";
import { starterScenarios } from "../../fixtures";
import { makePairId } from "../../services/game-seed";
import {
  canBeFocusCase,
  FOCUS_CASE_LIMIT,
  FOCUS_SWAP_RETENTION_PENALTY,
} from "../../services/focus-cases";
import { buildVisibleMemberProfile } from "../../services/player-knowledge";
import {
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  isMemberRosterFilterActive,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import { NotesOverlay } from "./notes-overlay";
import { MemberArchiveShard } from "./member-archive-shard";
import { PairDossierShard } from "./pair-dossier-shard";
import { RecentNotesSlot } from "./recent-notes-slot";
import { ShiftArchiveOverlay } from "./shift-archive-overlay";
import { CaseFilePanel } from "./case-file-panel";
import { LensPanel } from "./lens-panel";
import { ReselectDock } from "./reselect-dock";
import { ArchiveEdgeTooltip } from "./archive-edge-tooltip";
import { ContextualPillRail } from "./contextual-pill-rail";
import { pickHeaviestAxisLevel } from "./deck-composition";
import { buildLobbyStars } from "./star-model";
import { useArchiveView } from "./use-archive-view";
import { useCathedralModel } from "./use-cathedral-model";
import { useLobbyCallouts } from "./use-lobby-callouts";
import { useRosterFold } from "./use-roster-fold";
import { CathedralScenarioDetail } from "./cathedral-scenario-detail";
import type {
  ArchiveSelection,
  FlythroughLayer,
  LobbyState,
  RosterSubview,
  StarMark,
  ViewMode,
} from "./types";
import {
  CathedralFilterRail,
  CathedralPanel,
  type CathedralMode,
  type RiskFilter,
  type SortMode,
} from "./cathedral";

type ScenarioMode = CathedralMode;

type ConstellationLobbyProps = {
  save: GameSave;
  shift: ShiftState;
  focusedMembers: Member[];
  drawnScenarios: DateScenario[];
  isActionPending: boolean;
  bookingLocked: boolean;
  readyClosurePairCount?: number;
  pendingFollowUpCount?: number;
  readyClosurePairIds?: ReadonlySet<string>;
  onCommitPair: (input: {
    focusMemberId: string;
    partnerMemberId: string;
    matchmakingIntent?: MatchmakingIntent;
  }) => void;
  onStartDate: (input: { scenarioId: string }) => void;
  onCancelBooking: () => void;
  onAddDeckCard: (cardId: string) => void;
  onRemoveDeckCard: (cardId: string) => void;
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
  /** Roster fold focus operations — required to drive the folded affordances. */
  onAddFocus?: (memberId: string) => void;
  onRemoveFocus?: (memberId: string) => void;
  onSwapFocus?: (oldId: string, newId: string) => void;
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
  pendingFollowUpCount = 0,
  readyClosurePairIds = EMPTY_READY_CLOSURE_IDS,
  onCommitPair,
  onStartDate,
  onCancelBooking,
  onAddDeckCard,
  onRemoveDeckCard,
  onOpenClosures,
  onOpenFollowUps,
  onOpenDateSession,
  readyClosureMemberIds,
  revealAllMemberDetails = false,
  onAddFocus,
  onRemoveFocus,
  onSwapFocus,
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
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("auto");
  /**
   * Flythrough layer the player has scrolled into. 0 = focus cases, 1 =
   * tonight's eligibles, 2 = off-tonight, 3 = scenarios (rendered as 3D
   * card meshes inside the canvas via Scene's ScenarioCardField3D). The
   * Scene mounts a wheel handler that calls `setCurrentLayer` per scroll
   * tick, throttled so a single wheel notch advances one layer.
   */
  const [currentLayer, setCurrentLayer] = useState<FlythroughLayer>(0);
  /**
   * Roster-slab subview controls which cohort the constellation spotlights on
   * layer 1. Defaults to "eligibles" — tonight's available partners lead the
   * eye, off-tonight members recede. The two-segment pill on layer 1 flips
   * this so the player can scan rested members without leaving the slab.
   */
  const [rosterSubview, setRosterSubview] = useState<RosterSubview>("eligibles");

  // Roster fold state. lobbyMode toggles between browse and reselect; the
  // case file overlay opens from HoverDetailCard's "Open case" or a double
  // click on a star; the lens panel opens from a small action pill below
  // the TopBar.
  const [lobbyMode, setLobbyMode] = useState<"browse" | "reselect">("browse");
  const [reselectDraft, setReselectDraft] = useState<readonly string[] | null>(null);
  const [openCaseMemberId, setOpenCaseMemberId] = useState<string | null>(null);
  // Active star whose `HoverDetailCard` is morphed open. Click-driven (not
  // hover), since the bigger detail card is too eager to flash on every
  // pointer pass through the dense field.
  const [activeStarId, setActiveStarId] = useState<string | null>(null);
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [filterState, setFilterState] = useState<MemberRosterFilterState>(
    DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  );
  /**
   * Files-fold overlays. notesOverlay holds the open flag and the optional
   * pair-focus id used to scope the overlay when the user enters it from the
   * SideRail PairDossierShard or the closure / follow-up callouts.
   */
  const [notesOverlay, setNotesOverlay] = useState<{
    open: boolean;
    pairFocusId: string | null;
  }>({ open: false, pairFocusId: null });
  const [isShiftArchiveOpen, setIsShiftArchiveOpen] = useState(false);

  // Cathedral state. The cathedral is the layer-2 surface that renders all
  // date cards as 3D doors lining a nave. `expandedDoorId` is the door the
  // player has opened (single-clicked) so the detail overlay can mount with
  // the right scenario context. The hover id drives the door's hover bloom.
  // Library filter/sort state lifts out of the old `LibraryModePanel`; the
  // cathedral filter rail at the top of the screen owns these now.
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
      stars,
      viewMode,
      archiveSelection,
      currentLayer,
      lobbyState,
      focusStar,
    });

  const {
    effectiveCosts,
    budgetStatus,
    deckRepairBlocked,
    deckComposition,
    filteredLibrary,
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
    if (activeBooking === null) {
      onCommitPair({ focusMemberId: focusId, partnerMemberId: partnerId });
    }
    if (selectedScenarioId !== null) {
      onStartDate({ scenarioId: selectedScenarioId });
    }
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

  // Auto-zoom into the cathedral the moment a pair is committed so the
  // player picks tonight's scenario inside the nave instead of through a
  // floating overlay. This fires once per state transition into
  // `committed_pair`; subsequent layer changes from the wheel handler are
  // free to scroll back to the member layers.
  useEffect(() => {
    if (lobbyState === "committed_pair") setCurrentLayer(2);
  }, [lobbyState]);

  /**
   * Files-fold openers. The Notes glass overlay (and shift-archive overlay)
   * replace the dropped /files room — the parent's onOpenClosures / onOpenFollowUps
   * still fire so existing callers keep working, but the local opener
   * surfaces the new overlay first.
   */
  const openNotesOverlay = useCallback((pairFocusId: string | null) => {
    setNotesOverlay({ open: true, pairFocusId });
  }, []);
  const closeNotesOverlay = useCallback(() => {
    setNotesOverlay({ open: false, pairFocusId: null });
  }, []);
  const handleOpenClosures = useCallback(() => {
    openNotesOverlay(null);
    onOpenClosures?.();
  }, [onOpenClosures, openNotesOverlay]);
  const handleOpenFollowUps = useCallback(() => {
    openNotesOverlay(null);
    onOpenFollowUps?.();
  }, [onOpenFollowUps, openNotesOverlay]);

  const committedPairId = useMemo<string | null>(() => {
    if (activeBooking !== null) return activeBooking.pairId;
    if (focusId === null || partnerId === null) return null;
    return makePairId(focusId, partnerId);
  }, [activeBooking, focusId, partnerId]);

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
    filteredMembers,
    filterMatchedIds,
    draftCount,
    draftFull,
    reselectDrops,
    totalDropCost,
  } = useRosterFold({
    save,
    shift,
    filterState,
    revealAllMemberDetails,
    readyClosureMemberIds,
    reselectDraft,
  });

  const enterReselect = () => {
    if (lobbyMode === "reselect") return;
    const seed = save.focusedMemberIds.filter((id) => {
      const m = save.members.find((c) => c.id === id);
      return m !== undefined && m.state.status === "active";
    });
    setReselectDraft(seed);
    setLobbyMode("reselect");
    setOpenCaseMemberId(null);
  };
  const cancelReselect = () => {
    setReselectDraft(null);
    setLobbyMode("browse");
  };
  const toggleReselectMember = (memberId: string) => {
    setReselectDraft((current) => {
      if (current === null) return current;
      if (current.includes(memberId)) return current.filter((id) => id !== memberId);
      if (current.length >= FOCUS_CASE_LIMIT) return current;
      return [...current, memberId];
    });
  };
  const confirmReselect = () => {
    if (reselectDraft === null || reselectDraft.length !== FOCUS_CASE_LIMIT) return;
    onReselectFocus?.([...reselectDraft]);
    setReselectDraft(null);
    setLobbyMode("browse");
  };

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

  // HoverDetailCard receives both Roster fold context (file number, sealed/
  // known counts, knowledge-gated snippet, swap penalty, context-aware CTA)
  // and the Files agent's recentNotesSlot.
  const renderHoverCard = useCallback(
    ({ star }: { star: StarMark }) => {
      const member = star.member;
      const profile = buildVisibleMemberProfile(
        member,
        save.playerKnowledge as readonly PlayerKnowledgeRecord[],
        {
          visibilityMode: revealAllMemberDetails ? "dev_unveiled" : "earned",
        },
      );
      const isFocused = focusedSet.has(member.id);
      const status = member.state.status;
      const slotsFull = save.focusedMemberIds.length >= FOCUS_CASE_LIMIT;
      const eligibleForFocus = canBeFocusCase(member);
      // In focus_selected, an active non-focus member that's an eligible
      // partner becomes the candidate to seal the pair. The card's primary
      // CTA reflects that — "Make partner" sets partnerId and closes the
      // card so the player drops back to the dock to confirm.
      const isPartnerCandidate =
        focusId !== null &&
        partnerId === null &&
        member.id !== focusId &&
        status === "active" &&
        eligiblePartnerIds.has(member.id);

      // A focused lead becomes pickable as the focus case while the booking
      // is still being assembled — i.e. no committed pair, no partner queued.
      // Once a partner is queued or the pair is committed, focus locks.
      const isFocusPickable =
        isFocused &&
        status === "active" &&
        member.id !== focusId &&
        partnerId === null &&
        activeBooking === null;

      let ctaVariant: "make_focus" | "make_partner" | "swap_into_focus" | "view_case" = "view_case";
      let onPrimaryAction: (() => void) | undefined = undefined;

      if (isFocusPickable) {
        // Layer-0 picker: clicking a focused lead's card commits it as this
        // shift's focus case so the partner stage can open.
        ctaVariant = "make_focus";
        onPrimaryAction = () => {
          setFocusId(member.id);
          setActiveStarId(null);
        };
      } else if (status !== "active" || isFocused) {
        ctaVariant = "view_case";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else if (isPartnerCandidate) {
        ctaVariant = "make_partner";
        onPrimaryAction = () => {
          setPartnerId(member.id);
          setActiveStarId(null);
        };
      } else if (!eligibleForFocus) {
        ctaVariant = "view_case";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else if (slotsFull) {
        ctaVariant = "swap_into_focus";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else {
        ctaVariant = "make_focus";
        onPrimaryAction =
          onAddFocus === undefined
            ? undefined
            : () => {
                onAddFocus(member.id);
                setFocusId((current) => current ?? member.id);
                setActiveStarId(null);
              };
      }

      const statusBadge: "active" | "focus" | "closed" | "quit" =
        status === "closed"
          ? "closed"
          : status === "quit"
            ? "quit"
            : isFocused
              ? "focus"
              : "active";

      return (
        <HoverDetailCard
          star={star}
          snippet={profile.publicFragments[0] ?? "Profile reads on file."}
          fileNumber={caseFileNumber(member.id)}
          heightInInches={member.characterHeightInInches}
          sealedCount={profile.redactedBlocks.length}
          knownCount={profile.revealedReads.length}
          statusBadge={statusBadge}
          swapPenalty={ctaVariant === "swap_into_focus" ? FOCUS_SWAP_RETENTION_PENALTY : undefined}
          ctaVariant={ctaVariant}
          onPrimaryAction={onPrimaryAction}
          onOpenCase={() => openCaseAndDismiss(member.id)}
          recentNotesSlot={<RecentNotesSlot memberId={member.id} memories={save.memories} />}
        />
      );
    },
    [
      save.playerKnowledge,
      save.focusedMemberIds.length,
      save.memories,
      focusedSet,
      revealAllMemberDetails,
      onAddFocus,
      focusId,
      partnerId,
      activeBooking,
      eligiblePartnerIds,
      openCaseAndDismiss,
    ],
  );

  // Case file overlay primary action — same logic as renderHoverCard's CTA
  // chooser but rendered inside the panel's action row.
  const openCaseMember = useMemo(
    () =>
      openCaseMemberId === null
        ? null
        : (save.members.find((m) => m.id === openCaseMemberId) ?? null),
    [openCaseMemberId, save.members],
  );
  const caseFilePrimaryAction = useMemo(() => {
    if (openCaseMember === null) return undefined;
    if (openCaseMember.state.status !== "active") return undefined;
    const isFocused = focusedSet.has(openCaseMember.id);
    const slotsFull = save.focusedMemberIds.length >= FOCUS_CASE_LIMIT;
    if (isFocused) {
      if (onRemoveFocus === undefined) return undefined;
      return {
        label: "Drop from focus",
        onClick: () => {
          onRemoveFocus(openCaseMember.id);
          setOpenCaseMemberId(null);
        },
      };
    }
    if (!canBeFocusCase(openCaseMember)) return undefined;
    if (slotsFull) {
      if (onSwapFocus === undefined) return undefined;
      const dropTargetId = save.focusedMemberIds.find((id) => {
        const m = save.members.find((c) => c.id === id);
        return m !== undefined && m.state.status === "active";
      });
      if (dropTargetId === undefined) return undefined;
      return {
        label: `Swap into focus  ·  −${FOCUS_SWAP_RETENTION_PENALTY} retention`,
        onClick: () => {
          onSwapFocus(dropTargetId, openCaseMember.id);
          setOpenCaseMemberId(null);
        },
      };
    }
    if (onAddFocus === undefined) return undefined;
    return {
      label: "Add as focus case",
      onClick: () => {
        onAddFocus(openCaseMember.id);
        setOpenCaseMemberId(null);
      },
    };
  }, [
    openCaseMember,
    focusedSet,
    save.focusedMemberIds,
    save.members,
    onAddFocus,
    onRemoveFocus,
    onSwapFocus,
  ]);

  const memberByIdMap = useMemo(
    () => new Map(save.members.map((member) => [member.id, member] as const)),
    [save.members],
  );

  // Side-rail dossier resolution. Three cases:
  //  1. archive + member selection → MemberArchiveShard listing their pairs
  //  2. archive + pair selection (or tonight + committed pair) → PairDossierShard
  //  3. nothing → empty slot
  const archiveFocusedMember =
    viewMode === "archive" && archiveSelection?.kind === "member"
      ? (memberByIdMap.get(archiveSelection.memberId) ?? null)
      : null;
  const archiveFocusedIncidentEdges = useMemo(() => {
    if (archiveFocusedMember === null) return [];
    const edges = archiveGraph.incidentEdgesByNode.get(archiveFocusedMember.id) ?? [];
    return [...edges].sort((a, b) => b.latestNoteAt - a.latestNoteAt);
  }, [archiveFocusedMember, archiveGraph.incidentEdgesByNode]);
  const dossierPairId =
    viewMode === "archive" && archiveSelection?.kind === "pair"
      ? archiveSelection.pairId
      : committedPairId;
  const pairDossierSlot =
    archiveFocusedMember !== null ? (
      <MemberArchiveShard
        focusMember={archiveFocusedMember}
        incidentEdges={archiveFocusedIncidentEdges}
        memberById={memberByIdMap}
        onSelectPair={(pairId) => setArchiveSelection({ kind: "pair", pairId })}
      />
    ) : dossierPairId === null ? undefined : (
      <PairDossierShard
        pairId={dossierPairId}
        pairState={save.pairStates.find((p) => p.id === dossierPairId)}
        members={save.members}
        memories={save.memories}
        playerKnowledge={save.playerKnowledge}
        readyClosurePairIds={readyClosurePairIds}
        onOpenNotes={openNotesOverlay}
      />
    );

  /**
   * Deck-composition shards rendered only while the player is in date book
   * mode. The old TopBar surfaced these globally; we now keep the canvas
   * clean and surface slots / budget / axes / pressure as a single floating
   * pill row that fades in alongside the deck or library panel.
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
  const showLibraryFilterRail = scenarioMode === "library" && !bookingLocked && currentLayer === 2;

  /**
   * Door click routes to one of two flows. In auto mode (committed pair
   * picking tonight's scenario) the click sets `selectedScenarioId` so the
   * BottomDock's Begin-date button can fire. In deck / library mode the
   * click opens the detail overlay so the player can read the brief and
   * fire the mode-specific CTA (Drop / Add).
   */
  const handleDoorClick = (id: string) => {
    if (scenarioMode === "auto") {
      setSelectedScenarioId((current) => (current === id ? null : id));
      return;
    }
    setExpandedDoorId((current) => (current === id ? null : id));
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07041a] text-aura-paper">
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
          onPointerMissed={() => setActiveStarId(null)}
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
        <LayerIndicator currentLayer={currentLayer} onLayerSelect={setCurrentLayer} />
      ) : null}
      <SideRail
        state={lobbyState}
        focus={focusStar}
        partner={partnerStar}
        pairDossierSlot={pairDossierSlot}
      />
      <CathedralPanel
        open={viewMode === "tonight" && currentLayer === 2}
        mode={scenarioMode}
        doors={cathedralDoors}
        selectedId={scenarioMode === "auto" ? selectedScenarioId : expandedDoorId}
        hoveredId={hoveredDoorId}
        onHover={setHoveredDoorId}
        onSelect={handleDoorClick}
        reducedMotion={reducedMotion}
      />
      <CathedralFilterRail
        open={showLibraryFilterRail}
        matchCount={filteredLibrary.length}
        search={librarySearch}
        riskFilter={libraryRiskFilter}
        sortMode={librarySort}
        onSearchChange={setLibrarySearch}
        onRiskFilterChange={setLibraryRiskFilter}
        onSortChange={setLibrarySort}
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
      />
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
      {/* sr-only opener that surfaces the shift archive — TopBar's "File shift"
          NavShard onClick threading lands as a follow-up. The button keeps
          the overlay reachable via accessibility tools and dev testing. */}
      <button
        type="button"
        onClick={() => setIsShiftArchiveOpen(true)}
        className="sr-only"
        aria-label="Open shift archive"
      />
      {/* sr-only opener that surfaces the notes overlay — TopBar's "Notes"
          NavShard onClick threading lands as a follow-up. */}
      <button
        type="button"
        onClick={() => openNotesOverlay(null)}
        className="sr-only"
        aria-label="Open notes archive"
      />

      <ContextualPillRail
        scenarioMode={scenarioMode}
        bookingLocked={bookingLocked}
        deckRepairBlocked={deckRepairBlocked}
        currentLayer={currentLayer}
        rosterSubview={rosterSubview}
        filterActive={isMemberRosterFilterActive(filterState)}
        deckBookShards={deckBookShards}
        reselectMode={lobbyMode === "reselect"}
        canReselect={onReselectFocus !== undefined}
        viewMode={viewMode}
        archiveEdgeCount={archiveEdges.length}
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
          playerKnowledge={save.playerKnowledge as readonly PlayerKnowledgeRecord[]}
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

      {lobbyMode === "reselect" && reselectDraft !== null ? (
        <ReselectDock
          draftCount={draftCount}
          drops={reselectDrops}
          totalDropCost={totalDropCost}
          isActionPending={isActionPending}
          draftFull={draftFull}
          onCancel={cancelReselect}
          onConfirm={confirmReselect}
        />
      ) : null}
    </div>
  );
}
