import type { AiSetupStatus } from "../../components/ai-setup-panel";
import type { GameConfig } from "../../domain/game";
import {
  gameApiErrorSchema,
  localAiStatusResponseSchema,
  type LocalAiStatusResponse,
} from "../game-api-contracts";

export const LOCAL_AI_STATUS_URL = "/api/game?intent=local-ai-status";
export const GATEWAY_API_KEY_STORAGE_KEY = "idc.cupid.aiGatewayKey";

type RuntimeSecrets = {
  gatewayApiKey: string;
};

export async function requestLocalAiStatus(
  config: GameConfig,
  gatewayApiKey: string,
): Promise<AiSetupStatus> {
  let response: Response;

  try {
    response = await fetch(LOCAL_AI_STATUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config,
        runtimeSecrets: runtimeSecretsFromGatewayKey(gatewayApiKey),
      }),
    });
  } catch (error) {
    return {
      status: "unavailable",
      message:
        error instanceof Error
          ? `AI provider status check failed. ${error.message}`
          : "AI provider status check failed.",
      details: [],
      checkedAt: new Date().toISOString(),
    };
  }

  const payload = await readJsonResponse(response);
  const parsedStatus = localAiStatusResponseSchema.safeParse(payload);

  if (parsedStatus.success) {
    return toAiSetupStatus(parsedStatus.data);
  }

  if (!response.ok) {
    const parsedError = gameApiErrorSchema.safeParse(payload);
    return {
      status: "unavailable",
      message: parsedError.success ? parsedError.data.error : "AI provider status check failed.",
      details: [],
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    status: "unavailable",
    message: "AI provider status response was unreadable.",
    details: [],
    checkedAt: new Date().toISOString(),
  };
}

function toAiSetupStatus(response: LocalAiStatusResponse): AiSetupStatus {
  return {
    status: response.status,
    message: response.message,
    details: response.details,
    checkedAt: response.checkedAt,
  };
}

export function runtimeSecretsFromGatewayKey(gatewayApiKey: string): RuntimeSecrets | undefined {
  const trimmedKey = gatewayApiKey.trim();
  return trimmedKey.length === 0 ? undefined : { gatewayApiKey: trimmedKey };
}

export function readStoredGatewayApiKey(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(GATEWAY_API_KEY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeGatewayApiKey(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      window.localStorage.removeItem(GATEWAY_API_KEY_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(GATEWAY_API_KEY_STORAGE_KEY, trimmed);
  } catch {
    return;
  }
}

export async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
