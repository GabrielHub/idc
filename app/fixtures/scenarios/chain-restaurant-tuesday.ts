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
    cost: 6,
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
    flow: "conversation",
    rules: [
      "Treat the venue as honestly mundane. Do not let it betray itself.",
      "Comedy comes from how a non-mundane member behaves in a mundane booth, not from the booth misbehaving.",
      "Allow the date to be small. Resist escalating stakes.",
    ],
    events: [
      {
        id: "chain-restaurant-tuesday-event-1",
        title: "Server pen at the booth",
        kind: "reveal",
        pitch:
          "Force an ordering moment with a waiting server. Surfaces who decides, who defers, who freezes.",
        beat: "The server stops at the booth's edge, pen above pad, and waits without speaking. The first basket of breadsticks is half gone.",
        directorBeat:
          "Acknowledge the waiting server now. Order, ask your date what they want, defer to them, or say you need another minute. Pick a move and name it. Do not freeze through the moment. Do not voice the server.",
      },
      {
        id: "chain-restaurant-tuesday-event-2",
        title: "Bread refill",
        kind: "ambient",
        pitch:
          "Drop a second free basket on the table. Surfaces how the pair handles small abundance, sharing, or scarcity reflexes.",
        beat: "A fresh basket of breadsticks lands on the table. The original basket is still half full. Neither of them ordered it.",
        directorBeat:
          "Another basket just arrived unasked. Register the abundance in your next beat: offer one, push the basket toward your date, decline aloud, or comment on the gesture. Use the bread, do not glide past it.",
      },
      {
        id: "chain-restaurant-tuesday-event-3",
        title: "Check drop",
        kind: "provocation",
        pitch:
          "Land the check between you with no preamble. Forces the who-pays question into the open.",
        beat: "The check sits at the edge of the table in a leatherette folder. The folder is slightly warm from the kitchen window.",
        directorBeat:
          "The check just landed. Decide who reaches for it. Pay, offer to split, defer to your date, or invite them to handle it. Do not let the folder sit past your next line.",
      },
      {
        id: "chain-restaurant-tuesday-event-4",
        title: "Wrong fork",
        kind: "reveal",
        pitch:
          "A silent fix from the staff. Surfaces how the pair reads a small correction without making it a scene.",
        beat: "The server lifts a salad fork from beside the plate, replaces it with a dinner fork, and moves on. The candle in the small jar at the booth is unlit. The breadstick basket is on its third pass.",
        directorBeat:
          "A quiet correction just happened in your peripheral vision. Note it the way your character would: shrug it off, joke about it, ask why, or use it as a chance to soften the table. Engage with the fix, not the server. Do not voice the server.",
      },
      {
        id: "chain-restaurant-tuesday-event-5",
        title: "Tablet sleep",
        kind: "reveal",
        pitch:
          "Let the little booth screen go dark. Surfaces what either reaches for next when the gadget stops pulling attention.",
        beat: "The check tablet on the booth dims to its sleep screen. The booth's overhead speaker plays a smooth jazz instrumental at low volume. The room hum returns.",
        directorBeat:
          "The booth just got quieter. Use the pause to raise a topic, lean on something you already know about your date, or sit with the silence. Pick one and own it. Do not invent biography you have not already established.",
      },
      {
        id: "chain-restaurant-tuesday-event-6",
        title: "Booth twelve",
        kind: "ambient",
        pitch:
          "A toddler at the next booth creates a small public moment. Tests warmth without performance.",
        beat: "A red crayon rolls from booth twelve into the aisle. A parent leans down and retrieves it. The toddler waves at the entire dining room.",
        directorBeat:
          "A small public moment just happened two tables over. React in a way that reveals you: smile, glance, ignore, get visibly tense. Do not voice the toddler or the parent.",
      },
      {
        id: "chain-restaurant-tuesday-event-7",
        title: "Manager pass",
        kind: "ambient",
        pitch:
          "Pass the manager close enough to flag. Tests who reaches for staff attention and who lets it walk by.",
        beat: "The manager walks the floor in a polo shirt with a name tag clipped on. He passes booth fourteen, slows half a step, and keeps moving without speaking.",
        directorBeat:
          "The manager just gave you a near-attention pass. Choose: flag him for something, let him keep walking, or comment to your date about the slow-up. Do not voice the manager.",
      },
      {
        id: "chain-restaurant-tuesday-event-8",
        title: "Mints arrive",
        kind: "provocation",
        pitch:
          "Pair mints with the check folder. The booth is asking you to wrap up. Forces a clean stall or a clean handoff.",
        beat: "Two mints come in a small black dish on top of the closed leatherette folder. The kitchen pass-through has gone quiet. The breadstick basket is empty.",
        directorBeat:
          "The room is telling you it is time. Make the next move clear: settle the check, ask for another minute, propose what comes after, or stand. The booth is closing on you.",
      },
      {
        id: "chain-restaurant-tuesday-event-9",
        title: "Booth turn",
        kind: "provocation",
        pitch:
          "Stage the next pair next to your booth. Forces a graceful exit or a polite stall in front of new faces.",
        beat: "A host steps to the booth and sets two laminated menus and two folded napkins on the corner. The next pair waits at the host stand. The folder with the check is now half off the table.",
        directorBeat:
          "Another pair is waiting on your booth. Choose: stand to leave together, signal a graceful stall, suggest a next stop, or hand the booth over fast. Acknowledge the staging. Do not voice the host.",
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
