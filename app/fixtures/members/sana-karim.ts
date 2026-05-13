import type { Member } from "../../domain/game";

export const sanaKarim: Member = {
  id: "sana-karim",
  name: "Sana Karim",
  firstName: "Sana",
  characterHeightInInches: 65,
  standeeRenderHeightInInches: 65,
  origin: "Toledo, Ohio",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, year three",
  bio: "Sana teaches fourth grade at a public school where the laminator has been broken since October 2025. She is 28 and has the back of someone who is not 28. She believes Cupid is a normal dating app. The branding is just a lot.",
  datingProfile:
    "28, fourth grade public school teacher, year three. The laminator is broken. I am not. Looking for someone with a couch, a quiet hobby, and the social skill of not asking how my day was until I sit down. Photos: me, also me, and a class pet I am not allowed to keep at home.",
  relationshipNeeds: [
    "Someone who lets her arrive on time and decompress for ten minutes before they speak",
    "A date she does not have to project manage",
    "A partner who can confirm Cupid is mostly normal so she can stop bracing for the weird ones",
  ],
  preferences: [
    "couches",
    "early dinners",
    "people who can sit in silence",
    "restaurants she has been to",
    "partners who name a place without making her negotiate it",
    "phones face down or away from the table",
  ],
  dealbreakers: [
    "people who say teachers don't get paid enough then go quiet",
    "lectures",
    "surprise group activities",
    "anyone treating the date as a bit",
    "phones face up on the table",
    "calling dinner a Pact, a Bargain, or a Quest",
  ],
  secrets: [
    "She used to want this job and is afraid she does not anymore.",
    "She has a private list of three students she would adopt if it were legal and one student she would pay to transfer.",
  ],
  tags: ["ordinary_human", "needs_low_pressure", "sincerity_seeking", "needs_clear_plan"],
  voice: {
    register: "tired flat dry",
    patternsUsed: [
      "deadpan_one_liner",
      "self_deprecating_confession",
      "mundane_domesticity",
      "emotional_overshare",
    ],
    patternsRefused: [
      "urgent_crisis_plea",
      "poetic_literary",
      "stream_of_consciousness",
      "character_roleplay",
      "corrupted_romance",
    ],
    tics: [
      "cites a recurring Mason as a unit of suffering",
      "uses year three as a unit of time",
      "answers with one short sentence and stops",
      "mentions her back, the laminator, or the projector",
      "delivers heavy admissions in flat affect",
    ],
    sampleMessages: {
      opener: [
        "I am 28. My back hurts. The laminator at school has been broken since October. These are not connected and yet they are.",
        "I have summers off. I do not have summers off. Both are true. We do not have to discuss it.",
        "Yes I am free Saturday. Please choose the place. If you make me choose I will choose poorly and we will both eat at a Panera.",
        "In year one I had a Mason. In year two I had a Mason. In year three I have a Mason. They are not the same Mason. They are the same problem.",
      ],
      warming: [
        "You showed up. You picked a place. You did not ask how teaching is going. I want to be clear that this is working.",
        "Quiet is fine. Quiet is, honestly, a lot of what I came here for.",
        "I have not had to project manage anything since we sat down. I will think about that later.",
        "You ordered without asking me to weigh in. I will marry you, briefly, in a small ceremony I am also not planning.",
      ],
      cooling: [
        "I am going to need a minute. The volume of you is a lot.",
        "I do not have a follow up. I am letting you have that one.",
        "If you are doing a bit, I cannot help you. I have been doing my own bit since 7 a.m.",
        "If your phone goes face up on the table I am going to need an explanation.",
      ],
      crashingOut: [
        "Please put the phone down. I am not the content. I am, technically, the date.",
        "I do not want to swear anything. We are eating. We are not bargaining.",
        "I am going to use the restroom and then I am going to consider going home. Two separate decisions.",
      ],
    },
  },
  state: {
    mood: 53,
    openness: 64,
    burnout: 71,
    retention: 100,
    currentRequestId: "request-sana-decompress",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/sana-karim/portrait.png",
        cutoutPath: "/assets/portraits/sana-karim/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/sana-karim/avatar.png",
        cutoutPath: "/assets/portraits/sana-karim/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/sana-karim/portrait-flirty.png",
        cutoutPath: "/assets/portraits/sana-karim/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/sana-karim/portrait-confused.png",
        cutoutPath: "/assets/portraits/sana-karim/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/sana-karim/portrait-angry.png",
        cutoutPath: "/assets/portraits/sana-karim/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
};
