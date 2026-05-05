import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import {
  type CompanyGoal,
  type DateFinalReport,
  type DateScenario,
  type DateSession,
  type FollowUpAction,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type PairState,
  type ShiftReport,
  type ShiftState,
} from "../domain/game";
import {
  Eyebrow,
  GhostButton,
  Hairline,
  LiveDot,
  Meter,
  MonoStat,
  MutedLabel,
  Portrait,
  PrimaryButton,
} from "./dashboard-atoms";

const EASE_OUT_QUART: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  encourage: "Encourage",
  cool_down: "Cool Down",
  repair: "Repair",
  mark_bad_fit: "Mark Bad Fit",
};

/* ================================================================== */
/* Roster                                                             */
/* ================================================================== */

export type RosterProps = {
  members: Member[];
  requests: MemberRequest[];
  selectedMemberIds: string[];
  disabled: boolean;
  onToggleMember: (memberId: string) => void;
  onContinue: () => void;
};

export function RosterView({
  members,
  requests,
  selectedMemberIds,
  disabled,
  onToggleMember,
  onContinue,
}: RosterProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedMembers = selectedMemberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m));

  const expandedMember =
    expandedId === null ? null : (members.find((m) => m.id === expandedId) ?? null);
  const expandedRequest =
    expandedMember === null
      ? undefined
      : requests.find((entry) => entry.id === expandedMember.state.currentRequestId);

  function handleClose() {
    setExpandedId(null);
  }

  function handlePick(memberId: string) {
    onToggleMember(memberId);
    setExpandedId(null);
  }

  return (
    <ViewFrame wide>
      <ViewHeader
        eyebrow={`// pool.${pad2(members.length)}`}
        title="Today's pool"
        accent={`${members.length} on file`}
        subhead={
          <>Pick two. Cupid books the table, picks the silverware, and writes the post-mortem.</>
        }
      />

      <Hairline className="mt-10" />

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {members.map((member, index) => {
          const isSelected = selectedMemberIds.includes(member.id);
          return (
            <RosterCard
              key={member.id}
              member={member}
              index={index}
              isSelected={isSelected}
              disabled={disabled}
              onClick={() => setExpandedId(member.id)}
            />
          );
        })}
      </ul>

      <SelectionBar
        selectedMembers={selectedMembers}
        disabled={disabled || selectedMembers.length !== 2}
        onContinue={onContinue}
      />

      <AnimatePresence>
        {expandedMember === null ? null : (
          <MemberDossier
            key={`dossier-${expandedMember.id}`}
            member={expandedMember}
            request={expandedRequest}
            isSelected={selectedMemberIds.includes(expandedMember.id)}
            disabled={disabled}
            onClose={handleClose}
            onPick={() => handlePick(expandedMember.id)}
          />
        )}
      </AnimatePresence>
    </ViewFrame>
  );
}

function RosterCard({
  member,
  index,
  isSelected,
  disabled,
  onClick,
}: {
  member: Member;
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.03 * index, ease: EASE_OUT_QUART }}
      className="list-none"
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={isSelected}
        className={`group relative flex w-full cursor-pointer flex-col items-center gap-3 rounded-card p-4 text-center transition aura-glass-lift disabled:cursor-not-allowed disabled:opacity-50 lg:p-5 ${
          isSelected ? "aura-glass-strong ring-1 ring-aura-rose/45" : "aura-glass"
        }`}
      >
        <CardSelectionBadge selected={isSelected} />
        <Portrait member={member} variant="card" />
        <h3 className="line-clamp-1 w-full font-display text-lead font-semibold tracking-tight text-aura-ink">
          {member.name}
        </h3>
        <div className="w-full space-y-2 pt-1">
          <Meter label="Mood" value={member.state.mood} />
          <Meter label="Openness" value={member.state.openness} tone="violet" />
        </div>
      </button>
    </motion.li>
  );
}

