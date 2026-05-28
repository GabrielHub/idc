import { isTauri } from "@tauri-apps/api/core";

import {
  DEFAULT_GATEWAY_BASE_URL,
  DEFAULT_OLLAMA_BASE_URL,
  gameConfigSchema,
  type AiProvider,
  type GameConfig,
} from "../domain/game";

export type RuntimePlatform = "tauri" | "browser";

const DESKTOP_OLLAMA_BASE_URLS = [DEFAULT_OLLAMA_BASE_URL, "http://localhost:11434"];
export const BROWSER_DEV_GATEWAY_PROXY_PREFIX = "/__cupid_ai_gateway";
export const BROWSER_DEV_GATEWAY_PROXY_BASE_URL = `${BROWSER_DEV_GATEWAY_PROXY_PREFIX}/v3/ai`;

let cachedRuntimePlatform: RuntimePlatform | undefined;

export function detectRuntimePlatform(): RuntimePlatform {
  if (cachedRuntimePlatform !== undefined) {
    return cachedRuntimePlatform;
  }

  if (typeof window === "undefined") {
    return "browser";
  }

  cachedRuntimePlatform = isTauri() ? "tauri" : "browser";
  return cachedRuntimePlatform;
}

export function resetCachedRuntimePlatformForTesting(): void {
  cachedRuntimePlatform = undefined;
}

export function isTauriRuntime(): boolean {
  return detectRuntimePlatform() === "tauri";
}

export function areAiProviderBaseUrlsLockedForRuntime(): boolean {
  return isTauriRuntime();
}

export function defaultAiProviderForPlatform(platform: RuntimePlatform): AiProvider {
  return platform === "tauri" ? "gateway" : "ollama";
}

export function createDefaultGameConfigForPlatform(platform: RuntimePlatform): GameConfig {
  const config = gameConfigSchema.parse({
    aiProvider: defaultAiProviderForPlatform(platform),
  });

  return platform === "tauri" ? lockAiProviderBaseUrlsForDesktop(config) : config;
}

export function createDefaultGameConfigForRuntime(): GameConfig {
  return createDefaultGameConfigForPlatform(detectRuntimePlatform());
}

export function lockAiProviderBaseUrlsForRuntime(config: GameConfig): GameConfig {
  return areAiProviderBaseUrlsLockedForRuntime()
    ? lockAiProviderBaseUrlsForDesktop(config)
    : config;
}

export function lockAiProviderBaseUrlsForDesktop(config: GameConfig): GameConfig {
  return {
    ...config,
    ollamaBaseURL: normalizeDesktopOllamaBaseUrl(config.ollamaBaseURL),
    gatewayBaseURL: DEFAULT_GATEWAY_BASE_URL,
  };
}

export function normalizeOllamaBaseUrlForRuntime(baseURL: string | undefined): string {
  return areAiProviderBaseUrlsLockedForRuntime()
    ? normalizeDesktopOllamaBaseUrl(baseURL)
    : (baseURL ?? DEFAULT_OLLAMA_BASE_URL);
}

export function normalizeGatewayBaseUrlForRuntime(baseURL: string | undefined): string {
  const normalizedBaseURL = normalizeBaseUrl(baseURL ?? DEFAULT_GATEWAY_BASE_URL);

  if (isTauriRuntime()) {
    return DEFAULT_GATEWAY_BASE_URL;
  }

  return shouldUseBrowserDevGatewayProxy(normalizedBaseURL)
    ? BROWSER_DEV_GATEWAY_PROXY_BASE_URL
    : normalizedBaseURL;
}

export function normalizeDesktopOllamaBaseUrl(baseURL: string | undefined): string {
  const normalizedBaseURL = normalizeBaseUrl(baseURL ?? DEFAULT_OLLAMA_BASE_URL);

  return DESKTOP_OLLAMA_BASE_URLS.includes(normalizedBaseURL)
    ? normalizedBaseURL
    : DEFAULT_OLLAMA_BASE_URL;
}

function normalizeBaseUrl(baseURL: string): string {
  return baseURL.trim().replace(/\/+$/u, "");
}

function shouldUseBrowserDevGatewayProxy(baseURL: string): boolean {
  return baseURL === DEFAULT_GATEWAY_BASE_URL && isBrowserDevelopmentRuntime();
}

function isBrowserDevelopmentRuntime(): boolean {
  return (
    typeof window !== "undefined" && detectRuntimePlatform() === "browser" && import.meta.env.DEV
  );
}
