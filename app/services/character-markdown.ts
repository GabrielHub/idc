// Hardened Markdown subset for live-date member chat bubbles. Sanitizer
// strips presentation-banned syntax before persistence. Renderer parses the
// cleaned text. Projector returns plain spoken text so hidden-info,
// repetition, and venue-monologue guards match on words, not markup.

export const ALLOWED_MEMBER_MARKDOWN_HEADING_PREFIX = /^#{1,6}\s+/;

const STRONG_SCAN_PATTERN = /\*\*([\s\S]+?)\*\*/;
const EMPHASIS_SCAN_PATTERN = /\*([^*\n][\s\S]*?[^*\n]|[^*\n])\*/;
const ATX_HEADING_PATTERN = /^#{1,6}\s+(.+?)\s*#*\s*$/;

export type MemberMarkdownInlineSpan =
  | { kind: "text"; text: string }
  | { kind: "emphasis"; children: MemberMarkdownInlineSpan[] }
  | { kind: "strong"; children: MemberMarkdownInlineSpan[] };

export type MemberMarkdownBlock =
  | { kind: "paragraph"; lines: MemberMarkdownInlineSpan[][] }
  | { kind: "heading"; spans: MemberMarkdownInlineSpan[] };

export function parseMemberMessageMarkdown(text: string): MemberMarkdownBlock[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();

  if (normalized.length === 0) {
    return [];
  }

  const rawBlocks = normalized.split(/\n{2,}/);
  const blocks: MemberMarkdownBlock[] = [];
  let headingSeen = false;

  for (const rawBlock of rawBlocks) {
    const trimmedBlock = rawBlock.trim();

    if (trimmedBlock.length === 0) {
      continue;
    }

    const headingMatch = !headingSeen ? trimmedBlock.match(ATX_HEADING_PATTERN) : null;

    if (headingMatch !== null && !trimmedBlock.includes("\n")) {
      headingSeen = true;
      blocks.push({
        kind: "heading",
        spans: parseInlineSpans(headingMatch[1].trim()),
      });
      continue;
    }

    const lines = trimmedBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const downgraded = headingSeen
          ? line.replace(ALLOWED_MEMBER_MARKDOWN_HEADING_PREFIX, "")
          : line;
        return parseInlineSpans(downgraded);
      });

    if (lines.length > 0) {
      blocks.push({ kind: "paragraph", lines });
    }
  }

  return blocks;
}

function parseInlineSpans(text: string): MemberMarkdownInlineSpan[] {
  if (text.length === 0) {
    return [];
  }

  const spans: MemberMarkdownInlineSpan[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const remaining = text.slice(cursor);
    const strongMatch = remaining.match(STRONG_SCAN_PATTERN);
    const emphasisMatch = remaining.match(EMPHASIS_SCAN_PATTERN);
    let nextMatch:
      | { kind: "strong"; index: number; length: number; inner: string }
      | { kind: "emphasis"; index: number; length: number; inner: string }
      | null = null;

    if (strongMatch !== null && strongMatch.index !== undefined) {
      nextMatch = {
        kind: "strong",
        index: strongMatch.index,
        length: strongMatch[0].length,
        inner: strongMatch[1],
      };
    }

    if (emphasisMatch !== null && emphasisMatch.index !== undefined) {
      if (nextMatch === null || emphasisMatch.index < nextMatch.index) {
        nextMatch = {
          kind: "emphasis",
          index: emphasisMatch.index,
          length: emphasisMatch[0].length,
          inner: emphasisMatch[1],
        };
      }
    }

    if (nextMatch === null) {
      pushText(spans, remaining);
      break;
    }

    if (nextMatch.index > 0) {
      pushText(spans, remaining.slice(0, nextMatch.index));
    }

    spans.push({
      kind: nextMatch.kind,
      children: parseInlineSpans(nextMatch.inner),
    });

    cursor += nextMatch.index + nextMatch.length;
  }

  return spans;
}

function pushText(spans: MemberMarkdownInlineSpan[], text: string): void {
  if (text.length === 0) {
    return;
  }
  const last = spans.at(-1);
  if (last !== undefined && last.kind === "text") {
    last.text += text;
    return;
  }
  spans.push({ kind: "text", text });
}

