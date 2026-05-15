import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  gameSaveSchema,
  SAVE_SCHEMA_VERSION,
  type DateFinalReport,
  type DateScenario,
  type FollowUpAction,
  type GameConfig,
  type GameSave,
} from "../domain/game";
import { companyGoals, memberRequests, starterScenarios } from "../fixtures";
import { APP_VERSION } from "../platform/release-identity";
import { lockAiProviderBaseUrlsForRuntime } from "../platform/runtime";
import { tryBackupSave } from "../repositories/backup-save";
import { createGameRepository } from "../repositories/create-game-repository";
import {
  readStoredGatewayApiKey,
  requestLocalAiStatus,
  storeGatewayApiKey,
} from "../services/ai/client";
import {
  advanceDateExchangeWithLocalAiStream,
  DateStreamAbortedError,
  type LocalAiDateStreamEvent,
} from "../services/ai-date-engine";
import { generateClosureSummary } from "../services/closure-summary";
import {
  closePair,
  getReadyClosurePairs,
  markSoftWinSeen,
  shouldShowSoftWinForActiveShift,
} from "../services/closures";
import {
  addCupidIntervention,
  applyFollowUpAction,
  canAddCupidIntervention,
  clearActiveBooking,
  commitDateBooking,
  completeShift,
  pickScenarioEvents,
  startDateSessionFromBooking,
  startNextShift,
  togglePlayback,
  triggerScenarioEvent,
} from "../services/date-engine";
import {
  addCardToDeck,
  createDraftedScenarioDeck,
  deckIsRepairBlocked,
  removeCardFromDeck,
  STARTER_CATALOG_IDS,
} from "../services/deck";
import { computeEffectiveCosts, rotateBudgetPeriod } from "../services/budget";
import { applyDevSeed, clearDevSeedQueryParam, readDevSeedRequest } from "../services/dev-seeds";
import {
  addFocusCase as focusAddCase,
  getFocusedMembers,
  removeFocusCase as focusRemoveCase,
  reselectFocusCases as focusReselect,
  selectInitialFocusCases as focusSelectInitial,
  syncActiveShiftFocusCases,
  swapFocusCase as focusSwapCase,
} from "../services/focus-cases";
import { getActiveShift, hydrateFixtureOwnedMemberData } from "../services/game-seed";
import {
  appendManagerQuipHistory,
  detectFocusSwapDropOfActive,
  detectMemberQuitTransition,
  detectRetentionWarningDip,
  indexMembersById,
  pairEnteredBrittleTrajectory,
  resolveManagerQuip,
  shouldFireSoftWinQuip,
  type ManagerQuipResolveResult,
} from "../services/manager-quips";
import {
  TutorialActivityProvider,
  useIsRequiredTutorialActive,
  withOrientationReset,
} from "../services/tutorial";
import { errorToMessage } from "../services/utils";
import { ManagerQuipPopup } from "./manager-quip-popup";
import {
  getManagerQuipById,
  type ManagerQuip,
  type ManagerQuipTriggerKey,
} from "../fixtures/manager-quips";
import { AiSetupPanel, type AiSetupStatus } from "./ai-setup-panel";
import { AmbientMesh } from "./ambient-mesh";
import {
  DashboardLoading,
  DateView,
  NotesView,
  ShiftReportPanel,
  type PendingDateAction,
  type PlaybackIntent,
  type StreamingDraftMessage,
} from "./dashboard-views";
import { DateBookCanvas } from "./date-book-canvas";
import { FloatingNavCluster, type LiveDateState, type RoomKey } from "./floating-nav-cluster";
import { OnboardingScreen } from "./onboarding-screen";
import { PreDateCanvas } from "./pre-date-canvas";
import { RosterCanvas } from "./roster-canvas";
import { buildDiagnosticsSnapshot, MutedIndicator, SettingsMenu } from "./settings-menu";
import { ReleaseNotesModal } from "./release-notes-modal";
import { useSfx } from "./sfx-provider";
import { SoftWinCutscene } from "./soft-win-cutscene";
import {
  getReleaseNoteByVersion,
  hasReleaseNotesEligibleSaveProgress,
  listReleaseNotesForModal,
  readStoredReleaseNotesVersion,
  shouldOpenReleaseNotes,
  writeStoredReleaseNotesVersion,
} from "../services/release-notes";

