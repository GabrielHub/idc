import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { TUTORIAL_MANAGER_PORTRAIT_SRC } from "./tutorial";

export type ManagerQuipTriggerKey =
  | "date.started"
  | "date.ended"
  | "date.ended-early"
  | "date.outcome.bad-fit"
  | "date.outcome.cool-down"
  | "date.outcome.encourage"
  | "pair.trajectory.brittle"
  | "pair.closure.confirmed"
  | "member.retention.warning"
  | "member.status.quit"
  | "datebook.commit.over-budget"
  | "campaign.closures.five"
  | "focus.swap.first";

export interface ManagerQuipTriggerGroup {
  key: ManagerQuipTriggerKey;
  label: string;
  summary: string;
  cadence: "rare" | "regular" | "episodic";
}

export const MANAGER_QUIP_TRIGGER_GROUPS: ManagerQuipTriggerGroup[] = [
  {
    key: "date.started",
    label: "Date started",
    summary: "Pair was just committed and the player walked them into the room.",
    cadence: "regular",
  },
  {
    key: "date.ended",
    label: "Date wrapped",
    summary: "The date played out fully and the final report is on screen.",
    cadence: "regular",
  },
  {
    key: "date.ended-early",
    label: "Date ended early",
    summary: "A walkout or a hard stop ended the date before the wrap turn.",
    cadence: "episodic",
  },
  {
    key: "date.outcome.bad-fit",
    label: "Outcome, bad fit",
    summary: "Wrap landed on bad fit. Pair is getting archived.",
    cadence: "regular",
  },
  {
    key: "date.outcome.cool-down",
    label: "Outcome, cool down",
    summary: "Wrap landed on cool down. Player files the follow-up.",
    cadence: "regular",
  },
  {
    key: "date.outcome.encourage",
    label: "Outcome, encourage",
    summary: "Wrap landed on encourage. The file gets a green stamp.",
    cadence: "regular",
  },
  {
    key: "pair.trajectory.brittle",
    label: "Pair turns brittle",
    summary: "Trajectory service flagged the pair as brittle after the wrap.",
    cadence: "episodic",
  },
  {
    key: "pair.closure.confirmed",
    label: "Closure confirmed",
    summary: "Player confirmed a closure. Two slots opened on the roster.",
    cadence: "regular",
  },
  {
    key: "member.retention.warning",
    label: "Retention below 25",
    summary: "A focused case dipped into the danger zone after a date.",
    cadence: "regular",
  },
  {
    key: "member.status.quit",
    label: "Member quit",
    summary: "Retention hit zero. Member exits the roster.",
    cadence: "rare",
  },
  {
    key: "datebook.commit.over-budget",
    label: "Commit blocked, over budget",
    summary: "Player tried to commit a pair while the deck is over budget.",
    cadence: "episodic",
  },
  {
    key: "campaign.closures.five",
    label: "Soft win, five closures",
    summary: "Closure counter crossed five. Promotion cutscene.",
    cadence: "rare",
  },
  {
    key: "focus.swap.first",
    label: "First focus swap",
    summary: "Player dropped a focus case for the first time, paying the retention penalty.",
    cadence: "rare",
  },
];

export interface ManagerQuip {
  id: string;
  triggerKey: ManagerQuipTriggerKey;
  text: string;
  translation?: string;
  audio: string;
  status: "draft" | "recorded";
}

