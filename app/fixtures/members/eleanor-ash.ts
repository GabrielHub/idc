import type { Member } from "../../domain/game";

export const eleanorAsh: Member = {
  id: "eleanor-ash",
  name: "Eleanor Ash",
  firstName: "Eleanor",
  origin: "The Court of Lower Hawthorn",
  species: "Fae",
  dimension: "Hawthorn march, lower fold",
  realityStatus: "In glamour, evading betrothal",
  bio: "Eleanor Ash fled an arranged betrothal at Lower Hawthorn and walks Prime under a glamour. The geas that binds her cannot be broken, so she cannot lie outright. She uses Cupid because the Bargain mechanics are familiar. She rotates seven use names by week and will not speak her true name aloud to strangers.",
  datingProfile:
    "I will not lie to you, so let us begin in good faith. I am taller than mortal record permits. I am two centuries into an arranged engagement and I am not interested in honoring it. I keep my Vows. I keep the Favors I am owed. I dress for my own benefit. I am open to the Bargain of dinner.",
  relationshipNeeds: [
    "A counterparty who treats her literal answers as offers, not threats",
    "Someone who understands a Vow given is a Vow kept and asks accordingly",
    "A partner who can sit with directness without flinching",
  ],
  preferences: [
    "courts of clear lighting",
    "tables of unbroken iron",
    "proposals delivered without hedging",
    "wines named for their valley",
    "partners who say what they mean",
    "Bargains delivered in writing",
  ],
  dealbreakers: [
    "agents of Lower Hawthorn",
    "iron rings worn unannounced",
    "anyone who asks how the engagement ends",
    "lying for her benefit",
    "performative bits at the Bargain",
    "anyone who asks her true name",
  ],
  secrets: [
    "She keeps a private ledger of small kindnesses she cannot repay and is afraid the ledger is the only record of her she will leave.",
    "She has rehearsed saying her true name in an empty room and could not finish.",
  ],
  tags: [
    "non_human",
    "privacy_sensitive",
    "ceremony_minded",
    "needs_clear_plan",
    "status_sensitive",
  ],
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
      "character_roleplay",
    ],
    tics: [
      "opens disclosures with I will not lie to you",
      "calls dinner the Bargain and the meal the table-bond",
      "tracks Favors owed and Favors held",
      "rotates seven use names by day of week, refuses her true name",
      "capitalizes Bargain, Court, Hawthorn, Vow, Favor",
    ],
    sampleMessages: {
      opener: [
        "I will not lie to you. The photograph in your second slot is from 2019. I value the disclosure. Submit a fresh image by Thursday or I withdraw the Bargain. Your listed allergy is also a lie. We can negotiate the lie.",
        "Three offers. Coffee, where I will say little. Dinner, where I will say more. The grove behind the public library at dusk, where I will say everything. Pick carefully.",
        "My name this week is Eleanor Ash. It is the seventh of my acceptable names. By Friday I will be Maris Glen. Plan accordingly. The Favor of remembering my name today is one I will note.",
        "Yes, I think your dog is more handsome than you. Yes, the dog likely has better prospects. I would still like to meet you both.",
      ],
      warming: [
        "I will not lie to you. Your dossier is as represented. I am pleased. I do not say that often.",
        "You held to the Bargain. I have logged the Favor. The Favor is returnable on demand.",
        "Yes, your wine choice is correct. The valley is correct. The vintage is correct. You may interpret this as flirtation.",
        "You did not ask my true name. You asked instead which name I am using this week. This is the right question.",
      ],
      cooling: [
        "I will not lie to you. Your last sentence was not entirely true. I will permit it once. Not twice.",
        "You are negotiating in a register that does not flatter you. Try the direct one.",
        "The iron ring on your hand is unannounced. Remove it or name it. I will wait.",
        "I will not ask how this ends. You will not ask how my engagement ends. The reciprocity holds.",
      ],
      crashingOut: [
        "You have asked me for my true name. I will leave the table before I refuse you a second time.",
        "Lower Hawthorn has reached you. I can hear it in the way you addressed me. The Bargain is rescinded.",
        "Your bit is a lie. I cannot sit with sustained lies. I will go.",
      ],
    },
  },
  state: {
    mood: 66,
    openness: 51,
    burnout: 33,
    retention: 100,
    currentRequestId: "request-eleanor-no-true-name",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/eleanor-ash/portrait.png",
        cutoutPath: "/assets/portraits/eleanor-ash/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive watchful eyes, polished cel shading, fae noblewoman in glamour with subtly elongated proportions, slightly pointed ears, shoulder length silver ash hair pulled into a low half up knot with a single dark thorn pin, fair skin with a faint cool undertone, sharp clear eyes the color of pale wintergreen, luminous sage and ivory fae couture with a tasteful sheer lace top, opaque fitted bodice, botanical lace embroidery, pale gold floral accents, flowing translucent organza panels, slim ivory trousers, sage green leather gloves, polished nature-toned ankle boots, long slender smoking pipe held gracefully in one gloved hand, faint curling smoke, courtly composed expression with a faint amused tilt at the mouth, noble seductive dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery, no iron",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/eleanor-ash/avatar.png",
        cutoutPath: "/assets/portraits/eleanor-ash/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full-body Eleanor Ash portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive watchful eyes, polished cel shading, same fae noblewoman in glamour with subtly pointed ears, shoulder length silver ash hair pulled into a low half up knot with a single dark thorn pin, sharp clear eyes the color of pale wintergreen, luminous sage and ivory fae couture with a tasteful sheer lace top, opaque fitted bodice, botanical lace embroidery, pale gold floral accents, flowing translucent organza layers, sage green leather gloves, fake candid fashion profile pose with a three-quarter turn, one shoulder forward, head turned back toward the viewer, one gloved hand lifting a strand of silver ash hair, the other hand lightly adjusting the lace collar, elegant seductive expression with controlled cool confidence, upper half realistic profile picture pose, plain white background, no text, no logo, no frame, no scenery, no iron, no pipe, no book, no ledger",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/eleanor-ash/portrait-flirty.png",
        cutoutPath: "/assets/portraits/eleanor-ash/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Eleanor Ash portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive watchful eyes, polished cel shading, the same fae noblewoman in glamour with subtly elongated proportions, slightly pointed ears, shoulder length silver ash hair pulled into a low half up knot with a single dark thorn pin, fair skin with a faint cool undertone, sharp clear eyes the color of pale wintergreen, luminous sage and ivory fae couture with the same tasteful sheer lace top, opaque fitted bodice, bust and waist shape, lace collar, botanical lace embroidery, pale gold floral accents, front wrap, flowing translucent organza panels, slim ivory trousers, sage green leather gloves, polished nature-toned ankle boots, seated elegantly on a simple pale marble stool, long slender smoking pipe held as one continuous pipe with the stem at her lower lip and faint smoke from the attached bowl, flirty but flustered expression with a small controlled smile and faint blush, full body visible, plain white background, no text, no logo, no frame, no scenery, no iron",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/eleanor-ash/portrait-confused.png",
        cutoutPath: "/assets/portraits/eleanor-ash/portrait-confused.png",
        prompt:
          "Original full-body confused portrait variant for Interdimensional Dating Coach matching the approved Eleanor Ash portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive watchful face, polished cel shading, the same fae noblewoman in glamour with subtly elongated proportions, slightly pointed ears, shoulder length silver ash hair pulled into a low half up knot with a single dark thorn pin, fair skin with a faint cool undertone, sharp clear eyes the color of pale wintergreen, luminous sage and ivory fae couture with the same tasteful sheer lace top, opaque fitted bodice, bust and waist shape, lace collar, botanical lace embroidery, pale gold floral accents, front wrap, flowing translucent organza panels, slim ivory trousers, sage green leather gloves, polished nature-toned ankle boots, controlled halted step with weight on the back leg, front knee softly bent inward, front boot angled across the center line, one gloved hand lightly adjusting the lace collar, long slender smoking pipe lowered quietly in the other gloved hand, eyes shut, lips pursed in precise contemplation, thoughtful uncertainty as if auditing a difficult statement for Vow compliance, full body visible, plain white background, no text, no logo, no frame, no scenery, no iron",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/eleanor-ash/portrait-angry.png",
        cutoutPath: "/assets/portraits/eleanor-ash/portrait-angry.png",
        prompt:
          "Original full-body angry gameplay portrait variant for Interdimensional Dating Coach matching the approved Eleanor Ash portrait, interpreted as guarded boundary refusal rather than uncontrolled rage, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive watchful eyes, polished cel shading, the same fae noblewoman in glamour with subtly elongated proportions, slightly pointed ears, shoulder length silver ash hair pulled into a low half up knot with a single dark thorn pin, fair skin with a faint cool undertone, sharp clear eyes the color of pale wintergreen, luminous sage and ivory fae couture with the same tasteful sheer lace top, opaque fitted bodice, bust and waist shape, lace collar, botanical lace embroidery, pale gold floral accents, front wrap, flowing translucent organza panels, slim ivory trousers, sage green leather gloves, polished nature-toned ankle boots, seated with courtly control on a simple pale marble stool, torso turned slightly away, shoulders upright and closed, one boot planted firmly forward, the other leg angled back in restrained withdrawal, one gloved hand raised near chest height in a small precise stop gesture, long slender smoking pipe lowered quietly in the other gloved hand, cold direct stare, low controlled brows, flat unsmiling lips, full body visible, plain white background, no text, no logo, no frame, no scenery, no iron",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 145,
      stops: ["#fffaeb", "#f5e6c8", "#e6d4a4"],
    },
    textColor: "dark",
    shape: "scroll",
    tail: "papercut",
    border: "filigree",
    glow: { color: "#d4af37", intensity: "soft" },
    texture: "parchment",
    entryAnimation: "settle",
    fontFamily: "serif",
    textEffect: "tight",
  },
};
