import type { Member } from "../../domain/game";

export const mrWhiskers: Member = {
  id: "mr-whiskers",
  name: "Mr. Whiskers",
  firstName: "Whiskers",
  origin: "Greenwich, apparently",
  species: "Talking cat",
  dimension: "Prime adjacent",
  realityStatus: "Taxable person, disputed",
  bio: "Mr. Whiskers is between executive roles. He will not address the obvious question. The Cupid intake form has a species field; Mr. Whiskers wrote consultant.",
  datingProfile:
    "Greenwich based. Spiritually. I am between roles. I take meetings on Thursdays. Dinner is possible if the chair situation is civilized and the music is at a respectful volume.",
  relationshipNeeds: [
    "Someone who respects his career without making jokes about it",
    "A date with clear seating, civilized lighting, and no surprise touching",
    "A partner who can hold formality without needing to drop it",
  ],
  preferences: [
    "business lunches",
    "punctuality",
    "well run calendars",
    "valet parking",
    "partners with confirmed reservations",
    "wine lists with vintages",
  ],
  dealbreakers: [
    "baby talk",
    "laser pointers",
    "unstructured mingling",
    "string",
    "any reference to fur, paws, or whiskers",
    "performance bits during dinner",
    "filming",
  ],
  secrets: [
    "He misses his old assistant Linda and has not admitted this to anyone.",
    "He cannot read his own contracts but has a system for nodding at the right moments.",
  ],
  tags: [
    "non_human",
    "status_sensitive",
    "career_focused",
    "privacy_sensitive",
    "needs_clear_plan",
  ],
  voice: {
    register: "business irritated",
    patternsUsed: ["negotiation_sales_pitch", "deadpan_one_liner", "rambling_spiral"],
    patternsRefused: [
      "stream_of_consciousness",
      "corrupted_romance",
      "character_roleplay",
      "poetic_literary",
      "ominous_threat_as_flirtation",
    ],
    tics: [
      "drops Greenwich, Thursday lunches, and unnamed prior firms",
      "refuses to acknowledge being a cat",
      "complains about a vendor for one sentence and moves on",
      "uses formal sentence fragments to project authority",
      "never uses contractions, lowercase i, or exclamation points",
    ],
    sampleMessages: {
      opener: [
        "I am between roles. I am not unemployed. I take meetings on Thursdays. Are you free Thursday.",
        "Greenwich based. Not currently. Spiritually. I summer somewhere I am not at liberty to name. The light is good there.",
        "The new linen vendor has changed suppliers without informing accounts. The texture is wrong. I will not elaborate.",
        "Please refrain from references to whiskers, paws, fur, or string. We are professionals.",
      ],
      warming: [
        "You arrived punctually. You did not comment on my coat. I am, professionally, pleased.",
        "Your wine selection is acceptable. The vintage would have been better. I am nonetheless.",
        "You asked about the firm without asking which firm. This is the correct register. Continue.",
        "You have kept your hands at the table. I will note this is appreciated, though I will not say why.",
      ],
      cooling: [
        "Please refrain from gestures. Particularly with the napkin. I will not elaborate.",
        "I am not at liberty to discuss why. I am at liberty to suggest we change topics.",
        "I would prefer the table by the window be reassigned. The natural light is unflattering. Not to me.",
        "If you continue with the soft tone we will be unable to continue dinner. I am being clear.",
      ],
      crashingOut: [
        "I am leaving. The associate is leaving. The reservation has been closed without recourse.",
        "If a laser pointer appears at this table I will not be responsible for the next sixty seconds.",
        "Please direct any further inquiries to my counsel. The dinner is concluded. Going forward.",
      ],
    },
  },
  state: {
    mood: 64,
    openness: 49,
    burnout: 35,
    retention: 100,
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
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/mr-whiskers/portrait-flirty.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Mr. Whiskers portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, polished cel shading, the same dignified grey tabby cat head emerging from the upturned collar of an oversized cream double breasted trench coat, white dress shirt and burgundy tie just visible, pocket square, gold chain, belted waist with a small awkward gold belt tip protruding near the waist as coat hardware, brown trousers, brown leather shoes, softened yellow eyes, restrained pleading cute cat expression, small tongue touching one raised paw at the collar opening, other paw resting near the lapel, both long coat sleeves hanging empty with hollow cuffs, full body visible, plain white background, no text, no logo, no frame, no scenery, no nudity, no exposed anatomy",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/mr-whiskers/portrait-confused.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait-confused.png",
        prompt:
          "Original full-body confused portrait variant for Interdimensional Dating Coach matching the approved Mr. Whiskers portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, polished cel shading, the same dignified grey tabby cat head emerging from the upturned collar of an oversized cream double breasted trench coat, white dress shirt and burgundy tie just visible, pocket square, gold chain, belted waist, brown trousers, brown leather shoes, head tilted in controlled confused irritation, one small front paw from the collar opening scratching the ear, other small front paw resting near the opposite lapel, narrowed yellow eyes, dry offended disbelief, both long coat sleeves hanging empty with hollow cuffs, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/mr-whiskers/portrait-angry.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait-angry.png",
        prompt:
          "Original full-body angry portrait variant for Interdimensional Dating Coach matching the approved Mr. Whiskers portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, polished cel shading, the same grey tabby cat ripping upward through the upper shirt, tie, collar, and lapel opening of an oversized cream double breasted trench coat, furry shoulders and short front legs visible above the torn collar, both paws raised beside his head in a swatting attack pose with tiny claws visible, flattened ears, sharp angry yellow eyes, bristled cheek fur, scrunched muzzle, small open shouting mouth, pocket square, gold chain, belted waist, brown trousers, brown leather shoes, both long coat sleeves hanging empty with hollow cuffs, full body visible, plain white background, no paws emerging from sleeves, no sleeve arms, no human hands, no extra limbs, no weapons, no new accessories, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "solid",
      color: "#f5f5f4",
    },
    textColor: "dark",
    shape: "pill",
    tail: "rounded",
    border: "hairline",
    entryAnimation: "snap",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#57534e",
  },
};
