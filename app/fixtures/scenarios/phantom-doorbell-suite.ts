import type { DateScenario } from "../../domain/game";

export const phantomDoorbellSuite: DateScenario = {
  id: "phantom-doorbell-suite",
  title: "Phantom Doorbell Suite",
  card: {
    summary:
      "A hotel suite where bells, knocks, and the room phone keep going off, and no one is ever there.",
    tags: ["cosmic", "domestic", "repeat_risk"],
    risk: "high",
    intimacy: "high",
    chaos: "high",
    idealFor: [
      "members who let unexplained sound stay unexplained",
      "members who can hold a thread when the room raises its voice",
      "pairs whose silences are already comfortable before the first bell",
    ],
    badFor: [
      "members whose anxious spiral fills any silence the room leaves",
      "members who read every interruption as an omen pointing somewhere",
      "members who treat unexplained signals as surveillance to be solved",
    ],
  },
  publicBrief: {
    location: "A two-room hotel suite booked under a name the front desk cannot find",
    premise:
      "Cupid put the pair in a private suite for the night. The room is a known case file in the hotel's incident log. The bell system has opinions.",
    whatBothCharactersKnow:
      "The hallway is empty. The phone line is internal only. The interruptions do not mean a person is at the door.",
    openingSituation:
      "Both members sit on opposite ends of a low couch. A welcome plate sits between them and the doorbell has not rung yet.",
  },
  director: {
    tone: "soft hotel lighting, recycled air, faint hallway hum, the suite trying to seem normal",
    rules: [
      "Treat each interruption as a thing the room does, not a person at the door.",
      "Never voice a hallway visitor. The hallway stays empty.",
      "Use the interruption to test whether the pair stays in the conversation or treats the noise as the subject.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "First doorbell",
        event: "The suite doorbell chimes once. The hallway camera shows nothing.",
        characterVisibleText:
          "The doorbell chimes a single soft tone. The peephole shows an empty corridor and a closed door across the hall.",
        directorInstruction:
          "Let the pair acknowledge the chime in passing or absorb it. Either reveals how steady they are.",
      },
      {
        atTurn: 20,
        title: "Room phone",
        event: "The room phone rings on the side table. The display reads no caller.",
        characterVisibleText:
          "The room phone rings twice and stops. The handset display reads no caller and the message light does not turn on.",
        directorInstruction:
          "Use the silence after the rings to push the pair toward saying the thing they have been circling.",
      },
      {
        atTurn: 28,
        title: "Knock at the inner door",
        event: "Three knocks land on the inner bedroom door from the bedroom side.",
        characterVisibleText:
          "Three soft knocks come from the inner bedroom door. The door is closed and the bedroom beyond it is empty.",
        directorInstruction:
          "Push for a clean read on whether the pair stays in the suite together or names a clean exit.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the interruptions as proof the partner is hiding someone.",
      "A member uses the noise to perform fear instead of speaking to the partner.",
    ],
    repeatBehavior:
      "If repeated, the suite log notes the pair. The interruptions land at the same beats and Cupid considers this a feature of the room.",
  },
  judgeRubric: {
    successSignals: [
      "The pair keeps the conversation going through an interruption.",
      "A member names what they wanted to say before the bell or after.",
    ],
    failureSignals: [
      "The pair lets the noise become the only topic.",
      "A member uses the interruption to dodge a direct question.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
