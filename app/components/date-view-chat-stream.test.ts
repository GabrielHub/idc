import { describe, expect, it } from "vitest";

import { splitMemberMessageBubbles } from "./date-view-chat-stream";

describe("splitMemberMessageBubbles", () => {
  it("splits a member turn into consecutive bubble text on line breaks", () => {
    expect(splitMemberMessageBubbles("first thought.\nsecond thought.")).toEqual([
      "first thought.",
      "second thought.",
    ]);
  });

  it("treats blank-line paragraph breaks as separate bubbles", () => {
    expect(splitMemberMessageBubbles("first.\n\nsecond.\n\n\nthird.")).toEqual([
      "first.",
      "second.",
      "third.",
    ]);
  });

  it("preserves inline markdown inside each bubble segment", () => {
    expect(splitMemberMessageBubbles("I said *almost* normal.\n**Receipt law.**")).toEqual([
      "I said *almost* normal.",
      "**Receipt law.**",
    ]);
  });

  it("returns no segments for empty streaming drafts", () => {
    expect(splitMemberMessageBubbles(" \n ")).toEqual([]);
  });
});
