import { z } from "zod";

import {
  dateRuntimeModeSchema,
  dateSessionIdSchema,
  dateSessionSchema,
  gameSaveSchema,
} from "../domain/game";

export const gameActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("advanceExchange"),
    save: gameSaveSchema,
    dateSessionId: dateSessionIdSchema,
  }),
  z.object({
    type: z.literal("completeDate"),
    save: gameSaveSchema,
    dateSessionId: dateSessionIdSchema,
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

export type GameAction = z.infer<typeof gameActionSchema>;
export type GameActionResponse = z.infer<typeof gameActionResponseSchema>;
export type LocalAiStatusResponse = z.infer<typeof localAiStatusResponseSchema>;
