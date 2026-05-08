import type { DateScenario } from "../../domain/game";

export const temporalCoffeeShop: DateScenario = {
  id: "temporal-coffee-shop",
  title: "Temporal Coffee Shop",
  card: {
    summary: "Coffee in a cafe where time runs backward at the table. Drinks arrive before orders.",
    tags: ["temporal", "food", "low_pressure"],
    risk: "medium",
    intimacy: "low",
    chaos: "medium",
    idealFor: [
      "members whose work has trained them to outwait procedure",
      "members who can name a glitch without trying to fix it",
      "members used to hours that arrive in the wrong order",
    ],
    badFor: [
      "members who short the date the second logistics break",
      "members who need each minute to compound into the next",
      "members whose plans collapse if the timing slips",
    ],
  },
  publicBrief: {
    location: "A two-top by the window at The Second First Cup",
    premise:
      "The cafe runs backward in short loops at the table. Service is largely automatic at this seat.",
    whatBothCharactersKnow:
      "Cupid booked the table. Cups, receipts, and small talk arrive out of order. Staff treat this as a normal brunch service issue.",
    openingSituation:
      "Both members sit down. A printed receipt is already on the table, ink still warm. Neither has ordered.",
  },
  director: {
    tone: "lightly disorienting and service-industry procedural",
    rules: [
      "Keep the scene readable even when time glitches.",
      "Use temporal confusion to reveal how each member handles uncertainty.",
      "Loops happen at the table. Do not pull the pair out of the chair or skip ahead in the day.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Receipt first",
        event: "The receipt already on the table carries one sincere compliment.",
        characterVisibleText:
          "The receipt on the table reads: thank you for the honest compliment. Neither member has given it yet.",
        directorInstruction:
          "Let the next speaker decide whether to honor the compliment or avoid it.",
      },
      {
        atTurn: 20,
        title: "Cold coffee warning",
        event: "One cup turns cold and carries a warning about repeating old mistakes.",
        characterVisibleText:
          "One coffee cup goes cold mid-table. The foam settles into a line that reads: say the thing before it curdles.",
        directorInstruction: "Push one member toward a small honest admission.",
      },
      {
        atTurn: 28,
        title: "Loop reset",
        event: "Two new menus appear under their elbows.",
        characterVisibleText:
          "Two fresh menus drop onto the table, still warm from the printer. The receipt is gone.",
        directorInstruction: "Make repetition feel either comforting or exhausting for this pair.",
      },
    ],
    earlyEndTriggers: [
      "A member feels mocked by the time loop.",
      "A member refuses to keep talking after a future detail becomes too personal.",
    ],
    repeatBehavior:
      "If this exact pair has had this scenario before, they may notice the menu, the receipt, or their own old lines. Repetition usually strains the date unless they choose to make it a ritual.",
  },
  judgeRubric: {
    successSignals: [
      "The pair uses the time loop to ask a clearer question.",
      "A member comforts the other without trying to solve the loop.",
    ],
    failureSignals: [
      "The pair argues about what counts as already said.",
      "A member treats the scenario as proof Cupid is careless.",
    ],
    statFocus: ["trust", "stability", "weirdnessTolerance"],
  },
};
