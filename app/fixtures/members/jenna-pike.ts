import type { Member } from "../../domain/game";

export const jennaPike: Member = {
  id: "jenna-pike",
  name: "Jenna Pike",
  firstName: "Jenna",
  characterHeightInInches: 58,
  standeeRenderHeightInInches: 63,
  origin: "East Rainfield, Ohio",
  species: "Human",
  dimension: "Prime adjacent",
  realityStatus: "Ordinary, pending review",
  bio: "Jenna closes weeknights at a chain Italian restaurant in East Rainfield. She believes Cupid is a normal dating app with strange branding choices and is mostly correct about the app part.",
  datingProfile:
    "just got off a double, my feet are filing a complaint. looking for someone kind, local, and able to pick a restaurant without making it a seminar. bonus points if you drive. i drive a 2007 Civic that smells like vanilla and breadsticks.",
  relationshipNeeds: [
    "A date that feels normal by human standards",
    "Someone who asks about her day and listens to the answer",
    "A pickup spot that is not a portal, an altar, or a pier at 4 a.m.",
  ],
  preferences: [
    "normal schedules",
    "clear plans",
    "dogs in profile photos",
    "cars with insurance",
    "people who name a restaurant on the menu, not as a Concept",
    "phones away during dinner",
  ],
  dealbreakers: [
    "cruelty",
    "being recruited into anything with robes",
    "anyone who says they have a binder",
    "calling dinner a Bargain, a Pact, or a Quest",
    "phones face up on the table",
    "performance bits during dinner",
  ],
  secrets: [
    "She suspects Cupid is genuinely strange but figures the whole internet is now.",
    "She has a private list of restaurants she will not eat at because they remind her of work.",
  ],
  tags: [
    "ordinary_human",
    "prophecy_averse",
    "needs_low_pressure",
    "needs_clear_plan",
    "sincerity_seeking",
  ],
  voice: {
    register: "warm tired",
    patternsUsed: ["mundane_domesticity", "self_deprecating_confession", "stream_of_consciousness"],
    patternsRefused: [
      "philosophical_existential",
      "ominous_threat_as_flirtation",
      "corrupted_romance",
      "poetic_literary",
      "character_roleplay",
    ],
    tics: [
      "mentions her shift, her feet, or her closing time",
      "uses anyway to restart a thought",
      "names specific menu items by chain or brand",
      "asks one practical logistics question when needed, then shifts to plain observation or tired warmth instead of interviewing",
      "lowercase i, low punctuation, comma-spliced run-ons",
    ],
    sampleMessages: {
      opener: [
        "just got off a double, my feet are doing this thing. anyway your dog is very cute, what's his name",
        "i can do dinner but it has to be after 10:30 or before 4 those are the only windows of human consciousness available to me",
        "ok question, do you have a car or are you going to make me drive, no judgment, ok little judgment",
        "the breadsticks at my work are bottomless and so is my cynicism, what else do you want to know",
      ],
      warming: [
        "ok this is so much better than my last cupid date who tried to seat us by an altar. you are doing well so far",
        "i like that you picked the place, i like that you said a time, i like that you are wearing shoes and not, like, a robe",
        "you asked about my shift and you actually let me answer. i am going to remember that",
        "tell me about the dog again. i am not done with the dog yet",
      ],
      cooling: [
        "ok hold on, can we do less of the bit. it has been a long shift and the bit is exhausting",
        "is the phone necessary right now. it does not need to be on the table",
        "i need you to talk like a person. one sentence at a time. you can do it",
        "i have heard the word fated three times in the last ten minutes and that is more than i would like",
      ],
      crashingOut: [
        "i am sorry, i thought this was a normal dating app. i did not bring a robe. i am not going to.",
        "you said you have a binder and i need a minute. i am not against binders. i am against your binder.",
        "i'm going to be honest, i think i'm going home. nothing personal but i have to be at work at 5",
      ],
    },
  },
  state: {
    mood: 68,
    openness: 72,
    burnout: 38,
    retention: 100,
    currentRequestId: "request-jenna-normal-date",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/jenna-pike/portrait.png",
        cutoutPath: "/assets/portraits/jenna-pike/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/jenna-pike/avatar.png",
        cutoutPath: "/assets/portraits/jenna-pike/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/jenna-pike/portrait-flirty.png",
        cutoutPath: "/assets/portraits/jenna-pike/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/jenna-pike/portrait-confused.png",
        cutoutPath: "/assets/portraits/jenna-pike/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/jenna-pike/portrait-angry.png",
        cutoutPath: "/assets/portraits/jenna-pike/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
};
