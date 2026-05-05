import type { GameConfig } from "../domain/game";
import { LocalGameRepository } from "../repositories/local-game-repository";
import { NodeJsonStorageDriver } from "../repositories/node-json-storage.server";
import {
  advanceDateExchangeWithLocalAi,
  advanceDateExchangeWithLocalAiStream,
  completeDateSessionWithLocalAi,
  completeDateSessionWithLocalAiStream,
  type LocalAiDateStreamEvent,
  type LocalAiDateEngineResult,
} from "../services/ai-date-engine.server";
import { checkLocalAiReadiness } from "../services/ai/ollama-provider.server";
import {
  type GameActionResponse,
  type GameStreamEvent,
  gameActionResponseSchema,
  gameActionSchema,
  gameStreamEventSchema,
  localAiStatusResponseSchema,
} from "../services/game-api-contracts";
import { errorToMessage } from "../services/utils";

const LOCAL_AI_STATUS_INTENT = "local-ai-status";
const GAME_STREAM_INTENT = "stream";

export async function loader({ request }: { request: Request }) {
  const repository = createServerRepository();
  const save = (await repository.loadGame()) ?? (await repository.resetGame());
  const url = new URL(request.url);

  if (url.searchParams.get("intent") === LOCAL_AI_STATUS_INTENT) {
    return localAiStatusResponse(save.config);
  }

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
    const actionInput = gameActionSchema.parse(payload);

    await repository.saveGame(actionInput.save);
    const result =
      actionInput.type === "advanceExchange"
        ? await advanceDateExchangeWithLocalAi(actionInput.save, repository, {
            dateSessionId: actionInput.dateSessionId,
            config: actionInput.save.config,
          })
        : await completeDateSessionWithLocalAi(actionInput.save, repository, {
            dateSessionId: actionInput.dateSessionId,
            config: actionInput.save.config,
          });

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

        await repository.saveGame(actionInput.save);
        const result =
          actionInput.type === "advanceExchange"
            ? await advanceDateExchangeWithLocalAiStream(
                actionInput.save,
                repository,
                {
                  dateSessionId: actionInput.dateSessionId,
                  config: actionInput.save.config,
                },
                emit,
              )
            : await completeDateSessionWithLocalAiStream(
                actionInput.save,
                repository,
                {
                  dateSessionId: actionInput.dateSessionId,
                  config: actionInput.save.config,
                },
                emit,
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

function toGameActionResponse(result: LocalAiDateEngineResult): GameActionResponse {
  return gameActionResponseSchema.parse({
    save: result.save,
    session: result.session,
    runtimeMode: result.runtimeMode,
    warningMessages: result.warningMessages,
    aiTelemetry: result.aiTelemetry,
  });
}

async function localAiStatusResponse(config: GameConfig): Promise<Response> {
  const checkedAt = new Date().toISOString();

  try {
    const readiness = await checkLocalAiReadiness(config);
    const details = [
      `language ${readiness.languageModels.join(", ")}`,
      `embedding ${readiness.embeddingModel} (${readiness.embeddingDimensions})`,
      `provider ${readiness.providerModes.join(", ")}`,
    ];

    return json(
      localAiStatusResponseSchema.parse({
        status: "ready",
        ready: true,
        message: "Local AI connected. Cupid may book dates.",
        details,
        checkedAt,
      }),
    );
  } catch (error) {
    return json(
      localAiStatusResponseSchema.parse({
        status: "unavailable",
        ready: false,
        message: `Local AI unavailable. ${errorToMessage(error)}`,
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

function json(value: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(value), {
    ...init,
    headers,
  });
}
