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
  play: (cue: SfxCue) => void;
};

const SFX_STORAGE_KEY = "idc.cupid.sfx.enabled";
const VOLUME_STORAGE_KEY = "idc.cupid.sfx.volume";
const DEFAULT_VOLUME = 0.6;
const MIN_GAIN = 0.0001;
const VOLUME_RAMP_TIME_CONSTANT = 0.02;
const SOFT_ATTACK_SECONDS = 0.012;
const SWING_SHORT_SECONDS = 0.052;
const SWING_LONG_SECONDS = 0.086;

let sharedAudioContext: AudioContext | null = null;
let currentMasterVolume = DEFAULT_VOLUME;
let currentMasterMuted = false;
const noiseBufferCache = new WeakMap<AudioContext, Map<number, AudioBuffer>>();
const masterGainCache = new WeakMap<AudioContext, GainNode>();

const FALLBACK_SFX_CONTEXT: SfxContextValue = {
  isEnabled: true,
  setEnabled: () => undefined,
  volume: DEFAULT_VOLUME,
  setVolume: () => undefined,
  play: () => undefined,
};

const SfxContext = createContext<SfxContextValue>(FALLBACK_SFX_CONTEXT);

export function SfxProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabledState] = useState(true);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const isEnabledRef = useRef(isEnabled);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    const storedEnabled = readStoredSfxPreference();
    const storedVolume = readStoredSfxVolume();
    setIsEnabledState(storedEnabled);
    setVolumeState(storedVolume);
    applyMasterGain(storedVolume, !storedEnabled);
  }, []);

  useEffect(() => {
    applyMasterGain(volume, !isEnabled);
  }, [isEnabled, volume]);

  const play = useCallback((cue: SfxCue) => {
    if (!isEnabledRef.current) {
      return;
    }

    playSfxCue(cue);
  }, []);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setIsEnabledState(nextEnabled);
    isEnabledRef.current = nextEnabled;
    writeStoredSfxPreference(nextEnabled);

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
      play,
    }),
    [isEnabled, play, setEnabled, setVolume, volume],
  );

  return <SfxContext.Provider value={value}>{children}</SfxContext.Provider>;
}

export function useSfx(): SfxContextValue {
  return useContext(SfxContext);
}

function readStoredSfxPreference(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(SFX_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeStoredSfxPreference(isEnabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SFX_STORAGE_KEY, isEnabled ? "on" : "off");
  } catch {
    return;
  }
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
      : Math.max(perceptualGain(currentMasterVolume), MIN_GAIN);
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
  const target = isMuted ? MIN_GAIN : Math.max(perceptualGain(currentMasterVolume), MIN_GAIN);
  masterGain.gain.setTargetAtTime(
    target,
    sharedAudioContext.currentTime,
    VOLUME_RAMP_TIME_CONSTANT,
  );
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
