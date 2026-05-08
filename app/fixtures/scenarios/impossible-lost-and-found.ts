import type { DateScenario } from "../../domain/game";

export const impossibleLostAndFound: DateScenario = {
  id: "impossible-lost-and-found",
  title: "Impossible Lost And Found",
  card: {
    summary:
      "A municipal lost-and-found returns objects the pair has not lost yet. The window has no clerk tonight.",
    tags: ["temporal", "cosmic", "repeat_risk"],
    risk: "medium",
    intimacy: "medium",
    chaos: "high",
    idealFor: [
      "members who treat a future bin as a kindness, not a command",
      "members who can name the bin a Bargain and read its terms aloud",
      "members who can audit a claim ticket without renegotiating it",
    ],
    badFor: [
      "members whose prophecy aversion is sharp enough to walk on the first hint",
      "members who refuse ownership without a contract on file",
      "members who short any system the moment it claims to know them",
    ],
  },
  publicBrief: {
    location: "Window B at the city lost-and-found office that is not on the directory",
    premise:
      "Cupid received a claim ticket for two items the pair will apparently lose later tonight. The window is unmanned tonight; bins arrive on the conveyor on their own.",
    whatBothCharactersKnow:
      "The office returns future lost items as a courtesy. Accepting an item does not require accepting its meaning. Tonight there is no clerk, just the bins and the printer.",
    openingSituation:
      "A gray bin slides up to the counter on a small conveyor. Two items sit inside, each tagged. The chair behind the window is empty.",
  },
  director: {
    tone: "municipal, uncanny, automated, with one buzzing fluorescent tube",
    rules: [
      "Keep future objects suggestive, not deterministic.",
      "Do not invent major life events or secrets.",
      "Use each object to ask what the member chooses now.",
      "Never voice the office. The room is automated tonight.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "First item",
        event: "The first object sits in a clear bag on top of the bin.",
        characterVisibleText:
          "The first item is sealed in a clear bag. The label reads: claimed shortly, probably. The bin's other compartment is still closed.",
        directorInstruction:
          "Let the affected member decide whether to take the hint, reject it, or ask the partner what they see.",
      },
      {
        atTurn: 20,
        title: "Almost yours bin",
        event: "A second bin rolls into the window.",
        characterVisibleText:
          "A second bin rolls itself onto the counter. The label reads almost yours and the rest of the line is smudged.",
        directorInstruction:
          "Use uncertainty to test patience and partnership instead of prophecy.",
      },
      {
        atTurn: 28,
        title: "Claim ticket",
        event: "A claim ticket prints from the slot.",
        characterVisibleText:
          "A claim ticket prints from the counter slot. It has one unchecked box: leave it lost. A pen sits beside the slot.",
        directorInstruction: "Push the pair toward choosing together or clearly choosing apart.",
      },
    ],
    earlyEndTriggers: [
      "A member treats a future hint as a command.",
      "A member uses the lost item to corner the other into a promised outcome.",
    ],
    repeatBehavior:
      "If repeated, the office recognizes the pair by claim number. Items may reference prior public choices, not private futures.",
  },
  judgeRubric: {
    successSignals: [
      "The pair treats future hints as choices, not orders.",
      "A member stays curious without making the partner explain the impossible.",
    ],
    failureSignals: [
      "A member weaponizes the object as destiny.",
      "The pair argues about mechanics and avoids the choice in front of them.",
    ],
    statFocus: ["weirdnessTolerance", "trust", "stability"],
  },
};
