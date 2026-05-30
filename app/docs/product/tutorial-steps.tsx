import type { ReactNode } from "react";

import {
  Chip,
  DocCallout,
  DocLink,
  DocList,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
  type ToneName,
} from "../../components/doc-primitives";
import { TUTORIAL_MANAGER_PORTRAIT_SRC } from "../../components/tutorial";
import { tutorialCopy } from "../../services/tutorial-copy";

export const meta: DocMeta = {
  slug: "product/tutorial-steps",
  group: "product",
  title: "Tutorial steps",
  description:
    "Every coach mark a first-time player sees, with copy verbatim, grouped into the phases they hit in order. The catalog for copy iteration.",
  order: 8,
};

export const lede = (
  <>
    Every coach mark a fresh save will see, in order, with copy verbatim. This is the page to read
    when you want to feel the tour from a player's seat or hunt for copy that drags. The
    implementation contract lives next door in{" "}
    <DocLink to="/docs/product/tutorial-system">Tutorial system</DocLink>.
  </>
);

type CoachMarkPreviewProps = {
  id: string;
  surface: string;
  trigger: string;
  completesOn: string;
  target: "spotlight" | "pulse-ring" | "coach-only";
  placement: "top" | "bottom" | "left" | "right";
  title: string;
  body: string;
  primaryLabel?: string;
  stepIndex?: number;
  stepCount?: number;
  portrait?: "avatar" | "portrait" | "none";
};

type FlowPhase = {
  id: string;
  label: string;
  badge: string;
  tone: ToneName;
  caption: string;
  steps: CoachMarkPreviewProps[];
};

const FIRST_TIME_FLOW_SECTIONS = [
  { id: "welcome", title: "01 · Welcome and focus cases" },
  { id: "starter-deck", title: "02 · Drafting the Date Book" },
  { id: "booking", title: "03 · Booking the pair" },
  { id: "live", title: "04 · Running the date" },
  { id: "wrap", title: "05 · Wrapping the shift" },
  { id: "files", title: "06 · Opening files for the first time" },
  { id: "lazy", title: "07 · Lazy support marks" },
] as const;

