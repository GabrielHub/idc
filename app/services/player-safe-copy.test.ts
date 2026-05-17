import { describe, expect, it } from "vitest";

import {
  cleanMemberFacingText,
  scrubPlayerSafeCopy,
  stripForbiddenPunctuation,
} from "./player-safe-copy";

describe("stripForbiddenPunctuation", () => {
  it("returns input untouched when no dashes are present", () => {
    const text = "Jenna and Sana traded receipts, then split the check.";
    expect(stripForbiddenPunctuation(text)).toBe(text);
  });

  it("replaces em and en dashes with commas and normalizes spacing", () => {
    const em = String.fromCharCode(0x2014);
    const en = String.fromCharCode(0x2013);
    expect(stripForbiddenPunctuation(`Jenna ${em} held the room ${en} for one beat.`)).toBe(
      "Jenna, held the room, for one beat.",
    );
  });

  it("replaces ASCII double hyphen used as a break with a comma", () => {
    expect(stripForbiddenPunctuation("so adjacent earth -- yeah, i work dispatch.")).toBe(
      "so adjacent earth, yeah, i work dispatch.",
    );
  });

  it("replaces space hyphen space used as a break with a comma", () => {
    expect(stripForbiddenPunctuation("the jobs fine - benefits are great")).toBe(
      "the jobs fine, benefits are great",
    );
  });

  it("preserves hyphenated compounds and numeric ranges", () => {
    expect(stripForbiddenPunctuation("a co-worker did a 3 - 4 hour shift on the L.")).toBe(
      "a co-worker did a 3 - 4 hour shift on the L.",
    );
  });
});

describe("cleanMemberFacingText", () => {
  it("rewrites internal system terms to the player-facing vocabulary", () => {
    expect(
      cleanMemberFacingText(
        "The scenario ran for twenty turns. Date Health stayed flat during the simulation.",
      ),
    ).toBe("The date ran for twenty messages. comfort stayed flat during the date.");
  });

  it("pluralizes correctly when both forms appear", () => {
    expect(cleanMemberFacingText("Two scenarios filed. One scenario remains open.")).toBe(
      "Two dates filed. One date remains open.",
    );
  });

  it("leaves prose alone when no system terms are present", () => {
    const text = "Brady asked about the lab schedule before ordering a second round.";
    expect(cleanMemberFacingText(text)).toBe(text);
  });
});

describe("scrubPlayerSafeCopy", () => {
  it("strips Final Date Health closing line and inserts a nonnumeric replacement", () => {
    expect(
      scrubPlayerSafeCopy(
        "Brady held the receipt steady through the soft close. Final Date Health was 78.",
      ),
    ).toBe(
      "Brady held the receipt steady through the soft close. Cupid filed a nonnumeric comfort note.",
    );
  });

  it("strips Date Health delta phrasing when prefixed with 'with'", () => {
    expect(
      scrubPlayerSafeCopy(
        "The pair softened the room with Date Health delta +5 at the kitchen counter.",
      ),
    ).toBe("The pair softened the room with a filed comfort movement. at the kitchen counter.");
  });

  it("strips bare stat-number callouts", () => {
    expect(scrubPlayerSafeCopy("Spark 80 and Strain 12 at the close.")).toBe("and at the close.");
  });

  it("strips Date Health bare numbers without leaving a trailing colon", () => {
    expect(scrubPlayerSafeCopy("Date Health: 75 at the soft close.")).toBe("at the soft close.");
  });

  it("strips chemistry, trust, stability, and conflict stat numbers", () => {
    expect(
      scrubPlayerSafeCopy(
        "Chemistry 60. Trust 50. Stability 40. Conflict 20. The pair held the room.",
      ),
    ).toBe("The pair held the room.");
  });

  it("strips signed deltas and percentages", () => {
    expect(scrubPlayerSafeCopy("Spark +5%, Strain -3%, and the pair kept moving.")).toBe(
      "and the pair kept moving.",
    );
  });

  it("rewrites internal terminology in narrative copy", () => {
    expect(
      scrubPlayerSafeCopy("Cupid filed the scenario across twelve turns of the simulation."),
    ).toBe("Cupid filed the date across twelve messages of the date.");
  });

  it("converts em and en dashes to commas before stripping", () => {
    const em = String.fromCharCode(0x2014);
    expect(
      scrubPlayerSafeCopy(`The pair softened${em}Final Date Health was 90${em}and left together.`),
    ).toBe("The pair softened, Cupid filed a nonnumeric comfort note. and left together.");
  });

  it("leaves clean narrative prose untouched", () => {
    const clean =
      "Mei stayed on the lab schedule question. Brady answered without pivoting to himself.";
    expect(scrubPlayerSafeCopy(clean)).toBe(clean);
  });

  it("does not strip numbers attached to non-stat words", () => {
    expect(scrubPlayerSafeCopy("They split the 50 dollar tab and walked home.")).toBe(
      "They split the 50 dollar tab and walked home.",
    );
  });

  it("trims surrounding whitespace and collapses internal runs", () => {
    expect(scrubPlayerSafeCopy("   Jenna   held    the room.   ")).toBe("Jenna held the room.");
  });
});
