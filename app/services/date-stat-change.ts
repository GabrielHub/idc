import type {
  DateSession,
  DateStatChange as DomainDateStatChange,
  RelationshipStat,
} from "../domain/game";
import { FINAL_OUTCOME_DELTAS } from "./date-outcome-state";

export type DateStatChange = DomainDateStatChange;
export type MemberStateDelta = DomainDateStatChange["members"][string];

export function computeDateStatChange(session: DateSession): DateStatChange {
  const pair: Partial<Record<RelationshipStat, number>> = {};
  const memberMoodFromJudge: Record<string, number> = {};

  for (const snap of session.judgeSnapshots) {
    for (const [stat, delta] of Object.entries(snap.statDeltas) as Array<
      [RelationshipStat, number]
    >) {
      pair[stat] = (pair[stat] ?? 0) + delta;
    }
    for (const [memberId, delta] of Object.entries(snap.memberMoodDeltas)) {
      memberMoodFromJudge[memberId] = (memberMoodFromJudge[memberId] ?? 0) + delta;
    }
  }

  const outcome = session.finalReport?.outcome;
  const outcomeDeltas = outcome === undefined ? null : FINAL_OUTCOME_DELTAS[outcome];

  const members: Record<string, MemberStateDelta> = {};
  for (const id of session.participants) {
    members[id] = {
      mood: (memberMoodFromJudge[id] ?? 0) + (outcomeDeltas?.mood ?? 0),
      retention: outcomeDeltas?.retention ?? 0,
      burnout: outcomeDeltas?.burnout ?? 0,
    };
  }

  return { pair, members };
}

export function hasPairChange(change: DateStatChange): boolean {
  return Object.values(change.pair).some((value) => value !== undefined && value !== 0);
}

export function hasMemberChange(change: DateStatChange, memberId: string): boolean {
  const delta = change.members[memberId];
  if (delta === undefined) return false;
  return delta.mood !== 0 || delta.retention !== 0 || delta.burnout !== 0;
}
