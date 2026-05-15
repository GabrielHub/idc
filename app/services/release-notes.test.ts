import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";
import { createSeedGameSave } from "./game-seed";
import {
  compareReleaseVersions,
  getReleaseNoteByVersion,
  hasReleaseNotesEligibleSaveProgress,
  listReleaseNotesForModal,
  shouldOpenReleaseNotes,
  SORTED_RELEASE_NOTES,
} from "./release-notes";

describe("release notes", () => {
  it("ships a public note for the current package version", () => {
    expect(getReleaseNoteByVersion(packageJson.version)?.version).toBe(packageJson.version);
  });

  it("sorts notes by semantic version descending", () => {
    const versions = SORTED_RELEASE_NOTES.map((note) => note.version);

    expect(versions).toEqual(
      [...versions].sort((left, right) => compareReleaseVersions(right, left)),
    );
    expect(new Set(versions).size).toBe(versions.length);
    expect(versions[0]).toBe(packageJson.version);
    expect(compareReleaseVersions("0.3.1", "0.3.0")).toBeGreaterThan(0);
  });

  it("returns current and previous notes for the modal", () => {
    expect(
      listReleaseNotesForModal({ currentVersion: `v${packageJson.version}` }).map(
        (note) => note.version,
      ),
    ).toEqual(SORTED_RELEASE_NOTES.slice(0, 3).map((note) => note.version));
  });

  it("opens on first launch only when an existing save has progress", () => {
    expect(
      shouldOpenReleaseNotes({
        currentVersion: "0.2.7",
        lastSeenVersion: null,
        hasExistingSaveProgress: false,
      }),
    ).toBe(false);

    expect(
      shouldOpenReleaseNotes({
        currentVersion: "0.2.7",
        lastSeenVersion: null,
        hasExistingSaveProgress: true,
      }),
    ).toBe(true);
  });

  it("opens when the stored version is older than the current version", () => {
    expect(
      shouldOpenReleaseNotes({
        currentVersion: "0.2.7",
        lastSeenVersion: "0.2.5",
        hasExistingSaveProgress: false,
      }),
    ).toBe(true);

    expect(
      shouldOpenReleaseNotes({
        currentVersion: "v0.2.7",
        lastSeenVersion: "0.2.7",
        hasExistingSaveProgress: true,
      }),
    ).toBe(false);
  });

  it("does not treat seed save starter memories as upgrade progress", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));

    expect(seed.memories.length).toBeGreaterThan(0);
    expect(hasReleaseNotesEligibleSaveProgress(seed)).toBe(false);
    expect(hasReleaseNotesEligibleSaveProgress({ ...seed, focusedMemberIds: ["jenna-pike"] })).toBe(
      true,
    );
  });
});
