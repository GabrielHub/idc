/**
 * Production constellation lobby. Drop-in replacement for the old
 * PreDateCanvas: accepts the same prop bag CupidShellInner already hands
 * down, manages its own selection state (focus / partner / scenario /
 * intent), and routes Begin-date through the existing onCommitPair →
 * onStartDate sequence.
 *
 * This composes the spike's exported components (Scene, TopBar, SideRail,
 * BottomDock, ScenarioPanel, CalloutCluster) — the spike still lives at
 * /constellation-lobby-spike for R&D, and this file is what /home (via
 * CupidShell) renders for real. The physical extraction of those
 * components into their own files is a follow-up cleanup; right now the
 * spike is the single source of truth for the lobby's visual language.
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

import { Suspense, useCallback, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { AnimatePresence, useReducedMotion } from "motion/react";

import {
  BottomDock,
  CalloutCluster,
  HoverDetailCard,
  Scene,
  ScenarioPanel,
  SideRail,
  TopBar,
  type Callout,
  type NavShardSpec,
  type ScenarioPanelMode,
  type StatusShardSpec,
} from "../../routes/constellation-lobby-spike";
import { getMemberAuraConfig } from "../member-aura-registry";
import { resolvePortraitPalette } from "../portrait-palette";
import { caseFileNumber } from "../member-card-atoms";
import { createSeededRandom } from "../../services/utils";
import {
  activeBudgetDiscountOffers,
  computeEffectiveCosts,
  deriveDeckBudgetStatus,
} from "../../services/budget";
import { pendingFollowUpSessionsForShift } from "../../services/date-engine";
import { deckIsRepairBlocked, softComposeWarnings } from "../../services/deck";
import { DECK_SIZE_MAX } from "../../domain/game";
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
import { isMemberInCooldown } from "../../services/shift-planning";
import {
  applyMemberRosterFilters,
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  isMemberRosterFilterActive,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import { computeCameraTarget } from "./math";
import { NotesOverlay } from "./notes-overlay";
import { PairDossierShard } from "./pair-dossier-shard";
import { RecentNotesSlot } from "./recent-notes-slot";
import { ShiftArchiveOverlay } from "./shift-archive-overlay";
import { CaseFilePanel } from "./case-file-panel";
import { LensPanel } from "./lens-panel";
import { ReselectDock } from "./reselect-dock";
import type { LobbyScenario, LobbyState, StarAvailability, StarMark, StarTier } from "./types";
import { DeckModePanel } from "./deck-mode-panel";
import { LibraryModePanel } from "./library-mode-panel";

const FIELD_SEED = "constellation-lobby.v1.layout";
const FIELD_PADDING_X = 8;
const FIELD_PADDING_Y = 14;
const FIELD_MIN_SPACING = 9;

type ScenarioMode = ScenarioPanelMode;

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
}: ConstellationLobbyProps) {
  const reducedMotion = useReducedMotion() === true;
  const activeBooking = shift.activeBooking ?? null;

  const [focusId, setFocusId] = useState<string | null>(
    activeBooking?.focusMemberId ?? focusedMembers[0]?.id ?? null,
  );
  // `participantIds` is `[focus, partner]` by convention — pull the second
  // slot to seed the partner state for an in-flight booking.
  const [partnerId, setPartnerId] = useState<string | null>(
    activeBooking?.participantIds[1] ?? null,
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("auto");

  // Roster fold state. lobbyMode toggles between browse and reselect; the
  // case file overlay opens from HoverDetailCard's "Open case" or a double
  // click on a star; the lens panel opens from a small action pill below
  // the TopBar.
  const [lobbyMode, setLobbyMode] = useState<"browse" | "reselect">("browse");
  const [reselectDraft, setReselectDraft] = useState<readonly string[] | null>(null);
  const [openCaseMemberId, setOpenCaseMemberId] = useState<string | null>(null);
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

  const cameraTarget = useMemo(
    () => computeCameraTarget(lobbyState, focusStar),
    [lobbyState, focusStar],
  );

  const scenarioById = useMemo(
    () => new Map(starterScenarios.map((scenario) => [scenario.id, scenario])),
    [],
  );

  const offers = useMemo(() => activeBudgetDiscountOffers(save), [save]);
  const effectiveCosts = useMemo(() => computeEffectiveCosts(starterScenarios, offers), [offers]);
  const budgetStatus = useMemo(
    () =>
      deriveDeckBudgetStatus({
        cardIds: save.scenarioDeck.cardIds,
        effectiveCosts,
        budgetCap: save.budgetCap,
      }),
    [save.scenarioDeck.cardIds, save.budgetCap, effectiveCosts],
  );
  const deckRepairBlocked = useMemo(() => deckIsRepairBlocked(save, starterScenarios), [save]);
  const warnings = useMemo(
    () => softComposeWarnings(save.scenarioDeck, starterScenarios),
    [save.scenarioDeck],
  );

  const deckComposition = useMemo(
    () => computeDeckComposition(save.scenarioDeck.cardIds, scenarioById),
    [save.scenarioDeck.cardIds, scenarioById],
  );

  const lobbyScenarios = useMemo(() => drawnScenarios.map(toLobbyScenario), [drawnScenarios]);

  const selectedScenarioTitle = useMemo(
    () =>
      selectedScenarioId === null
        ? undefined
        : (drawnScenarios.find((s) => s.id === selectedScenarioId)?.title ?? undefined),
    [drawnScenarios, selectedScenarioId],
  );

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
      if (current === "auto") return "deck";
      if (current === "deck") return "library";
      return "auto";
    });
  };

  /**
   * Files-fold openers. The Notes glass overlay (and shift-archive overlay)
   * replace the dropped /files room — the parent's onOpenClosures / onOpenFollowUps
   * still fire so existing callers keep working, but the local opener
   * surfaces the new overlay first.
   */
  const openNotesOverlay = (pairFocusId: string | null) => {
    setNotesOverlay({ open: true, pairFocusId });
  };
  const closeNotesOverlay = () => {
    setNotesOverlay({ open: false, pairFocusId: null });
  };
  const handleOpenClosures = () => {
    openNotesOverlay(null);
    onOpenClosures?.();
  };
  const handleOpenFollowUps = () => {
    openNotesOverlay(null);
    onOpenFollowUps?.();
  };

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

  const focusedSet = useMemo(() => new Set(save.focusedMemberIds), [save.focusedMemberIds]);

  const eligiblePartnerIds = useMemo<ReadonlySet<string>>(() => {
    const ids = new Set<string>();
    for (const member of save.members) {
      if (member.state.status !== "active") continue;
      if (focusedSet.has(member.id)) continue;
      if (isMemberInCooldown(member, shift.shiftNumber)) continue;
      ids.add(member.id);
    }
    return ids;
  }, [save.members, focusedSet, shift.shiftNumber]);

  const filteredMembers = useMemo(
    () =>
      applyMemberRosterFilters(save.members, filterState, {
        playerKnowledge: save.playerKnowledge,
        revealAllMemberDetails,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: shift.availablePartnerMemberIds,
        activeShiftNumber: shift.shiftNumber,
        readyClosureMemberIds,
      }),
    [
      save.members,
      filterState,
      save.playerKnowledge,
      revealAllMemberDetails,
      save.focusedMemberIds,
      shift.availablePartnerMemberIds,
      shift.shiftNumber,
      readyClosureMemberIds,
    ],
  );
  const filterMatchedIds = useMemo<ReadonlySet<string> | undefined>(() => {
    if (!isMemberRosterFilterActive(filterState)) return undefined;
    return new Set(filteredMembers.map((m) => m.id));
  }, [filteredMembers, filterState]);

  // Reselect mode draft + dock arithmetic.
  const draftCount = reselectDraft?.length ?? 0;
  const draftFull = draftCount >= FOCUS_CASE_LIMIT;
  const reselectDrops = useMemo<Member[]>(() => {
    if (reselectDraft === null) return [];
    const draftIds = new Set(reselectDraft);
    const byId = new Map(save.members.map((m) => [m.id, m] as const));
    return save.focusedMemberIds
      .filter((id) => !draftIds.has(id))
      .map((id) => byId.get(id))
      .filter((m): m is Member => m !== undefined && m.state.status === "active");
  }, [reselectDraft, save.focusedMemberIds, save.members]);
  const totalDropCost = reselectDrops.length * FOCUS_SWAP_RETENTION_PENALTY;

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

  // Click handlers wired into Scene: in reselect, toggle the draft; in
  // browse, pick focus / partner depending on availability and slots.
  const handleStarClick = useCallback(
    (star: StarMark) => {
      const member = star.member;
      if (lobbyMode === "reselect") {
        if (member.state.status !== "active") return;
        toggleReselectMember(member.id);
        return;
      }
      if (member.state.status !== "active") {
        setOpenCaseMemberId(member.id);
        return;
      }
      if (focusId === null) {
        setFocusId(member.id);
        return;
      }
      if (member.id === focusId) {
        setPartnerId(null);
        setSelectedScenarioId(null);
        return;
      }
      if (eligiblePartnerIds.has(member.id)) {
        setPartnerId(member.id);
      }
    },
    [lobbyMode, focusId, eligiblePartnerIds],
  );

  const handleStarDoubleClick = useCallback((star: StarMark) => {
    setOpenCaseMemberId(star.member.id);
  }, []);

  // HoverDetailCard receives both Roster fold context (file number, sealed/
  // known counts, knowledge-gated snippet, swap penalty, context-aware CTA)
  // and the Files agent's recentNotesSlot.
  const renderHoverCard = useCallback(
    ({
      star,
      onMouseEnter,
      onMouseLeave,
    }: {
      star: StarMark;
      onMouseEnter: () => void;
      onMouseLeave: () => void;
    }) => {
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

      let ctaVariant: "make_focus" | "swap_into_focus" | "view_case" = "view_case";
      let onPrimaryAction: (() => void) | undefined = undefined;

      if (status !== "active" || isFocused) {
        ctaVariant = "view_case";
        onPrimaryAction = () => setOpenCaseMemberId(member.id);
      } else if (!eligibleForFocus) {
        ctaVariant = "view_case";
        onPrimaryAction = () => setOpenCaseMemberId(member.id);
      } else if (slotsFull) {
        ctaVariant = "swap_into_focus";
        onPrimaryAction = () => setOpenCaseMemberId(member.id);
      } else {
        ctaVariant = "make_focus";
        onPrimaryAction =
          onAddFocus === undefined
            ? undefined
            : () => {
                onAddFocus(member.id);
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
          onOpenCase={() => setOpenCaseMemberId(member.id)}
          recentNotesSlot={<RecentNotesSlot memberId={member.id} memories={save.memories} />}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
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

  const pairDossierSlot =
    committedPairId === null ? undefined : (
      <PairDossierShard
        pairId={committedPairId}
        pairState={save.pairStates.find((p) => p.id === committedPairId)}
        members={save.members}
        memories={save.memories}
        playerKnowledge={save.playerKnowledge}
        readyClosurePairIds={readyClosurePairIds}
        onOpenNotes={openNotesOverlay}
      />
    );

  const statusShards = useMemo<StatusShardSpec[]>(() => {
    const shards: StatusShardSpec[] = [
      {
        kind: "label",
        eyebrow: "slots",
        value: `${save.scenarioDeck.cardIds.length} / ${DECK_SIZE_MAX}`,
        tone: budgetStatus.status === "invalid_size" ? "rose" : undefined,
      },
      {
        kind: "label",
        eyebrow: "budget",
        value: `${budgetStatus.spend} / ${save.budgetCap}`,
        tone: budgetStatus.status === "over_budget" ? "rose" : undefined,
      },
    ];
    shards.push({
      kind: "axes",
      axes: pickHeaviestAxisLevel(deckComposition),
    });
    if (deckComposition.lowPressure > 0 || deckComposition.highPressure > 0) {
      shards.push({
        kind: "pressure",
        pressure: {
          lowPressure: deckComposition.lowPressure,
          highPressure: deckComposition.highPressure,
        },
      });
    }
    return shards;
  }, [
    save.scenarioDeck.cardIds.length,
    save.budgetCap,
    budgetStatus.status,
    budgetStatus.spend,
    deckComposition,
  ]);

  const navShards = useMemo<NavShardSpec[]>(
    () => [
      {
        label:
          scenarioMode === "deck"
            ? "Date book · deck"
            : scenarioMode === "library"
              ? "Date book · library"
              : "Date book",
        active: scenarioMode !== "auto",
        hot: deckRepairBlocked,
        disabled: bookingLocked,
        onClick: handleDateBookNavToggle,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenarioMode, deckRepairBlocked, bookingLocked],
  );

  const callouts = useMemo<Callout[]>(() => {
    const items: Callout[] = [];
    if (deckRepairBlocked) {
      items.push({
        id: "deck-repair",
        tone: "rose",
        eyebrow: "deck needs repair",
        title: "Deck is over budget",
        body: "Drop cards from the deck until spend is under the cap before booking the next pair.",
        action: {
          label: "Open deck",
          onClick: () => setScenarioMode("deck"),
        },
      });
    }
    for (const warning of warnings) {
      items.push({
        id: `soft-${warning}`,
        tone: "amber",
        eyebrow: "deck composition",
        title: warning,
      });
    }
    if (readyClosurePairCount > 0) {
      items.push({
        id: "closures-ready",
        tone: "rose",
        eyebrow: "closure pending",
        title:
          readyClosurePairCount === 1
            ? "One pair is ready to close"
            : `${readyClosurePairCount} pairs are ready to close`,
        body: "Open the notes archive to file the closure summary before the next shift.",
        action: { label: "Open notes", onClick: handleOpenClosures },
      });
    }
    if (onOpenDateSession !== undefined) {
      const memberById = new Map(save.members.map((member) => [member.id, member] as const));
      const sessions = pendingFollowUpSessionsForShift(save, shift.shiftNumber);
      for (const session of sessions) {
        const [firstId, secondId] = session.participants;
        const first = memberById.get(firstId);
        const second = memberById.get(secondId);
        if (first === undefined || second === undefined) continue;
        const sessionId = session.id;
        items.push({
          id: `follow-up-${session.id}`,
          tone: "rose",
          eyebrow: "follow-up due",
          title: `${first.firstName} + ${second.firstName}`,
          body: "File a follow-up before the shift closes.",
          action: { label: "Open date", onClick: () => onOpenDateSession(sessionId) },
        });
      }
    } else if (pendingFollowUpCount > 0) {
      items.push({
        id: "follow-ups",
        tone: "amber",
        eyebrow: "follow-ups",
        title:
          pendingFollowUpCount === 1
            ? "One follow-up needs a response"
            : `${pendingFollowUpCount} follow-ups need a response`,
        action: { label: "Open notes", onClick: handleOpenFollowUps },
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deckRepairBlocked,
    warnings,
    readyClosurePairCount,
    pendingFollowUpCount,
    save,
    shift.shiftNumber,
    onOpenDateSession,
  ]);

  const showAutoScenarios =
    scenarioMode === "auto" &&
    (lobbyState === "committed_pair" || lobbyState === "scenario_chosen") &&
    lobbyScenarios.length > 0;
  const showDeckPanel = scenarioMode === "deck";
  const showLibraryPanel = scenarioMode === "library" && !bookingLocked;
  const showCallouts = callouts.length > 0;

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
            />
          </Suspense>
        </Canvas>
      </div>
      <TopBar state={lobbyState} status={statusShards} navs={navShards} />
      <SideRail
        state={lobbyState}
        focus={focusStar}
        partner={partnerStar}
        pairDossierSlot={pairDossierSlot}
      />
      <AnimatePresence>
        {showAutoScenarios ? (
          <ScenarioPanel
            key="auto"
            mode="auto"
            scenarios={lobbyScenarios}
            selectedId={selectedScenarioId}
            onScenarioClick={setSelectedScenarioId}
          />
        ) : null}
        {showDeckPanel ? (
          <ScenarioPanel
            key="deck"
            mode="deck"
            scenarios={[]}
            selectedId={null}
            deckPanel={
              <DeckModePanel
                deckCardIds={save.scenarioDeck.cardIds}
                scenarioById={scenarioById}
                toLobbyScenario={toLobbyScenario}
                effectiveCosts={effectiveCosts}
                spend={budgetStatus.spend}
                budgetCap={save.budgetCap}
                status={budgetStatus.status}
                bookingLocked={bookingLocked}
                isActionPending={isActionPending}
                onDrop={onRemoveDeckCard}
              />
            }
          />
        ) : null}
        {showLibraryPanel ? (
          <ScenarioPanel
            key="library"
            mode="library"
            scenarios={[]}
            selectedId={null}
            libraryPanel={
              <LibraryModePanel
                save={save}
                currentShift={shift.shiftNumber}
                scenarios={starterScenarios}
                scenarioById={scenarioById}
                toLobbyScenario={toLobbyScenario}
                effectiveCosts={effectiveCosts}
                budgetCap={save.budgetCap}
                isActionPending={isActionPending}
                bookingLocked={bookingLocked}
                onAdd={onAddDeckCard}
              />
            }
          />
        ) : null}
      </AnimatePresence>
      {showCallouts ? <CalloutCluster callouts={callouts} /> : null}
      <BottomDock
        state={lobbyState}
        focus={focusStar}
        partner={partnerStar}
        selectedScenarioId={selectedScenarioId}
        selectedScenarioTitle={selectedScenarioTitle}
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

      {/* Roster fold — small action rail below the TopBar that opens the
          Lens overlay and toggles reselect mode. We render this outside the
          spike's NavShard rail because the spike already owns nav for
          Date Book. A future spike pass can absorb these into NavShard with
          proper onClick threading. */}
      <div className="pointer-events-none absolute right-6 top-[64px] z-30 flex gap-2">
        <button
          type="button"
          onClick={() => setIsLensOpen(true)}
          className="pointer-events-auto cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3.5 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper"
          aria-label="Open roster lens"
        >
          Lens · {isMemberRosterFilterActive(filterState) ? "active" : "all"}
        </button>
        {onReselectFocus === undefined ? null : (
          <button
            type="button"
            onClick={() => (lobbyMode === "reselect" ? cancelReselect() : enterReselect())}
            className={`pointer-events-auto cursor-pointer rounded-full px-3.5 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper ${
              lobbyMode === "reselect"
                ? "aura-liquid-glass aura-liquid-glass-rose"
                : "aura-liquid-glass aura-liquid-glass-hover"
            }`}
            aria-label={lobbyMode === "reselect" ? "Cancel reselect" : "Reselect focus rack"}
          >
            {lobbyMode === "reselect" ? "Cancel reselect" : "Reselect leads"}
          </button>
        )}
      </div>

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

/**
 * Build stars from real save members. Maps each member to a deterministic
 * field position keyed off FIELD_SEED so the layout is stable across saves
 * but unique to this lobby instance. Availability is derived from the
 * member's state and the shift; eligible-partner filtering is intentionally
 * loose for the first cutover (anyone active + ready can be a partner).
 */
function buildLobbyStars(
  members: readonly Member[],
  shift: ShiftState,
  focusedMembers: readonly Member[],
): StarMark[] {
  const rng = createSeededRandom(FIELD_SEED);
  const placements: Array<{ x: number; y: number }> = [];
  const stars: StarMark[] = [];
  const focusedIds = new Set(focusedMembers.map((m) => m.id));

  for (const member of members) {
    let placed: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 220; attempt += 1) {
      const candidateX = FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2);
      const candidateY = FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2);
      const tooClose = placements.some(
        (p) =>
          (p.x - candidateX) * (p.x - candidateX) + (p.y - candidateY) * (p.y - candidateY) <
          FIELD_MIN_SPACING * FIELD_MIN_SPACING,
      );
      if (!tooClose) {
        placed = { x: candidateX, y: candidateY };
        break;
      }
    }
    if (placed === null) {
      placed = {
        x: FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2),
        y: FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2),
      };
    }
    placements.push(placed);

    // Focused leads sit in the foreground tier so they read prominently.
    // Everything else gets random tier assignment with a heavier bias to
    // foreground/mid so the field doesn't feel empty.
    const isFocusedLead = focusedIds.has(member.id);
    const tierRoll = rng();
    let tier: StarTier;
    let z: number;
    if (isFocusedLead) {
      tier = "foreground";
      z = 30 + rng() * 30;
    } else if (tierRoll > 0.55) {
      tier = "foreground";
      z = 10 + rng() * 40;
    } else if (tierRoll > 0.25) {
      tier = "mid";
      z = -50 + rng() * 50;
    } else {
      tier = "background";
      z = -180 + rng() * 110;
    }

    stars.push({
      member,
      palette: resolvePortraitPalette(member),
      aura: getMemberAuraConfig(member.id),
      x: placed.x,
      y: placed.y,
      z,
      tier,
      availability: availabilityForMember(member, shift),
      phase: rng() * Math.PI * 2,
    });
  }

  return stars;
}

function availabilityForMember(member: Member, shift: ShiftState): StarAvailability {
  const status = member.state.status;
  if (status === "closed") return "closed";
  if (status === "quit") return "closed";
  if (isMemberInCooldown(member, shift.shiftNumber)) return "cooling";
  // Members not on tonight's slate read as "off_shift" unless they're the
  // active focus case (focus cards never go dim from off-shift treatment).
  const isFocused = shift.activeBooking?.focusMemberId === member.id;
  if (!isFocused && !shift.availablePartnerMemberIds.includes(member.id)) {
    return "off_shift";
  }
  return "ready";
}

function toLobbyScenario(scenario: DateScenario): LobbyScenario {
  return {
    id: scenario.id,
    title: scenario.title,
    venue: scenario.publicBrief.location,
    cost: scenario.card.cost,
    axes: {
      risk: riskToNumber(scenario.card.risk),
      intimacy: riskToNumber(scenario.card.intimacy),
      chaos: riskToNumber(scenario.card.chaos),
    },
    // TODO(constellation-lobby-room-folds): wire to real room read derivation.
    roomRead: "steady",
  };
}

function riskToNumber(level: "low" | "medium" | "high"): number {
  if (level === "low") return 1;
  if (level === "medium") return 2;
  return 3;
}

type DeckComposition = {
  risk: { low: number; medium: number; high: number };
  intimacy: { low: number; medium: number; high: number };
  chaos: { low: number; medium: number; high: number };
  lowPressure: number;
  highPressure: number;
};

function computeDeckComposition(
  cardIds: readonly string[],
  scenarioById: ReadonlyMap<string, DateScenario>,
): DeckComposition {
  const composition: DeckComposition = {
    risk: { low: 0, medium: 0, high: 0 },
    intimacy: { low: 0, medium: 0, high: 0 },
    chaos: { low: 0, medium: 0, high: 0 },
    lowPressure: 0,
    highPressure: 0,
  };
  for (const id of cardIds) {
    const scenario = scenarioById.get(id);
    if (scenario === undefined) continue;
    composition.risk[scenario.card.risk] += 1;
    composition.intimacy[scenario.card.intimacy] += 1;
    composition.chaos[scenario.card.chaos] += 1;
    if (scenario.card.tags.includes("low_pressure")) composition.lowPressure += 1;
    if (scenario.card.tags.includes("high_pressure")) composition.highPressure += 1;
  }
  return composition;
}

function pickHeaviestAxisLevel(composition: DeckComposition): {
  risk: "low" | "medium" | "high";
  intimacy: "low" | "medium" | "high";
  chaos: "low" | "medium" | "high";
} {
  return {
    risk: heaviestLevel(composition.risk),
    intimacy: heaviestLevel(composition.intimacy),
    chaos: heaviestLevel(composition.chaos),
  };
}

function heaviestLevel(counts: {
  low: number;
  medium: number;
  high: number;
}): "low" | "medium" | "high" {
  if (counts.high >= counts.medium && counts.high >= counts.low) return "high";
  if (counts.medium >= counts.low) return "medium";
  return "low";
}
