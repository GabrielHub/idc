import type { MemberDateAffect } from "../domain/game";

export type DateAffectTone = "neutral" | "protective" | "guarded" | "warm" | "curious";

const DATE_AFFECT_TONES: Record<MemberDateAffect, DateAffectTone> = {
  neutral: "neutral",
  warming: "warm",
  curious: "curious",
  guarded: "guarded",
  overloaded: "protective",
  disappointed: "guarded",
  relieved: "warm",
  angry: "protective",
  leaning_in: "warm",
};

const DATE_AFFECT_PRIVATE_INTENTS: Partial<Record<MemberDateAffect, string>> = {
  angry: "protect the boundary",
  overloaded: "protect the boundary",
  guarded: "slow down and read the room",
  disappointed: "slow down and read the room",
  leaning_in: "lean into the attraction",
  warming: "stay engaged",
  curious: "stay engaged",
  relieved: "stay engaged",
};

const POST_DATE_STATE_PENALTY_AFFECTS = new Set<MemberDateAffect>([
  "angry",
  "overloaded",
  "disappointed",
]);

export function dateAffectTone(affect: MemberDateAffect | undefined): DateAffectTone {
  return affect === undefined ? "neutral" : DATE_AFFECT_TONES[affect];
}

export function dateAffectPromptLabel(
  affect: MemberDateAffect | undefined,
  cause: string | undefined,
): string {
  if (affect === undefined || affect === "neutral") {
    return "no strong affect shift";
  }

  return `${affect.replace(/_/gu, " ")} from ${cause ?? "the last exchange"}`;
}

export function privateIntentForDateAffect(affect: MemberDateAffect | undefined): string | null {
  return affect === undefined ? null : (DATE_AFFECT_PRIVATE_INTENTS[affect] ?? null);
}

export function dateAffectHurtsPostDateState(affect: MemberDateAffect | undefined): boolean {
  return affect !== undefined && POST_DATE_STATE_PENALTY_AFFECTS.has(affect);
}
