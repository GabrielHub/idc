import {
  DEFAULT_GATEWAY_CHAT_MODEL,
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_CHAT_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  type AiProvider,
  type AiReasoningLevel,
  type GameConfig,
} from "../../domain/game";
import gatewayModelCostsJson from "../../fixtures/gateway-model-costs.json";

export type AiModelCostTier = "low" | "medium" | "high" | "very-high";

export type GatewayModelBenchmark = {
  measuredAt: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedUsd: number;
  elapsedMs: number;
};

export type GatewayModelCost = {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  costTier: AiModelCostTier;
  benchmark: GatewayModelBenchmark | null;
};

export type AiModelOption = {
  id: string;
  label: string;
  provider: AiProvider;
  iconLabel?: string;
  iconTone?: "deepseek" | "google" | "anthropic" | "minimax" | "qwen" | "zai" | "openai";
  recommendedReasoningLevel: AiReasoningLevel;
  reasoningSupported: boolean;
  cost: GatewayModelCost | null;
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

type GatewayModelCostCatalog = {
  models: Record<string, GatewayModelCost | undefined>;
};

const gatewayModelCosts = gatewayModelCostsJson as GatewayModelCostCatalog;

const REASONING_DISABLED_GATEWAY_MODEL_IDS = new Set([
  "anthropic/claude-haiku-4.5",
  "minimax/minimax-m2.7",
  "alibaba/qwen3.5-flash",
  "zai/glm-4.7-flash",
]);

const GATEWAY_IMAGE_INPUT_MODEL_IDS = new Set([
  "google/gemini-3.1-flash-lite",
  "anthropic/claude-haiku-4.5",
  "alibaba/qwen3.5-flash",
  "openai/gpt-5.4-nano",
]);

const OLLAMA_IMAGE_INPUT_MODEL_PREFIXES = ["gemma4"] as const;

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
    iconLabel: "D",
    iconTone: "deepseek",
    recommendedReasoningLevel: "high",
    reasoningSupported: true,
    cost: gatewayModelCost("deepseek/deepseek-v4-flash"),
  },
  {
    id: "google/gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    provider: "gateway",
    iconLabel: "G",
    iconTone: "google",
    recommendedReasoningLevel: "medium",
    reasoningSupported: true,
    cost: gatewayModelCost("google/gemini-3.1-flash-lite"),
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "gateway",
    iconLabel: "C",
    iconTone: "anthropic",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("anthropic/claude-haiku-4.5"),
  },
  {
    id: "minimax/minimax-m2.7",
    label: "MiniMax M2.7",
    provider: "gateway",
    iconLabel: "M",
    iconTone: "minimax",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("minimax/minimax-m2.7"),
  },
  {
    id: "alibaba/qwen3.5-flash",
    label: "Qwen 3.5 Flash",
    provider: "gateway",
    iconLabel: "Q",
    iconTone: "qwen",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("alibaba/qwen3.5-flash"),
  },
  {
    id: "zai/glm-4.7-flash",
    label: "GLM 4.7 Flash",
    provider: "gateway",
    iconLabel: "Z",
    iconTone: "zai",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("zai/glm-4.7-flash"),
  },
  {
    id: "openai/gpt-5.4-nano",
    label: "GPT 5.4 Nano",
    provider: "gateway",
    iconLabel: "O",
    iconTone: "openai",
    recommendedReasoningLevel: "none",
    reasoningSupported: true,
    cost: gatewayModelCost("openai/gpt-5.4-nano"),
  },
];

export const OLLAMA_CHAT_MODEL_OPTIONS: AiModelOption[] = [
  {
    id: "gemma4:e2b",
    label: "Gemma 4 E2B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
    cost: null,
  },
  {
    id: "gemma4:e4b",
    label: "Gemma 4 E4B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
    cost: null,
  },
  {
    id: "gemma4:26b",
    label: "Gemma 4 26B",
    provider: "ollama",
    recommendedReasoningLevel: "off",
    reasoningSupported: true,
    cost: null,
  },
];

export const GPU_RECOMMENDATION_PROFILES: GpuRecommendationProfile[] = [
  {
    id: "compact",
    label: "Compact cards",
    vram: "8GB",
    examples: "RTX 2070, RTX 3070, laptop 4060",
    modelIds: ["gemma4:e2b"],
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
    modelIds: ["gemma4:e4b"],
  },
  {
    id: "large-24gb",
    label: "Large cards",
    vram: "24GB plus",
    examples: "RTX 3090, RTX 4090",
    modelIds: ["gemma4:26b"],
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
      reasoningLevel: "high",
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
  _requestedLevel: AiReasoningLevel,
): AiReasoningLevel {
  return gatewayLockedReasoningLevelForModel(modelId);
}

export function gatewayReasoningSupported(modelId: string): boolean {
  return !REASONING_DISABLED_GATEWAY_MODEL_IDS.has(modelId);
}

export function gatewayLockedReasoningLevelForModel(modelId: string): AiReasoningLevel {
  return gatewayModelOption(modelId)?.recommendedReasoningLevel ?? "off";
}

export function gatewayModelCost(modelId: string): GatewayModelCost | null {
  return gatewayModelCosts.models[modelId] ?? null;
}

export function gatewayModelCostLabel(modelId: string): string {
  const cost = gatewayModelCost(modelId);

  if (cost === null) {
    return "$ ?";
  }

  if (cost.benchmark !== null) {
    return `${costTierGlyph(cost.costTier)} ${formatEstimatedUsd(cost.benchmark.estimatedUsd)}/run`;
  }

  return `${costTierGlyph(cost.costTier)} est.`;
}

export function estimateGatewayRunCostUsd({
  modelId,
  inputTokens,
  outputTokens,
}: {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
}): number | undefined {
  const cost = gatewayModelCost(modelId);

  if (cost === null) {
    return undefined;
  }

  return (
    (inputTokens * cost.inputUsdPerMillionTokens) / 1_000_000 +
    (outputTokens * cost.outputUsdPerMillionTokens) / 1_000_000
  );
}

function costTierGlyph(costTier: AiModelCostTier): "$" | "$$" | "$$$" | "$$$$" {
  if (costTier === "low") {
    return "$";
  }

  if (costTier === "medium") {
    return "$$";
  }

  if (costTier === "high") {
    return "$$$";
  }

  return "$$$$";
}

function formatEstimatedUsd(value: number): string {
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toFixed(2)}`;
}

export function gatewayImageInputSupported(modelId: string): boolean {
  return GATEWAY_IMAGE_INPUT_MODEL_IDS.has(modelId);
}

export function ollamaImageInputSupported(modelId: string): boolean {
  const normalized = normalizeOllamaModelName(modelId);

  return OLLAMA_IMAGE_INPUT_MODEL_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isGatewayChatModel(modelId: string): boolean {
  return GATEWAY_CHAT_MODELS.some((model) => model.id === modelId);
}

export function isRecommendedOllamaChatModel(modelId: string): boolean {
  const normalized = normalizeOllamaModelName(modelId);

  return normalized.startsWith("gemma4");
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
