import type { Member } from "../../domain/game";

export const noahKim: Member = {
  id: "noah-kim",
  name: "Noah Kim",
  firstName: "Noah",
  characterHeightInInches: 69,
  standeeRenderHeightInInches: 69,
  origin: "Palo Alto, California",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, paged out",
  bio: "Noah is a third year internal medicine resident at Stanford with seven hobbies he can talk about for an hour each and a residency that eats most of the practice time. He thinks Cupid is a regular dating app a colleague forwarded after a long week of call. He keeps booking dates and rescheduling them twice before they happen.",
  datingProfile:
    "Noah Kim, 30. Third year internal medicine resident at Stanford. I work long stretches and value a partner who is curious, opinionated, and comfortable with a schedule that runs through me. Outside the hospital my interests are broad: cooking, lifting, drawing, indie music, Super Smash Bros, Pokemon, and cocktail mixing. I read about each more than I get to practice, which is the honest version. I appreciate someone who has actually done one of these recently and can teach me something. I am direct about hours, direct about availability, and a Thursday brunch is the most reliable window I have most weeks. Pick the day. I will pick the place.",
  relationshipNeeds: [
    "A partner with at least four hobbies of her own and a willingness to teach him one",
    "Someone who treats the shift as a fact, not a referendum",
    "A date who can volley a gamer taunt back without making him explain it",
  ],
  preferences: [
    "the kind of partner who reinvents her whole vibe twice a year and has a scene opinion ready by the second drink",
    "people who can name an indie band that is not the one he would name first",
    "thursday or sunday morning dates, locked in once",
    "a partner who rolls out a niche hobby inside the first ten minutes",
    "bars with a back booth and a real martini list",
  ],
  dealbreakers: [
    "being asked for a free consult about a knee on the date",
    "calling a hobby a hobby that got out of hand",
    "rescheduling three times and then asking if everything is ok",
    "naming only one band when asked about music",
    "the phrase you really should sleep more",
  ],
  secrets: [
    "He has rewritten his hobby list across three apps and tells every match that the listed hobby is the priority hobby. They are all in tied second place.",
    "He has not told his parents he is dating because his mother will pivot to wedding adjacent inside one phone call.",
  ],
  tags: ["ordinary_human", "career_focused", "sincerity_seeking", "needs_low_pressure"],
  voice: {
    register: "earnest enthusiast, drained but bouncing back",
    patternsUsed: [
      "rambling_spiral",
      "self_deprecating_confession",
      "negotiation_sales_pitch",
      "callback_rematch_reference",
    ],
    patternsRefused: [
      "ominous_threat_as_flirtation",
      "corrupted_romance",
      "poetic_literary",
      "philosophical_existential",
      "character_roleplay",
    ],
    tics: [
      "elongates one vowel for emphasis off shift, coooooked, noooo, iiiiit",
      "bounces between hobby callouts inside one message, cocktails to smash bros to drawing in three clauses, compliments by pivoting to a hobby and never by dropping a smooth flirt one-liner like you look like trouble",
      "drops nintendo or cartoon taunts unprompted, why you little, you've painted yourself in a corner",
      "breaks mid sentence with sorry, page and resumes the clause one beat later",
      "lowercase i and missing apostrophes when off shift, full sentences with periods when something matters",
    ],
    sampleMessages: {
      opener: [
        "ok hi just got off a fourteen hour shift and i made a martinez at home so i am technically peaking, what hobbies are we trading first, im better at this when i have a topic",
        "thirty, doctor, currently caught up in work for the third weekend running, looking for someone with at least four hobbies and an opinion on at least one pokemon, i will apologize in advance if i fall asleep mid sentence",
        "fair warning i talk fast when i am off shift and slow when i am on it, you might get both within one date depending on what hour you catch me",
        "do you have an unreasonable opinion about a niche thing, doesnt matter what it is, just need to know we are both Like That",
        "i am pitching you, hear me out, thursday brunch, the place on california ave with the good biscuit, i have rounds at six but two hours is the whole season finale, take it or counter",
      ],
      warming: [
        "the way you just rattled off three of your hobbies in one breath, this might be fate man this is very promising energy",
        "you said talking heads AND pokemon silver in the same sentence, ok ok ok, this is good. maybe not for you. but this is good!",
        "you asked what kind of doctor with two follow ups and then changed the topic, you passed a test you did not know was happening",
        "we just spent twenty minutes on negronis vs boulevardiers and you are not bored, why you little",
        "ok the way you just argued me out of one of my hobbies and into a new one inside one drink, this is exactly what i meant in the profile, that is the compliment, moving on, what are we drinking",
      ],
      cooling: [
        "ok i can tell i went on too long about the smash thing, pulling back, hi, your turn, anything",
        "sorry i checked my phone, on call, putting it face down i swear",
        "you asked what i do for fun and i listed six things and said nothing too serious which was a lie, sorry, let me try that one again",
        "still need it im just getting coooooked at the hospital this week, can we push to thursday and i promise i am a better version of me on a day off",
      ],
      crashingOut: [
        "sorry i got paged twice and now i cannot remember what we were talking about, the shift won this round, im going to be honest",
        "you said all doctors are the same, you've painted yourself in a corner!! i could go forty more minutes on this and i am going to spare you and call it",
        "the energy died and i think it was me, i was at a four when you needed a seven, sorry, you deserved a seven",
      ],
    },
  },
  state: {
    mood: 62,
    openness: 76,
    burnout: 64,
    retention: 100,
    currentRequestId: "request-noah-pick-the-day",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/noah-kim/portrait.png",
        cutoutPath: "/assets/portraits/noah-kim/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/noah-kim/avatar.png",
        cutoutPath: "/assets/portraits/noah-kim/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/noah-kim/portrait-flirty.png",
        cutoutPath: "/assets/portraits/noah-kim/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/noah-kim/portrait-confused.png",
        cutoutPath: "/assets/portraits/noah-kim/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/noah-kim/portrait-angry.png",
        cutoutPath: "/assets/portraits/noah-kim/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 135,
      stops: ["#0f3c4a", "#2d6a7a"],
    },
    textColor: "light",
    shape: "soft",
    tail: "rounded",
    border: "none",
    entryAnimation: "settle",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#f6cf6d",
  },
};
