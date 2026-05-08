import { invoke } from "@tauri-apps/api/core";

import { isTauriRuntime } from "./runtime";

export async function openTauriLogFolder(): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    await invoke("open_log_folder");
  } catch (error) {
    console.error("open_log_folder failed", error);
  }
}

export async function openTauriSaveFolder(): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    await invoke("open_save_folder");
  } catch (error) {
    console.error("open_save_folder failed", error);
  }
}
