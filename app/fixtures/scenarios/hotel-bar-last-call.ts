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
    beats: [
      {
        atTurn: 10,
        title: "First drink",
        event: "Two drinks land without ceremony.",
        characterVisibleText:
          "The bartender places two glasses on the coasters and turns to wipe a different glass. Two slim straws lean against the rim.",
        directorInstruction:
          "Use the small mercy of being served quickly to drop the pair's guard.",
      },
      {
        atTurn: 20,
        title: "Lobby quiet",
        event: "The lobby empties. A single lamp clicks on near the piano.",
        characterVisibleText:
          "A floor lamp by the piano clicks on. The bench is closed. No one is near it. The lobby clock reads ten of the hour.",
        directorInstruction:
          "Let the pair name the quiet without explaining it. A short admission costs less here.",
      },
      {
        atTurn: 28,
        title: "Last call",
        event: "The brass rail bell taps twice down the bar.",
        characterVisibleText:
          "The brass rail bell taps twice down the bar. The kitchen pass-through goes dark. The cheese plate is taken away in one quiet pass.",
        directorInstruction:
          "Push for a clear next step or a clean goodbye before the lights come up.",
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
