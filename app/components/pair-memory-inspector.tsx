import { useMemo, useRef, useState } from "react";

import type { GameSave, Member, OpenLoop, PairAgreement, PairState } from "../domain/game";
import { useTutorialStep } from "../services/tutorial";
import { TutorialCoachMark } from "./tutorial";

function noopTutorialUpdate() {}

export type PairMemoryTimelineEntryKind =
  | "agreement_filed"
  | "agreement_honored"
  | "agreement_broken"
  | "agreement_retired"
  | "open_loop_filed"
  | "open_loop_resolved"
  | "open_loop_dropped";

export type PairMemoryTimelineEntry = {
  id: string;
  kind: PairMemoryTimelineEntryKind;
  text: string;
  occurredAt: string;
  sourceDateSessionId?: string;
  sourceJudgeSnapshotId?: string;
};

export function buildPairMemoryTimeline(pairState: PairState): PairMemoryTimelineEntry[] {
  const entries: PairMemoryTimelineEntry[] = [];

  for (const agreement of pairState.agreements) {
    entries.push({
      id: `${agreement.id}-filed`,
      kind: "agreement_filed",
      text: agreement.text,
      occurredAt: agreement.createdAt,
      sourceDateSessionId: agreement.sourceDateSessionId,
      sourceJudgeSnapshotId: agreement.sourceJudgeSnapshotId,
    });
    if (agreement.resolvedAt !== undefined && agreement.status !== "active") {
      entries.push({
        id: `${agreement.id}-${agreement.status}`,
        kind: agreementResolutionKind(agreement.status),
        text: agreement.text,
        occurredAt: agreement.resolvedAt,
        sourceDateSessionId: agreement.sourceDateSessionId,
        sourceJudgeSnapshotId: agreement.sourceJudgeSnapshotId,
      });
    }
  }

  for (const loop of pairState.openLoops) {
    entries.push({
      id: `${loop.id}-filed`,
      kind: "open_loop_filed",
      text: loop.text,
      occurredAt: loop.createdAt,
      sourceDateSessionId: loop.sourceDateSessionId,
      sourceJudgeSnapshotId: loop.sourceJudgeSnapshotId,
    });
    if (loop.resolvedAt !== undefined && loop.status !== "open") {
      entries.push({
        id: `${loop.id}-${loop.status}`,
        kind: openLoopResolutionKind(loop.status),
        text: loop.text,
        occurredAt: loop.resolvedAt,
        sourceDateSessionId: loop.sourceDateSessionId,
        sourceJudgeSnapshotId: loop.sourceJudgeSnapshotId,
      });
    }
  }

  entries.sort((a, b) => {
    if (a.occurredAt === b.occurredAt) return a.id.localeCompare(b.id);
    return b.occurredAt.localeCompare(a.occurredAt);
  });
  return entries;
}

function agreementResolutionKind(
  status: Exclude<PairAgreement["status"], "active">,
): PairMemoryTimelineEntryKind {
  if (status === "honored") return "agreement_honored";
  if (status === "broken") return "agreement_broken";
  return "agreement_retired";
}

function openLoopResolutionKind(
  status: Exclude<OpenLoop["status"], "open">,
): PairMemoryTimelineEntryKind {
  if (status === "resolved") return "open_loop_resolved";
  return "open_loop_dropped";
}

type StatusTone = "active" | "open" | "ok" | "warn" | "soft";

const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  active: "bg-rose-50 text-aura-rose ring-1 ring-rose-200/70",
  open: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
  ok: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
  warn: "bg-rose-100/80 text-rose-700 ring-1 ring-rose-200/70",
  soft: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
};

