import type { GameRepository } from "./game-repository";

export async function tryBackupSave(repository: GameRepository): Promise<string | null> {
  try {
    return await repository.backupSave();
  } catch {
    return null;
  }
}
