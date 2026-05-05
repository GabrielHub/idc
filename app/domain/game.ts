import { z } from "zod";

export const SAVE_SCHEMA_VERSION = 2;

export const memberIdSchema = z.string().min(1);
export const scenarioIdSchema = z.string().min(1);
export const goalIdSchema = z.string().min(1);
export const dateSessionIdSchema = z.string().min(1);
export const pairIdSchema = z.string().min(1);
export const memoryIdSchema = z.string().min(1);

export const scoreSchema = z.number().int().min(0).max(100);
export const deltaSchema = z.number().int().min(-100).max(100);

export const portraitAssetSchema = z.object({
  sourcePath: z.string().min(1),
  cutoutPath: z.string().min(1),
  prompt: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
});

export const memberPortraitSetSchema = z.object({
  portrait: portraitAssetSchema,
  avatar: portraitAssetSchema,
});

export const memberPortraitsSchema = z.object({
  neutral: memberPortraitSetSchema,
  flirty: memberPortraitSetSchema.optional(),
  confused: memberPortraitSetSchema.optional(),
  angry: memberPortraitSetSchema.optional(),
  embarrassed: memberPortraitSetSchema.optional(),
  furious: memberPortraitSetSchema.optional(),
});

export const voicePatternSchema = z.enum([
  "rambling_spiral",
  "urgent_crisis_plea",
  "deadpan_one_liner",
  "self_deprecating_confession",
  "unhinged_relationship_escalation",
  "structured_bit",
  "ominous_threat_as_flirtation",
  "emotional_overshare",
  "corrupted_romance",
  "mundane_domesticity",
  "poetic_literary",
  "philosophical_existential",
  "negotiation_sales_pitch",
  "stream_of_consciousness",
  "character_roleplay",
  "callback_rematch_reference",
  "cursed_question",
]);

export const memberVoiceSchema = z.object({
  register: z.string().min(1),
  patternsUsed: z.array(voicePatternSchema).min(1).max(4),
  patternsRefused: z.array(voicePatternSchema).min(2),
  tics: z.array(z.string().min(1)).min(3).max(5),
  sampleMessages: z.array(z.string().min(1)).min(1),
});

export const memberStateSchema = z.object({
  mood: scoreSchema,
  openness: scoreSchema,
  burnout: scoreSchema,
  currentRequestId: z.string().min(1).optional(),
  recentDateResult: z.string().min(1).optional(),
});

export const memberSchema = z.object({
  id: memberIdSchema,
  name: z.string().min(1),
  origin: z.string().min(1),
  species: z.string().min(1),
  dimension: z.string().min(1),
  realityStatus: z.string().min(1),
  bio: z.string().min(1),
  datingProfile: z.string().min(1),
  traits: z.array(z.string().min(1)).min(1),
  relationshipNeeds: z.array(z.string().min(1)).min(1),
  redFlags: z.array(z.string().min(1)),
  preferences: z.array(z.string().min(1)),
  dealbreakers: z.array(z.string().min(1)),
  secrets: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)),
  voice: memberVoiceSchema,
  state: memberStateSchema,
  portraits: memberPortraitsSchema,
});

export const scenarioTagSchema = z.enum([
  "temporal",
  "cosmic",
  "domestic",
  "career",
  "prophecy",
  "memory",
  "public",
  "haunted",
  "food",
  "low_pressure",
  "high_pressure",
  "repeat_risk",
]);

export const riskLevelSchema = z.enum(["low", "medium", "high"]);

export const relationshipStatSchema = z.enum([
  "chemistry",
  "trust",
  "stability",
  "conflict",
  "weirdnessTolerance",
  "spark",
  "strain",
  "relationshipHealth",
]);

export const scenarioBeatSchema = z.object({
  atTurn: z.number().int().min(1),
  title: z.string().min(1),
  event: z.string().min(1),
  characterVisibleText: z.string().min(1),
  directorInstruction: z.string().min(1),
});

