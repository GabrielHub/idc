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
import {
  applyMasterGain,
  clampVolume,
  DEFAULT_VOLUME,
  getAudioContext,
  getDateAmbientLoop,
  readDateAmbientLoop,
  __resetEngineStateForTests,
} from "./sfx-engine";
import { cueFromPointerTarget, playSfxCue, type SfxCue } from "./sfx-cues";
import {
  playVoiceClipInternal,
  VOICE_CLIP_SILENT_FALLBACK,
  __resetVoiceClipCacheForTests,
  type VoiceClipPlayback,
} from "./sfx-voice-clip";

export type { SfxCue, VoiceClipPlayback };

const VOLUME_STORAGE_KEY = "idc.cupid.sfx.volume";

type SfxContextValue = {
  isEnabled: boolean;
  setEnabled: (isEnabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  setDateAmbientSession: (sessionId: string | null) => void;
  play: (cue: SfxCue) => void;
  playVoiceClip: (path: string) => Promise<VoiceClipPlayback>;
};

const FALLBACK_SFX_CONTEXT: SfxContextValue = {
  isEnabled: true,
  setEnabled: () => undefined,
  volume: DEFAULT_VOLUME,
  setVolume: () => undefined,
  setDateAmbientSession: () => undefined,
  play: () => undefined,
  playVoiceClip: () => Promise.resolve(VOICE_CLIP_SILENT_FALLBACK),
};

const SfxContext = createContext<SfxContextValue>(FALLBACK_SFX_CONTEXT);

export function __playVoiceClipForTests(path: string): Promise<VoiceClipPlayback> {
  return playVoiceClipInternal(path);
}

export function __resetSharedAudioContextForTests(): void {
  __resetEngineStateForTests();
  __resetVoiceClipCacheForTests();
}

export function SfxProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabledState] = useState(() =>
    isSfxEnabledByDefault(detectRuntimePlatform()),
  );
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [dateAmbientSessionId, setDateAmbientSessionId] = useState<string | null>(null);
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
    if (dateAmbientSessionId === null || !isEnabled || volume <= 0) {
      readDateAmbientLoop()?.fadeOut({ immediate: !isEnabled || volume <= 0 });
      return;
    }

    const audioContext = getAudioContext();

    if (audioContext === null) {
      return;
    }

    void getDateAmbientLoop(audioContext)
      .fadeIn(volume, dateAmbientSessionId)
      .catch(() => undefined);
  }, [dateAmbientSessionId, isEnabled, volume]);

  useEffect(() => {
    return () => readDateAmbientLoop()?.fadeOut({ immediate: true });
  }, []);

  const play = useCallback((cue: SfxCue) => {
    if (!isEnabledRef.current) {
      return;
    }

    playSfxCue(cue);
  }, []);

  const playVoiceClip = useCallback(async (path: string): Promise<VoiceClipPlayback> => {
    return playVoiceClipInternal(path);
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

  const setDateAmbientSession = useCallback((sessionId: string | null) => {
    setDateAmbientSessionId(sessionId);
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
      setDateAmbientSession,
      play,
      playVoiceClip,
    }),
    [isEnabled, play, playVoiceClip, setDateAmbientSession, setEnabled, setVolume, volume],
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
