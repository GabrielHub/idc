import type { RawSaveStore } from "./raw-save-store";

export class BrowserLocalStorageSaveStore implements RawSaveStore {
  async read(key: string): Promise<string | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async write(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, value);
  }

  async delete(key: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(key);
  }
}
