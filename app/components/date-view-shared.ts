import type { DateSession } from "../domain/game";

export type PendingDateAction = "advanceExchange";
export type PlaybackIntent = "playing" | "paused";

export type DatePlaybackUiState = {
  isPlaying: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  pauseRequested: boolean;
  playbackBusy: boolean;
};

export function resolveDatePlaybackUiState({
  playbackState,
  pendingDateAction,
  queuedPlaybackIntent,
}: {
  playbackState: DateSession["playbackState"];
  pendingDateAction: PendingDateAction | null;
  queuedPlaybackIntent: PlaybackIntent | null;
}): DatePlaybackUiState {
  const isStreaming = pendingDateAction !== null;
  const pauseRequested = playbackState === "playing" && queuedPlaybackIntent === "paused";
  const playRequested = playbackState === "paused" && queuedPlaybackIntent === "playing";
  const isPlaying = (playbackState === "playing" || playRequested) && !pauseRequested;
  const isPaused = (playbackState === "paused" || pauseRequested) && !playRequested;
  const playbackBusy = isStreaming && (playbackState === "paused" || queuedPlaybackIntent !== null);

  return {
    isPlaying,
    isPaused,
    isStreaming,
    pauseRequested,
    playbackBusy,
  };
}
