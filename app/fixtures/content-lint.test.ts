import { describe, expect, it } from "vitest";

import { type Member, SCENARIO_EVENT_KINDS, SCENARIO_EVENTS_PER_KIND } from "../domain/game";
import { memberRequests } from "./goals";
import { MANAGER_QUIP_CATALOG, type ManagerQuipTriggerKey } from "./manager-quips";
import { starterMembers } from "./members";
import { starterScenarios } from "./scenarios";

// Em dash (U+2014) and en dash (U+2013) are banned everywhere per AGENTS.md.
const DASH_PATTERN = new RegExp(
  `[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]`,
  "u",
);

// AI-slop words banned by CLAUDE.md. Only the patterns that match the banned
// usage cleanly; words banned only as filler or as verbs (robust, leverage,
// harness) cannot be detected by regex without false positives.
const AI_SLOP_PATTERNS: ReadonlyArray<RegExp> = [
  /\bdelve(?:s|d|ing)?\b/iu,
  /\bin essence\b/iu,
  /\bmoreover\b/iu,
  /\bit is worth noting\b/iu,
  /\btapestry\b/iu,
  /\bintricate\b/iu,
  /\bmyriad\b/iu,
  /\bplethora\b/iu,
  /\belevate(?:s|d|ing)?\b/iu,
  /\bunleash(?:es|ed|ing)?\b/iu,
];

// Complements REVEAL_BIOGRAPHY_DRIFT_PATTERNS in scenarios.test.ts. These extra
// patterns catch invented backstory, relatives, and childhood hooks that a
// scenario reveal must never assert for the focused member.
const REVEAL_BIOGRAPHY_DRIFT_PATTERNS: ReadonlyArray<RegExp> = [
  /\bback in (high school|college|the day|the (?:early|late) \d{4}s)\b/iu,
  /\bremember when\b/iu,
  /\bgrew up (in|with)\b/iu,
  /\bwhen (he|she|they) was (a kid|young|little)\b/iu,
  /\b(his|her|their) (childhood|hometown|ex)\b/iu,
  /\b(his|her|their) (mother|father|mom|dad)\b/iu,
];

const LOGISTICS_ACTOR_PATTERN = String.raw`\b(?:i|i'm|im|i am|i'll|ill|we|we're|you|you'll|partner|counterpart|date|someone|he|she|they)\b`;
const LOGISTICS_ACTION_PATTERN = String.raw`\b(?:pick|picks|picked|picking|choose|chooses|chose|chosen|select|selects|selected|booked)\b`;
const LOGISTICS_OBJECT_PATTERN = String.raw`\b(?:place|spot|restaurant|venue|bar|steakhouse|patio|time|hour|day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b`;
const NON_CUPID_LOGISTICS_AGENCY_PATTERNS: ReadonlyArray<RegExp> = [
  new RegExp(
    `${LOGISTICS_ACTOR_PATTERN}[^.!?\\n]{0,80}${LOGISTICS_ACTION_PATTERN}[^.!?\\n]{0,60}${LOGISTICS_OBJECT_PATTERN}`,
    "iu",
  ),
  new RegExp(
    `${LOGISTICS_OBJECT_PATTERN}[^.!?\\n]{0,60}${LOGISTICS_ACTOR_PATTERN}[^.!?\\n]{0,80}${LOGISTICS_ACTION_PATTERN}`,
    "iu",
  ),
  new RegExp(
    `${LOGISTICS_ACTOR_PATTERN}[^.!?\\n]{0,80}\\b(?:name|names|named)\\s+(?:a|the)?\\s*(?:place|spot|restaurant|venue|bar|steakhouse|patio|time|hour)\\b`,
    "iu",
  ),
  new RegExp(
    `${LOGISTICS_ACTOR_PATTERN}[^.!?\\n]{0,80}\\b(?:book|books)\\s+(?:a|the)?\\s*(?:place|spot|restaurant|venue|bar|steakhouse|patio)\\b`,
    "iu",
  ),
];
const CUPID_LOGISTICS_AGENCY_PATTERN = new RegExp(
  String.raw`\bCupid\b[^.!?\n]{0,40}${LOGISTICS_ACTION_PATTERN}[^.!?\n]{0,60}${LOGISTICS_OBJECT_PATTERN}`,
  "iu",
);

// Manager quip length ceiling. The voice doc targets five to twelve words and
// one or two sentences; the lint caps a generous ceiling so future authors do
// not drift well past the target. onboarding.welcome is the documented
// exception and runs much longer.
const MANAGER_QUIP_MAX_WORDS = 20;
const MANAGER_QUIP_MAX_SENTENCES = 4;
const MANAGER_QUIP_MAX_CHARS = 150;
const MANAGER_QUIP_LENGTH_EXEMPT: ReadonlySet<ManagerQuipTriggerKey> = new Set([
  "onboarding.welcome",
]);

const MEMBER_MOOD_PORTRAIT_VARIANTS = ["flirty", "confused", "angry"] as const;

function memberContentText(member: Member): string {
  return [
    member.bio,
    member.datingProfile,
    member.visualDescription,
    ...member.relationshipNeeds,
    ...member.preferences,
    ...member.dealbreakers,
    ...member.secrets,
    member.voice.register,
    ...member.voice.tics,
    ...member.voice.sampleMessages.greeting,
    ...member.voice.sampleMessages.hingeBits,
    ...member.voice.sampleMessages.warming,
    ...member.voice.sampleMessages.cooling,
    ...member.voice.sampleMessages.crashingOut,
  ].join("\n");
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/u).length;
}

function countSentences(text: string): number {
  return text
    .split(/[.!?]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0).length;
}

function nonCupidLogisticsAgencySentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+|\n/u);
  const violations: string[] = [];

  for (const sentence of sentences) {
    if (CUPID_LOGISTICS_AGENCY_PATTERN.test(sentence)) {
      continue;
    }

    if (NON_CUPID_LOGISTICS_AGENCY_PATTERNS.some((pattern) => pattern.test(sentence))) {
      violations.push(sentence.trim());
    }
  }

  return violations;
}

describe("fixture content lint", () => {
  describe("scenario event balance", () => {
    it("ships exactly three of each event kind per scenario", () => {
      const violations: string[] = [];

      for (const scenario of starterScenarios) {
        for (const kind of SCENARIO_EVENT_KINDS) {
          const count = scenario.director.events.filter((event) => event.kind === kind).length;
          if (count !== SCENARIO_EVENTS_PER_KIND) {
            violations.push(`${scenario.id} has ${count} ${kind} events`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("gives every event a unique title within its scenario", () => {
      const violations: string[] = [];

      for (const scenario of starterScenarios) {
        const counts = new Map<string, number>();
        for (const event of scenario.director.events) {
          counts.set(event.title, (counts.get(event.title) ?? 0) + 1);
        }
        for (const [title, count] of counts) {
          if (count > 1) {
            violations.push(`${scenario.id} repeats "${title}"`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("scenario reveals do not invent biography", () => {
    it("avoids invented backstory, relatives, and childhood cues", () => {
      const violations: string[] = [];

      for (const scenario of starterScenarios) {
        for (const event of scenario.director.events) {
          if (event.kind !== "reveal") continue;
          const visibleText = `${event.event} ${event.characterVisibleText}`;
          for (const pattern of REVEAL_BIOGRAPHY_DRIFT_PATTERNS) {
            if (pattern.test(visibleText)) {
              violations.push(`${scenario.id}/${event.id} matches ${pattern}`);
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("member voice constraints", () => {
    it("uses no em dashes or en dashes in authored copy", () => {
      const violations: string[] = [];

      for (const member of starterMembers) {
        if (DASH_PATTERN.test(memberContentText(member))) {
          violations.push(member.id);
        }
      }

      expect(violations).toEqual([]);
    });

    it("uses no banned AI-slop words in authored copy", () => {
      const violations: string[] = [];

      for (const member of starterMembers) {
        const text = memberContentText(member);
        for (const pattern of AI_SLOP_PATTERNS) {
          if (pattern.test(text)) {
            violations.push(`${member.id} matches ${pattern}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("does not assign Cupid date logistics to members or partners", () => {
      const violations: string[] = [];

      for (const member of starterMembers) {
        for (const sentence of nonCupidLogisticsAgencySentences(memberContentText(member))) {
          violations.push(`${member.id}: ${sentence}`);
        }
      }

      for (const request of memberRequests) {
        for (const sentence of nonCupidLogisticsAgencySentences(request.text)) {
          violations.push(`${request.id}: ${sentence}`);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("member portrait paths", () => {
    // Schema enforces non-empty strings at parse time; this is defense in
    // depth in case a fixture sneaks past schema parsing or a future schema
    // change relaxes the bound.
    it("declares non-empty paths for every neutral portrait and avatar", () => {
      const violations: string[] = [];

      for (const member of starterMembers) {
        const { portrait, avatar } = member.portraits.neutral;
        if (portrait.sourcePath.length === 0 || portrait.cutoutPath.length === 0) {
          violations.push(`${member.id} neutral portrait`);
        }
        if (avatar.sourcePath.length === 0 || avatar.cutoutPath.length === 0) {
          violations.push(`${member.id} neutral avatar`);
        }
      }

      expect(violations).toEqual([]);
    });

    it("declares non-empty paths for every declared mood portrait", () => {
      const violations: string[] = [];

      for (const member of starterMembers) {
        for (const mood of MEMBER_MOOD_PORTRAIT_VARIANTS) {
          const variant = member.portraits[mood];
          if (variant === undefined) continue;
          const { sourcePath, cutoutPath } = variant.portrait;
          if (sourcePath.length === 0 || cutoutPath.length === 0) {
            violations.push(`${member.id} ${mood}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("chat bubble schema", () => {
    // Per app/docs/product/visual-design.tsx, every non-human member should
    // declare a distinctive chatBubble. Ordinary humans fall back to the
    // default iMessage blue.
    it("declares a chatBubble on every non-human member", () => {
      const violations: string[] = [];

      for (const member of starterMembers) {
        if (member.tags.includes("non_human") && member.chatBubble === undefined) {
          violations.push(member.id);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("manager quips", () => {
    it("keeps non-onboarding quip text within the length ceiling", () => {
      const violations: string[] = [];

      for (const quip of MANAGER_QUIP_CATALOG) {
        if (MANAGER_QUIP_LENGTH_EXEMPT.has(quip.triggerKey)) continue;

        const words = countWords(quip.text);
        if (words > MANAGER_QUIP_MAX_WORDS) {
          violations.push(`${quip.id} has ${words} words`);
        }

        const sentences = countSentences(quip.text);
        if (sentences > MANAGER_QUIP_MAX_SENTENCES) {
          violations.push(`${quip.id} has ${sentences} sentences`);
        }

        if (quip.text.length > MANAGER_QUIP_MAX_CHARS) {
          violations.push(`${quip.id} has ${quip.text.length} chars`);
        }
      }

      expect(violations).toEqual([]);
    });

    it("uses no em dashes or en dashes in quip text or generation scripts", () => {
      const violations: string[] = [];

      for (const quip of MANAGER_QUIP_CATALOG) {
        if (DASH_PATTERN.test(quip.text)) {
          violations.push(`${quip.id} text`);
        }
        if (quip.generationScript !== undefined && DASH_PATTERN.test(quip.generationScript)) {
          violations.push(`${quip.id} script`);
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
