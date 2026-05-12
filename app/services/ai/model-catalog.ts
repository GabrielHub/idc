import {
  DEFAULT_GATEWAY_CHAT_MODEL,
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_CHAT_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  type AiProvider,
  type AiReasoningLevel,
  type GameConfig,
} from "../../domain/game";

export type AiModelOption = {
  id: string;
  label: string;
  provider: AiProvider;
  recommendedReasoningLevel: AiReasoningLevel;
  reasoningSupported: boolean;
};

export type AiReasoningLevelOption = {
  value: AiReasoningLevel;
  label: string;
};

export type OllamaModelSummary = {
  name: string;
  size?: number;
  modifiedAt?: string;
  running?: boolean;
};

export type GpuRecommendationProfile = {
  id: string;
  label: string;
  vram: string;
  examples: string;
  modelIds: string[];
};

const REASONING_DISABLED_GATEWAY_MODEL_IDS = new Set([
  "anthropic/claude-haiku-4.5",
  "moonshotai/kimi-k2.5",
]);

const GATEWAY_IMAGE_INPUT_MODEL_IDS = new Set([
  "google/gemini-3-flash",
  "google/gemini-3.1-flash-lite-preview",
  "anthropic/claude-haiku-4.5",
  "moonshotai/kimi-k2.5",
]);

export const OLLAMA_REASONING_LEVEL_OPTIONS: AiReasoningLevelOption[] = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const GATEWAY_REASONING_LEVEL_OPTIONS: AiReasoningLevelOption[] = [
  { value: "off", label: "Off" },
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "X-High" },
];

export const GATEWAY_CHAT_MODELS: AiModelOption[] = [
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    provider: "gateway",
    recommendedReasoningLevel: "medium",
    reasoningSupported: true,
  },
  {
    id: "google/gemini-3-flash",
    label: "Gemini 3 Flash",
    provider: "gateway",
    recommendedReasoningLevel: "medium",
    reasoningSupported: true,
  },
  {
    id: "google/gemini-3.1-flash-lite-preview",
    label: "Gemini 3.1 Flash Lite Preview",
    provider: "gateway",
    recommendedReasoningLevel: "medium",
    reasoningSupported: true,
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "gateway",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
  },
  {
    id: "moonshotai/kimi-k2.5",
    label: "Kimi K2.5",
    provider: "gateway",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
  },
];

export const OLLAMA_CHAT_MODEL_OPTIONS: AiModelOption[] = [
  {
    id: "gemma4:e2b",
    label: "Gemma 4 E2B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
  },
  {
    id: "gemma4:e4b",
    label: "Gemma 4 E4B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
  },
  {
    id: "gemma4:26b",
    label: "Gemma 4 26B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
  },
  {
    id: "qwen3.5:4b",
    label: "Qwen 3.5 4B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
  },
  {
    id: "qwen3.5:9b",
    label: "Qwen 3.5 9B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
  },
  {
    id: "qwen3.5:27b",
    label: "Qwen 3.5 27B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
  },
];

export const GPU_RECOMMENDATION_PROFILES: GpuRecommendationProfile[] = [
  {
    id: "compact",
    label: "Compact cards",
    vram: "8GB",
    examples: "RTX 2070, RTX 3070, laptop 4060",
    modelIds: ["gemma4:e2b", "qwen3.5:4b"],
  },
  {
    id: "rtx-3080-10gb",
    label: "RTX 3080",
    vram: "10GB",
    examples: "RTX 3080 10GB",
    modelIds: ["gemma4:e2b", "gemma4:e4b"],
  },
  {
    id: "balanced-12gb",
    label: "12GB cards",
    vram: "12GB",
    examples: "RTX 3060 12GB, RTX 4070",
    modelIds: ["qwen3.5:9b", "gemma4:e4b"],
  },
  {
    id: "large-24gb",
    label: "Large cards",
    vram: "24GB plus",
    examples: "RTX 3090, RTX 4090",
    modelIds: ["gemma4:26b", "qwen3.5:27b"],
  },
];

export function modelDefaultsForProvider(
  provider: AiProvider,
): Pick<GameConfig, "aiProvider" | "chatModel" | "embeddingModel" | "reasoningLevel"> {
  if (provider === "gateway") {
    return {
      aiProvider: provider,
      chatModel: DEFAULT_GATEWAY_CHAT_MODEL,
      embeddingModel: DEFAULT_GATEWAY_EMBEDDING_MODEL,
      reasoningLevel: "medium",
    };
  }

  return {
    aiProvider: provider,
    chatModel: DEFAULT_OLLAMA_CHAT_MODEL,
    embeddingModel: DEFAULT_OLLAMA_EMBEDDING_MODEL,
    reasoningLevel: "off",
  };
}

export function gatewayModelOption(modelId: string): AiModelOption | undefined {
  return GATEWAY_CHAT_MODELS.find((model) => model.id === modelId);
}

export function gatewayReasoningLevelForModel(
  modelId: string,
  requestedLevel: AiReasoningLevel,
): AiReasoningLevel {
  if (!gatewayReasoningSupported(modelId)) {
    return "off";
  }

  return requestedLevel;
}

export function gatewayReasoningSupported(modelId: string): boolean {
  return !REASONING_DISABLED_GATEWAY_MODEL_IDS.has(modelId);
}

export function gatewayImageInputSupported(modelId: string): boolean {
  return GATEWAY_IMAGE_INPUT_MODEL_IDS.has(modelId);
}

export function isGatewayChatModel(modelId: string): boolean {
  return GATEWAY_CHAT_MODELS.some((model) => model.id === modelId);
}

export function isRecommendedOllamaChatModel(modelId: string): boolean {
  const normalized = normalizeOllamaModelName(modelId);

  return normalized.startsWith("gemma4") || normalized.startsWith("qwen3.5");
}

export function isRecommendedOllamaEmbeddingModel(modelId: string): boolean {
  return normalizeOllamaModelName(modelId) === DEFAULT_OLLAMA_EMBEDDING_MODEL;
}

export function recommendedOllamaChatModels(
  models: readonly OllamaModelSummary[],
): OllamaModelSummary[] {
  return models
    .filter((model) => isRecommendedOllamaChatModel(model.name))
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function recommendedOllamaEmbeddings(
  models: readonly OllamaModelSummary[],
): OllamaModelSummary[] {
  return models
    .filter((model) => isRecommendedOllamaEmbeddingModel(model.name))
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function normalizeOllamaModelName(modelId: string): string {
  const normalized = modelId.trim().toLowerCase();

  return normalized.endsWith(":latest") ? normalized.slice(0, -":latest".length) : normalized;
}
