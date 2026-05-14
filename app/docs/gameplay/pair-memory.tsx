import {
  DocCallout,
  DocCode,
  DocDefList,
  DocList,
  DocPage,
  DocStateMachine,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "gameplay/pair-memory",
  group: "gameplay",
  title: "Pair memory systems",
  description:
    "Pair state, agreements, open loops, and the hidden trajectory service. What the judge proposes, what services validate, and what the player sees.",
  order: 3,
};

export const lede = (
  <>
    <DocCode>PairState</DocCode> owns canonical agreements and open loops. Memories mirror accepted
    pair state changes for retrieval and notes, but memories are not the source of truth. Runtime AI
    can propose agreement candidates, agreement updates, open loop candidates, and open loop updates
    through bounded judge output. Game services validate ids, cap counts, dedupe concepts, clamp
    text length, and ignore fabricated references before any save mutation.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "agreements",
    title: "Agreements",
    body: (
      <>
        <P>
          Agreements capture concrete commitments the pair made, such as a filming boundary or a
          planned next step.
        </P>
        <DocStateMachine
          title="agreement lifecycle"
          states={[
            { id: "active", label: "active" },
            { id: "honored", label: "honored", tone: "terminal" },
            { id: "broken", label: "broken", tone: "warn" },
            { id: "retired", label: "retired", tone: "warn" },
          ]}
          transitions={[
            { from: "active", to: "honored", label: "kept across two completed dates" },
            { from: "active", to: "broken", label: "judge filed a breach" },
            { from: "active", to: "retired", label: "agreement no longer relevant" },
          ]}
        />
        <P>
          Active agreements may be fed to performer prompts as table stakes and to judge prompts as
          ids. Player-facing copy should describe the commitment, not expose status math or hidden
          rule hits.
        </P>
      </>
    ),
  },
  {
    id: "open-loops",
    title: "Open loops",
    body: (
      <>
        <P>
          Open loops capture unresolved hooks that can create continuity without adding controls: a
          dodged question, a named plan, a promise, or a choice left live.
        </P>
        <DocStateMachine
          title="open loop lifecycle"
          states={[
            { id: "open", label: "open" },
            { id: "resolved", label: "resolved", tone: "terminal" },
            { id: "dropped", label: "dropped", tone: "warn" },
          ]}
          transitions={[
            { from: "open", to: "resolved", label: "answered or addressed" },
            { from: "open", to: "dropped", label: "explicitly abandoned" },
          ]}
        />
        <P>
          Active loops can appear in prompt context as unresolved pair items. Resolved and dropped
          loops stay in canonical history but do not drive prompt pressure.
        </P>
        <P>
          Open loops are not auto-dropped for age. Older unresolved loops become stronger hidden
          spotlight candidates so the next date has a chance to move one existing item before the
          file invents new pressure.
        </P>
      </>
    ),
  },
  {
    id: "memory-mirror",
    title: "Memory mirror",
    body: (
      <>
        <P>
          Accepted changes mirror into public pair memories with tags such as{" "}
          <DocCode>pair_agreement</DocCode>, <DocCode>open_loop</DocCode>,{" "}
          <DocCode>open_loop_resolved</DocCode>, and <DocCode>agreement_broken</DocCode>. These tags
          support retrieval and pair-board notes through existing memory paths.
        </P>
        <DocCallout variant="warn">
          Do not repair pair state from mirrored memories. <DocCode>PairState</DocCode> is the
          source of truth; memories are derived.
        </DocCallout>
      </>
    ),
  },
  {
    id: "hidden-trajectory",
    title: "Hidden trajectory",
    body: (
      <>
        <P>
          The hidden trajectory service derives qualitative prompt guidance from recent completed
          dates, judge deltas, follow-up actions, unresolved loops, agreement status, strain,
          conflict, and closure proximity.
        </P>
        <DocDefList
          items={[
            { term: "steady", def: "Holding pattern. No new pressure, no breakthrough." },
            {
              term: "warming",
              def: "Recent dates moved relationship health up. Performer can lean into closeness.",
            },
            { term: "recovering", def: "Past pressure has eased. The pair can land a calm beat." },
            { term: "stuck", def: "Conflict is recycling. Same fights, same outcomes." },
            { term: "brittle", def: "One bad beat could break this. Performer should not push." },
            {
              term: "closure_runway",
              def: "The pair is ready to consider closure. Soft cues only, no announcement.",
            },
          ]}
        />
        <DocCallout variant="warn" title="Trajectory is subtext only">
          Prompts may use only the guidance text as subtext. Do not show trajectory labels,
          formulas, raw deltas, or rule hits to the player.
        </DocCallout>
        <P>
          Each date may also receive one hidden pair spotlight item, either an active agreement or
          an open loop. The spotlight does not add controls. It tells performer and judge prompts
          which existing pair item deserves pressure before new material is created.
        </P>
      </>
    ),
  },
  {
    id: "follow-up-resolver",
    title: "Follow-up resolver",
    body: (
      <P>
        Follow-up buttons stay unchanged. The resolver is outcome-aware: effects depend on the final
        outcome, recent judge pressure, boundary reads, agreement or loop status, and current pair
        stats. Follow-up actions remain one-time per final report. They may move pair stats and
        member state, create repair agreements, create return-later loops, retire agreements, or
        drop open loops. The UI should continue to present them as normal case actions rather than
        new systems.
      </P>
    ),
  },
  {
    id: "tuning-benches",
    title: "Tuning benches",
    body: (
      <P>
        The AI playground owns developer tuning benches for these systems. Performer, extractor,
        judge, and follow-up benches may use curated seed packs with{" "}
        <DocCode>saveSchemaVersion</DocCode> metadata. Seed packs are checked in after review.{" "}
        <Strong>Runtime gameplay must not generate or depend on test transcripts.</Strong>
      </P>
    ),
  },
  {
    id: "what-services-validate",
    title: "What services validate",
    body: (
      <DocCallout variant="ok" title="Game services own the gate">
        <DocList
          items={[
            "Validate ids against authoritative candidates before any save mutation.",
            "Cap agreement and loop counts per pair.",
            "Dedupe concepts so the same commitment is not stored twice.",
            "Clamp text length to player-safe spans.",
            "Ignore fabricated references that did not exist in the prompt context.",
            "Reject status transitions that contradict the current state machine.",
          ]}
        />
      </DocCallout>
    ),
  },
];

export default function PairMemoryDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
