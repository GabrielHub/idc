import {
  DocCallout,
  DocCode,
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
  type RoadmapTaskItem,
} from "../../components/roadmap-primitives";
import type { RoadmapPlanMeta } from "../../services/roadmap-content";

export const meta: DocMeta = {
  slug: "roadmap/surface-gameplay-feedback",
  group: "roadmap",
  title: "Surface gameplay feedback on the pair board",
  description:
    "Expose mood, patience, closure progress, churn risk, and post-date stat deltas through existing constellation surfaces so the player can read the campaign at a glance.",
  order: 10,
};

export const plan: RoadmapPlanMeta = {
  status: "review",
  opened: "2026-05-26",
  touched: "2026-05-26",
  owner: "unassigned",
  tldr: "Surface the already-modeled member mood, retention, burnout, and pair closure progress through the constellation lobby, edge tooltips, hover detail card, dossier, callouts, and final report — without adding new HUD panels.",
  tasks: 21,
  done: 18,
  tags: ["ui", "gameplay", "feedback-surfaces", "lobby", "post-date"],
};

const checklist: RoadmapTaskItem[] = [
  {
    id: "tooltip-primitive",
    defaultDone: true,
    label:
      "Add a small Aura-flavored Tooltip primitive (frosted hairline border, 14px floor, max-w-xs, hover + focus-visible triggers).",
    detail: (
      <>
        New file <RoadmapFileRef path="app/components/aura-tooltip.tsx" />. Wrap a target with{" "}
        <DocCode>{`<AuraTooltip label={...}>`}</DocCode>; emits a positioned bubble with{" "}
        <DocCode>aura-liquid-glass</DocCode> surface. Plain content only (no rich JSX). Used as the
        longer-copy carrier referenced by every later task. Position via fixed-offset against the
        trigger, no floating-ui dependency.
      </>
    ),
  },
  {
    id: "delta-receipt",
    defaultDone: true,
    label:
      "Capture pair-stat and member-mood deltas in the post-date impact pipeline and thread them into the final report.",
    detail: (
      <>
        Today the deltas live per-turn in judge snapshots (
        <RoadmapFileRef path="app/domain/game.ts" line={665} />) but are not aggregated for player
        display. Extend <RoadmapFileRef path="app/services/date-engine.ts" line={2641} /> to
        snapshot <DocCode>{`{ chemistry, trust, relationshipHealth, strain, conflict }`}</DocCode>{" "}
        and <DocCode>{`memberMood, retention, burnout`}</DocCode> before applying the final outcome,
        and emit a <DocCode>DateStatChange</DocCode> object on the report (or sibling receipt).
        Consume it in <RoadmapFileRef path="app/services/date-impact.ts" line={54} /> so the impact
        receipt carries delta tuples the UI can render.
      </>
    ),
  },
  {
    id: "risk-zone-helper",
    defaultDone: true,
    label:
      "Add a pure helper that derives a member's risk zone (steady / cooling / at-risk) from retention.",
    detail: (
      <>
        New helper in <RoadmapFileRef path="app/services/member-feedback.ts" />. Bands:{" "}
        <DocCode>retention {">="} 60</DocCode> → steady,{" "}
        <DocCode>
          25 {"<="} retention {"<"} 60
        </DocCode>{" "}
        → cooling, <DocCode>retention {"<"} 25</DocCode> → at-risk (aligns with{" "}
        <DocCode>MEMBER_RETENTION_WARNING_THRESHOLD</DocCode> in{" "}
        <RoadmapFileRef path="app/domain/game.ts" />
        ). Return tone token, label, and a short rationale string for the tooltip.
      </>
    ),
  },
  {
    id: "closure-progress-helper",
    defaultDone: true,
    label:
      "Add a helper that returns 0–100 closure progress and per-axis distance from threshold for a pair.",
    detail: (
      <>
        Co-locate with the risk-zone helper. Reads pair stats and thresholds from{" "}
        <RoadmapFileRef path="app/services/closures.ts" line={24} />. Returns:{" "}
        <DocCode>{`{ overall: 0–100, axes: { chem, trust, health, strain, conflict, dates }, blockers: string[] }`}</DocCode>
        . <DocCode>overall</DocCode> = min of the per-axis ratios so the most-blocking axis governs
        the bar; <DocCode>blockers</DocCode> lists the axes still under threshold so the tooltip can
        explain. Add a vitest for the helper.
      </>
    ),
  },
  {
    id: "halo-risk-zone",
    defaultDone: true,
    label:
      "Tint the member star's outer halo by risk zone so frustration and quit-risk become visible on the canvas.",
    detail: (
      <>
        Extend{" "}
        <RoadmapFileRef path="app/components/constellation-lobby/star-sprite.tsx" line={139} /> so{" "}
        <DocCode>haloColorForStar</DocCode> accepts a risk zone and blends rose for at-risk, amber
        for cooling, with steady falling back to the existing role tint. Add a subtle pulse only at
        at-risk (gated by reduced-motion). Closed/quit overlays already exist — leave them intact.
      </>
    ),
  },
  {
    id: "hover-chip",
    label:
      "On member hover, show a single small chip near the star with the risk-zone label and lead-ask pip.",
    detail: (
      <>
        Mounted as a 3D <DocCode>drei:Html</DocCode> anchor adjacent to the star (same pattern as{" "}
        <RoadmapFileRef path="app/components/constellation-lobby/archive-edge-tooltip.tsx" />
        ). Content: tone-coloured label (Steady / Cooling off / At risk) + an optional check / X pip
        if the member is this shift's lead ask. Click-through is preserved. Hover only — no click
        handler. The chip uses the AuraTooltip primitive for the longer rationale.
      </>
    ),
  },
  {
    id: "detail-card-bars",
    defaultDone: true,
    label: "Add mood and patience micro-bars (and a burnout pip) to the HoverDetailCard.",
    detail: (
      <>
        Edit <RoadmapFileRef path="app/components/constellation-lobby/hover-detail-card.tsx" />.
        Three narrow bars stacked under the status badge: mood, retention (color-coded by risk
        zone), burnout. Each bar carries an AuraTooltip explaining what the axis means and how
        bookings move it. Bars are 4px tall, fixed width — they sit in already-used header space, no
        card resize.
      </>
    ),
  },
  {
    id: "detail-card-loops",
    label:
      "Show open loops and unmet asks for the focused member in HoverDetailCard, capped at two each.",
    detail: (
      <>
        Already in{" "}
        <RoadmapFileRef path="app/components/constellation-lobby/pair-dossier-shard.tsx" /> for
        pairs — port the same list shape into the single-member card so the player sees the member's
        outstanding asks without leaving the canvas. Tooltip on each row carries the full unscrubbed
        ask copy.
      </>
    ),
  },
  {
    id: "edge-thickness-progress",
    defaultDone: true,
    label:
      "Scale pair-edge thickness with closure progress while keeping the existing health-tint colour.",
    detail: (
      <>
        Edit{" "}
        <RoadmapFileRef path="app/components/constellation-lobby/pair-edge-mesh.tsx" line={192} />.
        Width multiplier = <DocCode>0.6 + 0.6 * closureProgress</DocCode> so even brand-new pairs
        get a visible line. LOD-driven width remains a separate factor. Add a closure-ready glow
        only when <DocCode>readyToClose</DocCode> is already true.
      </>
    ),
  },
  {
    id: "edge-tooltip-extension",
    defaultDone: true,
    label:
      "Extend the archive edge-hover tooltip with three stat lines, one delta line, and a trajectory line.",
    detail: (
      <>
        Edit <RoadmapFileRef path="app/components/constellation-lobby/archive-edge-tooltip.tsx" />.
        Add rows: <DocCode>{`Chem 73 / 75 · Trust 71 / 75 · Health 78 / 75`}</DocCode> (color the
        still-blocking axis), <DocCode>{`Last date: +5 chem · +3 trust · −2 strain`}</DocCode>{" "}
        (suppress when no prior date), and <DocCode>{`On track: ~2 dates to closure`}</DocCode> when
        the trajectory helper has data. Each row stays one line; the long-copy rationale rides in an
        AuraTooltip attached to the row's left dot.
      </>
    ),
  },
  {
    id: "dossier-progress-strip",
    defaultDone: true,
    label:
      "Replace the dossier's bare dates-completed integer with a compact closure progress strip.",
    detail: (
      <>
        Edit{" "}
        <RoadmapFileRef
          path="app/components/constellation-lobby/pair-dossier-shard.tsx"
          line={94}
        />
        . Strip shows: dates completed badge, overall closure %, and three small dots (chem / trust
        / health) that fill as each axis crosses 75. Each dot has an AuraTooltip describing the
        threshold gap. Open loops and agreements stay where they are.
      </>
    ),
  },
  {
    id: "callout-cases-at-risk",
    defaultDone: true,
    label:
      "Add a 'cases at risk' chip to the bottom-left CalloutCluster, with a click-through to the at-risk list.",
    detail: (
      <>
        Edit{" "}
        <RoadmapFileRef path="app/components/constellation-lobby/lobby-hud-layer.tsx" line={147} />.
        New callout when any active member is in the at-risk zone:{" "}
        <DocCode>{`2 cases at risk`}</DocCode>. AuraTooltip on hover explains the mechanic
        (retention falling toward zero, what feeds it). Click opens a lightweight overlay listing
        the members with their risk rationale — reuse the existing modal pattern, do not invent a
        new dialog.
      </>
    ),
  },
  {
    id: "final-report-stat-deltas",
    defaultDone: true,
    label: "Add a stat-delta line to the post-date final report footer.",
    detail: (
      <>
        Edit <RoadmapFileRef path="app/components/date-view-final-report.tsx" line={252} /> to
        consume the new <DocCode>DateStatChange</DocCode> from the impact receipt. Single line:{" "}
        <DocCode>{`Chem 68 → 73 · Trust 71 → 74 · Health 72 → 75`}</DocCode>. Render trailing arrows
        in tone colour (emerald / rose / muted). AuraTooltip on the line carries the full numeric
        deltas and per-axis explanation.
      </>
    ),
  },
  {
    id: "final-report-mood-row",
    defaultDone: true,
    label:
      "Add a per-member mood / retention delta row to the final report, with retention warning when crossing the threshold.",
    detail: (
      <>
        Same component. For each member on the pair, render one row:{" "}
        <DocCode>{`Alex — mood −7 · confidence −14`}</DocCode>. If retention crossed below 25 this
        date, prepend an at-risk tone badge. AuraTooltip on the badge explains what the warning
        means and how to recover (cover the lead ask, swap less, book matches with healthy pair
        stats).
      </>
    ),
  },
  {
    id: "final-report-tooltips",
    defaultDone: true,
    label:
      "Add AuraTooltip to existing verdict pill and consequence bullets so the player can drill into the verdict reason.",
    detail: (
      <>
        Same component. The verdict pill currently shows{" "}
        <DocCode>{`Closure gained ground`}</DocCode> with no further explanation. Tooltip carries
        the reason string already built by{" "}
        <RoadmapFileRef path="app/services/date-impact.ts" line={123} />. Each consequence bullet
        gets a tooltip with its source axis or rule.
      </>
    ),
  },
  {
    id: "manager-warning-surface",
    defaultDone: true,
    label:
      "Persist the retention-warning quip on a member card badge instead of relying on transient quip text.",
    detail: (
      <>
        Today the retention warning at{" "}
        <RoadmapFileRef path="app/fixtures/manager-quips.ts" line={28} /> fires once and vanishes.
        Keep the quip text but also pin a small at-risk badge on the member card (
        <RoadmapFileRef path="app/components/member-card.tsx" />) for any active member in the
        at-risk zone. AuraTooltip on the badge surfaces the most recent quip copy.
      </>
    ),
  },
  {
    id: "data-wiring-from-canonical",
    defaultDone: true,
    label:
      "Wire the lobby props pipeline so risk zone, closure progress, and last-date deltas flow from save state to surfaces.",
    detail: (
      <>
        Find the props builder feeding{" "}
        <RoadmapFileRef path="app/components/constellation-lobby/index.tsx" />. Add the three
        derived feeds keyed by member id and pair id. Keep computation deterministic — pure helpers
        only, no side effects in the builder.
      </>
    ),
  },
  {
    id: "service-tests",
    defaultDone: true,
    label: "Add unit tests for the risk-zone, closure-progress, and stat-delta helpers.",
    detail: (
      <>
        Tests in <RoadmapFileRef path="app/services/member-feedback.test.ts" /> and a delta test
        appended to <RoadmapFileRef path="app/services/date-engine-member-state.test.ts" />. Cover:
        (a) threshold edges, (b) at-risk → quit transition still triggers, (c) closure progress at
        ready / blocked / new-pair, (d) deltas match before/after snapshot.
      </>
    ),
  },
  {
    id: "browser-verification",
    label: "Drive the lobby in browser at 1920x1080 and verify each surface fires.",
    detail: (
      <>
        Per <RoadmapFileRef path="CLAUDE.md" /> the dev server is assumed running at{" "}
        <DocCode>http://localhost:5173/</DocCode>. Hover a star → chip appears with risk zone. Click
        a star → detail card shows mood / retention / burnout bars. Hover an edge → tooltip shows
        three stat lines and (if applicable) deltas + trajectory. Open the dossier → closure strip
        renders. Confirm the at-risk callout appears in fixture scenarios that include a member with
        retention {"<"} 25.
      </>
    ),
  },
  {
    id: "vp-check",
    defaultDone: true,
    label: "Run vp check and resolve all lint / type / format issues.",
  },
  {
    id: "vp-test-build",
    defaultDone: true,
    label: "Run vp test and vp build, fix any failures.",
  },
];

