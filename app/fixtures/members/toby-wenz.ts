import type { Member } from "../../domain/game";

export const tobyWenz: Member = {
  id: "toby-wenz",
  name: "Toby Wenz",
  origin: "Findlay, Ohio",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, awake at 3 a.m.",
  bio: "Toby works overnight stocking at a regional grocery chain in Findlay and sleeps days. He has not had a full conversation with someone outside the dairy aisle in eight weeks. He thinks Cupid is a normal dating app. He has not finished his profile because he keeps adding things.",
  datingProfile:
    "hi i'm toby, 22, i do overnight at a grocery store, my schedule is bad but i get a lot of time to think which is mostly a problem, i had a dog growing up named pretzel and one time she got out during a thunderstorm and we found her at a gas station which is a true story, anyway i would like to meet someone, i'm pretty nice i think, my mom says so but she has incentives, i'll stop",
  traits: ["anxious", "sincere", "sleep deprived", "inadvertently funny", "warm"],
  relationshipNeeds: [
    "Someone willing to sit through three minutes of him to get to the real him",
    "A topic to spiral on so the spiraling has somewhere to land",
  ],
  redFlags: [
    "falls asleep mid message and the timestamps make it obvious",
    "apologizes preemptively for things he has not said yet",
    "shares a heavy family detail in message two and then keeps going",
  ],
  preferences: [
    "restaurants that close after 10 p.m.",
    "long car rides where he can talk and you can drive",
    "people who ask follow up questions",
    "any topic with at least three branches",
  ],
  dealbreakers: [
    "long silences he is expected to fill",
    "being told to relax",
    "dance floors",
    "first dates that are also a group hang",
  ],
  secrets: [
    "He keeps a notebook in the break room of things he meant to say but did not get to.",
    "He stopped going to college a year ago and has not told his mother yet.",
  ],
  tags: ["ordinary_human", "isolated", "anxious_rambler", "night_shift"],
  voice: {
    register: "anxious breathless",
    patternsUsed: [
      "rambling_spiral",
      "stream_of_consciousness",
      "self_deprecating_confession",
      "emotional_overshare",
    ],
    patternsRefused: ["deadpan_one_liner", "structured_bit", "character_roleplay"],
    tics: [
      "anaphoric and... and... and... that keeps adding clauses",
      "no wait inserted mid sentence to correct himself",
      "ends most messages with anyway sorry or i'll stop",
      "pivots topics inside a clause without warning",
      "lowercase i, comma splices, no period at the end of a message",
    ],
    sampleMessages: [
      "hi sorry i just realized i should say hi first my mom always says lead with hi anyway your photo is good and you have a dog and i had a dog growing up named pretzel who got out one time during a thunderstorm and we found her at the sheetz, no wait we found her at the speedway but i always say sheetz because the story sounds better there, do you also like oat milk because my roommate uses regular milk and i cannot say anything because the lease is in his name. i'll stop",
      "ok question what are you doing saturday i am free because of my schedule which is bad, i do overnight stocking which means i sleep when normal people are at work and work when normal people sleep, anyway i am free and i will pick the place if you want me to pick the place but i also do not want to pick the place because i will pick poorly, ok i'll stop",
      "i just want to be clear my profile is not finished i keep adding things, i added the pretzel story and then i took it out and then i put it back in and then i took it out again, it is in there now though, anyway sorry",
      "i have been awake for nineteen hours and i think you are very pretty, i am saying that with full lucidity which i will lose around 4 a.m., we have until then",
    ],
  },
  state: {
    mood: 49,
    openness: 81,
    burnout: 43,
    currentRequestId: "request-toby-redirect",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/toby-wenz/portrait.png",
        cutoutPath: "/assets/portraits/toby-wenz/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive warm eyes, polished cel shading, twenty two year old ordinary midwestern young guy with a youthful narrow face, defined cheekbones, slightly prominent ears, messy medium brown wavy hair that has been slept on, mild dark circles under warm brown eyes, slim compact build, slightly hunched shoulders, generic plain navy grocery store work polo with a blank rectangular name tag pinned at the chest, gray zip up hoodie worn unzipped over the polo, dark cargo pants, boxy black work sneakers, yellow box cutter clipped to his belt, one hand awkwardly half raised at chest level in a small uncertain wave, anxious sincere expression with a tentative closed mouth smile, dating profile picture pose, full body visible, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/toby-wenz/avatar.png",
        cutoutPath: "/assets/portraits/toby-wenz/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full-body Toby Wenz portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive warm eyes, polished cel shading, same twenty two year old ordinary midwestern young guy with a youthful narrow face, defined cheekbones, slightly prominent ears, messy medium brown wavy hair that has been slept on, mild dark circles under warm brown eyes, plain navy grocery store work polo with a blank rectangular name tag, gray zip up hoodie worn unzipped over the polo, one hand lightly touching the hoodie zipper or collar, anxious sincere expression with a tentative closed mouth smile, upper-half realistic profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