export const dateScenarioSchema = z.object({
  id: scenarioIdSchema,
  title: z.string().min(1),
  card: z.object({
    summary: z.string().min(1),
    tags: z.array(scenarioTagSchema).min(1),
    risk: riskLevelSchema,
    intimacy: riskLevelSchema,
    chaos: riskLevelSchema,
    idealFor: z.array(z.string().min(1)),
    badFor: z.array(z.string().min(1)),
  }),
  publicBrief: z.object({
    location: z.string().min(1),
    premise: z.string().min(1),
    whatBothCharactersKnow: z.string().min(1),
    openingSituation: z.string().min(1),
  }),
  director: z.object({
    tone: z.string().min(1),
    rules: z.array(z.string().min(1)).min(1),
    beats: z.array(scenarioBeatSchema),
    earlyEndTriggers: z.array(z.string().min(1)),
    repeatBehavior: z.string().min(1),
  }),
  judgeRubric: z.object({
    successSignals: z.array(z.string().min(1)),
    failureSignals: z.array(z.string().min(1)),
    statFocus: z.array(relationshipStatSchema).min(1),
  }),
});

export const goalMetricSchema = z.enum([
  "completedDates",
  "earlyEndedDates",
  "ordinaryNonHumanDates",
  "memberMoodDelta",
]);

export const companyGoalSchema = z.object({
  id: goalIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  metric: goalMetricSchema,
  target: z.number().int().min(0),
  tags: z.array(z.string().min(1)),
});

export const memberRequestSchema = z.object({
  id: z.string().min(1),
  memberId: memberIdSchema,
  text: z.string().min(1),
  moodPenaltyIfIgnored: z.number().int().min(0).max(25),
  tags: z.array(z.string().min(1)),
});

export const pairStatsSchema = z.object({
  chemistry: scoreSchema,
  trust: scoreSchema,
  stability: scoreSchema,
  conflict: scoreSchema,
  weirdnessTolerance: scoreSchema,
  spark: scoreSchema,
  strain: scoreSchema,
  relationshipHealth: scoreSchema,
});

export const pairStateSchema = z.object({
  id: pairIdSchema,
  participantIds: z.tuple([memberIdSchema, memberIdSchema]),
  stats: pairStatsSchema,
  completedDateIds: z.array(dateSessionIdSchema),
  scenarioUseCounts: z.record(scenarioIdSchema, z.number().int().min(0)),
});

export const dateMessageKindSchema = z.enum(["character", "scenario", "cupid", "system"]);

const dateMessageBaseSchema = z.object({
  id: z.string().min(1),
  dateSessionId: dateSessionIdSchema,
  turnIndex: z.number().int().min(0),
  sequenceIndex: z.number().int().min(0),
  text: z.string().min(1),
  createdAt: z.string().min(1),
});

export const dateMessageSchema = z.discriminatedUnion("kind", [
  dateMessageBaseSchema.extend({
    kind: z.literal("character"),
    speakerId: memberIdSchema,
  }),
  dateMessageBaseSchema.extend({
    kind: z.literal("scenario"),
    speakerId: z.never().optional(),
  }),
  dateMessageBaseSchema.extend({
    kind: z.literal("cupid"),
    speakerId: z.never().optional(),
  }),
  dateMessageBaseSchema.extend({
    kind: z.literal("system"),
    speakerId: z.never().optional(),
  }),
]);

export const characterDateStateSchema = z.object({
  mood: scoreSchema,
  comfort: scoreSchema,
  intent: z.string().min(1),
});

export const cupidInterventionSchema = z.object({
  text: z.string().min(1).max(240),
  usedAtTurn: z.number().int().min(0),
});

export const memoryScopeSchema = z.enum(["member", "pair", "date", "scenario", "company"]);

export const memoryVisibilitySchema = z.enum(["public", "member_private", "judge_only"]);

