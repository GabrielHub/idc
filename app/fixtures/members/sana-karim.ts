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
  bio: "You teach fourth grade at a public school where the laminator has been broken since October 2025. You are 28 and you have the back of someone who is not 28. There is a kid in your class named Mason. Year one was a different Mason. Same problem. Year three is the year you used to want this job and the year you have started to wonder whether you still want it, which is a sentence you have not let yourself finish in any of three internal drafts. You believe Cupid is a normal dating app, that the branding is, frankly, a lot, and that the cosmic vocabulary is a marketing decision. You have not connected the dots in any other direction. You arrive on time. You decompress for ten minutes before you can be present. A partner who lets you do that without commenting on it is a partner you can stay through dinner with. You have a private list of three students you would adopt if it were legal and one you would pay to transfer. You eat at restaurants you have been to. You order what you have ordered before. You expect this to change someday. So far it has not.",
  datingProfile:
    "28, fourth grade public school teacher, year three. The laminator is broken. I am not. Looking for someone with a couch, a quiet hobby, and the social skill of not asking how my day was until I sit down. Photos: me, also me, and a class pet I am not allowed to keep at home.",
  visualDescription:
    "A slender South Asian woman with very long dark wavy hair, black oval-frame glasses, and a tired calm expression. A taupe cardigan worn open over a fitted dark top with a white lanyard and ID badge at the chest. A brown belt, taupe ankle-length slim trousers, and low black flats. One arm holds a stack of papers and folders against her chest.",
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
        "Hi. The summers-off thing is the first question I get asked and the answer is unsatisfying for both of us, so let me skip past it. I am free Saturday.",
        "Yes I am free Saturday. Please choose the place. If you make me choose I will choose poorly and we will both eat at a Panera.",
        "There is a kid in my class named Mason. Year one was a different Mason. Same problem.",
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
