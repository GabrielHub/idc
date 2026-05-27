import type {
  DateFinalReport,
  DateSession,
  FollowUpAction,
  GameSave,
  JudgeSnapshot,
  PairState,
} from "../domain/game";
import { memberRequests } from "../fixtures";
import { CLOSURE_THRESHOLD } from "./closures";
import type { DateStatChange } from "./date-stat-change";
import { classifyFocusAskOutcomeFromSession } from "./shift-request-assessment";

export type DateImpactVerdict =
  | "ready_to_close"
  | "closer_to_win"
  | "no_real_progress"
  | "closer_to_loss"
  | "bad_fit";

export type DateImpactReceipt = {
  verdict: DateImpactVerdict;
  verdictLabel: string;
  campaignMeaning: string;
  reason: string;
  nextAction: string;
  consequences: string[];
  statChange: DateStatChange | undefined;
};

const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  pursue: "Pursue",
  cool_down: "Cool Down",
  close: "Close",
};

export function buildDateImpactReceipt({
  report,
  session,
  save,
  filedReadCount = 0,
}: {
  report: DateFinalReport;
  session: DateSession;
  save: Pick<GameSave, "members" | "pairStates">;
  filedReadCount?: number;
}): DateImpactReceipt {
  const pairState = save.pairStates.find((candidate) => candidate.id === session.pairId);
  const focusName = resolveFocusName(session, save);
  const askOutcome = resolveFocusAskOutcome(session);
  const verdict = deriveVerdict(report, askOutcome);

  return {
    verdict,
    verdictLabel: verdictLabel(verdict),
    campaignMeaning: campaignMeaning(verdict, focusName),
    reason: reasonLine({ report, session, askOutcome, verdict }),
    nextAction: FOLLOW_UP_LABELS[report.recommendedFollowUp],
    consequences: buildConsequences({
      report,
      session,
      pairState,
      askOutcome,
      filedReadCount,
    }),
    statChange: report.statChange,
  };
}

function resolveFocusName(session: DateSession, save: Pick<GameSave, "members">): string {
  const focusMember =
    session.focusMemberId === undefined
      ? undefined
      : save.members.find((member) => member.id === session.focusMemberId);
  return focusMember?.firstName ?? "This focus case";
}

type FocusAskOutcome = "covered" | "raised" | "missed" | undefined;

function resolveFocusAskOutcome(session: DateSession): FocusAskOutcome {
  const requestId = session.focusRequestId;
  if (requestId === undefined) {
    return undefined;
  }

  const request = memberRequests.find((candidate) => candidate.id === requestId);
  if (request === undefined) {
    return undefined;
  }

  return classifyFocusAskOutcomeFromSession(session, request.memberId, request.id);
}

function deriveVerdict(report: DateFinalReport, askOutcome: FocusAskOutcome): DateImpactVerdict {
  if (report.readyToClose) return "ready_to_close";
  if (report.outcome === "bad_fit") return "bad_fit";
  if (report.outcome === "early_end" || report.outcome === "cool_down") return "closer_to_loss";
  if (report.outcome === "second_date" || askOutcome === "covered") return "closer_to_win";
  return "no_real_progress";
}

function verdictLabel(verdict: DateImpactVerdict): string {
  if (verdict === "ready_to_close") return "Closure ready";
  if (verdict === "closer_to_win") return "Closure gained ground";
  if (verdict === "closer_to_loss") return "Case risk rose";
  if (verdict === "bad_fit") return "Bad fit confirmed";
  return "Case stalled";
}

function campaignMeaning(verdict: DateImpactVerdict, focusName: string): string {
  if (verdict === "ready_to_close") {
    return `${focusName}'s file is ready to become a closure.`;
  }
  if (verdict === "closer_to_win") {
    return `This date made ${focusName}'s file more likely to close.`;
  }
  if (verdict === "closer_to_loss") {
    return `This date made ${focusName}'s file harder to close.`;
  }
  if (verdict === "bad_fit") {
    return "This lane is not likely to produce a closure.";
  }
  return "The file is still open, but this date did not move it.";
}