function CardSelectionBadge({ selected }: { selected: boolean }) {
  if (!selected) {
    return null;
  }
  return (
    <span className="absolute right-3 top-3 z-10 grid size-6 place-items-center rounded-full bg-aura-ink text-white shadow-quiet">
      <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
        <path
          d="M3 8.4L6.6 12L13 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function MemberDossier({
  member,
  request,
  isSelected,
  disabled,
  onClose,
  onPick,
}: {
  member: Member;
  request: MemberRequest | undefined;
  isSelected: boolean;
  disabled: boolean;
  onClose: () => void;
  onPick?: () => void;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
      onClick={onClose}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/55 px-4 py-10 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
        onClick={(event) => event.stopPropagation()}
        className="aura-glass-strong relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name} dossier`}
      >
        <DossierCloseButton onClose={onClose} />

        <div className="overflow-y-auto px-6 pb-6 pt-8 lg:px-10 lg:pb-8 lg:pt-10">
          <div className="space-y-7">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
              <Portrait member={member} variant="stage" />
              <div className="min-w-0 space-y-2">
                <Eyebrow>// dossier</Eyebrow>
                <h2 className="font-display text-display-md font-semibold tracking-tight text-aura-ink">
                  {member.name}
                </h2>
                <p className="text-lead text-aura-muted">{member.datingProfile}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Meter label="Mood" value={member.state.mood} size="md" />
              <Meter label="Openness" value={member.state.openness} tone="violet" size="md" />
            </div>

            {request === undefined ? null : (
              <DossierBlock eyebrow="// ask">
                <p className="text-body text-aura-ink/90">{request.text}</p>
              </DossierBlock>
            )}

            <DossierBlock eyebrow="// looking for">
              <ul className="space-y-1.5 text-label text-aura-ink/85">
                {member.relationshipNeeds.map((need) => (
                  <li key={need} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-aura-rose"
                    />
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            </DossierBlock>

            <DossierBlock eyebrow="// known traits">
              <div className="flex flex-wrap gap-1.5">
                {member.traits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-pill bg-white/70 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.2em] text-aura-muted"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </DossierBlock>

            {member.preferences.length === 0 ? null : (
              <DossierBlock eyebrow="// preferences">
                <p className="text-label text-aura-ink/85">{member.preferences.join(" · ")}</p>
              </DossierBlock>
            )}

            {member.dealbreakers.length === 0 ? null : (
              <DossierBlock eyebrow="// dealbreakers">
                <p className="text-label text-aura-rose/85">{member.dealbreakers.join(" · ")}</p>
              </DossierBlock>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-aura-hairline px-6 py-4 lg:px-10 lg:py-5">
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {isSelected ? "On the call sheet" : "Awaiting your call"}
          </p>
          {onPick === undefined ? null : isSelected ? (
            <GhostButton onClick={onPick} disabled={disabled} ariaPressed>
              Remove from date
            </GhostButton>
          ) : (
            <PrimaryButton onClick={onPick} disabled={disabled}>
              Pick for date
              <span className="ml-2 inline-block">→</span>
            </PrimaryButton>
          )}
        </div>
      </motion.div>
    </motion.aside>
  );
}

function DossierCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close dossier"
      className="absolute right-4 top-4 z-10 grid size-8 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
        <path
          d="M3 3L13 13M13 3L3 13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

function DossierBlock({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function SelectionBar({
  selectedMembers,
  disabled,
  onContinue,
}: {
  selectedMembers: Member[];
  disabled: boolean;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {selectedMembers.length > 0 ? (
        <motion.div
          key="selection-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
          className="pointer-events-none fixed inset-x-0 bottom-6 z-30 px-6 lg:bottom-8"
        >
          <div className="aura-glass-strong pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-between gap-6 rounded-pill px-3 py-2.5 pl-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="rounded-full border-2 border-white/90 bg-white shadow-sm"
                  >
                    <Portrait member={member} variant="thumb" />
                  </span>
                ))}
              </div>
              <div className="leading-tight">
                <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
                  {selectedMembers.length} of 2 staffed
                </p>
                <p className="text-body font-semibold text-aura-ink">
                  {selectedMembers.length === 2
                    ? `${selectedMembers[0].name} and ${selectedMembers[1].name}`
                    : `${selectedMembers[0].name}, awaiting partner`}
                </p>
              </div>
            </div>
            <PrimaryButton disabled={disabled} onClick={onContinue}>
              Continue to brief
              <span className="ml-2 inline-block">→</span>
            </PrimaryButton>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ================================================================== */
/* Brief                                                              */
/* ================================================================== */

export type BriefProps = {
  shift: ShiftState;
  selectedMembers: Member[];
  scenarios: DateScenario[];
  selectedScenario: DateScenario | undefined;
  pairState: PairState | null;
  pairNote: string | null;
  goals: CompanyGoal[];
  requests: MemberRequest[];
  members: Member[];
  shiftReport: ShiftReport | undefined;
  canStart: boolean;
  localAiStatus: LocalAiBriefStatus;
  isActionPending: boolean;
  onSelectScenario: (id: string) => void;
  onStart: () => void;
  onRetryLocalAi: () => void;
  onBack: () => void;
};

export type LocalAiBriefStatus = {
  status: "checking" | "ready" | "unavailable";
  message: string;
};

const RISK_CHIP: Record<
  DateScenario["card"]["risk"],
  { bg: string; text: string; ring: string; dot: string }
> = {
  high: {
    bg: "bg-aura-rose/10",
    text: "text-aura-rose",
    ring: "ring-aura-rose/30",
    dot: "bg-aura-rose",
  },
  medium: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    ring: "ring-amber-500/30",
    dot: "bg-amber-500",
  },
  low: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
};

export function BriefView({
  shift,
  selectedMembers,
  scenarios,
  selectedScenario,
  pairState,
  pairNote,
  goals,
  requests,
  members,
  shiftReport,
  canStart,
  localAiStatus,
  isActionPending,
  onSelectScenario,
  onStart,
  onRetryLocalAi,
  onBack,
}: BriefProps) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  if (selectedMembers.length !== 2) {
    return (
      <ViewFrame wide>
        <EmptyState
          eyebrow={`// brief.${pad2(shift.shiftNumber)}`}
          title="Pick a pair first"
          subhead="The brief assembles itself once Cupid has two members on file. Return to the roster."
          action={<PrimaryButton onClick={onBack}>← Back to roster</PrimaryButton>}
        />
      </ViewFrame>
    );
  }

  const [first, second] = selectedMembers;
  const openMember =
    openMemberId === null ? null : (members.find((m) => m.id === openMemberId) ?? null);
  const openMemberRequest =
    openMember === null
      ? undefined
      : requests.find((entry) => entry.id === openMember.state.currentRequestId);

  return (
    <ViewFrame wide>
      <BriefHeader shiftNumber={shift.shiftNumber} scenarioCount={scenarios.length} />

      <Hairline className="mt-8" />

      <section className="mt-12">
        <PairStage
          first={first}
          second={second}
          pairState={pairState}
          note={pairNote}
          onMemberClick={setOpenMemberId}
        />
      </section>

      <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <ScenarioDeck
          scenarios={scenarios}
          selectedScenario={selectedScenario}
          onSelect={onSelectScenario}
        />

        <aside className="space-y-6">
          <PinnedGoalsCard goals={goals} shiftReport={shiftReport} />
          <OpenAsksCard
            requests={requests}
            members={members}
            shiftReport={shiftReport}
            onMemberClick={setOpenMemberId}
          />
        </aside>
      </div>

      <BriefDock
        selectedScenario={selectedScenario}
        canStart={canStart}
        localAiStatus={localAiStatus}
        isActionPending={isActionPending}
        onStart={onStart}
        onRetryLocalAi={onRetryLocalAi}
      />

      <AnimatePresence>
        {openMember === null ? null : (
          <MemberDossier
            key={`brief-dossier-${openMember.id}`}
            member={openMember}
            request={openMemberRequest}
            isSelected={selectedMembers.some((m) => m.id === openMember.id)}
            disabled={false}
            onClose={() => setOpenMemberId(null)}
          />
        )}
      </AnimatePresence>
    </ViewFrame>
  );
}

function BriefHeader({
  shiftNumber,
  scenarioCount,
}: {
  shiftNumber: number;
  scenarioCount: number;
}) {
  return (
    <header className="max-w-2xl space-y-3">
      <Eyebrow>{`// brief.${pad2(shiftNumber)}`}</Eyebrow>
      <h1 className="font-display text-display-lg font-semibold leading-[0.95] tracking-tight text-aura-ink">
        Tonight&rsquo;s brief
      </h1>
      <p className="max-w-xl text-body text-aura-muted">
        {scenarioCount} reservations on the desk. Pick the room. Cupid will not begin without
        paperwork.
      </p>
    </header>
  );
}

function BriefDock({
  selectedScenario,
  canStart,
  localAiStatus,
  isActionPending,
  onStart,
  onRetryLocalAi,
}: {
  selectedScenario: DateScenario | undefined;
  canStart: boolean;
  localAiStatus: LocalAiBriefStatus;
  isActionPending: boolean;
  onStart: () => void;
  onRetryLocalAi: () => void;
}) {
  const localAiBlocksStart = localAiStatus.status !== "ready";
  const statusLabel = localAiBlocksStart
    ? localAiStatus.status === "checking"
      ? "local ai check"
      : "local ai blocked"
    : selectedScenario === undefined
      ? "no reservation"
      : "reservation locked";
  const statusText = localAiBlocksStart
    ? localAiStatus.message
    : selectedScenario === undefined
      ? "Pick a venue. Cupid will not begin without one."
      : selectedScenario.title;
  const buttonLabel = isActionPending
    ? "Booking the table…"
    : localAiStatus.status === "checking"
      ? "Checking AI"
      : "Begin date";
  const dotTone = localAiStatus.status === "ready" ? "rose" : "amber";

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 px-6 lg:bottom-8"
    >
      <div className="aura-glass-strong pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-between gap-6 rounded-pill px-3 py-2.5 pl-5">
        <div className="flex min-w-0 items-center gap-3">
          <LiveDot tone={dotTone} />
          <div className="min-w-0 leading-tight">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
              {statusLabel}
            </p>
            <p className="truncate text-body font-semibold text-aura-ink">{statusText}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {localAiStatus.status === "unavailable" ? (
            <GhostButton disabled={isActionPending} onClick={onRetryLocalAi}>
              Retry AI
            </GhostButton>
          ) : null}
          <PrimaryButton disabled={!canStart} onClick={onStart}>
            {buttonLabel}
            <span className="ml-2 inline-block">→</span>
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}

function PairStage({
  first,
  second,
  pairState,
  note,
  onMemberClick,
}: {
  first: Member;
  second: Member;
  pairState: PairState | null;
  note: string | null;
  onMemberClick: (memberId: string) => void;
}) {
  return (
    <div className="relative">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-10">
        <ClickablePairMember member={first} align="end" onClick={() => onMemberClick(first.id)} />
        <PairBond />
        <ClickablePairMember
          member={second}
          align="start"
          onClick={() => onMemberClick(second.id)}
        />
      </div>

      {note === null ? null : (
        <p className="mx-auto mt-10 max-w-xl text-center aura-accent text-2xl leading-snug text-aura-muted">
          &ldquo;{note}&rdquo;
        </p>
      )}

      {pairState === null ? null : (
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-8">
          <Meter label="Spark" value={pairState.stats.spark} />
          <Meter label="Strain" value={pairState.stats.strain} tone="amber" />
          <Meter label="Health" value={pairState.stats.relationshipHealth} tone="emerald" />
        </div>
      )}
    </div>
  );
}

function PairBond() {
  return (
    <div aria-hidden className="flex h-44 items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="block h-px w-12 bg-gradient-to-r from-transparent via-aura-rose/35 to-aura-rose/65 sm:w-16" />
        <span className="relative flex size-12 items-center justify-center">
          <span className="absolute -inset-3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.38),rgba(217,70,239,0.22)_55%,transparent_75%)] blur-md" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet shadow-quiet" />
          <span className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white via-rose-50/70 to-white/90" />
          <svg viewBox="0 0 24 24" fill="none" className="relative size-[22px]" aria-hidden>
            <defs>
              <linearGradient id="pair-bond-sparkle" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="55%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path
              d="M12 2 C 12.6 9.4 14.6 11.4 22 12 C 14.6 12.6 12.6 14.6 12 22 C 11.4 14.6 9.4 12.6 2 12 C 9.4 11.4 11.4 9.4 12 2 Z"
              fill="url(#pair-bond-sparkle)"
            />
          </svg>
        </span>
        <span className="block h-px w-12 bg-gradient-to-r from-aura-rose/65 via-aura-rose/35 to-transparent sm:w-16" />
      </div>
    </div>
  );
}

function ClickablePairMember({
  member,
  align,
  onClick,
}: {
  member: Member;
  align: "start" | "end";
  onClick: () => void;
}) {
  const itemsAlign = align === "end" ? "sm:items-end" : "sm:items-start";
  const textAlign = align === "end" ? "sm:text-right" : "sm:text-left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${member.name} dossier`}
      className={`group relative flex cursor-pointer flex-col items-center gap-4 rounded-card p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/40 ${itemsAlign}`}
    >
      <span className="relative inline-block">
        <span
          aria-hidden
          className="absolute -inset-3 rounded-full bg-gradient-to-br from-aura-rose/0 via-aura-fuchsia/0 to-aura-violet/0 opacity-0 blur-md transition-all duration-300 group-hover:from-aura-rose/30 group-hover:via-aura-fuchsia/30 group-hover:to-aura-violet/30 group-hover:opacity-100"
        />
        <span className="relative inline-block transition-transform duration-300 group-hover:-translate-y-0.5">
          <Portrait member={member} variant="stage" />
        </span>
        <span
          aria-hidden
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-pill bg-aura-ink/85 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 opacity-0 shadow-quiet transition-opacity duration-200 group-hover:opacity-100"
        >
          open dossier
        </span>
      </span>
      <span
        className={`text-center font-display text-display-md font-semibold tracking-tight text-aura-ink ${textAlign}`}
      >
        {member.name}
      </span>
    </button>
  );
}

function ScenarioDeck({
  scenarios,
  selectedScenario,
  onSelect,
}: {
  scenarios: DateScenario[];
  selectedScenario: DateScenario | undefined;
  onSelect: (id: string) => void;
}) {
  const indexInDeck =
    selectedScenario === undefined
      ? -1
      : scenarios.findIndex((scenario) => scenario.id === selectedScenario.id);

  return (
    <section className="space-y-5">
      <header className="flex items-baseline justify-between gap-4">
        <Eyebrow>// scenario deck</Eyebrow>
        <MutedLabel>{`${pad2(scenarios.length)} drawn`}</MutedLabel>
      </header>
      <ul className="grid gap-3 sm:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <ScenarioDeckTab
            key={scenario.id}
            scenario={scenario}
            index={index}
            total={scenarios.length}
            isSelected={scenario.id === selectedScenario?.id}
            onSelect={() => onSelect(scenario.id)}
          />
        ))}
      </ul>
      <FeaturedScenarioCard
        scenario={selectedScenario}
        indexInDeck={indexInDeck}
        totalScenarios={scenarios.length}
      />
    </section>
  );
}

function ScenarioDeckTab({
  scenario,
  index,
  total,
  isSelected,
  onSelect,
}: {
  scenario: DateScenario;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const indexLabel = `${pad2(index + 1)}/${pad2(total)}`;
  const chip = RISK_CHIP[scenario.card.risk];
  return (
    <li className="list-none">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className={`group relative flex h-full w-full cursor-pointer flex-col gap-3 rounded-card px-4 py-4 text-left transition aura-glass-lift ${
          isSelected ? "aura-glass-ink" : "aura-glass"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-mono text-micro font-semibold uppercase tabular-nums tracking-[0.22em] ${isSelected ? "text-white/55" : "text-aura-faint"}`}
          >
            {indexLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${isSelected ? "text-white/85" : chip.text}`}
          >
            <span className={`size-1.5 rounded-full ${chip.dot}`} />
            {scenario.card.risk}
          </span>
        </div>
        <h4
          className={`font-display text-lead font-semibold leading-snug tracking-tight ${isSelected ? "text-white" : "text-aura-ink"}`}
        >
          {scenario.title}
        </h4>
        {isSelected ? (
          <motion.span
            layoutId="brief-active-deck"
            aria-hidden
            className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-pill bg-gradient-to-r from-aura-rose to-aura-fuchsia"
            transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
          />
        ) : null}
      </button>
    </li>
  );
}

function FeaturedScenarioCard({
  scenario,
  indexInDeck,
  totalScenarios,
}: {
  scenario: DateScenario | undefined;
  indexInDeck: number;
  totalScenarios: number;
}) {
  if (scenario === undefined) {
    return (
      <div className="aura-glass relative grid min-h-72 place-items-center overflow-hidden rounded-card px-8 py-14 text-center">
        <ScenarioCardWatermark />
        <div className="relative space-y-3">
          <Eyebrow>// no reservation</Eyebrow>
          <p className="text-lead text-aura-muted">
            Tap a card above to feature it. Cupid keeps three on the desk at a time.
          </p>
        </div>
      </div>
    );
  }

  const indexLabel = `${pad2(indexInDeck + 1)} / ${pad2(totalScenarios)}`;
  const chip = RISK_CHIP[scenario.card.risk];

  return (
    <motion.article
      key={scenario.id}
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
      className="aura-glass-strong relative overflow-hidden rounded-card shadow-card ring-1 ring-aura-rose/30"
    >
      <ScenarioCardWatermark />
      <div className="relative z-10 px-7 pb-8 pt-7 lg:px-9 lg:pb-10 lg:pt-9">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
            // reservation {indexLabel}
          </span>
          <RiskStamp risk={scenario.card.risk} chip={chip} />
        </div>

        <h2 className="mt-5 font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
          {scenario.title}
        </h2>
        <p className="mt-3 aura-accent text-lead leading-snug text-aura-rose/85">
          {scenario.publicBrief.location}
        </p>
        <p className="mt-4 max-w-2xl text-body leading-relaxed text-aura-ink/85">
          {scenario.publicBrief.premise}
        </p>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {scenario.card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill bg-white/65 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted"
            >
              {tag.replaceAll("_", " ")}
            </span>
          ))}
        </div>

        <div className="mt-7 flex items-center gap-3 border-t border-aura-hairline pt-5">
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-full bg-aura-rose/15 text-aura-rose"
          >
            <svg viewBox="0 0 16 16" className="size-3" fill="none">
              <path
                d="M3 8.4L6.6 12L13 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
            filed for review. confirm at the dock.
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function ScenarioCardWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-12 -right-10 size-56 opacity-[0.06]"
    >
      <svg viewBox="0 0 100 100" className="size-full text-aura-rose" fill="currentColor">
        <path d="M50 8 L60 38 L92 40 L66 60 L74 92 L50 74 L26 92 L34 60 L8 40 L40 38 Z" />
      </svg>
    </div>
  );
}

function RiskStamp({
  risk,
  chip,
}: {
  risk: DateScenario["card"]["risk"];
  chip: { bg: string; text: string; ring: string; dot: string };
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] ring-1 ${chip.bg} ${chip.text} ${chip.ring}`}
    >
      <span className={`size-1.5 rounded-full ${chip.dot}`} />
      {risk} risk
    </span>
  );
}

function PinnedGoalsCard({
  goals,
  shiftReport,
}: {
  goals: CompanyGoal[];
  shiftReport: ShiftReport | undefined;
}) {
  return (
    <PinnedCard eyebrow="// goals" title="Pinned goals" count={goals.length}>
      <ul className="space-y-2.5">
        {goals.map((goal) => {
          const result = shiftReport?.goalResults.find((entry) => entry.goalId === goal.id);
          const status = result?.status ?? "open";
          const tone =
            status === "missed"
              ? "bg-aura-rose/10 text-aura-rose"
              : status === "met"
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-white/65 text-aura-faint";
          return (
            <li key={goal.id} className="flex items-start gap-3">
              <span
                className={`inline-flex h-5 shrink-0 items-center rounded-pill px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] ${tone}`}
              >
                {status}
              </span>
              <span className="text-label leading-snug text-aura-ink/85">{goal.title}</span>
            </li>
          );
        })}
      </ul>
    </PinnedCard>
  );
}

function OpenAsksCard({
  requests,
  members,
  shiftReport,
  onMemberClick,
}: {
  requests: MemberRequest[];
  members: Member[];
  shiftReport: ShiftReport | undefined;
  onMemberClick: (memberId: string) => void;
}) {
  return (
    <PinnedCard eyebrow="// asks" title="Open asks" count={requests.length}>
      <ul className="space-y-4">
        {requests.map((request) => {
          const member = members.find((m) => m.id === request.memberId);
          const wasIgnored = shiftReport?.ignoredRequestIds.includes(request.id);
          return (
            <li key={request.id} className="space-y-2">
              {member === undefined ? null : (
                <button
                  type="button"
                  onClick={() => onMemberClick(member.id)}
                  aria-label={`Open ${member.name} dossier`}
                  className="group inline-flex cursor-pointer items-center gap-2.5 rounded-pill text-left transition"
                >
                  <Portrait member={member} variant="transcript" />
                  <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition group-hover:text-aura-ink">
                    {member.name}
                  </span>
                </button>
              )}
              <p className="aura-accent text-label leading-snug text-aura-ink/80">
                &ldquo;{request.text}&rdquo;
              </p>
              {wasIgnored ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  <span className="size-1 rounded-full bg-aura-rose" />
                  filed: ignored
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </PinnedCard>
  );
}

function PinnedCard({
  eyebrow,
  title,
  count,
  defaultOpen = true,
  children,
}: {
  eyebrow: string;
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="relative">
      <PinHead />
      <div className="aura-glass overflow-hidden rounded-card">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="group flex w-full cursor-pointer items-start justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="space-y-1.5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h3 className="font-display text-lead font-semibold leading-tight tracking-tight text-aura-ink">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <span className="font-mono text-micro font-semibold uppercase tabular-nums tracking-[0.22em] text-aura-faint">
              {pad2(count)}
            </span>
            <ChevronToggle open={open} />
          </div>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
              className="overflow-hidden"
            >
              <div className="border-t border-aura-hairline px-5 py-4">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function PinHead() {
  return (
    <span
      aria-hidden
      className="absolute -top-1.5 left-7 z-10 grid size-3.5 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-rose shadow-[0_3px_8px_rgba(244,63,94,0.45)] ring-2 ring-white/85"
    >
      <span className="size-1 rounded-full bg-white/90" />
    </span>
  );
}

function ChevronToggle({ open }: { open: boolean }) {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-white/55 text-aura-muted transition group-hover:bg-white group-hover:text-aura-ink">
      <svg
        viewBox="0 0 16 16"
        className={`size-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        fill="none"
        aria-hidden
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* ================================================================== */
/* Date                                                               */
/* ================================================================== */

export type DateProps = {
  session: DateSession;
  scenario: DateScenario | undefined;
  members: Member[];
  interventionText: string;
  canAdvance: boolean;
  canIntervene: boolean;
  isActionPending: boolean;
  streamingDrafts: StreamingDraftMessage[];
  onInterventionTextChange: (text: string) => void;
  onAdvance: () => void;
  onComplete: () => void;
  onIntervene: () => void;
  onFollowUp: (action: FollowUpAction) => void;
  onBack: () => void;
};

export type StreamingDraftMessage = {
  id: string;
  speakerId: string;
  speakerName: string;
  sequenceIndex: number;
  turnIndex: number;
  text: string;
  status: "streaming" | "done";
};

export function DateView({
  session,
  scenario,
  members,
  interventionText,
  canAdvance,
  canIntervene,
  isActionPending,
  streamingDrafts,
  onInterventionTextChange,
  onAdvance,
  onComplete,
  onIntervene,
  onFollowUp,
  onBack,
}: DateProps) {
  const transcript = buildTranscriptItems(session, members, scenario, streamingDrafts);
  const participants = session.participants
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m));
  const [leftMember, rightMember] = participants;
  const reactionSignals =
    leftMember === undefined || rightMember === undefined
      ? []
      : buildReactionSignals(session, leftMember.id, rightMember.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className="relative w-full"
    >
      {leftMember !== undefined && rightMember !== undefined ? (
        <DateStandeeFrame
          leftMember={leftMember}
          rightMember={rightMember}
          reactions={reactionSignals}
        />
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-6 pb-40 lg:px-10">
        <DateHeader
          scenario={scenario}
          session={session}
          participants={participants}
          onBack={onBack}
        />

        <Hairline className="mt-7" />

        <ChatStream items={transcript} session={session} leftMemberId={leftMember?.id} />

        {session.finalReport === undefined ? null : (
          <FinalReportPanel
            report={session.finalReport}
            isActionPending={isActionPending}
            onFollowUp={onFollowUp}
          />
        )}
      </div>

      {session.status === "active" ? (
        <DateFooter
          session={session}
          interventionText={interventionText}
          canAdvance={canAdvance}
          canIntervene={canIntervene}
          isActionPending={isActionPending}
          onInterventionTextChange={onInterventionTextChange}
          onAdvance={onAdvance}
          onComplete={onComplete}
          onIntervene={onIntervene}
        />
      ) : null}
    </motion.div>
  );
}

const STATUS_TONE_TEXT = {
  rose: "text-aura-rose",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
} as const;

function DateHeader({
  scenario,
  session,
  participants,
  onBack,
}: {
  scenario: DateScenario | undefined;
  session: DateSession;
  participants: Member[];
  onBack: () => void;
}) {
  const statusLabel =
    session.status === "ended_early"
      ? "ended early"
      : session.status === "completed"
        ? "wrapped"
        : "in session";
  const statusTone: keyof typeof STATUS_TONE_TEXT =
    session.status === "ended_early"
      ? "amber"
      : session.status === "completed"
        ? "emerald"
        : "rose";

  return (
    <header>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <Eyebrow>// date.{pad2(session.currentTurn)}</Eyebrow>
          <h1 className="font-display text-display-lg font-semibold tracking-tight text-aura-ink">
            {scenario?.title ?? "Date in session"}
          </h1>
          <p className="text-lead text-aura-muted">
            {participants.map((m) => m.name).join(" and ")}
            {scenario === undefined ? "" : ` at ${scenario.publicBrief.location}.`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <GhostButton onClick={onBack}>← Brief</GhostButton>
          <span className="inline-flex items-center gap-2 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <LiveDot tone={statusTone} />
            <span className={`font-semibold ${STATUS_TONE_TEXT[statusTone]}`}>{statusLabel}</span>
          </span>
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-muted">
              Date health
            </span>
            <span className="font-mono text-micro font-semibold tabular-nums text-aura-ink">
              {session.dateHealth} / 100
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-aura-hairline">
            <div
              aria-hidden
              className={`aura-bar-fill h-full rounded-pill bg-gradient-to-r from-aura-emerald via-aura-rose to-aura-violet ${scoreWidthClass(session.dateHealth)}`}
            />
          </div>
        </div>
        <MonoStat label="Turns" value={`${session.currentTurn} / ${session.turnLimit}`} />
        <MonoStat label="Judge" value={`${session.judgeSnapshots.length} passes`} tone="violet" />
      </div>
    </header>
  );
}

type TranscriptItem = {
  id: string;
  order: number;
  label: string;
  text: string;
  tone: "member" | "scenario" | "cupid" | "system" | "judge";
  member?: Member;
  isDraft?: boolean;
  isStreaming?: boolean;
};

function DateStandeeFrame({
  leftMember,
  rightMember,
  reactions,
}: {
  leftMember: Member;
  rightMember: Member;
  reactions: ReactionSignal[];
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden xl:block">
      <div className="relative mx-auto h-full w-full max-w-2xl">
        <DaterStandee
          member={leftMember}
          placement="bottom-left"
          reactions={reactions.filter((reaction) => reaction.side === "left")}
        />
        <DaterStandee
          member={rightMember}
          placement="top-right"
          reactions={reactions.filter((reaction) => reaction.side === "right")}
        />
      </div>
    </div>
  );
}

function DaterStandee({
  member,
  placement,
  reactions,
}: {
  member: Member;
  placement: "bottom-left" | "top-right";
  reactions: ReactionSignal[];
}) {
  const isBottom = placement === "bottom-left";
  const positionClass = isBottom
    ? "absolute bottom-0 right-full mr-3 h-[78vh] w-56 2xl:mr-8 2xl:w-72"
    : "absolute top-24 left-full ml-3 h-[78vh] w-56 2xl:ml-8 2xl:w-72";
  const glowClass = isBottom
    ? "absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_82%,rgba(244,63,94,0.2),rgba(217,70,239,0.06)_55%,transparent_75%)]"
    : "absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_22%,rgba(167,139,250,0.22),rgba(217,70,239,0.06)_55%,transparent_75%)]";
  const shadowClass = isBottom
    ? "drop-shadow-[0_30px_42px_rgba(244,63,94,0.22)]"
    : "drop-shadow-[0_30px_42px_rgba(167,139,250,0.22)]";
  const variant: "standee-bottom" | "standee-top" = isBottom ? "standee-bottom" : "standee-top";

  return (
    <div className={positionClass}>
      <span aria-hidden className={glowClass} />
      <div className={`relative size-full ${shadowClass}`}>
        <Portrait member={member} variant={variant} asset="portrait" />
        <ReactionStream reactions={reactions} placement={placement} />
      </div>
    </div>
  );
}

type ReactionKind = "spark" | "love" | "laugh" | "anger" | "cry" | "warning";

type ReactionSignal = {
  id: string;
  side: "left" | "right";
  kind: ReactionKind;
  intensity: number;
};

const REACTION_ICON: Record<ReactionKind, string> = {
  spark: "✨",
  love: "💗",
  laugh: "😂",
  anger: "😡",
  cry: "😢",
  warning: "⚠️",
};

const REACTION_TONE: Record<ReactionKind, string> = {
  spark:
    "border-violet-200/70 bg-violet-50/85 text-violet-500 shadow-[0_10px_24px_-12px_rgba(124,58,237,0.6)]",
  love: "border-rose-200/70 bg-rose-50/85 text-aura-rose shadow-[0_10px_24px_-12px_rgba(244,63,94,0.65)]",
  laugh:
    "border-amber-200/80 bg-amber-50/85 text-amber-600 shadow-[0_10px_24px_-12px_rgba(245,158,11,0.6)]",
  anger:
    "border-rose-300/75 bg-rose-100/85 text-rose-700 shadow-[0_10px_24px_-12px_rgba(190,18,60,0.55)]",
  cry: "border-sky-200/80 bg-sky-50/85 text-sky-600 shadow-[0_10px_24px_-12px_rgba(14,165,233,0.55)]",
  warning:
    "border-amber-200/80 bg-white/90 text-amber-700 shadow-[0_10px_24px_-12px_rgba(245,158,11,0.6)]",
};

const REACTION_SIZE: Record<number, string> = {
  1: "size-7 text-label",
  2: "size-8 text-body",
  3: "size-9 text-lead",
};

const REACTION_OFFSETS = [
  "-translate-x-2",
  "translate-x-7",
  "-translate-x-8",
  "translate-x-3",
] as const;

function ReactionStream({
  reactions,
  placement,
}: {
  reactions: ReactionSignal[];
  placement: "bottom-left" | "top-right";
}) {
  if (reactions.length === 0) {
    return null;
  }

  const anchorClass =
    placement === "bottom-left"
      ? "left-1/2 bottom-[28%] items-start"
      : "right-1/2 top-[20%] items-end";

  return (
    <div className={`absolute z-20 flex flex-col gap-3 ${anchorClass}`}>
      {reactions.slice(0, 4).map((reaction, index) => (
        <FloatingReaction
          key={reaction.id}
          reaction={reaction}
          index={index}
          placement={placement}
        />
      ))}
    </div>
  );
}

function FloatingReaction({
  reaction,
  index,
  placement,
}: {
  reaction: ReactionSignal;
  index: number;
  placement: "bottom-left" | "top-right";
}) {
  const drift = placement === "bottom-left" ? 18 + index * 5 : -18 - index * 5;
  const offsetClass = REACTION_OFFSETS[index % REACTION_OFFSETS.length];

  return (
    <motion.span
      className={`grid rounded-full border font-display font-semibold backdrop-blur-md ${REACTION_SIZE[reaction.intensity]} ${REACTION_TONE[reaction.kind]} ${offsetClass}`}
      initial={{ opacity: 0, y: 18, x: 0, scale: 0.82 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [18, -12, -44, -74],
        x: [0, drift, drift * 0.6, 0],
        scale: [0.82, 1, 0.96, 0.72],
      }}
      transition={{
        duration: 3.2,
        delay: index * 0.32,
        repeat: Infinity,
        repeatDelay: 1.6 + index * 0.18,
        ease: EASE_OUT_QUART,
      }}
    >
      <span className="m-auto leading-none">{REACTION_ICON[reaction.kind]}</span>
    </motion.span>
  );
}

type ChatStreamAnimation = {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease: typeof EASE_OUT_QUART; delay: number };
};

function ChatStream({
  items,
  session,
  leftMemberId,
}: {
  items: TranscriptItem[];
  session: DateSession;
  leftMemberId: string | undefined;
}) {
  const endAnchorRef = useRef<HTMLDivElement | null>(null);
  const latestText = items.at(-1)?.text ?? "";

  useEffect(() => {
    endAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length, latestText]);

  if (items.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // awaiting first exchange
        </p>
        <p className="max-w-sm text-label text-aura-muted">
          Cupid does not record silence. Advance the exchange to begin the transcript.
        </p>
        {session.status === "active" ? (
          <div className="mt-3">
            <CupidTypingIndicator />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ol className="space-y-4">
        {items.map((item, index) => {
          const previous = items[index - 1];
          return (
            <ChatStreamItem
              key={item.id}
              item={item}
              previous={previous}
              index={index}
              leftMemberId={leftMemberId}
            />
          );
        })}
      </ol>

      {session.status === "active" ? (
        <div className="mt-5 flex justify-start">
          <CupidTypingIndicator />
        </div>
      ) : null}

      <div ref={endAnchorRef} aria-hidden className="h-2" />
    </div>
  );
}

function ChatStreamItem({
  item,
  previous,
  index,
  leftMemberId,
}: {
  item: TranscriptItem;
  previous: TranscriptItem | undefined;
  index: number;
  leftMemberId: string | undefined;
}) {
  const animation: ChatStreamAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE_OUT_QUART, delay: Math.min(index * 0.04, 0.5) },
  };

  if (item.tone === "member" && item.member !== undefined) {
    const isLeft = item.member.id === leftMemberId;
    const previousIsSameSpeaker =
      previous?.tone === "member" && previous.member?.id === item.member.id;
    return (
      <ChatBubble
        item={item}
        member={item.member}
        side={isLeft ? "left" : "right"}
        showName={!previousIsSameSpeaker}
        tight={previousIsSameSpeaker}
        animation={animation}
      />
    );
  }

  if (item.tone === "scenario") {
    return <NarratorBeat item={item} animation={animation} />;
  }

  if (item.tone === "cupid") {
    return <CupidPin item={item} animation={animation} />;
  }

  if (item.tone === "judge") {
    return <JudgeNote item={item} animation={animation} />;
  }

  return <SystemNote item={item} animation={animation} />;
}

function ChatBubble({
  item,
  member,
  side,
  showName,
  tight,
  animation,
}: {
  item: TranscriptItem;
  member: Member;
  side: "left" | "right";
  showName: boolean;
  tight: boolean;
  animation: ChatStreamAnimation;
}) {
  const isLeft = side === "left";
  const justify = isLeft ? "justify-start" : "justify-end";
  const tightClass = tight ? "!mt-1" : "";
  const itemsAlign = isLeft ? "items-start" : "items-end";
  const nameAlign = isLeft ? "text-left text-aura-faint" : "text-right text-aura-rose/75";
  const bubbleClass = isLeft
    ? "rounded-[22px] rounded-bl-md bg-white/85 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md"
    : "rounded-[22px] rounded-br-md bg-gradient-to-br from-aura-rose to-aura-fuchsia px-4 py-2.5 shadow-cta ring-1 ring-white/30 ring-inset";
  const textColor = isLeft ? "text-aura-ink" : "text-white";
  const caretColor = isLeft ? "bg-aura-rose/70" : "bg-white/85";
  const draftClass = item.isDraft === true ? "opacity-95" : "";

  return (
    <motion.li {...animation} className={`flex ${justify} ${tightClass}`}>
      <div className={`flex max-w-[78%] flex-col gap-1 ${itemsAlign}`}>
        {showName ? (
          <span
            className={`px-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] ${nameAlign}`}
          >
            {member.name}
          </span>
        ) : null}
        <div className={`${bubbleClass} ${draftClass}`}>
          <p className={`text-body leading-relaxed ${textColor}`}>
            {item.text}
            {item.isStreaming === true ? (
              <span
                aria-hidden
                className={`ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full ${caretColor}`}
              />
            ) : null}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function NarratorBeat({
  item,
  animation,
}: {
  item: TranscriptItem;
  animation: ChatStreamAnimation;
}) {
  return (
    <motion.li {...animation} className="!my-7">
      <div className="flex flex-col items-center gap-2 px-2 text-center">
        <div className="flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-aura-violet/40 to-transparent" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-violet">
            {item.label}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-aura-violet/40 via-transparent to-transparent" />
        </div>
        <p className="aura-accent max-w-md text-lead leading-snug text-aura-muted">
          &ldquo;{item.text}&rdquo;
        </p>
      </div>
    </motion.li>
  );
}

function CupidPin({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="!my-6 flex justify-center">
      <div className="aura-glass-rose relative max-w-md rounded-card px-5 pt-5 pb-3.5 text-center">
        <span
          aria-hidden
          className="absolute -top-1.5 left-1/2 grid size-3.5 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-rose shadow-[0_3px_8px_rgba(244,63,94,0.45)] ring-2 ring-white/85"
        >
          <span className="size-1 rounded-full bg-white/90" />
        </span>
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          // cupid nudge
        </p>
        <p className="mt-1.5 text-label leading-snug text-aura-ink/85">{item.text}</p>
      </div>
    </motion.li>
  );
}

function JudgeNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="flex justify-center">
      <div className="max-w-md rounded-tile bg-emerald-50/80 px-3.5 py-2 ring-1 ring-emerald-500/20">
        <p className="text-center font-mono text-micro font-semibold uppercase tracking-[0.24em] text-emerald-700">
          {item.label}
        </p>
        <p className="mt-0.5 text-center text-label leading-snug text-emerald-900/80">
          {item.text}
        </p>
      </div>
    </motion.li>
  );
}

function SystemNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="flex justify-center">
      <p className="max-w-md text-center font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        {item.text}
      </p>
    </motion.li>
  );
}

function CupidTypingIndicator() {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-[22px] rounded-bl-md bg-white/70 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md">
      <span aria-hidden className="flex items-center gap-1">
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/55 [animation-delay:0ms]" />
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/65 [animation-delay:180ms]" />
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/75 [animation-delay:360ms]" />
      </span>
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        Cupid is listening
      </span>
    </div>
  );
}

function FinalReportPanel({
  report,
  isActionPending,
  onFollowUp,
}: {
  report: DateFinalReport;
  isActionPending: boolean;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  const followUpKeys = Object.keys(FOLLOW_UP_LABELS) as FollowUpAction[];
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      className="mt-10 border-t border-aura-hairline pt-8"
    >
      <Eyebrow>// final report</Eyebrow>
      <p className="mt-3 max-w-2xl text-lead text-aura-ink">{report.summary}</p>
      <p className="mt-2 max-w-2xl text-label text-aura-muted">{report.statSummary}</p>
      <p className="mt-4 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        Recommended follow-up:{" "}
        <span className="text-aura-rose">{FOLLOW_UP_LABELS[report.recommendedFollowUp]}</span>
      </p>
      {report.appliedFollowUp === undefined ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {followUpKeys.map((action) => (
            <GhostButton key={action} disabled={isActionPending} onClick={() => onFollowUp(action)}>
              {FOLLOW_UP_LABELS[action]}
            </GhostButton>
          ))}
        </div>
      ) : (
        <p className="mt-4 font-mono text-micro uppercase tracking-[0.24em] text-emerald-600">
          Filed: {FOLLOW_UP_LABELS[report.appliedFollowUp]}
        </p>
      )}
    </motion.section>
  );
}

function DateFooter({
  session,
  interventionText,
  canAdvance,
  canIntervene,
  isActionPending,
  onInterventionTextChange,
  onAdvance,
  onComplete,
  onIntervene,
}: {
  session: DateSession;
  interventionText: string;
  canAdvance: boolean;
  canIntervene: boolean;
  isActionPending: boolean;
  onInterventionTextChange: (text: string) => void;
  onAdvance: () => void;
  onComplete: () => void;
  onIntervene: () => void;
}) {
  const interventionDisabled = !canAdvance || session.intervention !== undefined;

  return (
    <motion.footer
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 px-6 lg:bottom-8"
    >
      <div className="aura-glass-strong pointer-events-auto mx-auto w-full max-w-4xl rounded-card px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex flex-1 items-center gap-3">
            <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-rose">
              Cupid suggests
            </span>
            <input
              type="text"
              value={interventionText}
              maxLength={240}
              disabled={interventionDisabled}
              onChange={(event) => onInterventionTextChange(event.target.value)}
              placeholder={
                session.intervention === undefined
                  ? "draft a nudge"
                  : "one intervention per date. Filed."
              }
              className="min-w-0 flex-1 bg-transparent font-sans text-body text-aura-ink outline-none placeholder:text-aura-faint disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GhostButton onClick={onIntervene} disabled={!canIntervene}>
              File nudge
            </GhostButton>
            {session.status === "active" ? (
              <>
                <GhostButton onClick={onComplete} disabled={!canAdvance}>
                  Resolve date
                </GhostButton>
                <PrimaryButton onClick={onAdvance} disabled={!canAdvance}>
                  {isActionPending ? "Streaming." : "Advance"}
                </PrimaryButton>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

/* ================================================================== */
/* Shared pieces                                                      */
/* ================================================================== */

export function ViewFrame({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-4xl"} px-6 pb-40 pt-6 lg:px-10`}
    >
      {children}
    </motion.div>
  );
}

function ViewHeader({
  eyebrow,
  title,
  accent,
  subhead,
  rightSlot,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subhead: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-8">
      <div className="max-w-3xl space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-display-xl font-semibold leading-[0.95] tracking-tight text-aura-ink">
          {title}
        </h1>
        {accent === undefined ? null : (
          <p className="aura-accent text-display-sm text-aura-rose/85">{accent}</p>
        )}
        <p className="max-w-2xl text-lead text-aura-muted">{subhead}</p>
      </div>
      {rightSlot === undefined ? null : <div className="pt-4">{rightSlot}</div>}
    </header>
  );
}

function EmptyState({
  eyebrow,
  title,
  subhead,
  action,
}: {
  eyebrow: string;
  title: string;
  subhead: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="max-w-md space-y-5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          {title}
        </h1>
        <p className="text-lead text-aura-muted">{subhead}</p>
        <div className="pt-2">{action}</div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Shift report overlay                                               */
/* ================================================================== */

export function ShiftReportPanel({
  shift,
  members,
  isActionPending,
  onOpenNextShift,
}: {
  shift: ShiftState;
  members: Member[];
  isActionPending: boolean;
  onOpenNextShift: () => void;
}) {
  if (shift.status !== "completed" || shift.report === undefined) {
    return null;
  }

  const report = shift.report;

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/60 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_QUART }}
        className="aura-glass-strong mx-6 w-full max-w-2xl rounded-card p-10"
      >
        <Eyebrow>{`// shift.${pad2(shift.shiftNumber)} closed`}</Eyebrow>
        <h2 className="mt-3 font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          Shift filed
        </h2>
        <p className="mt-3 text-lead text-aura-muted">{report.summary}</p>

        <ul className="mt-8 space-y-3">
          {report.goalResults.map((result) => (
            <li key={result.goalId} className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-label uppercase tracking-[0.18em] text-aura-faint">
                {result.summary}
              </span>
              <span
                className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${
                  result.status === "met" ? "text-emerald-600" : "text-aura-rose"
                }`}
              >
                {result.status}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-label text-aura-muted">
            {members.length} members on file. Cupid keeps the receipts.
          </p>
          <PrimaryButton disabled={isActionPending} onClick={onOpenNextShift}>
            Open next shift
          </PrimaryButton>
        </div>
      </motion.div>
    </motion.aside>
  );
}

/* ================================================================== */
/* Loading                                                            */
/* ================================================================== */

export function DashboardLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-aura-bg text-aura-ink">
      <div className="flex flex-col items-center gap-3">
        <LiveDot />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          Cupid Operations
        </p>
        <p className="text-body text-aura-muted">Reaching across timelines. One moment.</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

export function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

const SCORE_WIDTH_CLASSES = [
  "w-0",
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-[50%]",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-full",
] as const;

function scoreWidthClass(score: number): (typeof SCORE_WIDTH_CLASSES)[number] {
  const boundedScore = Math.min(100, Math.max(0, score));
  const index = Math.round(boundedScore / 5);
  return SCORE_WIDTH_CLASSES[index] ?? "w-full";
}

function buildTranscriptItems(
  session: DateSession,
  members: Member[],
  scenario: DateScenario | undefined,
  streamingDrafts: StreamingDraftMessage[],
): TranscriptItem[] {
  const messageItems: TranscriptItem[] = session.transcript.map((message) => {
    if (message.kind === "character") {
      const member = members.find((candidate) => candidate.id === message.speakerId);
      return {
        id: `turn-${message.sequenceIndex}`,
        order: message.sequenceIndex * 10,
        label: member?.name ?? "Member",
        tone: "member",
        text: message.text,
        member,
      };
    }
    return {
      id: `turn-${message.sequenceIndex}`,
      order: message.sequenceIndex * 10,
      label:
        message.kind === "scenario"
          ? (scenario?.title ?? "Scenario")
          : message.kind === "cupid"
            ? "Cupid intervention"
            : "System",
      tone: message.kind,
      text: message.text,
    };
  });
  const lastSequenceByExchange = new Map<number, number>();
  for (const message of session.transcript) {
    if (message.kind !== "character") {
      continue;
    }
    const exchangeIndex = Math.floor((message.turnIndex - 1) / 2);
    const previous = lastSequenceByExchange.get(exchangeIndex) ?? 0;
    if (message.sequenceIndex > previous) {
      lastSequenceByExchange.set(exchangeIndex, message.sequenceIndex);
    }
  }
  const judgeItems: TranscriptItem[] = session.judgeSnapshots.map((snapshot) => ({
    id: `turn-judge-${snapshot.exchangeIndex}`,
    order: (lastSequenceByExchange.get(snapshot.exchangeIndex) ?? 0) * 10 + 5,
    label: "Judge note",
    tone: "judge",
    text: snapshot.playerSummary,
  }));
  const committedSequenceIndexes = new Set(
    session.transcript.map((message) => message.sequenceIndex),
  );
  const draftItems: TranscriptItem[] = streamingDrafts
    .filter((draft) => !committedSequenceIndexes.has(draft.sequenceIndex))
    .map((draft) => {
      const member = members.find((candidate) => candidate.id === draft.speakerId);

      return {
        id: draft.id,
        order: draft.sequenceIndex * 10,
        label: member?.name ?? draft.speakerName,
        tone: "member",
        text: draft.text,
        member,
        isDraft: true,
        isStreaming: draft.status === "streaming",
      };
    });

  return [...messageItems, ...draftItems, ...judgeItems].sort(
    (first, second) => first.order - second.order,
  );
}

function buildReactionSignals(
  session: DateSession,
  leftMemberId: string,
  rightMemberId: string,
): ReactionSignal[] {
  const latestJudge = session.judgeSnapshots.at(-1);

  if (latestJudge === undefined) {
    return [];
  }

  const signals: ReactionSignal[] = [];
  const participants = [
    { memberId: leftMemberId, side: "left" as const },
    { memberId: rightMemberId, side: "right" as const },
  ];
  const dateDelta = latestJudge.dateHealthDelta;
  const sparkDelta = latestJudge.statDeltas.spark ?? 0;
  const chemistryDelta = latestJudge.statDeltas.chemistry ?? 0;
  const trustDelta = latestJudge.statDeltas.trust ?? 0;
  const stabilityDelta = latestJudge.statDeltas.stability ?? 0;
  const relationshipDelta = latestJudge.statDeltas.relationshipHealth ?? 0;
  const strainDelta = latestJudge.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge.statDeltas.conflict ?? 0;
  const textSignal = [latestJudge.playerSummary, ...latestJudge.notableMoments]
    .join(" ")
    .toLowerCase();
  const sharedPositive = Math.max(dateDelta, sparkDelta, chemistryDelta, relationshipDelta);
  const sharedCare = Math.max(trustDelta, stabilityDelta);
  const sharedTrouble = Math.max(-dateDelta, strainDelta, conflictDelta);

  for (const participant of participants) {
    const moodDelta = latestJudge.memberMoodDeltas[participant.memberId] ?? 0;

    if (sharedPositive > 0 || moodDelta > 0) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "spark",
        Math.max(sharedPositive, moodDelta),
      );
    }

    if (sparkDelta >= 3 || chemistryDelta >= 3 || moodDelta >= 3) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "love",
        Math.max(sparkDelta, chemistryDelta, moodDelta),
      );
    }

    if (sharedCare >= 3) {
      pushReaction(signals, latestJudge, participant.side, "love", sharedCare);
    }

    if (
      textSignal.includes("laugh") ||
      textSignal.includes("joke") ||
      textSignal.includes("funny")
    ) {
      pushReaction(signals, latestJudge, participant.side, "laugh", 3);
    }

    if (sharedTrouble >= 4 || latestJudge.shouldEndEarly) {
      pushReaction(signals, latestJudge, participant.side, "anger", sharedTrouble);
    } else if (sharedTrouble > 0) {
      pushReaction(signals, latestJudge, participant.side, "warning", sharedTrouble);
    }

    if (moodDelta <= -3) {
      pushReaction(signals, latestJudge, participant.side, "cry", Math.abs(moodDelta));
    }
  }

  return signals;
}

function pushReaction(
  signals: ReactionSignal[],
  judgeSnapshot: JudgeSnapshot,
  side: ReactionSignal["side"],
  kind: ReactionKind,
  value: number,
) {
  const sideCount = signals.filter((signal) => signal.side === side).length;

  if (sideCount >= 4 || signals.some((signal) => signal.side === side && signal.kind === kind)) {
    return;
  }

  signals.push({
    id: `${judgeSnapshot.id}-${side}-${kind}`,
    side,
    kind,
    intensity: reactionIntensity(value),
  });
}

function reactionIntensity(value: number): number {
  const magnitude = Math.abs(value);

  if (magnitude >= 6) {
    return 3;
  }

  if (magnitude >= 3) {
    return 2;
  }

  return 1;
}
