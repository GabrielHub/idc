import {
  DocCallout,
  DocCode,
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

const slug = "roadmap/relationship-graph-storage";

export const meta: DocMeta = {
  slug,
  group: "roadmap",
  title: "Sparse relationship graph",
  description:
    "Replace dense all-pairs save state with sparse relationship edges, projected pair views, and indexed in-memory relationship access.",
  order: 10,
};

export const plan: RoadmapPlanMeta = {
  status: "review",
  opened: "2026-05-15",
  touched: "2026-05-16",
  owner: "unassigned",
  tldr: "Ship the immediate relationship data win: sparse scenario counters, materialized pair edges, PairProjection views, and edge-indexed access without taking on platform SQL yet.",
  tasks: 8,
  done: 8,
  tags: ["storage", "graph", "scale"],
};

export const lede = (
  <>
    The current save precomputes every possible member pair and stores full scenario counters on
    each pair. The first optimization milestone should not start with SQLite. It should make the
    relationship model sparse, make pair access explicit, and keep existing repository backends
    working through the same intent-based API.
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
          Current saves store <DocCode>GameSave.pairStates</DocCode> as a dense unordered pair
          matrix. With 40 members this creates 780 pair records. Each record also stores
          <DocCode>scenarioUseCounts</DocCode> for every scenario, so a fresh save with 56 scenarios
          carries 43,680 zero counters before a player books a single date.
        </P>
        <P>
          The current pain is save size, schema parse cost, hydration cost, import and export
          weight, and localStorage write volume. A linear <DocCode>pairStates.find</DocCode> over
          780 entries is not the current bottleneck. The index work in this plan exists to set the
          new relationship API boundary before the roster grows and before a SQL store is added.
        </P>
        <DocCallout variant="info" title="Why now">
          This is preventive scale work with one immediate payoff: removing dense zero counters from
          fresh saves. The 100 and 250 member numbers are stress targets for the relationship layer,
          not a current roster commitment.
        </DocCallout>
        <DocCallout variant="warn" title="Reset is intentional">
          The team is choosing a player-visible reset for old alpha saves instead of a v8 to v9
          dense-pair migration. v0.3.2 testers may have local saves. Keep the existing fresh-start
          behavior or make it friendlier, but do not pretend the break is invisible.
        </DocCallout>
      </>
    ),
  },
  {
    id: "target-model",
    title: "Target model",
    body: (
      <>
        <P>
          Reframe the relationship layer as a local social graph. <Strong>Members</Strong> are
          nodes. <Strong>PairEdge</Strong> records are persisted edges with gameplay history.{" "}
          <Strong>PairProjection</Strong> records are readonly views that let booking, prompts, and
          recommendations evaluate untouched possible pairings without storing them.
        </P>
        <DocList
          items={[
            <span key="edge">
              Persist a <DocCode>PairEdge</DocCode> only after a booking, filed pair read,
              agreement, open loop, closure, follow-up, or authored pair override creates durable
              relationship data.
            </span>,
            <span key="projection">
              Add <DocCode>PairProjection</DocCode> with these fields: <DocCode>id</DocCode>,{" "}
              <DocCode>participantIds</DocCode>, <DocCode>stats</DocCode>,{" "}
              <DocCode>completedDateIds</DocCode>, <DocCode>scenarioUseCounts</DocCode>,{" "}
              <DocCode>agreements</DocCode>, <DocCode>openLoops</DocCode>, and{" "}
              <DocCode>source</DocCode> as <DocCode>"projected"</DocCode> or{" "}
              <DocCode>"persisted"</DocCode>.
            </span>,
            <span key="sparse-counts">
              Store <DocCode>scenarioUseCounts</DocCode> sparsely. Missing means zero. Do not seed
              every pair with every scenario id.
            </span>,
            <span key="indexes">
              Build relationship indexes by <DocCode>pairId</DocCode>, participant member id,
              materialized edge state, closure readiness, and recent activity. Hot services should
              ask the relationship layer for data by intent instead of scanning raw arrays.
            </span>,
            <span key="browser">
              Keep browser and desktop on the same repository intent API. The current localStorage
              repository may implement that API as a whole-save shim until the SQL plan ships.
            </span>,
          ]}
        />
        <DocCallout variant="warn" title="Do not move gameplay authority">
          Pair state remains app-owned canonical gameplay. Runtime AI can propose bounded changes,
          but validation, materialization, projection, persistence, and reset behavior stay in game
          services and repositories. See{" "}
          <DocLink to="/docs/gameplay/pair-memory">Pair memory systems</DocLink>,{" "}
          <DocLink to="/docs/gameplay/match-fit">Match fit</DocLink>, and{" "}
          <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink>.
        </DocCallout>
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
            id: "read-canonical-docs",
            label: "Read canonical gameplay docs and current code before changing contracts.",
            defaultDone: true,
            detail: (
              <P>
                Start with <RoadmapFileRef path="app/docs/gameplay/pair-memory.tsx" />,{" "}
                <RoadmapFileRef path="app/docs/gameplay/match-fit.tsx" />,{" "}
                <RoadmapFileRef path="app/docs/gameplay/player-knowledge.tsx" />,{" "}
                <RoadmapFileRef path="app/services/game-seed.ts" />,{" "}
                <RoadmapFileRef path="app/services/date-engine.ts" />,{" "}
                <RoadmapFileRef path="app/services/ai-date-engine.ts" />,{" "}
                <RoadmapFileRef path="app/services/closures.ts" />, and{" "}
                <RoadmapFileRef path="app/repositories/local-game-repository.ts" />.
              </P>
            ),
          },
          {
            id: "schema-reset",
            label: "Break the save schema intentionally and document the alpha reset.",
            defaultDone: true,
            detail: (
              <P>
                Bumped <DocCode>SAVE_SCHEMA_VERSION</DocCode> to 9 for v0.3.4. v0.3.3 saves and
                older are rejected at load so the next launch starts a fresh save. The desktop
                install guide and release notes call out the reset directly for testers.
              </P>
            ),
          },
          {
            id: "sparse-scenario-counts",
            label: "Make scenario use counts sparse everywhere.",
            defaultDone: true,
            detail: (
              <P>
                <RoadmapFileRef path="app/services/game-seed.ts" /> no longer pre-fills{" "}
                <DocCode>scenarioUseCounts</DocCode> with zeros. Hydration strips any leftover zero
                entries from older saves and from explicit overrides, so the record only carries
                scenario ids the pair has actually booked.
              </P>
            ),
          },
          {
            id: "projection-types",
            label: "Add PairEdge and PairProjection domain contracts.",
            defaultDone: true,
            detail: (
              <P>
                <DocCode>PairEdge</DocCode> aliases the persisted <DocCode>PairState</DocCode>{" "}
                schema. <DocCode>PairProjection</DocCode> adds a <DocCode>source</DocCode>{" "}
                discriminator (<DocCode>persisted</DocCode> or <DocCode>projected</DocCode>) so
                callers know whether they are looking at a saved edge or a derived view.
              </P>
            ),
          },
          {
            id: "relationship-index",
            label: "Add an in-memory relationship graph index service.",
            defaultDone: true,
            detail: (
              <P>
                <RoadmapFileRef path="app/services/relationship-index.ts" /> builds maps by pair id
                and member id, tracks closure-ready pair ids from completed reports, and exposes{" "}
                <DocCode>getPairProjection</DocCode> for callers that should accept a projected
                pair. The localStorage repository caches the index per save snapshot.
              </P>
            ),
          },
          {
            id: "repository-intents",
            label: "Move repository callers toward intent-based relationship queries.",
            defaultDone: true,
            detail: (
              <P>
                The <DocCode>GameRepository</DocCode> contract now offers{" "}
                <DocCode>getPairProjection</DocCode>, <DocCode>materializePairEdge</DocCode>,{" "}
                <DocCode>listEdgesForMember</DocCode>, and{" "}
                <DocCode>listClosureCandidatePairIds</DocCode>. The localStorage backend serves them
                from the cached relationship index.
              </P>
            ),
          },
          {
            id: "runtime-edge-mutations",
            label: "Move runtime pair changes onto edge-scoped mutation helpers.",
            defaultDone: true,
            detail: (
              <P>
                <DocCode>requirePairState</DocCode> now resolves through{" "}
                <DocCode>getPairProjectionFromSave</DocCode>, so booking and the first judge
                exchange operate on a projection. The existing <DocCode>replaceById</DocCode> writes
                in <RoadmapFileRef path="app/services/date-engine.ts" /> and{" "}
                <RoadmapFileRef path="app/services/ai-date-engine.ts" /> materialize the edge on
                first mutation. Closures and follow-ups continue to land through the same write
                path. Pre-date suggestions in{" "}
                <RoadmapFileRef path="app/components/pre-date-canvas.tsx" /> resolve untouched pairs
                via projection.
              </P>
            ),
          },
          {
            id: "scale-tests",
            label: "Add scale benches with deterministic synthetic rosters.",
            defaultDone: true,
            detail: (
              <P>
                <RoadmapFileRef path="app/services/relationship-graph-scale.ts" /> clones starter
                members with deterministic suffixes and state offsets. The bench in{" "}
                <RoadmapFileRef path="app/services/relationship-graph-scale.test.ts" /> exercises
                40, 100, and 250 member rosters across seeding, schema parse, projection lookup, and
                Pair Board derivation.
              </P>
            ),
          },
        ]}
        title="implementation"
      />
    ),
  },
  {
    id: "pair-board-note",
    title: "Pair Board note",
    body: (
      <P>
        Pair Board already avoids rendering the complete dense graph.{" "}
        <RoadmapFileRef path="app/components/pair-board-layout.ts" /> skips pairs without filed
        public pair memories. The live Notes view passes note-bearing materialized edges from the
        relationship index into Pair Board instead of handing it raw save pair ownership. Graphology
        is still rejected for persistence, but it can be reconsidered later for Pair Board rendering
        if layout complexity grows beyond the current helper functions.
      </P>
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "A fresh save no longer stores every possible pair or zero scenario counters.",
          "Old alpha saves reset intentionally with clear support or release copy.",
          "Untouched pairs can still be recommended and booked through PairProjection.",
          "Persisted PairEdge records are materialized only when gameplay needs durable history.",
          "Relationship access goes through an in-memory graph index or repository intent API instead of raw dense-array ownership.",
          "Pair Board keeps its sparse visual behavior and no longer needs a full pair array scan to find note-bearing relationships.",
          "Scale benches cover 40, 100, and 250 member rosters with documented synthetic roster generation.",
          "Canonical gameplay docs are updated with the new relationship graph ownership rules.",
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
            date: "2026-05-15",
            title: "Split sparse graph work from SQL persistence",
            outcome: "accepted",
            body: (
              <P>
                Sparse counters, projected pairs, edge materialization, and in-memory indexing
                deliver the immediate save-size win without Tauri plugin work. SQL persistence is a
                separate platform migration with its own trigger and checklist.
              </P>
            ),
          },
          {
            date: "2026-05-15",
            title: "Model relationships as a sparse social graph",
            outcome: "accepted",
            body: (
              <P>
                The complete graph is useful as a mental model for possible bookings, but it should
                not be persisted as runtime state. Persist only edges with gameplay history and
                derive untouched pair projections on demand.
              </P>
            ),
          },
          {
            date: "2026-05-15",
            title: "Treat indexed access as an ownership boundary",
            outcome: "accepted",
            body: (
              <P>
                Pair lookup is not slow at 40 members. The index exists so code stops treating a
                dense array as the relationship authority before larger rosters or SQL storage make
                that habit expensive.
              </P>
            ),
          },
          {
            date: "2026-05-15",
            title: "Do not introduce a graph database",
            outcome: "rejected",
            body: (
              <P>
                The hard problem is sparse persistence and indexed local queries, not graph
                algorithms. A relational store or indexed local repository fits the game better than
                a graph database.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function RelationshipGraphStorageRoadmapDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
