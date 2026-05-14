import type { ReactNode } from "react";

import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocTable,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import {
  RoadmapAcceptance,
  RoadmapChecklist,
  RoadmapDecisionsLog,
  RoadmapFileRef,
  RoadmapPlanHeader,
} from "../../components/roadmap-primitives";
import {
  TutorialCoachMark,
  TutorialProgressDots,
  TutorialPulseRing,
  TutorialSpotlight,
  TutorialWelcomeModal,
} from "../../components/tutorial";
import type { RoadmapPlanMeta } from "../../services/roadmap-content";

export const meta: DocMeta = {
  slug: "roadmap/tutorial-system",
  group: "roadmap",
  title: "Tutorial system",
  description:
    "Layer guided onboarding over the existing Cupid surfaces. Components, copy, and a phased rollout that explains hidden systems without rewriting them.",
  order: 10,
};

export const plan: RoadmapPlanMeta = {
  status: "drafting",
  opened: "2026-05-14",
  touched: "2026-05-14",
  owner: "unassigned",
  tldr: "Scaffold a non-blocking tutorial layer that explains shifts, focus cases, the deck, the Judge, and follow-ups during a player's first session.",
  tasks: 15,
  done: 0,
  tags: ["onboarding", "ui", "copy"],
};

export const lede = (
  <>
    A first-time player meets four open case files, a draw of three scenarios, a six-turn judge
    cadence, three nudges, and a follow-up panel without anyone telling them what those things are.
    The tutorial layer is the smallest set of overlays and copy that closes that gap. It does not
    replace the systems. It points at them.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "plan",
    title: "Plan",
    body: (
      <>
        <RoadmapPlanHeader slug={meta.slug} plan={plan} />
        <P>
          Five phases, ordered by which gap hurts comprehension the most. Phase 1 is plumbing only.
          Phase 2 alone closes the largest comprehension gap and is shippable on its own.
        </P>
      </>
    ),
  },
  {
    id: "voice-and-tone",
    title: "Voice and tone",
    body: (
      <>
        <P>
          Tutorial copy uses the Cupid corporate register: confident, procedural, slightly absurd,
          treating supernatural mismatches as routine HR. Sentence case body, mono uppercase tracked
          eyebrows. Source canon lives in <DocLink to="/docs/product/voice">Voice and tone</DocLink>
          .
        </P>
        <DocCallout variant="note" title="Calibration anchors from the existing UI">
          <DocList
            items={[
              <em key="1">"Standard cosmic cleanup is on schedule."</em>,
              <em key="2">"Member Mood is below floor. Recommend Repair."</em>,
              <em key="3">"Match one ordinary human with one obviously non-human member."</em>,
              <em key="4">"Cupid keeps four open case files at a time."</em>,
              <em key="5">"desk dispatch // signed build"</em>,
            ]}
          />
        </DocCallout>
        <P>
          Banned in tutorial copy: em or en dashes, exclamation points, mascot energy,{" "}
          <DocCode>delve / leverage / unleash / elevate / robust / tapestry</DocCode>, hedging
          stacks, "not just X but also Y" constructions.
        </P>
        <P>
          In-fiction nouns, used exactly:{" "}
          <Strong>shift, case, member, focus, scenario, deck,</Strong>{" "}
          <Strong>
            judge, nudge, match fit, retention, agreement, open loop, closure, soft win,
          </Strong>{" "}
          <Strong>the room, the file</Strong>.
        </P>
      </>
    ),
  },
  {
    id: "first-run-map",
    title: "First-run journey and confusion map",
    body: (
      <>
        <P>
          Ten surfaces a brand-new player encounters in order. The right column marks where a
          tutorial fires. <Strong>Eager</Strong> means it fires when the surface mounts.{" "}
          <Strong>Lazy</Strong> waits for a trigger condition. The rest stay silent.
        </P>
        <DocTable
          headers={["#", "Surface", "Source", "Confusion risk", "Tutorial?"]}
          rows={[
            [
              "01",
              "Splash",
              <RoadmapFileRef key="f" path="app/components/splash-screen.tsx" />,
              "What is a shift? Why punch in?",
              "Soft, one welcome modal",
            ],
            [
              "02",
              "Onboarding pick four",
              <RoadmapFileRef key="f" path="app/components/onboarding-screen.tsx" />,
              "Why four? What does focus mean? Sealed reads.",
              "Eager, primary teaching moment",
            ],
            [
              "03",
              "Pre-date canvas",
              <RoadmapFileRef key="f" path="app/components/pre-date-canvas.tsx" />,
              "Three-step booking flow, match fit invisible.",
              "Eager, three coach marks",
            ],
            [
              "04",
              "Roster room",
              <RoadmapFileRef key="f" path="app/components/roster-canvas.tsx" />,
              "Swap penalty, retention, member status.",
              "Lazy on first swap attempt",
            ],
            [
              "05",
              "Date book",
              <RoadmapFileRef key="f" path="app/components/date-book-canvas.tsx" />,
              "Budget cap, discounts, add/drop gates.",
              "Eager, on first visit",
            ],
            [
              "06",
              "Date scene",
              <RoadmapFileRef key="f" path="app/components/dashboard-views.tsx" />,
              "Judge, six-turn cadence, nudges, autoplay, follow-up.",
              "Eager, five sequenced stops",
            ],
            [
              "07",
              "Shift report",
              <RoadmapFileRef key="f" path="app/components/dashboard-views.tsx" />,
              "Goals appear without justification.",
              "Lazy, first shift only",
            ],
            [
              "08",
              "Closure",
              <RoadmapFileRef key="f" path="app/components/pre-date-canvas.tsx" />,
              "Soft-win threshold, irreversibility.",
              "Lazy on first eligible closure",
            ],
            [
              "09",
              "Cooldown gate",
              "various",
              "Member shows as unavailable, no reason text.",
              "Lazy, first time it blocks an action",
            ],
            [
              "10",
              "Files / pair memory",
              <RoadmapFileRef key="f" path="app/components/pair-memory-inspector.tsx" />,
              "Agreements and open loops appear cold.",
              "Lazy on first pair with prior history",
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "tutorial-moments",
    title: "Tutorial moments and copy",
    body: (
      <>
        <P>
          Drafted copy for the eager beats. Lazy triggers get a single coach mark each, written
          during phase 5.
        </P>

        <CopyCard
          eyebrow="welcome // shift.00"
          title="Cupid is hiring. You are hired."
          body="One agent. One desk. Four cases at a time. The interdimensional dating pool does the rest."
          surface="TutorialWelcomeModal"
        />

        <CopyCard
          eyebrow="// step.01 // focus"
          title="Pick four cases to open"
          body="Each card is a member who walked into the office today. Pick four to focus. The rest of the roster waits in the hall. You can rotate later."
          surface="Coach mark on first member card"
        />

        <CopyCard
          eyebrow="// the deck"
          title="Three drawn. Twelve in the library."
          body="Each shift you draw three scenarios. Risk, Intimacy, Chaos. Swap a card from the library and it costs three shifts of bench time. Pick or pass."
          surface="Spotlight on a deck card, Date Book first visit"
        />

        <CopyCard
          eyebrow="// six and counting"
          title="Six turns, one snapshot"
          body="Every six turns the Judge files a quick read. Mood, signals, anything off-frame. These pile up until the wrap."
          surface="Coach mark anchored to the first judge snapshot"
        />

        <CopyCard
          eyebrow="// nudges // 03 left"
          title="One nudge, one whisper"
          body="Up to three nudges per date. Pick a member, write a sentence, send. They will hear it and act on it. Pick your moments."
          surface="Coach mark on the Intervene panel, first time it opens"
        />

        <CopyCard
          eyebrow="// wrap"
          title="File the wrap"
          body="Encourage if it landed. Cool down to protect retention. Repair on a breach. Mark Bad Fit if you are done with the pair."
          surface="Coach mark on the follow-up panel, end of first date"
        />
      </>
    ),
  },
  {
    id: "specimens",
    title: "Component specimens",
    body: (
      <>
        <P>
          Five live primitives, all under <DocCode>app/components/tutorial/</DocCode>. They ride the
          existing aura-glass surfaces, the rose / violet / amber accent tokens, and the{" "}
          <DocCode>aura-pulse</DocCode> and <DocCode>aura-dock-rise</DocCode> motion. No new global
          CSS.
        </P>

        <SpecimenWelcomeModal />
        <SpecimenSpotlightAndCoachMark />
        <SpecimenPulseRing />
        <SpecimenSequencedCoachMark />
        <SpecimenProgressDots />
      </>
    ),
  },
  {
    id: "state-and-persistence",
    title: "State and persistence",
    body: (
      <>
        <P>
          Add a small <DocCode>tutorial</DocCode> slice to the existing save schema. No new service.
          A single hook reads it.
        </P>
        <DocCodeBlock language="ts">{`type TutorialState = {
  enabled: boolean;
  completedSteps: ReadonlySet<TutorialStepId>;
  dismissedAt: number | null;
};

type TutorialStepId =
  | "welcome"
  | "onboarding.pick"
  | "onboarding.start"
  | "predate.focus-grid"
  | "predate.book-cta"
  | "predate.nav"
  | "datebook.deck"
  | "date.intro"
  | "date.judge-snapshot"
  | "date.intervene"
  | "date.autoplay"
  | "date.followup"
  | "shift-report.goals"
  | "closure.first"
  | "lazy.swap-penalty"
  | "lazy.cooldown-block"
  | "lazy.first-agreement";`}</DocCodeBlock>
        <DocList
          items={[
            <span key="hook">
              <DocCode>useTutorialStep(id)</DocCode> returns{" "}
              <DocCode>{`{ active, complete, dismiss }`}</DocCode>. Active is true only when{" "}
              <DocCode>enabled</DocCode>, the player is on the matching surface, and the step is not
              in <DocCode>completedSteps</DocCode>.
            </span>,
            <span key="opt">
              Surfaces opt in by mounting one of the tutorial primitives and passing the hook flags.
              No global controller. Each surface owns its own steps.
            </span>,
            <span key="reset">
              <Strong>Reset orientation</Strong> in <DocCode>SettingsMenu</DocCode> clears{" "}
              <DocCode>completedSteps</DocCode> and re-arms <DocCode>enabled</DocCode>.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "A new player who has never opened Cupid completes their first booked date without consulting docs.",
          "Tutorial state survives reload and Tauri relaunch through the existing repository write path.",
          "Reset orientation in settings re-arms every step. Skipping the welcome modal still completes the welcome step so it does not return.",
          "Tutorial copy passes a voice review against the anchors in section 2 and the rules in product/voice.",
          "vp check, vp test, vp build all green after every phase.",
        ]}
      />
    ),
  },
  {
    id: "checklist",
    title: "Checklist",
    body: (
      <RoadmapChecklist
        planSlug={meta.slug}
        status={plan.status}
        title="Phased rollout"
        tasks={[
          {
            id: "phase-1",
            label: "Phase 1: plumbing",
            detail: (
              <DocList
                tone="muted"
                items={[
                  <span key="schema">
                    Add <DocCode>tutorial</DocCode> field to the save schema with a migration that
                    seeds{" "}
                    <DocCode>{`{ enabled: true, completedSteps: new Set(), dismissedAt: null }`}</DocCode>{" "}
                    on existing saves.
                  </span>,
                  <span key="hook">
                    Implement <DocCode>useTutorialStep</DocCode> on the existing repository write
                    path. No surface opts in yet.
                  </span>,
                  <span key="settings">
                    Add a <Strong>Reset orientation</Strong> row to{" "}
                    <RoadmapFileRef path="app/components/settings-menu.tsx" />.
                  </span>,
                  <span key="verify">
                    Verify with <DocCode>vp check</DocCode> and a save round-trip test.
                  </span>,
                ]}
              />
            ),
            children: [
              { id: "p1-schema", label: "Save schema field plus migration" },
              { id: "p1-hook", label: "useTutorialStep hook" },
              { id: "p1-reset", label: "Reset orientation in SettingsMenu" },
            ],
          },
          {
            id: "phase-2",
            label: "Phase 2: welcome and onboarding",
            detail: (
              <P>
                Wire <DocCode>TutorialWelcomeModal</DocCode> into the splash flow before onboarding
                resolves. Wire two coach marks into{" "}
                <RoadmapFileRef path="app/components/onboarding-screen.tsx" />: one anchored to the
                first member card, one anchored to the start CTA after four are picked. This phase
                is shippable on its own.
              </P>
            ),
            children: [
              { id: "p2-welcome", label: "Welcome modal hook into splash" },
              { id: "p2-onboarding-pick", label: "Coach mark on first member card" },
              { id: "p2-onboarding-start", label: "Pulse ring + coach mark on start CTA" },
            ],
          },
          {
            id: "phase-3",
            label: "Phase 3: pre-date and date book",
            detail: (
              <P>
                Three sequenced coach marks on the Live Date room (focused grid, booking CTA, nav
                cluster) and one spotlight on the deck card on first Date Book visit.
              </P>
            ),
            children: [
              { id: "p3-predate", label: "Three-step pre-date sequence" },
              { id: "p3-deck", label: "Date book deck spotlight" },
            ],
          },
          {
            id: "phase-4",
            label: "Phase 4: date scene",
            detail: (
              <P>
                Five sequenced coach marks inside <DocCode>DateView</DocCode>, paced to natural date
                beats: enter, first judge snapshot, intervene panel, autoplay toggle, follow-up
                panel. Densest copy pass; pair with a designer review.
              </P>
            ),
            children: [
              { id: "p4-intro", label: "Date intro coach mark" },
              { id: "p4-snapshot", label: "Judge snapshot coach mark" },
              { id: "p4-intervene", label: "Intervene panel coach mark" },
              { id: "p4-autoplay", label: "Autoplay toggle coach mark" },
              { id: "p4-followup", label: "Follow-up panel coach mark" },
            ],
          },
          {
            id: "phase-5",
            label: "Phase 5: lazy triggers and editorial pass",
            detail: (
              <P>
                Swap penalty, cooldown block, first agreement, first closure, first shift report.
                Each fires once. Polish copy across all phases in one editorial pass against the
                voice anchors.
              </P>
            ),
            children: [
              { id: "p5-lazy", label: "All lazy triggers" },
              { id: "p5-edit", label: "Editorial pass on every step" },
              { id: "p5-verify", label: "vp check + vp test + vp build green" },
            ],
          },
        ]}
      />
    ),
  },
  {
    id: "decisions",
    title: "Decisions log",
    body: (
      <RoadmapDecisionsLog
        entries={[
          {
            date: "2026-05-14",
            title: "Surface-owned steps over a global tour engine",
            outcome: "accepted",
            body: (
              <P>
                Each surface mounts its own tutorial primitive and reads its own step from the hook.
                Avoids a single config file that has to know about every screen, which historically
                rots faster than the screens themselves.
              </P>
            ),
          },
          {
            date: "2026-05-14",
            title: "Keep the Judge unexplained beyond a system noun",
            outcome: "accepted",
            body: (
              <P>
                Considered a personified Judge intro card. Rejected. The Judge gets reverence by
                being unexplained. Tutorial copy treats it as a fact of the room.
              </P>
            ),
          },
          {
            date: "2026-05-14",
            title: "No collapsed or minimized coach mark state",
            outcome: "rejected",
            body: (
              <P>
                Considered a "minimize this step" affordance. Rejected: dismissal is final, and the
                Reset orientation row in settings is a one-click rearm. Adding a third state grows
                the surface for marginal value.
              </P>
            ),
          },
        ]}
      />
    ),
  },
  {
    id: "open-questions",
    title: "Open questions",
    body: (
      <DocList
        items={[
          "Should the welcome modal fire once per save, once per device, or once per install? Phase 1 ships per-save; revisit if Tauri sync lands.",
          "Do lazy triggers need a global cap, e.g. no more than two lazy marks per shift, to avoid stacked interruptions on a chaotic first session?",
          "If a step's anchor element is not on screen when its surface mounts, do we wait, scroll into view, or skip and complete? Default to skip-and-complete; revisit after phase 4.",
        ]}
      />
    ),
  },
];

/* ================================================================== */
/* Doc-local helpers                                                   */
/* ================================================================== */

function CopyCard({
  eyebrow,
  title,
  body,
  surface,
}: {
  eyebrow: string;
  title: string;
  body: string;
  surface: string;
}) {
  return (
    <article className="my-2 grid grid-cols-1 gap-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-rose-50/35 px-5 py-4 md:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          {eyebrow}
        </p>
        <h4 className="font-display text-lead font-semibold leading-snug text-aura-ink">{title}</h4>
        <p className="font-serif text-label italic leading-snug text-aura-muted">{body}</p>
      </div>
      <div className="flex items-end">
        <span className="inline-flex items-center rounded-pill border border-aura-hairline bg-white/70 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {surface}
        </span>
      </div>
    </article>
  );
}

function SpecimenStage({
  label,
  height = 360,
  background = "bg-gradient-to-br from-aura-mesh-rose/35 via-aura-paper to-aura-mesh-violet/35",
  children,
}: {
  label: string;
  height?: number;
  background?: string;
  children: ReactNode;
}) {
  return (
    <figure className="my-4 overflow-hidden rounded-card border border-aura-hairline bg-aura-paper shadow-[0_18px_48px_-32px_rgba(15,23,42,0.32)]">
      <figcaption className="flex items-center justify-between border-b border-aura-hairline bg-white/55 px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
        <span>// specimen · {label}</span>
        <span className="text-aura-faint">live preview</span>
      </figcaption>
      <div
        className={`relative isolate overflow-hidden ${background}`}
        style={{ height, transform: "translateZ(0)" }}
      >
        {children}
      </div>
    </figure>
  );
}

function MockTargetCard({
  rect,
  title,
  subtitle,
}: {
  rect: { top: number; left: number; width: number; height: number };
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="absolute aura-glass aura-glass-lift flex flex-col justify-between rounded-card p-4 shadow-card"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      <div className="flex flex-col gap-1">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // case file
        </p>
        <p className="font-display text-lead font-semibold leading-tight text-aura-ink">{title}</p>
        <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-aura-rose" />
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
          ready
        </span>
      </div>
    </div>
  );
}

function MockNavButton({
  rect,
  glyph,
}: {
  rect: { top: number; left: number; width: number; height: number };
  glyph: string;
}) {
  return (
    <div
      className="absolute aura-glass-lift grid place-items-center rounded-full font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose shadow-card"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,253,249,0.5) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.62)",
      }}
    >
      {glyph}
    </div>
  );
}

