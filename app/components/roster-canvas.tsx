import { useMemo, useState } from "react";

import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import {
  canBeFocusCase,
  FOCUS_CASE_LIMIT,
  FOCUS_SWAP_RETENTION_PENALTY,
} from "../services/focus-cases";
import {
  applyMemberRosterFilters,
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  isMemberRosterFilterActive,
  type MemberRosterFilterState,
} from "../services/member-roster-filter";
import { sortMembersForRoster } from "../services/member-roster-order";
import { GhostButton, Hairline, PrimaryButton } from "./dashboard-atoms";
import {
  MemberCard,
  MemberDetailsModal,
  PendingMemberCard,
  rosterGridFillerClasses,
  type MemberCardState,
  type MemberDetailsAction,
} from "./member-card";
import { RosterFilterBar, RosterFilterEmptyState } from "./roster-filter-bar";

type FocusSwapDraft =
  | { kind: "drop-source"; focusedMemberId: string }
  | { kind: "incoming"; incomingMemberId: string };

export type RosterCanvasProps = {
  members: Member[];
  focusedMemberIds: string[];
  playerKnowledge: PlayerKnowledgeRecord[];
  isActionPending: boolean;
  revealAllMemberDetails: boolean;
  onAddFocus: (memberId: string) => void;
  onRemoveFocus: (memberId: string) => void;
  onSwapFocus: (oldId: string, newId: string) => void;
  onReselectFocus: (nextFocusIds: string[]) => void;
  onBack: () => void;
};

