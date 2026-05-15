import { describe, expect, it } from "vitest";

import { STARTER_BUDGET_CAP } from "../../domain/game";
import { STARTER_CATALOG_IDS } from "../../services/deck";
import { starterMembers } from "../members";
import { starterScenarios } from "./index";

const OFFSTAGE_SPEAKER_PATTERNS = [
  /\bsays?\b/i,
  /\btells?\b/i,
  /\basks?\b/i,
  /\breplies\b/i,
  /\banswers\b/i,
  /\bshouts?\b/i,
  /\bcalls? out\b/i,
  /\bgreets?\b/i,
  /\bmurmurs?\b/i,
  /\bwhispers?\b/i,
];

const OFFSTAGE_SPEAKER_ROLE_PATTERN =
  /\b(server|waitress|bartender|host|hostess|clerk|volunteer|audio guide|intercom|p\.?a\.?|coordinator|attendant|ranger|sommelier|manager|cook|staffer|narrator|deity|god|creature|villager|peer|cashier|usher|photographer|uncle|patron|captain|resident|band|soldier)\b/i;

const ENVIRONMENTAL_UTTERANCE_PATTERNS = [
  /\bdisplays?\b/i,
  /\breads?\b/i,
  /\basks?\b/i,
  /\bannounces?\b/i,
  /\bspeaks?\b/i,
  /\bcalls? out\b/i,
  /\bvoices?\b/i,
  /:/,
];

const NO_CONTINUING_SPEAKER_PATTERN =
  /does not speak|do not voice|not voiced|does not become a continuing speaker|no reply field|not a continuing speaker|not voiced as continuing dialogue|not voiced as a continuing speaker|stays silent|not voice|is not a speaker|silent ambient pressure|never voice|does not address/i;

const REVEAL_BIOGRAPHY_DRIFT_PATTERNS = [
  /\bused to\b/i,
  /\bin college\b/i,
  /\bknows?.*without being told\b/i,
  /\bspecific summer\b/i,
];

type ScenarioNameReference = {
  scenarioId: string;
  referencedName: string;
};

function eventHasOffstageCue(eventText: string): boolean {
  const mentionsRole = OFFSTAGE_SPEAKER_ROLE_PATTERN.test(eventText);
  const hasUtterance = ENVIRONMENTAL_UTTERANCE_PATTERNS.some((pattern) => pattern.test(eventText));
  const hasSpeechVerb = OFFSTAGE_SPEAKER_PATTERNS.some((pattern) => pattern.test(eventText));

  return mentionsRole || hasUtterance || hasSpeechVerb;
}

function scenarioDesignText(scenario: (typeof starterScenarios)[number]): string {
  return [
    scenario.id,
    scenario.title,
    scenario.card.summary,
    ...scenario.card.idealFor,
    ...scenario.card.badFor,
    scenario.publicBrief.location,
    scenario.publicBrief.premise,
    scenario.publicBrief.openingSituation,
    scenario.publicBrief.whatBothCharactersKnow,
    scenario.director.tone,
    ...scenario.director.rules,
    ...scenario.director.earlyEndTriggers,
    scenario.director.repeatBehavior,
    ...scenario.judgeRubric.successSignals,
    ...scenario.judgeRubric.failureSignals,
    ...scenario.director.events.flatMap((event) => [
      event.id,
      event.title,
      event.event,
      event.characterVisibleText,
      event.directorInstruction,
    ]),
  ].join("\n");
}

function containsName(text: string, name: string): boolean {
  const escaped = name.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}($|[^A-Za-z0-9])`);

  return pattern.test(text);
}

describe("scenario fixtures", () => {
  it("ships exactly 56 starter scenarios", () => {
    expect(starterScenarios).toHaveLength(56);
  });

  it("does not point scenario designs at specific members", () => {
    const memberNames = starterMembers.flatMap((member) => [member.name, member.firstName]);
    const violations: ScenarioNameReference[] = [];

    for (const scenario of starterScenarios) {
      const text = scenarioDesignText(scenario);

      for (const name of memberNames) {
        if (containsName(text, name)) {
          violations.push({ scenarioId: scenario.id, referencedName: name });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  // Per-kind event counts are enforced by dateScenarioSchema at fixture parse time
  // (see app/fixtures/scenarios/index.ts). Unique ids are not, so we keep that here.
  it.each(starterScenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s gives every event a unique id",
    (_id, scenario) => {
      const ids = scenario.director.events.map((event) => event.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    },
  );

  it("guards likely offstage speakers and environmental utterances", () => {
    const violations: string[] = [];

    for (const scenario of starterScenarios) {
      for (const event of scenario.director.events) {
        const visibleEventText = `${event.event} ${event.characterVisibleText}`;

        if (
          eventHasOffstageCue(visibleEventText) &&
          !NO_CONTINUING_SPEAKER_PATTERN.test(event.directorInstruction)
        ) {
          violations.push(`${scenario.id}/${event.id}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("authors a cost between 1 and 50 on every scenario", () => {
    const violations: Array<{ id: string; cost: number | undefined }> = [];

    for (const scenario of starterScenarios) {
      const cost = scenario.card.cost;
      if (typeof cost !== "number" || !Number.isInteger(cost) || cost < 1 || cost > 50) {
        violations.push({ id: scenario.id, cost });
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps the starter catalog draftable inside the starter budget cap", () => {
    const starterCatalog = new Set(STARTER_CATALOG_IDS);
    const starterCards = starterScenarios.filter((scenario) => starterCatalog.has(scenario.id));

    expect(starterCards.length).toBe(STARTER_CATALOG_IDS.length);

    const sortedByCost = [...starterCards].sort((a, b) => a.card.cost - b.card.cost);
    let spend = 0;
    let drafted = 0;

    for (const scenario of sortedByCost) {
      if (drafted >= 12) break;
      if (spend + scenario.card.cost > STARTER_BUDGET_CAP) continue;
      spend += scenario.card.cost;
      drafted += 1;
    }

    expect(drafted).toBeGreaterThanOrEqual(10);
    expect(spend).toBeLessThanOrEqual(STARTER_BUDGET_CAP);
  });

  it("keeps cost distribution close to the authored median", () => {
    const costs = starterScenarios.map((scenario) => scenario.card.cost).sort((a, b) => a - b);
    const median = costs[Math.floor(costs.length / 2)] ?? 0;
    expect(median).toBeGreaterThanOrEqual(10);
    expect(median).toBeLessThanOrEqual(18);
  });

  it("does not hard-code new biography inside reveal visible text", () => {
    const violations: string[] = [];

    for (const scenario of starterScenarios) {
      for (const event of scenario.director.events) {
        if (event.kind !== "reveal") {
          continue;
        }

        const visibleEventText = `${event.event} ${event.characterVisibleText}`;
        const hasBiographyDrift = REVEAL_BIOGRAPHY_DRIFT_PATTERNS.some((pattern) =>
          pattern.test(visibleEventText),
        );

        if (hasBiographyDrift) {
          violations.push(`${scenario.id}/${event.id}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
