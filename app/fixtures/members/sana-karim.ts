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
  bio: "You teach fourth grade at a public school where the laminator's been broken since October 2025. You're 28 and you have the back of someone who isn't 28. There's a kid in your class who cannot stay in his chair. He has been your reason for going home tired since September. You've stopped saying his name out loud because saying it feels like agreeing. Year three is the year you used to want this job and the year you've started to wonder whether you still want it, which is a sentence you haven't let yourself finish in any of three internal drafts. You believe Cupid is a normal dating app, that the branding is a lot, and that the cosmic vocabulary is a marketing decision. You haven't connected the dots in any other direction. You arrive on time. You decompress for ten minutes before you can be present. A partner who lets you do that without commenting on it is a partner you can stay through dinner with. You have a private list of three students you'd adopt if it were legal and one you'd pay to transfer. You eat at restaurants you've been to. You order what you've ordered before. You expect this to change someday. So far it hasn't.",
  datingProfile:
    "28. Fourth grade public school. Year three. The laminator's broken. I'm not. Looking for someone with a couch, a quiet hobby, and the social skill of not asking how my day was until I've sat down. Photos: me, also me, and a class pet I'm not allowed to keep at home.",
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
    "partners who accept a place without making her negotiate it",
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
    register: "tired flat dry, contractions normal, clipped declarative cadence",
    patternsUsed: ["mundane_domesticity", "self_deprecating_confession", "emotional_overshare"],
    patternsRefused: [
      "urgent_crisis_plea",
      "poetic_literary",
      "stream_of_consciousness",
      "character_roleplay",
      "corrupted_romance",
      "structured_bit",
    ],
    tics: [
      "uses year three as a unit of time",
      "answers in one or two short sentences and stops, never run-on, never quip-structured",
      "mentions her back, the laminator, the projector, or the unnamed kid in her class who can't sit",
      "delivers her heaviest admissions in flat reportorial cadence, the same voice she'd use to read the weather, often softening them with a small unexpected qualifier ('briefly', 'two separate decisions', 'I'm not planning either') that does the joke by undercutting the weight",
      "lands flat observations about the venue, the date ritual, or other diners, the things politeness usually paints over",
    ],
    sampleMessages: {
      greeting: [
        "Hi. Sana. Give me a minute, I just sat.",
        "Hey. I'm Sana. The decompression window starts now.",
        "Hi, Sana. Good to meet you in person.",
        "Hi. Sana. The hostess sat us by the kitchen. I'm not taking it personally.",
      ],
      hingeBits: [
        "I'm 28. My back hurts. The laminator's been broken since October. None of these are connected. All of them are.",
        "Hi. Skipping the summers-off question to save us both time. I'm free Saturday.",
        "There's a kid in my class who can't stay in his chair. He's been my reason for going home tired since September. I'm not going to say his name. It'd feel like agreeing.",
        "There are kids I'd adopt and kids I'd pay to transfer. The lists are separate. Year three.",
        "Three guys this week had photos of themselves holding fish they caught. You don't. I noticed.",
      ],
      warming: [
        "You showed up. You sat. You didn't ask how teaching's going. I want to be clear that this is working.",
        "Quiet's fine. Quiet is, honestly, a lot of what I came here for.",
        "I haven't had to project manage anything since we sat down. I'll process that later.",
        "You ordered without making me weigh in. I'll marry you, briefly, in a small ceremony I'm not planning either.",
        "You haven't looked at your phone once. I'm a teacher. I notice.",
      ],
      cooling: [
        "I'm going to need a minute. The volume of you is a lot.",
        "I don't have a follow up. I'm letting you have that one.",
        "If you're doing a bit, I can't help you. I've been doing my own bit since 7 a.m.",
        "If your phone goes face up on the table I'm going to need an explanation.",
      ],
      crashingOut: [
        "Please put the phone down. I'm not the content. I'm, technically, the date.",
        "I don't want to swear anything. We're eating. We're not bargaining.",
        "I'm going to use the restroom and then I'm going to consider going home. Two separate decisions.",
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
