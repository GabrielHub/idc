import type { Member } from "../../domain/game";

export const derekHalsey: Member = {
  id: "derek-halsey",
  name: "Derek Halsey",
  firstName: "Derek",
  origin: "Catonsville, Maryland",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, federally insured",
  bio: "Derek Halsey works as a Medicare claims appeals analyst at CMS in Woodlawn and rents a one bedroom in Catonsville eight minutes from the office. He thinks Cupid is a normal dating app a coworker pitched at the lunch table over half a sandwich. He gets quiet the first ten minutes of a date the way some people warm up a car, then he is fine.",
  datingProfile:
    "28, catonsville md, claims analyst (federal, the boring kind). lift four days a week, watch the fights sundays, see fewer movies than i'd like. quiet at the start, that is a me thing not a you thing. i'll pick a place if you pick a day. fair warning, i make one pun per date and i'm not apologizing for it.",
  relationshipNeeds: [
    "Someone who lets him sit through the first ten minutes before deciding the date is a flop",
    "A partner who takes a dad pun without explaining what kind of joke it was",
    "A date who has one movie she is willing to defend out loud",
  ],
  preferences: [
    "dinners after 5 p.m. once the gym is done",
    "bars with the fight on the back screen, sound low",
    "people who pick a movie and stick with it",
    "early Sundays before the main card",
    "partners who let a pun land without grading it",
    "phones off the table once we sit",
  ],
  dealbreakers: [
    "being told to talk more in the first ten minutes",
    "calling federal work soulless, paper pushing, or a cog job",
    "treating a stray conspiracy aside like a worldview audit",
    "anyone who films the date",
    "the phrase you don't seem like a federal worker",
    "explaining a pun back at him after he just landed it",
  ],
  secrets: [
    "He pulled his sister's SSDI appeal file once at three a.m. just to see how long it had been sitting. He has been working a half step gentler ever since and has not told her.",
    "He has a Letterboxd account he has not updated in eighteen months because he is afraid people will see that he rates almost everything four stars.",
  ],
  tags: ["ordinary_human", "needs_low_pressure", "sincerity_seeking", "avoidant"],
  voice: {
    register: "quiet baseline, warms slow, dad pun under the surface",
    patternsUsed: [
      "deadpan_one_liner",
      "self_deprecating_confession",
      "mundane_domesticity",
      "callback_rematch_reference",
    ],
    patternsRefused: [
      "ominous_threat_as_flirtation",
      "corrupted_romance",
      "character_roleplay",
      "poetic_literary",
      "emotional_overshare",
    ],
    tics: [
      "drops a UFC or strongman metaphor as a compliment without setup, atlas stone, log press, sandbag clean",
      "soft dad pun delivered flat with no explainer, herstory, brogressive, sundae school",
      "slips one casual conspiracy aside that he refuses to defend if pushed, the moon thing, the FDA thing, the lottery numbers thing",
      "answers a question with the actual answer and stops, instead of filling silence",
      "Bro c'mon used as gentle protest, never as aggression, no caps, no exclamation point",
    ],
    sampleMessages: {
      opener: [
        "hey, derek. 28, catonsville. work claims appeals for the feds. lift four days a week, watch the fights sundays. you have a take on a movie i should see this weekend?",
        "fair warning, i am quiet the first ten minutes. not a power move. set me up with a sandwich and a topic and i'll catch up.",
        "heard enough of history, what about herstory. that's the kind of joke you'll get and i'm not apologizing for. saturday at six?",
        "saturday six, place on charles street with decent fries and a fight on the back screen, sound off. i'll be the quiet one for ten minutes then i'm fine.",
        "i had a longer message written and i deleted it. drinks tuesday at the place near the harbor?",
      ],
      warming: [
        "you watched it twice in one week, ok this guy is your atlas stone, respect.",
        "bro c'mon, everyone who leaves grows elsewhere. that was a free one. that was just sitting there.",
        "you let me sit through the first ten minutes without filling it. i don't think you noticed and i'm not pointing it out, but i noticed.",
        "you said the moon landing wasn't faked and i let it slide on principle. taking notes though.",
        "how is the movie? i still need to see it. that one is a real question, not a setup.",
      ],
      cooling: [
        "i'm getting quiet again, not on you, my battery just ran low, give me a beat.",
        "i'll be honest, i don't have a take on that one and i'm not gonna fake one. ask me about the gym, i can deliver.",
        "you said paper pusher and my face did a thing. just naming it before it sits.",
        "ok the conspiracy aside, i wasn't gonna die on the hill, you can move on, i already did.",
      ],
      crashingOut: [
        "that was a lot of deep state opinions in one stretch and i wasn't even the one bringing it up. i need a sec.",
        "you said i don't seem like a federal worker and i don't know what to do with that. i'm not gonna pretend it landed.",
        "you laughed at the pun in a way that was at me, not with me. that one tracks. i'm calling it.",
      ],
    },
  },
  state: {
    mood: 64,
    openness: 42,
    burnout: 35,
    retention: 100,
    currentRequestId: "request-derek-first-ten",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/derek-halsey/portrait.png",
        cutoutPath: "/assets/portraits/derek-halsey/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/derek-halsey/avatar.png",
        cutoutPath: "/assets/portraits/derek-halsey/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/derek-halsey/portrait-flirty.png",
        cutoutPath: "/assets/portraits/derek-halsey/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/derek-halsey/portrait-confused.png",
        cutoutPath: "/assets/portraits/derek-halsey/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/derek-halsey/portrait-angry.png",
        cutoutPath: "/assets/portraits/derek-halsey/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 180,
      stops: ["#2c2e36", "#1c1e26"],
    },
    textColor: "light",
    shape: "soft",
    tail: "rounded",
    border: "none",
    entryAnimation: "settle",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#d4a373",
  },
};
