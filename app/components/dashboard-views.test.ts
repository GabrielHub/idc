import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  type DateMessage,
  type JudgeSnapshot,
  type Member,
  type PlayerKnowledgeRecord,
} from "../domain/game";
import { starterScenarios } from "../fixtures";
import { createSeedGameSave, makePairId } from "../services/game-seed";
import { startAndDraftDateSession, withFeaturedMembers } from "../services/test-helpers";
import {
  buildTranscriptItems,
  resolveDatePlaybackUiState,
  type StreamingDraftMessage,
} from "./date-view";

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
      usedEvidenceIds: [],
      agreementCandidates: [],
      agreementUpdates: [],
      openLoopCandidates: [],
      openLoopUpdates: [],
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

  it("attaches filed reads to the judge note that created them", () => {
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
      throw new Error("Expected transcript reveal fixture setup.");
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
        text: `Character line ${turnIndex} mentioned memory.`,
        createdAt: `2026-05-05T12:0${turnIndex + 1}:00.000Z`,
      };
    });
    const judgeSnapshot: JudgeSnapshot = {
      id: "judge-reveal-test",
      dateSessionId: started.session.id,
      exchangeIndex: 0,
      dateHealthDelta: -6,
      statDeltas: {},
      memberMoodDeltas: {
        [members[0].id]: -2,
        [members[1].id]: -2,
      },
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["Prophecy pressure landed."],
      playerSummary: "Cupid filed a boundary read.",
      memoryCandidates: [],
      usedEvidenceIds: ["member:gideon-glass:boundary:memory-pressure"],
      agreementCandidates: [],
      agreementUpdates: [],
      openLoopCandidates: [],
      openLoopUpdates: [],
    };
    const session = dateSessionSchema.parse({
      ...started.session,
      currentTurn: 6,
      transcript: [...started.session.transcript, ...characterMessages],
      judgeSnapshots: [judgeSnapshot],
    });
    const read: PlayerKnowledgeRecord = {
      id: "read-1",
      subjectKind: "member",
      subjectId: "gideon-glass",
      readKind: "boundary",
      readId: "member:gideon-glass:boundary:memory-pressure",
      readText: "Gideon guards how his past gets handled.",
      confidence: "filed",
      source: "judge",
      dateSessionId: session.id,
      judgeSnapshotId: judgeSnapshot.id,
      revealedAt: "2026-05-05T12:08:00.000Z",
    };
    const items = buildTranscriptItems(session, members, scenario, [], [read]);
    const judgeItem = items.find((item) => item.tone === "judge");

    expect(judgeItem?.reveals?.map((record) => record.readText)).toEqual([
      "Gideon guards how his past gets handled.",
    ]);
  });

  it("hides repeated streaming drafts until retry text diverges", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const members = started.save.members.filter((member): member is Member =>
      started.session.participants.includes(member.id),
    );

    if (scenario === undefined || members.length !== 2) {
      throw new Error("Expected streaming draft fixture setup.");
    }

    const repeatedLine =
      "it depends on if the mess is something i can actually fix or if it is just someone else's mistake, but i try to leave it at the door.";
    const session = dateSessionSchema.parse({
      ...started.session,
      currentTurn: 2,
      transcript: [
        {
          id: `${started.session.id}-msg-0`,
          dateSessionId: started.session.id,
          kind: "character",
          speakerId: "jenna-pike",
          turnIndex: 1,
          sequenceIndex: 0,
          text: repeatedLine,
          createdAt: "2026-05-05T12:02:00.000Z",
        },
        {
          id: `${started.session.id}-msg-1`,
          dateSessionId: started.session.id,
          kind: "character",
          speakerId: "vhool",
          turnIndex: 2,
          sequenceIndex: 1,
          text: "Vhool asks whether the door has a union representative.",
          createdAt: "2026-05-05T12:03:00.000Z",
        },
      ],
    });
    const baseDraft: StreamingDraftMessage = {
      id: "jenna-pike-2",
      speakerId: "jenna-pike",
      speakerName: "Jenna Pike",
      sequenceIndex: 2,
      turnIndex: 3,
      text: repeatedLine,
      status: "streaming",
    };
    const repeatedDraftItem = buildTranscriptItems(session, members, scenario, [baseDraft]).find(
      (item) => item.id === baseDraft.id,
    );
    const correctedDraft: StreamingDraftMessage = {
      ...baseDraft,
      text: "not really, because if i stayed to fix every little thing, i would never actually get to go home.",
    };
    const correctedDraftItem = buildTranscriptItems(session, members, scenario, [
      correctedDraft,
    ]).find((item) => item.id === correctedDraft.id);

    expect(repeatedDraftItem).toBeUndefined();
    expect(correctedDraftItem?.text).toContain("not really");
  });

  it("keeps an empty initial draft so the bubble can show a thinking indicator", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const members = started.save.members.filter((member): member is Member =>
      started.session.participants.includes(member.id),
    );

    if (scenario === undefined || members.length !== 2) {
      throw new Error("Expected initial draft fixture setup.");
    }

    const pendingDraft: StreamingDraftMessage = {
      id: "jenna-pike-2",
      speakerId: "jenna-pike",
      speakerName: "Jenna Pike",
      sequenceIndex: 2,
      turnIndex: 3,
      text: "",
      status: "streaming",
    };
    const item = buildTranscriptItems(started.session, members, scenario, [pendingDraft]).find(
      (candidate) => candidate.id === pendingDraft.id,
    );

    expect(item).toBeDefined();
    expect(item?.tone).toBe("member");
    expect(item?.text).toBe("");
    expect(item?.isStreaming).toBe(true);
    expect(item?.isDraft).toBe(true);
  });
});

describe("dashboard playback presentation", () => {
  it("shows a queued pause while the active exchange is still streaming", () => {
    const state = resolveDatePlaybackUiState({
      playbackState: "playing",
      pendingDateAction: "advanceExchange",
      queuedPlaybackIntent: "paused",
    });

    expect(state.pauseRequested).toBe(true);
    expect(state.isPaused).toBe(true);
    expect(state.isPlaying).toBe(false);
    expect(state.isStreaming).toBe(true);
    expect(state.playbackBusy).toBe(true);
  });
});