export function RosterCanvas({
  members,
  focusedMemberIds,
  playerKnowledge,
  isActionPending,
  revealAllMemberDetails,
  onAddFocus,
  onRemoveFocus,
  onSwapFocus,
  onReselectFocus,
  onBack,
}: RosterCanvasProps) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [swapDraft, setSwapDraft] = useState<FocusSwapDraft | null>(null);
  const [reselectDraft, setReselectDraft] = useState<readonly string[] | null>(null);
  const [filterState, setFilterState] = useState<MemberRosterFilterState>(
    DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  );

  const focusedSet = useMemo(() => new Set(focusedMemberIds), [focusedMemberIds]);
  const orderedMembers = useMemo(
    () =>
      applyMemberRosterFilters(members, filterState, {
        baseSort: (entries) => sortMembersForRoster(entries, focusedMemberIds),
        playerKnowledge,
        revealAllMemberDetails,
      }),
    [members, filterState, focusedMemberIds, playerKnowledge, revealAllMemberDetails],
  );
  const filterActive = isMemberRosterFilterActive(filterState);
  const resultLabel = filterActive
    ? `${orderedMembers.length} of ${members.length}`
    : `${members.length} cases`;
  const openMember = useMemo(
    () => members.find((member) => member.id === openMemberId) ?? null,
    [members, openMemberId],
  );
  const focusSlotsFull = focusedMemberIds.length >= FOCUS_CASE_LIMIT;
  const swapSourceMember =
    swapDraft?.kind === "drop-source"
      ? (members.find((member) => member.id === swapDraft.focusedMemberId) ?? null)
      : null;
  const swapIncomingMember =
    swapDraft?.kind === "incoming"
      ? (members.find((member) => member.id === swapDraft.incomingMemberId) ?? null)
      : null;

  const isReselecting = reselectDraft !== null;
  const draftSet = useMemo(() => new Set(reselectDraft ?? []), [reselectDraft]);
  const draftCount = reselectDraft?.length ?? 0;
  const draftFull = draftCount >= FOCUS_CASE_LIMIT;
  const reselectDrops = useMemo<Member[]>(() => {
    if (reselectDraft === null) return [];
    const draftIdSet = new Set(reselectDraft);
    const byId = new Map(members.map((member) => [member.id, member] as const));
    return focusedMemberIds
      .filter((id) => !draftIdSet.has(id))
      .map((id) => byId.get(id))
      .filter(
        (member): member is Member => member !== undefined && member.state.status === "active",
      );
  }, [reselectDraft, focusedMemberIds, members]);
  const totalDropCost = reselectDrops.length * FOCUS_SWAP_RETENTION_PENALTY;

  function enterReselect() {
    if (isReselecting) return;
    setSwapDraft(null);
    setOpenMemberId(null);
    const seedDraft = focusedMemberIds.filter((id) => {
      const member = members.find((candidate) => candidate.id === id);
      return member !== undefined && member.state.status === "active";
    });
    setReselectDraft(seedDraft);
  }

  function cancelReselect() {
    setReselectDraft(null);
  }

  function toggleReselectMember(memberId: string) {
    setReselectDraft((current) => {
      if (current === null) return current;
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      if (current.length >= FOCUS_CASE_LIMIT) {
        return current;
      }
      return [...current, memberId];
    });
  }

  function confirmReselect() {
    if (reselectDraft === null) return;
    if (reselectDraft.length !== FOCUS_CASE_LIMIT) return;
    onReselectFocus([...reselectDraft]);
    setReselectDraft(null);
  }

  function handleMemberClick(member: Member) {
    if (isReselecting) {
      if (member.state.status !== "active") {
        return;
      }
      if (draftSet.has(member.id)) {
        toggleReselectMember(member.id);
        return;
      }
      if (draftFull) {
        return;
      }
      toggleReselectMember(member.id);
      return;
    }

    if (member.state.status !== "active") {
      setOpenMemberId(member.id);
      return;
    }
    if (swapDraft !== null) {
      if (swapDraft.kind === "drop-source") {
        if (swapDraft.focusedMemberId === member.id) {
          setSwapDraft(null);
          return;
        }
        if (focusedSet.has(member.id)) {
          setSwapDraft({ kind: "drop-source", focusedMemberId: member.id });
          return;
        }
        onSwapFocus(swapDraft.focusedMemberId, member.id);
        setSwapDraft(null);
        return;
      }

      if (focusedSet.has(member.id)) {
        onSwapFocus(member.id, swapDraft.incomingMemberId);
        setSwapDraft(null);
        return;
      }
      if (swapDraft.incomingMemberId === member.id) {
        setSwapDraft(null);
        return;
      }
      setSwapDraft({ kind: "incoming", incomingMemberId: member.id });
      return;
    }
    if (focusedSet.has(member.id)) {
      setOpenMemberId(member.id);
      return;
    }
    if (!focusSlotsFull) {
      onAddFocus(member.id);
    } else {
      setOpenMemberId(member.id);
    }
  }

  function cardStateFor(member: Member): MemberCardState {
    const status = member.state.status;
    if (status === "closed") return "closed";
    if (status === "quit") return "quit";
    if (isReselecting) {
      if (draftSet.has(member.id)) return "selected";
      if (draftFull) return "disabled";
      return "default";
    }
    if (focusedSet.has(member.id)) return "focused";
    if (swapDraft?.kind === "incoming" && swapDraft.incomingMemberId === member.id) {
      return "selected";
    }
    if (swapDraft !== null && focusSlotsFull && !focusedSet.has(member.id)) return "default";
    if (swapDraft === null && focusSlotsFull) return "disabled";
    return "default";
  }

  function priorityIndexFor(member: Member): number | undefined {
    if (!isReselecting || reselectDraft === null) return undefined;
    const index = reselectDraft.indexOf(member.id);
    return index === -1 ? undefined : index;
  }

  return (
    <section className="relative mx-auto w-full max-w-canvas px-6 pb-32 pt-12 lg:px-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
            // roster.directory
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-aura-ink lg:text-4xl">
            Member roster
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            {isReselecting
              ? `Pick ${FOCUS_CASE_LIMIT} active cases. Dropping a focused member costs ${FOCUS_SWAP_RETENTION_PENALTY} retention.`
              : "Every member on file. Focus cases get a marked card. Closed and cancelled members stay on the roster as a record."}
          </p>
        </div>
        {isReselecting ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <GhostButton onClick={enterReselect} disabled={isActionPending}>
              Reselect focus cases
            </GhostButton>
            <GhostButton onClick={onBack}>← Back to Live Date</GhostButton>
          </div>
        )}
      </header>

      <Hairline />

      {swapSourceMember !== null && !isReselecting ? (
        <div className="mt-6 rounded-2xl border border-aura-rose/40 bg-aura-rose/5 px-4 py-3 text-sm text-aura-rose">
          Swapping out <strong>{swapSourceMember.firstName}</strong>. Pick a new active member from
          the roster. The dropped case loses {FOCUS_SWAP_RETENTION_PENALTY} retention.
          <button
            type="button"
            onClick={() => setSwapDraft(null)}
            className="ml-3 cursor-pointer rounded-pill border border-aura-rose/40 px-3 py-1 font-mono text-micro uppercase tracking-[0.18em]"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {swapIncomingMember !== null && !isReselecting ? (
        <div className="mt-6 rounded-2xl border border-aura-rose/40 bg-aura-rose/5 px-4 py-3 text-sm text-aura-rose">
          Swapping in <strong>{swapIncomingMember.firstName}</strong>. Pick a focused case to drop.
          The dropped case loses {FOCUS_SWAP_RETENTION_PENALTY} retention.
          <button
            type="button"
            onClick={() => setSwapDraft(null)}
            className="ml-3 cursor-pointer rounded-pill border border-aura-rose/40 px-3 py-1 font-mono text-micro uppercase tracking-[0.18em]"
          >
            Cancel
          </button>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <RosterFilterBar
          filterState={filterState}
          onChange={setFilterState}
          showStatus
          resultLabel={resultLabel}
        />
      </div>

      {orderedMembers.length === 0 ? (
        <div className="mt-8">
          <RosterFilterEmptyState />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orderedMembers.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              state={cardStateFor(member)}
              density="standard"
              playerKnowledge={playerKnowledge}
              revealAllDetails={revealAllMemberDetails}
              priorityIndex={priorityIndexFor(member)}
              index={index}
              disabled={isActionPending}
              onClick={() => handleMemberClick(member)}
              onExpand={() => setOpenMemberId(member.id)}
            />
          ))}
          {rosterGridFillerClasses(orderedMembers.length).map((fillerClass, fillerIndex) => (
            <PendingMemberCard key={`pending-${fillerIndex}`} className={fillerClass} />
          ))}
        </ul>
      )}

      {openMember === null ? null : (
        <MemberDetailsModal
          member={openMember}
          playerKnowledge={playerKnowledge}
          revealAllDetails={revealAllMemberDetails}
          isFocused={isReselecting ? draftSet.has(openMember.id) : focusedSet.has(openMember.id)}
          onClose={() => setOpenMemberId(null)}
          primaryAction={
            isReselecting
              ? buildReselectAction({
                  member: openMember,
                  inDraft: draftSet.has(openMember.id),
                  draftFull,
                  onToggle: () => {
                    toggleReselectMember(openMember.id);
                    setOpenMemberId(null);
                  },
                })
              : buildPrimaryAction({
                  member: openMember,
                  isFocused: focusedSet.has(openMember.id),
                  focusSlotsFull,
                  onAdd: () => {
                    onAddFocus(openMember.id);
                    setOpenMemberId(null);
                  },
                  onSwap: () => {
                    setSwapDraft(
                      focusedSet.has(openMember.id)
                        ? { kind: "drop-source", focusedMemberId: openMember.id }
                        : { kind: "incoming", incomingMemberId: openMember.id },
                    );
                    setOpenMemberId(null);
                  },
                })
          }
          secondaryAction={
            isReselecting
              ? undefined
              : buildSecondaryAction({
                  member: openMember,
                  isFocused: focusedSet.has(openMember.id),
                  onRemove: () => {
                    onRemoveFocus(openMember.id);
                    setOpenMemberId(null);
                  },
                })
          }
        />
      )}

      {isReselecting ? (
        <ReselectDock
          draftCount={draftCount}
          drops={reselectDrops}
          totalDropCost={totalDropCost}
          isActionPending={isActionPending}
          onCancel={cancelReselect}
          onConfirm={confirmReselect}
        />
      ) : null}
    </section>
  );
}

