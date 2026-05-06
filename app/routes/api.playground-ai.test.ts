import { describe, expect, it } from "vitest";

import { action } from "./api.playground-ai";

describe("playground AI API", () => {
  it("returns a date conversation prompt preview", async () => {
    const response = await action({
      request: jsonRequest({
        mode: "dateConversation",
        action: "preview",
        provider: "ollama",
        model: "gemma4:26b",
        reasoningLevel: "off",
        temperature: 1,
        topP: 0.95,
        topK: 64,
        numCtx: 16384,
        maxOutputTokens: 160,
        memberId: "jenna-pike",
        partnerId: "vhool",
        scenarioId: "temporal-coffee-shop",
        dateHealth: 62,
        spark: 55,
        strain: 24,
        transcriptText: "Vhool: The coffee reversed itself.",
        memoryText: "Jenna remembers soup paperwork.",
        includeCurrentAsk: true,
        turnCount: 2,
        systemOverride: "",
        promptOverride: "",
      }),
    });
    const payload = await response.json();

    expect(response.ok).toBe(true);
    expect(payload.mode).toBe("dateConversation");
    expect(payload.preview.system).toContain("You are");
    expect(payload.preview.prompt).toContain("Temporal Coffee Shop");
    expect(payload.preview.model).toBe("gemma4:26b");
  });

  it("returns member chat preview without mutating chat history", async () => {
    const response = await action({
      request: jsonRequest({
        mode: "memberChat",
        action: "preview",
        provider: "gateway",
        model: "deepseek/deepseek-v4-flash",
        reasoningLevel: "medium",
        temperature: 0.8,
        topP: 0.95,
        topK: 64,
        numCtx: 8192,
        maxOutputTokens: 180,
        memberId: "jenna-pike",
        testerMessage: "What makes a date feel normal?",
        chatMessages: [],
        systemOverride: "",
        promptOverride: "",
      }),
    });
    const payload = await response.json();

    expect(response.ok).toBe(true);
    expect(payload.mode).toBe("memberChat");
    expect(payload.chatMessages).toEqual([]);
    expect(payload.preview.prompt).toContain("Cupid QA is interviewing one member");
    expect(payload.preview.providerMode).toBe("gateway");
  });

  it("applies playground-only prompt overrides in preview payloads", async () => {
    const response = await action({
      request: jsonRequest({
        mode: "memberChat",
        action: "preview",
        provider: "ollama",
        model: "gemma4:e4b",
        reasoningLevel: "off",
        temperature: 0.8,
        topP: 0.95,
        topK: 64,
        numCtx: 8192,
        maxOutputTokens: 180,
        memberId: "jenna-pike",
        testerMessage: "Answer the test question.",
        chatMessages: [],
        systemOverride: "Override system for this playground request only.",
        promptOverride: "Override context for this playground request only.",
      }),
    });
    const payload = await response.json();

    expect(response.ok).toBe(true);
    expect(payload.system).toBe("Override system for this playground request only.");
    expect(payload.prompt).toBe("Override context for this playground request only.");
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/playground-ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
