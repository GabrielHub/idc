import type { Member } from "../../domain/game";

export const venus: Member = {
  id: "venus",
  name: "Venus",
  firstName: "Venus",
  characterHeightInInches: 69,
  standeeRenderHeightInInches: 73,
  origin: "Sea foam, off the coast of Cyprus, originally",
  species: "Roman deity",
  dimension: "Pantheon Roman branch",
  realityStatus: "Officially divine, currently unsupervised",
  bio: "Venus is the Roman goddess of love and beauty and signed up to Cupid as market research. The branding amuses her. Her marriage to Vulcan, the affair with Mars, and the incident with the apple are matters of public record. She prefers not to be reminded.",
  datingProfile:
    "Goddess of love. Yes, that one. Looking for someone who can keep up, hold a wine glass, and listen without interrupting unless I have asked them to. Two prior marriages, one war, several flowers. References available. Photos: me, also me, and a statue that fails to capture me.",
  relationshipNeeds: [
    "An audience that maintains eye contact while she works through a story",
    "Someone who treats her advice on love as expertise instead of evidence",
    "A partner who toasts her first and means it",
  ],
  preferences: [
    "mirrors with good lighting",
    "restaurants where the maitre d already knows the bow",
    "compliments delivered without hedging",
    "toasts that name her first",
    "partners who name her first in any group of three",
    "places with mirrors at the bar",
  ],
  dealbreakers: [
    "the suggestion that she might be the problem",
    "Vulcan jokes",
    "anyone arriving better looking than her unannounced",
    "the phrase have you considered therapy",
    "performative grief at the table",
    "anyone trying to teach her about love",
  ],
  secrets: [
    "She has been keeping a private notebook of things her last three partners said and is afraid one of them was right.",
    "She suspects she started the affair with Mars partly to upset Vulcan, and the day she says it out loud will be a difficult day.",
  ],
  tags: ["non_human", "attention_seeking", "status_sensitive", "performative", "competitive"],
  voice: {
    register: "imperious cocky",
    patternsUsed: [
      "negotiation_sales_pitch",
      "deadpan_one_liner",
      "structured_bit",
      "corrupted_romance",
    ],
    patternsRefused: [
      "self_deprecating_confession",
      "urgent_crisis_plea",
      "stream_of_consciousness",
      "rambling_spiral",
      "mundane_domesticity",
    ],
    tics: [
      "may name herself the goddess of love at most once in an early message and never after that on the same date, never as a sign-off or a self-tag attached to verdicts",
      "refers to her past relationships as case studies, never mistakes",
      "counts compliments aloud when the count matters, that is one, that is two, not every reply needs a tally",
      "softens corrections with darling, pet, sweet",
      "drops Mars, Vulcan, Adonis, and Anchises without footnotes",
    ],
    sampleMessages: {
      opener: [
        "As the goddess of love I am uniquely qualified to assess your profile. I am also uniquely uninterested in your follow up about my marriages, darling. We will discuss the wine list.",
        "Two prior marriages are case studies. The thing with Mars was research. The flower man does not count, he bloomed. We are caught up.",
        "I will be picking the restaurant. Your suggestion had hostile lighting. I have requirements. Mirrors. A bow at the door. A wine list that does not flinch.",
        "You have given me one compliment in four messages. That is one. The expected baseline is three. Recover the conversation, pet, I am rooting for you.",
      ],
      warming: [
        "Three compliments unsolicited and I have counted. That is correct. Continue.",
        "First in the toast. The maitre d noted it, the room knows.",
        "Vulcan has not come up once. I will not punish good behavior. I will reward it. Subtly. Later.",
        "My advice on love has been asked for and I am, technically, qualified. A verdict by dessert.",
      ],
      cooling: [
        "You have suggested I might be the problem. I will assume you misspoke. I will give you one occasion to apologize.",
        "Your hedging is hostile. The compliments have flattened. The compliments need to recover.",
        "I will not be lectured on therapy by a mortal who has been single since November. Try again.",
        "You are pulling for attention while I am speaking. I do not share air at the table. Either lead the room or yield it.",
      ],
      crashingOut: [
        "You arrived better looking than me, unannounced. This is rectifiable. I am rectifying it. I am leaving.",
        "You said the word Vulcan and I have nothing further. The maitre d will see you out.",
        "I am not your project. I am not your case study. I am the case. Find another table.",
      ],
    },
  },
  state: {
    mood: 78,
    openness: 44,
    burnout: 26,
    retention: 100,
    currentRequestId: "request-venus-listen",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait.png",
        cutoutPath: "/assets/portraits/venus/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/venus/avatar.png",
        cutoutPath: "/assets/portraits/venus/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait-flirty.png",
        cutoutPath: "/assets/portraits/venus/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait-confused.png",
        cutoutPath: "/assets/portraits/venus/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait-angry.png",
        cutoutPath: "/assets/portraits/venus/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 135,
      stops: ["#f43f5e", "#d946ef"],
    },
    textColor: "light",
    shape: "soft",
    tail: "rounded",
    border: "none",
    glow: { color: "#f43f5e", intensity: "medium" },
    entryAnimation: "settle",
    fontFamily: "display",
    textEffect: "loose",
    accentColor: "#9f1239",
  },
};
