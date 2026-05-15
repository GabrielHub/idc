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
        event: "The bun cart rolls past the table on its loop.",
        characterVisibleText:
          "The bun cart rolls past the table on its loop with all five lids closed. The cart turns at the next corner of the courtyard and continues the loop. No basket is opened.",
        directorInstruction:
          "Allow the small marker. The cart is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-2",
        title: "Kettle refill",
        kind: "ambient",
        event: "The brass kettle tips and refills a cup on its own.",
        characterVisibleText:
          "The brass kettle on the table tips on its hook without a hand. A steady stream fills the cup that emptied first. The kettle resets at its angle. The second cup is still full.",
        directorInstruction:
          "Allow the small magic. The kettle is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-3",
        title: "Lantern sway",
        kind: "ambient",
        event: "The red lantern above the table sways without a wind.",
        characterVisibleText:
          "The red lantern hanging above the table sways a hand's width and settles. The other lanterns in the courtyard hold steady. The lattice in front of the table does not move.",
        directorInstruction:
          "Allow the small marker. The lantern is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-4",
        title: "Cart pause, char siu bao",
        kind: "provocation",
        event: "The bun cart pauses at the table and a steamer lid lifts.",
        characterVisibleText:
          "The bun cart stops at the edge of the table. The cart attendant lifts the lid on a steamer of char siu bao and stands with the lid in one hand. The attendant nods once and waits at the cart.",
        directorInstruction:
          "Push for a real choice. Either may take the basket, decline the offer, or wave at a different cart. The attendant does not speak and is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-5",
        title: "Lotus parcel ember",
        kind: "provocation",
        event: "A lotus leaf parcel is set on the table by a passing cart.",
        characterVisibleText:
          "A wrapped lotus leaf parcel is set on the table by the passing rice cart. The string ties part under the heat of a hand. When the leaves fold back, a small dull ember sits on top of the rice. The ember does not catch.",
        directorInstruction:
          "Push for a real move. Either may eat the parcel, lift the ember off, or set the parcel aside. The cart is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-6",
        title: "A har gow holds a note",
        kind: "provocation",
        event: "A har gow basket arrives and the top dumpling holds a single low note.",
        characterVisibleText:
          "A small bamboo basket of har gow arrives at the table. When the lid lifts, the top dumpling on the front row holds a single low note. The note does not change pitch. The other dumplings sit quiet on the wax paper.",
        directorInstruction:
          "Push for a real choice. Either may eat the singing dumpling, halve it, or set the basket aside. The dumpling is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-7",
        title: "Chit teapot",
        kind: "reveal",
        event: "The chit teapot at the side now holds a paper chit naming each source.",
        characterVisibleText:
          "The small teapot at the side of the table is now warm. Inside, a folded paper chit lists each dish on a line of its own. The line for the buns names a hill upcoast where the herds run larger than the local kind. The line for the dumplings names a bay where the catch sang. The line for the rice parcel names the year of the gate. The line for the sweets names the chef's home. The chit is unsigned.",
        directorInstruction:
          "Use the chit to surface a small honest reaction drawn only from existing context. The chit is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-8",
        title: "Steamer base stamp",
        kind: "reveal",
        event: "The base of an empty steamer carries an ink stamp from the chef's source.",
        characterVisibleText:
          "When the empty steamer at the top of the stack is lifted off, the base shows a small ink stamp pressed into the bamboo. The stamp is in the same hand as the chit. The stamp names a city that does not sit on the local map.",
        directorInstruction:
          "Use the small stamp to surface a stance drawn only from existing context. The stamp is not voiced as a continuing speaker.",
      },
      {
        id: "dim-sum-and-then-some-event-9",
        title: "Old chit in the chopstick holder",
        kind: "reveal",
        event: "An old paper chit sits in the chopstick holder from a prior visit.",
        characterVisibleText:
          "A small folded chit sits in the chopstick holder at the corner of the table. The chit lists a prior order in pencil. Both their first initials sit at the top of the chit in the same hand.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The chit is not voiced as a continuing speaker.",
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
