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
    <DocLink to="/docs/product/voice-authoring">Member voice: authoring</DocLink>; runtime prompt
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
          compression, interruption, ignored setup, abrupt sincerity, teasing, concrete asks,
          implication over narration, and thread-ending. Use them to tune the ear, not to mine
          lines.
        </P>
        <DocSubsection id="imessage-corpus" title="iMessage And Texting Corpus">
          <P>
            A private, local rhythm reference generated with{" "}
            <DocCode>scripts/voice-tuning/imessage-corpus.py</DocCode> on MacBook runs. The derived,
            abstracted mechanics and the cross-corpus findings live in{" "}
            <DocLink to="/docs/product/voice-references#imessage-texting-corpora">
              iMessage and texting corpora
            </DocLink>{" "}
            below; these are the handling rules.
          </P>
          <DocList
            items={[
              "Use only when the corpus is locally available to the agent and relevant to the voice problem.",
              "Keep raw exports ignored. Do not commit private messages, screenshots, sender names, phone numbers, private facts, or quote banks.",
              "Sample narrowly: enough adjacent turns to understand response shape, not a full archive sweep. The script's --summary flag reports aggregate length and tic stats with no message bodies.",
              "Turn durable lessons into abstracted mechanics in this doc or the member fixture's own terms, never a copied quote bank.",
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
        <DocSubsection id="date-scenario-natural-dialogue" title="Date Scenario Reference">
          <P>
            The committed <DocCode>docs/reference/voice-date-scenarios.md</DocCode> file is the
            companion reference for implication over narration: performers attempt a bit without
            saying the whole part, hand the finish to each other, and co-author a scene under
            pressure. Reach for it when a member announces, repeats, or acknowledges what just
            happened instead of treating it as already visible and moving on. It pairs with the
            Northernlion file and is especially useful for pressure dates and for grounded-human
            with otherworldly-member pairings.
          </P>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "imessage-corpus", title: "iMessage And Texting Corpus" },
      { id: "northernlion-natural-dialogue", title: "Northernlion Reference" },
      { id: "date-scenario-natural-dialogue", title: "Date Scenario Reference" },
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
    id: "date-scenario-dialogue",
    title: "Date Scenario Dialogue",
    body: (
      <>
        <DocSubsection id="date-scenario-use-for" title="Use For">
          <P>
            The curated corpus lives at <DocCode>docs/reference/voice-date-scenarios.md</DocCode>:
            three short performed date scenes, one that goes well, one that crashes out, and a run
            of rapid getting-to-know-you bits. Use it as the antidote to narratory dialogue. The
            core lesson is that two people write a scene together by implying what happens between
            the lines instead of announcing, repeating, or acknowledging it. Reach for it on
            pressure dates, on pairings of a grounded human with an otherworldly or off-kilter
            member, and whenever a member needs to feel the difference between yapping and staying
            quiet. It is not a house style.
          </P>
        </DocSubsection>
        <DocSubsection id="date-scenario-mechanics" title="Transferable Mechanics">
          <DocList
            items={[
              "Imply, do not narrate. Drinks arriving, an order being overridden, a misheard line smoothed over, a whole story skipped: none of it is stated. The next line treats it as already visible and moves. Cut any beat that announces an action, repeats the prior line, or acknowledges the obvious.",
              'Hand the bit off instead of finishing it solo. One performer floats a setup and stops short, and the partner\'s reaction or a single sound completes it. "And I sliced her dad." / "You what?" / "I sort of..." lands because the verb is never said and the partner opens the gap.',
              "The partner's last line is the springboard. Escalation is procedural, not random: each line builds on the previous bad or tender premise, so the exchange reads as co-authored rather than two prepared monologues colliding.",
              "Redirect by rebuilding, not by restating. The warm partner takes a self-attacking spiral and reframes it as a virtue without echoing it back. The reframe is the move; there is no preamble that repeats the partner's words back to them.",
              "A dodge can carry more than an answer. A flat name correction, a one-word button, or a refusal implies the unspoken thing and keeps pressure in the subtext instead of stating it.",
              "Quiet is load-bearing, not passive. The terse side punctures, redirects, or exits in a few words while the other takes the long spiraling turns. Talk ratio is a tuning dial per member, not a default to make everyone chatty.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="date-scenario-boundaries" title="Do Not Transfer">
          <DocList
            tone="muted"
            items={[
              "Do not copy the scenes' jokes, names, premises, or brands into a member. This is a cadence and structure reference, not a character source.",
              "Do not read the crash-out as license for menace. The sketch escalates into hostility for laughs; members stay bounded by dealbreakers and hard stops. Borrow the implication mechanic, not the cruelty.",
              "Implication is not incoherence. The gap must be inferable by the partner. A member dropping unparseable non-sequiturs and calling it subtext is the failure mode, not the goal.",
              "Do not write the bracketed sound gag into a member. The reference annotates a non-verbal beat as (slicing noise); a fixture conveys the same beat through spoken implication, never a stage direction.",
              "Do not flatten every member to one talk style. Match the yap-to-quiet ratio to the authored member instead of making everyone spiral or everyone clipped.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="date-scenario-date-translation" title="Date Translation">
          <DocList
            items={[
              "Delete the narration. Cut lines where a member states what it is doing, repeats what was just said, or acknowledges the obvious, then let the following line imply the move.",
              "Hand off the back half. A member can start a bit and leave the finish to the partner's reaction; do not complete your own joke if the partner's confusion completes it better.",
              "Build the shared scene. Treat the partner's last line as the springboard and escalate off it rather than performing a pre-written set at them.",
              "Keep pressure in the subtext. On high-pressure frames use dodges, overrides, and terse buttons; never have a member say the pressure out loud.",
              "For human-with-otherworldly pairings, let the strange member act on its own internal logic and let the grounded partner's real-time reaction carry the exposition. Neither explains the world outright.",
              "Tune the talk ratio per member. Give a yapper long spiraling turns and a quiet member fewer words that still redirect or land the deadpan. Quiet is not silent.",
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "date-scenario-use-for", title: "Use For" },
      { id: "date-scenario-mechanics", title: "Transferable Mechanics" },
      { id: "date-scenario-boundaries", title: "Do Not Transfer" },
      { id: "date-scenario-date-translation", title: "Date Translation" },
    ],
  },
  {
    id: "imessage-texting-corpora",
    title: "iMessage And Texting Corpora",
    body: (
      <>
        <DocSubsection id="imessage-use-for" title="Use For">
          <P>
            A private, MacBook-only rhythm source generated with{" "}
            <DocCode>scripts/voice-tuning/imessage-corpus.py</DocCode> and kept in ignored working
            output. Use it for members modeled on a real texter, or for any casual,
            chronically-online, deadpan, or warm-but-indirect performer whose comedy runs on
            compression, register collision, and collaborative riffing. The durable output is
            abstracted mechanics, never the raw thread. It is not a house style.
          </P>
        </DocSubsection>
        <DocSubsection id="imessage-mechanics" title="Transferable Mechanics">
          <P>
            Cross-corpus shapes that held across sampled threads. Where a shape already has a home,
            author it there: the{" "}
            <DocLink to="/docs/product/voice-patterns#performance-mechanics">
              performance mechanics
            </DocLink>{" "}
            catalog owns the named mechanics, and the{" "}
            <DocLink to="/docs/product/voice-requirements#spoken-dialogue">spoken dialogue</DocLink>{" "}
            grid owns what survives the typed-to-spoken jump.
          </P>
          <DocList
            items={[
              "Short-beat cascade is the dominant rhythm: a single thought arrives as a run of short consecutive beats (setup, turn, button), each beat one unit. This is why casual texting runs short. Across sampled corpora the median message ran about 22-25 characters, with 29-43% under 20 characters.",
              "The long-message minority is a distinct mode, not a longer beat. The 20-26% of messages over 40 characters are usually a spiral, a full plan, or a creative dump, tonally marked off from the short-beat default rather than the default stretched out.",
              "Mock-formal register collision: bureaucratic, legal, ceremonial, or grandiose diction applied to low-stakes content like a bar plan, an ETA, or a snack run. The register-content mismatch carries the joke while the underlying offer stays sincere.",
              "Collaborative escalation: the partner's last line is the springboard and both sides add beats to a shared premise, often with tag-question hand-backs (..., no? / ..., right?) that return the turn. The riff is co-authored, not a solo set performed at the partner. See commit-and-escalate in the catalog.",
              "Reference and metaphor as compressed shorthand: one cultural, sports, or game frame per turn, dropped without explanation, the partner trusted to decode it.",
              "Deadpan with no cushion: a flat non-sequitur or absurd claim delivered straight, with no laugh-tag softening it. The flat delivery is the joke.",
              "One un-ironic anchor: a bit-heavy texter usually keeps a single subject where the irony drops and they are plainly earnest. That contrast is what keeps constant riffing from reading as pure performance; it is the casual-baseline contrast in practice.",
              "Sincere and admin mode goes short and flat: real logistics, real feeling, and refusals are terse and plain, often one or two words. Dropping out of the bit is itself legible.",
              "Limits keep the table open: a no tends to arrive paired with a smaller version of the same plan. It reads as an offer, not a status move.",
              "Tic vocabulary is sparse against volume: signature words landed roughly once every couple dozen messages and vowel-elongation in only a few percent, not every line. This is empirical backing for treating tics as seasoning, not a schedule.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="imessage-boundaries" title="Do Not Transfer">
          <P>
            The typed-to-spoken boundary — laugh-tags, one-word reaction bubbles, shorthand,
            all-caps streaks, and literal multi-bubble cascades — is owned by the{" "}
            <DocLink to="/docs/product/voice-requirements#spoken-dialogue">spoken dialogue</DocLink>{" "}
            grid. The reminder specific to a private corpus: never carry real names, places,
            employers, links, or the source person&apos;s actual jokes, opinions, and biography into
            a member. The corpus is a speech-pattern source, not a character source, unless the user
            says otherwise.
          </P>
        </DocSubsection>
        <DocSubsection id="imessage-date-translation" title="Date Translation">
          <DocList
            items={[
              "Short-beat cascade becomes short spoken declaratives, one thought per breath, comma-flow where it is natural. Not staccato fragments and not one long paragraph.",
              "Long mode is reserved for a spiral the member's fixture actually licenses. At the table, take one branch per turn, not the whole wall.",
              "Keep the mock-formal collision, but anchor it to the table: the menu, the venue, the date itself, or the partner's last line.",
              "Treat the partner's line as the springboard and build on it. Do not perform a pre-written bit at them.",
              "Let sincere mode go plain and short. The drop out of the bit is the signal, so do not dress it back up.",
              "Spoken baseline is plain English. Let signature words season rather than pace, and leave the shorthand on the phone.",
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "imessage-use-for", title: "Use For" },
      { id: "imessage-mechanics", title: "Transferable Mechanics" },
      { id: "imessage-boundaries", title: "Do Not Transfer" },
      { id: "imessage-date-translation", title: "Date Translation" },
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
            {
              term: "Date scenario dialogue",
              def: (
                <>
                  <DocCode>docs/reference/voice-date-scenarios.md</DocCode>. Performed date scenes
                  for implication over narration, handed-off bits, and yap-versus-quiet talk ratio.
                </>
              ),
            },
            {
              term: "iMessage and texting corpora",
              def: (
                <>
                  Generated locally with <DocCode>scripts/voice-tuning/imessage-corpus.py</DocCode>{" "}
                  into ignored working output. The raw threads are private and never committed; the
                  durable artifact is the abstracted mechanics above.
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
