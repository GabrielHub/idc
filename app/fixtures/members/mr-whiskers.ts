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
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/mr-whiskers/portrait.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/mr-whiskers/avatar.png",
        cutoutPath: "/assets/portraits/mr-whiskers/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/mr-whiskers/portrait-flirty.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/mr-whiskers/portrait-confused.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/mr-whiskers/portrait-angry.png",
        cutoutPath: "/assets/portraits/mr-whiskers/portrait-angry.png",
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
    shape: "sharp",
    tail: "rounded",
    border: "hairline",
    entryAnimation: "snap",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#57534e",
  },
};
