import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  type DateMessage,
  type JudgeSnapshot,
  type Member,
} from "../domain/game";
import { starterScenarios } from "../fixtures";
import { createSeedGameSave, makePairId } from "../services/game-seed";
import { startAndDraftDateSession, withFeaturedMembers } from "../services/test-helpers";
import { buildTranscriptItems } from "./dashboard-views";

describe("dashboard transcript presentation", () => {
  it("places judge notes after the full judged turn interval", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "gideon-glass",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "gideon-glass",
      firstMemberId: "gideon-glass",
      secondMemberId: "jenna-pike",
      scenarioId: "museum-exhibit-mixup",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const scenario = starterScenarios.find((candidate) => candidate.id === "museum-exhibit-mixup");
    const members = started.save.members.filter((member): member is Member =>
      started.session.participants.includes(member.id),
    );

    if (scenario === undefined || members.length !== 2) {
      throw new Error("Expected transcript presentation fixture setup.");
    }

    const characterMessages: DateMessage[] = Array.from({ length: 6 }, (_, index) => {
      const turnIndex = index + 1;
      const speaker = members[index % members.length];

      if (speaker === undefined) {
        throw new Error("Expected speaker fixture.");
      }

      return {
        id: `${started.session.id}-msg-${turnIndex}`,
        dateSessionId: started.session.id,
        kind: "character",
        speakerId: speaker.id,
        turnIndex,
        sequenceIndex: turnIndex,
        text: `Character line ${turnIndex}.`,
        createdAt: `2026-05-05T12:0${turnIndex + 1}:00.000Z`,
      };
    });
    const judgeSnapshot: JudgeSnapshot = {
      id: "judge-test",
      dateSessionId: started.session.id,
      exchangeIndex: 0,
      dateHealthDelta: 2,
      statDeltas: { spark: 1 },
      memberMoodDeltas: {
        [members[0].id]: 1,
        [members[1].id]: 1,
      },
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["Cupid saw a useful exchange."],
      playerSummary: "Cupid judged all six character turns.",
      memoryCandidates: [],
    };
    const session = dateSessionSchema.parse({
      ...started.session,
      currentTurn: 6,
      transcript: [...started.session.transcript, ...characterMessages],
      judgeSnapshots: [judgeSnapshot],
    });
    const items = buildTranscriptItems(session, members, scenario, []);
    const judgeIndex = items.findIndex((item) => item.tone === "judge");
    const sixthTurnIndex = items.findIndex((item) => item.text === "Character line 6.");

    expect(judgeIndex).toBeGreaterThan(sixthTurnIndex);
    expect(items.at(judgeIndex)?.text).toBe("Cupid judged all six character turns.");
    expect(session.pairId).toBe(makePairId("gideon-glass", "jenna-pike"));
  });
});
