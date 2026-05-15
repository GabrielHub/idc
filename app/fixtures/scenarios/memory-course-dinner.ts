import type { DateScenario } from "../../domain/game";

export const memoryCourseDinner: DateScenario = {
  id: "memory-course-dinner",
  title: "Food For Thought",
  card: {
    summary:
      "Every plate at the table evokes a childhood memory. The room is doing personnel work.",
    tags: ["food", "memory", "domestic"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    cost: 18,
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
        kind: "reveal",
        event: "The cover lifts off the first bowl.",
        characterVisibleText:
          "The cover lifts off the bowl. The soup tastes like a kitchen where someone once asked a careful question.",
        directorInstruction: "Invite a modest memory without forcing confession.",
      },
      {
        id: "memory-course-dinner-event-2",
        title: "Plate slide",
        kind: "provocation",
        event: "The main plates land hard and slide toward the last listener.",
        characterVisibleText:
          "Two plates land between them with a clear scrape. After a beat they slide a full hand toward the listener of the last line, edging cutlery toward the table edge.",
        directorInstruction:
          "Push the listener to settle the cutlery aloud or pass the slide back. The motion needs a physical answer before the next line.",
      },
      {
        id: "memory-course-dinner-event-3",
        title: "Dessert receipt",
        kind: "reveal",
        event: "Dessert arrives with a receipt listing one thing each member avoided.",
        characterVisibleText:
          "Dessert lands between them with a receipt titled: items left unsaid. The line items are short and printed in the same ink as the menu.",
        directorInstruction:
          "Let the pair decide whether one item is worth saying now. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "memory-course-dinner-event-4",
        title: "Bread course",
        kind: "reveal",
        event: "A small bread course arrives between bowls.",
        characterVisibleText:
          "A small wooden board lands between them. Two slices of dark bread, a pat of butter, and a tag that reads: a kitchen that hosted children, briefly.",
        directorInstruction:
          "Invite a smaller, lighter memory. Do not press for a wound. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "memory-course-dinner-event-5",
        title: "Carafe spill",
        kind: "provocation",
        event: "The water carafe refills past the rim and spills toward the receipt.",
        characterVisibleText:
          "The carafe refills past the rim. Water beads, sheets across the linen, and reaches the items-left-unsaid receipt at one corner. The receipt darkens at the edge.",
        directorInstruction:
          "Push for a physical save before the receipt blurs out. A clean reset of the table or a deliberate let-it-soak both count as answers.",
      },
      {
        id: "memory-course-dinner-event-6",
        title: "Salt cellar",
        kind: "ambient",
        event: "A small salt cellar slides toward the older speaker of the two.",
        characterVisibleText:
          "The salt cellar slides on its own toward whichever of them last named a place. A small spoon sits in it. The lid is engraved with a single year.",
        directorInstruction:
          "Use the small movement to test whether attention to old details counts as care here.",
      },
      {
        id: "memory-course-dinner-event-7",
        title: "Plates rebalance",
        kind: "ambient",
        event: "Plates shift again toward the listener of the last line.",
        characterVisibleText:
          "Both plates slide one inch toward whoever was listened to last. The tilt is mild. The empty water carafe is replaced without a word.",
        directorInstruction:
          "Reward steady listening. The plates are not strict, but they are watching.",
      },
      {
        id: "memory-course-dinner-event-8",
        title: "Empty third seat",
        kind: "ambient",
        event: "The empty third seat at the alcove softens at its edge.",
        characterVisibleText:
          "The empty third seat at the alcove edge softens for a beat. A thin line of light eases along the back of it. No one is there. The light returns to normal.",
        directorInstruction:
          "Allow each member to register the small absence privately. Do not voice the absence.",
      },
      {
        id: "memory-course-dinner-event-9",
        title: "Final tray surge",
        kind: "provocation",
        event: "A late tray slides into the alcove with a single covered course.",
        characterVisibleText:
          "A wheeled tray rolls itself into the alcove and stops a hand from the table. A single domed plate is on it. The wheels lock with a hard click and the lid lifts halfway, then waits.",
        directorInstruction:
          "Push for a clean call: take the dish, send it back, or close out the tasting. The tray will not retreat without an answer.",
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