const TIMELINE_LABEL: Record<PairMemoryTimelineEntryKind, { label: string; tone: StatusTone }> = {
  agreement_filed: { label: "filed", tone: "active" },
  agreement_honored: { label: "honored", tone: "ok" },
  agreement_broken: { label: "broken", tone: "warn" },
  agreement_retired: { label: "retired", tone: "soft" },
  open_loop_filed: { label: "filed", tone: "open" },
  open_loop_resolved: { label: "resolved", tone: "ok" },
  open_loop_dropped: { label: "dropped", tone: "soft" },
};

const TIMELINE_KIND_PREFIX: Record<PairMemoryTimelineEntryKind, string> = {
  agreement_filed: "agreement",
  agreement_honored: "agreement",
  agreement_broken: "agreement",
  agreement_retired: "agreement",
  open_loop_filed: "loop",
  open_loop_resolved: "loop",
  open_loop_dropped: "loop",
};

const RECENT_CHANGE_LIMIT = 8;

export type PairMemoryInspectorProps = {
  pairState: PairState | undefined;
  members: Member[];
  save?: GameSave;
  onTutorialUpdate?: (next: GameSave) => void;
};

export function PairMemoryInspector({
  pairState,
  members,
  save,
  onTutorialUpdate,
}: PairMemoryInspectorProps) {
  const [collapsed, setCollapsed] = useState(true);
  const asideRef = useRef<HTMLElement | null>(null);

  const activeAgreementsCount = useMemo(
    () => (pairState?.agreements ?? []).filter((entry) => entry.status === "active").length,
    [pairState?.agreements],
  );
  const tutorialEnabled = save !== undefined && onTutorialUpdate !== undefined;
  const firstAgreementStep = useTutorialStep(
    save,
    "lazy.files.first-agreement",
    tutorialEnabled && activeAgreementsCount > 0,
    onTutorialUpdate ?? noopTutorialUpdate,
  );

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  if (pairState === undefined) return null;

  const activeAgreements = pairState.agreements.filter((entry) => entry.status === "active");
  const openLoops = pairState.openLoops.filter((entry) => entry.status === "open");
  const timeline = buildPairMemoryTimeline(pairState).slice(0, RECENT_CHANGE_LIMIT);

  const pairLabel = pairState.participantIds
    .map((id) => memberById.get(id)?.firstName ?? id)
    .join(" · ");

  return (
    <aside
      ref={asideRef}
      data-pair-memory-inspector
      aria-label="Pair memory inspector"
      className="aura-glass-strong pointer-events-auto fixed right-4 top-4 z-30 hidden max-h-[calc(100vh-2rem)] w-[22rem] max-w-[28vw] flex-col overflow-hidden rounded-card text-aura-ink xl:flex"
    >
      <header className="flex items-center justify-between gap-3 border-b border-aura-hairline px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
            // pair memory
          </p>
          <p className="mt-1 truncate font-display text-sm font-semibold text-aura-ink">
            {pairLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CountChip label="a" count={activeAgreements.length} tone="active" />
          <CountChip label="l" count={openLoops.length} tone="open" />
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-controls="pair-memory-inspector-body"
            className="grid size-7 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
            title={collapsed ? "Expand pair memory" : "Collapse pair memory"}
          >
            <Chevron open={!collapsed} />
          </button>
        </div>
      </header>

      {collapsed ? null : (
        <div
          id="pair-memory-inspector-body"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
        >
          <InspectorSection
            label="active agreements"
            count={activeAgreements.length}
            emptyMessage="No active agreements filed yet."
          >
            <ul className="flex flex-col gap-2">
              {activeAgreements.map((agreement) => (
                <AgreementCard key={agreement.id} agreement={agreement} />
              ))}
            </ul>
          </InspectorSection>

          <InspectorSection
            label="open loops"
            count={openLoops.length}
            emptyMessage="No open loops on this pair."
          >
            <ul className="flex flex-col gap-2">
              {openLoops.map((loop) => (
                <OpenLoopCard key={loop.id} openLoop={loop} />
              ))}
            </ul>
          </InspectorSection>

          <InspectorSection
            label="recent changes"
            count={timeline.length}
            emptyMessage="No status changes filed yet."
          >
            <ul className="flex flex-col gap-2">
              {timeline.map((entry) => (
                <TimelineRow key={entry.id} entry={entry} />
              ))}
            </ul>
          </InspectorSection>
        </div>
      )}

      {firstAgreementStep.active ? (
        <TutorialCoachMark
          target={asideRef}
          placement="left"
          eyebrow="// pair.file"
          title="Agreements and open loops"
          body="The Judge files an agreement when a pair settles on something. Open loops are the questions they left dangling. Both follow this pair from date to date and shape the next room read."
          primaryLabel="Got it"
          onPrimary={firstAgreementStep.complete}
          dismissLabel="Skip tour"
          onDismiss={firstAgreementStep.dismiss}
        />
      ) : null}
    </aside>
  );
}

function InspectorSection({
  label,
  count,
  emptyMessage,
  children,
}: {
  label: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
          // {label}
        </p>
        <span className="font-mono text-micro tabular-nums text-aura-faint">{count}</span>
      </div>
      {count === 0 ? (
        <p className="rounded-chip border border-dashed border-aura-hairline-strong bg-white/45 px-3 py-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function AgreementCard({ agreement }: { agreement: PairAgreement }) {
  return (
    <li className="rounded-chip border border-aura-hairline bg-white/65 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <StatusPill label="active" tone="active" />
        <SourceMeta createdAt={agreement.createdAt} dateSessionId={agreement.sourceDateSessionId} />
      </div>
      <p className="mt-1.5 line-clamp-3 text-label leading-snug text-aura-ink">{agreement.text}</p>
    </li>
  );
}

function OpenLoopCard({ openLoop }: { openLoop: OpenLoop }) {
  return (
    <li className="rounded-chip border border-aura-hairline bg-white/65 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <StatusPill label="open" tone="open" />
        <SourceMeta createdAt={openLoop.createdAt} dateSessionId={openLoop.sourceDateSessionId} />
      </div>
      <p className="mt-1.5 line-clamp-3 text-label leading-snug text-aura-ink">{openLoop.text}</p>
    </li>
  );
}

function TimelineRow({ entry }: { entry: PairMemoryTimelineEntry }) {
  const meta = TIMELINE_LABEL[entry.kind];
  const kindPrefix = TIMELINE_KIND_PREFIX[entry.kind];
  return (
    <li className="rounded-chip border border-aura-hairline bg-white/55 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <StatusPill label={meta.label} tone={meta.tone} />
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {kindPrefix}
          </span>
        </div>
        <SourceMeta createdAt={entry.occurredAt} dateSessionId={entry.sourceDateSessionId} />
      </div>
      <p className="mt-1.5 line-clamp-2 text-label leading-snug text-aura-ink/85">{entry.text}</p>
    </li>
  );
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${STATUS_TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

function CountChip({ label, count, tone }: { label: string; count: number; tone: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] tabular-nums ${STATUS_TONE_CLASS[tone]}`}
      aria-label={`${count} ${label === "a" ? "active agreements" : "open loops"}`}
    >
      <span>{label}</span>
      <span>{count}</span>
    </span>
  );
}

function SourceMeta({
  createdAt,
  dateSessionId,
}: {
  createdAt: string;
  dateSessionId: string | undefined;
}) {
  const time = formatClockTime(createdAt);
  const session = dateSessionId === undefined ? null : shortSessionTag(dateSessionId);
  return (
    <span className="font-mono text-micro tabular-nums text-aura-faint">
      {session === null ? time : `${time} · ${session}`}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden
      className={`transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
    >
      <path
        d="M3.2 5.4l3.8 3.6 3.8-3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatClockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function shortSessionTag(id: string): string {
  const trimmed = id.replace(/^date-session-/u, "");
  if (trimmed.length <= 6) return `s.${trimmed}`;
  return `s.${trimmed.slice(-6)}`;
}
