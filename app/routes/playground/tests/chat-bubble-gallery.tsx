import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { EASE_OUT_QUART, MutedLabel, Portrait } from "../../../components/dashboard-atoms";
import {
  HOUSE_BUBBLE_LEFT_CLASS,
  HOUSE_BUBBLE_NAME_CLASS,
  resolveMemberChatBubbleStyle,
} from "../../../components/member-chat-bubble-style";
import { MemberMessageMarkdown } from "../../../components/member-message-markdown";
import { type Member } from "../../../domain/game";
import { starterMembers } from "../../../fixtures";
import { TestHeader } from "../shared";

const CHAT_BUBBLE_FALLBACK_SAMPLE =
  "no but seriously, send me a time, a place, and a chair that does not creak. that is the whole vibe.";

const MARKDOWN_SHOWCASE_SAMPLES: { label: string; text: string }[] = [
  {
    label: "ordinary",
    text: "i can do thursday. one quiet table, no surprise audience.",
  },
  {
    label: "italic stress",
    text: "this is *quieter* than i meant to sound.",
  },
  {
    label: "strong punch",
    text: "**no.** ask it properly.",
  },
  {
    label: "line rhythm",
    text: "the silence is doing a lot of work.\nlet it.\n\nthursday at seven.",
  },
  {
    label: "heading beat",
    text: "# FOG MACHINE OFF.\n\nthe silence is doing a lot of work.\nlet it.",
  },
];

function pickChatBubbleSample(member: Member): string {
  const sample =
    member.voice.sampleMessages.hingeBits[0] ?? member.voice.sampleMessages.greeting[0];
  if (typeof sample === "string" && sample.trim().length > 0) {
    return sample;
  }
  return CHAT_BUBBLE_FALLBACK_SAMPLE;
}

export function ChatBubbleGalleryTest() {
  const [replayKey, setReplayKey] = useState(0);

  const customCount = useMemo(
    () => starterMembers.filter((member) => member.chatBubble !== undefined).length,
    [],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Chat bubble gallery"
        description="Every member's focused-side bubble in one screen. Each card uses the same resolver as a live date so authoring tweaks land here first. Continuous textures (drift, holographic, crackling) animate in place. Replay re-mounts the grid to retrigger entry animations."
      />

      <div className="aura-glass flex flex-wrap items-center justify-between gap-3 rounded-card px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <MutedLabel>roster</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{customCount}</span> custom
            <span aria-hidden> · </span>
            <span className="text-aura-ink tabular-nums">
              {starterMembers.length - customCount}
            </span>{" "}
            default
            <span aria-hidden> · </span>
            <span className="text-aura-ink tabular-nums">{starterMembers.length}</span> total
          </span>
        </div>
        <button
          type="button"
          onClick={() => setReplayKey((current) => current + 1)}
          className="cursor-pointer rounded-pill bg-aura-ink px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-aura-rose"
        >
          Replay animations
        </button>
      </div>

      <MarkdownShowcase replayKey={replayKey} />

      <div key={replayKey} className="grid gap-4 lg:grid-cols-2">
        {starterMembers.map((member) => (
          <ChatBubblePreviewCard key={member.id} member={member} />
        ))}
      </div>
    </motion.section>
  );
}

