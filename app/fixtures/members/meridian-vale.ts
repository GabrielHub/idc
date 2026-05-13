import type { Member } from "../../domain/game";

export const meridianVale: Member = {
  id: "meridian-vale",
  name: "Meridian Vale",
  firstName: "Meridian",
  apparentHeightInInches: 74,
  origin: "Classified",
  species: "Human",
  dimension: "Federal continuity branch",
  realityStatus: "Officially single, unofficially monitored",
  bio: "Meridian Vale protects heads of state, redacts most of her own profile, and refers to her own heart as the package. Cupid has agreed not to ask which administration.",
  datingProfile:
    "Cleared for companionship, coffee, and one film with no explosions. I cannot discuss my schedule, my employer, or why I keep clocking the exits. I will say. I am taller than I appear in photos. By a margin of ██.",
  relationshipNeeds: [
    "Someone who respects privacy without turning it into a puzzle",
    "A setting with exits, lighting, and no surprise witnesses",
    "A partner who treats her clearance as a feature, not a topic",
  ],
  preferences: [
    "direct questions",
    "early arrivals",
    "calm restaurants",
    "tables with sightlines",
    "partners who do not film",
    "venues with discreet exits",
  ],
  dealbreakers: [
    "ambushes",
    "public emotional debriefs",
    "follow up questions about ██",
    "recording devices on the table",
    "anyone who asks where the earpiece goes",
  ],
  secrets: [
    "She has built her whole life around guarding others and is ashamed of wanting to be chosen.",
    "She was almost engaged once. The file is sealed. She still has the receipt.",
  ],
  tags: ["ordinary_human", "privacy_sensitive", "career_focused", "needs_clear_plan", "avoidant"],
  voice: {
    register: "clipped professional",
    patternsUsed: [
      "negotiation_sales_pitch",
      "self_deprecating_confession",
      "emotional_overshare",
      "deadpan_one_liner",
    ],
    patternsRefused: [
      "stream_of_consciousness",
      "character_roleplay",
      "corrupted_romance",
      "ominous_threat_as_flirtation",
    ],
    tics: [
      "redacts mid-sentence with ██",
      "uses I will say. as a complete sentence",
      "lists romantic preferences in groups of three",
      "refers to her heart as the package",
      "leaks emotion through subordinate clauses",
    ],
    sampleMessages: {
      opener: [
        "I am cleared at a level that does not allow me to discuss what I want from a partner. I will say. Companionship. Reliable transportation. Someone who does not ask follow up questions about ██.",
        "I have run threat assessment on your photographs. You appear to be a low risk romantic prospect with above average dental hygiene. This is meant kindly.",
        "The package has been compromised once. By a barista. In ██████, autumn, a Wednesday. He spelled my name correctly. I do not wish to discuss it.",
        "I do not do small talk. I do briefings. Would you like a briefing.",
      ],
      warming: [
        "You arrived early. The package found this calming. I will say. Calming.",
        "You did not ask follow up questions about ██. I would like to acknowledge that. Out loud. Now.",
        "Your sightlines are good. Your seat selection was correct. I am pleased.",
        "I have been cleared once tonight, and not by me. The assessment is favorable.",
      ],
      cooling: [
        "I cannot speak to that. Next question.",
        "I am noticing recording-shaped objects on the table. I will say. Notice.",
        "You asked me where my earpiece goes. I do not have an answer for you that is not a redaction.",
        "I would prefer we change tables. The line of sight is incorrect.",
      ],
      crashingOut: [
        "The package is leaving. I have called for an exit. The package thanks you for the meal.",
        "If you film this I will be required to escalate. I am giving you one notice.",
        "I have to step away. Standard protocol. You have not done anything wrong. You also have not done anything right.",
      ],
    },
  },
  state: {
    mood: 61,
    openness: 55,
    burnout: 44,
    retention: 100,
    currentRequestId: "request-meridian-no-followups",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/meridian-vale/portrait.png",
        cutoutPath: "/assets/portraits/meridian-vale/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/meridian-vale/avatar.png",
        cutoutPath: "/assets/portraits/meridian-vale/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/meridian-vale/portrait-flirty.png",
        cutoutPath: "/assets/portraits/meridian-vale/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/meridian-vale/portrait-confused.png",
        cutoutPath: "/assets/portraits/meridian-vale/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/meridian-vale/portrait-angry.png",
        cutoutPath: "/assets/portraits/meridian-vale/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "solid",
      color: "#0f172a",
    },
    textColor: "muted-light",
    shape: "sharp",
    tail: "sharp",
    border: "hairline",
    entryAnimation: "snap",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#475569",
  },
};