export const MANAGER_QUIP_CATALOG: ManagerQuip[] = [
  {
    id: "date-start-01",
    triggerKey: "date.started",
    text: "Pair's in. Try not to embarrass me.",
    audio: "/assets/manager-quips/date-start-01.mp3",
    status: "draft",
  },
  {
    id: "date-start-02",
    triggerKey: "date.started",
    text: "Doors shut. Magic happens, allegedly.",
    audio: "/assets/manager-quips/date-start-02.mp3",
    status: "draft",
  },
  {
    id: "date-start-03",
    triggerKey: "date.started",
    text: "Booked. Wake me when it gets interesting.",
    audio: "/assets/manager-quips/date-start-03.mp3",
    status: "draft",
  },
  {
    id: "date-start-04",
    triggerKey: "date.started",
    text: "Okay. Rolling tape. Let's see what they ruin first.",
    audio: "/assets/manager-quips/date-start-04.mp3",
    status: "draft",
  },
  {
    id: "date-start-05",
    triggerKey: "date.started",
    text: "两个人，一间房，我去喝杯咖啡。",
    translation: "Two people, one room. I'm going for a coffee.",
    audio: "/assets/manager-quips/date-start-05.mp3",
    status: "draft",
  },
  {
    id: "date-end-01",
    triggerKey: "date.ended",
    text: "And we're done. Try to look surprised.",
    audio: "/assets/manager-quips/date-end-01.mp3",
    status: "draft",
  },
  {
    id: "date-end-02",
    triggerKey: "date.ended",
    text: "Date's wrapped. Follow-up's your problem now.",
    audio: "/assets/manager-quips/date-end-02.mp3",
    status: "draft",
  },
  {
    id: "date-end-03",
    triggerKey: "date.ended",
    text: "Curtain. Read the room, file accordingly.",
    audio: "/assets/manager-quips/date-end-03.mp3",
    status: "draft",
  },
  {
    id: "date-end-04",
    triggerKey: "date.ended",
    text: "Show's over. Pretend you were paying attention.",
    audio: "/assets/manager-quips/date-end-04.mp3",
    status: "draft",
  },
  {
    id: "date-end-05",
    triggerKey: "date.ended",
    text: "Se acabó. Ahora la parte aburrida: el papeleo.",
    translation: "It's over. Now the boring part: the paperwork.",
    audio: "/assets/manager-quips/date-end-05.mp3",
    status: "draft",
  },
  {
    id: "date-early-01",
    triggerKey: "date.ended-early",
    text: "They bailed. Cool. Adding it to the pile.",
    audio: "/assets/manager-quips/date-early-01.mp3",
    status: "draft",
  },
  {
    id: "date-early-02",
    triggerKey: "date.ended-early",
    text: "Walkout. Cool, cool, cool. Totally normal.",
    audio: "/assets/manager-quips/date-early-02.mp3",
    status: "draft",
  },
  {
    id: "date-early-03",
    triggerKey: "date.ended-early",
    text: "Early exit logged. Adding it to the wall of why.",
    audio: "/assets/manager-quips/date-early-03.mp3",
    status: "draft",
  },
  {
    id: "bad-fit-01",
    triggerKey: "date.outcome.bad-fit",
    text: "Bad fit. Shocking, I know.",
    audio: "/assets/manager-quips/bad-fit-01.mp3",
    status: "draft",
  },
  {
    id: "bad-fit-02",
    triggerKey: "date.outcome.bad-fit",
    text: "Yeah, no. Archiving that one.",
    audio: "/assets/manager-quips/bad-fit-02.mp3",
    status: "draft",
  },
  {
    id: "bad-fit-03",
    triggerKey: "date.outcome.bad-fit",
    text: "Chemistry: zero. Filing it under tried.",
    audio: "/assets/manager-quips/bad-fit-03.mp3",
    status: "draft",
  },
  {
    id: "cool-down-01",
    triggerKey: "date.outcome.cool-down",
    text: "Cooldown. Sometimes the best move is the door.",
    audio: "/assets/manager-quips/cool-down-01.mp3",
    status: "draft",
  },
  {
    id: "cool-down-02",
    triggerKey: "date.outcome.cool-down",
    text: "Give them a minute. Or six. Whatever.",
    audio: "/assets/manager-quips/cool-down-02.mp3",
    status: "draft",
  },
  {
    id: "cool-down-03",
    triggerKey: "date.outcome.cool-down",
    text: "Space, applied. Resist the urge to poke it.",
    audio: "/assets/manager-quips/cool-down-03.mp3",
    status: "draft",
  },
  {
    id: "encourage-01",
    triggerKey: "date.outcome.encourage",
    text: "Green light. Book the next one before they overthink it.",
    audio: "/assets/manager-quips/encourage-01.mp3",
    status: "draft",
  },
  {
    id: "encourage-02",
    triggerKey: "date.outcome.encourage",
    text: "Encourage. Don't let momentum die of paperwork.",
    audio: "/assets/manager-quips/encourage-02.mp3",
    status: "draft",
  },
  {
    id: "brittle-01",
    triggerKey: "pair.trajectory.brittle",
    text: "Brittle. Be gentle. Or don't. Your call.",
    audio: "/assets/manager-quips/brittle-01.mp3",
    status: "draft",
  },
  {
    id: "brittle-02",
    triggerKey: "pair.trajectory.brittle",
    text: "Trajectory's wobbling. Maybe ease off the dramatics.",
    audio: "/assets/manager-quips/brittle-02.mp3",
    status: "draft",
  },
  {
    id: "closure-confirmed-01",
    triggerKey: "pair.closure.confirmed",
    text: "Case closed. Somebody else's problem now.",
    audio: "/assets/manager-quips/closure-confirmed-01.mp3",
    status: "draft",
  },
  {
    id: "closure-confirmed-02",
    triggerKey: "pair.closure.confirmed",
    text: "Off the books. Two chairs free.",
    audio: "/assets/manager-quips/closure-confirmed-02.mp3",
    status: "draft",
  },
  {
    id: "closure-confirmed-03",
    triggerKey: "pair.closure.confirmed",
    text: "Done. They get a candle, we get capacity.",
    audio: "/assets/manager-quips/closure-confirmed-03.mp3",
    status: "draft",
  },
  {
    id: "retention-warn-01",
    triggerKey: "member.retention.warning",
    text: "They're one bad date from packing it in.",
    audio: "/assets/manager-quips/retention-warn-01.mp3",
    status: "draft",
  },
  {
    id: "retention-warn-02",
    triggerKey: "member.retention.warning",
    text: "Retention's tanking. Pick something soft next.",
    audio: "/assets/manager-quips/retention-warn-02.mp3",
    status: "draft",
  },
  {
    id: "retention-warn-03",
    triggerKey: "member.retention.warning",
    text: "Twenty-five and dropping. Read the room.",
    audio: "/assets/manager-quips/retention-warn-03.mp3",
    status: "draft",
  },
  {
    id: "member-quit-01",
    triggerKey: "member.status.quit",
    text: "And there it is. They're out. Update the cap.",
    audio: "/assets/manager-quips/member-quit-01.mp3",
    status: "draft",
  },
  {
    id: "over-budget-01",
    triggerKey: "datebook.commit.over-budget",
    text: "You're broke. The deck disagrees with reality.",
    audio: "/assets/manager-quips/over-budget-01.mp3",
    status: "draft",
  },
  {
    id: "over-budget-02",
    triggerKey: "datebook.commit.over-budget",
    text: "Numbers don't math. Take something off.",
    audio: "/assets/manager-quips/over-budget-02.mp3",
    status: "draft",
  },
  {
    id: "soft-win-01",
    triggerKey: "campaign.closures.five",
    text: "Five down. Five fewer people emailing me. Promotion confirmed.",
    audio: "/assets/manager-quips/soft-win-01.mp3",
    status: "draft",
  },
  {
    id: "first-swap-01",
    triggerKey: "focus.swap.first",
    text: "Letting this one go. Not every case wants to close.",
    audio: "/assets/manager-quips/first-swap-01.mp3",
    status: "draft",
  },
];

