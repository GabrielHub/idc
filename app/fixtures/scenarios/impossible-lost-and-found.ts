import type { DateScenario } from "../../domain/game";

export const impossibleLostAndFound: DateScenario = {
  id: "impossible-lost-and-found",
  title: "Impossible Lost And Found",
  card: {
    summary:
      "A municipal lost-and-found returns objects the pair has not lost yet. The claim ticket looks smug.",
    tags: ["temporal", "cosmic", "repeat_risk"],
    risk: "medium",
    intimacy: "medium",
    chaos: "high",
    idealFor: [
      "weirdness-native members",
      "reality-displaced members",
      "pairs that can choose without calling it fate",
    ],
    badFor: [
      "members who need strict control",
      "members who reject cosmic framing",
      "pairs that treat future hints as orders",
    ],
  },
  publicBrief: {
    location: "Window B at the city lost-and-found office that is not on the directory",
    premise:
      "Cupid received a claim ticket for two items the pair will apparently lose later tonight.",
    whatBothCharactersKnow:
      "The clerk says the office returns future lost items as a courtesy. Accepting an item does not require accepting its meaning.",
    openingSituation:
      "A clerk places a gray bin on the counter and asks which future inconvenience belongs to whom.",
  },
  director: {
    tone: "municipal, uncanny, clerk-led, with one buzzing fluorescent tube",
    rules: [
      "Keep future objects suggestive, not deterministic.",
      "Do not invent major life events or secrets.",
      "Use each object to ask what the member chooses now.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "First item",
        event: "The clerk returns a small object one member has not lost yet.",
        characterVisibleText:
          "The first item is sealed in a clear bag. The label reads: claimed shortly, probably.",
        directorInstruction:
          "Let the affected member decide whether to take the hint, reject it, or ask the partner what they see.",
      },
      {
        atTurn: 16,
        title: "Wrong bin",
        event: "The clerk discovers the second item in a bin labeled Almost Yours.",
        characterVisibleText:
          "The second bin says Almost Yours. The clerk frowns as if this happens every Thursday.",
        directorInstruction:
          "Use uncertainty to test patience and partnership instead of prophecy.",
      },
      {
        atTurn: 26,
        title: "Claim ticket",
        event: "The claim ticket asks whether they want to leave one future thing unclaimed.",
        characterVisibleText:
          "The ticket has one unchecked box: leave it lost. The clerk offers a pen with no pressure and obvious pressure.",
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