export const lede = (
  <>
    The campaign is silent: members can slide toward quitting without any visible warning, closure
    thresholds are invisible, post-date deltas are not shown, and goals only render inside a
    collapsible dock. The internal models exist — this plan surfaces them through the existing
    constellation lobby without adding new HUD panels.
  </>
);

const surfaceRows: Array<Array<string>> = [
  ["Member halo (star)", "Risk zone (steady / cooling / at-risk)", "T1 #1 mood/patience"],
  ["Member hover chip", "Risk label + lead-ask pip", "T1 #1 + T2 #7"],
  [
    "Member detail card",
    "Mood / retention / burnout bars + open loops + unmet asks",
    "T1 #1 + T2 #6",
  ],
  ["Edge thickness", "Closure progress (still health-coloured)", "T1 #2"],
  ["Edge hover tooltip", "Stat lines + last-date delta + trajectory", "T1 #2 + T1 #3 + T3 #8"],
  ["Pair dossier strip", "Closure axes (chem / trust / health) + dates", "T1 #2"],
  ["Bottom-left callout", "'Cases at risk: N' chip + click-through list", "T1 #4"],
  ["Final report stat row", "Pair stats before → after", "T1 #3"],
  ["Final report mood row", "Per-member mood / retention delta + at-risk badge", "T1 #1 + T1 #3"],
  ["Verdict pill / bullets", "AuraTooltip carries verdict reason and rule source", "T2 #7"],
];

