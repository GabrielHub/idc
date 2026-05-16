/* ====================================================================
 * Synthetic roster generator for relationship-graph scale benches
 *
 * Clones validated starter members with deterministic id and first-name
 * suffixes so the relationship layer can be exercised at 40, 100, and
 * 250 members without checking in 250 hand-authored fixtures. Stays in
 * services/ so test files and the AI playground can both reach it.
 *
 * Each clone shifts member state numerically to keep pair stat seeding
 * from collapsing to identical values across copies.
 * ==================================================================== */

import { memberSchema, type GameSave, type Member } from "../domain/game";
import { starterMembers } from "../fixtures";
import { createSeedGameSave, makePairId } from "./game-seed";
import { clampScore } from "./utils";

const STARTER_MEMBER_FIXTURES: Member[] = starterMembers.map((member) =>
  memberSchema.parse(member),
);

export type SyntheticRosterOptions = {
  /** Total member count to produce. Anything <= starter count returns the starter prefix. */
  size: number;
};

/**
 * Builds a deterministic roster of `size` members by cycling starter members
 * with suffixed ids and small state offsets. Copies of the same source member
 * carry suffix indexes 1, 2, 3, etc. Each clone receives unique chat-bubble
 * and voice fingerprints by inheriting the source member's, since only ids,
 * names, and state need to differ for scale work.
 */
export function generateSyntheticRoster({ size }: SyntheticRosterOptions): Member[] {
  if (size <= 0) {
    throw new Error("Synthetic roster size must be a positive integer.");
  }
  if (size <= STARTER_MEMBER_FIXTURES.length) {
    return STARTER_MEMBER_FIXTURES.slice(0, size);
  }

  const roster: Member[] = [...STARTER_MEMBER_FIXTURES];
  const sourceCount = STARTER_MEMBER_FIXTURES.length;
  let cloneIndex = 0;

  while (roster.length < size) {
    cloneIndex += 1;
    for (let sourceIdx = 0; sourceIdx < sourceCount && roster.length < size; sourceIdx += 1) {
      const source = STARTER_MEMBER_FIXTURES[sourceIdx];
      roster.push(cloneMemberWithSuffix(source, cloneIndex));
    }
  }

  return roster;
}

function cloneMemberWithSuffix(source: Member, suffixIndex: number): Member {
  const suffix = `-clone-${suffixIndex}`;
  const moodOffset = (suffixIndex * 3) % 11;
  const opennessOffset = (suffixIndex * 5) % 13;
  const burnoutOffset = (suffixIndex * 2) % 7;
  return memberSchema.parse({
    ...source,
    id: `${source.id}${suffix}`,
    name: `${source.name} ${suffix.slice(1)}`,
    firstName: `${source.firstName}${suffix}`,
    state: {
      ...source.state,
      mood: clampScore(source.state.mood + moodOffset - 5),
      openness: clampScore(source.state.openness + opennessOffset - 6),
      burnout: clampScore(source.state.burnout + burnoutOffset - 3),
    },
  });
}

/**
 * Convenience wrapper: seed a fresh GameSave whose members array is the
 * synthetic roster of the requested size. Pair edges stay sparse (empty
 * pairStates) so scale benches measure projection cost, not seeded bloat.
 */
export function createSyntheticGameSave(size: number, now = new Date()): GameSave {
  const roster = generateSyntheticRoster({ size });
  const seed = createSeedGameSave(now);
  return {
    ...seed,
    members: roster,
  };
}

/**
 * Generates a deterministic set of pair ids from the roster (cycling through
 * the n*(n-1)/2 complete pair set) so benches can sample lookups without
 * scanning the full O(n^2) projection space.
 */
export function sampleSyntheticPairIds(members: readonly Member[], count: number): string[] {
  const sampled: string[] = [];
  const total = members.length;
  if (total < 2) return sampled;
  for (let i = 0; i < count; i += 1) {
    const a = (i * 7) % total;
    let b = (i * 11 + 1) % total;
    if (b === a) b = (b + 1) % total;
    const first = members[a];
    const second = members[b];
    if (first === undefined || second === undefined) continue;
    sampled.push(makePairId(first.id, second.id));
  }
  return sampled;
}