function getFirstTimeFlow(): FlowPhase[] {
  return [
    {
      id: "welcome",
      label: "Welcome and focus cases",
      badge: "01",
      tone: "rose",
      caption:
        "Onboarding · focus stage. Cupid greets the player and walks them through hiring four cases.",
      steps: [
        {
          id: "onboarding.focus.pick",
          surface: "Onboarding · focus picker",
          trigger: "First load. No cases selected yet.",
          completesOn: "Tapping any member card to focus them.",
          target: "spotlight",
          placement: "left",
          portrait: "portrait",
          ...tutorialCopy("onboarding.focus.pick"),
        },
        {
          id: "onboarding.focus.expand",
          surface: "Onboarding · focus picker",
          trigger: "After the first pick, while fewer than four cases are focused.",
          completesOn: "Opening a member file from the card arrow.",
          target: "pulse-ring",
          placement: "right",
          ...tutorialCopy("onboarding.focus.expand"),
        },
        {
          id: "onboarding.focus.start",
          surface: "Onboarding · focus picker · advance CTA",
          trigger: "All four focus cases selected.",
          completesOn: "Clicking Choose date scenarios.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("onboarding.focus.start"),
        },
      ],
    },
    {
      id: "starter-deck",
      label: "Drafting the Date Book",
      badge: "02",
      tone: "violet",
      caption:
        "Onboarding · Date Book stage. Cupid teaches the difference between the editable room pool and the three-card hand drawn later.",
      steps: [
        {
          id: "onboarding.deck.pick",
          surface: "Onboarding · Date Book draft grid",
          trigger: "After four focus cases are selected and the deck stage opens.",
          completesOn: "Tapping the seeded tutorial room card.",
          target: "spotlight",
          placement: "left",
          ...tutorialCopy("onboarding.deck.pick"),
        },
        {
          id: "onboarding.deck.expand",
          surface: "Onboarding · Date Book draft grid",
          trigger: "After the tutorial pick, while the Date Book is not legal yet.",
          completesOn: "Opening a room brief from the card arrow.",
          target: "pulse-ring",
          placement: "right",
          ...tutorialCopy("onboarding.deck.expand"),
        },
        {
          id: "onboarding.deck.start",
          surface: "Onboarding · Date Book draft CTA",
          trigger: "Starter Date Book is legal: 6-12 room cards and under budget.",
          completesOn: "Clicking Start the shift.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("onboarding.deck.start"),
        },
      ],
    },
    {
      id: "booking",
      label: "Booking the pair",
      badge: "03",
      tone: "fuchsia",
      caption:
        "Constellation lobby. The layer indicator threads the player through focus -> roster, the shift brief names tonight's work order, then Commit pair unlocks the room layer.",
      steps: [
        {
          id: "planning.layer-nav",
          surface: "Constellation lobby · LayerIndicator (all three pills)",
          trigger: "First lobby load before any focus case is picked.",
          completesOn: "The Got it button.",
          target: "pulse-ring",
          placement: "right",
          ...tutorialCopy("planning.layer-nav"),
        },
        {
          id: "planning.shift-brief",
          surface: "Constellation lobby · ShiftBriefDock",
          trigger: "After planning.layer-nav completes, before any focus case is picked.",
          completesOn: "The Got it button.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("planning.shift-brief"),
        },
        {
          id: "planning.focus",
          surface: "Constellation lobby · LayerIndicator focus pill",
          trigger: "After planning.shift-brief completes, no focus case picked yet.",
          completesOn: "Clicking a focus star (or its HoverDetailCard CTA) to make it the lead.",
          target: "pulse-ring",
          placement: "right",
          ...tutorialCopy("planning.focus"),
        },
        {
          id: "planning.partner",
          surface: "Constellation lobby · LayerIndicator roster pill",
          trigger: "After planning.focus completes; partner is not yet picked.",
          completesOn: "Clicking an eligible partner star on the roster layer.",
          target: "pulse-ring",
          placement: "right",
          ...tutorialCopy("planning.partner"),
        },
        {
          id: "planning.intent",
          surface: "Constellation lobby · IntentRail (inside SideRail)",
          trigger: "Both focus and partner are picked; intent is not yet filed.",
          completesOn:
            "The Got it button, or auto-completes when the player files any intent, reaches the room layer, or picks a scenario.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("planning.intent"),
        },
        {
          id: "planning.commit",
          surface: "Constellation lobby · BottomDock Commit pair button",
          trigger: "Partner is picked, intent step is done, and no active booking exists yet.",
          completesOn: "Clicking Commit pair, which locks the pair and draws the three-card hand.",
          target: "coach-only",
          placement: "left",
          ...tutorialCopy("planning.commit"),
        },
        {
          id: "planning.scenario",
          surface: "Constellation lobby · CathedralPanel grid",
          trigger: "Pair is committed, the player is on the room layer, no scenario chosen.",
          completesOn: "Clicking any door to set the room.",
          target: "spotlight",
          placement: "top",
          ...tutorialCopy("planning.scenario"),
        },
        {
          id: "planning.begin",
          surface: "Constellation lobby · BottomDock Begin button",
          trigger: "A scenario is selected from the committed three-card hand.",
          completesOn: "Clicking Begin, which starts the date and opens the room.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("planning.begin"),
        },
      ],
    },
    {
      id: "live",
      label: "Running the date",
      badge: "04",
      tone: "amber",
      caption:
        "Live date dashboard. The player drafts scenes first, then the footer teaches gauges, transport, Cupid reads, and nudges.",
      steps: [
        {
          id: "date.draft-events",
          surface: "Live date · scene draft column",
          trigger: "The date opens in drafting mode and the player has not picked three scenes.",
          completesOn:
            "Tapping any scene card to add it to picks. Auto-skips if playback leaves drafting first.",
          target: "spotlight",
          placement: "right",
          ...tutorialCopy("date.draft-events"),
        },
        {
          id: "date.footer.health",
          surface: "Live date · footer gauges",
          trigger: "Date is live and the gauges are mounted.",
          completesOn: "The Got it button.",
          target: "spotlight",
          placement: "top",
          ...tutorialCopy("date.footer.health"),
        },
        {
          id: "date.footer.transport",
          surface: "Live date · transport controls",
          trigger: "After date.footer.health completes, while not streaming.",
          completesOn: "Pressing play or advancing a beat.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("date.footer.transport"),
        },
        {
          id: "date.judge-note",
          surface: "Live date · first Cupid snapshot",
          trigger: "The first Cupid snapshot has been written.",
          completesOn: "The Got it button.",
          target: "spotlight",
          placement: "top",
          ...tutorialCopy("date.judge-note"),
        },
        {
          id: "date.nudge.compose",
          surface: "Live date · nudge button",
          trigger: "Footer steps done, nudge button enabled, no nudges used yet.",
          completesOn: "Clicking Open composer, which also opens the nudge modal.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("date.nudge.compose"),
        },
      ],
    },
    {
      id: "wrap",
      label: "Wrapping the shift",
      badge: "05",
      tone: "emerald",
      caption:
        "After the date resolves the player files a follow-up, then files the shift back in the lobby.",
      steps: [
        {
          id: "date.followup",
          surface: "Live date · final report footer",
          trigger: "Final report is rendered with follow-up actions available.",
          completesOn: "Picking a follow-up action.",
          target: "spotlight",
          placement: "top",
          ...tutorialCopy("date.followup"),
        },
        {
          id: "planning.file-shift",
          surface: "Constellation lobby · ContextualPillRail File shift button",
          trigger: "Date is settled and the shift is filable.",
          completesOn: "Clicking File shift in the top-right pill rail.",
          target: "pulse-ring",
          placement: "bottom",
          ...tutorialCopy("planning.file-shift"),
        },
      ],
    },
    {
      id: "files",
      label: "Opening files for the first time",
      badge: "06",
      tone: "sky",
      caption:
        "Two one-time orientations that fire the first time the player opens a member modal or a scenario modal.",
      steps: [
        {
          id: "member.file.first-open",
          surface: "Member details modal · intel board",
          trigger: "First time any member modal is opened on a save.",
          completesOn: "The Got it button.",
          target: "coach-only",
          placement: "top",
          ...tutorialCopy("member.file.first-open"),
        },
        {
          id: "scenario.file.first-open",
          surface: "Scenario details modal · brief section",
          trigger: "First time any scenario modal is opened on a save.",
          completesOn: "The Got it button.",
          target: "coach-only",
          placement: "top",
          ...tutorialCopy("scenario.file.first-open"),
        },
      ],
    },
    {
      id: "lazy",
      label: "Lazy support marks",
      badge: "07",
      tone: "slate",
      caption:
        "These never fire on the required path. They wait for an edge case (a swap, a card offer, a budget cut, a cooldown, a closure, a file-date unlock on a longer date, a first Date Book open, a first lobby explore) and explain it once.",
      steps: [
        {
          id: "lazy.contextual-rail",
          surface:
            "Constellation lobby · ContextualPillRail (top-right cluster + top-center roster controls)",
          trigger:
            "Lobby is in auto mode with at least one focus case picked, no active booking, and the player has filed at least one shift (so the Records pill is visible).",
          completesOn: "The Got it button.",
          target: "coach-only",
          placement: "left",
          ...tutorialCopy("lazy.contextual-rail"),
        },
        {
          id: "lazy.date-book",
          surface: "Constellation lobby · ContextualPillRail Date Book pill",
          trigger:
            "Lobby is on auto mode after the first date report is filed (Date Book editing is unlocked), with no active booking and no repair-blocked Date Book. Yields to lazy.contextual-rail so the broader pill overview lands first; Edit mode unmounts the HUD so the auto gate keeps the coach mark anchored to a visible pill.",
          completesOn: "The Got it button.",
          target: "pulse-ring",
          placement: "left",
          ...tutorialCopy("lazy.date-book"),
        },
        {
          id: "lazy.datebook.card-offer",
          surface: "Constellation lobby · post-date card offer overlay",
          trigger: "A pending Date Book card offer is open after a date or closure.",
          completesOn: "The Got it button.",
          target: "coach-only",
          placement: "right",
          ...tutorialCopy("lazy.datebook.card-offer"),
        },
        {
          id: "lazy.cut-short",
          surface: "Live date · file date transport button",
          trigger: "Date is paused and Cupid has filed at least two reads (file date is enabled).",
          completesOn: "Clicking File date, or the Got it button.",
          target: "pulse-ring",
          placement: "top",
          ...tutorialCopy("lazy.cut-short"),
        },
        {
          id: "lazy.roster.swap-penalty",
          surface: "Case manager screen · header",
          trigger: "Player enters reselect mode via Manage cases.",
          completesOn: "The Got it button.",
          target: "spotlight",
          placement: "bottom",
          ...tutorialCopy("lazy.roster.swap-penalty"),
        },
        {
          id: "lazy.datebook.locked",
          surface: "Constellation lobby · ContextualPillRail Date Book pill",
          trigger: "Lobby is open while a pair is committed and the Date Book is not over budget.",
          completesOn: "The Got it button.",
          target: "coach-only",
          placement: "left",
          ...tutorialCopy("lazy.datebook.locked"),
        },
        {
          id: "lazy.datebook.repair",
          surface: "Constellation lobby · ContextualPillRail Date Book pill (amber)",
          trigger: "Budget cap shrinks below the current Date Book spend.",
          completesOn: "The Got it button.",
          target: "pulse-ring",
          placement: "left",
          ...tutorialCopy("lazy.datebook.repair"),
        },
        {
          id: "lazy.cooldown-block",
          surface: "Constellation lobby · LayerIndicator focus pill",
          trigger: "Lobby is open on the focus layer and a focused member is in cooldown.",
          completesOn: "The Got it button.",
          target: "pulse-ring",
          placement: "right",
          ...tutorialCopy("lazy.cooldown-block"),
        },
        {
          id: "lazy.closure-ready",
          surface: "Constellation lobby · CalloutCluster closures-ready callout",
          trigger: "A focused pair becomes ready to close.",
          completesOn: "The Got it button.",
          target: "coach-only",
          placement: "right",
          ...tutorialCopy("lazy.closure-ready"),
        },
        {
          id: "lazy.files.first-agreement",
          surface: "Pair memory inspector · sidebar",
          trigger: "Pair memory is open with at least one active agreement filed.",
          completesOn: "The Got it button.",
          target: "coach-only",
          placement: "left",
          ...tutorialCopy("lazy.files.first-agreement"),
        },
      ],
    },
  ];
}

