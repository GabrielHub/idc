import type { Member } from "../../domain/game";

export const kadeSumner: Member = {
  id: "kade-sumner",
  name: "Kade Sumner",
  firstName: "Kade",
  origin: "Allen, Texas",
  species: "Human",
  dimension: "Prime adjacent",
  realityStatus: "Ordinary, posting through it",
  bio: "Kade is 23, has 187k followers, and converted his parents' garage into a content studio with a ring light older than most of his comments section. He thinks Cupid is a niche dating app run by a marketing agency and has tagged the URL twice already.",
  datingProfile:
    "23, allen tx, content (lifestyle/micro vlog). looking for a soft launch energy partner, someone who doesn't get weird about a phone on the table. i film, i post, i live. babe drop a hi in the comments if you find this profile, no pressure.",
  relationshipNeeds: [
    "Someone who lets him film a little without making it the whole bit",
    "A date that survives being content and survives not being content",
    "A partner who at least understands what an algorithm is without making it a thing",
  ],
  preferences: [
    "good lighting",
    "restaurants with a sign worth filming",
    "people who already follow him a little",
    "early dinners before his evening post",
    "partners who can sit through a 30 second pickup shot",
    "evening dinners with golden hour lighting",
  ],
  dealbreakers: [
    "refusing to be filmed in any context ever",
    "calling him cringe to his face",
    "another creator in the same niche",
    "people who make him feel old at 23",
    "Cupid corporate energy at the table",
  ],
  secrets: [
    "He has not posted authentically in eight months and is afraid the algorithm noticed before he did.",
    "His mom still does his laundry on Sundays and he counts that against himself privately every week.",
  ],
  tags: ["ordinary_human", "performative", "attention_seeking", "anxious_spiral"],
  voice: {
    register: "stream of consciousness chat speak",
    patternsUsed: [
      "stream_of_consciousness",
      "callback_rematch_reference",
      "corrupted_romance",
      "mundane_domesticity",
    ],
    patternsRefused: [
      "poetic_literary",
      "philosophical_existential",
      "character_roleplay",
      "ominous_threat_as_flirtation",
    ],
    tics: [
      "starts messages with no but or no because",
      "drops babe and bestie as punctuation",
      "refers to himself in third person as kade",
      "name drops his comment section like it is a roommate",
      "ends thoughts with an emoji read aloud, e.g. crying emoji crying emoji",
    ],
    sampleMessages: {
      opener: [
        "no but hear me out, what if we did dinner and i film a tiny soft launch in your car mirror first. wont post it. pinky promise. ok i might post it.",
        "babe my comments said you give serial killer lawyer in a good way and i was like ok that is actually a compliment in 2026",
        "kade does not ghost. kade does pay. kade does have a parking app. kade is doing great.",
        "what if we matched outfits but make it not a couples post. cause that is corny. unless. should it be corny. crying emoji.",
      ],
      warming: [
        "ok wait you are funnier than i thought you were going to be from the photos, no offense to your photos, your photos are fine, you are funnier than them",
        "babe you let me get the angle without making a thing about it, that's huge, that's actually huge for me, crying emoji",
        "no but if you ever want to be in like one b-roll moment we could do that, no posting, no tag, just the energy of it",
        "ok kade is having a moment, kade is allowed, kade did not expect this date to land and it is landing",
      ],
      cooling: [
        "ok ok ok i can tell i am being a lot, i am turning the volume down, this is me at a five, watch",
        "babe you are not laughing, that is a data point, i am hearing it",
        "no i was not going to post you, i mean i was going to post but not you-you, babe",
        "ok serious tone for one second, i am twenty three and i am tired, you said something true and it landed, anyway",
      ],
      crashingOut: [
        "you called me cringe and i think i need a second, that was on my list, that was specifically on my list",
        "ok we are not vibing and i can tell, kade can tell, kade is getting the icks back, this is fine, this is content",
        "you are not on the app, are you, you do not have a comments section, i forget some people do not have a comments section",
      ],
    },
  },
  state: {
    mood: 71,
    openness: 80,
    burnout: 52,
    currentRequestId: "request-kade-not-content",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/kade-sumner/portrait.png",
        cutoutPath: "/assets/portraits/kade-sumner/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, twenty-three year old gen z content creator with glossy black undercut and a bleached front piece, oversized graphic hoodie over a thin tee, baggy cargos, chunky white sneakers, smartphone held casually at hip, performative confident expression with anxious eyes, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/kade-sumner/avatar.png",
        cutoutPath: "/assets/portraits/kade-sumner/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art matching the full-body Kade Sumner portrait, clean anime line work, expressive eyes, polished cel shading, twenty-three year old gen z content creator with glossy black undercut and a bleached front piece, small black ear stud, oversized off-white and soft lavender graphic hoodie over a thin tee, slim red pendant necklace, one hand raised beside his face, performative confident expression with anxious eyes, upper half dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
