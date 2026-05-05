import type { Member } from "../../domain/game";

export const gideonGlass: Member = {
  id: "gideon-glass",
  name: "Gideon Glass",
  firstName: "Gideon",
  origin: "Room 414, the Hotel Palatine",
  species: "Ghost",
  dimension: "Prime adjacent afterlife annex",
  realityStatus: "Deceased, emotionally available",
  bio: "Gideon haunts Room 414 of the Hotel Palatine and uses Cupid because the lobby piano keeps pairing him with guests who are already checking out.",
  datingProfile:
    "I am dead. I am not asking for sympathy. I am asking if you might remember my name afterward. I can offer piano music after midnight, the air in Room 414, and a robe that passes through chairs.",
  relationshipNeeds: [
    "Someone who treats his history with care",
    "A date with enough structure that he does not drift into apologies",
  ],
  preferences: [
    "old hotels",
    "slow questions",
    "music after midnight",
    "people who keep their reservations",
  ],
  dealbreakers: ["seances as flirting", "jokes about unfinished business", "EMF readers as a prop"],
  secrets: [
    "He worries that being remembered is too much to ask from a first date.",
    "He has been quietly practicing one piano piece for sixty three years and does not know what to do with it.",
  ],
  tags: [
    "non_human",
    "memory_sensitive",
    "grief_sensitive",
    "sincerity_seeking",
    "needs_clear_plan",
  ],
  voice: {
    register: "formal tender",
    patternsUsed: ["poetic_literary", "deadpan_one_liner", "self_deprecating_confession"],
    patternsRefused: ["urgent_crisis_plea", "corrupted_romance"],
    tics: [
      "references rooms, keys, lamps, and bedding",
      "anchors statements to a specific year when relevant",
      "turns longing into logistics",
      "asks for the partner's name directly, sometimes twice",
    ],
    sampleMessages: [
      "Good evening. If you forget my name, I will understand. I will be disappointed in a way that affects the lamps.",
      "I died in 1962. I am not asking for sympathy. I am asking if you are free Saturday, which I understand still follows Friday and precedes the changing of the bedding.",
      "Please do not call it unfinished business. I finished business. I simply kept a key.",
      "There is a small lamp in Room 414 that comes on for me. I would like to introduce the two of you.",
    ],
  },
  state: {
    mood: 54,
    openness: 70,
    burnout: 31,
    currentRequestId: "request-gideon-name",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/gideon-glass/portrait.png",
        cutoutPath: "/assets/portraits/gideon-glass/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, slender mid century hotel ghost in a soft silver dressing robe over pressed pajamas and house slippers, faintly translucent edges, glossy silver hair with a side part, gentle melancholy expression, soft blue rim light, baseline first picture on a dating profile pose, standing at a slight three-quarter angle with one hand resting lightly over his robe front and the other relaxed at his side, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/gideon-glass/avatar.png",
        cutoutPath: "/assets/portraits/gideon-glass/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, slender mid century hotel ghost in a soft silver dressing robe, glossy silver hair with a side part, gentle melancholy expression, soft blue rim light, upper-half realistic profile picture pose, close natural approachable framing, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
