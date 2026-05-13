import { isTauriRuntime } from "./runtime";

type TauriUpdate = import("@tauri-apps/plugin-updater").Update;

export type DesktopUpdateCheckResult =
  | {
      status: "unsupported";
      message: string;
    }
  | {
      status: "current";
      message: string;
    }
  | {
      status: "available";
      version: string;
      notes: string;
      date: string | null;
    };

export type DesktopUpdateProgress = {
  downloadedBytes: number;
  totalBytes: number | null;
};

let pendingUpdate: TauriUpdate | null = null;

export async function checkForDesktopUpdate(): Promise<DesktopUpdateCheckResult> {
  if (!isTauriRuntime()) {
    pendingUpdate = null;
    return {
      status: "unsupported",
      message: "Desktop updates only run inside the installed app.",
    };
  }

  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check();
  pendingUpdate = update;

  if (update === null) {
    return {
      status: "current",
      message: "Current build. No dispatch tube delivery today.",
    };
  }

  return {
    status: "available",
    version: update.version,
    notes: update.body ?? "",
    date: update.date ?? null,
  };
}

export async function installPendingDesktopUpdate(
  onProgress: (progress: DesktopUpdateProgress) => void,
): Promise<void> {
  const update = pendingUpdate;

  if (update === null) {
    throw new Error("No checked update is ready to install.");
  }

  let downloadedBytes = 0;
  let totalBytes: number | null = null;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        downloadedBytes = 0;
        totalBytes = event.data.contentLength ?? null;
        onProgress({ downloadedBytes, totalBytes });
        break;
      case "Progress":
        downloadedBytes += event.data.chunkLength;
        onProgress({ downloadedBytes, totalBytes });
        break;
      case "Finished":
        onProgress({ downloadedBytes: totalBytes ?? downloadedBytes, totalBytes });
        break;
    }
  });

  pendingUpdate = null;
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
