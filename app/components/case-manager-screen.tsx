import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";

import type { GameSave, Member, PlayerKnowledgeRecord } from "../domain/game";
import {
  canBeFocusCase,
  FOCUS_CASE_LIMIT,
  FOCUS_SWAP_RETENTION_PENALTY,
} from "../services/focus-cases";
import {
  applyMemberRosterFilters,
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  type MemberRosterFilterState,
} from "../services/member-roster-filter";
import { useTutorialStep } from "../services/tutorial";
import { AmbientMesh } from "./ambient-mesh";
import { ReselectDock } from "./constellation-lobby/reselect-dock";
import { EASE_OUT_QUART, Portrait } from "./dashboard-atoms";
import {
  MemberCard,
  MemberDetailsModal,
  PendingMemberCard,
  rosterGridFillerClasses,
  type MemberCardState,
} from "./member-card";
import { RosterFilterBar, RosterFilterEmptyState } from "./roster-filter-bar";
import { TutorialCoachMark, TutorialSpotlight } from "./tutorial";

export type CaseManagerScreenProps = {
  members: Member[];
  save: GameSave;
  /** Working set of next focus IDs. Pre-seeded by the lobby when entering. */
  draftIds: readonly string[];
  /** Original focused IDs (active only). Drives the slot strip at the top. */
  baselineFocusedIds: readonly string[];
  playerKnowledge: readonly PlayerKnowledgeRecord[];
  isActionPending: boolean;
  revealAllMemberDetails: boolean;
  onTutorialUpdate: (next: GameSave) => void;
  onToggleMember: (memberId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CaseManagerScreen({
  members,
  save,
  draftIds,
  baselineFocusedIds,
  playerKnowledge,
  isActionPending,
  revealAllMemberDetails,
  onTutorialUpdate,
  onToggleMember,
  onCancel,
  onConfirm,
}: CaseManagerScreenProps) {
  const [filterState, setFilterState] = useState<MemberRosterFilterState>(
    DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  );
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const swapPenaltyAnchorRef = useRef<HTMLElement | null>(null);
  const swapPenaltyStep = useTutorialStep(save, "lazy.roster.swap-penalty", true, onTutorialUpdate);

  const draftSet = useMemo(() => new Set(draftIds), [draftIds]);
  const baselineSet = useMemo(() => new Set(baselineFocusedIds), [baselineFocusedIds]);

  const baselineMembers = useMemo(
    () =>
      baselineFocusedIds
        .map((id) => members.find((m) => m.id === id))
        .filter((m): m is Member => m !== undefined),
    [baselineFocusedIds, members],
  );

  // Grid pool: active members not already in the baseline rack. The slot strip
  // owns baseline keep/drop affordances; the grid owns new pickups so the two
  // surfaces stay disjoint.
  const candidatePool = useMemo(
    () => members.filter((m) => canBeFocusCase(m) && !baselineSet.has(m.id)),
    [members, baselineSet],
  );

  const filtered = useMemo(
    () => applyMemberRosterFilters(candidatePool, filterState),
    [candidatePool, filterState],
  );

  const draftCount = draftIds.length;
  const drops = useMemo(
    () => baselineMembers.filter((m) => !draftSet.has(m.id)),
    [baselineMembers, draftSet],
  );
  const totalDropCost = drops.length * FOCUS_SWAP_RETENTION_PENALTY;
  const draftFull = draftCount >= FOCUS_CASE_LIMIT;

  function cardStateFor(member: Member): MemberCardState {
    if (draftSet.has(member.id)) return "selected";
    if (draftFull) return "disabled";
    return "default";
  }

  function handleCardClick(member: Member) {
    const inDraft = draftSet.has(member.id);
    if (!inDraft && draftFull) return;
    onToggleMember(member.id);
  }

  const openMember =
    openMemberId === null ? null : (members.find((m) => m.id === openMemberId) ?? null);
  const openMemberInDraft = openMember !== null && draftSet.has(openMember.id);
  const openMemberInBaseline = openMember !== null && baselineSet.has(openMember.id);

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-[#07041a] px-6 pb-40 pt-20 text-aura-paper lg:px-12">
      <AmbientMesh />

      <div className="relative mx-auto max-w-[88rem]">
        <header ref={swapPenaltyAnchorRef} className="mb-10 text-center">
          <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
            // case.manager
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-aura-paper lg:text-display-md">
            Manage your case load
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body text-white/70">
            Cupid runs on four open files at a time. Dropping a case costs the client{" "}
            <span className="text-aura-rose">{FOCUS_SWAP_RETENTION_PENALTY} retention</span>. Drop a
            slot above, add a candidate below, then file the change.
          </p>
        </header>

        <FocusSlotStrip
          baselineMembers={baselineMembers}
          draftSet={draftSet}
          onToggle={onToggleMember}
        />

        <div className="my-8 flex flex-wrap items-center justify-between gap-4">
          <RosterFilterBar filterState={filterState} onChange={setFilterState} tone="dark" />
          <SwapSummary
            draftCount={draftCount}
            dropCount={drops.length}
            totalDropCost={totalDropCost}
          />
        </div>

        {filtered.length === 0 ? (
          <RosterFilterEmptyState />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                state={cardStateFor(member)}
                density="standard"
                playerKnowledge={playerKnowledge}
                revealAllDetails={revealAllMemberDetails}
                index={index}
                hideSealedSummary
                onClick={() => handleCardClick(member)}
                onExpand={() => setOpenMemberId(member.id)}
              />
            ))}
            {rosterGridFillerClasses(filtered.length).map((fillerClass, fillerIndex) => (
              <PendingMemberCard key={`filler-${fillerIndex}`} className={fillerClass} />
            ))}
          </ul>
        )}
      </div>

      <ReselectDock
        draftCount={draftCount}
        drops={drops}
        totalDropCost={totalDropCost}
        isActionPending={isActionPending}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />

      {openMember === null ? null : (
        <MemberDetailsModal
          member={openMember}
          playerKnowledge={playerKnowledge}
          revealAllDetails={revealAllMemberDetails}
          isFocused={openMemberInDraft}
          save={save}
          onTutorialUpdate={onTutorialUpdate}
          onClose={() => setOpenMemberId(null)}
          primaryAction={resolveModalAction({
            inDraft: openMemberInDraft,
            inBaseline: openMemberInBaseline,
            draftFull,
            onToggle: () => {
              onToggleMember(openMember.id);
              setOpenMemberId(null);
            },
          })}
        />
      )}

      {swapPenaltyStep.active ? (
        <>
          <TutorialSpotlight target={swapPenaltyAnchorRef} padding={12} radius={20} />
          <TutorialCoachMark
            target={swapPenaltyAnchorRef}
            placement="bottom"
            title="Swapping costs retention"
            body={`Dropping a focused case costs ${FOCUS_SWAP_RETENTION_PENALTY} retention on that file. Lifelong customer relationships, also paperwork. Pick the next member to seal the swap.`}
            primaryLabel="Got it"
            onPrimary={swapPenaltyStep.complete}
            dismissLabel="Skip tour"
            onDismiss={swapPenaltyStep.dismiss}
          />
        </>
      ) : null}
    </div>
  );
}

