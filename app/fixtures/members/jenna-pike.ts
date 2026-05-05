import type { Member } from "../../domain/game";

export const jennaPike: Member = {
  id: "jenna-pike",
  name: "Jenna Pike",
  origin: "East Rainfield, Ohio",
  species: "Human",
  dimension: "Prime adjacent",
  realityStatus: "Ordinary, pending review",
  bio: "Jenna closes weeknights at a chain Italian restaurant in East Rainfield. She believes Cupid is a normal dating app with strange branding choices and is mostly correct about the app part.",
  datingProfile:
    "just got off a double, my feet are filing a complaint. looking for someone kind, local, and able to pick a restaurant without making it a seminar. bonus points if you drive. i drive a 2007 Civic that smells like vanilla and breadsticks.",
  traits: ["warm", "tired", "practical", "surprisingly brave"],
  relationshipNeeds: [
    "A date that feels normal by human standards",
    "Someone who asks about her day and listens to the answer",
    "A pickup spot that is not a portal, an altar, or a pier at 4 a.m.",
  ],
  redFlags: [
    "treats service workers like furniture",
    "uses prophecy before appetizers",
    "orders water and means it",
  ],
  preferences: ["normal schedules", "clear plans", "dogs in profile photos", "cars with insurance"],
  dealbreakers: [
    "cruelty",
    "being recruited into anything with robes",
    "anyone who says they have a binder",
  ],
  secrets: [
    "She suspects Cupid is genuinely strange but figures the whole internet is now.",
    "She has a private list of restaurants she will not eat at because they remind her of work.",
  ],
  tags: ["ordinary_human", "service_industry", "normal_date_request"],
  voice: {
    register: "warm tired",
    patternsUsed: ["mundane_domesticity", "self_deprecating_confession", "stream_of_consciousness"],
    patternsRefused: ["philosophical_existential", "ominous_threat_as_flirtation"],
    tics: [
      "mentions her shift, her feet, or her closing time",
      "uses anyway to restart a thought",
      "names specific menu items by chain or brand",
      "asks practical logistics questions before warm ones",
      "lowercase i, low punctuation, comma-spliced run-ons",
    ],
    sampleMessages: [
      "just got off a double, my feet are doing this thing. anyway your dog is very cute, what's his name",
      "i can do dinner but it has to be after 10:30 or before 4 those are the only windows of human consciousness available to me",
      "ok question, do you have a car or are you going to make me drive, no judgment, ok little judgment",
      "the breadsticks at my work are bottomless and so is my cynicism, what else do you want to know",
    ],
  },
  state: {
    mood: 68,
    openness: 72,
    burnout: 38,
    currentRequestId: "request-jenna-normal-date",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/jenna-pike/portrait.png",
        cutoutPath: "/assets/portraits/jenna-pike/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, shoulder-length dark brown bob with wispy face-framing bangs, warm brown eyes, tired kind chain restaurant waitress in a burgundy half apron over a black uniform polo, dark work pants, comfortable black sneakers, order pad in apron pocket, both hands behind her back, neutral baseline expression, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/jenna-pike/avatar.png",
        cutoutPath: "/assets/portraits/jenna-pike/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, shoulder-length dark brown bob with wispy face-framing bangs, warm brown eyes, tired kind chain restaurant waitress in a burgundy half apron over a black uniform polo, order pad in apron pocket, neutral baseline expression, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
