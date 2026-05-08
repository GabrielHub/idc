import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

import { isTauriRuntime } from "../../platform/runtime";

export type FetchFn = typeof fetch;

export function selectFetch(): FetchFn {
  if (isTauriRuntime()) {
    return tauriRuntimeFetch;
  }

  return globalThis.fetch.bind(globalThis);
}

export function isDesktopOllamaFetchUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;

    return (
      parsedUrl.protocol === "http:" &&
      (host === "127.0.0.1" || host === "localhost") &&
      parsedUrl.port === "11434" &&
      parsedUrl.pathname.startsWith("/api/")
    );
  } catch {
    return false;
  }
}

async function tauriRuntimeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return tauriFetch(input, init) as Promise<Response>;
}
