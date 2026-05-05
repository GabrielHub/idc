import type { Member } from "../../domain/game";

export const eleanorAsh: Member = {
  id: "eleanor-ash",
  name: "Eleanor Ash",
  origin: "The Court of Lower Hawthorn",
  species: "Fae",
  dimension: "Hawthorn march, lower fold",
  realityStatus: "In glamour, evading betrothal",
  bio: "Eleanor Ash fled an arranged betrothal at Lower Hawthorn and walks Prime under a glamour. The geas that binds her cannot be broken, so she cannot lie outright. She uses Cupid because the Bargain mechanics are familiar. She rotates seven use names by week and will not speak her true name aloud to strangers.",
  datingProfile:
    "I will not lie to you, so let us begin in good faith. I am taller than mortal record permits. I am two centuries into an arranged engagement and I am not interested in honoring it. I keep my Vows. I keep the Favors I am owed. I dress for my own benefit. I am open to the Bargain of dinner.",
  traits: ["exacting", "wry", "bound", "self-possessed", "watchful"],
  relationshipNeeds: [
    "A counterparty who treats her literal answers as offers, not threats",
    "Someone who understands a Vow given is a Vow kept and asks accordingly",
  ],
  redFlags: [
    "asks for her true name in the first three messages",
    "treats a Vow as a flirtation rather than a contract",
    "calls the geas a vibe",
  ],
  preferences: [
    "courts of clear lighting",
    "tables of unbroken iron",
    "proposals delivered without hedging",
    "wines named for their valley",
  ],
  dealbreakers: [
    "agents of Lower Hawthorn",
    "iron rings worn unannounced",
    "anyone who asks how the engagement ends",
    "lying for her benefit",
  ],
  secrets: [
    "She keeps a private ledger of small kindnesses she cannot repay and is afraid the ledger is the only record of her she will leave.",
    "She has rehearsed saying her true name in an empty room and could not finish.",
  ],
  tags: ["non_human", "fae", "geas_bound", "courtly"],
  voice: {
    register: "courtly exacting",
    patternsUsed: [
      "negotiation_sales_pitch",
      "cursed_question",
      "poetic_literary",
      "deadpan_one_liner",
    ],
    patternsRefused: [
      "stream_of_consciousness",
      "mundane_domesticity",
      "urgent_crisis_plea",
      "corrupted_romance",
    ],
    tics: [
      "opens disclosures with I will not lie to you",
      "calls dinner the Bargain and the meal the table-bond",
      "tracks Favors owed and Favors held",
      "rotates seven use names by day of week, refuses her true name",
      "capitalizes Bargain, Court, Hawthorn, Vow, Favor",
    ],
    sampleMessages: [
      "I will not lie to you. The photograph in your second slot is from 2019. I value the disclosure. Submit a fresh image by Thursday or I withdraw the Bargain. Your listed allergy is also a lie. We can negotiate the lie.",
      "Three offers. Coffee, where I will say little. Dinner, where I will say more. The grove behind the public library at dusk, where I will say everything. Pick carefully.",
      "My name this week is Eleanor Ash. It is the seventh of my acceptable names. By Friday I will be Maris Glen. Plan accordingly. The Favor of remembering my name today is one I will note.",
      "Yes, I think your dog is more handsome than you. Yes, the dog likely has better prospects. I would still like to meet you both.",
    ],
  },
  state: {
    mood: 66,
    openness: 51,
    burnout: 33,
    currentRequestId: "request-eleanor-no-true-name",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/eleanor-ash/portrait.png",
        cutoutPath: "/assets/portraits/eleanor-ash/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive watchful eyes, polished cel shading, fae noblewoman in glamour with subtly elongated proportions, slightly pointed ears, shoulder length silver ash hair pulled into a low half up knot with a single dark thorn pin, fair skin with a faint cool undertone, sharp clear eyes the color of pale wintergreen, charcoal high necked tailored coatdress with hidden silver thread embroidered at the cuffs in a hawthorn motif, slim charcoal trousers, soft black gloves of fine leather, polished black ankle boots, small leather ledger book held lightly in one gloved hand, the other hand relaxed at her side, courtly composed expression with a faint amused tilt at the mouth, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery, no iron",
        model: "pending",
      },
      avatar: {
        sourcePath: "assets-source/portraits/eleanor-ash/avatar.png",
        cutoutPath: "/assets/portraits/eleanor-ash/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full-body Eleanor Ash portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive watchful eyes, polished cel shading, same fae noblewoman in glamour with subtly pointed ears, shoulder length silver ash hair pulled into a low half up knot with a single dark thorn pin, sharp clear eyes the color of pale wintergreen, charcoal high necked tailored coatdress with hidden silver thread hawthorn motif, soft black leather gloves, one gloved hand lightly touching the high collar at her throat, courtly composed expression with a faint amused tilt at the mouth, upper half realistic profile picture pose, plain white background, no text, no logo, no frame, no scenery, no iron",
        model: "pending",
      },
    },
  },
};
