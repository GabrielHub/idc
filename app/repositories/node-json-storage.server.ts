import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { KeyValueStorage } from "./game-repository";

const DEFAULT_DATA_DIR = ".idc-data";

export class NodeJsonStorageDriver implements KeyValueStorage {
  constructor(private readonly dataDirectory = DEFAULT_DATA_DIR) {}

  getItem(key: string): string | null {
    const filePath = this.filePathForKey(key);

    if (!existsSync(filePath)) {
      return null;
    }

    return readFileSync(filePath, "utf8");
  }

  setItem(key: string, value: string): void {
    const filePath = this.filePathForKey(key);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, value, "utf8");
  }

  removeItem(key: string): void {
    const filePath = this.filePathForKey(key);

    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  }

  private filePathForKey(key: string): string {
    return resolve(this.dataDirectory, `${key.replace(/[^a-z0-9._-]/gi, "_")}.json`);
  }
}
