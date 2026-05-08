import type { AiSetupStatus } from "../../components/ai-setup-panel";
import type { GameConfig } from "../../domain/game";
import { errorToMessage } from "../utils";
import { checkAiReadiness } from "./model-service";

export {
  GATEWAY_API_KEY_STORAGE_KEY,
  readStoredGatewayApiKey,
  storeGatewayApiKey,
} from "./gateway-key-store";

export async function requestLocalAiStatus(
  config: GameConfig,
  gatewayApiKey: string,
): Promise<AiSetupStatus> {
  const checkedAt = new Date().toISOString();

  try {
    const readiness = await checkAiReadiness({ ...config, gatewayApiKey });
    const details = [
      `language ${readiness.languageModels.join(", ")}`,
      `embedding ${readiness.embeddingModel} (${readiness.embeddingDimensions})`,
      `provider ${readiness.providerModes.join(", ")}`,
    ];

    return {
      status: "ready",
      message: "AI provider connected. Cupid may book dates.",
      details,
      checkedAt,
    };
  } catch (error) {
    return {
      status: "unavailable",
      message: `AI provider unavailable. ${errorToMessage(error)}`,
      details: [],
      checkedAt,
    };
  }
}
