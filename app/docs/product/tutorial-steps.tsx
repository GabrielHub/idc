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

const FOCUS_SWAP_RETENTION_PENALTY = 25;

const FIRST_TIME_FLOW: FlowPhase[] = [
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
        title: "Cupid is hiring. You are hired.",
        body: "These are members who walked into the office today. Pick four to focus. The rest of the roster waits in the hall, technically supervised.",
      },
      {
        id: "onboarding.focus.expand",
        surface: "Onboarding · focus picker",
        trigger: "After the first pick, while fewer than four cases are focused.",
        completesOn: "Opening a member file from the card arrow.",
        target: "pulse-ring",
        placement: "right",
        title: "Read the file",
        body: "Tap a card's arrow to open that member's file. Useful for sizing up a case before you commit.",
      },
      {
        id: "onboarding.focus.start",
        surface: "Onboarding · focus picker · advance CTA",
        trigger: "All four focus cases selected.",
        completesOn: "Clicking Build the date book.",
        target: "pulse-ring",
        placement: "top",
        title: "Build the Date Book",
        body: "Four cases on file. Next, draft the Date Book. Six to twelve rooms, under budget. Cupid will draw a hand from this pool every time you commit a pair.",
      },
    ],
  },
  {
    id: "deck",
    label: "Drafting the Date Book",
    badge: "02",
    tone: "violet",
    caption:
      "Onboarding · deck stage. The player learns the pool versus hand distinction and the budget cap.",
    steps: [
      {
        id: "onboarding.deck.pick",
        surface: "Onboarding · scenario grid",
        trigger: "Deck is empty.",
        completesOn: "Tapping any scenario tile to add it.",
        target: "spotlight",
        placement: "left",
        title: "Build the Date Book",
        body: "This is the pool Cupid draws from. Pick six to twelve rooms and stay under budget. The hand comes later, after you commit two members.",
      },
      {
        id: "onboarding.deck.expand",
        surface: "Onboarding · scenario grid",
        trigger: "After the first scenario is added, while the deck is not yet legal.",
        completesOn: "Opening a room brief from the card arrow.",
        target: "pulse-ring",
        placement: "right",
        title: "Scout the room",
        body: "Tap a card's arrow to open the room brief. Useful for sizing up vibe and rules before you spend on it.",
      },
      {
        id: "onboarding.deck.start",
        surface: "Onboarding · scenario grid · start CTA",
        trigger: "Deck size and budget both satisfy the cap.",
        completesOn: "Clicking Start the shift, which also confirms onboarding.",
        target: "pulse-ring",
        placement: "top",
        title: "Start the shift",
        body: "Deck is legal. Start the shift and Cupid opens Live Date. You will pick one focus case, one different partner, then commit. Three scenarios get drawn from this pool.",
        primaryLabel: "Start the shift",
      },
    ],
  },
  {
    id: "booking",
    label: "Booking the pair",
    badge: "03",
    tone: "fuchsia",
    caption:
      "Pre-date canvas. The three-dot spine teaches the booking workflow, then two follow-up marks cover scenario draw and Begin.",
    steps: [
      {
        id: "planning.focus",
        surface: "Pre-date canvas · focus column",
        trigger: "Pre-date is open with no committed pair.",
        completesOn: "Tapping any focus card (including the auto-opened one).",
        target: "coach-only",
        placement: "right",
        title: "Pick a focus case",
        body: "Tonight runs on one focus case and one different partner. Tap the case Cupid opened to confirm it, or pick another from your four.",
        stepIndex: 0,
        stepCount: 3,
      },
      {
        id: "planning.partner",
        surface: "Pre-date canvas · partner column",
        trigger: "After planning.focus completes.",
        completesOn: "Tapping any candidate partner card.",
        target: "spotlight",
        placement: "right",
        title: "Pick one partner",
        body: "Tonight needs two different members. Tap a partner card to lock the choice. Cupid may recommend one, and you may overrule the machine.",
        stepIndex: 1,
        stepCount: 3,
      },
      {
        id: "planning.commit",
        surface: "Pre-date canvas · Commit CTA",
        trigger: "After planning.partner completes.",
        completesOn: "Clicking Commit.",
        target: "pulse-ring",
        placement: "top",
        title: "Commit the pair",
        body: "Commit locks the two members, reserves this shift's date, snapshots the Date Book, and draws three scenario cards. Procurement hates surprises.",
        stepIndex: 2,
        stepCount: 3,
      },
      {
        id: "planning.scenario",
        surface: "Pre-date canvas · drawn scenarios",
        trigger: "Pair is committed and three scenarios are on the table.",
        completesOn: "Selecting a scenario card.",
        target: "spotlight",
        placement: "top",
        title: "Pick one room",
        body: "These three came from your Date Book. Room Read is a warning, not a verdict. The Judge still waits for transcript evidence.",
      },
      {
        id: "planning.begin",
        surface: "Pre-date canvas · Begin CTA",
        trigger: "A scenario is selected and the pair is committed.",
        completesOn: "Clicking Begin, which also opens the date.",
        target: "pulse-ring",
        placement: "top",
        title: "Begin the date",
        body: "Cupid opens the room. Once the date starts, the deck is locked and the pair stays committed until the file resolves.",
        primaryLabel: "Begin",
      },
    ],
  },
  {
    id: "live",
    label: "Running the date",
    badge: "04",
    tone: "amber",
    caption:
      "Live date dashboard. The footer teaches the gauges and transport, then the player drafts scenes, sees the first Judge note, and learns nudges.",
    steps: [
      {
        id: "date.draft-events",
        surface: "Live date · scene draft column",
        trigger: "The date opens in drafting mode and the player has not picked three scenes.",
        completesOn:
          "Tapping any scene card to add it to picks. Auto-skips if playback leaves drafting first.",
        target: "spotlight",
        placement: "right",
        title: "Draft three scenes",
        body: "Two ambient, two provocations, two reveals. Pick three to drop into the date when you pause. Cupid never auto-fires them.",
      },
      {
        id: "date.footer.health",
        surface: "Live date · footer gauges",
        trigger: "Date is live and the gauges are mounted.",
        completesOn: "The Got it button.",
        target: "spotlight",
        placement: "top",
        title: "Health, Turn, Judge, Nudges",
        body: "Health is the date. Turn counts toward the wrap. Judge fires every sixth. Nudges are your three whispers. Scenes appear once you draft them.",
        primaryLabel: "Got it",
        stepIndex: 0,
        stepCount: 2,
      },
      {
        id: "date.footer.transport",
        surface: "Live date · transport controls",
        trigger: "After date.footer.health completes, while not streaming.",
        completesOn: "Pressing play or advancing a beat.",
        target: "pulse-ring",
        placement: "top",
        title: "Run the date",
        body: "Tap play for autoplay, or advance one beat at a time. Pause whenever you want to whisper a nudge or drop a scene. Space toggles play.",
        stepIndex: 1,
        stepCount: 2,
      },
      {
        id: "date.judge-note",
        surface: "Live date · first Judge snapshot",
        trigger: "The first Judge snapshot has been written.",
        completesOn: "The Got it button.",
        target: "spotlight",
        placement: "top",
        title: "Six turns, one snapshot",
        body: "The Judge reads every sixth turn and at the wrap. Health changes here, not in the booking room. Evidence first. Paperwork second.",
        primaryLabel: "Got it",
      },
      {
        id: "date.nudge.compose",
        surface: "Live date · nudge button",
        trigger: "Footer steps done, nudge button enabled, no nudges used yet.",
        completesOn: "Clicking Open composer, which also opens the nudge modal.",
        target: "pulse-ring",
        placement: "top",
        title: "One nudge, one whisper",
        body: "Pause the date, pick one member, write one sentence. They hear it as a private prod from the room. Use all three and Cupid starts making eye contact.",
        primaryLabel: "Open composer",
      },
    ],
  },
  {
    id: "wrap",
    label: "Wrapping the shift",
    badge: "05",
    tone: "emerald",
    caption:
      "After the date resolves the player files a follow-up, then files the shift back on Pre-date.",
    steps: [
      {
        id: "date.followup",
        surface: "Live date · final report footer",
        trigger: "Final report is rendered with follow-up actions available.",
        completesOn: "Picking a follow-up action.",
        target: "spotlight",
        placement: "top",
        title: "File one follow-up",
        body: "Encourage if the file is warm. Cool Down if the room ran hot. Repair after a breach. Mark Bad Fit when the pair needs professional distance.",
      },
      {
        id: "planning.file-shift",
        surface: "Pre-date canvas · File the shift CTA",
        trigger: "Date is settled and the shift is filable.",
        completesOn: "Clicking File the shift.",
        target: "pulse-ring",
        placement: "bottom",
        title: "File the shift",
        body: "One shift, one date. File it when the date is settled. Cupid will score goals, rotate pressure, and pretend this was a normal evening.",
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
        title: "Files start mostly sealed",
        body: "Public profile is what they wrote. Everything else unseals over time as Cupid files reads from dates you run.",
        primaryLabel: "Got it",
      },
      {
        id: "scenario.file.first-open",
        surface: "Scenario details modal · brief section",
        trigger: "First time any scenario modal is opened on a save.",
        completesOn: "The Got it button.",
        target: "coach-only",
        placement: "top",
        title: "Read the room before you book it",
        body: "Every scenario brief lays out the premise, the rules of the room, and what the judge will reward or punish. Skim it so Cupid can match members to the right vibe.",
        primaryLabel: "Got it",
      },
    ],
  },
  {
    id: "lazy",
    label: "Lazy support marks",
    badge: "07",
    tone: "slate",
    caption:
      "These never fire on the required path. They wait for an edge case (a swap, a budget cut, a cooldown, a closure) and explain it once.",
    steps: [
      {
        id: "lazy.roster.swap-penalty",
        surface: "Roster canvas · header",
        trigger: "Player initiates a focus-case swap draft.",
        completesOn: "The Got it button.",
        target: "coach-only",
        placement: "bottom",
        title: "Swapping costs retention",
        body: `Dropping a focused case costs ${FOCUS_SWAP_RETENTION_PENALTY} retention on that file. Lifelong customer relationships, but also paperwork. Pick the next member to seal the swap.`,
        primaryLabel: "Got it",
      },
      {
        id: "lazy.datebook.locked",
        surface: "Date Book canvas · header",
        trigger: "Date Book is opened while a pair is committed and the deck is not over budget.",
        completesOn: "The Got it button.",
        target: "coach-only",
        placement: "bottom",
        title: "Date Book is locked",
        body: "A pair is committed, so the deck is frozen until the date resolves. Cancel the booking from Live Date to edit, or finish the date first.",
        primaryLabel: "Got it",
      },
      {
        id: "lazy.datebook.repair",
        surface: "Date Book canvas · header",
        trigger: "Budget cap shrinks below the current deck spend.",
        completesOn: "The Got it button.",
        target: "coach-only",
        placement: "bottom",
        title: "The Date Book is over budget",
        body: "A budget cut put the deck above the cap. Drop cards from the deck below until the cap covers the spend. Cupid can not commit a new pair until the file is clean.",
        primaryLabel: "Got it",
      },
      {
        id: "lazy.cooldown-block",
        surface: "Pre-date canvas · focus column",
        trigger: "Pre-date is open and a focused member is in cooldown.",
        completesOn: "The Got it button.",
        target: "coach-only",
        placement: "right",
        title: "One of these is in cooldown",
        body: "A focus card greys out when the member needs space after their last date. Cooldowns end on the next shift. The roster shows their status.",
        primaryLabel: "Got it",
      },
      {
        id: "lazy.closure-ready",
        surface: "Pre-date canvas · closure callout",
        trigger: "A focused pair becomes ready to close.",
        completesOn: "The Got it button.",
        target: "coach-only",
        placement: "bottom",
        title: "Closure is permanent",
        body: "A pair is ready to delete the app. Close their case to free two focus slots, raise the client cap by one, and file a permanent pair memory. There is no rebooking after closure.",
        primaryLabel: "Got it",
      },
      {
        id: "lazy.files.first-agreement",
        surface: "Pair memory inspector · sidebar",
        trigger: "Pair memory is open with at least one active agreement filed.",
        completesOn: "The Got it button.",
        target: "coach-only",
        placement: "left",
        title: "Agreements and open loops",
        body: "The Judge files an agreement when a pair settles on something. Open loops are the questions they left dangling. Both follow this pair from date to date and shape the next room read.",
        primaryLabel: "Got it",
      },
    ],
  },
];

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
  ...FIRST_TIME_FLOW.map<DocSectionEntry>((phase) => ({
    id: `phase-${phase.id}`,
    title: `${phase.badge} · ${phase.label}`,
    body: <PhaseBody phase={phase} />,
  })),
];

export default function TutorialStepsProductDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}

function PhaseBody({ phase }: { phase: FlowPhase }) {
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
          Skip tour
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
