import { z } from "zod";

export const SAVE_SCHEMA_VERSION = 13;

export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
export const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
export const DEFAULT_OLLAMA_CHAT_MODEL = "gemma4:e4b";
export const DEFAULT_OLLAMA_EMBEDDING_MODEL = "embeddinggemma";
export const DEFAULT_GATEWAY_CHAT_MODEL = "deepseek/deepseek-v4-flash";
export const DEFAULT_GATEWAY_EMBEDDING_MODEL = "voyage/voyage-4";
export const DEFAULT_DATE_MESSAGE_LIMIT = 12;
export const DEFAULT_JUDGE_TURN_INTERVAL = 6;
export const MEMBER_RETENTION_WARNING_THRESHOLD = 25;
const DEEPSEEK_V4_PRO_MODEL = "deepseek/deepseek-v4-pro";
const CURRENT_GATEWAY_GEMINI_FLASH_LITE_MODEL = "google/gemini-3.1-flash-lite";
const XIAOMI_MIMO_V2_5_MODEL = "xiaomi/mimo-v2.5";
const XIAOMI_MIMO_V2_5_PRO_MODEL = "xiaomi/mimo-v2.5-pro";

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

export const portraitMoodSchema = z.enum(["neutral", "flirty", "confused", "angry"]);

export const memberPortraitVariantSchema = z.object({
  portrait: portraitAssetSchema,
});

export const memberPortraitsSchema = z.object({
  neutral: memberPortraitSetSchema,
  flirty: memberPortraitVariantSchema.optional(),
  confused: memberPortraitVariantSchema.optional(),
  angry: memberPortraitVariantSchema.optional(),
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

const memberSampleMessageArraySchema = z.array(z.string().min(1)).min(3).max(8);
const memberCrashOutSampleMessageArraySchema = z.array(z.string().min(1)).min(2).max(6);

export const memberSampleMessagesSchema = z.object({
  greeting: memberSampleMessageArraySchema,
  hingeBits: memberSampleMessageArraySchema,
  warming: memberSampleMessageArraySchema,
  cooling: memberSampleMessageArraySchema,
  crashingOut: memberCrashOutSampleMessageArraySchema,
});

export const memberConversationShapeTurnSchema = z.object({
  speaker: z.enum(["member", "partner"]),
  text: z.string().min(1),
});

export const memberConversationShapeExampleSchema = z
  .object({
    turns: z.array(memberConversationShapeTurnSchema).min(2).max(8),
  })
  .superRefine((example, context) => {
    const speakers = new Set(example.turns.map((turn) => turn.speaker));

    if (!speakers.has("member") || !speakers.has("partner")) {
      context.addIssue({
        code: "custom",
        message: "Conversation shape examples must include member and partner turns.",
        path: ["turns"],
      });
    }
  });

export const memberContrastExampleSchema = z.object({
  tempting: z.string().min(1),
  preferred: z.string().min(1),
  because: z.string().min(1).optional(),
});

export const MEMBER_VOICE_GUIDANCE_MAX_CHARS = 720;

const memberVoiceGuidanceSchema = z.string().min(1).max(MEMBER_VOICE_GUIDANCE_MAX_CHARS);

export const memberVoiceSchema = z.object({
  register: z.string().min(1),
  comedyMechanics: z.array(memberVoiceGuidanceSchema).max(8).optional(),
  outputConstraints: z.array(memberVoiceGuidanceSchema).max(12).optional(),
  conversationShape: z.array(memberConversationShapeExampleSchema).max(3).optional(),
  contrastExamples: z.array(memberContrastExampleSchema).max(3).optional(),
  patternsUsed: z.array(voicePatternSchema).min(1).max(4),
  patternsRefused: z.array(voicePatternSchema).min(2),
  tics: z.array(z.string().min(1)).min(3).max(7),
  sampleMessages: memberSampleMessagesSchema,
});

export const memberLifecycleStatusSchema = z.enum(["active", "closed", "quit"]);

export const memberStateSchema = z.object({
  mood: scoreSchema,
  openness: scoreSchema,
  burnout: scoreSchema,
  retention: scoreSchema.default(100),
  currentRequestId: z.string().min(1).optional(),
  recentDateResult: z.string().min(1).optional(),
  status: memberLifecycleStatusSchema.default("active"),
  lastDateShift: z.number().int().min(1).optional(),
});

export const memberTagSchema = z.enum([
  "ordinary_human",
  "non_human",
  "prophecy_averse",
  "privacy_sensitive",
  "grief_sensitive",
  "memory_sensitive",
  "status_sensitive",
  "needs_low_pressure",
  "needs_clear_plan",
  "sincerity_seeking",
  "performative",
  "attention_seeking",
  "avoidant",
  "competitive",
  "ceremony_minded",
  "career_focused",
  "weirdness_native",
  "reality_displaced",
  "anxious_spiral",
  "acquisitive",
]);

export const MEMBER_IDENTITY_TAGS: readonly z.infer<typeof memberTagSchema>[] = [
  "ordinary_human",
  "non_human",
];

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, "expected #RRGGBB or #RRGGBBAA");

// Per-member chat bubble style for the focused dater. Authoring guide and axis
// reference live in app/docs/product/visual-design.tsx under "Per-member chat bubbles".
export const memberChatBubbleBackgroundSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("solid"),
    color: hexColorSchema,
  }),
  z.object({
    kind: z.literal("gradient"),
    angle: z.number().int().min(0).max(360),
    stops: z.array(hexColorSchema).min(2).max(3),
  }),
]);

