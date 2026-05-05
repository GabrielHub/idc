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
  ],
  preferences: [
    "steakhouses",
    "people with calendars",
    "decisive partners",
    "Wednesdays after market close",
  ],
  dealbreakers: [
    "treating finance as a moral failing",
    "any version of you should chill",
    "first dates that try to be brunch",
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
    patternsRefused: ["poetic_literary", "stream_of_consciousness"],
    tics: [
      "frames plans as positions, longs, shorts, hedges, and sizes",
      "capitalizes Capital, Position, and Conviction when referring to feelings",
      "uses pencil in for any commitment under a week out",
      "drops specific tickers and prop firm jargon without explaining them",
      "ends pitches with a one line summary of the trade",
    ],
    sampleMessages: [
      "Taking a high conviction long position on Friday dinner. 7 p.m. Steakhouse. Penciling you in. Confirm by EOD or I rotate.",
      "I will be honest about the Lexus. It is leased. I am bullish on the lease. Closed.",
      "You are sized correctly for a first date. I have a small Position in you. Open to adding.",
      "Q3 was insane. Q4 was a gift. Q1 humbled me. Q2 owes me dinner. That is where you come in.",
    ],
  },
  state: {
    mood: 76,
    openness: 60,
    burnout: 49,
    currentRequestId: "request-tasha-counterparty",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait.png",
        prompt:
          "Original full body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, twenty-nine year old day trader with warm medium skin, glossy deep chestnut shoulder-length wavy hair swept to one side, champagne satin square-neck crop shell, cropped ivory blazer worn open, high-waisted tailored black trousers, designer loafers, slim gold arm cuff, subtle gold necklace, smartwatch on the left wrist, confident upbeat expression, slight forward lean, both hands visible outside pockets, one hand relaxed at her side, one hand holding a slim trading notebook, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/tasha-rell/avatar.png",
        cutoutPath: "/assets/portraits/tasha-rell/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art matching the full body Tasha Rell portrait, clean anime line work, expressive eyes, polished cel shading, twenty-nine year old day trader with warm medium skin, glossy deep chestnut shoulder-length wavy hair swept to one side, champagne satin square-neck crop shell, cropped ivory blazer worn open, gold jewelry, smartwatch on the left wrist, confident upbeat expression, slight three-quarter turn, one hand lightly touching the blazer lapel, upper half dating profile picture pose with shoulders visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
