import type { DateScenario } from "../../domain/game";

export const prophecyKaraoke: DateScenario = {
  id: "prophecy-karaoke",
  title: "Prophecy Karaoke",
  card: {
    summary:
      "Karaoke where the songs keep predicting future breakups. The machine denies liability.",
    tags: ["prophecy", "public", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    idealFor: ["members who can reject fate", "high weirdness tolerance"],
    badFor: ["prophecy-averse members", "members who hate public performance"],
  },
  publicBrief: {
    location: "Room 7 at Sing Tomorrow",
    premise: "The karaoke machine selects songs that imply future romantic problems.",
    whatBothCharactersKnow:
      "The predictions are not binding. The machine has strong opinions and weak evidence.",
    openingSituation:
      "The first song loads before anyone touches the tablet. The title is unhelpfully specific.",
  },
  director: {
    tone: "public, tense, and faintly ridiculous",
    rules: [
      "Never treat a prophecy as guaranteed truth.",
      "Use song titles and lyrics as pressure without writing real song lyrics.",
      "Let characters push back against the machine.",
    ],
    beats: [
      {
        atTurn: 4,
        title: "First prediction",
        event: "The karaoke machine selects a breakup song with a custom title.",
        characterVisibleText: "The screen displays: Track 01, We Drift Apart Over Scheduling.",
        directorInstruction: "Let the pair decide whether to laugh, object, or panic.",
      },
      {
        atTurn: 14,
        title: "Duet demand",
        event: "The room will not unlock the next menu until they pick a duet.",
        characterVisibleText: "The tablet says: duet required for compliance review.",
        directorInstruction: "Use the duet choice to test cooperation.",
      },
      {
        atTurn: 24,
        title: "Encore correction",
        event: "The machine offers one encore where they can rename the future.",
        characterVisibleText: "The encore screen opens a blank title field and waits.",
        directorInstruction: "Give the pair a chance to reject the predicted ending.",
      },
    ],
    earlyEndTriggers: [
      "A member feels humiliated in public.",
      "A member treats the prediction as permission to give up.",
    ],
    repeatBehavior:
      "If repeated, the machine may remember the prior title and ask whether management wants a correction.",
  },
  judgeRubric: {
    successSignals: [
      "The pair rejects a bad prediction together.",
      "A member supports the other through public awkwardness.",
    ],
    failureSignals: [
      "A member lets prophecy replace choice.",
      "The pair blames each other for a machine prompt.",
    ],
    statFocus: ["stability", "spark", "weirdnessTolerance"],
  },
};
