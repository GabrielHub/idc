import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  gameSaveSchema,
  SAVE_SCHEMA_VERSION,
  type DateSession,
  type DateSessionStatus,
  type DateScenario,
  type FollowUpAction,
  type GameConfig,
  type GameSave,
  type Member,
  type PairState,
  type ShiftState,
} from "../domain/game";
import { APP_VERSION } from "../platform/release-identity";
import { companyGoals, memberRequests, starterScenarios } from "../fixtures";
import { tryBackupSave } from "../repositories/backup-save";
import { createGameRepository } from "../repositories/create-game-repository";
import { isTauriRuntime, lockAiProviderBaseUrlsForRuntime } from "../platform/runtime";
import { openTauriLogFolder, openTauriSaveFolder } from "../platform/tauri-log-folder";
import {
  addCupidIntervention,
  applyFollowUpAction,
  buildGoalProgressSnapshots,
  buildShiftGoalMetrics,
  canAddCupidIntervention,
  CLIENT_LOSS_LIMIT,
  completeShift,
  getQuitMembers,
  isMemberRetained,
  pickScenarioEvents,
  startDateSession,
  startNextShift,
  togglePlayback,
  triggerScenarioEvent,
} from "../services/date-engine";
import { getActiveShift, makePairId } from "../services/game-seed";
import { errorToMessage } from "../services/utils";
import {
  discardDrawnScenario,
  evaluateScenarioPowers,
  findScenarioFixture,
  holdScenarioForTomorrow,
  requestLowPressureScenario,
  type ScenarioPowerResult,
} from "../services/scenario-powers";
import {
  readStoredGatewayApiKey,
  requestLocalAiStatus,
  storeGatewayApiKey,
} from "../services/ai/client";
import {
  advanceDateExchangeWithLocalAiStream,
  DateStreamAbortedError,
  type LocalAiDateEngineResult,
  type LocalAiDateStreamEvent,
} from "../services/ai-date-engine";
import type { AiRuntimeConfig } from "../services/ai/model-service";
import { AiSetupPanel, type AiSetupStatus } from "./ai-setup-panel";
import {
  ChromeButton,
  GhostButton,
  LiveDot,
  MenuButton,
  PrimaryButton,
  pad2,
} from "./dashboard-atoms";
import {
  BriefView,
  DashboardLoading,
  DateView,
  NotesView,
  RosterView,
  ShiftReportPanel,
  type PendingDateAction,
  type PreviousFile,
  type StreamingDraftMessage,
} from "./dashboard-views";
import { useSfx } from "./sfx-provider";

type ViewKey = "roster" | "brief" | "date" | "notes";
type DashboardPendingAction =
  | PendingDateAction
  | "startDate"
  | "intervention"
  | "pickEvents"
  | "triggerEvent"
  | "togglePlayback"
  | "followUp"
  | "endShift"
  | "reset"
  | "nextShift"
  | "deckPower";

const AUTOPLAY_TICK_DELAY_MS = 480;

function asPendingDateAction(action: DashboardPendingAction | null): PendingDateAction | null {
  if (action === "advanceExchange") {
    return action;
  }

  return null;
}

type LocalAiClientStatus = AiSetupStatus;

type RetriableDateAction = { kind: "advanceExchange"; turnCount: 1 | 2 };

const CHECKING_LOCAL_AI_STATUS: LocalAiClientStatus = {
  status: "checking",
  message: "Checking AI provider. Cupid is holding the clipboard very still.",
  details: [],
};

const DATE_TAG_LABELS: Record<DateSessionStatus, string> = {
  active: "live",
  completed: "filed",
  ended_early: "early end",
};

type CupidOperationsDashboardProps = {
  onPunchOut: () => void;
};

