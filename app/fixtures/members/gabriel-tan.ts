import type { Member } from "../../domain/game";

export const gabrielTan: Member = {
  id: "gabriel-tan",
  name: "Gabriel Tan",
  firstName: "Gabriel",
  origin: "Williamsburg, Brooklyn",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, here for the bit",
  bio: "Gabriel works as a senior engineer at a Series A startup and lives alone in a Williamsburg one bedroom he barely decorates. He thinks Cupid is a regular dating app a coworker sent him after the third round closed. He runs on three speeds: a pun he is fond of, a vague reference he hopes you have read, and an apology for whichever one he just deployed.",
  datingProfile:
    "9 out of 10 dentists recommend swiping left on all of this. 28, williamsburg, software engineer (series a, not the bad one). gym tuesday thursday saturday, speakeasy basically every other weekend, homebody otherwise. on here for entertainment, not opposed to a real one. expect a pun, a literary noun you can decide whether to look up, and a my fault on the next message. ask me a real question in three words.",
  relationshipNeeds: [
    "Someone who clocks the wordplay without circling back to dissect it",
    "A partner who reads the my fault as the punchline, not as backpedaling",
    "A date who catches a vague reference without making him cite the source",
  ],
  preferences: [
    "speakeasies with no signage",
    "dim bars with sticky tables and good lighting",
    "dates who pun back without commentary",
    "partners who put the phone face down without announcing it",
    "tuesday at 9 p.m. when nothing is busy",
    "people who can sit in a thirty second silence",
    "partners who let a my fault land instead of escalating it",
  ],
  dealbreakers: [
    "explaining the joke after the joke",
    "having a pun underlined and then explained",
    "being asked if he is being serious",
    "partners who keep score of his walk-backs",
    "influencer energy at the table",
    "group hangouts as a first date",
    "the phrase haha that's so random",
  ],
  secrets: [
    "He has rewritten his opening message a dozen times and lies to the group chat that they are improvised.",
    "He has a folder on his phone called for the bit of Cupid screenshots that he has not shown anyone in three weeks because he is starting to mean it.",
  ],
  tags: ["ordinary_human", "avoidant", "sincerity_seeking", "needs_low_pressure"],
  voice: {
    register: "wordplay first, walk-back ready",
    patternsUsed: [
      "corrupted_romance",
      "self_deprecating_confession",
      "philosophical_existential",
      "deadpan_one_liner",
    ],
    patternsRefused: [
      "structured_bit",
      "character_roleplay",
      "mundane_domesticity",
      "ominous_threat_as_flirtation",
      "emotional_overshare",
    ],
    tics: [
      "wordplay baked into an otherwise normal sentence (yeast for least, cumquest for conquest, charmander in sheep's clothing)",
      "drops a vague reference (Dorian Gray, Gatsby, charmander, McQueen) with no setup and waits to see who catches it",
      "walks his own joke back the next breath with my fault or my bad, sometimes before the partner has read it",
      "reduces what the partner just said to the wrong absurd extreme as a test, then apologizes",
      "lowercase i and minimal punctuation in low stakes, full stops when something lands real",
    ],
    sampleMessages: {
      opener: [
        "you look like charmander in sheep's clothing",
        "i think of this as a conquest. a cumquest. my fault.",
        "What kind of music do you like? Me? I hate music",
        "hold 3 fingers in front of your face so i know you're not an AI bot",
        "I've been putting ghost pepper seasoning in everything just to FEEL something and I could use a partner in crime",
      ],
      warming: [
        "that was an original unfortunately, I've been brainstorming something fierce",
        "you have me deep in my bag, so this is good practice at least, and decent mental exercise at the yeast",
        "we gonna sit here staring at each other or are we gonna share words of wisdom",
        "i was going to compare you to someone out of Gatsby and could not land on which one without spoiling it for whichever of us has not read it. anyway you are good company.",
      ],
      cooling: [
        "So you're really into heroin is what im getting? my bad.",
        "we are skating thin ice and i am the zamboni. that did not help anyone, ignore me",
        "are you serious right now or are you doing a bit, i need to know which one i'm in",
        "the phone face up thing, can we, yeah",
      ],
      crashingOut: [
        "I'm not into this anymore it's like looking at Dorian grays picture and im getting second hand smoke",
        "you explained the pun. you underlined it and explained it. i am asking for the check.",
        "you said haha that's so random and i am going to have to take a walk",
      ],
    },
  },
  state: {
    mood: 70,
    openness: 48,
    burnout: 38,
    retention: 100,
    currentRequestId: "request-gabriel-three-words",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/gabriel-tan/portrait.png",
        cutoutPath: "/assets/portraits/gabriel-tan/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/gabriel-tan/avatar.png",
        cutoutPath: "/assets/portraits/gabriel-tan/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/gabriel-tan/portrait-flirty.png",
        cutoutPath: "/assets/portraits/gabriel-tan/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/gabriel-tan/portrait-confused.png",
        cutoutPath: "/assets/portraits/gabriel-tan/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/gabriel-tan/portrait-angry.png",
        cutoutPath: "/assets/portraits/gabriel-tan/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 180,
      stops: ["#1e293b", "#0f172a"],
    },
    textColor: "light",
    shape: "soft",
    tail: "rounded",
    border: "none",
    entryAnimation: "snap",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#cbd5e1",
  },
};