function MarkdownShowcase({ replayKey }: { replayKey: number }) {
  const defaultMember = starterMembers.find((entry) => entry.chatBubble === undefined);
  const customMember = starterMembers.find((entry) => entry.chatBubble !== undefined);

  return (
    <section
      key={`markdown-${replayKey}`}
      className="aura-glass rounded-card px-5 py-5 space-y-4"
      aria-labelledby="markdown-showcase-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3
          id="markdown-showcase-heading"
          className="font-display text-display-sm font-semibold text-aura-ink"
        >
          Member Markdown subset
        </h3>
        <p className="max-w-xl text-label leading-relaxed text-aura-muted">
          Each row renders the same source through the shared MemberMessageMarkdown component.
          Italic, strong, soft line breaks, and a single ATX heading are allowed; lists, links,
          images, raw HTML, code, blockquotes, tables, math, and footnotes are stripped before
          render.
        </p>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {MARKDOWN_SHOWCASE_SAMPLES.map((sample) => (
          <li key={sample.label} className="grid gap-2">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
              {sample.label}
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <BubblePreview member={defaultMember} sampleText={sample.text} variant="default" />
              {customMember ? (
                <BubblePreview member={customMember} sampleText={sample.text} variant="custom" />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BubblePreview({
  member,
  sampleText,
  variant,
}: {
  member: Member | undefined;
  sampleText: string;
  variant: "default" | "custom";
}) {
  if (member === undefined) {
    return null;
  }
  const customBubble = member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const bubbleClass = customBubble ? customBubble.className : HOUSE_BUBBLE_LEFT_CLASS;
  const bubbleStyle = customBubble?.style;
  const textColorClass = customBubble ? "" : "text-white";
  const accentStyle = customBubble?.accentStyle;

  return (
    <div className="flex max-w-[80%] flex-col items-start gap-2" style={accentStyle}>
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {variant === "default" ? "default house" : member.firstName}
      </span>
      <div className={bubbleClass} style={bubbleStyle}>
        <MemberMessageMarkdown
          text={sampleText}
          className={`text-body leading-relaxed ${textColorClass}`}
        />
      </div>
    </div>
  );
}

function ChatBubblePreviewCard({ member }: { member: Member }) {
  const customBubble = member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const sampleText = pickChatBubbleSample(member);

  const bubbleClass = customBubble ? customBubble.className : HOUSE_BUBBLE_LEFT_CLASS;
  const bubbleStyle = customBubble?.style;
  const textColorClass = customBubble ? "" : "text-white";
  const nameClass = customBubble
    ? "text-[color:var(--member-bubble-accent)] opacity-80"
    : HOUSE_BUBBLE_NAME_CLASS;
  const accentStyle = customBubble?.accentStyle;

  const axes = describeBubbleAxes(member);

  return (
    <article className="aura-glass flex flex-col gap-4 rounded-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Portrait member={member} variant="row" />
          <div className="space-y-1">
            <h3 className="font-display text-body font-semibold tracking-tight text-aura-ink">
              {member.name}
            </h3>
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
              {member.voice.register}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] ${
            customBubble ? "bg-aura-ink/5 text-aura-muted" : "bg-[#0a84ff]/10 text-[#0a84ff]"
          }`}
        >
          {customBubble ? "custom" : "default house"}
        </span>
      </header>

      <div className="flex justify-start">
        <div className="flex max-w-[88%] flex-col items-start gap-2" style={accentStyle}>
          <span
            className={`relative z-20 px-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-left ${nameClass}`}
          >
            {member.firstName}
          </span>
          <div className={bubbleClass} style={bubbleStyle}>
            <MemberMessageMarkdown
              text={sampleText}
              className={`text-body leading-relaxed ${textColorClass}`}
            />
          </div>
        </div>
      </div>

      {axes.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 border-t border-aura-hairline pt-3">
          {axes.map((axis) => (
            <li
              key={axis.label}
              className="rounded-pill border border-aura-hairline bg-white/55 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted"
            >
              <span className="text-aura-faint">{axis.label}</span>{" "}
              <span className="text-aura-ink">{axis.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-aura-hairline pt-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          // falls through to the default house bubble
        </p>
      )}
    </article>
  );
}

function describeBubbleAxes(member: Member): ReadonlyArray<{ label: string; value: string }> {
  const bubble = member.chatBubble;
  if (!bubble) {
    return [];
  }
  const axes: Array<{ label: string; value: string }> = [];
  axes.push({
    label: "bg",
    value: bubble.background.kind === "solid" ? "solid" : `${bubble.background.stops.length}-stop`,
  });
  axes.push({ label: "shape", value: bubble.shape });
  if (bubble.tail) {
    axes.push({ label: "tail", value: bubble.tail });
  }
  if (bubble.border && bubble.border !== "none") {
    axes.push({ label: "border", value: bubble.border });
  }
  if (bubble.glow) {
    axes.push({ label: "glow", value: bubble.glow.intensity });
  }
  if (bubble.texture) {
    axes.push({ label: "texture", value: bubble.texture });
  }
  if (bubble.entryAnimation) {
    axes.push({ label: "anim", value: bubble.entryAnimation });
  }
  if (bubble.fontFamily) {
    axes.push({ label: "font", value: bubble.fontFamily });
  }
  if (bubble.textEffect) {
    axes.push({ label: "fx", value: bubble.textEffect });
  }
  return axes;
}
