import { LocalGameRepository } from "../repositories/local-game-repository";
import { NodeJsonStorageDriver } from "../repositories/node-json-storage.server";
import {
  advanceDateExchangeWithLocalAi,
  completeDateSessionWithLocalAi,
} from "../services/ai-date-engine.server";
import { advanceDateExchange, completeDateSession } from "../services/date-engine";
import {
  gameActionResponseSchema,
  gameActionSchema,
  toDeterministicResponse,
} from "../services/game-api-contracts";
import { errorToMessage } from "../services/utils";

export async function loader() {
  const repository = createServerRepository();
  const save = (await repository.loadGame()) ?? (await repository.resetGame());

  return json({ save });
}

export async function action({ request }: { request: Request }) {
  const repository = createServerRepository();

  try {
    const payload: unknown = await request.json();
    const actionInput = gameActionSchema.parse(payload);

    if (actionInput.runtimeMode === "local_ai") {
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
    await repository.saveGame(result.save);

    return json(toDeterministicResponse(result));
  } catch (error) {
    return json({ error: errorToMessage(error) }, { status: 400 });
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
