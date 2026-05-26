import type { DateScenario } from "../../domain/game";

export const moonglassKilnAfterHours: DateScenario = {
  id: "moonglass-kiln-after-hours",
  title: "Breaking Up Is Hard To Do",
  card: {
    summary:
      "A two-bench glassblowing studio on Chang'e's standing concession to mortals. Each member blows one piece for the partner. Pieces that survive go home; pieces that crack do not.",
    tags: ["cosmic", "low_pressure"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    cost: 14,
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
        pitch:
          "Pin the master's card at the desk: for what should not be carried alone. Surfaces intent on what you're here to make for the partner.",
        beat: "A small pinned card at the order desk reads, in the master's hand: for what should not be carried alone. The card has no signature. The corner has a small chip.",
        directorBeat:
          "The card is telling you what this is for. Read it aloud, comment on the chipped corner, ask your date what they read into it, or take it on without comment. Be honest about intent. Do not voice the card.",
      },
      {
        id: "moonglass-kiln-after-hours-event-2",
        title: "Color rod menu",
        kind: "ambient",
        pitch:
          "Light up the rod wall with lunar silver, cloud rose, deep sea, and house pick. Surfaces taste for the piece you will make for them.",
        beat: "The color rod menu at the first bench lights up. The list includes lunar silver, cloud rose, deep sea, and a row marked house pick. Each rod is in its own slot at the wall. The marver beside the bench is clean and warm.",
        directorBeat:
          "Pick a color for your partner. Walk to the slot, comment on lunar silver, ask them which they would want, or take house pick on purpose. Make the choice visible.",
      },
      {
        id: "moonglass-kiln-after-hours-event-3",
        title: "First gather",
        kind: "provocation",
        pitch:
          "Heat the first gather on the punty at working temperature with the marver clean. Forces a clean physical move on hot glass.",
        beat: "A first gather on the punty hits working temperature. The molten glass at the end of the rod sits in a small heavy ball. The marver waits. The pyrometer reads at the working line.",
        directorBeat:
          "Hot glass is in your hand. Roll on the marver, take a breath and shape, set the punty back in the furnace, or hand off to your date if it is their turn. Move now. Do not voice the punty.",
      },
      {
        id: "moonglass-kiln-after-hours-event-4",
        title: "Partner's piece forms",
        kind: "reveal",
        pitch:
          "Shape the first piece into a small one-handed form. Surfaces attention to what your partner can hold.",
        beat: "The piece at the first bench begins to take a form. The shape is small and one-handed. The pyrometer at the second bench reads at the working line still. The annealing oven door is closed and the countdown is at zero.",
        directorBeat:
          "The piece is becoming a thing. Name what it is to your date, ask once if they want it smaller, work in quiet, or comment on how it sits. Do not project a story onto it. Do not voice the piece.",
      },
      {
        id: "moonglass-kiln-after-hours-event-5",
        title: "Annealing oven ready",
        kind: "ambient",
        pitch:
          "Click the annealing oven door ready with the next window two minutes out. Surfaces a small mechanical cue the pair can take or skip.",
        beat: "The annealing oven door clicks once at the side of the kiln. The countdown panel beside it shows the next window opens in two minutes. The door is at chest height. The inside of the oven is at the holding temperature.",
        directorBeat:
          "The oven is offering you the next window. Plan for it, finish your shape, ask your date if they will catch this window or the next, or sit through it. Do not rush.",
      },
      {
        id: "moonglass-kiln-after-hours-event-6",
        title: "Crack while soft",
        kind: "provocation",
        pitch:
          "Crack the first piece in the lower third while still soft. Forces a clean call: reshape on the marver, slab, or quench.",
        beat: "A small crack appears in the first piece while the glass is still soft. The crack is in the lower third. The piece can be reshaped on the marver or set down on the slab. The pyrometer is steady.",
        directorBeat:
          "Your gift just cracked while it could still be worked. Reshape on the marver, set down on the slab, quench it and let it not go home, or ask your date what they want. Speak the choice.",
      },
      {
        id: "moonglass-kiln-after-hours-event-7",
        title: "Second piece on the punty",
        kind: "reveal",
        pitch:
          "Bring the second gather to working temperature at the partner's bench. Surfaces care drawn from what you already know about them.",
        beat: "The second piece is on the punty at the second bench. The gather is at working temperature. The color rod is in the slot at the wall, still warm. The marver at the second bench is clean.",
        directorBeat:
          "Your partner's turn just opened. Watch them, ask what they want you to do for them, work quietly in parallel, or share a small line about what you are seeing. Speak from what you already know.",
      },
      {
        id: "moonglass-kiln-after-hours-event-8",
        title: "Warm-down chime",
        kind: "ambient",
        pitch:
          "Chime warm-down with ten minutes to the close and the rod wall dimmed to half. Surfaces pace, not panic.",
        beat: "A soft chime sounds in the kiln. The countdown panel at the annealing oven shows ten minutes to the close. The furnaces hold a low setting. The wall of color rods has dimmed to half.",
        directorBeat:
          "The kiln is winding down. Hold your pace, finish the shape calmly, comment to your date on the dim light, or set your piece on the slab. Do not rush.",
      },
      {
        id: "moonglass-kiln-after-hours-event-9",
        title: "Anneal close",
        kind: "provocation",
        pitch:
          "Close the annealing oven door on the last window with both pieces inside. Forces a clean exit from the kiln.",
        beat: "The annealing oven door closes on the last window. The countdown panel reads anneal in progress. The two pieces are inside. The kiln has stepped to the warm-down setting.",
        directorBeat:
          "Both gifts are in the oven now. Wait the anneal together at the desk, propose where to go next, ask your date what they hope theirs looks like, or step out of the booking. Make the call. Do not voice the oven.",
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
