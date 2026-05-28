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
    "Focused cases, shift cadence, deck draws, the 12-turn date budget, case closures, win conditions, and the soft-win cutscene.",
  order: 4,
};

export const lede = (
  <>
    Cupid keeps four focus cases on the desk and books one date per shift. Each shift the player
    picks one of the four as today's <Strong>lead case</Strong> — the file the shift runs on — and
    the other three sit in the queue as waiting-room pressure. The player runs a small relationship
    desk instead of rerolling matches every shift.
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
              exactly 4 selected from the 47 active members; closures free a slot.{" "}
              <DocCode>app/services/focus-cases.ts</DocCode> exposes{" "}
              <DocCode>selectInitialFocusCases</DocCode>, <DocCode>addFocusCase</DocCode>,{" "}
              <DocCode>removeFocusCase</DocCode>, and <DocCode>swapFocusCase</DocCode>. The shift's{" "}
              <DocCode>featuredMemberIds</DocCode> mirror <DocCode>focusedMemberIds</DocCode> for
              backwards compatibility.
            </span>,
            <span key="penalty">
              Swapping a focus case costs 25 retention to the dropped member. Dropping an active
              focus case via <Strong>Drop from focus</Strong> costs the same 25 retention (it routes
              through the same penalty as swap). Freeing a slot held by a closed or quit member via{" "}
              <Strong>Free slot</Strong> is non-punitive, and closure removes the pair directly via{" "}
              <DocCode>closePair</DocCode> without touching retention. Adding into an open slot is
              free.
            </span>,
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
      <>
        <P>
          Each shift books one date. After a date finishes (completed or ended early), both
          participants stamp <DocCode>member.state.lastDateShift</DocCode> and enter a one-shift
          cooldown. <DocCode>isMemberInCooldown(member, currentShift)</DocCode> is true on the date
          shift and the immediately following shift. Cupid cannot book a member while they are in
          cooldown.
        </P>
        <P>
          Each active shift also persists <DocCode>availablePartnerMemberIds</DocCode>, the 8-member
          <Strong>Tonight&apos;s Roster</Strong>. This is a logistics board, not a match verdict:
          member availability comes from authored scheduling profiles, shift rhythm, recent Cupid
          activity, and current member state. Focus cases are the case desk and cannot appear as
          partners. Members outside tonight&apos;s board remain visible under{" "}
          <Strong>Off Tonight</Strong> with disabled cards and a reason such as focus case,
          cooldown, closed file, cancelled membership, or off shift.
        </P>
        <P>
          The active shift allows one manual partner-roster swap before a pair is committed. The
          swap replaces one non-reserved member from <DocCode>availablePartnerMemberIds</DocCode>{" "}
          with one active <Strong>Off Tonight</Strong> member whose only blocker is{" "}
          <DocCode>off_shift</DocCode>, then records the audit on{" "}
          <DocCode>shift.partnerSwap</DocCode>. Cooldown, focus, closed, quit, closed-lane,
          already-available, and follow-up-reserved members cannot be used for that swap.
        </P>
        <P>
          Follow-up continuity gets a reserved path through that logistics board. When a focused
          case has a recent date with the follow-up filed as <Strong>Pursue</Strong>, that partner
          is pinned onto the next shift as a follow-up reservation that bypasses cooldown, so the
          player can book the next date instead of waiting for random availability. Filing{" "}
          <Strong>Close</Strong> is the explicit exception because it retires the romantic lane.
        </P>
        <P>
          Each shift surfaces one current request per focused member. One of those four requests is
          the <Strong>lead ask</Strong> — the request the shift is graded on — and the other three
          sit in the queue as waiting-room pressure rather than unaddressed homework: they roll
          forward shift to shift and incur no penalty when no one books that case. The lead ask is
          designated via <DocCode>selectHotRequestId</DocCode> in{" "}
          <DocCode>app/services/shift-planning.ts</DocCode> — a deterministic, shift-number-seeded
          pick that rotates fairly across focus cases. It is derived from{" "}
          <DocCode>(shift.memberRequestIds, shift.shiftNumber)</DocCode> on read via{" "}
          <DocCode>deriveHotRequestId</DocCode> rather than persisted, so it stays in sync with the
          roster automatically. Note that the lead ask can sit on a focus member the player does not
          book tonight; in that case it is classified <DocCode>ignored</DocCode>, while the booked
          member's request runs as a non-graded background ask. <DocCode>completeShift</DocCode>{" "}
          classifies each shift request via <DocCode>classifyShiftRequestOutcomes</DocCode> into one
          of four buckets, using the focus session's own judge-snapshot evidence (
          <DocCode>session.judgeSnapshots[].usedEvidenceIds</DocCode> containing{" "}
          <DocCode>ask-covered</DocCode> or <DocCode>ask-blocked</DocCode> ids) as the landed-signal
          source. The lookup is session-scoped so a prior shift's covered record cannot leak into a
          later shift when the same ask rotates back into the pool:
        </P>
        <DocList
          items={[
            <span key="covered">
              <Strong>covered</Strong> — booked and the judge filed <DocCode>ask-covered</DocCode>.
              The request rotates to the next one in the pool, no penalty, recent date result reads
              "Ask covered."
            </span>,
            <span key="raised">
              <Strong>raised</Strong> — booked and the judge filed <DocCode>ask-blocked</DocCode>{" "}
              (scenario was a wrong fit). Rotates, no penalty, recent date result reads "Ask raised,
              room blocked it."
            </span>,
            <span key="missed">
              <Strong>missed</Strong> — booked but neither ask read was filed; the date drifted off
              the ask. Does not rotate (the ask stays alive for another shift). If the missed ask
              was the lead ask, the member loses half of <DocCode>moodPenaltyIfIgnored</DocCode>{" "}
              mood (no burnout or retention hit). Background drifts apply no penalty. Recent date
              result reads "Booked, but the ask never landed."
            </span>,
            <span key="ignored">
              <Strong>ignored</Strong> — never booked. Rotates. If the ignored ask was the lead ask,
              the member loses the full <DocCode>moodPenaltyIfIgnored</DocCode> mood (5 to 7 per
              request, authored on the fixture; no burnout or retention hit). Background ignored
              asks apply no penalty — they read as cases waiting in the queue on the shift report.
            </span>,
          ]}
        />
        <P>
          Only the lead ask contributes to mood deltas and to the shift report's{" "}
          <DocCode>memberMoodDelta</DocCode> goal metric. The HR note's ask line states the lead
          ask's outcome (covered, raised, missed, or sat) and, if any background members are still
          waiting, counts them as "cases in the queue" rather than as failures.
        </P>
        <P>
          Each shift report persists a typed{" "}
          <DocCode>requestOutcomes: Record&lt;requestId, ShiftRequestAskOutcome&gt;</DocCode> map
          (covered / raised / missed / ignored) covering every request on the shift roster, for
          audit and report copy. Legacy reports that only persisted{" "}
          <DocCode>ignoredRequestIds</DocCode> are still readable and fall back to per-request
          averaging; archived UI labels those rows as legacy instead of inventing a retrospective
          lead ask. The budget review's lead-asks-honored rate scores the lead ask for each shift:
          covered at <Strong>1.0</Strong>, raised at <Strong>0.75</Strong>, missed at{" "}
          <Strong>0.5</Strong>, and ignored at <Strong>0</Strong>. Background queue cases do not
          count against the budget cap. The current shift's just-filed report is included in its own
          performance review window when the review fires on a review-interval boundary, so the
          current shift's lead-ask outcome contributes to the budget reasons computed that same
          turn.
        </P>
        <P>
          <DocCode>buildDeckCoverage</DocCode> reports each focus member as either{" "}
          <Strong>served</Strong> (a date was booked for the member this shift) or{" "}
          <Strong>missed</Strong> (not booked). Previously, an unbooked case could still read as
          served when the drawn hand contained a promising card; that path was removed. Coverage is
          now strictly about whether a case got a date.
        </P>
      </>
    ),
  },
  {
    id: "planning-canvas",
    title: "Planning canvas",
    body: (
      <>
        <P>
          The planning canvas anchors each shift on a single sentence: tonight, Cupid is trying to
          help <Strong>{`<member>`}</Strong> with <Strong>{`<ask>`}</Strong> by booking{" "}
          <Strong>{`<partner>`}</Strong> in <Strong>{`<room>`}</Strong> because{" "}
          <Strong>{`<intent>`}</Strong>. The UI surfaces that sentence one slot at a time so the
          operations layer reads as matchmaking infrastructure instead of the actual game.
        </P>
        <P>
          The <Strong>Lead ask</Strong> row is derived in{" "}
          <DocCode>app/components/constellation-lobby/use-shift-filing-state.ts</DocCode> and
          rendered by <DocCode>ShiftBriefDock</DocCode> inside the lobby HUD. It compares{" "}
          <DocCode>deriveHotRequestId(shift)</DocCode> to the authored member request list, then
          keeps the current ask visible beside the shift goals while the player moves through focus,
          partner, and room selection.
        </P>
        <P>
          The <Strong>Intent rail</Strong> in{" "}
          <DocCode>app/components/constellation-lobby/intent-rail.tsx</DocCode> mounts once a focus
          case and partner are selected. It is optional and stores onto the active booking as{" "}
          <DocCode>matchmakingIntent</DocCode> (one of <DocCode>comfort</DocCode>,{" "}
          <DocCode>spark</DocCode>, <DocCode>surface</DocCode>, <DocCode>repair</DocCode>,{" "}
          <DocCode>swing</DocCode>). The chosen intent is copied onto the session at start time so
          the date engine can read it at finalize time without consulting the shift.
        </P>
        <P>
          <DocCode>finalizeDateSession</DocCode> in <DocCode>app/services/date-engine.ts</DocCode>{" "}
          stamps both <DocCode>matchmakingIntent</DocCode> and <DocCode>intentOutcome</DocCode>{" "}
          (supported / mixed / unsupported) on the <DocCode>DateFinalReport</DocCode> via{" "}
          <DocCode>deriveIntentOutcome</DocCode> in{" "}
          <DocCode>app/services/matchmaking-intent.ts</DocCode>. The derivation is deterministic and
          depends on the outcome, the final date health, and the judge snapshots'{" "}
          <DocCode>statDeltas</DocCode> for strain and conflict. The footer derives the echo line
          (e.g. "Cupid booked this as a comfort read. The room supported that read.") at render time
          via <DocCode>intentEchoLine</DocCode>, so label wording stays editable without touching
          saved reports.
        </P>
        <P>
          The <Strong>FinalReportFooter</Strong> in{" "}
          <DocCode>app/components/date-view-final-report.tsx</DocCode> leads with a deterministic
          impact receipt from <DocCode>app/services/date-impact.ts</DocCode>: one verdict (
          <DocCode>Closure ready</DocCode>, <DocCode>Closure gained ground</DocCode>,{" "}
          <DocCode>Case stalled</DocCode>, <DocCode>Case risk rose</DocCode>, or{" "}
          <DocCode>Bad fit confirmed</DocCode>), one campaign-meaning line, one reason line, and at
          most three consequence chips. The LLM-written summary and deterministic{" "}
          <DocCode>statSummary</DocCode> move under the muted case note so flavor does not obscure
          the gameplay result. Filed reads and follow-up choices stay below the impact receipt.
        </P>
        <P>
          Follow-up booking pressure is stored as exact focus/partner reservations on the active
          shift. <DocCode>Pursue</DocCode> reopens only that pair's next booking path while it is
          ripe; <DocCode>Close</DocCode> writes a closed lane to the pair state so the match is no
          longer bookable or surfaced as a future partner.
        </P>
      </>
    ),
  },
  {
    id: "deck",
    title: "Deck and draws",
    body: (
      <P>
        The deck is a save-owned budget allocation of 6 to 12 cards, not a shift-owned hand.
        Onboarding installs a minimum-size starter deck for shift 1, and Date Book editing unlocks
        after the first date report. A shift starts without a hand. When the player commits a focus
        case and partner, Cupid stores an active booking on the shift, snapshots the current deck
        budget, reserves the shift date slot, and draws 3 cards into{" "}
        <DocCode>shift.drawnScenarioIds</DocCode>. Playing a card does not remove it from the deck
        or open a replacement slot. Date Book edits add or drop cards against the current budget cap
        and are locked while an active booking or date session exists. See the deck service in{" "}
        <DocCode>app/services/deck.ts</DocCode>.
      </P>
    ),
  },
  {
    id: "randomness",
    title: "Randomness contract",
    body: (
      <>
        <P>
          Gameplay randomness uses the shared helpers in <DocCode>app/services/utils.ts</DocCode>,
          not <DocCode>Math.random</DocCode>. Random sources are domain-namespaced, seedable, and
          selected through helpers such as <DocCode>createNamespacedRandom</DocCode>,{" "}
          <DocCode>randomIndex</DocCode>, and <DocCode>shuffleInPlace</DocCode> so service tests can
          replay exact outcomes.
        </P>
        <DocList
          items={[
            <span key="deterministic">
              Deterministic systems such as deck hands, shift goals, and request ordering seed from
              stable save facts, ids, and shift numbers.
            </span>,
            <span key="fresh">
              Live date event drafts include saved booking entropy such as{" "}
              <DocCode>booking.committedAt</DocCode>, so repeated real bookings feel fresh while a
              saved booking remains reproducible. Scenario event drafts also penalize recently
              offered, picked, and triggered events for the same pair and scenario before reusing
              them.
            </span>,
            <span key="tests">
              Service boundaries that need exact assertions should accept{" "}
              <DocCode>random?: RandomFn</DocCode> and pass that source through instead of creating
              hidden state.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "date-length",
    title: "Date length",
    body: (
      <P>
        Default date length is 12 character turns (<DocCode>CHARACTER_TURN_LIMIT</DocCode> in{" "}
        <DocCode>app/services/date-engine.ts</DocCode>), which produces 2 Cupid-reviewed exchanges
        at the 6-turn Cupid interval: one read after the opening pressure and one final filing read.
        Cupid returns autoplay to a paused decision checkpoint after each mid-date read so the
        player can whisper, drop a scene, file a long date, or advance the next beat. The previous
        24-turn default still produced 4 Cupid filings, but player feedback found the late tail
        slower than the extra evidence was worth. After 2 Cupid reads (
        <DocCode>MIN_JUDGE_READS_BEFORE_CUT_SHORT</DocCode>), a paused active date longer than the
        default can be filed early. That path appends a system beat, runs one final Cupid judge
        pass, finalizes the report, files memories, clears the booking, and stamps both members into
        cooldown. The final judge decides whether the exit protected a bad room or bruised a warm
        one. The schema floor stays at 2 so test fixtures can shorten dates without resetting other
        defaults.
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
                cannot close from a cool-down or early-end report even if stats are still high.
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
          mechanics. Closure has no anti-closure decay path; previously closed pairs do not lose
          their +5 retention bump over time.
        </DocCallout>
      </>
    ),
  },
];

export default function CaseManagementDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
