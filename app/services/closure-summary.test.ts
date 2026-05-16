import { describe, expect, it } from "vitest";

import { dateSessionSchema, gameSaveSchema, type GameSave } from "../domain/game";
import {
  buildFallbackClosureSummary,
  generateClosureSummary,
  normalizeClosureSummary,
  type ClosureSummaryRuntime,
} from "./closure-summary";
import { ClosureSummaryValidationError, validateClosureSummary } from "./closures";
import { createSeedGameSave, makePairId } from "./game-seed";
import { getPairProjectionFromSave } from "./relationship-index";

const FIRST_MEMBER_ID = "jenna-pike";
const SECOND_MEMBER_ID = "sana-karim";

const READY_SUMMARY =
  "Jenna and Sana made it through a quiet park loop. They want the next argument to be about groceries.";

function makeReady(save: GameSave) {
  const first = save.members.find((member) => member.id === FIRST_MEMBER_ID);
  const second = save.members.find((member) => member.id === SECOND_MEMBER_ID);
  if (first === undefined || second === undefined) {
    throw new Error("expected fixture members");
  }
  const pairId = makePairId(FIRST_MEMBER_ID, SECOND_MEMBER_ID);
  const pairState = getPairProjectionFromSave(save, pairId);
  if (pairState === undefined) {
    throw new Error("expected pair projection");
  }
  const session = dateSessionSchema.parse({
    id: `date-1-1-${pairId}-park-loop-with-a-dog`,
    pairId,
    scenarioId: "park-loop-with-a-dog",
    focusMemberId: FIRST_MEMBER_ID,
    turnLimit: 30,
    currentTurn: 30,
    dateHealth: 80,
    status: "completed",
    runtimeMode: "local_ai",
    participants: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
    transcript: [
      {
        id: `date-1-1-${pairId}-park-loop-with-a-dog-msg-0`,
        dateSessionId: `date-1-1-${pairId}-park-loop-with-a-dog`,
        kind: "scenario",
        turnIndex: 0,
        sequenceIndex: 0,
        text: "Opening scene.",
        createdAt: "2026-05-01T10:00:00Z",
      },
    ],
    privateStateByCharacter: {},
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    interventions: [],
    finalReport: {
      id: "final-test",
      dateSessionId: `date-1-1-${pairId}-park-loop-with-a-dog`,
      completedAt: "2026-05-01T11:00:00Z",
      outcome: "second_date",
      summary: "Jenna and Sana completed Park Loop With A Dog. Second booking signal is strong.",
      statSummary: "Case read: the pair left with mutual signal.",
      recommendedFollowUp: "encourage",
      memoryRecordIds: [],
      readyToClose: true,
    },
  });

  return {
    pairState,
    participants: [first, second] as [typeof first, typeof second],
    finalReport: session.finalReport!,
    dateSession: session,
  };
}

describe("normalizeClosureSummary", () => {
  it("strips wrapper prefixes and quotes", () => {
    expect(normalizeClosureSummary(`Summary: "${READY_SUMMARY}"`)).toBe(READY_SUMMARY);
  });

  it("collapses whitespace", () => {
    const noisy = "  Jenna   and Sana made it through a quiet park loop.   They want groceries.  ";
    expect(normalizeClosureSummary(noisy)).toBe(
      "Jenna and Sana made it through a quiet park loop. They want groceries.",
    );
  });
});

describe("generateClosureSummary", () => {
  it("returns the validated AI text on first try", async () => {
    const save = createSeedGameSave();
    const ready = makeReady(save);
    const runtime: ClosureSummaryRuntime = {
      generateClosureSummary: async () => READY_SUMMARY,
    };

    const result = await generateClosureSummary({ save, ready, runtime });
    expect(result).toBe(READY_SUMMARY);
  });

  it("retries once with extra guidance, then surfaces validation errors", async () => {
    const save = createSeedGameSave();
    const ready = makeReady(save);
    let calls = 0;
    const runtime: ClosureSummaryRuntime = {
      generateClosureSummary: async () => {
        calls += 1;
        return "Cupid finally landed a match between Jenna and Sana, the app worked beautifully.";
      },
    };

    await expect(generateClosureSummary({ save, ready, runtime })).rejects.toBeInstanceOf(
      ClosureSummaryValidationError,
    );
    expect(calls).toBe(2);
  });

  it("recovers when retry produces a clean draft", async () => {
    const save = createSeedGameSave();
    const ready = makeReady(save);
    let calls = 0;
    const runtime: ClosureSummaryRuntime = {
      generateClosureSummary: async () => {
        calls += 1;
        if (calls === 1) {
          return "Jenna and Sana \u2014 together at last.";
        }
        return READY_SUMMARY;
      },
    };

    const result = await generateClosureSummary({ save, ready, runtime });
    expect(result).toBe(READY_SUMMARY);
    expect(calls).toBe(2);
  });

  it("excludes non-public pair memories from the closure prompt", async () => {
    const save = createSeedGameSave();
    const ready = makeReady(save);
    const privateText = "Sana privately said the elevator knows her salary.";
    const saveWithPrivateMemory = gameSaveSchema.parse({
      ...save,
      memories: [
        ...save.memories,
        {
          id: "memory-private-closure-test",
          scope: "pair",
          visibility: "member_private",
          subjectIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
          visibleToMemberIds: [FIRST_MEMBER_ID],
          pairId: ready.pairState.id,
          text: privateText,
          tags: ["private_date_memory"],
          importance: 3,
          createdAt: "2026-05-01T10:30:00Z",
        },
      ],
    });
    let prompt = "";
    const runtime: ClosureSummaryRuntime = {
      generateClosureSummary: async ({ packet }) => {
        prompt = packet.prompt;
        return READY_SUMMARY;
      },
    };

    await generateClosureSummary({ save: saveWithPrivateMemory, ready, runtime });

    expect(prompt).not.toContain(privateText);
  });
});

describe("buildFallbackClosureSummary", () => {
  it("references the member first names and the date count", () => {
    const save = createSeedGameSave();
    const ready = makeReady(save);
    const summary = buildFallbackClosureSummary({
      participants: ready.participants,
      pairState: { completedDateIds: ["a", "b", "c"] },
    });

    expect(summary).toContain(ready.participants[0].firstName);
    expect(summary).toContain(ready.participants[1].firstName);
    expect(summary).toContain("3 dates");
    expect(() => validateClosureSummary(summary)).not.toThrow();
  });
});
