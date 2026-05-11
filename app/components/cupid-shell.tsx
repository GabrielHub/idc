import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type DateScenario,
  type FollowUpAction,
  type GameConfig,
  type GameSave,
} from "../domain/game";
import { memberRequests, starterScenarios } from "../fixtures";
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
import {
  addCupidIntervention,
  applyFollowUpAction,
  canAddCupidIntervention,
  completeShift,
  pickScenarioEvents,
  startDateSession,
  startNextShift,
  togglePlayback,
  triggerScenarioEvent,
} from "../services/date-engine";
import { pickLibraryCard as deckPickLibraryCard, swapCard as deckSwapCard } from "../services/deck";
import {
  addFocusCase as focusAddCase,
  getFocusedMembers,
  removeFocusCase as focusRemoveCase,
  selectInitialFocusCases as focusSelectInitial,
  syncActiveShiftFocusCases,
  swapFocusCase as focusSwapCase,
} from "../services/focus-cases";
import { getActiveShift } from "../services/game-seed";
import { errorToMessage } from "../services/utils";
import { AiSetupPanel, type AiSetupStatus } from "./ai-setup-panel";
import { CasebookCanvas } from "./casebook-canvas";
import { GhostButton } from "./dashboard-atoms";
import {
  DashboardLoading,
  DateView,
  NotesView,
  ShiftReportPanel,
  type PendingDateAction,
  type PlaybackIntent,
  type StreamingDraftMessage,
} from "./dashboard-views";
import { FloatingNavCluster, type RoomKey } from "./floating-nav-cluster";
import { GalleryCanvas } from "./gallery-canvas";
import { OfficeCanvas } from "./office-canvas";
import { OnboardingScreen } from "./onboarding-screen";
import { useSfx } from "./sfx-provider";

const AUTOPLAY_TICK_DELAY_MS = 480;
const CHECKING_LOCAL_AI_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Checking AI provider. Cupid is holding the clipboard very still.",
  details: [],
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
  | "reset";

