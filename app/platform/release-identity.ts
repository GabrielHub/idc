// Single source of truth for the runtime app version.
// Vite's `define` in vite.config.ts injects `__APP_VERSION__` from package.json.
// Vitest does not run with `define`, so we fall back to the literal at test time.
const FALLBACK_APP_VERSION = "0.0.0-test";

export const APP_VERSION: string =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : FALLBACK_APP_VERSION;
