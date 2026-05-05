import type { DateScenario } from "../../domain/game";

export const temporalCoffeeShop: DateScenario = {
  id: "temporal-coffee-shop",
  title: "Temporal Coffee Shop",
  card: {
    summary: "Coffee in a cafe where time runs backward. Drinks arrive before orders.",
    tags: ["temporal", "food", "low_pressure"],
    risk: "medium",
    intimacy: "low",
    chaos: "medium",
    idealFor: ["patient listeners", "people who can laugh at confusion"],
    badFor: ["members who need strict control"],
  },
  publicBrief: {
    location: "The Second First Cup",
    premise:
      "The cafe runs backward in short loops. Staff treat this as a normal brunch service issue.",
    whatBothCharactersKnow:
      "Cupid booked the table. Cups, receipts, and small talk may arrive out of order.",
    openingSituation:
      "Both members sit down as the server thanks them for a tip they have not decided to leave.",
  },
  director: {
    tone: "lightly disorienting and service-industry procedural",
    rules: [
      "Keep the scene readable even when time glitches.",
      "Use temporal confusion to reveal how each member handles uncertainty.",
      "Do not let the cafe become more important than the pair.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Receipt first",
        event: "The receipt arrives with one sincere compliment written on it.",
        characterVisibleText:
          "The receipt says: thank you for the honest compliment. Neither member has given it yet.",
        directorInstruction:
          "Let the next speaker decide whether to honor the compliment or avoid it.",
      },
      {
        atTurn: 16,
        title: "Cold coffee warning",
        event: "One cup turns cold and carries a warning about repeating old mistakes.",
        characterVisibleText:
          "One coffee goes cold. The foam reads: say the thing before it curdles.",
        directorInstruction: "Push one member toward a small honest admission.",
      },
      {
        atTurn: 24,
        title: "Server closes the loop",
        event: "The server asks if they are ready to begin again.",
        characterVisibleText:
          "The server arrives with two fresh menus and asks if they want the same table again.",
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
