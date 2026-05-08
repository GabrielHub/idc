import { isTauriRuntime } from "../platform/runtime";
import { BrowserLocalStorageSaveStore } from "./browser-local-storage-save-store";
import { LocalGameRepository } from "./local-game-repository";
import { MemorySaveStore } from "./memory-save-store";
import type { RawSaveStore } from "./raw-save-store";
import { TauriAppLocalDataSaveStore } from "./tauri-app-local-data-save-store";

type CreateGameRepositoryOptions = {
  store?: RawSaveStore;
  saveKey?: string;
  legacySaveKeys?: string[];
};

export function createGameRepository(
  options: CreateGameRepositoryOptions = {},
): LocalGameRepository {
  const store = options.store ?? defaultRawSaveStore();
  return new LocalGameRepository(store, options.saveKey, options.legacySaveKeys);
}

function defaultRawSaveStore(): RawSaveStore {
  if (typeof window === "undefined") {
    return new MemorySaveStore();
  }

  if (isTauriRuntime()) {
    return new TauriAppLocalDataSaveStore();
  }

  return new BrowserLocalStorageSaveStore();
}
