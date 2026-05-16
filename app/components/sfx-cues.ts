import { getAudioContext } from "./sfx-engine";
import {
  playBassPluck,
  playBrush,
  playChord,
  playFelt,
  playGlide,
  playMuted,
  playRim,
  playShimmer,
  playSweep,
  playVibe,
} from "./sfx-synth";

const SWING_SHORT_SECONDS = 0.052;
const SWING_LONG_SECONDS = 0.086;

export const SFX_CUES = [
  "abort",
  "alert",
  "click",
  "danger",
  "dismiss",
  "event",
  "intervention",
  "judge",
  "menu",
  "message",
  "notice",
  "primary",
  "report",
  "reveal",
  "stamp",
  "success",
  "toggle",
  "transition",
  "triumph",
] as const;

export type SfxCue = (typeof SFX_CUES)[number];

const SFX_CUE_SET: ReadonlySet<string> = new Set<string>(SFX_CUES);

export function playSfxCue(cue: SfxCue): void {
  const audioContext = getAudioContext();

  if (audioContext === null) {
    return;
  }

  void playSfxCueInContext(audioContext, cue).catch(() => undefined);
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
    case "abort":
      playGlide(audioContext, {
        startFrequency: 659.25,
        endFrequency: 220,
        start: now,
        gain: 0.008,
        duration: 0.22,
      });
      playBassPluck(audioContext, { frequency: 110, start: now + 0.04, gain: 0.008 });
      break;
    case "event":
      playRim(audioContext, { frequency: 1100, start: now, gain: 0.008 });
      playChord(audioContext, {
        frequencies: [261.63, 311.13, 392, 466.16],
        start: now + 0.012,
        gain: 0.007,
        duration: 0.2,
      });
      break;
    case "intervention":
      playBassPluck(audioContext, { frequency: 110, start: now, gain: 0.012 });
      playMuted(audioContext, { frequency: 440, start: now + SWING_SHORT_SECONDS, gain: 0.01 });
      playMuted(audioContext, {
        frequency: 554.37,
        start: now + SWING_LONG_SECONDS + 0.05,
        gain: 0.008,
      });
      break;
    case "judge":
      playRim(audioContext, { frequency: 980, start: now, gain: 0.006 });
      playFelt(audioContext, { frequency: 392, start: now + 0.04, gain: 0.008 });
      playFelt(audioContext, { frequency: 493.88, start: now + 0.11, gain: 0.008 });
      playFelt(audioContext, { frequency: 659.25, start: now + 0.18, gain: 0.009 });
      break;
    case "notice":
      playBrush(audioContext, { start: now, gain: 0.005, duration: 0.05 });
      playFelt(audioContext, { frequency: 349.23, start: now + 0.014, gain: 0.007 });
      playFelt(audioContext, { frequency: 440, start: now + SWING_LONG_SECONDS, gain: 0.005 });
      break;
    case "report":
      playBassPluck(audioContext, { frequency: 130.81, start: now, gain: 0.012 });
      playChord(audioContext, {
        frequencies: [261.63, 329.63, 392, 493.88, 587.33],
        start: now + SWING_SHORT_SECONDS,
        gain: 0.007,
        duration: 0.34,
      });
      playShimmer(audioContext, {
        frequency: 1318.51,
        start: now + 0.09,
        gain: 0.005,
        duration: 0.5,
      });
      break;
    case "reveal":
      playShimmer(audioContext, { frequency: 1568, start: now, gain: 0.006, duration: 0.36 });
      playFelt(audioContext, { frequency: 783.99, start: now + 0.04, gain: 0.006 });
      break;
    case "transition":
      playSweep(audioContext, {
        start: now,
        gain: 0.008,
        duration: 0.18,
        fromFrequency: 500,
        toFrequency: 2400,
      });
      playFelt(audioContext, { frequency: 587.33, start: now + 0.14, gain: 0.005 });
      break;
    case "triumph":
      playBassPluck(audioContext, { frequency: 146.83, start: now, gain: 0.014 });
      playFelt(audioContext, { frequency: 293.66, start: now + 0.05, gain: 0.009 });
      playFelt(audioContext, { frequency: 440, start: now + 0.13, gain: 0.009 });
      playFelt(audioContext, { frequency: 587.33, start: now + 0.21, gain: 0.009 });
      playFelt(audioContext, { frequency: 880, start: now + 0.29, gain: 0.009 });
      playChord(audioContext, {
        frequencies: [293.66, 369.99, 440, 587.33, 739.99],
        start: now + 0.36,
        gain: 0.008,
        duration: 0.55,
      });
      playShimmer(audioContext, {
        frequency: 1760,
        start: now + 0.42,
        gain: 0.005,
        duration: 0.6,
      });
      break;
  }
}

export function cueFromPointerTarget(target: EventTarget | null): SfxCue | null {
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
  if (value === undefined) return null;
  return SFX_CUE_SET.has(value) ? (value as SfxCue) : null;
}