function noop() {
  /* no-op for previews */
}

function SpecimenWelcomeModal() {
  return (
    <SpecimenStage label="welcome modal" height={620} background="bg-aura-paper">
      <TutorialWelcomeModal
        agentCode="C-0014"
        shiftLabel="shift.00"
        title="Cupid is hiring. You are hired."
        hook="One agent. One desk. Four cases at a time. The interdimensional dating pool does the rest."
        beats={[
          {
            label: "the floor",
            copy: "Four open case files. Pick a member, book a date, file the wrap. Standard.",
          },
          {
            label: "the room",
            copy: "Members come in from anywhere. Some are obviously not human. None of that is your problem unless they make it your problem.",
          },
          {
            label: "the help",
            copy: "This orientation will tap you on the shoulder when something new shows up. You can skip it from settings any time.",
          },
        ]}
        onPrimary={noop}
        onSecondary={noop}
      />
    </SpecimenStage>
  );
}

function SpecimenSpotlightAndCoachMark() {
  const targetRect = { top: 80, left: 80, width: 220, height: 200 };
  return (
    <SpecimenStage label="spotlight + coach mark" height={400}>
      <MockTargetCard rect={targetRect} title="Vhool, R-7" subtitle="// liminal hospitality" />
      <TutorialSpotlight target={targetRect} />
      <TutorialCoachMark
        target={targetRect}
        placement="right"
        eyebrow="// step.01 // focus"
        title="Pick four cases to open"
        body="Each card is a member who walked into the office today. Pick four to focus. The rest of the roster waits in the hall. You can rotate later."
        primaryLabel="Got it"
        onPrimary={noop}
        dismissLabel="Skip tour"
        onDismiss={noop}
        width={320}
      />
    </SpecimenStage>
  );
}

