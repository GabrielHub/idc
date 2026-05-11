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
    events: [
      {
        id: "phantom-doorbell-suite-event-1",
        title: "First doorbell",
        kind: "ambient",
        event: "The suite doorbell chimes once. The hallway camera shows nothing.",
        characterVisibleText:
          "The doorbell chimes a single soft tone. The peephole shows an empty corridor and a closed door across the hall.",
        directorInstruction:
          "Let the pair acknowledge the chime in passing or absorb it. Either reveals how steady they are.",
      },
      {
        id: "phantom-doorbell-suite-event-2",
        title: "Room phone",
        kind: "reveal",
        event: "The room phone rings on the side table. The display reads no caller.",
        characterVisibleText:
          "The room phone rings twice and stops. The handset display reads no caller and the message light does not turn on.",
        directorInstruction:
          "Use the silence after the rings to push the pair toward saying the thing they have been circling. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "phantom-doorbell-suite-event-3",
        title: "Knock at the inner door",
        kind: "provocation",
        event: "Three knocks land on the inner bedroom door from the bedroom side.",
        characterVisibleText:
          "Three soft knocks come from the inner bedroom door. The door is closed and the bedroom beyond it is empty.",
        directorInstruction:
          "Push for a clean read on whether the pair stays in the suite together or names a clean exit.",
      },
      {
        id: "phantom-doorbell-suite-event-4",
        title: "Bedroom TV",
        kind: "ambient",
        event: "The bedroom TV turns on without input.",
        characterVisibleText:
          "Through the gap under the inner door, a soft blue glow appears. The bedroom TV has turned on with no sound. The remote is on the coffee table beside the welcome plate.",
        directorInstruction:
          "Allow the soft cue to land without interpretation. The pair does not need to decode it.",
      },
      {
        id: "phantom-doorbell-suite-event-5",
        title: "Lamp pulse",
        kind: "reveal",
        event: "The reading lamp clicks off and back on.",
        characterVisibleText:
          "The reading lamp by the couch clicks off and clicks back on. The bulb does not flicker. The light is exactly the same.",
        directorInstruction:
          "Let the small mechanical loop pass. A member who narrates it gives themselves away on a habit they have not named.",
      },
      {
        id: "phantom-doorbell-suite-event-6",
        title: "Mints rearrange",
        kind: "reveal",
        event: "The mints on the welcome plate rearrange themselves.",
        characterVisibleText:
          "The two mints on the welcome plate sit in a different pattern than they did a minute ago. The plate has not moved. Nothing else is missing.",
        directorInstruction:
          "Use the absurd small fact to test whether they laugh together or split on it.",
      },
      {
        id: "phantom-doorbell-suite-event-7",
        title: "Hallway crackle",
        kind: "ambient",
        event: "A distant intercom voice clips once and stops.",
        characterVisibleText:
          "A faint intercom voice crackles in the hallway and cuts off mid-syllable. The hallway camera shows nothing changed. The room phone does not ring.",
        directorInstruction:
          "Let the distant world stay distant. The conversation belongs to the suite. Do not voice the intercom as a continuing speaker.",
      },
      {
        id: "phantom-doorbell-suite-event-8",
        title: "Blinds shift",
        kind: "provocation",
        event: "The blinds across the window shift one slat.",
        characterVisibleText:
          "The blinds across the suite window shift one slat downward. The street outside is still. The hum of the building shifts a quarter tone.",
        directorInstruction:
          "Push for a clean read on whether they stay through the night or name a clean exit.",
      },
      {
        id: "phantom-doorbell-suite-event-9",
        title: "Inner door cracks",
        kind: "provocation",
        event: "The inner bedroom door swings open a hand's width on its own.",
        characterVisibleText:
          "The inner bedroom door slips open a hand's width and stops. The blue glow from the TV cuts a strip across the carpet. The peephole on the suite door is dark again.",
        directorInstruction:
          "Push for a clean physical move: close the door together, look in, or call the suite for the night.",
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
