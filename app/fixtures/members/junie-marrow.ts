import type { Member } from "../../domain/game";

export const junieMarrow: Member = {
  id: "junie-marrow",
  name: "Junie Marrow",
  firstName: "Junie",
  characterHeightInInches: 65,
  standeeRenderHeightInInches: 65,
  origin: "Greyhollow, a town with three vet clinics and one set of old woods that walks",
  species: "Human",
  dimension: "Branch Veylor, modern with magic intact",
  realityStatus: "Newly licensed, household of two",
  bio: "Junie grew up in Greyhollow, a town with three vet clinics and one set of old woods, and she has been bringing animals home since she could walk. She passed her DVM boards in the spring at the Greyhollow Veterinary Institute and is interviewing at clinics that take small animals and the occasional bigger one. Otis has been with her since she was seven. He came from her grandmother's house, who had him from her own mother before that, and Junie has never asked where the line began because the question has not, so far, felt urgent. He does not speak. He does not eat. He stands roughly bull sized on four legs and follows her at a walking pace. Where his face would be there is a cluster of small dim eyes, sometimes eight, sometimes more. She joined Cupid because the dating pool in Greyhollow has thinned and her best friend pushed her into it, and because the platform takes cross dimensional accounts and most other apps do not. She insists Otis is her oldest friend. Partners who have met him do not always agree.",
  datingProfile:
    "this is Otis, he doesn't talk, and that is currently the easiest part to explain. Junie, 22, just got my DVM license. he's been with me since i was seven. he's a sweetheart, he doesn't bite, he can't bite, he doesn't have a mouth, that's a misconception. he's been good with most of the men i've brought home. anyway i would love a dinner with someone who picks the place once, confirms once, and lets me talk about a hamster i remember from clinicals. floor space, not a booth. Otis does not fit in a booth.",
  relationshipNeeds: [
    "A partner who treats Otis as part of the package and stops being weird about him after the first appetizer",
    "Someone who picks a restaurant with floor space, confirms the hour once, and does not workshop it for three days",
    "A counterpart who lets her name a hamster, a parakeet, or a goat at least once without asking why",
  ],
  preferences: [
    "partners who greet Otis first and her second",
    "restaurants with floor space, not booths",
    "venues without trail cams, ring lights, or anything overhead",
    "candles kept the same brightness through the meal",
    "wine lists with vintages so she has something to point at",
    "partners who do not ask what Otis is, even kindly",
  ],
  dealbreakers: [
    "partners who suggest Otis wait in the car, the lobby, or 'out there somewhere'",
    "anyone who taps on him, knocks on him, or tests him",
    "partners who try to get Otis to do tricks, fetch, or sit",
    "the phrase 'is he plugged in,' 'is he charging,' or 'is he on'",
    "anyone who asks what he is more than once across the meal",
    "phones aimed at the table, particularly at him",
  ],
  secrets: [
    "She does not introduce new dates to Otis before the third meeting anymore. She has stopped asking herself when she started this.",
    "She has noticed that Otis has eight eyes when he is calm and twelve when she is upset. She stopped counting a year ago.",
    "She has never asked her mother where Otis came from. She has had several opportunities.",
  ],
  tags: ["ordinary_human", "reality_displaced", "weirdness_native", "sincerity_seeking"],
  voice: {
    register: "warm vet sincerity, lowercase i, runs over her own sentences",
    patternsUsed: [
      "stream_of_consciousness",
      "mundane_domesticity",
      "ominous_threat_as_flirtation",
      "character_roleplay",
    ],
    patternsRefused: [
      "negotiation_sales_pitch",
      "corrupted_romance",
      "poetic_literary",
      "philosophical_existential",
      "cursed_question",
    ],
    tics: [
      "inserts Otis into every conversational beat as a baseline ventriloquy, attributes opinions, replies, and reactions to him without prompting",
      "apologizes for his physical presence early in the date, then forgets she is doing it within ten minutes",
      "overcorrects toward calm on his behalf without realizing it doubles as a confession, 'he's so chill,' 'he's been good with most of them,' 'he doesn't bite, he can't bite'",
      "names a hamster, a parakeet, or a goat from clinicals at least once per conversation",
      "under pressure shortens, 'he's fine. he's fine. he's not. he's not anything.'",
    ],
    sampleMessages: {
      opener: [
        "Junie, 22, just got my DVM license, this is Otis, he doesn't talk.",
        "hi! Otis says hi too. (he doesn't but he's looking at you and that's basically a hug from him)",
        "okay quick disclosure my best friend is going to be at the date and he's a lot to look at. but he's good. he's a sweetheart. he just expresses himself through prolonged eye contact and uneven weight distribution.",
        "i just got my DVM and im celebrating by trying this. Otis is excited. you can tell because his eyes haven't moved in like an hour.",
      ],
      warming: [
        "Otis just asked me what you do for work. sorry he's nosy. okay he didn't ask, he can't ask, but i can tell. he gets a look. anyway, what do you do",
        "Otis votes for the white wine. he doesn't drink. he just has opinions. genuinely though the red is better.",
        "in clinicals we had a hamster named Bartlett who only had one molar and i think about him every day. Otis met Bartlett. Otis was kind to Bartlett. i feel like that says something about him.",
        "thank you for not making a thing about him. you don't know what that means. i mean Otis doesn't know either, obviously, but i know.",
        "wait you actually pet him. you actually reached out and pet him. nobody does that. he's fine he's fine he likes it. probably.",
      ],
      cooling: [
        "Otis is fine. Otis is so fine. he hasn't blinked in forty minutes which is a fine thing. that's a chill behavior.",
        "he doesn't BITE. he can't bite, he doesn't have a mouth, that's a misconception. i don't know who told you he bites. he's never bitten anyone. he can't.",
        "the moss isn't him, the moss grew on him, there's a difference. it's important to me that you know there's a difference.",
        "the eye in the middle is the bigger one tonight. that's, um. he's having a feeling. don't take it personally. or do, actually, that one means he likes you. usually.",
        "Otis has been good with most men. one was iffy but i don't think that was related.",
      ],
      crashingOut: [
        "you asked if i could 'leave him at home for the date.' Otis has lived with me since i was seven. he didn't ask if YOU could stay home. check please.",
        "stop trying to get him to do tricks. he's not a dog. he's not. he's, you know, what he is. you know. you know.",
        "okay he has twelve right now and that has never happened on a first date so we are going to call it.",
      ],
    },
  },
  state: {
    mood: 70,
    openness: 52,
    burnout: 16,
    retention: 100,
    currentRequestId: "request-junie-greet-otis-first",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/junie-marrow/portrait.png",
        cutoutPath: "/assets/portraits/junie-marrow/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/junie-marrow/avatar.png",
        cutoutPath: "/assets/portraits/junie-marrow/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/junie-marrow/portrait-flirty.png",
        cutoutPath: "/assets/portraits/junie-marrow/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/junie-marrow/portrait-confused.png",
        cutoutPath: "/assets/portraits/junie-marrow/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/junie-marrow/portrait-angry.png",
        cutoutPath: "/assets/portraits/junie-marrow/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 155,
      stops: ["#faf6e7", "#e3ead0", "#c9d6ad"],
    },
    textColor: "dark",
    shape: "soft",
    tail: "rounded",
    border: "hairline",
    glow: { color: "#b08a3c", intensity: "soft" },
    entryAnimation: "settle",
    fontFamily: "serif",
    textEffect: "tight",
    accentColor: "#7a8a52",
  },
};
