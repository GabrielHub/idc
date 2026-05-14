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
    cost: 6,
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
    events: [
      {
        id: "park-loop-with-a-dog-event-1",
        title: "The dog picks a side",
        kind: "reveal",
        event: "The dog leans hard against one member's leg.",
        characterVisibleText:
          "The leash slackens against the bench arm. The dog leans its full weight against one member's shin and exhales.",
        directorInstruction:
          "Use the dog's preference to surface a real reaction without scoring points.",
      },
      {
        id: "park-loop-with-a-dog-event-2",
        title: "Geese pass",
        kind: "ambient",
        event: "A line of geese crosses the path in front of the bench.",
        characterVisibleText:
          "Six geese cross the paved path in single file. The dog's ears go up but it does not stand. A runner pauses to wait for them.",
        directorInstruction:
          "Let the small interruption open a window for a quieter question. The runner does not speak.",
      },
      {
        id: "park-loop-with-a-dog-event-3",
        title: "Handler waves",
        kind: "provocation",
        event: "The dog handler waves from the parking lot.",
        characterVisibleText:
          "The handler at the parking lot raises a hand. The dog has not noticed. The light has turned the kind of orange that says one hour.",
        directorInstruction:
          "Push for a clear next step before the dog goes back to its second job. The handler does not speak.",
      },
      {
        id: "park-loop-with-a-dog-event-4",
        title: "Runner waves",
        kind: "ambient",
        event: "A jogger waves on a second pass.",
        characterVisibleText:
          "A jogger they passed earlier comes back around and waves on her second loop. The wave is small. The dog watches her shoes go by and resettles.",
        directorInstruction:
          "Let the small recurring stranger be familiar without being a topic. The bench can hold both. The jogger does not speak.",
      },
      {
        id: "park-loop-with-a-dog-event-5",
        title: "Leash slack",
        kind: "reveal",
        event: "The leash drops further off the bench arm.",
        characterVisibleText:
          "The leash slides off the bench arm and lands on the gravel. The clip rests against the dog's collar without tension. The dog has decided it lives here now.",
        directorInstruction:
          "Use the small slack to surface trust or vigilance about the dog without scoring either.",
      },
      {
        id: "park-loop-with-a-dog-event-6",
        title: "Acorn drop",
        kind: "ambient",
        event: "An acorn falls onto the slatted bench.",
        characterVisibleText:
          "An acorn drops from the tree behind them and bounces once off a slat. The dog ears flick. The acorn rolls into the grass.",
        directorInstruction: "Let the small startle pass without making it a moment of impact.",
      },
      {
        id: "park-loop-with-a-dog-event-7",
        title: "Sun shifts",
        kind: "reveal",
        event: "The sun moves behind a pine and the bench cools.",
        characterVisibleText:
          "The sun slides behind a pine and the bench loses its warmth. Both members feel it together. The dog leans more heavily into one shin.",
        directorInstruction:
          "Allow the small physical change to surface a small honest preference about staying.",
      },
      {
        id: "park-loop-with-a-dog-event-8",
        title: "Dog stretches",
        kind: "provocation",
        event: "The dog stretches and resettles facing the parking lot.",
        characterVisibleText:
          "The dog stretches with a small groan and resettles facing the parking lot. The handler raises his hand again from the truck. The leash has not been picked up.",
        directorInstruction: "Push for a clean ending. The dog is on the clock and so are they.",
      },
      {
        id: "park-loop-with-a-dog-event-9",
        title: "Sprinkler hour",
        kind: "provocation",
        event: "The path sprinklers click on at the loop's south end.",
        characterVisibleText:
          "A click runs through the irrigation line. The path sprinklers at the south end of the loop hiss to life and start their arc. Spray reaches the gravel six paces from the bench.",
        directorInstruction:
          "Push for a clean physical move: shift the bench, walk the dog out, or hand the leash off. The arc will reach them in under a minute.",
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
