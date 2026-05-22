import type {
  DateFinalReport,
  DateSession,
  MatchmakingIntent,
  MatchmakingIntentOutcome,
} from "../domain/game";

export const MATCHMAKING_INTENTS: readonly MatchmakingIntent[] = [
  "comfort",
  "spark",
  "surface",
  "repair",
  "swing",
];

export const MATCHMAKING_INTENT_LABEL: Record<MatchmakingIntent, string> = {
  comfort: "Give them comfort",
  spark: "Test the spark",
  surface: "Surface the hard thing",
  repair: "Repair pressure",
  swing: "Take a swing",
};

export const MATCHMAKING_INTENT_SHORT_LABEL: Record<MatchmakingIntent, string> = {
  comfort: "Comfort",
  spark: "Spark",
  surface: "Surface",
  repair: "Repair",
  swing: "Swing",
};

export const MATCHMAKING_INTENT_TOOLTIP: Record<MatchmakingIntent, string> = {
  comfort:
    "You want this room to feel safe. Cupid will judge it by whether the pair settled, not whether they sparked.",
  spark:
    "You want to see if heat is real. Cupid will judge it by whether they clear the booking line, not whether they stayed steady.",
  surface:
    "You want the hard thing in the room. Cupid will judge it by whether real friction landed on the record, not by whether the date was pleasant.",
  repair:
    "You want pressure to come down. Cupid will judge it by whether strain eased, not by whether the booking advanced.",
  swing:
    "You know this is a gamble. Cupid will judge it by whether the long shot paid, not by whether the math agreed.",
};

export const MATCHMAKING_INTENT_PROMPT =
  "Why this booking? Optional. Cupid uses your read to phrase the post-date note.";

export const MATCHMAKING_INTENT_OUTCOME_LABEL: Record<MatchmakingIntentOutcome, string> = {
  supported: "The room supported that read.",
  mixed: "The room half-supported that read.",
  unsupported: "The room didn't support that read.",
};

const INTENT_SENTENCE: Record<MatchmakingIntent, string> = {
  comfort: "Cupid booked this as a comfort read.",
  spark: "Cupid booked this as a spark test.",
  surface: "Cupid booked this to surface the hard thing.",
  repair: "Cupid booked this as a repair attempt.",
  swing: "Cupid booked this as a swing.",
};

export function intentEchoLine(
  intent: MatchmakingIntent,
  outcome: MatchmakingIntentOutcome,
): string {
  return `${INTENT_SENTENCE[intent]} ${MATCHMAKING_INTENT_OUTCOME_LABEL[outcome]}`;
}

export type DeriveIntentOutcomeInput = {
  intent: MatchmakingIntent;
  outcome: DateFinalReport["outcome"];
  session: Pick<DateSession, "judgeSnapshots" | "dateHealth" | "endSentiment">;
};

export function deriveIntentOutcome({
  intent,
  outcome,
  session,
}: DeriveIntentOutcomeInput): MatchmakingIntentOutcome {
  switch (intent) {
    case "comfort":
      if (outcome === "second_date" || outcome === "mixed") return "supported";
      if (outcome === "bad_fit" || outcome === "early_end") return "unsupported";
      return "mixed";
    case "spark":
      if (outcome === "second_date" && session.dateHealth >= 60) return "supported";
      if (outcome === "bad_fit" || outcome === "early_end") return "unsupported";
      return "mixed";
    case "surface": {
      const surfacedFriction = session.judgeSnapshots.some(
        (snapshot) =>
          (snapshot.statDeltas?.conflict ?? 0) > 0 || (snapshot.statDeltas?.strain ?? 0) > 0,
      );
      if (surfacedFriction) return "supported";
      if (outcome === "second_date") return "unsupported";
      return "mixed";
    }
    case "repair": {
      const easedStrain = session.judgeSnapshots.some(
        (snapshot) => (snapshot.statDeltas?.strain ?? 0) < 0,
      );
      if (easedStrain && outcome !== "early_end" && outcome !== "bad_fit") return "supported";
      if (outcome === "early_end" || outcome === "bad_fit") return "unsupported";
      return "mixed";
    }
    case "swing":
      if (outcome === "second_date") return "supported";
      if (outcome === "bad_fit") return "unsupported";
      return "mixed";
  }
}
