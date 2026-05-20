import { Fragment, useMemo, type ReactNode } from "react";

import {
  parseMemberMessageMarkdown,
  type MemberMarkdownBlock,
  type MemberMarkdownInlineSpan,
} from "../services/character-markdown";

export interface MemberMessageMarkdownProps {
  text: string;
  className?: string;
  showCaret?: boolean;
  caretClassName?: string;
}

const HEADING_CLASS =
  "font-display text-display-sm font-semibold leading-tight tracking-tight break-words max-w-full";
const PARAGRAPH_CLASS = "max-w-full break-words";

export function MemberMessageMarkdown({
  text,
  className,
  showCaret = false,
  caretClassName,
}: MemberMessageMarkdownProps): ReactNode {
  const blocks = useMemo(() => parseMemberMessageMarkdown(text), [text]);
  const wrapperClass = ["relative block min-w-0 w-full space-y-1.5", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      {blocks.map((block, blockIndex) => (
        <BlockNode key={blockIndex} block={block} />
      ))}
      {showCaret ? (
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute -bottom-1 right-0 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full",
            caretClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ) : null}
    </div>
  );
}

function BlockNode({ block }: { block: MemberMarkdownBlock }): ReactNode {
  if (block.kind === "heading") {
    return (
      <p className={HEADING_CLASS}>
        <InlineSpans spans={block.spans} />
      </p>
    );
  }

  return (
    <p className={PARAGRAPH_CLASS}>
      {block.lines.map((lineSpans, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          <InlineSpans spans={lineSpans} />
        </Fragment>
      ))}
    </p>
  );
}

function InlineSpans({ spans }: { spans: readonly MemberMarkdownInlineSpan[] }): ReactNode {
  return (
    <>
      {spans.map((span, index) => (
        <InlineSpan key={index} span={span} />
      ))}
    </>
  );
}

function InlineSpan({ span }: { span: MemberMarkdownInlineSpan }): ReactNode {
  if (span.kind === "text") {
    return <>{span.text}</>;
  }

  if (span.kind === "strong") {
    return (
      <strong className="font-semibold">
        <InlineSpans spans={span.children} />
      </strong>
    );
  }

  return (
    <em className="italic">
      <InlineSpans spans={span.children} />
    </em>
  );
}