const STAGE_VISIBLE_MS = 4200;
const ENTRY_X_OFFSET_PX = 360;
const ENTRY_Y_OFFSET_PX = 220;
const ENTRY_TILT_DEG = 22;
const RESTING_TILT_DEG = 7;

type StandeeSide = "left" | "right";

interface ActiveQuipState {
  quip: ManagerQuip;
  key: number;
  side: StandeeSide;
}

function pickNextSide(previous: StandeeSide | null): StandeeSide {
  if (previous === "left") return "right";
  if (previous === "right") return "left";
  return Math.random() < 0.5 ? "left" : "right";
}

function playClipBestEffort(path: string): void {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.addEventListener("error", () => undefined);
    void audio.play().catch(() => undefined);
  } catch {
    return;
  }
}

interface ManagerStageProps {
  active: ActiveQuipState | null;
}

function ManagerStage({ active }: ManagerStageProps) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-card border border-aura-hairline bg-gradient-to-br from-rose-50/70 via-white/45 to-violet-50/55 shadow-[0_30px_70px_-32px_rgba(167,139,250,0.42),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
      <StageMesh />
      <StageGrid />
      <StageHeader />
      <StageFloorFade />
      <AnimatePresence>
        {active ? <ManagerStandee key={active.key} quip={active.quip} side={active.side} /> : null}
      </AnimatePresence>
      <StageEmptyHint visible={active === null} />
    </div>
  );
}