const AUTOPLAY_TICK_DELAY_MS = 480;
const CHECKING_LOCAL_AI_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Checking AI provider. Cupid is holding the clipboard very still.",
  details: [],
};
const DEV_MEMBER_DETAILS_STORAGE_KEY = "idc.cupid.dev.memberDetailsPreview";
const CAN_USE_DEV_MEMBER_DETAILS_PREVIEW = import.meta.env.DEV;

const OUTCOME_QUIP_TRIGGER_KEYS: Partial<
  Record<DateFinalReport["outcome"], ManagerQuipTriggerKey>
> = {
  bad_fit: "date.outcome.bad-fit",
  cool_down: "date.outcome.cool-down",
  second_date: "date.outcome.encourage",
  mixed: "date.outcome.encourage",
};

type CupidShellProps = {
  onPunchOut: () => void;
};

type PendingAction =
  | PendingDateAction
  | "startDate"
  | "intervention"
  | "pickEvents"
  | "triggerEvent"
  | "togglePlayback"
  | "followUp"
  | "endShift"
  | "nextShift"
  | "deck"
  | "focusCase"
  | "closure"
  | "softWin"
  | "reset";

export function CupidShell(props: CupidShellProps) {
  return (
    <TutorialActivityProvider>
      <CupidShellInner {...props} />
    </TutorialActivityProvider>
  );
}

