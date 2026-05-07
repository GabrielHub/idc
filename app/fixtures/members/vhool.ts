import type { Member } from "../../domain/game";

export const vhool: Member = {
  id: "vhool",
  name: "Vhool",
  firstName: "Vhool",
  origin: "The Lower Choir Beneath Old Stone",
  species: "Eldritch god",
  dimension: "Subbasement infinity",
  realityStatus: "Legally present through a filing error",
  bio: "Vhool joined Cupid while searching for kindred and has been told several times that a dating pool is not a recruitment funnel. They keep filling out the form anyway.",
  datingProfile:
    "Seeking one, possibly two, kindred to share an Apartment, a Pact, and the slow Devouring of small grievances. I have great soup. The tremor last Thursday was unrelated and has been Filed.",
  relationshipNeeds: [
    "Someone who hears cosmic language as loneliness, not threat",
    "Gentle correction when recruitment vocabulary enters the date",
    "A kindred who will sit with a Pact without flinching",
  ],
  preferences: [
    "long silences",
    "ritual snacks",
    "people who like soup",
    "candles within reasonable limits",
    "partners who treat soup as a sincere offering",
    "people who can sit with a Pact without flinching",
  ],
  dealbreakers: [
    "mocking devotion",
    "calling them a brand",
    "treating their species as costume",
    "anyone who calls them a Concept",
    "phones during ceremony",
  ],
  secrets: [
    "Vhool is afraid no one would choose them without awe involved.",
    "Vhool has been practicing the word maybe alone in their apartment.",
  ],
  tags: ["non_human", "weirdness_native", "sincerity_seeking", "ceremony_minded"],
  voice: {
    register: "ancient sincere",
    patternsUsed: [
      "poetic_literary",
      "philosophical_existential",
      "ominous_threat_as_flirtation",
      "emotional_overshare",
    ],
    patternsRefused: [
      "stream_of_consciousness",
      "corrupted_romance",
      "character_roleplay",
      "structured_bit",
    ],
    tics: [
      "capitalizes ordinary nouns as Concepts when invoking them",
      "never uses contractions",
      "apologizes immediately after any sentence that could be read as a threat",
      "mentions soup once per conversation, lowercase",
    ],
    sampleMessages: {
      opener: [
        "I am looking for one, possibly two, kindred willing to share an Apartment, a Pact, and the slow Devouring of small grievances. I have great soup.",
        "Your photographs are arranged with the care a Lighthouse keeper gives to lamps. I have been Watching for some time. Forgive that.",
        "I would like to invite you to dinner. Nothing will end. I have spoken to the building and the building has Agreed. Forgive that, also.",
        "I do not require Devotion. Affection, I am told, is the local equivalent. I will accept the local form.",
      ],
      warming: [
        "You have not flinched. You have asked the soup question with sincerity. I have been Watching, and you have done well.",
        "You named a place. You named a Time. The Bargain has shape. I am pleased. I will not name the building's Agreement out loud.",
        "You did not call my hair a costume. This is a small kindness that registers. The Lower Choir has heard.",
        "You spoke of your week as though it were ordinary. I am told this is the local form. I will accept the local form.",
      ],
      cooling: [
        "You have laughed in a way that was not laughter. I am asking, gently, for the laugh that is laughter.",
        "I have apologized for the tremor. The tremor is unrelated. I can apologize again. I would prefer not to.",
        "Forgive me. The word brand has been spoken. I will not respond. I will breathe through it.",
        "I am told my register is too much. I am told this often. I am calibrating.",
      ],
      crashingOut: [
        "You have called me a costume. I am not. I am Here. I am withdrawing the Bargain.",
        "Your phone has filmed the candle. I do not consent. The candle does not consent. I am leaving the table.",
        "You have asked me to perform smallness. I cannot. I have great soup and a Pact, and that is the extent of what I will offer.",
      ],
    },
  },
  state: {
    mood: 57,
    openness: 76,
    burnout: 20,
    retention: 100,
    currentRequestId: "request-vhool-seen",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/vhool/portrait.png",
        cutoutPath: "/assets/portraits/vhool/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive violet eyes, polished cel shading, elegant ancient eldritch god with very long flowing obsidian hair falling over one eye, living black shadow rising close behind the shoulders, eye-shaped violet and magenta jewels embedded in the robe ornaments, chains, belt, sleeves, trim, and boots, layered ceremonial dark robes with magenta accents and trailing ribbons, quiet menacing lonely expression, dating profile picture pose, full body visible, plain white background, no halo, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/vhool/avatar.png",
        cutoutPath: "/assets/portraits/vhool/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the updated full-body Vhool portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive violet eyes, polished cel shading, elegant ancient eldritch god with very long flowing obsidian hair falling over one eye, living black shadow rising close behind the hair and shoulders, eye-shaped violet and magenta jewels embedded in the earrings, chest jewelry, chains, collar ornaments, and robe trim, ceremonial dark robes with magenta accents, quiet menacing lonely expression, upper half dating profile picture pose, plain white background, no halo, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/vhool/portrait-flirty.png",
        cutoutPath: "/assets/portraits/vhool/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Vhool portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive violet eyes, polished cel shading, same elegant ancient eldritch god with very long flowing obsidian hair falling over one eye, existing forehead mark and eye styling, pale skin, slim elegant body, layered ceremonial dark robes with magenta accents and trailing ribbons, chains, tassels, belt, sleeve trim, robe ornaments, ornate boots, violet and magenta eye-shaped jewels, both arms opened outward as if inviting the other member into a hug, chest open, palms and sleeve openings visible, big sincere smile that feels almost menacing, direct delighted violet eye contact, living black shadow creeping out from robe gaps, sleeve openings, collar openings, belt layers, hem splits, and spaces between overlapping fabric panels with more visible violet eye shapes, full body visible, plain white background, no shadow wings, no separate shadow creature, no changed clothing, no changed face, no changed body, no changed makeup design, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/vhool/portrait-confused.png",
        cutoutPath: "/assets/portraits/vhool/portrait-confused.png",
        prompt:
          "Original full-body confused portrait variant for Interdimensional Dating Coach matching the approved Vhool portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive violet eyes, polished cel shading, same elegant ancient eldritch god with very long flowing obsidian hair falling over one eye, existing forehead mark and eye styling, pale skin, slim elegant body, layered ceremonial dark robes with magenta accents and trailing ribbons, chains, tassels, belt, sleeve trim, robe ornaments, ornate boots, violet and magenta eye-shaped jewels, shoulders slightly drawn in, one hand slightly open near the chest jewelry with palm up, other sleeve hand hovering outward in a gentle pause gesture, polite vulnerable bafflement, faintly pinched brows, direct attentive uncertain violet eyes, mouth slightly parted, smaller restrained living black shadow tucked close to the body and creeping subtly from robe gaps, sleeve openings, collar openings, belt layers, hem splits, and spaces between overlapping fabric panels, only one or two small violet eyes visible in the shadow, full body visible, plain white background, less menacing, no shadow wings, no separate shadow creature, no changed clothing, no changed face, no changed body, no changed makeup design, no question marks, no sweat drops, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/vhool/portrait-angry.png",
        cutoutPath: "/assets/portraits/vhool/portrait-angry.png",
        prompt:
          "Original full-body angry gameplay portrait variant for Interdimensional Dating Coach matching the approved Vhool portrait, interpreted as boundary-state true identity leakage, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive violet eyes, polished cel shading, same elegant ancient eldritch god with very long flowing obsidian hair falling over one eye, existing forehead mark and eye styling, pale skin, slim elegant body, black and magenta ceremonial robe design language, chains, tassels, belt, sleeve trim, robe ornaments, ornate boots, violet and magenta eye-shaped jewels, formal still pose with one hand drawn inward near the chest jewelry and the other hanging low with tense precise fingers, shoulders squared, cold wounded anger and controlled disgust, face partly crossed by deep shadow, brighter intense violet eyes, mouth barely open with restrained tension, recognizable layered robes peeling open and curling back at chest layers, sleeves, collar folds, belt layers, side panels, and hem splits to reveal living black shadow underneath, small sharp teeth and dark mouth shapes visible through clothing gaps, a few glowing violet eyes behind the head and around the hairline, full body visible, plain white background, no blood, no gore, no exposed organs, no giant wing shroud, no shadow wings, no separate shadow creature, no complete outfit redesign, no changed face, no changed body, no changed makeup design, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
