import type { DateFinalReport, DateSession, Member } from "../domain/game";
import { dateAffectHurtsPostDateState } from "./date-affects";

export type OutcomeStateDeltas = {
  retention: number;
  mood: number;
  burnout: number;
};

export const FINAL_OUTCOME_DELTAS: Record<DateFinalReport["outcome"], OutcomeStateDeltas> = {
  second_date: { retention: 4, mood: 4, burnout: -4 },
  mixed: { retention: -5, mood: -2, burnout: 2 },
  cool_down: { retention: -10, mood: -5, burnout: 5 },
  bad_fit: { retention: -20, mood: -9, burnout: 8 },
  early_end: { retention: -25, mood: -12, burnout: 10 },
};

export function derivePostDateMemberDeltas(
  member: Member,
  session: DateSession,
  outcome: DateFinalReport["outcome"],
): OutcomeStateDeltas {
  const baseDeltas = FINAL_OUTCOME_DELTAS[outcome];
  const finalJudge = session.judgeSnapshots.at(-1);
  const memberAffect = finalJudge?.memberAffects?.[member.id]?.affect;
  const negativeOutcome = outcome !== "second_date";
  let retention = baseDeltas.retention;
  let mood = baseDeltas.mood;
  let burnout = baseDeltas.burnout;

  if (member.state.mood <= 25) {
    retention -= negativeOutcome ? 6 : 3;
    mood -= 1;
  }

  if (member.state.burnout >= 75 && negativeOutcome) {
    retention -= 6;
    burnout += 2;
  }

  if (member.state.retention <= 25 && negativeOutcome) {
    retention -= 6;
  }

  if (dateAffectHurtsPostDateState(memberAffect)) {
    retention -= negativeOutcome ? 5 : 2;
    mood -= 1;
  }

  if (outcome === "early_end" && finalJudge?.shouldEndEarly === true) {
    retention -= 4;
  }

  return { retention, mood, burnout };
}
