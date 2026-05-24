import type { AiProvider } from "../domain/game";

export type RouteSummary = {
  title: string;
  cost: string;
  privacy: string;
};

export function routeSummary(provider: AiProvider): RouteSummary {
  if (provider === "ollama") {
    return {
      title: "On this computer",
      cost: "Free · private",
      privacy: "Date prompts and transcripts stay on this machine.",
    };
  }

  return {
    title: "Cloud",
    cost: "Cents per date",
    privacy: "Date prompts and transcripts leave the machine.",
  };
}

export function dataDestination(provider: AiProvider): string {
  return provider === "ollama"
    ? "Stays on this machine. Only your Ollama process sees it."
    : "Leaves the machine through Vercel AI Gateway to the chosen model.";
}
