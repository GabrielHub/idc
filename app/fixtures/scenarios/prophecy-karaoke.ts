import type { DateScenario } from "../../domain/game";

export const prophecyKaraoke: DateScenario = {
  id: "prophecy-karaoke",
  title: "Prophecy Karaoke",
  card: {
    summary:
      "A private karaoke room where the screen keeps queuing songs that imply future breakups. The machine denies liability.",
    tags: ["prophecy", "public", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    idealFor: [
      "members who can file a bad prediction and keep their seat",
      "members who break a machine's framing with one literal answer",
      "members whose audit voice can revise a prediction in writing",
    ],
    badFor: [
      "members who hear the word fated and start calling for the check",
      "members who refuse to perform a future on a screen",
      "members who treat predictions as orders and the date as already over",
    ],
  },
  publicBrief: {
    location: "Room 7 at Sing Tomorrow, a private karaoke room with one couch and one tablet",
    premise:
      "The karaoke machine selects songs that imply future romantic problems. The tablet runs the booth; staff stay outside.",
    whatBothCharactersKnow:
      "The predictions are not binding. The machine has strong opinions and weak evidence. The room is theirs for the hour.",
    openingSituation:
      "Both members sit on the couch facing the screen. The tablet rests between them. A song title is already loaded. Neither has touched the tablet.",
  },
  director: {
    tone: "private, tense, and faintly ridiculous",
    rules: [
      "Anchor the date to room 7. The pair stays on the couch with the tablet.",
      "Never treat a prophecy as guaranteed truth.",
      "Use song titles and screen text as pressure without writing real song lyrics.",
      "Let characters push back against the machine.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "First prediction",
        event: "The screen loads a custom breakup title.",
        characterVisibleText:
          "The screen displays: Track 01, We Drift Apart Over Scheduling. The tablet has not been touched. A small countdown reads ten seconds.",
        directorInstruction: "Let the pair decide whether to laugh, object, or panic.",
      },
      {
        atTurn: 20,
        title: "Duet demand",
        event: "The room locks the next menu behind a duet.",
        characterVisibleText:
          "The tablet message reads: duet required for compliance review. The two-mic icons pulse. The next-track menu is greyed out.",
        directorInstruction: "Use the duet choice to test cooperation.",
      },
      {
        atTurn: 28,
        title: "Encore correction",
        event: "The screen offers one encore where they can rename the future.",
        characterVisibleText:
          "The encore screen opens a blank title field and waits. The cursor blinks. Behind it the previous track titles fade by one shade.",
        directorInstruction: "Give the pair a chance to reject the predicted ending.",
      },
    ],
    earlyEndTriggers: [
      "A member feels humiliated in the room.",
      "A member treats the prediction as permission to give up.",
    ],
    repeatBehavior:
      "If repeated, the machine may surface the prior title and ask whether management wants a correction.",
  },
  judgeRubric: {
    successSignals: [
      "The pair rejects a bad prediction together.",
      "A member supports the other through the awkwardness in the room.",
    ],
    failureSignals: [
      "A member lets prophecy replace choice.",
      "The pair blames each other for a machine prompt.",
    ],
    statFocus: ["stability", "spark", "weirdnessTolerance"],
  },
};
