import type { DateScenario } from "../../domain/game";

export const moonglassKilnAfterHours: DateScenario = {
  id: "moonglass-kiln-after-hours",
  title: "Moonglass Kiln, After Hours",
  card: {
    summary:
      "A two-bench glassblowing studio on Chang'e's standing concession to mortals. Each member blows one piece for the partner. Pieces that survive go home; pieces that crack do not.",
    tags: ["cosmic", "low_pressure"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    idealFor: [
      "members who can make a small thing for the partner and let the partner have it",
      "members who can fail at a craft in front of the partner",
      "members who can let the partner's piece be what the partner chose",
    ],
    badFor: [
      "members who treat the gift as a reflection of themselves",
      "members who narrate the craft to the partner",
      "members who use the heat as a stage",
    ],
  },
  publicBrief: {
    location:
      "The Moonglass Kiln, two benches under a pinned note, after-hours booking on Chang'e's standing concession",
    premise:
      "Cupid booked a ninety-minute session at the kiln. The master is in the Jade Palace and stays there. Each member blows one piece of glass for the partner.",
    whatBothCharactersKnow:
      "The kiln runs at temperature. Two furnaces, two punties, a wall of color rods including lunar silver and cloud rose, a marver, and an annealing oven on a countdown. Notes pinned at each bench cover the technique. A small pinned card at the order desk in the master's hand reads: for what should not be carried alone. Each member blows one piece for the partner. They cannot work their own. Pieces that survive go home. Pieces that crack or anneal poorly do not.",
    openingSituation:
      "Both members are at the order desk. The pyrometer at each bench reads at working temperature. The wall of color rods is lit. The annealing oven door is closed and the countdown is at zero, waiting.",
  },
  director: {
    tone: "the steady roar of two furnaces at low setting, warm dry air, the faint metal smell, the soft hiss of a piece coming off the punty",
    rules: [
      "Anchor the date to the two benches and the order desk. The pair does not wander the kiln.",
      "Treat the kiln as automated. The master is not here and does not return during the session.",
      "Each member blows one piece for the partner. They cannot work their own piece.",
      "Treat the produced pieces as real. Cracks are real, and pieces that crack do not go home.",
      "Allow real failure. A failed piece is a clean outcome.",
    ],
    events: [
      {
        id: "moonglass-kiln-after-hours-event-1",
        title: "Pinned note",
        kind: "reveal",
        event: "The pinned note at the order desk is in the master's hand.",
        characterVisibleText:
          "A small pinned card at the order desk reads, in the master's hand: for what should not be carried alone. The card has no signature. The corner has a small chip.",
        directorInstruction:
          "Use the small line to surface intent drawn from existing context. Either may read the note, skip it, or comment on it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "moonglass-kiln-after-hours-event-2",
        title: "Color rod menu",
        kind: "ambient",
        event: "The color rod menu at one bench lights up.",
        characterVisibleText:
          "The color rod menu at the first bench lights up. The list includes lunar silver, cloud rose, deep sea, and a row marked house pick. Each rod is in its own slot at the wall. The marver beside the bench is clean and warm.",
        directorInstruction:
          "Allow the small choice without forcing it. The pair does not need to pick at the same beat.",
      },
      {
        id: "moonglass-kiln-after-hours-event-3",
        title: "First gather",
        kind: "provocation",
        event: "A first gather on the punty hits working temperature.",
        characterVisibleText:
          "A first gather on the punty hits working temperature. The molten glass at the end of the rod sits in a small heavy ball. The marver waits. The pyrometer reads at the working line.",
        directorInstruction:
          "Push for a clean physical move on the gather: roll on the marver, take a breath, or set the punty back in the furnace. The glass is hot now and waits. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "moonglass-kiln-after-hours-event-4",
        title: "Partner's piece forms",
        kind: "reveal",
        event: "The partner's piece begins to take a form.",
        characterVisibleText:
          "The piece at the first bench begins to take a form. The shape is small and one-handed. The pyrometer at the second bench reads at the working line still. The annealing oven door is closed and the countdown is at zero.",
        directorInstruction:
          "Use the small forming piece to surface attention drawn from existing context. Either may speak to the partner about the shape, ask once, or work in quiet. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "moonglass-kiln-after-hours-event-5",
        title: "Annealing oven ready",
        kind: "ambient",
        event: "The annealing oven door clicks ready.",
        characterVisibleText:
          "The annealing oven door clicks once at the side of the kiln. The countdown panel beside it shows the next window opens in two minutes. The door is at chest height. The inside of the oven is at the holding temperature.",
        directorInstruction:
          "Allow the small mechanical cue. The pair does not need to use the next window.",
      },
      {
        id: "moonglass-kiln-after-hours-event-6",
        title: "Crack while soft",
        kind: "provocation",
        event: "A small crack appears in one piece while still soft.",
        characterVisibleText:
          "A small crack appears in the first piece while the glass is still soft. The crack is in the lower third. The piece can be reshaped on the marver or set down on the slab. The pyrometer is steady.",
        directorInstruction:
          "Push for a clean call on the crack: reshape on the marver, set down on the slab, or quench. The piece is real and the choice has weight. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "moonglass-kiln-after-hours-event-7",
        title: "Second piece on the punty",
        kind: "reveal",
        event: "The second piece is on the punty at the second bench.",
        characterVisibleText:
          "The second piece is on the punty at the second bench. The gather is at working temperature. The color rod is in the slot at the wall, still warm. The marver at the second bench is clean.",
        directorInstruction:
          "Use the second piece to surface care drawn from existing context. The partner's choice for the second piece may be made aloud or held quiet. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "moonglass-kiln-after-hours-event-8",
        title: "Warm-down chime",
        kind: "ambient",
        event: "A soft warm-down chime sounds at eighty minutes.",
        characterVisibleText:
          "A soft chime sounds in the kiln. The countdown panel at the annealing oven shows ten minutes to the close. The furnaces hold a low setting. The wall of color rods has dimmed to half.",
        directorInstruction: "Allow the small marker. The pair does not need to rush the work.",
      },
      {
        id: "moonglass-kiln-after-hours-event-9",
        title: "Anneal close",
        kind: "provocation",
        event: "The annealing oven door closes on the last window.",
        characterVisibleText:
          "The annealing oven door closes on the last window. The countdown panel reads anneal in progress. The two pieces are inside. The kiln has stepped to the warm-down setting.",
        directorInstruction:
          "Push for a clean exit from the kiln. The pair waits the anneal together, walks the desk, or steps out of the booking. The pieces close at the chime. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the partner's piece as a reflection of themselves.",
      "A member uses the heat as a stage.",
    ],
    repeatBehavior:
      "If repeated, the kiln keeps the prior session on file. The pinned note is unchanged. The color rod slots remember the prior picks.",
  },
  judgeRubric: {
    successSignals: [
      "A member blows a piece for the partner and lets the partner have it as is.",
      "A member fails a piece at the marver and does not turn the failure on the partner.",
    ],
    failureSignals: [
      "A member narrates the craft to the partner instead of working.",
      "The pair argues about which piece is bigger.",
    ],
    statFocus: ["trust", "relationshipHealth", "weirdnessTolerance"],
  },
};
