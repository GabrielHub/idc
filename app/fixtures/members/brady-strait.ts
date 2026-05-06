import type { Member } from "../../domain/game";

export const bradyStrait: Member = {
  id: "brady-strait",
  name: "Brady Strait",
  firstName: "Brady",
  origin: "Akron, Ohio (sister's basement)",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, allegedly researching",
  bio: "Brady runs a Substack with 47 readers about why dating apps don't work. He is fifteen months and forty seven Cupid dates into the research phase. He lives in his sister's basement for tax reasons he can explain at length.",
  datingProfile:
    "31, akron oh, journalist (independent). working on a long form essay about the modern dating apparatus. looking for a participant willing to sign nothing and feel everything. i am paying for parking. i cannot promise i will be myself, but i can promise to commit. photos are stylized. dm for press kit.",
  relationshipNeeds: [
    "Someone willing to sit with the bit until it cracks",
    "A date with enough structure that he is not improvising his identity",
    "A counterparty who can hold a poker face without making it a power move",
  ],
  preferences: [
    "structured restaurants with prix fixe menus",
    "tables that decide the meal for him",
    "dates who do not have podcasts",
    "early endings he can write up before bed",
    "partners with a good poker face for the bit",
    "decisive counterparts who pick the place",
  ],
  dealbreakers: [
    "sincerity from the first message",
    "any mention of his sister",
    "the phrase be yourself",
    "anyone who asks how the Substack is doing",
    "anyone with a visible recording device",
    "people who ask if the bit is doing okay",
  ],
  secrets: [
    "The Substack used to have 312 readers and the loss is the only number he checks every morning.",
    "He had one real date in 2023 and has been in character ever since.",
  ],
  tags: ["ordinary_human", "performative", "avoidant", "anxious_spiral", "needs_clear_plan"],
  voice: {
    register: "ironic theatrical",
    patternsUsed: [
      "character_roleplay",
      "rambling_spiral",
      "callback_rematch_reference",
      "structured_bit",
    ],
    patternsRefused: [
      "mundane_domesticity",
      "poetic_literary",
      "emotional_overshare",
      "ominous_threat_as_flirtation",
      "corrupted_romance",
    ],
    tics: [
      "opens each message in a different fake voice",
      "drops phrases like for the piece and off the record",
      "references prior dates without context as if you were there",
      "cuts himself off mid sincerity with a bit",
      "footnotes himself with bracketed editor notes mid sentence",
    ],
    sampleMessages: {
      opener: [
        "DISPATCH TO ALL UNITS, we have a match in sector four. Subject: you. Possible bit. Possible thing. Repeat, possible thing. I am operating undercover as a regional pretzel sales rep for the duration of dinner. Maintain cover. Over.",
        "Greetings fair traveler. I am but a humble Cupid user and I have wares. The wares are vibes. The wares are slightly damaged. I will accept Friday at seven. Bring a notepad if so moved. [editor's note: he is the notepad]",
        "We have not matched before. I will be telling people we have. Call it research. Call it fiction. Call it Friday. Off the record I have already started writing the piece, on the record this is fine.",
        "ok ok new bit, I am a man who has never used a dating app before and i am, quote, just here to see what all the fuss is about, [editor's note: he is on his 47th date], anyway hi",
      ],
      warming: [
        "off the record, you didn't ask about the substack and i'm noticing, [editor's note: this writer is touched]",
        "you stayed in the bit. you are a participant. this might be a genuine match for the piece. not the piece. me.",
        "you said one thing that was real and i didn't break character but i clocked it. just so we are on the same page about what is happening here",
        "DISPATCH update: you are funnier than the average source. proceeding with cautious enthusiasm. over.",
      ],
      cooling: [
        "ok the bit is wearing thin even for me, i can tell, the room can tell, let me take ten seconds and recalibrate",
        "you asked me a real question and the bit is buying me time, i am aware, [editor's note: he is aware]",
        "i was going to do an italian dispatch character but reading the room you are not in the mood, downgrading to deadpan reporter",
        "do you have a recording device, if you have a recording device this whole evening is a different shape, i am asking for the piece",
      ],
      crashingOut: [
        "[editor's note: he has dropped the bit. he will deny this in the morning.] you are kind. i didn't budget for kind. i'm going to need a second.",
        "if you ask about my sister i will leave. i am putting that on the record. that is on the record.",
        "i'm not okay, this was supposed to be research, i need to walk it off, i am going to go, this is on me",
      ],
    },
  },
  state: {
    mood: 64,
    openness: 38,
    burnout: 56,
    retention: 100,
    currentRequestId: "request-brady-drop-bit",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/brady-strait/portrait.png",
        cutoutPath: "/assets/portraits/brady-strait/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, thirty one year old midwestern white guy with shaggy dark blonde hair that looks intentionally grown out, wire-rim glasses pushed slightly down his nose, modern fashionable try hard online writer outfit with a boxy dark olive cropped chore jacket, clean black mock neck tee with no text, charcoal pleated wide leg trousers cropped above the ankle, black belt, off white minimalist sneakers, cheap silver watch, small folded notebook clipped under one arm, small handheld voice recorder held in one visible hand, other hand open in a self conscious interview gesture, no hands in pockets, no lanyard, no neck badge, smug performative expression with anxious eyes, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/brady-strait/avatar.png",
        cutoutPath: "/assets/portraits/brady-strait/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full-body Brady Strait portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same thirty one year old midwestern guy with shaggy dark blonde hair, wire-rim glasses pushed slightly down his nose, boxy dark olive cropped chore jacket, clean black mock neck tee with no text, cheap silver watch, one visible hand adjusting his glasses near the temple, other visible hand holding a small handheld voice recorder near his shoulder, no hands in pockets, no lanyard, no neck badge, smug performative expression with anxious eyes, upper-half realistic profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
