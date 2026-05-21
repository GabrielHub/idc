#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const COST_FIXTURE_PATH = resolve(PROJECT_ROOT, "app/fixtures/gateway-model-costs.json");
const ENV_LOCAL_PATH = resolve(PROJECT_ROOT, ".env.local");

main().catch((error) => {
  console.error("Gateway model benchmark failed:", error.stack ?? error.message ?? error);
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadDotEnvLocal();
  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY?.trim();

  if (gatewayApiKey === undefined || gatewayApiKey.length === 0) {
    throw new Error("AI_GATEWAY_API_KEY is required. Set it in the environment or .env.local.");
  }

  const fixture = readCostFixture();
  const gatewayBaseURL = process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v3/ai";
  const server = await createServer({
    configFile: resolve(PROJECT_ROOT, "vite.config.ts"),
    root: PROJECT_ROOT,
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    logLevel: "error",
  });

  try {
    const catalog = await server.ssrLoadModule("/app/services/ai/model-catalog.ts");
    const modelService = await server.ssrLoadModule("/app/services/ai/model-service.ts");
    const fixtures = await server.ssrLoadModule("/app/fixtures/index.ts");
    const measuredAt = new Date().toISOString();
    const benchmark = fixture.benchmark;
    const member = requireFixtureMember(fixtures.starterMembers, benchmark.memberIds[0]);
    const partner = requireFixtureMember(fixtures.starterMembers, benchmark.memberIds[1]);
    const scenario = requireFixtureScenario(fixtures.starterScenarios, benchmark.scenarioId);
    const results = [];

    const requestedModelIds = args.models;
    const models =
      requestedModelIds.length === 0
        ? catalog.GATEWAY_CHAT_MODELS
        : catalog.GATEWAY_CHAT_MODELS.filter((model) => requestedModelIds.includes(model.id));

    if (requestedModelIds.length > 0 && models.length !== requestedModelIds.length) {
      const knownIds = new Set(catalog.GATEWAY_CHAT_MODELS.map((model) => model.id));
      const unknownIds = requestedModelIds.filter((modelId) => !knownIds.has(modelId));

      throw new Error(`Unknown Gateway model id(s): ${unknownIds.join(", ")}`);
    }

    for (const model of models) {
      process.stdout.write(
        `Benchmarking ${model.id} (${model.recommendedReasoningLevel} reasoning)...\n`,
      );
      const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      const startedAt = Date.now();

      try {
        const turns = await runRawDateChatBenchmark({
          modelService,
          model,
          gatewayApiKey,
          gatewayBaseURL,
          member,
          partner,
          scenario,
          turnCount: benchmark.turnCount,
          usage,
        });
        const elapsedMs = Date.now() - startedAt;
        const estimatedUsd =
          catalog.estimateGatewayRunCostUsd({
            modelId: model.id,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
          }) ?? 0;
        const benchmarkResult = {
          measuredAt,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          estimatedUsd: Number(estimatedUsd.toFixed(8)),
          elapsedMs,
        };

        fixture.models[model.id] = {
          ...fixture.models[model.id],
          benchmark: benchmarkResult,
        };
        results.push({ id: model.id, ok: true, benchmark: benchmarkResult, turns });
        process.stdout.write(
          `  ${usage.totalTokens} tokens, estimated $${estimatedUsd.toFixed(6)}\n`,
        );
      } catch (error) {
        results.push({
          id: model.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
        process.stdout.write(
          `  skipped: ${error instanceof Error ? error.message : String(error)}\n`,
        );
      }
    }

    assignRelativeCostTiers(fixture);
    fixture.updatedAt = measuredAt;
    writeFileSync(COST_FIXTURE_PATH, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");

    const successfulRuns = results.filter((result) => result.ok).length;
    process.stdout.write(
      `\nWrote ${successfulRuns}/${results.length} benchmark result(s) to ${relativeFixturePath()}.\n`,
    );
    if (successfulRuns === 0) {
      process.exitCode = 1;
    }
  } finally {
    await server.close();
  }
}

function parseArgs(tokens) {
  const models = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === "--model") {
      const value = tokens[index + 1];

      if (value === undefined) {
        throw new Error("--model requires a model id.");
      }

      models.push(value);
      index += 1;
      continue;
    }

    if (token.startsWith("--model=")) {
      models.push(token.slice("--model=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return { models };
}

function readCostFixture() {
  return JSON.parse(readFileSync(COST_FIXTURE_PATH, "utf8"));
}

async function runRawDateChatBenchmark({
  modelService,
  model,
  gatewayApiKey,
  gatewayBaseURL,
  member,
  partner,
  scenario,
  turnCount,
  usage,
}) {
  const transcript = [];
  const participants = [member, partner];

  for (let index = 0; index < turnCount; index += 1) {
    const speaker = participants[index % participants.length];
    const listener = participants[(index + 1) % participants.length];
    const packet = buildRawDateChatPacket({ speaker, listener, scenario, transcript });
    const result = await modelService.generateCharacterTurn({
      packet,
      config: {
        aiProvider: "gateway",
        chatModel: model.id,
        embeddingModel: "google/gemini-embedding-2",
        gatewayApiKey,
        gatewayBaseURL,
        reasoningLevel: model.recommendedReasoningLevel,
        requestTimeoutMs: 120_000,
      },
      options: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 220,
      },
    });
    const inputTokens = result.usage?.inputTokens ?? result.estimatedPromptTokens ?? 0;
    const outputTokens =
      result.usage?.outputTokens ?? Math.max(1, Math.ceil(result.text.length / 4));
    const totalTokens = result.usage?.totalTokens ?? inputTokens + outputTokens;
    const text = result.text.trim().length > 0 ? result.text.trim() : "[empty reply]";

    usage.inputTokens += inputTokens;
    usage.outputTokens += outputTokens;
    usage.totalTokens += totalTokens;
    transcript.push({
      speakerId: speaker.id,
      speakerName: speaker.name,
      text,
    });
  }

  return transcript;
}

function buildRawDateChatPacket({ speaker, listener, scenario, transcript }) {
  const chatSoFar =
    transcript.length === 0
      ? "No messages yet."
      : transcript.map((turn) => `${turn.speakerName}: ${turn.text}`).join("\n");

  return {
    system: [
      `You are ${speaker.name}.`,
      "Write only the next visible line of a date conversation.",
      "Stay in character, answer naturally, and keep it concise.",
      "Do not include reasoning notes, labels, markdown, or stage directions.",
    ].join("\n"),
    prompt: [
      `Date scenario: ${scenario.title}`,
      scenario.publicBrief.premise,
      scenario.publicBrief.whatBothCharactersKnow,
      "",
      `You are speaking to ${listener.name}.`,
      `Your profile: ${speaker.datingProfile}`,
      `Your voice: ${speaker.voice.register}`,
      `Your needs: ${speaker.relationshipNeeds.join("; ")}`,
      `Your dealbreakers: ${speaker.dealbreakers.join("; ")}`,
      "",
      "Conversation so far:",
      chatSoFar,
      "",
      "Reply with one complete conversational line under 190 characters.",
    ].join("\n"),
  };
}

function requireFixtureMember(members, memberId) {
  const member = members.find((candidate) => candidate.id === memberId);

  if (member === undefined) {
    throw new Error(`Benchmark member not found: ${memberId}`);
  }

  return member;
}

function requireFixtureScenario(scenarios, scenarioId) {
  const scenario = scenarios.find((candidate) => candidate.id === scenarioId);

  if (scenario === undefined) {
    throw new Error(`Benchmark scenario not found: ${scenarioId}`);
  }

  return scenario;
}

function assignRelativeCostTiers(fixture) {
  const benchmarkedModels = Object.entries(fixture.models)
    .filter((entry) => entry[1]?.benchmark !== null)
    .sort((first, second) => first[1].benchmark.estimatedUsd - second[1].benchmark.estimatedUsd);
  const denominator = Math.max(1, benchmarkedModels.length - 1);

  for (const [index, [modelId, modelCost]] of benchmarkedModels.entries()) {
    const percentile = index / denominator;

    fixture.models[modelId] = {
      ...modelCost,
      costTier: relativeCostTier(percentile),
    };
  }
}

function relativeCostTier(percentile) {
  if (percentile <= 0.25) {
    return "low";
  }

  if (percentile <= 0.5) {
    return "medium";
  }

  if (percentile <= 0.75) {
    return "high";
  }

  return "very-high";
}

function loadDotEnvLocal() {
  if (!existsSync(ENV_LOCAL_PATH)) {
    return;
  }

  const lines = readFileSync(ENV_LOCAL_PATH, "utf8").split(/\r?\n/u);
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function relativeFixturePath() {
  return "app/fixtures/gateway-model-costs.json";
}
