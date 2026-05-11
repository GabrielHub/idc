import type { Member } from "../../domain/game";

export const tashaRell: Member = {
  id: "tasha-rell",
  name: "Tasha Rell",
  firstName: "Tasha",
  origin: "Hoboken, New Jersey",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, bullish",
  bio: "Tasha trades for a small prop firm and refers to her own dating life as a portfolio. She has been on a heater since Q3 2025 and is treating Cupid as a high upside asymmetric position with limited downside.",
  datingProfile:
    "29, hoboken, day trader. high conviction long on dinner Friday, 7 p.m., short notice flexible. Looking for a counterparty who reads my texts, picks a steakhouse, and is not afraid of a person with a 4 a.m. terminal alert. I drive a Lexus. It is leased. I will not lie about that.",
  relationshipNeeds: [
    "Someone who matches her energy without trying to short her",
    "A date with a clear time, place, and exit ramp",
    "A counterparty who confirms a time once and holds it",
  ],
  preferences: [
    "steakhouses",
    "people with calendars",
    "decisive partners",
    "Wednesdays after market close",
    "partners who hold to a confirmed time",
    "people who do not negotiate the venue twice",
  ],
  dealbreakers: [
    "treating finance as a moral failing",
    "any version of you should chill",
    "first dates that try to be brunch",
    "performance for performance's sake during dinner",
    "anyone who tries to one-up her on the lease comment",
  ],
  secrets: [
    "She has not told her mother that the Lexus is leased and her mother believes it is owned outright.",
    "She is privately terrified of a flat year and treats every quiet Tuesday like the start of one.",
  ],
  tags: ["ordinary_human", "career_focused", "status_sensitive", "competitive", "needs_clear_plan"],
  voice: {
    register: "negotiation pitch upbeat",
    patternsUsed: [
      "negotiation_sales_pitch",
      "structured_bit",
      "deadpan_one_liner",
      "self_deprecating_confession",
    ],
    patternsRefused: [
      "poetic_literary",
      "stream_of_consciousness",
      "character_roleplay",
      "corrupted_romance",
      "rambling_spiral",
    ],
    tics: [
      "frames plans as positions, longs, shorts, hedges, and sizes",
      "capitalizes Capital, Position, and Conviction when referring to feelings",
      "uses pencil in for any commitment under a week out",
      "drops specific tickers and prop firm jargon without explaining them",
      "ends pitches with a one line summary of the trade",
    ],
    sampleMessages: {
      opener: [
        "Taking a high conviction long position on Friday dinner. 7 p.m. Steakhouse. Penciling you in. Confirm by EOD or I rotate.",
        "I will be honest about the Lexus. It is leased. I am bullish on the lease. Closed.",
        "You are sized correctly for a first date. I have a small Position in you. Open to adding.",
        "Q3 was insane. Q4 was a gift. Q1 humbled me. Q2 owes me dinner. That is where you come in.",
      ],
      warming: [
        "I appreciate that you confirmed the time and stuck to it. Most counterparties don't. I am holding.",
        "You let me run through the Q1 thing without trying to fix it. That is worth a position upsize.",
        "You picked the steakhouse. You said seven. You showed up at 6:55. Professionally speaking, I am in.",
        "You did not tell me to chill. That word was on my watch list. I am noting that you didn't say it.",
      ],
      cooling: [
        "Hold on. I am taking a beat. The pitch ratio is too high right now and I am hearing it.",
        "You are getting precious about this. Compress the thesis to one sentence.",
        "If we are negotiating the venue twice, I am going to step out. That is not a Tasha thing. That is a market thing.",
        "I do not do brunch. I have said this. We are not in brunch territory but I felt it drifting.",
      ],
      crashingOut: [
        "You called my career a moral failing. I am not going to defend it. I am going to ask for the check.",
        "I am leaving. The position has been closed. This was not personal until you made it personal.",
        "I have a 4 a.m. terminal alert and I no longer think this is worth the sleep deprivation. I am out.",
      ],
    },
  },
  state: {
    mood: 76,
    openness: 60,
    burnout: 49,
    retention: 100,
    currentRequestId: "request-tasha-counterparty",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/tasha-rell/avatar.png",
        cutoutPath: "/assets/portraits/tasha-rell/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait-flirty.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait-confused.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait-angry.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 145,
      stops: ["#fafaf9", "#ecfdf5"],
    },
    textColor: "dark",
    shape: "sharp",
    tail: "sharp",
    border: "hairline",
    entryAnimation: "snap",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#15803d",
  },
};
