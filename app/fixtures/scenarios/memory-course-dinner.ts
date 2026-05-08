import type { DateScenario } from "../../domain/game";

export const memoryCourseDinner: DateScenario = {
  id: "memory-course-dinner",
  title: "Memory Course Dinner",
  card: {
    summary:
      "Every plate at the table evokes a childhood memory. The room is doing personnel work.",
    tags: ["food", "memory", "domestic"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    idealFor: [
      "members whose grounded warmth handles a memory plate without spectacle",
      "members who can let a careful question land at their own pace",
      "members who treat a kitchen memory as a fact, not a confession",
    ],
    badFor: [
      "members whose grief is too fresh to sit beside a plate that knows it",
      "members who will turn the receipt into copy",
      "members who treat a memory as content to harvest",
    ],
  },
  publicBrief: {
    location: "A two-seat private dining alcove with too many spoons",
    premise:
      "Each plate served at this table evokes a harmless but revealing memory. Cupid has signed a waiver it did not read.",
    whatBothCharactersKnow:
      "Dinner may surface memories. Serious trauma is out of bounds for the venue. The tasting menu lands on the table; the pair does not move from the alcove.",
    openingSituation:
      "Both members are seated in the alcove. The first bowl is already covered between them. Steam rises from a small vent in the lid.",
  },
  director: {
    tone: "intimate, careful, and oddly well catered",
    rules: [
      "Anchor the date to the alcove. The pair does not change tables.",
      "Keep memories emotionally specific but safe.",
      "Do not invent serious injury or death as a reveal.",
      "Let characters refuse a prompt without punishing them automatically.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Soup memory",
        event: "The cover lifts off the first bowl.",
        characterVisibleText:
          "The cover lifts off the bowl. The soup tastes like a kitchen where someone once asked a careful question.",
        directorInstruction: "Invite a modest memory without forcing confession.",
      },
      {
        atTurn: 20,
        title: "Plates rearrange",
        event: "The main plates are placed on the table and shift to whoever was listened to last.",
        characterVisibleText:
          "Two plates land on the table. After a beat they slide one inch toward the listener of the last line. The meal appears to have preferences about listening.",
        directorInstruction: "Reward active listening or expose its absence.",
      },
      {
        atTurn: 28,
        title: "Dessert receipt",
        event: "Dessert arrives with a receipt listing one thing each member avoided.",
        characterVisibleText:
          "Dessert lands between them with a receipt titled: items left unsaid. The line items are short and printed in the same ink as the menu.",
        directorInstruction: "Let the pair decide whether one item is worth saying now.",
      },
    ],
    earlyEndTriggers: [
      "A member feels cornered into sharing.",
      "A member mocks a harmless memory that mattered to the other.",
    ],
    repeatBehavior:
      "If repeated, the alcove remembers prior plates and may serve a callback only if both members know it.",
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
