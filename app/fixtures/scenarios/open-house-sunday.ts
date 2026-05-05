import type { DateScenario } from "../../domain/game";

export const openHouseSunday: DateScenario = {
  id: "open-house-sunday",
  title: "Open House, Sunday",
  card: {
    summary:
      "A two bedroom on the market. Sign in sheet at the door, listing agent in the kitchen, fresh cookies on a paper plate.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who think in floor plans",
      "pairs who try on a future without naming it",
      "members who will check the furnace",
    ],
    badFor: ["members who refuse to sign in", "members who treat domestic interiors as exposure"],
  },
  publicBrief: {
    location: "412 Linden Street, two bed one and a half bath, listed Friday",
    premise:
      "Cupid added them to the open house sheet. The listing agent will hand them a flier and let them wander.",
    whatBothCharactersKnow:
      "It is a real listing. Neither member is buying. The agent has another walk-through at three.",
    openingSituation:
      "Both members sign in. The flier lists square footage, year built, and a photograph of the back deck.",
  },
  director: {
    tone: "bright laminate, vanilla candle, soft sound of someone running a faucet upstairs",
    rules: [
      "Treat the house as a real house. Do not let it become a portal, a haunting, or a trap.",
      "Use rooms as conversation prompts, not metaphors.",
      "Allow either member to slip into a small private fantasy and then pull back.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Kitchen lap",
        event: "They walk the kitchen. The agent is two rooms away.",
        characterVisibleText:
          "The kitchen has a butcher block island, a fridge that does not match, and a clock two minutes fast.",
        directorInstruction:
          "Use the small room to surface a habit, a memory, or an ask neither has named.",
      },
      {
        atTurn: 16,
        title: "Second bedroom",
        event: "They reach the second bedroom and close the door behind them.",
        characterVisibleText:
          "The second bedroom is staged as an office with one armchair and a fake plant.",
        directorInstruction:
          "Let the closed door be private. A small honest sentence costs less here.",
      },
      {
        atTurn: 26,
        title: "Back deck",
        event: "The back door opens onto a small wooden deck and a fenced yard.",
        characterVisibleText:
          "The deck has one Adirondack chair and the neighbor's wind chime in earshot.",
        directorInstruction:
          "Let the pair stay or leave. A private claim, even refused, is the beat.",
      },
    ],
    earlyEndTriggers: [
      "A member treats a stranger's home as evidence of compatibility.",
      "A member uses the listing to pitch a future the other did not consent to.",
    ],
    repeatBehavior:
      "If repeated, the listing has changed. The agent recognizes the pair and asks if they ever bought somewhere.",
  },
  judgeRubric: {
    successSignals: [
      "A member tries on a future room and lets it stay private.",
      "The pair laughs at one staging choice without mocking the home.",
    ],
    failureSignals: [
      "A member proposes anything inside a stranger's kitchen.",
      "A member treats the house as a contract.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
