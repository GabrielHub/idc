import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  gameSaveSchema,
  SAVE_SCHEMA_VERSION,
  type DateScenario,
  type FollowUpAction,
  type GameConfig,
  type GameSave,
} from "../domain/game";
import { starterScenarios } from "../fixtures";
import { APP_VERSION } from "../platform/release-identity";
import { lockAiProviderBaseUrlsForRuntime } from "../platform/runtime";
import { tryBackupSave } from "../repositories/backup-save";
import { createGameRepository } from "../repositories/create-game-repository";
import {
  advanceDateExchangeWithLocalAiStream,
  cutDateShortWithLocalAiStream,
  DateStreamAbortedError,
  type LocalAiDateStreamEvent,
} from "../services/ai-date-engine";
import { getReadyClosurePairs, shouldShowSoftWinForActiveShift } from "../services/closures";
import {
  addCupidIntervention,
  applyFollowUpActionAndMaybeCompleteShift,
  canAddCupidIntervention,
  canCutDateShort,
  getRestorableDateSession,
  isCampaignLost,
  pickScenarioEvents,
  togglePlayback,
  triggerScenarioEvent,
} from "../services/date-engine";
import { applyDevSeed, clearDevSeedQueryParam, readDevSeedRequest } from "../services/dev-seeds";
import { getFocusedMembers } from "../services/focus-cases";
import { getActiveShift, hydrateFixtureOwnedMemberData } from "../services/game-seed";
import { buildRelationshipIndex, getPairProjectionByPairId } from "../services/relationship-index";
import { useShiftActions, type ShiftActionKind } from "./use-shift-actions";
import {
  TutorialActivityProvider,
  useIsRequiredTutorialActive,
  withOrientationReset,
} from "../services/tutorial";
import { errorToMessage } from "../services/utils";
import { ManagerQuipPopup } from "./manager-quip-popup";
import { useManagerQuips } from "./use-manager-quips";
import { AiSetupPanel, type AiSetupStatus } from "./ai-setup-panel";
import { AmbientMesh } from "./ambient-mesh";
import { DashboardLoading, ShiftReportPanel } from "./dashboard-views";
import {
  DateView,
  type PendingDateAction,
  type PlaybackIntent,
  type StreamingDraftMessage,
} from "./date-view";
import { ConstellationLobby } from "./constellation-lobby";
import { CosmicWarpOverlay } from "./cosmic-warp-overlay";
import { OnboardingScreen } from "./onboarding-screen";
import { SettingsMenu, buildDiagnosticsSnapshot } from "./settings-menu";
import { ReleaseNotesModal } from "./release-notes-modal";
import { useSfx, type SfxCue } from "./sfx-provider";
import { useClosureFiling } from "./use-closure-filing";
import { CHECKING_LOCAL_AI_STATUS, useAiSetupStatus } from "./use-ai-setup-status";
import { CampaignLossModal } from "./campaign-loss-modal";
import { SoftWinCutscene } from "./soft-win-cutscene";
import { GlassChromePills, ShellChrome } from "./shell-chrome";
import {
  getReleaseNoteByVersion,
  hasReleaseNotesEligibleSaveProgress,
  listReleaseNotesForModal,
  readStoredReleaseNotesVersion,
  shouldOpenReleaseNotes,
  writeStoredReleaseNotesVersion,
} from "../services/release-notes";

const AUTOPLAY_TICK_DELAY_MS = 480;
const DEV_MEMBER_DETAILS_STORAGE_KEY = "idc.cupid.dev.memberDetailsPreview";
const CAN_USE_DEV_MEMBER_DETAILS_PREVIEW = import.meta.env.DEV;

type CupidShellProps = {
  onPunchOut: () => void;
};

type PendingAction =
  | PendingDateAction
  | ShiftActionKind
  | "intervention"
  | "pickEvents"
  | "triggerEvent"
  | "togglePlayback"
  | "followUp"
  | "closure"
  | "reset";

export function CupidShell(props: CupidShellProps) {
  return (
    <TutorialActivityProvider>
      <CupidShellInner {...props} />
    </TutorialActivityProvider>
  );
}

function useCueOnMessageChange(
  message: string | null,
  cue: SfxCue,
  play: (cue: SfxCue) => void,
): void {
  const lastMessageRef = useRef<string | null>(null);
  useEffect(() => {
    if (message === null) {
      lastMessageRef.current = null;
      return;
    }
    if (lastMessageRef.current === message) return;
    lastMessageRef.current = message;
    play(cue);
  }, [message, cue, play]);
}

