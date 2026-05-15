#!/usr/bin/env node
// Date quality audit pack.
//
// Runs fixed pairs and scenarios through the live AI date engine and flags
// repetition, hidden info leaks, venue monologues, JSON repair, weak judge
// summaries, and overlong turns. The TypeScript audit module lives at
// app/services/date-quality-audit.ts; this script just parses CLI args and
// writes the report.
//
// Run --help for the full usage.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(SCRIPT_PATH), "..");

const EXIT_OK = 0;
const EXIT_FINDINGS = 1;
const EXIT_BAD_ARGS = 2;
const EXIT_NOT_READY = 3;

main().catch((error) => {
  console.error("Audit failed:", error.stack ?? error.message ?? error);
  process.exit(EXIT_FINDINGS);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(EXIT_OK);
  }

  const audit = await loadAuditModule();

  if (args.listPairs) {
    for (const pairId of audit.listKnownPairIds()) {
      process.stdout.write(`${pairId}\n`);
    }
    await audit.close();
    process.exit(EXIT_OK);
  }
  if (args.listScenarios) {
    for (const id of audit.DEFAULT_AUDIT_SCENARIO_IDS) {
      process.stdout.write(`${id}\n`);
    }
    await audit.close();
    process.exit(EXIT_OK);
  }

  const config = resolveConfig(args);

  if (args.listModels) {
    const result = await audit.listAuditOllamaModels(config);
    if (!result.ok) {
      process.stdout.write(
        `Could not reach Ollama at ${result.baseURL}.\n` +
          `Detail: ${result.detail}\n` +
          "Start it with `ollama serve` (install from https://ollama.com).\n",
      );
      await audit.close();
      process.exit(EXIT_NOT_READY);
    }
    writeOllamaInventory(result.inventory);
    await audit.close();
    process.exit(EXIT_OK);
  }

  if (args.check) {
    const preflight = await audit.preflightAuditProvider(config);
    writePreflight(preflight);
    await audit.close();
    process.exit(preflight.ok ? EXIT_OK : EXIT_NOT_READY);
  }

  const cases = resolveCases(audit, args);
  if (cases.length === 0) {
    console.error("No cases to run. Check --pairs and --scenarios.");
    await audit.close();
    process.exit(EXIT_BAD_ARGS);
  }

  if (!args.skipReadiness) {
    process.stdout.write(
      `Pre-flight: probing ${config.aiProvider} (chat: ${config.chatModel ?? "default"}, embedding: ${config.embeddingModel ?? "default"})...\n`,
    );
    const preflight = await audit.preflightAuditProvider(config);
    if (!preflight.ok) {
      writePreflight(preflight);
      process.stdout.write(
        "Skip this probe with --skip-readiness if you have a reason to bypass it.\n",
      );
      await audit.close();
      process.exit(EXIT_NOT_READY);
    }
    process.stdout.write(
      `Pre-flight ok. Chat: ${preflight.chatModel}. Embedding: ${preflight.embeddingModel} (${preflight.embeddingDimensions}d).\n`,
    );
  }

  const totalCases = cases.length;
  process.stdout.write(
    `Running ${totalCases} date${totalCases === 1 ? "" : "s"} via ${config.aiProvider} ` +
      `(chat: ${config.chatModel ?? "default"}, embedding: ${config.embeddingModel ?? "default"}).\n`,
  );

  const start = Date.now();
  const report = await audit.runDateQualityAudit({
    cases,
    config,
    onCaseStart: (auditCase, index) => {
      const label = auditCase.label ?? auditCase.pairId;
      process.stdout.write(
        `\n[${index + 1}/${totalCases}] ${label} on ${auditCase.scenarioId}...\n`,
      );
    },
    onCaseComplete: (caseReport, index) => {
      const findings = caseReport.findings.length;
      const fails = caseReport.findings.filter((finding) => finding.severity === "fail").length;
      process.stdout.write(
        `[${index + 1}/${totalCases}] done in ${formatDuration(caseReport.durationMs)}: ` +
          `${caseReport.turnCount} turns, ${caseReport.exchangeCount} exchanges, ` +
          `${findings} findings (${fails} fail)\n`,
      );
    },
  });
  const totalMs = Date.now() - start;

  const outputDir = resolveOutputDir(args.outputDir, report.startedAt);
  ensureDir(outputDir);
  const jsonPath = resolve(outputDir, "report.json");
  const markdownPath = resolve(outputDir, "report.md");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(markdownPath, audit.formatAuditReportAsMarkdown(report), "utf8");

  process.stdout.write(
    `\nAudit complete in ${formatDuration(totalMs)}. ` +
      `${report.totals.findingCount} findings (${report.totals.failCount} fail, ` +
      `${report.totals.warnCount} warn, ${report.totals.errorCount} engine errors).\n`,
  );
  process.stdout.write(`Report: ${jsonPath}\n`);
  process.stdout.write(`Report: ${markdownPath}\n`);

  await audit.close();
  const hasBlockingIssue = report.totals.failCount > 0 || report.totals.errorCount > 0;
  process.exit(hasBlockingIssue ? EXIT_FINDINGS : EXIT_OK);
}