function StageMesh() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="aura-blob-1 absolute -left-16 top-10 size-64 rounded-full bg-aura-mesh-rose/60 blur-3xl" />
      <span className="aura-blob-2 absolute right-0 top-0 size-72 rounded-full bg-aura-mesh-violet/55 blur-3xl" />
      <span className="aura-blob-3 absolute bottom-0 left-1/3 size-56 rounded-full bg-aura-mesh-amber/50 blur-3xl" />
    </div>
  );
}

function StageGrid() {
  return (
    <div
      aria-hidden
      className="aura-dot-grid pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
    />
  );
}

function StageHeader() {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 border-b border-aura-hairline bg-white/45 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <span aria-hidden className="aura-pulse size-1.5 rounded-full bg-aura-rose" />
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-aura-ink">
          Cupid / shift 04
        </span>
        <span className="font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
          / live date
        </span>
      </div>
      <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
        <span>turn 18 / 24</span>
        <span aria-hidden className="h-3 w-px bg-aura-hairline-strong" />
        <span>health 62</span>
      </div>
    </div>
  );
}

function StageFloorFade() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/65 via-white/15 to-transparent"
    />
  );
}

function StageEmptyHint({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 text-center font-serif italic text-aura-muted transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="text-sm">She is offstage. Play a line to bring her up.</span>
    </div>
  );
}

interface ManagerStandeeProps {
  quip: ManagerQuip;
  side: StandeeSide;
}

function ManagerStandee({ quip, side }: ManagerStandeeProps) {
  const isLeft = side === "left";
  const offscreenX = isLeft ? -ENTRY_X_OFFSET_PX : ENTRY_X_OFFSET_PX;
  const entryTilt = isLeft ? ENTRY_TILT_DEG : -ENTRY_TILT_DEG;
  const restingTilt = isLeft ? RESTING_TILT_DEG : -RESTING_TILT_DEG;

  return (
    <motion.div
      className={`pointer-events-none absolute bottom-[-160px] z-10 h-[560px] w-[320px] ${
        isLeft ? "left-[2%]" : "right-[2%]"
      } ${isLeft ? "origin-[25%_95%]" : "origin-[75%_95%]"}`}
      initial={{ x: offscreenX, y: ENTRY_Y_OFFSET_PX, rotate: entryTilt }}
      animate={{ x: 0, y: 0, rotate: restingTilt }}
      exit={{ x: offscreenX, y: ENTRY_Y_OFFSET_PX, rotate: entryTilt }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 18,
        mass: 0.85,
      }}
    >
      <ManagerStandeeBob isLeft={isLeft}>
        <span
          aria-hidden
          className="absolute -inset-8 rounded-full bg-aura-mesh-rose/60 blur-3xl"
        />
        <img
          src={TUTORIAL_MANAGER_PORTRAIT_SRC}
          alt=""
          loading="eager"
          decoding="async"
          className="relative size-full object-contain object-top drop-shadow-[0_30px_42px_rgba(244,63,94,0.22)]"
        />
        <SpeakingMark isLeft={isLeft} />
      </ManagerStandeeBob>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 bottom-3 h-3 rounded-full bg-aura-ink/30 blur-md"
      />
      <ScreenReaderQuip text={quip.text} translation={quip.translation} />
    </motion.div>
  );
}

function ManagerStandeeBob({ children, isLeft }: { children: ReactNode; isLeft: boolean }) {
  const swayBase = isLeft ? 1.6 : -1.6;
  return (
    <motion.div
      className="relative size-full"
      animate={{
        y: [0, -7, -2, 4, 0],
        rotate: [0, swayBase, -swayBase * 0.4, swayBase * 0.7, 0],
        x: [0, -2, 1.5, -1, 0],
      }}
      transition={{
        duration: 5.2,
        ease: "easeInOut",
        repeat: Infinity,
        delay: 0.55,
      }}
    >
      {children}
    </motion.div>
  );
}

