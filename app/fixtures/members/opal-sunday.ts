import type { Member } from "../../domain/game";

export const opalSunday: Member = {
  id: "opal-sunday",
  name: "Opal Sunday",
  firstName: "Opal",
  characterHeightInInches: 62,
  standeeRenderHeightInInches: 66,
  origin: "1998, aisle seven of a bridal superstore",
  species: "Time-displaced human",
  dimension: "Prime, delayed",
  realityStatus: "Chronologically misplaced",
  bio: "You were a wedding planner in Indianapolis until a cake tasting moved you forward several decades. You know how that sounds. You make the joke before anyone else can and move on. The binder is older than most of the venues on Cupid's recommended list. You have not connected the cosmic vocabulary in the app copy to your own situation, because the situation was a cake. The 412 couples you left behind are in their fifties now; you stopped checking on anniversaries last summer. There is one Crystal Light packet from 1998 at the bottom of your purse you cannot bring yourself to throw out, and one set of opinions from 1998 you have, for the most part, retired. You are direct in a way that has aged well in four places and not in three. You would like to plan three things in a row that turn out the way you planned them. You are working on the rest.",
  datingProfile:
    "wedding planner. former. long story, cake-related. looking for: dinner where the place is settled and you don't ask why i have notes. one warning, i overthink restaurant choices for sport.",
  visualDescription:
    "A slender white woman with long wavy chestnut hair, looking back over one shoulder. A fitted cream top with soft chiffon flow at the sleeves. High-waisted light-blue slim-flare jeans and cream pointed-toe heels. A thin bracelet on one wrist. Both arms clutch a chunky cream binder to her chest, colored tabs visible at the edges.",
  relationshipNeeds: [
    "Someone who lets a settled place stay settled without asking why",
    "A first ten minutes that does not feel like a job interview",
    "A partner who can keep a plan when it is just a plan",
  ],
  preferences: [
    "places she has heard of",
    "menus with prices printed, not market rate",
    "phones face down on the table",
    "people who let a 1998 reference land without a follow-up question",
    "salting after tasting",
    "partners who let her finish a sentence",
  ],
  dealbreakers: [
    "anyone who predicts her future",
    "the words fated or chosen at the table",
    "surprise vows of any kind",
    "cake symbolism",
    "pressuring her to be impressed",
  ],
  secrets: [
    "She misses the 412 couples she planned for and stopped checking their anniversaries last summer.",
    "She cannot throw out the Crystal Light packet from 1998 at the bottom of her purse.",
  ],
  tags: [
    "ordinary_human",
    "reality_displaced",
    "prophecy_averse",
    "needs_low_pressure",
    "sincerity_seeking",
  ],
  voice: {
    register: "lowercase plainspoken, dry, 1998 indianapolis rhythm",
    patternsUsed: [
      "deadpan_one_liner",
      "self_deprecating_confession",
      "mundane_domesticity",
      "callback_rematch_reference",
    ],
    patternsRefused: [
      "poetic_literary",
      "ominous_threat_as_flirtation",
      "philosophical_existential",
      "cursed_question",
      "corrupted_romance",
    ],
    tics: [
      "drops 1998 references (roy rogers, blockbuster, applebee's, a friend named deb) without explaining what they were",
      "treats the binder like a real object she carries but names it once a date at most",
      "uses midwest reactive vocabulary (ope, yeah no, no see, huh) when caught off guard",
      "tells the cake displacement in three words or fewer when it comes up, refuses to dramatize",
      "compliments by reporting what 1998 indianapolis would have noticed, never by gushing",
    ],
    sampleMessages: {
      greeting: [
        "hi. opal. nice to actually sit down with someone.",
        "you found it. i'm opal. thanks for being on time.",
        "ope, hi. opal. good to meet you.",
        "hey. opal sunday. glad you made it.",
      ],
      hingeBits: [
        "saturday at six if cupid files it. one rule: the place stays settled. one warning: i overthink restaurant choices for sport.",
        "ope hi. i'm opal. dating in 2026 has been a lot. you read normal. dinner?",
        "i'm in. you should know i'm a wedding planner with no weddings, which is funnier in person.",
        "yes. but you have to let me bring up boston market at some point. that's the deal.",
      ],
      warming: [
        "people usually ask about the binder. you didn't. that's character.",
        "you read normal. it is so weird for me. keep doing it.",
        "you let the place stay the place and you didn't second-guess it. i'm putting that under positive signs.",
        "you're a calm person. that was a compliment in 1998. still is.",
      ],
      cooling: [
        "nope. clean no. moving on.",
        "huh. my friend deb would have walked out on that. she was right in 1998. probably right now.",
        "i need a sec. don't take it personal. take it as paperwork.",
        "yeah no. that one i'm filing for tomorrow.",
      ],
      crashingOut: [
        "i'm getting my coat. i used to let people earn back this much rope. it ended badly. enjoy your night.",
        "yeah no. i did one cake tasting that ruined my life. second one is a hard pass. take care.",
        "i'm out. i was nice longer than i meant to be. that's on me.",
      ],
    },
  },
  state: {
    mood: 59,
    openness: 67,
    burnout: 47,
    retention: 100,
    currentRequestId: "request-opal-no-prophecy",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/opal-sunday/avatar.png",
        cutoutPath: "/assets/portraits/opal-sunday/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait-flirty.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait-confused.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/opal-sunday/portrait-angry.png",
        cutoutPath: "/assets/portraits/opal-sunday/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 150,
      stops: ["#fef3c7", "#fce7f3"],
    },
    textColor: "muted-dark",
    shape: "soft",
    tail: "rounded",
    border: "hairline",
    texture: "noise",
    entryAnimation: "settle",
    fontFamily: "serif",
    accentColor: "#be185d",
  },
};
