import { useMemo, useState } from "react";

import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import { FOCUS_CASE_LIMIT } from "../services/focus-cases";
import { buildVisibleMemberProfile } from "../services/player-knowledge";
import { AmbientMesh } from "./ambient-mesh";
import { GhostButton, PrimaryButton } from "./dashboard-atoms";
import { MemberCard, MemberDetailsModal, type MemberCardState } from "./member-card";

export type OnboardingScreenProps = {
  members: Member[];
  onConfirm: (memberIds: string[]) => void;
};

export function OnboardingScreen({ members, onConfirm }: OnboardingScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  const playerKnowledge = useMemo<PlayerKnowledgeRecord[]>(() => [], []);

  const eligibleMembers = useMemo(
    () => members.filter((member) => member.state.status === "active"),
    [members],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length === 0) return eligibleMembers;
    return eligibleMembers.filter((member) => {
      const profile = buildVisibleMemberProfile(member, []);
      const haystack = [member.firstName, member.name, ...profile.publicFragments]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [eligibleMembers, searchQuery]);

  function toggle(memberId: string) {
    setSelectedIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      if (current.length >= FOCUS_CASE_LIMIT) {
        return current;
      }
      return [...current, memberId];
    });
  }

  const canContinue = selectedIds.length === FOCUS_CASE_LIMIT;
  const openMember =
    openMemberId === null ? null : (members.find((member) => member.id === openMemberId) ?? null);

  function stateFor(member: Member): MemberCardState {
    const isSelected = selectedIds.includes(member.id);
    if (isSelected) return "selected";
    if (!isSelected && selectedIds.length >= FOCUS_CASE_LIMIT) return "disabled";
    return "default";
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden px-6 pb-40 pt-20 lg:px-12">
      <AmbientMesh />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-14 text-center">
          <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
            // onboarding.cases
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-aura-ink lg:text-display-md">
            Pick four cases to focus
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-body text-aura-muted">
            Cupid keeps four open case files at a time. Closed cases free a slot. Pick the four
            members whose love lives matter to you most right now.
          </p>
          <p className="aura-accent mx-auto mt-2 max-w-xl text-lead text-aura-faint">
            Files can be reassigned later from the roster.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="aura-glass flex items-center gap-2.5 rounded-pill px-4 py-2">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search the roster"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-64 bg-transparent text-sm text-aura-ink placeholder:text-aura-faint focus:outline-none"
            />
          </div>
          <SelectionTally selectedCount={selectedIds.length} />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-card border border-aura-hairline bg-white/70 px-8 py-16 text-center shadow-quiet">
            <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-faint">
              // no matches
            </p>
            <p className="mt-3 text-body text-aura-muted">
              No members match {`"${searchQuery}"`}. Try another name.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((member, index) => {
              const isSelected = selectedIds.includes(member.id);
              const selectionIndex = selectedIds.indexOf(member.id);
              return (
                <MemberCard
                  key={member.id}
                  member={member}
                  state={stateFor(member)}
                  density="standard"
                  playerKnowledge={playerKnowledge}
                  index={index}
                  priorityIndex={isSelected ? selectionIndex : undefined}
                  onClick={() => toggle(member.id)}
                  onExpand={() => setOpenMemberId(member.id)}
                />
              );
            })}
          </ul>
        )}

        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
          <div className="aura-glass-strong pointer-events-auto flex items-center gap-4 rounded-pill px-5 py-3 shadow-aura-soft">
            <GhostButton onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>
              Clear
            </GhostButton>
            <PrimaryButton
              disabled={!canContinue}
              onClick={() => {
                if (canContinue) {
                  onConfirm(selectedIds);
                }
              }}
            >
              Open the lobby
              <span className="ml-2 inline-block">→</span>
            </PrimaryButton>
          </div>
        </div>
      </div>

      {openMember === null ? null : (
        <MemberDetailsModal
          member={openMember}
          playerKnowledge={playerKnowledge}
          isFocused={selectedIds.includes(openMember.id)}
          onClose={() => setOpenMemberId(null)}
          primaryAction={
            selectedIds.includes(openMember.id) || selectedIds.length < FOCUS_CASE_LIMIT
              ? {
                  label: selectedIds.includes(openMember.id) ? "Drop from focus" : "Add to focus →",
                  onClick: () => {
                    toggle(openMember.id);
                    setOpenMemberId(null);
                  },
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 text-aura-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 L13.5 13.5" strokeLinecap="round" />
    </svg>
  );
}

function SelectionTally({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: FOCUS_CASE_LIMIT }).map((_, index) => {
          const filled = index < selectedCount;
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
            selectedCount === FOCUS_CASE_LIMIT
              ? "text-aura-rose"
              : selectedCount > 0
                ? "text-aura-ink"
                : "text-aura-faint"
          }
        >
          {selectedCount}
        </span>
        <span className="mx-1">/</span>
        {FOCUS_CASE_LIMIT} selected
      </p>
    </div>
  );
}
