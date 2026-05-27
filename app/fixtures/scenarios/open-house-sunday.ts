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
    cost: 7,
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
    flow: "activity",
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
        pitch:
          "Run three notes from the neighbor's wind chime as a kitchen curtain twitches. Surfaces a habit, memory, or ask drawn from what either already carries.",
        beat: "The neighbor's wind chime runs three notes and stops. A small movement of curtain in the kitchen window suggests the agent has not come outside.",
        directorBeat:
          "Three notes just drifted across the yard. Comment on the chime, share a small memory it pulls, ask your date what they hear, or watch the curtain. Stay honest.",
      },
      {
        id: "open-house-sunday-event-2",
        title: "Deck rail",
        kind: "reveal",
        pitch:
          "Loosen one slat under a hand with a staple halfway out. Surfaces a small honest sentence about flaws.",
        beat: "One slat in the deck rail moves under a hand. It is loose but not broken. A small staple has come halfway out of the wood.",
        directorBeat:
          "Something small is wrong with this house. Push the slat back, comment on the staple, ask your date if they would fix things in a place they bought, or shrug. Let the flaw be private.",
      },
      {
        id: "open-house-sunday-event-3",
        title: "Inside footsteps",
        kind: "provocation",
        pitch:
          "Cross the agent's footsteps across the kitchen toward the back door with the voice still muffled. Forces a clean choice on staying, retreating, or stepping in.",
        beat: "Inside, footsteps cross the kitchen toward the back door. The door does not open yet. The agent's voice is too far in to make out.",
        directorBeat:
          "The agent is about to step out. Stay on the deck, retreat to the lawn, step inside to head her off, or signal your date which. Pick a move. Do not voice the agent.",
      },
      {
        id: "open-house-sunday-event-4",
        title: "Faucet upstairs",
        kind: "ambient",
        pitch:
          "Run an upstairs faucet for ten seconds with a pipe tick in the wall. Surfaces a quiet domestic preference.",
        beat: "An upstairs faucet runs for ten seconds and stops. A pipe in the wall ticks once. The kitchen window curtain has not moved.",
        directorBeat:
          "The house just made one of its small sounds. Comment on the pipe, ask your date if they like old houses or new ones, or stay quiet with it. Show your taste.",
      },
      {
        id: "open-house-sunday-event-5",
        title: "Yard squirrel",
        kind: "ambient",
        pitch:
          "Run a squirrel along the back fence in three jumps with the chime catching one note. Surfaces a small backyard fact.",
        beat: "A squirrel runs the back fence in three jumps and disappears into the neighbor's evergreen. The wind chime catches one note. The lawn is freshly cut.",
        directorBeat:
          "Something small was alive across the yard. Point it out to your date, comment on the cut lawn, watch the evergreen, or stay still. Do not make the squirrel a sign.",
      },
      {
        id: "open-house-sunday-event-6",
        title: "Clipboard inside",
        kind: "reveal",
        pitch:
          "Show the agent's clipboard through the kitchen window with two more names added and angled away from view. Surfaces how either holds being seen.",
        beat: "Through the kitchen window the agent's clipboard sits on the counter. Two more names have been added to the sign-in sheet. The clipboard is angled so neither name is readable from the deck.",
        directorBeat:
          "You are being recorded somewhere inside. Comment on the sheet, ask your date if they signed in, glance at the angle, or stay focused on the deck. Speak from how you already handle being seen.",
      },
      {
        id: "open-house-sunday-event-7",
        title: "Voices in kitchen",
        kind: "ambient",
        pitch:
          "Start two low voices in the kitchen with the candle freshly lit and the next walk-through here early. Surfaces a tightening bubble without forcing exit.",
        beat: "Two voices begin a low conversation in the kitchen. The vanilla candle is freshly lit. Neither voice is the agent's; the next walk-through has arrived early.",
        directorBeat:
          "Strangers are now inside the house behind you. Lower your voice with your date, propose moving to the lawn, comment on the candle smell, or hold the deck. Do not voice the kitchen pair.",
      },
      {
        id: "open-house-sunday-event-8",
        title: "Flier slip",
        kind: "provocation",
        pitch:
          "Slip the square footage flier from a pocket face-up onto the deck with the price highlighted. Forces one honest line on whether this is fantasy or real ask.",
        beat: "The folded square footage flier slips from a pocket and lands face-up on the deck. The asking price is highlighted in the corner. The wind catches the corner of the page.",
        directorBeat:
          "The number is now between your feet. Pick the flier up, name the price aloud, ask your date what they would do with this house, or fold it back. Speak honestly about fantasy and reality.",
      },
      {
        id: "open-house-sunday-event-9",
        title: "Sliding door cracks",
        kind: "provocation",
        pitch:
          "Slide the back door open a hand's width on its own with the candle smell carrying out and the clipboard now in view. Forces a clean physical call.",
        beat: "The sliding back door from the kitchen rolls open a hand's width on its own. The vanilla candle smell carries onto the deck. The clipboard on the counter is now visible at a clear angle.",
        directorBeat:
          "The house just opened on you. Close the door, step inside, move to the lawn, or hold the deck and let the strangers come out. Pick the move.",
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
