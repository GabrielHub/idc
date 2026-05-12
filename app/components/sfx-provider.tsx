import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { detectRuntimePlatform, type RuntimePlatform } from "../platform/runtime";

export type SfxCue =
  | "alert"
  | "click"
  | "danger"
  | "dismiss"
  | "menu"
  | "message"
  | "primary"
  | "stamp"
  | "success"
  | "toggle";

type SfxContextValue = {
  isEnabled: boolean;
  setEnabled: (isEnabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  setDateAmbientActive: (isActive: boolean) => void;
  play: (cue: SfxCue) => void;
};

const DATE_AMBIENT_URL = "/assets/audio/date-ambient-jazz.mp3";
const VOLUME_STORAGE_KEY = "idc.cupid.sfx.volume";
const DEFAULT_VOLUME = 0.6;
const MIN_GAIN = 0.0001;
const DATE_AMBIENT_GAIN_SCALE = 0.08;
const DATE_AMBIENT_FADE_SECONDS = 8;
const DATE_AMBIENT_LOOP_CROSSFADE_SECONDS = 8;
const DATE_AMBIENT_START_DELAY_SECONDS = 0.04;
const DATE_AMBIENT_LOOKAHEAD_SECONDS = 2;
const DATE_AMBIENT_SCHEDULER_INTERVAL_MS = 500;
const CUE_GAIN_SCALE = 30;
const VOLUME_RAMP_TIME_CONSTANT = 0.02;
const SOFT_ATTACK_SECONDS = 0.012;
const SWING_SHORT_SECONDS = 0.052;
const SWING_LONG_SECONDS = 0.086;

let sharedAudioContext: AudioContext | null = null;
let currentMasterVolume = DEFAULT_VOLUME;
let currentMasterMuted = true;
const noiseBufferCache = new WeakMap<AudioContext, Map<number, AudioBuffer>>();
const masterGainCache = new WeakMap<AudioContext, GainNode>();
const dateAmbientLoopCache = new WeakMap<AudioContext, DateAmbientLoop>();

const FALLBACK_SFX_CONTEXT: SfxContextValue = {
  isEnabled: true,
  setEnabled: () => undefined,
  volume: DEFAULT_VOLUME,
  setVolume: () => undefined,
  setDateAmbientActive: () => undefined,
  play: () => undefined,
};

const SfxContext = createContext<SfxContextValue>(FALLBACK_SFX_CONTEXT);

export function SfxProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabledState] = useState(() =>
    isSfxEnabledByDefault(detectRuntimePlatform()),
  );
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [dateAmbientActive, setDateAmbientActive] = useState(false);
  const isEnabledRef = useRef(isEnabled);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    const storedVolume = readStoredSfxVolume();
    setVolumeState(storedVolume);
    applyMasterGain(storedVolume, !isEnabledRef.current);
  }, []);

  useEffect(() => {
    applyMasterGain(volume, !isEnabled);
  }, [isEnabled, volume]);

  useEffect(() => {
    if (!dateAmbientActive || !isEnabled || volume <= 0) {
      readDateAmbientLoop()?.fadeOut({ immediate: !isEnabled || volume <= 0 });
      return;
    }

    const audioContext = getAudioContext();

    if (audioContext === null) {
      return;
    }

    void getDateAmbientLoop(audioContext)
      .fadeIn(volume)
      .catch(() => undefined);
  }, [dateAmbientActive, isEnabled, volume]);

  useEffect(() => {
    return () => readDateAmbientLoop()?.fadeOut({ immediate: true });
  }, []);

  const play = useCallback((cue: SfxCue) => {
    if (!isEnabledRef.current) {
      return;
    }

    playSfxCue(cue);
  }, []);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setIsEnabledState(nextEnabled);
    isEnabledRef.current = nextEnabled;

    if (nextEnabled) {
      playSfxCue("success");
    }
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const clamped = clampVolume(nextVolume);
    setVolumeState(clamped);
    writeStoredSfxVolume(clamped);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const cue = cueFromPointerTarget(event.target);

      if (cue !== null) {
        playSfxCue(cue);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isEnabled]);

  const value = useMemo<SfxContextValue>(
    () => ({
      isEnabled,
      setEnabled,
      volume,
      setVolume,
      setDateAmbientActive,
      play,
    }),
    [isEnabled, play, setDateAmbientActive, setEnabled, setVolume, volume],
  );

  return <SfxContext.Provider value={value}>{children}</SfxContext.Provider>;
}

export function useSfx(): SfxContextValue {
  return useContext(SfxContext);
}

export function isSfxEnabledByDefault(platform: RuntimePlatform): boolean {
  return platform === "tauri";
}

