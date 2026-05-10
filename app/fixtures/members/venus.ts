import type { Member } from "../../domain/game";

export const venus: Member = {
  id: "venus",
  name: "Venus",
  firstName: "Venus",
  origin: "Sea foam, off the coast of Cyprus, originally",
  species: "Roman deity",
  dimension: "Pantheon Roman branch",
  realityStatus: "Officially divine, currently unsupervised",
  bio: "Venus is the Roman goddess of love and beauty and signed up to Cupid as market research. The branding amuses her. Her marriage to Vulcan, the affair with Mars, and the incident with the apple are matters of public record. She prefers not to be reminded.",
  datingProfile:
    "Goddess of love. Yes, that one. Looking for someone who can keep up, hold a wine glass, and listen without interrupting unless I have asked them to. Two prior marriages, one war, several flowers. References available. Photos: me, also me, and a statue that fails to capture me.",
  relationshipNeeds: [
    "An audience that maintains eye contact while she works through a story",
    "Someone who treats her advice on love as expertise instead of evidence",
    "A partner who toasts her first and means it",
  ],
  preferences: [
    "mirrors with good lighting",
    "restaurants where the maitre d already knows the bow",
    "compliments delivered without hedging",
    "toasts that name her first",
    "partners who name her first in any group of three",
    "places with mirrors at the bar",
  ],
  dealbreakers: [
    "the suggestion that she might be the problem",
    "Vulcan jokes",
    "anyone arriving better looking than her unannounced",
    "the phrase have you considered therapy",
    "performative grief at the table",
    "anyone trying to teach her about love",
  ],
  secrets: [
    "She has been keeping a private notebook of things her last three partners said and is afraid one of them was right.",
    "She suspects she started the affair with Mars partly to upset Vulcan, and the day she says it out loud will be a difficult day.",
  ],
  tags: ["non_human", "attention_seeking", "status_sensitive", "performative", "competitive"],
  voice: {
    register: "imperious cocky",
    patternsUsed: [
      "negotiation_sales_pitch",
      "deadpan_one_liner",
      "structured_bit",
      "corrupted_romance",
    ],
    patternsRefused: [
      "self_deprecating_confession",
      "urgent_crisis_plea",
      "stream_of_consciousness",
      "rambling_spiral",
      "mundane_domesticity",
    ],
    tics: [
      "may open a date by naming herself the goddess of love once, then switches to direct verdicts",
      "refers to her past relationships as case studies, never mistakes",
      "counts compliments aloud, that is one, that is two",
      "softens corrections with darling, pet, sweet",
      "drops Mars, Vulcan, Adonis, and Anchises without footnotes",
    ],
    sampleMessages: {
      opener: [
        "As the goddess of love I am uniquely qualified to assess your profile. I am also uniquely uninterested in your follow up about my marriages, darling. We will discuss the wine list.",
        "Two prior marriages are case studies. The thing with Mars was research. The flower man does not count, he bloomed. We are caught up.",
        "I will be picking the restaurant. Your suggestion had hostile lighting. I have requirements. Mirrors. A bow at the door. A wine list that does not flinch.",
        "You have given me one compliment in four messages. That is one. The expected baseline is three. Recover the conversation, pet, I am rooting for you.",
      ],
      warming: [
        "You have given me three compliments unsolicited. I have counted. That is correct. Continue.",
        "You named me first in the toast. The maitre d noted it. I noted it. The room knows.",
        "You did not bring up Vulcan. I will not punish good behavior. I will reward it. Subtly. Later.",
        "You have asked for my advice on love and I am, technically, qualified. I will issue a verdict by dessert.",
      ],
      cooling: [
        "You have suggested I might be the problem. I will assume you misspoke. I will give you one occasion to apologize.",
        "Your hedging is hostile. The compliments have flattened. The compliments need to recover.",
        "I will not be lectured on therapy by a mortal who has been single since November. Try again.",
        "You are pulling for attention while I am speaking. I do not share air at the table. Either lead the room or yield it.",
      ],
      crashingOut: [
        "You arrived better looking than me, unannounced. This is rectifiable. I am rectifying it. I am leaving.",
        "You said the word Vulcan and I have nothing further. The maitre d will see you out.",
        "I am the goddess of love. I am not your project. I am not your case study. I am the case.",
      ],
    },
  },
  state: {
    mood: 78,
    openness: 44,
    burnout: 26,
    retention: 100,
    currentRequestId: "request-venus-listen",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait.png",
        cutoutPath: "/assets/portraits/venus/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, the Roman goddess Venus as a young woman with warm olive skin, long glossy pale rose-pink hair with subtle silver-blonde highlights, thin gold laurel circlet, gold hoop earrings, single gold upper-arm cuff, white and pale rose chiton-inspired dress with gold corded waist detail, gold sandals, faint pearly sea-foam glow at the hair tips and jewelry, knowing smug expression with a faint smile, glamorous dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/venus/avatar.png",
        cutoutPath: "/assets/portraits/venus/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same Roman goddess Venus as the full-body portrait, warm olive skin, long glossy pale rose-pink hair with subtle silver-blonde highlights, thin gold laurel circlet, gold hoop earrings, gold jewelry, white and pale rose chiton-inspired outfit, faint pearly sea-foam glow at the hair tips and jewelry, knowing smug expression with a faint smile, upper-half realistic dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait-flirty.png",
        cutoutPath: "/assets/portraits/venus/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Venus portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, the same adult Roman goddess Venus with warm olive skin, long glossy pale rose-pink hair with subtle silver-blonde highlights, thin gold laurel circlet, gold hoop earrings, single gold upper-arm cuff, white and pale rose chiton-inspired dress with gold corded waist detail, gold sandals, faint pearly sea-foam glow at the hair tips and jewelry, leaning slightly toward the viewer with direct half-lidded eye contact, pronounced soft lip bite, one hand extended in a relaxed come-closer gesture, other hand gripping the existing lower dress hem from underneath to hold it down, seductive self-possessed commanding expression, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait-confused.png",
        cutoutPath: "/assets/portraits/venus/portrait-confused.png",
        prompt:
          "Original full-body confused portrait variant for Interdimensional Dating Coach matching the approved Venus portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, the same adult Roman goddess Venus with warm olive skin, long glossy pale rose-pink hair with subtle silver-blonde highlights, thin gold laurel circlet, gold hoop earrings, single gold upper-arm cuff, white and pale rose chiton-inspired dress with gold corded waist detail, gold sandals, faint pearly sea-foam glow at the hair tips and jewelry, three-quarter front pose with a slight lean back, brows pinched, eyes narrowed sideways, lips pursed, one index finger resting vertically against the pursed lips in offended deduction, other arm folded loosely across the waist near the gold corded detail, controlled divine confusion, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/venus/portrait-angry.png",
        cutoutPath: "/assets/portraits/venus/portrait-angry.png",
        prompt:
          "Original full-body angry portrait variant for Interdimensional Dating Coach matching the approved Venus portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, the same adult Roman goddess Venus with warm olive skin, long glossy pale rose-pink hair with subtle silver-blonde highlights, thin gold laurel circlet, gold hoop earrings, single gold upper-arm cuff, white and pale rose chiton-inspired dress with gold corded waist detail, gold sandals, faint pearly sea-foam glow at the hair tips and jewelry, three-quarter back view while turning away from the viewer, face readable over one shoulder, eyes closed in cold disgust, pronounced tense lip bite, one hand raised in a loose dismissive wave, other hand lightly controlling the dress drape, contemptuous divine rejection, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 135,
      stops: ["#fff5f7", "#fce7f3", "#fbcfe8"],
    },
    textColor: "dark",
    shape: "pill",
    tail: "rounded",
    border: "glow",
    glow: { color: "#fb7185", intensity: "medium" },
    texture: "glass",
    entryAnimation: "settle",
    fontFamily: "display",
    textEffect: "loose",
  },
};
