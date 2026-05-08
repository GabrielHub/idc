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
      "members who close service jobs and find a booth restful by default",
      "members whose tired dry voice fits a breadstick basket",
      "members who treat a normal Wednesday dinner as a kindness",
      "members whose anxious spiral has somewhere to land in a forty-page menu",
    ],
    badFor: [
      "members who try to convert breadsticks into ritual offerings",
      "members who propose Vows over the marinara",
      "members who will name the booth a Trial and count it against their seven",
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
        atTurn: 10,
        title: "Server pen at the booth",
        event: "The server stops at the booth's edge with pen and pad ready.",
        characterVisibleText:
          "The server stops at the booth's edge, pen above pad, and waits without speaking. The first basket of breadsticks is half gone.",
        directorInstruction:
          "Reveal how each member handles a low-stakes choice with another person waiting.",
      },
      {
        atTurn: 20,
        title: "Bread refill",
        event: "A second breadstick basket arrives. Neither member asked.",
        characterVisibleText:
          "A fresh basket lands on the table. The original basket is still half full.",
        directorInstruction:
          "Use the abundance to surface generosity, scarcity scripts, or table manners.",
      },
      {
        atTurn: 28,
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
      "If repeated, the server may set down the booth's usual basket without checking. Cupid considers this a positive comp.",
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
