import {
  DocCallout,
  DocCode,
  DocDefList,
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
  slug: "product/voice-references",
  group: "product",
  title: "Voice source references",
  description:
    "Commit-safe derived notes from external voice references, corpora, and bit compilations used to inform member authoring.",
  order: 3.5,
};

export const lede = (
  <>
    This is the durable place for source-informed voice references. Curated reference files live
    under <DocCode>docs/reference/</DocCode>; raw private exports stay ignored. Fixture authoring
    rules still live in{" "}
    <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink>; runtime prompt
    behavior still lives in{" "}
    <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink>. Turning source notes
    into prompt-visible guidance should follow{" "}
    <DocLink to="/docs/product/prompt-authoring">Prompt authoring guidance</DocLink>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "storage-policy",
    title: "Storage Policy",
    body: (
      <>
        <DocCallout variant="warn" title="Curate before commit">
          Commit durable reference material, not scraper output. Public source references must be
          cleaned, scoped, and useful for authoring. Private messages, raw subtitle dumps, temporary
          transcript exports, and unreviewed quote banks stay in ignored working output.
        </DocCallout>
        <DocDefList
          items={[
            {
              term: "Raw export",
              def: (
                <>
                  Local source text used for analysis. Examples: <DocCode>thread.tsv</DocCode>,
                  subtitle dumps, pasted compilation transcripts, and target-only exports. These
                  stay ignored.
                </>
              ),
            },
            {
              term: "Curated reference",
              def: (
                <>
                  A reviewed file under <DocCode>docs/reference/</DocCode> that keeps only useful
                  source chunks or derived notes for future voice work.
                </>
              ),
            },
            {
              term: "Fixture translation",
              def: "The specific way a source pattern becomes spoken date dialogue inside an IDC member, stripped of source biography unless the character independently owns it.",
            },
          ]}
        />
        <DocList
          items={[
            <span key="raw">
              Keep generated personal corpora and unreviewed raw exports in{" "}
              <DocCode>.claude-tmp/</DocCode> or another ignored location.
            </span>,
            "On MacBook runs, local iMessage or texting corpora may be used as private rhythm references when available. Read only the minimum sample needed for the tuning question.",
            "Do not preserve roadmap audit diaries as source archives.",
            "Do not copy long source passages into member fixtures or runtime prompts.",
            "When the source is a real person or a private corpus, document speech mechanics and performance structure, not private biography, private facts, names, or copied jokes.",
          ]}
        />
      </>
    ),
  },
  {
    id: "entry-shape",
    title: "Entry Shape",
    body: (
      <>
        <P>Each reference entry should answer the same questions so future members can reuse it.</P>
        <DocList
          items={[
            <span key="use">
              <Strong>Use for:</Strong> the member types or comedy engines this source can inform.
            </span>,
            <span key="patterns">
              <Strong>Transferable mechanics:</Strong> rhythm, setup shape, response posture,
              escalation logic, and sincere-mode shift.
            </span>,
            <span key="boundaries">
              <Strong>Do not transfer:</Strong> medium artifacts, source-specific biography,
              parasocial framing, names, live-platform context, and copied jokes.
            </span>,
            <span key="translation">
              <Strong>Date translation:</Strong> how to make the pattern sound like spoken table
              dialogue rather than a stream, post, or text thread.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "natural-dialogue-corpora",
    title: "Natural Dialogue Corpora",
    body: (
      <>
        <P>
          Natural-dialogue references help agents hear how people actually answer each other:
          compression, interruption, ignored setup, abrupt sincerity, teasing, concrete asks, and
          thread-ending. Use them to tune the ear, not to mine lines.
        </P>
        <DocSubsection id="imessage-corpus" title="iMessage And Texting Corpus">
          <DocList
            items={[
              "Use only when the corpus is locally available to the agent and relevant to the voice problem.",
              "Keep raw exports ignored. Do not commit private messages, screenshots, sender names, phone numbers, private facts, or quote banks.",
              "Sample narrowly: enough adjacent turns to understand response shape, not a full archive sweep.",
              "Translate medium-specific behavior into spoken table dialogue. Keep directness, compression, rhythm, and repair moves; drop shorthand, message-app artifacts, private references, and copied wording.",
              "If a durable lesson is useful, write it as a derived mechanic in this doc or the member fixture's own terms.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="northernlion-natural-dialogue" title="Northernlion Reference">
          <P>
            The committed <DocCode>docs/reference/voice-northernlion.md</DocCode> file is the safe
            public reference for riffing, correction, premise escalation, concrete digression, and
            bit recovery. It is especially useful when a member should sound like a person thinking
            aloud instead of a profile executing a checklist.
          </P>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "imessage-corpus", title: "iMessage And Texting Corpus" },
      { id: "northernlion-natural-dialogue", title: "Northernlion Reference" },
    ],
  },
  {
    id: "northernlion-bit-compilations",
    title: "Northernlion Bit Compilations",
    body: (
      <>
        <DocSubsection id="northernlion-use-for" title="Use For">
          <P>
            The curated corpus lives at <DocCode>docs/reference/voice-northernlion.md</DocCode>. Use
            it for members whose comedy comes from fast premise mutation, mock-formal logic applied
            to low-stakes nonsense, and conversational self-correction that becomes part of the bit.
            It is useful for streamer-adjacent, overthinking, argumentative, or spreadsheet-brain
            performers. It is not a house style.
          </P>
        </DocSubsection>
        <DocSubsection id="northernlion-mechanics" title="Transferable Mechanics">
          <DocList
            items={[
              "Premise turns are treated like arguments with fake rigor. The funny move is the amount of structure spent on a tiny claim.",
              "The speaker often states a position, qualifies it, notices the qualification is stranger than the position, and follows the stranger branch.",
              "Confidence and correction coexist. A line can sound certain while it is visibly revising itself.",
              "Recurring bits work because the speaker remembers the frame and lets new mundane evidence contaminate it.",
              "The escalation is usually procedural, not random: define a category, find an exception, litigate the exception, then land on an unexpectedly personal or petty conclusion.",
              "Sincere mode does not become sentimental. It gets plainer, shorter, and more specific, then the performer usually re-enters the bit through a smaller aside.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="northernlion-boundaries" title="Do Not Transfer">
          <DocList
            tone="muted"
            items={[
              "Do not copy stream, chat, YouTube, game run, subscriber, or comment-section context into a member unless that member owns an in-world analogue.",
              "Do not write direct audience address. IDC dates are two people at a table, not a performer filling dead air for viewers.",
              "Do not copy jokes, catchphrases, named real people, or compilation-specific setups.",
              "Do not turn every member into debate cadence. The reference is for characters with authored performance engines that need this shape.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="northernlion-date-translation" title="Date Translation">
          <DocList
            items={[
              "Replace audience fill with partner-facing motion: answer, ask, redirect, admit, or sharpen.",
              "Keep the fake rigor, but anchor it in the table: menu, venue, shared silence, a date question, a case fact, or the partner's last line.",
              "For one bubble, pick one branch of the bit. Do not include the full stream-style chain unless the member's fixture explicitly supports long spirals.",
              "When adapting to a member, name the controlling engine in that member's own terms. For Brady this becomes bad-interviewer format pressure, not streamer cadence.",
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "northernlion-use-for", title: "Use For" },
      { id: "northernlion-mechanics", title: "Transferable Mechanics" },
      { id: "northernlion-boundaries", title: "Do Not Transfer" },
      { id: "northernlion-date-translation", title: "Date Translation" },
    ],
  },
  {
    id: "committed-reference-files",
    title: "Reference Files",
    body: (
      <>
        <DocDefList
          items={[
            {
              term: "Northernlion bit compilations",
              def: (
                <>
                  <DocCode>docs/reference/voice-northernlion.md</DocCode>. Curated public-source bit
                  chunks for cadence and performance mechanics.
                </>
              ),
            },
          ]}
        />
        <DocCallout variant="info">
          If a future reference starts as a raw source file, first clean it into a durable reference
          file or extract mechanics into this doc. Then leave the raw file ignored or delete it.
        </DocCallout>
      </>
    ),
  },
];

export default function VoiceReferencesDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
