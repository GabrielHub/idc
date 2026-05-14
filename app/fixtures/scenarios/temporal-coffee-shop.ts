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
    cost: 14,
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
    events: [
      {
        id: "temporal-coffee-shop-event-1",
        title: "Receipt first",
        kind: "reveal",
        event: "The receipt already on the table carries one sincere compliment.",
        characterVisibleText:
          "The receipt on the table reads: thank you for the honest compliment. Neither member has given it yet.",
        directorInstruction:
          "Let the next speaker decide whether to honor the compliment or avoid it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "temporal-coffee-shop-event-2",
        title: "Cold coffee warning",
        kind: "reveal",
        event: "One cup turns cold and carries a warning about repeating old mistakes.",
        characterVisibleText:
          "One coffee cup goes cold mid-table. The foam settles into a line that reads: say the thing before it curdles.",
        directorInstruction:
          "Push one member toward a small honest admission. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "temporal-coffee-shop-event-3",
        title: "Loop reset",
        kind: "ambient",
        event: "Two new menus appear under their elbows.",
        characterVisibleText:
          "Two fresh menus drop onto the table, still warm from the printer. The receipt is gone.",
        directorInstruction: "Make repetition feel either comforting or exhausting for this pair.",
      },
      {
        id: "temporal-coffee-shop-event-4",
        title: "Sugar packet",
        kind: "ambient",
        event: "A sugar packet appears, opens, and refills.",
        characterVisibleText:
          "A sugar packet sits closed on the saucer. It opens by itself and pours into a cup that has not arrived. The packet then reseals.",
        directorInstruction:
          "Use the small absurdity to test whether either of them stays in the conversation.",
      },
      {
        id: "temporal-coffee-shop-event-5",
        title: "Receipt timeline",
        kind: "ambient",
        event: "A new receipt prints with tomorrow's date.",
        characterVisibleText:
          "A new receipt prints from the small printer at the corner of the table. The header reads: tomorrow, 10:14 a.m. The amount is listed but the items are blank.",
        directorInstruction:
          "Allow the future to be slightly visible without letting it become a script. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "temporal-coffee-shop-event-6",
        title: "Mug overspill",
        kind: "provocation",
        event: "The empty mug between them fills and tips toward one of them.",
        characterVisibleText:
          "The empty mug between them fills itself with hot coffee in a single beat. The handle pivots and the mug tips a finger's width toward one member, sloshing onto the table.",
        directorInstruction:
          "This is a real spill. The character must register the heat and move before resuming.",
      },
      {
        id: "temporal-coffee-shop-event-7",
        title: "Reflection lags",
        kind: "reveal",
        event: "Their reflection in the window is half a beat behind.",
        characterVisibleText:
          "The window beside them shows their reflection. The reflection nods half a beat after the body. The cafe behind them is normal in the glass.",
        directorInstruction:
          "Let the small disagreement of self with self surface a small honest admission.",
      },
      {
        id: "temporal-coffee-shop-event-8",
        title: "Order ticket",
        kind: "provocation",
        event: "A kitchen ticket prints listing their order before they ordered it.",
        characterVisibleText:
          "A kitchen ticket prints from the bar. It lists two coffees and one shared pastry. The pastry is the one neither has named yet.",
        directorInstruction:
          "Push for a clean read on whether they choose what the ticket suggests or pick something else on purpose.",
      },
      {
        id: "temporal-coffee-shop-event-9",
        title: "Printer cascade",
        kind: "provocation",
        event: "The corner printer floods the table with old tickets.",
        characterVisibleText:
          "The small printer at the corner of the table runs without stopping. A ribbon of pale receipts spools across both their hands and onto the floor. The most recent line on the topmost slip reads: still here?",
        directorInstruction:
          "Push for a concrete next move: stay with the table, kill the printer feed, or call the lap done. Do not voice any background person or cue as a continuing speaker.",
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
