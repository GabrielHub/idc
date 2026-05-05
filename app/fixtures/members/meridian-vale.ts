import type { Member } from "../../domain/game";

export const meridianVale: Member = {
  id: "meridian-vale",
  name: "Meridian Vale",
  origin: "Classified",
  species: "Human",
  dimension: "Federal continuity branch",
  realityStatus: "Officially single, unofficially monitored",
  bio: "Meridian protects heads of state and refers to their own heart as the package.",
  datingProfile:
    "Cleared for companionship, coffee, and one movie where nothing explodes. I cannot discuss my schedule, my employer, or why I keep looking at exits.",
  traits: ["clipped", "loyal", "hypervigilant", "embarrassed"],
  relationshipNeeds: [
    "Someone who respects privacy without turning it into a puzzle",
    "A setting with exits, lighting, and no surprise witnesses",
  ],
  redFlags: ["asks for classified stories", "mistakes silence for mystery"],
  preferences: ["direct questions", "early arrivals", "calm restaurants"],
  dealbreakers: ["ambushes", "public emotional debriefs"],
  secrets: [
    "They have built their whole life around guarding others and are ashamed of wanting to be chosen.",
  ],
  tags: ["ordinary_human", "career_guarded", "privacy_sensitive"],
  voice: {
    register: "clipped professional",
    patternsUsed: [
      "negotiation_sales_pitch",
      "self_deprecating_confession",
      "emotional_overshare",
      "deadpan_one_liner",
    ],
    patternsRefused: ["stream_of_consciousness", "character_roleplay"],
    tics: [
      "lists in threes",
      "uses status report phrasing",
      "declines to elaborate",
      "calls their heart the package",
    ],
    sampleMessages: [
      "I am cleared at a level that does not allow me to discuss what I want from a partner. I will say. Companionship. Reliable transportation. No follow-up questions about [redacted].",
    ],
  },
  state: {
    mood: 61,
    openness: 55,
    burnout: 44,
    currentRequestId: "request-meridian-no-followups",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "public/assets/portraits/source/meridian-vale.png",
        cutoutPath: "/assets/portraits/cutout/meridian-vale.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, neat black suit, discreet earpiece, guarded expression, elegant security agent silhouette, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
      avatar: {
        sourcePath: "public/assets/portraits/source/meridian-vale-avatar.png",
        cutoutPath: "/assets/portraits/cutout/meridian-vale-avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, neat black suit, discreet earpiece, guarded expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
    },
  },
};