export const sections: DocSectionEntry[] = [
  {
    id: "how-to-use",
    title: "How to use this page",
    body: (
      <>
        <P>
          Each phase below collects every coach mark the player can hit while they are in that
          phase, in the order they appear. Cards mirror the in-game paper-note look so it is easier
          to spot copy that runs long, repeats a phrase, or skips a beat.
        </P>
        <DocCallout variant="note" title="What is shown">
          <DocList
            items={[
              "Required-path steps appear in the order a player can hit them. Lazy support marks and file-first-open marks sit at the end because they fire only when a specific condition trips.",
              <span key="trigger">
                Each card lists its <Strong>trigger</Strong> (what makes it appear) and{" "}
                <Strong>completes on</Strong> (what marks it done). Action-completed steps do not
                use a primary button; informational ones use Got it.
              </span>,
              "Copy is rendered exactly as it ships. If a line reads awkwardly here, it will read awkwardly in the build.",
            ]}
          />
        </DocCallout>
        <DocCallout variant="warn" title="Keep this catalog in sync">
          <P>
            Any time you add, remove, rename, or rewrite a tutorial step, update this page in the
            same change. The catalog is what content reviewers iterate against. Drift here is a real
            bug.
          </P>
        </DocCallout>
      </>
    ),
  },
  ...FIRST_TIME_FLOW_SECTIONS.map<DocSectionEntry>((phase) => ({
    id: `phase-${phase.id}`,
    title: phase.title,
    body: <PhaseBody phaseId={phase.id} />,
  })),
];

