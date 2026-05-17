import { describe, expect, it } from "vitest";

import { createSeedGameSave } from "../services/game-seed";
import { gameSaveSchema, judgeSnapshotSchema, pairStateSchema } from "./game";

describe("game domain schemas", () => {
  it("defaults pair agreements and open loops on legacy pair state data", () => {
    const parsedPairState = pairStateSchema.parse({
      id: "pair-legacy-a-legacy-b",
      participantIds: ["legacy-a", "legacy-b"],
      stats: {
        chemistry: 50,
        trust: 50,
        stability: 50,
        conflict: 20,
        weirdnessTolerance: 50,
        spark: 45,
        strain: 15,
        relationshipHealth: 50,
      },
      completedDateIds: [],
      scenarioUseCounts: {},
    });

    expect(parsedPairState.agreements).toEqual([]);
    expect(parsedPairState.openLoops).toEqual([]);
  });

  it("parses older saves with missing pair memory arrays", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const legacyPairStates = save.pairStates.map((pairState) => {
      const { agreements: _agreements, openLoops: _openLoops, ...legacyPairState } = pairState;
      return legacyPairState;
    });
    const parsedSave = gameSaveSchema.parse({
      ...save,
      pairStates: legacyPairStates,
    });

    expect(parsedSave.pairStates.every((pairState) => pairState.agreements.length === 0)).toBe(
      true,
    );
    expect(parsedSave.pairStates.every((pairState) => pairState.openLoops.length === 0)).toBe(true);
  });

  it("parses legacy member voice samples with opener", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const legacyMembers = save.members.map((member) => {
      const {
        greeting: _greeting,
        hingeBits: _hingeBits,
        ...legacySampleMessages
      } = member.voice.sampleMessages;

      return {
        ...member,
        voice: {
          ...member.voice,
          sampleMessages: {
            opener: member.voice.sampleMessages.greeting,
            ...legacySampleMessages,
          },
        },
      };
    });
    const parsedSave = gameSaveSchema.parse({
      ...save,
      members: legacyMembers,
    });
    const firstMember = parsedSave.members[0];
    const sourceMember = save.members[0];

    if (firstMember === undefined || sourceMember === undefined) {
      throw new Error("Expected seed members.");
    }

    expect(firstMember.voice.sampleMessages.greeting).toEqual(
      sourceMember.voice.sampleMessages.greeting,
    );
    expect(firstMember.voice.sampleMessages.hingeBits).toEqual(
      sourceMember.voice.sampleMessages.greeting,
    );
  });

  it("defaults judge agreement and open loop proposals", () => {
    const snapshot = judgeSnapshotSchema.parse({
      id: "judge-legacy",
      dateSessionId: "date-session-legacy",
      exchangeIndex: 1,
      dateHealthDelta: 0,
      statDeltas: {},
      memberMoodDeltas: {},
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["Cupid found nothing combustible."],
      playerSummary: "Cupid filed the exchange.",
      memoryCandidates: [],
      usedEvidenceIds: [],
    });

    expect(snapshot.agreementCandidates).toEqual([]);
    expect(snapshot.agreementUpdates).toEqual([]);
    expect(snapshot.openLoopCandidates).toEqual([]);
    expect(snapshot.openLoopUpdates).toEqual([]);
  });
});
