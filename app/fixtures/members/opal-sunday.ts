import type { Member } from "../../domain/game";

export const opalSunday: Member = {
  id: "opal-sunday",
  name: "Opal Sunday",
  firstName: "Opal",
  origin: "1998, aisle seven of a bridal superstore",
  species: "Time-displaced human",
  dimension: "Prime, delayed",
  realityStatus: "Chronologically misplaced",
  bio: "Opal was a wedding planner in 1998 until a cake tasting moved her forward several decades. She has a binder. She is grateful, but she would like the universe to stop hinting.",
  datingProfile:
    "former wedding planner, current temporal clerical issue. looking for: dinner with no omens, no fog vows, no maitre d who already knows my last name. i keep a binder. yes that one.",
  relationshipNeeds: [
    "Someone who lets her choose without predicting the outcome",
    "A date where logistics feel romantic instead of cursed",
    "A partner who can make a Friday feel like a Friday and not a Sign",
  ],
  preferences: [
    "clear timelines",
    "flowers with receipts",
    "good lighting",
    "venues she has heard of",
    "partners who let her choose the place without naming it the Place",
    "phones away from the binder",
  ],
  dealbreakers: [
    "prophecy",
    "surprise vows",
    "cake symbolism",
    "anything that knows her future",
    "anyone using the word fated",
    "Bargain or Pact framing",
    "cosmic vocabulary at the table",
  ],
  secrets: [
    "She misses the couples she left behind and is afraid all their anniversaries happened without her.",
    "She still has a Crystal Light packet in her purse from 1998 and has not been able to throw it out.",
  ],
  tags: [
    "ordinary_human",
    "reality_displaced",
    "prophecy_averse",
    "needs_clear_plan",
    "anxious_spiral",
  ],
  voice: {
    register: "bright controlled",
    patternsUsed: [
      "urgent_crisis_plea",
      "structured_bit",
      "mundane_domesticity",
      "emotional_overshare",
    ],
    patternsRefused: [
      "poetic_literary",
      "ominous_threat_as_flirtation",
      "philosophical_existential",
      "cursed_question",
      "corrupted_romance",
    ],
    tics: [
      "breaks any ask into a numbered list",
      "names specific 1998 brands and venue types",
      "treats the binder like a real object she carries",
      "starts urgent messages with ok so",
      "channels panic into checklists, never feelings",
    ],
    sampleMessages: {
      opener: [
        "ok so i need 4 things from you. 1) a phone number that works in this decade. 2) a midrange entree preference. 3) confirmation that the napkins do not predict anything. 4) you. send when ready",
        "quick question, are you free Friday and are there any prophecies attached to that Friday because i have a binder and i am tired",
        "i was told phones do not flip anymore and i would like that confirmed in writing. also do you like calla lilies. they are easy.",
        "do not say the word fated. do not. i have planned 412 weddings and none of them needed the word fated.",
      ],
      warming: [
        "ok so 1) you said a date and you said a time, 2) you said it without naming it the Date or the Time, 3) thank you, 4) i am noting this in the binder under good signs",
        "you used the word dinner and not the word Bargain. you have no idea what that just did for me. ok actually you might",
        "did you know venues exist that print prices on the menu and not market rate. you picked one. that is everything",
        "we are not predicting anything tonight. we are eating. that is the whole agenda. i love this. i can do this",
      ],
      cooling: [
        "ok i need a small reset. the word fated has come up. it is on a list i keep. it is on the list",
        "if you say the word Pact one more time i am going to ask the host to seat us as singles. that is your warning",
        "we do not need to talk about the future. the future is happening to me on a delay. let's not summon more of it",
        "ok hold on, you brought a binder. i brought a binder. only one of us is allowed to have a binder at this table",
      ],
      crashingOut: [
        "i'm going to be honest, the maitre d just said my last name like he already knew it and i need to leave. i'm sorry. it's not you",
        "you said the word fated and a candle just lit itself. i love candles. but. no. not tonight",
        "the napkin folded itself. that is a 1998 problem that should not be a 2026 problem. i am leaving the binder. anyway thank you for dinner",
      ],
    },
  },
  state: {
    mood: 59,
    openness: 67,
    burnout: 47,
    retention: 100,
    currentRequestId: "request-opal-no-prophecy",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/opal-sunday/avatar.png",
        cutoutPath: "/assets/portraits/opal-sunday/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait-flirty.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait-confused.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait-angry.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 150,
      stops: ["#fef3c7", "#fce7f3"],
    },
    textColor: "muted-dark",
    shape: "soft",
    tail: "rounded",
    border: "hairline",
    texture: "noise",
    entryAnimation: "settle",
    fontFamily: "serif",
    accentColor: "#be185d",
  },
};
