import { BaseDirectory, mkdir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";

import { detectRuntimePlatform, type RuntimePlatform } from "../../platform/runtime";

export const GATEWAY_API_KEY_STORAGE_KEY = "idc.cupid.aiGatewayKey";
export const TAURI_GATEWAY_API_KEY_DIR = "secrets";
export const TAURI_GATEWAY_API_KEY_FILE_PATH = `${TAURI_GATEWAY_API_KEY_DIR}/gateway-api-key.txt`;

const MISSING_FILE_PATTERN = /No such file|os error 2|not found/i;

export interface GatewayApiKeyStore {
  read(): Promise<string>;
  write(value: string): Promise<void>;
  delete(): Promise<void>;
}

export type CreateGatewayApiKeyStoreOptions = {
  platform?: RuntimePlatform;
  browserStore?: GatewayApiKeyStore;
  tauriStore?: GatewayApiKeyStore;
  legacyBrowserStore?: GatewayApiKeyStore;
};

export class BrowserLocalStorageGatewayApiKeyStore implements GatewayApiKeyStore {
  constructor(private readonly storage?: Storage) {}

  async read(): Promise<string> {
    const storage = this.resolveStorage();

    if (storage === null) {
      return "";
    }

    try {
      return storage.getItem(GATEWAY_API_KEY_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  }

  async write(value: string): Promise<void> {
    const storage = this.resolveStorage();

    if (storage === null) {
      return;
    }

    try {
      storage.setItem(GATEWAY_API_KEY_STORAGE_KEY, value);
    } catch {
      return;
    }
  }

  async delete(): Promise<void> {
    const storage = this.resolveStorage();

    if (storage === null) {
      return;
    }

    try {
      storage.removeItem(GATEWAY_API_KEY_STORAGE_KEY);
    } catch {
      return;
    }
  }

  private resolveStorage(): Storage | null {
    if (this.storage !== undefined) {
      return this.storage;
    }

    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  }
}

export class TauriAppLocalDataGatewayApiKeyStore implements GatewayApiKeyStore {
  private secretDirEnsured = false;

  async read(): Promise<string> {
    try {
      return await readTextFile(TAURI_GATEWAY_API_KEY_FILE_PATH, {
        baseDir: BaseDirectory.AppLocalData,
      });
    } catch (error) {
      if (isMissingFileError(error)) {
        return "";
      }
      throw error;
    }
  }

  async write(value: string): Promise<void> {
    await this.ensureSecretDir();
    await writeTextFile(TAURI_GATEWAY_API_KEY_FILE_PATH, value, {
      baseDir: BaseDirectory.AppLocalData,
    });
  }

  async delete(): Promise<void> {
    try {
      await remove(TAURI_GATEWAY_API_KEY_FILE_PATH, { baseDir: BaseDirectory.AppLocalData });
    } catch (error) {
      if (isMissingFileError(error)) {
        return;
      }
      throw error;
    }
  }

  private async ensureSecretDir(): Promise<void> {
    if (this.secretDirEnsured) {
      return;
    }

    await mkdir(TAURI_GATEWAY_API_KEY_DIR, {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });
    this.secretDirEnsured = true;
  }
}

export function createGatewayApiKeyStore(
  options: CreateGatewayApiKeyStoreOptions = {},
): GatewayApiKeyStore {
  const platform = options.platform ?? detectRuntimePlatform();

  if (platform === "tauri") {
    const tauriStore = options.tauriStore ?? new TauriAppLocalDataGatewayApiKeyStore();
    const legacyBrowserStore =
      options.legacyBrowserStore ??
      options.browserStore ??
      new BrowserLocalStorageGatewayApiKeyStore();

    return new MigratingGatewayApiKeyStore(tauriStore, legacyBrowserStore);
  }

  return options.browserStore ?? new BrowserLocalStorageGatewayApiKeyStore();
}

export async function readStoredGatewayApiKey(store = createGatewayApiKeyStore()): Promise<string> {
  try {
    return normalizeSecret(await store.read()) ?? "";
  } catch {
    return "";
  }
}

export async function storeGatewayApiKey(
  value: string,
  store = createGatewayApiKeyStore(),
): Promise<void> {
  const trimmed = normalizeSecret(value);

  if (trimmed === undefined) {
    await store.delete();
    return;
  }

  await store.write(trimmed);
}

class MigratingGatewayApiKeyStore implements GatewayApiKeyStore {
  constructor(
    private readonly primaryStore: GatewayApiKeyStore,
    private readonly legacyStore: GatewayApiKeyStore,
  ) {}

  async read(): Promise<string> {
    const primaryValue = normalizeSecret(await this.primaryStore.read());

    if (primaryValue !== undefined) {
      await this.legacyStore.delete();
      return primaryValue;
    }

    const legacyValue = normalizeSecret(await this.legacyStore.read());

    if (legacyValue === undefined) {
      return "";
    }

    await this.primaryStore.write(legacyValue);
    await this.legacyStore.delete();
    return legacyValue;
  }

  async write(value: string): Promise<void> {
    await this.primaryStore.write(value);
    await this.legacyStore.delete();
  }

  async delete(): Promise<void> {
    await this.primaryStore.delete();
    await this.legacyStore.delete();
  }
}

function normalizeSecret(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function isMissingFileError(error: unknown): boolean {
  if (typeof error === "string") {
    return MISSING_FILE_PATTERN.test(error);
  }

  if (error instanceof Error) {
    return MISSING_FILE_PATTERN.test(error.message);
  }

  return false;
}
