import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
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
import type { RoadmapPlanMeta } from "../../services/roadmap-content";

const slug = "roadmap/member-message-markdown";

export const meta: DocMeta = {
  slug,
  group: "roadmap",
  title: "Member message Markdown",
  description:
    "Constrain and render member response Markdown so long live-date transcripts gain rhythm without becoming layout soup.",
  order: 13,
};

export const plan: RoadmapPlanMeta = {
  status: "ready",
  opened: "2026-05-20",
  touched: "2026-05-20",
  owner: "unassigned",
  tldr: "Replace plain member bubble text with a hardened, tiny Markdown subset for emphasis, line rhythm, and rare shout beats while keeping member speech bounded by voice rules and single-chunk delivery.",
  tasks: 10,
  done: 0,
  tags: ["voice", "ui", "ai-output"],
};

export const lede = (
  <>
    Live-date member replies are currently plain text. This plan scopes a small renderer and prompt
    contract change so member speech can use a few typographic moves without turning every date into
    a document editor wearing a trench coat.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "context",
    title: "Context",
    body: (
      <>
        <RoadmapPlanHeader slug={slug} plan={plan} />
        <P>
          The current implementation is intentionally plain.{" "}
          <RoadmapFileRef path="app/services/date-prompts.ts" line={387} /> tells performers{" "}
          <DocCode>Plain text only. No markdown</DocCode>,{" "}
          <RoadmapFileRef path="app/components/date-view-chat-stream.tsx" line={264} /> renders
          member text directly inside one paragraph, and{" "}
          <RoadmapFileRef path="app/services/ai-date-engine.ts" line={2079} /> collapses whitespace
          in <DocCode>sanitizeCharacterText</DocCode>. That keeps output safe, but it also makes
          longer conversations visually uniform.
        </P>
        <P>
          The live stream is not token streaming today.{" "}
          <RoadmapFileRef path="app/services/ai-date-engine.ts" line={1434} /> passes{" "}
          <DocCode>onTextDelta: () =&gt; undefined</DocCode> to the provider, then{" "}
          <RoadmapFileRef path="app/services/ai-date-engine.ts" line={1018} /> emits one sanitized{" "}
          <DocCode>characterDelta</DocCode> followed by <DocCode>characterDone</DocCode>. This plan
          keeps that single-chunk reveal. True partial Markdown streaming is a separate feature.
        </P>
        <P>
          The goal is not general Markdown. The goal is expressive speech typography: a quiet italic
          phrase, a hard bold term, a deliberate line break, or a rare shout beat when the character
          earns it. The rendered bubble should still feel like a message from a person at the table,
          not a note, post, dossier, slide, or system artifact.
        </P>
        <DocCallout variant="warn" title="Implementation gate">
          This plan is ready for scoped code work. Before implementation starts, move the roadmap
          status to <Strong>in-flight</Strong>. Keep durable behavior rules in product docs before
          marking this plan <Strong>review</Strong> or <Strong>shipped</Strong>.
        </DocCallout>
      </>
    ),
  },
  {
    id: "creative-contract",
    title: "Creative contract",
    body: (
      <>
        <P>
          Visual thesis: member text should read like live speech under pressure, with occasional
          typographic stress marks that break the scroll pattern without stealing authority from the
          member bubble, portrait, or Cupid filing surfaces.
        </P>
        <P>
          Interaction thesis: empty drafts keep the existing typing dots. Finished text appears as
          one cleaned chunk. The brief nonempty draft state may show a bubble-owned caret, but the
          caret must sit outside the Markdown block tree so headings and paragraph breaks do not
          need special inline surgery.
        </P>
        <DocDefList
          items={[
            {
              term: "Inline emphasis",
              def: (
                <>
                  Allow <DocCode>*italic*</DocCode> and <DocCode>**strong**</DocCode>. Italic text
                  is spoken wording only, such as a private stress on one phrase. It is never a
                  stage direction. A whole italic span like <DocCode>*sighs*</DocCode>,{" "}
                  <DocCode>*looks away*</DocCode>, or <DocCode>*pauses*</DocCode> is markup abuse.
                  Strong text is for a named term, threat, correction, or punch line, not for every
                  emotional word.
                </>
              ),
            },
            {
              term: "Line rhythm",
              def: (
                <>
                  Preserve intentional single line breaks and short paragraphs. Cap a member reply
                  at three visible blocks after cleanup so one turn cannot become a monologue stack.
                </>
              ),
            },
            {
              term: "Heading beat",
              def: (
                <>
                  Accept Markdown heading syntax only as a one-line spoken outburst. All accepted
                  heading levels map to the same bubble-local <DocCode>{"<p>"}</DocCode> element,
                  not page headings. The renderer does not transform case. The prompt may show
                  all-caps examples, but the writer owns the casing.
                </>
              ),
            },
            {
              term: "Rejected shapes",
              def: (
                <>
                  Ban <DocCode>ul</DocCode>, <DocCode>ol</DocCode>, and <DocCode>li</DocCode>. Lists
                  make date speech read like a task panel. Also ban links, images, raw HTML, tables,
                  code fences, Mermaid, math, footnotes, blockquotes, and task syntax.
                </>
              ),
            },
          ]}
        />
        <DocCodeBlock language="markdown">{`This is *quieter* than I meant to sound.

**No.** Ask it properly.

# FOG MACHINE OFF.

The silence is doing a lot of work.
Let it.`}</DocCodeBlock>
      </>
    ),
  },
  {
    id: "scope",
    title: "Scope",
    body: (
      <>
        <DocList
          items={[
            <span key="member-only">
              Render Markdown only for <DocCode>character</DocCode> messages in live-date member
              bubbles and player-visible playground surfaces that show member speech. Scenario,
              Cupid, judge, system, support, setup copy, member requests, and final report copy stay
              plain React text unless a separate owner doc says otherwise.
            </span>,
            <span key="cupid-guard">
              Do not extend this renderer to <DocCode>cupid</DocCode> messages.{" "}
              <RoadmapFileRef path="app/components/date-view-transcript.ts" line={202} /> relies on
              exact intervention text matching through{" "}
              <DocCode>formatCupidInterventionText</DocCode>.
            </span>,
            <span key="saved-text">
              Persist the cleaned Markdown source string in <DocCode>DateMessage.text</DocCode>,
              never rendered HTML. Plain text with no Markdown markers renders as before. No save
              migration is planned, but implementation must scan fixtures and test saves for legacy
              marker collisions and document any accepted cosmetic drift.
            </span>,
            <span key="renderer">
              Use <DocLink to="https://github.com/vercel/streamdown">Streamdown</DocLink> if package
              review confirms it can be hardened for untrusted AI output and styled with the
              existing Tailwind v4 pipeline. If Streamdown fails review, use{" "}
              <DocCode>react-markdown</DocCode> without GFM plugins as the fallback. The allowed
              node set and hardening rules stay identical either way.
            </span>,
            <span key="docs">
              Move durable rules to{" "}
              <DocLink to="/docs/product/voice-prompts">Voice in prompts and surfaces</DocLink> and{" "}
              <DocLink to="/docs/product/visual-design#per-member-chat-bubbles">
                Visual design, Per-member chat bubbles
              </DocLink>
              . Keep this roadmap as the temporary execution plan.
            </span>,
          ]}
        />
        <DocCallout variant="danger" title="No hidden channel">
          Markdown is presentation only. It cannot carry hidden facts, gameplay effects, tool
          commands, memory metadata, or out-of-band instructions. Runtime AI still speaks inside the
          same app-owned state boundary.
        </DocCallout>
      </>
    ),
  },
  {
    id: "implementation-contract",
    title: "Implementation contract",
    body: (
      <>
        <DocDefList
          items={[
            {
              term: "Caret and reveal",
              def: (
                <>
                  Do not re-enable provider token streaming in this plan. Keep thinking dots for
                  empty drafts. For the short nonempty draft state, either wait for{" "}
                  <DocCode>characterDone</DocCode> before rendering rich text or draw a bubble-owned
                  caret at the lower trailing edge of the bubble with absolute positioning. Do not
                  append an inline caret to the final Markdown child.
                </>
              ),
            },
            {
              term: "Sanitization split",
              def: (
                <>
                  Add a character-dialogue Markdown cleanup path instead of changing narrative
                  scrubbing globally. Keep <DocCode>scrubPlayerSafeCopy</DocCode> newline-collapsed
                  for memories, judge filings, notes, and other narrative surfaces. For character
                  text, preserve <DocCode>{"\\n"}</DocCode>, collapse horizontal whitespace with a
                  newline-aware expression such as <DocCode>{String.raw`[^\S\n]+`}</DocCode>, cap
                  blank lines to one, strip action narration per line, and cap visible blocks after
                  unsupported Markdown is removed or escaped.
                </>
              ),
            },
            {
              term: "Guard projection",
              def: (
                <>
                  Add a plain-speech projection helper for safety and quality checks. Hidden-info
                  leak detection, venue monologue detection, repetition guards, approval-phrase
                  guards, and audit evidence should run on Markdown-stripped text. Add tests proving
                  markers do not block <DocCode>detectHiddenInfoLeak</DocCode> or{" "}
                  <DocCode>hasNearDuplicateRecentLine</DocCode>.
                </>
              ),
            },
            {
              term: "Heading rules",
              def: (
                <>
                  The sanitizer allows at most one heading line per message. Only ATX heading syntax
                  with content on the same line is accepted. Empty headings, setext headings,
                  heading-only multi-line blocks, and repeated heading lines are downgraded to plain
                  text or rejected before persistence. Cross-turn frequency is an audit concern, not
                  a renderer concern.
                </>
              ),
            },
            {
              term: "Heading DOM and layout",
              def: (
                <>
                  Render heading beats as <DocCode>{"<p>"}</DocCode> with capped bubble-local
                  classes such as <DocCode>text-display-sm</DocCode>,{" "}
                  <DocCode>leading-tight</DocCode>, <DocCode>font-display</DocCode>,{" "}
                  <DocCode>font-semibold</DocCode>, <DocCode>break-words</DocCode>, and{" "}
                  <DocCode>max-w-full</DocCode>. The existing bubble parent keeps its{" "}
                  <DocCode>max-w-[78%]</DocCode> clamp. Do not add semantic
                  <DocCode>h1</DocCode> through <DocCode>h6</DocCode> elements inside chat bubbles.
                </>
              ),
            },
            {
              term: "Audit category",
              def: (
                <>
                  Add <DocCode>markup_abuse</DocCode> to <DocCode>AuditCategory</DocCode>,{" "}
                  <DocCode>EMPTY_FINDING_COUNTS</DocCode>, and derived category reporting. Use{" "}
                  <DocCode>warn</DocCode> for unsupported but harmless syntax and isolated heading
                  overuse. Use <DocCode>fail</DocCode> for raw HTML, links, images, code fences,
                  repeated headings across a short window, or markup that carries stage direction
                  instead of spoken text.
                </>
              ),
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "checklist",
    title: "Checklist",
    body: (
      <RoadmapChecklist
        planSlug={slug}
        status={plan.status}
        tasks={[
          {
            id: "resolve-format-contract",
            label: "Promote the exact format subset to product contract.",
            detail: (
              <P>
                Move the allowed node list into product docs before code work: paragraphs, soft line
                breaks, <DocCode>em</DocCode>, <DocCode>strong</DocCode>, and one ATX heading line
                mapped to a bubble-local display paragraph. Explicitly exclude lists, links, images,
                HTML, tables, code, math, Mermaid, blockquotes, footnotes, and task syntax.
              </P>
            ),
          },
          {
            id: "read-rendering-surfaces",
            label: "Map every member-speech surface before editing.",
            detail: (
              <P>
                Start with <RoadmapFileRef path="app/components/date-view-chat-stream.tsx" />,{" "}
                <RoadmapFileRef path="app/components/date-view-transcript.ts" />,{" "}
                <RoadmapFileRef path="app/components/cupid-shell.tsx" />,{" "}
                <RoadmapFileRef path="app/services/ai/playground.ts" />,{" "}
                <RoadmapFileRef path="app/routes/playground/tests/ai-prompt-lab.tsx" />, and{" "}
                <RoadmapFileRef path="app/routes/playground/tests/chat-bubble-gallery.tsx" />.
                Confirm final report and member request surfaces stay plain text. Search for{" "}
                <DocCode>message.text</DocCode>, <DocCode>item.text</DocCode>,{" "}
                <DocCode>TranscriptItem</DocCode>, and <DocCode>sanitizeCharacterText</DocCode>.
              </P>
            ),
          },
          {
            id: "select-markdown-package",
            label: "Select the Markdown package with an explicit fallback.",
            detail: (
              <P>
                Review Streamdown security, streaming, and Tailwind setup. Add it only if untrusted
                AI output can be restricted to the allowed subset. If not, use{" "}
                <DocCode>react-markdown</DocCode> without GFM plugins and with the same
                disallowed-node handling. Add package CSS or Tailwind <DocCode>@source</DocCode>{" "}
                entries only for the selected package.
              </P>
            ),
          },
          {
            id: "build-shared-renderer",
            label: "Create a shared member message Markdown renderer.",
            detail: (
              <P>
                Add a small component such as{" "}
                <RoadmapFileRef path="app/components/member-message-markdown.tsx" hint="new" />.
                Configure <DocCode>skipHtml</DocCode> or equivalent HTML rejection, hardened URL
                handling, no image rendering, no link navigation, no plugin extras, and component
                overrides for the allowed subset. Give the component a caret mode that never depends
                on mutating the last Markdown child.
              </P>
            ),
          },
          {
            id: "style-bubble-markdown",
            label: "Style Markdown inside existing bubble grammar.",
            detail: (
              <P>
                Keep Tailwind utilities in <DocCode>className</DocCode>. Preserve member bubble
                color, font, glow, tail, texture, and width clamps from{" "}
                <RoadmapFileRef path="app/components/member-chat-bubble-style.ts" /> and{" "}
                <RoadmapFileRef path="app/app.css" />. Use <DocCode>max-w-full</DocCode>,{" "}
                <DocCode>min-w-0</DocCode>, and <DocCode>break-words</DocCode> so heading beats wrap
                inside the current bubble width instead of widening the transcript lane.
              </P>
            ),
          },
          {
            id: "preserve-safe-markdown",
            label: "Add a character-only cleanup path for safe Markdown.",
            detail: (
              <P>
                Replace the character path around{" "}
                <RoadmapFileRef path="app/services/ai-date-engine.ts" line={2079} /> with a
                newline-preserving sanitizer or an optioned helper. Do not change the narrative
                behavior of <DocCode>stripForbiddenPunctuation</DocCode> or{" "}
                <DocCode>scrubPlayerSafeCopy</DocCode> without separate tests. Preserve safe
                emphasis markers and newlines while stripping speaker labels, bracketed asides,
                action narration, forbidden dash punctuation, unsupported Markdown, links, images,
                and raw HTML.
              </P>
            ),
          },
          {
            id: "update-character-prompt",
            label: "Rewrite the character format block and prompt docs.",
            detail: (
              <P>
                Replace the plain-text ban in{" "}
                <RoadmapFileRef path="app/services/date-prompts.ts" line={385} /> with the
                constrained format contract. Update{" "}
                <RoadmapFileRef path="app/docs/product/voice-prompts.tsx" /> and{" "}
                <RoadmapFileRef path="app/docs/product/voice.tsx" /> with voice-earned examples and
                abuse cases. The prompt should say Markdown is optional and rare. It should also
                state that italic stage directions remain forbidden.
              </P>
            ),
          },
          {
            id: "add-audit-guards",
            label: "Add quality guards for markup abuse and safety projections.",
            detail: (
              <P>
                Extend <RoadmapFileRef path="app/services/date-quality-audit.ts" /> with{" "}
                <DocCode>markup_abuse</DocCode> in the category union and empty counts map. Add
                detectors for unsupported Markdown, list syntax, link syntax, image syntax, raw
                HTML, repeated heading use, and italicized stage direction. Run hidden-info leak
                checks, repetition checks, venue monologue checks, and audit evidence on the
                Markdown-stripped projection.
              </P>
            ),
          },
          {
            id: "playground-regression",
            label: "Add playground examples and visual regression coverage.",
            detail: (
              <P>
                Update <RoadmapFileRef path="app/routes/playground/tests/ai-prompt-lab.tsx" /> and{" "}
                <RoadmapFileRef path="app/routes/playground/tests/chat-bubble-gallery.tsx" /> so
                reviewers can see ordinary text, italic emphasis, strong emphasis, line rhythm, and
                heading beats across default and custom bubbles. Update{" "}
                <RoadmapFileRef path="app/services/ai/playground.ts" /> so member chat cleanup,
                <DocCode>finishTerminalPunctuation</DocCode>, and presentation retry checks do not
                misread safe trailing Markdown markers.
              </P>
            ),
          },
          {
            id: "verify-and-close",
            label: "Audit fixtures, run verification, and move durable rules out of the roadmap.",
            detail: (
              <P>
                Scan existing fixture text, tests, and saved transcript fixtures for lines that
                begin with allowed Markdown markers. Update exact string assertions where newline
                preservation is intentional. Run <DocCode>vp check</DocCode>,{" "}
                <DocCode>vp test</DocCode>, and <DocCode>vp build</DocCode> because this touches UI
                rendering, runtime output cleanup, prompts, tests, and player-facing workflow. Move
                final rules into product docs before marking this plan <DocCode>review</DocCode> or{" "}
                <DocCode>shipped</DocCode>.
              </P>
            ),
          },
        ]}
        title="execution"
      />
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "Member character messages render a hardened Markdown subset in live-date bubbles without allowing links, images, HTML, lists, code, tables, math, Mermaid, blockquotes, footnotes, or task syntax.",
          "The implementation keeps today's single-chunk reveal and does not re-enable provider token streaming.",
          "Plain member replies with no Markdown markers render as before, and legacy marker collisions are scanned and documented.",
          "Heading syntax renders as one capped bubble-local paragraph, never as h1 through h6 semantics or oversized layout.",
          "Generated member prompts describe Markdown as optional, rare, voice-earned, and never a home for italic stage directions.",
          "Character sanitization preserves safe emphasis and line breaks while narrative scrubbing remains newline-collapsed.",
          "Hidden leak checks, repetition checks, venue checks, and audit evidence use a Markdown-stripped plain-speech projection.",
          "The date quality audit includes markup_abuse in AuditCategory, EMPTY_FINDING_COUNTS, and reports.",
          "The AI prompt lab and chat bubble gallery show ordinary text, inline emphasis, line rhythm, and heading beats through the shared renderer.",
          "Vite Plus verification passes, including vp check, vp test, and vp build.",
        ]}
      />
    ),
  },
  {
    id: "decisions",
    title: "Decisions",
    body: (
      <RoadmapDecisionsLog
        entries={[
          {
            date: "2026-05-20",
            title: "Keep single-chunk reveal in scope",
            outcome: "accepted",
            body: (
              <P>
                The current provider delta callback is ignored and the UI receives one sanitized
                character delta before done. This plan improves final message rendering without
                reopening token streaming.
              </P>
            ),
          },
          {
            date: "2026-05-20",
            title: "Ban lists from member speech Markdown",
            outcome: "accepted",
            body: (
              <P>
                Bullets and numbered lists read like UI, task panels, or formal notes. They fight
                the date-table fiction and make the speaker sound like a prompt artifact.
              </P>
            ),
          },
          {
            date: "2026-05-20",
            title: "Treat headings as spoken volume beats",
            outcome: "accepted",
            body: (
              <P>
                Raw headings inside a chat bubble would create bad semantics and layout risk. The
                renderer may accept heading syntax, but only to produce one capped spoken outburst
                paragraph inside the bubble.
              </P>
            ),
          },
          {
            date: "2026-05-20",
            title: "Split character Markdown cleanup from narrative scrubbing",
            outcome: "accepted",
            body: (
              <P>
                Character dialogue needs safe line rhythm. Memories, judge filings, notes, and other
                player-facing narrative summaries still need collapsed copy. The implementation
                should add a dialogue-specific path instead of changing shared narrative helpers by
                accident.
              </P>
            ),
          },
          {
            date: "2026-05-20",
            title: "Use markup_abuse as the audit category",
            outcome: "accepted",
            body: (
              <P>
                Audit reporting has a closed category union and an explicit empty counts map. The
                Markdown pass must add <DocCode>markup_abuse</DocCode> to both before emitting any
                new finding.
              </P>
            ),
          },
          {
            date: "2026-05-20",
            title: "Keep Markdown member-only",
            outcome: "accepted",
            body: (
              <P>
                Scenario beats, Cupid notes, judge filings, member requests, and system messages
                already have their own presentation language. This work exists to improve member
                speech variety, not to make every transcript surface rich text.
              </P>
            ),
          },
          {
            date: "2026-05-20",
            title: "Fallback to react-markdown if Streamdown fails review",
            outcome: "accepted",
            body: (
              <P>
                Streamdown is the preferred candidate because it is built for streamed Markdown, but
                this plan no longer depends on partial token streaming. If Streamdown cannot be
                hardened cleanly for untrusted AI output, use <DocCode>react-markdown</DocCode>{" "}
                without GFM plugins and keep the same allowed subset.
              </P>
            ),
          },
          {
            date: "2026-05-20",
            title: "Defer blockquotes",
            outcome: "deferred",
            body: (
              <P>
                Blockquotes could help prophecy, contract, or quoted-message voices, but they also
                invite offstage speakers and nested documents. Revisit only after the first subset
                proves useful in audit transcripts.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function MemberMessageMarkdownRoadmapDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
