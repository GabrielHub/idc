import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __playVoiceClipForTests,
  __resetSharedAudioContextForTests,
  __setVoiceClipFetchForTests,
  isSfxEnabledByDefault,
} from "./sfx-provider";

describe("SFX provider defaults", () => {
  it("starts enabled in the desktop runtime", () => {
    expect(isSfxEnabledByDefault("tauri")).toBe(true);
  });

  it("starts muted in the browser runtime", () => {
    expect(isSfxEnabledByDefault("browser")).toBe(false);
  });
});

type StubAudioBuffer = { duration: number };

type StubBufferSource = {
  buffer: StubAudioBuffer | null;
  start: (when: number) => void;
  stop: (when: number) => void;
  connect: (target: object) => void;
  disconnect: () => void;
  addEventListener: (kind: string, handler: () => void) => void;
};

type StubGainNode = {
  gain: { setValueAtTime: (value: number, time: number) => void };
  connect: (target: object) => void;
  disconnect: () => void;
};

type StubAudioContext = {
  state: "suspended" | "running" | "closed";
  currentTime: number;
  destination: object;
  resume: () => Promise<void>;
  createGain: () => StubGainNode;
  createBufferSource: () => StubBufferSource;
  decodeAudioData: (buffer: ArrayBuffer) => Promise<StubAudioBuffer>;
};

type AudioContextStubResult = {
  startedSources: StubBufferSource[];
  decode: ReturnType<typeof vi.fn>;
};

function installAudioContextStub(): AudioContextStubResult {
  const startedSources: StubBufferSource[] = [];
  const decode = vi.fn(
    async (_buffer: ArrayBuffer): Promise<StubAudioBuffer> => ({
      duration: 1.5,
    }),
  );

  function buildContext(): StubAudioContext {
    return {
      state: "running",
      currentTime: 0,
      destination: {},
      resume: async () => undefined,
      createGain: () => ({
        gain: { setValueAtTime: () => undefined },
        connect: () => undefined,
        disconnect: () => undefined,
      }),
      createBufferSource: () => {
        const source: StubBufferSource = {
          buffer: null,
          start: () => undefined,
          stop: () => undefined,
          connect: () => undefined,
          disconnect: () => undefined,
          addEventListener: () => undefined,
        };
        startedSources.push(source);
        return source;
      },
      decodeAudioData: decode,
    };
  }

  function StubAudioContextCtor(this: StubAudioContext) {
    Object.assign(this, buildContext());
  }
  (StubAudioContextCtor as unknown as { prototype: StubAudioContext }).prototype =
    {} as StubAudioContext;

  const globalWindow = globalThis as unknown as { window: Record<string, unknown> };
  if (globalWindow.window === undefined) {
    globalWindow.window = globalThis as unknown as Record<string, unknown>;
  }
  (globalWindow.window as Record<string, unknown>).AudioContext = StubAudioContextCtor;
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = StubAudioContextCtor;

  return { startedSources, decode };
}

function clearAudioContextStub(): void {
  const globalWindow = globalThis as unknown as { window?: Record<string, unknown> };
  if (globalWindow.window !== undefined) {
    delete globalWindow.window.AudioContext;
  }
  delete (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
}

describe("SFX provider playVoiceClip", () => {
  beforeEach(() => {
    __setVoiceClipFetchForTests(null);
    __resetSharedAudioContextForTests();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    __setVoiceClipFetchForTests(null);
    __resetSharedAudioContextForTests();
    clearAudioContextStub();
    vi.restoreAllMocks();
  });

  it("resolves silently on a 404 without playing or throwing", async () => {
    const { startedSources } = installAudioContextStub();
    const fetcher = vi.fn(async () => ({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    }));
    __setVoiceClipFetchForTests(fetcher);

    const playback = await __playVoiceClipForTests("/assets/manager-quips/missing.mp3");
    const retry = await __playVoiceClipForTests("/assets/manager-quips/missing.mp3");

    expect(playback).toEqual({ played: false, durationMs: 0 });
    expect(retry).toEqual({ played: false, durationMs: 0 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(startedSources).toHaveLength(0);
  });

  it("plays the decoded buffer when the file resolves and reports its duration", async () => {
    const { startedSources, decode } = installAudioContextStub();
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(64),
    }));
    __setVoiceClipFetchForTests(fetcher);

    const playback = await __playVoiceClipForTests("/assets/manager-quips/recorded.mp3");
    const replay = await __playVoiceClipForTests("/assets/manager-quips/recorded.mp3");

    expect(playback.played).toBe(true);
    expect(playback.durationMs).toBe(1500);
    expect(replay.played).toBe(true);
    expect(replay.durationMs).toBe(1500);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("/assets/manager-quips/recorded.mp3", {
      cache: "no-cache",
    });
    expect(decode).toHaveBeenCalledTimes(1);
    expect(startedSources).toHaveLength(2);
  });

  it("resolves silently when fetch throws (network blocked)", async () => {
    const { startedSources } = installAudioContextStub();
    __setVoiceClipFetchForTests(async () => {
      throw new Error("offline");
    });

    const playback = await __playVoiceClipForTests("/assets/manager-quips/blocked.mp3");

    expect(playback).toEqual({ played: false, durationMs: 0 });
    expect(startedSources).toHaveLength(0);
  });
});
