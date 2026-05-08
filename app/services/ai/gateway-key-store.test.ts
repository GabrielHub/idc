import { describe, expect, it } from "vitest";

import {
  BrowserLocalStorageGatewayApiKeyStore,
  GATEWAY_API_KEY_STORAGE_KEY,
  TAURI_GATEWAY_API_KEY_FILE_PATH,
  createGatewayApiKeyStore,
  readStoredGatewayApiKey,
  storeGatewayApiKey,
  type GatewayApiKeyStore,
} from "./gateway-key-store";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class MemoryGatewayApiKeyStore implements GatewayApiKeyStore {
  writeCount = 0;
  deleteCount = 0;

  constructor(private value = "") {}

  async read(): Promise<string> {
    return this.value;
  }

  async write(value: string): Promise<void> {
    this.value = value;
    this.writeCount += 1;
  }

  async delete(): Promise<void> {
    this.value = "";
    this.deleteCount += 1;
  }
}

describe("Gateway key storage", () => {
  it("keeps browser dev on localStorage", async () => {
    const storage = new MemoryStorage();
    const tauriStore = new MemoryGatewayApiKeyStore();
    const store = createGatewayApiKeyStore({
      platform: "browser",
      browserStore: new BrowserLocalStorageGatewayApiKeyStore(storage),
      tauriStore,
    });

    await storeGatewayApiKey(" browser-key ", store);

    expect(storage.getItem(GATEWAY_API_KEY_STORAGE_KEY)).toBe("browser-key");
    expect(await readStoredGatewayApiKey(store)).toBe("browser-key");
    expect(tauriStore.writeCount).toBe(0);
  });

  it("uses the Tauri store instead of WebView localStorage in desktop runtime", async () => {
    const storage = new MemoryStorage();
    const browserStore = new BrowserLocalStorageGatewayApiKeyStore(storage);
    const tauriStore = new MemoryGatewayApiKeyStore();
    const store = createGatewayApiKeyStore({
      platform: "tauri",
      browserStore,
      tauriStore,
    });

    await storeGatewayApiKey("browser-key", browserStore);
    await storeGatewayApiKey(" desktop-key ", store);

    expect(await tauriStore.read()).toBe("desktop-key");
    expect(storage.getItem(GATEWAY_API_KEY_STORAGE_KEY)).toBeNull();
  });

  it("migrates a legacy Tauri WebView localStorage key into app local data", async () => {
    const storage = new MemoryStorage();
    const browserStore = new BrowserLocalStorageGatewayApiKeyStore(storage);
    const tauriStore = new MemoryGatewayApiKeyStore();
    const store = createGatewayApiKeyStore({
      platform: "tauri",
      browserStore,
      tauriStore,
    });

    await storeGatewayApiKey(" legacy-key ", browserStore);

    expect(await readStoredGatewayApiKey(store)).toBe("legacy-key");
    expect(await tauriStore.read()).toBe("legacy-key");
    expect(storage.getItem(GATEWAY_API_KEY_STORAGE_KEY)).toBeNull();
  });

  it("deletes a stored key when saving a blank value", async () => {
    const store = new MemoryGatewayApiKeyStore();

    await storeGatewayApiKey("gateway-key", store);
    await storeGatewayApiKey("   ", store);

    expect(await readStoredGatewayApiKey(store)).toBe("");
    expect(store.deleteCount).toBe(1);
  });

  it("keeps the Tauri Gateway key path outside the saves directory", () => {
    expect(TAURI_GATEWAY_API_KEY_FILE_PATH.startsWith("saves/")).toBe(false);
    expect(TAURI_GATEWAY_API_KEY_FILE_PATH).toBe("secrets/gateway-api-key.txt");
  });
});
