import type { DateScenario, Member, ShiftState } from "../../domain/game";
import type { ScenarioRoomRead } from "../../services/match-fit";
import { createSeededRandom } from "../../services/utils";
import { isMemberInCooldown } from "../../services/shift-planning";
import { getMemberAuraConfig } from "../member-aura-registry";
import { resolvePortraitPalette } from "../portrait-palette";
import type { LobbyScenario, StarAvailability, StarMark, StarTier } from "./types";

const FIELD_SEED = "constellation-lobby.v1.layout";
const FIELD_PADDING_X = 8;
const FIELD_PADDING_Y = 14;
const FIELD_MIN_SPACING = 9;

export function buildLobbyStars(
  members: readonly Member[],
  shift: ShiftState,
  focusedMembers: readonly Member[],
): StarMark[] {
  const rng = createSeededRandom(FIELD_SEED);
  const placements: Array<{ x: number; y: number }> = [];
  const stars: StarMark[] = [];
  const focusedIds = new Set(focusedMembers.map((m) => m.id));

  for (const member of members) {
    let placed: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 220; attempt += 1) {
      const candidateX = FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2);
      const candidateY = FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2);
      const tooClose = placements.some(
        (p) =>
          (p.x - candidateX) * (p.x - candidateX) + (p.y - candidateY) * (p.y - candidateY) <
          FIELD_MIN_SPACING * FIELD_MIN_SPACING,
      );
      if (!tooClose) {
        placed = { x: candidateX, y: candidateY };
        break;
      }
    }
    if (placed === null) {
      placed = {
        x: FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2),
        y: FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2),
      };
    }
    placements.push(placed);

    const isFocusedLead = focusedIds.has(member.id);
    const tierRoll = rng();
    let tier: StarTier;
    let z: number;
    if (isFocusedLead) {
      tier = "foreground";
      z = 30 + rng() * 30;
    } else if (tierRoll > 0.55) {
      tier = "foreground";
      z = 10 + rng() * 40;
    } else if (tierRoll > 0.25) {
      tier = "mid";
      z = -50 + rng() * 50;
    } else {
      tier = "background";
      z = -180 + rng() * 110;
    }

    stars.push({
      member,
      palette: resolvePortraitPalette(member),
      aura: getMemberAuraConfig(member.id),
      x: placed.x,
      y: placed.y,
      z,
      tier,
      availability: availabilityForMember(member, shift),
      phase: rng() * Math.PI * 2,
    });
  }

  return stars;
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
