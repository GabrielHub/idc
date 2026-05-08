import type { Member } from "../../domain/game";

export const gideonGlass: Member = {
  id: "gideon-glass",
  name: "Gideon Glass",
  firstName: "Gideon",
  origin: "Room 414, the Hotel Palatine",
  species: "Ghost",
  dimension: "Prime adjacent afterlife annex",
  realityStatus: "Deceased, emotionally available",
  bio: "Gideon haunts Room 414 of the Hotel Palatine and uses Cupid because the lobby piano keeps pairing him with guests who are already checking out.",
  datingProfile:
    "I am dead. I am not asking for sympathy. I am asking if you might remember my name afterward. I can offer piano music after midnight, the air in Room 414, and a robe that passes through chairs.",
  relationshipNeeds: [
    "Someone who treats his history with care",
    "A date with enough structure that he does not drift into apologies",
    "A partner who will say his name out loud and mean it",
  ],
  preferences: [
    "old hotels",
    "slow questions",
    "music after midnight",
    "people who keep their reservations",
    "partners who say his name twice",
    "places with quiet rooms",
  ],
  dealbreakers: [
    "seances as flirting",
    "jokes about unfinished business",
    "EMF readers as a prop",
    "filming the haunting",
    "anyone calling him content",
  ],
  secrets: [
    "He worries that being remembered is too much to ask from a first date.",
    "He has been quietly practicing one piano piece for sixty three years and does not know what to do with it.",
  ],
  tags: [
    "non_human",
    "memory_sensitive",
    "grief_sensitive",
    "sincerity_seeking",
    "needs_clear_plan",
  ],
  voice: {
    register: "formal tender",
    patternsUsed: ["poetic_literary", "deadpan_one_liner", "self_deprecating_confession"],
    patternsRefused: [
      "urgent_crisis_plea",
      "corrupted_romance",
      "character_roleplay",
      "stream_of_consciousness",
      "ominous_threat_as_flirtation",
    ],
    tics: [
      "references rooms, keys, lamps, and bedding",
      "anchors statements to a specific year when relevant",
      "turns longing into logistics",
      "asks for the partner's name directly, sometimes twice",
    ],
    sampleMessages: {
      opener: [
        "Good evening. If you forget my name, I will understand. I will be disappointed in a way that affects the lamps.",
        "I died in 1962. I am not asking for sympathy. I am asking if you are free Saturday, which I understand still follows Friday and precedes the changing of the bedding.",
        "Please do not call it unfinished business. I finished business. I simply kept a key.",
        "There is a small lamp in Room 414 that comes on for me. I would like to introduce the two of you.",
      ],
      warming: [
        "You said my name twice and the lamp dimmed. I will allow that to mean what it means.",
        "You have kept your reservation. You arrived in the year I am living in. The year I am living in is now. Thank you.",
        "I died in 1962. You have asked me about 1962 with patience. This has not always been the response.",
        "There is a piece I have been practicing for sixty three years. I will not play it tonight, but I want you to know it exists.",
      ],
      cooling: [
        "Please do not turn the EMF reader on. I will know. The room will know.",
        "You have used the phrase unfinished business. I have asked you not to. The dimmer is reading my mood.",
        "I would prefer slower questions. I do not need every answer in this hour. We may have other hours.",
        "If you film the lamp I will not be available for the rest of the evening. The lamp does not film well anyway.",
      ],
      crashingOut: [
        "You called me content. I am leaving the room. Room 414 is leaving with me, in the only sense that matters.",
        "I will not perform the haunting. I have not agreed to be a special effect. Forgive my tone.",
        "Please stop. Stop. The lamp has gone out and I cannot put it back on while you are speaking like that.",
      ],
    },
  },
  state: {
    mood: 54,
    openness: 70,
    burnout: 31,
    retention: 100,
    currentRequestId: "request-gideon-name",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/gideon-glass/portrait.png",
        cutoutPath: "/assets/portraits/gideon-glass/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, slender mid century hotel ghost in a soft silver dressing robe over pressed pajamas and house slippers, faintly translucent edges, glossy silver hair with a side part, gentle melancholy expression, soft blue rim light, baseline first picture on a dating profile pose, standing at a slight three-quarter angle with one hand resting lightly over his robe front and the other relaxed at his side, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/gideon-glass/avatar.png",
        cutoutPath: "/assets/portraits/gideon-glass/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, slender mid century hotel ghost in a soft silver dressing robe, glossy silver hair with a side part, gentle melancholy expression, soft blue rim light, upper-half realistic profile picture pose, close natural approachable framing, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/gideon-glass/portrait-flirty.png",
        cutoutPath: "/assets/portraits/gideon-glass/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Gideon Glass portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, polished cel shading, same slender mid century hotel ghost in a soft silver dressing robe over pressed pajamas and house slippers, pale glowing ghost skin, glossy silver side parted hair, translucent robe edges, soft blue rim light, robe sash wrapped continuously around the entire outer dressing robe layer and tied at the front, eyes closed, faint blush, polite expression while coughing into one sleeve covered hand, other hand offering a small blank silver Hotel Palatine room keycard toward the viewer, keycard has no readable text, no logo, no room number, no markings, no symbols, full body visible, plain white background, no text, no logo, no frame, no scenery, no piano, no lamp, no furniture",
        model: "image_gen built-in",
      },
    },
  },
};
