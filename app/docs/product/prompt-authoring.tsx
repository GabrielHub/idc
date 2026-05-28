import {
  DocCallout,
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
  slug: "product/prompt-authoring",
  group: "product",
  title: "Prompt authoring guidance",
  description:
    "Provider-aligned rules for any IDC doc, fixture, workflow, or runtime surface that becomes model context.",
  order: 0.5,
};

export const lede = (
  <>
    Use this doc before editing prompt-visible content: member fixtures, scenario fixtures, tune
    guidance, image prompts, TTS scripts, runtime prompt packets, and workflow docs written for AI
    agents. It distills current provider guidance into project rules.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "provider-distillation",
    title: "Provider Distillation",
    body: (
      <>
        <P>
          The providers agree on the practical shape: clear task, relevant context, explicit output
          contract, a small number of useful examples, and less prompt ceremony than older stacks.
          IDC docs should teach agents what good output looks like before listing what to avoid.
        </P>
        <DocSubsection id="gpt-55" title="GPT-5.5">
          <DocList
            items={[
              "Use shorter, outcome-first prompts when possible. Define the target result, success criteria, constraints, available evidence, and final answer shape.",
              "Do not carry old prompt stacks forward just because they exist. Remove legacy process steps that no longer buy reliability.",
              "Define personality and collaboration style for customer-facing or agent-facing flows: how the model sounds, how proactive it is, when it asks, when it assumes, and how it handles uncertainty.",
              "Re-evaluate low or medium reasoning before escalating. More reasoning is not automatically better for voice, fixture, or asset work.",
              "For tool-heavy work, use a short visible preamble and clear stopping conditions so the agent knows when to continue, verify, ask, retry, or stop.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="claude" title="Claude">
          <DocList
            items={[
              "Tell the model what to do instead of only what not to do.",
              "Use clear roles and direct instructions when the task benefits from a specific stance.",
              "Separate instructions, context, examples, variable input, and output format with clear headings or XML-style tags when the prompt is complex.",
              "Use examples that are relevant and diverse enough to teach the desired shape, but do not flood the prompt with examples the model will copy mechanically.",
              "Control format positively: describe the response shape instead of stacking formatting bans.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="gemini" title="Gemini">
          <DocList
            items={[
              "Keep task, context, constraints, and examples structurally separated.",
              "Put the actual task after long context so the model lands on what it must do now.",
              "Use examples to demonstrate the expected pattern and edge cases, not to create a quota checklist.",
              "Ground the model in supplied context and be explicit when it must ignore outside assumptions.",
            ]}
          />
        </DocSubsection>
        <P>
          Source docs:{" "}
          <DocLink to="https://developers.openai.com/api/docs/guides/prompt-guidance">
            OpenAI GPT-5.5 prompt guidance
          </DocLink>
          ,{" "}
          <DocLink to="https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices">
            Claude prompting best practices
          </DocLink>
          ,{" "}
          <DocLink to="https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/gemini-3-prompting-guide">
            Gemini 3 prompting guide
          </DocLink>
          , and{" "}
          <DocLink to="https://ai.google.dev/gemini-api/docs/prompting-strategies">
            Gemini API prompting strategies
          </DocLink>
          .
        </P>
      </>
    ),
    subsections: [
      { id: "gpt-55", title: "GPT-5.5" },
      { id: "claude", title: "Claude" },
      { id: "gemini", title: "Gemini" },
    ],
  },
  {
    id: "project-contract",
    title: "Project Contract",
    body: (
      <>
        <DocList
          items={[
            <span key="one-owner">
              <Strong>One owner per rule.</Strong> Put durable rules in the owning doc or schema.
              Link to them instead of copying the same paragraph into every fixture, workflow, and
              prompt.
            </span>,
            <span key="positive">
              <Strong>Positive target first.</Strong> Say the behavior wanted: answer the latest
              move, react to the consequence, preserve the portrait identity, file the memory, or
              summarize the visible read.
            </span>,
            <span key="hard-rules">
              <Strong>Hard rules stay narrow.</Strong> Use negative language only for real
              invariants: privacy boundaries, schema safety, renderer limitations, generated asset
              hygiene, and player-facing spoiler control.
            </span>,
            <span key="examples">
              <Strong>Examples are attractors.</Strong> Include them when they teach the exact
              failure shape. Avoid giant galleries in runtime prompts because models copy cadence,
              facts, and formatting.
            </span>,
            <span key="context">
              <Strong>Context earns its slot.</Strong> Feed only context that can change the next
              action. Long background dumps should become a linked doc, derived mechanic, or curated
              reference note.
            </span>,
            <span key="stop">
              <Strong>Stop conditions matter.</Strong> Tell an agent what counts as done, when to
              rerun a focused check, when to escalate to runtime code, and when to stop tuning.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "remediation-patterns",
    title: "Remediation Patterns",
    body: (
      <>
        <DocSubsection id="ban-stack" title="Ban Stack To Target">
          <P>
            When a doc accumulates several nearby "do not" lines, identify the shared reason and
            replace the pile with a target behavior plus a small invariant list.
          </P>
          <DocList
            items={[
              "Instead of many acknowledgment bans, target the receive shape: answer, ask, tease, choose, refuse, admit, or stay silent.",
              "Instead of many narration bans, target spoken consequence handling: make an offer, name a choice, react to the result, or hand the partner a decision.",
              "Instead of many image exclusions, target the intended pixels first, then keep constraints short and mechanical.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="one-off-output" title="One-Off Output">
          <P>
            One bad sample is not a prompt failure. Models are non-deterministic. Fix stable
            conversation-level or asset-level drift, not every awkward generation. A prompt edit
            should be a hypothesis that survives rerunning the same pressure.
          </P>
        </DocSubsection>
        <DocSubsection id="no-style-rejection" title="No Style Rejection">
          <DocCallout variant="danger">
            Never fail, reject, or retry generated member dialogue because string matching found a
            disliked style pattern. Style misses are audit and tuning evidence. Only actual
            generation failures, empty output, invalid schema, hidden-info leakage, or unfileable
            payloads may block a turn.
          </DocCallout>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "ban-stack", title: "Ban Stack To Target" },
      { id: "one-off-output", title: "One-Off Output" },
      { id: "no-style-rejection", title: "No Style Rejection" },
    ],
  },
  {
    id: "doc-packaging",
    title: "Doc Packaging",
    body: (
      <DocList
        items={[
          "Agents should read the narrow owning doc and the relevant source file, not the full documentation stack.",
          "When using external provider docs, extract the project-relevant rule and link the source. Do not paste whole external guides into product docs or prompts.",
          "When writing a workflow step, state the observable output and verification command. Avoid process choreography unless the order matters.",
          "When a prompt-visible field is derived from a private source, document the derived mechanic only. Do not commit private raw text, private facts, or copied source phrasing.",
          "When a runtime prompt changes, update the doc that owns that surface and run focused tests for the changed prompt contract.",
        ]}
      />
    ),
  },
];

export default function PromptAuthoringDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
