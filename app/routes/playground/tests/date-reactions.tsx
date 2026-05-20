import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  EASE_OUT_QUART,
  GhostButton,
  MutedLabel,
  SelectInput,
} from "../../../components/dashboard-atoms";
import {
  DATE_PORTRAIT_MOODS,
  hasReadyPortraitMood,
  selectDominantMood,
} from "../../../components/date-presentation-signals";
import {
  DaterStandee,
  pushReactionSignal,
  REACTION_ICON,
  REACTION_KINDS,
  REACTION_LABEL,
  REACTION_STREAM_LIMIT,
  type ReactionIntensity,
  type ReactionKind,
  type ReactionSignal,
} from "../../../components/date-reactions";
import {
  loadScenarioBackdropIds,
  SCENARIO_BACKDROP_MICRO_MOTION_VARIANTS,
  SCENARIO_BACKDROP_PARTICLE_STYLES,
  ScenarioBackdropLayer,
  type ScenarioBackdropMicroMotion,
  type ScenarioBackdropParticleStyle,
} from "../../../components/scenario-backdrop";
import { type Member, type PortraitMood } from "../../../domain/game";
import { starterMembers, starterScenarios } from "../../../fixtures";
import { jennaPike, vhool } from "../../../fixtures/members";
import { TestHeader, TextAreaControl } from "../shared";

const REACTION_TINT: Record<ReactionKind, string> = {
  spark: "text-violet-500",
  love: "text-aura-rose",
  laugh: "text-amber-600",
  anger: "text-rose-700",
  cry: "text-sky-600",
  warning: "text-amber-700",
};

type SideId = "left" | "right";

type SideState = {
  memberId: string;
  mood: PortraitMood;
  speaking: boolean;
  reasoningText: string;
  reactions: ReactionSignal[];
};

type MoodTintSelection = "off" | "auto" | PortraitMood;

const MOOD_TINT_OPTIONS: ReadonlyArray<{ value: MoodTintSelection; label: string }> = [
  { value: "off", label: "off" },
  { value: "auto", label: "auto (sides)" },
  { value: "neutral", label: "neutral" },
  { value: "flirty", label: "flirty" },
  { value: "confused", label: "confused" },
  { value: "angry", label: "angry" },
];

const MICRO_MOTION_LABELS: Record<ScenarioBackdropMicroMotion, string> = {
  off: "off",
  drift: "drift",
  pointer: "pointer",
  "drift-pointer": "drift + pointer",
};

const PARTICLE_STYLE_LABELS: Record<ScenarioBackdropParticleStyle, string> = {
  off: "off",
  motes: "motes",
  embers: "embers",
  snow: "snow",
};

const SIDE_THEME: Record<
  SideId,
  {
    label: string;
    accentText: string;
    accentPill: string;
    railGradient: string;
  }
> = {
  left: {
    label: "bottom-left",
    accentText: "text-aura-rose",
    accentPill: "bg-rose-100/65 text-aura-rose",
    railGradient: "from-rose-200/40 via-rose-100/8 to-transparent",
  },
  right: {
    label: "bottom-right",
    accentText: "text-violet-600",
    accentPill: "bg-violet-100/70 text-violet-600",
    railGradient: "from-violet-200/40 via-violet-100/8 to-transparent",
  },
};

const SAMPLE_REASONING_LINES = [
  "running the line back, what would land softer here",
  "wait does this read as flirting or a planning document",
  "if i pivot now i lose the thread, hold one more beat",
] as const;

function defaultSideState(memberId: string): SideState {
  return {
    memberId,
    mood: "neutral",
    speaking: false,
    reasoningText: "",
    reactions: [],
  };
}