export const memberChatBubbleShapeSchema = z.enum(["soft", "sharp", "torn", "papercut", "scroll"]);

export const memberChatBubbleTailSchema = z.enum([
  "rounded",
  "sharp",
  "fanged",
  "papercut",
  "none",
]);

export const memberChatBubbleBorderSchema = z.enum([
  "none",
  "hairline",
  "glow",
  "filigree",
  "crackling",
]);

export const memberChatBubbleTextureSchema = z.enum([
  "parchment",
  "glass",
  "ooze",
  "holographic",
  "noise",
]);

export const memberChatBubbleAnimationSchema = z.enum([
  "fade",
  "drift",
  "drip",
  "snap",
  "settle",
  "materialize",
  "shimmer",
  "flicker",
  "type",
  "unfurl",
]);

export const memberChatBubbleFontFamilySchema = z.enum([
  "serif",
  "display",
  "mono",
  "antique",
  "italic-script",
  "eldritch",
]);

export const memberChatBubbleTextColorSchema = z.enum([
  "light",
  "dark",
  "muted-light",
  "muted-dark",
]);

export const memberChatBubbleTextEffectSchema = z.enum(["shadow", "glow", "tight", "loose"]);

export const memberChatBubbleStyleSchema = z.object({
  background: memberChatBubbleBackgroundSchema,
  textColor: memberChatBubbleTextColorSchema,
  shape: memberChatBubbleShapeSchema,
  tail: memberChatBubbleTailSchema.optional(),
  border: memberChatBubbleBorderSchema.optional(),
  glow: z
    .object({
      color: hexColorSchema,
      intensity: z.enum(["soft", "medium", "strong"]),
    })
    .optional(),
  texture: memberChatBubbleTextureSchema.optional(),
  entryAnimation: memberChatBubbleAnimationSchema.optional(),
  fontFamily: memberChatBubbleFontFamilySchema.optional(),
  textEffect: memberChatBubbleTextEffectSchema.optional(),
  accentColor: hexColorSchema.optional(),
});

export const shiftAvailabilityProfileSchema = z.enum([
  "steady",
  "busy_public",
  "career_locked",
  "soft_schedule",
  "formal_calendar",
  "weird_erratic",
]);

export const memberSchema = z
  .object({
    id: memberIdSchema,
    name: z.string().min(1),
    firstName: z.string().min(1),
    characterHeightInInches: z.number().int().min(24).max(108).default(66),
    standeeRenderHeightInInches: z.number().int().min(24).max(108).default(66),
    origin: z.string().min(1),
    species: z.string().min(1),
    dimension: z.string().min(1),
    realityStatus: z.string().min(1),
    bio: z.string().min(1),
    datingProfile: z.string().min(1),
    visualDescription: z.string().min(1).default("Profile photo on file."),
    relationshipNeeds: z.array(z.string().min(1)).min(1),
    preferences: z.array(z.string().min(1)),
    dealbreakers: z.array(z.string().min(1)),
    secrets: z.array(z.string().min(1)),
    tags: z.array(memberTagSchema).min(3).max(5),
    voice: memberVoiceSchema,
    state: memberStateSchema,
    portraits: memberPortraitsSchema,
    chatBubble: memberChatBubbleStyleSchema.optional(),
    shiftAvailabilityProfile: shiftAvailabilityProfileSchema.default("weird_erratic"),
  })
  .superRefine((member, context) => {
    const identityTagCount = member.tags.filter((tag) => MEMBER_IDENTITY_TAGS.includes(tag)).length;

    if (identityTagCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "Members require exactly one identity gameplay tag.",
        path: ["tags"],
      });
    }
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

export const RELATIONSHIP_STATS = relationshipStatSchema.options;

export const scenarioEventKindSchema = z.enum(["ambient", "provocation", "reveal"]);

export const SCENARIO_EVENT_KINDS = scenarioEventKindSchema.options;

export const SCENARIO_EVENTS_PER_KIND = 3;
export const SCENARIO_EVENT_TOTAL = SCENARIO_EVENTS_PER_KIND * SCENARIO_EVENT_KINDS.length;

export const scenarioFlowSchema = z.enum(["conversation", "activity", "pressure", "set_piece"]);

export const scenarioEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: scenarioEventKindSchema,
  pitch: z.string().min(1),
  beat: z.string().min(1),
  directorBeat: z.string().min(1),
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
    cost: z.number().int().min(1).max(50),
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
    flow: scenarioFlowSchema,
    rules: z.array(z.string().min(1)).min(1),
    events: z
      .array(scenarioEventSchema)
      .length(SCENARIO_EVENT_TOTAL)
      .superRefine((events, context) => {
        const counts: Record<z.infer<typeof scenarioEventKindSchema>, number> = {
          ambient: 0,
          provocation: 0,
          reveal: 0,
        };

        for (const event of events) {
          counts[event.kind] += 1;
        }

        for (const kind of SCENARIO_EVENT_KINDS) {
          if (counts[kind] !== SCENARIO_EVENTS_PER_KIND) {
            context.addIssue({
              code: "custom",
              message: `Scenario events require exactly ${SCENARIO_EVENTS_PER_KIND} of kind "${kind}", got ${counts[kind]}.`,
              path: [],
            });
          }
        }
      }),
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
  "positiveOutcomeDates",
  "improvedMembers",
]);

export const companyGoalSchema = z.object({
  id: goalIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  metric: goalMetricSchema,
  target: z.number().int().min(0),
  tags: z.array(z.string().min(1)),
});

