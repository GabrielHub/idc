import {
  dateFinalReportSchema,
  dateSessionSchema,
  gameSaveSchema,
  judgeSnapshotSchema,
  memoryRecordSchema,
  pairStatsSchema,
  shiftReportSchema,
  shiftStateSchema,
  type DateFinalReport,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type FollowUpAction,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type MemoryRecord,
  type PairState,
  type PairStats,
  type RelationshipStat,
  type ShiftGoalResult,
  type ShiftReport,
} from "../domain/game";
import { companyGoals, memberRequests, starterMembers, starterScenarios } from "../fixtures";
import { findMemberInSave, getActiveShift, makePairId, sortMemberIds } from "./game-seed";
import { createDeterministicEmbedding } from "./vector-memory";

type StartDateInput = {
  firstMemberId: string;
  secondMemberId: string;
  scenarioId: string;
  now?: Date;
};

type AdvanceDateInput = {
  dateSessionId: string;
  now?: Date;
};

type InterventionInput = {
  dateSessionId: string;
  text: string;
  now?: Date;
};

type FollowUpInput = {
  dateSessionId: string;
  action: FollowUpAction;
};

type DateEngineResult = {
  save: GameSave;
  session: DateSession;
};

const CHARACTER_TURN_LIMIT = 30;
const DETERMINISTIC_EMBEDDING_MODEL = "deterministic-local";

const RELATIONSHIP_STATS = [
  "chemistry",
  "trust",
  "stability",
  "conflict",
  "weirdnessTolerance",
  "spark",
  "strain",
  "relationshipHealth",
] satisfies RelationshipStat[];

export function startDateSession(save: GameSave, input: StartDateInput): DateEngineResult {
  if (input.firstMemberId === input.secondMemberId) {
    throw new Error("Cupid requires two different members for a match.");
  }

  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const activeShift = getActiveShift(save);

  if (activeShift.status !== "active") {
    throw new Error("No active shift is available.");
  }

  if (hasActiveDateInShift(save, activeShift.shiftNumber)) {
    throw new Error("Resolve the active date before assigning another match.");
  }

  if (activeShift.dateSlotsUsed >= activeShift.dateSlotsTotal) {
    throw new Error("All date slots are already assigned.");
  }

  if (!activeShift.drawnScenarioIds.includes(input.scenarioId)) {
    throw new Error("That scenario is not in today's drawn hand.");
  }

  const firstMember = requireMember(save, input.firstMemberId);
  const secondMember = requireMember(save, input.secondMemberId);
  const scenario = requireScenario(input.scenarioId);
  const pairId = makePairId(firstMember.id, secondMember.id);
  const pairState = requirePairState(save, pairId);
  const participants = sortMemberIds(firstMember.id, secondMember.id);
  const sessionNumber = activeShift.dateSlotsUsed + 1;
  const sessionId = `date-${activeShift.shiftNumber}-${sessionNumber}-${pairId}-${scenario.id}`;
  const openingMessage: DateMessage = {
    id: `${sessionId}-msg-0`,
    dateSessionId: sessionId,
    kind: "scenario",
    turnIndex: 0,
    sequenceIndex: 0,
    text: scenario.publicBrief.openingSituation,
    createdAt: timestamp,
  };
  const privateStateByCharacter = Object.fromEntries(
    participants.map((memberId) => {
      const member = memberId === firstMember.id ? firstMember : secondMember;

      return [
        memberId,
        {
          mood: member.state.mood,
          comfort: 62,
          intent: "trying",
        },
      ];
    }),
  );
  const session = dateSessionSchema.parse({
    id: sessionId,
    pairId,
    scenarioId: scenario.id,
    turnLimit: save.config.defaultDateMessageLimit || CHARACTER_TURN_LIMIT,
    currentTurn: 0,
    dateHealth: startingDateHealth(pairState),
    status: "active",
    participants,
    transcript: [openingMessage],
    privateStateByCharacter,
    judgeSnapshots: [],
  });
  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    dateSlotsUsed: activeShift.dateSlotsUsed + 1,
  });
  const nextSave = gameSaveSchema.parse({
    ...save,
    dateSessions: [...save.dateSessions, session],
    shifts: replaceById(save.shifts, updatedShift),
    updatedAt: timestamp,
  });

  return { save: nextSave, session };
}

