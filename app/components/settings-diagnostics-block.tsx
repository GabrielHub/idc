import { useMemo } from "react";

import type { DiagnosticsSnapshot } from "./settings-diagnostics";

export function DiagnosticsBlock({
  getDiagnostics,
  isExpanded,
  isCopied,
  onToggle,
  onCopy,
}: {
  getDiagnostics: () => DiagnosticsSnapshot;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const diagnostics = useMemo(
    () => (isExpanded ? getDiagnostics() : null),
    [isExpanded, getDiagnostics],
  );
  const checkedAt = diagnostics?.lastAiCheck.checkedAt ?? null;
  const checkedAtLabel = checkedAt === null ? "never" : new Date(checkedAt).toLocaleString();

  return (
    <div className="px-1 py-1.5">
      <button
        type="button"
        role="menuitem"
        data-sfx="menu"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-chip px-2 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
      >
        <span>Diagnostics</span>
        <span className="text-aura-faint">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded && diagnostics !== null ? (
        <div className="mt-1 rounded-chip border border-aura-hairline bg-white/55 p-2.5">
          <dl className="space-y-1 font-mono text-micro uppercase tracking-[0.16em] text-aura-muted">
            <DiagnosticsRow label="build" value={diagnostics.appVersion} />
            <DiagnosticsRow label="save" value={`v${diagnostics.saveSchema}`} />
            <DiagnosticsRow label="runtime" value={diagnostics.runtime} />
            <DiagnosticsRow label="provider" value={diagnostics.provider} />
            <DiagnosticsRow label="chat" value={diagnostics.chatModel} />
            <DiagnosticsRow label="embed" value={diagnostics.embeddingModel} />
            <DiagnosticsRow label="reasoning" value={diagnostics.reasoningLevel} />
            <DiagnosticsRow label="ai status" value={diagnostics.lastAiCheck.status} />
            <DiagnosticsRow label="checked" value={checkedAtLabel} />
            <DiagnosticsRow label="cases" value={`${diagnostics.save.focusedCaseCount} focused`} />
            <DiagnosticsRow
              label="members"
              value={`${diagnostics.save.activeMemberCount} active, ${diagnostics.save.closedMemberCount} closed, ${diagnostics.save.quitMemberCount} quit`}
            />
            <DiagnosticsRow
              label="records"
              value={`${diagnostics.save.dateSessionCount} dates, ${diagnostics.save.memoryCount} memories, ${diagnostics.save.playerKnowledgeCount} reads`}
            />
            <DiagnosticsRow
              label="shift"
              value={
                diagnostics.currentShift === null
                  ? "none"
                  : `${diagnostics.currentShift.shiftNumber} ${diagnostics.currentShift.status}`
              }
            />
            <DiagnosticsRow
              label="booking"
              value={diagnostics.currentShift?.activeBookingStatus ?? "none"}
            />
            <DiagnosticsRow
              label="date"
              value={
                diagnostics.activeDate === null
                  ? "none"
                  : `${diagnostics.activeDate.status} ${diagnostics.activeDate.playbackState}`
              }
            />
            <DiagnosticsRow
              label="turn"
              value={
                diagnostics.activeDate === null
                  ? "none"
                  : `${diagnostics.activeDate.currentTurn} / ${diagnostics.activeDate.turnLimit}`
              }
            />
            <DiagnosticsRow label="pending" value={diagnostics.shell.pendingAction ?? "none"} />
            <DiagnosticsRow
              label="stream"
              value={`${diagnostics.shell.streamingDraftCount} drafts, ${
                diagnostics.shell.isJudgePending ? "judge pending" : "judge idle"
              }`}
            />
          </dl>
          <p
            className="mt-2 truncate font-mono text-micro lowercase tracking-[0.04em] text-aura-faint"
            title={diagnostics.os}
          >
            os :: <span className="text-aura-ink">{diagnostics.os}</span>
          </p>
          <button
            type="button"
            data-sfx="menu"
            onClick={onCopy}
            className="mt-2 block w-full cursor-pointer rounded-chip bg-aura-ink px-3 py-1.5 text-center font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-aura-rose"
          >
            {isCopied ? "Copied" : "Copy diagnostic blob"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DiagnosticsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-baseline gap-2">
      <dt className="text-aura-faint">{label}</dt>
      <dd className="min-w-0 truncate text-aura-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}