export const memberRequestTagSchema = z.enum([
  "normal_date",
  "prophecy_averse",
  "privacy",
  "quiet_date",
  "cosmic",
  "sincerity",
  "career",
  "respect",
  "choice",
  "memory",
  "care",
  "career_fatigue",
  "low_pressure",
  "online_creator",
  "performative",
  "career_intense",
  "decisiveness",
  "deity",
  "advice_giver",
  "cryptid",
  "discretion",
  "saboteur",
  "anxious_rambler",
  "structure",
  "midlife",
  "grounded",
  "tech_illiterate",
  "fae",
  "name_discretion",
  "widower",
  "anti_deference",
  "anti_fraud",
  "challenge",
]);

export const memberRequestSchema = z.object({
  id: z.string().min(1),
  memberId: memberIdSchema,
  text: z.string().min(1),
  moodPenaltyIfIgnored: z.number().int().min(0).max(25),
  tags: z.array(memberRequestTagSchema).min(1),
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

export const pairAgreementStatusSchema = z.enum(["active", "honored", "broken", "retired"]);

export const pairAgreementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(8).max(220),
  status: pairAgreementStatusSchema.default("active"),
  sourceDateSessionId: dateSessionIdSchema.optional(),
  sourceJudgeSnapshotId: z.string().min(1).optional(),
  createdAt: z.string().min(1),
  strainedAt: z.string().min(1).optional(),
  resolvedAt: z.string().min(1).optional(),
});

export const openLoopStatusSchema = z.enum(["open", "resolved", "dropped"]);

export const openLoopSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(8).max(220),
  status: openLoopStatusSchema.default("open"),
  sourceDateSessionId: dateSessionIdSchema.optional(),
  sourceJudgeSnapshotId: z.string().min(1).optional(),
  createdAt: z.string().min(1),
  strainedAt: z.string().min(1).optional(),
  resolvedAt: z.string().min(1).optional(),
});

export const pairLaneStatusSchema = z.enum(["open", "closed"]);

export const pairStateSchema = z.object({
  id: pairIdSchema,
  participantIds: z.tuple([memberIdSchema, memberIdSchema]),
  laneStatus: pairLaneStatusSchema.default("open"),
  stats: pairStatsSchema,
  completedDateIds: z.array(dateSessionIdSchema),
  // Sparse: missing scenario id means zero uses for this pair.
  scenarioUseCounts: z.record(scenarioIdSchema, z.number().int().min(0)),
  agreements: z.array(pairAgreementSchema).default([]),
  openLoops: z.array(openLoopSchema).default([]),
});

// A PairEdge is a persisted PairState in GameSave.pairStates. Only pairs with
// gameplay history (booking history, agreements, open loops, scenario use,
// closure, follow-up, or an authored override) are stored. Untouched pairs are
// expressed as PairProjection objects derived on demand by the relationship
// index, never persisted.
export const pairEdgeSchema = pairStateSchema;

export const pairProjectionSourceSchema = z.enum(["persisted", "projected"]);

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
    sourceEventId: z.string().min(1).optional(),
  }),
  dateMessageBaseSchema.extend({
    kind: z.literal("cupid"),
    speakerId: z.never().optional(),
    targetMemberId: memberIdSchema.optional(),
  }),
  dateMessageBaseSchema.extend({
    kind: z.literal("system"),
    speakerId: z.never().optional(),
  }),
]);

export const memberDateAffectSchema = z.enum([
  "neutral",
  "warming",
  "curious",
  "guarded",
  "overloaded",
  "disappointed",
  "relieved",
  "angry",
  "leaning_in",
]);

export const judgeMemberAffectSchema = z.object({
  affect: memberDateAffectSchema,
  cause: z.string().min(1).max(120),
});

export const characterDateStateSchema = z.object({
  mood: scoreSchema,
  comfort: scoreSchema,
  intent: z.string().min(1),
  affect: memberDateAffectSchema.optional(),
  affectCause: z.string().min(1).max(120).optional(),
});

export const cupidInterventionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(240),
  usedAtTurn: z.number().int().min(0),
  targetMemberId: memberIdSchema,
});

export const endSentimentSchema = z.enum(["positive", "negative"]);

export const dateSessionEndReasonSchema = z.enum([
  "natural_wrap",
  "judge_early_end",
  "player_cut_short",
]);

export const playbackStateSchema = z.enum(["drafting", "paused", "playing", "ended"]);