export function addCupidIntervention(save: GameSave, input: InterventionInput): DateEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const session = requireDateSession(save, input.dateSessionId);

  if (session.intervention !== undefined) {
    throw new Error("Cupid already used the intervention for this date.");
  }

  if (session.status !== "active") {
    throw new Error("Cupid interventions are only available during active dates.");
  }

  const trimmedText = input.text.trim();

  if (trimmedText.length === 0 || trimmedText.length > 240) {
    throw new Error("Cupid interventions must be between 1 and 240 characters.");
  }

  const interventionMessage = createNonCharacterMessage(
    session,
    "cupid",
    `Cupid suggests: ${trimmedText}`,
    timestamp,
  );
  const updatedSession = dateSessionSchema.parse({
    ...session,
    transcript: [...session.transcript, interventionMessage],
    intervention: {
      text: trimmedText,
      usedAtTurn: session.currentTurn,
    },
  });
  const nextSave = replaceDateSession(save, updatedSession, timestamp);

  return { save: nextSave, session: updatedSession };
}

export function advanceDateExchange(save: GameSave, input: AdvanceDateInput): DateEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const session = requireDateSession(save, input.dateSessionId);

  if (session.status !== "active") {
    return { save, session };
  }

  const scenario = requireScenario(session.scenarioId);
  const pairState = requirePairState(save, session.pairId);
  const members = session.participants.map((memberId) => requireMember(save, memberId));
  const transcript = [...session.transcript];
  let currentTurn = session.currentTurn;

  for (let index = 0; index < 2 && currentTurn < session.turnLimit; index += 1) {
    const nextTurn = currentTurn + 1;
    const beat = scenario.director.beats.find((candidate) => candidate.atTurn === nextTurn);

    if (beat !== undefined) {
      transcript.push(
        createNonCharacterMessage(
          { ...session, transcript, currentTurn },
          "scenario",
          beat.characterVisibleText,
          timestamp,
        ),
      );
    }

    const speaker = members[currentTurn % members.length];
    const partner = members[(currentTurn + 1) % members.length];
    transcript.push(
      createCharacterMessage({
        session: { ...session, transcript, currentTurn },
        speaker,
        partner,
        scenario,
        pairState,
        createdAt: timestamp,
      }),
    );
    currentTurn += 1;
  }

  const exchangeMessages = transcript
    .slice(session.transcript.length)
    .filter((message) => message.kind === "character");
  const judgeSnapshot = judgeExchangeDeterministically({
    session,
    pairState,
    members,
    scenario,
    exchangeMessages,
    exchangeIndex: session.judgeSnapshots.length,
  });
  const updatedPairState = applyJudgeToPairState(pairState, judgeSnapshot);
  const updatedMembers = applyJudgeToMembers(save.members, judgeSnapshot);
  const nextDateHealth = clampScore(session.dateHealth + judgeSnapshot.dateHealthDelta);
  const baseUpdatedSession = dateSessionSchema.parse({
    ...session,
    currentTurn,
    dateHealth: nextDateHealth,
    status: nextDateHealth <= 0 || judgeSnapshot.shouldEndEarly ? "ended_early" : session.status,
    transcript,
    judgeSnapshots: [...session.judgeSnapshots, judgeSnapshot],
  });
  const shouldFinish =
    baseUpdatedSession.status === "ended_early" || currentTurn >= session.turnLimit;
  const completedSession = shouldFinish
    ? finalizeDateSession({
        session: {
          ...baseUpdatedSession,
          status: baseUpdatedSession.status === "ended_early" ? "ended_early" : "completed",
        },
        pairState: updatedPairState,
        members,
        scenario,
        completedAt: timestamp,
      })
    : baseUpdatedSession;
  const finalPairState =
    completedSession.finalReport === undefined
      ? updatedPairState
      : markPairDateComplete(updatedPairState, completedSession);
  const finalMemories =
    completedSession.finalReport === undefined
      ? save.memories
      : [
          ...save.memories,
          ...createDateMemoryRecords(completedSession, members, scenario, timestamp),
        ];
  const nextSave = gameSaveSchema.parse({
    ...save,
    members: updatedMembers,
    pairStates: replaceById(save.pairStates, finalPairState),
    dateSessions: replaceById(save.dateSessions, completedSession),
    memories: finalMemories,
    updatedAt: timestamp,
  });

  return { save: nextSave, session: completedSession };
}

