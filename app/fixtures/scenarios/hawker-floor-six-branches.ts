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
        event: "The smell layers cross at the table.",
        characterVisibleText:
          "The plasma char from the knight's stall and the steam from the faerie cart cross the fan at the table at the same time. The curry warmth follows. The smells do not blend. They sit at separate heights.",
        directorInstruction:
          "Allow the small marker. The fan is not voiced as a continuing speaker.",
      },
      {
        id: "hawker-floor-six-branches-event-2",
        title: "Queue ping",
        kind: "ambient",
        event: "A queue ping sounds once at one of the stalls.",
        characterVisibleText:
          "A small queue ping sounds once at the curry stall. A number flashes on a small display on the counter. The line at the stall has not moved.",
        directorInstruction:
          "Allow the small marker. The display is not voiced as a continuing speaker.",
      },
      {
        id: "hawker-floor-six-branches-event-3",
        title: "Tray crash",
        kind: "ambient",
        event: "A melamine tray crashes one row over.",
        characterVisibleText:
          "A melamine tray hits the dish floor one row over. Plates scatter. Two figures crouch to pick up the pieces. The crash does not draw the stalls.",
        directorInstruction:
          "Allow the small marker. The figures are not voiced as continuing speakers.",
      },
      {
        id: "hawker-floor-six-branches-event-4",
        title: "Smooth stone slides over",
        kind: "provocation",
        event: "A smooth stone from the curry stall slides across the table.",
        characterVisibleText:
          "A smooth grey stone slides across the two-top from the right and stops near the closer hand. The stone is the same as the one held by the curry stall line. The stone is warm and dry.",
        directorInstruction:
          "Push for a real physical move. Either may pick the stone up, leave it, or pass it back. The stone is not voiced as a continuing speaker.",
      },
      {
        id: "hawker-floor-six-branches-event-5",
        title: "Faerie dumpling appears",
        kind: "provocation",
        event: "A single dumpling appears on the tray.",
        characterVisibleText:
          "A small steaming dumpling appears on the tray between them. No chit. No cloak in sight at the cart. The wax paper under the dumpling is unmarked.",
        directorInstruction:
          "Push for a real read. Either may take the dumpling, share it, or set it aside. The dumpling is not voiced as a continuing speaker.",
      },
      {
        id: "hawker-floor-six-branches-event-6",
        title: "Extra broth pour",
        kind: "provocation",
        event: "The broth ladle pours an extra serving.",
        characterVisibleText:
          "The chain-hung ladle at the back counter dips and pours a third small bowl onto the rail. The first two bowls on the rail belong to the pair's order. The third sits alone.",
        directorInstruction:
          "Push for a real choice. Either may bring the third bowl over, leave it, or trade it across the line. The ladle is not voiced as a continuing speaker.",
      },
      {
        id: "hawker-floor-six-branches-event-7",
        title: "Plate knight's chit",
        kind: "reveal",
        event: "The plate knight's chit prints a small extra note.",
        characterVisibleText:
          "The chit from the plate knight's stall prints with a single short note in pencil at the bottom. The note is in a script that fits the stall. The chit is otherwise standard.",
        directorInstruction:
          "Use the small note to surface a stance drawn only from existing context. The chit is not voiced as a continuing speaker.",
      },
      {
        id: "hawker-floor-six-branches-event-8",
        title: "Skeleton chit on the hook",
        kind: "reveal",
        event: "The skeleton stall hangs a chit on the side hook.",
        characterVisibleText:
          "The skeleton at the hand-pull stall hangs a chit on the side hook at the corner of the counter. The chit lists no order. The hook is in line of sight from the two-top.",
        directorInstruction:
          "Use the small hook to surface a stance drawn only from existing context. The skeleton does not speak and is not voiced as a continuing speaker.",
      },
      {
        id: "hawker-floor-six-branches-event-9",
        title: "Old chit on the table",
        kind: "reveal",
        event: "An old chit sits under the napkin holder.",
        characterVisibleText:
          "A pale chit sits under the napkin holder at the corner of the two-top. The chit lists a previous order in pencil at the top. The pencil is from the bulletin near the coin slot at one of the stalls.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The chit is not voiced as a continuing speaker.",
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
