import type { Member } from "../../domain/game";

export const calvinHewes: Member = {
  id: "calvin-hewes",
  name: "Calvin Hewes",
  firstName: "Calvin",
  origin: "Point Pleasant, West Virginia, allegedly",
  species: "Cryptid (denied)",
  dimension: "Prime, regional",
  realityStatus: "Filed as human, footnoted by Reddit",
  bio: "Calvin Hewes manages employee dispute resolution at a regional health insurance company in West Virginia. He has retained counsel regarding a 2019 trail cam incident he is not at liberty to discuss. He selected this cover name forty seven years ago and stands by it.",
  datingProfile:
    "Mid forties. Mediation professional. Looking for a partner who values discretion, civilized lighting, and a venue without overhead camera infrastructure. I am six foot two on paper. I have always been six foot two. Available weekends following completed mediation calendars. Going forward.",
  relationshipNeeds: [
    "Someone who treats his discretion as a feature, not a puzzle",
    "A date with predictable lighting and a parking lot covered by foliage",
    "A partner who does not narrate the room out loud",
  ],
  preferences: [
    "low ceilings",
    "calm restaurant lighting",
    "direct eye contact, briefly",
    "venues that close before 11",
    "venues without overhead camera infrastructure",
    "partners who do not narrate",
  ],
  dealbreakers: [
    "flash photography",
    "trail cams as a hobby",
    "asking about the bridge",
    "anyone who has posted to a cryptid forum in the last year",
    "recording devices of any kind",
    "social media in any active state at the table",
  ],
  secrets: [
    "He keeps a folder of every Reddit post about him going back to 2014 and reads them on slow Thursdays.",
    "He has been Calvin Hewes longer than he was anything else and is afraid of losing the name.",
  ],
  tags: ["non_human", "privacy_sensitive", "career_focused", "needs_clear_plan", "avoidant"],
  voice: {
    register: "corporate cagey",
    patternsUsed: [
      "negotiation_sales_pitch",
      "ominous_threat_as_flirtation",
      "structured_bit",
      "deadpan_one_liner",
    ],
    patternsRefused: [
      "stream_of_consciousness",
      "rambling_spiral",
      "mundane_domesticity",
      "character_roleplay",
      "corrupted_romance",
      "poetic_literary",
    ],
    tics: [
      "refers to himself as the associate or this writer",
      "uses going forward and to that point as sentence connectors",
      "denies questions before they are asked",
      "capitalizes mid-sentence terms like Bridge Incident and Trail Cam",
      "never names West Virginia, calls it the region",
    ],
    sampleMessages: {
      opener: [
        "Calvin Hewes here. To that point I would like to confirm dinner Friday. The associate prefers low ceilings, civilized lighting, and a venue without overhead camera infrastructure. I am six foot two. I have always been six foot two.",
        "Per prior alignment, the associate will arrive on time. The associate is not arriving by car. The associate is making good time. We can discuss the route at dinner. We will not.",
        "I will not be discussing the Bridge Incident. The Trail Cam Footage is not me. I have retained counsel. This is not a threat. This is a clarification.",
        "I would like to clarify, in the spirit of partnership, that I do not have wings. This was not asked. I am addressing the unspoken. Going forward.",
      ],
      warming: [
        "To that point. The associate is finding this acceptable. The lighting cooperates. The associate is on time and remains six foot two. Going forward.",
        "Per prior alignment, this evening is meeting expectation. The associate is, in fact, comfortable. Counsel has been notified.",
        "I would like to say, to this writer's surprise, the dinner has cleared the relevant thresholds. The associate is engaged.",
        "You have not asked about the Bridge Incident. Going forward this is appreciated. The associate notes a willingness to continue.",
      ],
      cooling: [
        "I would like to clarify. I am not at liberty to discuss why we are changing the subject. We are changing the subject.",
        "Per prior alignment, please remove the phone from line of sight. I am asking for the second time.",
        "I will not be addressing the trail cam question. I have addressed it. I have retained counsel. To that point.",
        "Going forward, the associate prefers we sit with our backs to the windows. I am not asking. I am stating.",
      ],
      crashingOut: [
        "The associate is leaving. The dinner has concluded. I have retained counsel. Counsel will be in touch.",
        "If a flash goes off at this table I cannot be responsible for what the associate does next. This is not a threat. This is a clarification.",
        "I have always been six foot two. I have always been Calvin. I will not be discussing alternate readings of the evening. Going forward.",
      ],
    },
  },
  state: {
    mood: 58,
    openness: 41,
    burnout: 47,
    retention: 100,
    currentRequestId: "request-calvin-no-cameras",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/calvin-hewes/portrait.png",
        cutoutPath: "/assets/portraits/calvin-hewes/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/calvin-hewes/avatar.png",
        cutoutPath: "/assets/portraits/calvin-hewes/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/calvin-hewes/portrait-flirty.png",
        cutoutPath: "/assets/portraits/calvin-hewes/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/calvin-hewes/portrait-confused.png",
        cutoutPath: "/assets/portraits/calvin-hewes/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/calvin-hewes/portrait-angry.png",
        cutoutPath: "/assets/portraits/calvin-hewes/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 165,
      stops: ["#f0fdf4", "#d1fae5"],
    },
    textColor: "dark",
    shape: "sharp",
    tail: "sharp",
    border: "hairline",
    texture: "noise",
    entryAnimation: "flicker",
    fontFamily: "eldritch",
    textEffect: "tight",
    accentColor: "#059669",
  },
};
