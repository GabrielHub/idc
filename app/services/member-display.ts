/**
 * Member-facing display formatters that don't belong inside any one component
 * — short profile snippets and height formatting used across hover cards,
 * case-file panels, and member-card atoms.
 */

import type { Member } from "../domain/game";

/** Truncated profile blurb used by hover cards and case-file headers. */
export function profileSnippetFor(member: Member): string {
  const profile = member.datingProfile;
  if (typeof profile === "string" && profile.trim().length > 0) {
    return profile.length > 220 ? `${profile.slice(0, 220).trimEnd()}…` : profile;
  }
  return "Profile reads on file.";
}

/** Render member height as a feet-and-inches string ("5'10\""). */
export function formatHeightShort(heightInInches: number): string {
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches - feet * 12;
  return `${feet}'${inches}"`;
}