export function CupidOperationsDashboard({ onPunchOut }: CupidOperationsDashboardProps) {
  const repository = useMemo(() => createGameRepository(), []);
  const { play, setDateAmbientActive } = useSfx();
  const [save, setSave] = useState<GameSave | null>(null);
  const [view, setView] = useState<ViewKey>("roster");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [activeDateSessionId, setActiveDateSessionId] = useState<string | null>(null);
  const [interventionText, setInterventionText] = useState("");
  const [interventionTargetMemberId, setInterventionTargetMemberId] = useState("");
  const [localAiStatus, setLocalAiStatus] = useState<LocalAiClientStatus>(CHECKING_LOCAL_AI_STATUS);
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [isGatewayApiKeyLoaded, setIsGatewayApiKeyLoaded] = useState(false);
  const [isAiSetupOpen, setIsAiSetupOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<DashboardPendingAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingDrafts, setStreamingDrafts] = useState<StreamingDraftMessage[]>([]);
  const [pendingDateRetry, setPendingDateRetry] = useState<RetriableDateAction | null>(null);
  const [queuedPlaybackIntent, setQueuedPlaybackIntent] = useState<"playing" | "paused" | null>(
    null,
  );
  const lastErrorMessageRef = useRef<string | null>(null);
  const localAiStatusRequestRef = useRef<Promise<LocalAiClientStatus> | null>(null);
  const dateAbortControllerRef = useRef<AbortController | null>(null);
  const stopAfterCurrentTurnRef = useRef(false);
  const isActionPending = pendingAction !== null;

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const storedKey = await readStoredGatewayApiKey();

      if (!isMounted) {
        return;
      }

      setGatewayApiKey(storedKey);
      setIsGatewayApiKeyLoaded(true);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

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

      const nextSave = existingSave ?? (await repository.resetGame());

      if (!isMounted) {
        return;
      }

      setSave(nextSave);
      if (recoveredOutdatedSave) {
        setErrorMessage(
          backupKey === null
            ? "Cupid reset an outdated local save. The previous file failed schema review."
            : "Cupid reset an outdated local save. The previous file is preserved next to it as a .bak.* file in your saves folder.",
        );
      }
      const restoredSession =
        nextSave.dateSessions.find((session) => session.status === "active") ??
        nextSave.dateSessions.at(-1) ??
        null;
      setSelectedScenarioId(getActiveShift(nextSave).drawnScenarioIds[0] ?? "");
      setSelectedMemberIds(defaultMemberSelection(nextSave));
      setActiveDateSessionId(restoredSession?.id ?? null);
      if (restoredSession !== null && restoredSession.status === "active") {
        setView("date");
      }
    }

    void loadSave();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const config = save?.config ?? null;
  const aiReadinessConfig = useMemo(
    () => config,
    [
      config?.aiProvider,
      config?.ollamaBaseURL,
      config?.gatewayBaseURL,
      config?.chatModel,
      config?.embeddingModel,
      config?.aiSetupComplete,
      config?.reasoningLevel,
    ],
  );

  useEffect(() => {
    if (aiReadinessConfig === null || !isGatewayApiKeyLoaded) {
      return;
    }

    const currentConfig = aiReadinessConfig;
    let isMounted = true;

    async function loadLocalAiStatus() {
      setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
      const status = await requestLocalAiStatus(currentConfig, gatewayApiKey);

      if (!isMounted) {
        return;
      }

      setLocalAiStatus(status);

      if (status.status === "unavailable" && currentConfig.aiSetupComplete) {
        setErrorMessage(status.message);
      }
    }

    void loadLocalAiStatus();

    return () => {
      isMounted = false;
    };
  }, [gatewayApiKey, aiReadinessConfig, isGatewayApiKeyLoaded]);

  useEffect(() => {
    if (errorMessage === null) {
      lastErrorMessageRef.current = null;
      return;
    }

    if (lastErrorMessageRef.current === errorMessage) {
      return;
    }

    lastErrorMessageRef.current = errorMessage;
    play("alert");
  }, [errorMessage, play]);

  const activeShift = save === null ? null : getActiveShift(save);
  const featuredMembers = useMemo(
    () =>
      save === null || activeShift === null
        ? []
        : activeShift.featuredMemberIds
            .map((memberId) => save.members.find((member) => member.id === memberId))
            .filter(isDefined),
    [activeShift, save],
  );
  const drawnScenarios = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.drawnScenarioIds
            .map((scenarioId) => starterScenarios.find((scenario) => scenario.id === scenarioId))
            .filter(isDefined),
    [activeShift],
  );
  const pinnedGoals = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.companyGoalIds
            .map((goalId) => companyGoals.find((goal) => goal.id === goalId))
            .filter(isDefined),
    [activeShift],
  );
  const pinnedRequests = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.memberRequestIds
            .map((requestId) => memberRequests.find((request) => request.id === requestId))
            .filter(isDefined),
    [activeShift],
  );
  const dateSessions = save?.dateSessions ?? null;
  const members = save?.members ?? null;
  const pinnedGoalProgress = useMemo(() => {
    if (activeShift === null || dateSessions === null || members === null) {
      return [];
    }

    const metrics = buildShiftGoalMetrics({
      shift: activeShift,
      dateSessions,
      members,
    });

    return buildGoalProgressSnapshots({
      goals: pinnedGoals,
      shiftStatus: activeShift.status,
      metrics,
      shiftReport: activeShift.report,
    });
  }, [activeShift, pinnedGoals, dateSessions, members]);
  const selectedMembers = useMemo(
    () =>
      save === null
        ? []
        : selectedMemberIds
            .map((memberId) => save.members.find((member) => member.id === memberId))
            .filter(isDefined),
    [save, selectedMemberIds],
  );
  const selectedScenario = useMemo(
    () => drawnScenarios.find((scenario) => scenario.id === selectedScenarioId),
    [drawnScenarios, selectedScenarioId],
  );
  const activeSession = useMemo(
    () =>
      save === null || activeDateSessionId === null
        ? null
        : (save.dateSessions.find((session) => session.id === activeDateSessionId) ?? null),
    [save, activeDateSessionId],
  );
  const pairPreview = useMemo(
    () => buildPairPreview(save, selectedMembers, selectedScenario),
    [save, selectedMembers, selectedScenario],
  );
  const quitMembers = useMemo(() => (save === null ? [] : getQuitMembers(save.members)), [save]);
  const campaignLost = quitMembers.length >= CLIENT_LOSS_LIMIT;
  const dateAmbientActive = view === "date" && activeSession?.status === "active";
  const publicNoteCount = useMemo(
    () =>
      save === null
        ? 0
        : save.memories.filter(
            (memory) =>
              memory.visibility === "public" &&
              (memory.scope === "pair" || memory.scope === "date" || memory.scope === "scenario"),
          ).length,
    [save],
  );
  const diagnosticsSnapshot = useMemo(
    () => buildDiagnosticsSnapshot({ config: save?.config ?? null, localAiStatus }),
    [save?.config, localAiStatus],
  );
  const deckPowerAvailability = useMemo(
    () =>
      activeShift === null
        ? {
            canHold: false,
            canDiscard: false,
            canRequestLowPressure: false,
            lowPressureSwapTargetId: undefined,
            reason: "Cupid powers wait for a live shift.",
          }
        : evaluateScenarioPowers({
            shift: activeShift,
            selectedScenarioId,
            hasActiveDate: activeSession?.status === "active",
          }),
    [activeShift, selectedScenarioId, activeSession?.status],
  );
  const carriedHeldScenario = useMemo(() => {
    if (save === null || activeShift === null) {
      return undefined;
    }

    const previousShift = save.shifts.find(
      (shift) => shift.shiftNumber === activeShift.shiftNumber - 1,
    );

    if (previousShift?.heldScenarioId === undefined) {
      return undefined;
    }

    return findScenarioFixture(previousShift.heldScenarioId);
  }, [activeShift, save]);

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [activeDateSessionId, view]);

  useEffect(() => {
    setDateAmbientActive(dateAmbientActive);
  }, [dateAmbientActive, setDateAmbientActive]);

  useEffect(() => {
    return () => setDateAmbientActive(false);
  }, [setDateAmbientActive]);

  async function persist(nextSave: GameSave) {
    await repository.saveGame(nextSave);
    setSave(nextSave);
  }

  function selectFocusMember(memberId: string) {
    if (save?.members.some((member) => member.id === memberId && !isMemberRetained(member))) {
      return;
    }

    setSelectedMemberIds((current) => {
      const partnerMemberId = current[1] === memberId ? undefined : current[1];
      return [memberId, partnerMemberId].filter(isDefined);
    });
  }

  function selectPartnerMember(memberId: string) {
    if (save?.members.some((member) => member.id === memberId && !isMemberRetained(member))) {
      return;
    }

    setSelectedMemberIds((current) => {
      const focusMemberId = current[0];

      if (focusMemberId === undefined || focusMemberId === memberId) {
        return current;
      }

      return [focusMemberId, memberId];
    });
  }

  async function refreshLocalAiStatus(
    config = save?.config,
    key = gatewayApiKey,
  ): Promise<LocalAiClientStatus> {
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
    if (save === null) {
      return;
    }

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
  ): Promise<LocalAiClientStatus> {
    return refreshLocalAiStatus(nextConfig, nextGatewayApiKey);
  }

  async function handleStartDate() {
    if (save === null || selectedMembers.length !== 2 || selectedScenario === undefined) {
      return;
    }

    tryAction("startDate", async () => {
      if (!save.config.aiSetupComplete) {
        setIsAiSetupOpen(true);
        throw new Error("AI setup is required before Cupid books a date.");
      }

      const status = await refreshLocalAiStatus();

      if (status.status !== "ready") {
        throw new Error(status.message);
      }

      const result = startDateSession(save, {
        focusMemberId: selectedMembers[0].id,
        firstMemberId: selectedMembers[0].id,
        secondMemberId: selectedMembers[1].id,
        scenarioId: selectedScenario.id,
      });
      await persist(result.save);
      setActiveDateSessionId(result.session.id);
      setInterventionText("");
      setInterventionTargetMemberId("");
      setView("date");
    });
  }

  async function handleAdvanceExchange(turnCount: 1 | 2) {
    if (save === null || activeSession === null) {
      return;
    }

    const sessionId = activeSession.id;

    tryAction(
      "advanceExchange",
      async () => {
        setStreamingDrafts([]);
        stopAfterCurrentTurnRef.current = false;
        const controller = new AbortController();
        dateAbortControllerRef.current = controller;
        try {
          const result = await runDateAction(
            {
              type: "advanceExchange",
              save,
              dateSessionId: sessionId,
              turnCount,
              shouldStopAfterCurrentTurn: () => stopAfterCurrentTurnRef.current,
            },
            repository,
            gatewayApiKey,
            applyGameStreamEvent,
            controller.signal,
          );
          await persist(result.save);
          setActiveDateSessionId(result.session.id);
          setRuntimeWarnings(result);
        } finally {
          dateAbortControllerRef.current = null;
          stopAfterCurrentTurnRef.current = false;
          setStreamingDrafts([]);
        }
      },
      { kind: "advanceExchange", turnCount },
    );
  }

  function handleCancelDate() {
    const controller = dateAbortControllerRef.current;

    if (controller === null) {
      return;
    }

    controller.abort();
  }

  function handleRetryDateAction() {
    if (pendingDateRetry === null) {
      return;
    }

    setPendingDateRetry(null);
    setErrorMessage(null);
    void handleAdvanceExchange(pendingDateRetry.turnCount);
  }

  function handleDismissDateError() {
    setPendingDateRetry(null);
    setErrorMessage(null);
  }

  async function handleIntervention() {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction("intervention", async () => {
      const result = addCupidIntervention(save, {
        dateSessionId: activeSession.id,
        targetMemberId: effectiveInterventionTargetMemberId,
        text: interventionText,
      });
      await persist(result.save);
      setInterventionText("");
    });
  }

  async function handlePickEvents(eventIds: string[]) {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction("pickEvents", async () => {
      const result = pickScenarioEvents(save, {
        dateSessionId: activeSession.id,
        pickedEventIds: eventIds,
      });
      await persist(result.save);
    });
  }

  async function handleTriggerEvent(eventId: string) {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction("triggerEvent", async () => {
      const result = triggerScenarioEvent(save, {
        dateSessionId: activeSession.id,
        eventId,
      });
      await persist(result.save);
    });
  }

  async function handleTogglePlayback(next: "playing" | "paused") {
    if (save === null || activeSession === null) {
      return;
    }

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

  const advanceRef = useRef(handleAdvanceExchange);
  const toggleRef = useRef(handleTogglePlayback);
  useLayoutEffect(() => {
    advanceRef.current = handleAdvanceExchange;
    toggleRef.current = handleTogglePlayback;
  });

  useEffect(() => {
    if (queuedPlaybackIntent === null) {
      return;
    }

    if (isActionPending) {
      return;
    }

    if (activeSession?.status !== "active" || activeSession.playbackState === "ended") {
      setQueuedPlaybackIntent(null);
      return;
    }

    const next = queuedPlaybackIntent;
    setQueuedPlaybackIntent(null);
    void toggleRef.current(next);
  }, [activeSession?.playbackState, activeSession?.status, isActionPending, queuedPlaybackIntent]);

  const autoplayShouldTick =
    activeSession !== null &&
    activeSession.status === "active" &&
    activeSession.playbackState === "playing" &&
    !isActionPending &&
    errorMessage === null &&
    pendingDateRetry === null &&
    queuedPlaybackIntent === null;
  const autoplayTickKey = activeSession?.currentTurn ?? -1;
  useEffect(() => {
    if (!autoplayShouldTick) {
      return;
    }

    const timer = window.setTimeout(() => {
      void advanceRef.current(2);
    }, AUTOPLAY_TICK_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [autoplayShouldTick, autoplayTickKey]);

  async function handleFollowUp(action: FollowUpAction) {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction("followUp", async () => {
      const result = applyFollowUpAction(save, {
        dateSessionId: activeSession.id,
        action,
      });
      await persist(result.save);
    });
  }

  async function handleEndShift() {
    if (save === null) {
      return;
    }

    tryAction("endShift", async () => {
      const result = completeShift(save);
      await persist(result.save);
    });
  }

  function fileDeckPower(
    apply: (current: GameSave, input: { scenarioId: string }) => ScenarioPowerResult,
    nextSelection: (result: ScenarioPowerResult) => string | undefined,
  ) {
    return (scenarioId: string) => {
      if (save === null) {
        return;
      }

      tryAction("deckPower", async () => {
        const result = apply(save, { scenarioId });
        await persist(result.save);
        const next = nextSelection(result);

        if (next !== undefined) {
          setSelectedScenarioId(next);
        }
      });
    };
  }

  const handleHoldScenario = fileDeckPower(
    holdScenarioForTomorrow,
    (result) => result.shift.drawnScenarioIds[0],
  );
  const handleDiscardScenario = fileDeckPower(
    discardDrawnScenario,
    (result) => result.shift.drawnScenarioIds[0],
  );
  const handleRequestLowPressureScenario = fileDeckPower(
    requestLowPressureScenario,
    (result) => result.shift.deckPower?.swappedScenarioId,
  );

  async function handleReset() {
    tryAction("reset", async () => {
      await tryBackupSave(repository);
      const nextSave = await repository.resetGame();
      setSave(nextSave);
      setSelectedMemberIds(defaultMemberSelection(nextSave));
      setSelectedScenarioId(getActiveShift(nextSave).drawnScenarioIds[0] ?? "");
      setActiveDateSessionId(null);
      setInterventionText("");
      setInterventionTargetMemberId("");
      setStreamingDrafts([]);
      setView("roster");
    });
  }

  function handleExportSave() {
    if (save === null) {
      return;
    }

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
      await repository.saveGame(validated.data);
      const nextSave = (await repository.loadGame()) ?? validated.data;

      setSave(nextSave);
      setSelectedMemberIds(defaultMemberSelection(nextSave));
      setSelectedScenarioId(getActiveShift(nextSave).drawnScenarioIds[0] ?? "");
      const restoredSession =
        nextSave.dateSessions.find((session) => session.status === "active") ??
        nextSave.dateSessions.at(-1) ??
        null;
      setActiveDateSessionId(restoredSession?.id ?? null);
      setInterventionText("");
      setInterventionTargetMemberId("");
      setStreamingDrafts([]);
      setView(restoredSession !== null && restoredSession.status === "active" ? "date" : "roster");
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

  async function handleOpenNextShift() {
    if (save === null) {
      return;
    }

    tryAction("nextShift", async () => {
      const result = startNextShift(save);
      await persist(result.save);
      setSelectedMemberIds(defaultMemberSelection(result.save));
      setSelectedScenarioId(result.shift.drawnScenarioIds[0] ?? "");
      setActiveDateSessionId(null);
      setInterventionText("");
      setInterventionTargetMemberId("");
      setStreamingDrafts([]);
      setView("roster");
    });
  }

  function applyGameStreamEvent(event: LocalAiDateStreamEvent) {
    if (event.type === "characterStart") {
      play("message");
      setStreamingDrafts((current) => {
        const existingDraft = current.find((draft) => draft.sequenceIndex === event.sequenceIndex);

        if (existingDraft !== undefined) {
          return current;
        }

        return [
          ...current,
          {
            id: `stream-${event.sequenceIndex}`,
            speakerId: event.speakerId,
            speakerName: event.speakerName,
            sequenceIndex: event.sequenceIndex,
            turnIndex: event.turnIndex,
            text: "",
            reasoningText: "",
            status: "streaming",
          },
        ];
      });
      return;
    }

    if (event.type === "characterDelta") {
      setStreamingDrafts((current) =>
        current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? {
                ...draft,
                text: `${draft.text}${event.textDelta}`,
              }
            : draft,
        ),
      );
      return;
    }

    if (event.type === "characterReasoningDelta") {
      setStreamingDrafts((current) =>
        current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? {
                ...draft,
                reasoningText: `${draft.reasoningText}${event.textDelta}`,
              }
            : draft,
        ),
      );
      return;
    }

    if (event.type === "characterDone") {
      setStreamingDrafts((current) =>
        current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? {
                ...draft,
                text: event.text,
                status: "done",
              }
            : draft,
        ),
      );
    }
  }

  function setRuntimeWarnings(result: LocalAiDateEngineResult) {
    if (result.warningMessages.length === 0) {
      return;
    }

    setErrorMessage(result.warningMessages.slice(0, 3).join(" "));
  }

  async function tryAction(
    pending: DashboardPendingAction,
    action: () => Promise<void>,
    retryOnFailure?: RetriableDateAction,
  ) {
    if (pendingAction !== null) {
      return;
    }

    try {
      setPendingAction(pending);
      setErrorMessage(null);
      setPendingDateRetry(null);
      await action();
    } catch (error) {
      if (error instanceof DateStreamAbortedError) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "Cupid could not file that action.");

      if (retryOnFailure !== undefined) {
        setPendingDateRetry(retryOnFailure);
      }
    } finally {
      setPendingAction(null);
    }
  }

  if (save === null || activeShift === null) {
    return <DashboardLoading />;
  }

  const dateSlotsRemaining = Math.max(0, activeShift.dateSlotsTotal - activeShift.dateSlotsUsed);
  const selectedMembersRetained =
    selectedMembers.length === 2 && selectedMembers.every(isMemberRetained);
  const canStartDate =
    !campaignLost &&
    activeShift.status === "active" &&
    !isActionPending &&
    dateSlotsRemaining > 0 &&
    (activeSession === null || activeSession.status !== "active") &&
    selectedMembers.length === 2 &&
    selectedMembersRetained &&
    selectedScenario !== undefined &&
    save.config.aiSetupComplete &&
    localAiStatus.status === "ready";
  const canAdvanceDate =
    !campaignLost &&
    activeSession !== null &&
    activeSession.status === "active" &&
    !isActionPending;
  const effectiveInterventionTargetMemberId = resolveInterventionTarget(
    activeSession,
    interventionTargetMemberId,
  );
  const canIntervene =
    canAdvanceDate &&
    activeSession !== null &&
    canAddCupidIntervention(activeSession) &&
    effectiveInterventionTargetMemberId !== "" &&
    interventionText.trim().length > 0;
  const dateStatus = activeSession?.status ?? null;
  const pendingDateAction = asPendingDateAction(pendingAction);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-aura-bg text-aura-ink">
      <AmbientMesh />

      <DashboardChrome
        activeShift={activeShift}
        featuredMemberCount={featuredMembers.length}
        noteCount={publicNoteCount}
        localAiStatus={localAiStatus}
        diagnostics={diagnosticsSnapshot}
        canExportSave={save !== null}
        view={view}
        dateStatus={dateStatus}
        isActionPending={isActionPending}
        onSelectView={setView}
        onRetryLocalAi={refreshLocalAiStatus}
        onOpenAiSetup={() => setIsAiSetupOpen(true)}
        onEndShift={handleEndShift}
        onReset={handleReset}
        onExportSave={handleExportSave}
        onImportSave={handleImportSave}
        onCopyDiagnostics={handleCopyDiagnostics}
        onPunchOut={onPunchOut}
      />

      <main className="relative z-10 pt-24 lg:pt-28">
        {errorMessage === null ? null : (
          <ErrorNotice
            message={errorMessage}
            retryLabel={pendingDateRetry === null ? null : retryLabelFor(pendingDateRetry)}
            isActionPending={isActionPending}
            onRetry={pendingDateRetry === null ? null : handleRetryDateAction}
            onDismiss={
              pendingDateRetry === null ? () => setErrorMessage(null) : handleDismissDateError
            }
          />
        )}

        {!save.config.aiSetupComplete || isAiSetupOpen ? (
          <AiSetupPanel
            config={save.config}
            gatewayApiKey={gatewayApiKey}
            status={localAiStatus}
            required={!save.config.aiSetupComplete}
            isActionPending={isActionPending}
            onSave={handleSaveAiConfig}
            onCheck={handleCheckAiConfig}
            onClose={() => setIsAiSetupOpen(false)}
          />
        ) : null}

        <AnimatePresence mode="wait">
          {view === "roster" ? (
            <RosterView
              key="roster"
              members={save.members}
              featuredMembers={featuredMembers}
              featuredRequests={pinnedRequests}
              playerKnowledge={save.playerKnowledge}
              selectedMemberIds={selectedMemberIds}
              disabled={isActionPending}
              onSelectFocusMember={selectFocusMember}
              onSelectPartnerMember={selectPartnerMember}
              onContinue={() => setView("brief")}
            />
          ) : view === "brief" ? (
            <BriefView
              key="brief"
              shift={activeShift}
              selectedMembers={selectedMembers}
              scenarios={drawnScenarios}
              selectedScenario={selectedScenario}
              playerKnowledge={save.playerKnowledge}
              pairState={pairPreview?.pairState ?? null}
              pairNote={pairPreview?.note ?? null}
              previousFile={pairPreview?.previousFile ?? null}
              goals={pinnedGoals}
              goalProgress={pinnedGoalProgress}
              requests={pinnedRequests}
              members={save.members}
              canStart={canStartDate}
              localAiStatus={localAiStatus}
              isActionPending={isActionPending}
              deckPowerAvailability={deckPowerAvailability}
              carriedHeldScenario={carriedHeldScenario}
              onSelectScenario={setSelectedScenarioId}
              onStart={handleStartDate}
              onRetryLocalAi={refreshLocalAiStatus}
              onBack={() => setView("roster")}
              onHoldScenario={handleHoldScenario}
              onDiscardScenario={handleDiscardScenario}
              onRequestLowPressure={handleRequestLowPressureScenario}
            />
          ) : view === "notes" ? (
            <NotesView
              key="notes"
              memories={save.memories}
              members={save.members}
              pairStates={save.pairStates}
              scenarios={starterScenarios}
              shiftCount={activeShift.shiftNumber}
            />
          ) : activeSession !== null ? (
            <DateView
              key="date"
              session={activeSession}
              scenario={
                drawnScenarios.find((scenario) => scenario.id === activeSession.scenarioId) ??
                starterScenarios.find((scenario) => scenario.id === activeSession.scenarioId)
              }
              members={save.members}
              playerKnowledge={save.playerKnowledge}
              interventionText={interventionText}
              interventionTargetMemberId={effectiveInterventionTargetMemberId}
              canAdvance={canAdvanceDate}
              canIntervene={canIntervene}
              isActionPending={isActionPending}
              pendingDateAction={pendingDateAction}
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
              onBack={() => setView("brief")}
            />
          ) : (
            <DateEmpty key="date-empty" onBack={() => setView("brief")} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeShift.status === "completed" && activeShift.report !== undefined ? (
            <ShiftReportPanel
              key="shift-report"
              shift={activeShift}
              members={save.members}
              isActionPending={isActionPending}
              onOpenNextShift={handleOpenNextShift}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {campaignLost ? (
            <TerminationPanel
              key="termination-panel"
              lostMembers={quitMembers}
              isActionPending={isActionPending}
              onReset={handleReset}
              onPunchOut={onPunchOut}
            />
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

function resolveInterventionTarget(session: DateSession | null, override: string): string {
  if (session === null) {
    return "";
  }

  if (session.participants.includes(override)) {
    return override;
  }

  return (
    session.participants[session.currentTurn % session.participants.length] ??
    session.participants[0] ??
    ""
  );
}

/* ================================================================== */
/* Chrome                                                             */
/* ================================================================== */

function DashboardChrome({
  activeShift,
  featuredMemberCount,
  noteCount,
  localAiStatus,
  diagnostics,
  canExportSave,
  view,
  dateStatus,
  isActionPending,
  onSelectView,
  onRetryLocalAi,
  onOpenAiSetup,
  onEndShift,
  onReset,
  onExportSave,
  onImportSave,
  onCopyDiagnostics,
  onPunchOut,
}: {
  activeShift: ShiftState;
  featuredMemberCount: number;
  noteCount: number;
  localAiStatus: LocalAiClientStatus;
  diagnostics: DiagnosticsSnapshot;
  canExportSave: boolean;
  view: ViewKey;
  dateStatus: DateSessionStatus | null;
  isActionPending: boolean;
  onSelectView: (view: ViewKey) => void;
  onRetryLocalAi: () => void;
  onOpenAiSetup: () => void;
  onEndShift: () => void;
  onReset: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  onCopyDiagnostics: () => Promise<boolean>;
  onPunchOut: () => void;
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="flex w-full items-center justify-between gap-2 px-4 pt-4 lg:px-6 lg:pt-5 xl:gap-3 xl:px-8 xl:pt-6">
        <BrandPill
          shiftNumber={activeShift.shiftNumber}
          localAiStatus={localAiStatus}
          isActionPending={isActionPending}
          onRetryLocalAi={onRetryLocalAi}
        />

        <ViewTabs
          view={view}
          memberCount={featuredMemberCount}
          noteCount={noteCount}
          dateStatus={dateStatus}
          onSelect={onSelectView}
        />

        <ChromeActions
          shiftActive={activeShift.status === "active"}
          isActionPending={isActionPending}
          diagnostics={diagnostics}
          canExportSave={canExportSave}
          onEndShift={onEndShift}
          onOpenAiSetup={onOpenAiSetup}
          onReset={onReset}
          onExportSave={onExportSave}
          onImportSave={onImportSave}
          onCopyDiagnostics={onCopyDiagnostics}
          onPunchOut={onPunchOut}
        />
      </div>
    </header>
  );
}

function BrandPill({
  shiftNumber,
  localAiStatus,
  isActionPending,
  onRetryLocalAi,
}: {
  shiftNumber: number;
  localAiStatus: LocalAiClientStatus;
  isActionPending: boolean;
  onRetryLocalAi: () => void;
}) {
  const tone =
    localAiStatus.status === "ready"
      ? "emerald"
      : localAiStatus.status === "checking"
        ? "amber"
        : "rose";
  const aiLabel =
    localAiStatus.status === "ready"
      ? "AI provider online. Click to recheck."
      : localAiStatus.status === "checking"
        ? "AI provider checking. Hold tight."
        : "AI provider offline. Click to recheck.";
  const aiDisabled = isActionPending || localAiStatus.status === "checking";

  return (
    <div className="aura-glass pointer-events-auto flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 lg:gap-2.5 lg:px-5">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
        Cupid
      </span>
      <span className="hidden font-display text-base font-semibold tracking-tight text-aura-ink lg:inline">
        Operations
      </span>
      <span aria-hidden className="hidden h-3 w-px bg-aura-hairline lg:inline-block" />
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        shift.{pad2(shiftNumber)}
      </span>
      <span aria-hidden className="h-3 w-px bg-aura-hairline" />
      <button
        type="button"
        data-sfx="click"
        disabled={aiDisabled}
        onClick={onRetryLocalAi}
        title={localAiStatus.message}
        aria-label={aiLabel}
        className="-mx-1 inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition hover:bg-white/55 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LiveDot tone={tone} />
      </button>
    </div>
  );
}

function ViewTabs({
  view,
  memberCount,
  noteCount,
  dateStatus,
  onSelect,
}: {
  view: ViewKey;
  memberCount: number;
  noteCount: number;
  dateStatus: DateSessionStatus | null;
  onSelect: (view: ViewKey) => void;
}) {
  const dateTag = dateStatus === null ? "no booking" : DATE_TAG_LABELS[dateStatus];
  const tabs: Array<{ key: ViewKey; label: string; tag: string; live?: boolean }> = [
    { key: "roster", label: "Roster", tag: `${memberCount} cases` },
    { key: "brief", label: "Brief", tag: "staff the date" },
    {
      key: "date",
      label: "Date",
      tag: dateTag,
      live: dateStatus === "active",
    },
    {
      key: "notes",
      label: "Notes",
      tag: noteCount === 0 ? "case archive" : `${noteCount} on file`,
    },
  ];

  return (
    <nav className="aura-glass pointer-events-auto relative inline-flex items-center gap-0.5 rounded-pill p-1.5">
      {tabs.map((tab) => {
        const isActive = view === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className="relative cursor-pointer rounded-pill px-3 py-2 transition lg:px-4"
          >
            {isActive ? (
              <motion.span
                layoutId="dashboard-active-tab"
                aria-hidden
                className="absolute inset-0 -z-0 rounded-pill aura-glass-ink"
                transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
              />
            ) : null}
            <span
              className={`relative z-10 flex items-baseline gap-2 whitespace-nowrap ${isActive ? "text-white" : "text-aura-muted hover:text-aura-ink"}`}
            >
              <span className="font-display text-base font-semibold tracking-tight">
                {tab.label}
              </span>
              <span
                className={`hidden items-center gap-1 font-mono text-micro uppercase leading-none tracking-[0.22em] xl:inline-flex ${isActive ? "text-white/70" : "text-aura-faint"}`}
              >
                {tab.live ? <LiveDot tone="rose" /> : null}
                <span>{tab.tag}</span>
              </span>
              {tab.live ? (
                <span className="inline-flex xl:hidden" aria-hidden>
                  <LiveDot tone="rose" />
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function ChromeActions({
  shiftActive,
  isActionPending,
  diagnostics,
  canExportSave,
  onEndShift,
  onOpenAiSetup,
  onReset,
  onExportSave,
  onImportSave,
  onCopyDiagnostics,
  onPunchOut,
}: {
  shiftActive: boolean;
  isActionPending: boolean;
  diagnostics: DiagnosticsSnapshot;
  canExportSave: boolean;
  onEndShift: () => void;
  onOpenAiSetup: () => void;
  onReset: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  onCopyDiagnostics: () => Promise<boolean>;
  onPunchOut: () => void;
}) {
  return (
    <div className="aura-glass pointer-events-auto inline-flex items-center gap-0.5 rounded-pill p-1">
      {shiftActive ? (
        <ChromeButton onClick={onEndShift} disabled={isActionPending}>
          End shift
        </ChromeButton>
      ) : null}
      <MutedIndicator />
      <SettingsMenu
        isActionPending={isActionPending}
        diagnostics={diagnostics}
        canExportSave={canExportSave}
        onOpenAiSetup={onOpenAiSetup}
        onReset={onReset}
        onExportSave={onExportSave}
        onImportSave={onImportSave}
        onCopyDiagnostics={onCopyDiagnostics}
        onPunchOut={onPunchOut}
      />
    </div>
  );
}

function MutedIndicator() {
  const { isEnabled, setEnabled } = useSfx();

  if (isEnabled) {
    return null;
  }

  return (
    <button
      type="button"
      data-sfx="toggle"
      aria-label="Audio is muted. Click to unmute."
      title="Audio muted. Click to unmute."
      onClick={() => setEnabled(true)}
      className="flex cursor-pointer items-center justify-center rounded-pill px-2.5 py-1.5 text-aura-rose transition hover:bg-aura-rose/10 hover:text-aura-rose"
    >
      <MutedIcon />
    </button>
  );
}

function MutedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

function SettingsMenu({
  isActionPending,
  diagnostics,
  canExportSave,
  onOpenAiSetup,
  onReset,
  onExportSave,
  onImportSave,
  onCopyDiagnostics,
  onPunchOut,
}: {
  isActionPending: boolean;
  diagnostics: DiagnosticsSnapshot;
  canExportSave: boolean;
  onOpenAiSetup: () => void;
  onReset: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  onCopyDiagnostics: () => Promise<boolean>;
  onPunchOut: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isShowingDiagnostics, setIsShowingDiagnostics] = useState(false);
  const [diagnosticsCopied, setDiagnosticsCopied] = useState(false);
  const { isEnabled: sfxEnabled, setEnabled: setSfxEnabled, volume, setVolume, play } = useSfx();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      return;
    }
    setIsConfirmingReset(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current === null) {
        return;
      }
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  function handleAskReset() {
    setIsConfirmingReset(true);
  }

  function handleCancelReset() {
    setIsConfirmingReset(false);
  }

  function handleConfirmReset() {
    setIsOpen(false);
    setIsConfirmingReset(false);
    onReset();
  }

  function handlePunchOut() {
    setIsOpen(false);
    onPunchOut();
  }

  function handleOpenAiSetup() {
    setIsOpen(false);
    onOpenAiSetup();
  }

  function handleExportSaveClick() {
    setIsOpen(false);
    onExportSave();
  }

  function handleImportSaveClick() {
    importInputRef.current?.click();
  }

  function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file === undefined) {
      return;
    }

    setIsOpen(false);
    onImportSave(file);
  }

  async function handleCopyDiagnosticsClick() {
    const copied = await onCopyDiagnostics();

    if (!copied) {
      return;
    }

    setDiagnosticsCopied(true);
    window.setTimeout(() => setDiagnosticsCopied(false), 1500);
  }

  function handleToggleSfx() {
    setSfxEnabled(!sfxEnabled);
  }

  function handleVolumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value) / 100;
    setVolume(next);

    if (next > 0 && !sfxEnabled) {
      setSfxEnabled(true);
    }
  }

  function handleVolumeRelease() {
    if (sfxEnabled && volume > 0) {
      play("click");
    }
  }

  const volumePercent = Math.round(volume * 100);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        data-sfx="menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Settings"
        title="Settings"
        onClick={() => setIsOpen((open) => !open)}
        className="flex cursor-pointer items-center justify-center rounded-pill px-2.5 py-1.5 text-aura-muted transition hover:bg-white/55 hover:text-aura-ink aria-expanded:bg-white/55 aria-expanded:text-aura-ink"
      >
        <SettingsIcon />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="settings-menu"
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="aura-glass-strong absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-card p-1.5"
          >
            <div className="px-3 pb-2 pt-2.5">
              <div className="flex items-center justify-between font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                <span>Volume</span>
                <span className="tabular-nums text-aura-ink">{volumePercent}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volumePercent}
                onChange={handleVolumeChange}
                onPointerUp={handleVolumeRelease}
                onKeyUp={handleVolumeRelease}
                aria-label="Volume"
                data-sfx="none"
                className={`mt-2 block h-1 w-full cursor-pointer appearance-none rounded-pill bg-aura-hairline-strong accent-aura-rose transition-opacity ${
                  sfxEnabled ? "opacity-100" : "opacity-50"
                }`}
              />
            </div>
            <div className="mx-2 h-px bg-aura-hairline" />
            {isConfirmingReset ? (
              <ResetConfirm
                disabled={isActionPending}
                onCancel={handleCancelReset}
                onConfirm={handleConfirmReset}
              />
            ) : (
              <>
                <MenuButton onClick={handleOpenAiSetup} disabled={isActionPending}>
                  AI setup
                </MenuButton>
                <MenuButton
                  role="menuitemcheckbox"
                  ariaChecked={sfxEnabled}
                  sfx="toggle"
                  onClick={handleToggleSfx}
                >
                  {sfxEnabled ? "Mute" : "Unmute"}
                </MenuButton>
                {isTauriRuntime() ? (
                  <>
                    <MenuButton
                      onClick={() => {
                        void openTauriSaveFolder();
                      }}
                    >
                      Show save folder
                    </MenuButton>
                    <MenuButton
                      onClick={() => {
                        void openTauriLogFolder();
                      }}
                    >
                      Show log folder
                    </MenuButton>
                  </>
                ) : null}
                <MenuButton
                  onClick={handleExportSaveClick}
                  disabled={isActionPending || !canExportSave}
                >
                  Export save (JSON)
                </MenuButton>
                <MenuButton onClick={handleImportSaveClick} disabled={isActionPending}>
                  Import save (JSON)
                </MenuButton>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportFileChange}
                  className="hidden"
                  aria-hidden
                />
                <div className="mx-2 my-1 h-px bg-aura-hairline" />
                <DiagnosticsBlock
                  diagnostics={diagnostics}
                  isExpanded={isShowingDiagnostics}
                  isCopied={diagnosticsCopied}
                  onToggle={() => setIsShowingDiagnostics((open) => !open)}
                  onCopy={handleCopyDiagnosticsClick}
                />
                <div className="mx-2 my-1 h-px bg-aura-hairline" />
                <MenuButton onClick={handlePunchOut} disabled={isActionPending}>
                  Punch out
                </MenuButton>
                <MenuButton tone="danger" onClick={handleAskReset} disabled={isActionPending}>
                  Reset save
                </MenuButton>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H7a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function DiagnosticsBlock({
  diagnostics,
  isExpanded,
  isCopied,
  onToggle,
  onCopy,
}: {
  diagnostics: DiagnosticsSnapshot;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const checkedAt = diagnostics.lastAiCheck.checkedAt;
  const checkedAtLabel = checkedAt === null ? "never" : new Date(checkedAt).toLocaleString();

  return (
    <div className="px-1 py-1.5">
      <button
        type="button"
        role="menuitem"
        data-sfx="menu"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-chip px-2 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
      >
        <span>Diagnostics</span>
        <span className="text-aura-faint">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded ? (
        <div className="mt-1 rounded-chip border border-aura-hairline bg-white/55 p-2.5">
          <dl className="space-y-1 font-mono text-micro uppercase tracking-[0.16em] text-aura-muted">
            <DiagnosticsRow label="build" value={diagnostics.appVersion} />
            <DiagnosticsRow label="save" value={`v${diagnostics.saveSchema}`} />
            <DiagnosticsRow label="runtime" value={diagnostics.runtime} />
            <DiagnosticsRow label="provider" value={diagnostics.provider} />
            <DiagnosticsRow label="chat" value={diagnostics.chatModel} />
            <DiagnosticsRow label="embed" value={diagnostics.embeddingModel} />
            <DiagnosticsRow label="reasoning" value={diagnostics.reasoningLevel} />
            <DiagnosticsRow label="ai status" value={diagnostics.lastAiCheck.status} />
            <DiagnosticsRow label="checked" value={checkedAtLabel} />
          </dl>
          <p
            className="mt-2 truncate font-mono text-micro lowercase tracking-[0.04em] text-aura-faint"
            title={diagnostics.os}
          >
            os :: <span className="text-aura-ink">{diagnostics.os}</span>
          </p>
          <button
            type="button"
            data-sfx="menu"
            onClick={onCopy}
            className="mt-2 block w-full cursor-pointer rounded-chip bg-aura-ink px-3 py-1.5 text-center font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-aura-rose"
          >
            {isCopied ? "Copied" : "Copy diagnostic blob"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DiagnosticsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-2">
      <dt className="text-aura-faint">{label}</dt>
      <dd className="min-w-0 truncate text-aura-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

function ResetConfirm({
  disabled,
  onCancel,
  onConfirm,
}: {
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
        Reset save? This is permanent.
      </p>
      <p className="mt-1 text-label leading-snug text-aura-muted">
        Cupid keeps a .bak.* copy of the current save before resetting.
      </p>
      <div className="mt-2.5 flex items-center justify-end gap-1">
        <button
          type="button"
          role="menuitem"
          data-sfx="dismiss"
          disabled={disabled}
          onClick={onCancel}
          className="cursor-pointer rounded-chip px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          role="menuitem"
          data-sfx="danger"
          disabled={disabled}
          onClick={onConfirm}
          className="cursor-pointer rounded-chip bg-aura-rose px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-aura-fuchsia disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Mesh + ambient                                                     */
/* ================================================================== */

function AmbientMesh() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full bg-aura-mesh-rose/55 blur-[140px] aura-blob-1" />
      <div className="absolute top-10 -right-32 h-[560px] w-[560px] rounded-full bg-aura-mesh-violet/55 blur-[140px] aura-blob-2" />
      <div className="absolute -bottom-40 left-1/3 h-[700px] w-[700px] rounded-full bg-aura-mesh-amber/45 blur-[140px] aura-blob-3" />
      <div className="absolute bottom-20 -right-20 h-[520px] w-[520px] rounded-full bg-aura-mesh-sky/45 blur-[140px] aura-blob-4" />
    </div>
  );
}

/* ================================================================== */
/* Empty / error                                                      */
/* ================================================================== */

function DateEmpty({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-6 text-center">
      <div className="space-y-5">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          // date.idle
        </p>
        <h1 className="font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          No active date.
        </h1>
        <p className="text-lead text-aura-muted">
          The transcript fills in once you book a table. Cupid does not record silence.
        </p>
        <GhostButton onClick={onBack}>← Brief</GhostButton>
      </div>
    </div>
  );
}

function ErrorNotice({
  message,
  retryLabel,
  isActionPending,
  onRetry,
  onDismiss,
}: {
  message: string;
  retryLabel: string | null;
  isActionPending: boolean;
  onRetry: (() => void) | null;
  onDismiss: () => void;
}) {
  return (
    <div className="aura-glass-rose relative z-10 mx-auto mt-2 flex w-full max-w-4xl items-start justify-between gap-4 rounded-card px-5 py-4 text-aura-rose lg:max-w-5xl">
      <p className="text-label leading-relaxed">{message}</p>
      <div className="flex shrink-0 items-center gap-3">
        {onRetry === null || retryLabel === null ? null : (
          <button
            type="button"
            data-sfx="primary"
            disabled={isActionPending}
            onClick={onRetry}
            className="cursor-pointer rounded-pill bg-aura-rose px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-aura-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retryLabel}
          </button>
        )}
        <button
          type="button"
          data-sfx="dismiss"
          onClick={onDismiss}
          className="cursor-pointer font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/80 hover:text-aura-rose"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function retryLabelFor(retry: RetriableDateAction): string {
  return retry.turnCount === 1 ? "Retry one line" : "Retry exchange";
}

function TerminationPanel({
  lostMembers,
  isActionPending,
  onReset,
  onPunchOut,
}: {
  lostMembers: Member[];
  isActionPending: boolean;
  onReset: () => void;
  onPunchOut: () => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-aura-bg/70 px-6 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
        className="aura-glass-strong relative w-full max-w-2xl overflow-hidden rounded-card p-10"
      >
        <div className="pointer-events-none absolute -right-8 -top-12 font-display text-[13rem] font-semibold leading-none text-aura-rose/10">
          X
        </div>
        <div className="relative">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // employment.review
          </p>
          <h2 className="mt-3 font-display text-display-lg font-semibold tracking-tight text-aura-ink">
            Cupid terminated your shift.
          </h2>
          <p className="mt-3 max-w-xl text-lead leading-snug text-aura-muted">
            {lostMembers.length} client files closed after members quit the app. The firing
            threshold is {CLIENT_LOSS_LIMIT}. HR has completed the romance math.
          </p>
          <ul className="mt-7 grid gap-2 sm:grid-cols-2">
            {lostMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-pill bg-white/65 px-4 py-2 ring-1 ring-aura-hairline"
              >
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                  {member.firstName}
                </span>
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  quit app
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryButton disabled={isActionPending} onClick={onReset}>
              Reset save
            </PrimaryButton>
            <GhostButton disabled={isActionPending} onClick={onPunchOut}>
              Punch out
            </GhostButton>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}

/* ================================================================== */
/* Date action runner                                                 */
/* ================================================================== */

type LocalDateAction = {
  type: "advanceExchange";
  save: GameSave;
  dateSessionId: string;
  turnCount?: 1 | 2;
  shouldStopAfterCurrentTurn?: () => boolean;
};

async function runDateAction(
  input: LocalDateAction,
  repository: ReturnType<typeof createGameRepository>,
  gatewayApiKey: string,
  onEvent: (event: LocalAiDateStreamEvent) => void,
  abortSignal: AbortSignal,
): Promise<LocalAiDateEngineResult> {
  const config: Partial<AiRuntimeConfig> = { ...input.save.config, gatewayApiKey };

  return advanceDateExchangeWithLocalAiStream(
    input.save,
    repository,
    {
      dateSessionId: input.dateSessionId,
      turnCount: input.turnCount,
      config,
      shouldStopAfterCurrentTurn: input.shouldStopAfterCurrentTurn,
      abortSignal,
    },
    onEvent,
  );
}

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

type PairPreview = {
  pairState: PairState | null;
  note: string;
  previousFile: PreviousFile | null;
};

function buildPairPreview(
  save: GameSave | null,
  members: Member[],
  selectedScenario: DateScenario | undefined,
): PairPreview | null {
  if (save === null || members.length !== 2) {
    return null;
  }

  const pairId = makePairId(members[0].id, members[1].id);
  const pairState = save.pairStates.find((candidate) => candidate.id === pairId) ?? null;
  const note = "Pair selected. Forecast sealed until the date gives Cupid evidence.";
  const scenarioRepeatCount =
    pairState === null || selectedScenario === undefined
      ? 0
      : (pairState.scenarioUseCounts[selectedScenario.id] ?? 0);
  const previousFile = buildPreviousFile(pairState, members, scenarioRepeatCount);
  return { pairState, note, previousFile };
}

function buildPreviousFile(
  pairState: PairState | null,
  members: Member[],
  scenarioRepeatCount: number,
): PreviousFile | null {
  if (pairState === null) {
    return null;
  }
  const totalDates = pairState.completedDateIds.length;
  if (totalDates === 0) {
    return null;
  }
  const expectsCallbacks = members.some((member) =>
    member.voice.patternsUsed.includes("callback_rematch_reference"),
  );
  return { totalDates, scenarioRepeatCount, expectsCallbacks };
}

type DiagnosticsSnapshot = {
  appVersion: string;
  saveSchema: number;
  runtime: "tauri" | "browser";
  os: string;
  provider: string;
  chatModel: string;
  embeddingModel: string;
  reasoningLevel: string;
  lastAiCheck: {
    status: AiSetupStatus["status"];
    message: string;
    checkedAt: string | null;
  };
};

function buildDiagnosticsSnapshot(input: {
  config: GameConfig | null;
  localAiStatus: AiSetupStatus;
}): DiagnosticsSnapshot {
  const userAgent = typeof navigator === "undefined" ? "unknown" : navigator.userAgent;

  return {
    appVersion: APP_VERSION,
    saveSchema: SAVE_SCHEMA_VERSION,
    runtime: isTauriRuntime() ? "tauri" : "browser",
    os: userAgent,
    provider: input.config?.aiProvider ?? "unconfigured",
    chatModel: input.config?.chatModel ?? "unconfigured",
    embeddingModel: input.config?.embeddingModel ?? "unconfigured",
    reasoningLevel: input.config?.reasoningLevel ?? "off",
    lastAiCheck: {
      status: input.localAiStatus.status,
      message: input.localAiStatus.message,
      checkedAt: input.localAiStatus.checkedAt ?? null,
    },
  };
}

function defaultMemberSelection(save: GameSave): string[] {
  const activeShift = getActiveShift(save);
  const focusMemberId = activeShift.featuredMemberIds.find((memberId) =>
    save.members.some((member) => member.id === memberId && isMemberRetained(member)),
  );

  if (focusMemberId !== undefined) {
    const partnerMember = save.members.find(
      (member) => member.id !== focusMemberId && isMemberRetained(member),
    );
    return [focusMemberId, partnerMember?.id].filter(isDefined);
  }

  return save.members
    .filter(isMemberRetained)
    .slice(0, 2)
    .map((member) => member.id);
}

function isDefined<TValue>(value: TValue | undefined): value is TValue {
  return value !== undefined;
}
