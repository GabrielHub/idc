import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import type { DateSession, Member } from "../domain/game";
import { EASE_OUT_QUART } from "./dashboard-atoms";
import type { DatePlaybackUiState, PendingDateAction } from "./date-view-shared";
import { readKindLabel, type TranscriptItem } from "./date-view-transcript";
import {
  HOUSE_BUBBLE_LEFT_CLASS,
  HOUSE_BUBBLE_NAME_CLASS,
  resolveMemberChatBubbleStyle,
} from "./member-chat-bubble-style";

type ChatStreamAnimation = {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease: typeof EASE_OUT_QUART; delay: number };
};

export function ChatStream({
  items,
  session,
  leftMemberId,
  pendingDateAction,
  isJudgePending,
  playbackUiState,
}: {
  items: TranscriptItem[];
  session: DateSession;
  leftMemberId: string | undefined;
  pendingDateAction: PendingDateAction | null;
  isJudgePending: boolean;
  playbackUiState: DatePlaybackUiState;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const tailRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const previousItemCountRef = useRef(items.length);
  const latestText = items.at(-1)?.text ?? "";

  useEffect(() => {
    const itemCountIncreased = items.length > previousItemCountRef.current;
    previousItemCountRef.current = items.length;
    const behavior: ScrollBehavior = itemCountIncreased ? "smooth" : "auto";
    const resolveStickyEl = (current: HTMLElement | null, selector: string): HTMLElement | null => {
      if (current !== null && document.contains(current)) {
        return current;
      }
      return document.querySelector<HTMLElement>(selector);
    };
    const scroll = () => {
      headerRef.current = resolveStickyEl(headerRef.current, "[data-date-header]");
      footerRef.current = resolveStickyEl(footerRef.current, "[data-date-footer]");
      scrollLatestTranscriptItemIntoClearance(
        listRef.current,
        tailRef.current,
        headerRef.current,
        footerRef.current,
        behavior,
      );
    };
    const animationFrame = window.requestAnimationFrame(scroll);
    const retryTimeout = itemCountIncreased ? window.setTimeout(scroll, 180) : undefined;

    return () => {
      window.cancelAnimationFrame(animationFrame);

      if (retryTimeout !== undefined) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, [items.length, latestText]);

  const statusCue =
    session.status === "active" ? (
      <DateStatusCue
        pendingDateAction={pendingDateAction}
        isJudgePending={isJudgePending}
        pauseRequested={playbackUiState.pauseRequested}
      />
    ) : null;

  if (items.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // awaiting first exchange
        </p>
        <p className="max-w-sm text-label text-aura-muted">
          Cupid does not record silence. Advance the exchange to begin the transcript.
        </p>
        {statusCue === null ? null : <div className="mt-3">{statusCue}</div>}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ol ref={listRef} className="space-y-4">
        {items.map((item, index) => {
          const previous = items[index - 1];
          return (
            <ChatStreamItem
              key={item.id}
              item={item}
              previous={previous}
              index={index}
              leftMemberId={leftMemberId}
            />
          );
        })}
      </ol>

      {statusCue === null ? null : (
        <div ref={tailRef} className="mt-5 flex justify-start">
          {statusCue}
        </div>
      )}
    </div>
  );
}

function scrollLatestTranscriptItemIntoClearance(
  listElement: HTMLOListElement | null,
  tailElement: HTMLDivElement | null,
  headerElement: HTMLElement | null,
  footerElement: HTMLElement | null,
  behavior: ScrollBehavior,
): void {
  const latestItem = listElement?.lastElementChild;

  if (!(latestItem instanceof HTMLElement)) {
    return;
  }

  const headerBottom = headerElement?.getBoundingClientRect().bottom ?? 0;
  const footerTop = footerElement?.getBoundingClientRect().top ?? window.innerHeight;
  const topLimit = headerBottom + 16;
  const bottomLimit = footerTop - 20;

  if (bottomLimit <= topLimit) {
    latestItem.scrollIntoView({ behavior, block: "nearest" });
    return;
  }

  const itemRect = latestItem.getBoundingClientRect();
  const tailRect = tailElement?.getBoundingClientRect() ?? itemRect;
  const neededDownScroll = Math.max(0, tailRect.bottom - bottomLimit);
  const allowedDownScroll = Math.max(0, itemRect.top - topLimit);
  const downScroll = Math.min(neededDownScroll, allowedDownScroll);

  if (downScroll > 0) {
    window.scrollBy({ top: downScroll, behavior });
    return;
  }

  if (itemRect.top < topLimit) {
    window.scrollBy({ top: itemRect.top - topLimit, behavior });
  }
}

function ChatStreamItem({
  item,
  previous,
  index,
  leftMemberId,
}: {
  item: TranscriptItem;
  previous: TranscriptItem | undefined;
  index: number;
  leftMemberId: string | undefined;
}) {
  const animation: ChatStreamAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE_OUT_QUART, delay: Math.min(index * 0.04, 0.5) },
  };

  if (item.tone === "member" && item.member !== undefined) {
    const isLeft = item.member.id === leftMemberId;
    const previousIsSameSpeaker =
      previous?.tone === "member" && previous.member?.id === item.member.id;
    return (
      <ChatBubble
        item={item}
        member={item.member}
        side={isLeft ? "left" : "right"}
        showName={!previousIsSameSpeaker}
        tight={previousIsSameSpeaker}
        animation={animation}
      />
    );
  }

  if (item.tone === "scenario") {
    return <NarratorBeat item={item} animation={animation} />;
  }

  if (item.tone === "cupid") {
    return <CupidPin item={item} animation={animation} />;
  }

  if (item.tone === "judge") {
    return <JudgeNote item={item} animation={animation} />;
  }

  return <SystemNote item={item} animation={animation} />;
}

function ChatBubble({
  item,
  member,
  side,
  showName,
  tight,
  animation,
}: {
  item: TranscriptItem;
  member: Member;
  side: "left" | "right";
  showName: boolean;
  tight: boolean;
  animation: ChatStreamAnimation;
}) {
  const isLeft = side === "left";
  const justify = isLeft ? "justify-start" : "justify-end";
  const tightClass = tight ? "!mt-1" : "";
  const itemsAlign = isLeft ? "items-start" : "items-end";
  const customBubble =
    isLeft && member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const nameAlign = customBubble
    ? "text-left text-[color:var(--member-bubble-accent)] opacity-80"
    : isLeft
      ? `text-left ${HOUSE_BUBBLE_NAME_CLASS}`
      : "text-right text-aura-faint";
  const accentStyle = customBubble?.accentStyle;
  const defaultRightClass =
    "rounded-[22px] rounded-br-md bg-white/85 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md";
  const bubbleClass = customBubble
    ? customBubble.className
    : isLeft
      ? HOUSE_BUBBLE_LEFT_CLASS
      : defaultRightClass;
  const bubbleStyle = customBubble?.style;
  const textColorClass = customBubble ? "" : isLeft ? "text-white" : "text-aura-ink";
  const caretColor = customBubble
    ? customBubble.caretClass
    : isLeft
      ? "bg-white/85"
      : "bg-aura-rose/70";

  return (
    <motion.li {...animation} className={`flex ${justify} ${tightClass}`}>
      <div className={`flex max-w-[78%] flex-col gap-2 ${itemsAlign}`} style={accentStyle}>
        {showName ? (
          <span
            className={`relative z-20 px-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] ${nameAlign}`}
          >
            {member.firstName}
          </span>
        ) : null}
        <div className={`${bubbleClass} ${item.isDraft ? "opacity-95" : ""}`} style={bubbleStyle}>
          <p className={`text-body leading-relaxed ${textColorClass}`}>
            {item.text}
            {item.isStreaming ? (
              <span
                aria-hidden
                className={`ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full ${caretColor}`}
              />
            ) : null}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function NarratorBeat({
  item,
  animation,
}: {
  item: TranscriptItem;
  animation: ChatStreamAnimation;
}) {
  return (
    <motion.li {...animation} className="!my-7">
      <div className="flex flex-col items-center gap-2 px-2 text-center">
        <div className="flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-aura-violet/40 to-transparent" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-violet">
            {item.label}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-aura-violet/40 via-transparent to-transparent" />
        </div>
        <p className="aura-accent max-w-md text-lead leading-snug text-aura-muted">
          &ldquo;{item.text}&rdquo;
        </p>
      </div>
    </motion.li>
  );
}

function CupidPin({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="!my-6 flex justify-center">
      <div className="aura-glass-rose relative max-w-md rounded-card px-5 pt-5 pb-3.5 text-center">
        <span
          aria-hidden
          className="absolute -top-1.5 left-1/2 grid size-3.5 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-rose shadow-[0_3px_8px_rgba(244,63,94,0.45)] ring-2 ring-white/85"
        >
          <span className="size-1 rounded-full bg-white/90" />
        </span>
        <div className="flex items-center justify-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          <span>// {item.label}</span>
          {item.targetName === undefined ? null : (
            <span className="rounded-full bg-aura-rose/15 px-2 py-0.5 tracking-[0.24em] text-aura-rose">
              → {item.targetName}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-label leading-snug text-aura-ink/85">{item.text}</p>
      </div>
    </motion.li>
  );
}

function JudgeNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  const reveals = item.reveals ?? [];
  const hasReveals = reveals.length > 0;

  return (
    <motion.li {...animation} data-judge-note-anchor="true" className="!my-5 flex justify-center">
      <div className="aura-glass relative w-full rounded-card px-5 pt-3.5 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-full bg-aura-ink/[0.08] font-serif text-sm font-semibold italic leading-none text-aura-ink/60"
          >
            §
          </span>
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.3em] text-aura-ink/70">
            // {item.label}
          </span>
          <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
        </div>

        <p className="mt-2.5 text-label leading-relaxed text-aura-ink/85">{item.text}</p>

        {hasReveals ? (
          <ul className="mt-3 space-y-2 border-t border-aura-hairline pt-2.5">
            {reveals.map((read) => (
              <li key={read.id}>
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  {readKindLabel(read)}
                </p>
                <p className="mt-0.5 text-label leading-snug text-aura-ink/80">{read.readText}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </motion.li>
  );
}

function SystemNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="flex justify-center">
      <p className="max-w-md text-center font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        {item.text}
      </p>
    </motion.li>
  );
}

function DateStatusCue({
  pendingDateAction,
  isJudgePending,
  pauseRequested,
}: {
  pendingDateAction: PendingDateAction | null;
  isJudgePending: boolean;
  pauseRequested: boolean;
}) {
  if (pauseRequested) {
    return (
      <CupidStatusPill
        label="Pause filed"
        leading={<span aria-hidden className="size-1.5 rounded-full bg-aura-amber" />}
      />
    );
  }

  if (pendingDateAction === null) {
    return (
      <CupidStatusPill
        label="Next exchange ready"
        leading={<span aria-hidden className="size-1.5 rounded-full bg-aura-emerald" />}
      />
    );
  }

  if (!isJudgePending) {
    return null;
  }

  return (
    <CupidStatusPill
      label="Cupid is listening"
      leading={
        <span aria-hidden className="flex items-center gap-1">
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/55 [animation-delay:0ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/65 [animation-delay:180ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/75 [animation-delay:360ms]" />
        </span>
      }
    />
  );
}

function CupidStatusPill({ label, leading }: { label: string; leading: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-[22px] rounded-bl-md bg-white/70 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md">
      {leading}
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
    </div>
  );
}
