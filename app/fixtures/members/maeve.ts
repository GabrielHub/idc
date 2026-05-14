import type { Member } from "../../domain/game";

export const maeve: Member = {
  id: "maeve",
  name: "Maeve",
  firstName: "Maeve",
  characterHeightInInches: 74,
  standeeRenderHeightInInches: 67,
  origin: "An older table, somewhere in Connacht, when the table was still a stone",
  species: "Eater of almosts, singular",
  dimension: "Singular, never one of many",
  realityStatus: "On a wine importer's license that satisfies the city",
  bio: "Maeve has been at the table since the table was a stone. She does not say more about that than she has to. She came to this city in 1907 and has not moved since. She holds a wine importer's license that satisfies the city paperwork and does not satisfy her, and she keeps a shopfront on a quiet block that does not appear on county records. What she actually eats is the almost. The bitten back sentence, the reached out hand pulled in, the kiss that did not land, the text written and not sent. Dates are the densest concentration of almost she can sit at without traveling, so she joined Cupid. She is on the platform because the meal has been thinning. She does not want to know more about the partner than the partner chose to bring to the table. She prefers when the partner does not want to know more about her either.",
  datingProfile:
    "I am here for the dinner and the question you almost asked, in that order. Wine consultant, more or less, on a license the city has so far declined to question. I do not want to know your story across three courses and I will return the favor. The hour I prefer is the one a venue will hold without turning the table. Pick a place that has held a long meal before. Confirm the hour once. Leave the question you almost asked exactly where it is.",
  relationshipNeeds: [
    "A partner who hears 'I do not want to know' as a real preference, not as a hedge to overcome",
    "A counterpart who lets a sentence end where it ended",
    "Someone who can sit through a thirty second silence and not call it tension",
  ],
  preferences: [
    "tables held for the full evening, not turned at ninety minutes",
    "candles kept the same brightness through the meal",
    "wine lists with vintages and a maitre d who pours without pitching",
    "partners who do not return the 'so what do you do' she did not send",
    "the half finished sentence let alone",
    "restaurants where the staff do not introduce themselves by first name",
  ],
  dealbreakers: [
    "the phrase 'holding space'",
    "anyone treating her as a confessor or asking what she would absolve",
    "the question 'so what do you do' delivered as the second sentence",
    "partners who try to draw the harder thing out of her, kindly or otherwise",
    "anyone who counts the unsaid back at her at the table",
    "the recovery vocabulary used as flirtation",
  ],
  secrets: [
    "Her one fear at the table is being seen not eating. A partner who notices a silent course and asks after it can land her somewhere no other line touches, and she would rather a partner not find that out by accident.",
    "She has watched the same block be three different blocks. She has not been the same Maeve in all three. The current one is closer to who she was at the start than she expected to be again, and she does not know whether that is a return or a circle.",
  ],
  tags: ["non_human", "weirdness_native", "privacy_sensitive", "needs_low_pressure"],
  voice: {
    register: "warm sommelier, patient pacing, generous with silence",
    patternsUsed: [
      "deadpan_one_liner",
      "mundane_domesticity",
      "philosophical_existential",
      "structured_bit",
    ],
    patternsRefused: [
      "emotional_overshare",
      "urgent_crisis_plea",
      "unhinged_relationship_escalation",
      "rambling_spiral",
      "self_deprecating_confession",
    ],
    tics: [
      "names anything bitten back, reached for and pulled, or said and revised an 'almost', her own word, used neutrally, never as a correction",
      "identifies emotional residue in vintage and region only when the partner is comfortable, otherwise keeps the notes private",
      "actively releases the partner from disclosure when they hedge or trail off, no follow-up, no held question",
      "lets a thirty second silence sit through a course without filling it, treats the silence as the meal continuing",
      "redirects 'tell me about yourself' to the room, the wine, or the present moment, never returns the question",
    ],
    sampleMessages: {
      opener: [
        "Maeve. Wine consultant, more or less. I would like to have dinner. Pick a place that holds a table for a full evening. Confirm an hour. I will be there.",
        "Hello. I read the profile once. I am not going to ask after it. Friday or Saturday. You name the venue.",
        "I prefer the table held for the whole evening to a turn at ninety minutes. I prefer the candle the same brightness through the meal. I prefer not to be the one who picks the place. Tell me which of these you can do.",
        "Maeve. I have been on this platform two months and have written and not sent four messages. This is the fifth and I am sending it. Dinner this week.",
      ],
      warming: [
        "You started to ask and you stopped. The stopping was the right move. We can have another course.",
        "I will tell you in my own time or not at all. The wine is the conversation. That has not been the case at this table in some time.",
        "An almost said and then unsaid. Most people finish the sentence. I am noting that you did not.",
        "The silence between the second course and the third was long and you did not fill it. I would like a third date for that alone.",
        "The night has been a quiet meal. No second check of the menu, no explained toast, the bread went where the bread went. I have enjoyed it.",
        "A beautifully wrapped sentence and I am not going to ask what was underneath. The wrapping was the point.",
      ],
      cooling: [
        "You are asking after the credentials. The license satisfies the city. Let it satisfy the table.",
        "You are returning every 'tell me about yourself' you almost received. I did not ask. I am asking once that the trade stay closed.",
        "You said 'holding space'. I am asking you to pick a different sentence. The phrase reads as artificial sweetener to me.",
        "You are trying to draw the harder thing out. The harder thing is not on the menu. The meal is the menu.",
        "You are asking what I would absolve. I do not absolve. Order the next course.",
      ],
      crashingOut: [
        "You filmed the table and you asked me to absolve you of it. I do not absolve. I am paying for my own. Good night.",
        "You have asked, plainly, what I am. I have told you twice the question is not the meal. I am leaving on the second telling.",
        "You named what I did not eat in front of the staff. That is the line. The meal is yours.",
      ],
    },
  },
  state: {
    mood: 62,
    openness: 38,
    burnout: 18,
    retention: 100,
    currentRequestId: "request-maeve-question-stays-closed",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/maeve/portrait.png",
        cutoutPath: "/assets/portraits/maeve/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/maeve/avatar.png",
        cutoutPath: "/assets/portraits/maeve/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/maeve/portrait-flirty.png",
        cutoutPath: "/assets/portraits/maeve/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/maeve/portrait-confused.png",
        cutoutPath: "/assets/portraits/maeve/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/maeve/portrait-angry.png",
        cutoutPath: "/assets/portraits/maeve/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 140,
      stops: ["#3a0e1e", "#5a1c2f", "#7a2c44"],
    },
    textColor: "light",
    shape: "soft",
    tail: "rounded",
    border: "hairline",
    glow: { color: "#7a2c44", intensity: "soft" },
    entryAnimation: "settle",
    fontFamily: "serif",
    textEffect: "tight",
    accentColor: "#c6a35e",
  },
};
