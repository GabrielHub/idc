import {
  DocCallout,
  DocCode,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  DocVisibilityTiers,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "gameplay/player-knowledge",
  group: "gameplay",
  title: "Player knowledge and visibility",
  description:
    "What the player sees at intake, what waits behind earned reads, what stays hidden, and how filed reads carry truth.",
  order: 1,
};

export const lede = (
  <>
    The player starts with incomplete case files. <DocCode>GameSave.playerKnowledge</DocCode> is the
    save-owned record of what Cupid has filed for the player. It does not live inside{" "}
    <DocCode>Member</DocCode>, because fixture-owned member data can hydrate forward while
    preserving only member state.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "visibility-tiers",
    title: "Visibility tiers",
    body: (
      <DocVisibilityTiers
        tiers={[
          {
            id: "public",
            label: "Public at intake",
            tier: "public",
            items: [
              "Name, first name, portrait assets, and retained or closed-file state.",
              "The focused member's current ask, because it is the active work order.",
              <span key="profile">
                Public profile fragments returned by <DocCode>buildVisibleMemberProfile</DocCode>.
              </span>,
              "Redacted dossier blocks that show information exists without putting hidden text in visible UI, search, filters, sort modes, tooltips, aria labels, or hidden DOM text.",
            ],
          },
          {
            id: "gated",
            label: "Gated until earned",
            tier: "gated",
            items: [
              <span key="ids">
                <DocCode>species</DocCode>, <DocCode>origin</DocCode>, <DocCode>dimension</DocCode>,
                <DocCode>realityStatus</DocCode>, and <DocCode>bio</DocCode>.
              </span>,
              <span key="profile">
                Full <DocCode>datingProfile</DocCode>.
              </span>,
              <span key="prefs">
                <DocCode>relationshipNeeds</DocCode>, <DocCode>preferences</DocCode>, and{" "}
                <DocCode>dealbreakers</DocCode>.
              </span>,
              "Exact Mood, Openness, Burnout, and retention.",
            ],
          },
          {
            id: "hidden",
            label: "Never player-facing",
            tier: "hidden",
            items: [
              <span key="secrets">
                <DocCode>secrets</DocCode>, <DocCode>tags</DocCode>, <DocCode>voice</DocCode>, model
                prompts, raw rule hits, fixture indexes, exact stat deltas, and prompt-only labels.
              </span>,
            ],
          },
        ]}
      />
    ),
  },
  {
    id: "dev-preview",
    title: "Dev preview",
    body: (
      <DocCallout variant="info">
        Dev builds may expose a settings toggle for visual QA of fully unveiled member files. That
        preview may show gated member information and exact member state, but it must not file
        reads, mutate saves, or surface never player-facing fields.
      </DocCallout>
    ),
  },
  {
    id: "filed-reads",
    title: "Filed reads",
    body: (
      <>
        <P>Filed reads are player-facing knowledge, not raw facts. Current read kinds are:</P>
        <DocDefList
          items={[
            { term: "profile", def: "Additional public profile context." },
            { term: "comfort", def: "What helps a member relax or engage." },
            { term: "boundary", def: "What pressure or behavior crosses a member line." },
            { term: "ask", def: "Whether the focused ask is fitting or blocked by the room." },
            { term: "pair_dynamic", def: "How this pair reads together." },
            { term: "scenario_pressure", def: "How the room is affecting the date." },
          ]}
        />
        <P>
          Runtime AI can propose evidence ids only from a bounded reveal candidate packet. Game
          services validate those ids against authoritative candidates before persistence.
          Deterministic services can offer boundary risk candidates, but the judge or reveal filter
          must have transcript evidence or a reveal beat before a boundary read is filed.{" "}
          <DocCode>JudgeSnapshot.usedEvidenceIds</DocCode> stores only accepted ids so UI can attach
          filed reads to the Judge note that created them.
        </P>
      </>
    ),
  },
  {
    id: "ui-and-search-boundary",
    title: "UI and search boundary",
    body: (
      <DocCallout variant="warn" title="Visibility applies to every surface">
        <DocList
          items={[
            "Use visible redaction treatments, sealed labels, and filed-read lists instead of hiding real text with opacity or placing gated text in invisible DOM.",
            "Search, filters, sort controls, tooltips, and aria labels follow the same boundary as visible UI.",
            "The live date footer can show exact Date Health, turn count, Judge count, nudge slots, and scene slots. Final reports, notes, brief panels, and follow-up actions should use nonnumeric outcome and intent copy.",
          ]}
        />
        <P>
          For surface-by-surface Aura treatments of gated content, see{" "}
          <DocLink to="/docs/product/visual-design">Visual design</DocLink>.
        </P>
      </DocCallout>
    ),
  },
  {
    id: "pair-visibility",
    title: "Pair visibility",
    body: (
      <P>
        Pair visibility comes from prior public notes, filed <DocCode>pair_dynamic</DocCode> reads,
        outcome labels, and nonnumeric follow-up intent copy. <Strong>Spark</Strong>,{" "}
        <Strong>Strain</Strong>, <Strong>Relationship Health</Strong>, tag names, numeric deltas,
        and exact rule hits stay hidden. Exact Date Health remains visible during the live date
        because it is the fail state players must manage. Final reports and public notes must not
        repeat exact Date Health, exact Date Health deltas, Spark, Strain, Relationship Health, or
        projected stat math. The saved <DocCode>statSummary</DocCode> field remains for schema
        stability, but its content is player-safe case copy.
      </P>
    ),
  },
];

export default function PlayerKnowledgeDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