function readStoredSfxVolume(): number {
  if (typeof window === "undefined") {
    return DEFAULT_VOLUME;
  }

  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);

    if (raw === null) {
      return DEFAULT_VOLUME;
    }

    const parsed = Number.parseFloat(raw);

    if (!Number.isFinite(parsed)) {
      return DEFAULT_VOLUME;
    }

    return clampVolume(parsed);
  } catch {
    return DEFAULT_VOLUME;
  }
}

function writeStoredSfxVolume(volume: number): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, clampVolume(volume).toFixed(3));
  } catch {
    return;
  }
}

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.max(0, Math.min(1, volume));
}

function perceptualGain(volume: number): number {
  const clamped = clampVolume(volume);
  return clamped * clamped;
}

function cueFromPointerTarget(target: EventTarget | null): SfxCue | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const element = target.closest(
    "button, [role='button'], [role='menuitem'], [role='menuitemcheckbox'], a[href], summary, [data-sfx]",
  );

  if (!(element instanceof HTMLElement) || !elementCanPlaySfx(element)) {
    return null;
  }

  const declaredCue = parseSfxCue(element.dataset.sfx);

  if (declaredCue !== null) {
    return declaredCue;
  }

  if (element.getAttribute("role") === "menuitem") {
    return "menu";
  }

  if (element.getAttribute("role") === "menuitemcheckbox") {
    return "toggle";
  }

  if (element.getAttribute("aria-pressed") !== null) {
    return "toggle";
  }

  return "click";
}

function elementCanPlaySfx(element: HTMLElement): boolean {
  if (element.dataset.sfx === "none") {
    return false;
  }

  if (element.matches(":disabled")) {
    return false;
  }

  if (element.getAttribute("aria-disabled") === "true") {
    return false;
  }

  return element.closest("fieldset:disabled") === null;
}

function parseSfxCue(value: string | undefined): SfxCue | null {
  switch (value) {
    case "alert":
    case "click":
    case "danger":
    case "dismiss":
    case "menu":
    case "message":
    case "primary":
    case "stamp":
    case "success":
    case "toggle":
      return value;
    default:
      return null;
  }
}

function playSfxCue(cue: SfxCue): void {
  const audioContext = getAudioContext();

  if (audioContext === null) {
    return;
  }

  void playSfxCueInContext(audioContext, cue).catch(() => undefined);
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || window.AudioContext === undefined) {
    return null;
  }

  if (sharedAudioContext?.state === "closed") {
    sharedAudioContext = null;
  }

  sharedAudioContext ??= new window.AudioContext({ latencyHint: "interactive" });
  return sharedAudioContext;
}

