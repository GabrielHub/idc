import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  __listDateAmbientTrackUrlsForTests,
  __selectDateAmbientTrackUrlForTests,
} from "./sfx-engine";

describe("date ambient tracks", () => {
  it("points at checked-in public audio assets", () => {
    const urls = __listDateAmbientTrackUrlsForTests();

    expect(urls).toHaveLength(3);
    expect(new Set(urls).size).toBe(urls.length);

    for (const url of urls) {
      expect(url).toMatch(/^\/assets\/audio\/date-ambient-.+\.(mp3|wav)$/);
      expect(existsSync(join(process.cwd(), "public", url.slice(1)))).toBe(true);
    }
  });

  it("selects across the full date ambient track list", () => {
    expect(__selectDateAmbientTrackUrlForTests(0)).toBe("/assets/audio/date-ambient-jazz.mp3");
    expect(__selectDateAmbientTrackUrlForTests(0.34)).toBe("/assets/audio/date-ambient-jazz-2.wav");
    expect(__selectDateAmbientTrackUrlForTests(0.99)).toBe("/assets/audio/date-ambient-lo-fi.wav");
  });
});