export const memoryRecordSchema = z.object({
  id: memoryIdSchema,
  scope: memoryScopeSchema,
  visibility: memoryVisibilitySchema,
  subjectIds: z.array(memberIdSchema),
  visibleToMemberIds: z.array(memberIdSchema).optional(),
  pairId: pairIdSchema.optional(),
  scenarioId: scenarioIdSchema.optional(),
  dateSessionId: dateSessionIdSchema.optional(),
  text: z.string().min(1),
  tags: z.array(z.string().min(1)),
  importance: z.number().int().min(1).max(5),
  createdAt: z.string().min(1),
  embedding: z.array(z.number()).optional(),
  embeddingModel: z.string().min(1).optional(),
  embeddingDimensions: z.number().int().min(1).optional(),
});

export const memoryCandidateSchema = memoryRecordSchema.omit({
  id: true,
  createdAt: true,
  embedding: true,
  embeddingModel: true,
  embeddingDimensions: true,
});

export const judgeSnapshotSchema = z.object({
  id: z.string().min(1),
  dateSessionId: dateSessionIdSchema,
  exchangeIndex: z.number().int().min(0),
  dateHealthDelta: deltaSchema,
  statDeltas: z.partialRecord(relationshipStatSchema, deltaSchema),
  memberMoodDeltas: z.record(memberIdSchema, deltaSchema),
  shouldEndEarly: z.boolean(),
  earlyEndReason: z.string().min(1).optional(),
  notableMoments: z.array(z.string().min(1)),
  playerSummary: z.string().min(1),
  memoryCandidates: z.array(memoryCandidateSchema),
});

export const dateSessionStatusSchema = z.enum(["active", "completed", "ended_early"]);
export const dateRuntimeModeSchema = z.literal("local_ai");

export const followUpActionSchema = z.enum(["encourage", "cool_down", "repair", "mark_bad_fit"]);

export const dateFinalReportSchema = z.object({
  id: z.string().min(1),
  dateSessionId: dateSessionIdSchema,
  completedAt: z.string().min(1),
  outcome: z.enum(["second_date", "mixed", "cool_down", "bad_fit", "early_end"]),
  summary: z.string().min(1),
  statSummary: z.string().min(1),
  recommendedFollowUp: followUpActionSchema,
  appliedFollowUp: followUpActionSchema.optional(),
  memoryRecordIds: z.array(memoryIdSchema),
});

export const dateSessionSchema = z.object({
  id: dateSessionIdSchema,
  pairId: pairIdSchema,
  scenarioId: scenarioIdSchema,
  turnLimit: z.number().int().min(2).default(30),
  currentTurn: z.number().int().min(0),
  dateHealth: scoreSchema,
  status: dateSessionStatusSchema,
  runtimeMode: dateRuntimeModeSchema.default("local_ai"),
  participants: z.tuple([memberIdSchema, memberIdSchema]),
  transcript: z.array(dateMessageSchema),
  privateStateByCharacter: z.record(memberIdSchema, characterDateStateSchema),
  judgeSnapshots: z.array(judgeSnapshotSchema),
  intervention: cupidInterventionSchema.optional(),
  finalReport: dateFinalReportSchema.optional(),
});

export const scenarioDeckStateSchema = z.object({
  scenarioIds: z.array(scenarioIdSchema).min(1),
  maxSize: z.number().int().min(1),
  offeredScenarioIds: z.array(scenarioIdSchema),
});

export const goalScoreStatusSchema = z.enum(["met", "missed"]);

export const shiftGoalResultSchema = z.object({
  goalId: goalIdSchema,
  status: goalScoreStatusSchema,
  progress: z.number().int(),
  target: z.number().int(),
  summary: z.string().min(1),
});

export const shiftReportSchema = z.object({
  id: z.string().min(1),
  shiftId: z.string().min(1),
  completedAt: z.string().min(1),
  completedDates: z.number().int().min(0),
  earlyEndedDates: z.number().int().min(0),
  ordinaryNonHumanDates: z.number().int().min(0),
  memberMoodDelta: z.number().int(),
  goalResults: z.array(shiftGoalResultSchema),
  ignoredRequestIds: z.array(z.string().min(1)),
  offeredScenarioIds: z.array(scenarioIdSchema),
  summary: z.string().min(1),
});

