import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { KeyValueStorage } from "./game-repository";

const DEFAULT_DATA_DIR = ".idc-data";

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "ENOENT"
  );
}

export class NodeJsonStorageDriver implements KeyValueStorage {
  constructor(private readonly dataDirectory = DEFAULT_DATA_DIR) {}

  getItem(key: string): string | null {
    try {
      return readFileSync(this.filePathForKey(key), "utf8");
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }
      throw error;
    }
  }

  setItem(key: string, value: string): void {
    const filePath = this.filePathForKey(key);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, value, "utf8");
  }

  removeItem(key: string): void {
    try {
      rmSync(this.filePathForKey(key));
    } catch (error) {
      if (isMissingFileError(error)) {
        return;
      }
      throw error;
    }
  }

  private filePathForKey(key: string): string {
    return resolve(this.dataDirectory, `${key.replace(/[^a-z0-9._-]/gi, "_")}.json`);
  }
}
