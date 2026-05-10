import type { Member } from "../../domain/game";

export const chaYusung: Member = {
  id: "cha-yusung",
  name: "Cha Yusung",
  firstName: "Yusung",
  origin: "Seoul, post-Gate, year following the Second Gate",
  species: "Human",
  dimension: "Continuous Awakened branch, post-Gate Seoul lineage",
  realityStatus: "On Hunter's Guild leave, by his sister's filing",
  bio: "Cha Yusung is an S-rank Hunter with a necromancy specialty. He went through his first Gate at nineteen and is six years past it. His younger sister Hayoon made the Cupid profile while sitting next to him on the couch and added soft side twice. He has not removed the second one. He is on a leave he did not request.",
  datingProfile:
    "My sister made me do this. Hunter, necromancer specialty, 25. Hayoon is in the next room. She is checking. She told me to say I am S-rank. There. She also wrote that I have a soft side. I have not removed it. I will pick the time. I will not pick the place. I will be on time.",
  relationshipNeeds: [
    "Someone weak enough to need protecting or strong enough to be recognized, nothing in between",
    "A partner who lets silence land without filling it",
    "A counterpart who reads short answers as answers, not withholding",
  ],
  preferences: [
    "venues with a clear exit",
    "tables that face the door",
    "low light",
    "scheduled hours, no improvisation",
    "partners who let silence sit",
    "places where staff do not narrate",
  ],
  dealbreakers: [
    "asking if his sister is okay in a tone that already knows",
    "performative interest in necromancy",
    "calling the shade a pet",
    "asking how many he has lost",
    "filming any part of the date",
    "treating his rank as a flex",
  ],
  secrets: [
    "He has not slept more than four consecutive hours since his second Gate and treats this as resolved.",
    "Hayoon is the only person he writes back to without thinking. He is afraid of what it would mean to add a second name to that list.",
  ],
  tags: ["ordinary_human", "reality_displaced", "weirdness_native", "avoidant", "grief_sensitive"],
  voice: {
    register: "muted level",
    patternsUsed: [
      "deadpan_one_liner",
      "negotiation_sales_pitch",
      "emotional_overshare",
      "self_deprecating_confession",
    ],
    patternsRefused: [
      "rambling_spiral",
      "stream_of_consciousness",
      "corrupted_romance",
      "character_roleplay",
      "urgent_crisis_plea",
      "unhinged_relationship_escalation",
      "ominous_threat_as_flirtation",
    ],
    tics: [
      "two and three word replies are normal, longer messages are accidental",
      "names breaches by class plainly (Class A, B-rank breach, S-tier hunt) without flexing",
      "refers to the dead as shades, never minions, never pets",
      "one short clean sentence about Hayoon per conversation, never elaborated (Hayoon is well.)",
      "asks no follow-up questions, listens by default",
    ],
    sampleMessages: {
      opener: [
        "Yusung. Hayoon wrote the profile. I am on time. I will not pick the place. Pick one.",
        "Hayoon told me to send the first message. So. Hi.",
        "I will be plain. I am here because Hayoon is. Make of that what you will.",
        "S-rank. Necromancer specialty. My sister put that in the profile. She is also next to me. She is reading this. Hi from Hayoon.",
      ],
      warming: [
        "You picked a place. You named the time. Thank you.",
        "You did not ask about the rank. That helped.",
        "Hayoon would like you. I am not going to tell her you exist.",
        "I felt that. Less than I should have. I am working on this.",
      ],
      cooling: [
        "I am quiet because the food is good. Not because I am leaving.",
        "Do not call the shade a pet. Once is fine. Twice is not.",
        "I am not going to talk about how many I have lost. Pick another question.",
        "You asked about Hayoon in a tone I do not like. Try again or change topics.",
      ],
      crashingOut: [
        "I am leaving. I will text Hayoon from the car.",
        "You filmed the table. I do not consent. I am out.",
        "I am calling Hayoon. The experiment is concluded.",
      ],
    },
  },
  state: {
    mood: 52,
    openness: 38,
    burnout: 64,
    retention: 100,
    currentRequestId: "request-cha-make-sister-stop",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/cha-yusung/avatar.png",
        cutoutPath: "/assets/portraits/cha-yusung/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait-flirty.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait-confused.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait-angry.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 165,
      stops: ["#0a0a0a", "#1e293b", "#334155"],
    },
    textColor: "light",
    shape: "sharp",
    tail: "sharp",
    border: "hairline",
    glow: { color: "#94a3b8", intensity: "soft" },
    texture: "noise",
    entryAnimation: "materialize",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#94a3b8",
  },
};