export const eventDraftSchema = z.object({
  offered: z.array(z.string().min(1)),
  picked: z.array(z.string().min(1)).nullable(),
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

export const judgeAgreementCandidateSchema = z.object({
  text: z.string().min(8).max(220),
});

export const judgeAgreementUpdateSchema = z.object({
  agreementId: z.string().min(1),
  status: pairAgreementStatusSchema.exclude(["active"]),
  note: z.string().min(1).max(220).optional(),
});

export const judgeOpenLoopCandidateSchema = z.object({
  text: z.string().min(8).max(220),
});

export const judgeOpenLoopUpdateSchema = z.object({
  openLoopId: z.string().min(1),
  status: openLoopStatusSchema.exclude(["open"]),
  note: z.string().min(1).max(220).optional(),
});

export const dateEvidenceVectorSchema = z.object({
  warmth: z.number().int().min(-8).max(8).default(0),
  attraction: z.number().int().min(-8).max(8).default(0),
  reciprocity: z.number().int().min(-8).max(8).default(0),
  repair: z.number().int().min(-8).max(8).default(0),
  boundaryRespect: z.number().int().min(-8).max(8).default(0),
  pressure: z.number().int().min(-8).max(8).default(0),
  avoidance: z.number().int().min(-8).max(8).default(0),
  novelty: z.number().int().min(-8).max(8).default(0),
  askProgress: z.number().int().min(-8).max(8).default(0),
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
  endSentiment: endSentimentSchema.nullable().default(null),
  notableMoments: z.array(z.string().min(1)),
  playerSummary: z.string().min(1),
  memoryCandidates: z.array(memoryCandidateSchema),
  usedEvidenceIds: z.array(z.string().min(1)).max(3).default([]),
  agreementCandidates: z.array(judgeAgreementCandidateSchema).max(2).default([]),
  agreementUpdates: z.array(judgeAgreementUpdateSchema).max(3).default([]),
  openLoopCandidates: z.array(judgeOpenLoopCandidateSchema).max(2).default([]),
  openLoopUpdates: z.array(judgeOpenLoopUpdateSchema).max(3).default([]),
  evidenceVector: dateEvidenceVectorSchema.optional(),
  memberAffects: z.record(memberIdSchema, judgeMemberAffectSchema).optional(),
});

export const playerKnowledgeSubjectKindSchema = z.enum(["member", "pair", "scenario"]);

export const playerKnowledgeReadKindSchema = z.enum([
  "profile",
  "comfort",
  "boundary",
  "ask",
  "pair_dynamic",
  "scenario_pressure",
]);

export const playerKnowledgeConfidenceSchema = z.enum(["filed", "confirmed"]);

export const playerKnowledgeSourceSchema = z.enum(["judge", "hard_stop", "final_report"]);

export const playerKnowledgeRecordSchema = z.object({
  id: z.string().min(1),
  subjectKind: playerKnowledgeSubjectKindSchema,
  subjectId: z.string().min(1),
  readKind: playerKnowledgeReadKindSchema,
  readId: z.string().min(1),
  readText: z.string().min(1),
  confidence: playerKnowledgeConfidenceSchema,
  source: playerKnowledgeSourceSchema,
  dateSessionId: dateSessionIdSchema.optional(),
  judgeSnapshotId: z.string().min(1).optional(),
  evidenceText: z.string().min(1).optional(),
  revealedAt: z.string().min(1),
});

export const dateSessionStatusSchema = z.enum(["active", "completed", "ended_early"]);
export const dateRuntimeModeSchema = z.literal("local_ai");

export const followUpActionSchema = z.enum(["pursue", "cool_down", "close"]);

export const matchmakingIntentSchema = z.enum(["comfort", "spark", "surface", "repair", "swing"]);

export const matchmakingIntentOutcomeSchema = z.enum(["supported", "mixed", "unsupported"]);

export const dateFinalReportSchema = z.object({
  id: z.string().min(1),
  dateSessionId: dateSessionIdSchema,
  completedAt: z.string().min(1),
  outcome: z.enum(["second_date", "mixed", "cool_down", "bad_fit", "early_end"]),
  summary: z.string().min(1),
  statSummary: z.string().min(1),
  matchmakingIntent: matchmakingIntentSchema.optional(),
  intentOutcome: matchmakingIntentOutcomeSchema.optional(),
  recommendedFollowUp: followUpActionSchema,
  appliedFollowUp: followUpActionSchema.optional(),
  memoryRecordIds: z.array(memoryIdSchema),
  readyToClose: z.boolean().default(false),
  statChange: z
    .object({
      pair: z.partialRecord(relationshipStatSchema, deltaSchema),
      members: z.record(
        memberIdSchema,
        z.object({
          mood: deltaSchema,
          retention: deltaSchema,
          burnout: deltaSchema,
        }),
      ),
    })
    .optional(),
});

export const memberStateSnapshotSchema = z.object({
  mood: scoreSchema,
  retention: scoreSchema,
  burnout: scoreSchema,
});

export const dateSessionSchema = z.object({
  id: dateSessionIdSchema,
  pairId: pairIdSchema,
  shiftNumber: z.number().int().min(1).optional(),
  scenarioId: scenarioIdSchema,
  focusMemberId: memberIdSchema.optional(),
  focusRequestId: z.string().min(1).optional(),
  turnLimit: z.number().int().min(2).default(DEFAULT_DATE_MESSAGE_LIMIT),
  judgeTurnInterval: z.number().int().min(2).max(12).optional(),
  initialPairStats: pairStatsSchema.optional(),
  initialMemberStates: z.record(memberIdSchema, memberStateSnapshotSchema).optional(),
  currentTurn: z.number().int().min(0),
  dateHealth: scoreSchema,
  status: dateSessionStatusSchema,
  runtimeMode: dateRuntimeModeSchema.default("local_ai"),
  participants: z.tuple([memberIdSchema, memberIdSchema]),
  transcript: z.array(dateMessageSchema),
  privateStateByCharacter: z.record(memberIdSchema, characterDateStateSchema),
  judgeSnapshots: z.array(judgeSnapshotSchema),
  eventDraft: eventDraftSchema,
  eventsTriggered: z.array(z.string().min(1)).default([]),
  playbackState: playbackStateSchema.default("drafting"),
  endSentiment: endSentimentSchema.nullable().default(null),
  endReason: dateSessionEndReasonSchema.nullable().default(null),
  interventions: z.array(cupidInterventionSchema).default([]),
  matchmakingIntent: matchmakingIntentSchema.optional(),
  finalReport: dateFinalReportSchema.optional(),
});

export const DECK_SIZE_MIN = 6;
export const DECK_SIZE_MAX = 12;

export const scenarioDeckSchema = z
  .object({
    cardIds: z.array(scenarioIdSchema),
  })
  .superRefine((deck, context) => {
    const uniqueCardIds = new Set(deck.cardIds);

    if (uniqueCardIds.size !== deck.cardIds.length) {
      context.addIssue({
        code: "custom",
        message: "Scenario deck card ids must be unique.",
        path: ["cardIds"],
      });
    }
  });

export const cardOfferKindSchema = z.enum(["date", "closure"]);

/**
 * A pending post-date card draw awaiting player resolution. Cards here are
 * lifted off the top of the circulating draw pile; resolving the offer moves
 * the taken card into the deck and returns the rest to the pile bottom. Lives
 * on the save so the offer survives reload mid-decision.
 */
export const pendingCardOfferSchema = z
  .object({
    cardIds: z.array(scenarioIdSchema),
    kind: cardOfferKindSchema,
    takeLimit: z.number().int().min(0),
    canShuffle: z.boolean(),
  })
  .superRefine((offer, context) => {
    const uniqueCardIds = new Set(offer.cardIds);

    if (uniqueCardIds.size !== offer.cardIds.length) {
      context.addIssue({
        code: "custom",
        message: "Pending card offer ids must be unique.",
        path: ["cardIds"],
      });
    }
  });

export const budgetReasonKindSchema = z.enum([
  "starter",
  "closure",
  "member_quit",
  "performance_closures",
  "performance_quits",
  "performance_retention",
  "performance_pair_health",
  "performance_pair_friction",
  "performance_request_fulfillment",
]);

export const budgetReasonSchema = z.object({
  kind: budgetReasonKindSchema,
  label: z.string().min(1),
  delta: z.number().int(),
});

export const budgetReviewSchema = z.object({
  shift: z.number().int().min(0),
  previousCap: z.number().int().min(0),
  newCap: z.number().int().min(0),
  reasons: z.array(budgetReasonSchema),
});

export const budgetDiscountOfferKindSchema = z.enum(["request", "closure", "company_goal"]);

export const budgetDiscountOfferSchema = z.object({
  id: z.string().min(1),
  budgetPeriodId: z.string().min(1),
  kind: budgetDiscountOfferKindSchema,
  label: z.string().min(1),
  scenarioTagIds: z.array(scenarioTagSchema),
  scenarioIds: z.array(scenarioIdSchema),
  percentOff: z.union([z.literal(15), z.literal(30), z.literal(50)]),
  startsAtShift: z.number().int().min(0),
  expiresAtReviewShift: z.number().int().min(0),
});

export const activeDateBookingStatusSchema = z.enum(["scenario_selection", "session_active"]);

export const shiftFollowUpReservationSchema = z.object({
  focusMemberId: memberIdSchema,
  partnerMemberId: memberIdSchema,
  sourceDateSessionId: dateSessionIdSchema,
});

export const shiftPartnerSwapSchema = z.object({
  outgoingPartnerMemberId: memberIdSchema,
  incomingPartnerMemberId: memberIdSchema,
  swappedAt: z.string().min(1),
});

export const activeDateBookingSchema = z.object({
  id: z.string().min(1),
  status: activeDateBookingStatusSchema,
  shiftNumber: z.number().int().min(1),
  focusMemberId: memberIdSchema,
  participantIds: z.tuple([memberIdSchema, memberIdSchema]),
  pairId: pairIdSchema,
  deckSnapshot: z.object({
    cardIds: z.array(scenarioIdSchema),
    budgetCap: z.number().int().min(0),
    budgetPeriodId: z.string().min(1),
    effectiveCosts: z.record(scenarioIdSchema, z.number().int().min(0)),
    discountOfferIds: z.array(z.string().min(1)),
  }),
  drawnScenarioIds: z.tuple([scenarioIdSchema, scenarioIdSchema, scenarioIdSchema]),
  committedAt: z.string().min(1),
  matchmakingIntent: matchmakingIntentSchema.optional(),
  dateSessionId: dateSessionIdSchema.optional(),
});

export const goalScoreStatusSchema = z.enum(["met", "missed"]);

export const shiftGoalResultSchema = z.object({
  goalId: goalIdSchema,
  status: goalScoreStatusSchema,
  progress: z.number().int(),
  target: z.number().int(),
  summary: z.string().min(1),
});

export const deckCoverageStatusSchema = z.enum(["served", "missed", "no_draw"]);

export const deckCoverageEntrySchema = z.object({
  focusMemberId: memberIdSchema,
  status: deckCoverageStatusSchema,
  label: z.string().min(1),
});

export const shiftRequestAskOutcomeSchema = z.enum(["covered", "raised", "missed", "ignored"]);

export const shiftReportSchema = z.object({
  id: z.string().min(1),
  shiftId: z.string().min(1),
  completedAt: z.string().min(1),
  skipped: z.boolean().default(false),
  completedDates: z.number().int().min(0),
  earlyEndedDates: z.number().int().min(0),
  ordinaryNonHumanDates: z.number().int().min(0),
  memberMoodDelta: z.number().int(),
  goalResults: z.array(shiftGoalResultSchema),
  // Legacy field retained for back-compat read of old saves. New code writes requestOutcomes.
  ignoredRequestIds: z.array(z.string().min(1)).default([]),
  requestOutcomes: z.record(z.string().min(1), shiftRequestAskOutcomeSchema).default({}),
  offeredScenarioIds: z.array(scenarioIdSchema),
  summary: z.string().min(1),
  hrNote: z.string().min(1).optional(),
  budgetReview: budgetReviewSchema.optional(),
  deckCoverage: z.array(deckCoverageEntrySchema).default([]),
});

export const shiftStateSchema = z.object({
  id: z.string().min(1),
  shiftNumber: z.number().int().min(1),
  status: z.enum(["active", "completed"]),
  dateSlotsTotal: z.number().int().min(1).default(1),
  dateSlotsUsed: z.number().int().min(0),
  featuredMemberIds: z.array(memberIdSchema).default([]),
  availablePartnerMemberIds: z.array(memberIdSchema).default([]),
  followUpReservations: z.array(shiftFollowUpReservationSchema).default([]),
  partnerSwap: shiftPartnerSwapSchema.optional(),
  drawnScenarioIds: z.array(scenarioIdSchema),
  companyGoalIds: z.array(goalIdSchema),
  memberRequestIds: z.array(z.string().min(1)),
  startedAt: z.string().min(1),
  completedAt: z.string().min(1).optional(),
  report: shiftReportSchema.optional(),
  activeBooking: activeDateBookingSchema.optional(),
});

export const aiProviderSchema = z.enum(["ollama", "gateway"]);
export const AI_REASONING_LEVELS = [
  "off",
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;
export const aiReasoningLevelSchema = z.enum(AI_REASONING_LEVELS);

function toGameConfigInput(value: unknown): unknown {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const hasProvider = typeof record.aiProvider === "string";
  const aiProvider = hasProvider ? record.aiProvider : "ollama";
  const defaultEmbeddingModel =
    aiProvider === "ollama" ? DEFAULT_OLLAMA_EMBEDDING_MODEL : DEFAULT_GATEWAY_EMBEDDING_MODEL;
  const defaultChatModel =
    aiProvider === "ollama" ? DEFAULT_OLLAMA_CHAT_MODEL : DEFAULT_GATEWAY_CHAT_MODEL;
  const chatModel = typeof record.chatModel === "string" ? record.chatModel : defaultChatModel;

  return {
    ...record,
    aiProvider,
    chatModel,
    embeddingModel:
      typeof record.embeddingModel === "string" ? record.embeddingModel : defaultEmbeddingModel,
    reasoningLevel: normalizeReasoningLevel(aiProvider, chatModel, record.reasoningLevel),
    ollamaBaseURL:
      typeof record.ollamaBaseURL === "string" ? record.ollamaBaseURL : DEFAULT_OLLAMA_BASE_URL,
    gatewayBaseURL: normalizeGatewayBaseURL(record.gatewayBaseURL),
  };
}

function normalizeReasoningLevel(aiProvider: unknown, chatModel: string, value: unknown): string {
  if (aiProvider !== "gateway") {
    return typeof value === "string" ? value : "off";
  }

  if (chatModel === DEFAULT_GATEWAY_CHAT_MODEL) {
    return "xhigh";
  }

  if (chatModel === DEEPSEEK_V4_PRO_MODEL) {
    return "xhigh";
  }

  if (chatModel === CURRENT_GATEWAY_GEMINI_FLASH_LITE_MODEL) {
    return "medium";
  }

  if (chatModel === "openai/gpt-5.4-nano") {
    return "none";
  }

  if (chatModel === XIAOMI_MIMO_V2_5_MODEL || chatModel === XIAOMI_MIMO_V2_5_PRO_MODEL) {
    return "xhigh";
  }

  return "off";
}

function normalizeGatewayBaseURL(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_GATEWAY_BASE_URL;
  }

  return value.trim().replace(/\/+$/u, "");
}

export const gameConfigSchema = z.preprocess(
  toGameConfigInput,
  z.object({
    aiProvider: aiProviderSchema.default("ollama"),
    chatModel: z.string().min(1).default(DEFAULT_OLLAMA_CHAT_MODEL),
    embeddingModel: z.string().min(1).default(DEFAULT_OLLAMA_EMBEDDING_MODEL),
    reasoningLevel: aiReasoningLevelSchema.default("off"),
    ollamaBaseURL: z.string().min(1).default(DEFAULT_OLLAMA_BASE_URL),
    gatewayBaseURL: z.string().min(1).default(DEFAULT_GATEWAY_BASE_URL),
    aiSetupComplete: z.boolean().default(false),
    defaultDateMessageLimit: z.number().int().min(2).default(DEFAULT_DATE_MESSAGE_LIMIT),
    dateMessageLimitOverride: z.number().int().min(2).optional(),
    shiftDateSlots: z.number().int().min(1).default(1),
  }),
);

export const STARTER_BUDGET_CAP = 120;
export const MIN_BUDGET_CAP = 60;
export const MAX_BUDGET_CAP = 240;

export const tutorialStepIdSchema = z.enum([
  "onboarding.focus.pick",
  "onboarding.focus.expand",
  "onboarding.focus.start",
  "onboarding.deck.pick",
  "onboarding.deck.expand",
  "onboarding.deck.start",
  "planning.layer-nav",
  "planning.shift-brief",
  "planning.focus",
  "planning.partner",
  "planning.intent",
  "planning.commit",
  "planning.scenario",
  "planning.begin",
  "date.draft-events",
  "date.footer.health",
  "date.footer.transport",
  "date.judge-note",
  "date.nudge.compose",
  "date.followup",
  "planning.file-shift",
  "lazy.contextual-rail",
  "lazy.date-book",
  "lazy.datebook.card-offer",
  "lazy.cut-short",
  "lazy.roster.swap-penalty",
  "lazy.datebook.locked",
  "lazy.datebook.repair",
  "lazy.cooldown-block",
  "lazy.closure-ready",
  "lazy.files.first-agreement",
  "member.file.first-open",
  "scenario.file.first-open",
]);

export const TUTORIAL_STEP_IDS = tutorialStepIdSchema.options;

export const tutorialStateSchema = z.object({
  enabled: z.boolean().default(true),
  completedStepIds: z.array(tutorialStepIdSchema).default([]),
  dismissedAt: z.string().min(1).nullable().default(null),
});

export const DEFAULT_TUTORIAL_STATE: z.infer<typeof tutorialStateSchema> = {
  enabled: true,
  completedStepIds: [],
  dismissedAt: null,
};

export const managerQuipCadenceSchema = z.enum(["rare", "regular", "episodic"]);

export const managerQuipHistoryRecordSchema = z.object({
  quipId: z.string().min(1),
  triggerKey: z.string().min(1),
  cadence: managerQuipCadenceSchema,
  surfaceKey: z.string().min(1).optional(),
  shiftNumber: z.number().int().min(1),
  firedAt: z.string().min(1),
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
  playerKnowledge: z.array(playerKnowledgeRecordSchema).default([]),
  focusedMemberIds: z.array(memberIdSchema).max(4).default([]),
  scenarioDeck: scenarioDeckSchema,
  drawPile: z.array(scenarioIdSchema).default([]),
  pendingCardOffer: pendingCardOfferSchema.nullable().default(null),
  closureCount: z.number().int().min(0).default(0),
  softWinSeen: z.boolean().default(false),
  budgetCap: z.number().int().min(0).default(STARTER_BUDGET_CAP),
  budgetPeriodId: z.string().min(1).default("budget-period-shift-0"),
  budgetDiscountOffers: z.array(budgetDiscountOfferSchema).default([]),
  budgetHistory: z.array(budgetReviewSchema).default([]),
  lastBudgetReviewShift: z.number().int().min(0).default(0),
  tutorial: tutorialStateSchema.default(DEFAULT_TUTORIAL_STATE),
  managerQuipHistory: z.array(managerQuipHistoryRecordSchema).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type PortraitAsset = z.infer<typeof portraitAssetSchema>;
export type MemberPortraitSet = z.infer<typeof memberPortraitSetSchema>;
export type MemberPortraitVariant = z.infer<typeof memberPortraitVariantSchema>;
export type MemberPortraits = z.infer<typeof memberPortraitsSchema>;
export type PortraitMood = z.infer<typeof portraitMoodSchema>;
export type VoicePattern = z.infer<typeof voicePatternSchema>;
export type MemberSampleMessages = z.infer<typeof memberSampleMessagesSchema>;
export type MemberConversationShapeTurn = z.infer<typeof memberConversationShapeTurnSchema>;
export type MemberConversationShapeExample = z.infer<typeof memberConversationShapeExampleSchema>;
export type MemberContrastExample = z.infer<typeof memberContrastExampleSchema>;
export type MemberVoice = z.infer<typeof memberVoiceSchema>;
export type MemberState = z.infer<typeof memberStateSchema>;
export type MemberTag = z.infer<typeof memberTagSchema>;
export type MemberChatBubbleStyle = z.infer<typeof memberChatBubbleStyleSchema>;
export type MemberChatBubbleBackground = z.infer<typeof memberChatBubbleBackgroundSchema>;
export type MemberChatBubbleShape = z.infer<typeof memberChatBubbleShapeSchema>;
export type MemberChatBubbleTail = z.infer<typeof memberChatBubbleTailSchema>;
export type MemberChatBubbleBorder = z.infer<typeof memberChatBubbleBorderSchema>;
export type MemberChatBubbleTexture = z.infer<typeof memberChatBubbleTextureSchema>;
export type MemberChatBubbleAnimation = z.infer<typeof memberChatBubbleAnimationSchema>;
export type MemberChatBubbleFontFamily = z.infer<typeof memberChatBubbleFontFamilySchema>;
export type MemberChatBubbleTextColor = z.infer<typeof memberChatBubbleTextColorSchema>;
export type MemberChatBubbleTextEffect = z.infer<typeof memberChatBubbleTextEffectSchema>;
export type Member = z.infer<typeof memberSchema>;
export type ShiftAvailabilityProfile = z.infer<typeof shiftAvailabilityProfileSchema>;
export type ScenarioTag = z.infer<typeof scenarioTagSchema>;
export type RelationshipStat = z.infer<typeof relationshipStatSchema>;
export type ScenarioEventKind = z.infer<typeof scenarioEventKindSchema>;
export type ScenarioFlow = z.infer<typeof scenarioFlowSchema>;
export type ScenarioEvent = z.infer<typeof scenarioEventSchema>;
export type DateScenario = z.infer<typeof dateScenarioSchema>;
export type EventDraft = z.infer<typeof eventDraftSchema>;
export type PlaybackState = z.infer<typeof playbackStateSchema>;
export type EndSentiment = z.infer<typeof endSentimentSchema>;
export type DateSessionEndReason = z.infer<typeof dateSessionEndReasonSchema>;
export type GoalMetric = z.infer<typeof goalMetricSchema>;
export type CompanyGoal = z.infer<typeof companyGoalSchema>;
export type MemberRequestTag = z.infer<typeof memberRequestTagSchema>;
export type MemberRequest = z.infer<typeof memberRequestSchema>;
export type PairStats = z.infer<typeof pairStatsSchema>;
export type PairAgreementStatus = z.infer<typeof pairAgreementStatusSchema>;
export type PairAgreement = z.infer<typeof pairAgreementSchema>;
export type OpenLoopStatus = z.infer<typeof openLoopStatusSchema>;
export type OpenLoop = z.infer<typeof openLoopSchema>;
export type PairLaneStatus = z.infer<typeof pairLaneStatusSchema>;
export type PairState = z.infer<typeof pairStateSchema>;
export type PairEdge = z.infer<typeof pairEdgeSchema>;
export type PairProjectionSource = z.infer<typeof pairProjectionSourceSchema>;
export type PairProjection = Readonly<PairState> & { readonly source: PairProjectionSource };
export type DateMessageKind = z.infer<typeof dateMessageKindSchema>;
export type DateMessage = z.infer<typeof dateMessageSchema>;
export type MemberDateAffect = z.infer<typeof memberDateAffectSchema>;
export type JudgeMemberAffect = z.infer<typeof judgeMemberAffectSchema>;
export type DateEvidenceVector = z.infer<typeof dateEvidenceVectorSchema>;
export type CharacterDateState = z.infer<typeof characterDateStateSchema>;
export type CupidIntervention = z.infer<typeof cupidInterventionSchema>;
export type MemoryScope = z.infer<typeof memoryScopeSchema>;
export type MemoryVisibility = z.infer<typeof memoryVisibilitySchema>;
export type MemoryRecord = z.infer<typeof memoryRecordSchema>;
export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;
export type JudgeSnapshot = z.infer<typeof judgeSnapshotSchema>;
export type JudgeAgreementCandidate = z.infer<typeof judgeAgreementCandidateSchema>;
export type JudgeAgreementUpdate = z.infer<typeof judgeAgreementUpdateSchema>;
export type JudgeOpenLoopCandidate = z.infer<typeof judgeOpenLoopCandidateSchema>;
export type JudgeOpenLoopUpdate = z.infer<typeof judgeOpenLoopUpdateSchema>;
export type DateSessionStatus = z.infer<typeof dateSessionStatusSchema>;
export type DateRuntimeMode = z.infer<typeof dateRuntimeModeSchema>;
export type DateFinalReport = z.infer<typeof dateFinalReportSchema>;
export type DateStatChange = NonNullable<DateFinalReport["statChange"]>;
export type MemberStateSnapshot = z.infer<typeof memberStateSnapshotSchema>;
export type DateSession = z.infer<typeof dateSessionSchema>;
export type FollowUpAction = z.infer<typeof followUpActionSchema>;
export type MatchmakingIntent = z.infer<typeof matchmakingIntentSchema>;
export type MatchmakingIntentOutcome = z.infer<typeof matchmakingIntentOutcomeSchema>;
export type ScenarioDeck = z.infer<typeof scenarioDeckSchema>;
export type CardOfferKind = z.infer<typeof cardOfferKindSchema>;
export type PendingCardOffer = z.infer<typeof pendingCardOfferSchema>;
export type BudgetReasonKind = z.infer<typeof budgetReasonKindSchema>;
export type BudgetReason = z.infer<typeof budgetReasonSchema>;
export type BudgetReview = z.infer<typeof budgetReviewSchema>;
export type BudgetDiscountOfferKind = z.infer<typeof budgetDiscountOfferKindSchema>;
export type BudgetDiscountOffer = z.infer<typeof budgetDiscountOfferSchema>;
export type ActiveDateBookingStatus = z.infer<typeof activeDateBookingStatusSchema>;
export type ActiveDateBooking = z.infer<typeof activeDateBookingSchema>;
export type DeckCoverageStatus = z.infer<typeof deckCoverageStatusSchema>;
export type DeckCoverageEntry = z.infer<typeof deckCoverageEntrySchema>;
export type MemberLifecycleStatus = z.infer<typeof memberLifecycleStatusSchema>;
export type GoalScoreStatus = z.infer<typeof goalScoreStatusSchema>;
export type ShiftGoalResult = z.infer<typeof shiftGoalResultSchema>;
export type ShiftRequestAskOutcome = z.infer<typeof shiftRequestAskOutcomeSchema>;
export type ShiftReport = z.infer<typeof shiftReportSchema>;
export type ShiftState = z.infer<typeof shiftStateSchema>;
export type ShiftFollowUpReservation = z.infer<typeof shiftFollowUpReservationSchema>;
export type ShiftPartnerSwap = z.infer<typeof shiftPartnerSwapSchema>;
export type AiProvider = z.infer<typeof aiProviderSchema>;
export type AiReasoningLevel = z.infer<typeof aiReasoningLevelSchema>;
export type GameConfig = z.infer<typeof gameConfigSchema>;
export type GameSave = z.infer<typeof gameSaveSchema>;
export type TutorialStepId = z.infer<typeof tutorialStepIdSchema>;
export type TutorialState = z.infer<typeof tutorialStateSchema>;
export type ManagerQuipCadence = z.infer<typeof managerQuipCadenceSchema>;
export type ManagerQuipHistoryRecord = z.infer<typeof managerQuipHistoryRecordSchema>;
export type PlayerKnowledgeSubjectKind = z.infer<typeof playerKnowledgeSubjectKindSchema>;
export type PlayerKnowledgeReadKind = z.infer<typeof playerKnowledgeReadKindSchema>;
export type PlayerKnowledgeConfidence = z.infer<typeof playerKnowledgeConfidenceSchema>;
export type PlayerKnowledgeSource = z.infer<typeof playerKnowledgeSourceSchema>;
export type PlayerKnowledgeRecord = z.infer<typeof playerKnowledgeRecordSchema>;