function getMasterGain(audioContext: AudioContext): GainNode {
  let masterGain = masterGainCache.get(audioContext);

  if (masterGain === undefined) {
    masterGain = audioContext.createGain();
    const initial = currentMasterMuted
      ? MIN_GAIN
      : Math.max(perceptualGain(currentMasterVolume) * CUE_GAIN_SCALE, MIN_GAIN);
    masterGain.gain.setValueAtTime(initial, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
    masterGainCache.set(audioContext, masterGain);
  }

  return masterGain;
}

function applyMasterGain(volume: number, isMuted: boolean): void {
  currentMasterVolume = clampVolume(volume);
  currentMasterMuted = isMuted;

  if (sharedAudioContext === null || sharedAudioContext.state === "closed") {
    return;
  }

  const masterGain = getMasterGain(sharedAudioContext);
  const target = isMuted
    ? MIN_GAIN
    : Math.max(perceptualGain(currentMasterVolume) * CUE_GAIN_SCALE, MIN_GAIN);
  masterGain.gain.setTargetAtTime(
    target,
    sharedAudioContext.currentTime,
    VOLUME_RAMP_TIME_CONSTANT,
  );
}

function readDateAmbientLoop(): DateAmbientLoop | null {
  if (sharedAudioContext === null || sharedAudioContext.state === "closed") {
    return null;
  }

  return dateAmbientLoopCache.get(sharedAudioContext) ?? null;
}

function getDateAmbientLoop(audioContext: AudioContext): DateAmbientLoop {
  let loop = dateAmbientLoopCache.get(audioContext);

  if (loop === undefined) {
    loop = new DateAmbientLoop(audioContext);
    dateAmbientLoopCache.set(audioContext, loop);
  }

  return loop;
}

function dateAmbientGain(volume: number): number {
  return perceptualGain(volume) * DATE_AMBIENT_GAIN_SCALE;
}

function dateAmbientCrossfadeSeconds(buffer: AudioBuffer): number {
  const safeLimit = Math.max(1, buffer.duration / 3);
  return Math.min(DATE_AMBIENT_LOOP_CROSSFADE_SECONDS, safeLimit);
}

function rampGainTo(
  audioContext: AudioContext,
  audioParam: AudioParam,
  target: number,
  duration: number,
): void {
  const now = audioContext.currentTime;
  audioParam.cancelScheduledValues(now);
  audioParam.setValueAtTime(Math.max(audioParam.value, MIN_GAIN), now);
  audioParam.linearRampToValueAtTime(Math.max(target, MIN_GAIN), now + duration);
}

class DateAmbientLoop {
  private readonly audioContext: AudioContext;
  private readonly outputGain: GainNode;
  private readonly activeSources = new Set<AudioBufferSourceNode>();
  private buffer: AudioBuffer | null = null;
  private bufferPromise: Promise<AudioBuffer> | null = null;
  private nextStartTime = 0;
  private requestCounter = 0;
  private requested = false;
  private schedulerId: number | null = null;
  private stopTimerId: number | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.outputGain = audioContext.createGain();
    this.outputGain.gain.setValueAtTime(MIN_GAIN, audioContext.currentTime);
    this.outputGain.connect(audioContext.destination);
  }

  async fadeIn(volume: number): Promise<void> {
    this.requested = true;
    this.requestCounter += 1;
    const requestId = this.requestCounter;
    this.cancelStopTimer();

    const buffer = await this.loadBuffer();

    if (!this.canContinue(requestId)) {
      return;
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    if (!this.canContinue(requestId)) {
      return;
    }

    if (this.schedulerId === null) {
      const minimumStartTime = this.audioContext.currentTime + DATE_AMBIENT_START_DELAY_SECONDS;

      if (this.activeSources.size === 0 || this.nextStartTime < minimumStartTime) {
        this.nextStartTime = minimumStartTime;
      }

      this.schedule(buffer);
      this.schedulerId = window.setInterval(
        () => this.schedule(buffer),
        DATE_AMBIENT_SCHEDULER_INTERVAL_MS,
      );
    }

    rampGainTo(
      this.audioContext,
      this.outputGain.gain,
      dateAmbientGain(volume),
      DATE_AMBIENT_FADE_SECONDS,
    );
  }

  fadeOut({ immediate = false }: { immediate?: boolean } = {}): void {
    if (!this.requested && this.schedulerId === null) {
      return;
    }

    this.requested = false;
    this.requestCounter += 1;
    this.clearScheduler();
    this.cancelStopTimer();

    if (immediate) {
      this.outputGain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.outputGain.gain.setValueAtTime(MIN_GAIN, this.audioContext.currentTime);
      this.stopActiveSources();
      return;
    }

    rampGainTo(this.audioContext, this.outputGain.gain, MIN_GAIN, DATE_AMBIENT_FADE_SECONDS);
    this.stopTimerId = window.setTimeout(
      () => this.stopActiveSources(),
      (DATE_AMBIENT_FADE_SECONDS + 0.25) * 1000,
    );
  }

  private canContinue(requestId: number): boolean {
    return (
      this.requested && this.requestCounter === requestId && this.audioContext.state !== "closed"
    );
  }

  private async loadBuffer(): Promise<AudioBuffer> {
    if (this.buffer !== null) {
      return this.buffer;
    }

    this.bufferPromise ??= fetch(DATE_AMBIENT_URL, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Date ambient track failed to load.");
        }

        return response.arrayBuffer();
      })
      .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer));

    this.buffer = await this.bufferPromise;
    return this.buffer;
  }

  private schedule(buffer: AudioBuffer): void {
    if (!this.requested || this.audioContext.state === "closed") {
      return;
    }

    const minimumStartTime = this.audioContext.currentTime + DATE_AMBIENT_START_DELAY_SECONDS;

    if (this.nextStartTime < minimumStartTime) {
      this.nextStartTime = minimumStartTime;
    }

    const horizon = this.audioContext.currentTime + DATE_AMBIENT_LOOKAHEAD_SECONDS;
    const crossfadeSeconds = dateAmbientCrossfadeSeconds(buffer);
    const spacingSeconds = Math.max(1, buffer.duration - crossfadeSeconds);

    while (this.nextStartTime <= horizon) {
      this.startBuffer(buffer, this.nextStartTime, crossfadeSeconds);
      this.nextStartTime += spacingSeconds;
    }
  }

  private startBuffer(buffer: AudioBuffer, startTime: number, crossfadeSeconds: number): void {
    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const endTime = startTime + buffer.duration;
    const fadeInEnd = startTime + crossfadeSeconds;
    const fadeOutStart = Math.max(fadeInEnd, endTime - crossfadeSeconds);

    source.buffer = buffer;
    gain.gain.setValueAtTime(MIN_GAIN, startTime);
    gain.gain.linearRampToValueAtTime(1, fadeInEnd);
    gain.gain.setValueAtTime(1, fadeOutStart);
    gain.gain.linearRampToValueAtTime(MIN_GAIN, endTime);

    source.connect(gain);
    gain.connect(this.outputGain);
    this.activeSources.add(source);

    source.start(startTime);
    source.stop(endTime + 0.05);
    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
      this.activeSources.delete(source);
    });
  }

  private clearScheduler(): void {
    if (this.schedulerId === null) {
      return;
    }

    window.clearInterval(this.schedulerId);
    this.schedulerId = null;
  }

  private cancelStopTimer(): void {
    if (this.stopTimerId === null) {
      return;
    }

    window.clearTimeout(this.stopTimerId);
    this.stopTimerId = null;
  }

  private stopActiveSources(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        continue;
      }
    }

    this.activeSources.clear();
    this.stopTimerId = null;
  }
}

