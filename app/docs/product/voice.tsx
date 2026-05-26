import {
  DocCallout,
  DocCode,
  DocLink,
  DocList,
  DocPage,
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
    "The map for IDC voice docs: house tone, register split, global prose rules, comedy boundaries, and where member authoring and runtime prompt rules live.",
  order: 0,
};

export const lede = (
  <>
    This is the voice map. It owns the house tone and points to the one doc that owns each deeper
    rule. Member fixture authoring lives in{" "}
    <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink>. Runtime prompt
    surfaces and model quirks live in{" "}
    <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink>. Gameplay data fields
    live in <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink>.
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
            <span key="voice">
              <Strong>Voice system:</Strong> house tone, Cupid corporate voice, member voice
              baseline, global prose rules, and comedy boundaries.
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
              "Member voice is spoken at a table, not texted into a phone. The full contract lives in Member voice authoring.",
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
            "No stage directions in member speech. Member bubbles are dialogue, not theater scripts.",
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
