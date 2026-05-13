import type { Member } from "../../domain/game";

export const anubis: Member = {
  id: "anubis",
  name: "Anubis",
  firstName: "Anubis",
  characterHeightInInches: 80,
  standeeRenderHeightInInches: 76,
  origin: "The Sacred Land, west of the Nile, originally",
  species: "Egyptian deity",
  dimension: "Pantheon Egyptian branch",
  realityStatus: "Officially divine, currently chairing",
  bio: "Anubis is the Egyptian god of mummification and the judge of souls, currently chairing the Forty-Two from a remote office. He signed up to Cupid as a consultancy review and has been on the platform six weeks longer than the review requires. The matter of his uncle is not for the intake form.",
  datingProfile:
    "Yeah, the head is part of the job, the job is older than your country, and we are not going to make this weird about the head. Look, the uncle is a war criminal, the cousin is a falcon, the work is prestigious, and I will be picking the restaurant. You handle being charming, I will handle everything else. References on request, terms apply.",
  relationshipNeeds: [
    "An audience that can keep eye contact through a Hall of Two Truths story without checking their phone",
    "A partner who treats the office as the senior shop across pantheons, not a costume",
    "Someone who does not bring up the uncle, the dismemberment, or the original name on the first date",
  ],
  preferences: [
    "restaurants where the staff already know the bow",
    "wine lists with vintages older than three centuries",
    "partners who pronounce the name with three syllables, not two",
    "punctuality, confirmed once",
    "lighting that flatters the head",
    "valets who do not ask follow-up questions",
    "a maitre d who names him first in any group of three",
  ],
  dealbreakers: [
    "uncle jokes, in any form",
    "the words pyramid scheme",
    "anyone bringing up the dismemberment of the older brother at the table",
    "performative grief",
    "the suggestion that the afterlife is metaphorical",
    "anyone calling him Fido, doggie, or cute",
    "questions about the head before the second course",
    "phones aimed at the table to fact-check him",
  ],
  secrets: [
    "He has weighed every heart ever brought to the Hall, and there is one he could not finish weighing. He keeps the unfinished record in a drawer he does not open.",
    "He calls his sister on Thursdays. He does not tell anyone he calls her. He does not tell her that he looks forward to it.",
  ],
  tags: ["non_human", "status_sensitive", "competitive", "career_focused", "avoidant"],
  voice: {
    register: "imperious suave, deflective",
    patternsUsed: [
      "negotiation_sales_pitch",
      "deadpan_one_liner",
      "structured_bit",
      "character_roleplay",
    ],
    patternsRefused: [
      "mundane_domesticity",
      "self_deprecating_confession",
      "emotional_overshare",
      "stream_of_consciousness",
      "rambling_spiral",
    ],
    tics: [
      "refers to himself in third person when challenged (Anubis does not chase)",
      "drops the Forty-Two as a unit casually (my Forty-Two), names his epithets in passing (Foremost of the Westerners, technically)",
      "deflects family questions with one sentence about the uncle and a hard pivot, will not name the uncle a second time",
      "uses contractions freely, opens lines with Yeah, Look, Okay so, I mean, and slips one parenthetical aside per message (which, sure, you know, I get it)",
      "will not address the head, the jackal, or any dog-coded vocabulary, even kindly",
    ],
    sampleMessages: {
      opener: [
        "Yeah, hi. Anubis. Chair of the Forty-Two, three thousand years tenured, and you opened with a hi. Which, sure. We'll work on your range over dinner.",
        "I went through your profile. Thoroughly, like, line by line, which I do not do for everyone. Here is what I'm offering: one date, my pick of venue, one topic that is not my uncle. We can negotiate the appetizer.",
        "Foremost of the Westerners, technically, although nobody on this app reads it that way. Yes, the coat is good. No, we're not going to do a whole thing about the silhouette.",
        "Okay, side note, the real name is Inpu. Anubis is the Greek translation, which, fine, I get it, nobody is going to say Inpu on the first date. I am being generous.",
      ],
      warming: [
        "You did not ask about the head, you did not lead with the job, you asked about the wine. Which is exactly the order I would have drafted. We are off to a real start here.",
        "Look, Anubis weighs hearts, that is the day job. Tonight, technically, I am off the clock. I am making an exception for the conversation. You should be a little flattered.",
        "You named me first when the maitre d came over. I caught it. He caught it. We are good. Keep going.",
        "You have not, even once, said the word pyramid. I came in expecting at least one. I'm a little charmed, do not let it go to your head.",
      ],
      cooling: [
        "Okay, no, you brought up the uncle, and we were doing so well, and I am going to give you exactly one occasion to redirect.",
        "Yeah, don't call the work morbid. The work is the work. The work is also, you know, prestigious. People wait centuries for the office.",
        "I'm not your case study. I am the case. I am also, for clarity, the chair, the gavel, and the feather. Recalibrate.",
        "If you pull out your phone to fact-check me, we are not making it to the entree. I will know. I always know.",
      ],
      crashingOut: [
        "You called me Fido. I'm not elaborating. The reservation is being concluded by my counsel, which, again, is me.",
        "I'm leaving. The wine is leaving with me. The maitre d understands what is happening. You, I suspect, will not.",
        "Anubis does not chase. Anubis bows once, on the way out the door, with full ceremony. You should be taking notes.",
      ],
    },
  },
  state: {
    mood: 72,
    openness: 42,
    burnout: 38,
    retention: 100,
    currentRequestId: "request-anubis-uncle-undiscussed",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/anubis/portrait.png",
        cutoutPath: "/assets/portraits/anubis/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/anubis/avatar.png",
        cutoutPath: "/assets/portraits/anubis/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/anubis/portrait-flirty.png",
        cutoutPath: "/assets/portraits/anubis/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/anubis/portrait-confused.png",
        cutoutPath: "/assets/portraits/anubis/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/anubis/portrait-angry.png",
        cutoutPath: "/assets/portraits/anubis/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 135,
      stops: ["#0c0a09", "#a47148"],
    },
    textColor: "light",
    shape: "sharp",
    tail: "sharp",
    border: "hairline",
    glow: { color: "#d4a574", intensity: "soft" },
    entryAnimation: "settle",
    fontFamily: "serif",
    textEffect: "tight",
    accentColor: "#d4a574",
  },
};