export function DateReactionsTest() {
  const signalSequenceRef = useRef(0);
  const [leftSide, setLeftSide] = useState<SideState>(() => defaultSideState(jennaPike.id));
  const [rightSide, setRightSide] = useState<SideState>(() => defaultSideState(vhool.id));
  const [intensity, setIntensity] = useState<ReactionIntensity>(2);
  const [backdropScenarioId, setBackdropScenarioId] = useState<string>("");
  const [availableBackdropIds, setAvailableBackdropIds] = useState<readonly string[]>([]);
  const [microMotion, setMicroMotion] = useState<ScenarioBackdropMicroMotion>("drift");
  const [particleStyle, setParticleStyle] = useState<ScenarioBackdropParticleStyle>("motes");
  const [moodTint, setMoodTint] = useState<MoodTintSelection>("auto");

  const leftMember = starterMembers.find((member) => member.id === leftSide.memberId) ?? jennaPike;
  const rightMember = starterMembers.find((member) => member.id === rightSide.memberId) ?? vhool;

  useEffect(() => {
    let isCurrent = true;
    void loadScenarioBackdropIds().then((ids) => {
      if (isCurrent) {
        setAvailableBackdropIds(Array.from(ids));
      }
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  const backdropOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [
      { value: "", label: "None (fallback)" },
    ];
    availableBackdropIds.forEach((id) => {
      const scenario = starterScenarios.find((candidate) => candidate.id === id);
      options.push({ value: id, label: scenario?.title ?? id });
    });
    return options;
  }, [availableBackdropIds]);

  function fire(side: SideId, kind: ReactionKind) {
    signalSequenceRef.current += 1;
    const signal: ReactionSignal = {
      id: `playground-${side}-${kind}-${signalSequenceRef.current}`,
      side,
      kind,
      intensity,
    };
    const setter = side === "left" ? setLeftSide : setRightSide;
    setter((current) => ({
      ...current,
      reactions: pushReactionSignal(current.reactions, signal),
    }));
  }

  function fireBoth(kind: ReactionKind) {
    fire("left", kind);
    fire("right", kind);
  }

  function fireCombo(side: SideId) {
    REACTION_KINDS.forEach((kind) => fire(side, kind));
  }

  function clearSide(side: SideId) {
    const setter = side === "left" ? setLeftSide : setRightSide;
    setter((current) => ({ ...current, reactions: [] }));
  }

  function clearAll() {
    clearSide("left");
    clearSide("right");
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Date reactions"
        description="Drive each standee independently. Mood swaps the portrait variant, speaking floats the thought bubble, and reactions emit the same glass swarm the date scene fires on Cupid feedback."
      />

      <BubbleStage
        leftMember={leftMember}
        rightMember={rightMember}
        leftSide={leftSide}
        rightSide={rightSide}
        backdropScenarioId={backdropScenarioId}
        backdropOptions={backdropOptions}
        microMotion={microMotion}
        particleStyle={particleStyle}
        moodTint={moodTint}
        onBackdropChange={setBackdropScenarioId}
        onMicroMotionChange={setMicroMotion}
        onParticleStyleChange={setParticleStyle}
        onMoodTintChange={setMoodTint}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SideController
          side="left"
          state={leftSide}
          member={leftMember}
          intensity={intensity}
          onChange={setLeftSide}
          onFire={(kind) => fire("left", kind)}
          onFireCombo={() => fireCombo("left")}
          onClearReactions={() => clearSide("left")}
        />
        <SideController
          side="right"
          state={rightSide}
          member={rightMember}
          intensity={intensity}
          onChange={setRightSide}
          onFire={(kind) => fire("right", kind)}
          onFireCombo={() => fireCombo("right")}
          onClearReactions={() => clearSide("right")}
        />
      </div>

      <GlobalDeck
        intensity={intensity}
        onIntensity={setIntensity}
        onFireBoth={fireBoth}
        onClearAll={clearAll}
        leftCount={leftSide.reactions.length}
        rightCount={rightSide.reactions.length}
      />
    </motion.section>
  );
}

function BubbleStage({
  leftMember,
  rightMember,
  leftSide,
  rightSide,
  backdropScenarioId,
  backdropOptions,
  microMotion,
  particleStyle,
  moodTint,
  onBackdropChange,
  onMicroMotionChange,
  onParticleStyleChange,
  onMoodTintChange,
}: {
  leftMember: Member;
  rightMember: Member;
  leftSide: SideState;
  rightSide: SideState;
  backdropScenarioId: string;
  backdropOptions: ReadonlyArray<{ value: string; label: string }>;
  microMotion: ScenarioBackdropMicroMotion;
  particleStyle: ScenarioBackdropParticleStyle;
  moodTint: MoodTintSelection;
  onBackdropChange: (value: string) => void;
  onMicroMotionChange: (value: ScenarioBackdropMicroMotion) => void;
  onParticleStyleChange: (value: ScenarioBackdropParticleStyle) => void;
  onMoodTintChange: (value: MoodTintSelection) => void;
}) {
  const activeBackdropId = backdropScenarioId === "" ? undefined : backdropScenarioId;
  const resolvedMoodTint =
    moodTint === "off"
      ? undefined
      : moodTint === "auto"
        ? selectDominantMood(leftSide.mood, rightSide.mood)
        : moodTint;
  const microMotionOptions = SCENARIO_BACKDROP_MICRO_MOTION_VARIANTS.map((value) => ({
    value,
    label: MICRO_MOTION_LABELS[value],
  }));
  const particleStyleOptions = SCENARIO_BACKDROP_PARTICLE_STYLES.map((value) => ({
    value,
    label: PARTICLE_STYLE_LABELS[value],
  }));

  return (
    <div className="aura-glass-strong relative overflow-hidden rounded-card">
      <header className="relative z-10 space-y-3 border-b border-aura-hairline/60 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
            // stage backdrop
          </span>
          <SelectInput
            label="scenario"
            value={backdropScenarioId}
            options={backdropOptions}
            onChange={onBackdropChange}
            layout="inline"
            align="right"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <SelectInput<ScenarioBackdropMicroMotion>
            label="motion"
            value={microMotion}
            options={microMotionOptions}
            onChange={onMicroMotionChange}
            layout="inline"
            align="right"
          />
          <SelectInput<ScenarioBackdropParticleStyle>
            label="particles"
            value={particleStyle}
            options={particleStyleOptions}
            onChange={onParticleStyleChange}
            layout="inline"
            align="right"
          />
          <SelectInput<MoodTintSelection>
            label="mood tint"
            value={moodTint}
            options={MOOD_TINT_OPTIONS}
            onChange={onMoodTintChange}
            layout="inline"
            align="right"
          />
        </div>
      </header>

      <div className="relative h-[68vh] min-h-[520px] w-full overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(244,63,94,0.08),transparent_70%)]"
        />
        <ScenarioBackdropLayer
          scenarioId={activeBackdropId}
          containment="absolute"
          microMotion={microMotion}
          particles={particleStyle}
          moodTint={resolvedMoodTint}
        />
        <DaterStandee
          member={leftMember}
          placement="bottom-left"
          mood={leftSide.mood}
          reactions={leftSide.reactions}
          className="absolute bottom-0 left-6 h-full w-48 lg:left-16 lg:w-64"
        />
        <DaterStandee
          member={rightMember}
          placement="bottom-right"
          mood={rightSide.mood}
          reactions={rightSide.reactions}
          className="absolute bottom-0 right-6 h-full w-48 lg:right-16 lg:w-64"
        />

        <StageScrim />
      </div>

      <StageFooter
        leftMember={leftMember}
        rightMember={rightMember}
        leftSide={leftSide}
        rightSide={rightSide}
      />
    </div>
  );
}

function StageScrim() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/45 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/35 to-transparent"
      />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.34em] text-aura-faint/80">
          // Cupid feedback preview
        </p>
        <p className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-faint/60">
          stage
        </p>
      </div>
    </>
  );
}

