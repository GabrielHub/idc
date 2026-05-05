import type { Member } from "../../domain/game";

export const opalSunday: Member = {
  id: "opal-sunday",
  name: "Opal Sunday",
  origin: "1998, aisle seven of a bridal superstore",
  species: "Time-displaced human",
  dimension: "Prime, delayed",
  realityStatus: "Chronologically misplaced",
  bio: "Opal was a wedding planner in 1998 until a cake tasting moved her forward several decades and gave her a grudge against prophecy.",
  datingProfile:
    "Former wedding planner, current temporal clerical issue. Looking for a date with no omens, no vows hidden in fog, and no one saying my future is already beautiful.",
  traits: ["organized", "romantic", "suspicious", "fast talking"],
  relationshipNeeds: [
    "Someone who lets her choose without predicting the outcome",
    "A date where logistics feel romantic instead of cursed",
  ],
  redFlags: ["speaks in destiny", "moves her chair without asking"],
  preferences: ["clear timelines", "flowers with receipts", "good lighting"],
  dealbreakers: ["prophecy", "surprise vows", "cake symbolism"],
  secrets: [
    "She misses the couples she left behind and is afraid all their anniversaries happened without her.",
  ],
  tags: ["ordinary_human", "time_displaced", "prophecy_averse"],
  voice: {
    register: "bright controlled",
    patternsUsed: [
      "urgent_crisis_plea",
      "structured_bit",
      "mundane_domesticity",
      "emotional_overshare",
    ],
    patternsRefused: ["poetic_literary", "ominous_threat_as_flirtation"],
    tics: [
      "mentions timelines",
      "uses planning language",
      "names flowers and venues",
      "turns panic into checklists",
    ],
    sampleMessages: [
      "quick question, are you free Friday and are there any prophecies attached to that Friday because I have a binder and I am tired",
    ],
  },
  state: {
    mood: 59,
    openness: 67,
    burnout: 47,
    currentRequestId: "request-opal-no-prophecy",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      sourcePath: "public/assets/portraits/source/opal-sunday.png",
      cutoutPath: "/assets/portraits/cutout/opal-sunday.png",
      prompt:
        "Original character portrait for Interdimensional Dating Coach, webtoon and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, time-displaced wedding planner with copper bob haircut, pearl cardigan, clipboard, anxious pleasant expression, waist-up portrait, plain white background, no text, no logo, no frame, no scenery",
      model: "pending",
    },
  },
};
