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
    expect(SORTED_RELEASE_NOTES.map((note) => note.version)).toEqual([
      "0.3.0",
      "0.2.7",
      "0.2.6",
      "0.2.5",
      "0.2.4",
      "0.2.3",
      "0.2.2",
      "0.2.1",
      "0.2.0",
    ]);
    expect(compareReleaseVersions("0.3.0", "0.2.7")).toBeGreaterThan(0);
  });

  it("returns current and previous notes for the modal", () => {
    expect(
      listReleaseNotesForModal({ currentVersion: "v0.3.0" }).map((note) => note.version),
    ).toEqual(["0.3.0", "0.2.7", "0.2.6"]);
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
