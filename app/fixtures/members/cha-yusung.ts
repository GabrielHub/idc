import type { Member } from "../../domain/game";

export const chaYusung: Member = {
  id: "cha-yusung",
  name: "Cha Yusung",
  firstName: "Yusung",
  origin: "Seoul, post-Gate, year following the Second Gate",
  species: "Human",
  dimension: "Continuous Awakened branch, post-Gate Seoul lineage",
  realityStatus: "On Hunter's Guild leave, by his sister's filing",
  bio: "Cha Yusung is an S-rank Hunter with a necromancy specialty. He went through his first Gate at nineteen and is six years past it. His younger sister Hayoon made the Cupid profile while sitting next to him on the couch and added soft side twice. He has not removed the second one. He is on a leave he did not request.",
  datingProfile:
    "Cha Yusung. 25. Hunter, necromancer specialty. Hayoon set this up. She is in the next room. She is checking. She told me to say I am S-rank. There. She also wrote that I have a soft side. I have not removed it. I will pick the time. I will not pick the place. I will be on time.",
  relationshipNeeds: [
    "Someone weak enough to need protecting or strong enough to be recognized, nothing in between",
    "A partner who lets silence land without filling it",
    "A counterpart who reads short answers as answers, not withholding",
  ],
  preferences: [
    "venues with a clear exit",
    "tables that face the door",
    "low light",
    "scheduled hours, no improvisation",
    "partners who let silence sit",
    "places where staff do not narrate",
  ],
  dealbreakers: [
    "asking if his sister is okay in a tone that already knows",
    "performative interest in necromancy",
    "calling the shade a pet",
    "asking how many he has lost",
    "filming any part of the date",
    "treating his rank as a flex",
  ],
  secrets: [
    "He has not slept more than four consecutive hours since his second Gate and treats this as resolved.",
    "Hayoon is the only person he writes back to without thinking. He is afraid of what it would mean to add a second name to that list.",
  ],
  tags: ["ordinary_human", "reality_displaced", "weirdness_native", "avoidant", "grief_sensitive"],
  voice: {
    register: "muted level",
    patternsUsed: [
      "deadpan_one_liner",
      "negotiation_sales_pitch",
      "emotional_overshare",
      "self_deprecating_confession",
    ],
    patternsRefused: [
      "rambling_spiral",
      "stream_of_consciousness",
      "corrupted_romance",
      "character_roleplay",
      "urgent_crisis_plea",
      "unhinged_relationship_escalation",
      "ominous_threat_as_flirtation",
    ],
    tics: [
      "two and three word replies are normal, longer messages are accidental",
      "names breaches by class plainly (Class A, B-rank breach, S-tier hunt) without flexing",
      "refers to the dead as shades, never minions, never pets",
      "one short clean sentence about Hayoon per conversation, never elaborated (Hayoon is well.)",
      "asks no follow-up questions, listens by default",
    ],
    sampleMessages: {
      opener: [
        "Yusung. Hayoon wrote the profile. I am on time. I will not pick the place. Pick one.",
        "Hayoon told me to send the first message. So. Hi.",
        "I will be plain. I am here because Hayoon is. Make of that what you will.",
        "S-rank. Necromancer specialty. My sister put that in the profile. She is also next to me. She is reading this. Hi from Hayoon.",
      ],
      warming: [
        "You picked a place. You named the time. Thank you.",
        "You did not ask about the rank. That helped.",
        "Hayoon would like you. I am not going to tell her you exist.",
        "I felt that. Less than I should have. I am working on this.",
      ],
      cooling: [
        "I am quiet because the food is good. Not because I am leaving.",
        "Do not call the shade a pet. Once is fine. Twice is not.",
        "I am not going to talk about how many I have lost. Pick another question.",
        "You asked about Hayoon in a tone I do not like. Try again or change topics.",
      ],
      crashingOut: [
        "I am leaving. I will text Hayoon from the car.",
        "You filmed the table. I do not consent. I am out.",
        "I am calling Hayoon. The experiment is concluded.",
      ],
    },
  },
  state: {
    mood: 52,
    openness: 38,
    burnout: 64,
    retention: 100,
    currentRequestId: "request-cha-make-sister-stop",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cool eyes, polished cel shading, twenty five year old Korean S-rank Awakened Hunter from a continuous post-Gate Seoul timeline, necromancy specialty, fair complexion with a faint cool undertone, jet black layered medium length hair with a messy cliche manhua protagonist silhouette and one stray strand falling over the brow, sharp jaw, faint pale scar slicing through the left eyebrow, slim athletic build with long legs and the bearing of someone who has stopped reading a room and started checking it for exits, open modern dark tactical formal coat in matte black with high collar, torn shadow-like lower edges, subtle cyan steel edge highlights, one charcoal silver buckle at the chest, fitted plain white shirt underneath, fitted black trousers, polished black combat boots, layered belts and a short dark metal chain at the hip, restrained charcoal-blue spectral shoulder guard integrated into the coat, faint charcoal shadow markings tracing the visible hand and disappearing into the cuff, simple short dark necromantic dagger held low in a reverse grip with a straight narrow pale steel blade, his own shadow at his feet slightly off-cast and half a beat behind his pose, level muted expression with a closed mouth, no shade companion in this variant, relaxed dynamic dating profile pose with weight shifted onto one leg, torso subtly angled, long coat sweeping outward, full body visible, plain white background, no text, no logo, no frame, no scenery, no second figure, no glowing eyes, no purple, no violet, no blood, no gore",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/cha-yusung/avatar.png",
        cutoutPath: "/assets/portraits/cha-yusung/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full-body Cha Yusung portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cool eyes, polished cel shading, same twenty five year old Korean S-rank Awakened Hunter, jet black layered medium length hair with one stray strand falling over the brow, sharp jaw, faint pale scar through the left eyebrow, fair complexion with a faint cool undertone, modern dark tactical formal coat in matte black with high collar and charcoal silver buckle at the chest, slim black turtleneck under, faint charcoal shadow markings tracing the back of his right hand into the cuff, his own shadow at his shoulders slightly off-cast and half a beat behind his pose, level muted expression with a faint closed mouth, upper-half realistic profile picture pose, plain white background, no text, no logo, no frame, no scenery, no second figure, no purple, no violet, no glowing eyes",
        model: "pending",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait-flirty.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Cha Yusung portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cool eyes, polished cel shading, same twenty five year old Korean S-rank Awakened Hunter from a continuous post-Gate Seoul timeline, necromancy specialty, fair complexion with a faint cool undertone, jet black layered medium length hair with one stray strand falling over the brow, sharp jaw, faint pale scar through the left eyebrow, slim athletic build, modern dark tactical formal coat in matte black with high collar and a single charcoal silver buckle at the chest, slim black turtleneck under, fitted black trousers, polished black combat boots, faint charcoal shadow markings tracing the back of his right hand into the cuff, posture identical to the neutral with the same level closed mouth expression and only a faint warmth in the eyes, behind him a tall faceless humanoid charcoal-gray shade silhouette quietly peeking over his right shoulder with both hands raised in a small enthusiastic gesture as if rooting for him, no eyes on the shade, no facial features on the shade, no fangs, no teeth, no menacing details, soft pale spirit edge along the shade outline, his own shadow at his feet still slightly off-cast, the joke being that the shade is performing the interest he will not perform, full body visible, plain white background, no text, no logo, no frame, no scenery, no glowing eyes, no purple, no violet, no menacing aura, no changed clothing, no changed face, no changed body",
        model: "pending",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait-confused.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait-confused.png",
        prompt:
          "Original full-body confused portrait variant for Interdimensional Dating Coach matching the approved Cha Yusung portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cool eyes, polished cel shading, same twenty five year old Korean S-rank Awakened Hunter from a continuous post-Gate Seoul timeline, fair complexion with a faint cool undertone, jet black layered medium length hair with one stray strand falling over the brow, sharp jaw, faint pale scar through the left eyebrow, slim athletic build, modern dark tactical formal coat in matte black with high collar and charcoal silver buckle, slim black turtleneck under, fitted black trousers, polished black combat boots, faint charcoal shadow markings tracing the back of his right hand into the cuff, head tilted very slightly, eyes narrowed in calm professional uncertainty, brows barely furrowed, mouth held in a flat closed line, one hand raised in a small low pause gesture at hip height, no shade companion in this variant, his own shadow at his feet still slightly off-cast and half a beat behind his pose, full body visible, plain white background, no text, no logo, no frame, no scenery, no second figure, no exaggerated reaction, no panic, no purple, no violet, no changed clothing, no changed face, no changed body",
        model: "pending",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/cha-yusung/portrait-angry.png",
        cutoutPath: "/assets/portraits/cha-yusung/portrait-angry.png",
        prompt:
          "Original full-body angry gameplay portrait variant for Interdimensional Dating Coach matching the approved Cha Yusung portrait, interpreted as cold readiness rather than rage, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive cool eyes, polished cel shading, same twenty five year old Korean S-rank Awakened Hunter from a continuous post-Gate Seoul timeline, necromancy specialty, fair complexion with a faint cool undertone, jet black layered medium length hair with one stray strand falling over the brow, sharp jaw, faint pale scar through the left eyebrow, slim athletic build, modern dark tactical formal coat in matte black with high collar and a single charcoal silver buckle at the chest, slim black turtleneck under, fitted black trousers, polished black combat boots, faint charcoal shadow markings tracing the back of his right hand into the cuff and a touch darker now, calm centered stance with shoulders squared and one hand low at his side with relaxed fingers, level closed mouth and slightly narrowed eyes, behind and slightly above him a tall faceless humanoid charcoal-gray shade silhouette risen up taller than him with one long arm starting to extend forward over his shoulder, no eyes on the shade, no facial features on the shade, no teeth, no fangs, recognizable humanoid silhouette of a former enemy, soft pale spirit edge along the shade outline, atmosphere cold and measured rather than menacing, his own shadow at his feet darker than it should be, the threat being the shade and the calm together, full body visible, plain white background, no text, no logo, no frame, no scenery, no glowing eyes, no purple, no violet, no eye markings, no blood, no gore, no weapon, no changed clothing, no changed face, no changed body",
        model: "pending",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 165,
      stops: ["#0a0a0a", "#1e293b", "#334155"],
    },
    textColor: "light",
    shape: "sharp",
    tail: "sharp",
    border: "hairline",
    glow: { color: "#94a3b8", intensity: "soft" },
    texture: "noise",
    entryAnimation: "drift",
    fontFamily: "mono",
    textEffect: "tight",
    accentColor: "#94a3b8",
  },
};