export function completeDateSession(
  save: GameSave,
  dateSessionId: string,
  now = new Date(),
): DateEngineResult {
  let nextSave = save;
  let nextSession = requireDateSession(save, dateSessionId);

  while (nextSession.status === "active") {
    const result = advanceDateExchange(nextSave, {
      dateSessionId,
      now,
    });
    nextSave = result.save;
    nextSession = result.session;
  }

  return { save: nextSave, session: nextSession };
}

export function applyFollowUpAction(save: GameSave, input: FollowUpInput): DateEngineResult {
  const session = requireDateSession(save, input.dateSessionId);

  if (session.finalReport === undefined) {
    throw new Error("Follow-up actions require a completed date report.");
  }

  if (session.finalReport.appliedFollowUp !== undefined) {
    throw new Error("Cupid already filed the follow-up for this date.");
  }

  const pairState = requirePairState(save, session.pairId);
  const updatedPairState = {
    ...pairState,
    stats: pairStatsSchema.parse(applyFollowUpToStats(pairState.stats, input.action)),
  };
  const updatedSession = dateSessionSchema.parse({
    ...session,
    finalReport: dateFinalReportSchema.parse({
      ...session.finalReport,
      appliedFollowUp: input.action,
    }),
  });
  const nextSave = gameSaveSchema.parse({
    ...save,
    pairStates: replaceById(save.pairStates, updatedPairState),
    dateSessions: replaceById(save.dateSessions, updatedSession),
    updatedAt: new Date().toISOString(),
  });

  return { save: nextSave, session: updatedSession };
}

export function completeShift(
  save: GameSave,
  now = new Date(),
): { save: GameSave; report: ShiftReport } {
  const timestamp = now.toISOString();
  const activeShift = getActiveShift(save);
  const shiftDateSessions = save.dateSessions.filter((session) =>
    session.id.startsWith(`date-${activeShift.shiftNumber}-`),
  );

  if (shiftDateSessions.some((session) => session.status === "active")) {
    throw new Error("Resolve active dates before ending the shift.");
  }

  const completedDates = shiftDateSessions.filter((session) => session.status !== "active");
  const earlyEndedDates = completedDates.filter((session) => session.status === "ended_early");
  const ordinaryNonHumanDates = completedDates.filter((session) => {
    const participants = session.participants.map((memberId) => requireMember(save, memberId));
    return (
      participants.some(isOrdinaryHuman) && participants.some((member) => !isOrdinaryHuman(member))
    );
  });
  const moodBaseline = createMoodBaseline();
  const memberMoodDelta = save.members.reduce((total, member) => {
    const baselineMood = moodBaseline.get(member.id) ?? member.state.mood;
    return total + (member.state.mood - baselineMood);
  }, 0);
  const ignoredRequestIds = activeShift.memberRequestIds.filter(
    (requestId) => !requestWasAddressed(requestId, completedDates),
  );
  const penalizedMembers = save.members.map((member) => {
    const ignoredRequest = memberRequests.find(
      (request) => request.memberId === member.id && ignoredRequestIds.includes(request.id),
    );

    if (ignoredRequest === undefined) {
      return member;
    }

    return {
      ...member,
      state: {
        ...member.state,
        mood: clampScore(member.state.mood - ignoredRequest.moodPenaltyIfIgnored),
      },
    };
  });
  const goalResults = activeShift.companyGoalIds.map((goalId) =>
    scoreGoal(goalId, {
      completedDates: completedDates.length,
      earlyEndedDates: earlyEndedDates.length,
      ordinaryNonHumanDates: ordinaryNonHumanDates.length,
      memberMoodDelta,
    }),
  );
  const report = shiftReportSchema.parse({
    id: `report-${activeShift.id}`,
    shiftId: activeShift.id,
    completedAt: timestamp,
    completedDates: completedDates.length,
    earlyEndedDates: earlyEndedDates.length,
    ordinaryNonHumanDates: ordinaryNonHumanDates.length,
    memberMoodDelta,
    goalResults,
    ignoredRequestIds,
    offeredScenarioIds: activeShift.scenarioDeck.offeredScenarioIds,
    summary: buildShiftSummary(completedDates.length, earlyEndedDates.length, memberMoodDelta),
  });
  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    status: "completed",
    completedAt: timestamp,
    report,
  });
  const nextSave = gameSaveSchema.parse({
    ...save,
    members: penalizedMembers,
    shifts: replaceById(save.shifts, updatedShift),
    updatedAt: timestamp,
  });

  return { save: nextSave, report };
}

