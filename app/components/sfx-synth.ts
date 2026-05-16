import { getMasterGain, MIN_GAIN } from "./sfx-engine";

const SOFT_ATTACK_SECONDS = 0.012;

const noiseBufferCache = new WeakMap<AudioContext, Map<number, AudioBuffer>>();

type ToneOptions = {
  frequency: number;
  gain: number;
  start: number;
  duration: number;
  type: OscillatorType;
  detuneCents?: number;
  endFrequency?: number;
  filterFrequency?: number;
};

export function playTone(audioContext: AudioContext, options: ToneOptions): void {
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const attackEnd = options.start + Math.min(SOFT_ATTACK_SECONDS, options.duration * 0.35);
  const releaseStart = Math.max(attackEnd + 0.004, options.start + options.duration * 0.62);
  const end = options.start + options.duration;

  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, options.start);
  oscillator.detune.setValueAtTime(options.detuneCents ?? 0, options.start);

  if (options.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
  }

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(options.filterFrequency ?? 2400, options.start);
  filter.Q.setValueAtTime(0.7, options.start);

  gain.gain.setValueAtTime(MIN_GAIN, options.start);
  gain.gain.linearRampToValueAtTime(options.gain, attackEnd);
  gain.gain.exponentialRampToValueAtTime(Math.max(options.gain * 0.35, MIN_GAIN), releaseStart);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, end);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain(audioContext));
  oscillator.start(options.start);
  oscillator.stop(end + 0.02);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    filter.disconnect();
    gain.disconnect();
  });
}

type VibeOptions = {
  frequency: number;
  start: number;
  gain: number;
  duration?: number;
};

export function playVibe(audioContext: AudioContext, options: VibeOptions): void {
  const duration = options.duration ?? 0.13;

  playTone(audioContext, {
    frequency: options.frequency,
    gain: options.gain,
    start: options.start,
    duration,
    type: "sine",
    filterFrequency: 2600,
  });
  playTone(audioContext, {
    frequency: options.frequency * 2,
    gain: options.gain * 0.18,
    start: options.start + 0.004,
    duration: duration * 0.72,
    type: "triangle",
    filterFrequency: 3200,
  });
}

type BassPluckOptions = {
  frequency: number;
  start: number;
  gain: number;
};

export function playBassPluck(audioContext: AudioContext, options: BassPluckOptions): void {
  playTone(audioContext, {
    frequency: options.frequency * 1.06,
    endFrequency: options.frequency,
    gain: options.gain,
    start: options.start,
    duration: 0.16,
    type: "sine",
    filterFrequency: 620,
  });
  playTone(audioContext, {
    frequency: options.frequency * 2,
    gain: options.gain * 0.18,
    start: options.start + 0.006,
    duration: 0.09,
    type: "triangle",
    filterFrequency: 900,
  });
}

type ChordOptions = {
  frequencies: number[];
  start: number;
  gain: number;
  duration: number;
};

export function playChord(audioContext: AudioContext, options: ChordOptions): void {
  options.frequencies.forEach((frequency, index) => {
    playTone(audioContext, {
      frequency,
      gain: options.gain,
      start: options.start + index * 0.012,
      duration: options.duration + index * 0.018,
      type: "sine",
      detuneCents: index % 2 === 0 ? -3 : 3,
      filterFrequency: 2200,
    });
  });
}

type BrushOptions = {
  start: number;
  gain: number;
  duration: number;
  frequency?: number;
};

export function playBrush(audioContext: AudioContext, options: BrushOptions): void {
  playNoise(audioContext, {
    gain: options.gain,
    start: options.start,
    duration: options.duration,
    filterFrequency: options.frequency ?? 1800,
    filterType: "bandpass",
    q: 0.55,
  });
}

type FeltOptions = {
  frequency: number;
  start: number;
  gain: number;
  duration?: number;
};

export function playFelt(audioContext: AudioContext, options: FeltOptions): void {
  const duration = options.duration ?? 0.22;

  playTone(audioContext, {
    frequency: options.frequency,
    gain: options.gain,
    start: options.start,
    duration,
    type: "sine",
    filterFrequency: 2000,
  });
  playTone(audioContext, {
    frequency: options.frequency * 4,
    gain: options.gain * 0.12,
    start: options.start + 0.006,
    duration: duration * 0.5,
    type: "triangle",
    detuneCents: -8,
    filterFrequency: 3200,
  });
}

type MutedOptions = {
  frequency: number;
  start: number;
  gain: number;
  duration?: number;
};

export function playMuted(audioContext: AudioContext, options: MutedOptions): void {
  const duration = options.duration ?? 0.18;

  playTone(audioContext, {
    frequency: options.frequency,
    gain: options.gain,
    start: options.start,
    duration,
    type: "triangle",
    filterFrequency: 1400,
  });
  playTone(audioContext, {
    frequency: options.frequency * 2,
    gain: options.gain * 0.24,
    start: options.start + 0.008,
    duration: duration * 0.7,
    type: "triangle",
    detuneCents: 4,
    filterFrequency: 2200,
  });
}