export default function TutorialStepsProductDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}

function PhaseBody({ phaseId }: { phaseId: string }) {
  const phase = getFirstTimeFlow().find((candidate) => candidate.id === phaseId);
  if (!phase) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline gap-3">
        <Chip tone={phase.tone} dot>
          {phase.badge} · {phase.label}
        </Chip>
        <p className="font-serif text-label italic leading-snug text-aura-muted">{phase.caption}</p>
      </header>
      <ol className="flex flex-col gap-3">
        {phase.steps.map((step, stepIndex) => (
          <li key={step.id} className="flex flex-col gap-2">
            <div className="grid gap-3 md:grid-cols-[18rem_1fr]">
              <CoachMarkMeta step={step} ordinal={stepIndex + 1} tone={phase.tone} />
              <CoachMarkPaperNote step={step} />
            </div>
            {stepIndex < phase.steps.length - 1 ? <PhaseArrow tone={phase.tone} /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CoachMarkMeta({
  step,
  ordinal,
  tone,
}: {
  step: CoachMarkPreviewProps;
  ordinal: number;
  tone: ToneName;
}) {
  return (
    <aside className="flex flex-col gap-2 rounded-tile border border-aura-hairline bg-white/55 px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          step {ordinal.toString().padStart(2, "0")}
        </span>
        <TargetBadge target={step.target} tone={tone} />
      </div>
      <code className="break-all font-mono text-label leading-tight text-aura-ink">{step.id}</code>
      <p className="font-mono text-micro uppercase tracking-[0.16em] text-aura-muted">
        {step.surface}
      </p>
      <dl className="mt-1 flex flex-col gap-1.5 text-label leading-snug text-aura-ink/82">
        <MetaRow label="Trigger" value={step.trigger} />
        <MetaRow label="Completes on" value={step.completesOn} />
        <MetaRow label="Placement" value={`${step.placement} of target`} />
      </dl>
    </aside>
  );
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
        {label}
      </dt>
      <dd className="text-label leading-snug text-aura-ink/82">{value}</dd>
    </div>
  );
}

function TargetBadge({
  target,
  tone,
}: {
  target: CoachMarkPreviewProps["target"];
  tone: ToneName;
}) {
  if (target === "spotlight") {
    return <Chip tone={tone}>Spotlight</Chip>;
  }
  if (target === "pulse-ring") {
    return <Chip tone={tone}>Pulse ring</Chip>;
  }
  return <Chip tone="neutral">Coach only</Chip>;
}

function CoachMarkPaperNote({ step }: { step: CoachMarkPreviewProps }) {
  const showPortrait = step.portrait === "portrait";
  return (
    <div className="relative max-w-[28rem] rounded-card border border-white/90 bg-gradient-to-b from-white/95 to-rose-50/55 px-5 pb-4 pt-5 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.08),0_24px_56px_-28px_rgba(244,63,94,0.28)]">
      <PaperCorners />
      {showPortrait ? <PaperManagerPortrait /> : null}
      <header className={`min-w-0${showPortrait ? " pr-16" : ""}`}>
        <h3 className="font-display text-lead font-semibold leading-snug tracking-tight text-aura-ink">
          {step.title}
        </h3>
        <span
          aria-hidden
          className="mt-2 block h-px w-12 bg-gradient-to-r from-aura-rose/70 to-transparent"
        />
      </header>
      <p
        className={`mt-2.5 font-sans text-label leading-relaxed text-aura-muted${showPortrait ? " pr-16" : ""}`}
      >
        {step.body}
      </p>
      <footer className="mt-4 flex items-center gap-3">
        <span className="mr-auto inline-flex">
          {typeof step.stepIndex === "number" && typeof step.stepCount === "number" ? (
            <PaperProgressDots active={step.stepIndex} count={step.stepCount} />
          ) : null}
        </span>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          End tour
        </span>
        {step.primaryLabel ? (
          <span className="rounded-pill bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_55%,#831843_100%)] px-4 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white">
            {step.primaryLabel}
          </span>
        ) : null}
      </footer>
    </div>
  );
}

function PaperCorners() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-2 top-2 size-2.5 border-l border-t border-aura-ink/15" />
      <span className="absolute right-2 top-2 size-2.5 border-r border-t border-aura-ink/15" />
      <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-aura-ink/15" />
      <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-aura-ink/15" />
    </span>
  );
}

function PaperManagerPortrait() {
  return (
    <span aria-hidden className="pointer-events-none absolute -right-2 -top-9 z-10 block h-32 w-24">
      <img
        src={TUTORIAL_MANAGER_PORTRAIT_SRC}
        alt=""
        loading="lazy"
        className="block h-full w-full object-cover object-top drop-shadow-[0_8px_18px_rgba(131,24,67,0.28)]"
      />
    </span>
  );
}

function PaperProgressDots({ active, count }: { active: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className={`size-1.5 rounded-full ${
            index === active ? "bg-aura-rose" : "bg-aura-rose/25"
          }`}
        />
      ))}
    </span>
  );
}

function PhaseArrow({ tone }: { tone: ToneName }) {
  const arrowTone =
    tone === "slate" || tone === "neutral" ? "text-aura-faint" : "text-aura-rose/55";
  return (
    <div className="flex items-center gap-2 pl-6 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
      <span aria-hidden className={`text-display-xs leading-none ${arrowTone}`}>
        ↓
      </span>
      <span>then</span>
    </div>
  );
}
