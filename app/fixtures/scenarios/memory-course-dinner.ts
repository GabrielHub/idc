import type { DateScenario } from "../../domain/game";

export const memoryCourseDinner: DateScenario = {
  id: "memory-course-dinner",
  title: "Memory Course Dinner",
  card: {
    summary: "Every course reveals a childhood memory. The soup is doing personnel work.",
    tags: ["food", "memory", "domestic"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    idealFor: ["emotionally careful members", "pairs with low trust"],
    badFor: ["members who resent forced vulnerability"],
  },
  publicBrief: {
    location: "A private dining room with too many spoons",
    premise:
      "Each course evokes a harmless but revealing memory. Cupid has signed a waiver it did not read.",
    whatBothCharactersKnow:
      "Dinner may surface memories. Serious trauma is out of bounds for the venue.",
    openingSituation:
      "The first bowl arrives covered. Both members smell something from a kitchen they remember.",
  },
  director: {
    tone: "intimate, careful, and oddly well catered",
    rules: [
      "Keep memories emotionally specific but safe.",
      "Do not invent serious injury or death as a reveal.",
      "Let characters refuse a prompt without punishing them automatically.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Soup memory",
        event: "Soup evokes a small domestic memory.",
        characterVisibleText:
          "The soup tastes like a kitchen where someone once asked a careful question.",
        directorInstruction: "Invite a modest memory without forcing confession.",
      },
      {
        atTurn: 16,
        title: "Main course choice",
        event: "The main course changes based on who was listened to last.",
        characterVisibleText:
          "The plates rearrange. The meal appears to have preferences about listening.",
        directorInstruction: "Reward active listening or expose its absence.",
      },
      {
        atTurn: 26,
        title: "Dessert receipt",
        event: "Dessert arrives with a receipt listing one thing each member avoided.",
        characterVisibleText: "Dessert arrives with a receipt titled: items left unsaid.",
        directorInstruction: "Let the pair decide whether one item is worth saying now.",
      },
    ],
    earlyEndTriggers: [
      "A member feels cornered into sharing.",
      "A member mocks a harmless memory that mattered to the other.",
    ],
    repeatBehavior:
      "If repeated, the venue remembers prior courses and may serve a callback only if both members know it.",
  },
  judgeRubric: {
    successSignals: [
      "The pair respects a refusal to share.",
      "A member asks a grounded follow-up question.",
    ],
    failureSignals: [
      "A member treats memory as content to consume.",
      "The date becomes a contest over whose past matters more.",
    ],
    statFocus: ["trust", "chemistry", "relationshipHealth"],
  },
};