const MARKDOWN_LINK_PATTERN = /\[([^\]\n]*)\]\(([^)\n]*)\)/g;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]\n]*)\]\(([^)\n]*)\)/g;
const MARKDOWN_AUTOLINK_PATTERN = /<((?:https?:|mailto:|ftp:)[^>\s]+)>/gi;
const MARKDOWN_HTML_TAG_PATTERN = /<\/?[a-z][\w:-]*(?:\s+[^>]*)?>/gi;
const MARKDOWN_CODE_FENCE_PATTERN = /```[\s\S]*?```/g;
const MARKDOWN_INLINE_CODE_PATTERN = /`+([^`\n]+)`+/g;
const MARKDOWN_TASK_BULLET_PATTERN = /^[-+*]\s+\[[ xX]\]\s+/;
const MARKDOWN_BULLET_PATTERN = /^[-+*]\s+/;
const MARKDOWN_NUMBERED_PATTERN = /^\d+[.)]\s+/;
const MARKDOWN_BLOCKQUOTE_PATTERN = /^>\s?/;
const MARKDOWN_HORIZONTAL_RULE_PATTERN =
  /^\s*(?:-\s*){3,}\s*$|^\s*(?:_\s*){3,}\s*$|^\s*(?:\*\s*){3,}\s*$/;
const MARKDOWN_TABLE_DIVIDER_PATTERN = /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/;
const MARKDOWN_TABLE_ROW_PATTERN = /^\s*\|.*\|\s*$/;
const MARKDOWN_FOOTNOTE_PATTERN = /\[\^[^\]]+\]/g;
const MARKDOWN_BLOCK_MATH_PATTERN = /\$\$[\s\S]*?\$\$/g;
const MARKDOWN_INLINE_MATH_PATTERN = /(?<!\\)\$([^$\n]{1,200})\$/g;
const MARKDOWN_MERMAID_BLOCK_PATTERN = /```\s*mermaid[\s\S]*?```/gi;
const HORIZONTAL_WHITESPACE_RUN = /[^\S\n]+/g;

const ITALIC_STAGE_DIRECTION_VERBS = [
  "sighs",
  "sigh",
  "smiles",
  "smile",
  "laughs",
  "laugh",
  "pauses",
  "pause",
  "looks",
  "look",
  "glances",
  "glance",
  "nods",
  "nod",
  "shrugs",
  "shrug",
  "blinks",
  "blink",
  "winces",
  "wince",
  "leans",
  "lean",
  "breathes",
  "breath",
  "breathe",
  "grimaces",
  "grimace",
  "swallows",
  "swallow",
  "rolls",
  "roll",
  "frowns",
  "frown",
  "smirks",
  "smirk",
  "winks",
  "wink",
  "stares",
  "stare",
];

const ITALIC_STAGE_DIRECTION_PATTERN = new RegExp(
  `^\\*\\s*(?:${ITALIC_STAGE_DIRECTION_VERBS.join("|")})\\b[^*\\n]*\\*$`,
  "i",
);
const ITALIC_STAGE_DIRECTION_SPAN_PATTERN = new RegExp(
  `\\*\\s*(?:${ITALIC_STAGE_DIRECTION_VERBS.join("|")})\\b[^*\\n]{0,80}\\*`,
  "gi",
);

const WHOLE_LINE_ITALIC_ACTION_PATTERN = new RegExp(
  `^\\*\\s*(?:[a-z][a-z\\s,'-]{0,80})\\s*\\*$`,
  "i",
);

export type MarkupAbuseKind =
  | "raw_html"
  | "link_syntax"
  | "image_syntax"
  | "code_fence"
  | "inline_code"
  | "list_syntax"
  | "task_syntax"
  | "table_syntax"
  | "blockquote_syntax"
  | "horizontal_rule"
  | "math_syntax"
  | "footnote_syntax"
  | "mermaid_block"
  | "repeated_heading"
  | "italic_stage_direction"
  | "block_overflow";

export type MarkupAbuseDetection = {
  kind: MarkupAbuseKind;
  evidence: string;
};

export const MARKUP_ABUSE_FAIL_KINDS: ReadonlySet<MarkupAbuseKind> = new Set<MarkupAbuseKind>([
  "raw_html",
  "link_syntax",
  "image_syntax",
  "code_fence",
  "mermaid_block",
  "repeated_heading",
  "italic_stage_direction",
]);

export const MEMBER_CHAT_MARKUP_REJECT_KINDS: ReadonlySet<MarkupAbuseKind> =
  new Set<MarkupAbuseKind>([
    "raw_html",
    "link_syntax",
    "image_syntax",
    "code_fence",
    "inline_code",
    "list_syntax",
    "task_syntax",
    "table_syntax",
    "blockquote_syntax",
    "horizontal_rule",
    "math_syntax",
    "footnote_syntax",
    "mermaid_block",
    "italic_stage_direction",
    "repeated_heading",
  ]);

export function describeMarkupAbuse(kind: MarkupAbuseKind): string {
  switch (kind) {
    case "raw_html":
      return "Speaker emitted raw HTML markup.";
    case "link_syntax":
      return "Speaker emitted Markdown link syntax.";
    case "image_syntax":
      return "Speaker emitted Markdown image syntax.";
    case "code_fence":
      return "Speaker emitted a code fence inside dialogue.";
    case "inline_code":
      return "Speaker emitted inline code markers.";
    case "mermaid_block":
      return "Speaker emitted a Mermaid block inside dialogue.";
    case "list_syntax":
      return "Speaker emitted Markdown list syntax inside dialogue.";
    case "task_syntax":
      return "Speaker emitted Markdown task list syntax inside dialogue.";
    case "table_syntax":
      return "Speaker emitted Markdown table syntax inside dialogue.";
    case "blockquote_syntax":
      return "Speaker emitted blockquote markers inside dialogue.";
    case "horizontal_rule":
      return "Speaker emitted a horizontal rule inside dialogue.";
    case "math_syntax":
      return "Speaker emitted math syntax inside dialogue.";
    case "footnote_syntax":
      return "Speaker emitted footnote syntax inside dialogue.";
    case "repeated_heading":
      return "Speaker stacked multiple Markdown headings inside one message.";
    case "italic_stage_direction":
      return "Speaker emitted italic stage direction instead of spoken text.";
    case "block_overflow":
      return "Speaker emitted more than three visible blocks in one message.";
  }
}

const MAX_VISIBLE_BLOCKS = 3;
const MAX_BLANK_LINE_RUN = 1;

export function sanitizeCharacterMarkdownInput(text: string): {
  text: string;
  abuses: MarkupAbuseDetection[];
} {
  const abuses: MarkupAbuseDetection[] = [];
  let working = text.replace(/\r\n?/g, "\n");

  working = applyPattern(
    working,
    MARKDOWN_MERMAID_BLOCK_PATTERN,
    "mermaid_block",
    abuses,
    () => " ",
  );
  working = applyPattern(working, MARKDOWN_CODE_FENCE_PATTERN, "code_fence", abuses, (match) =>
    match.replace(/```[a-zA-Z0-9_-]*\n?/g, "").replace(/```/g, ""),
  );
  working = applyPattern(working, MARKDOWN_BLOCK_MATH_PATTERN, "math_syntax", abuses, () => " ");
  working = applyPattern(
    working,
    MARKDOWN_INLINE_MATH_PATTERN,
    "math_syntax",
    abuses,
    (_, inner) => inner ?? "",
  );
  working = applyPattern(working, MARKDOWN_FOOTNOTE_PATTERN, "footnote_syntax", abuses, () => "");
  working = applyPattern(
    working,
    MARKDOWN_IMAGE_PATTERN,
    "image_syntax",
    abuses,
    (_, alt) => alt ?? "",
  );
  working = applyPattern(
    working,
    MARKDOWN_LINK_PATTERN,
    "link_syntax",
    abuses,
    (_, label) => label ?? "",
  );
  working = applyPattern(
    working,
    MARKDOWN_AUTOLINK_PATTERN,
    "link_syntax",
    abuses,
    (_, url) => url ?? "",
  );
  working = applyPattern(working, MARKDOWN_HTML_TAG_PATTERN, "raw_html", abuses, () => "");
  working = applyPattern(
    working,
    MARKDOWN_INLINE_CODE_PATTERN,
    "inline_code",
    abuses,
    (_, inner) => inner ?? "",
  );
  working = applyPattern(
    working,
    ITALIC_STAGE_DIRECTION_SPAN_PATTERN,
    "italic_stage_direction",
    abuses,
    () => " ",
  );

  const lines = working.split("\n");
  const cleanedLines: string[] = [];
  let firstHeadingSeen = false;
  let blankRun = 0;

  for (const rawLine of lines) {
    let line = rawLine.replace(HORIZONTAL_WHITESPACE_RUN, " ").trim();

    if (line.length === 0) {
      blankRun += 1;
      if (blankRun <= MAX_BLANK_LINE_RUN) {
        cleanedLines.push("");
      }
      continue;
    }

    blankRun = 0;

    if (MARKDOWN_HORIZONTAL_RULE_PATTERN.test(line)) {
      abuses.push({ kind: "horizontal_rule", evidence: line });
      continue;
    }

    if (MARKDOWN_TABLE_DIVIDER_PATTERN.test(line)) {
      abuses.push({ kind: "table_syntax", evidence: line });
      continue;
    }

    if (MARKDOWN_TABLE_ROW_PATTERN.test(line)) {
      abuses.push({ kind: "table_syntax", evidence: line });
      line = line
        .replace(/^\s*\|\s*/, "")
        .replace(/\s*\|\s*$/, "")
        .replace(/\s*\|\s*/g, " ");
    }

    if (MARKDOWN_TASK_BULLET_PATTERN.test(line)) {
      abuses.push({ kind: "task_syntax", evidence: line });
      line = line.replace(MARKDOWN_TASK_BULLET_PATTERN, "");
    } else if (MARKDOWN_BULLET_PATTERN.test(line)) {
      abuses.push({ kind: "list_syntax", evidence: line });
      line = line.replace(MARKDOWN_BULLET_PATTERN, "");
    } else if (MARKDOWN_NUMBERED_PATTERN.test(line)) {
      abuses.push({ kind: "list_syntax", evidence: line });
      line = line.replace(MARKDOWN_NUMBERED_PATTERN, "");
    }

    if (MARKDOWN_BLOCKQUOTE_PATTERN.test(line)) {
      abuses.push({ kind: "blockquote_syntax", evidence: line });
      line = line.replace(MARKDOWN_BLOCKQUOTE_PATTERN, "");
    }

    if (ALLOWED_MEMBER_MARKDOWN_HEADING_PREFIX.test(line)) {
      if (firstHeadingSeen) {
        abuses.push({ kind: "repeated_heading", evidence: line });
        line = line.replace(ALLOWED_MEMBER_MARKDOWN_HEADING_PREFIX, "");
      } else {
        firstHeadingSeen = true;
      }
    }

    if (line.length === 0) {
      continue;
    }

    if (ITALIC_STAGE_DIRECTION_PATTERN.test(line) || WHOLE_LINE_ITALIC_ACTION_PATTERN.test(line)) {
      abuses.push({ kind: "italic_stage_direction", evidence: line });
      continue;
    }

    cleanedLines.push(line);
  }

  while (cleanedLines.length > 0 && cleanedLines[0] === "") {
    cleanedLines.shift();
  }
  while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] === "") {
    cleanedLines.pop();
  }

  const cappedLines = capVisibleBlocks(cleanedLines, abuses);

  return {
    text: cappedLines.join("\n"),
    abuses,
  };
}