function SpeakingMark({ isLeft }: { isLeft: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute top-20 inline-flex items-end gap-0.5 rounded-pill border border-aura-hairline bg-white/85 px-2 py-1 shadow-[0_8px_18px_-10px_rgba(244,63,94,0.4)] backdrop-blur ${
        isLeft ? "right-10" : "left-10"
      }`}
    >
      <SpeakingBar delay={0} />
      <SpeakingBar delay={0.12} />
      <SpeakingBar delay={0.24} />
      <SpeakingBar delay={0.36} />
    </span>
  );
}

function SpeakingBar({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block w-[3px] rounded-full bg-gradient-to-t from-aura-rose to-aura-fuchsia"
      animate={{ height: ["6px", "14px", "6px", "10px", "6px"] }}
      transition={{
        duration: 0.9,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
    />
  );
}

function ScreenReaderQuip({ text, translation }: { text: string; translation?: string }) {
  const announcement = translation ? `${text} (${translation})` : text;
  return (
    <span role="status" className="sr-only">
      Manager check-in: {announcement}
    </span>
  );
}

function useQuipPlayback() {
  const [active, setActive] = useState<ActiveQuipState | null>(null);
  const keyRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const lastSideRef = useRef<StandeeSide | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const play = useCallback(
    (quip: ManagerQuip) => {
      keyRef.current += 1;
      const key = keyRef.current;
      const side = pickNextSide(lastSideRef.current);
      lastSideRef.current = side;
      setActive({ quip, key, side });
      if (quip.status === "recorded") {
        playClipBestEffort(quip.audio);
      }
      clearTimer();
      timeoutRef.current = window.setTimeout(() => {
        setActive((current) => (current && current.key === key ? null : current));
      }, STAGE_VISIBLE_MS);
    },
    [clearTimer],
  );

  const dismiss = useCallback(() => {
    clearTimer();
    setActive(null);
  }, [clearTimer]);

  return { active, play, dismiss };
}

export function ManagerQuipPreview() {
  const { active, play, dismiss } = useQuipPlayback();
  const [quipIndex, setQuipIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const quip = MANAGER_QUIP_CATALOG[quipIndex];

  const handleReplay = useCallback(() => {
    if (quip === undefined) return;
    play(quip);
  }, [play, quip]);

  const handleCycle = useCallback(
    (direction: 1 | -1) => {
      const next =
        (quipIndex + direction + MANAGER_QUIP_CATALOG.length) % MANAGER_QUIP_CATALOG.length;
      setQuipIndex(next);
      const nextQuip = MANAGER_QUIP_CATALOG[next];
      if (nextQuip !== undefined) {
        play(nextQuip);
      }
    },
    [play, quipIndex],
  );

  const handlePlayFromList = useCallback(
    (target: ManagerQuip) => {
      const idx = MANAGER_QUIP_CATALOG.findIndex((entry) => entry.id === target.id);
      if (idx !== -1) setQuipIndex(idx);
      play(target);
    },
    [play],
  );

  return (
    <figure className="my-6 flex flex-col gap-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // manager standee, interactive preview
        </span>
        <span className="font-serif text-sm italic leading-snug text-aura-muted">
          Click play. She pops in from a corner, tilted and shifting on stage, recorded audio
          attempts to autoplay, then she drops back the way she came. Draft lines run visual only.
        </span>
      </figcaption>

      <ManagerStage active={active} />

      <PreviewControls
        quip={quip}
        quipIndex={quipIndex}
        total={MANAGER_QUIP_CATALOG.length}
        isPlaying={active !== null}
        isExpanded={expanded}
        onCycle={handleCycle}
        onReplay={handleReplay}
        onStop={dismiss}
        onToggleExpand={() => setExpanded((prev) => !prev)}
      />

      {expanded ? (
        <ManagerQuipCatalogList activeId={active?.quip.id ?? null} onPlay={handlePlayFromList} />
      ) : null}
    </figure>
  );
}

interface PreviewControlsProps {
  quip: ManagerQuip | undefined;
  quipIndex: number;
  total: number;
  isPlaying: boolean;
  isExpanded: boolean;
  onCycle: (direction: 1 | -1) => void;
  onReplay: () => void;
  onStop: () => void;
  onToggleExpand: () => void;
}

function PreviewControls({
  quip,
  quipIndex,
  total,
  isPlaying,
  isExpanded,
  onCycle,
  onReplay,
  onStop,
  onToggleExpand,
}: PreviewControlsProps) {
  const ordinal = useMemo(
    () => `${(quipIndex + 1).toString().padStart(2, "0")} / ${total.toString().padStart(2, "0")}`,
    [quipIndex, total],
  );

  return (
    <div className="flex flex-wrap items-stretch gap-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/80 to-aura-bg/55 px-4 py-3 shadow-[0_12px_30px_-22px_rgba(244,63,94,0.22)] backdrop-blur">
      <button
        type="button"
        onClick={() => onCycle(-1)}
        aria-label="Previous quip"
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-aura-hairline bg-white/85 text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
      >
        <svg
          viewBox="0 0 10 10"
          aria-hidden
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6.5,2 3,5 6.5,8" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-1 flex-col rounded-tile border border-aura-hairline bg-white/70 px-3 py-1.5">
        <span className="truncate font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
          {ordinal} · {quip?.triggerKey ?? "untriggered"}
        </span>
        <span className="truncate font-serif text-base italic leading-snug text-aura-ink">
          {quip?.text ?? ""}
          {quip?.translation ? (
            <span className="not-italic text-aura-muted"> ({quip.translation})</span>
          ) : null}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onCycle(1)}
        aria-label="Next quip"
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-aura-hairline bg-white/85 text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
      >
        <svg
          viewBox="0 0 10 10"
          aria-hidden
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3.5,2 7,5 3.5,8" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Hide catalog" : "Show all quips"}
        className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline bg-white/85 px-3 py-1.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
      >
        <ChevronGlyph direction={isExpanded ? "up" : "down"} />
        {isExpanded ? "Hide all" : `Show all ${total}`}
      </button>

      <button
        type="button"
        onClick={isPlaying ? onStop : onReplay}
        className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_55%,#831843_100%)] px-4 py-1.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.52)] transition hover:brightness-110"
      >
        {isPlaying ? <StopGlyph /> : <PlayGlyph />}
        {isPlaying ? "Stop" : "Play"}
      </button>
    </div>
  );
}

function ChevronGlyph({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "down" ? (
        <polyline points="2,3.5 5,6.5 8,3.5" />
      ) : (
        <polyline points="2,6.5 5,3.5 8,6.5" />
      )}
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className="size-3" fill="currentColor">
      <polygon points="2.5,1.5 8,5 2.5,8.5" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className="size-3" fill="currentColor">
      <rect x="2" y="2" width="6" height="6" rx="1" />
    </svg>
  );
}

function quipsForTrigger(triggerKey: ManagerQuipTriggerKey): ManagerQuip[] {
  return MANAGER_QUIP_CATALOG.filter((quip) => quip.triggerKey === triggerKey);
}

export function ManagerQuipLibrary() {
  const { active, play, dismiss } = useQuipPlayback();
  const activeId = active?.quip.id ?? null;

  return (
    <section className="my-6 flex flex-col gap-5">
      <ManagerStage active={active} />

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // catalog · {MANAGER_QUIP_CATALOG.length.toString().padStart(2, "0")} lines across{" "}
          {MANAGER_QUIP_TRIGGER_GROUPS.length} triggers
        </span>
        {active ? (
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline bg-white/85 px-3 py-1 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
          >
            Send her offstage
          </button>
        ) : null}
      </div>

      <ManagerQuipCatalogList activeId={activeId} onPlay={play} />
    </section>
  );
}

interface ManagerQuipCatalogListProps {
  activeId: string | null;
  onPlay: (quip: ManagerQuip) => void;
}

function ManagerQuipCatalogList({ activeId, onPlay }: ManagerQuipCatalogListProps) {
  return (
    <div className="flex flex-col gap-6">
      {MANAGER_QUIP_TRIGGER_GROUPS.map((group) => {
        const quips = quipsForTrigger(group.key);
        if (quips.length === 0) return null;
        return (
          <TriggerGroupCard
            key={group.key}
            group={group}
            quips={quips}
            activeId={activeId}
            onPlay={onPlay}
          />
        );
      })}
    </div>
  );
}

interface TriggerGroupCardProps {
  group: ManagerQuipTriggerGroup;
  quips: ManagerQuip[];
  activeId: string | null;
  onPlay: (quip: ManagerQuip) => void;
}

const CADENCE_TONE: Record<
  ManagerQuipTriggerGroup["cadence"],
  { chip: string; dot: string; label: string }
> = {
  rare: {
    chip: "bg-violet-100 text-violet-700 border-violet-300/55",
    dot: "bg-violet-400",
    label: "rare",
  },
  regular: {
    chip: "bg-rose-100 text-rose-700 border-rose-300/55",
    dot: "bg-aura-rose",
    label: "regular",
  },
  episodic: {
    chip: "bg-amber-100 text-amber-800 border-amber-300/55",
    dot: "bg-amber-400",
    label: "episodic",
  },
};

function TriggerGroupCard({ group, quips, activeId, onPlay }: TriggerGroupCardProps) {
  const tone = CADENCE_TONE[group.cadence];
  return (
    <article className="flex flex-col gap-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/85 to-aura-bg/45 p-5 shadow-[0_18px_42px_-26px_rgba(244,63,94,0.22)]">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-aura-hairline pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lead font-semibold leading-tight text-aura-ink">
              {group.label}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] ${tone.chip}`}
            >
              <span aria-hidden className={`size-1.5 rounded-full ${tone.dot}`} />
              {tone.label}
            </span>
          </div>
          <p className="font-serif text-sm italic leading-snug text-aura-muted">{group.summary}</p>
        </div>
        <code className="rounded-tile border border-aura-hairline bg-white/70 px-2 py-0.5 font-mono text-sm text-aura-ink">
          {group.key}
        </code>
      </header>

      <ul className="flex flex-col gap-2">
        {quips.map((quip) => (
          <QuipRow key={quip.id} quip={quip} isActive={quip.id === activeId} onPlay={onPlay} />
        ))}
      </ul>
    </article>
  );
}