function CupidShellInner({ onPunchOut }: CupidShellProps) {
  const repository = useMemo(() => createGameRepository(), []);
  const { play } = useSfx();
  const isTutorialBlocking = useIsRequiredTutorialActive();
  const isTutorialBlockingRef = useRef(isTutorialBlocking);
  useEffect(() => {
    isTutorialBlockingRef.current = isTutorialBlocking;
  }, [isTutorialBlocking]);
  const [activeManagerQuip, setActiveManagerQuip] = useState<ManagerQuip | null>(null);
  const [managerQuipPresentationKey, setManagerQuipPresentationKey] = useState(0);
  const sessionManagerQuipIdsRef = useRef<Set<string>>(new Set());
  const [save, setSave] = useState<GameSave | null>(null);
  const saveRef = useRef<GameSave | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomKey>("livedate");
  const [activeDateSessionId, setActiveDateSessionId] = useState<string | null>(null);
  const [interventionText, setInterventionText] = useState("");
  const [interventionTargetMemberId, setInterventionTargetMemberId] = useState("");
  const [localAiStatus, setLocalAiStatus] = useState<AiSetupStatus>(CHECKING_LOCAL_AI_STATUS);
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [isGatewayApiKeyLoaded, setIsGatewayApiKeyLoaded] = useState(false);
  const [isAiSetupOpen, setIsAiSetupOpen] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [streamingDrafts, setStreamingDrafts] = useState<StreamingDraftMessage[]>([]);
  const [isDateJudgePending, setIsDateJudgePending] = useState(false);
  const [queuedPlaybackIntent, setQueuedPlaybackIntent] = useState<PlaybackIntent | null>(null);
  const [closingPairId, setClosingPairId] = useState<string | null>(null);
  const [closureError, setClosureError] = useState<{ pairId: string; message: string } | null>(
    null,
  );
  const [devRevealAllMemberDetails, setDevRevealAllMemberDetails] = useState(
    readStoredDevMemberDetailsPreview,
  );
  const localAiStatusRequestRef = useRef<Promise<AiSetupStatus> | null>(null);
  const dateAbortControllerRef = useRef<AbortController | null>(null);
  const stopAfterCurrentTurnRef = useRef(false);
  const lastErrorMessageRef = useRef<string | null>(null);
  const releaseNotesCheckCompleteRef = useRef(false);
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
  const aiStatusConfigRef = useRef<GameConfig | null>(null);
  const aiStatusConfig = save?.config;
  aiStatusConfigRef.current = aiStatusConfig ?? null;
  const aiStatusConfigKey =
    aiStatusConfig === undefined
      ? ""
      : [
          aiStatusConfig.aiProvider,
          aiStatusConfig.chatModel,
          aiStatusConfig.embeddingModel,
          aiStatusConfig.reasoningLevel,
          aiStatusConfig.ollamaBaseURL,
          aiStatusConfig.gatewayBaseURL,
          aiStatusConfig.aiSetupComplete ? "complete" : "incomplete",
        ].join("|");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const stored = await readStoredGatewayApiKey();
      if (!mounted) return;
      setGatewayApiKey(stored);
      setIsGatewayApiKeyLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

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
      setSave(nextSave);
      if (recoveredOutdatedSave) {
        setErrorMessage(
          backupKey === null
            ? "Cupid reset an outdated local save. The previous file failed schema review."
            : "Cupid reset an outdated local save. The previous file is preserved as a .bak file.",
        );
      }
      const restoredSession =
        nextSave.dateSessions.find((s) => s.status === "active") ??
        nextSave.dateSessions.at(-1) ??
        null;
      setActiveDateSessionId(restoredSession?.id ?? null);
      if (restoredSession?.status === "active") {
        setCurrentRoom("livedate");
      }
    }
    void loadSave();
    return () => {
      mounted = false;
    };
  }, [repository]);

  useEffect(() => {
    const configSnapshot = aiStatusConfigRef.current;
    if (configSnapshot === null || !isGatewayApiKeyLoaded) {
      return;
    }
    const configForStatus = configSnapshot;
    let mounted = true;
    async function loadStatus() {
      setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
      const status = await requestLocalAiStatus(configForStatus, gatewayApiKey);
      if (!mounted) return;
      setLocalAiStatus(status);
      if (status.status === "unavailable" && configForStatus.aiSetupComplete) {
        setErrorMessage(status.message);
      }
    }
    void loadStatus();
    return () => {
      mounted = false;
    };
  }, [aiStatusConfigKey, gatewayApiKey, isGatewayApiKeyLoaded]);

  useEffect(() => {
    if (errorMessage === null) {
      lastErrorMessageRef.current = null;
      return;
    }
    if (lastErrorMessageRef.current === errorMessage) return;
    lastErrorMessageRef.current = errorMessage;
    play("alert");
  }, [errorMessage, play]);

  useEffect(() => {
    return () => {
      repository.flush().catch((error) => {
        console.warn("save flush on unmount failed", error);
      });
    };
  }, [repository]);

  const activeShift = save === null ? null : getActiveShift(save);
  const focusedMembers = useMemo(() => (save === null ? [] : getFocusedMembers(save)), [save]);
  const readyClosurePairs = useMemo(
    () => (save === null ? [] : getReadyClosurePairs(save)),
    [save],
  );
  const softWinDue = save !== null && shouldShowSoftWinForActiveShift(save);
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
  const activePairState = useMemo(
    () =>
      save === null || activeSession === null
        ? undefined
        : save.pairStates.find((pair) => pair.id === activeSession.pairId),
    [save, activeSession],
  );
  const drawnScenarios = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.drawnScenarioIds
            .map((id) => starterScenarios.find((scenario) => scenario.id === id))
            .filter((scenario): scenario is DateScenario => scenario !== undefined),
    [activeShift],
  );
  const deckRepairBlocked = useMemo(
    () => (save === null ? false : deckIsRepairBlocked(save, starterScenarios)),
    [save],
  );
  const dateAmbientActive = activeSession?.status === "active";
  const liveDateState: LiveDateState = deriveLiveDateState(activeSession, currentRoom);
  const screenKey =
    currentRoom === "livedate"
      ? `livedate:${activeSession?.id ?? "planning"}:${activeSession?.status ?? "planning"}`
      : currentRoom;
  const diagnosticsSnapshot = useMemo(
    () => buildDiagnosticsSnapshot({ config: save?.config ?? null, localAiStatus }),
    [save?.config, localAiStatus],
  );
  useEffect(() => {
    if (save === null) return;
    const caseBoardStarted =
      save.dateSessions.length > 0 ||
      save.shifts.some((shift) => shift.featuredMemberIds.length > 0);
    const onboardingActive = save.focusedMemberIds.length === 0 && !caseBoardStarted;
    if (!onboardingActive) return;
    dispatchManagerQuip({ triggerKey: "onboarding.welcome", bypassTutorialGate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

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
  }, [screenKey]);

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
    saveRef.current = saveToPersist;
    await repository.saveGame(saveToPersist);
    setSave(saveToPersist);
  }

  function dispatchManagerQuip(input: {
    triggerKey: ManagerQuipTriggerKey;
    surfaceKey?: string;
    bypassTutorialGate?: boolean;
  }): void {
    if (isTutorialBlockingRef.current && input.bypassTutorialGate !== true) return;
    const currentSave = saveRef.current;
    if (currentSave === null) return;
    const shiftNumber = getActiveShift(currentSave).shiftNumber;
    const result = resolveManagerQuip({
      triggerKey: input.triggerKey,
      history: currentSave.managerQuipHistory,
      currentShiftNumber: shiftNumber,
      sessionPlayedQuipIds: sessionManagerQuipIdsRef.current,
      surfaceKey: input.surfaceKey,
    });
    if (result === null) return;
    presentManagerQuip(currentSave, result, shiftNumber);
  }

  function presentManagerQuip(
    currentSave: GameSave,
    result: ManagerQuipResolveResult,
    shiftNumber: number,
  ): void {
    const quip = getManagerQuipById(result.quipId);
    if (quip === undefined) return;
    const nextHistory = appendManagerQuipHistory(
      currentSave.managerQuipHistory,
      result.historyRecord,
      shiftNumber,
    );
    const updatedSave: GameSave = { ...currentSave, managerQuipHistory: nextHistory };
    saveRef.current = updatedSave;
    setSave(updatedSave);
    void repository.saveGame(updatedSave).catch((error) => {
      console.warn("Manager quip history persist failed", error);
    });
    sessionManagerQuipIdsRef.current.add(result.quipId);
    setActiveManagerQuip(quip);
    setManagerQuipPresentationKey((prev) => prev + 1);
  }

  function processManagerQuipSaveDiff(previousSave: GameSave, nextSave: GameSave): void {
    if (isTutorialBlockingRef.current) return;
    const previousById = indexMembersById(previousSave.members);
    const nextById = indexMembersById(nextSave.members);
    const quit = detectMemberQuitTransition(previousSave, nextSave, previousById);
    if (quit !== null) {
      dispatchManagerQuip({ triggerKey: "member.status.quit", surfaceKey: quit });
    }
    const retentionDip = detectRetentionWarningDip(previousSave, nextSave, previousById);
    if (retentionDip !== null) {
      dispatchManagerQuip({
        triggerKey: "member.retention.warning",
        surfaceKey: retentionDip.memberId,
      });
    }
    const swapDrop = detectFocusSwapDropOfActive(previousSave, nextSave, previousById, nextById);
    if (swapDrop !== null) {
      dispatchManagerQuip({ triggerKey: "focus.swap.first", surfaceKey: swapDrop });
    }
  }

  function dispatchOutcomeQuip(report: DateFinalReport | undefined, sessionId: string): void {
    if (report === undefined) return;
    const triggerKey = OUTCOME_QUIP_TRIGGER_KEYS[report.outcome];
    if (triggerKey === undefined) return;
    dispatchManagerQuip({ triggerKey, surfaceKey: sessionId });
  }

  function dispatchBrittleTrajectoryIfChanged(
    previousSave: GameSave,
    nextSave: GameSave,
    pairId: string,
  ): void {
    const previousPair = previousSave.pairStates.find((pair) => pair.id === pairId);
    const nextPair = nextSave.pairStates.find((pair) => pair.id === pairId);
    if (nextPair === undefined) return;
    const previousCompleted = previousSave.dateSessions.filter(
      (session) => session.finalReport !== undefined,
    );
    const nextCompleted = nextSave.dateSessions.filter(
      (session) => session.finalReport !== undefined,
    );
    if (
      pairEnteredBrittleTrajectory({
        previousPairState: previousPair,
        nextPairState: nextPair,
        previousCompletedSessions: previousCompleted,
        nextCompletedSessions: nextCompleted,
      })
    ) {
      dispatchManagerQuip({ triggerKey: "pair.trajectory.brittle", surfaceKey: pairId });
    }
  }

  function handleManagerQuipDismissed(): void {
    setActiveManagerQuip(null);
  }

  const handleTutorialUpdate = useCallback(
    (next: GameSave) => {
      const current = saveRef.current;
      const merged = current === null ? next : { ...current, tutorial: next.tutorial };
      saveRef.current = merged;
      setSave(merged);
      void repository.saveGame(merged);
    },
    [repository],
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

  async function refreshLocalAiStatus(
    config = save?.config,
    key = gatewayApiKey,
  ): Promise<AiSetupStatus> {
    if (config === undefined) {
      return {
        status: "unavailable",
        message: "AI provider check needs a save file first.",
        details: [],
        checkedAt: new Date().toISOString(),
      };
    }
    if (localAiStatusRequestRef.current !== null) {
      return localAiStatusRequestRef.current;
    }
    setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
    const request = (async () => {
      try {
        const status = await requestLocalAiStatus(config, key);
        setLocalAiStatus(status);
        if (status.status === "unavailable") {
          setErrorMessage(status.message);
        }
        return status;
      } finally {
        localAiStatusRequestRef.current = null;
      }
    })();
    localAiStatusRequestRef.current = request;
    return request;
  }

  async function handleSaveAiConfig(nextConfig: GameConfig, nextGatewayApiKey: string) {
    if (save === null) return;
    await storeGatewayApiKey(nextGatewayApiKey);
    setGatewayApiKey(nextGatewayApiKey.trim());
    setIsGatewayApiKeyLoaded(true);
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

  function tryAction(kind: PendingAction, run: () => Promise<void>) {
    if (isActionPending) return;
    setPendingAction(kind);
    setErrorMessage(null);
    setNoticeMessage(null);
    void (async () => {
      try {
        await run();
      } catch (error) {
        setErrorMessage(errorToMessage(error));
      } finally {
        setPendingAction(null);
      }
    })();
  }

  async function handleCommitPair(input: { focusMemberId: string; partnerMemberId: string }) {
    if (save === null) return;
    tryAction("startDate", async () => {
      if (!save.config.aiSetupComplete) {
        setIsAiSetupOpen(true);
        throw new Error("AI setup is required before Cupid commits a pair.");
      }
      const status = await refreshLocalAiStatus();
      if (status.status !== "ready") {
        throw new Error(status.message);
      }
      const result = commitDateBooking(save, input);
      await persist(result.save);
    });
  }

  async function handleStartDate(input: { scenarioId: string }) {
    if (save === null) return;
    tryAction("startDate", async () => {
      const status = await refreshLocalAiStatus();
      if (status.status !== "ready") {
        throw new Error(status.message);
      }
      const result = startDateSessionFromBooking(save, input);
      await persist(result.save);
      dispatchManagerQuip({ triggerKey: "date.started", surfaceKey: result.session.id });
      setActiveDateSessionId(result.session.id);
      setInterventionText("");
      setInterventionTargetMemberId("");
      setCurrentRoom("livedate");
    });
  }

  async function handleCancelBooking() {
    if (save === null) return;
    tryAction("startDate", async () => {
      await persist(clearActiveBooking(save));
    });
  }

  async function handleAdvanceExchange(turnCount: 1 | 2) {
    if (save === null || activeSession === null) return;
    const sessionId = activeSession.id;
    const previousStatus = activeSession.status;
    const previousSave = save;
    tryAction("advanceExchange", async () => {
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
        const nextStatus = result.session.status;
        if (previousStatus === "active" && nextStatus === "completed") {
          dispatchManagerQuip({ triggerKey: "date.ended", surfaceKey: sessionId });
          dispatchOutcomeQuip(result.session.finalReport, sessionId);
          dispatchBrittleTrajectoryIfChanged(previousSave, result.save, result.session.pairId);
        } else if (previousStatus === "active" && nextStatus === "ended_early") {
          dispatchManagerQuip({ triggerKey: "date.ended-early", surfaceKey: sessionId });
          dispatchOutcomeQuip(result.session.finalReport, sessionId);
          dispatchBrittleTrajectoryIfChanged(previousSave, result.save, result.session.pairId);
        }
        processManagerQuipSaveDiff(previousSave, result.save);
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

  function applyStreamEvent(event: LocalAiDateStreamEvent) {
    if (event.type === "judgeStart") {
      setIsDateJudgePending(true);
      return;
    }

    if (event.type === "characterStart") {
      setIsDateJudgePending(false);
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
    tryAction("intervention", async () => {
      const result = addCupidIntervention(save, {
        dateSessionId: activeSession.id,
        targetMemberId: interventionTargetMemberId || activeSession.participants[0],
        text: interventionText,
      });
      await persist(result.save);
      setInterventionText("");
    });
  }

  async function handlePickEvents(eventIds: string[]) {
    if (save === null || activeSession === null) return;
    tryAction("pickEvents", async () => {
      const result = pickScenarioEvents(save, {
        dateSessionId: activeSession.id,
        pickedEventIds: eventIds,
      });
      await persist(result.save);
    });
  }

  async function handleTriggerEvent(eventId: string) {
    if (save === null || activeSession === null) return;
    tryAction("triggerEvent", async () => {
      const result = triggerScenarioEvent(save, {
        dateSessionId: activeSession.id,
        eventId,
      });
      await persist(result.save);
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
    tryAction("togglePlayback", async () => {
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
    tryAction("followUp", async () => {
      const result = applyFollowUpAction(save, {
        dateSessionId: activeSession.id,
        action,
      });
      await persist(result.save);
    });
  }

  async function handleEndShift() {
    if (save === null) return;
    const previousSave = save;
    tryAction("endShift", async () => {
      const { save: nextSave } = completeShift(save);
      await persist(nextSave);
      processManagerQuipSaveDiff(previousSave, nextSave);
    });
  }

  async function handleStartNextShift() {
    if (save === null) return;
    const previousSave = save;
    tryAction("nextShift", async () => {
      const { save: nextSave } = startNextShift(save);
      await persist(nextSave);
      processManagerQuipSaveDiff(previousSave, nextSave);
    });
  }

  async function handleConfirmOnboarding(payload: {
    focusedMemberIds: string[];
    scenarioDeckCardIds: string[];
  }) {
    if (save === null) return;
    tryAction("focusCase", async () => {
      const draftedDeck = createDraftedScenarioDeck({
        cardIds: payload.scenarioDeckCardIds,
        catalog: starterScenarios,
        catalogIds: STARTER_CATALOG_IDS,
        budgetCap: save.budgetCap,
        effectiveCosts: computeEffectiveCosts(starterScenarios, []),
      });
      const withDeck: GameSave = {
        ...save,
        scenarioDeck: draftedDeck,
        shifts: save.shifts.map((shift) =>
          shift.id === save.activeShiftId ? { ...shift, drawnScenarioIds: [] as string[] } : shift,
        ),
      };
      const withFocus = syncActiveShiftFocusCases(
        focusSelectInitial(withDeck, payload.focusedMemberIds),
      );
      const requestsById = new Map(memberRequests.map((request) => [request.id, request] as const));
      const focusedMemberRequests = withFocus.focusedMemberIds
        .map((memberId) => withFocus.members.find((member) => member.id === memberId))
        .map((member) =>
          member?.state.currentRequestId === undefined
            ? undefined
            : requestsById.get(member.state.currentRequestId),
        )
        .filter((request): request is (typeof memberRequests)[number] => request !== undefined);
      const activeShift = getActiveShift(withFocus);
      const activeCompanyGoalIds = new Set(activeShift.companyGoalIds);
      const withBudgetPeriod = rotateBudgetPeriod({
        save: withFocus,
        shiftNumber: 1,
        scenarios: starterScenarios,
        focusedMemberRequests,
        recentClosurePairTags: [],
        activeCompanyGoals: companyGoals.filter((goal) => activeCompanyGoalIds.has(goal.id)),
      });
      await persist(withBudgetPeriod);
      setCurrentRoom("livedate");
    });
  }

  async function handleAddFocus(memberId: string) {
    if (save === null) return;
    tryAction("focusCase", async () => {
      await persist(syncActiveShiftFocusCases(focusAddCase(save, memberId)));
    });
  }

  async function handleRemoveFocus(memberId: string) {
    if (save === null) return;
    tryAction("focusCase", async () => {
      await persist(syncActiveShiftFocusCases(focusRemoveCase(save, memberId)));
    });
  }

  async function handleSwapFocus(oldId: string, newId: string) {
    if (save === null) return;
    const previousSave = save;
    tryAction("focusCase", async () => {
      const nextSave = syncActiveShiftFocusCases(focusSwapCase(save, oldId, newId));
      await persist(nextSave);
      processManagerQuipSaveDiff(previousSave, nextSave);
    });
  }

  async function handleReselectFocus(nextFocusIds: string[]) {
    if (save === null) return;
    const previousSave = save;
    tryAction("focusCase", async () => {
      const nextSave = syncActiveShiftFocusCases(focusReselect(save, nextFocusIds));
      await persist(nextSave);
      processManagerQuipSaveDiff(previousSave, nextSave);
    });
  }

  async function handleAddDeckCard(libraryCardId: string) {
    if (save === null) return;
    tryAction("deck", async () => {
      const next = addCardToDeck({
        save,
        scenarios: starterScenarios,
        cardId: libraryCardId,
      });
      await persist(next);
    });
  }

  async function handleRemoveDeckCard(deckCardId: string) {
    if (save === null) return;
    tryAction("deck", async () => {
      const next = removeCardFromDeck(save, deckCardId);
      await persist(next);
    });
  }

  async function handleConfirmClosure(pairId: string) {
    if (save === null) return;
    const ready = readyClosurePairs.find((entry) => entry.pairState.id === pairId);
    if (ready === undefined) {
      setClosureError({ pairId, message: "That pair no longer meets the closure threshold." });
      return;
    }

    if (!save.config.aiSetupComplete) {
      setIsAiSetupOpen(true);
      setClosureError({ pairId, message: "AI setup is required to file a closure summary." });
      return;
    }

    setClosingPairId(pairId);
    setClosureError(null);

    const previousSave = save;
    tryAction("closure", async () => {
      try {
        const status = await refreshLocalAiStatus();
        if (status.status !== "ready") {
          throw new Error(status.message);
        }
        const summary = await generateClosureSummary({
          save,
          ready,
          config: { ...save.config, gatewayApiKey: gatewayApiKey || undefined },
        });
        const closed = closePair({ save, pairId, summary });
        await persist(closed);
        dispatchManagerQuip({ triggerKey: "pair.closure.confirmed", surfaceKey: pairId });
        if (shouldFireSoftWinQuip(closed.managerQuipHistory, closed.closureCount)) {
          dispatchManagerQuip({ triggerKey: "campaign.closures.five" });
        }
        processManagerQuipSaveDiff(previousSave, closed);
        setClosingPairId(null);
      } catch (error) {
        setClosingPairId(null);
        setClosureError({ pairId, message: errorToMessage(error) });
        throw error;
      }
    });
  }

  function handleDismissClosureError() {
    setClosureError(null);
    setClosingPairId(null);
  }

  async function handleMarkSoftWinSeen() {
    if (save === null) return;
    tryAction("softWin", async () => {
      const next = markSoftWinSeen(save);
      await persist(next);
    });
  }

  function resetTransientShellState() {
    setInterventionText("");
    setInterventionTargetMemberId("");
    setStreamingDrafts([]);
    setQueuedPlaybackIntent(null);
    setClosingPairId(null);
    setClosureError(null);
    setCurrentRoom("livedate");
    sessionManagerQuipIdsRef.current = new Set();
    setActiveManagerQuip(null);
  }

  async function handleResetSave() {
    tryAction("reset", async () => {
      await tryBackupSave(repository);
      const nextSave = await repository.resetGame();
      setSave(nextSave);
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
    tryAction("reset", async () => {
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
      setSave(nextSave);
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
      await navigator.clipboard.writeText(JSON.stringify(diagnosticsSnapshot, null, 2));
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

  const caseBoardStarted =
    save.dateSessions.length > 0 || save.shifts.some((shift) => shift.featuredMemberIds.length > 0);
  const needsInitialFocusCases = save.focusedMemberIds.length === 0 && !caseBoardStarted;

  const aiReady = localAiStatus.status === "ready" && save.config.aiSetupComplete === true;
  const aiStatusLabel = save.config.aiSetupComplete ? localAiStatus.status : "setup";

  return (
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
          <header className="relative z-40 mx-auto flex w-full max-w-canvas items-center justify-between gap-4 px-6 py-4 lg:px-12">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPunchOut}
                data-sfx="click"
                className="cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black transition hover:border-aura-rose/30 hover:text-aura-rose"
              >
                ← Punch out
              </button>
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black">
                shift {String(activeShift?.shiftNumber ?? 1).padStart(2, "0")} / {currentRoom}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MutedIndicator />
              <button
                type="button"
                onClick={() => setIsAiSetupOpen(true)}
                data-sfx="click"
                className="cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black transition hover:border-aura-rose/30 hover:text-aura-rose"
              >
                ai · {aiStatusLabel}
              </button>
              <SettingsMenu
                isActionPending={isActionPending}
                diagnostics={diagnosticsSnapshot}
                canExportSave={save !== null}
                canUseDevMemberDetailsPreview={CAN_USE_DEV_MEMBER_DETAILS_PREVIEW}
                devRevealAllMemberDetails={revealAllMemberDetails}
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
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={screenKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {currentRoom === "livedate" && activeShift !== null ? (
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
                      isActionPending={isActionPending}
                      pendingDateAction={
                        pendingAction === "advanceExchange" ? "advanceExchange" : null
                      }
                      isJudgePending={isDateJudgePending}
                      queuedPlaybackIntent={queuedPlaybackIntent}
                      streamingDrafts={streamingDrafts}
                      onInterventionTextChange={setInterventionText}
                      onInterventionTargetChange={setInterventionTargetMemberId}
                      onAdvance={handleAdvanceExchange}
                      onCancel={handleCancelDate}
                      onIntervene={handleIntervention}
                      onFollowUp={handleFollowUp}
                      onPickEvents={handlePickEvents}
                      onTriggerEvent={handleTriggerEvent}
                      onTogglePlayback={handleTogglePlayback}
                      onBack={() => setActiveDateSessionId(null)}
                    />
                  </div>
                ) : (
                  <PreDateCanvas
                    save={save}
                    shift={activeShift}
                    focusedMembers={focusedMembers}
                    drawnScenarios={drawnScenarios}
                    memberRequests={memberRequests}
                    pairStates={save.pairStates}
                    isActionPending={isActionPending}
                    aiReady={aiReady}
                    readyClosurePairs={readyClosurePairs}
                    closingPairId={closingPairId}
                    closureError={closureError}
                    revealAllMemberDetails={revealAllMemberDetails}
                    deckRepairBlocked={deckRepairBlocked}
                    onTutorialUpdate={handleTutorialUpdate}
                    onCommitPair={handleCommitPair}
                    onStartDate={handleStartDate}
                    onCancelBooking={handleCancelBooking}
                    onConfirmClosure={handleConfirmClosure}
                    onDismissClosureError={handleDismissClosureError}
                    onOpenDateBook={() => setCurrentRoom("datebook")}
                    onOpenRoster={() => setCurrentRoom("roster")}
                    onOpenAiSetup={() => setIsAiSetupOpen(true)}
                    onCloseShift={handleEndShift}
                    onStartNextShift={handleStartNextShift}
                    onDeckOverBudgetBlocked={(surfaceKey) =>
                      dispatchManagerQuip({
                        triggerKey: "datebook.commit.over-budget",
                        surfaceKey,
                      })
                    }
                  />
                )
              ) : null}

              {currentRoom === "datebook" && activeShift !== null ? (
                <DateBookCanvas
                  save={save}
                  currentShift={activeShift.shiftNumber}
                  scenarios={starterScenarios}
                  isActionPending={isActionPending}
                  bookingLocked={activeShift.activeBooking !== undefined}
                  onTutorialUpdate={handleTutorialUpdate}
                  onAddToDeck={handleAddDeckCard}
                  onRemoveFromDeck={handleRemoveDeckCard}
                  onBack={() => setCurrentRoom("livedate")}
                />
              ) : null}

              {currentRoom === "roster" ? (
                <RosterCanvas
                  members={save.members}
                  focusedMemberIds={save.focusedMemberIds}
                  playerKnowledge={save.playerKnowledge}
                  isActionPending={isActionPending}
                  revealAllMemberDetails={revealAllMemberDetails}
                  save={save}
                  onTutorialUpdate={handleTutorialUpdate}
                  onAddFocus={handleAddFocus}
                  onRemoveFocus={handleRemoveFocus}
                  onSwapFocus={handleSwapFocus}
                  onReselectFocus={handleReselectFocus}
                  onBack={() => setCurrentRoom("livedate")}
                />
              ) : null}

              {currentRoom === "files" ? (
                <div className="mx-auto w-full max-w-canvas px-6 py-8 lg:px-12">
                  <NotesView
                    memories={save.memories}
                    members={save.members}
                    pairStates={save.pairStates}
                    scenarios={starterScenarios}
                    shiftCount={save.shifts.length}
                  />
                </div>
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

          <FloatingNavCluster
            current={currentRoom}
            hidden={dateAmbientActive}
            liveDateState={liveDateState}
            onSelect={(room) => setCurrentRoom(room)}
          />

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
            {softWinDue && !isReleaseNotesOpen ? (
              <SoftWinCutscene
                save={save}
                isActionPending={isActionPending}
                onContinue={handleMarkSoftWinSeen}
              />
            ) : null}
          </AnimatePresence>

          {errorMessage !== null ? (
            <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          ) : null}
          {errorMessage === null && noticeMessage !== null ? (
            <ErrorBanner message={noticeMessage} onDismiss={() => setNoticeMessage(null)} />
          ) : null}

          <ManagerQuipPopup
            quip={activeManagerQuip ?? null}
            presentationKey={managerQuipPresentationKey}
            onDismissed={handleManagerQuipDismissed}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function deriveLiveDateState(
  activeSession: { status: string } | null,
  currentRoom: RoomKey,
): LiveDateState {
  if (activeSession === null) {
    return currentRoom === "livedate" ? "planning" : "idle";
  }
  return activeSession.status === "active" ? "live" : "wrap";
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