function createCharacterMessage({
  session,
  speaker,
  partner,
  scenario,
  pairState,
  createdAt,
}: {
  session: DateSession;
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  pairState: PairState;
  createdAt: string;
}): DateMessage {
  const turnIndex = session.currentTurn + 1;
  const repeatCount = pairState.scenarioUseCounts[scenario.id] ?? 0;
  const text = deterministicCharacterText({
    speaker,
    partner,
    scenario,
    turnIndex,
    repeatCount,
    interventionText: session.intervention?.text,
  });

  return {
    id: `${session.id}-msg-${session.transcript.length}`,
    dateSessionId: session.id,
    kind: "character",
    speakerId: speaker.id,
    turnIndex,
    sequenceIndex: session.transcript.length,
    text,
    createdAt,
  };
}

function createNonCharacterMessage(
  session: DateSession,
  kind: "scenario" | "cupid" | "system",
  text: string,
  createdAt: string,
): DateMessage {
  return {
    id: `${session.id}-msg-${session.transcript.length}`,
    dateSessionId: session.id,
    kind,
    turnIndex: session.currentTurn,
    sequenceIndex: session.transcript.length,
    text,
    createdAt,
  };
}

function deterministicCharacterText({
  speaker,
  partner,
  scenario,
  turnIndex,
  repeatCount,
  interventionText,
}: {
  speaker: Member;
  partner: Member;
  scenario: DateScenario;
  turnIndex: number;
  repeatCount: number;
  interventionText: string | undefined;
}): string {
  const sample = speaker.voice.sampleMessages[0];
  const beatHint = scenario.director.beats.find((beat) => beat.atTurn <= turnIndex);
  const repeatLine =
    repeatCount > 0
      ? ` I recognize this setup, which is either romantic or procurement missed a checkbox.`
      : "";
  const interventionLine =
    interventionText === undefined
      ? ""
      : ` Cupid said "${interventionText}", and I am treating that as advice.`;

  if (turnIndex <= 2) {
    return `${sample} ${partner.name}, this is apparently ${scenario.publicBrief.location}.${repeatLine}`;
  }

  if (beatHint !== undefined && turnIndex % 4 === 0) {
    return `${speaker.name} looks at ${partner.name}. ${beatHint.characterVisibleText} I can work with this if we stay specific.${interventionLine}`;
  }

  if (speaker.tags.includes("cosmic")) {
    return `I am attempting a small honest question for ${partner.name}. It has fewer teeth than my usual questions.${repeatLine}${interventionLine}`;
  }

  if (speaker.tags.includes("career")) {
    return `Status update for ${partner.name}: the date remains active, the environment is unusual, and I am still listening.${repeatLine}${interventionLine}`;
  }

  if (speaker.tags.includes("prophecy_averse")) {
    return `I would like to choose the next sentence myself, preferably before the room files paperwork about destiny.${repeatLine}${interventionLine}`;
  }

  if (speaker.tags.includes("ghost")) {
    return `For the record, ${partner.name}, being remembered would be enough for this part of the evening.${repeatLine}${interventionLine}`;
  }

  return `anyway ${partner.name}, I am trying to be normal about ${scenario.title}, which may be the first documented problem.${repeatLine}${interventionLine}`;
}

