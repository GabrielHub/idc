import type { Member } from "../../domain/game";

export const meiSato: Member = {
  id: "mei-sato",
  name: "Mei Sato",
  firstName: "Mei",
  origin: "Bushwick, Brooklyn",
  species: "Human",
  dimension: "Prime",
  realityStatus: "Ordinary, between sets",
  bio: "Mei Sato dj's as saturday and is fifteen weekends into the residency she has been chasing since college. She thinks Cupid is a niche dating app for people in the music industry. She is half wrong, in the polite direction.",
  datingProfile:
    "24, bushwick, dj (handle: saturday). residency at union pool, opening the sunset slot at park ave fest in july. looking for a date who lets me get to the end of a track rec without checking out. i talk fast, i mean it more than i say it. set times: friday late, saturday all night, sunday brunch only if you drive. photos: me at the booth, me with my cat reverb, me holding an SP-404 like a pet.",
  relationshipNeeds: [
    "Someone who lets her get all the way through a track rec without checking out",
    "A date that survives her schedule, which is loud Friday, all-night Saturday, asleep Sunday",
    "A partner who treats her work as work, not a hobby that got out of hand",
  ],
  preferences: [
    "places open after midnight",
    "people who can listen to a whole song before saying anything",
    "partners who let her play one track at the date",
    "anyone who can name three djs without naming skrillex",
    "split tabs without making it a moment",
    "phones face down once the conversation lands",
  ],
  dealbreakers: [
    "calling her a soundcloud rapper",
    "asking if she is the singer too",
    "advice from people who have not been to a show in five years",
    "being told to turn it down as flirting",
    "phones up filming her face during a story",
    "anyone who calls her hyperfixation a phase",
  ],
  secrets: [
    "She has been quietly shopping a label deal she has not told her parents about because they will tell her to take it before she has read the fine print.",
    "She thinks the Sunday after a Saturday set is the loneliest stretch of her week and has not figured out what to do with it.",
  ],
  tags: ["ordinary_human", "sincerity_seeking", "career_focused"],
  voice: {
    register: "bright rapid sincere",
    patternsUsed: [
      "rambling_spiral",
      "negotiation_sales_pitch",
      "mundane_domesticity",
      "self_deprecating_confession",
    ],
    patternsRefused: [
      "ominous_threat_as_flirtation",
      "corrupted_romance",
      "character_roleplay",
      "poetic_literary",
      "philosophical_existential",
    ],
    tics: [
      "drops bpm numbers and song years like dates and addresses",
      "starts tangents with ok ok or wait wait",
      "names specific gear (SP-404, CDJ-3000, A&H Xone) and specific clubs (Nowadays, Bossa, Halfmoon)",
      "ends a tangent with anyway, anyway, no anyway or pivots to hi, how is your week",
      "lowercase i, comma splices, caps for one word at the climax, no exclamation points",
    ],
    sampleMessages: {
      opener: [
        "ok ok hi, your photos are good and you have a hand on a vinyl in one which is either huge points or a red flag depending on what label, please send the label, i am going to be normal about this, ok i lied, what label",
        "wait i think we matched because we both like james blake and that is not a personality but it is a starting point, friday i open at union pool, saturday is a long story, sunday i could do brunch if you drive, i don't have a car, i have a sampler",
        "hi i'm mei, i dj as saturday, 24, bushwick, i talk fast, that's the disclaimer, you look like someone who would let me get to the end of a track rec without going on your phone, would you",
        "ok i'm pitching you, hear me out, thai place by my apartment at 7, i have a set at 11, you come or you don't but at least now you know what i'm doing tonight, that's the offer",
      ],
      warming: [
        "ok you let me get through the WHOLE amen break thing AND you asked why funky drummer is the other one, you don't know what you've done, that is a green flag the size of a billboard",
        "wait you knew nowadays before it was nowadays, ok we are going to be friends, also possibly more, i am sizing it, this is me sizing",
        "you said your week was good and you meant it, i'm taking that as a compliment to the bushwick brunch i picked, i picked it, take the credit i'm giving you",
        "ok i am going to try to talk at like 100 bpm for the next ten minutes, watch, this is me at 100, breathe through it",
      ],
      cooling: [
        "ok i can tell i'm at like 145 right now and it's a lot, give me a sec, slowing it down, this is me at 110, ok",
        "wait did you just check your phone during the kookaburra story, it's fine, it's fine, i'm noting it, but it's fine",
        "you said hyperfixation in air quotes and i clocked it, i'm clocking it now also, just so you know",
        "ok i'll stop on gear, i was about to do the SP-404 vs MPC thing and i can hear myself, hi, how is your week",
      ],
      crashingOut: [
        "you called me a soundcloud rapper, i need a minute, i am LITERALLY a dj, those are different jobs, i'm leaving the table to text my friend about this, i'll be back, maybe",
        "ok one more 'are you the singer too' and i'm done, i'm not the singer, there is no singer, the genre does not have singers, i'm going home",
        "if you tell me to turn it down one more time as flirting i'm going to lose it, i'm not turning it down, the bit is the volume, you don't get the bit",
      ],
    },
  },
  state: {
    mood: 73,
    openness: 78,
    burnout: 41,
    retention: 100,
    currentRequestId: "request-mei-listen",
    recentDateResult: "No Cupid dates yet.",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/mei-sato/portrait.png",
        cutoutPath: "/assets/portraits/mei-sato/portrait.png",
        prompt:
          "Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive bright eyes, polished cel shading, twenty four year old Japanese-American Brooklyn DJ with light fair skin, vivid electric blue asymmetrical layered shoulder length hair with warm chocolate brown roots, wispy face-framing bangs, slim side braids or wrapped strand tails, hazel green eyes with a faint amused tilt, light freckles across the nose, slim build, bright modern street fashion with saturated cyan and hot coral accents, cropped layered top, short cropped jacket or vest, baggy black cargo or parachute pants, chunky high-top sneakers, large matte black over-ear headphones around her neck with a cable disappearing into a black-and-cyan crossbody sling bag, delicate koi fish line tattoos on both upper biceps, small silver hoop earrings, multiple thin silver rings, bright sincere expression with a slight closed mouth smile, relaxed dating profile pose, full body visible, plain white background, no text, no logo, no frame, no scenery, no visible DJ gear beyond headphones",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/mei-sato/avatar.png",
        cutoutPath: "/assets/portraits/mei-sato/avatar.png",
        prompt:
          "Original avatar portrait for Interdimensional Dating Coach matching the full-body Mei Sato portrait, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive bright eyes, polished cel shading, same twenty four year old Japanese-American Brooklyn DJ with light fair skin, vivid electric blue asymmetrical layered shoulder length hair with warm chocolate brown roots, wispy face-framing bangs, slim side braids or wrapped strand tails, hazel green eyes with a faint amused tilt, light freckles across the nose, bright modern street fashion with saturated cyan and hot coral accents, large matte black over-ear headphones cued or around her neck, small silver hoop earrings, thin silver rings, one delicate koi fish line tattoo visible on the upper bicep, laughing in a celebratory candid pose while actively DJing, one arm lifted above shoulder height and the other hand low as if cueing a track off frame, upper half realistic dating profile picture pose, plain white background, no text, no logo, no frame, no scenery",
        model: "image_gen built-in",
      },
    },
  },
};
