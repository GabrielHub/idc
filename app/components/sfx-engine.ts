export const MIN_GAIN = 0.0001;
export const DEFAULT_VOLUME = 0.6;
export const CUE_GAIN_SCALE = 30;
export const VOLUME_RAMP_TIME_CONSTANT = 0.02;

const COMPRESSOR_THRESHOLD_DB = -10;
const COMPRESSOR_KNEE_DB = 6;
const COMPRESSOR_RATIO = 3;
const COMPRESSOR_ATTACK_SECONDS = 0.005;
const COMPRESSOR_RELEASE_SECONDS = 0.12;

const DATE_AMBIENT_URL = "/assets/audio/date-ambient-jazz.mp3";
const DATE_AMBIENT_TARGET_LEVEL = 0.08;
const DATE_AMBIENT_SUBMIX_GAIN = DATE_AMBIENT_TARGET_LEVEL / CUE_GAIN_SCALE;
const DATE_AMBIENT_FADE_SECONDS = 8;
const DATE_AMBIENT_LOOP_CROSSFADE_SECONDS = 8;
const DATE_AMBIENT_START_DELAY_SECONDS = 0.04;
const DATE_AMBIENT_LOOKAHEAD_SECONDS = 2;
const DATE_AMBIENT_SCHEDULER_INTERVAL_MS = 500;

let sharedAudioContext: AudioContext | null = null;
let currentMasterVolume = DEFAULT_VOLUME;
let currentMasterMuted = true;

const masterGainCache = new WeakMap<AudioContext, GainNode>();
const compressorCache = new WeakMap<AudioContext, DynamicsCompressorNode>();
const dateAmbientLoopCache = new WeakMap<AudioContext, DateAmbientLoop>();

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.max(0, Math.min(1, volume));
}

export function perceptualGain(volume: number): number {
  const clamped = clampVolume(volume);
  return clamped * clamped;
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || window.AudioContext === undefined) {
    return null;
  }

  if (sharedAudioContext?.state === "closed") {
    sharedAudioContext = null;
  }

  sharedAudioContext ??= new window.AudioContext({ latencyHint: "interactive" });
  return sharedAudioContext;
}

export function getMasterGain(audioContext: AudioContext): GainNode {
  let masterGain = masterGainCache.get(audioContext);

  if (masterGain === undefined) {
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(currentMasterGainTarget(), audioContext.currentTime);
    masterGain.connect(getMasterCompressor(audioContext));
    masterGainCache.set(audioContext, masterGain);
  }

  return masterGain;
}

function currentMasterGainTarget(): number {
  if (currentMasterMuted) return MIN_GAIN;
  return Math.max(perceptualGain(currentMasterVolume) * CUE_GAIN_SCALE, MIN_GAIN);
}

function getMasterCompressor(audioContext: AudioContext): DynamicsCompressorNode {
  let compressor = compressorCache.get(audioContext);

  if (compressor === undefined) {
    compressor = audioContext.createDynamicsCompressor();
    const now = audioContext.currentTime;
    compressor.threshold.setValueAtTime(COMPRESSOR_THRESHOLD_DB, now);
    compressor.knee.setValueAtTime(COMPRESSOR_KNEE_DB, now);
    compressor.ratio.setValueAtTime(COMPRESSOR_RATIO, now);
    compressor.attack.setValueAtTime(COMPRESSOR_ATTACK_SECONDS, now);
    compressor.release.setValueAtTime(COMPRESSOR_RELEASE_SECONDS, now);
    compressor.connect(audioContext.destination);
    compressorCache.set(audioContext, compressor);
  }

  return compressor;
}

export function applyMasterGain(volume: number, isMuted: boolean): void {
  currentMasterVolume = clampVolume(volume);
  currentMasterMuted = isMuted;

  if (sharedAudioContext === null || sharedAudioContext.state === "closed") {
    return;
  }

  const masterGain = getMasterGain(sharedAudioContext);
  masterGain.gain.setTargetAtTime(
    currentMasterGainTarget(),
    sharedAudioContext.currentTime,
    VOLUME_RAMP_TIME_CONSTANT,
  );
}

export function readDateAmbientLoop(): DateAmbientLoop | null {
  if (sharedAudioContext === null || sharedAudioContext.state === "closed") {
    return null;
  }

  return dateAmbientLoopCache.get(sharedAudioContext) ?? null;
}

export function getDateAmbientLoop(audioContext: AudioContext): DateAmbientLoop {
  let loop = dateAmbientLoopCache.get(audioContext);

  if (loop === undefined) {
    loop = new DateAmbientLoop(audioContext);
    dateAmbientLoopCache.set(audioContext, loop);
  }

  return loop;
}

function dateAmbientGain(volume: number): number {
  if (clampVolume(volume) <= 0) {
    return MIN_GAIN;
  }

  return DATE_AMBIENT_SUBMIX_GAIN;
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

export class DateAmbientLoop {
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
    this.outputGain.connect(getMasterGain(audioContext));
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

    if (this.bufferPromise === null) {
      const pending = fetch(DATE_AMBIENT_URL, { cache: "force-cache" })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Date ambient track failed to load.");
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer));
      pending.catch(() => {
        if (this.bufferPromise === pending) {
          this.bufferPromise = null;
        }
      });
      this.bufferPromise = pending;
    }

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

export function __resetEngineStateForTests(): void {
  sharedAudioContext = null;
  currentMasterVolume = DEFAULT_VOLUME;
  currentMasterMuted = true;
}
