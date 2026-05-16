import { getAudioContext, getMasterGain } from "./sfx-engine";

const VOICE_CLIP_GAIN_SCALE = 0.06;

const VOICE_TARGET_RMS = 0.158;
const VOICE_PEAK_CEILING = 0.95;
const VOICE_NORMALIZATION_MAX = 8;
const VOICE_NORMALIZATION_MIN = 0.1;
const VOICE_SILENCE_FLOOR = 0.001;

export type VoiceClipPlayback = {
  played: boolean;
  durationMs: number;
  stop: () => void;
};

export const VOICE_CLIP_SILENT_FALLBACK: VoiceClipPlayback = {
  played: false,
  durationMs: 0,
  stop: () => undefined,
};

type VoiceClipResponse = {
  ok: boolean;
  status: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

type VoiceClipFetch = (path: string, init?: RequestInit) => Promise<VoiceClipResponse>;

type NormalizedClip = {
  buffer: AudioBuffer;
  normalizationGain: number;
};

const voiceClipBufferCache = new Map<string, Promise<NormalizedClip | null>>();
let voiceClipFetch: VoiceClipFetch | null = null;

export function __setVoiceClipFetchForTests(fetcher: VoiceClipFetch | null): void {
  voiceClipFetch = fetcher;
  voiceClipBufferCache.clear();
}

export function __resetVoiceClipCacheForTests(): void {
  voiceClipBufferCache.clear();
}

export function __computeVoiceClipNormalizationGainForTests(buffer: AudioBuffer): number {
  return computeVoiceClipNormalizationGain(buffer);
}

export async function playVoiceClipInternal(path: string): Promise<VoiceClipPlayback> {
  if (typeof window === "undefined" || typeof path !== "string" || path.length === 0) {
    return VOICE_CLIP_SILENT_FALLBACK;
  }

  const audioContext = getAudioContext();

  if (audioContext === null) {
    return VOICE_CLIP_SILENT_FALLBACK;
  }

  const clip = await loadVoiceClip(audioContext, path);

  if (clip === null) {
    return VOICE_CLIP_SILENT_FALLBACK;
  }

  try {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  } catch {
    return VOICE_CLIP_SILENT_FALLBACK;
  }

  if (audioContext.state === "closed") {
    return VOICE_CLIP_SILENT_FALLBACK;
  }

  try {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const startTime = audioContext.currentTime + 0.01;
    const endTime = startTime + clip.buffer.duration;

    source.buffer = clip.buffer;
    gain.gain.setValueAtTime(VOICE_CLIP_GAIN_SCALE * clip.normalizationGain, startTime);
    source.connect(gain);
    gain.connect(getMasterGain(audioContext));
    source.start(startTime);
    source.stop(endTime + 0.05);

    let finished = false;
    const teardown = () => {
      if (finished) return;
      finished = true;
      try {
        source.disconnect();
      } catch {
        // already disconnected
      }
      try {
        gain.disconnect();
      } catch {
        // already disconnected
      }
    };
    const stop = () => {
      if (finished) return;
      try {
        source.stop();
      } catch {
        // already stopped or not yet started
      }
      teardown();
    };
    source.addEventListener("ended", teardown);

    return { played: true, durationMs: Math.round(clip.buffer.duration * 1000), stop };
  } catch {
    return VOICE_CLIP_SILENT_FALLBACK;
  }
}

function loadVoiceClip(audioContext: AudioContext, path: string): Promise<NormalizedClip | null> {
  const cached = voiceClipBufferCache.get(path);

  if (cached !== undefined) {
    return cached;
  }

  const fetched = fetchVoiceClip(audioContext, path).then((clip) => {
    if (clip === null) {
      voiceClipBufferCache.delete(path);
    }
    return clip;
  });
  voiceClipBufferCache.set(path, fetched);
  return fetched;
}

async function fetchVoiceClip(
  audioContext: AudioContext,
  path: string,
): Promise<NormalizedClip | null> {
  const fetcher = voiceClipFetch ?? defaultVoiceClipFetch;

  let response: VoiceClipResponse;
  try {
    response = await fetcher(path, { cache: "no-cache" });
  } catch (error) {
    console.warn(`Manager voice clip request failed: ${path}`, error);
    return null;
  }

  if (!response.ok) {
    if (response.status !== 404) {
      console.warn(`Manager voice clip not available (${response.status}): ${path}`);
    }
    return null;
  }

  try {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    return { buffer, normalizationGain: computeVoiceClipNormalizationGain(buffer) };
  } catch (error) {
    console.warn(`Manager voice clip decode failed: ${path}`, error);
    return null;
  }
}

function computeVoiceClipNormalizationGain(buffer: AudioBuffer): number {
  const channelCount = buffer.numberOfChannels;
  const sampleCount = buffer.length;

  if (channelCount === 0 || sampleCount === 0) {
    return 1;
  }

  if (typeof buffer.getChannelData !== "function") {
    return 1;
  }

  let sumOfSquares = 0;
  let activeSampleCount = 0;
  let peakAmplitude = 0;

  for (let channel = 0; channel < channelCount; channel += 1) {
    const data = buffer.getChannelData(channel);

    for (let index = 0; index < sampleCount; index += 1) {
      const sample = data[index];
      const abs = Math.abs(sample);

      if (abs > peakAmplitude) {
        peakAmplitude = abs;
      }

      if (abs > VOICE_SILENCE_FLOOR) {
        sumOfSquares += sample * sample;
        activeSampleCount += 1;
      }
    }
  }

  if (activeSampleCount === 0 || peakAmplitude === 0) {
    return 1;
  }

  const rms = Math.sqrt(sumOfSquares / activeSampleCount);
  let gain = VOICE_TARGET_RMS / rms;

  if (gain > VOICE_NORMALIZATION_MAX) {
    gain = VOICE_NORMALIZATION_MAX;
  }

  if (peakAmplitude * gain > VOICE_PEAK_CEILING) {
    gain = VOICE_PEAK_CEILING / peakAmplitude;
  }

  if (gain < VOICE_NORMALIZATION_MIN) {
    gain = VOICE_NORMALIZATION_MIN;
  }

  return gain;
}

async function defaultVoiceClipFetch(path: string, init?: RequestInit): Promise<VoiceClipResponse> {
  const response = await fetch(path, init);
  return {
    ok: response.ok,
    status: response.status,
    arrayBuffer: () => response.arrayBuffer(),
  };
}
