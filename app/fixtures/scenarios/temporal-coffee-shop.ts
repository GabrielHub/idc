import type { DateScenario } from "../../domain/game";

export const temporalCoffeeShop: DateScenario = {
  id: "temporal-coffee-shop",
  title: "Cart Before The Horse",
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
    flow: "conversation",
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
        pitch:
          "Land a warm-ink receipt on the table reading: thank you for the honest compliment, before anyone said one. Forces a stance: honor it or avoid it.",
        beat: "The receipt on the table reads: thank you for the honest compliment. Neither member has given it yet.",
        directorBeat:
          "The cafe credited you for a line you have not said. Give the compliment now, deflect aloud, ask your date what theirs would be, or pocket the receipt. Do not let it sit. Do not voice the receipt.",
      },
      {
        id: "temporal-coffee-shop-event-2",
        title: "Cold coffee warning",
        kind: "reveal",
        pitch:
          "Cold one cup mid-table with the foam settling into: say the thing before it curdles. Forces a small honest admission.",
        beat: "One coffee cup goes cold mid-table. The foam settles into a line that reads: say the thing before it curdles.",
        directorBeat:
          "The cup is asking you for the honest line. Say it to your date, deflect with a joke, comment on the foam settling, or stir it back. Speak now. Do not voice the cup.",
      },
      {
        id: "temporal-coffee-shop-event-3",
        title: "Loop reset",
        kind: "ambient",
        pitch:
          "Drop two fresh menus under their elbows with the prior receipt gone. Surfaces repetition as comforting or exhausting.",
        beat: "Two fresh menus drop onto the table, still warm from the printer. The receipt is gone.",
        directorBeat:
          "The table just gave you a do-over. Open the menu, comment on the loop, ask your date which version of this they want, or pretend the prior beat happened. Show how repetition lands on you.",
      },
      {
        id: "temporal-coffee-shop-event-4",
        title: "Sugar packet",
        kind: "ambient",
        pitch:
          "Open a sugar packet on its own and pour it into a cup that has not arrived. Surfaces whether either stays in the conversation through the absurd.",
        beat: "A sugar packet sits closed on the saucer. It opens by itself and pours into a cup that has not arrived. The packet then reseals.",
        directorBeat:
          "Something small just did the work itself for a cup that does not exist yet. Laugh, comment to your date on the packet, ignore it, or use it to soften the next question. Do not let the absurd derail the talk.",
      },
      {
        id: "temporal-coffee-shop-event-5",
        title: "Receipt timeline",
        kind: "ambient",
        pitch:
          "Print a new receipt with tomorrow's date and blank items. Surfaces a tiny future visible without forcing a script.",
        beat: "A new receipt prints from the small printer at the corner of the table. The header reads: tomorrow, 10:14 a.m. The amount is listed but the items are blank.",
        directorBeat:
          "A future receipt is sitting on the table. Read the time aloud, ask your date if they want to meet then, joke about the blank items, or set it aside. Do not let the date dictate the next move. Do not voice the receipt.",
      },
      {
        id: "temporal-coffee-shop-event-6",
        title: "Mug overspill",
        kind: "provocation",
        pitch:
          "Fill the empty shared mug in one beat and tip it a finger's width onto the table. Forces a physical reaction to real heat.",
        beat: "The empty mug between them fills itself with hot coffee in a single beat. The handle pivots and the mug tips a finger's width toward one member, sloshing onto the table.",
        directorBeat:
          "Hot coffee just landed on you or your date. Move your hand, mop with a napkin, push back from the table, or check the other for the splash. Register the heat now.",
      },
      {
        id: "temporal-coffee-shop-event-7",
        title: "Reflection lags",
        kind: "reveal",
        pitch:
          "Lag the reflection in the window by half a beat behind the body with the cafe normal in the glass. Surfaces a small honest admission.",
        beat: "The window beside them shows their reflection. The reflection nods half a beat after the body. The cafe behind them is normal in the glass.",
        directorBeat:
          "You and your reflection are out of sync. Notice it once, comment on the half beat to your date, say the small honest thing the lag pulls out, or look away. Stay in the moment.",
      },
      {
        id: "temporal-coffee-shop-event-8",
        title: "Order ticket",
        kind: "provocation",
        pitch:
          "Print a kitchen ticket listing two coffees and one shared pastry neither has named. Forces a clean choice: accept what the ticket suggests or pick something else on purpose.",
        beat: "A kitchen ticket prints from the bar. It lists two coffees and one shared pastry. The pastry is the one neither has named yet.",
        directorBeat:
          "The kitchen is guessing what you want. Accept the order, ask your date if they were thinking that pastry, change one item out loud, or cancel and order fresh. Make the call.",
      },
      {
        id: "temporal-coffee-shop-event-9",
        title: "Printer cascade",
        kind: "provocation",
        pitch:
          "Run the printer without stopping with a receipt ribbon across both their hands and: still here? on top. Forces a concrete next move.",
        beat: "The small printer at the corner of the table runs without stopping. A ribbon of pale receipts spools across both their hands and onto the floor. The most recent line on the topmost slip reads: still here?",
        directorBeat:
          "The table is asking you out loud. Stop the printer, answer with your date what you both want to do, kill the feed, or stand to leave. Pick now. Do not voice the printer.",
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
