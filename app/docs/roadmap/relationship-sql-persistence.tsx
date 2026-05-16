import {
  DocCallout,
  DocCode,
  DocList,
  DocPage,
  P,
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

const slug = "roadmap/relationship-sql-persistence";

export const meta: DocMeta = {
  slug,
  group: "roadmap",
  title: "Relationship SQL persistence",
  description:
    "Gate and implement a SQLite-backed desktop repository after the sparse relationship graph work proves the runtime storage need.",
  order: 11,
};

export const plan: RoadmapPlanMeta = {
  status: "blocked",
  opened: "2026-05-15",
  touched: "2026-05-15",
  owner: "unassigned",
  tldr: "Add Tauri SQLite persistence only after the sparse graph refactor ships and scale benches prove the platform store is worth the coupling.",
  tasks: 8,
  done: 0,
  blockedReason:
    "Wait for roadmap/relationship-graph-storage to ship and for a scale trigger: committed roster above 100 members, sparse save above 5 MB, or measured save parse/write time over the accepted budget.",
  dependencies: ["roadmap/relationship-graph-storage"],
  tags: ["storage", "sql", "tauri", "blocked"],
};

export const lede = (
  <>
    SQLite can help once relationship data is sparse and the repository API no longer exposes dense
    arrays as the gameplay boundary. It should not be bundled with the first relationship graph
    milestone. This plan records the platform work, dependency setup, and browser parity decisions
    needed before any SQL implementation starts.
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
          The SQL plugin is not installed today. <RoadmapFileRef path="package.json" /> includes
          Tauri plugins for fs, http, process, and updater, but not{" "}
          <DocCode>@tauri-apps/plugin-sql</DocCode>.
          <RoadmapFileRef path="src-tauri/Cargo.toml" /> includes matching Rust plugins, but not
          <DocCode>tauri-plugin-sql</DocCode>. <RoadmapFileRef path="src-tauri/src/lib.rs" /> does
          not register a SQL plugin, and <RoadmapFileRef path="src-tauri/tauri.conf.json" /> has no
          SQL plugin config.
        </P>
        <DocCallout variant="warn" title="Do not start here">
          This plan is blocked until the sparse relationship graph milestone ships. Starting with
          SQL would add platform coupling before the app has removed dense zero counters, dense pair
          ownership, and whole-array relationship access.
        </DocCallout>
      </>
    ),
  },
  {
    id: "scope",
    title: "Scope",
    body: (
      <>
        <P>
          The SQL store must sit behind the same repository intent API as the browser store. Desktop
          may use SQLite transactions. Browser may remain a localStorage whole-save shim until a
          browser-specific scale problem appears.
        </P>
        <DocList
          items={[
            "Desktop target: SQLite through the official Tauri SQL plugin.",
            "Browser target: same TypeScript repository interface, current localStorage implementation allowed.",
            "Initial SQL style: raw Tauri SQL calls wrapped in typed repository helpers.",
            "Do not add Drizzle or Kysely in the first SQL implementation unless raw plugin calls block testability.",
            "Do not promise browser transactions while localStorage remains the browser backend.",
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
            id: "confirm-trigger",
            label: "Confirm the SQL trigger from sparse graph scale results.",
            detail: (
              <P>
                Promote this plan only after <DocCode>relationship-graph-storage</DocCode> reports a
                committed roster above 100 members, sparse save size above 5 MB, or measured
                parse/write time above the accepted budget.
              </P>
            ),
          },
          {
            id: "install-js-dependency",
            label: "Add the JavaScript SQL plugin dependency.",
            detail: (
              <P>
                Add <DocCode>@tauri-apps/plugin-sql</DocCode> to{" "}
                <RoadmapFileRef path="package.json" /> through <DocCode>vp install</DocCode>. Keep
                lockfile changes scoped to the dependency update.
              </P>
            ),
          },
          {
            id: "install-rust-plugin",
            label: "Add and register the Rust SQL plugin.",
            detail: (
              <P>
                Add <DocCode>tauri-plugin-sql</DocCode> to{" "}
                <RoadmapFileRef path="src-tauri/Cargo.toml" />, register it in{" "}
                <RoadmapFileRef path="src-tauri/src/lib.rs" />, and update{" "}
                <RoadmapFileRef path="src-tauri/tauri.conf.json" /> with the required plugin
                configuration.
              </P>
            ),
          },
          {
            id: "schema-design",
            label: "Design the SQLite table schema and migration owner.",
            detail: (
              <P>
                Tables should cover save metadata, members, pair edges, pair scenario counts,
                agreements, open loops, date sessions, memories, player knowledge, shifts, deck
                state, and manager quip history. Index pair id, member id, pair activity, memory
                filters, and closure candidate queries.
              </P>
            ),
          },
          {
            id: "typed-sql-adapter",
            label: "Build typed raw SQL helpers before considering an ORM.",
            detail: (
              <P>
                Keep SQL statements close to repository methods and parse rows through domain
                schemas. If raw Tauri SQL makes migration tests brittle, record the failure and
                choose one query layer in a decision entry before adding it.
              </P>
            ),
          },
          {
            id: "sqlite-repository",
            label: "Implement the SQLite desktop repository behind the relationship intent API.",
            detail: (
              <P>
                Implement pair projection lookup, edge materialization, edge updates, memory search,
                shift state, deck state, import, export, backup, reset, and flush behavior without
                exposing table details to gameplay services.
              </P>
            ),
          },
          {
            id: "browser-parity",
            label: "Keep the browser repository on the same API.",
            detail: (
              <P>
                The browser implementation may stay on localStorage, but tests must prove it returns
                the same repository results. Do not add Dexie unless browser benches show a separate
                IndexedDB need.
              </P>
            ),
          },
          {
            id: "verification",
            label: "Verify desktop SQL, browser parity, and release behavior.",
            detail: (
              <P>
                Run <DocCode>vp check</DocCode>, <DocCode>vp test</DocCode>,{" "}
                <DocCode>vp build</DocCode>, and the desktop build path. Add tests for SQL
                migrations, import and export, backup, reset, and old localStorage save handling.
              </P>
            ),
          },
        ]}
        title="implementation"
      />
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "The SQL plugin is installed in JavaScript, Rust, plugin registration, and config.",
          "Desktop relationship and memory queries run through SQLite tables and indexes.",
          "Browser and desktop repositories share the same intent-based TypeScript API.",
          "Browser behavior remains correct without claiming transaction semantics for localStorage.",
          "Raw SQL helpers are used first, or a single query layer is chosen with a recorded reason.",
          "Import, export, backup, reset, and old alpha save handling are tested.",
          "The SQL plan has measured benefit against the sparse graph baseline.",
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
            title: "Gate SQL behind sparse graph results",
            outcome: "accepted",
            body: (
              <P>
                SQLite is not required to remove dense zero counters or all-pairs save state. This
                plan waits for sparse graph benches or roster commitment before adding platform
                storage coupling.
              </P>
            ),
          },
          {
            date: "2026-05-15",
            title: "Use raw Tauri SQL first",
            outcome: "accepted",
            body: (
              <P>
                Drizzle and Kysely are both deferred. The first implementation should use raw Tauri
                SQL calls behind typed repository helpers because the official plugin already owns
                the desktop database boundary.
              </P>
            ),
          },
          {
            date: "2026-05-15",
            title: "Keep Dexie out until browser scale requires it",
            outcome: "accepted",
            body: (
              <P>
                Browser persistence can keep the current localStorage repository behind the same
                API. Dexie is a browser-specific IndexedDB option, not part of the desktop SQL
                milestone.
              </P>
            ),
          },
          {
            date: "2026-05-15",
            title: "Scope transactions to desktop SQL",
            outcome: "accepted",
            body: (
              <P>
                SQLite mutations can be transactional. The browser localStorage shim still rewrites
                a save blob, so browser work should be described as edge-scoped repository mutation,
                not as a real transaction.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function RelationshipSqlPersistenceRoadmapDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
