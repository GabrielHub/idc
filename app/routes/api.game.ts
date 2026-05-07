import type { GameConfig } from "../domain/game";
import {
  LocalGameRepository,
  readGameConfigFromStorage,
} from "../repositories/local-game-repository";
import { NodeJsonStorageDriver } from "../repositories/node-json-storage.server";
import {
  advanceDateExchangeWithLocalAi,
  advanceDateExchangeWithLocalAiStream,
  completeDateSessionWithLocalAi,
  completeDateSessionWithLocalAiStream,
  type LocalAiDateStreamEvent,
  type LocalAiDateEngineResult,
} from "../services/ai-date-engine.server";
import {
  checkAiReadiness,
  listOllamaModelInventory,
  type AiRuntimeConfig,
} from "../services/ai/model-service.server";
import {
  type GameActionResponse,
  type GameStreamEvent,
  aiModelDiscoveryResponseSchema,
  aiStatusRequestSchema,
  gameActionResponseSchema,
  gameActionSchema,
  gameStreamEventSchema,
  localAiStatusResponseSchema,
} from "../services/game-api-contracts";
import { errorToMessage, jsonResponse as json } from "../services/utils";

const LOCAL_AI_STATUS_INTENT = "local-ai-status";
const AI_MODELS_INTENT = "ai-models";
const GAME_STREAM_INTENT = "stream";
const activeDateActionSessionIds = new Set<string>();

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);

  if (url.searchParams.get("intent") === LOCAL_AI_STATUS_INTENT) {
    return localAiStatusResponse(readServerGameConfig());
  }

  const repository = createServerRepository();
  const save = (await repository.loadGame()) ?? (await repository.resetGame());

  return json({ save });
}

export async function action({ request }: { request: Request }) {
  const repository = createServerRepository();
  const url = new URL(request.url);

  if (url.searchParams.get("intent") === GAME_STREAM_INTENT) {
    return streamGameAction(request, repository);
  }

  try {
    const payload: unknown = await request.json();

    if (url.searchParams.get("intent") === LOCAL_AI_STATUS_INTENT) {
      const input = aiStatusRequestSchema.parse(payload);
      return localAiStatusResponse({
        ...input.config,
        ...input.runtimeSecrets,
      });
    }

    if (url.searchParams.get("intent") === AI_MODELS_INTENT) {
      const input = aiStatusRequestSchema.parse(payload);
      const inventory = await listOllamaModelInventory({
        ollamaBaseURL: input.config.ollamaBaseURL,
      });

      return json(aiModelDiscoveryResponseSchema.parse(inventory));
    }

    const actionInput = gameActionSchema.parse(payload);
    const runtimeConfig = runtimeConfigFromGameAction(actionInput);

    const result = await runExclusiveDateAction(actionInput.dateSessionId, () =>
      actionInput.type === "advanceExchange"
        ? advanceDateExchangeWithLocalAi(actionInput.save, repository, {
            dateSessionId: actionInput.dateSessionId,
            turnCount: actionInput.turnCount,
            config: runtimeConfig,
          })
        : completeDateSessionWithLocalAi(actionInput.save, repository, {
            dateSessionId: actionInput.dateSessionId,
            config: runtimeConfig,
          }),
    );

    return json(toGameActionResponse(result));
  } catch (error) {
    return json({ error: errorToMessage(error) }, { status: 400 });
  }
}

function streamGameAction(request: Request, repository: LocalGameRepository): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: GameStreamEvent) => {
        controller.enqueue(
          encoder.encode(`${JSON.stringify(gameStreamEventSchema.parse(event))}\n`),
        );
      };
      const emit = (event: LocalAiDateStreamEvent) => write(event);

      try {
        const payload: unknown = await request.json();
        const actionInput = gameActionSchema.parse(payload);
        const runtimeConfig = runtimeConfigFromGameAction(actionInput);

        const result = await runExclusiveDateAction(actionInput.dateSessionId, () =>
          actionInput.type === "advanceExchange"
            ? advanceDateExchangeWithLocalAiStream(
                actionInput.save,
                repository,
                {
                  dateSessionId: actionInput.dateSessionId,
                  turnCount: actionInput.turnCount,
                  config: runtimeConfig,
                },
                emit,
              )
            : completeDateSessionWithLocalAiStream(
                actionInput.save,
                repository,
                {
                  dateSessionId: actionInput.dateSessionId,
                  config: runtimeConfig,
                },
                emit,
              ),
        );

        write({
          type: "complete",
          response: toGameActionResponse(result),
        });
      } catch (error) {
        write({
          type: "error",
          message: errorToMessage(error),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

async function runExclusiveDateAction<TResult>(
  dateSessionId: string,
  action: () => Promise<TResult>,
): Promise<TResult> {
  if (activeDateActionSessionIds.has(dateSessionId)) {
    throw new Error("A date action is already in flight. Wait for Cupid to file it.");
  }

  activeDateActionSessionIds.add(dateSessionId);

  try {
    return await action();
  } finally {
    activeDateActionSessionIds.delete(dateSessionId);
  }
}

function toGameActionResponse(result: LocalAiDateEngineResult): GameActionResponse {
  return gameActionResponseSchema.parse({
    save: result.save,
    session: result.session,
    runtimeMode: result.runtimeMode,
    warningMessages: result.warningMessages,
    aiTelemetry: result.aiTelemetry,
  });
}

async function localAiStatusResponse(config: Partial<AiRuntimeConfig>): Promise<Response> {
  const checkedAt = new Date().toISOString();

  try {
    const readiness = await checkAiReadiness(config);
    const details = [
      `language ${readiness.languageModels.join(", ")}`,
      `embedding ${readiness.embeddingModel} (${readiness.embeddingDimensions})`,
      `provider ${readiness.providerModes.join(", ")}`,
    ];

    return json(
      localAiStatusResponseSchema.parse({
        status: "ready",
        ready: true,
        message: "AI provider connected. Cupid may book dates.",
        details,
        checkedAt,
      }),
    );
  } catch (error) {
    return json(
      localAiStatusResponseSchema.parse({
        status: "unavailable",
        ready: false,
        message: `AI provider unavailable. ${errorToMessage(error)}`,
        details: [],
        checkedAt,
      }),
      { status: 503 },
    );
  }
}

function createServerRepository(): LocalGameRepository {
  return new LocalGameRepository(new NodeJsonStorageDriver());
}

function readServerGameConfig(): GameConfig {
  return readGameConfigFromStorage(new NodeJsonStorageDriver());
}

function runtimeConfigFromGameAction(actionInput: {
  save: { config: GameConfig };
  runtimeSecrets?: { gatewayApiKey?: string };
}): Partial<AiRuntimeConfig> {
  return {
    ...actionInput.save.config,
    ...actionInput.runtimeSecrets,
  };
}
