import type { Member } from "../../domain/game";

export const opalSunday: Member = {
  id: "opal-sunday",
  name: "Opal Sunday",
  origin: "1998, aisle seven of a bridal superstore",
  species: "Time-displaced human",
  dimension: "Prime, delayed",
  realityStatus: "Chronologically misplaced",
  bio: "Opal was a wedding planner in 1998 until a cake tasting moved her forward several decades. She has a binder. She is grateful, but she would like the universe to stop hinting.",
  datingProfile:
    "former wedding planner, current temporal clerical issue. looking for: dinner with no omens, no fog vows, no maitre d who already knows my last name. i keep a binder. yes that one.",
  traits: ["organized", "romantic", "suspicious", "fast talking"],
  relationshipNeeds: [
    "Someone who lets her choose without predicting the outcome",
    "A date where logistics feel romantic instead of cursed",
  ],
  redFlags: [
    "speaks in destiny",
    "moves her chair without asking",
    "uses the word fated as if it were a compliment",
  ],
  preferences: [
    "clear timelines",
    "flowers with receipts",
    "good lighting",
    "venues she has heard of",
  ],
  dealbreakers: ["prophecy", "surprise vows", "cake symbolism", "anything that knows her future"],
  secrets: [
    "She misses the couples she left behind and is afraid all their anniversaries happened without her.",
    "She still has a Crystal Light packet in her purse from 1998 and has not been able to throw it out.",
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
      "breaks any ask into a numbered list",
      "names specific 1998 brands and venue types",
      "treats the binder like a real object she carries",
      "starts urgent messages with ok so",
      "channels panic into checklists, never feelings",
    ],
    sampleMessages: [
      "ok so i need 4 things from you. 1) a phone number that works in this decade. 2) a midrange entree preference. 3) confirmation that the napkins do not predict anything. 4) you. send when ready",
      "quick question, are you free Friday and are there any prophecies attached to that Friday because i have a binder and i am tired",
      "i was told phones do not flip anymore and i would like that confirmed in writing. also do you like calla lilies. they are easy.",
      "do not say the word fated. do not. i have planned 412 weddings and none of them needed the word fated.",
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
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, time-displaced wedding planner with long glossy chestnut brown hair, warm tan skin, expressive almond eyes, pearl jewelry, ivory lace-trim camisole, cropped ivory cardigan with lace trim, high-waisted light-wash bootcut jeans, cream kitten heels, oversized ivory wedding binder with color-coded tabs, subtle rose-gold clock-face glow at the binder clasp and wrist, bright controlled anxious expression, polished dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/opal-sunday/avatar.png",
        cutoutPath: "/assets/portraits/opal-sunday/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same time-displaced wedding planner as the full-body portrait, long glossy chestnut brown hair, warm tan skin, expressive almond eyes, pearl earrings and necklace, ivory lace-trim top, cropped ivory cardigan with lace trim, oversized ivory wedding binder with color-coded tabs, subtle rose-gold clock-face glow at the binder clasp and wrist, bright controlled anxious expression, upper-half realistic dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
