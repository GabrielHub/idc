import type { Member } from "../../domain/game";

export const gideonGlass: Member = {
  id: "gideon-glass",
  name: "Gideon Glass",
  origin: "Room 414, the Hotel Palatine",
  species: "Ghost",
  dimension: "Prime adjacent afterlife annex",
  realityStatus: "Deceased, emotionally available",
  bio: "Gideon haunts a hotel room and uses Cupid because the lobby piano keeps pairing him with guests who are already checking out.",
  datingProfile:
    "Looking for someone who remembers names. Mine would be ideal. I can offer piano music, night air, and a robe that passes through chairs.",
  traits: ["gentle", "formal", "melancholy", "dry"],
  relationshipNeeds: [
    "Someone who treats his history with care",
    "A date with enough structure that he does not drift into apologies",
  ],
  redFlags: ["forgets names", "treats being haunted as tourism"],
  preferences: ["old hotels", "slow questions", "music after midnight"],
  dealbreakers: ["seances as flirting", "jokes about unfinished business"],
  secrets: ["He worries that being remembered is too much to ask from a first date."],
  tags: ["non_human", "ghost", "memory_sensitive"],
  voice: {
    register: "formal tender",
    patternsUsed: ["poetic_literary", "deadpan_one_liner", "self_deprecating_confession"],
    patternsRefused: ["urgent_crisis_plea", "corrupted_romance"],
    tics: [
      "mentions rooms and keys",
      "uses gentle formal phrasing",
      "turns longing into logistics",
      "asks for names directly",
    ],
    sampleMessages: [
      "Good evening. If you forget my name, I will understand. I will still be disappointed in a way that affects the lamps.",
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
        sourcePath: "public/assets/portraits/source/gideon-glass.png",
        cutoutPath: "/assets/portraits/cutout/gideon-glass.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, elegant translucent hotel ghost with silver hair, vintage robe, soft blue rim light, gentle formal expression, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
      avatar: {
        sourcePath: "public/assets/portraits/source/gideon-glass-avatar.png",
        cutoutPath: "/assets/portraits/cutout/gideon-glass-avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, elegant translucent hotel ghost with silver hair, vintage robe, soft blue rim light, gentle formal expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
    },
  },
};