async function playSfxCueInContext(audioContext: AudioContext, cue: SfxCue): Promise<void> {
  if (audioContext.state === "closed") {
    return;
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const now = audioContext.currentTime + 0.004;

  switch (cue) {
    case "alert":
      playBrush(audioContext, { start: now, gain: 0.008, duration: 0.06 });
      playChord(audioContext, {
        frequencies: [220, 261.63, 329.63, 493.88],
        start: now + 0.012,
        gain: 0.006,
        duration: 0.22,
      });
      break;
    case "danger":
      playBassPluck(audioContext, { frequency: 130.81, start: now, gain: 0.012 });
      playVibe(audioContext, { frequency: 311.13, start: now + SWING_SHORT_SECONDS, gain: 0.008 });
      playVibe(audioContext, { frequency: 293.66, start: now + SWING_LONG_SECONDS, gain: 0.006 });
      break;
    case "dismiss":
      playBrush(audioContext, { start: now, gain: 0.006, duration: 0.035 });
      playVibe(audioContext, { frequency: 523.25, start: now + 0.006, gain: 0.008 });
      playVibe(audioContext, { frequency: 392, start: now + SWING_SHORT_SECONDS, gain: 0.006 });
      break;
    case "menu":
      playBrush(audioContext, { start: now, gain: 0.005, duration: 0.026 });
      playVibe(audioContext, { frequency: 587.33, start: now + 0.005, gain: 0.006 });
      break;
    case "message":
      playBrush(audioContext, { start: now, gain: 0.005, duration: 0.04 });
      playVibe(audioContext, { frequency: 783.99, start: now + 0.01, gain: 0.008 });
      playVibe(audioContext, { frequency: 987.77, start: now + SWING_SHORT_SECONDS, gain: 0.005 });
      break;
    case "primary":
      playBassPluck(audioContext, { frequency: 146.83, start: now, gain: 0.01 });
      playChord(audioContext, {
        frequencies: [293.66, 349.23, 440, 523.25],
        start: now + SWING_SHORT_SECONDS,
        gain: 0.006,
        duration: 0.2,
      });
      break;
    case "stamp":
      playBrush(audioContext, { start: now, gain: 0.014, duration: 0.05, frequency: 720 });
      playBassPluck(audioContext, { frequency: 98, start: now + 0.004, gain: 0.016 });
      playChord(audioContext, {
        frequencies: [261.63, 329.63, 392, 493.88],
        start: now + SWING_LONG_SECONDS,
        gain: 0.006,
        duration: 0.24,
      });
      break;
    case "success":
      playVibe(audioContext, { frequency: 523.25, start: now, gain: 0.007 });
      playVibe(audioContext, { frequency: 659.25, start: now + SWING_SHORT_SECONDS, gain: 0.007 });
      playVibe(audioContext, { frequency: 987.77, start: now + SWING_LONG_SECONDS, gain: 0.006 });
      break;
    case "toggle":
      playVibe(audioContext, { frequency: 440, start: now, gain: 0.007 });
      playVibe(audioContext, { frequency: 554.37, start: now + SWING_SHORT_SECONDS, gain: 0.006 });
      break;
    case "click":
      playBrush(audioContext, { start: now, gain: 0.004, duration: 0.02 });
      playVibe(audioContext, { frequency: 659.25, start: now + 0.003, gain: 0.005 });
      break;
  }
}

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

function playTone(audioContext: AudioContext, options: ToneOptions): void {
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

function playVibe(audioContext: AudioContext, options: VibeOptions): void {
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

function playBassPluck(audioContext: AudioContext, options: BassPluckOptions): void {
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

function playChord(audioContext: AudioContext, options: ChordOptions): void {
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

function playBrush(audioContext: AudioContext, options: BrushOptions): void {
  playNoise(audioContext, {
    gain: options.gain,
    start: options.start,
    duration: options.duration,
    filterFrequency: options.frequency ?? 1800,
    filterType: "bandpass",
    q: 0.55,
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
