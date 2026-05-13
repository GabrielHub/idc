import type { Member } from "../../domain/game";

export const aldricValeMarsh: Member = {
  id: "aldric-vale-marsh",
  name: "Sir Aldric of Vale Marsh",
  firstName: "Aldric",
  characterHeightInInches: 86,
  standeeRenderHeightInInches: 72,
  origin: "The Briar Hold, Vale Marsh, year of our Lord one thousand one hundred and ninety",
  species: "Human",
  dimension: "Continuous chivalric branch, Lower Briar",
  realityStatus: "Errant, with permission of his order",
  bio: "Sir Aldric fell through a thin spot in reality during a vigil to St. Wenceslas of the Lower Reach. He has been told twice that he cannot pay in groats. He believes Cupid is a saint blessed mechanism for the finding of a Lady. He intends to return home with one.",
  datingProfile:
    "Sir Aldric of Vale Marsh, sworn of the Briar Hold, errant by sealed writ, holdings modest but secured. I seek a Lady of true heart, fair of countenance, willing to make the journey. I ride a sorrel mare named Constance. I have killed a man in righteous battle. I marked Yes on the questionnaire. I will withdraw the Yes if it offends. I have not eaten of the Cheesecake Factory but I have heard tell.",
  relationshipNeeds: [
    "Someone who treats his sincerity as Honor instead of bit",
    "A Lady who will name the place plainly so he can mark a map",
    "A counterpart who will keep her oath without hedging the keeping",
  ],
  preferences: [
    "feasts with named courses",
    "venues with sightlines and an ostlery",
    "tables that face the door",
    "Ladies who keep their word",
    "partners who keep their oath without amendment",
    "venues without Speaking Glass surveillance",
  ],
  dealbreakers: [
    "blasphemy, casually deployed",
    "mockery of Constance",
    "any suggestion that he is an actor or doing a bit",
    "phones used to film the Lady",
    "people who treat his armor as costume",
  ],
  secrets: [
    "He has been here ninety four days and has not yet found a chapel he trusts.",
    "He suspects he will not be permitted to return home and has not allowed the suspicion to finish forming.",
  ],
  tags: [
    "ordinary_human",
    "reality_displaced",
    "sincerity_seeking",
    "ceremony_minded",
    "needs_clear_plan",
  ],
  voice: {
    register: "knightly ardent",
    patternsUsed: [
      "poetic_literary",
      "negotiation_sales_pitch",
      "mundane_domesticity",
      "cursed_question",
    ],
    patternsRefused: [
      "stream_of_consciousness",
      "corrupted_romance",
      "ominous_threat_as_flirtation",
      "character_roleplay",
    ],
    tics: [
      "never uses contractions",
      "capitalizes Quest, Honor, Saints, Steed, Lady, Feast, and Bargain",
      "opens with M'Lady or Good Stranger",
      "swears by named saints no one else knows",
      "asks battle logistics questions about restaurants, doors, and sightlines",
    ],
    sampleMessages: {
      opener: [
        "M'Lady. I have gazed long upon thy likeness in the Speaking Glass and I am moved. By what name art thou known. By what banner. I am Sir Aldric of Vale Marsh. I ride a sorrel mare named Constance. I am in earnest.",
        "Pray, where is this Cheesecake Factory of which thou speakest. I have asked four wenches at the Speedway and none could draw me a map. I will be on time. By God.",
        "I have completed thy questionnaire. I marked Yes to children. I marked Yes to dogs. I marked Yes to the question that asked if I had killed a man, for I have, in righteous battle. I do not believe Cupid intends it that way. I will withdraw the Yes if it offends.",
        "Forgive my late reply. The Speaking Glass demanded a number from a small picture and I do not possess one. I have asked the page at the desk. He laughed. I do not yet know why.",
      ],
      warming: [
        "M'Lady, thou hast named the place plainly and named the hour. I have marked thy hour upon my forearm in ink. I will be there.",
        "Thy laughter is not mockery. I have taken note. Constance also has taken note, in spirit, from the stable.",
        "I asked the Saints for a sign and the Saints sent a calendar invitation. I am moved.",
        "Thou hast spoken to the page at the desk on my behalf. This is a Favor. I will repay it.",
      ],
      cooling: [
        "M'Lady. The bit thou speakest of, I do not yet understand. I am willing to be taught. I will not laugh on credit.",
        "I am uncertain whether thou jestest or speakest plain. I will assume plain. Forgive me if I am slow.",
        "Pray, lower the Speaking Glass. I am told it is filming. I have not consented to be inscribed.",
        "Thou hast spoken of romance as a transaction. I am, by Honor, a transactional man, but the words sit ill.",
      ],
      crashingOut: [
        "M'Lady, I am bound by oath and I cannot remain at this table while my Saints are mocked. By the wreath, I take my leave.",
        "Constance is not a costume. The armor is not a costume. I will withdraw before I dishonor either of us.",
        "If thou recordest me without consent I shall depart and lodge a complaint with whichever Court is concerned. Forgive my heat.",
      ],
    },
  },
  state: {
    mood: 62,
    openness: 73,
    burnout: 28,
    retention: 100,
    currentRequestId: "request-aldric-honest-bargain",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/aldric-vale-marsh/portrait.png",
        cutoutPath: "/assets/portraits/aldric-vale-marsh/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/aldric-vale-marsh/avatar.png",
        cutoutPath: "/assets/portraits/aldric-vale-marsh/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/aldric-vale-marsh/portrait-flirty.png",
        cutoutPath: "/assets/portraits/aldric-vale-marsh/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/aldric-vale-marsh/portrait-confused.png",
        cutoutPath: "/assets/portraits/aldric-vale-marsh/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/aldric-vale-marsh/portrait-angry.png",
        cutoutPath: "/assets/portraits/aldric-vale-marsh/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 160,
      stops: ["#7f1d1d", "#dc2626"],
    },
    textColor: "light",
    shape: "sharp",
    tail: "sharp",
    border: "filigree",
    texture: "parchment",
    entryAnimation: "unfurl",
    fontFamily: "antique",
    textEffect: "tight",
  },
};
