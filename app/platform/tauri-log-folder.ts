import { invoke } from "@tauri-apps/api/core";

import { isTauriRuntime, type RuntimePlatform } from "./runtime";

export type CrashDiagnosticsRendererReport = {
  appVersion: string;
  saveSchema: number;
  runtime: RuntimePlatform;
  timestamp: string;
  url: string;
  userAgent: string;
  routeStatus: number | null;
  message: string;
  stack: string | null;
  componentStack: string | null;
};

export type CrashDiagnosticsResult = {
  reportPath: string;
  logFolder: string;
  attachedLogCount: number;
  revealError: string | null;
};

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

export async function writeTauriCrashDiagnostics(
  rendererReport: CrashDiagnosticsRendererReport,
): Promise<CrashDiagnosticsResult | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  try {
    return await invoke<CrashDiagnosticsResult>("write_crash_diagnostics", { rendererReport });
  } catch (error) {
    console.error("write_crash_diagnostics failed", error);
    throw error;
  }
}