type ShimmerOptions = {
  frequency: number;
  start: number;
  gain: number;
  duration?: number;
};

export function playShimmer(audioContext: AudioContext, options: ShimmerOptions): void {
  const duration = options.duration ?? 0.42;

  playTone(audioContext, {
    frequency: options.frequency,
    gain: options.gain,
    start: options.start,
    duration,
    type: "sine",
    detuneCents: -12,
    filterFrequency: 4200,
  });
  playTone(audioContext, {
    frequency: options.frequency,
    gain: options.gain * 0.85,
    start: options.start + 0.022,
    duration,
    type: "sine",
    detuneCents: 12,
    filterFrequency: 4200,
  });
  playTone(audioContext, {
    frequency: options.frequency * 1.5,
    gain: options.gain * 0.42,
    start: options.start + 0.05,
    duration: duration * 0.85,
    type: "sine",
    filterFrequency: 5200,
  });
}

type GlideOptions = {
  startFrequency: number;
  endFrequency: number;
  start: number;
  gain: number;
  duration?: number;
};

export function playGlide(audioContext: AudioContext, options: GlideOptions): void {
  playTone(audioContext, {
    frequency: options.startFrequency,
    endFrequency: options.endFrequency,
    gain: options.gain,
    start: options.start,
    duration: options.duration ?? 0.2,
    type: "sine",
    filterFrequency: 2200,
  });
}

type RimOptions = {
  frequency?: number;
  start: number;
  gain: number;
};

export function playRim(audioContext: AudioContext, options: RimOptions): void {
  const frequency = options.frequency ?? 820;
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const end = options.start + 0.05;
  const attackEnd = options.start + 0.002;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, options.start);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, options.start);
  filter.Q.setValueAtTime(2.2, options.start);

  gain.gain.setValueAtTime(MIN_GAIN, options.start);
  gain.gain.linearRampToValueAtTime(options.gain, attackEnd);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, end);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain(audioContext));
  oscillator.start(options.start);
  oscillator.stop(end + 0.01);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    filter.disconnect();
    gain.disconnect();
  });
}

type SweepOptions = {
  start: number;
  gain: number;
  duration?: number;
  fromFrequency?: number;
  toFrequency?: number;
};

export function playSweep(audioContext: AudioContext, options: SweepOptions): void {
  const duration = options.duration ?? 0.2;
  const sampleCount = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = getOrCreateNoiseBuffer(audioContext, sampleCount);
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const end = options.start + duration;
  const attackEnd = options.start + 0.014;
  const fromFrequency = options.fromFrequency ?? 620;
  const toFrequency = options.toFrequency ?? 3200;

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(fromFrequency, options.start);
  filter.frequency.exponentialRampToValueAtTime(toFrequency, end);
  filter.Q.setValueAtTime(0.8, options.start);

  gain.gain.setValueAtTime(MIN_GAIN, options.start);
  gain.gain.linearRampToValueAtTime(options.gain, attackEnd);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, end);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain(audioContext));
  source.start(options.start);
  source.stop(end + 0.01);
  source.addEventListener("ended", () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  });
}

type NoiseOptions = {
  gain: number;
  start: number;
  duration: number;
  filterFrequency: number;
  filterType: BiquadFilterType;
  q?: number;
};

function playNoise(audioContext: AudioContext, options: NoiseOptions): void {
  const sampleCount = Math.max(1, Math.floor(audioContext.sampleRate * options.duration));
  const buffer = getOrCreateNoiseBuffer(audioContext, sampleCount);
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const end = options.start + options.duration;

  filter.type = options.filterType;
  filter.frequency.setValueAtTime(options.filterFrequency, options.start);
  filter.Q.setValueAtTime(options.q ?? 0.7, options.start);
  gain.gain.setValueAtTime(options.gain, options.start);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, end);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain(audioContext));
  source.start(options.start);
  source.stop(end + 0.01);
  source.addEventListener("ended", () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  });
}

function getOrCreateNoiseBuffer(audioContext: AudioContext, sampleCount: number): AudioBuffer {
  let bucket = noiseBufferCache.get(audioContext);

  if (bucket === undefined) {
    bucket = new Map();
    noiseBufferCache.set(audioContext, bucket);
  }

  const cached = bucket.get(sampleCount);

  if (cached !== undefined) {
    return cached;
  }

  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    const fade = 1 - index / sampleCount;
    data[index] = (Math.random() * 2 - 1) * fade;
  }

  bucket.set(sampleCount, buffer);
  return buffer;
}