function SpecimenPulseRing() {
  const buttonRect = { top: 240, left: 540, width: 56, height: 56 };
  const cardRect = { top: 80, left: 60, width: 360, height: 220 };
  return (
    <SpecimenStage label="pulse ring on chrome" height={360}>
      <MockTargetCard
        rect={cardRect}
        title="Live Date room"
        subtitle="// pre-date canvas · 03 / 04 cases focused"
      />
      <MockNavButton rect={buttonRect} glyph="❤" />
      <TutorialPulseRing target={buttonRect} padding={6} radius={28} tone="rose" />
      <div className="absolute right-6 top-6 max-w-[280px]">
        <div className="aura-glass rounded-chip px-3 py-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          // pulse ring points at always-visible chrome without darkening the canvas
        </div>
      </div>
    </SpecimenStage>
  );
}

function SpecimenSequencedCoachMark() {
  const targetRect = { top: 110, left: 100, width: 240, height: 180 };
  return (
    <SpecimenStage label="coach mark with progress dots" height={400}>
      <MockTargetCard
        rect={targetRect}
        title="The Whaler, R-13"
        subtitle="// long-haul melancholic"
      />
      <TutorialCoachMark
        target={targetRect}
        placement="right"
        eyebrow="// step.02 // begin"
        title="Six turns, one snapshot"
        body="Every six turns the Judge files a quick read. Mood, signals, anything off-frame. These pile up until the wrap."
        stepIndex={1}
        stepCount={4}
        secondaryLabel="Back"
        onSecondary={noop}
        primaryLabel="Next"
        onPrimary={noop}
        dismissLabel="Skip tour"
        onDismiss={noop}
        width={340}
      />
    </SpecimenStage>
  );
}

function SpecimenProgressDots() {
  return (
    <figure className="my-4 overflow-hidden rounded-card border border-aura-hairline bg-aura-paper shadow-[0_18px_48px_-32px_rgba(15,23,42,0.32)]">
      <figcaption className="flex items-center justify-between border-b border-aura-hairline bg-white/55 px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
        <span>// specimen · progress dots</span>
        <span className="text-aura-faint">inline</span>
      </figcaption>
      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="aura-glass flex items-center justify-between rounded-chip px-4 py-3">
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            opening of a four-step sequence
          </span>
          <TutorialProgressDots count={4} active={0} />
        </div>
        <div className="aura-glass flex items-center justify-between rounded-chip px-4 py-3">
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            mid-sequence
          </span>
          <TutorialProgressDots count={4} active={2} />
        </div>
        <div className="aura-glass flex items-center justify-between rounded-chip px-4 py-3">
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            jumpable variant for replay
          </span>
          <TutorialProgressDots count={6} active={3} onSelect={noop} />
        </div>
      </div>
    </figure>
  );
}

export default function TutorialSystemDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
