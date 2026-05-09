import { describe, expect, it } from "vitest";

import { memberSchema, type JudgeSnapshot, type Member, type PortraitAsset } from "../domain/game";
import { starterMembers } from "../fixtures";
import {
  isMemberSpeaking,
  memberStreamingReasoningText,
  readyPortraitMoodPaths,
  selectPortraitAsset,
  selectPortraitMood,
} from "./date-presentation-signals";

const LEFT_MEMBER_ID = "left-member";
const RIGHT_MEMBER_ID = "right-member";

describe("date presentation signals", () => {
  it("derives portrait mood from per-member judge deltas", () => {
    expect(selectPortraitMood(LEFT_MEMBER_ID, undefined)).toBe("neutral");

    expect(
      selectPortraitMood(
        LEFT_MEMBER_ID,
        makeJudgeSnapshot({
          memberMoodDeltas: {
            [LEFT_MEMBER_ID]: 2,
            [RIGHT_MEMBER_ID]: 0,
          },
          statDeltas: {
            spark: 2,
          },
        }),
      ),
    ).toBe("flirty");

    expect(
      selectPortraitMood(
        LEFT_MEMBER_ID,
        makeJudgeSnapshot({
          memberMoodDeltas: {
            [LEFT_MEMBER_ID]: -1,
            [RIGHT_MEMBER_ID]: 0,
          },
          statDeltas: {
            spark: 0,
            trust: -1,
          },
        }),
      ),
    ).toBe("confused");

    expect(
      selectPortraitMood(
        LEFT_MEMBER_ID,
        makeJudgeSnapshot({
          memberMoodDeltas: {
            [LEFT_MEMBER_ID]: -1,
            [RIGHT_MEMBER_ID]: 3,
          },
          statDeltas: {
            conflict: 4,
            spark: 3,
          },
        }),
      ),
    ).toBe("angry");

    expect(
      selectPortraitMood(
        RIGHT_MEMBER_ID,
        makeJudgeSnapshot({
          memberMoodDeltas: {
            [LEFT_MEMBER_ID]: -1,
            [RIGHT_MEMBER_ID]: 3,
          },
          statDeltas: {
            conflict: 4,
            spark: 3,
          },
        }),
      ),
    ).toBe("flirty");
  });

  it("keeps unsupported or missing mood evidence neutral", () => {
    expect(
      selectPortraitMood(
        LEFT_MEMBER_ID,
        makeJudgeSnapshot({
          memberMoodDeltas: {
            [RIGHT_MEMBER_ID]: -3,
          },
          statDeltas: {
            conflict: 8,
          },
          shouldEndEarly: true,
        }),
      ),
    ).toBe("neutral");

    expect(
      selectPortraitMood(
        LEFT_MEMBER_ID,
        makeJudgeSnapshot({
          memberMoodDeltas: {
            [LEFT_MEMBER_ID]: -2,
          },
          statDeltas: {
            trust: 3,
          },
        }),
      ),
    ).toBe("neutral");
  });

  it("only treats active streaming drafts as speaking", () => {
    expect(
      isMemberSpeaking(LEFT_MEMBER_ID, [
        {
          speakerId: LEFT_MEMBER_ID,
          status: "done",
        },
        {
          speakerId: RIGHT_MEMBER_ID,
          status: "streaming",
        },
      ]),
    ).toBe(false);

    expect(
      isMemberSpeaking(LEFT_MEMBER_ID, [
        {
          speakerId: LEFT_MEMBER_ID,
          status: "streaming",
        },
      ]),
    ).toBe(true);

    expect(
      memberStreamingReasoningText(LEFT_MEMBER_ID, [
        {
          speakerId: LEFT_MEMBER_ID,
          status: "done",
          reasoningText: "archived thought",
        },
        {
          speakerId: LEFT_MEMBER_ID,
          status: "streaming",
          reasoningText: "active thought",
        },
      ]),
    ).toBe("active thought");
  });

  it("resolves partial portrait variants with neutral fallback", () => {
    const baseMember = requireStarterMember("vhool");
    const flirtyPortrait = makePortraitAsset("flirty");
    const pendingAngryPortrait = makePortraitAsset("angry", "pending");
    const member: Member = {
      ...baseMember,
      portraits: {
        neutral: baseMember.portraits.neutral,
        flirty: {
          portrait: flirtyPortrait,
        },
        angry: {
          portrait: pendingAngryPortrait,
        },
      },
    };

    expect(memberSchema.parse(member).portraits.flirty?.portrait.cutoutPath).toBe(
      flirtyPortrait.cutoutPath,
    );
    expect(selectPortraitAsset(member, "avatar", "flirty")).toBe(
      baseMember.portraits.neutral.avatar,
    );
    expect(selectPortraitAsset(member, "portrait", "flirty")).toBe(flirtyPortrait);
    expect(selectPortraitAsset(member, "portrait", "confused")).toBe(
      baseMember.portraits.neutral.portrait,
    );
    expect(selectPortraitAsset(member, "portrait", "angry")).toBe(
      baseMember.portraits.neutral.portrait,
    );
    expect(readyPortraitMoodPaths(member)).toEqual([
      baseMember.portraits.neutral.portrait.cutoutPath,
      flirtyPortrait.cutoutPath,
    ]);
  });
});

function makeJudgeSnapshot({
  memberMoodDeltas = {},
  statDeltas = {},
  shouldEndEarly = false,
}: {
  memberMoodDeltas?: Record<string, number>;
  statDeltas?: JudgeSnapshot["statDeltas"];
  shouldEndEarly?: boolean;
} = {}): JudgeSnapshot {
  return {
    id: "judge-test",
    dateSessionId: "date-test",
    exchangeIndex: 1,
    dateHealthDelta: 0,
    statDeltas,
    memberMoodDeltas,
    shouldEndEarly,
    endSentiment: null,
    notableMoments: ["Cupid observed a test exchange."],
    playerSummary: "Cupid filed the exchange.",
    memoryCandidates: [],
  };
}

function makePortraitAsset(mood: string, model?: string): PortraitAsset {
  return {
    sourcePath: `assets-source/portraits/vhool/portrait-${mood}.png`,
    cutoutPath: `/assets/portraits/vhool/portrait-${mood}.png`,
    model,
  };
}

function requireStarterMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);

  if (member === undefined) {
    throw new Error(`Missing starter member: ${memberId}`);
  }

  return member;
}
