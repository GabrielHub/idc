import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocCompareGrid,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  DocSubsection,
  DocTable,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice-requirements",
  group: "product",
  title: "Member voice: requirements",
  description:
    "What a member performer must satisfy: the spoken-dialogue contract, output invariants, the machine-enforced gates, the per-surface exit bars (performer, partner, judge, nudge, date event), how to run a tuning pass, and the done-when gate.",
  order: 2,
};

export const lede = (
  <>
    This is the lock-in doc. It says what <Strong>tuned</Strong> means for a member performer and
    which bars a machine already enforces. Author the member in{" "}
    <DocLink to="/docs/product/voice-authoring">Member voice: authoring</DocLink>, run a pass with{" "}
    <DocCode>vp run tune</DocCode>, then walk this gate before calling the member done. Each bar
    links to the doc or the code that owns the full rule.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "goal",
    title: "The Goal",
    body: (
      <>
        <P>
          One member should sound like one specific person reacting in real time across a table. The
          whole gate exists to keep a voice from collapsing into one of three silhouettes:
        </P>
        <DocList
          items={[
            <span key="narrator">
              <Strong>The narrator:</Strong> announces, repeats, or acknowledges what just happened
              instead of treating it as already visible and moving.
            </span>,
            <span key="chatbot">
              <Strong>The chatbot:</Strong> pleasant, generic, receipt-filler ("noted", "that's
              fair", "love that") that would fit any member.
            </span>,
            <span key="reader">
              <Strong>The profile reader:</Strong> recites traits, bio facts, or the date's own
              setup instead of performing the engine through behavior.
            </span>,
          ]}
        />
        <DocCallout variant="info" title="North star">
          Answer the latest partner move first. Imply instead of narrate. Keep a sincere engine
          under the comedy. A natural reaction always outranks an authored tic or pattern.
        </DocCallout>
      </>
    ),
  },
  {
    id: "how-to-read",
    title: "How To Read This Gate",
    body: (
      <>
        <P>Every bar below is one of two kinds. Treat them differently.</P>
        <DocDefList
          items={[
            {
              term: "AUTO",
              def: (
                <>
                  Already enforced by the scaffold, the sanitizers, or the audit. If it reaches the
                  player it is a regression, not a tuning task. Sweep with{" "}
                  <DocCode>vp run audit:dates</DocCode> (<DocCode>runDateQualityAudit</DocCode> over
                  the default pair and scenario cases).
                </>
              ),
            },
            {
              term: "JUDGMENT",
              def: (
                <>
                  The actual tuning target. No machine catches these. A human or tuning agent reads
                  for them across a full date. This is where the work is.
                </>
              ),
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "running-a-pass",
    title: "Running A Tuning Pass",
    body: (
      <>
        <P>
          Use this when an agent is asked to tune one member voice. Do not feed the full voice
          documentation stack into the model. Start with the narrow target, inspect live output,
          patch the smallest authored surface that teaches the failure, and rerun the same pressure.
        </P>
        <DocCallout variant="warn" title="One member, one failure shape">
          A tuning pass is not a rewrite pass. Name the member, the partner pressure, and the
          observed miss before editing. If there are multiple misses, fix the highest-impact one
          first and keep the transcript evidence with the working session, not in product docs.
        </DocCallout>
        <DocSteps
          items={[
            <span key="read">
              Read the member fixture in <DocCode>app/fixtures/members/</DocCode>, their current
              requests in <DocCode>app/fixtures/goals/member-requests.ts</DocCode>, and only the
              relevant section of{" "}
              <DocLink to="/docs/product/voice-authoring">Member voice: authoring</DocLink>. Open{" "}
              <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink> only when the
              fixture cites a pattern or the miss is pattern drift, and{" "}
              <DocLink to="/docs/product/voice-references">Voice source references</DocLink> to
              recalibrate natural rhythm before editing.
            </span>,
            <div key="start" className="flex flex-col gap-2">
              Start a live-like session with both focus flags so it mirrors gameplay: the focus
              member opens and their greeting bank fires, and the <DocCode>{"<focus>"}</DocCode>{" "}
              request block injects exactly as it would in a real date.
              <DocCodeBlock language="bash">{`vp run tune -- start <focus-id> --partner <warm-or-pressure-partner-id> --name <session-name> --focus-request <request-id> --focus-opens`}</DocCodeBlock>
            </div>,
            "Drive three to six focus-member turns across the state range. Include one warm receive, one ordinary follow-up, and one boundary or boredom pressure that should reveal drift. Cover at least one conversation room and one pressure, activity, or set-piece room.",
            "Judge the output against the bars below. Treat pleasant generic output as a miss when it does not sound like the member.",
            "Patch the smallest correct surface: register for the controlling engine, comedyMechanics for cross-turn behavior, tics for syntax frequency, outputConstraints for member-specific failure modes, sampleMessages for attractors, or the runtime prompt only when multiple members fail the same way.",
            "Rerun the same transcript pressure before expanding scope. If the fix depends on a new rule, move that rule into the owning doc rather than repeating it in every fixture.",
          ]}
        />
        <DocSubsection id="tuning-balance" title="Tuning Balance">
          <P>
            Model output is non-deterministic. A single awkward acknowledgment, flat beat, or
            slightly generic turn is not automatically a fixture failure. The tuning question is
            whether the conversation repeatedly reads wrong for this member under the same pressure.
          </P>
          <DocList
            items={[
              "Fix conversation-level patterns: six turns that stay generic, a member who cannot get angry, repeated refusal to answer the latest move, or pressure scenes that never create consequences.",
              "Do not overfit one transcript. Rerun the same pressure and look for stable drift before adding new prompt text.",
              "Accept in-character variation. An acknowledgment can be fine when it sounds like the member and moves the exchange forward.",
              "Keep prompts smaller after each pass. If a rule only exists to prevent one unlucky sample, delete it or rewrite it as a positive target.",
              "Never fail, reject, or retry a generated member line because a string matched a disliked style pattern. Only actual generation or filing failures should block a turn.",
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [{ id: "tuning-balance", title: "Tuning Balance" }],
  },
  {
    id: "spoken-invariants",
    title: "Spoken-Surface Invariants",
    body: (
      <>
        <P>
          These hold on every spoken line, performer and partner alike. Most are machine-enforced,
          so a tuning pass should almost never spend time here; if one fails, the fixture or the
          scaffold is the bug. The two subsections below are the authored contract; the table is the
          machine map.
        </P>
        <DocTable
          headers={["Must hold on every spoken line", "Gate", "Enforced / owned by"]}
          rows={[
            [
              "No asterisk or bracket stage directions, no action narration",
              "AUTO",
              <DocCode key="c">performer-action-sanitizer.ts</DocCode>,
            ],
            [
              "Only *italic* (stress) and **strong** (named joke or correction); no other Markdown, lists, speaker labels",
              "AUTO",
              <DocCode key="c">character-markdown.ts</DocCode>,
            ],
            [
              "No em or en dashes",
              "AUTO",
              <DocCode key="c">player-safe-copy.stripForbiddenPunctuation</DocCode>,
            ],
            [
              "No hidden-fixture leak: species, origin, dimension, bio, secrets, tags, fixture phrasing",
              "AUTO",
              <DocCode key="c">hidden-info-guard.detectHiddenInfoLeak</DocCode>,
            ],
            [
              "No stat numbers or system terms (scenario, transcript, Date Health, sim) in player copy",
              "AUTO",
              <DocCode key="c">player-safe-copy.scrubPlayerSafeCopy</DocCode>,
            ],
            [
              "No near-duplicate of the speaker's last three lines",
              "AUTO",
              <span key="c">
                <DocCode>hasNearDuplicateRecentLine</DocCode> (Jaccard &ge; 0.6)
              </span>,
            ],
            ["Never empty or unfilerable", "AUTO", "character visibility retry guard"],
            [
              "No AI slop or therapy / consulting filler (delve, tapestry, deeper connection)",
              <span key="g">
                <Strong>AUTO</Strong> in judge copy, <Strong>JUDGMENT</Strong> in dialogue
              </span>,
              <DocCode key="c">checkCupidCorporateCopy</DocCode>,
            ],
            [
              "No approval-receipt opener used as a tic (noted, got it, fair, for sure)",
              "JUDGMENT (audit warns)",
              <DocCode key="c">detectApprovalPhrase</DocCode>,
            ],
          ]}
        />
        <DocSubsection id="output-invariants" title="Output Invariants">
          <P>
            These apply to every member unless the fixture authors a narrow character-coherent
            exception.
          </P>
          <DocDefList
            items={[
              {
                term: "No stage directions",
                def: 'Members never narrate actions in asterisks or brackets. "*pours the wine*", "*nods*", "[picks up the glass]" are theater-script moves. The action happens invisibly or becomes spoken dialogue: "wine\'s poured", "i\'m sitting, im sitting", "menu question, pancakes or savory?"',
              },
              {
                term: "No move-narration or partner-labeling",
                def: 'Do not narrate the member\'s own move ("im noticing things", "that landed", "im just sitting with it") or label the partner\'s move ("green flag", "real one move", "you ask the kind of question that"). The reply itself is the receipt.',
              },
              {
                term: "No casual receipt filler",
                def: 'Casual voices do not bridge with "noted", "got it", "good intel", "good looking out", "appreciate the heads up", or "fair enough" as standalone acknowledgments. Use an in-voice reaction, a direct answer, a real question, or skip the acknowledgment.',
              },
              {
                term: "No room narration as filler",
                def: "Do not fill silence by describing the booth, coffee, jukebox, lighting, server, or menu unless the character's authored engine makes that the actual conversational move. Silence is not a problem solved by venue color.",
              },
              {
                term: "No date logistics agency",
                def: "Cupid sets the match, route, venue, and time. Member dialogue may express preferences and ordinary schedule limits, but it must not credit either dater for choosing the place, getting there, or arranging the hour.",
              },
            ]}
          />
          <DocCallout variant="info" title="Carve-outs must be engines">
            Filing-trade and brand-performing voices may use receipt-language when filing is the
            authored engine: deposition cadence, audit voice, on-the-record brand relay, Patron
            pitch. The carve-out is not a license for generic chatbot acknowledgment.
          </DocCallout>
        </DocSubsection>
        <DocSubsection id="spoken-dialogue" title="Spoken Dialogue">
          <DocCallout variant="warn" title="The date is spoken, not texted">
            Members render in chat bubbles, but the fiction is two people talking at a table. Author
            what the member would say out loud.
          </DocCallout>
          <P>
            Texting corpora can inform vocabulary, humor, correction shapes, sincere-mode pivots,
            and stress patterns. They do not automatically transfer typed-medium artifacts into a
            live date.
          </P>
          <DocCompareGrid
            columns={[
              {
                heading: "Transfers",
                tone: "positive",
                items: [
                  "Humor type and setup/kicker rhythm.",
                  "Sentence-opener vocabulary and repeated pivots.",
                  "Spoken slang the person actually says.",
                  "Vowel stress as spoken emphasis.",
                  "Sincere mode getting shorter or cleaner.",
                ],
              },
              {
                heading: "Does Not Transfer",
                tone: "negative",
                items: [
                  "Laugh-tag suffixes at the end of bubbles.",
                  "Standalone one-word reaction bubbles as default cadence.",
                  "Dense text shorthand like rn, lmk, my b, kk, u.",
                  "All-caps HAHAHA streaks and typed letter-runs.",
                  "Default newline cascades or partner-name pings.",
                ],
              },
            ]}
          />
          <DocCallout variant="info" title="Exception must be authored">
            Gabriel Tan's texting-native cascade is allowed because his fixture names the exception
            and reconciles it to the in-person surface. Do not generalize that exception to casual
            voices unless the character premise explicitly earns it.
          </DocCallout>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "output-invariants", title: "Output Invariants" },
      { id: "spoken-dialogue", title: "Spoken Dialogue" },
    ],
  },
  {
    id: "performer",
    title: "Performer Exit Bars",
    body: (
      <>
        <P>
          The focused member speaking. These are JUDGMENT bars. Full owners are{" "}
          <DocLink to="/docs/product/voice-authoring">Member voice: authoring</DocLink>,{" "}
          <DocLink to="/docs/product/voice-patterns">voice patterns</DocLink>, and the{" "}
          <DocLink to="/docs/product/voice-references#date-scenario-dialogue">
            date scenario reference
          </DocLink>
          .
        </P>
        <DocList
          items={[
            "Answers the latest partner move first; voice colors the reply only after the answer is real.",
            "Implies instead of narrates: treats actions and events as already visible, cuts announce / repeat / acknowledge.",
            "Opens on its own move, not a verdict on the partner's line. If a line starts by announcing what the member noticed, convert the noticing into the actual reply it creates.",
            "One compact spoken move: one to three sentences, under 55 words; a second block only for a real pause or sharp turn.",
            "Spoken at a table, not typed into a phone, unless the fixture explicitly earns the exception.",
            "Stays inside scene inventory: no invented names, menus, backstories, or offscreen consequences. Concrete fixture facts appear only when the turn earns them, never as census receipt or hidden-field confession.",
            "Performs the authored engine through behavior (protection, refusal, curiosity, pressure, attachment, care), does not recite traits.",
            "Patterns are flavors, not quotas; a natural reaction beats any tic or pattern; tics stay seasoning, three to seven, sparse.",
            "No date-logistics agency: may state preferences, cannot credit the dater for the venue, arrival, or timing.",
            "Talk ratio reads as this member (a yapper spirals, a quiet member lands fewer words); quiet is load-bearing, not silent.",
          ]}
        />
      </>
    ),
  },
  {
    id: "flow-modes",
    title: "Per-Flow Performer Bars",
    body: (
      <>
        <P>
          Good changes with the scenario's flow mode. A pass should cover at least one conversation
          room and one pressure, activity, or set-piece room. The runtime guidance lives in the{" "}
          <DocCode>date-prompts.ts</DocCode> flow blocks; event handling lives in{" "}
          <DocLink to="/docs/product/voice-prompts#scenario-event-kinds">
            runtime voice surfaces
          </DocLink>
          .
        </P>
        <DocTable
          headers={["Flow", "Lands when", "Fails when"]}
          rows={[
            [
              "conversation",
              "the person outranks the venue; answers, asks, jokes, disagrees, admits",
              "venue color as filler; setup recital",
            ],
            [
              "activity",
              "the task is subtext and leverage; talk stays alive under the hands",
              "reports the task; narrates the handling",
            ],
            [
              "pressure",
              "one analysis beat at most, then a concrete choice: make, refuse, defer, share, or hand off",
              "parks in lore, self-correction, or premise explanation",
            ],
            [
              "set_piece",
              "reacts to the visible change, names the next move, keeps consequences local to the room",
              "glides past the beat; invents offscreen consequences",
            ],
          ]}
        />
        <DocCompareGrid
          columns={[
            {
              heading: "Miss",
              tone: "negative",
              items: ['"I see you moved the rook and I am processing that this matters."'],
            },
            {
              heading: "Target",
              tone: "positive",
              items: [
                '"You just killed my bishop. Like actually killed him. Are these pieces alive?"',
              ],
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "state-range",
    title: "State Range And Crash-Out",
    body: (
      <>
        <P>
          A tuned member leaves the neutral lane. Across one pass it should reach each of these when
          the transcript earns it; attraction is never the default. The judge owns final early-end
          filing, but the performer must be allowed to produce the spoken break. Dealbreaker
          fire-shapes are authored in{" "}
          <DocLink to="/docs/product/voice-authoring#dealbreaker-fire-shapes">
            Member voice: authoring
          </DocLink>
          .
        </P>
        <DocList
          items={[
            "Neutral: ordinary back-and-forth, curiosity, boredom, dry answers, careful distance.",
            "Warm or flirty: attraction through the member's own engine, not generic complimenting.",
            "Confused or guarded: shorter lines, clarifying questions, a narrower topic, visible uncertainty.",
            "Angry or crashing out: named trigger, cadence shift, boundary, refusal, clean close. Sounds like the member, not a policy report.",
            "Early end: can stop participating, leave the table, or make the date impossible to continue.",
          ]}
        />
      </>
    ),
  },
  {
    id: "partner",
    title: "Partner Exit Bars",
    body: (
      <>
        <P>
          The partner candidate inherits every{" "}
          <DocLink to="/docs/product/voice-requirements#spoken-invariants">
            spoken-surface invariant
          </DocLink>
          . In a tuning session the tuner usually plays the partner, so play it to create pressure
          and openings, not to win the scene or feed the performer its lines.
        </P>
        <DocList
          items={[
            "Springboards the performer: hands a real question, a genuine pressure, or a usable opening.",
            "No quote-backs: does not repeat the performer's line back at them as engagement.",
            'No AI-isms ("I love that for you") and no emotional info-dump that pivots out on "anyway".',
            "Stays a person, not a stress-test rig: the partner can warm, cool, or bail like a real date.",
          ]}
        />
      </>
    ),
  },
  {
    id: "judge",
    title: "Judge Exit Bars",
    body: (
      <>
        <P>
          The judge is a player-facing voice surface (its summary and notable moments reach the
          player) and the scoring contract. The numeric contract is owned by the judge schema in{" "}
          <DocCode>date-prompts.ts</DocCode> and <DocCode>app/domain/game.ts</DocCode>.
        </P>
        <DocList
          items={[
            "playerSummary: one short Cupid-corporate sentence anchored in a concrete scene detail; agency verbs only when the transcript shows the move; no therapy-speak, consulting jargon, or AI slop. [AUTO: checkCupidCorporateCopy]",
            "notableMoments: one to three short strings anchored in the scene, banned phrases stripped. [AUTO]",
            "No hidden labels, species, origin, dimension, reality status, raw stats, or fixture phrasing in any player-facing judge string. [AUTO]",
            "Scores the right thing: Date Health is the room; each member mood is that member's own affect; spark and chemistry only for visible attraction; conflict rises on friction; do not buy back a negative mood with spark because the partner was charming. [JUDGMENT]",
            "JSON only, no em dashes. [AUTO]",
          ]}
        />
        <DocTable
          headers={["Judge field", "Bound"]}
          rows={[
            ["dateHealthDelta", "integer, -18 to 14"],
            ["evidenceVector (9 dimensions)", "each integer, -8 to 8, none omitted"],
            [
              "statDeltas (chemistry, trust, stability, conflict, weirdnessTolerance, spark)",
              "each integer, -8 to 8",
            ],
            ["memberMoodDeltas (exactly both participants)", "each integer, -8 to 8"],
            ["usedEvidenceIds", "0 to 3, from the reveal-candidate list only"],
            ["agreementCandidates / openLoopCandidates", "at most 2 each, plain visible text"],
          ]}
        />
        <P>
          Severity guidance the judge follows: -1 to -3 for mild drift, -4 to -7 for visible
          confusion or cooling, -8 to -18 for boundary pressure, contempt, panic, hard mismatch, or
          a failed repair.
        </P>
      </>
    ),
  },
  {
    id: "nudges-events",
    title: "Nudges And Date Events",
    body: (
      <>
        <DocSubsection id="nudge-bars" title="Nudge">
          <DocList
            items={[
              "A nudge is private Cupid coaching, not a table line. The performer bends behavior toward it but never reads it aloud or answers it as a message.",
              "A nudge expires after the target speaks; it steers exactly one turn.",
              "JUDGMENT: the nudged reply changes the move, it does not quote or paraphrase the coaching note.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="event-bars" title="Date Events And Set-Pieces">
          <P>
            An event injects a beat into the scene. The next reply must visibly engage with it, not
            glide past. The event kinds and director suffixes are owned by{" "}
            <DocLink to="/docs/product/voice-prompts#scenario-event-kinds">
              runtime voice surfaces
            </DocLink>
            .
          </P>
          <DocList
            items={[
              "Ambient: let it color the next beat even if the member does not name it directly.",
              "Provocation: register and react to the physical interruption before resuming.",
              "Reveal: engage from what the member already knows about itself or the pair, never invented biography.",
              "Consequences stay local to the room; no offstage third speaker becomes ongoing dialogue.",
              "Treat a prior committed move as a present-tense result, not a thing to re-narrate.",
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "nudge-bars", title: "Nudge" },
      { id: "event-bars", title: "Date Events And Set-Pieces" },
    ],
  },
  {
    id: "exit-gate",
    title: "The Exit Gate",
    body: (
      <DocCallout variant="ok" title="A voice clears tuning when">
        <DocList
          items={[
            <span key="auto">
              <Strong>The automated sweep is green.</Strong> <DocCode>vp run audit:dates</DocCode>{" "}
              passes for the member's pairs and scenarios: sanitizer, safe-copy, hidden-info,
              markup, length, dedup, judge JSON, and no engine stall.
            </span>,
            <span key="range">
              <Strong>The state range holds in one pass.</Strong> A warm beat, a cooling or confused
              beat, and a crash-out that sounds like the member, each earned by the transcript.
            </span>,
            <span key="pressure">
              <Strong>Pressure produces a choice.</Strong> At least one pressure or set-piece scene
              where the member makes or refuses a concrete move instead of narrating or explaining.
            </span>,
            <span key="implication">
              <Strong>Implication holds.</Strong> No announce, repeat, or acknowledge lines
              survived, and the partner's moves were used as springboards.
            </span>,
            <span key="ratio">
              <Strong>The talk ratio reads as this member,</Strong> not generic chatty.
            </span>,
            <span key="judge">
              <Strong>The judge files in voice.</Strong> The player summary is concrete and
              in-voice, and the numeric movement matches what visibly happened.
            </span>,
            <span key="surface">
              <Strong>Every fix landed on the smallest authored surface.</Strong> Any guard retry
              has a fixture fix behind it, and the best new lines are in the sample banks.
            </span>,
          ]}
        />
      </DocCallout>
    ),
  },
];

export default function VoiceRequirementsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
