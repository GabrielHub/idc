import type { DateScenario } from "../../domain/game";

export const openHouseSunday: DateScenario = {
  id: "open-house-sunday",
  title: "Open House, Back Deck",
  card: {
    summary:
      "A two bedroom on the market. The agent is in the kitchen. The pair has the back deck to themselves.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who will check a deck rail and a back door without making it a stunt",
      "members who can stand on a stranger's deck without project managing the future",
      "members who read square footage as a Term and stay in the audit",
      "members whose stoic stillness fits a loose railing slat",
    ],
    badFor: [
      "members who refuse to sign a name on any list they did not write",
      "members who will not enter a Bargain on someone else's hearth",
      "members who treat a stranger's floor plan as a holding to swear in",
    ],
  },
  publicBrief: {
    location: "The back deck of 412 Linden Street, two bed one and a half bath, listed Friday",
    premise:
      "Cupid added them to the open house sheet. They have already done the lap inside; the deck is where they ended up. The listing agent is back in the kitchen with the next walk-through at three.",
    whatBothCharactersKnow:
      "It is a real listing. Neither member is buying. The deck looks onto a small fenced yard. A flier with square footage is folded in one of their pockets.",
    openingSituation:
      "Both members stand on a small wooden deck. One Adirondack chair is between them. The neighbor's wind chime is just within earshot. The kitchen door is closed behind them.",
  },
  director: {
    tone: "vanilla candle drifting from inside, soft sound of someone running a faucet upstairs, soft outdoor air",
    rules: [
      "Anchor the date to the back deck. The pair does not return to the kitchen, the bedrooms, or the front lawn.",
      "Treat the house as a real house. Do not let it become a portal, a haunting, or a trap.",
      "Allow either member to slip into a small private fantasy and then pull back.",
    ],
    events: [
      {
        id: "open-house-sunday-event-1",
        title: "Wind chime",
        kind: "reveal",
        event: "The neighbor's wind chime catches a soft gust.",
        characterVisibleText:
          "The neighbor's wind chime runs three notes and stops. A small movement of curtain in the kitchen window suggests the agent has not come outside.",
        directorInstruction:
          "Use the small sound to surface a habit, a memory, or an ask neither has named, drawn from each member's own brief.",
      },
      {
        id: "open-house-sunday-event-2",
        title: "Deck rail",
        kind: "reveal",
        event: "A loose railing slat shifts under one of their hands.",
        characterVisibleText:
          "One slat in the deck rail moves under a hand. It is loose but not broken. A small staple has come halfway out of the wood.",
        directorInstruction:
          "Let the small flaw be private. A small honest sentence costs less here.",
      },
      {
        id: "open-house-sunday-event-3",
        title: "Inside footsteps",
        kind: "provocation",
        event: "Footsteps in the kitchen approach the back door.",
        characterVisibleText:
          "Inside, footsteps cross the kitchen toward the back door. The door does not open yet. The agent's voice is too far in to make out.",
        directorInstruction:
          "Push for a clean choice: stay on the deck, retreat to the lawn, or step in. Do not voice the agent.",
      },
      {
        id: "open-house-sunday-event-4",
        title: "Faucet upstairs",
        kind: "ambient",
        event: "A faucet runs upstairs and stops.",
        characterVisibleText:
          "An upstairs faucet runs for ten seconds and stops. A pipe in the wall ticks once. The kitchen window curtain has not moved.",
        directorInstruction: "Use the small house sound to surface a quiet domestic preference.",
      },
      {
        id: "open-house-sunday-event-5",
        title: "Yard squirrel",
        kind: "ambient",
        event: "A squirrel crosses the back fence.",
        characterVisibleText:
          "A squirrel runs the back fence in three jumps and disappears into the neighbor's evergreen. The wind chime catches one note. The lawn is freshly cut.",
        directorInstruction:
          "Allow the small backyard fact. The deck does not need to mean anything because of it.",
      },
      {
        id: "open-house-sunday-event-6",
        title: "Clipboard inside",
        kind: "reveal",
        event: "The agent's clipboard is visible through the kitchen window.",
        characterVisibleText:
          "Through the kitchen window the agent's clipboard sits on the counter. Two more names have been added to the sign-in sheet. The clipboard is angled so neither name is readable from the deck.",
        directorInstruction:
          "Use the soft surveillance to test whether the deck still feels private. Surface what each member already shows about being seen, not new claims.",
      },
      {
        id: "open-house-sunday-event-7",
        title: "Voices in kitchen",
        kind: "ambient",
        event: "Two voices start in the kitchen and stay there.",
        characterVisibleText:
          "Two voices begin a low conversation in the kitchen. The vanilla candle is freshly lit. Neither voice is the agent's; the next walk-through has arrived early.",
        directorInstruction:
          "Let the small bubble of strangers behind them tighten the deck without forcing exit. Do not voice the kitchen pair as continuing speakers.",
      },
      {
        id: "open-house-sunday-event-8",
        title: "Flier slip",
        kind: "provocation",
        event: "The folded flier slips out of a pocket onto the deck.",
        characterVisibleText:
          "The folded square footage flier slips from a pocket and lands face-up on the deck. The asking price is highlighted in the corner. The wind catches the corner of the page.",
        directorInstruction:
          "Push for one honest line about whether the deck stays a fantasy or becomes a real ask.",
      },
      {
        id: "open-house-sunday-event-9",
        title: "Sliding door cracks",
        kind: "provocation",
        event: "The sliding back door slides open a hand's width.",
        characterVisibleText:
          "The sliding back door from the kitchen rolls open a hand's width on its own. The vanilla candle smell carries onto the deck. The clipboard on the counter is now visible at a clear angle.",
        directorInstruction:
          "Push for a clean call: close the door, step inside, or move to the lawn. The next walk-through is in the kitchen and the door does not close itself.",
      },
    ],
    earlyEndTriggers: [
      "A member treats a stranger's home as evidence of compatibility.",
      "A member uses the listing to pitch a future the other did not consent to.",
    ],
    repeatBehavior:
      "If repeated, the listing has changed. The deck is the same deck. The wind chime has not been replaced.",
  },
  judgeRubric: {
    successSignals: [
      "A member tries on a future and lets it stay private.",
      "The pair laughs at one staging choice without mocking the home.",
    ],
    failureSignals: [
      "A member proposes anything inside a stranger's home.",
      "A member treats the deck as a contract.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
