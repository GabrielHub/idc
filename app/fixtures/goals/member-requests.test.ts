import { describe, expect, it } from "vitest";

import { starterMembers } from "../members";
import { memberRequests } from "./index";

type PublicAskSafetyCase = {
  memberId: string;
  requestId: string;
  bannedPatterns: readonly RegExp[];
};

const PUBLIC_ASK_SAFETY_CASES: readonly PublicAskSafetyCase[] = [
  {
    memberId: "ryan-doyle",
    requestId: "request-ryan-just-out",
    bannedPatterns: [/\bsix\s+year\b/iu, /\b6\s+year\b/iu, /\bbreakup\b/iu, /\beight weeks\b/iu],
  },
  {
    memberId: "derek-halsey",
    requestId: "request-derek-first-ten",
    bannedPatterns: [/\bquiet\b/iu, /\bsilence\b/iu],
  },
];

describe("member request fixtures", () => {
  it("keeps selected public asks from exposing hidden setup details", () => {
    for (const safetyCase of PUBLIC_ASK_SAFETY_CASES) {
      const member = starterMembers.find((candidate) => candidate.id === safetyCase.memberId);
      const request = memberRequests.find((candidate) => candidate.id === safetyCase.requestId);

      if (member === undefined || request === undefined) {
        throw new Error(`Missing public ask safety fixture for ${safetyCase.memberId}.`);
      }

      expect(member.state.currentRequestId).toBe(request.id);

      for (const pattern of safetyCase.bannedPatterns) {
        expect(request.text).not.toMatch(pattern);
      }
    }
  });
});
