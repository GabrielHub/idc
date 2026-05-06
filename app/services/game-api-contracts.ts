import { z } from "zod";

import {
  dateRuntimeModeSchema,
  dateSessionIdSchema,
  dateSessionSchema,
  gameConfigSchema,
  gameSaveSchema,
  memberIdSchema,
} from "../domain/game";

export const aiRuntimeSecretsSchema = z
  .object({
    gatewayApiKey: z.string().optional(),
  })
  .optional();

export const gameActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("advanceExchange"),
    save: gameSaveSchema,
    dateSessionId: dateSessionIdSchema,
    runtimeSecrets: aiRuntimeSecretsSchema,
  }),
  z.object({
    type: z.literal("completeDate"),
    save: gameSaveSchema,
    dateSessionId: dateSessionIdSchema,
    runtimeSecrets: aiRuntimeSecretsSchema,
  }),
]);

export const aiTelemetrySchema = z
  .object({
    characterGenerationCount: z.number().int().min(0),
    characterToolCallCount: z.number().int().min(0),
    characterToolResultCount: z.number().int().min(0),
  })
  .nullable();

export const gameActionResponseSchema = z.object({
  save: gameSaveSchema,
  session: dateSessionSchema,
  runtimeMode: dateRuntimeModeSchema,
  warningMessages: z.array(z.string()),
  aiTelemetry: aiTelemetrySchema,
});

export const gameStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("characterStart"),
    speakerId: memberIdSchema,
    speakerName: z.string().min(1),
    sequenceIndex: z.number().int().min(0),
    turnIndex: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("characterDelta"),
    speakerId: memberIdSchema,
    sequenceIndex: z.number().int().min(0),
    turnIndex: z.number().int().min(1),
    textDelta: z.string().min(1),
  }),
  z.object({
    type: z.literal("characterReasoningDelta"),
    speakerId: memberIdSchema,
    sequenceIndex: z.number().int().min(0),
    turnIndex: z.number().int().min(1),
    textDelta: z.string().min(1),
  }),
  z.object({
    type: z.literal("characterDone"),
    speakerId: memberIdSchema,
    sequenceIndex: z.number().int().min(0),
    turnIndex: z.number().int().min(1),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("judgeStart"),
    exchangeIndex: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("complete"),
    response: gameActionResponseSchema,
  }),
  z.object({
    type: z.literal("error"),
    message: z.string().min(1),
  }),
]);

export const gameApiErrorSchema = z.object({
  error: z.string().min(1),
});

export const localAiStatusResponseSchema = z.object({
  status: z.enum(["ready", "unavailable"]),
  ready: z.boolean(),
  message: z.string().min(1),
  details: z.array(z.string().min(1)),
  checkedAt: z.string().min(1),
});

export const aiStatusRequestSchema = z.object({
  config: gameConfigSchema,
  runtimeSecrets: aiRuntimeSecretsSchema,
});

export const aiModelSummarySchema = z.object({
  name: z.string().min(1),
  size: z.number().optional(),
  modifiedAt: z.string().optional(),
  running: z.boolean().optional(),
});

export const aiModelDiscoveryResponseSchema = z.object({
  models: z.array(aiModelSummarySchema),
  chatModels: z.array(aiModelSummarySchema),
  embeddingModels: z.array(aiModelSummarySchema),
  runningModels: z.array(aiModelSummarySchema),
});

export type GameAction = z.infer<typeof gameActionSchema>;
export type GameActionResponse = z.infer<typeof gameActionResponseSchema>;
export type GameStreamEvent = z.infer<typeof gameStreamEventSchema>;
export type LocalAiStatusResponse = z.infer<typeof localAiStatusResponseSchema>;
export type AiStatusRequest = z.infer<typeof aiStatusRequestSchema>;
export type AiModelDiscoveryResponse = z.infer<typeof aiModelDiscoveryResponseSchema>;
