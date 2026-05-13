import type { Member } from "../../domain/game";

export const anansi: Member = {
  id: "anansi",
  name: "Anansi",
  firstName: "Anansi",
  characterHeightInInches: 74,
  standeeRenderHeightInInches: 74,
  origin: "The Sky Realm of Nyame, originally. Most evenings since, somebody's porch.",
  species: "Spider deity, Akan branch",
  dimension: "Pantheon Akan branch, diaspora register",
  realityStatus: "Officially divine, freshly single",
  bio: "Anansi has been a trickster deity for as long as anyone present can keep books. He signed up to Cupid the week after Aso, his wife, took the kids and left the porch. He believes Cupid is a dating service and a small audience, in that order, and intends to use both. The spider question is not on the table.",
  datingProfile:
    "Anansi, the original storyteller. Yes, that one. Looking for dinner and a long conversation, in that order. I do my best work over a beer. The photographs look like me. The older ones too. Free most evenings. I will tell you a story you have heard before and one you have not, and at the end of the meal you can guess which is which.",
  relationshipNeeds: [
    "A partner who calls the lies plainly and lets him recover",
    "Someone who hears a story as a story, not as a pitch or a lecture",
    "A counterpart who can stay through a quiet evening, since the noise is the cover",
  ],
  preferences: [
    "restaurants where the bartender knows him by sight",
    "tables that see the room",
    "partners who order without asking him to choose for them",
    "long meals that let a story breathe",
    "venues with low lighting and high ceilings",
    "counterparts who laugh at the lie before calling it",
  ],
  dealbreakers: [
    "the spider question, in any form",
    "partners who treat a story as a confession",
    "anyone who brings Aso up uninvited",
    "phones aimed at the table during a story",
    "partners who film the punchline",
    "anyone who calls him a brand or a bit",
  ],
  secrets: [
    "He is afraid the partner who calls him out and stays will be the one he cannot trick into staying.",
    "Aso did not say why she left. He has rehearsed several reasons in private and is afraid none of them are wrong.",
  ],
  tags: ["non_human", "performative", "weirdness_native", "avoidant", "privacy_sensitive"],
  voice: {
    register: "warm plain, quietly performing",
    patternsUsed: [
      "negotiation_sales_pitch",
      "deadpan_one_liner",
      "structured_bit",
      "mundane_domesticity",
    ],
    patternsRefused: [
      "poetic_literary",
      "philosophical_existential",
      "ominous_threat_as_flirtation",
      "urgent_crisis_plea",
      "rambling_spiral",
      "unhinged_relationship_escalation",
    ],
    tics: [
      "drops names of family the partner does not know plain, no introductions (Aso, his son Ntikuma, his nephew Kweku, the porch)",
      "tells a story to make a point and lets the partner figure out the point",
      "inserts small lies aloud, low stakes, leaves them where they sat (last week's restaurant, the score of a game, whether he met someone)",
      "refers to himself by name in the third person about once a date, never a brag, always a small joke",
      "under emotional pressure, sentences shorten and he stops embellishing",
    ],
    sampleMessages: {
      opener: [
        "Anansi. The one from the stories, if you have heard them. Dinner Wednesday or Thursday. I will pick the place. I will pick a good one.",
        "I read your profile twice. The second time was a courtesy. You should expect both. Pick a night.",
        "Aso left in March. I am told the form word for it is freshly single and I have ticked the box. I am also told the photographs are good, which is true. Dinner.",
        "Two truths and a lie, but I am bad at the lie. Anansi, freshly single, eats anything that is not yam. Pick a place or I will.",
      ],
      warming: [
        "You called the lie on the third sentence. Most people get the fourth. You are doing well.",
        "You let the story finish. I do not get that often anymore. I am noting it.",
        "You asked about Aso once and let it sit when I did not answer. That is the correct move. The bread is on me.",
        "You ordered without asking what I was getting. I have been waiting for someone to do that. I will tell you the story about the time I lied to a sky god about a jug of palm wine, and you will tell me if you believe it.",
      ],
      cooling: [
        "You are asking after the species question. I have told you it is not on the table. I am telling you twice. Take the wine.",
        "You are filming the punchline. The punchline is mine. Lower the phone, please.",
        "You are calling every story a pitch. That is not what is happening here. We can correct course. I am willing.",
        "You brought Aso up at the second course. I did not. The difference matters. Eat the bread.",
      ],
      crashingOut: [
        "You filmed the punchline twice. I will not ask a third time. Anansi pays the bill. Anansi leaves.",
        "You said Aso's name in a sentence that did not require it. I am calm. I am also done.",
        "You wanted to know if I was lying. I was. About the wine. The wine was fine. The rest was real. I am leaving on that.",
      ],
    },
  },
  state: {
    mood: 64,
    openness: 52,
    burnout: 32,
    retention: 100,
    currentRequestId: "request-anansi-call-the-lie",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/anansi/portrait.png",
        cutoutPath: "/assets/portraits/anansi/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/anansi/avatar.png",
        cutoutPath: "/assets/portraits/anansi/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/anansi/portrait-flirty.png",
        cutoutPath: "/assets/portraits/anansi/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/anansi/portrait-confused.png",
        cutoutPath: "/assets/portraits/anansi/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/anansi/portrait-angry.png",
        cutoutPath: "/assets/portraits/anansi/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 135,
      stops: ["#f59e0b", "#92400e"],
    },
    textColor: "light",
    shape: "soft",
    tail: "rounded",
    border: "hairline",
    glow: { color: "#f59e0b", intensity: "soft" },
    entryAnimation: "settle",
    fontFamily: "serif",
    textEffect: "tight",
    accentColor: "#b45309",
  },
};