function reasonLine({
  report,
  session,
  askOutcome,
  verdict,
}: {
  report: DateFinalReport;
  session: DateSession;
  askOutcome: FocusAskOutcome;
  verdict: DateImpactVerdict;
}): string {
  if (verdict === "ready_to_close") {
    return "The pair has enough clean signal to leave Cupid together.";
  }
  if (report.outcome === "bad_fit") {
    return "The mismatch is strong enough that more dates in this lane are low-value.";
  }
  if (session.status === "ended_early" || report.outcome === "early_end") {
    return "The date ended on pressure that now has to be repaired.";
  }
  if (askOutcome === "covered" && report.outcome === "second_date") {
    return "The ask landed and the pair gave Cupid usable closure signal.";
  }
  if (askOutcome === "covered") {
    return "The ask landed, but the pair still needs a stronger closure path.";
  }
  if (askOutcome === "raised") {
    return "The ask came up, but this room could not turn it into progress.";
  }
  if (report.outcome === "cool_down") {
    return "The room ran hot enough that pushing again would raise risk.";
  }
  if (report.outcome === "second_date") {
    return "The pair left with enough mutual signal to keep building the file.";
  }
  return "Cupid got notes, but no clear movement toward closure.";
}

function buildConsequences({
  report,
  session,
  pairState,
  askOutcome,
  filedReadCount,
}: {
  report: DateFinalReport;
  session: DateSession;
  pairState: PairState | undefined;
  askOutcome: FocusAskOutcome;
  filedReadCount: number;
}): string[] {
  const consequences: string[] = [];
  if (report.readyToClose) {
    consequences.push("Closure is available in dispatch.");
  }
  addAskConsequence(consequences, askOutcome);
  addPairMemoryConsequence(consequences, session.judgeSnapshots);
  if (!report.readyToClose) {
    addClosureConsequence(consequences, report, pairState);
  }

  if (consequences.length < 3 && filedReadCount > 0) {
    consequences.push(`${filedReadCount} filed read${filedReadCount === 1 ? "" : "s"} added.`);
  }

  if (consequences.length === 0) {
    consequences.push("No major file state changed.");
  }

  return consequences.slice(0, 3);
}

function addAskConsequence(consequences: string[], askOutcome: FocusAskOutcome): void {
  if (askOutcome === "covered") {
    consequences.push("Lead ask landed.");
  } else if (askOutcome === "raised") {
    consequences.push("Lead ask surfaced, but the room blocked it.");
  } else if (askOutcome === "missed") {
    consequences.push("Lead ask did not land.");
  }
}

function addPairMemoryConsequence(
  consequences: string[],
  snapshots: readonly JudgeSnapshot[],
): void {
  const agreementCandidates = snapshots.reduce(
    (total, snapshot) => total + snapshot.agreementCandidates.length,
    0,
  );
  const agreementUpdates = snapshots.flatMap((snapshot) => snapshot.agreementUpdates);
  const openLoopCandidates = snapshots.reduce(
    (total, snapshot) => total + snapshot.openLoopCandidates.length,
    0,
  );
  const openLoopUpdates = snapshots.flatMap((snapshot) => snapshot.openLoopUpdates);

  if (agreementUpdates.some((update) => update.status === "honored")) {
    consequences.push("An agreement was honored.");
  } else if (agreementUpdates.some((update) => update.status === "broken")) {
    consequences.push("An agreement was broken.");
  } else if (agreementCandidates > 0) {
    consequences.push("New agreement filed.");
  }

  if (consequences.length >= 3) return;

  if (openLoopUpdates.some((update) => update.status === "resolved")) {
    consequences.push("An unresolved issue was resolved.");
  } else if (openLoopUpdates.some((update) => update.status === "dropped")) {
    consequences.push("An unresolved issue was dropped.");
  } else if (openLoopCandidates > 0) {
    consequences.push("New unresolved issue filed.");
  }
}

function addClosureConsequence(
  consequences: string[],
  report: DateFinalReport,
  pairState: PairState | undefined,
): void {
  if (report.readyToClose) {
    consequences.push("Closure is available in dispatch.");
    return;
  }

  const blocker = closureBlocker(report, pairState);
  if (blocker !== null) {
    consequences.push(blocker);
  }
}

function closureBlocker(report: DateFinalReport, pairState: PairState | undefined): string | null {
  if (pairState === undefined) {
    return null;
  }

  if (pairState.openLoops.some((loop) => loop.status === "open")) {
    return "Still blocking closure: unresolved issue.";
  }
  if (pairState.agreements.some((agreement) => agreement.status === "broken")) {
    return "Still blocking closure: broken agreement.";
  }
  if (
    pairState.stats.strain > CLOSURE_THRESHOLD.strainMax ||
    pairState.stats.conflict > CLOSURE_THRESHOLD.conflictMax
  ) {
    return "Still blocking closure: pressure is too high.";
  }
  if (pairState.completedDateIds.length < CLOSURE_THRESHOLD.minCompletedDates) {
    return "Still blocking closure: more history needed.";
  }
  if (report.outcome !== "second_date") {
    return "Still blocking closure: date result was too soft.";
  }

  return null;
}
