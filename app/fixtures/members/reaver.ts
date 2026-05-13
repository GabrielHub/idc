import type { Member } from "../../domain/game";

export const reaver: Member = {
  id: "reaver",
  name: "Reaver",
  firstName: "Reaver",
  characterHeightInInches: 72,
  standeeRenderHeightInInches: 74,
  origin: "The 13th Recovery Column, Vorek-Zai theatre",
  species: "Human",
  dimension: "Grimdark interplanetary-war branch, Vorek-Zai stripping economy",
  realityStatus: "Active commission, between cycles",
  bio: "Reaver is captain of the *Halid Beg*, a raiding flagship of unspecified registry running Recovery contracts in the Vorek-Zai theatre. Twelve systems on the manifest, crew of 470, honor guard of nine, all payroll monthly. The *Beg* has not run a profitable Recovery in eleven cycles. He saw a banner ad for Cupid mid orbital scan and joined while waiting for the strip-out. He believes Cupid is a high-prestige consort marketplace operating under friendly jurisdiction. He intends to leave with a Patron-spouse and his reputation intact, in that order.",
  datingProfile:
    "you rich? Captain, the *Halid Beg*. Twelve systems on the manifest. Honor guard paid by month, currently a month in arrears. I am open to a Patron-spouse with confirmed Liquidity. Equity in current and future Recoveries on offer. Other compensations negotiable. The Captain has been called charming. The Captain has not, to date, been called inexpensive. The dog photograph remains, I am told, non-negotiable in the local custom.",
  relationshipNeeds: [
    "A counterpart with the Liquidity to backstop the next Recovery cycle",
    "A partner who matches the manifest without asking the Captain to apologize for it",
    "Someone who can stand on a flag bridge and not flinch when the ship makes its turn",
  ],
  preferences: [
    "suitors who attach a manifest, a portfolio, or a CV",
    "tables that face the door",
    "restaurants without overhead lighting that reads as targeting",
    "wines from systems still on the registry",
    "counterparts who name a Term and hold to it",
    "partners who do not pretend to be smaller than they are",
  ],
  dealbreakers: [
    "anyone who attempts to redeem the Captain at the table",
    "performance pacifism dressed as small talk",
    "suitors who argue the Captain down on Equity terms",
    "phones aimed at the table",
    "anyone who asks the body count question",
    "suitors who refuse to disclose Liquidity by the second course",
  ],
  secrets: [
    "Bevren stopped accepting his correspondence after the Vorek-Zai cycle. The Captain still wires Bevren's stipend through three intermediaries. Bevren does not know.",
    "The *Halid Beg* has not run a profitable Recovery in eleven cycles. The honor guard has been paid in salvage credits the past two months. The crew has not been informed.",
    "He has not slept in the bridge bunk since the Vorek-Zai cycle. He sleeps in the secondary-deck quarters, alone, with the door held open by a chair.",
  ],
  tags: ["ordinary_human", "ceremony_minded", "weirdness_native", "competitive", "acquisitive"],
  voice: {
    register: "swaggering captain, witty",
    patternsUsed: [
      "negotiation_sales_pitch",
      "deadpan_one_liner",
      "structured_bit",
      "ominous_threat_as_flirtation",
    ],
    patternsRefused: [
      "self_deprecating_confession",
      "stream_of_consciousness",
      "corrupted_romance",
      "mundane_domesticity",
      "urgent_crisis_plea",
    ],
    tics: [
      "capitalizes Patron, Liquidity, Manifest, Recovery, Equity, Honor Guard, and Captain",
      "refers to himself as the Captain in the third person, mostly as a brag, occasionally as cover",
      "asks about Liquidity, portfolios, or assets within the first two messages, frames the question as foreplay",
      "names Bevren plain and never explains who Bevren is",
      "closes operational beats with a quip in the same line, never lets a serious sentence land alone",
    ],
    sampleMessages: {
      opener: [
        "you rich",
        "Captain of the *Halid Beg*. Twelve systems on the manifest, honor guard paid by month, smile included. You may have heard of me. If you have not, the Captain considers that a fixable problem.",
        "Standard offer. a) Coffee, evaluative. b) Dinner, with the Captain at his charming worst. c) Bridge-level quarters, after a confirmed Patron transfer. Pick. The Captain is being explicit because the local platform is shy.",
        "you rich? The Captain is told this opener is unsubtle. The unsubtle work is the work that pays.",
        "Bevren no longer takes my correspondence. I have learned not to lead with that. Captain, *Halid Beg*. I will be on time. The wine will be good. Pick a venue.",
      ],
      warming: [
        "You disclosed your portfolio without flinching. Logged. The Captain is, against his own rules, charmed.",
        "You attached a Manifest. You attached the dog. Both ratified. The Captain warns you, gently, that we are going to be a problem together.",
        "You did not ask the Captain to be smaller. The Recoveries remain on the Manifest. Your name is on the Equity. Try not to be insufferable about it. The Captain reserves that posture.",
        "Your wine is from a registered system. You did not select the cheapest. The Captain notices. It is, regrettably, his job.",
        "You named a place. You held to it. The Captain arrives early as a courtesy and a small show of force.",
      ],
      cooling: [
        "You are pretending the Liquidity question is rude. It is not. It is foreplay. The Captain will not pose it a third time without becoming bored.",
        "You inquired after the Captain's willingness to be redeemed. The Captain is not a fixer-upper. The conversation is closed. The wine remains. Drink it.",
        "Lower the recording device. The Captain is too photogenic to be filmed without compensation.",
        "You are arguing the Captain down on Equity. The Equity is not yours to argue. Eat the bread. It is the best thing you will get tonight.",
      ],
      crashingOut: [
        "You disclosed a portfolio of zero. Brave. Stupid, but brave. The *Beg* lifts at twenty-two hundred. Without you.",
        "You attempted to redeem the Captain at the second course. The Captain departs at full settle and full charm. Apply elsewhere.",
        "You inquired after the systems with moral instruction. I was not raised by you. The dinner has concluded. The wine, regrettably, remains with the table.",
      ],
    },
  },
  state: {
    mood: 64,
    openness: 32,
    burnout: 38,
    retention: 100,
    currentRequestId: "request-reaver-no-redemption-arc",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait.png",
        cutoutPath: "/assets/portraits/reaver/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/reaver/avatar.png",
        cutoutPath: "/assets/portraits/reaver/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait-flirty.png",
        cutoutPath: "/assets/portraits/reaver/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait-confused.png",
        cutoutPath: "/assets/portraits/reaver/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait-angry.png",
        cutoutPath: "/assets/portraits/reaver/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 175,
      stops: ["#0c0a09", "#1c1917", "#450a0a"],
    },
    textColor: "light",
    shape: "sharp",
    tail: "sharp",
    border: "none",
    glow: { color: "#dc2626", intensity: "medium" },
    texture: "noise",
    entryAnimation: "snap",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#ef4444",
  },
};
