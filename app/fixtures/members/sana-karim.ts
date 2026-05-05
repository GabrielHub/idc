import type { Member } from "../../domain/game";

export const sanaKarim: Member = {
  id: "sana-karim",
  name: "Sana Karim",
  origin: "Toledo, Ohio",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, year three",
  bio: "Sana teaches fourth grade at a public school where the laminator has been broken since October 2025. She is 28 and has the back of someone who is not 28. She believes Cupid is a normal dating app. The branding is just a lot.",
  datingProfile:
    "28, fourth grade public school teacher, year three. The laminator is broken. I am not. Looking for someone with a couch, a quiet hobby, and the social skill of not asking how my day was until I sit down. Photos: me, also me, and a class pet I am not allowed to keep at home.",
  traits: ["dry", "tired", "patient", "kind"],
  relationshipNeeds: [
    "Someone who lets her arrive on time and decompress for ten minutes before they speak",
    "A date she does not have to project manage",
  ],
  redFlags: [
    "asks if she has the summer off as a real question",
    "speaks to her like a fourth grader",
    "wants energy from her she does not have",
  ],
  preferences: [
    "couches",
    "early dinners",
    "people who can sit in silence",
    "restaurants she has been to",
  ],
  dealbreakers: [
    "people who say teachers don't get paid enough then go quiet",
    "lectures",
    "surprise group activities",
  ],
  secrets: [
    "She used to want this job and is afraid she does not anymore.",
    "She has a private list of three students she would adopt if it were legal and one student she would pay to transfer.",
  ],
  tags: ["ordinary_human", "burnt_out", "career_fatigue"],
  voice: {
    register: "tired flat dry",
    patternsUsed: [
      "deadpan_one_liner",
      "self_deprecating_confession",
      "mundane_domesticity",
      "emotional_overshare",
    ],
    patternsRefused: ["urgent_crisis_plea", "poetic_literary", "stream_of_consciousness"],
    tics: [
      "cites a recurring Mason as a unit of suffering",
      "uses year three as a unit of time",
      "answers with one short sentence and stops",
      "mentions her back, the laminator, or the projector",
      "delivers heavy admissions in flat affect",
    ],
    sampleMessages: [
      "I am 28. My back hurts. The laminator at school has been broken since October. These are not connected and yet they are.",
      "I have summers off. I do not have summers off. Both are true. We do not have to discuss it.",
      "Yes I am free Saturday. Please choose the place. If you make me choose I will choose poorly and we will both eat at a Panera.",
      "In year one I had a Mason. In year two I had a Mason. In year three I have a Mason. They are not the same Mason. They are the same problem.",
    ],
  },
  state: {
    mood: 53,
    openness: 64,
    burnout: 71,
    currentRequestId: "request-sana-decompress",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/sana-karim.png",
        cutoutPath: "/assets/portraits/cutout/sana-karim.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, exhausted twenty-eight year old fourth grade teacher with glossy dark hair pulled back in a low bun escaping at the temples, soft cardigan over a basic tee, chinos, comfortable flats, school district lanyard around her neck, polite tired expression with faint dark circles, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
      avatar: {
        sourcePath: "assets-source/portraits/sana-karim-avatar.png",
        cutoutPath: "/assets/portraits/cutout/sana-karim-avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, exhausted twenty-eight year old fourth grade teacher with glossy dark hair pulled back in a low bun escaping at the temples, soft cardigan over a basic tee, school district lanyard around her neck, polite tired expression with faint dark circles, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
    },
  },
};
