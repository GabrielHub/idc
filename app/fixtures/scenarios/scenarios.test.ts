import { describe, expect, it } from "vitest";

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

function eventHasOffstageCue(eventText: string): boolean {
  const mentionsRole = OFFSTAGE_SPEAKER_ROLE_PATTERN.test(eventText);
  const hasUtterance = ENVIRONMENTAL_UTTERANCE_PATTERNS.some((pattern) => pattern.test(eventText));
  const hasSpeechVerb = OFFSTAGE_SPEAKER_PATTERNS.some((pattern) => pattern.test(eventText));

  return mentionsRole || hasUtterance || hasSpeechVerb;
}

describe("scenario fixtures", () => {
  it("ships exactly 39 starter scenarios", () => {
    expect(starterScenarios).toHaveLength(39);
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