function judgeExchangeDeterministically({
  session,
  pairState,
  members,
  scenario,
  exchangeMessages,
  exchangeIndex,
}: {
  session: DateSession;
  pairState: PairState;
  members: Member[];
  scenario: DateScenario;
  exchangeMessages: DateMessage[];
  exchangeIndex: number;
}): JudgeSnapshot {
  const scenarioRiskPenalty =
    scenario.card.risk === "high" ? -7 : scenario.card.risk === "medium" ? -3 : 2;
  const interventionBonus = session.intervention === undefined ? 0 : 3;
  const repeatPenalty = (pairState.scenarioUseCounts[scenario.id] ?? 0) > 0 ? -5 : 0;
  const listeningBonus = exchangeMessages.some((message) =>
    members.some((member) => message.text.includes(member.name)),
  )
    ? 4
    : 0;
  const dateHealthDelta = scenarioRiskPenalty + interventionBonus + listeningBonus + repeatPenalty;
  const shouldEndEarly = session.dateHealth + dateHealthDelta <= 0;
  const statDeltas = {
    chemistry: clampDelta(2 + listeningBonus),
    trust: clampDelta(1 + interventionBonus),
    stability: clampDelta(scenarioRiskPenalty > 0 ? 2 : -1),
    conflict: clampDelta(Math.abs(Math.min(scenarioRiskPenalty, 0))),
    weirdnessTolerance: clampDelta(scenario.card.chaos === "high" ? 3 : 1),
    spark: clampDelta(2),
    strain: clampDelta(Math.abs(Math.min(scenarioRiskPenalty + repeatPenalty, 0))),
    relationshipHealth: clampDelta(Math.round(dateHealthDelta / 2)),
  };
  const memberMoodDeltas = Object.fromEntries(
    members.map((member) => [member.id, clampDelta(Math.round(dateHealthDelta / 4))]),
  );
  const memoryCandidates = [
    {
      scope: "pair",
      visibility: "public",
      subjectIds: session.participants,
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${members[0].name} and ${members[1].name} handled ${scenario.title} with Date Health delta ${dateHealthDelta}.`,
      tags: ["date", scenario.card.risk],
      importance: Math.min(5, Math.max(1, Math.abs(dateHealthDelta) >= 6 ? 4 : 2)),
    },
  ];

  return judgeSnapshotSchema.parse({
    id: `judge-${session.id}-${exchangeIndex}`,
    dateSessionId: session.id,
    exchangeIndex,
    dateHealthDelta,
    statDeltas,
    memberMoodDeltas,
    shouldEndEarly,
    earlyEndReason: shouldEndEarly ? "Date Health reached zero." : undefined,
    notableMoments: exchangeMessages.map((message) => message.text).slice(0, 2),
    playerSummary: buildJudgeSummary(dateHealthDelta, repeatPenalty, interventionBonus),
    memoryCandidates,
  });
}

function finalizeDateSession({
  session,
  pairState,
  members,
  scenario,
  completedAt,
}: {
  session: DateSession;
  pairState: PairState;
  members: Member[];
  scenario: DateScenario;
  completedAt: string;
}): DateSession {
  const outcome =
    session.status === "ended_early"
      ? "early_end"
      : pairState.stats.relationshipHealth >= 65
        ? "second_date"
        : pairState.stats.strain >= 70
          ? "cool_down"
          : "mixed";
  const recommendedFollowUp = followUpForOutcome(outcome);
  const report: DateFinalReport = dateFinalReportSchema.parse({
    id: `final-${session.id}`,
    dateSessionId: session.id,
    completedAt,
    outcome,
    summary: `${members[0].name} and ${members[1].name} completed ${scenario.title}. ${session.status === "ended_early" ? "Date ended early. Standard cleanup is on schedule." : "Date completed. Cupid has enough data to be annoying."}`,
    statSummary: `Spark ${pairState.stats.spark}. Strain ${pairState.stats.strain}. Health ${pairState.stats.relationshipHealth}.`,
    recommendedFollowUp,
    memoryRecordIds: [
      `memory-${session.id}-pair`,
      `memory-${session.id}-${members[0].id}`,
      `memory-${session.id}-${members[1].id}`,
      `memory-${session.id}-scenario`,
    ],
  });

  return dateSessionSchema.parse({
    ...session,
    finalReport: report,
  });
}

function createDateMemoryRecords(
  session: DateSession,
  members: Member[],
  scenario: DateScenario,
  createdAt: string,
): MemoryRecord[] {
  const records = [
    {
      id: `memory-${session.id}-pair`,
      scope: "pair",
      visibility: "public",
      subjectIds: session.participants,
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${members[0].name} and ${members[1].name} went to ${scenario.title}. Final Date Health was ${session.dateHealth}.`,
      tags: ["date_summary", scenario.id],
      importance: 4,
      createdAt,
    },
    ...members.map((member) => ({
      id: `memory-${session.id}-${member.id}`,
      scope: "member",
      visibility: "member_private",
      subjectIds: [member.id],
      visibleToMemberIds: [member.id],
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${member.name} privately remembers ${scenario.title} as ${session.status === "ended_early" ? "a date that lost momentum" : "a completed Cupid date"} with ${members.find((candidate) => candidate.id !== member.id)?.name}.`,
      tags: ["private_date_memory", scenario.id],
      importance: 3,
      createdAt,
    })),
    {
      id: `memory-${session.id}-scenario`,
      scope: "scenario",
      visibility: "public",
      subjectIds: session.participants,
      pairId: session.pairId,
      scenarioId: scenario.id,
      dateSessionId: session.id,
      text: `${session.pairId} has used ${scenario.title}. Repeat bookings should mention that Cupid has a file.`,
      tags: ["scenario_repeat", scenario.id],
      importance: 3,
      createdAt,
    },
  ];

  return records.map((record) => {
    const embedding = createDeterministicEmbedding(record.text);

    return memoryRecordSchema.parse({
      ...record,
      embedding,
      embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
      embeddingDimensions: embedding.length,
    });
  });
}

function applyJudgeToPairState(pairState: PairState, judgeSnapshot: JudgeSnapshot): PairState {
  const nextStats = { ...pairState.stats };

  for (const stat of RELATIONSHIP_STATS) {
    nextStats[stat] = clampScore(nextStats[stat] + (judgeSnapshot.statDeltas[stat] ?? 0));
  }

  return {
    ...pairState,
    stats: pairStatsSchema.parse(nextStats),
  };
}

function applyJudgeToMembers(members: Member[], judgeSnapshot: JudgeSnapshot): Member[] {
  return members.map((member) => ({
    ...member,
    state: {
      ...member.state,
      mood: clampScore(member.state.mood + (judgeSnapshot.memberMoodDeltas[member.id] ?? 0)),
      recentDateResult:
        judgeSnapshot.memberMoodDeltas[member.id] === undefined
          ? member.state.recentDateResult
          : judgeSnapshot.playerSummary,
    },
  }));
}

function markPairDateComplete(pairState: PairState, session: DateSession): PairState {
  return {
    ...pairState,
    completedDateIds: pairState.completedDateIds.includes(session.id)
      ? pairState.completedDateIds
      : [...pairState.completedDateIds, session.id],
    scenarioUseCounts: {
      ...pairState.scenarioUseCounts,
      [session.scenarioId]: (pairState.scenarioUseCounts[session.scenarioId] ?? 0) + 1,
    },
  };
}

function applyFollowUpToStats(stats: PairStats, action: FollowUpAction): PairStats {
  if (action === "encourage") {
    return adjustStats(stats, {
      chemistry: 6,
      trust: 3,
      spark: 6,
      strain: 2,
      relationshipHealth: 4,
    });
  }

  if (action === "cool_down") {
    return adjustStats(stats, { chemistry: -3, stability: 3, conflict: -4, spark: -3, strain: -6 });
  }

  if (action === "repair") {
    return adjustStats(stats, {
      trust: 7,
      stability: 4,
      conflict: -6,
      strain: -5,
      relationshipHealth: 6,
    });
  }

  return adjustStats(stats, {
    chemistry: -6,
    trust: -2,
    stability: 2,
    conflict: 3,
    spark: -8,
    strain: 5,
  });
}

function adjustStats(
  stats: PairStats,
  deltas: Partial<Record<RelationshipStat, number>>,
): PairStats {
  const nextStats = { ...stats };

  for (const stat of RELATIONSHIP_STATS) {
    nextStats[stat] = clampScore(nextStats[stat] + (deltas[stat] ?? 0));
  }

  nextStats.relationshipHealth = clampScore(
    Math.round(
      (nextStats.chemistry + nextStats.trust + nextStats.stability + (100 - nextStats.conflict)) /
        4,
    ),
  );
  nextStats.strain = clampScore(Math.round((nextStats.conflict + (100 - nextStats.stability)) / 2));

  return pairStatsSchema.parse(nextStats);
}

function scoreGoal(
  goalId: string,
  metrics: {
    completedDates: number;
    earlyEndedDates: number;
    ordinaryNonHumanDates: number;
    memberMoodDelta: number;
  },
): ShiftGoalResult {
  const goal = companyGoals.find((candidate) => candidate.id === goalId);

  if (goal === undefined) {
    throw new Error(`Goal not found: ${goalId}`);
  }

  const progress = metrics[goal.metric as keyof typeof metrics];
  const met = goal.metric === "earlyEndedDates" ? progress <= goal.target : progress >= goal.target;

  return {
    goalId,
    status: met ? "met" : "missed",
    progress,
    target: goal.target,
    summary: met ? `${goal.title}: met.` : `${goal.title}: missed.`,
  };
}

function requestWasAddressed(requestId: string, sessions: DateSession[]): boolean {
  const request = memberRequests.find((candidate) => candidate.id === requestId);

  if (request === undefined) {
    return false;
  }

  return sessions.some((session) => session.participants.includes(request.memberId));
}

function hasActiveDateInShift(save: GameSave, shiftNumber: number): boolean {
  return save.dateSessions.some(
    (session) => session.id.startsWith(`date-${shiftNumber}-`) && session.status === "active",
  );
}

function buildJudgeSummary(
  dateHealthDelta: number,
  repeatPenalty: number,
  interventionBonus: number,
): string {
  if (dateHealthDelta > 4) {
    return "Spark up. Date Health improved. Cupid may use a normal form.";
  }

  if (repeatPenalty < 0) {
    return "Repeat scenario noticed. Strain up. Procurement has been informed.";
  }

  if (interventionBonus > 0) {
    return "Intervention helped. Date Health stabilized.";
  }

  if (dateHealthDelta < 0) {
    return "Date Health down. Recommend Repair if this pair matters.";
  }

  return "Date Health stable. Continue monitoring.";
}

function buildShiftSummary(
  completedDates: number,
  earlyEndedDates: number,
  memberMoodDelta: number,
): string {
  return `${completedDates} dates completed. ${earlyEndedDates} ended early. Member Mood delta ${memberMoodDelta}. Filing.`;
}

function followUpForOutcome(outcome: DateFinalReport["outcome"]): FollowUpAction {
  if (outcome === "second_date") {
    return "encourage";
  }

  if (outcome === "cool_down") {
    return "cool_down";
  }

  if (outcome === "early_end") {
    return "repair";
  }

  return outcome === "bad_fit" ? "mark_bad_fit" : "repair";
}

function replaceDateSession(save: GameSave, session: DateSession, timestamp: string): GameSave {
  return gameSaveSchema.parse({
    ...save,
    dateSessions: replaceById(save.dateSessions, session),
    updatedAt: timestamp,
  });
}

function requireMember(save: GameSave, memberId: string): Member {
  const member = findMemberInSave(save, memberId);

  if (member === undefined) {
    throw new Error(`Member not found: ${memberId}`);
  }

  return member;
}

function requireScenario(scenarioId: string): DateScenario {
  const scenario = starterScenarios.find((candidate) => candidate.id === scenarioId);

  if (scenario === undefined) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  return scenario;
}

function requirePairState(save: GameSave, pairId: string): PairState {
  const pairState = save.pairStates.find((candidate) => candidate.id === pairId);

  if (pairState === undefined) {
    throw new Error(`Pair state not found: ${pairId}`);
  }

  return pairState;
}

function requireDateSession(save: GameSave, dateSessionId: string): DateSession {
  const session = save.dateSessions.find((candidate) => candidate.id === dateSessionId);

  if (session === undefined) {
    throw new Error(`Date session not found: ${dateSessionId}`);
  }

  return session;
}

function startingDateHealth(pairState: PairState): number {
  return clampScore(
    Math.round((pairState.stats.relationshipHealth + pairState.stats.stability) / 2),
  );
}

function isOrdinaryHuman(member: Member): boolean {
  return member.tags.includes("ordinary_human");
}

function createMoodBaseline(): Map<string, number> {
  return new Map(starterMembers.map((member) => [member.id, member.state.mood]));
}

function replaceById<TItem extends { id: string }>(items: TItem[], item: TItem): TItem[] {
  const existingIndex = items.findIndex((candidate) => candidate.id === item.id);

  if (existingIndex === -1) {
    return [...items, item];
  }

  return items.map((candidate, index) => (index === existingIndex ? item : candidate));
}

function clampDelta(value: number): number {
  return Math.min(100, Math.max(-100, value));
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