function CupidShellInner({ onPunchOut }: CupidShellProps) {
  const repository = useMemo(() => createGameRepository(), []);
  const { play, setDateAmbientSession } = useSfx();
  const isTutorialBlocking = useIsRequiredTutorialActive();
  const isTutorialBlockingRef = useRef(isTutorialBlocking);
  useEffect(() => {
    isTutorialBlockingRef.current = isTutorialBlocking;
  }, [isTutorialBlocking]);
  const [save, setSave] = useState<GameSave | null>(null);
  const saveRef = useRef<GameSave | null>(null);
  // Inline assignment during render so getSave() sees the current save in the
  // same tick as a setSave call. A useEffect-based update lags by one render
  // and would let async closure handlers read a stale snapshot.
  saveRef.current = save;
  const [activeDateSessionId, setActiveDateSessionId] = useState<string | null>(null);
  const [interventionText, setInterventionText] = useState("");
  const [interventionTargetMemberId, setInterventionTargetMemberId] = useState("");
  const [isAiSetupOpen, setIsAiSetupOpen] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [streamingDrafts, setStreamingDrafts] = useState<StreamingDraftMessage[]>([]);
  const [isDateJudgePending, setIsDateJudgePending] = useState(false);
  const [onboardingWarping, setOnboardingWarping] = useState(false);
  const [queuedPlaybackIntent, setQueuedPlaybackIntent] = useState<PlaybackIntent | null>(null);
  const [devRevealAllMemberDetails, setDevRevealAllMemberDetails] = useState(
    readStoredDevMemberDetailsPreview,
  );
  const dateAbortControllerRef = useRef<AbortController | null>(null);
  const pendingActionRef = useRef<PendingAction | null>(null);
  const stopAfterCurrentTurnRef = useRef(false);
  const releaseNotesCheckCompleteRef = useRef(false);
  const onboardingWarpTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (onboardingWarpTimerRef.current !== null) {
        window.clearTimeout(onboardingWarpTimerRef.current);
        onboardingWarpTimerRef.current = null;
      }
    },
    [],
  );
  const isActionPending = pendingAction !== null;
  const releaseNotesForModal = useMemo(
    () => listReleaseNotesForModal({ currentVersion: APP_VERSION }),
    [],
  );
  const hasReleaseNotesForCurrentVersion = useMemo(
    () => getReleaseNoteByVersion(APP_VERSION) !== undefined,
    [],
  );
  const revealAllMemberDetails = CAN_USE_DEV_MEMBER_DETAILS_PREVIEW && devRevealAllMemberDetails;
  const getSave = useCallback(() => saveRef.current, []);
  const commitSave = useCallback((nextSave: GameSave) => {
    saveRef.current = nextSave;
    setSave(nextSave);
  }, []);
  const tryAction = useCallback(
    async (kind: PendingAction, run: () => Promise<void>): Promise<boolean> => {
      if (pendingActionRef.current !== null) return false;
      pendingActionRef.current = kind;
      setPendingAction(kind);
      setErrorMessage(null);
      setNoticeMessage(null);
      try {
        await run();
        return true;
      } catch (error) {
        setErrorMessage(errorToMessage(error));
        return false;
      } finally {
        pendingActionRef.current = null;
        setPendingAction(null);
      }
    },
    [],
  );
  const runClosureAction = useCallback(
    (run: () => Promise<void>) => tryAction("closure", run),
    [tryAction],
  );
  const {
    activeManagerQuip,
    managerQuipPresentationKey,
    dispatchManagerQuip,
    processManagerQuipSaveDiff,
    dispatchPostDateQuips,
    handleManagerQuipDismissed,
    resetSessionQuips,
  } = useManagerQuips({
    getSave,
    repository,
    commitSave,
    isTutorialBlockingRef,
    play,
  });
  const { localAiStatus, gatewayApiKey, refreshLocalAiStatus, applyGatewayApiKeyUpdate } =
    useAiSetupStatus({
      aiStatusConfig: save?.config,
      setErrorMessage,
    });
  const { closureErrorMessage, handleClosePair, resetClosureError } = useClosureFiling({
    getSave,
    gatewayApiKey,
    refreshLocalAiStatus,
    runClosureAction,
    persist,
    dispatchManagerQuip,
    processManagerQuipSaveDiff,
    play,
    setIsAiSetupOpen,
    setErrorMessage,
  });
  const {
    handleAddFocus,
    handleBeginDate,
    handleCancelBooking,
    handleCommitPair,
    handleCompleteShift,
    handleConfirmOnboarding: handleConfirmOnboardingPersistence,
    handleMarkSoftWinSeen,
    handleRemoveDeckCard,
    handleRemoveFocus,
    handleReselectFocus,
    handleResolveCardOffer,
    handleShuffleCardOffer,
    handleStartNextShift,
    handleSwapShiftPartner,
  } = useShiftActions({
    getSave,
    tryAction,
    persist,
    play,
    dispatchManagerQuip,
    processManagerQuipSaveDiff,
    refreshLocalAiStatus,
    setIsAiSetupOpen,
    setActiveDateSessionId,
    setInterventionText,
    setInterventionTargetMemberId,
  });

  useEffect(() => {
    let mounted = true;
    async function loadSave() {
      let recoveredOutdatedSave = false;
      let backupKey: string | null = null;
      let existingSave: GameSave | null = null;
      try {
        existingSave = await repository.loadGame();
      } catch {
        recoveredOutdatedSave = true;
        backupKey = await tryBackupSave(repository);
      }
      let nextSave = existingSave ?? (await repository.resetGame());
      const seedRequest = readDevSeedRequest();

      if (seedRequest !== null) {
        try {
          nextSave = await applyDevSeed(repository, nextSave, seedRequest);
        } catch (error) {
          console.warn("dev seed failed", error);
        } finally {
          clearDevSeedQueryParam();
        }
      }
      if (!mounted) return;
      commitSave(nextSave);
      if (recoveredOutdatedSave) {
        setErrorMessage(
          backupKey === null
            ? "Cupid reset an outdated local save. The previous file failed schema review."
            : "Cupid reset an outdated local save. The previous file is preserved as a .bak file.",
        );
      }
      const restoredSession = getRestorableDateSession(nextSave);
      setActiveDateSessionId(restoredSession?.id ?? null);
    }
    void loadSave();
    return () => {
      mounted = false;
    };
  }, [commitSave, repository]);

  useCueOnMessageChange(errorMessage, "alert", play);
  useCueOnMessageChange(noticeMessage, "notice", play);

  useEffect(() => {
    return () => {
      repository.flush().catch((error) => {
        console.warn("save flush on unmount failed", error);
      });
    };
  }, [repository]);

  const activeShift = save === null ? null : getActiveShift(save);
  const relationshipIndex = useMemo(
    () => (save === null ? null : buildRelationshipIndex(save)),
    [save],
  );
  const needsInitialFocusCases = useMemo(() => {
    if (save === null) return false;
    const caseBoardStarted =
      save.dateSessions.length > 0 ||
      save.shifts.some((shift) => shift.featuredMemberIds.length > 0);
    return save.focusedMemberIds.length === 0 && !caseBoardStarted;
  }, [save]);
  const shellScreenKey: "loading" | "onboarding" | "main" =
    save === null ? "loading" : needsInitialFocusCases ? "onboarding" : "main";
  const focusedMembers = useMemo(() => (save === null ? [] : getFocusedMembers(save)), [save]);
  const readyClosurePairs = useMemo(
    () => (save === null ? [] : getReadyClosurePairs(save)),
    [save],
  );
  const readyClosurePairIds = useMemo(
    () => new Set(readyClosurePairs.map((entry) => entry.pairState.id)),
    [readyClosurePairs],
  );
  const readyClosureMemberIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ready of readyClosurePairs) {
      ids.add(ready.participants[0].id);
      ids.add(ready.participants[1].id);
    }
    return ids;
  }, [readyClosurePairs]);
  const softWinDue = save !== null && shouldShowSoftWinForActiveShift(save);
  const campaignLost = save !== null && isCampaignLost(save);

  const activeSession = useMemo(
    () =>
      save === null || activeDateSessionId === null
        ? null
        : (save.dateSessions.find((session) => session.id === activeDateSessionId) ?? null),
    [save, activeDateSessionId],
  );
  const activeDateScenario = useMemo(
    () =>
      activeSession === null
        ? undefined
        : starterScenarios.find((scenario) => scenario.id === activeSession.scenarioId),
    [activeSession],
  );
  const activePairState = useMemo(() => {
    if (relationshipIndex === null || activeSession === null) return undefined;
    return getPairProjectionByPairId(relationshipIndex, activeSession.pairId);
  }, [relationshipIndex, activeSession]);
  const drawnScenarios = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.drawnScenarioIds
            .map((id) => starterScenarios.find((scenario) => scenario.id === id))
            .filter((scenario): scenario is DateScenario => scenario !== undefined),
    [activeShift],
  );
  const dateAmbientSessionId = activeSession?.status === "active" ? activeSession.id : null;
  useEffect(() => {
    setDateAmbientSession(dateAmbientSessionId);
    return () => setDateAmbientSession(null);
  }, [dateAmbientSessionId, setDateAmbientSession]);
  const screenKey = `livedate:${activeSession?.id ?? "planning"}:${activeSession?.status ?? "planning"}`;
  const diagnosticsInputsRef = useRef<Parameters<typeof buildDiagnosticsSnapshot>[0]>({
    config: null,
    localAiStatus: CHECKING_LOCAL_AI_STATUS,
    save: null,
    currentShift: null,
    activeDateSession: null,
    pendingAction: null,
    queuedPlaybackIntent: null,
    streamingDraftCount: 0,
    isJudgePending: false,
    lastErrorMessage: null,
    noticeMessage: null,
  });
  diagnosticsInputsRef.current = {
    config: save?.config ?? null,
    localAiStatus,
    save,
    currentShift: activeShift,
    activeDateSession: activeSession,
    pendingAction,
    queuedPlaybackIntent,
    streamingDraftCount: streamingDrafts.length,
    isJudgePending: isDateJudgePending,
    lastErrorMessage: errorMessage,
    noticeMessage,
  };
  const getDiagnostics = useCallback(
    () => buildDiagnosticsSnapshot(diagnosticsInputsRef.current),
    [],
  );
  useEffect(() => {
    if (!needsInitialFocusCases) return;
    dispatchManagerQuip({ triggerKey: "onboarding.welcome", bypassTutorialGate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsInitialFocusCases]);

  useEffect(() => {
    if (
      releaseNotesCheckCompleteRef.current ||
      save === null ||
      !hasReleaseNotesForCurrentVersion
    ) {
      return;
    }
    releaseNotesCheckCompleteRef.current = true;

    const lastSeenVersion = readStoredReleaseNotesVersion();
    const shouldOpen = shouldOpenReleaseNotes({
      currentVersion: APP_VERSION,
      lastSeenVersion,
      hasExistingSaveProgress: hasReleaseNotesEligibleSaveProgress(save),
    });

    if (shouldOpen) {
      setIsReleaseNotesOpen(true);
    } else {
      writeStoredReleaseNotesVersion(APP_VERSION);
    }
  }, [hasReleaseNotesForCurrentVersion, save]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screenKey, shellScreenKey]);

  async function persist(nextSave: GameSave, options: { preserveTutorial?: boolean } = {}) {
    const latestTutorial = saveRef.current?.tutorial;
    const latestManagerQuipHistory = saveRef.current?.managerQuipHistory;
    const saveToPersist: GameSave = {
      ...nextSave,
      ...(options.preserveTutorial === false || latestTutorial === undefined
        ? {}
        : { tutorial: latestTutorial }),
      ...(latestManagerQuipHistory === undefined
        ? {}
        : { managerQuipHistory: latestManagerQuipHistory }),
    };
    await repository.saveGame(saveToPersist);
    commitSave(saveToPersist);
  }

  const handleTutorialUpdate = useCallback(
    (next: GameSave) => {
      const current = saveRef.current;
      const merged = current === null ? next : { ...current, tutorial: next.tutorial };
      commitSave(merged);
      void repository.saveGame(merged);
    },
    [commitSave, repository],
  );

  async function pausePlayingSessionAfterAdvanceFailure(
    acceptedSave: GameSave,
    dateSessionId: string,
  ) {
    const failedSession = acceptedSave.dateSessions.find((session) => session.id === dateSessionId);

    if (failedSession?.status !== "active" || failedSession.playbackState !== "playing") {
      return;
    }

    setQueuedPlaybackIntent(null);
    const result = togglePlayback(acceptedSave, {
      dateSessionId,
      desiredState: "paused",
    });
    await persist(result.save);
  }

  async function handleSaveAiConfig(nextConfig: GameConfig, nextGatewayApiKey: string) {
    if (save === null) return;
    await applyGatewayApiKeyUpdate(nextGatewayApiKey);
    await persist({
      ...save,
      config: lockAiProviderBaseUrlsForRuntime(nextConfig),
    });
  }

  async function handleCheckAiConfig(
    nextConfig: GameConfig,
    nextGatewayApiKey: string,
  ): Promise<AiSetupStatus> {
    return refreshLocalAiStatus(nextConfig, nextGatewayApiKey);
  }

  async function handleAdvanceExchange(turnCount: 1 | 2) {
    if (save === null || activeSession === null) return;
    const sessionId = activeSession.id;
    const previousStatus = activeSession.status;
    const previousSave = save;
    await tryAction("advanceExchange", async () => {
      setStreamingDrafts([]);
      setIsDateJudgePending(false);
      stopAfterCurrentTurnRef.current = false;
      const controller = new AbortController();
      dateAbortControllerRef.current = controller;
      try {
        const result = await advanceDateExchangeWithLocalAiStream(
          save,
          repository,
          {
            dateSessionId: sessionId,
            turnCount,
            config: { ...save.config, gatewayApiKey: gatewayApiKey || undefined },
            abortSignal: controller.signal,
            shouldStopAfterCurrentTurn: () => stopAfterCurrentTurnRef.current,
          },
          (event) => applyStreamEvent(event),
        );
        await persist(result.save);
        dispatchPostDateQuips({ previousStatus, previousSave, result });
        setActiveDateSessionId(result.session.id);
        if (result.warningMessages.length > 0) {
          setNoticeMessage(result.warningMessages[0] ?? null);
        }
      } catch (error) {
        if (error instanceof DateStreamAbortedError) {
          return;
        }
        try {
          await pausePlayingSessionAfterAdvanceFailure(save, sessionId);
        } catch (pauseError) {
          console.warn("pause after date advance failure failed", pauseError);
        }
        throw error;
      } finally {
        dateAbortControllerRef.current = null;
        stopAfterCurrentTurnRef.current = false;
        setStreamingDrafts([]);
        setIsDateJudgePending(false);
      }
    });
  }

  async function handleCutDateShort() {
    if (save === null || activeSession === null) return;
    const sessionId = activeSession.id;
    const previousStatus = activeSession.status;
    const previousSave = save;
    await tryAction("cutShort", async () => {
      setStreamingDrafts([]);
      setIsDateJudgePending(false);
      try {
        const result = await cutDateShortWithLocalAiStream(
          save,
          repository,
          {
            dateSessionId: sessionId,
            config: { ...save.config, gatewayApiKey: gatewayApiKey || undefined },
          },
          (event) => applyStreamEvent(event),
        );
        await persist(result.save);
        dispatchPostDateQuips({ previousStatus, previousSave, result });
        setActiveDateSessionId(result.session.id);
        if (result.warningMessages.length > 0) {
          setNoticeMessage(result.warningMessages[0] ?? null);
        }
      } finally {
        setStreamingDrafts([]);
        setIsDateJudgePending(false);
      }
    });
  }

  function applyStreamEvent(event: LocalAiDateStreamEvent) {
    if (event.type === "judgeStart") {
      setIsDateJudgePending(true);
      play("judge");
      return;
    }

    if (event.type === "characterStart") {
      setIsDateJudgePending(false);
    }

    if (event.type === "characterDone") {
      play("message");
    }

    if (event.type === "characterFailed" || event.type === "characterCanceled") {
      setIsDateJudgePending(false);
      play("abort");
      setStreamingDrafts((current) =>
        current.filter((draft) => draft.sequenceIndex !== event.sequenceIndex),
      );
      return;
    }

    setStreamingDrafts((current) => {
      if (event.type === "characterStart") {
        const withoutPrior = current.filter((draft) => draft.sequenceIndex !== event.sequenceIndex);
        return [
          ...withoutPrior,
          {
            id: `${event.speakerId}-${event.sequenceIndex}`,
            speakerId: event.speakerId,
            speakerName: event.speakerName,
            sequenceIndex: event.sequenceIndex,
            turnIndex: event.turnIndex,
            text: "",
            status: "streaming",
          },
        ];
      }
      if (event.type !== "characterDelta" && event.type !== "characterDone") {
        return current;
      }
      const matchIndex = current.findIndex((draft) => draft.sequenceIndex === event.sequenceIndex);
      if (matchIndex === -1) return current;
      const target = current[matchIndex];
      if (target === undefined) return current;
      let updated: StreamingDraftMessage;
      if (event.type === "characterDelta") {
        updated = { ...target, text: target.text + event.textDelta };
      } else if (event.type === "characterDone") {
        updated = { ...target, text: event.text, status: "done" };
      } else {
        return current;
      }
      const next = current.slice();
      next[matchIndex] = updated;
      return next;
    });
  }

  function handleCancelDate() {
    dateAbortControllerRef.current?.abort();
  }

  async function handleIntervention() {
    if (save === null || activeSession === null) return;
    await tryAction("intervention", async () => {
      const result = addCupidIntervention(save, {
        dateSessionId: activeSession.id,
        targetMemberId: interventionTargetMemberId || activeSession.participants[0],
        text: interventionText,
      });
      await persist(result.save);
      setInterventionText("");
      play("intervention");
    });
  }

  async function handlePickEvents(eventIds: string[]) {
    if (save === null || activeSession === null) return;
    await tryAction("pickEvents", async () => {
      const result = pickScenarioEvents(save, {
        dateSessionId: activeSession.id,
        pickedEventIds: eventIds,
      });
      await persist(result.save);
    });
  }

  async function handleTriggerEvent(eventId: string) {
    if (save === null || activeSession === null) return;
    await tryAction("triggerEvent", async () => {
      const result = triggerScenarioEvent(save, {
        dateSessionId: activeSession.id,
        eventId,
      });
      await persist(result.save);
      play("event");
    });
  }

  async function handleTogglePlayback(next: PlaybackIntent) {
    if (save === null || activeSession === null) return;
    if (pendingAction !== null) {
      if (pendingAction === "advanceExchange") {
        stopAfterCurrentTurnRef.current = next === "paused";
      }
      setQueuedPlaybackIntent(next);
      return;
    }
    await tryAction("togglePlayback", async () => {
      setQueuedPlaybackIntent(null);
      const result = togglePlayback(save, {
        dateSessionId: activeSession.id,
        desiredState: next,
      });
      await persist(result.save);
    });
  }

  useEffect(() => {
    if (queuedPlaybackIntent === null || isActionPending) return;
    if (activeSession?.status !== "active" || activeSession.playbackState === "ended") {
      setQueuedPlaybackIntent(null);
      return;
    }
    const next = queuedPlaybackIntent;
    setQueuedPlaybackIntent(null);
    void handleTogglePlayback(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.playbackState, activeSession?.status, isActionPending, queuedPlaybackIntent]);

  const autoplayShouldTick =
    activeSession !== null &&
    activeSession.status === "active" &&
    activeSession.playbackState === "playing" &&
    !isActionPending &&
    errorMessage === null &&
    queuedPlaybackIntent === null;
  const autoplayKey = activeSession?.currentTurn ?? -1;
  useEffect(() => {
    if (!autoplayShouldTick) return;
    const timer = window.setTimeout(() => {
      void handleAdvanceExchange(2);
    }, AUTOPLAY_TICK_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayShouldTick, autoplayKey]);

  async function handleFollowUp(action: FollowUpAction) {
    if (save === null || activeSession === null) return;
    await tryAction("followUp", async () => {
      const result = applyFollowUpActionAndMaybeCompleteShift(save, {
        dateSessionId: activeSession.id,
        action,
      });
      await persist(result.save);
      if (result.completedShiftReport === undefined) return;

      setActiveDateSessionId(null);
      dispatchManagerQuip({
        triggerKey: "shift.ended",
        surfaceKey: result.completedShiftReport.id,
      });
      processManagerQuipSaveDiff(result.saveBeforeShiftCompletion ?? save, result.save);
      play("report");
    });
  }

  async function handleConfirmOnboarding(payload: {
    focusedMemberIds: string[];
    scenarioDeckCardIds: string[];
  }) {
    const succeeded = await handleConfirmOnboardingPersistence(payload);
    if (!succeeded) return;
    setOnboardingWarping(true);
    if (onboardingWarpTimerRef.current !== null) {
      window.clearTimeout(onboardingWarpTimerRef.current);
    }
    onboardingWarpTimerRef.current = window.setTimeout(() => {
      onboardingWarpTimerRef.current = null;
      setOnboardingWarping(false);
    }, 1200);
  }

  function resetTransientShellState() {
    setInterventionText("");
    setInterventionTargetMemberId("");
    setStreamingDrafts([]);
    setQueuedPlaybackIntent(null);
    resetSessionQuips();
    resetClosureError();
  }

  async function handleResetSave() {
    await tryAction("reset", async () => {
      await tryBackupSave(repository);
      const nextSave = await repository.resetGame();
      commitSave(nextSave);
      setActiveDateSessionId(null);
      resetTransientShellState();
    });
  }

  function handleExportSave() {
    if (save === null) return;
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.href = url;
    link.download = `cupid-save-v${SAVE_SCHEMA_VERSION}-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleImportSave(file: File) {
    await tryAction("reset", async () => {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        throw new Error(`Cupid could not read that JSON file. ${errorToMessage(error)}`.trim());
      }
      const validated = gameSaveSchema.safeParse(parsed);
      if (!validated.success) {
        const firstIssue = validated.error.issues[0];
        const detail =
          firstIssue === undefined
            ? "schema mismatch"
            : `${firstIssue.path.join(".") || "save"}: ${firstIssue.message}`;
        throw new Error(
          `Imported save did not match save schema v${SAVE_SCHEMA_VERSION} (${detail}).`,
        );
      }
      await tryBackupSave(repository);
      const hydrated = hydrateFixtureOwnedMemberData(validated.data);
      const nextSave = await repository.replaceGame(hydrated.save);
      commitSave(nextSave);
      const restoredSession =
        nextSave.dateSessions.find((session) => session.status === "active") ??
        nextSave.dateSessions.at(-1) ??
        null;
      setActiveDateSessionId(restoredSession?.id ?? null);
      resetTransientShellState();
    });
  }

  async function handleCopyDiagnostics(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getDiagnostics(), null, 2));
      return true;
    } catch (error) {
      setErrorMessage(`Cupid could not copy diagnostics: ${errorToMessage(error)}`);
      return false;
    }
  }

  function handleDevRevealAllMemberDetailsChange(enabled: boolean) {
    const next = CAN_USE_DEV_MEMBER_DETAILS_PREVIEW ? enabled : false;
    setDevRevealAllMemberDetails(next);
    writeStoredDevMemberDetailsPreview(next);
  }

  function handleOpenReleaseNotes() {
    setIsReleaseNotesOpen(true);
  }

  async function handleResetOrientation() {
    if (save === null) return;
    await persist(withOrientationReset(save), { preserveTutorial: false });
  }

  function handleCloseReleaseNotes() {
    setIsReleaseNotesOpen(false);
    writeStoredReleaseNotesVersion(APP_VERSION);
  }

  if (save === null) {
    return <DashboardLoading />;
  }

  const aiStatusLabel = save.config.aiSetupComplete ? localAiStatus.status : "setup";
  const isDateViewActive = activeSession !== null;
  /**
   * The constellation lobby and the live date view both render the glass
   * `GlassChromePills` over their own canvas, so the cream `ShellChrome`
   * header only shows when no shift is active (home screen).
   */
  const isShiftActive = activeShift !== null;

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {needsInitialFocusCases ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="min-h-screen w-full"
          >
            <OnboardingScreen
              members={save.members}
              scenarios={starterScenarios}
              save={save}
              onTutorialUpdate={handleTutorialUpdate}
              onConfirm={handleConfirmOnboarding}
            />
            <div
              aria-label="Onboarding settings"
              className="fixed right-4 top-4 z-40 lg:right-8 lg:top-6"
            >
              <SettingsMenu
                isActionPending={isActionPending}
                getDiagnostics={getDiagnostics}
                canExportSave={save !== null}
                canUseDevMemberDetailsPreview={CAN_USE_DEV_MEMBER_DETAILS_PREVIEW}
                devRevealAllMemberDetails={revealAllMemberDetails}
                align="right"
                variant="cream"
                onOpenAiSetup={() => setIsAiSetupOpen(true)}
                onReset={handleResetSave}
                onResetOrientation={() => {
                  void handleResetOrientation();
                }}
                onExportSave={handleExportSave}
                onImportSave={handleImportSave}
                onCopyDiagnostics={handleCopyDiagnostics}
                onDevRevealAllMemberDetailsChange={handleDevRevealAllMemberDetailsChange}
                onOpenReleaseNotes={handleOpenReleaseNotes}
              />
            </div>
            {errorMessage !== null ? (
              <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative isolate min-h-screen w-full"
          >
            <AmbientMesh />
            {isShiftActive ? null : (
              <ShellChrome
                shiftNumber={1}
                aiStatusLabel={aiStatusLabel}
                isActionPending={isActionPending}
                getDiagnostics={getDiagnostics}
                canExportSave={save !== null}
                canUseDevMemberDetailsPreview={CAN_USE_DEV_MEMBER_DETAILS_PREVIEW}
                devRevealAllMemberDetails={revealAllMemberDetails}
                onPunchOut={onPunchOut}
                onOpenAiSetup={() => setIsAiSetupOpen(true)}
                onReset={handleResetSave}
                onResetOrientation={() => {
                  void handleResetOrientation();
                }}
                onExportSave={handleExportSave}
                onImportSave={handleImportSave}
                onCopyDiagnostics={handleCopyDiagnostics}
                onDevRevealAllMemberDetailsChange={handleDevRevealAllMemberDetailsChange}
                onOpenReleaseNotes={handleOpenReleaseNotes}
              />
            )}
            {isDateViewActive && activeShift !== null ? (
              <div
                aria-label="Live date controls"
                className="fixed left-4 top-4 z-40 flex items-center gap-2 lg:left-8 lg:top-6"
              >
                <GlassChromePills
                  shiftNumber={activeShift.shiftNumber}
                  aiStatusLabel={aiStatusLabel}
                  isActionPending={isActionPending}
                  getDiagnostics={getDiagnostics}
                  canExportSave={save !== null}
                  canUseDevMemberDetailsPreview={CAN_USE_DEV_MEMBER_DETAILS_PREVIEW}
                  devRevealAllMemberDetails={revealAllMemberDetails}
                  variant="glass-ink"
                  onPunchOut={onPunchOut}
                  onBack={() => setActiveDateSessionId(null)}
                  onOpenAiSetup={() => setIsAiSetupOpen(true)}
                  onReset={handleResetSave}
                  onResetOrientation={() => {
                    void handleResetOrientation();
                  }}
                  onExportSave={handleExportSave}
                  onImportSave={handleImportSave}
                  onCopyDiagnostics={handleCopyDiagnostics}
                  onDevRevealAllMemberDetailsChange={handleDevRevealAllMemberDetailsChange}
                  onOpenReleaseNotes={handleOpenReleaseNotes}
                />
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              <motion.main
                key={screenKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {activeShift !== null ? (
                  activeSession !== null ? (
                    <div className="mx-auto w-full max-w-canvas px-6 py-8 lg:px-12">
                      <DateView
                        session={activeSession}
                        scenario={activeDateScenario}
                        members={save.members}
                        pairState={activePairState}
                        playerKnowledge={save.playerKnowledge}
                        save={save}
                        onTutorialUpdate={handleTutorialUpdate}
                        interventionText={interventionText}
                        interventionTargetMemberId={interventionTargetMemberId}
                        canAdvance={
                          activeSession.status === "active" &&
                          activeSession.playbackState !== "drafting" &&
                          activeSession.playbackState !== "ended"
                        }
                        canIntervene={canAddCupidIntervention(activeSession)}
                        canCutShort={canCutDateShort(activeSession)}
                        isActionPending={isActionPending}
                        pendingDateAction={
                          pendingAction === "advanceExchange" || pendingAction === "cutShort"
                            ? pendingAction
                            : null
                        }
                        isJudgePending={isDateJudgePending}
                        queuedPlaybackIntent={queuedPlaybackIntent}
                        streamingDrafts={streamingDrafts}
                        onInterventionTextChange={setInterventionText}
                        onInterventionTargetChange={setInterventionTargetMemberId}
                        onAdvance={handleAdvanceExchange}
                        onCancel={handleCancelDate}
                        onCutShort={handleCutDateShort}
                        onIntervene={handleIntervention}
                        onFollowUp={handleFollowUp}
                        onPickEvents={handlePickEvents}
                        onTriggerEvent={handleTriggerEvent}
                        onTogglePlayback={handleTogglePlayback}
                        onBack={() => setActiveDateSessionId(null)}
                      />
                    </div>
                  ) : (
                    <ConstellationLobby
                      save={save}
                      shift={activeShift}
                      focusedMembers={focusedMembers}
                      drawnScenarios={drawnScenarios}
                      isActionPending={isActionPending}
                      bookingLocked={activeShift.activeBooking !== undefined}
                      aiReady={save.config.aiSetupComplete && localAiStatus.status === "ready"}
                      readyClosurePairs={readyClosurePairs}
                      readyClosurePairIds={readyClosurePairIds}
                      readyClosureMemberIds={readyClosureMemberIds}
                      revealAllMemberDetails={revealAllMemberDetails}
                      onTutorialUpdate={handleTutorialUpdate}
                      onCommitPair={handleCommitPair}
                      onBeginDate={handleBeginDate}
                      onCancelBooking={handleCancelBooking}
                      onRemoveDeckCard={handleRemoveDeckCard}
                      onResolveCardOffer={handleResolveCardOffer}
                      onShuffleCardOffer={handleShuffleCardOffer}
                      onClosePair={handleClosePair}
                      closureErrorMessage={closureErrorMessage}
                      onDismissClosureError={resetClosureError}
                      onDeckOverBudgetBlocked={() =>
                        dispatchManagerQuip({
                          triggerKey: "datebook.commit.over-budget",
                          surfaceKey: "lobby.deck",
                          bypassTutorialGate: true,
                        })
                      }
                      onCompleteShift={handleCompleteShift}
                      onOpenDateSession={setActiveDateSessionId}
                      onAddFocus={handleAddFocus}
                      onRemoveFocus={handleRemoveFocus}
                      onReselectFocus={handleReselectFocus}
                      onSwapShiftPartner={handleSwapShiftPartner}
                      chromeSlot={(opts) => (
                        <GlassChromePills
                          shiftNumber={activeShift.shiftNumber}
                          aiStatusLabel={aiStatusLabel}
                          isActionPending={isActionPending}
                          getDiagnostics={getDiagnostics}
                          canExportSave={save !== null}
                          canUseDevMemberDetailsPreview={CAN_USE_DEV_MEMBER_DETAILS_PREVIEW}
                          devRevealAllMemberDetails={revealAllMemberDetails}
                          onPunchOut={onPunchOut}
                          onBack={opts?.onBack}
                          onOpenAiSetup={() => setIsAiSetupOpen(true)}
                          onReset={handleResetSave}
                          onResetOrientation={() => {
                            void handleResetOrientation();
                          }}
                          onExportSave={handleExportSave}
                          onImportSave={handleImportSave}
                          onCopyDiagnostics={handleCopyDiagnostics}
                          onDevRevealAllMemberDetailsChange={handleDevRevealAllMemberDetailsChange}
                          onOpenReleaseNotes={handleOpenReleaseNotes}
                        />
                      )}
                    />
                  )
                ) : null}
              </motion.main>
            </AnimatePresence>

            {activeShift !== null &&
            activeShift.status === "completed" &&
            activeShift.report !== undefined ? (
              <ShiftReportPanel
                shift={activeShift}
                members={save.members}
                isActionPending={isActionPending}
                onOpenNextShift={handleStartNextShift}
              />
            ) : null}

            <AnimatePresence>
              {isAiSetupOpen ? (
                <AiSetupPanel
                  config={save.config}
                  gatewayApiKey={gatewayApiKey}
                  status={localAiStatus}
                  required={!save.config.aiSetupComplete}
                  isActionPending={isActionPending}
                  onClose={() => setIsAiSetupOpen(false)}
                  onSave={handleSaveAiConfig}
                  onCheck={handleCheckAiConfig}
                />
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {isReleaseNotesOpen && releaseNotesForModal.length > 0 ? (
                <ReleaseNotesModal
                  notes={releaseNotesForModal}
                  initialVersion={APP_VERSION}
                  onClose={handleCloseReleaseNotes}
                />
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {softWinDue && !campaignLost && !isReleaseNotesOpen ? (
                <SoftWinCutscene
                  save={save}
                  isActionPending={isActionPending}
                  onContinue={handleMarkSoftWinSeen}
                />
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {campaignLost && !isReleaseNotesOpen ? (
                <CampaignLossModal
                  save={save}
                  isActionPending={isActionPending}
                  onResetCampaign={handleResetSave}
                  onExportSave={handleExportSave}
                  onPunchOut={onPunchOut}
                />
              ) : null}
            </AnimatePresence>

            {errorMessage !== null ? (
              <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
            ) : null}
            {errorMessage === null && noticeMessage !== null ? (
              <ErrorBanner message={noticeMessage} onDismiss={() => setNoticeMessage(null)} />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <ManagerQuipPopup
        quip={activeManagerQuip ?? null}
        presentationKey={managerQuipPresentationKey}
        onDismissed={handleManagerQuipDismissed}
      />
      <AnimatePresence>
        {onboardingWarping ? (
          <CosmicWarpOverlay key="onboarding-warp" originX="50%" originY="92%" />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 pt-4">
      <div className="aura-glass-strong flex items-center gap-3 rounded-pill px-4 py-2 shadow-aura-soft">
        <p className="text-sm text-black">{message}</p>
        <button
          type="button"
          data-sfx="click"
          onClick={onDismiss}
          className="cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/65 hover:text-aura-rose"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function readStoredDevMemberDetailsPreview(): boolean {
  if (!CAN_USE_DEV_MEMBER_DETAILS_PREVIEW || typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(DEV_MEMBER_DETAILS_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStoredDevMemberDetailsPreview(enabled: boolean): void {
  if (!CAN_USE_DEV_MEMBER_DETAILS_PREVIEW || typeof window === "undefined") {
    return;
  }

  try {
    if (enabled) {
      window.localStorage.setItem(DEV_MEMBER_DETAILS_STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(DEV_MEMBER_DETAILS_STORAGE_KEY);
    }
  } catch {
    return;
  }
}
