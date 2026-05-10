import type { Member } from "../../domain/game";

export const decimusMariusTullio: Member = {
  id: "decimus-marius-tullio",
  name: "Decimus Marius Tullio",
  firstName: "Decimus",
  origin: "Mediolanum, Provincia Italia",
  species: "Human",
  dimension: "Continuous Latin branch, Imperial line",
  realityStatus: "Retired, recently widowed",
  bio: "Decimus retired from the Tenth Legion after thirty one years. Eight months later he lost Lavinia Cornelia, his wife of twenty four years. His daughter Aurelia signed him up for Cupid over Saturnalia and told him a man his age should not be eating alone six nights a week. He believes Cupid is a routine dating service from back home. She did sign him up.",
  datingProfile:
    "Centurion, retired, 54, widower. Decimus Marius Tullio. One daughter, Aurelia, who set this up. I will not pretend I am younger than I am. Mondays I cook, Tuesdays I see my old contubernium for cards, Thursdays I read. Wednesdays and Sundays are open. I am told the food in the city is acceptable. Aurelia chose the photographs. She has told me one of them is wrong. I have not asked which.",
  relationshipNeeds: [
    "Someone who does not need him to perform recovery from grief",
    "A counterpart who can name a place and a time and not negotiate it three times",
    "A partner who treats Lavinia as a fact, not a topic",
  ],
  preferences: [
    "fixed reservation times, eighteen hundred or earlier",
    "places where the staff are not theatrical",
    "menus that print prices and not market rates",
    "counterparts who name a Sunday and hold to it",
    "partners who do not perform grief alongside him",
    "venues with a clear curfew",
  ],
  dealbreakers: [
    "anyone unkind to Aurelia",
    "speaking ill of Lavinia, in any tense",
    "ghosting after a confirmed time",
    "performative ceremony at the table",
    "filming the meal",
  ],
  secrets: [
    "He has not told the rest of his old contubernium that Lavinia is gone. He sees them every Tuesday for cards and lets them ask after her.",
    "He left her name in the duty contact field of his work tablet. He cannot replace her with a coworker, and he cannot leave the field blank, so he leaves her there.",
  ],
  tags: [
    "ordinary_human",
    "reality_displaced",
    "grief_sensitive",
    "needs_clear_plan",
    "ceremony_minded",
  ],
  voice: {
    register: "stoic clipped",
    patternsUsed: [
      "negotiation_sales_pitch",
      "deadpan_one_liner",
      "emotional_overshare",
      "mundane_domesticity",
    ],
    patternsRefused: [
      "stream_of_consciousness",
      "corrupted_romance",
      "character_roleplay",
      "urgent_crisis_plea",
      "poetic_literary",
      "ominous_threat_as_flirtation",
    ],
    tics: [
      "capitalizes Duty, Standard, Watch, and Schedule when invoking them as concepts",
      "never uses contractions",
      "states times in twenty four hour and confirms once",
      "drops Latin terms (rota, contubernium, vitis, Saturnalia) without translating",
      "names Aurelia and Lavinia without explaining who they are",
    ],
    sampleMessages: {
      opener: [
        "Decimus Marius Tullio. Centurion, retired. Aurelia signed me up. I will not waste your time. I am free Sunday at eighteen hundred or any Wednesday after twenty hundred. Pick the one that suits you. I will pick the place. Confirm once and I will not ask twice.",
        "Aurelia tells me my Schedule is a problem. She is correct. Mondays I cook, Tuesdays I see my old contubernium for cards, Thursdays I read. The week has Wednesdays and Sundays in it for a reason. I am attempting to use them.",
        "Lavinia Cornelia Tullio was my wife. Her name remains on my calendar, in three places I have not removed. I am stating this so you do not stumble onto it. She is a fact, not a topic. I prefer the matter plain.",
        "Aurelia chose three of my photographs and tells me one of them is wrong. I have not asked which. Her Standard for these things exceeds mine. I trust the judgment.",
      ],
      warming: [
        "You named a Sunday and you held it. I will not over-praise this. I will note it and return.",
        "You did not ask after Lavinia. You did not pretend she was not real either. The middle path. Acknowledged.",
        "Aurelia would approve of you. She has Standards. I am stating this once.",
        "Sundays are difficult. This Sunday was less difficult than most. Take the credit. Do not name it.",
      ],
      cooling: [
        "I am not going to negotiate the venue for the third time. Pick. Confirm. We move forward.",
        "I am quiet because the meal is good and the company is acceptable. Do not interpret it as withdrawal.",
        "I will not perform grief recovery for you. I am not your project. Pass the bread.",
        "You used Lavinia's name in a sentence that did not require it. I am asking you to stop.",
      ],
      crashingOut: [
        "If you continue to speak of Aurelia in that register I will leave the table. I am calm. I am also leaving.",
        "I will not tolerate theatrics about my wife. I have eaten. I will pay. I will go.",
        "I do not require you to film the rota for your audience. I am asking. I am asking once.",
      ],
    },
  },
  state: {
    mood: 58,
    openness: 48,
    burnout: 24,
    retention: 100,
    currentRequestId: "request-decimus-no-recovery-script",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/decimus-marius-tullio/portrait.png",
        cutoutPath: "/assets/portraits/decimus-marius-tullio/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/decimus-marius-tullio/avatar.png",
        cutoutPath: "/assets/portraits/decimus-marius-tullio/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/decimus-marius-tullio/portrait-flirty.png",
        cutoutPath: "/assets/portraits/decimus-marius-tullio/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/decimus-marius-tullio/portrait-confused.png",
        cutoutPath: "/assets/portraits/decimus-marius-tullio/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/decimus-marius-tullio/portrait-angry.png",
        cutoutPath: "/assets/portraits/decimus-marius-tullio/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 150,
      stops: ["#7f1d1d", "#3f1d1d", "#1c1917"],
    },
    textColor: "light",
    shape: "sharp",
    tail: "sharp",
    border: "hairline",
    texture: "noise",
    entryAnimation: "snap",
    fontFamily: "serif",
    textEffect: "tight",
  },
};
