export type UpdateMenuState =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "checking";
      message: string;
    }
  | {
      status: "current";
      message: string;
    }
  | {
      status: "unsupported";
      message: string;
    }
  | {
      status: "available";
      version: string;
      notes: string;
      date: string | null;
    }
  | {
      status: "installing";
      version: string;
      downloadedBytes: number;
      totalBytes: number | null;
    }
  | {
      status: "error";
      message: string;
    };

export const INITIAL_UPDATE_STATE: UpdateMenuState = {
  status: "idle",
  message: "Check GitHub Releases for a signed desktop build.",
};

export const LAUNCH_UPDATE_CHECK_DELAY_MS = 1500;

export function updateStatusLabel(state: UpdateMenuState): string {
  switch (state.status) {
    case "idle":
      return "manual";
    case "checking":
      return "checking";
    case "current":
      return "current";
    case "unsupported":
      return "desktop";
    case "available":
      return `v${state.version}`;
    case "installing":
      return "installing";
    case "error":
      return "blocked";
  }
}

export function updateStatusMessage(state: UpdateMenuState): string {
  switch (state.status) {
    case "available": {
      const dateLabel =
        state.date === null ? "" : ` Published ${new Date(state.date).toLocaleDateString()}.`;
      return `Signed update v${state.version} is ready.${dateLabel}`;
    }
    case "installing":
      return `Installing v${state.version}. ${formatUpdateProgress(state)}`;
    default:
      return state.message;
  }
}

function formatUpdateProgress(state: Extract<UpdateMenuState, { status: "installing" }>): string {
  if (state.totalBytes === null || state.totalBytes <= 0) {
    return `${formatBytes(state.downloadedBytes)} received.`;
  }

  const percent = Math.min(100, Math.round((state.downloadedBytes / state.totalBytes) * 100));
  return `${percent}% received.`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
