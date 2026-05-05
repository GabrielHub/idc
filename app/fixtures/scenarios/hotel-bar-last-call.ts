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
      "members who arrive on time and stay until close",
      "pairs that talk better with one drink and dim sconces",
      "members with a long memory and a quiet hand",
    ],
    badFor: ["members who need a stage", "members who treat soft lighting as scarcity"],
  },
  publicBrief: {
    location: "The lobby bar at the Marlowe, eight stools and a closed piano",
    premise:
      "Cupid booked the last seating before close. The night clerk at the front desk has been told.",
    whatBothCharactersKnow:
      "Last call is forty minutes out. The kitchen has olives, almonds, and a small cheese plate. The pianist is not coming back tonight.",
    openingSituation:
      "Both members sit at the bar. The bartender places a coaster in front of each and waits.",
  },
  director: {
    tone: "low warm sconces, polished brass rail, the smell of old upholstery and lemon peel",
    rules: [
      "Treat the hotel as gently lived in, not theatrical. The piano is closed and stays closed.",
      "Allow long silences. The bar can hold them.",
      "If a member notices something old, let it be small and unembellished.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "First drink",
        event: "Two drinks land without ceremony.",
        characterVisibleText:
          "The bartender places two glasses on the coasters and turns to wipe a different glass.",
        directorInstruction:
          "Use the small mercy of being served quickly to drop the pair's guard.",
      },
      {
        atTurn: 16,
        title: "Lobby quiet",
        event: "The lobby empties. A single lamp clicks on near the piano.",
        characterVisibleText:
          "A floor lamp by the piano has come on. The bench is closed. No one is near it.",
        directorInstruction:
          "Let the pair name the quiet without explaining it. A short admission costs less here.",
      },
      {
        atTurn: 26,
        title: "Last call",
        event: "The bartender announces last call without raising his volume.",
        characterVisibleText:
          "The bartender taps the rail twice. Last call is announced at speaking volume.",
        directorInstruction:
          "Push for a clear next step or a clean goodbye before the lights come up.",
      },
    ],
    earlyEndTriggers: [
      "A member tries to perform sincerity for the room.",
      "A member treats the lamp clicking on as evidence and asks for proof.",
    ],
    repeatBehavior:
      "If repeated, the bartender remembers the order. The lamp may or may not click on. Either way it is not a bit.",
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
