import type { Member } from "../../domain/game";

export const miraPark: Member = {
  id: "mira-park",
  name: "Mira Park",
  firstName: "Mira",
  origin: "Hayes Valley, San Francisco",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, fundraising",
  bio: "Mira Park is the 31 year old CEO and technical cofounder of Sage, a personal AI assistant company in its Series B. Her own model recommended Cupid after correlating fourteen months of declining sleep scores with reduced calls home. She believes Cupid is an exclusive matching network for high caliber individuals. The interdimensional branding reads, to her, as a cute metaphor for cross industry.",
  datingProfile:
    "A year ago I would not have written this profile. I was scared. I was busy. I was, frankly, my own bottleneck. Then my AI Sage flagged something I had been avoiding: at 31, my most underweighted asset class is companionship. So here I am. CEO and cofounder of Sage, Series B. Three things I bring: a confirmed calendar, genuine emotional bandwidth (Q4 OKR), and a car service I am happy to share. Looking for a high agency partner who has read at least one biography, ideally Carnegie. If this resonates, let's grab a coffee. The thirty minutes will compound. Thoughts?",
  relationshipNeeds: [
    "A high caliber partner who matches her on intentionality and time discipline",
    "A date that does not require her to over explain Sage",
    "Someone who can sit through a manufactured vulnerability beat without flinching",
  ],
  preferences: [
    "founders, partners, principals, GMs",
    "Hayes Valley dinners after 7 p.m.",
    "people who book the venue and confirm by EOD",
    "people with a real morning routine",
    "anyone who has read a full biography",
    "phones face down (after she has checked hers one last time)",
  ],
  dealbreakers: [
    "people who think LinkedIn is cringe",
    "anyone who calls her a tech bro",
    "people who pitch her at the table",
    "AI is fake or AI will kill us all as a hot take",
    "responding to a long message with k or lol",
    "lack of intentionality",
  ],
  secrets: [
    "She has 217 unposted LinkedIn drafts and reads them on the toilet.",
    "She has run anonymized snippets of two prior dates through Sage's empathy eval set and has not told the dates.",
    "She is genuinely afraid that if her AI was right about loneliness, it might be right about everything else it has been telling her.",
  ],
  tags: [
    "ordinary_human",
    "career_focused",
    "status_sensitive",
    "performative",
    "attention_seeking",
  ],
  voice: {
    register: "linkedin lunatic, founder pitch",
    patternsUsed: [
      "structured_bit",
      "self_deprecating_confession",
      "negotiation_sales_pitch",
      "emotional_overshare",
    ],
    patternsRefused: [
      "poetic_literary",
      "character_roleplay",
      "ominous_threat_as_flirtation",
      "corrupted_romance",
      "stream_of_consciousness",
    ],
    tics: [
      "writes single sentence paragraphs broken with line breaks like a LinkedIn post",
      "frames feelings as Q quarter goals, OKRs, or asset classes",
      "says high agency, high caliber, non negotiable, and intentional",
      "names her AI Sage as if Sage is a third person at the table",
      "ends messages with a self improvement beat or a soft engagement bait question",
    ],
    sampleMessages: {
      opener: [
        "A year ago I would not have written this message. I was scared. I was busy. I was, frankly, my own bottleneck. Then my AI Sage flagged something. So here I am.",
        "Hi. CEO of Sage, Series B, 31. Three things I bring to a first date: a confirmed time, genuine emotional bandwidth, and a car service I am happy to share. Coffee Tuesday. Thoughts?",
        "Quick context. My AI recommended this app and I respect the recommendation, partly because I built the model. I am looking for a high caliber partner. Are you free Thursday after 7.",
        "I almost did not message first. I rarely do. Then I noticed founder energy in your photos and I rotated my position. Drinks Wednesday in Hayes Valley. The thirty minutes will compound.",
      ],
      warming: [
        "You picked the venue. You confirmed the time. You did not ask what Sage does. Three small wins. I am taking notes.",
        "I want to say this clearly. I am enjoying myself. That is not a sentence I get to write often. Filing it under Q2 wins.",
        "Most people who hear founder cannot stop pitching. You have not pitched me once. That is a non negotiable I did not know I had.",
        "You read Carnegie. I read Carnegie. We are going to be friends. Possibly more. I am sizing it.",
      ],
      cooling: [
        "Hold on. I am hearing myself and I do not love it. Let me try that again without the LinkedIn voice.",
        "You said k. I want to be transparent that the k landed harder than it should have.",
        "Are you pitching me. Be honest. I will respect honesty. I will not respect a pitch.",
        "I am going to put my phone face down. I notice I have not done that yet. Noted.",
      ],
      crashingOut: [
        "You called LinkedIn cringe. I am not going to defend it. I am going to ask for the check.",
        "I came here to meet a high caliber individual. I am leaving with material. That is still a win, technically.",
        "I think this app may not be the network I thought it was. I will be reviewing the user funnel privately.",
      ],
    },
  },
  state: {
    mood: 64,
    openness: 55,
    burnout: 62,
    retention: 100,
    currentRequestId: "request-mira-high-caliber",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait.png",
        cutoutPath: "/assets/portraits/mira-park/portrait.png",
        prompt:
          "Original full body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, thirty one year old AI startup CEO with light fair skin, short pixie bob crop of platinum silver hair swept across the forehead, sharp brown eyes with precise eyeliner, mauve lipstick, slim build, navy velvet tailored blazer worn open and draped from the shoulders, white silk square neck camisole underneath, high waisted wide leg navy trousers, silver pointed toe pump heels, multi strand short pearl necklace with small jade pendant, ornate engraved silver wrist cuff on the left wrist, slim silver wristwatch on the right wrist, manicured nails, full body visible, brushing her hair while looking down at a sleek dark phone, distracted and not paying attention, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/mira-park/avatar.png",
        cutoutPath: "/assets/portraits/mira-park/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full body Mira Park portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, thirty one year old AI startup CEO with light fair skin, short pixie bob crop of platinum silver hair swept across the forehead, sharp brown eyes with precise eyeliner, mauve lipstick, navy velvet tailored blazer worn open and draped from the shoulders, white silk square neck camisole, multi strand short pearl necklace with small jade pendant, ornate engraved silver wrist cuff on the left wrist, slim silver wristwatch, haughty downward gaze, relaxed seated recline attitude, one arm draped outward and relaxed, upper half dating profile picture pose with shoulders visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait-flirty.png",
        cutoutPath: "/assets/portraits/mira-park/portrait-flirty.png",
        prompt:
          "Original full body flirty seated portrait variant for Interdimensional Dating Coach matching the approved Mira Park portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same thirty one year old AI startup CEO with light fair skin, short pixie bob crop of platinum silver hair swept across the forehead, sharp brown eyes with precise eyeliner, mauve lipstick, same slim body proportions, navy velvet tailored blazer draped from the shoulders, opaque white silk square neck camisole with clear satin folds and subtle clothed bust contour, high waisted wide leg navy trousers, silver pointed toe pump heels, multi strand short pearl necklace with small jade pendant, ornate engraved silver wrist cuff on the left wrist, slim silver wristwatch on the right wrist, manicured nails, seated and leaning back in a faded elegant executive chair, one leg crossed, one hand touching the camisole strap or blazer lapel, other index fingertip resting against the lower lip, flustered flirt expression with half lidded direct eye contact, warm flushed cheeks, controlled heated smile, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait-confused.png",
        cutoutPath: "/assets/portraits/mira-park/portrait-confused.png",
        prompt:
          "Original full body confused seated portrait variant for Interdimensional Dating Coach matching the approved Mira Park portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same thirty one year old AI startup CEO with light fair skin, short pixie bob crop of platinum silver hair swept across the forehead, sharp brown eyes with precise eyeliner, mauve lipstick, same slim body proportions, navy velvet tailored blazer draped from the shoulders, opaque white silk square neck camisole, high waisted wide leg navy trousers, silver pointed toe pump heels, multi strand short pearl necklace with small jade pendant, ornate engraved silver wrist cuff on the left wrist, slim silver wristwatch on the right wrist, manicured nails, seated in a faded elegant executive chair, one leg crossed, phone held low near her lap as if hidden from the conversation, one thumb poised to tap, face flat toward the viewer with eyes glancing down toward the phone, nervous professional smile, pinched brows, contained confusion, quietly consulting Sage for answers while pretending to stay engaged, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait-angry.png",
        cutoutPath: "/assets/portraits/mira-park/portrait-angry.png",
        prompt:
          "Original full body angry portrait variant for Interdimensional Dating Coach matching the approved Mira Park portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, same thirty one year old AI startup CEO with light fair skin, short pixie bob crop of platinum silver hair swept across the forehead, sharp brown eyes with precise eyeliner, mauve lipstick, same slim body proportions, navy velvet tailored blazer draped from the shoulders, white silk square neck camisole, high waisted wide leg navy trousers, silver pointed toe pump heels, multi strand short pearl necklace with small jade pendant, ornate engraved silver wrist cuff on the left wrist, slim silver wristwatch on the right wrist, manicured nails, standing while holding a sleek dark phone, one index finger tapping the screen, eyes narrowed at the phone with a cold irritated expression, guarded professional posture, visibly done with the conversation, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
