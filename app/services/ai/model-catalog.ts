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

export type AiModelBrand =
  | "deepseek"
  | "gemini"
  | "claude"
  | "minimax"
  | "qwen"
  | "zhipu"
  | "openai";

export type AiModelOption = {
  id: string;
  label: string;
  provider: AiProvider;
  brand?: AiModelBrand;
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
    brand: "deepseek",
    recommendedReasoningLevel: "xhigh",
    reasoningSupported: true,
    cost: gatewayModelCost("deepseek/deepseek-v4-flash"),
  },
  {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    provider: "gateway",
    brand: "deepseek",
    recommendedReasoningLevel: "xhigh",
    reasoningSupported: true,
    cost: gatewayModelCost("deepseek/deepseek-v4-pro"),
  },
  {
    id: "google/gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    provider: "gateway",
    brand: "gemini",
    recommendedReasoningLevel: "medium",
    reasoningSupported: true,
    cost: gatewayModelCost("google/gemini-3.1-flash-lite"),
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "gateway",
    brand: "claude",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("anthropic/claude-haiku-4.5"),
  },
  {
    id: "minimax/minimax-m2.7",
    label: "MiniMax M2.7",
    provider: "gateway",
    brand: "minimax",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("minimax/minimax-m2.7"),
  },
  {
    id: "alibaba/qwen3.5-flash",
    label: "Qwen 3.5 Flash",
    provider: "gateway",
    brand: "qwen",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("alibaba/qwen3.5-flash"),
  },
  {
    id: "zai/glm-4.7-flash",
    label: "GLM 4.7 Flash",
    provider: "gateway",
    brand: "zhipu",
    recommendedReasoningLevel: "off",
    reasoningSupported: false,
    cost: gatewayModelCost("zai/glm-4.7-flash"),
  },
  {
    id: "openai/gpt-5.4-nano",
    label: "GPT 5.4 Nano",
    provider: "gateway",
    brand: "openai",
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
    id: "vram-8gb",
    label: "8GB cards",
    vram: "8GB",
    examples: "RTX 4060 · RTX 5060 · RTX 3060 (8GB) · RTX 3070",
    modelIds: ["gemma4:e2b"],
  },
  {
    id: "vram-12gb",
    label: "10–12GB cards",
    vram: "10–12GB",
    examples: "RTX 5070 · RTX 4070 · RTX 3060 (12GB) · RTX 3080",
    modelIds: ["gemma4:e2b", "gemma4:e4b"],
  },
  {
    id: "vram-16gb",
    label: "16GB cards",
    vram: "16GB",
    examples: "RTX 5080 · RTX 5070 Ti · RTX 4070 Ti Super · RX 9070 XT · RX 7800 XT",
    modelIds: ["gemma4:e4b"],
  },
  {
    id: "vram-24gb",
    label: "20–24GB cards",
    vram: "20–24GB",
    examples: "RTX 4090 · RTX 3090 · RTX 3090 Ti · RX 7900 XTX",
    modelIds: ["gemma4:26b"],
  },
  {
    id: "vram-32gb",
    label: "32GB+ cards",
    vram: "32GB+",
    examples: "RTX 5090 · Radeon Pro W7900",
    modelIds: ["gemma4:26b"],
  },
  {
    id: "apple-silicon",
    label: "Apple Silicon",
    vram: "Unified memory",
    examples: "M1 · M2 · M3 · M4 (RAM doubles as VRAM)",
    modelIds: ["gemma4:e2b", "gemma4:e4b", "gemma4:26b"],
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
      reasoningLevel: "xhigh",
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
    return "—";
  }

  if (cost.benchmark !== null) {
    return `${formatEstimatedUsd(cost.benchmark.estimatedUsd)}/run`;
  }

  return "est.";
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
