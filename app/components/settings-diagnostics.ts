import {
  SAVE_SCHEMA_VERSION,
  type DateSession,
  type GameConfig,
  type GameSave,
  type ShiftState,
} from "../domain/game";
import { APP_VERSION } from "../platform/release-identity";
import { isTauriRuntime } from "../platform/runtime";
import type { AiSetupStatus } from "./ai-setup-panel";

export type DiagnosticsSnapshot = {
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
  save: {
    loaded: boolean;
    version: number | null;
    createdAt: string | null;
    updatedAt: string | null;
    activeShiftId: string | null;
    focusedCaseCount: number;
    activeMemberCount: number;
    closedMemberCount: number;
    quitMemberCount: number;
    pairCount: number;
    dateSessionCount: number;
    memoryCount: number;
    publicMemoryCount: number;
    playerKnowledgeCount: number;
  };
  currentShift: {
    id: string;
    shiftNumber: number;
    status: ShiftState["status"];
    dateSlotsUsed: number;
    dateSlotsTotal: number;
    featuredMemberCount: number;
    drawnScenarioCount: number;
    companyGoalCount: number;
    memberRequestCount: number;
    hasActiveBooking: boolean;
    activeBookingStatus: string | null;
    activeBookingDateSessionId: string | null;
  } | null;
  activeDate: {
    id: string;
    pairId: string;
    scenarioId: string;
    status: DateSession["status"];
    playbackState: DateSession["playbackState"];
    currentTurn: number;
    turnLimit: number;
    dateHealth: number;
    participantIds: [string, string];
    transcriptCount: number;
    judgeCount: number;
    interventionCount: number;
    triggeredEventCount: number;
    finalReportOutcome: string | null;
  } | null;
  shell: {
    currentRoom: string;
    pendingAction: string | null;
    queuedPlaybackIntent: string | null;
    streamingDraftCount: number;
    isJudgePending: boolean;
    lastErrorMessage: string | null;
    noticeMessage: string | null;
  };
};

export function buildDiagnosticsSnapshot(input: {
  config: GameConfig | null;
  localAiStatus: AiSetupStatus;
  save: GameSave | null;
  currentShift: ShiftState | null;
  activeDateSession: DateSession | null;
  currentRoom: string;
  pendingAction: string | null;
  queuedPlaybackIntent: string | null;
  streamingDraftCount: number;
  isJudgePending: boolean;
  lastErrorMessage: string | null;
  noticeMessage: string | null;
}): DiagnosticsSnapshot {
  const userAgent = typeof navigator === "undefined" ? "unknown" : navigator.userAgent;
  const saveCounts = summarizeSave(input.save);

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
    save: saveCounts,
    currentShift:
      input.currentShift === null
        ? null
        : {
            id: input.currentShift.id,
            shiftNumber: input.currentShift.shiftNumber,
            status: input.currentShift.status,
            dateSlotsUsed: input.currentShift.dateSlotsUsed,
            dateSlotsTotal: input.currentShift.dateSlotsTotal,
            featuredMemberCount: input.currentShift.featuredMemberIds.length,
            drawnScenarioCount: input.currentShift.drawnScenarioIds.length,
            companyGoalCount: input.currentShift.companyGoalIds.length,
            memberRequestCount: input.currentShift.memberRequestIds.length,
            hasActiveBooking: input.currentShift.activeBooking !== undefined,
            activeBookingStatus: input.currentShift.activeBooking?.status ?? null,
            activeBookingDateSessionId: input.currentShift.activeBooking?.dateSessionId ?? null,
          },
    activeDate:
      input.activeDateSession === null
        ? null
        : {
            id: input.activeDateSession.id,
            pairId: input.activeDateSession.pairId,
            scenarioId: input.activeDateSession.scenarioId,
            status: input.activeDateSession.status,
            playbackState: input.activeDateSession.playbackState,
            currentTurn: input.activeDateSession.currentTurn,
            turnLimit: input.activeDateSession.turnLimit,
            dateHealth: input.activeDateSession.dateHealth,
            participantIds: input.activeDateSession.participants,
            transcriptCount: input.activeDateSession.transcript.length,
            judgeCount: input.activeDateSession.judgeSnapshots.length,
            interventionCount: input.activeDateSession.interventions.length,
            triggeredEventCount: input.activeDateSession.eventsTriggered.length,
            finalReportOutcome: input.activeDateSession.finalReport?.outcome ?? null,
          },
    shell: {
      currentRoom: input.currentRoom,
      pendingAction: input.pendingAction,
      queuedPlaybackIntent: input.queuedPlaybackIntent,
      streamingDraftCount: input.streamingDraftCount,
      isJudgePending: input.isJudgePending,
      lastErrorMessage: input.lastErrorMessage,
      noticeMessage: input.noticeMessage,
    },
  };
}

function summarizeSave(save: GameSave | null): DiagnosticsSnapshot["save"] {
  if (save === null) {
    return {
      loaded: false,
      version: null,
      createdAt: null,
      updatedAt: null,
      activeShiftId: null,
      focusedCaseCount: 0,
      activeMemberCount: 0,
      closedMemberCount: 0,
      quitMemberCount: 0,
      pairCount: 0,
      dateSessionCount: 0,
      memoryCount: 0,
      publicMemoryCount: 0,
      playerKnowledgeCount: 0,
    };
  }

  let activeMemberCount = 0;
  let closedMemberCount = 0;
  let quitMemberCount = 0;
  for (const member of save.members) {
    if (member.state.status === "active") activeMemberCount += 1;
    else if (member.state.status === "closed") closedMemberCount += 1;
    else if (member.state.status === "quit") quitMemberCount += 1;
  }

  let publicMemoryCount = 0;
  for (const memory of save.memories) {
    if (memory.visibility === "public") publicMemoryCount += 1;
  }

  return {
    loaded: true,
    version: save.version,
    createdAt: save.createdAt,
    updatedAt: save.updatedAt,
    activeShiftId: save.activeShiftId,
    focusedCaseCount: save.focusedMemberIds.length,
    activeMemberCount,
    closedMemberCount,
    quitMemberCount,
    pairCount: save.pairStates.length,
    dateSessionCount: save.dateSessions.length,
    memoryCount: save.memories.length,
    publicMemoryCount,
    playerKnowledgeCount: save.playerKnowledge.length,
  };
}
