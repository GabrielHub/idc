import { BaseDirectory, mkdir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";

import type { RawSaveStore } from "./raw-save-store";

const SAVE_DIR = "saves";
const MISSING_FILE_PATTERN = /No such file|os error 2|not found/i;

function sanitizeKey(key: string): string {
  return key.replace(/[^a-z0-9._-]/gi, "_");
}

function filePathForKey(key: string): string {
  return `${SAVE_DIR}/${sanitizeKey(key)}.json`;
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

export class TauriAppLocalDataSaveStore implements RawSaveStore {
  private saveDirEnsured = false;

  async read(key: string): Promise<string | null> {
    try {
      return await readTextFile(filePathForKey(key), { baseDir: BaseDirectory.AppLocalData });
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }
      throw error;
    }
  }

  async write(key: string, value: string): Promise<void> {
    await this.ensureSaveDir();
    await writeTextFile(filePathForKey(key), value, {
      baseDir: BaseDirectory.AppLocalData,
    });
  }

  async delete(key: string): Promise<void> {
    try {
      await remove(filePathForKey(key), { baseDir: BaseDirectory.AppLocalData });
    } catch (error) {
      if (isMissingFileError(error)) {
        return;
      }
      throw error;
    }
  }

  private async ensureSaveDir(): Promise<void> {
    if (this.saveDirEnsured) {
      return;
    }
    await mkdir(SAVE_DIR, { baseDir: BaseDirectory.AppLocalData, recursive: true });
    this.saveDirEnsured = true;
  }
}
