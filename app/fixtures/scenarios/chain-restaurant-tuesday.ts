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
    events: [
      {
        id: "chain-restaurant-tuesday-event-1",
        title: "Server pen at the booth",
        event: "The server stops at the booth's edge with pen and pad ready.",
        characterVisibleText:
          "The server stops at the booth's edge, pen above pad, and waits without speaking. The first basket of breadsticks is half gone.",
        directorInstruction:
          "Reveal how each member handles a low-stakes choice with another person waiting.",
      },
      {
        id: "chain-restaurant-tuesday-event-2",
        title: "Bread refill",
        event: "A second breadstick basket arrives. Neither member asked.",
        characterVisibleText:
          "A fresh basket lands on the table. The original basket is still half full.",
        directorInstruction:
          "Use the abundance to surface generosity, scarcity scripts, or table manners.",
      },
      {
        id: "chain-restaurant-tuesday-event-3",
        title: "Check drop",
        event: "The check arrives in a leatherette folder with two mints.",
        characterVisibleText:
          "The check sits at the edge of the table. The folder is leatherette and slightly warm from the kitchen window.",
        directorInstruction:
          "Let the pair handle who pays without inventing a manager intervention.",
      },
      {
        id: "chain-restaurant-tuesday-event-4",
        title: "Wrong fork",
        event: "The server swaps a salad fork for a dinner fork without a word.",
        characterVisibleText:
          "The server lifts a salad fork, sets a dinner fork in its place, and moves on. The candle in the small jar at the booth is unlit. The breadstick basket is on its third pass.",
        directorInstruction: "Use the small correction to expose how the pair handles a quiet fix.",
      },
      {
        id: "chain-restaurant-tuesday-event-5",
        title: "Tablet sleep",
        event: "The booth tablet auto-sleeps and the room hum returns.",
        characterVisibleText:
          "The check tablet on the booth dims to its sleep screen. The booth's overhead speaker plays a smooth-jazz instrumental at low volume.",
        directorInstruction:
          "Let the pause invite a topic neither has needed help raising. No staff to lean on.",
      },
      {
        id: "chain-restaurant-tuesday-event-6",
        title: "Booth twelve",
        event: "A toddler at booth twelve drops a crayon into the aisle.",
        characterVisibleText:
          "A red crayon rolls from booth twelve into the aisle. A parent leans down and retrieves it. The toddler waves at the entire dining room.",
        directorInstruction: "Use the small public moment to test warmth without performance.",
      },
      {
        id: "chain-restaurant-tuesday-event-7",
        title: "Manager pass",
        event: "The manager walks the dining room without stopping at booth fourteen.",
        characterVisibleText:
          "The manager walks the floor in a polo shirt with a name tag clipped on. He passes booth fourteen, slows, and keeps moving without speaking.",
        directorInstruction:
          "Let the pair sit with the small near-attention. A member who flags him reveals something.",
      },
      {
        id: "chain-restaurant-tuesday-event-8",
        title: "Mints arrive",
        event: "Two mints come in a small dish with the check folder.",
        characterVisibleText:
          "The mints come in a small black dish on top of the closed leatherette folder. The kitchen pass-through has gone quiet. The breadstick basket is empty.",
        directorInstruction:
          "Push for a clean handoff or a clean stall before the booth turns over.",
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
