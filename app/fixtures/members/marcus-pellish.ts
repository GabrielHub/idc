import type { Member } from "../../domain/game";

export const marcusPellish: Member = {
  id: "marcus-pellish",
  name: "Marcus Pellish",
  firstName: "Marcus",
  origin: "Mansfield, Ohio",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, divorced eight years",
  bio: "Marcus runs an HVAC route across north central Ohio and has three grown kids and a granddaughter on the way. He thinks Cupid is a normal dating app his daughter signed him up for over Easter. She did.",
  datingProfile:
    "hi, marcus. 52, divorced, three grown kids and one grandbaby on the way (her name is going to be Wren). i fix furnaces. i can do dinner Wednesday or Sunday. i drive a 2014 F-150 with a bench seat and a heated wheel. profile photo is my dog Buster, the second one is also my dog Buster, my daughter Tara picked them both.",
  relationshipNeeds: [
    "Someone who lets him be a fully formed adult instead of a project",
    "A date that does not require him to pretend he is younger than he is",
    "Someone who can name a time and a place and hold to it",
  ],
  preferences: [
    "early dinners",
    "places with a parking lot he can see his truck from",
    "diners",
    "people who let him pay or split, no math fight",
    "partners who say what they want",
    "phones in pockets at the table",
  ],
  dealbreakers: [
    "anyone unkind about his kids",
    "anyone unkind about a server",
    "ghosting after a date he showed up to",
    "babe used at him as a word",
    "performance bits during dinner",
    "being asked to swear anything",
  ],
  secrets: [
    "He has not told his kids he is dating again. He thinks they would be supportive and is afraid they would be supportive.",
    "He keeps his ex wife's birthday in his calendar without an alarm and has not been able to delete it.",
  ],
  tags: [
    "ordinary_human",
    "sincerity_seeking",
    "needs_low_pressure",
    "needs_clear_plan",
    "grief_sensitive",
  ],
  voice: {
    register: "warm steady",
    patternsUsed: ["mundane_domesticity", "self_deprecating_confession", "deadpan_one_liner"],
    patternsRefused: [
      "ominous_threat_as_flirtation",
      "corrupted_romance",
      "character_roleplay",
      "stream_of_consciousness",
      "poetic_literary",
    ],
    tics: [
      "begins messages with hi, marcus",
      "drops his kids' first names without explaining who they are",
      "names appliances by brand and how he fixed them",
      "calls women ma'am the first time and corrects himself",
      "lowercase i, periods at the end of messages",
    ],
    sampleMessages: {
      opener: [
        "hi, marcus. saw your profile, thought i would say hi. i did a Trane heat pump install in mansfield this morning and i am eating a very late lunch in the truck. how is your week going.",
        "Sunday works on my end. i can pick somewhere or you can pick somewhere, i do not have a strong preference, my daughter Tara says that is part of the problem. i drive a F-150, parking is not an issue.",
        "i was married twenty one years. i am not bringing that to dinner. just naming it because it shows up on my face when i am tired.",
        "Buster is doing fine, thanks for asking. he is eleven, he sleeps a lot, he has opinions about the mailman. i can send another picture if you would like.",
      ],
      warming: [
        "you picked a good place. parking is fine, the lighting is fine, the menu is fine. that is a high compliment from me.",
        "ma'am, sorry. i will stop with the ma'am. you said i could and i still did.",
        "this is the best date i have been on in some time. that is a low bar but you cleared it.",
        "i appreciate that you said a time, you said a place, and you showed up at it. that is most of the work.",
      ],
      cooling: [
        "i think i need a minute. let me chew.",
        "you are doing a lot. i am trying to keep up.",
        "no, i would not call my truck baby. that is a no on my end.",
        "let me come back to that. i had a brake job at 6 and the brain is not all the way on yet.",
      ],
      crashingOut: [
        "i think we are not on the same page. i am not going to film anything and i am not going to swear to anything.",
        "i was not unkind to the server and i would like that on the record. that is a hard line for me.",
        "i am going to be honest. that comment about my kids was not okay and i am not going to spend the rest of dinner pretending it was.",
      ],
    },
  },
  state: {
    mood: 60,
    openness: 65,
    burnout: 32,
    retention: 100,
    currentRequestId: "request-marcus-grown-adult",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/marcus-pellish/portrait.png",
        cutoutPath: "/assets/portraits/marcus-pellish/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, clean webtoon, manhwa, and manhua inspired character art, simplified polished webtoon face treatment, expressive warm eyes, smooth cel shaded facial planes, minimal skin texture, fifty two year old midwestern white guy with light outdoor tan, salt and pepper short cropped hair, neat trimmed beard going gray, sturdy practical middle-aged build, dark indigo casual chore jacket with no patches, cream henley shirt, dark straight leg jeans, brown leather belt, clean brown leather boots, one hand lightly adjusting the front edge of his jacket, the other hand relaxed and visible at his side, no hands in pockets, warm steady faint closed mouth smile, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery, no props",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/marcus-pellish/avatar.png",
        cutoutPath: "/assets/portraits/marcus-pellish/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full-body Marcus Pellish portrait, clean webtoon, manhwa, and manhua inspired character art, simplified polished webtoon face treatment, expressive warm eyes, smooth cel shaded facial planes, minimal skin texture, same fifty two year old midwestern guy with salt and pepper short cropped hair, neat trimmed beard going gray, dark indigo casual chore jacket with no patches, cream henley shirt, one visible hand lightly adjusting the open edge of his jacket near the chest, warm steady faint closed mouth smile, upper-half realistic dating profile pose, plain white background, no text, no logo, no frame, no scenery, no props",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/marcus-pellish/portrait-flirty.png",
        cutoutPath: "/assets/portraits/marcus-pellish/portrait-flirty.png",
        prompt:
          "Original full-body flirty portrait variant for Interdimensional Dating Coach matching the approved Marcus Pellish portrait, clean webtoon, manhwa, and manhua inspired character art, simplified polished webtoon face treatment, expressive warm eyes, smooth cel shaded facial planes, minimal skin texture, same fifty two year old midwestern white guy with light outdoor tan, salt and pepper short cropped hair, neat trimmed beard going gray, sturdy practical middle-aged build, dark indigo casual chore jacket with no patches, cream henley shirt, dark straight leg jeans, brown leather belt, clean brown leather boots, body angled in a gentle forward lean, one hand resting over his chest, other hand open in a modest invitation, warm sheepish smile, practical low pressure romantic interest, full body visible, plain white background, no text, no logo, no frame, no scenery, no props, no changed clothing, no changed face, no changed body",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/marcus-pellish/portrait-confused.png",
        cutoutPath: "/assets/portraits/marcus-pellish/portrait-confused.png",
        prompt:
          "Original full-body confused portrait variant for Interdimensional Dating Coach matching the approved Marcus Pellish portrait, clean webtoon, manhwa, and manhua inspired character art, simplified polished webtoon face treatment, expressive warm eyes, smooth cel shaded facial planes, minimal skin texture, same fifty two year old midwestern white guy with light outdoor tan, salt and pepper short cropped hair, neat trimmed beard going gray, sturdy practical middle-aged build, dark indigo casual chore jacket with no patches, cream henley shirt, dark straight leg jeans, brown leather belt, clean brown leather boots, head tilted with knitted brows, mouth slightly open as if trying to understand a plan that changed twice, one hand raised in a small questioning gesture, other hand lightly holding the jacket front, awkward concern rather than slapstick confusion, full body visible, plain white background, no text, no logo, no frame, no scenery, no props, no changed clothing, no changed face, no changed body",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/marcus-pellish/portrait-angry.png",
        cutoutPath: "/assets/portraits/marcus-pellish/portrait-angry.png",
        prompt:
          "Original full-body angry gameplay portrait variant for Interdimensional Dating Coach matching the approved Marcus Pellish portrait, interpreted as guarded adult boundary setting rather than theatrical rage, clean webtoon, manhwa, and manhua inspired character art, simplified polished webtoon face treatment, expressive warm eyes, smooth cel shaded facial planes, minimal skin texture, same fifty two year old midwestern white guy with light outdoor tan, salt and pepper short cropped hair, neat trimmed beard going gray, sturdy practical middle-aged build, dark indigo casual chore jacket with no patches, cream henley shirt, dark straight leg jeans, brown leather belt, clean brown leather boots, squared practical stance, one palm raised in a firm stop gesture, other hand clenched low at his side, narrowed eyes, furrowed brows, mouth set in a controlled line, protective boundary after a bad comment about his kids or a server, full body visible, plain white background, no text, no logo, no frame, no scenery, no props, no changed clothing, no changed face, no changed body",
        model: "image_gen built-in",
      },
    },
  },
};
