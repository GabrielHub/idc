import type { DateScenario } from "../../domain/game";

export const itWasCheeseAllAlong: DateScenario = {
  id: "it-was-cheese-all-along",
  title: "It Was Cheese All Along?",
  card: {
    summary:
      "A walking picnic across a dimensional moon where the surface, the basins, and the hills are different cheeses. One cart, one basket, one knife between two members.",
    tags: ["cosmic", "food", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 14,
    idealFor: [
      "members who can carve a wedge for the partner without a speech about it",
      "members who can be a tourist in their own appetite",
      "members whose taste includes a soft camembert and an older joke",
    ],
    badFor: [
      "members who turn a childhood food memory into a marriage application",
      "members who treat a soft basin as a survival scenario",
      "members who carve more than they can share",
    ],
  },
  publicBrief: {
    location: "Walking path between the cheese basins, surface of the cheese moon",
    premise:
      "Cupid booked a forty-minute walking picnic on a dimensional moon where the terrain is cheese. A cart, a basket, and one knife are provided. Anything carved out is theirs to take home.",
    whatBothCharactersKnow:
      "The atmosphere processor handles lactose. The path between basins is an aged cheddar firm enough to walk on. The basins hold softer cheeses. The cart has wheels for cheese terrain. The basket holds empty containers. The dome airlock reopens at the end of the booking.",
    openingSituation:
      "Both members are on the path. The cart sits between them. The basket is at one end of the cart. A single knife rests on a magnetic clip at the other end. The first basin, a wide brie, is a few steps ahead.",
  },
  director: {
    tone: "yellow light reflected off the surface, faint nutty air, a low creak from large wheels turning underfoot, a soft fermenting hiss from younger basins, the dome airlock at the horizon",
    flow: "activity",
    rules: [
      "Anchor the date to the walking path and the cart. The pair carves, tastes, and walks between basins, but does not roam past them.",
      "Treat the cheese as fact. The path is a stable cheddar. The basins are softer cheeses.",
      "Allow either member to skip a taste. Eating the ground is not a test.",
      "Do not voice the basket, the knife, the basins, or any cheese as a continuing speaker.",
    ],
    events: [
      {
        id: "it-was-cheese-all-along-event-1",
        title: "Earth in the sky",
        kind: "ambient",
        pitch:
          "Hang Earth low over the cheese horizon with yellow light bouncing off the path. Surfaces who looks up and who keeps their eyes on the cart.",
        beat: "Earth has risen low over the cheese horizon. The light off the path is a soft yellow. The shadow of the cart sits cleanly on the cheddar. The hum from the basins ahead has not changed.",
        directorBeat:
          "Home is in your sky and the light is the wrong color. Glance up, comment to your date on the yellow, point at the horizon, or keep your eyes on the cart. Show what your attention is for.",
      },
      {
        id: "it-was-cheese-all-along-event-2",
        title: "Surface creak",
        kind: "ambient",
        pitch:
          "Creak the cheddar underfoot as the moon turns. Surfaces a small bodily reminder that the ground is food.",
        beat: "The cheddar under their boots creaks once as the moon turns. The creak is low and slow. The cart's wheels keep rolling. The basket has not shifted.",
        directorBeat:
          "Your floor just told you it is alive. Shift your weight, comment to your date on the sound, laugh at the body underfoot, or keep walking without naming it. Use the body in your next beat.",
      },
      {
        id: "it-was-cheese-all-along-event-3",
        title: "Old peelings",
        kind: "ambient",
        pitch:
          "Curl a thin rind from a previous visitor near the edge of the brie. Surfaces we are not the first without forcing a comment.",
        beat: "A long thin curl of rind sits on the path at the edge of the brie basin. The curl is dry and clean. It was cut by hand. The basin behind it is otherwise smooth.",
        directorBeat:
          "Someone was here before you. Notice the curl, comment to your date on the cut, step over it, or pocket it. Do not invent who left it.",
      },
      {
        id: "it-was-cheese-all-along-event-4",
        title: "Brie slump",
        kind: "provocation",
        pitch:
          "Slump the brie basin in the afternoon warmth so a tongue of cheese runs across the path. Forces a physical call to route, lift, or carve.",
        beat: "The brie basin has slumped in the warm light. A soft tongue of brie has run across the path in front of the cart. The tongue is ankle high. The cart cannot roll through it without lifting.",
        directorBeat:
          "Your way is blocked by warm cheese. Lift the cart together, carve a wedge from the spill, route around through the cheddar, or stop here and taste. Coordinate with your date. Do not voice the basin.",
      },
      {
        id: "it-was-cheese-all-along-event-5",
        title: "Cart stuck",
        kind: "provocation",
        pitch:
          "Sink the cart's near wheel into a soft camembert pocket at the basin edge. Forces coordination to free it.",
        beat: "The cart's near wheel has sunk into a soft camembert pocket at the basin edge. The cart is tilted. The basket is sliding to one side. Both handles are within reach.",
        directorBeat:
          "Your cart is stuck and tipping. Lift the wheel together, take the basket off first, ask your date to pull while you push, or unload to lighten it. Use your hands. Do not voice the cart.",
      },
      {
        id: "it-was-cheese-all-along-event-6",
        title: "Young wheel hiss",
        kind: "provocation",
        pitch:
          "Set a young wheel hissing softly at the next basin with the skin taut. Forces a stance on touching, tasting, or routing around.",
        beat: "A young wheel at the next basin is hissing softly under a taut skin. The skin shows small bubbles. The hiss is steady. The path runs close to it.",
        directorBeat:
          "Something is happening inside the wheel and it is in your way. Touch the skin gently, carve a small test piece, route the cart wide, or wait it out with your date. Make the physical call.",
      },
      {
        id: "it-was-cheese-all-along-event-7",
        title: "Basket card",
        kind: "reveal",
        pitch:
          "Surface a small printed card in the basket pre-selecting cheeses from each member's listed childhood preferences. Forces a stance on whose nostalgia gets carved first.",
        beat: "A small printed card sits on top of the basket. The card reads: cheeses pre-selected from each member's listed childhood preferences. Two name lines are filled in. The basins ahead match the names.",
        directorBeat:
          "Two childhood cheeses are listed in writing. Carve into yours first, ask your date which is theirs, comment on the names, or leave the card folded. Speak to the choice. Do not voice the card.",
      },
      {
        id: "it-was-cheese-all-along-event-8",
        title: "One knife",
        kind: "reveal",
        pitch:
          "Hold the knife on a single magnetic clip with both basins ready to taste. Forces a clean offering across the cart.",
        beat: "The knife sits on its magnetic clip on the cart. There is one knife. Both members are within reach of the clip. The next basin is open for a first cut.",
        directorBeat:
          "Two of you and one blade. Take the knife first, slide it across to your date, ask which basin they want opened, or carve a piece and hand it over. Make the small offering visible.",
      },
      {
        id: "it-was-cheese-all-along-event-9",
        title: "Pre-cut wedge",
        kind: "reveal",
        pitch:
          "Plant a small wedge already cut from the camembert basin with a name tag beside it the pair does not recognize. Forces a stance on taking what was made for someone else.",
        beat: "A small wedge of camembert sits already cut at the basin edge. A paper tag rests beside it with a name on it. Neither member knows the name. The cut is fresh enough to glisten.",
        directorBeat:
          "Someone left a wedge for someone who is not you. Take it anyway, leave it alone, ask your date what they would do, or carve your own piece from the other side. Speak from what you actually feel about a stranger's leftovers.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the dimension as a content shoot and asks the partner to perform.",
      "A member uses a childhood food memory to corner the partner into a verdict on the relationship.",
    ],
    repeatBehavior:
      "If repeated, the basket remembers. The pre-selected basins are the same. The pre-cut wedge at the camembert basin carries the same name tag, refreshed.",
  },
  judgeRubric: {
    successSignals: [
      "A member carves a wedge for the partner without naming it as a gift.",
      "The pair shares the one knife without coordinating it as a project.",
    ],
    failureSignals: [
      "A member uses the cheese to demonstrate sophistication at the partner.",
      "The pair argues about which basin is best.",
    ],
    statFocus: ["chemistry", "trust", "weirdnessTolerance"],
  },
};
