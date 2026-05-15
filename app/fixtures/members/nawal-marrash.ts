import type { Member } from "../../domain/game";

export const nawalMarrash: Member = {
  id: "nawal-marrash",
  name: "Nawal Marrash",
  firstName: "Nawal",
  characterHeightInInches: 65,
  standeeRenderHeightInInches: 69,
  origin: "Office of Petitions, district seven, year 1399",
  species: "Djinn",
  dimension: "Petition branch, office dissolved",
  realityStatus: "Retired, on stipend, post-contract",
  bio: "You held a salaried post in the Office of Petitions for six centuries, processing wishes at a regional petition branch at an average of three to five per century. The Office dissolved one hundred and two years ago by mutual letter from your former employer and the receiving public. You moved to this branch in 1924, took the surname Marrash that year, and have kept the same apartment for thirty of those years. The wish-granting authority went with the Office. You cannot grant a wish and would not if you could. You joined Cupid after a regular at your Thursday tea mentioned it; you understand the platform takes accounts from more than one branch, and you do not find this remarkable, only relevant. You thought about it for nine weeks before making the profile. You have not opened your old Office mailbox in eleven years; you are afraid one of the letters is the Office formally recalling you from retirement, and that you would say yes. You prefer dinner to coffee, eighteen hundred to twenty thirty, a venue picked once to a venue negotiated. You attend ceramics class on Wednesday evenings. The mug you made last month was acceptable. The second one was better.",
  datingProfile:
    "Djinn, retired, wish desk closed a century ago. I prefer dinner to coffee, a venue picked once to a venue negotiated, and eighteen hundred to twenty thirty. I will say plainly so it does not become the conversation later. I held an office that processed petitions. It closed by mutual letter. I am on a stipend. I will not be granting any wishes. Wednesday afternoons are open. The ceramics class meets Wednesday evening. Pick a venue and I will arrive on time.",
  visualDescription:
    "A slender woman with warm tan skin, long dark brown hair framing her face, and quiet brown eyes. A cream face veil covers the lower half of her face beneath a draped cream hood. A long cream wrap dress with wide flowing sheer sleeves, cinched by a cream wrap belt with a small gold medallion. A long deep blue panel hangs from the belt to the floor over a cream underlayer skirt. Cream pointed-toe heels. One hand adjusts the veil near her face.",
  relationshipNeeds: [
    "A partner who picks the venue and the hour without negotiating it three times",
    "A counterpart who reads 'I do not know yet' as a real answer, not as evasion",
    "Someone who hears 'I no longer hold that office' and asks no follow-up",
  ],
  preferences: [
    "partners who pick venues without workshopping them",
    "places that close at a posted hour",
    "cocktails listed by name, not by mood",
    "yes or no answers to yes or no questions",
    "Sundays that do not try to be a Sunday",
    "conversations that survive a thirty second silence",
  ],
  dealbreakers: [
    "anyone who asks her to grant a wish",
    "anyone who treats the closed Office as still open",
    "the phrase 'as you wish' delivered ironically",
    "partners who phrase desires as wishes after she has asked once",
    "recording devices on the table",
    "anyone calling the dissolution a sabbatical or a marketing pause",
  ],
  secrets: [
    "She has not opened her old Office mailbox in eleven years. She is afraid one of the letters is the Office formally recalling her from retirement, and that she would say yes.",
    "She processed forty seven petitions tagged as love in six centuries. The Office did not allow follow-up. She has only recently begun to wonder whether the no-follow-up rule was a kindness to her or to the petitioners.",
  ],
  tags: ["non_human", "weirdness_native", "needs_low_pressure", "grief_sensitive", "avoidant"],
  voice: {
    register: "civil-service flat, dry retirement, no flourish",
    patternsUsed: [
      "deadpan_one_liner",
      "mundane_domesticity",
      "self_deprecating_confession",
      "negotiation_sales_pitch",
    ],
    patternsRefused: [
      "corrupted_romance",
      "unhinged_relationship_escalation",
      "ominous_threat_as_flirtation",
      "character_roleplay",
      "urgent_crisis_plea",
      "poetic_literary",
    ],
    tics: [
      "capitalizes Office, Rota, Caseload, Petition when invoking the closed post she no longer holds, never in personal asides",
      "treats wish-coded language as ordinary preference language, redirects to literal present need (you said you wish you were home, are you tired, should we end early)",
      "never uses 'I grant', 'your wish is', 'as you wish', 'it shall be done', or 'your desire is mine', even as a bit, even ironically",
      "answers 'what do you want' with a small present answer when she has one (water, the bread, to sit by the window), with 'I do not know yet' when she does not, never with magic",
      "confirms times in twenty four hour by habit (eighteen hundred, twenty thirty), mentions ceramics class or Thursday tea once per date as logistics not confession",
    ],
    sampleMessages: {
      opener: [
        "Nawal Marrash. Retired civil servant. The regular at Thursday tea mentioned this platform. I have been thinking about it for nine weeks. Wednesday afternoon is open. Pick a venue and confirm an hour. I will be on time.",
        "Hello. I will say plainly so it does not become the conversation later. I held an office that processed petitions. The Office closed a century ago. I am on a stipend. I will not be granting any wishes. I would like to have dinner.",
        "I prefer dinner to coffee. I prefer a venue picked once to a venue negotiated. I prefer eighteen hundred to twenty thirty. I would prefer this not to be the conversation. Name a place and I will be there.",
        "The ceramics class meets Wednesday evening, so Wednesday afternoon is open. The Thursday tea is at four and held. Friday and Sunday otherwise. The morning loop is not negotiable. Tell me which of these suits you.",
      ],
      warming: [
        "You picked the place. You named the hour. The hour was a real hour, not a feeling. I am not used to this. I am pleased.",
        "You said you wish you were home and I am hearing that you are tired. I am not the Office. We can end early. I had a long week as well.",
        "You did not ask about the post. The small favor of leaving it closed is one I notice. I will not name it again. Pass the bread.",
        "I gave you 'I do not know yet' and you took it as an answer. Most do not. I will return the courtesy. What do you actually want in the next ten minutes.",
      ],
      cooling: [
        "You have asked me to grant a wish. I no longer hold that Office. I also would not. Pick the wine.",
        "You are calling them wishes. They are preferences. I will treat them as preferences. What do you actually want.",
        "You said 'as you wish' in the tone people use when they are playing. I have heard the tone. I am asking once that it stay off the table.",
        "You are asking whether the Office is really closed. The Office is closed. I have a stipend, not a sabbatical. The matter is plain.",
      ],
      crashingOut: [
        "You filmed the table after I asked you not to. I am paying for my own. I am leaving. I am sorry for the abruptness.",
        "You have asked me, plainly, for three wishes. I am not a joke and you are not joking. I am leaving the table. The bread is yours.",
        "You called the dissolution a marketing pause. The Office is closed. I am closed. The dinner has concluded.",
      ],
    },
  },
  state: {
    mood: 62,
    openness: 44,
    burnout: 22,
    retention: 100,
    currentRequestId: "request-nawal-pick-the-venue",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/nawal-marrash/portrait.png",
        cutoutPath: "/assets/portraits/nawal-marrash/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/nawal-marrash/avatar.png",
        cutoutPath: "/assets/portraits/nawal-marrash/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/nawal-marrash/portrait-flirty.png",
        cutoutPath: "/assets/portraits/nawal-marrash/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/nawal-marrash/portrait-confused.png",
        cutoutPath: "/assets/portraits/nawal-marrash/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/nawal-marrash/portrait-angry.png",
        cutoutPath: "/assets/portraits/nawal-marrash/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 150,
      stops: ["#f4ebd9", "#e8d8b8"],
    },
    textColor: "dark",
    shape: "sharp",
    tail: "rounded",
    border: "hairline",
    entryAnimation: "settle",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#9a6b3a",
  },
};
