import {
  DocCallout,
  DocChemistryMatrix,
  DocClusterCard,
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

import {
  CHEMISTRY_CLUSTERS,
  CHEMISTRY_FRICTION_ZONES,
  CHEMISTRY_MEMBERS,
  CHEMISTRY_PAIRS,
} from "./roster-chemistry-data";

export const meta: DocMeta = {
  slug: "gameplay/roster-chemistry",
  group: "gameplay",
  title: "Roster chemistry",
  description:
    "Warm clusters, friction zones, the four-anchor authoring pass, and a per-pair matrix visualization of the current roster's natural pressures.",
  order: 5,
};

export const lede = (
  <>
    Members are designed against each other, not in isolation, but no member fixture should name
    another member as a destined match, enemy, failure, or success. Every member should have at
    least two natural warm pressures and two natural friction pressures in the existing roster,
    expressed through authored profile fields and voice patterns.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "authoring-rules",
    title: "Authoring rules",
    body: (
      <>
        <P>
          The LLM reads needs, preferences, dealbreakers, secrets, and refused voice patterns to
          perform the friction or fit. Source chemistry pressure from voice and tone, not from a
          separate runtime answer key.
        </P>
        <DocList
          items={[
            "If a partner's voice patterns or tics would land on this character's dealbreakers or voice.patternsRefused, the friction is available.",
            "If a partner's preferences would let this character relax their guard, warmth is available.",
            "Available does not mean guaranteed. The player should learn the shape through the date, filed reads, and notes instead of receiving the answer key on the roster screen.",
          ]}
        />
        <DocCallout
          variant="warn"
          title="The chemistry map is an authoring heuristic, not a runtime contract"
        >
          The cluster and pressure notes below are authoring guidance for humans. They are not
          prompt copy, not a fixture dependency list, and not a deterministic relationship matrix.
          Scenarios and member fixtures should imply these pressures through reusable traits and
          situations rather than naming the intended counterpart.
        </DocCallout>
      </>
    ),
  },
  {
    id: "four-anchor-pass",
    title: "Four-anchor authoring pass",
    body: (
      <>
        <P>
          For every new member, run an LLM-assisted authoring pass after the profile and voice draft
          exists. Name at least four natural warm anchors and four natural friction anchors from the
          current roster. If four warm anchors cannot be found, the member is probably too narrow or
          too isolated.
        </P>
        <P>
          The pass may be done by Codex or another LLM during content development, but it is not
          part of runtime gameplay. Do not store the four-name list in the member fixture, scenario
          fixture, prompt, or runtime scoring table. The list is an authoring audit, not a canon
          relationship answer.
        </P>
        <DocSubsection id="prompt-shape" title="Prompt shape">
          <DocSteps
            items={[
              "Read the drafted member fixture, their voice block, and the current roster.",
              "Name four warm anchors from the roster. For each, give one sentence of evidence from needs, preferences, dealbreakers, voice, tags, or reality frame.",
              "Name four friction anchors from the roster. For each, give one sentence of evidence from the same fields.",
              "Identify which authored fields should change if the anchors are weak, duplicated, or all coming from one trait.",
              "Confirm that no member fixture, scenario fixture, prompt, or scoring table needs to name those anchors directly.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="red-flags" title="Red flags">
          <DocCallout variant="danger">
            <DocList
              items={[
                "The same member appears as the obvious warm answer for too many unrelated drafts.",
                "The warm list depends on a specific scenario instead of the member's durable character design.",
                'The friction list depends on "hero hates villain" style declarations instead of authored needs, refusals, and voice.',
                "A proposed hidden tag exists only to force one named pair.",
                "The pass cannot find four plausible warm anchors without inventing facts absent from the fixture.",
              ]}
            />
          </DocCallout>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "prompt-shape", title: "Prompt shape" },
      { id: "red-flags", title: "Red flags" },
    ],
  },
  {
    id: "clusters",
    title: "Warm clusters",
    body: (
      <div className="my-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {CHEMISTRY_CLUSTERS.map((cluster) => (
          <DocClusterCard
            key={cluster.id}
            name={cluster.name}
            members={cluster.members}
            note={cluster.note}
          />
        ))}
      </div>
    ),
  },
  {
    id: "friction-zones",
    title: "Friction zones",
    body: (
      <div className="my-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {CHEMISTRY_FRICTION_ZONES.map((zone) => (
          <DocClusterCard
            key={zone.id}
            name={zone.name}
            members={[...zone.members, ...zone.counter.map((m) => `vs ${m}`)]}
            note={zone.note}
          />
        ))}
      </div>
    ),
  },
  {
    id: "pair-matrix",
    title: "Pair matrix",
    body: (
      <>
        <P>
          Each colored cell is a non-runtime authoring pressure hypothesis. Members are grouped by
          cluster along both axes, so warm cells concentrate near cluster blocks along the diagonal
          and friction spreads across cluster intersections. Click a member label to focus their row
          and column; click a cell to read the pressure note.
        </P>
        <DocChemistryMatrix members={CHEMISTRY_MEMBERS} pairs={CHEMISTRY_PAIRS} />
        <DocCallout variant="info">
          The matrix is sparse on purpose. Empty cells mean no specific pressure note has been
          filed; the LLM can still play warmth or friction based on voice and authored fields. These
          notes never make a hidden compatibility answer key for runtime dates.
        </DocCallout>
      </>
    ),
  },
  {
    id: "updates",
    title: "Updating the map",
    body: (
      <P>
        Update this map when adding a member. If a new member does not slot into any cluster or
        friction zone, that is a sign the design is too generic. See{" "}
        <DocLink to="/docs/workflows/add-member">Add a member</DocLink> for the procedural pass that
        hooks back into this doc, and{" "}
        <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink> for the
        authoring contract that anchors a member's <Strong>durable pressures</Strong> in fixture
        prose.
      </P>
    ),
  },
];

export default function RosterChemistryDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
