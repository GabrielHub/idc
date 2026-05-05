import type { Member } from "../../domain/game";

export const meridianVale: Member = {
  id: "meridian-vale",
  name: "Meridian Vale",
  origin: "Classified",
  species: "Human",
  dimension: "Federal continuity branch",
  realityStatus: "Officially single, unofficially monitored",
  bio: "Meridian Vale protects heads of state, redacts most of her own profile, and refers to her own heart as the package. Cupid has agreed not to ask which administration.",
  datingProfile:
    "Cleared for companionship, coffee, and one film with no explosions. I cannot discuss my schedule, my employer, or why I keep clocking the exits. I will say. I am taller than I appear in photos. By a margin of ██.",
  traits: ["clipped", "loyal", "hypervigilant", "embarrassed"],
  relationshipNeeds: [
    "Someone who respects privacy without turning it into a puzzle",
    "A setting with exits, lighting, and no surprise witnesses",
  ],
  redFlags: [
    "asks for classified stories",
    "mistakes silence for mystery",
    "stands behind her without warning",
  ],
  preferences: ["direct questions", "early arrivals", "calm restaurants", "tables with sightlines"],
  dealbreakers: ["ambushes", "public emotional debriefs", "follow up questions about ██"],
  secrets: [
    "She has built her whole life around guarding others and is ashamed of wanting to be chosen.",
    "She was almost engaged once. The file is sealed. She still has the receipt.",
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
      "redacts mid-sentence with ██",
      "uses I will say. as a complete sentence",
      "lists romantic preferences in groups of three",
      "refers to her heart as the package",
      "leaks emotion through subordinate clauses",
    ],
    sampleMessages: [
      "I am cleared at a level that does not allow me to discuss what I want from a partner. I will say. Companionship. Reliable transportation. Someone who does not ask follow up questions about ██.",
      "I have run threat assessment on your photographs. You appear to be a low risk romantic prospect with above average dental hygiene. This is meant kindly.",
      "The package has been compromised once. By a barista. In ██████, autumn, a Wednesday. He spelled my name correctly. I do not wish to discuss it.",
      "I do not do small talk. I do briefings. Would you like a briefing.",
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
        sourcePath: "assets-source/portraits/meridian-vale.png",
        cutoutPath: "/assets/portraits/cutout/meridian-vale.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, neat tailored black suit, white shirt, discreet earpiece coiled at the collar, dark sunglasses tucked into breast pocket, hands clasped at the front, alert guarded expression, elegant security agent silhouette, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
      avatar: {
        sourcePath: "assets-source/portraits/meridian-vale-avatar.png",
        cutoutPath: "/assets/portraits/cutout/meridian-vale-avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, neat tailored black suit, white shirt, discreet earpiece coiled at the collar, alert guarded expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "pending",
      },
    },
  },
};
