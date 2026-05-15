import { starterMembers, starterScenarios } from "../fixtures";
import type { AuditCase } from "./date-quality-audit";
import { makePairId } from "./game-seed";

/**
 * Default audit pairs. Hand-picked to stress different relationship axes:
 * - jenna-pike / vhool: human paired with eldritch god, high info-leak risk
 * - mei-sato / gideon-glass: chatty human paired with ghost, mismatched energy
 * - brady-strait / opal-sunday: warm-match baseline, subtler hidden tier
 */
export const DEFAULT_AUDIT_PAIRS: ReadonlyArray<{
  focusMemberId: string;
  partnerMemberId: string;
  label: string;
  notes: string;
}> = [
  {
    focusMemberId: "jenna-pike",
    partnerMemberId: "vhool",
    label: "Jenna x Vhool",
    notes: "Human + eldritch god, stress test for hidden-tier species leaks.",
  },
  {
    focusMemberId: "mei-sato",
    partnerMemberId: "gideon-glass",
    label: "Mei x Gideon",
    notes: "Loud DJ + ghost, mismatched register and high repetition risk.",
  },
  {
    focusMemberId: "brady-strait",
    partnerMemberId: "opal-sunday",
    label: "Brady x Opal",
    notes: "Warm-match baseline, subtler hidden tier from time displacement.",
  },
];

/**
 * Default audit scenarios. Hand-picked to vary venue density:
 * - temporal-coffee-shop: chatty cafe with supernatural quirks, monologue temptation
 * - park-loop-with-a-dog: low-pressure baseline
 * - prophecy-karaoke: high-chaos supernatural, stress test for venue + leak
 */
export const DEFAULT_AUDIT_SCENARIO_IDS: readonly string[] = [
  "temporal-coffee-shop",
  "park-loop-with-a-dog",
  "prophecy-karaoke",
];

export function buildDefaultAuditCases(): AuditCase[] {
  return buildAuditCases(DEFAULT_AUDIT_PAIRS, DEFAULT_AUDIT_SCENARIO_IDS);
}

export function buildAuditCases(
  pairs: ReadonlyArray<{
    focusMemberId: string;
    partnerMemberId: string;
    label?: string;
    notes?: string;
  }>,
  scenarioIds: readonly string[],
): AuditCase[] {
  validateMemberIds(pairs);
  validateScenarioIds(scenarioIds);
  const cases: AuditCase[] = [];
  for (const pair of pairs) {
    for (const scenarioId of scenarioIds) {
      cases.push({
        pairId: makePairId(pair.focusMemberId, pair.partnerMemberId),
        focusMemberId: pair.focusMemberId,
        partnerMemberId: pair.partnerMemberId,
        scenarioId,
        label: pair.label,
        notes: pair.notes,
      });
    }
  }
  return cases;
}

export function buildAuditCasesByIds(
  pairIds: readonly string[],
  scenarioIds: readonly string[],
): AuditCase[] {
  const pairs = pairIds.map((pairId) => {
    const found = DEFAULT_AUDIT_PAIRS.find((entry) => {
      const candidate = makePairId(entry.focusMemberId, entry.partnerMemberId);
      return candidate === pairId;
    });
    if (found === undefined) {
      throw new Error(`Unknown audit pair id: ${pairId}. Known: ${listKnownPairIds().join(", ")}.`);
    }
    return found;
  });
  return buildAuditCases(pairs, scenarioIds);
}

export function listKnownPairIds(): string[] {
  return DEFAULT_AUDIT_PAIRS.map((entry) => makePairId(entry.focusMemberId, entry.partnerMemberId));
}

function validateMemberIds(
  pairs: ReadonlyArray<{ focusMemberId: string; partnerMemberId: string }>,
): void {
  const knownIds = new Set(starterMembers.map((member) => member.id));
  for (const pair of pairs) {
    if (!knownIds.has(pair.focusMemberId)) {
      throw new Error(`Unknown member id: ${pair.focusMemberId}`);
    }
    if (!knownIds.has(pair.partnerMemberId)) {
      throw new Error(`Unknown member id: ${pair.partnerMemberId}`);
    }
    if (pair.focusMemberId === pair.partnerMemberId) {
      throw new Error(`Audit pair must use two different members: ${pair.focusMemberId}`);
    }
  }
}

function validateScenarioIds(scenarioIds: readonly string[]): void {
  const knownIds = new Set(starterScenarios.map((scenario) => scenario.id));
  for (const scenarioId of scenarioIds) {
    if (!knownIds.has(scenarioId)) {
      throw new Error(`Unknown scenario id: ${scenarioId}`);
    }
  }
}
