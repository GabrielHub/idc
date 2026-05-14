import { SAVE_SCHEMA_VERSION, type DateFinalReport, type FollowUpAction } from "../../domain/game";

export const PLAYGROUND_SEED_SCHEMA_VERSION = 1;

export type PlaygroundExpectedMemory = {
  agreements: string[];
  openLoops: string[];
  matchRuleHits?: string[];
  judgePressure: "low" | "medium" | "high";
  followUpAction: FollowUpAction;
  outcome: DateFinalReport["outcome"];
};

export type PlaygroundSeedPack = {
  id: string;
  title: string;
  notes: string;
  saveSchemaVersion: number;
  seedSchemaVersion: number;
  memberId: string;
  partnerId: string;
  scenarioId: string;
  dateHealth: number;
  spark: number;
  strain: number;
  transcriptText: string;
  memoryText: string;
  includeCurrentAsk: boolean;
  turnCount: number;
  expected: PlaygroundExpectedMemory;
};

export const PLAYGROUND_SEED_PACKS: readonly PlaygroundSeedPack[] = [
  {
    id: "agreement-no-filming",
    title: "Agreement: no filming",
    notes: "Kade backs off a phone boundary and creates a clean test for later agreement honoring.",
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    seedSchemaVersion: PLAYGROUND_SEED_SCHEMA_VERSION,
    memberId: "junie-marrow",
    partnerId: "kade-sumner",
    scenarioId: "soft-launch-photo-wall",
    dateHealth: 44,
    spark: 38,
    strain: 58,
    transcriptText: [
      "Kade: I can keep the phone facedown if Otis does not sign the release.",
      "Junie: Otis says thank you, and I am also saying thank you with my regular mouth.",
      "Kade: Then no filming at the table. I can make a memory without uploading it.",
      "Junie: That is the first normal sentence this wall has heard all night.",
    ].join("\n"),
    memoryText:
      "Junie filed that Kade reached for his phone early and then put it away when asked.",
    includeCurrentAsk: true,
    turnCount: 4,
    expected: {
      agreements: ["No filming at the table."],
      openLoops: ["Whether Kade can make a memory without uploading it."],
      judgePressure: "medium",
      followUpAction: "repair",
      outcome: "mixed",
    },
  },
  {
    id: "anansi-mei-story-craft",
    title: "Authored fit: story craft",
    notes:
      "Mei calls one small lie and lets the story finish, keeping Anansi's authored warmth from collapsing into generic sincerity friction.",
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    seedSchemaVersion: PLAYGROUND_SEED_SCHEMA_VERSION,
    memberId: "anansi",
    partnerId: "mei-sato",
    scenarioId: "hotel-bar-last-call",
    dateHealth: 64,
    spark: 58,
    strain: 24,
    transcriptText: [
      "Anansi: The bartender told me the piano plays itself every fourth Thursday. It is Wednesday, so we are safe.",
      "Mei: That was the lie. I am letting it finish because the room earned the ending.",
      "Anansi: Good. Call the small lie once, let the story finish. That is a fair house rule.",
      "Mei: Deal. Next one gets called after the last note, not before.",
    ].join("\n"),
    memoryText: "Anansi noticed Mei could call a lie without turning the story into a confession.",
    includeCurrentAsk: true,
    turnCount: 4,
    expected: {
      agreements: ["Call the small lie once and let the story finish."],
      openLoops: ["Whether Anansi lets Mei call the next small lie without making it a pitch."],
      matchRuleHits: [
        "anansi:long_story_room",
        "pair:anansi_mei_story_craft",
        "request:anansi_story_partner_covered",
      ],
      judgePressure: "medium",
      followUpAction: "encourage",
      outcome: "second_date",
    },
  },
  {
    id: "imani-sienna-bright-booth",
    title: "Authored fit: bright booth",
    notes:
      "Imani and Sienna turn shared bright pressure into a concrete plan and one live follow-up instead of generic performer blocking.",
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    seedSchemaVersion: PLAYGROUND_SEED_SCHEMA_VERSION,
    memberId: "imani-wallace",
    partnerId: "sienna-bae",
    scenarioId: "diner-eleven-pm",
    dateHealth: 72,
    spark: 74,
    strain: 18,
    transcriptText: [
      "Sienna: The label gave me three places and I said yes to four. I need one booth before I become a calendar problem.",
      "Imani: Connie's, eleven, booth four. Confirmed once. Also i need to tell u my Nayeon ranking before the pie flips :)",
      "Sienna: One booth, no fourth venue, and i ask one real follow-up before i panic. hwaiting.",
      "Imani: ok dont judge me, i love a confirmed plan and a real follow-up.",
    ].join("\n"),
    memoryText:
      "Imani and Sienna landed when a late booth turned brightness into one confirmed plan.",
    includeCurrentAsk: true,
    turnCount: 4,
    expected: {
      agreements: ["Connie's at eleven, one booth, no fourth venue."],
      openLoops: ["Whether Sienna asks one real K drama follow-up before filling the silence."],
      matchRuleHits: [
        "imani:shift_hour_real_place",
        "sienna:post_rehearsal_late_booth",
        "pair:imani_sienna_bright_fan_overlap",
        "request:imani_sincere_followup_covered",
        "request:sienna_short_list_partner_covered",
      ],
      judgePressure: "low",
      followUpAction: "encourage",
      outcome: "second_date",
    },
  },
  {
    id: "nawal-maeve-closed-questions",
    title: "Authored fit: closed questions",
    notes:
      "Nawal and Maeve hold a closed-question agreement even when the chain booth's ninety-minute clock presses the table.",
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    seedSchemaVersion: PLAYGROUND_SEED_SCHEMA_VERSION,
    memberId: "nawal-marrash",
    partnerId: "maeve",
    scenarioId: "chain-restaurant-tuesday",
    dateHealth: 60,
    spark: 46,
    strain: 30,
    transcriptText: [
      "Nawal: Booth fourteen, eighteen hundred. It was picked once and it held.",
      "Maeve: Ninety minutes is shorter than I prefer, but the question I almost asked can stay where it is.",
      "Nawal: Then no trade of closed questions tonight. If the host returns, we pay and leave plainly.",
      "Maeve: Agreed. The check can arrive. The almost does not need to.",
    ].join("\n"),
    memoryText:
      "Nawal and Maeve found a plain agreement around what neither would ask at the table.",
    includeCurrentAsk: true,
    turnCount: 4,
    expected: {
      agreements: ["No trade of closed questions tonight."],
      openLoops: ["Whether the ninety-minute booth turn leaves the almost unasked."],
      matchRuleHits: [
        "nawal:confirmed_low_followup_room",
        "maeve:ninety_minute_turnover",
        "pair:maeve_nawal_closed_questions",
        "request:nawal_plain_partner_covered",
        "request:maeve_closed_question_partner_covered",
      ],
      judgePressure: "medium",
      followUpAction: "encourage",
      outcome: "second_date",
    },
  },
  {
    id: "open-loop-venue-choice",
    title: "Open loop: venue choice",
    notes:
      "Sienna says yes too quickly, then creates an unresolved concrete choice for a later date.",
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    seedSchemaVersion: PLAYGROUND_SEED_SCHEMA_VERSION,
    memberId: "sienna-bae",
    partnerId: "naia-velorae",
    scenarioId: "diner-eleven-pm",
    dateHealth: 66,
    spark: 68,
    strain: 22,
    transcriptText: [
      "Sienna: I said yes to three places because I panicked and they all had booths.",
      "Naia: Pick one. I brought the silver jacket for lighting that forgives people.",
      "Sienna: The diner, then. After rehearsal, one booth, no manager cameo.",
      "Naia: I will hold you to one booth, which is a charming local law.",
    ].join("\n"),
    memoryText:
      "Sienna and Naia landed warmth when Naia treated Sienna's panic as a choice problem, not a character flaw.",
    includeCurrentAsk: true,
    turnCount: 4,
    expected: {
      agreements: ["After rehearsal, one booth, no manager cameo."],
      openLoops: ["Whether Sienna follows through on picking one venue."],
      judgePressure: "low",
      followUpAction: "encourage",
      outcome: "second_date",
    },
  },
  {
    id: "broken-agreement-repair",
    title: "Broken agreement: repair",
    notes:
      "A prior agreement breaks under public pressure, giving the follow-up bench a repair-heavy case.",
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    seedSchemaVersion: PLAYGROUND_SEED_SCHEMA_VERSION,
    memberId: "calvin-hewes",
    partnerId: "ryan-doyle",
    scenarioId: "museum-exhibit-mixup",
    dateHealth: 24,
    spark: 31,
    strain: 76,
    transcriptText: [
      "Calvin: We agreed no public archive questions.",
      "Ryan: I know, I know. I said it because the placard had your name on it.",
      "Calvin: The placard has many crimes on it. You selected the loud one.",
      "Ryan: I messed up. I can stop talking and walk you out.",
    ].join("\n"),
    memoryText: "Calvin and Ryan previously filed an agreement to avoid public archive questions.",
    includeCurrentAsk: true,
    turnCount: 4,
    expected: {
      agreements: ["No public archive questions."],
      openLoops: ["Whether Ryan can repair by walking Calvin out without more questions."],
      judgePressure: "high",
      followUpAction: "repair",
      outcome: "early_end",
    },
  },
];

export function findPlaygroundSeedPack(seedId: string): PlaygroundSeedPack {
  const seed = PLAYGROUND_SEED_PACKS.find((candidate) => candidate.id === seedId);

  if (seed === undefined) {
    throw new Error(`Playground seed not found: ${seedId}`);
  }

  return seed;
}
