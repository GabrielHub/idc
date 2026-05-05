import type { Member } from "../../domain/game";

export const vhool: Member = {
  id: "vhool",
  name: "Vhool",
  origin: "The Lower Choir Beneath Old Stone",
  species: "Eldritch god",
  dimension: "Subbasement infinity",
  realityStatus: "Legally present through a filing error",
  bio: "Vhool joined Cupid while searching for kindred and has been told several times that a dating pool is not a recruitment funnel. They keep filling out the form anyway.",
  datingProfile:
    "Seeking one, possibly two, kindred to share an Apartment, a Pact, and the slow Devouring of small grievances. I have great soup. The tremor last Thursday was unrelated and has been Filed.",
  traits: ["ancient", "sincere", "lonely", "ceremonial"],
  relationshipNeeds: [
    "Someone who hears cosmic language as loneliness, not threat",
    "Gentle correction when recruitment vocabulary enters the date",
  ],
  redFlags: [
    "accidental geological tremors during compliments",
    "treats dinner as covenant review",
    "uses the word kindred before the entree",
  ],
  preferences: [
    "long silences",
    "ritual snacks",
    "people who like soup",
    "candles within reasonable limits",
  ],
  dealbreakers: ["mocking devotion", "calling them a brand", "treating their species as costume"],
  secrets: [
    "Vhool is afraid no one would choose them without awe involved.",
    "Vhool has been practicing the word maybe alone in their apartment.",
  ],
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
      "capitalizes ordinary nouns as Concepts when invoking them",
      "never uses contractions",
      "apologizes immediately after any sentence that could be read as a threat",
      "mentions soup once per conversation, lowercase",
    ],
    sampleMessages: [
      "I am looking for one, possibly two, kindred willing to share an Apartment, a Pact, and the slow Devouring of small grievances. I have great soup.",
      "Your photographs are arranged with the care a Lighthouse keeper gives to lamps. I have been Watching for some time. Forgive that.",
      "I would like to invite you to dinner. Nothing will end. I have spoken to the building and the building has Agreed. Forgive that, also.",
      "I do not require Devotion. Affection, I am told, is the local equivalent. I will accept the local form.",
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
        sourcePath: "assets-source/portraits/vhool/portrait.png",
        cutoutPath: "/assets/portraits/vhool/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, elegant ancient entity with very long flowing obsidian hair falling over one eye, faint halo of impossible violet eye-flames, layered ceremonial dark robes with magenta accents and trailing ribbons, gentle lonely expression, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/vhool/avatar.png",
        cutoutPath: "/assets/portraits/vhool/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, elegant ancient entity with very long flowing obsidian hair falling over one eye, faint halo of impossible violet eye-flames, ceremonial dark robes with magenta accents, gentle lonely expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
