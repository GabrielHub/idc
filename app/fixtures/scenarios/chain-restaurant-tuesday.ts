import type { DateScenario } from "../../domain/game";

export const chainRestaurantTuesday: DateScenario = {
  id: "chain-restaurant-tuesday",
  title: "Chain Restaurant, Tuesday",
  card: {
    summary:
      "A booth at a chain restaurant. The host has been briefed not to ask follow-up questions.",
    tags: ["food", "public", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    idealFor: [
      "members who want a normal date",
      "service industry members off shift",
      "pairs that need a low-stakes first try",
    ],
    badFor: [
      "members who treat dinner as covenant review",
      "members who need ceremony to feel chosen",
    ],
  },
  publicBrief: {
    location: "Booth 14 at the chain Italian on Route 17",
    premise:
      "Cupid booked a normal weeknight dinner. The host has been briefed. The bread is bottomless.",
    whatBothCharactersKnow:
      "It is a booth, a forty page menu, and approximately ninety minutes. No supernatural staff have been alerted.",
    openingSituation:
      "Both members slide into the booth. The first basket of breadsticks arrives unprovoked.",
  },
  director: {
    tone: "ordinary, faintly humming, lit at 200 lumens",
    rules: [
      "Treat the venue as honestly mundane. Do not let it betray itself.",
      "Comedy comes from how a non-mundane member behaves in a mundane booth, not from the booth misbehaving.",
      "Allow the date to be small. Resist escalating stakes.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Order taken",
        event: "The server arrives with confident patience and asks for orders.",
        characterVisibleText:
          "The server asks if anyone needs a minute. There is a pen behind the ear and zero supernatural awareness.",
        directorInstruction:
          "Reveal how each member handles a low-stakes choice with another person waiting.",
      },
      {
        atTurn: 16,
        title: "Bread refill",
        event: "A second breadstick basket arrives. Neither member asked.",
        characterVisibleText:
          "A fresh basket lands on the table. The original basket is still half full.",
        directorInstruction:
          "Use the abundance to surface generosity, scarcity scripts, or table manners.",
      },
      {
        atTurn: 26,
        title: "Check drop",
        event: "The check arrives in a leatherette folder with two mints.",
        characterVisibleText:
          "The check sits at the edge of the table. The folder is leatherette and slightly warm from the kitchen window.",
        directorInstruction:
          "Let the pair handle who pays without inventing a manager intervention.",
      },
    ],
    earlyEndTriggers: [
      "A member tries to make the booth cosmic when it is not.",
      "A member treats the server poorly.",
    ],
    repeatBehavior:
      "If repeated, the server may recognize them and offer the usual table. Cupid considers this a positive comp.",
  },
  judgeRubric: {
    successSignals: [
      "The pair carries the conversation without help from the venue.",
      "A non-mundane member adapts to mundane pacing without resentment.",
    ],
    failureSignals: [
      "A member is rude to staff.",
      "A member treats the date as beneath them because it is normal.",
    ],
    statFocus: ["chemistry", "stability", "relationshipHealth"],
  },
};
