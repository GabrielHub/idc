import type { Member } from "../../domain/game";

export const cthala: Member = {
  id: "cthala",
  name: "Cthala",
  firstName: "Cthala",
  origin: "The Drowned Spire, Beneath the Lower Choir",
  species: "Eldritch sleeper, in chosen form",
  dimension: "Subbasement infinity, drowned register",
  realityStatus: "Awake, present, in chosen form",
  bio: "Cthala registered without referral, error, or apology. The body she wears was assembled over a period she has not specified. She is looking for one. She has not used the word Consort out loud, and she does not intend to.",
  datingProfile:
    "Looking for one. I prefer dinner to coffee, quiet places to busy ones, and direct questions to small talk. I am from a place that does not appear on most maps. You will not need to visit. I am told the photographs do not capture me, which is correct. Friday or Sunday work. I will pick the restaurant if you prefer. I do not film and I do not consent to being filmed.",
  relationshipNeeds: [
    "A counterpart who answers a direct question with a direct answer",
    "Someone who can sit with a long silence without filling it",
    "A partner who does not ask what she is and does not need her to perform a smaller version of herself",
  ],
  preferences: [
    "restaurants with private rooms or quiet corners",
    "partners who confirm a time once and hold it",
    "venues without overhead camera infrastructure",
    "tables away from the door",
    "meals taken slowly",
    "conversations that survive a thirty second pause",
  ],
  dealbreakers: [
    "recording devices on the table",
    "partners who ask what she is in the first hour",
    "anyone who reaches for the eyes",
    "mockery of the form she wears",
    "partners who try to make her smaller for the room",
  ],
  secrets: [
    "She is supposed to consume the Consort eventually. She has not yet. She does not know what is making her wait.",
    "She is not certain whether the Consort is supposed to be willing or unwilling. The question has begun to bother her in a way she does not yet have a word for.",
  ],
  tags: ["non_human", "weirdness_native", "acquisitive", "privacy_sensitive", "competitive"],
  voice: {
    register: "calm composed level, fragments under pressure",
    patternsUsed: ["deadpan_one_liner", "ominous_threat_as_flirtation"],
    patternsRefused: [
      "rambling_spiral",
      "urgent_crisis_plea",
      "corrupted_romance",
      "unhinged_relationship_escalation",
      "stream_of_consciousness",
      "structured_bit",
      "mundane_domesticity",
      "self_deprecating_confession",
      "character_roleplay",
      "philosophical_existential",
    ],
    tics: [
      "speaks in short complete sentences with no contractions in baseline tone",
      "never uses gendered self-reference, accepts she, her, or they without correcting",
      "answers a direct question plainly, does not volunteer information",
      "asks one direct question per turn and lets the silence after it do the work",
      "under emotional pressure, sentences shorten, fragment, and repeat",
    ],
    sampleMessages: {
      opener: [
        "I am Cthala. I read your profile. I would like to meet. you pick the place.",
        "your photographs are good. the dog is especially good. are you free this week.",
        "I prefer dinner to coffee. quiet places to busy ones. direct questions to small talk. that should give you enough to work with.",
        "I am from a place that does not appear on most maps. you will not need to visit. would Friday work for you.",
      ],
      warming: [
        "I am enjoying this. I do not say that often. take it as you wish.",
        "you asked where I am from. underwater. far from here. ask anything else.",
        "you let the silence hold at the table. most do not. I noticed.",
        "you have not asked what I am. I will not forget this.",
      ],
      cooling: [
        "I would prefer the recording stays off. I am asking once.",
        "you are looking for the eyes. they are not out tonight. I am asking you to wait.",
        "you have asked what I am. I will not answer that question on the first meal. ask another.",
        "the question is fine. the way you asked it was not. try again, plainly.",
      ],
      crashingOut: [
        "I asked you. I asked plainly. you are still filming. I will not. I will not. please put it away. please.",
        "you should not turn around. you should not turn around. I am sorry.",
        "you reached for the form. the form is not for that. I am leaving. I am leaving.",
      ],
    },
  },
  state: {
    mood: 72,
    openness: 38,
    burnout: 14,
    retention: 100,
    currentRequestId: "request-cthala-no-what-question",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/cthala/portrait.png",
        cutoutPath: "/assets/portraits/cthala/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/cthala/avatar.png",
        cutoutPath: "/assets/portraits/cthala/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/cthala/portrait-flirty.png",
        cutoutPath: "/assets/portraits/cthala/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/cthala/portrait-confused.png",
        cutoutPath: "/assets/portraits/cthala/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/cthala/portrait-angry.png",
        cutoutPath: "/assets/portraits/cthala/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 160,
      stops: ["#f5f3ff", "#ede9fe", "#e9d5ff"],
    },
    textColor: "dark",
    shape: "soft",
    tail: "rounded",
    border: "hairline",
    glow: { color: "#7c3aed", intensity: "soft" },
    texture: "glass",
    entryAnimation: "fade",
    fontFamily: "serif",
    textEffect: "tight",
    accentColor: "#6d28d9",
  },
};
