import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __playVoiceClipForTests,
  __resetSharedAudioContextForTests,
  isSfxEnabledByDefault,
} from "./sfx-provider";
import {
  __computeVoiceClipNormalizationGainForTests,
  __setVoiceClipFetchForTests,
} from "./sfx-voice-clip";

describe("SFX provider defaults", () => {
  it("starts enabled in the desktop runtime", () => {
    expect(isSfxEnabledByDefault("tauri")).toBe(true);
  });

  it("starts muted in the browser runtime", () => {
    expect(isSfxEnabledByDefault("browser")).toBe(false);
  });
});

type StubAudioBuffer = {
  duration: number;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
};

type StubBufferSource = {
  buffer: StubAudioBuffer | null;
  start: (when: number) => void;
  stop: (when: number) => void;
  connect: (target: object) => void;
  disconnect: () => void;
  addEventListener: (kind: string, handler: () => void) => void;
};

type StubGainNode = {
  gain: {
    setValueAtTime: (value: number, time: number) => void;
    setTargetAtTime: (value: number, time: number, constant: number) => void;
  };
  connect: (target: object) => void;
  disconnect: () => void;
};

type StubAudioParam = { setValueAtTime: (value: number, time: number) => void };

type StubCompressorNode = {
  threshold: StubAudioParam;
  knee: StubAudioParam;
  ratio: StubAudioParam;
  attack: StubAudioParam;
  release: StubAudioParam;
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
  createDynamicsCompressor: () => StubCompressorNode;
  decodeAudioData: (buffer: ArrayBuffer) => Promise<StubAudioBuffer>;
};

type AudioContextStubResult = {
  startedSources: StubBufferSource[];
  decode: ReturnType<typeof vi.fn>;
};

function buildSampleBuffer(amplitude: number, sampleCount = 4_800): StubAudioBuffer {
  const data = new Float32Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    data[index] = amplitude;
  }
  return {
    duration: 1.5,
    length: sampleCount,
    numberOfChannels: 1,
    sampleRate: 48_000,
    getChannelData: () => data,
  };
}

function installAudioContextStub(amplitude = 0.5): AudioContextStubResult {
  const startedSources: StubBufferSource[] = [];
  const decode = vi.fn(async (_buffer: ArrayBuffer): Promise<StubAudioBuffer> => {
    return buildSampleBuffer(amplitude);
  });

  function buildContext(): StubAudioContext {
    return {
      state: "running",
      currentTime: 0,
      destination: {},
      resume: async () => undefined,
      createGain: () => ({
        gain: {
          setValueAtTime: () => undefined,
          setTargetAtTime: () => undefined,
        },
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
      createDynamicsCompressor: () => ({
        threshold: { setValueAtTime: () => undefined },
        knee: { setValueAtTime: () => undefined },
        ratio: { setValueAtTime: () => undefined },
        attack: { setValueAtTime: () => undefined },
        release: { setValueAtTime: () => undefined },
        connect: () => undefined,
        disconnect: () => undefined,
      }),
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

function makeBuffer(amplitude: number, sampleCount = 4_800, channelCount = 1): AudioBuffer {
  const channels: Float32Array[] = [];
  for (let channel = 0; channel < channelCount; channel += 1) {
    const data = new Float32Array(sampleCount);
    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = amplitude;
    }
    channels.push(data);
  }
  return {
    duration: sampleCount / 48_000,
    length: sampleCount,
    numberOfChannels: channelCount,
    sampleRate: 48_000,
    getChannelData: (channel: number) => channels[channel],
  } as unknown as AudioBuffer;
}

describe("voice clip normalization gain", () => {
  it("returns 1 for an empty buffer", () => {
    const buffer = makeBuffer(0, 0);
    expect(__computeVoiceClipNormalizationGainForTests(buffer)).toBe(1);
  });

  it("returns 1 for a fully silent buffer", () => {
    const buffer = makeBuffer(0);
    expect(__computeVoiceClipNormalizationGainForTests(buffer)).toBe(1);
  });

  it("attenuates a hot clip toward the target RMS", () => {
    const hot = makeBuffer(0.9);
    const gain = __computeVoiceClipNormalizationGainForTests(hot);
    expect(gain).toBeLessThan(1);
    expect(hot.getChannelData(0)[0] * gain).toBeLessThanOrEqual(0.95);
  });

  it("boosts a quiet clip toward the target RMS without exceeding the peak ceiling", () => {
    const quiet = makeBuffer(0.05);
    const gain = __computeVoiceClipNormalizationGainForTests(quiet);
    expect(gain).toBeGreaterThan(1);
    expect(quiet.getChannelData(0)[0] * gain).toBeLessThanOrEqual(0.95);
  });

  it("brings clips of differing loudness toward a common output level", () => {
    const hot = makeBuffer(0.8);
    const soft = makeBuffer(0.2);
    const hotEffective =
      hot.getChannelData(0)[0] * __computeVoiceClipNormalizationGainForTests(hot);
    const softEffective =
      soft.getChannelData(0)[0] * __computeVoiceClipNormalizationGainForTests(soft);
    expect(Math.abs(hotEffective - softEffective)).toBeLessThan(0.15);
  });

  it("caps amplification on near-silent recordings", () => {
    const whisper = makeBuffer(0.005);
    const gain = __computeVoiceClipNormalizationGainForTests(whisper);
    expect(gain).toBeLessThanOrEqual(8);
  });

  it("handles multi-channel buffers without crashing", () => {
    const stereo = makeBuffer(0.4, 4_800, 2);
    const gain = __computeVoiceClipNormalizationGainForTests(stereo);
    expect(gain).toBeGreaterThan(0);
    expect(Number.isFinite(gain)).toBe(true);
  });
});
