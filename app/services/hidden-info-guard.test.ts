import { describe, expect, it } from "vitest";

import { memberSchema, type Member } from "../domain/game";
import { starterMembers } from "../fixtures";
import { detectHiddenInfoLeak, extractDistinctiveTriGram } from "./hidden-info-guard";

const JENNA = requireMember("jenna-pike");
const ALEX = requireMember("alex-yoon");
const GIDEON = requireMember("gideon-glass");
const OPAL = requireMember("opal-sunday");
const VHOOL = requireMember("vhool");

function requireMember(id: string): Member {
  const member = starterMembers.find((entry) => entry.id === id);
  if (member === undefined) throw new Error(`missing member ${id}`);
  return memberSchema.parse(member);
}

describe("hidden info guard", () => {
  it("allows public profile text", () => {
    const publicText = JENNA.datingProfile.split(/\s+/).slice(0, 8).join(" ");

    expect(detectHiddenInfoLeak(publicText, [JENNA])).toBeNull();
  });

  it("detects exact raw hidden biography phrasing", () => {
    const hiddenPhrase = extractDistinctiveTriGram(JENNA.bio);
    const leak = detectHiddenInfoLeak(`So the file says ${hiddenPhrase}.`, [JENNA]);

    expect(leak?.field).toBe("bio");
    expect(leak?.matchKind).toBe("phrase");
  });

  it("detects hidden identity labels on case-file surfaces", () => {
    const leak = detectHiddenInfoLeak(`Origin filed as ${OPAL.origin}.`, [OPAL], {
      includeSingleLabels: true,
    });

    expect(leak?.field).toBe("origin");
  });

  it("detects short hidden species labels on case-file surfaces", () => {
    const leak = detectHiddenInfoLeak(`Species filed as ${GIDEON.species}.`, [GIDEON], {
      includeSingleLabels: true,
    });

    expect(leak?.field).toBe("species");
  });

  it("detects short hidden origin fragments on case-file surfaces", () => {
    const leak = detectHiddenInfoLeak("The note names the Lower Choir.", [VHOOL], {
      includeSingleLabels: true,
    });

    expect(leak?.field).toBe("origin");
  });

  it("does not treat low-signal identity labels as case-file leaks", () => {
    expect(
      detectHiddenInfoLeak("The prime concern was the coffee timer.", [ALEX], {
        includeSingleLabels: true,
      }),
    ).toBeNull();
  });

  it("does not treat a single hidden origin token as a dialogue leak by default", () => {
    const token = OPAL.origin.split(/\s+/).find((part) => part.length >= 6);

    if (token === undefined) {
      throw new Error("Expected a distinctive origin token.");
    }

    expect(detectHiddenInfoLeak(`I used to think about ${token}.`, [OPAL])).toBeNull();
  });
});
