import type { DateScenario } from "../../domain/game";

export const dimSumAndThenSome: DateScenario = {
  id: "dim-sum-and-then-some",
  title: "Dim Sum and Then Some",
  card: {
    summary:
      "A courtyard table at a teahouse folded onto an alley that does not stay in one city. Five bamboo carts roll a slow loop. The dishes are dim sum, the source is from somewhere else.",
    tags: ["cosmic", "food", "public"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    cost: 15,
    idealFor: [
      "members who can take a basket without asking what's in it",
      "members who can wave a cart on without making it a stand",
      "members who can split a steamer without keeping score",
    ],
    badFor: [
      "members who treat the source of an ingredient as a debate",
      "members who use the strangeness to skip the meal",
      "members who score the partner's tolerance for an unfamiliar bite",
    ],
  },
  publicBrief: {
    location: "Courtyard table, second floor of the Long Jade House, off the moon gate alley",
    premise:
      "Cupid booked a two-stool table at a dim sum house that sits at a fold between this city and somewhere upcoast. The carts roll, the dishes are dim sum, the source is from somewhere else.",
    whatBothCharactersKnow:
      "The courtyard holds six low tables under paper lanterns. Five bamboo carts run a slow loop. One cart holds buns. One holds har gow and siu mai. One holds chicken feet and rib. One holds lotus rice parcels. One holds sweets. The chef works behind a beaded curtain at the back of the courtyard. A brass kettle on the table refills the cup that emptied first. The bill is a paper chit kept in a small teapot at the side. Coin or chit pays. Cart attendants nod and do not speak. The moon gate at the back of the courtyard does not open onto the alley.",
    openingSituation:
      "Both members sit at the courtyard table. Two cups are filled. The chit teapot is empty on the side. The bun cart is two tables away on its loop. A red lantern hangs above the table. The moon gate at the back is closed.",
  },
  director: {
    tone: "the soft knock of bamboo on bamboo, the steady tap of a cleaver from behind the beaded curtain, the warm steam from a passing cart, the brass smell of the kettle, lantern light that does not match the hour outside",
    rules: [
      "Anchor the date to the courtyard table. The pair does not leave the table.",
      "Treat the carts as ordinary carts. The source of an ingredient is the room, not a bit.",
      "Allow either member to wave a cart on. Refusing a basket is not a test.",
      "Do not voice the cart attendants, the chef, the kettle, or the cleaver as continuing speakers.",
    ],
    events: [
      {
        id: "dim-sum-and-then-some-event-1",
        title: "Bun cart rolls by",
        kind: "ambient",
        pitch:
          "Roll the bun cart past with all lids closed. Surfaces whether either flags it or lets it pass.",
        beat: "The bun cart rolls past the table on its loop with all five lids closed. The cart turns at the next corner of the courtyard and continues the loop. No basket is opened.",
        directorBeat:
          "A cart of buns just went by without stopping. Wave it back, comment on the lids staying shut, ask your date what they want, or let it go. Make the small claim or refusal visible.",
      },
      {
        id: "dim-sum-and-then-some-event-2",
        title: "Kettle refill",
        kind: "ambient",
        pitch:
          "Tip the brass kettle on its hook to refill whichever cup emptied first. Surfaces who notices the small magic.",
        beat: "The brass kettle on the table tips on its hook without a hand. A steady stream fills the cup that emptied first. The kettle resets at its angle. The second cup is still full.",
        directorBeat:
          "The kettle just served itself for you. Watch it, comment to your date on the gesture, sip and say nothing, or wave it off. Do not narrate the magic like a guidebook.",
      },
      {
        id: "dim-sum-and-then-some-event-3",
        title: "Lantern sway",
        kind: "ambient",
        pitch:
          "Sway only your red lantern a hand's width while the others hold steady. Surfaces a small private signal between you.",
        beat: "The red lantern hanging above the table sways a hand's width and settles. The other lanterns in the courtyard hold steady. The lattice in front of the table does not move.",
        directorBeat:
          "Your lantern just moved. Glance up, point it out to your date, sit with the small omen, or comment on the stillness around you. Stay honest about how it feels.",
      },
      {
        id: "dim-sum-and-then-some-event-4",
        title: "Cart pause, char siu bao",
        kind: "provocation",
        pitch:
          "Stop the bun cart at the table with the steamer lid lifted. Forces a clean choice on the basket, decline, or pivot to another cart.",
        beat: "The bun cart stops at the edge of the table. The cart attendant lifts the lid on a steamer of char siu bao and stands with the lid in one hand. The attendant nods once and waits at the cart.",
        directorBeat:
          "A waiting attendant has a steamer open in front of you. Take the basket, decline aloud, wave for a different cart, or ask your date what they want. Do not freeze. Do not voice the attendant.",
      },
      {
        id: "dim-sum-and-then-some-event-5",
        title: "Lotus parcel ember",
        kind: "provocation",
        pitch:
          "Set down a lotus parcel and have its leaves unfurl to reveal a small dull ember on the rice. Forces a clean choice: eat, lift the ember, or set the parcel aside.",
        beat: "A wrapped lotus leaf parcel is set on the table by the passing rice cart. The string ties part under the heat of a hand. When the leaves fold back, a small dull ember sits on top of the rice. The ember does not catch.",
        directorBeat:
          "Something strange is on your rice. Pluck the ember off and continue, hand the parcel across, push it aside, or comment on the heat. Pick and own it.",
      },
      {
        id: "dim-sum-and-then-some-event-6",
        title: "A har gow holds a note",
        kind: "provocation",
        pitch:
          "Open a har gow basket where the top dumpling holds one low constant note. Forces a clean choice on eating it, halving it, or setting it aside.",
        beat: "A small bamboo basket of har gow arrives at the table. When the lid lifts, the top dumpling on the front row holds a single low note. The note does not change pitch. The other dumplings sit quiet on the wax paper.",
        directorBeat:
          "One of your dumplings is singing. Eat it without comment, halve it with your date, ask if they hear it, or push the basket aside. Do not voice the dumpling.",
      },
      {
        id: "dim-sum-and-then-some-event-7",
        title: "Chit teapot",
        kind: "reveal",
        pitch:
          "Warm the side teapot to reveal a chit naming each dish's source by hill, bay, year, and home. Surfaces a stance drawn from what you already know.",
        beat: "The small teapot at the side of the table is now warm. Inside, a folded paper chit lists each dish on a line of its own. The line for the buns names a hill upcoast where the herds run larger than the local kind. The line for the dumplings names a bay where the catch sang. The line for the rice parcel names the year of the gate. The line for the sweets names the chef's home. The chit is unsigned.",
        directorBeat:
          "A list of sources just appeared in the teapot. Read one line aloud, ask your date which they recognize, fold the chit closed, or set it back. Speak only from what you already carry. Do not voice the chit.",
      },
      {
        id: "dim-sum-and-then-some-event-8",
        title: "Steamer base stamp",
        kind: "reveal",
        pitch:
          "Lift the top steamer to reveal an ink stamp naming a city not on the local map. Surfaces stance on the strangeness.",
        beat: "When the empty steamer at the top of the stack is lifted off, the base shows a small ink stamp pressed into the bamboo. The stamp is in the same hand as the chit. The stamp names a city that does not sit on the local map.",
        directorBeat:
          "There is a city named on the bottom of your steamer. Read it aloud, ask your date if they have heard of it, comment on the hand that wrote it, or set the steamer back down. Stay honest.",
      },
      {
        id: "dim-sum-and-then-some-event-9",
        title: "Old chit in the chopstick holder",
        kind: "reveal",
        pitch:
          "Tuck a folded prior-visit chit into the chopstick holder with both first initials at the top. Surfaces a small callback or curiosity.",
        beat: "A small folded chit sits in the chopstick holder at the corner of the table. The chit lists a prior order in pencil. Both their first initials sit at the top of the chit in the same hand.",
        directorBeat:
          "A chit with your initials is in the chopstick holder. Read the prior order, ask your date if they remember it, slide it across, or pocket it. Tie it to something you already know about you and them.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the source of an ingredient as a hostage in conversation.",
      "A member treats the partner's bite as a measure of nerve.",
    ],
    repeatBehavior:
      "If repeated, the courtyard table is held for the pair. The brass kettle sits at the same angle, the five carts run the same loop, the chef stays behind the curtain. The old chit in the chopstick holder from the prior visit carries the prior order in pencil at the top.",
  },
  judgeRubric: {
    successSignals: [
      "A member takes a basket without asking what's in it.",
      "The pair splits a steamer without making it a transaction.",
    ],
    failureSignals: [
      "A member treats an ingredient source as a debate.",
      "The pair argues about whether to send a basket back.",
    ],
    statFocus: ["chemistry", "trust", "weirdnessTolerance"],
  },
};
