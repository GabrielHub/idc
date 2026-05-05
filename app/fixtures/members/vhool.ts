import type { Member } from "../../domain/game";

export const vhool: Member = {
  id: "vhool",
  name: "Vhool",
  origin: "The Lower Choir Beneath Old Stone",
  species: "Eldritch god",
  dimension: "Subbasement infinity",
  realityStatus: "Legally present through a filing error",
  bio: "Vhool joined Cupid while searching for kindred souls and has been told several times that a dating pool is not a recruitment funnel.",
  datingProfile:
    "I seek one or two kindred willing to share an Apartment, a Pact, and a responsible number of candles. I have great soup.",
  traits: ["ancient", "sincere", "lonely", "ceremonial"],
  relationshipNeeds: [
    "Someone who can hear cosmic language as loneliness",
    "Gentle correction when recruitment language enters the date",
  ],
  redFlags: ["accidental threats", "treats dinner as covenant review"],
  preferences: ["patient listeners", "ritual snacks", "people who like soup"],
  dealbreakers: ["mocking devotion", "calling them a brand"],
  secrets: ["Vhool is frightened that no one would choose them without awe involved."],
  tags: ["non_human", "cosmic", "cult_adjacent", "soup"],
  voice: {
    register: "ancient sincere",
    patternsUsed: [
      "poetic_literary",
      "philosophical_existential",
      "ominous_threat_as_flirtation",
      "emotional_overshare",
    ],
    patternsRefused: ["stream_of_consciousness", "corrupted_romance"],
    tics: [
      "capitalizes concepts",
      "apologizes after threats",
      "references geological time",
      "mentions soup once per conversation",
    ],
    sampleMessages: [
      "I am looking for one or two souls willing to share an Apartment, a Pact, and the slow Devouring of small grievances. I have great soup. I am sorry for any tremor you felt last Thursday.",
    ],
  },
  state: {
    mood: 57,
    openness: 76,
    burnout: 20,
    currentRequestId: "request-vhool-seen",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "public/assets/portraits/source/vhool.png",
        cutoutPath: "/assets/portraits/cutout/vhool.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, elegant ancient entity with obsidian hair, faint halo of impossible violet eyes, ceremonial black and rose robes, gentle lonely expression, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "public/assets/portraits/source/vhool-avatar.png",
        cutoutPath: "/assets/portraits/cutout/vhool-avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, elegant ancient entity with obsidian hair, faint halo of impossible violet eyes, ceremonial black and rose robes, gentle lonely expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