function ReselectDock({
  draftCount,
  drops,
  totalDropCost,
  isActionPending,
  onCancel,
  onConfirm,
}: {
  draftCount: number;
  drops: Member[];
  totalDropCost: number;
  isActionPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const canConfirm = !isActionPending && draftCount === FOCUS_CASE_LIMIT;
  const droppedNames = drops.map((member) => member.firstName).join(", ");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
      <div className="aura-glass-strong pointer-events-auto flex flex-wrap items-center justify-center gap-4 rounded-pill px-5 py-3 shadow-aura-soft">
        <ReselectTally count={draftCount} />
        {drops.length > 0 ? (
          <>
            <DockDivider />
            <div className="flex items-center gap-2 font-mono text-micro uppercase tracking-[0.22em]">
              <span aria-hidden className="size-1.5 rounded-full bg-aura-rose" />
              <span className="text-aura-faint">Dropping</span>
              <span className="text-aura-rose">{droppedNames}</span>
              <span aria-hidden className="text-aura-faint opacity-60">
                ·
              </span>
              <span className="text-aura-rose">−{totalDropCost} retention</span>
            </div>
          </>
        ) : null}
        <DockDivider />
        <div className="flex items-center gap-2">
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          <PrimaryButton onClick={onConfirm} disabled={!canConfirm}>
            Confirm reselect →
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ReselectTally({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: FOCUS_CASE_LIMIT }).map((_, index) => {
          const filled = index < count;
          return (
            <span
              key={index}
              className={`block h-1.5 w-8 rounded-pill transition-colors duration-300 ${
                filled ? "bg-gradient-to-r from-aura-rose to-aura-fuchsia" : "bg-aura-hairline"
              }`}
            />
          );
        })}
      </div>
      <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        <span
          className={
            count === FOCUS_CASE_LIMIT
              ? "text-aura-rose"
              : count > 0
                ? "text-aura-ink"
                : "text-aura-faint"
          }
        >
          {count}
        </span>
        <span className="mx-1">/</span>
        {FOCUS_CASE_LIMIT} selected
      </p>
    </div>
  );
}

