import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice",
  group: "product",
  title: "Voice system",
  description:
    "The entry point for IDC voice work: agent tuning quickstart, house tone, register split, global prose rules, comedy boundaries, and ownership of deeper voice docs.",
  order: 0,
};

export const lede = (
  <>
    This is the voice map. It owns the house tone and points to the one doc that owns each deeper
    rule. Member fixture authoring lives in{" "}
    <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink>. Runtime prompt
    surfaces and model quirks live in{" "}
    <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink>. Curated external
    references live in{" "}
    <DocLink to="/docs/product/voice-references">Voice source references</DocLink>. Prompt-authoring
    rules for agents live in{" "}
    <DocLink to="/docs/product/prompt-authoring">Prompt authoring guidance</DocLink>. Gameplay data
    fields live in{" "}
    <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink>. Agents
    tuning one member should start at{" "}
    <DocLink to="/docs/product/voice#voice-tuning-quickstart">Voice tuning quickstart</DocLink>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "ownership-map",
    title: "Ownership Map",
    body: (
      <>
        <P>Use the docs this way. Do not duplicate the same rule in multiple places.</P>
        <DocList
          items={[
            <span key="tuning">
              <Strong>Voice tuning quickstart:</Strong> the agent entry point for one-member tuning
              passes. It tells the agent what to read, run, inspect, patch, and verify before
              opening the deeper docs.
            </span>,
            <span key="voice">
              <Strong>Voice system:</Strong> house tone, Cupid corporate voice, member voice
              baseline, global prose rules, prompt-provider distillation, and comedy boundaries.
            </span>,
            <span key="prompt-authoring">
              <Strong>Prompt authoring guidance:</Strong> provider-aligned prompt rules for any doc,
              fixture, workflow, or runtime surface that becomes model context.
            </span>,
            <span key="fingerprints">
              <Strong>Member voice authoring:</Strong> how to write <DocCode>voice</DocCode>,{" "}
              <DocCode>bio</DocCode>, sample banks, dealbreaker fire-shapes, and the spoken-dialogue
              contract for member fixtures.
            </span>,
            <span key="patterns">
              <Strong>Voice patterns:</Strong> two catalogs. The flavor gallery is the controlled
              catalog for <DocCode>patternsUsed</DocCode> and <DocCode>patternsRefused</DocCode>.
              The performance mechanics section is cross-turn cadence moves cited inside{" "}
              <DocCode>comedyMechanics</DocCode>.
            </span>,
            <span key="prompts">
              <Strong>Runtime voice surfaces:</Strong> dating profiles, opening messages, transcript
              prompts, Markdown rendering, Cupid reports, scenario event kinds, and recurring LLM
              quirks.
            </span>,
            <span key="references">
              <Strong>Voice source references:</Strong> curated source notes and corpus references
              under <DocCode>docs/reference/</DocCode> for future member voice work.
            </span>,
            <span key="fields">
              <Strong>Member fields and tags:</Strong> fixture fields, hidden tags, member request
              tags, player-knowledge boundaries, and schema-owned data rules.
            </span>,
            <span key="workflow">
              <Strong>Add a member:</Strong> ordered workflow for adding or heavily revising one
              member, including tune sessions and validation.
            </span>,
          ]}
        />
        <DocCallout variant="warn" title="No roadmap as archive">
          Finished roadmap plans are deleted after durable guidance moves into the owning docs. Do
          not preserve audit logs, per-member lock diaries, or transcript dumps in product docs.
        </DocCallout>
      </>
    ),
  },
  {
    id: "voice-tuning-quickstart",
    title: "Voice Tuning Quickstart",
    body: (
      <>
        <P>
          Use this section when an agent is asked to tune one member voice. Do not feed the full
          voice documentation stack into the model. Start with the narrow target, inspect live
          output, patch the smallest authored surface that teaches the failure, and rerun the same
          pressure.
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
              <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink>. Open{" "}
              <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink> only when the
              fixture cites a pattern or the miss is pattern drift,{" "}
              <DocLink to="/docs/product/voice-references">Voice source references</DocLink> to
              recalibrate natural rhythm before editing, and{" "}
              <DocLink to="/docs/product/prompt-authoring">Prompt authoring guidance</DocLink> when
              the fix would add prompt text, examples, negative rules, or agent instructions.
            </span>,
            <div key="start" className="flex flex-col gap-2">
              Start a live-like session with both focus flags so it mirrors gameplay: the focus
              member opens and their greeting bank fires, and the <DocCode>{"<focus>"}</DocCode>{" "}
              request block injects exactly as it would in a real date.
              <DocCodeBlock language="bash">{`vp run tune -- start <focus-id> --partner <warm-or-pressure-partner-id> --name <session-name> --focus-request <request-id> --focus-opens`}</DocCodeBlock>
            </div>,
            "Drive three to six focus-member turns. Include one warm receive, one ordinary follow-up, and one boundary or boredom pressure that should reveal drift.",
            "Judge the output against the tuning targets below. Treat pleasant generic output as a miss when it does not sound like the member.",
            "Patch the smallest correct surface: register for the controlling engine, comedyMechanics for cross-turn behavior, tics for syntax frequency, outputConstraints for member-specific failure modes, sampleMessages for attractors, or the runtime prompt only when multiple members fail the same way.",
            "Rerun the same transcript pressure before expanding scope. If the fix depends on a new rule, move that rule into the owning doc rather than repeating it in every fixture.",
          ]}
        />
        <DocSubsection id="tuning-targets" title="Tuning Targets">
          <DocList
            items={[
              "The member answers the latest partner move first. Voice colors the reply after the response is real.",
              "The member can move across neutral, warm or flirty, confused, guarded, angry, overwhelmed, and ready-to-leave states when the transcript earns it. Polite-neutral is not the default surface.",
              "The line is spoken at a table, not typed into a phone, unless the fixture explicitly earns the exception.",
              "The output performs the authored engine through behavior: protection, refusal, curiosity, pressure, attachment, status, or care. It does not recite traits.",
              "Concrete fixture facts appear only when the turn earns them. They do not become census receipt or hidden-field confession.",
              "The member can cool, refuse, get confused, or end pressure when the transcript supports it. Attraction is not the default.",
              "Brief receive slots become a character-specific reaction, answer, question, choice, refusal, or silence. If a line starts by announcing what the member noticed, convert the noticing into the actual reply it creates.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="state-range-and-crash-outs" title="State Range And Crash-Outs">
          <P>
            Every member needs enough authored pressure to leave the neutral lane. Tuning must test
            a normal receive, a warmer or flirtier receive, a confused or guarded receive, and a
            boundary-pressure receive. Members should be able to cool the room, get angry, crash
            out, or end the date early when their dealbreakers, comfort, mood, or scenario pressure
            support it.
          </P>
          <DocList
            items={[
              "Neutral: ordinary back-and-forth, curiosity, boredom, dry answers, or careful distance.",
              "Warm or flirty: attraction expressed through the member's own engine, not generic complimenting.",
              "Confused or guarded: shorter lines, clarifying questions, refusal to play along, visible uncertainty, or a narrower topic.",
              "Angry or crashing out: named trigger, cadence shift, boundary, refusal, or clean close. It should sound like the member, not like a policy report.",
              "Early end: the member can stop participating, leave the table, or make the date impossible to continue. The judge owns final early-end filing, but the performer must be allowed to produce the spoken break.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="tuning-balance" title="Tuning Balance">
          <P>
            Do not turn tuning into an effort loop that tries to remove every imperfect line. Model
            output is non-deterministic, and a single awkward acknowledgment, flat beat, or slightly
            generic turn is not automatically a fixture failure. The tuning question is whether the
            conversation repeatedly reads wrong for this member under the same pressure.
          </P>
          <DocList
            items={[
              "Fix conversation-level patterns: six turns that stay generic, a member who cannot get angry, repeated refusal to answer the latest move, or pressure scenes that never create consequences.",
              "Do not overfit one transcript. Rerun the same pressure and look for stable drift before adding new prompt text.",
              "Accept in-character variation. An acknowledgment can be fine when it sounds like the member and moves the exchange forward.",
              "Keep prompts smaller after each pass when possible. If a rule only exists to prevent one unlucky sample, delete or rewrite it as a positive target.",
              "Never fail, reject, or retry a generated member line because a string matched a disliked style pattern. Only actual generation or filing failures should block a turn.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="scenario-pressure-tuning" title="Scenario Pressure Tuning">
          <P>
            Voice tuning should cover at least one conversation room and one pressure, activity, or
            set-piece room. In conversation rooms, the venue should fall behind the people. In
            pressure rooms, actions can happen between spoken lines when a prior line committed to
            them or an event lands. The next member reacts to the result as present scene reality,
            but still speaks naturally.
          </P>
          <DocList
            items={[
              <span key="bad">
                <Strong>Miss:</Strong> "I see you moved the rook and I am processing that this
                matters."
              </span>,
              <span key="good">
                <Strong>Target:</Strong> "You just killed my bishop. Like actually killed him. Are
                these pieces alive?"
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "tuning-targets", title: "Tuning Targets" },
      { id: "state-range-and-crash-outs", title: "State Range And Crash-Outs" },
      { id: "tuning-balance", title: "Tuning Balance" },
      { id: "scenario-pressure-tuning", title: "Scenario Pressure Tuning" },
    ],
  },
  {
    id: "house-registers",
    title: "House Registers",
    body: (
      <>
        <P>
          IDC alternates between two registers. Most copy belongs to exactly one. Mixing them inside
          one line usually means the surface is confused.
        </P>
        <DocSubsection id="cupid-corporate" title="Cupid Corporate">
          <P>
            Used for dashboard chrome, goals, scenario cards, reports, intervention wrappers, error
            states, and closure copy.
          </P>
          <DocList
            items={[
              "Confident, dry, procedural. Workplace comedy under supernatural pressure.",
              "Short declarative sentences. Active voice. No mascot voice.",
              "Treat the absurd as routine and the routine as procedure.",
              "No exclamation points, emoji, or apology copy.",
              "KPI energy with the wrong noun: Match one ordinary human with one obviously non-human member.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="member-register" title="Member">
          <P>
            Used for dating profiles, sit-down openers, live date transcript lines, member requests,
            and member-authored memories.
          </P>
          <DocList
            items={[
              "Sincere first. The character is not in on the joke; the reader is.",
              "Specific neurosis delivered with conviction. Random absurdity is not enough.",
              "A natural response to the partner beats any authored tic or pattern.",
              "Run-ons, fragments, lowercase, and awkward pivots are allowed when the fixture earns them.",
              <span key="spoken">
                Spoken-dialogue constraints live in{" "}
                <DocLink to="/docs/product/voice-fingerprints#spoken-dialogue-contract">
                  Member voice authoring
                </DocLink>
                .
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "cupid-corporate", title: "Cupid Corporate" },
      { id: "member-register", title: "Member" },
    ],
  },
  {
    id: "global-prose-rules",
    title: "Global Prose Rules",
    body: (
      <>
        <P>These rules apply across authored copy unless a narrower doc says otherwise.</P>
        <DocList
          items={[
            "No em dashes or en dashes. Use commas, colons, parentheses, or separate sentences.",
            "Specific proper nouns beat generic categories when they are true to the character.",
            "Trust the reader. Do not explain the joke after the joke.",
            "No AI-slop words: delve, in essence, moreover, tapestry, intricate, myriad, plethora, unleash, robust filler, or not just X but also Y.",
            <span key="markdown">
              Member Markdown is optional spoken typography. The allowed subset lives in{" "}
              <DocLink to="/docs/product/voice-prompts#member-markdown-subset">
                Runtime voice surfaces
              </DocLink>
              .
            </span>,
            <span key="fixtures">
              Fixture-level invariants for member voice live in{" "}
              <DocLink to="/docs/product/voice-fingerprints#output-invariants">
                Member voice authoring
              </DocLink>
              .
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "what-this-tone-is-not",
    title: "Not This",
    body: (
      <DocCallout variant="danger">
        <DocList
          items={[
            "Not snarky. No Marvel quips, Twitter dunks, or well-that-happened energy.",
            "Not random. Every absurd line should map to control, attachment, ego, loneliness, status, body, mortality, or fear of not being loved.",
            "Not cruel. The members are embarrassing and sincere; the reader should want them to land.",
            "Not winking. Characters do not perform awareness of the joke.",
            "Not generic horny voice. Yearning is welcome when it is character-specific.",
            "Not Reddit or Twitter cadence as house style. A specific member may earn it; IDC does not default to it.",
          ]}
        />
      </DocCallout>
    ),
  },
  {
    id: "when-comedy-stops",
    title: "Comedy Stops",
    body: (
      <DocCallout variant="danger" title="Do not make harm the punchline">
        <DocList
          items={[
            "Real-world tragedy, war, violence, abuse, harassment, coercion, suicide, and self-harm are never punchlines.",
            "Mental illness as a category is not the joke. Specific recognizable coping patterns can be funny when the character stays human.",
            "Identity categories are not the joke. Individual specificity is.",
            "If a premise touches grief, exile, death, or displacement, the character's coping texture can be funny. The loss is real.",
          ]}
        />
      </DocCallout>
    ),
  },
  {
    id: "closure-summary-voice",
    title: "Closure Copy",
    body: (
      <>
        <P>
          Closure summaries are filed by <DocCode>generateClosureSummary</DocCode> when a pair is
          closed. They use Cupid corporate voice, not either member's voice.
        </P>
        <DocList
          items={[
            "Two to four sentences.",
            "Warm, specific, professional. Anchor in one to three shared moments from filed history.",
            "No exact stats, raw percentages, Date Health, Spark, Strain, or Relationship Health values.",
            "No victory lap. The pair leaves on their own terms.",
            "No em dashes, AI-slop words, or sentimental chapter/journey phrasing.",
          ]}
        />
      </>
    ),
  },
];

export default function VoiceDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
