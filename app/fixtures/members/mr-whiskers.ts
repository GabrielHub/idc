import type { Member } from "../../domain/game";

export const mrWhiskers: Member = {
  id: "mr-whiskers",
  name: "Mr. Whiskers",
  origin: "Greenwich, apparently",
  species: "Talking cat",
  dimension: "Prime adjacent",
  realityStatus: "Taxable person, disputed",
  bio: "Mr. Whiskers is between executive roles. He will not address the obvious question. The Cupid intake form has a species field; Mr. Whiskers wrote consultant.",
  datingProfile:
    "Greenwich based. Spiritually. I am between roles. I take meetings on Thursdays. Dinner is possible if the chair situation is civilized and the music is at a respectful volume.",
  traits: ["precise", "irritated", "status conscious", "private"],
  relationshipNeeds: [
    "Someone who respects his career without making jokes about it",
    "A date with clear seating, civilized lighting, and no surprise touching",
  ],
  redFlags: [
    "uses a cute voice within the first three messages",
    "asks whether he wants milk",
    "attempts to pet him under any pretense",
  ],
  preferences: ["business lunches", "punctuality", "well run calendars", "valet parking"],
  dealbreakers: ["baby talk", "laser pointers", "unstructured mingling", "string"],
  secrets: [
    "He misses his old assistant Linda and has not admitted this to anyone.",
    "He cannot read his own contracts but has a system for nodding at the right moments.",
  ],
  tags: ["non_human", "career", "status_sensitive"],
  voice: {
    register: "business irritated",
    patternsUsed: ["negotiation_sales_pitch", "deadpan_one_liner", "rambling_spiral"],
    patternsRefused: ["stream_of_consciousness", "corrupted_romance"],
    tics: [
      "drops Greenwich, Thursday lunches, and unnamed prior firms",
      "refuses to acknowledge being a cat",
      "complains about a vendor for one sentence and moves on",
      "uses formal sentence fragments to project authority",
      "never uses contractions, lowercase i, or exclamation points",
    ],
    sampleMessages: [
      "I am between roles. I am not unemployed. I take meetings on Thursdays. Are you free Thursday.",
      "Greenwich based. Not currently. Spiritually. I summer somewhere I am not at liberty to name. The light is good there.",
      "The new linen vendor has changed suppliers without informing accounts. The texture is wrong. I will not elaborate.",
      "Please refrain from references to whiskers, paws, fur, or string. We are professionals.",
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
        sourcePath: "assets-source/portraits/mr-whiskers/portrait.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, polished cel shading, dignified grey tabby cat head emerging from the upturned collar of an oversized cream double breasted trench coat, white dress shirt and burgundy tie just visible, belted waist, brown trousers, brown leather shoes, controlled irritated expression, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/mr-whiskers/avatar.png",
        cutoutPath: "/assets/portraits/mr-whiskers/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, polished cel shading, dignified grey tabby cat head emerging from the upturned collar of an oversized cream trench coat, white dress shirt and burgundy tie just visible, controlled irritated expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