function DockDivider() {
  return <span aria-hidden className="h-5 w-px bg-aura-hairline" />;
}

function buildPrimaryAction({
  member,
  isFocused,
  focusSlotsFull,
  onAdd,
  onSwap,
}: {
  member: Member;
  isFocused: boolean;
  focusSlotsFull: boolean;
  onAdd: () => void;
  onSwap: () => void;
}): MemberDetailsAction | undefined {
  if (!canBeFocusCase(member)) return undefined;
  if (isFocused) return { label: "Swap this focus", onClick: onSwap };
  if (focusSlotsFull) {
    return { label: "Swap into focus →", onClick: onSwap };
  }
  return { label: "Add as focus case →", onClick: onAdd };
}

function buildSecondaryAction({
  member,
  isFocused,
  onRemove,
}: {
  member: Member;
  isFocused: boolean;
  onRemove: () => void;
}): MemberDetailsAction | undefined {
  if (!isFocused) return undefined;
  if (member.state.status !== "active") {
    return { label: "Free slot", onClick: onRemove };
  }
  return { label: "Drop from focus", onClick: onRemove };
}

function buildReselectAction({
  member,
  inDraft,
  draftFull,
  onToggle,
}: {
  member: Member;
  inDraft: boolean;
  draftFull: boolean;
  onToggle: () => void;
}): MemberDetailsAction | undefined {
  if (!canBeFocusCase(member)) return undefined;
  if (inDraft) {
    return { label: "Drop from picks", onClick: onToggle };
  }
  if (draftFull) {
    return undefined;
  }
  return { label: "Add to picks →", onClick: onToggle };
}