async function loadAuditModule() {
  const server = await createServer({
    configFile: resolve(PROJECT_ROOT, "vite.config.ts"),
    root: PROJECT_ROOT,
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    logLevel: "error",
  });
  try {
    const auditModule = await server.ssrLoadModule("/app/services/date-quality-audit.ts");
    const casesModule = await server.ssrLoadModule("/app/services/date-quality-audit-cases.ts");
    return {
      runDateQualityAudit: auditModule.runDateQualityAudit,
      formatAuditReportAsMarkdown: auditModule.formatAuditReportAsMarkdown,
      preflightAuditProvider: auditModule.preflightAuditProvider,
      listAuditOllamaModels: auditModule.listAuditOllamaModels,
      buildDefaultAuditCases: casesModule.buildDefaultAuditCases,
      buildAuditCases: casesModule.buildAuditCases,
      buildAuditCasesByIds: casesModule.buildAuditCasesByIds,
      listKnownPairIds: casesModule.listKnownPairIds,
      DEFAULT_AUDIT_SCENARIO_IDS: casesModule.DEFAULT_AUDIT_SCENARIO_IDS,
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

function resolveCases(audit, args) {
  if (args.pairs === undefined && args.scenarios === undefined) {
    return audit.buildDefaultAuditCases();
  }
  const pairIds = args.pairs ?? audit.listKnownPairIds();
  const scenarioIds = args.scenarios ?? audit.DEFAULT_AUDIT_SCENARIO_IDS;
  return audit.buildAuditCasesByIds(pairIds, scenarioIds);
}

function resolveConfig(args) {
  const config = {};
  const provider = args.provider ?? process.env.AUDIT_PROVIDER;
  if (provider !== undefined) config.aiProvider = provider;
  const chatModel = args.chatModel ?? process.env.AUDIT_CHAT_MODEL;
  if (chatModel !== undefined) config.chatModel = chatModel;
  const embeddingModel = args.embeddingModel ?? process.env.AUDIT_EMBEDDING_MODEL;
  if (embeddingModel !== undefined) config.embeddingModel = embeddingModel;
  const ollamaBaseUrl = args.ollamaBaseUrl ?? process.env.OLLAMA_BASE_URL;
  if (ollamaBaseUrl !== undefined) config.ollamaBaseURL = ollamaBaseUrl;
  const gatewayBaseUrl = args.gatewayBaseUrl ?? process.env.AI_GATEWAY_BASE_URL;
  if (gatewayBaseUrl !== undefined) config.gatewayBaseURL = gatewayBaseUrl;
  const gatewayKey = args.gatewayKey ?? process.env.AI_GATEWAY_API_KEY;
  if (gatewayKey !== undefined) config.gatewayApiKey = gatewayKey;
  if (config.aiProvider === undefined) config.aiProvider = "ollama";
  return config;
}

function resolveOutputDir(override, startedAt) {
  if (override !== undefined) {
    return resolve(PROJECT_ROOT, override);
  }
  const stamp = startedAt.replace(/[:.]/g, "-");
  return resolve(PROJECT_ROOT, "audit", "dates", stamp);
}

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function writePreflight(preflight) {
  if (preflight.ok) {
    process.stdout.write(
      `Ready: provider=${preflight.provider}, chat=${preflight.chatModel}, embedding=${preflight.embeddingModel} (${preflight.embeddingDimensions}d)\n`,
    );
    return;
  }
  process.stdout.write(
    `Not ready: provider=${preflight.provider}, reason=${preflight.reason}\n` +
      `Detail: ${preflight.detail}\n` +
      "Remediation:\n",
  );
  for (const step of preflight.remediation) {
    process.stdout.write(`  - ${step}\n`);
  }
}

function writeOllamaInventory(inventory) {
  if (inventory.models.length === 0) {
    process.stdout.write("No Ollama models found. Run `ollama pull <model>` to install one.\n");
    return;
  }
  process.stdout.write("Installed Ollama models:\n");
  for (const model of inventory.models) {
    const tags = [];
    if (model.running) tags.push("running");
    if (inventory.chatModels.some((entry) => entry.name === model.name)) tags.push("chat");
    if (inventory.embeddingModels.some((entry) => entry.name === model.name))
      tags.push("embedding");
    const tagStr = tags.length === 0 ? "" : ` [${tags.join(", ")}]`;
    process.stdout.write(`  - ${model.name}${tagStr}\n`);
  }
  process.stdout.write(
    `\nRecommended chat models present: ${inventory.chatModels.length}. ` +
      `Recommended embedding models present: ${inventory.embeddingModels.length}.\n`,
  );
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--":
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--list-pairs":
        args.listPairs = true;
        break;
      case "--list-scenarios":
        args.listScenarios = true;
        break;
      case "--list-models":
        args.listModels = true;
        break;
      case "--check":
        args.check = true;
        break;
      case "--skip-readiness":
        args.skipReadiness = true;
        break;
      case "--pairs":
        args.pairs = splitList(argv[++index]);
        break;
      case "--scenarios":
        args.scenarios = splitList(argv[++index]);
        break;
      case "--provider":
        args.provider = argv[++index];
        break;
      case "--chat-model":
        args.chatModel = argv[++index];
        break;
      case "--embedding-model":
        args.embeddingModel = argv[++index];
        break;
      case "--gateway-key":
        args.gatewayKey = argv[++index];
        break;
      case "--ollama-base-url":
        args.ollamaBaseUrl = argv[++index];
        break;
      case "--gateway-base-url":
        args.gatewayBaseUrl = argv[++index];
        break;
      case "--output-dir":
        args.outputDir = argv[++index];
        break;
      default:
        throw new Error(`Unknown argument: ${token}. Run with --help for usage.`);
    }
  }
  return args;
}

function splitList(value) {
  if (value === undefined) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}m ${remainder.toFixed(0)}s`;
}

function printHelp() {
  process.stdout.write(
    [
      "Date quality audit pack.",
      "",
      "Usage: node scripts/audit-dates.mjs [options]",
      "       vp run audit:dates -- [options]",
      "",
      "Setup workflows for AI agents:",
      "  1. Verify the provider is reachable before running anything heavy:",
      "       node scripts/audit-dates.mjs --check",
      "  2. See what Ollama models are pulled locally:",
      "       node scripts/audit-dates.mjs --list-models",
      "  3. Run the default 9-date audit (pre-flight runs automatically):",
      "       node scripts/audit-dates.mjs",
      "",
      "Options:",
      "  --check                 Run readiness probe only. Exits 0 if ready, 3 if not.",
      "  --skip-readiness        Skip the automatic pre-flight before the audit.",
      "  --list-models           Print Ollama model inventory and exit.",
      "  --list-pairs            Print built-in pair ids and exit.",
      "  --list-scenarios        Print built-in scenario ids and exit.",
      "  --pairs <ids>           Comma-separated pair ids (see --list-pairs)",
      "  --scenarios <ids>       Comma-separated scenario ids (see --list-scenarios)",
      "  --provider <name>       ollama | gateway (default: ollama)",
      "  --chat-model <id>       Override chat model",
      "  --embedding-model <id>  Override embedding model",
      "  --gateway-key <key>     Gateway API key",
      "  --ollama-base-url <url> Override Ollama base URL",
      "  --gateway-base-url <url> Override Gateway base URL",
      "  --output-dir <path>     Override output directory (default: audit/dates/<ts>)",
      "  --help                  Show this message",
      "",
      "Environment variables (CLI flags override these):",
      "  AUDIT_PROVIDER          ollama | gateway",
      "  AUDIT_CHAT_MODEL        Chat model id",
      "  AUDIT_EMBEDDING_MODEL   Embedding model id",
      "  OLLAMA_BASE_URL         Ollama base URL (default: http://127.0.0.1:11434)",
      "  AI_GATEWAY_API_KEY      Gateway API key",
      "  AI_GATEWAY_BASE_URL     Gateway base URL",
      "",
      "Provider setup:",
      "  Ollama (default, recommended for local dev):",
      "    1. Install from https://ollama.com.",
      "    2. Run `ollama serve` in another terminal.",
      "    3. Pull the default chat model: `ollama pull gemma4:e4b`.",
      "    4. Pull the default embedding model: `ollama pull embeddinggemma`.",
      "    5. Verify with `node scripts/audit-dates.mjs --check`.",
      "",
      "  Gateway (Vercel AI Gateway):",
      "    1. Get an API key from https://ai-gateway.vercel.sh.",
      "    2. Export it: `export AI_GATEWAY_API_KEY=<key>` (or pass --gateway-key).",
      "    3. Run with `--provider gateway`.",
      "    4. Verify with `node scripts/audit-dates.mjs --check --provider gateway`.",
      "",
      "Exit codes:",
      "  0  Audit completed with no fail-severity findings (or readiness check passed).",
      "  1  Audit completed but found fail-severity findings or engine errors.",
      "  2  Bad CLI arguments (no cases to run).",
      "  3  Pre-flight readiness check failed (provider unreachable, key missing,",
      "     or required model not pulled).",
      "",
    ].join("\n"),
  );
}
