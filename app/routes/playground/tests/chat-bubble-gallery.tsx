import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { EASE_OUT_QUART, MutedLabel, Portrait } from "../../../components/dashboard-atoms";
import {
  HOUSE_BUBBLE_LEFT_CLASS,
  HOUSE_BUBBLE_NAME_CLASS,
  resolveMemberChatBubbleStyle,
} from "../../../components/member-chat-bubble-style";
import { type Member } from "../../../domain/game";
import { starterMembers } from "../../../fixtures";
import { TestHeader } from "../shared";

const CHAT_BUBBLE_FALLBACK_SAMPLE =
  "no but seriously, send me a time, a place, and a chair that does not creak. that is the whole vibe.";

function pickChatBubbleSample(member: Member): string {
  const opener = member.voice.sampleMessages.opener[0];
  if (typeof opener === "string" && opener.trim().length > 0) {
    return opener;
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

      <div key={replayKey} className="grid gap-4 lg:grid-cols-2">
        {starterMembers.map((member) => (
          <ChatBubblePreviewCard key={member.id} member={member} />
        ))}
      </div>
    </motion.section>
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
            <p className={`text-body leading-relaxed ${textColorClass}`}>{sampleText}</p>
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