function capVisibleBlocks(lines: string[], abuses: MarkupAbuseDetection[]): string[] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.length === 0) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current);
  }

  if (blocks.length <= MAX_VISIBLE_BLOCKS) {
    return joinBlocks(blocks);
  }

  abuses.push({
    kind: "block_overflow",
    evidence: `${blocks.length} blocks reduced to ${MAX_VISIBLE_BLOCKS}`,
  });
  return joinBlocks(blocks.slice(0, MAX_VISIBLE_BLOCKS));
}

function joinBlocks(blocks: string[][]): string[] {
  const out: string[] = [];
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    if (blockIndex > 0) {
      out.push("");
    }
    out.push(...blocks[blockIndex]);
  }
  return out;
}

function applyPattern(
  text: string,
  pattern: RegExp,
  kind: MarkupAbuseKind,
  abuses: MarkupAbuseDetection[],
  replacer: (match: string, capture1?: string) => string,
): string {
  let captured = false;
  return text.replace(pattern, (match: string, capture1?: string) => {
    if (!captured) {
      abuses.push({ kind, evidence: match });
      captured = true;
    }
    return replacer(match, capture1);
  });
}

export function projectMemberSpeechPlain(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/\*([^*\n][\s\S]*?[^*\n]|[^*\n])\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[\n ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectMarkupAbuses(text: string): MarkupAbuseDetection[] {
  const detections: MarkupAbuseDetection[] = [];
  const normalized = text.replace(/\r\n?/g, "\n");

  collect(detections, normalized, MARKDOWN_MERMAID_BLOCK_PATTERN, "mermaid_block");
  collect(detections, normalized, MARKDOWN_CODE_FENCE_PATTERN, "code_fence");
  collect(detections, normalized, MARKDOWN_INLINE_CODE_PATTERN, "inline_code");
  collect(detections, normalized, MARKDOWN_BLOCK_MATH_PATTERN, "math_syntax");
  collect(detections, normalized, MARKDOWN_INLINE_MATH_PATTERN, "math_syntax");
  collect(detections, normalized, MARKDOWN_FOOTNOTE_PATTERN, "footnote_syntax");
  collect(detections, normalized, MARKDOWN_IMAGE_PATTERN, "image_syntax");
  collect(detections, normalized, MARKDOWN_LINK_PATTERN, "link_syntax");
  collect(detections, normalized, MARKDOWN_AUTOLINK_PATTERN, "link_syntax");
  collect(detections, normalized, MARKDOWN_HTML_TAG_PATTERN, "raw_html");
  collect(detections, normalized, ITALIC_STAGE_DIRECTION_SPAN_PATTERN, "italic_stage_direction");

  const lines = normalized.split("\n");
  let headingCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (ALLOWED_MEMBER_MARKDOWN_HEADING_PREFIX.test(trimmed)) {
      headingCount += 1;
      if (headingCount > 1) {
        detections.push({ kind: "repeated_heading", evidence: trimmed });
      }
    }
    if (MARKDOWN_BULLET_PATTERN.test(trimmed) || MARKDOWN_NUMBERED_PATTERN.test(trimmed)) {
      detections.push({ kind: "list_syntax", evidence: trimmed });
    }
    if (MARKDOWN_TASK_BULLET_PATTERN.test(trimmed)) {
      detections.push({ kind: "task_syntax", evidence: trimmed });
    }
    if (MARKDOWN_BLOCKQUOTE_PATTERN.test(trimmed)) {
      detections.push({ kind: "blockquote_syntax", evidence: trimmed });
    }
    if (MARKDOWN_HORIZONTAL_RULE_PATTERN.test(trimmed)) {
      detections.push({ kind: "horizontal_rule", evidence: trimmed });
    }
    if (MARKDOWN_TABLE_ROW_PATTERN.test(trimmed) || MARKDOWN_TABLE_DIVIDER_PATTERN.test(trimmed)) {
      detections.push({ kind: "table_syntax", evidence: trimmed });
    }
    if (
      ITALIC_STAGE_DIRECTION_PATTERN.test(trimmed) ||
      WHOLE_LINE_ITALIC_ACTION_PATTERN.test(trimmed)
    ) {
      detections.push({ kind: "italic_stage_direction", evidence: trimmed });
    }
  }

  return detections;
}

function collect(
  detections: MarkupAbuseDetection[],
  text: string,
  pattern: RegExp,
  kind: MarkupAbuseKind,
): void {
  for (const match of text.matchAll(pattern)) {
    detections.push({ kind, evidence: match[0] });
  }
}
