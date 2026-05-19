import {
  DocCallout,
  DocCode,
  DocList,
  DocPage,
  DocPipeline,
  DocStateMachine,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "gameplay/case-management",
  group: "gameplay",
  title: "Case management",
  description:
    "Focused cases, shift cadence, deck draws, the 24-turn date budget, case closures, win conditions, and the soft-win cutscene.",
  order: 4,
};

export const lede = (
  <>
    Cupid runs four focus cases at a time and one date per shift. This frames the player as a
    relationship operator who carries small case loads instead of a matchmaker who rerolls every
    shift.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "focused-cases",
    title: "Focused cases",
    body: (
      <>
        <DocList
          items={[
            <span key="save">
              The save owns <DocCode>focusedMemberIds</DocCode>, capped at 4. Onboarding requires
              exactly 4 selected from the 40 active members; closures free a slot.{" "}
              <DocCode>app/services/focus-cases.ts</DocCode> exposes{" "}
              <DocCode>selectInitialFocusCases</DocCode>, <DocCode>addFocusCase</DocCode>,{" "}
              <DocCode>removeFocusCase</DocCode>, and <DocCode>swapFocusCase</DocCode>. The shift's{" "}
              <DocCode>featuredMemberIds</DocCode> mirror <DocCode>focusedMemberIds</DocCode> for
              backwards compatibility.
            </span>,
            "Swapping a focus case costs 25 retention to the dropped member. Removing a case (through closure or open-slot freeing) does not. Adding into an open slot is free.",
            <span key="status">
              Closed and quit members cannot be focused, matched, or selected for shift requests.
              Their lifecycle status lives on <DocCode>member.state.status</DocCode> as{" "}
              <DocCode>active</DocCode>, <DocCode>closed</DocCode>, or <DocCode>quit</DocCode>. When
              retention drops to zero the engine flips status to <DocCode>quit</DocCode>. Closure is
              a separate workflow.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "shift-cadence",
    title: "Shift cadence",
    body: (
      <P>
        Each shift books one date. After a date finishes (completed or ended early), both
        participants stamp <DocCode>member.state.lastDateShift</DocCode> and enter a one-shift
        cooldown. <DocCode>isMemberInCooldown(member, currentShift)</DocCode> is true on the date
        shift and the immediately following shift. Cupid cannot book a member while they are in
        cooldown.
      </P>
    ),
  },
  {
    id: "deck",
    title: "Deck and draws",
    body: (
      <P>
        The deck is a save-owned budget allocation of 6 to 12 cards, not a shift-owned hand. A shift
        starts without a hand. When the player commits a focus case and partner, Cupid stores an
        active booking on the shift, snapshots the current deck budget, reserves the shift date
        slot, and draws 3 cards into <DocCode>shift.drawnScenarioIds</DocCode>. Playing a card does
        not remove it from the deck or open a replacement slot. Date Book edits add or drop cards
        against the current budget cap and are locked while an active booking or date session
        exists. See the deck service in <DocCode>app/services/deck.ts</DocCode>.
      </P>
    ),
  },
  {
    id: "date-length",
    title: "Date length",
    body: (
      <P>
        Default date length is 24 character turns (<DocCode>CHARACTER_TURN_LIMIT</DocCode> in{" "}
        <DocCode>app/services/date-engine.ts</DocCode>), which produces 4 Cupid-reviewed exchanges
        at the 6-turn Cupid interval and a phase distribution of roughly 3 opener turns, 9 pressure
        turns, 6 pivot turns, and 6 resolution turns. The previous 30-turn default dragged late-game
        on local models without adding Cupid filings or phase coverage; the new default keeps the
        same Cupid cadence while shortening the redundant tail. After 2 Cupid reads (
        <DocCode>MIN_JUDGE_READS_BEFORE_CUT_SHORT</DocCode>), a paused active date can be cut short.
        That path appends a system beat, runs one final Cupid judge pass, finalizes the report,
        files memories, clears the booking, and stamps both members into cooldown. The final judge
        decides whether the exit protected a bad room or bruised a warm one. The schema floor stays
        at 2 so test fixtures can shorten dates without resetting other defaults.
      </P>
    ),
  },
  {
    id: "dev-seed-handler",
    title: "Dev seed handler",
    body: (
      <P>
        For Playwright validation only, the dev shell honors <DocCode>?seed=closures</DocCode> when{" "}
        <DocCode>import.meta.env.DEV</DocCode> is true and the build is not the desktop variant. The
        handler in <DocCode>app/components/cupid-shell.tsx</DocCode> calls{" "}
        <DocCode>seedClosedAndQuitMembers</DocCode> from{" "}
        <DocCode>app/services/dev-seeds.ts</DocCode>, which flips one pair to{" "}
        <DocCode>closed</DocCode> (filing a pair closure memory) and one member to{" "}
        <DocCode>quit</DocCode> (retention zero), then clears the query string. The seed is gated on{" "}
        <DocCode>import.meta.env.DEV</DocCode> and the desktop mode check so production and desktop
        builds cannot trigger it.
      </P>
    ),
  },
  {
    id: "closures",
    title: "Case closures",
    body: (
      <>
        <P>
          Cupid's positive endgame is the case closure. A pair that earns enough mutual signal can
          delete the app together. Closure is permanent and rewards the player with a +5 retention
          bump on every other active member and a +1 raise to the campaign quit cap.
        </P>
        <DocPipeline
          title="closure flow"
          steps={[
            {
              id: "threshold",
              kind: "input",
              label: "Threshold check",
              detail: "chemistry / trust / health / strain / conflict / count / outcome",
            },
            {
              id: "callout",
              kind: "process",
              label: "Planning callout",
              detail: "Rendered for any ready pair with a focused member",
            },
            {
              id: "ai",
              kind: "service",
              label: "AI closure summary",
              detail: "generateClosureSummary",
            },
            {
              id: "persist",
              kind: "guard",
              label: "closePair",
              detail: "Validate, file pair memory, flip status",
            },
            {
              id: "effects",
              kind: "output",
              label: "Side effects",
              detail: "+5 retention on remaining actives, +1 quit cap",
            },
          ]}
        />
        <DocSubsection id="closure-threshold" title="Threshold">
          <P>
            Threshold lives in <DocCode>app/services/closures.ts</DocCode> as{" "}
            <DocCode>CLOSURE_THRESHOLD</DocCode>:
          </P>
          <DocList
            items={[
              <span key="chem">
                <DocCode>chemistry &gt;= 75</DocCode>
              </span>,
              <span key="trust">
                <DocCode>trust &gt;= 75</DocCode>
              </span>,
              <span key="health">
                <DocCode>relationshipHealth &gt;= 75</DocCode>
              </span>,
              <span key="strain">
                <DocCode>strain &lt;= 30</DocCode>
              </span>,
              <span key="conflict">
                <DocCode>conflict &lt;= 30</DocCode>
              </span>,
              <span key="count">
                Completed date count including the just-finished date <DocCode>&gt;= 3</DocCode>.
              </span>,
              <span key="outcome">
                <DocCode>finalReport.outcome === "second_date"</DocCode>. The{" "}
                <DocCode>second_date</DocCode> gate ties closure to a good date moment so a pair
                cannot close from a cool-down or repair-shaped report even if stats are still high.
              </span>,
              "No broken agreements and no open loops. A near-ready pair with unresolved pressure stays open and files a closure near-miss note instead.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="closure-mechanics" title="Mechanics">
          <DocList
            items={[
              <span key="stamp">
                <DocCode>finalizeDateSession</DocCode> stamps{" "}
                <DocCode>dateFinalReportSchema.readyToClose</DocCode> after each completed date.{" "}
                <DocCode>getReadyClosurePairs(save)</DocCode> re-checks the threshold against
                current pair stats and member status so stale flags from earlier sessions cannot
                survive a later non-ready filing or a quit.
              </span>,
              <span key="trigger">
                Closure is player-initiated. The Live Date planning state renders a callout for any
                ready pair with at least one focused member. Confirming the callout calls{" "}
                <DocCode>generateClosureSummary</DocCode> (AI hook in{" "}
                <DocCode>app/services/closure-summary.ts</DocCode>) and then{" "}
                <DocCode>closePair</DocCode>. On failure the callout stays pending with a retryable
                error. Cupid never closes a pair with an empty summary.
              </span>,
              <span key="effects">
                <DocCode>closePair</DocCode> files a pair memory tagged{" "}
                <DocCode>pair_closure</DocCode>, flips both members to{" "}
                <DocCode>member.state.status = "closed"</DocCode>, removes them from{" "}
                <DocCode>focusedMemberIds</DocCode>, bumps <DocCode>closureCount</DocCode>, and
                applies <DocCode>CLOSURE_RETENTION_BUMP</DocCode> (+5) to remaining active members.
                Closure is permanent; closed members never re-enter focus, matchmaking, or shift
                requests, and retention math will not flip a closed member to{" "}
                <DocCode>quit</DocCode>.
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "closure-threshold", title: "Threshold" },
      { id: "closure-mechanics", title: "Mechanics" },
    ],
  },
  {
    id: "win-conditions",
    title: "Win conditions",
    body: (
      <>
        <P>
          The campaign quit cap is dynamic:{" "}
          <DocCode>clientLossLimit(save) = CLIENT_LOSS_LIMIT_BASE + closureCount</DocCode>. The base
          is 3, so a campaign that has closed 5 pairs can absorb 8 quits before{" "}
          <DocCode>isCampaignLost(save)</DocCode> fires.
        </P>
        <DocStateMachine
          title="member status"
          states={[
            { id: "active", label: "active" },
            { id: "closed", label: "closed", tone: "terminal" },
            { id: "quit", label: "quit", tone: "warn" },
          ]}
          transitions={[
            { from: "active", to: "closed", label: "closePair (permanent)" },
            { from: "active", to: "quit", label: "retention drops to zero" },
          ]}
        />
        <P>
          <DocCode>closureCount &gt;= 5</DocCode> triggers a one-time soft-win cutscene (
          <DocCode>SoftWinCutscene</DocCode> in{" "}
          <DocCode>app/components/soft-win-cutscene.tsx</DocCode>). The cutscene shows the first 5
          closed pairs and their closure summaries with the title{" "}
          <Strong>"Cupid received a promotion"</Strong>. Continue calls{" "}
          <DocCode>markSoftWinSeen</DocCode>, the game continues after, and the cutscene never fires
          again on the same save.
        </P>
        <DocCallout variant="info" title="Out of scope">
          Out of scope for the current closure pass: re-opening closed cases, player-edited closure
          summaries, regenerating closure summaries, per-pair leaderboards, roster expansion, drift
          mechanics. Neglect is not punished. Closure is real reward without an inverse penalty.
        </DocCallout>
      </>
    ),
  },
];

export default function CaseManagementDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