export const shiftStateSchema = z.object({
  id: z.string().min(1),
  shiftNumber: z.number().int().min(1),
  status: z.enum(["active", "completed"]),
  dateSlotsTotal: z.number().int().min(1).default(3),
  dateSlotsUsed: z.number().int().min(0),
  drawnScenarioIds: z.array(scenarioIdSchema),
  companyGoalIds: z.array(goalIdSchema),
  memberRequestIds: z.array(z.string().min(1)),
  scenarioDeck: scenarioDeckStateSchema,
  startedAt: z.string().min(1),
  completedAt: z.string().min(1).optional(),
  report: shiftReportSchema.optional(),
});

export const gameConfigSchema = z.object({
  performerModel: z.string().min(1).default("gemma4:26b"),
  judgeModel: z.string().min(1).default("gemma4:26b"),
  summarizerModel: z.string().min(1).default("gemma4:26b"),
  embeddingModel: z.string().min(1).default("embeddinggemma"),
  defaultDateMessageLimit: z.number().int().min(2).default(30),
  shiftDateSlots: z.number().int().min(1).default(3),
});

export const gameSaveSchema = z.object({
  version: z.literal(SAVE_SCHEMA_VERSION),
  config: gameConfigSchema,
  members: z.array(memberSchema),
  pairStates: z.array(pairStateSchema),
  dateSessions: z.array(dateSessionSchema),
  shifts: z.array(shiftStateSchema),
  activeShiftId: z.string().min(1),
  memories: z.array(memoryRecordSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type PortraitAsset = z.infer<typeof portraitAssetSchema>;
export type MemberPortraitSet = z.infer<typeof memberPortraitSetSchema>;
export type MemberPortraits = z.infer<typeof memberPortraitsSchema>;
export type VoicePattern = z.infer<typeof voicePatternSchema>;
export type MemberVoice = z.infer<typeof memberVoiceSchema>;
export type MemberState = z.infer<typeof memberStateSchema>;
export type Member = z.infer<typeof memberSchema>;
export type ScenarioTag = z.infer<typeof scenarioTagSchema>;
export type RelationshipStat = z.infer<typeof relationshipStatSchema>;
export type ScenarioBeat = z.infer<typeof scenarioBeatSchema>;
export type DateScenario = z.infer<typeof dateScenarioSchema>;
export type GoalMetric = z.infer<typeof goalMetricSchema>;
export type CompanyGoal = z.infer<typeof companyGoalSchema>;
export type MemberRequest = z.infer<typeof memberRequestSchema>;
export type PairStats = z.infer<typeof pairStatsSchema>;
export type PairState = z.infer<typeof pairStateSchema>;
export type DateMessageKind = z.infer<typeof dateMessageKindSchema>;
export type DateMessage = z.infer<typeof dateMessageSchema>;
export type CharacterDateState = z.infer<typeof characterDateStateSchema>;
export type CupidIntervention = z.infer<typeof cupidInterventionSchema>;
export type MemoryScope = z.infer<typeof memoryScopeSchema>;
export type MemoryVisibility = z.infer<typeof memoryVisibilitySchema>;
export type MemoryRecord = z.infer<typeof memoryRecordSchema>;
export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;
export type JudgeSnapshot = z.infer<typeof judgeSnapshotSchema>;
export type DateSessionStatus = z.infer<typeof dateSessionStatusSchema>;
export type DateRuntimeMode = z.infer<typeof dateRuntimeModeSchema>;
export type DateFinalReport = z.infer<typeof dateFinalReportSchema>;
export type DateSession = z.infer<typeof dateSessionSchema>;
export type FollowUpAction = z.infer<typeof followUpActionSchema>;
export type ScenarioDeckState = z.infer<typeof scenarioDeckStateSchema>;
export type GoalScoreStatus = z.infer<typeof goalScoreStatusSchema>;
export type ShiftGoalResult = z.infer<typeof shiftGoalResultSchema>;
export type ShiftReport = z.infer<typeof shiftReportSchema>;
export type ShiftState = z.infer<typeof shiftStateSchema>;
export type GameConfig = z.infer<typeof gameConfigSchema>;
export type GameSave = z.infer<typeof gameSaveSchema>;
