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
    events: [
      {
        id: "prophecy-karaoke-event-1",
        title: "First prediction",
        event: "The screen loads a custom breakup title.",
        characterVisibleText:
          "The screen displays: Track 01, We Drift Apart Over Scheduling. The tablet has not been touched. A small countdown reads ten seconds.",
        directorInstruction: "Let the pair decide whether to laugh, object, or panic.",
      },
      {
        id: "prophecy-karaoke-event-2",
        title: "Duet demand",
        event: "The room locks the next menu behind a duet.",
        characterVisibleText:
          "The tablet message reads: duet required for compliance review. The two-mic icons pulse. The next-track menu is greyed out.",
        directorInstruction: "Use the duet choice to test cooperation.",
      },
      {
        id: "prophecy-karaoke-event-3",
        title: "Encore correction",
        event: "The screen offers one encore where they can rename the future.",
        characterVisibleText:
          "The encore screen opens a blank title field and waits. The cursor blinks. Behind it the previous track titles fade by one shade.",
        directorInstruction: "Give the pair a chance to reject the predicted ending.",
      },
      {
        id: "prophecy-karaoke-event-4",
        title: "Volume nudges up",
        event: "The room volume rises by itself.",
        characterVisibleText:
          "The room speakers nudge the volume up two notches. The screen displays: ambient pressure level adjusted. The tablet shows a small unmute icon.",
        directorInstruction:
          "Use the small ambient pressure to test whether either of them flinches at being heard.",
      },
      {
        id: "prophecy-karaoke-event-5",
        title: "Mic feedback",
        event: "One mic squelches once on the table.",
        characterVisibleText:
          "One of the two mics on the table squelches and goes quiet. The tablet displays: feedback adjusted, voice still welcome. Neither member has picked it up.",
        directorInstruction:
          "Let the small noise pass without explanation. The mic is still there.",
      },
      {
        id: "prophecy-karaoke-event-6",
        title: "Score reveal",
        event: "The screen flashes a score for honesty.",
        characterVisibleText:
          "The screen flashes a number: 78 honesty score, last recorded by this room. The tablet displays: machine has weak evidence and strong opinions.",
        directorInstruction:
          "Allow the pair to mock the score together or to sit with it without contesting it.",
      },
      {
        id: "prophecy-karaoke-event-7",
        title: "Lights cycle",
        event: "The room lights cycle warm and back.",
        characterVisibleText:
          "The room lights cycle warm for two beats and return to normal. The tablet displays: mood lighting suggested by the machine, please disregard.",
        directorInstruction:
          "Use the small staged moment to test whether either of them performs for the room or for the partner.",
      },
      {
        id: "prophecy-karaoke-event-8",
        title: "Tablet timeout",
        event: "The tablet asks if they are still here.",
        characterVisibleText:
          "The tablet displays: still in this room? A small countdown reads thirty seconds. The room lights are level. The mics are at rest.",
        directorInstruction:
          "Push for a clean answer to the room. Either staying or leaving is the right answer.",
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