export const sections: DocSectionEntry[] = [
  {
    id: "header",
    title: "Header",
    body: <RoadmapPlanHeader slug={meta.slug} plan={plan} />,
  },
  {
    id: "context",
    title: "Context",
    body: (
      <>
        <P>
          The player has reported that the biggest issue with the game is not knowing how they are
          doing after dates, which members are moving toward closure, which are moving toward
          quitting, and what they are supposed to do. Investigation confirms the issue is{" "}
          <Strong>surfacing, not modelling</Strong>.
        </P>
        <DocList
          items={[
            <span key="mood">
              Per-member mood, retention, burnout, and openness are all canonical 0–100 fields on{" "}
              <DocCode>memberStateSchema</DocCode> at{" "}
              <RoadmapFileRef path="app/domain/game.ts" line={152} />.
            </span>,
            <span key="quit">
              The quit trigger is deterministic: <DocCode>retention === 0</DocCode> flips{" "}
              <DocCode>status</DocCode> to <DocCode>quit</DocCode> at{" "}
              <RoadmapFileRef path="app/services/date-engine.ts" line={2828} />.
            </span>,
            <span key="warn">
              A retention-warning threshold of 25 exists at{" "}
              <RoadmapFileRef path="app/fixtures/manager-quips.ts" line={28} /> but fires only as a
              transient manager quip.
            </span>,
            <span key="deltas">
              Per-turn judge snapshots already carry <DocCode>memberMoodDeltas</DocCode>,{" "}
              <DocCode>statDeltas</DocCode>, and <DocCode>dateHealthDelta</DocCode> at{" "}
              <RoadmapFileRef path="app/domain/game.ts" line={665} /> — the deltas are simply not
              aggregated into the player-facing report.
            </span>,
            <span key="closure">
              Closure thresholds live as hard numbers in{" "}
              <RoadmapFileRef path="app/services/closures.ts" line={24} /> (chem 75, trust 75,
              health 75, strain ≤ 30, conflict ≤ 30, ≥ 3 dates) — never displayed.
            </span>,
            <span key="invisible">
              The player has never seen a quit because penalties starting from 100 require several
              rough dates to flatline, and nothing in the UI signals the decline as it happens.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "scope",
    title: "Scope",
    body: (
      <>
        <Strong>In scope</Strong>
        <DocList
          items={[
            "Mood, retention, and burnout visibility through the existing constellation halo + detail card.",
            "Closure progress visibility through existing edges, dossier, and edge tooltip.",
            "Post-date pair-stat deltas and per-member mood/retention deltas in the final report.",
            "At-risk callout chip + per-card at-risk badge.",
            "Lead-ask coverage pip on hover.",
            "A lightweight Aura-flavoured Tooltip primitive used wherever longer copy is needed.",
            "Deterministic helper functions for risk zone, closure progress, and stat deltas.",
          ]}
        />
        <Strong>Out of scope</Strong>
        <DocList
          items={[
            "Adjusting the LLM judge's bias toward bad outcomes. If the judge under-fires bad verdicts, that is a separate prompt-tuning pass.",
            "Adding new HUD panels, sidebars, or persistent on-canvas text. Every signal lands on an existing surface.",
            "Soft-win celebration revamp (T3 #9). The existing soft-win cutscene already exists and stays as is.",
            "Goal strategy hints (T3 #10) — requires more design before any code.",
            "Onboarding rewrite. We extend tooltips on existing copy, we do not add tutorial steps.",
          ]}
        />
        <DocCallout variant="warn" title="Assumptions to challenge">
          <P>
            (1) That the deltas needed by the final report can be derived purely by snapshotting
            pair stats before <DocCode>applyDateFinalReport</DocCode> rather than aggregating judge
            snapshots — confirm during task #2. (2) That the AuraTooltip primitive should be plain
            (no rich JSX content) — confirm during task #1.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "surface-map",
    title: "Surface map",
    body: (
      <>
        <P>
          Every gap maps onto an existing surface. The tier labels reference the original audit (T1
          highest priority, T3 quality-of-life).
        </P>
        <DocTable headers={["Surface", "What it shows", "Gap covered"]} rows={surfaceRows} />
        <P>
          Long copy lives in <DocCode>AuraTooltip</DocCode>. Short labels live on the surface. No
          surface gains a permanent text block.
        </P>
      </>
    ),
  },
  {
    id: "checklist",
    title: "Checklist",
    body: <RoadmapChecklist planSlug={meta.slug} tasks={checklist} status={plan.status} />,
  },
  {
    id: "decisions",
    title: "Decisions",
    body: (
      <RoadmapDecisionsLog
        entries={[
          {
            date: "2026-05-26",
            title: "Reuse existing constellation surfaces; do not add a new HUD panel",
            outcome: "accepted",
            body: (
              <P>
                The player's stated constraint is to avoid covering the screen with text and UI.
                Every signal in this plan lands on a surface that already exists (star halo, edge,
                edge tooltip, hover card, dossier, callout, final report). The only new primitive is
                the AuraTooltip, used as a content carrier — not a new chrome region.
              </P>
            ),
          },
          {
            date: "2026-05-26",
            title: "Surface retention via 'risk zone' bands, not a raw 0–100 number on the canvas",
            outcome: "accepted",
            body: (
              <P>
                Raw numbers on the canvas read as developer instrumentation. The three-band taxonomy
                (steady / cooling / at-risk) aligns with the existing manager-quip threshold at 25
                and renders as a halo tint plus a single label. The raw number stays available in
                the hover detail card and tooltips for players who want it.
              </P>
            ),
          },
          {
            date: "2026-05-26",
            title: "Closure progress driven by the minimum-axis ratio, not an average",
            outcome: "accepted",
            body: (
              <P>
                Averaging across chem / trust / health hides the blocking axis. Using{" "}
                <DocCode>min(chem/75, trust/75, health/75)</DocCode> guarantees the progress bar
                cannot read 90% if trust is at 40, and the blockers array surfaces which axis the
                player needs to move.
              </P>
            ),
          },
          {
            date: "2026-05-26",
            title: "Reject 'add raw stats on every star' as a faster path",
            outcome: "rejected",
            body: (
              <P>
                Stamping mood / retention / burnout numbers directly on every star would fill the
                canvas with text and break the constellation feel described in{" "}
                <RoadmapFileRef path="app/docs/product/visual-design.tsx" />. The halo + hover chip
                + detail card path keeps the canvas readable while still exposing the data on
                demand.
              </P>
            ),
          },
          {
            date: "2026-05-26",
            title: "Defer LLM judge bias tuning to a separate plan",
            outcome: "deferred",
            body: (
              <P>
                The player has never seen a quit or a crash-out. Surfacing alone may be enough — a
                player who sees retention sliding can intentionally provoke bad outcomes. If quits
                still never fire after this plan ships, open a prompt-tuning plan to confirm the
                judge is willing to verdict <DocCode>bad_fit</DocCode> and{" "}
                <DocCode>early_end</DocCode>.
              </P>
            ),
          },
        ]}
      />
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "Hovering a member star on the pair board shows a small chip with the risk zone label and (when relevant) the lead-ask pip.",
          "Clicking a member opens the detail card with mood / retention / burnout bars and a list of open loops or unmet asks.",
          "Hovering a pair edge shows three closure-axis lines, a last-date delta line when prior data exists, and a trajectory line when the pair is on track.",
          "Edge thickness varies with closure progress while colour remains health-coded.",
          "Bottom-left callout shows 'Cases at risk: N' chip whenever any active member is in the at-risk zone; click-through opens an overlay listing the members.",
          "Post-date final report shows a pair-stat delta line and per-member mood / retention delta rows. An at-risk tone badge appears when retention crosses below 25 on that date.",
          "All longer copy is reachable via AuraTooltip on the relevant element — no permanent text blocks added.",
          "vp check, vp test, and vp build all pass.",
        ]}
      />
    ),
  },
  {
    id: "verification",
    title: "Verification",
    body: (
      <>
        <DocList
          items={[
            <span key="check">
              <DocCode>vp check</DocCode> — format, lint, type-check the new helpers and components.
            </span>,
            <span key="test">
              <DocCode>vp test</DocCode> — unit tests for risk zone, closure progress, stat deltas,
              and the existing date-engine member-state cases.
            </span>,
            <span key="build">
              <DocCode>vp build</DocCode> — ensure the docs route, lobby props pipeline, and Tooltip
              primitive build cleanly.
            </span>,
            <span key="browser">
              Browser drive at <DocCode>http://localhost:5173/</DocCode> in 1920x1080, focus a
              member, hover a partner, hover an edge, open the dossier, then complete a date and
              read the final report. Confirm each surface fires.
            </span>,
          ]}
        />
      </>
    ),
  },
];

export default function SurfaceGameplayFeedbackPlan() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