interface QuipRowProps {
  quip: ManagerQuip;
  isActive: boolean;
  onPlay: (quip: ManagerQuip) => void;
}

function QuipRow({ quip, isActive, onPlay }: QuipRowProps) {
  const statusTone =
    quip.status === "recorded"
      ? "bg-emerald-100 text-emerald-700 border-emerald-300/55"
      : "bg-slate-100 text-slate-700 border-slate-300/55";
  const statusDot = quip.status === "recorded" ? "bg-emerald-500" : "bg-slate-400";
  const rowState = isActive
    ? "border-aura-rose/60 bg-gradient-to-br from-rose-50/85 to-white/65 shadow-[0_14px_36px_-22px_rgba(244,63,94,0.45)]"
    : "border-aura-hairline bg-white/72 hover:border-aura-rose/40";
  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-tile border px-4 py-3 transition ${rowState}`}
    >
      <button
        type="button"
        onClick={() => onPlay(quip)}
        aria-label={`Play ${quip.id}`}
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shadow-[0_8px_18px_-8px_rgba(244,63,94,0.6)] transition hover:scale-[1.04]"
      >
        {isActive ? (
          <svg viewBox="0 0 10 10" aria-hidden className="size-3.5" fill="currentColor">
            <rect x="3" y="2.5" width="1.5" height="5" rx="0.4" />
            <rect x="5.5" y="2.5" width="1.5" height="5" rx="0.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" aria-hidden className="size-3.5" fill="currentColor">
            <polygon points="2.8,2 8,5 2.8,8" />
          </svg>
        )}
      </button>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-serif text-base italic leading-snug text-aura-ink">
          {quip.text}
          {quip.translation ? (
            <span className="not-italic text-aura-muted"> ({quip.translation})</span>
          ) : null}
        </p>
        <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
          <code className="rounded-tile bg-white/70 px-1.5 py-0.5 text-aura-ink">{quip.id}</code>
          <span aria-hidden>·</span>
          <span className="truncate">{quip.audio}</span>
        </div>
      </div>

      <span
        className={`inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] ${statusTone}`}
      >
        <span aria-hidden className={`size-1.5 rounded-full ${statusDot}`} />
        {quip.status}
      </span>
    </li>
  );
}

export const MANAGER_QUIP_IDS: readonly string[] = MANAGER_QUIP_CATALOG.map((quip) => quip.id);