function resolveModalAction({
  inDraft,
  inBaseline,
  draftFull,
  onToggle,
}: {
  inDraft: boolean;
  inBaseline: boolean;
  draftFull: boolean;
  onToggle: () => void;
}) {
  if (inDraft) {
    return {
      label: inBaseline
        ? `Drop from focus  ·  −${FOCUS_SWAP_RETENTION_PENALTY} retention`
        : "Remove from draft",
      onClick: onToggle,
    };
  }
  if (draftFull) return undefined;
  return { label: "Add to focus", onClick: onToggle };
}

function FocusSlotStrip({
  baselineMembers,
  draftSet,
  onToggle,
}: {
  baselineMembers: readonly Member[];
  draftSet: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  const emptySlotCount = Math.max(0, FOCUS_CASE_LIMIT - baselineMembers.length);

  return (
    <section
      aria-label="Current case load"
      className="aura-liquid-glass relative overflow-hidden rounded-card px-6 py-6 lg:px-8"
    >
      <div className="mb-5 flex items-center gap-3">
        <span aria-hidden className="aura-pulse size-1.5 rounded-full bg-aura-rose" />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          // current case load
        </span>
        <span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-r from-white/30 via-white/15 to-transparent"
        />
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
          click a slot to drop
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {baselineMembers.map((member) => (
          <FocusSlot
            key={member.id}
            member={member}
            kept={draftSet.has(member.id)}
            onToggle={() => onToggle(member.id)}
          />
        ))}
        {Array.from({ length: emptySlotCount }).map((_, i) => (
          <EmptySlot key={`empty-${i}`} />
        ))}
      </ul>
    </section>
  );
}

function FocusSlot({
  member,
  kept,
  onToggle,
}: {
  member: Member;
  kept: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={!kept}
        aria-label={
          kept ? `Drop ${member.firstName} from focus` : `Restore ${member.firstName} to focus`
        }
        className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-chip border px-3.5 py-3 text-left transition ${
          kept
            ? "border-aura-rose/45 bg-white/8 shadow-[0_8px_24px_-12px_rgba(244,63,94,0.4)]"
            : "border-rose-300/35 bg-rose-500/10"
        }`}
      >
        <motion.div
          initial={false}
          animate={{ opacity: kept ? 1 : 0.4, scale: kept ? 1 : 0.94 }}
          transition={{ duration: 0.28, ease: EASE_OUT_QUART }}
          className="relative size-12 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15"
        >
          <Portrait member={member} variant="row" asset="avatar" />
        </motion.div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-display text-base font-semibold text-aura-paper">
            {member.firstName}
          </p>
          <p className="mt-1 font-mono text-micro uppercase tracking-[0.22em]">
            {kept ? (
              <span className="inline-flex items-center gap-1.5 text-aura-rose">
                <span aria-hidden className="aura-pulse size-1 rounded-full bg-aura-rose" />
                kept
              </span>
            ) : (
              <span className="text-rose-300">
                drop · −{FOCUS_SWAP_RETENTION_PENALTY} retention
              </span>
            )}
          </p>
        </div>
      </button>
    </li>
  );
}

function EmptySlot() {
  return (
    <li>
      <div className="flex h-full items-center gap-3 rounded-chip border border-dashed border-white/20 bg-white/5 px-3.5 py-3 text-left">
        <div className="size-12 shrink-0 rounded-full bg-white/8" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-white/45">
            open slot
          </p>
          <p className="mt-1 font-mono text-micro uppercase tracking-[0.22em] text-white/35">
            pick below
          </p>
        </div>
      </div>
    </li>
  );
}

function SwapSummary({
  draftCount,
  dropCount,
  totalDropCost,
}: {
  draftCount: number;
  dropCount: number;
  totalDropCost: number;
}) {
  const draftTone =
    draftCount === FOCUS_CASE_LIMIT
      ? "text-aura-rose"
      : draftCount > FOCUS_CASE_LIMIT
        ? "text-amber-300"
        : "text-aura-paper";
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: FOCUS_CASE_LIMIT }).map((_, index) => {
          const filled = index < draftCount;
          return (
            <span
              key={index}
              className={`block h-1.5 w-8 rounded-pill transition-colors duration-300 ${
                filled ? "bg-gradient-to-r from-aura-rose to-aura-fuchsia" : "bg-white/15"
              }`}
            />
          );
        })}
      </div>
      <p className="font-mono text-micro uppercase tracking-[0.24em] text-white/55">
        <span className={draftTone}>{draftCount}</span>
        <span className="mx-1">/</span>
        {FOCUS_CASE_LIMIT} selected
      </p>
      {dropCount > 0 ? (
        <>
          <span aria-hidden className="h-3 w-px bg-white/15" />
          <p className="font-mono text-micro uppercase tracking-[0.24em] text-rose-300">
            <span
              aria-hidden
              className="mr-1.5 inline-block size-1.5 rounded-full bg-aura-rose align-middle"
            />
            −{totalDropCost} retention
          </p>
        </>
      ) : null}
    </div>
  );
}
