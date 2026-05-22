import { invoke } from "@tauri-apps/api/core";

import { detectRuntimePlatform, type RuntimePlatform } from "../../platform/runtime";

export const GATEWAY_API_KEY_STORAGE_KEY = "idc.cupid.aiGatewayKey";
export const DESKTOP_GATEWAY_API_KEY_STORAGE_LABEL = "OS credential store";
export const LEGACY_TAURI_GATEWAY_API_KEY_FILE_PATH = "secrets/gateway-api-key.txt";

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

export class TauriCredentialGatewayApiKeyStore implements GatewayApiKeyStore {
  private legacyMigrationAttempted = false;

  async read(): Promise<string> {
    await this.migrateLegacyPlaintextKey();
    return invoke<string>("read_gateway_api_key");
  }

  async write(value: string): Promise<void> {
    await invoke("write_gateway_api_key", { value });
  }

  async delete(): Promise<void> {
    await invoke("delete_gateway_api_key");
  }

  private async migrateLegacyPlaintextKey(): Promise<void> {
    if (this.legacyMigrationAttempted) {
      return;
    }

    await invoke("migrate_legacy_gateway_api_key");
    this.legacyMigrationAttempted = true;
  }
}

export function createGatewayApiKeyStore(
  options: CreateGatewayApiKeyStoreOptions = {},
): GatewayApiKeyStore {
  const platform = options.platform ?? detectRuntimePlatform();

  if (platform === "tauri") {
    const tauriStore = options.tauriStore ?? new TauriCredentialGatewayApiKeyStore();
    const legacyBrowserStore =
      options.legacyBrowserStore ??
      options.browserStore ??
      new BrowserLocalStorageGatewayApiKeyStore();

    return new MigratingGatewayApiKeyStore(tauriStore, legacyBrowserStore);
  }

  return options.browserStore ?? new BrowserLocalStorageGatewayApiKeyStore();
}

export async function readStoredGatewayApiKey(store = createGatewayApiKeyStore()): Promise<string> {
  return normalizeSecret(await store.read()) ?? "";
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
