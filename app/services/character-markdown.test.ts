import { describe, expect, it } from "vitest";

import {
  detectMarkupAbuses,
  parseMemberMessageMarkdown,
  projectMemberSpeechPlain,
  sanitizeCharacterMarkdownInput,
} from "./character-markdown";

describe("parseMemberMessageMarkdown", () => {
  it("parses a plain message as a single paragraph with one line", () => {
    const blocks = parseMemberMessageMarkdown("just a line.");
    expect(blocks).toHaveLength(1);
    const block = blocks[0];
    expect(block.kind).toBe("paragraph");
    if (block.kind === "paragraph") {
      expect(block.lines).toHaveLength(1);
      expect(block.lines[0]).toEqual([{ kind: "text", text: "just a line." }]);
    }
  });

  it("parses soft line breaks inside a paragraph", () => {
    const blocks = parseMemberMessageMarkdown("first.\nsecond.");
    expect(blocks).toHaveLength(1);
    if (blocks[0].kind === "paragraph") {
      expect(blocks[0].lines).toHaveLength(2);
      expect(blocks[0].lines[0]).toEqual([{ kind: "text", text: "first." }]);
      expect(blocks[0].lines[1]).toEqual([{ kind: "text", text: "second." }]);
    }
  });

  it("splits paragraphs on a blank line", () => {
    const blocks = parseMemberMessageMarkdown("one.\n\ntwo.");
    expect(blocks).toHaveLength(2);
  });

  it("parses inline emphasis", () => {
    const blocks = parseMemberMessageMarkdown("this is *quieter* than i meant.");
    expect(blocks[0].kind).toBe("paragraph");
    if (blocks[0].kind === "paragraph") {
      const line = blocks[0].lines[0];
      expect(line).toEqual([
        { kind: "text", text: "this is " },
        { kind: "emphasis", children: [{ kind: "text", text: "quieter" }] },
        { kind: "text", text: " than i meant." },
      ]);
    }
  });

  it("parses inline strong before emphasis", () => {
    const blocks = parseMemberMessageMarkdown("**No.** ask it properly.");
    if (blocks[0].kind === "paragraph") {
      const line = blocks[0].lines[0];
      expect(line[0]).toEqual({
        kind: "strong",
        children: [{ kind: "text", text: "No." }],
      });
    }
  });

  it("renders a single ATX heading as a heading block", () => {
    const blocks = parseMemberMessageMarkdown("# FOG MACHINE OFF.\n\nthe silence is doing work.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].kind).toBe("heading");
    if (blocks[0].kind === "heading") {
      expect(blocks[0].spans).toEqual([{ kind: "text", text: "FOG MACHINE OFF." }]);
    }
  });

  it("downgrades a second heading hash to plain text inside a paragraph", () => {
    const blocks = parseMemberMessageMarkdown("# first.\n\n## still loud.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].kind).toBe("heading");
    expect(blocks[1].kind).toBe("paragraph");
    if (blocks[1].kind === "paragraph") {
      expect(blocks[1].lines[0]).toEqual([{ kind: "text", text: "still loud." }]);
    }
  });
});

describe("sanitizeCharacterMarkdownInput", () => {
  it("preserves safe italic and strong markers", () => {
    const result = sanitizeCharacterMarkdownInput("this is *quieter*.\n\n**no.**");
    expect(result.text).toBe("this is *quieter*.\n\n**no.**");
    expect(result.abuses).toEqual([]);
  });

  it("preserves newlines instead of collapsing them", () => {
    const result = sanitizeCharacterMarkdownInput("first.\nsecond.\n\nthird.");
    expect(result.text).toBe("first.\nsecond.\n\nthird.");
  });

  it("caps blank line runs to one", () => {
    const result = sanitizeCharacterMarkdownInput("a.\n\n\n\nb.");
    expect(result.text).toBe("a.\n\nb.");
  });

  it("strips bullet list markers and reports list_syntax abuse", () => {
    const result = sanitizeCharacterMarkdownInput("- first thought.\n- second thought.");
    expect(result.text).toBe("first thought.\nsecond thought.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("list_syntax");
  });

  it("strips star bullet list markers without treating them as emphasis", () => {
    const result = sanitizeCharacterMarkdownInput("* first thought.\n* second thought.");
    expect(result.text).toBe("first thought.\nsecond thought.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("list_syntax");
  });

  it("strips numbered list markers", () => {
    const result = sanitizeCharacterMarkdownInput("1. first.\n2. second.");
    expect(result.text).toBe("first.\nsecond.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("list_syntax");
  });

  it("strips raw HTML tags", () => {
    const result = sanitizeCharacterMarkdownInput("hello <b>there</b>.");
    expect(result.text).toBe("hello there.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("raw_html");
  });

  it("strips link syntax keeping the visible text", () => {
    const result = sanitizeCharacterMarkdownInput("check [this](https://example.com) out.");
    expect(result.text).toBe("check this out.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("link_syntax");
  });

  it("strips image syntax keeping the alt text", () => {
    const result = sanitizeCharacterMarkdownInput("![a photo](https://example.com/img.png).");
    expect(result.text).toBe("a photo.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("image_syntax");
  });

  it("strips code fences", () => {
    const result = sanitizeCharacterMarkdownInput("here it is:\n```\nconst x = 1\n```");
    expect(result.text).toContain("const x = 1");
    expect(result.abuses.map((entry) => entry.kind)).toContain("code_fence");
  });

  it("strips blockquote markers", () => {
    const result = sanitizeCharacterMarkdownInput("> i wrote this once.");
    expect(result.text).toBe("i wrote this once.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("blockquote_syntax");
  });

  it("removes italic stage direction whole-line markup", () => {
    const result = sanitizeCharacterMarkdownInput("*sighs*\nokay.");
    expect(result.text).toBe("okay.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("italic_stage_direction");
  });

  it("removes italic stage direction spans before spoken text", () => {
    const result = sanitizeCharacterMarkdownInput("*sighs* okay.");
    expect(result.text).toBe("okay.");
    expect(result.abuses.map((entry) => entry.kind)).toContain("italic_stage_direction");
  });

  it("keeps only the first heading and downgrades the rest", () => {
    const result = sanitizeCharacterMarkdownInput("# one.\n\n## two.\n\n### three.");
    expect(result.text.split("\n\n")[0]).toBe("# one.");
    expect(result.abuses.filter((abuse) => abuse.kind === "repeated_heading").length).toBe(2);
  });

  it("caps visible blocks to three", () => {
    const result = sanitizeCharacterMarkdownInput("a.\n\nb.\n\nc.\n\nd.");
    expect(result.text.split("\n\n")).toHaveLength(3);
    expect(result.abuses.map((entry) => entry.kind)).toContain("block_overflow");
  });

  it("collapses horizontal whitespace runs while keeping newlines", () => {
    const result = sanitizeCharacterMarkdownInput("a    b.\n\nc\td.");
    expect(result.text).toBe("a b.\n\nc d.");
  });
});

describe("projectMemberSpeechPlain", () => {
  it("strips emphasis markers", () => {
    expect(projectMemberSpeechPlain("this is *quieter*.")).toBe("this is quieter.");
  });

  it("strips strong markers", () => {
    expect(projectMemberSpeechPlain("**no.** ask it properly.")).toBe("no. ask it properly.");
  });

  it("strips heading prefixes", () => {
    expect(projectMemberSpeechPlain("# FOG MACHINE OFF.\n\nthe silence is doing work.")).toBe(
      "FOG MACHINE OFF. the silence is doing work.",
    );
  });

  it("collapses newlines and whitespace for projection only", () => {
    expect(projectMemberSpeechPlain("first.\nsecond.\n\nthird.")).toBe("first. second. third.");
  });
});

describe("detectMarkupAbuses", () => {
  it("flags raw html, link syntax, image syntax, and code fences", () => {
    const detections = detectMarkupAbuses("<b>x</b> [a](b) ![c](d) ```code```");
    const kinds = detections.map((entry) => entry.kind);
    expect(kinds).toContain("raw_html");
    expect(kinds).toContain("link_syntax");
    expect(kinds).toContain("image_syntax");
    expect(kinds).toContain("code_fence");
  });

  it("flags repeated headings", () => {
    const detections = detectMarkupAbuses("# one\n\n## two\n\n### three");
    expect(detections.filter((entry) => entry.kind === "repeated_heading").length).toBe(2);
  });

  it("flags italic stage direction whole-line markup", () => {
    const detections = detectMarkupAbuses("*sighs*");
    expect(detections.map((entry) => entry.kind)).toContain("italic_stage_direction");
  });

  it("flags italic stage direction spans inside a spoken line", () => {
    const detections = detectMarkupAbuses("*sighs* okay.");
    expect(detections.map((entry) => entry.kind)).toContain("italic_stage_direction");
  });

  it("returns no detections for a clean plain message", () => {
    expect(detectMarkupAbuses("just a line, *quieter*, then **no.**")).toEqual([]);
  });
});
