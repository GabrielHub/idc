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
    events: [
      {
        id: "memory-course-dinner-event-1",
        title: "Soup memory",
        event: "The cover lifts off the first bowl.",
        characterVisibleText:
          "The cover lifts off the bowl. The soup tastes like a kitchen where someone once asked a careful question.",
        directorInstruction: "Invite a modest memory without forcing confession.",
      },
      {
        id: "memory-course-dinner-event-2",
        title: "Plates rearrange",
        event: "The main plates are placed on the table and shift to whoever was listened to last.",
        characterVisibleText:
          "Two plates land on the table. After a beat they slide one inch toward the listener of the last line. The meal appears to have preferences about listening.",
        directorInstruction: "Reward active listening or expose its absence.",
      },
      {
        id: "memory-course-dinner-event-3",
        title: "Dessert receipt",
        event: "Dessert arrives with a receipt listing one thing each member avoided.",
        characterVisibleText:
          "Dessert lands between them with a receipt titled: items left unsaid. The line items are short and printed in the same ink as the menu.",
        directorInstruction: "Let the pair decide whether one item is worth saying now.",
      },
      {
        id: "memory-course-dinner-event-4",
        title: "Bread course",
        event: "A small bread course arrives between bowls.",
        characterVisibleText:
          "A small wooden board lands between them. Two slices of dark bread, a pat of butter, and a tag that reads: a kitchen that hosted children, briefly.",
        directorInstruction: "Invite a smaller, lighter memory. Do not press for a wound.",
      },
      {
        id: "memory-course-dinner-event-5",
        title: "Glass refill",
        event: "Water is refilled and a memory rises on the rim.",
        characterVisibleText:
          "Water glasses are refilled to the rim. A faint memory crosses the air at one of them: a kitchen, a sink, a hand drying a glass without speaking.",
        directorInstruction: "Allow the affected member to share or let the moment go quiet.",
      },
      {
        id: "memory-course-dinner-event-6",
        title: "Salt cellar",
        event: "A small salt cellar slides toward the older speaker of the two.",
        characterVisibleText:
          "The salt cellar slides on its own toward whichever of them last named a place. A small spoon sits in it. The lid is engraved with a single year.",
        directorInstruction:
          "Use the small movement to test whether attention to old details counts as care here.",
      },
      {
        id: "memory-course-dinner-event-7",
        title: "Plates rebalance",
        event: "Plates shift again toward the listener of the last line.",
        characterVisibleText:
          "Both plates slide one inch toward whoever was listened to last. The tilt is mild. The empty water carafe is replaced without a word.",
        directorInstruction:
          "Reward steady listening. The plates are not strict, but they are watching.",
      },
      {
        id: "memory-course-dinner-event-8",
        title: "Empty third seat",
        event: "The empty third seat at the alcove softens at its edge.",
        characterVisibleText:
          "The empty third seat at the alcove edge softens for a beat. A thin line of light eases along the back of it. No one is there. The light returns to normal.",
        directorInstruction:
          "Allow each member to register the small absence privately. Do not voice the absence.",
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
