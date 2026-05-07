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
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait-flirty.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Tasha Rell portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same twenty-nine year old day trader with warm medium skin, glossy deep chestnut shoulder-length wavy hair swept to one side, champagne satin square-neck crop shell, cropped ivory blazer sliding off both shoulders, high-waisted tailored black trousers, designer loafers, slim gold arm cuff, subtle gold necklace, black smartwatch on the left wrist, perched on the front edge of a partial painterly office desk with brushstroke sides fading into the white background, both arms reaching back with hands braced on the desk, torso leaning forward with controlled confidence, dramatic flirty expression with half-lidded eye contact and a pronounced lower lip bite, full body visible, plain white background, no text, no logo, no frame, no scenery, no trading notebook",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait-confused.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait-confused.png",
        prompt:
          "Original full-body confused portrait variant for Interdimensional Dating Coach matching the approved Tasha Rell portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same twenty-nine year old day trader with warm medium skin, glossy deep chestnut shoulder-length wavy hair swept to one side, champagne satin square-neck crop shell, cropped ivory blazer worn open, high-waisted tailored black trousers, designer loafers, slim gold arm cuff, subtle gold necklace, black smartwatch on the left wrist, controlled market-confusion expression with pinched brows, narrowed sideways eyes, and parted skeptical mouth, leaning slightly back with weight shifted onto one hip, one hand hovering over the smartwatch as if checking whether reality just moved against her, other hand raised near chest height with two fingers lifted in a small pause gesture, full body visible, plain white background, no text, no logo, no frame, no scenery, no trading notebook",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/tasha-rell/portrait-angry.png",
        cutoutPath: "/assets/portraits/tasha-rell/portrait-angry.png",
        prompt:
          "Original full-body angry gameplay portrait variant for Interdimensional Dating Coach matching the approved Tasha Rell portrait, interpreted as guarded boundary irritation while calling for the check, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same twenty-nine year old day trader with warm medium skin, glossy deep chestnut shoulder-length wavy hair swept to one side, champagne satin square-neck crop shell, cropped ivory blazer held more closed by a crossed arm, high-waisted tailored black trousers, designer loafers, slim gold arm cuff, subtle gold necklace, black smartwatch on the left wrist, seated on a minimal restaurant chair, body angled slightly away, head turned aside toward an implied server, cold done expression with lowered brows, narrowed side glance, and tight flat mouth, one raised hand pinched as if signing for the check with an invisible pen and no visible writing, other arm crossed across her body in a guarded posture, full body visible, plain white background, no text, no logo, no frame, no scenery, no trading notebook",
        model: "image_gen built-in",
      },
    },
  },
};
