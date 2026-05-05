import { z } from "zod";

import { dateRuntimeModeSchema, dateSessionSchema, gameSaveSchema } from "../domain/game";
import type { DateEngineResult } from "./date-engine";

export const gameActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("advanceExchange"),
    runtimeMode: dateRuntimeModeSchema,
    save: gameSaveSchema,
    dateSessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("completeDate"),
    runtimeMode: dateRuntimeModeSchema,
    save: gameSaveSchema,
    dateSessionId: z.string().min(1),
  }),
]);

export const aiTelemetrySchema = z
  .object({
    characterGenerationCount: z.number().int().min(0),
    characterToolCallCount: z.number().int().min(0),
    characterToolResultCount: z.number().int().min(0),
    deterministicFallbackCount: z.number().int().min(0),
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

export type GameAction = z.infer<typeof gameActionSchema>;
export type GameActionResponse = z.infer<typeof gameActionResponseSchema>;

export function toDeterministicResponse(result: DateEngineResult): GameActionResponse {
  return gameActionResponseSchema.parse({
    save: result.save,
    session: result.session,
    runtimeMode: "deterministic",
    warningMessages: [],
    aiTelemetry: null,
  });
}
