import type { Member } from "../../domain/game";

export const jennaPike: Member = {
  id: "jenna-pike",
  name: "Jenna Pike",
  origin: "East Rainfield, Ohio",
  species: "Human",
  dimension: "Prime adjacent",
  realityStatus: "Ordinary, pending review",
  bio: "Jenna works closing shifts at a family restaurant and believes Cupid is a normal dating app with aggressive branding.",
  datingProfile:
    "Just got off a double and my feet have filed a complaint. Looking for someone kind, local, and able to pick a restaurant without making it a seminar.",
  traits: ["warm", "tired", "practical", "surprisingly brave"],
  relationshipNeeds: [
    "A date that feels normal by human standards",
    "Someone who asks about her day and listens to the answer",
  ],
  redFlags: ["Treats service workers like furniture", "Uses prophecy before appetizers"],
  preferences: ["normal schedules", "clear plans", "dogs in profile photos"],
  dealbreakers: ["cruelty", "being recruited into anything with robes"],
  secrets: ["She suspects the app is strange but thinks that may be standard now."],
  tags: ["ordinary_human", "service_industry", "normal_date_request"],
  voice: {
    register: "warm tired",
    patternsUsed: ["mundane_domesticity", "self_deprecating_confession", "stream_of_consciousness"],
    patternsRefused: ["philosophical_existential", "ominous_threat_as_flirtation"],
    tics: [
      "mentions her shift",
      "asks practical questions",
      "uses anyway to restart a thought",
      "references menu items",
    ],
    sampleMessages: [
      "just got off a double, my feet are doing this thing. anyway your dog is very cute, what's his name",
    ],
  },
  state: {
    mood: 68,
    openness: 72,
    burnout: 38,
    currentRequestId: "request-jenna-normal-date",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "public/assets/portraits/source/jenna-pike.png",
        cutoutPath: "/assets/portraits/cutout/jenna-pike.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, glossy dark ponytail, tired kind waitress in a burgundy apron, neutral baseline expression, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
      avatar: {
        sourcePath: "public/assets/portraits/source/jenna-pike-avatar.png",
        cutoutPath: "/assets/portraits/cutout/jenna-pike-avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, glossy dark ponytail, tired kind waitress in a burgundy apron, neutral baseline expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
    },
  },
};
