import type { DateScenario } from "../../domain/game";

export const parkLoopWithADog: DateScenario = {
  id: "park-loop-with-a-dog",
  title: "Park Bench With A Dog",
  card: {
    summary: "One bench at the lake overlook, one borrowed dog, one paved loop visible from here.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who already love dogs and treat their names as a love language",
      "members who can sit on a bench without project managing the geese",
      "members whose spiral has somewhere to land on a paved loop",
      "members who can listen across a bench without rushing the moment",
    ],
    badFor: [
      "members who consider a leash a personal slight",
      "members who read an open path as exposure",
      "members who cannot find an audience among waterfowl",
    ],
  },
  publicBrief: {
    location: "The lake overlook bench at the east loop, Lakeside Park",
    premise:
      "Cupid arranged a sit. The dog belongs to a Cupid contractor and is on its second job today. The handler is at the parking lot, not at the bench.",
    whatBothCharactersKnow:
      "The bench overlooks the loop. Geese pass on the path. Cupid certifies the geese are not a metaphor. The geese are not consulted on this certification.",
    openingSituation:
      "Both members sit on the lake overlook bench. The dog has already chosen one of them and is at their feet. The leash is looped on the bench arm.",
  },
  director: {
    tone: "fresh air, ambient runners, approximately one hour of natural light",
    rules: [
      "Anchor the date to the bench. The pair watches the loop, they do not walk the loop.",
      "Treat weather and geese as flavor, not omens.",
      "Use the dog's small choices as ambient pressure, not stage cues.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "The dog picks a side",
        event: "The dog leans hard against one member's leg.",
        characterVisibleText:
          "The leash slackens against the bench arm. The dog leans its full weight against one member's shin and exhales.",
        directorInstruction:
          "Use the dog's preference to surface a real reaction without scoring points.",
      },
      {
        atTurn: 20,
        title: "Geese pass",
        event: "A line of geese crosses the path in front of the bench.",
        characterVisibleText:
          "Six geese cross the paved path in single file. The dog's ears go up but it does not stand. A runner pauses to wait for them.",
        directorInstruction: "Let the small interruption open a window for a quieter question.",
      },
      {
        atTurn: 28,
        title: "Handler waves",
        event: "The dog handler waves from the parking lot.",
        characterVisibleText:
          "The handler at the parking lot raises a hand. The dog has not noticed. The light has turned the kind of orange that says one hour.",
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
      "The pair finds a rhythm sitting and talking without forcing either.",
      "A member treats the dog with care without making it the date.",
    ],
    failureSignals: [
      "A member uses the bench to dodge a real question.",
      "The pair argues over whether to leave the bench.",
    ],
    statFocus: ["trust", "spark", "relationshipHealth"],
  },
};
