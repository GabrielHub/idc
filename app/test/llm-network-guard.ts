import { beforeAll, beforeEach } from "vitest";

const BLOCKED_LLM_HOSTS = new Set(["ai-gateway.vercel.sh"]);
const BLOCKED_LOCAL_LLM_PORTS = new Set(["11434"]);

const nativeFetch = globalThis.fetch.bind(globalThis);

export function installLlmNetworkGuard(): void {
  globalThis.fetch = guardedFetch;
}

async function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  assertNotRealLlmRequest(input);

  return nativeFetch(input, init);
}

export function assertNotRealLlmRequest(input: RequestInfo | URL): void {
  const url = urlFromFetchInput(input);

  if (url === null || !isRealLlmUrl(url)) {
    return;
  }

  throw new Error(
    `Tests must not reach real LLM endpoints. Blocked fetch to ${redactUrl(url)}. Use an injected fake runtime or stub transport.`,
  );
}

function isRealLlmUrl(url: URL): boolean {
  if (BLOCKED_LLM_HOSTS.has(url.hostname)) {
    return true;
  }

  if (!BLOCKED_LOCAL_LLM_PORTS.has(url.port)) {
    return false;
  }

  return (
    url.protocol === "http:" &&
    (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
    url.pathname.startsWith("/api/")
  );
}

function urlFromFetchInput(input: RequestInfo | URL): URL | null {
  const urlText = urlTextFromFetchInput(input);

  if (urlText === null || urlText.startsWith("/")) {
    return null;
  }

  try {
    return new URL(urlText);
  } catch {
    return null;
  }
}

function urlTextFromFetchInput(input: RequestInfo | URL): string | null {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function redactUrl(url: URL): string {
  const redacted = new URL(url.toString());

  redacted.username = "";
  redacted.password = "";
  redacted.search = "";

  return redacted.toString();
}

beforeAll(() => {
  installLlmNetworkGuard();
});

beforeEach(() => {
  installLlmNetworkGuard();
});