function StageFooter({
  leftMember,
  rightMember,
  leftSide,
  rightSide,
}: {
  leftMember: Member;
  rightMember: Member;
  leftSide: SideState;
  rightSide: SideState;
}) {
  return (
    <div className="grid gap-2 border-t border-aura-hairline px-5 py-3 sm:grid-cols-3">
      <StageMarker member={leftMember} state={leftSide} side="left" align="left" />
      <span className="hidden items-center justify-center font-mono text-micro uppercase tracking-[0.28em] text-aura-faint sm:flex">
        // stage
      </span>
      <StageMarker member={rightMember} state={rightSide} side="right" align="right" />
    </div>
  );
}

function StageMarker({
  member,
  state,
  side,
  align,
}: {
  member: Member;
  state: SideState;
  side: SideId;
  align: "left" | "right";
}) {
  const theme = SIDE_THEME[side];
  return (
    <div
      className={`flex flex-col gap-1 ${align === "right" ? "items-end text-right" : "items-start text-left"}`}
    >
      <span
        className={`font-mono text-micro font-semibold uppercase tracking-[0.28em] ${theme.accentText}`}
      >
        // {theme.label}
      </span>
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
        <span className="text-aura-ink">{member.firstName}</span>
        <span className="text-aura-faint"> · {state.mood}</span>
        {state.speaking ? <span className="text-aura-rose"> · speaking</span> : null}
      </span>
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        reactions <span className="text-aura-ink tabular-nums">{state.reactions.length}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Side controller, mirrors one standee end-to-end                    */
/* ------------------------------------------------------------------ */

function SideController({
  side,
  state,
  member,
  intensity,
  onChange,
  onFire,
  onFireCombo,
  onClearReactions,
}: {
  side: SideId;
  state: SideState;
  member: Member;
  intensity: ReactionIntensity;
  onChange: React.Dispatch<React.SetStateAction<SideState>>;
  onFire: (kind: ReactionKind) => void;
  onFireCombo: () => void;
  onClearReactions: () => void;
}) {
  const theme = SIDE_THEME[side];
  const wiredCount = DATE_PORTRAIT_MOODS.filter((mood) =>
    hasReadyPortraitMood(member, mood),
  ).length;
  const atCap = state.reactions.length >= REACTION_STREAM_LIMIT;

  function patch<TKey extends keyof SideState>(key: TKey, value: SideState[TKey]) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="aura-glass relative overflow-hidden rounded-card">
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b ${theme.railGradient}`}
      />
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="space-y-1">
          <span
            className={`font-mono text-micro font-semibold uppercase tracking-[0.32em] ${theme.accentText}`}
          >
            // {theme.label}
          </span>
          <h3 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            {member.name}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-pill ${theme.accentPill} px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em]`}
        >
          {wiredCount} / {DATE_PORTRAIT_MOODS.length} wired
        </span>
      </header>

      <div className="space-y-5 px-5 pt-5 pb-5">
        <SideSection label="member">
          <SelectInput
            label="character"
            value={state.memberId}
            options={starterMembers.map((candidate) => ({
              value: candidate.id,
              label: candidate.name,
            }))}
            onChange={(value) => patch("memberId", value)}
          />
        </SideSection>

        <SideSection label="portrait variant">
          <MoodPicker
            member={member}
            value={state.mood}
            onChange={(value) => patch("mood", value)}
          />
        </SideSection>

        <SideSection label="thought bubble">
          <SpeakingToggle checked={state.speaking} onChange={(value) => patch("speaking", value)} />
          <TextAreaControl
            label="reasoning text"
            value={state.reasoningText}
            rows={3}
            onChange={(value) => patch("reasoningText", value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_REASONING_LINES.map((line, index) => (
              <button
                key={index}
                type="button"
                onClick={() => patch("reasoningText", line)}
                className="cursor-pointer rounded-pill border border-aura-hairline bg-white/55 px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-hairline-strong hover:text-aura-ink"
              >
                Sample {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => patch("reasoningText", "")}
              disabled={state.reasoningText === ""}
              className="cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </SideSection>

        <SideSection
          label={`reactions · intensity ${intensity} · ${state.reactions.length} active`}
        >
          <ReactionDeck onFire={onFire} disabled={atCap} />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <GhostButton onClick={onFireCombo} disabled={atCap}>
              Fire combo
            </GhostButton>
            <button
              type="button"
              onClick={onClearReactions}
              disabled={state.reactions.length === 0}
              className="cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear side
            </button>
          </div>
          {atCap ? (
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-amber">
              // four-reaction cap reached. clear to add more.
            </p>
          ) : null}
        </SideSection>
      </div>
    </section>
  );
}

function SideSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-aura-hairline pt-5 first:border-t-0 first:pt-0">
      <MutedLabel>{label}</MutedLabel>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function MoodPicker({
  member,
  value,
  onChange,
}: {
  member: Member;
  value: PortraitMood;
  onChange: (mood: PortraitMood) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {DATE_PORTRAIT_MOODS.map((mood) => {
        const isActive = mood === value;
        const wired = hasReadyPortraitMood(member, mood);
        return (
          <li key={mood}>
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(mood)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-tile border px-3 py-2 transition ${
                isActive
                  ? "border-transparent bg-aura-ink text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.45)]"
                  : "border-aura-hairline bg-white/55 text-aura-muted hover:border-aura-hairline-strong hover:text-aura-ink"
              }`}
            >
              <span className="font-display text-body font-semibold tracking-tight">{mood}</span>
              <span
                className={`font-mono text-micro uppercase tracking-[0.22em] ${
                  isActive
                    ? wired
                      ? "text-white/80"
                      : "text-white/55"
                    : wired
                      ? "text-emerald-600"
                      : "text-aura-faint"
                }`}
              >
                {wired ? "wired" : "fallback"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SpeakingToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-tile border border-aura-hairline bg-white/45 px-3 py-2.5">
      <span>
        <span className="block font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
          speaking
        </span>
        <span className="mt-1 block text-label leading-relaxed text-aura-muted">
          Floats the thought bubble. Pulses while reasoning text streams.
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="size-4 cursor-pointer accent-aura-rose"
      />
    </label>
  );
}

function ReactionDeck({
  onFire,
  disabled,
}: {
  onFire: (kind: ReactionKind) => void;
  disabled: boolean;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {REACTION_KINDS.map((kind) => (
        <li key={kind}>
          <button
            type="button"
            onClick={() => onFire(kind)}
            disabled={disabled}
            className="aura-glass-lift flex w-full cursor-pointer flex-col items-center gap-1 rounded-tile border border-aura-hairline bg-white/55 px-3 py-3 transition hover:border-aura-hairline-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className={`text-2xl leading-none ${REACTION_TINT[kind]}`}>
              {REACTION_ICON[kind]}
            </span>
            <span className="block font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              {REACTION_LABEL[kind]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Global deck, intensity + shared fire actions                       */
/* ------------------------------------------------------------------ */

function GlobalDeck({
  intensity,
  onIntensity,
  onFireBoth,
  onClearAll,
  leftCount,
  rightCount,
}: {
  intensity: ReactionIntensity;
  onIntensity: (next: ReactionIntensity) => void;
  onFireBoth: (kind: ReactionKind) => void;
  onClearAll: () => void;
  leftCount: number;
  rightCount: number;
}) {
  const bothAtCap = leftCount >= REACTION_STREAM_LIMIT && rightCount >= REACTION_STREAM_LIMIT;

  return (
    <div className="aura-glass rounded-card p-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <IntensityControl intensity={intensity} onChange={onIntensity} />
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <MutedLabel>fire on both sides</MutedLabel>
            <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
              intensity {intensity}
            </span>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {REACTION_KINDS.map((kind) => (
              <li key={kind}>
                <button
                  type="button"
                  onClick={() => onFireBoth(kind)}
                  disabled={bothAtCap}
                  className="aura-glass-lift flex w-full cursor-pointer flex-col items-center gap-1 rounded-tile border border-aura-hairline bg-white/55 px-2 py-3 transition hover:border-aura-hairline-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className={`text-2xl leading-none ${REACTION_TINT[kind]}`}>
                    {REACTION_ICON[kind]}
                  </span>
                  <span className="block font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                    {REACTION_LABEL[kind]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-aura-hairline pt-4">
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          left <span className="text-aura-ink tabular-nums">{leftCount}</span>{" "}
          <span aria-hidden>·</span> right{" "}
          <span className="text-aura-ink tabular-nums">{rightCount}</span>
        </span>
        <button
          type="button"
          onClick={onClearAll}
          disabled={leftCount === 0 && rightCount === 0}
          className="cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear stage
        </button>
      </div>

      {bothAtCap ? (
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-amber">
          // both sides at the four-reaction cap. clear to add more.
        </p>
      ) : null}
    </div>
  );
}

function IntensityControl({
  intensity,
  onChange,
}: {
  intensity: ReactionIntensity;
  onChange: (next: ReactionIntensity) => void;
}) {
  const tiers: Array<{ value: ReactionIntensity; label: string; bubbles: number }> = [
    { value: 1, label: "soft", bubbles: 3 },
    { value: 2, label: "warm", bubbles: 5 },
    { value: 3, label: "loud", bubbles: 7 },
  ];

  return (
    <div className="space-y-3">
      <MutedLabel>intensity</MutedLabel>
      <div className="flex flex-col gap-1.5">
        {tiers.map((tier) => {
          const isActive = tier.value === intensity;
          return (
            <button
              key={tier.value}
              type="button"
              onClick={() => onChange(tier.value)}
              aria-pressed={isActive}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-tile border px-3 py-2 transition ${
                isActive
                  ? "border-transparent bg-aura-ink text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.45)]"
                  : "border-aura-hairline bg-white/55 text-aura-muted hover:border-aura-hairline-strong hover:text-aura-ink"
              }`}
            >
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em]">
                  {tier.value}
                </span>
                <span className="font-display text-body font-semibold tracking-tight">
                  {tier.label}
                </span>
              </span>
              <span
                className={`font-mono text-micro uppercase tracking-[0.22em] ${isActive ? "text-white/65" : "text-aura-faint"}`}
              >
                {tier.bubbles} bubbles
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
