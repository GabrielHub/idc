import type { DateScenario, Member, ShiftState } from "../../domain/game";
import type { ScenarioRoomRead } from "../../services/match-fit";
import { createSeededRandom } from "../../services/utils";
import { isMemberInCooldown } from "../../services/shift-planning";
import { getMemberAuraConfig } from "../member-aura-registry";
import { resolvePortraitPalette } from "../portrait-palette";
import type { LobbyScenario, StarAvailability, StarMark, StarTier } from "./types";

const FIELD_SEED = "constellation-lobby.v2.parallax-layout";
const FIELD_PADDING_X = 8;
const FIELD_PADDING_Y = 14;
const FIELD_MIN_SPACING = 9;
/** Background dots can crowd each other — overlap reads as cosmic depth, not collision. */
const FIELD_BG_TO_BG_SPACING = 4;
/** Background dots stay clear of mid-tier avatars so the avatar silhouette reads. */
const FIELD_BG_TO_MID_SPACING = 11;
/** Background dots stay well clear of foreground avatars (the picker primaries). */
const FIELD_BG_TO_FG_SPACING = 15;

const TIER_PLACEMENT_ORDER: Record<StarTier, number> = {
  foreground: 0,
  mid: 1,
  background: 2,
};

export function buildLobbyStars(
  members: readonly Member[],
  shift: ShiftState,
  focusedMembers: readonly Member[],
): StarMark[] {
  const rng = createSeededRandom(FIELD_SEED);
  const focusedIds = new Set(focusedMembers.map((m) => m.id));

  // Pre-roll tier / z / phase per member so RNG consumption stays stable
  // regardless of how many placement attempts each star takes.
  const seeded = members.map((member) => {
    const isFocusedLead = focusedIds.has(member.id);
    const tierRoll = rng();
    let tier: StarTier;
    let z: number;
    if (isFocusedLead) {
      tier = "foreground";
      z = 30 + rng() * 30;
    } else if (tierRoll > 0.85) {
      tier = "foreground";
      z = 10 + rng() * 40;
    } else if (tierRoll > 0.55) {
      tier = "mid";
      z = -50 + rng() * 50;
    } else {
      tier = "background";
      z = -200 + rng() * 130;
    }
    const phase = rng() * Math.PI * 2;
    return { member, tier, z, phase };
  });

  // Place foreground first, then mid, then background. Earlier placements
  // anchor primary visual real estate; later placements (background dots) get
  // pushed outward from primaries by the tier-aware spacing rule.
  const placementOrder = seeded
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      const tierDiff = TIER_PLACEMENT_ORDER[a.item.tier] - TIER_PLACEMENT_ORDER[b.item.tier];
      if (tierDiff !== 0) return tierDiff;
      return a.originalIndex - b.originalIndex;
    });

  const placements = new Map<string, { x: number; y: number }>();
  const placedTiers: Array<{ x: number; y: number; tier: StarTier }> = [];

  for (const { item } of placementOrder) {
    const placed = placeStar(item.tier, placedTiers, rng);
    placements.set(item.member.id, placed);
    placedTiers.push({ ...placed, tier: item.tier });
  }

  return seeded.map((item) => {
    const placed = placements.get(item.member.id);
    if (placed === undefined) {
      throw new Error(`Missing placement for ${item.member.id}`);
    }
    return {
      member: item.member,
      palette: resolvePortraitPalette(item.member),
      aura: getMemberAuraConfig(item.member.id),
      x: placed.x,
      y: placed.y,
      z: item.z,
      tier: item.tier,
      availability: availabilityForMember(item.member, shift),
      phase: item.phase,
    };
  });
}

function minSpacing(a: StarTier, b: StarTier): number {
  if (a === "background" && b === "background") return FIELD_BG_TO_BG_SPACING;
  if (a === "background" || b === "background") {
    const other = a === "background" ? b : a;
    if (other === "foreground") return FIELD_BG_TO_FG_SPACING;
    return FIELD_BG_TO_MID_SPACING;
  }
  return FIELD_MIN_SPACING;
}

function placeStar(
  tier: StarTier,
  placed: ReadonlyArray<{ x: number; y: number; tier: StarTier }>,
  rng: () => number,
): { x: number; y: number } {
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const candidateX = FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2);
    const candidateY = FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2);
    const tooClose = placed.some((p) => {
      const spacing = minSpacing(tier, p.tier);
      return (
        (p.x - candidateX) * (p.x - candidateX) + (p.y - candidateY) * (p.y - candidateY) <
        spacing * spacing
      );
    });
    if (!tooClose) {
      return { x: candidateX, y: candidateY };
    }
  }
  // Second pass: relax to the uniform FIELD_MIN_SPACING for every pair. Keeps
  // the spacing-aware fallback from landing a background dot directly on top
  // of a foreground avatar when the dense bg-to-fg constraint exhausts.
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const candidateX = FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2);
    const candidateY = FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2);
    const tooClose = placed.some(
      (p) =>
        (p.x - candidateX) * (p.x - candidateX) + (p.y - candidateY) * (p.y - candidateY) <
        FIELD_MIN_SPACING * FIELD_MIN_SPACING,
    );
    if (!tooClose) {
      return { x: candidateX, y: candidateY };
    }
  }
  // Last resort: the field is saturated. Sample candidates and pick the one
  // farthest from any prior placement so the fallback still gravitates away
  // from existing primaries instead of overlapping them.
  let bestCandidate = {
    x: FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2),
    y: FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2),
  };
  let bestMinDistSq = -1;
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const candidateX = FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2);
    const candidateY = FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2);
    let minDistSq = Infinity;
    for (const p of placed) {
      const distSq =
        (p.x - candidateX) * (p.x - candidateX) + (p.y - candidateY) * (p.y - candidateY);
      if (distSq < minDistSq) minDistSq = distSq;
    }
    if (minDistSq > bestMinDistSq) {
      bestMinDistSq = minDistSq;
      bestCandidate = { x: candidateX, y: candidateY };
    }
  }
  return bestCandidate;
}

function availabilityForMember(member: Member, shift: ShiftState): StarAvailability {
  const status = member.state.status;
  if (status === "closed") return "closed";
  if (status === "quit") return "closed";
  if (isMemberInCooldown(member, shift.shiftNumber)) return "cooling";
  const isFocused = shift.activeBooking?.focusMemberId === member.id;
  if (!isFocused && !shift.availablePartnerMemberIds.includes(member.id)) {
    return "off_shift";
  }
  return "ready";
}

export function toLobbyScenario(
  scenario: DateScenario,
  roomRead: ScenarioRoomRead = "steady",
): LobbyScenario {
  return {
    id: scenario.id,
    title: scenario.title,
    venue: scenario.publicBrief.location,
    cost: scenario.card.cost,
    axes: {
      risk: riskToNumber(scenario.card.risk),
      intimacy: riskToNumber(scenario.card.intimacy),
      chaos: riskToNumber(scenario.card.chaos),
    },
    // Computed by the caller via evaluateMatchFit + scenarioRoomReadFromMatchFit
    // when the focus / partner / pair context is available; "steady" is the
    // safe default when no pair is selected (library mode, scenario library
    // pre-pair).
    roomRead,
  };
}

function riskToNumber(level: "low" | "medium" | "high"): number {
  if (level === "low") return 1;
  if (level === "medium") return 2;
  return 3;
}
