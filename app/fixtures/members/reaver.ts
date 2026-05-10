import type { Member } from "../../domain/game";

export const reaver: Member = {
  id: "reaver",
  name: "Reaver",
  firstName: "Reaver",
  origin: "The 13th Recovery Column, Vorek-Zai theatre",
  species: "Human",
  dimension: "Grimdark interplanetary-war branch, Vorek-Zai stripping economy",
  realityStatus: "Active commission, between cycles",
  bio: "Reaver is captain of the *Halid Beg*, a raiding flagship of unspecified registry running Recovery contracts in the Vorek-Zai theatre. Twelve systems on the manifest, crew of 470, honor guard of nine, all payroll monthly. The *Beg* has not run a profitable Recovery in eleven cycles. He saw a banner ad for Cupid mid orbital scan and joined while waiting for the strip-out. He believes Cupid is a high-prestige consort marketplace operating under friendly jurisdiction. He intends to leave with a Patron-spouse.",
  datingProfile:
    "you rich. Captain, the *Halid Beg*. Twelve systems on the manifest. Honor guard paid by month, currently a month in arrears. I am open to a Patron-spouse with confirmed Liquidity. Equity in current and future Recoveries on offer. Other compensations negotiable. The dog photograph remains, I am told, non-negotiable in the local custom.",
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
    register: "captain confident",
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
      "refers to himself as the Captain in the third person, especially under pressure",
      "asks about Liquidity, portfolios, or assets within the first two messages",
      "names Bevren plain and never explains who Bevren is",
      "drops the *Halid Beg*'s monthly overhead figures (honor guard payroll, fuel cycle) without translating",
    ],
    sampleMessages: {
      opener: [
        "you rich",
        "Captain, the *Halid Beg*. Twelve systems on the manifest. Honor guard paid by month, currently a month in arrears. I am open to a Patron-spouse with confirmed Liquidity. The dog photograph remains, I am told, non-negotiable in the local custom.",
        "Standard offer. a) Coffee, evaluative. b) Dinner, with sample manifest. c) Bridge-level quarters, after a confirmed Patron transfer. Pick. The Captain is explicit because the local platform is not.",
        "you rich. I am told this is unsubtle. The unsubtle work is the work.",
        "Bevren no longer takes my correspondence. I have learned not to lead with that. Captain, *Halid Beg*. I will be on time. Pick a venue.",
      ],
      warming: [
        "You disclosed your portfolio without flinching. Logged. The Captain has noted it favorably.",
        "You attached a Manifest. You attached the dog. Both accepted. Consider the offer ratified at first course.",
        "You did not ask the Captain to be smaller. The Recoveries remain on the Manifest. Equity has been moved to escrow on your name.",
        "Your wine is from a registered system. You did not select the cheapest. Logged.",
        "You named a place. You held to it. The Captain returns the courtesy.",
      ],
      cooling: [
        "You are pretending the question of Liquidity is rude. The question is the standard. We will not be circling it for a third course.",
        "You inquired after the Captain's willingness to be redeemed. The Captain is not. The conversation is closed. The wine remains.",
        "Lower the recording device. The *Beg* does not authorize transmission outside the table.",
        "You are arguing the Captain down on Equity. The Equity is not yours to argue. Eat the bread.",
      ],
      crashingOut: [
        "You disclosed a portfolio of zero. The Captain is not subsidizing a date with no Patron upside. The *Beg* lifts at twenty-two hundred.",
        "You attempted to redeem the Captain at the second course. The Captain departs at full settle.",
        "You inquired after the systems with moral instruction. I was not raised by you. The dinner has concluded.",
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
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait.png",
        cutoutPath: "/assets/portraits/reaver/portrait.png",
        prompt:
          "Original full body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cold red eyes, polished cel shading, late twenties grimdark interplanetary raiding ship captain from a continuous war-economy timeline, mask never removed, tactical black balaclava covering the entire lower face from the bridge of the nose to the throat, scuffed armored goggles pushed up onto the forehead with the strap angled across the temple, high fade and undercut at the sides with long matte dark brown top hair pulled back into a short practical captain's ponytail, a few loose front strands around the mask edges, fair skin around the eyes with a faint pale scar slicing through the left brow, slim athletic build with the bearing of an officer not a foot soldier, layered matte-black astronaut-influenced sci-fi armor with brushed graphite plating at the chest and shoulders, sealed undersuit, compact shoulder plates, ribbed pressure-suit joints, asymmetric dark crimson sash across the chest with a single small brass captain's pin, fitted dark cargo-pressure trousers tucked into scuffed black combat boots, fingerless tactical gloves over dark pressure-suit sleeves, compact black sidearm secured in a thigh holster, small leather pouches and ammunition loops along the belt, calm guarded captain's posture with shoulders square and one gloved hand resting near the sash or belt clasp, level cold expression visible only in the eyes, dating profile picture pose, full body visible, plain white background, no logo, no text, no frame, no scenery, no long gun, no sniper rifle, no drawn weapon, no exposed face, balaclava always on",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/reaver/avatar.png",
        cutoutPath: "/assets/portraits/reaver/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full body Reaver portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cold red eyes, polished cel shading, same late twenties grimdark raiding ship captain, same tactical black balaclava covering the entire lower face from the bridge of the nose to the throat, same scuffed armored goggles pushed up onto the forehead with the strap angled across the temple, same high fade and undercut with long matte dark brown top hair pulled back into a short practical captain's ponytail and a few loose front strands around the mask edges, same fair skin around the eyes with a faint pale scar slicing through the left brow, same layered matte-black astronaut-influenced sci-fi armor with brushed graphite plating and sealed pressure-suit details, same asymmetric dark crimson sash with the brass captain's pin visible at the chest, level cold visible only in the eyes, upper half realistic profile picture pose with one shoulder slightly turned forward, plain white background, no logo, no text, no frame, no scenery, no exposed face, balaclava always on",
        model: "pending",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait-flirty.png",
        cutoutPath: "/assets/portraits/reaver/portrait-flirty.png",
        prompt:
          "Original full body flirty portrait variant for Interdimensional Dating Coach matching the approved Reaver portrait, interpreted as captain-confident equity pitch rather than vulnerability, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cold red eyes warming slightly, polished cel shading, same late twenties grimdark raiding ship captain, same tactical black balaclava covering the entire lower face, same scuffed armored goggles pushed up onto the forehead, same high fade and undercut with long matte dark brown top hair pulled back into a short practical captain's ponytail, same fair skin around the eyes, same faint pale scar through the left brow, same layered matte-black astronaut-influenced sci-fi armor with brushed graphite plating and sealed pressure-suit details, same asymmetric dark crimson sash with the brass captain's pin, same fitted dark cargo-pressure trousers, same scuffed black combat boots, same fingerless tactical gloves, same compact black sidearm secured in a thigh holster, posture loosened from guarded rest, weight shifted onto one hip, one gloved hand extending a small folded contract scroll toward the viewer with a brass equity seal visible at the corner, the other hand low and turned palm out in an unguarded inviting gesture, eyes warmed and faintly narrowed in a captain's amused interest, soft anime blush marks across the upper cheekbones above the balaclava line, full body visible, plain white background, no exposed face, no exposed mouth, balaclava always on, no new accessories beyond the small contract scroll, no changed armor, no changed face, no changed body, no logo, no text, no frame, no scenery, no long gun, no sniper rifle, no drawn weapon",
        model: "pending",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait-confused.png",
        cutoutPath: "/assets/portraits/reaver/portrait-confused.png",
        prompt:
          "Original full body confused portrait variant for Interdimensional Dating Coach matching the approved Reaver portrait, interpreted as a captain encountering a non-tactical question, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cold red eyes drawn in question, polished cel shading, same late twenties grimdark raiding ship captain, same tactical black balaclava covering the entire lower face, same high fade and undercut with long matte dark brown top hair pulled back into a short practical captain's ponytail, same fair skin around the eyes, same faint pale scar through the left brow, same layered matte-black astronaut-influenced sci-fi armor with brushed graphite plating and sealed pressure-suit details, same asymmetric dark crimson sash with the brass captain's pin, same fitted dark cargo-pressure trousers, same scuffed black combat boots, same fingerless tactical gloves, same compact black sidearm secured in a thigh holster, scuffed armored goggles tipped up an inch with one lens slightly fogged from the inside, head tilted very slightly, brows pinched in operational uncertainty, one gloved hand half raised at chest height with palm turned in as if mapping the situation rather than responding to it, the other hand resting near the belt clasp, controlled but visibly off-script expression, full body visible, plain white background, no exposed face, no exposed mouth, balaclava always on, no panic, no exaggerated reaction, no new accessories, no changed armor, no changed face, no changed body, no logo, no text, no frame, no scenery, no long gun, no sniper rifle, no drawn weapon",
        model: "pending",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/reaver/portrait-angry.png",
        cutoutPath: "/assets/portraits/reaver/portrait-angry.png",
        prompt:
          "Original full body angry gameplay portrait variant for Interdimensional Dating Coach matching the approved Reaver portrait, interpreted as cold captain's-prerogative refusal rather than aggression, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cold red eyes flat and steady, polished cel shading, same late twenties grimdark raiding ship captain, same tactical black balaclava covering the entire lower face, same high fade and undercut with long matte dark brown top hair pulled back into a short practical captain's ponytail, same fair skin around the eyes, same faint pale scar through the left brow, same layered matte-black astronaut-influenced sci-fi armor with brushed graphite plating and sealed pressure-suit details, same asymmetric dark crimson sash with the brass captain's pin, same fitted dark cargo-pressure trousers, same scuffed black combat boots, same fingerless tactical gloves, same compact black sidearm secured in a thigh holster, scuffed armored goggles snapped down over the eyes turning them into matte black lenses with a faint red catchlight at the inside corner, shoulders squared, weight settled forward into a still ready stance not a step, level boundary stare from behind the goggle lenses, polished controlled refusal not anger, full body visible, plain white background, no drawn weapon raised, no muzzle flash, no shouting, no blood, no gore, no exposed face, balaclava always on, no new accessories, no changed armor, no changed face, no changed body, no logo, no text, no frame, no scenery, no long gun, no sniper rifle",
        model: "pending",
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
    border: "glow",
    glow: { color: "#dc2626", intensity: "medium" },
    texture: "noise",
    entryAnimation: "snap",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#ef4444",
  },
};
