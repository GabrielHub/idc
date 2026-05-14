import type { DateScenario } from "../../domain/game";

export const hotelBarLastCall: DateScenario = {
  id: "hotel-bar-last-call",
  title: "Hotel Bar, Last Call",
  card: {
    summary:
      "Two stools at a residential hotel bar after the band has packed up. The ice machine hums. The pianist has gone home.",
    tags: ["food", "haunted", "low_pressure"],
    risk: "low",
    intimacy: "high",
    chaos: "low",
    cost: 12,
    idealFor: [
      "members whose stoic clipped voice fits a closed piano and a brass rail",
      "members who already live in old rooms and recognize the room's quiet",
      "members whose warm steady voice can carry a long pause without filling it",
      "members with a long memory and a quiet hand",
    ],
    badFor: [
      "members who will film the lamp clicking on and ruin the room",
      "members with no audience and no patience for sharing the brass rail",
      "members whose silence anxiety will drown the bell taps",
    ],
  },
  publicBrief: {
    location: "The lobby bar at the Marlowe, eight stools and a closed piano",
    premise:
      "Cupid booked the last seating before close. The night clerk at the front desk has been told.",
    whatBothCharactersKnow:
      "Last call is forty minutes out. The kitchen has olives, almonds, and a small cheese plate. The pianist is not coming back tonight.",
    openingSituation:
      "Both members sit at the bar. Two coasters are already in front of them. The bartender is wiping a glass at the far end.",
  },
  director: {
    tone: "low warm sconces, polished brass rail, the smell of old upholstery and lemon peel",
    rules: [
      "Treat the hotel as gently lived in, not theatrical. The piano is closed and stays closed.",
      "Allow long silences. The bar can hold them.",
      "Use room cues, not the bartender's voice. The bartender is a pair of hands.",
    ],
    events: [
      {
        id: "hotel-bar-last-call-event-1",
        title: "First drink",
        kind: "ambient",
        event: "Two drinks land without ceremony.",
        characterVisibleText:
          "The bartender places two glasses on the coasters and turns to wipe a different glass. Two slim straws lean against the rim.",
        directorInstruction:
          "Use the small mercy of being served quickly to drop the pair's guard. The bartender does not speak.",
      },
      {
        id: "hotel-bar-last-call-event-2",
        title: "Lobby quiet",
        kind: "reveal",
        event: "The lobby empties. A single lamp clicks on near the piano.",
        characterVisibleText:
          "A floor lamp by the piano clicks on. The bench is closed. No one is near it. The lobby clock reads ten of the hour.",
        directorInstruction:
          "Let the pair name the quiet without explaining it. A short admission costs less here. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hotel-bar-last-call-event-3",
        title: "Last call",
        kind: "provocation",
        event: "The brass rail bell taps twice down the bar.",
        characterVisibleText:
          "The brass rail bell taps twice down the bar. The kitchen pass-through goes dark. The cheese plate is taken away in one quiet pass.",
        directorInstruction:
          "Push for a clear next step or a clean goodbye before the lights come up.",
      },
      {
        id: "hotel-bar-last-call-event-4",
        title: "Ice machine pause",
        kind: "ambient",
        event: "The ice machine behind the bar quiets for a beat.",
        characterVisibleText:
          "The ice machine behind the bar quiets for the first time tonight. The ambient hum drops by half. The bartender's wiping cloth makes the only sound.",
        directorInstruction:
          "Allow the silence to be the room's, not theirs. A member who fills it gives themselves away. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hotel-bar-last-call-event-5",
        title: "Coaster swap",
        kind: "reveal",
        event: "Fresh coasters slide onto the brass rail.",
        characterVisibleText:
          "The bartender slides two fresh coasters in front of them and lifts the old ones in one move. A small cocktail napkin lands beside one glass. The lemon peel from earlier is gone.",
        directorInstruction:
          "Use the small reset to surface whether either member treats reset as care. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hotel-bar-last-call-event-6",
        title: "Lobby crossing",
        kind: "ambient",
        event: "Someone crosses the lobby toward the elevators.",
        characterVisibleText:
          "A guest in a wool coat crosses the lobby toward the elevators. He carries a small leather valise. He does not look at the bar. The lobby clock now reads quarter past.",
        directorInstruction:
          "Let the lone passerby pass. The bar can hold them inside their conversation. Do not voice the guest.",
      },
      {
        id: "hotel-bar-last-call-event-7",
        title: "Glass swap",
        kind: "reveal",
        event: "The bartender swaps a glass for a clean one without comment.",
        characterVisibleText:
          "The bartender lifts one of their glasses, replaces it with a fresh one, and refills it to the same line. The motion takes four seconds. He does not catch their eye.",
        directorInstruction:
          "Use the unprompted mercy to test how each receives small kindness from a stranger. The bartender does not speak.",
      },
      {
        id: "hotel-bar-last-call-event-8",
        title: "Sconces up",
        kind: "provocation",
        event: "The wall sconces brighten by one notch.",
        characterVisibleText:
          "The wall sconces lift by one notch. The brass rail is now clearly visible end to end. Two coasters and a folded check sit at the far stool.",
        directorInstruction: "Push for one clean line before the bar tilts toward closing.",
      },
      {
        id: "hotel-bar-last-call-event-9",
        title: "Stools up",
        kind: "provocation",
        event: "The bartender flips the far stools onto the bar one at a time.",
        characterVisibleText:
          "At the far end of the bar, the bartender flips the first stool upside down onto the rail. The second follows. The folded check at the far stool is set on top of the brass between them and the door.",
        directorInstruction:
          "Push for a clean exit move: settle the check, take a last sip together, or split the stools. The bar is closing one stool at a time. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member tries to perform sincerity for the room.",
      "A member treats the lamp clicking on as evidence and asks for proof.",
    ],
    repeatBehavior:
      "If repeated, the bartender sets the same drinks without checking. The lamp may or may not click on. Either way it is not a bit.",
  },
  judgeRubric: {
    successSignals: [
      "A member lets a long silence sit without filling it.",
      "The pair names something old together without mocking it.",
    ],
    failureSignals: [
      "A member uses the soft lighting as cover for a confession that asks too much.",
      "A member treats the staff as theatrical scenery.",
    ],
    statFocus: ["trust", "chemistry", "relationshipHealth"],
  },
};
