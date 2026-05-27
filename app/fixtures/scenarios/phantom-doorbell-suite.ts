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
    cost: 18,
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
    flow: "set_piece",
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
        pitch:
          "Chime the suite doorbell with an empty corridor on the peephole. Surfaces how steady the pair stays when the room speaks.",
        beat: "The doorbell chimes a single soft tone. The peephole shows an empty corridor and a closed door across the hall.",
        directorBeat:
          "The door just rang and no one is there. Acknowledge it in passing to your date, ignore it on purpose, check the peephole, or keep talking. Show whether you absorb it.",
      },
      {
        id: "phantom-doorbell-suite-event-2",
        title: "Room phone",
        kind: "reveal",
        pitch:
          "Ring the room phone twice with no caller and no message light. Forces the pair toward what they have been circling.",
        beat: "The room phone rings twice and stops. The handset display reads no caller and the message light does not turn on.",
        directorBeat:
          "The phone just rang at nothing. Use the silence after: say the thing you have been circling, ask your date the real question, comment on the no-caller display, or pour a drink. Take the window. Do not voice the phone.",
      },
      {
        id: "phantom-doorbell-suite-event-3",
        title: "Knock at the inner door",
        kind: "provocation",
        pitch:
          "Knock three times on the inner bedroom door from the bedroom side with the bedroom empty. Forces a clean read on staying or naming an exit.",
        beat: "Three soft knocks come from the inner bedroom door. The door is closed and the bedroom beyond it is empty.",
        directorBeat:
          "Something inside the suite just knocked. Walk to the door, refuse to look, ask your date if they want to leave, or stay seated. Make the call.",
      },
      {
        id: "phantom-doorbell-suite-event-4",
        title: "Bedroom TV",
        kind: "ambient",
        pitch:
          "Turn the bedroom TV on with no input and a blue glow under the door. Surfaces a soft cue that does not need decoding.",
        beat: "Through the gap under the inner door, a soft blue glow appears. The bedroom TV has turned on with no sound. The remote is on the coffee table beside the welcome plate.",
        directorBeat:
          "A screen just turned on for no one. Glance at the glow, comment to your date on the remote staying here, ignore the strip of light, or pick the remote up. Do not decode it.",
      },
      {
        id: "phantom-doorbell-suite-event-5",
        title: "Lamp pulse",
        kind: "reveal",
        pitch:
          "Click the reading lamp off and back on with no flicker. Surfaces a habit a member has not named when they narrate it.",
        beat: "The reading lamp by the couch clicks off and clicks back on. The bulb does not flicker. The light is exactly the same.",
        directorBeat:
          "The lamp blinked you out and back. Note it casually, ignore it, comment on the exact match, or check the bulb. Speak only from your own register. Do not voice the lamp.",
      },
      {
        id: "phantom-doorbell-suite-event-6",
        title: "Mints rearrange",
        kind: "reveal",
        pitch:
          "Quietly rearrange the mints on the welcome plate with nothing else changed. Surfaces whether the pair laughs together or splits on it.",
        beat: "The two mints on the welcome plate sit in a different pattern than they did a minute ago. The plate has not moved. Nothing else is missing.",
        directorBeat:
          "The mints just moved. Laugh about it with your date, push the plate aside, comment on the petty haunting, or stay focused on the conversation. Show whether the absurd lands the same on both.",
      },
      {
        id: "phantom-doorbell-suite-event-7",
        title: "Hallway crackle",
        kind: "ambient",
        pitch:
          "Clip a distant intercom voice once and cut it off mid-syllable with the camera unchanged. Surfaces a small distant world without making it a topic.",
        beat: "A faint intercom voice crackles in the hallway and cuts off mid-syllable. The hallway camera shows nothing changed. The room phone does not ring.",
        directorBeat:
          "Something far off just spoke at you for half a word. Let it stay distant, comment on the cut-off if you must, glance at the camera, or keep talking. Do not voice the intercom.",
      },
      {
        id: "phantom-doorbell-suite-event-8",
        title: "Blinds shift",
        kind: "provocation",
        pitch:
          "Shift the blinds one slat down with the street still and the building hum a quarter tone off. Forces a clean read on staying or naming an exit.",
        beat: "The blinds across the suite window shift one slat downward. The street outside is still. The hum of the building shifts a quarter tone.",
        directorBeat:
          "The window just adjusted itself. Comment on the slat, propose leaving, ask your date how they want to handle the night, or step closer to look out. Make a call.",
      },
      {
        id: "phantom-doorbell-suite-event-9",
        title: "Inner door cracks",
        kind: "provocation",
        pitch:
          "Open the inner bedroom door a hand's width on its own with the TV glow cutting across the carpet. Forces a clean physical move.",
        beat: "The inner bedroom door slips open a hand's width and stops. The blue glow from the TV cuts a strip across the carpet. The peephole on the suite door is dark again.",
        directorBeat:
          "The room just invited you in. Close the door together, look in, ask your date if they want to take the suite for the night anyway, or call the front desk. Move physically. Do not voice the door.",
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
