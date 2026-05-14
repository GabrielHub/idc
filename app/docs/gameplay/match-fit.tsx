import {
  DocCallout,
  DocCode,
  DocLink,
  DocList,
  DocPage,
  DocPipeline,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "gameplay/match-fit",
  group: "gameplay",
  title: "Match fit",
  description:
    "Deterministic booking pressure: scoring inputs, badge rules, pre-date brief boundary, judge ownership after the date starts.",
  order: 2,
};

export const lede = (
  <>
    The match fit service scores booking pressure for a pair, a scenario, pair history, and active
    member asks. It does not decide attraction, compatibility, or whether a relationship works.
    Runtime AI owns character reaction and the judge reads the actual exchange.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "scoring-inputs",
    title: "Scoring inputs",
    body: (
      <>
        <DocPipeline
          title="match fit pipeline"
          steps={[
            {
              id: "inputs",
              kind: "input",
              label: "Pair + scenario + asks",
              detail: "Member tags, request tags, scenario tags, pair history",
            },
            {
              id: "score",
              kind: "service",
              label: "Match fit service",
              detail: "Booking pressure, rule hits",
            },
            {
              id: "candidates",
              kind: "data",
              label: "Boundary candidates",
              detail: "Prompt context + reveal packet",
            },
            {
              id: "judge",
              kind: "guard",
              label: "Judge or reveal filter",
              detail: "Needs transcript evidence",
            },
            {
              id: "filed",
              kind: "output",
              label: "Filed reads + Date Health start",
              detail: "Player-facing knowledge + initial delta",
            },
          ]}
        />
        <P>The service produces:</P>
        <DocList
          items={[
            "Internal booking pressure and ask signals.",
            "Private rule hits for tests and debugging.",
            "A starting Date Health delta.",
            "Boundary risk candidates for prompt context and player knowledge.",
          ]}
        />
        <DocCallout variant="info">
          Use match fit as a nudge, not a verdict. It may say that an ask is hard to honor in this
          room, that a scene starts under pressure, or that a known boundary is risky. It must not
          force a pair to fail because an author expected friction. If the LLMs play a surprising
          warm turn and the judge accepts it, app state should be able to move with that result.
        </DocCallout>
      </>
    ),
  },
  {
    id: "judge-owns-deltas",
    title: "Judge owns deltas after the date starts",
    body: (
      <DocCallout variant="warn">
        After the date starts, validated judge output owns Date Health deltas, pair stat deltas,
        member mood deltas, early endings, and evidence use. Match fit must not add per-exchange
        drift, auto-collapse Date Health, or auto-file a boundary read without transcript evidence
        or a reveal beat.
      </DocCallout>
    ),
  },
  {
    id: "pre-date-brief-boundary",
    title: "Pre-date brief boundary",
    body: (
      <P>
        The pre-date brief does not show exact fit, pressure, ask, blocked ask copy, named member
        boundary risks, raw scenario tags, or numeric pair stat meters. Pair visibility comes from
        prior public notes, filed <DocCode>pair_dynamic</DocCode> reads, outcome labels, and
        nonnumeric follow-up intent copy. Spark, Strain, Relationship Health, tag names, numeric
        deltas, and exact rule hits stay hidden. See{" "}
        <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink> for the full
        visibility tier.
      </P>
    ),
  },
  {
    id: "partner-recommendation-badge",
    title: "Partner recommendation badge",
    body: (
      <P>
        The partner recommendation badge is a conservative booking nudge. It appears only when the
        top eligible partner is <Strong>strong</Strong>, <Strong>not high pressure</Strong>,{" "}
        <Strong>not blocked against the active ask</Strong>,{" "}
        <Strong>not carrying boundary risk</Strong>, and{" "}
        <Strong>ahead of the next recommendable candidate by a meaningful margin</Strong>. If the
        current room produces a tie, a weak top score, or only least-bad options, the UI should show
        no recommendation and let the player choose.
      </P>
    ),
  },
  {
    id: "boundary-risk",
    title: "Boundary risk",
    body: (
      <>
        <P>
          Boundary risk exists when an authored boundary has enough deterministic evidence to warn
          the prompt and offer a safe reveal candidate. It does not collapse the date by itself.
        </P>
        <DocList
          items={[
            "Prophecy pressure against a prophecy-averse member.",
            "Museum-style public exposure against a privacy-sensitive member.",
            "Forced memory intimacy against a grief-sensitive member.",
          ]}
        />
        <DocCallout variant="ok">
          Only the judge can end the date early after reading the exchange. If the transcript
          supports a boundary read, the judge or deterministic reveal filter may file the
          player-safe read. The UI shows the filed read, not the raw tag or rule hit.
        </DocCallout>
      </>
    ),
  },
  {
    id: "date-health-visibility",
    title: "Date Health visibility",
    body: (
      <P>
        Exact Date Health remains visible during the live date because it is the fail state players
        must manage. Final reports and public notes must not repeat exact Date Health, exact Date
        Health deltas, Spark, Strain, Relationship Health, or projected stat math. The saved{" "}
        <DocCode>statSummary</DocCode> field remains for schema stability, but its content is
        player-safe case copy.
      </P>
    ),
  },
];

export default function MatchFitDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
