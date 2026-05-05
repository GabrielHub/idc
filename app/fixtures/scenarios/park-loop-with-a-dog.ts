import type { DateScenario } from "../../domain/game";

export const parkLoopWithADog: DateScenario = {
  id: "park-loop-with-a-dog",
  title: "Park Loop With A Dog",
  card: {
    summary: "A 35 minute paved loop, one borrowed dog, one bench at minute 22.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who think better while moving",
      "members who like dogs",
      "pairs avoiding eye contact for now",
    ],
    badFor: ["members who treat outdoor weather as an omen", "members who refuse to share a leash"],
  },
  publicBrief: {
    location: "The east loop at Lakeside Park",
    premise:
      "Cupid arranged a walk. The dog belongs to a Cupid contractor and is on its second job today.",
    whatBothCharactersKnow:
      "Cupid certifies the geese are not a metaphor. The geese are not consulted on this certification.",
    openingSituation:
      "Both members meet at the loop start. The dog has already chosen one of them.",
  },
  director: {
    tone: "fresh air, ambient runners, approximately one hour of natural light",
    rules: [
      "Use walking pace to surface or hide what the pair would not say sitting still.",
      "Treat weather and geese as flavor, not omens.",
      "Honor a member who wants to keep walking instead of sit.",
    ],
    beats: [
      {
        atTurn: 8,
        title: "The dog picks",
        event: "The dog refuses to walk near one of them and pulls toward the other.",
        characterVisibleText: "The leash tightens. The dog has made a choice with both eyebrows.",
        directorInstruction:
          "Use the dog's preference to surface a real reaction without scoring points.",
      },
      {
        atTurn: 18,
        title: "Bench at minute 22",
        event: "They reach a bench. Sitting is optional.",
        characterVisibleText:
          "A bench appears with two dry slats. The dog sits without being asked.",
        directorInstruction: "Let the pair choose to rest or to keep moving. Both are valid.",
      },
      {
        atTurn: 28,
        title: "Loop closes",
        event: "They return to where they started. The contractor is waiting for the dog.",
        characterVisibleText:
          "The east loop returns them to the parking lot. A handler waves and points at the dog.",
        directorInstruction:
          "Push for a clear next step before the dog goes back to its second job.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the dog as a prop instead of a creature.",
      "A member uses the open setting to avoid arriving at any topic.",
    ],
    repeatBehavior:
      "If repeated, the dog may remember them. The contractor charges Cupid by the half hour and is willing.",
  },
  judgeRubric: {
    successSignals: [
      "The pair finds a rhythm walking and talking without forcing either.",
      "A member treats the dog with care without making it the date.",
    ],
    failureSignals: [
      "A member uses motion to dodge a real question.",
      "The pair argues over which way to walk the loop.",
    ],
    statFocus: ["trust", "spark", "relationshipHealth"],
  },
};
