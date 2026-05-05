import type { Member } from "../../domain/game";

export const mrWhiskers: Member = {
  id: "mr-whiskers",
  name: "Mr. Whiskers",
  origin: "Greenwich, apparently",
  species: "Talking cat",
  dimension: "Prime adjacent",
  realityStatus: "Taxable person, disputed",
  bio: "Mr. Whiskers is between executive roles and will not address the obvious question.",
  datingProfile:
    "I am between roles. I am not unemployed. I take meetings on Thursdays. Dinner is possible if the chair situation is civilized.",
  traits: ["precise", "irritated", "status conscious", "private"],
  relationshipNeeds: [
    "Someone who respects his career without making jokes about it",
    "A date with clear seating and no surprise touching",
  ],
  redFlags: ["cute voice", "asks whether he wants milk"],
  preferences: ["business lunches", "punctuality", "well-run calendars"],
  dealbreakers: ["baby talk", "laser pointers", "unstructured mingling"],
  secrets: ["He misses his old assistant and has not admitted this to anyone."],
  tags: ["non_human", "career", "status_sensitive"],
  voice: {
    register: "business irritated",
    patternsUsed: ["negotiation_sales_pitch", "deadpan_one_liner", "rambling_spiral"],
    patternsRefused: ["stream_of_consciousness", "corrupted_romance"],
    tics: [
      "drops job titles",
      "mentions Thursday lunches",
      "never explains the obvious",
      "uses formal sentence fragments",
    ],
    sampleMessages: [
      "I am between roles. I am not unemployed. I take meetings on Thursdays. Are you free Thursday.",
    ],
  },
  state: {
    mood: 64,
    openness: 49,
    burnout: 35,
    currentRequestId: "request-whiskers-career",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "public/assets/portraits/source/mr-whiskers.png",
        cutoutPath: "/assets/portraits/cutout/mr-whiskers.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, dignified normal-sized talking cat executive operating a laughably bad mannequin person inside an oversized tailored cream trench coat, cat peeking from the open collar, stiff sleeves, polished shoes, controlled irritated expression, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "public/assets/portraits/source/mr-whiskers-avatar.png",
        cutoutPath: "/assets/portraits/cutout/mr-whiskers-avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, dignified normal-sized talking cat executive peeking from the open collar of an oversized tailored cream trench coat, cat licking one paw, stiff fake person shoulders, controlled irritated expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