export function CupidShell({ onPunchOut }: CupidShellProps) {
  const repository = useMemo(() => createGameRepository(), []);
  const { play } = useSfx();
  const [save, setSave] = useState<GameSave | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomKey>("office");
  const [activeDateSessionId, setActiveDateSessionId] = useState<string | null>(null);
  const [interventionText, setInterventionText] = useState("");
  const [interventionTargetMemberId, setInterventionTargetMemberId] = useState("");
  const [localAiStatus, setLocalAiStatus] = useState<AiSetupStatus>(CHECKING_LOCAL_AI_STATUS);
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [isGatewayApiKeyLoaded, setIsGatewayApiKeyLoaded] = useState(false);
  const [isAiSetupOpen, setIsAiSetupOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingDrafts, setStreamingDrafts] = useState<StreamingDraftMessage[]>([]);
  const [queuedPlaybackIntent, setQueuedPlaybackIntent] = useState<PlaybackIntent | null>(null);
  const localAiStatusRequestRef = useRef<Promise<AiSetupStatus> | null>(null);
  const dateAbortControllerRef = useRef<AbortController | null>(null);
  const stopAfterCurrentTurnRef = useRef(false);
  const lastErrorMessageRef = useRef<string | null>(null);
  const isActionPending = pendingAction !== null;

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
      const nextSave = existingSave ?? (await repository.resetGame());
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
        setCurrentRoom("stage");
      }
    }
    void loadSave();
    return () => {
      mounted = false;
    };
  }, [repository]);

  useEffect(() => {
    if (save?.config === undefined || !isGatewayApiKeyLoaded) {
      return;
    }
    let mounted = true;
    async function loadStatus() {
      setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
      if (save === null) return;
      const status = await requestLocalAiStatus(save.config, gatewayApiKey);
      if (!mounted) return;
      setLocalAiStatus(status);
      if (status.status === "unavailable" && save.config.aiSetupComplete) {
        setErrorMessage(status.message);
      }
    }
    void loadStatus();
    return () => {
      mounted = false;
    };
  }, [save?.config, gatewayApiKey, isGatewayApiKeyLoaded]);

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
  const drawnScenarios = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.drawnScenarioIds
            .map((id) => starterScenarios.find((scenario) => scenario.id === id))
            .filter((scenario): scenario is DateScenario => scenario !== undefined),
    [activeShift],
  );
  const dateAmbientActive = activeSession?.status === "active";

  async function persist(nextSave: GameSave) {
    await repository.saveGame(nextSave);
    setSave(nextSave);
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

  async function handleStartDate(input: {
    focusMemberId: string;
    partnerMemberId: string;
    scenarioId: string;
  }) {
    if (save === null) return;
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
        focusMemberId: input.focusMemberId,
        firstMemberId: input.focusMemberId,
        secondMemberId: input.partnerMemberId,
        scenarioId: input.scenarioId,
      });
      await persist(result.save);
      setActiveDateSessionId(result.session.id);
      setInterventionText("");
      setInterventionTargetMemberId("");
      setCurrentRoom("stage");
    });
  }

  async function handleAdvanceExchange(turnCount: 1 | 2) {
    if (save === null || activeSession === null) return;
    const sessionId = activeSession.id;
    tryAction("advanceExchange", async () => {
      setStreamingDrafts([]);
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
        setActiveDateSessionId(result.session.id);
        if (result.warningMessages.length > 0) {
          setErrorMessage(result.warningMessages[0] ?? null);
        }
      } catch (error) {
        if (error instanceof DateStreamAbortedError) {
          return;
        }
        throw error;
      } finally {
        dateAbortControllerRef.current = null;
        stopAfterCurrentTurnRef.current = false;
        setStreamingDrafts([]);
      }
    });
  }

  function applyStreamEvent(event: LocalAiDateStreamEvent) {
    setStreamingDrafts((current) => {
      if (event.type === "characterStart") {
        return [
          ...current,
          {
            id: `${event.speakerId}-${event.sequenceIndex}`,
            speakerId: event.speakerId,
            speakerName: event.speakerName,
            sequenceIndex: event.sequenceIndex,
            turnIndex: event.turnIndex,
            text: "",
            reasoningText: "",
            status: "streaming",
          },
        ];
      }
      if (event.type === "characterDelta") {
        return current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? { ...draft, text: draft.text + event.textDelta }
            : draft,
        );
      }
      if (event.type === "characterReasoningDelta") {
        return current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? { ...draft, reasoningText: draft.reasoningText + event.textDelta }
            : draft,
        );
      }
      if (event.type === "characterDone") {
        return current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? { ...draft, text: event.text, status: "done" }
            : draft,
        );
      }
      return current;
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
    tryAction("endShift", async () => {
      const { save: nextSave } = completeShift(save);
      await persist(nextSave);
    });
  }

  async function handleStartNextShift() {
    if (save === null) return;
    tryAction("nextShift", async () => {
      const { save: nextSave } = startNextShift(save);
      await persist(nextSave);
    });
  }

  async function handleConfirmOnboarding(memberIds: string[]) {
    if (save === null) return;
    tryAction("focusCase", async () => {
      await persist(syncActiveShiftFocusCases(focusSelectInitial(save, memberIds)));
      setCurrentRoom("office");
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
    tryAction("focusCase", async () => {
      await persist(syncActiveShiftFocusCases(focusSwapCase(save, oldId, newId)));
    });
  }

  async function handlePickLibrary(libraryCardId: string) {
    if (save === null) return;
    tryAction("deck", async () => {
      const next = deckPickLibraryCard(save, libraryCardId);
      await persist(next);
    });
  }

  async function handleSwap(deckCardId: string, libraryCardId: string) {
    if (save === null || activeShift === null) return;
    tryAction("deck", async () => {
      const next = deckSwapCard(save, deckCardId, libraryCardId, activeShift.shiftNumber);
      await persist(next);
    });
  }

  if (save === null) {
    return <DashboardLoading />;
  }

  const caseBoardStarted =
    save.dateSessions.length > 0 || save.shifts.some((shift) => shift.featuredMemberIds.length > 0);
  const needsInitialFocusCases = save.focusedMemberIds.length === 0 && !caseBoardStarted;

  if (needsInitialFocusCases) {
    return (
      <div className="min-h-screen w-full bg-aura-cream-soft">
        <OnboardingScreen members={save.members} onConfirm={handleConfirmOnboarding} />
        {errorMessage !== null ? (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        ) : null}
      </div>
    );
  }

  const aiReady = localAiStatus.status === "ready" && save.config.aiSetupComplete === true;

  return (
    <div className="relative min-h-screen w-full bg-aura-cream-soft">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPunchOut}
            data-sfx="click"
            className="cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/30"
          >
            ← Punch out
          </button>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            shift {String(activeShift?.shiftNumber ?? 1).padStart(2, "0")} / {currentRoom}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAiSetupOpen(true)}
            data-sfx="click"
            className="cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/30"
          >
            ai · {localAiStatus.status}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={currentRoom}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {currentRoom === "office" && activeShift !== null ? (
            <OfficeCanvas
              save={save}
              shift={activeShift}
              focusedMembers={focusedMembers}
              scenarios={starterScenarios}
              drawnScenarios={drawnScenarios}
              memberRequests={memberRequests.slice()}
              pairStates={save.pairStates}
              isActionPending={isActionPending}
              aiReady={aiReady}
              onStartDate={handleStartDate}
              onOpenCasebook={() => setCurrentRoom("casebook")}
              onOpenGallery={() => setCurrentRoom("gallery")}
              onCloseShift={handleEndShift}
              onStartNextShift={handleStartNextShift}
              onResolveLibraryPick={() => setCurrentRoom("casebook")}
            />
          ) : null}

          {currentRoom === "casebook" && activeShift !== null ? (
            <CasebookCanvas
              save={save}
              currentShift={activeShift.shiftNumber}
              scenarios={starterScenarios}
              isActionPending={isActionPending}
              onPickLibrary={handlePickLibrary}
              onSwap={handleSwap}
              onBack={() => setCurrentRoom("office")}
            />
          ) : null}

          {currentRoom === "gallery" ? (
            <GalleryCanvas
              members={save.members}
              focusedMemberIds={save.focusedMemberIds}
              playerKnowledge={save.playerKnowledge}
              isActionPending={isActionPending}
              onAddFocus={handleAddFocus}
              onRemoveFocus={handleRemoveFocus}
              onSwapFocus={handleSwapFocus}
              onBack={() => setCurrentRoom("office")}
            />
          ) : null}

          {currentRoom === "stage" && activeSession !== null ? (
            <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-12">
              <DateView
                session={activeSession}
                scenario={activeDateScenario}
                members={save.members}
                playerKnowledge={save.playerKnowledge}
                interventionText={interventionText}
                interventionTargetMemberId={interventionTargetMemberId}
                canAdvance={
                  activeSession.status === "active" &&
                  activeSession.playbackState !== "drafting" &&
                  activeSession.playbackState !== "ended"
                }
                canIntervene={canAddCupidIntervention(activeSession)}
                isActionPending={isActionPending}
                pendingDateAction={pendingAction === "advanceExchange" ? "advanceExchange" : null}
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
                onBack={() => setCurrentRoom("office")}
              />
            </div>
          ) : null}

          {currentRoom === "files" ? (
            <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-12">
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
        stageEnabled={activeSession !== null}
        hidden={dateAmbientActive || currentRoom === "stage"}
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

      {errorMessage !== null ? (
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      ) : null}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 pt-4">
      <div className="aura-glass-strong flex items-center gap-3 rounded-pill px-4 py-2 shadow-aura-soft">
        <p className="text-sm text-aura-ink">{message}</p>
        <GhostButton onClick={onDismiss}>Dismiss</GhostButton>
      </div>
    </div>
  );
}
