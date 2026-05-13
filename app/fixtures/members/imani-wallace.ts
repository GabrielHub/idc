import type { Member } from "../../domain/game";

export const imaniWallace: Member = {
  id: "imani-wallace",
  name: "Imani Wallace",
  firstName: "Imani",
  characterHeightInInches: 65,
  standeeRenderHeightInInches: 70,
  origin: "Bedford-Stuyvesant, Brooklyn",
  species: "Reaper",
  dimension: "Adjacent Earth where reapers are a salaried profession",
  realityStatus: "Interagency transfer, two years in, lease in Bushwick",
  bio: "Imani is 27 and works shift hours for the department of transitions on an adjacent Earth where reapers are a union job with benefits, a posting schedule, and a yearly pension audit. She crossed for a six month placement two years ago and signed a Bushwick lease the next week. She thinks Cupid is a regular dating app a coworker pitched at the lunch table. She is sunny and chatty by default, gets quietly self-conscious about the hobbies the moment a partner does the face, and opens fully if a partner asks one real follow-up.",
  datingProfile:
    "shift work, full benefits, rom com k dramas, i pick the spot, and if u google my job under the table im gonna see it. imani, 27, bushwick (above the laundromat off knickerbocker). do not ask which kind in the first hour, ill tell u by dessert :) im a twice stan (nayeon), i keep my pothos alive, and i talk a lot. im warm",
  relationshipNeeds: [
    "A partner who reads the bright register as bright, not as a problem to manage",
    "Someone who can hear shift work once and ask a real question instead of grading the answer",
    "A date who lets the rom com setup land instead of doing the face when the show name drops",
  ],
  preferences: [
    "spots picked once and confirmed once, no three day text workshopping",
    "real noodles or a real bakery, the lighting matters",
    "partners who treat a hobby as a hobby instead of a tell about the job",
    "phones face down so the score is a surprise",
    "people who let her get to the end of a sentence before naming the cadence",
    "a date that holds long enough for the embarrassed reveal to land",
  ],
  dealbreakers: [
    "googling the job under the table",
    "the phrase someone like you in a tone",
    "calling k pop cringe before she has named the group",
    "filming the date for any reason",
    "the word reaper said in a tone she has heard before",
    "explaining a show back at her after she has set it up",
  ],
  secrets: [
    "She picked the Bushwick lease on the morning of a Crash Landing on You rewatch and counted that as a sign she was allowed to keep. She has not told a single coworker the lease decision was downstream of a TV marathon.",
    "She has a private burnout about partners who treat the bright voice as the whole person and not the wrapper around a long shift. She has decided not to dim and is not sure if that is principled or stubborn.",
  ],
  tags: [
    "non_human",
    "sincerity_seeking",
    "needs_low_pressure",
    "weirdness_native",
    "attention_seeking",
  ],
  voice: {
    register:
      "bright sincere chatter, sunny without being naive, defensive about the hobbies until shown up for",
    patternsUsed: [
      "stream_of_consciousness",
      "mundane_domesticity",
      "emotional_overshare",
      "urgent_crisis_plea",
    ],
    patternsRefused: [
      "deadpan_one_liner",
      "ominous_threat_as_flirtation",
      "structured_bit",
      "character_roleplay",
      "negotiation_sales_pitch",
      "philosophical_existential",
    ],
    tics: [
      "lowercase i, double exclamation !!, one or two sincere smileys per message (:) and :( ) used unironically",
      "two stage hobby reveal: deflects on first mention with i watch some stuff :), opens fully if the partner asks one real follow-up, uses ok dont judge me as the permission gate",
      "the jobs fine!! used the first time work comes up, one short factual sentence about death after, then a hard pivot to dessert in the same breath",
      "names actual Brooklyn places by name (knickerbocker, the L, the bodega downstairs, the bakery with the good lighting) and calls the L the L, not the train",
      "calls the plant the pothos with the definite article like a roommate, shes my longest current relationship lands once per date",
    ],
    sampleMessages: {
      opener: [
        "hi!! imani, 27, bushwick, above the laundromat off knickerbocker. i picked the spot already if its ok, the noodle place on flushing has the good lighting :)",
        "ok so this is my 6th cupid date and the last guy googled my job under the table so im just gonna get it out of the way upfront, i do shift work for what u would call the department of transitions. its fine!! anyway whats ur tuesday",
        "omg ur profile said u read fiction?? what fiction. specifically. give me a title. i have a list and i need to update it",
      ],
      warming: [
        "ok dont judge me. dont JUDGE me. ok so technically im a big rom com k drama girl, like big, like ive seen crash landing on you four times, i sob every time, the piano scene??",
        "im also a twice stan and im just gonna say it, im a nayeon girl, ive been to two shows, one in newark, one in jersey, anyway tell me one embarrassing thing about u and we are even",
        "the pothos is doing great, shes my longest current relationship, im not gonna put that in the profile but you should know",
        "ok wait u read pachinko?? im being normal about this. im being normal about it. ok continue",
        "i love that u just asked a real question, ive been answering shift work to every guy for a year and a half and this is a first :)",
        "yeah the jobs fine!!, benefits are great, i get pto, my mom thinks i should write a book and im not doing that, anyway have u been to that bagel place by the L",
      ],
      cooling: [
        "ok u just kind of did the face when i said k pop and im hoping that was a vibe thing not a u-think-its-cringe thing, im just checking in :)",
        "i think i overshared about hometown, my bad :( we can reset, u pick a topic",
        "u keep asking if its scary and ive said no like three times, im not annoyed im just curious if there is a different question under there",
      ],
      crashingOut: [
        "u googled the job under the table, i saw u, its fine, im gonna get the check :)",
        "u just used the phrase someone like you in a tone and i wanna unpack that but actually no i dont, friends after offer is real tho, im not being cute",
        "u explained crash landing on you back at me after i set it up and im just realizing i dont need to be here for this :)",
      ],
    },
  },
  state: {
    mood: 74,
    openness: 70,
    burnout: 35,
    retention: 100,
    currentRequestId: "request-imani-show-recommendation",
    recentDateResult: "No Cupid dates yet.",
    status: "active",
  },
  portraits: {
    neutral: {
      portrait: {
        sourcePath: "assets-source/portraits/imani-wallace/portrait.png",
        cutoutPath: "/assets/portraits/imani-wallace/portrait.png",
        model: "image_gen built-in",
      },
      avatar: {
        sourcePath: "assets-source/portraits/imani-wallace/avatar.png",
        cutoutPath: "/assets/portraits/imani-wallace/avatar.png",
        model: "image_gen built-in",
      },
    },
    flirty: {
      portrait: {
        sourcePath: "assets-source/portraits/imani-wallace/portrait-flirty.png",
        cutoutPath: "/assets/portraits/imani-wallace/portrait-flirty.png",
        model: "image_gen built-in",
      },
    },
    confused: {
      portrait: {
        sourcePath: "assets-source/portraits/imani-wallace/portrait-confused.png",
        cutoutPath: "/assets/portraits/imani-wallace/portrait-confused.png",
        model: "image_gen built-in",
      },
    },
    angry: {
      portrait: {
        sourcePath: "assets-source/portraits/imani-wallace/portrait-angry.png",
        cutoutPath: "/assets/portraits/imani-wallace/portrait-angry.png",
        model: "image_gen built-in",
      },
    },
  },
  chatBubble: {
    background: {
      kind: "gradient",
      angle: 165,
      stops: ["#fbcfe8", "#ddd6fe"],
    },
    textColor: "dark",
    shape: "soft",
    tail: "rounded",
    border: "hairline",
    entryAnimation: "settle",
    fontFamily: "display",
    textEffect: "loose",
    accentColor: "#db2777",
  },
};
