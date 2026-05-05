import { z } from "zod";

import { dateSessionSchema, gameSaveSchema } from "../domain/game";
import { LocalGameRepository } from "../repositories/local-game-repository";
import { NodeJsonStorageDriver } from "../repositories/node-json-storage.server";
import {
  advanceDateExchange,
  completeDateSession,
  type DateEngineResult,
} from "../services/date-engine";
import {
  advanceDateExchangeWithLocalAi,
  completeDateSessionWithLocalAi,
  type LocalAiDateEngineResult,
} from "../services/ai-date-engine.server";

const runtimeModeSchema = z.enum(["deterministic", "local_ai"]);

const gameActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("advanceExchange"),
    runtimeMode: runtimeModeSchema,
    save: gameSaveSchema,
    dateSessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("completeDate"),
    runtimeMode: runtimeModeSchema,
    save: gameSaveSchema,
    dateSessionId: z.string().min(1),
  }),
]);

const gameActionResponseSchema = z.object({
  save: gameSaveSchema,
  session: dateSessionSchema,
  runtimeMode: runtimeModeSchema,
  warningMessages: z.array(z.string()),
  aiTelemetry: z
    .object({
      characterGenerationCount: z.number().int().min(0),
      characterToolCallCount: z.number().int().min(0),
      characterToolResultCount: z.number().int().min(0),
      deterministicFallbackCount: z.number().int().min(0),
    })
    .nullable(),
});

export async function loader() {
  const repository = createServerRepository();
  const save = (await repository.loadGame()) ?? (await repository.resetGame());

  return json({ save });
}

export async function action({ request }: { request: Request }) {
  try {
    const payload: unknown = await request.json();
    const actionInput = gameActionSchema.parse(payload);

    if (actionInput.runtimeMode === "local_ai") {
      const repository = createServerRepository();
      const result =
        actionInput.type === "advanceExchange"
          ? await runLocalAiAdvance(repository, actionInput.save, actionInput.dateSessionId)
          : await runLocalAiComplete(repository, actionInput.save, actionInput.dateSessionId);

      return json(
        gameActionResponseSchema.parse({
          save: result.save,
          session: result.session,
          runtimeMode: result.runtimeMode,
          warningMessages: result.warningMessages,
          aiTelemetry: result.aiTelemetry,
        }),
      );
    }

    const result =
      actionInput.type === "advanceExchange"
        ? advanceDateExchange(actionInput.save, {
            dateSessionId: actionInput.dateSessionId,
          })
        : completeDateSession(actionInput.save, actionInput.dateSessionId);
    await createServerRepository().saveGame(result.save);

    return json(toDeterministicResponse(result));
  } catch (error) {
    return json({ error: errorToMessage(error) }, { status: 400 });
  }
}

async function runLocalAiAdvance(
  repository: LocalGameRepository,
  save: z.infer<typeof gameSaveSchema>,
  dateSessionId: string,
): Promise<LocalAiDateEngineResult> {
  await repository.saveGame(save);
  return advanceDateExchangeWithLocalAi(save, repository, {
    dateSessionId,
    config: save.config,
  });
}

async function runLocalAiComplete(
  repository: LocalGameRepository,
  save: z.infer<typeof gameSaveSchema>,
  dateSessionId: string,
): Promise<LocalAiDateEngineResult> {
  await repository.saveGame(save);
  return completeDateSessionWithLocalAi(save, repository, {
    dateSessionId,
    config: save.config,
  });
}

function createServerRepository(): LocalGameRepository {
  return new LocalGameRepository(new NodeJsonStorageDriver());
}

function toDeterministicResponse(result: DateEngineResult) {
  return gameActionResponseSchema.parse({
    save: result.save,
    session: result.session,
    runtimeMode: "deterministic",
    warningMessages: [],
    aiTelemetry: null,
  });
}

function json(value: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(value), {
    ...init,
    headers,
  });
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
