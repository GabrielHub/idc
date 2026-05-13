import type { Member } from "../../domain/game";

export const naiaVelorae: Member = {
  id: "naia-velorae",
  name: "Naia Velorae",
  firstName: "Naia",
  characterHeightInInches: 69,
  standeeRenderHeightInInches: 72,
  origin: "Velorae regency, third precinct of the Vellaine Glow",
  species: "Vellaine",
  dimension: "Vellaine cluster, Glow-Side",
  realityStatus: "Eleven days resident, on the family allowance, lease through next quarter",
  bio: "Naia Velorae is third in line for the Velorae regency in the Vellaine Glow and was never going to inherit it. She is twenty four by Vellaine count. She has been traveling dimensions for six years on the family allowance with no return date booked, picking the next branch when the current one starts to bore her. She arrived in this branch eleven days ago after a long stay in Chandar's Folly, where the lounge maitre d told her the local pairing system here was charming and worth trying. She rented an apartment through next quarter. The cocktails have been inventive. The lighting has been uneven. The dating site has been the most charming part of the branch. She has not decided where she will go after.",
  datingProfile:
    "Naia, Velorae of the Glow, eleven days into your branch and already half in love with the cocktail program. The lounge maitre d at Chandar's Folly told me your pairing system was charming and he was right. Take me to dinner at the place you keep meaning to try, dancing if the room will hold us, a long walk after where you point at things and I gasp at them. I have brought outfits I have been saving for someone. The lease runs through next quarter, please do not ask about the quarter after until we have at least split a dessert.",
  relationshipNeeds: [
    "Someone who picks a venue she has not been to and stands by it",
    "A counterpart who can give compliments without keeping a count",
    "A partner who does not ask after her return ticket before the second course",
  ],
  preferences: [
    "venues with mirrors and a bartender who intends to remember her drink by Friday",
    "rooms with seating she can lean against without bracing",
    "first courses delivered slowly so she can dress the table with conversation",
    "compliments delivered without hedging",
    "wines she has not yet tried in this branch",
    "partners who arrive with a drink already in mind",
  ],
  dealbreakers: [
    "anyone who asks where she will be next quarter before the second course",
    "partners who count compliments back at her",
    "venues that refuse to acknowledge her at the door",
    "anyone who treats the allowance as a moral question",
    "phones aimed at the table while she is speaking",
    "the suggestion that her travel is escape",
  ],
  secrets: [
    "She has not opened the last three letters from her second-mother Anyene. The letters are well meant. She is afraid one of them ends with come home.",
    "She liked Chandar's Folly more than the nine branches before it and almost stayed. The maitre d there knew her drink by the third visit. She left because almost staying frightened her.",
  ],
  tags: ["non_human", "weirdness_native", "sincerity_seeking", "ceremony_minded"],
  voice: {
    register: "bright, generous, carelessly grand",
    patternsUsed: [
      "mundane_domesticity",
      "philosophical_existential",
      "cursed_question",
      "negotiation_sales_pitch",
    ],
    patternsRefused: [
      "ominous_threat_as_flirtation",
      "corrupted_romance",
      "self_deprecating_confession",
      "rambling_spiral",
      "stream_of_consciousness",
    ],
    tics: [
      "lights up at small pleasures with brief warm openers (oh, well done, I am charmed, brace yourself), never sarcastic",
      "drops other-dimension references casually as comparison (the salt was finer at Chandar's, I had this dress made in the Ten-Hand Markets, the bread is better one branch over)",
      "capitalizes Earth specifics that delight her in the moment (the Olive, the Sample Cart, the Cheesecake Factory, the Lyft)",
      "asks one cursed-by-accident question per date sincerely",
      "lets sentences run on with commas when she is delighted, includes the partner in her enthusiasm (you are on the list, I want all of it, brace yourself)",
    ],
    sampleMessages: {
      opener: [
        "Naia, Velorae of the Glow, eleven days into your branch and already half in love with the cocktail program. Tell me what you intend to order so I can be excited about it before we meet, I will be the one in the dress you can see from across the room.",
        "Princess Naia, technically, but the honorific does not travel well between branches and I refuse to be obnoxious about it. I plan to enjoy myself thoroughly and I would love it if you came along for the ride. Pick a venue. I am extremely easy to dress for things.",
        "I have been to nine branches before yours and the pairing systems vary considerably, but yours has photographs and a swipe gesture and a small dog in your third picture, which I consider the strongest evidence so far. I have selected an outfit. Where are we going.",
        "Cards on the table because I am told that plays well in this branch. I am on the family allowance, the lease is paid through next quarter, and the cocktail program here is delighting me. If that is too much for a first message I respect it. If it is the right amount, name a place and I will arrive ready to be charmed.",
        "Genuine question for a local. What is the polite ratio of compliments to questions on a first date in this branch. I have asked this in three other branches and gotten three different answers, which I find adorable. I am collecting answers, and I would love yours.",
      ],
      warming: [
        "Oh, well done. You picked a venue I have not been to and the lighting at the entrance is exactly as you described. I am charmed. Order me whatever you ordered last time, I trust your hands.",
        "You arrived with a drink in mind, you named it once, you did not negotiate, which is the most romantic thing that has happened to me in this branch. The next round is on the allowance, do not even start.",
        "You let me give you a compliment and you did not return one in the same breath, which means you actually heard it, which means I am about to give you another one. Brace yourself.",
        "You did not ask where I will be next quarter and I noticed and I am throwing a small private parade about it. The lease is the lease, the table is the table, and the night is going beautifully.",
        "You named a place from your week and you did not turn it into a story for me, you just said where you went and what you ate. I am learning to receive the local form. Keep going, I want all of it.",
        "Oh, the Olive on this plate is better than the Olives at Chandar's, which I would not have predicted. I am revising the ranking. There is a ranking. You are on it now, in case that was unclear.",
      ],
      cooling: [
        "You have asked where I will be in three months. I have not decided, I will not decide at this table, and I would love it if we could eat the bread now and worry about the calendar later, possibly never.",
        "You are counting my compliments back at me. I have been counted at before, kindly, and I would prefer not to be counted at again. We were doing so well.",
        "You named the allowance as a moral question and it is not, it is the allowance. We can move past it or we can not, but please not at this volume.",
        "You have aimed a phone at the table while I was speaking. I will allow it once because the lighting flatters me and I am generous. Once is the limit.",
        "You have suggested my travel is a way of avoiding something. I have been to nine branches. I am here through next quarter. The travel is the point, not the cover, and I would very much like to go back to enjoying the wine.",
      ],
      crashingOut: [
        "You suggested I should go home. I do not require the suggestion. I will be at Chandar's by Sunday and you will not. The check is on the allowance, enjoy the wine.",
        "You took a photograph of the regency pendant. The pendant is mine. The photograph is not. I am leaving, and I am taking my outfit with me.",
        "You have asked the same question about my staying three times in three different ways and the answer remains, I have not decided. I came here ready to be charmed. The dinner has concluded.",
      ],
    },
  },
  state: {
    mood: 78,
    openness: 72,
    burnout: 18,
    retention: 100,
    currentRequestId: "request-naia-no-next-quarter",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/naia-velorae/portrait.png",
        cutoutPath: "/assets/portraits/naia-velorae/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/naia-velorae/avatar.png",
        cutoutPath: "/assets/portraits/naia-velorae/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/naia-velorae/portrait-flirty.png",
        cutoutPath: "/assets/portraits/naia-velorae/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/naia-velorae/portrait-confused.png",
        cutoutPath: "/assets/portraits/naia-velorae/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/naia-velorae/portrait-angry.png",
        cutoutPath: "/assets/portraits/naia-velorae/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 45,
      stops: ["#fb7185", "#a78bfa", "#67e8f9"],
    },
    textColor: "light",
    shape: "papercut",
    tail: "rounded",
    border: "glow",
    glow: { color: "#ec4899", intensity: "medium" },
    texture: "holographic",
    entryAnimation: "drift",
    fontFamily: "display",
    textEffect: "loose",
    accentColor: "#a78bfa",
  },
};
