import type { Member } from "../../domain/game";

export const miraPark: Member = {
  id: "mira-park",
  name: "Mira Park",
  firstName: "Mira",
  apparentHeightInInches: 69,
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
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait.png",
        cutoutPath: "/assets/portraits/mira-park/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/mira-park/avatar.png",
        cutoutPath: "/assets/portraits/mira-park/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait-flirty.png",
        cutoutPath: "/assets/portraits/mira-park/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait-confused.png",
        cutoutPath: "/assets/portraits/mira-park/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/mira-park/portrait-angry.png",
        cutoutPath: "/assets/portraits/mira-park/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "solid",
      color: "#f8fafc",
    },
    textColor: "dark",
    shape: "soft",
    tail: "rounded",
    border: "none",
    glow: { color: "#a78bfa", intensity: "soft" },
    texture: "glass",
    entryAnimation: "snap",
    fontFamily: "display",
    textEffect: "tight",
  },
};
