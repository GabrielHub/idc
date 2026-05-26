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
        pitch:
          "Lift the cover off a soup that tastes like a kitchen where someone once asked a careful question. Surfaces a modest memory without forcing confession.",
        beat: "The cover lifts off the bowl. The soup tastes like a kitchen where someone once asked a careful question.",
        directorBeat:
          "The soup is doing personnel work. Name the small memory it pulls, ask your date what they taste, sit with the bowl, or change the topic. Speak only from what you already carry.",
      },
      {
        id: "memory-course-dinner-event-2",
        title: "Plate slide",
        kind: "provocation",
        pitch:
          "Land both plates hard and slide them a full hand toward the last listener, with cutlery near the edge. Forces a physical answer.",
        beat: "Two plates land between them with a clear scrape. After a beat they slide a full hand toward the listener of the last line, edging cutlery toward the table edge.",
        directorBeat:
          "The table just judged a listener. Steady the cutlery, slide the plates back to center, comment on the move, or accept the slide. Use your hands in your next beat.",
      },
      {
        id: "memory-course-dinner-event-3",
        title: "Dessert receipt",
        kind: "reveal",
        pitch:
          "Land dessert with a receipt titled items left unsaid in the menu's ink. Forces a stance on whether one item is worth saying now.",
        beat: "Dessert lands between them with a receipt titled: items left unsaid. The line items are short and printed in the same ink as the menu.",
        directorBeat:
          "A short list of unsaid things is on the table. Pick one to name aloud, hand the receipt across, ask your date if they want to share one, or fold it shut. Decide cleanly. Do not voice the receipt.",
      },
      {
        id: "memory-course-dinner-event-4",
        title: "Bread course",
        kind: "reveal",
        pitch:
          "Slide a wooden board with dark bread, butter, and a tag: a kitchen that hosted children, briefly. Forces a smaller, lighter memory.",
        beat: "A small wooden board lands between them. Two slices of dark bread, a pat of butter, and a tag that reads: a kitchen that hosted children, briefly.",
        directorBeat:
          "The tag is asking for something small and warm. Offer one line about a kitchen you remember, ask your date about theirs, tear off a piece and pass it across, or set the tag aside. Stay honest. Do not voice the tag.",
      },
      {
        id: "memory-course-dinner-event-5",
        title: "Carafe spill",
        kind: "provocation",
        pitch:
          "Refill the water carafe past the rim toward the items-left-unsaid receipt at one corner. Forces a physical save or a deliberate soak.",
        beat: "The carafe refills past the rim. Water beads, sheets across the linen, and reaches the items-left-unsaid receipt at one corner. The receipt darkens at the edge.",
        directorBeat:
          "The receipt is about to blur. Save it with a napkin, deliberately let it soak, ask your date if they want it preserved, or lift it to dry. Pick and act in this beat.",
      },
      {
        id: "memory-course-dinner-event-6",
        title: "Salt cellar",
        kind: "ambient",
        pitch:
          "Slide a small engraved salt cellar toward whichever named a place last. Surfaces attention to old details as care.",
        beat: "The salt cellar slides on its own toward whichever of them last named a place. A small spoon sits in it. The lid is engraved with a single year.",
        directorBeat:
          "A small heirloom is at your elbow. Pick up the spoon, read the year aloud, ask your date what year is on theirs, or push it back. Show the small attention.",
      },
      {
        id: "memory-course-dinner-event-7",
        title: "Plates rebalance",
        kind: "ambient",
        pitch:
          "Shift both plates one inch toward the last listener with a fresh carafe arriving. Surfaces whether steady listening is honored.",
        beat: "Both plates slide one inch toward whoever was listened to last. The tilt is mild. The empty water carafe is replaced without a word.",
        directorBeat:
          "The table is rewarding the listener. Notice the shift, ask your date a real follow-up, eat from the side that came to you, or push the plates back. Honor the listening.",
      },
      {
        id: "memory-course-dinner-event-8",
        title: "Empty third seat",
        kind: "ambient",
        pitch:
          "Soften the empty third seat's edge for a beat with a thin line of light along the back. Surfaces a small private absence the pair registers but does not voice.",
        beat: "The empty third seat at the alcove edge softens for a beat. A thin line of light eases along the back of it. No one is there. The light returns to normal.",
        directorBeat:
          "Something quiet just passed the empty seat. Sit with it, glance at your date, comment on the light without dramatizing it, or look back at your plate. Do not voice the absence.",
      },
      {
        id: "memory-course-dinner-event-9",
        title: "Final tray surge",
        kind: "provocation",
        pitch:
          "Roll a late tray into the alcove with a single domed plate. Forces a clean call: take, send back, or close out.",
        beat: "A wheeled tray rolls itself into the alcove and stops a hand from the table. A single domed plate is on it. The wheels lock with a hard click and the lid lifts halfway, then waits.",
        directorBeat:
          "An extra course just locked in next to your table. Take the dish, send it back, close out the tasting, or ask your date what they want. The tray will not retreat without an answer.",
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
