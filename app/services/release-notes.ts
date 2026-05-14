import { releaseNotesCatalog } from "../fixtures/release-notes";
import type { PublicReleaseNote } from "../domain/release-notes";
import type { GameSave } from "../domain/game";

export const RELEASE_NOTES_LAST_SEEN_STORAGE_KEY = "idc.cupid.releaseNotes.lastSeenVersion";

export const SORTED_RELEASE_NOTES = [...releaseNotesCatalog].sort((left, right) =>
  compareReleaseVersions(right.version, left.version),
);

export function readStoredReleaseNotesVersion(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(RELEASE_NOTES_LAST_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredReleaseNotesVersion(version: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RELEASE_NOTES_LAST_SEEN_STORAGE_KEY, version);
  } catch {
    return;
  }
}

export function getReleaseNoteByVersion(version: string): PublicReleaseNote | undefined {
  const normalizedVersion = normalizeReleaseVersion(version);
  return SORTED_RELEASE_NOTES.find((note) => note.version === normalizedVersion);
}

export function listReleaseNotesForModal({
  currentVersion,
  previousCount = 2,
}: {
  currentVersion: string;
  previousCount?: number;
}): PublicReleaseNote[] {
  const normalizedVersion = normalizeReleaseVersion(currentVersion);
  const currentIndex = SORTED_RELEASE_NOTES.findIndex((note) => note.version === normalizedVersion);

  if (currentIndex === -1) {
    return SORTED_RELEASE_NOTES.slice(0, previousCount + 1);
  }

  return SORTED_RELEASE_NOTES.slice(currentIndex, currentIndex + previousCount + 1);
}

export function shouldOpenReleaseNotes({
  currentVersion,
  lastSeenVersion,
  hasExistingSaveProgress,
}: {
  currentVersion: string;
  lastSeenVersion: string | null;
  hasExistingSaveProgress: boolean;
}): boolean {
  if (lastSeenVersion === null) {
    return hasExistingSaveProgress;
  }

  return normalizeReleaseVersion(lastSeenVersion) !== normalizeReleaseVersion(currentVersion);
}

export function hasReleaseNotesEligibleSaveProgress(save: GameSave): boolean {
  return (
    save.dateSessions.length > 0 ||
    save.focusedMemberIds.length > 0 ||
    save.playerKnowledge.length > 0 ||
    save.closureCount > 0 ||
    save.shifts.length > 1 ||
    save.shifts.some(
      (shift) =>
        shift.featuredMemberIds.length > 0 || shift.dateSlotsUsed > 0 || shift.status !== "active",
    )
  );
}

export function compareReleaseVersions(left: string, right: string): number {
  const leftParts = parseReleaseVersion(left);
  const rightParts = parseReleaseVersion(right);

  for (let index = 0; index < leftParts.length; index += 1) {
    const delta = leftParts[index] - rightParts[index];
    if (delta !== 0) {
      return delta;
    }
  }

  return 0;
}

export function normalizeReleaseVersion(version: string): string {
  return version.trim().replace(/^v/u, "");
}

function parseReleaseVersion(version: string): [number, number, number] {
  const normalizedVersion = normalizeReleaseVersion(version);
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(normalizedVersion);

  if (match === null) {
    return [0, 0, 0];
  }

  const [, major, minor, patch] = match;
  return [Number(major), Number(minor), Number(patch)];
}
