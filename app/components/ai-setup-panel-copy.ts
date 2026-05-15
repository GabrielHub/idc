import type { AiProvider } from "../domain/game";

export const OLLAMA_LOCAL_FLOW =
  "Prompts, character data, date transcripts, and retrieved memories stay on this machine and only your Ollama process sees them.";
export const GATEWAY_CLOUD_FLOW =
  "Date prompts, character context, transcripts, and retrieved memories leave this machine through Vercel AI Gateway and go to the selected model provider.";
export const DESKTOP_GATEWAY_KEY_STORAGE =
  "Plaintext file in app local data at secrets/gateway-api-key.txt, outside saves and not in the OS keychain.";
export const BROWSER_GATEWAY_KEY_STORAGE =
  "Browser dev stores the key in localStorage under idc.cupid.aiGatewayKey. This is not the desktop key path.";

export type TrustBoundaryItem = {
  label: string;
  value: string;
};

export function providerTrustBoundaryItems(
  provider: AiProvider,
  isUrlLocked: boolean,
): TrustBoundaryItem[] {
  if (provider === "ollama") {
    return [
      {
        label: "stays local",
        value: OLLAMA_LOCAL_FLOW,
      },
      {
        label: "endpoint",
        value: isUrlLocked
          ? "Desktop is scoped to localhost Ollama."
          : "Browser dev uses the configured Ollama URL.",
      },
      {
        label: "key",
        value: "No Gateway key is used for this route.",
      },
      {
        label: "saves",
        value: "Save files stay local. Cupid does not send telemetry.",
      },
    ];
  }

  return [
    {
      label: "leaves machine",
      value: GATEWAY_CLOUD_FLOW,
    },
    {
      label: "endpoint",
      value: isUrlLocked
        ? "Desktop is scoped to the default Vercel AI Gateway."
        : "Browser dev uses the configured Gateway URL.",
    },
    {
      label: "key",
      value: isUrlLocked ? DESKTOP_GATEWAY_KEY_STORAGE : BROWSER_GATEWAY_KEY_STORAGE,
    },
    {
      label: "saves",
      value: "Save files stay local. Gateway requests still leave the machine by design.",
    },
  ];
}
