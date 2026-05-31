import type { DateScenario, Member, MemberTag } from "../domain/game";

export type MemberScenarioBoundaryRiskKind = "prophecy" | "public_exposure" | "forced_recovery";

export type MemberScenarioBoundaryRisk = {
  kind: MemberScenarioBoundaryRiskKind;
  reason: string;
};

export type MemberScenarioPolicy = {
  lowPressureSupported: boolean;
  highPressureStrain: boolean;
  prophecyPressure: boolean;
  publicPressure: boolean;
  memoryPressure: boolean;
  griefPressure: boolean;
  careerContext: boolean;
  statusCareerContext: boolean;
  weirdnessNative: boolean;
  weirdnessNativeContext: boolean;
  clearPlanSupported: boolean;
  clearPlanStrain: boolean;
  boundaryRisk: MemberScenarioBoundaryRisk | null;
};

export function deriveMemberScenarioPolicy(
  member: Member,
  scenario: DateScenario,
): MemberScenarioPolicy {
  const scenarioTags = scenario.card.tags;
  const lowPressureSupported =
    memberHasTag(member, "needs_low_pressure") && scenarioTags.includes("low_pressure");
  const highPressureStrain =
    memberHasTag(member, "needs_low_pressure") && scenarioTags.includes("high_pressure");
  const prophecyPressure =
    memberHasTag(member, "prophecy_averse") && scenarioTags.includes("prophecy");
  const publicPressure =
    memberHasTag(member, "privacy_sensitive") && scenarioTags.includes("public");
  const memoryPressure =
    memberHasTag(member, "memory_sensitive") && scenarioTags.includes("memory");
  const griefPressure = memberHasTag(member, "grief_sensitive") && scenarioTags.includes("memory");
  const careerContext = memberHasTag(member, "career_focused") && scenarioTags.includes("career");
  const statusCareerContext =
    memberHasTag(member, "status_sensitive") && scenarioTags.includes("career");
  const weirdnessNative = memberHasTag(member, "weirdness_native");
  const weirdnessNativeContext = weirdnessNative && scenario.card.chaos !== "low";
  const clearPlanSupported =
    memberHasTag(member, "needs_clear_plan") && scenario.card.chaos === "low";
  const clearPlanStrain =
    memberHasTag(member, "needs_clear_plan") && scenario.card.chaos === "high";

  return {
    lowPressureSupported,
    highPressureStrain,
    prophecyPressure,
    publicPressure,
    memoryPressure,
    griefPressure,
    careerContext,
    statusCareerContext,
    weirdnessNative,
    weirdnessNativeContext,
    clearPlanSupported,
    clearPlanStrain,
    boundaryRisk: deriveMemberScenarioBoundaryRisk({
      prophecyPressure,
      privacySensitive: memberHasTag(member, "privacy_sensitive"),
      griefSensitive: memberHasTag(member, "grief_sensitive"),
      scenario,
    }),
  };
}

export function memberHasTag(member: Member, tag: MemberTag): boolean {
  return member.tags.includes(tag);
}

function deriveMemberScenarioBoundaryRisk({
  prophecyPressure,
  privacySensitive,
  griefSensitive,
  scenario,
}: {
  prophecyPressure: boolean;
  privacySensitive: boolean;
  griefSensitive: boolean;
  scenario: DateScenario;
}): MemberScenarioBoundaryRisk | null {
  if (prophecyPressure) {
    return { kind: "prophecy", reason: "Prophecy tripped a visible dealbreaker." };
  }

  if (privacySensitive && scenario.id === "museum-exhibit-mixup") {
    return { kind: "public_exposure", reason: "Public exposure tripped a visible dealbreaker." };
  }

  if (
    griefSensitive &&
    scenario.card.tags.includes("memory") &&
    scenario.card.intimacy === "high"
  ) {
    return { kind: "forced_recovery", reason: "Forced recovery tripped a visible dealbreaker." };
  }

  return null;
}
