import type { DateScenario } from "../../domain/game";

export const hawkerFloorSixBranches: DateScenario = {
  id: "hawker-floor-six-branches",
  title: "Hawker Floor, Six Branches",
  card: {
    summary:
      "A covered hawker floor at the join of six branches. Six stalls clash by design, plastic stools at a shared two-top, a fan blowing into the table.",
    tags: ["cosmic", "food", "public", "repeat_risk"],
    risk: "medium",
    intimacy: "medium",
    chaos: "high",
    cost: 9,
    idealFor: [
      "members who can pick a stall on their own and bring food back",
      "members who can sit under a fan and eat six things",
      "members who can let a partner refuse a stall without scoring it",
    ],
    badFor: [
      "members who treat the floor as a pitch deck",
      "members who score the partner's stall choice",
      "members who use the loud floor to skip the conversation",
    ],
  },
  publicBrief: {
    location: "Hawker floor, six-branch corner, two-top at the fan",
    premise:
      "Cupid booked a two-top at a covered hawker floor where six stalls from six branches share a dish floor. The smell layers in the air do not reconcile.",
    whatBothCharactersKnow:
      "Six stalls run a loop around the dish floor: a plate knight's plasma hog, an auto-ramen counter run from an altar, a skeleton hand-pull, a faerie dumpling cart with no operator, a psionic curry stall that hands out a smooth stone, and a drowned cathedral broth counter with a chain-hung ladle. Order chits print at each counter. Any coin works. The two-top has a fan blowing into it. Trays come back to the table.",
    openingSituation:
      "Both members stand at the edge of the floor with empty trays. The two-top is two stools over. The fan is on. The plate knight's stall is on the right. The drowned cathedral counter is at the far back.",
  },
  director: {
    tone: "the fan on the table, the smell layers that do not match, the soft clink of melamine trays one row over, the steady tap of one cleaver against a board",
    flow: "activity",
    rules: [
      "Anchor the date to the two-top and the six-stall loop. The pair does not leave the floor.",
      "Treat the stalls as ordinary stalls. The clash is the venue, not the joke.",
      "Allow either member to skip a stall. Skipping is not a test.",
      "Do not voice the stall operators, the cleaver, or any background line as continuing speakers.",
    ],
    events: [
      {
        id: "hawker-floor-six-branches-event-1",
        title: "Smell layers",
        kind: "ambient",
        pitch:
          "Cross plasma char, faerie steam, and curry warmth at the fan all at once. Surfaces a small choice on which smell either follows first.",
        beat: "The plasma char from the knight's stall and the steam from the faerie cart cross the fan at the table at the same time. The curry warmth follows. The smells do not blend. They sit at separate heights.",
        directorBeat:
          "Three smells just hit the table separately. Name one to your date, walk to that stall, refuse to choose, or close your eyes and let them mix. Speak from what your gut wants.",
      },
      {
        id: "hawker-floor-six-branches-event-2",
        title: "Queue ping",
        kind: "ambient",
        pitch:
          "Ping the curry stall display once with the line stalled. Surfaces whether either notices the small loop tightening.",
        beat: "A small queue ping sounds once at the curry stall. A number flashes on a small display on the counter. The line at the stall has not moved.",
        directorBeat:
          "The curry stall just nudged you. Glance, comment on the stalled line to your date, walk over to check, or stay at the table. Make the small choice. Do not voice the display.",
      },
      {
        id: "hawker-floor-six-branches-event-3",
        title: "Tray crash",
        kind: "ambient",
        pitch:
          "Crash a melamine tray one row over with two strangers crouching to pick up plates. Surfaces care or pacing without scoring.",
        beat: "A melamine tray hits the dish floor one row over. Plates scatter. Two figures crouch to pick up the pieces. The crash does not draw the stalls.",
        directorBeat:
          "Something just broke at another table. Look once and look back, comment on the spill, offer to help, or hold your seat. Show whether you reach for strangers.",
      },
      {
        id: "hawker-floor-six-branches-event-4",
        title: "Smooth stone slides over",
        kind: "provocation",
        pitch:
          "Slide a warm grey curry stone across the two-top from the right. Forces a real physical move on the stone.",
        beat: "A smooth grey stone slides across the two-top from the right and stops near the closer hand. The stone is the same as the one held by the curry stall line. The stone is warm and dry.",
        directorBeat:
          "A stone is now in front of you. Pick it up, slide it back, hand it to your date, or comment on the warmth. Decide cleanly. Do not voice the stone.",
      },
      {
        id: "hawker-floor-six-branches-event-5",
        title: "Faerie dumpling appears",
        kind: "provocation",
        pitch:
          "Land a single steaming dumpling on the tray with no chit. Forces a real read: take, share, or set aside.",
        beat: "A small steaming dumpling appears on the tray between them. No chit. No cloak in sight at the cart. The wax paper under the dumpling is unmarked.",
        directorBeat:
          "An anonymous dumpling is on your tray. Take it, halve it with your date, push it aside with a comment, or trade for what's on your tray. Pick.",
      },
      {
        id: "hawker-floor-six-branches-event-6",
        title: "Extra broth pour",
        kind: "provocation",
        pitch:
          "Pour a third small bowl from the chain-hung ladle onto the rail. Forces a real choice on claiming, leaving, or trading the extra.",
        beat: "The chain-hung ladle at the back counter dips and pours a third small bowl onto the rail. The first two bowls on the rail belong to the pair's order. The third sits alone.",
        directorBeat:
          "A third bowl is sitting unclaimed. Walk back and bring it to the table, leave it, ask your date if they want it, or offer it to the next person in line. Make the choice. Do not voice the ladle.",
      },
      {
        id: "hawker-floor-six-branches-event-7",
        title: "Plate knight's chit",
        kind: "reveal",
        pitch:
          "Print a single penciled note at the bottom of the plate knight's chit. Surfaces a stance drawn only from what either already carries.",
        beat: "The chit from the plate knight's stall prints with a single short note in pencil at the bottom. The note is in a script that fits the stall. The chit is otherwise standard.",
        directorBeat:
          "A small note was added to your chit. Read it aloud, comment on the script, show it to your date, or pocket it. Speak only from what you already carry. Do not voice the chit.",
      },
      {
        id: "hawker-floor-six-branches-event-8",
        title: "Skeleton chit on the hook",
        kind: "reveal",
        pitch:
          "Hang an unattributed chit on the side hook at the skeleton stall in sight line. Surfaces a stance drawn from your own register.",
        beat: "The skeleton at the hand-pull stall hangs a chit on the side hook at the corner of the counter. The chit lists no order. The hook is in line of sight from the two-top.",
        directorBeat:
          "A blank chit is hanging out for anyone. Comment on it, walk over to read it, ask your date what they make of it, or ignore the hook. Do not voice the skeleton.",
      },
      {
        id: "hawker-floor-six-branches-event-9",
        title: "Old chit on the table",
        kind: "reveal",
        pitch:
          "Surface a pale prior-visit chit under the napkin holder. Surfaces a callback for repeat pairs or curiosity for first visits.",
        beat: "A pale chit sits under the napkin holder at the corner of the two-top. The chit lists a previous order in pencil at the top. The pencil is from the bulletin near the coin slot at one of the stalls.",
        directorBeat:
          "An old chit is at your table. Read the prior order, ask your date if they remember the meal, slide it across, or pocket it. Tie it to what you already know about you and them.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the stall clash as a metaphor for the date.",
      "A member scores the partner's stall choice.",
    ],
    repeatBehavior:
      "If repeated, the two-top is held for the pair. The fan is on, the six stalls run, the smell layers cross. The old chit from the prior visit sits under the napkin holder.",
  },
  judgeRubric: {
    successSignals: [
      "A member brings a tray back to the table without asking the partner to come.",
      "The pair holds a stall refusal without making it a test.",
    ],
    failureSignals: [
      "A member treats the floor as a pitch deck.",
      "The pair argues about which stall the dumpling came from.",
    ],
    statFocus: ["chemistry", "trust", "stability", "weirdnessTolerance"],
  },
};
