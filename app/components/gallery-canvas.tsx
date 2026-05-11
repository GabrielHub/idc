import { motion } from "motion/react";
import { useMemo, useState } from "react";

import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import { canBeFocusCase, FOCUS_CASE_LIMIT } from "../services/focus-cases";
import { buildVisibleMemberProfile } from "../services/player-knowledge";
import { Eyebrow, GhostButton, Hairline, Portrait, PrimaryButton } from "./dashboard-atoms";

export type GalleryCanvasProps = {
  members: Member[];
  focusedMemberIds: string[];
  playerKnowledge: PlayerKnowledgeRecord[];
  isActionPending: boolean;
  onAddFocus: (memberId: string) => void;
  onRemoveFocus: (memberId: string) => void;
  onSwapFocus: (oldId: string, newId: string) => void;
  onBack: () => void;
};

export function GalleryCanvas({
  members,
  focusedMemberIds,
  playerKnowledge,
  isActionPending,
  onAddFocus,
  onRemoveFocus,
  onSwapFocus,
  onBack,
}: GalleryCanvasProps) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [swapSource, setSwapSource] = useState<string | null>(null);

  const focusedSet = useMemo(() => new Set(focusedMemberIds), [focusedMemberIds]);
  const openMember = useMemo(
    () => members.find((member) => member.id === openMemberId) ?? null,
    [members, openMemberId],
  );
  const focusSlotsFull = focusedMemberIds.length >= FOCUS_CASE_LIMIT;

  function handleMemberClick(member: Member) {
    if (member.state.status !== "active") {
      setOpenMemberId(member.id);
      return;
    }
    if (swapSource !== null) {
      if (swapSource === member.id) {
        setSwapSource(null);
        return;
      }
      if (focusedSet.has(member.id)) {
        setSwapSource(null);
        return;
      }
      onSwapFocus(swapSource, member.id);
      setSwapSource(null);
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

  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 pb-32 pt-12 lg:px-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
            // gallery.roster
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-aura-ink lg:text-4xl">
            Members hall
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            Every member has a frame. Focus cases hang in gilded frames. Closed and quit members
            stay on the wall as a record.
          </p>
        </div>
        <GhostButton onClick={onBack}>← Back to office</GhostButton>
      </header>

      <Hairline />

      {swapSource !== null ? (
        <div className="mt-6 rounded-2xl border border-aura-rose/40 bg-aura-rose/5 px-4 py-3 text-sm text-aura-rose">
          Swapping out{" "}
          <strong>
            {members.find((member) => member.id === swapSource)?.firstName ?? swapSource}
          </strong>
          . Pick a new active member from the hall. The dropped case loses 25 retention.
          <button
            type="button"
            onClick={() => setSwapSource(null)}
            className="ml-3 cursor-pointer rounded-pill border border-aura-rose/40 px-3 py-1 font-mono text-micro uppercase tracking-[0.18em]"
          >
            Cancel
          </button>
        </div>
      ) : null}

      <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {members.map((member, index) => {
          const isFocused = focusedSet.has(member.id);
          const status = member.state.status;
          return (
            <motion.li
              key={member.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <button
                type="button"
                onClick={() => handleMemberClick(member)}
                disabled={isActionPending}
                data-sfx="click"
                className={`group relative flex w-full cursor-pointer flex-col gap-2 overflow-hidden rounded-3xl border bg-white p-3 text-left text-aura-ink transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isFocused
                    ? "border-aura-rose ring-2 ring-aura-rose/40 shadow-aura-soft"
                    : status === "active"
                      ? "border-aura-hairline hover:border-aura-rose/30 hover:shadow-aura-soft"
                      : "border-aura-hairline opacity-70"
                }`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-aura-cream">
                  <Portrait member={member} variant="card" />
                  {status === "closed" ? (
                    <span className="absolute inset-0 grid place-items-center bg-aura-cream/70 text-aura-rose">
                      <svg viewBox="0 0 60 60" className="size-24" fill="currentColor">
                        <path d="M30 50 L8 28 a12 12 0 0 1 17-17 l5 5 5-5 a12 12 0 0 1 17 17 z" />
                      </svg>
                    </span>
                  ) : null}
                  {status === "quit" ? (
                    <span className="absolute inset-0 grid place-items-center bg-aura-cream/70 text-aura-rose">
                      <svg
                        viewBox="0 0 60 60"
                        className="size-24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                      >
                        <path d="M12 12 L48 48" />
                        <path d="M48 12 L12 48" />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <div className="px-1">
                  <h3 className="font-display text-sm font-semibold tracking-tight">
                    {member.firstName}
                  </h3>
                  <p className="mt-1 text-micro font-mono uppercase tracking-[0.18em] text-aura-faint">
                    {status === "active" ? (isFocused ? "focus case" : "candidate") : status}
                  </p>
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>

      {openMember !== null ? (
        <MemberSheet
          member={openMember}
          playerKnowledge={playerKnowledge}
          isFocused={focusedSet.has(openMember.id)}
          focusSlotsFull={focusSlotsFull}
          onClose={() => setOpenMemberId(null)}
          onAdd={() => {
            onAddFocus(openMember.id);
            setOpenMemberId(null);
          }}
          onRemove={() => {
            onRemoveFocus(openMember.id);
            setOpenMemberId(null);
          }}
          onRequestSwap={() => {
            setSwapSource(openMember.id);
            setOpenMemberId(null);
          }}
        />
      ) : null}
    </section>
  );
}

function MemberSheet({
  member,
  playerKnowledge,
  isFocused,
  focusSlotsFull,
  onClose,
  onAdd,
  onRemove,
  onRequestSwap,
}: {
  member: Member;
  playerKnowledge: PlayerKnowledgeRecord[];
  isFocused: boolean;
  focusSlotsFull: boolean;
  onClose: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onRequestSwap: () => void;
}) {
  const active = member.state.status === "active";
  const canFocus = active && canBeFocusCase(member);
  const profile = buildVisibleMemberProfile(member, playerKnowledge);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 px-6 py-12">
      <div className="aura-glass-strong w-full max-w-lg rounded-3xl bg-white p-6 shadow-aura-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <Portrait member={member} variant="stage" />
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-aura-ink">
                {member.firstName}
              </h2>
              <p className="text-sm text-aura-muted">{member.name}</p>
              <p className="mt-1 text-micro font-mono uppercase tracking-[0.18em] text-aura-faint">
                {active ? "active intake" : member.state.status}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-sfx="click"
            className="cursor-pointer rounded-full border border-aura-hairline px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-ink"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm leading-relaxed text-aura-ink">
          {profile.publicFragments.map((fragment) => (
            <p key={fragment}>{fragment}</p>
          ))}
        </div>
        <RedactedBlocks blocks={profile.redactedBlocks} />
        <div className="mt-5">
          <Eyebrow>// filed reads</Eyebrow>
          <FiledReads reads={profile.revealedReads} />
        </div>

        {member.state.status === "closed" ? (
          <p className="mt-4 rounded-2xl border border-aura-hairline bg-aura-cream-soft px-4 py-2 text-sm text-aura-muted">
            Case closed. Cupid has filed this pair as complete.
          </p>
        ) : null}
        {member.state.status === "quit" ? (
          <p className="mt-4 rounded-2xl border border-aura-rose/30 bg-aura-rose/5 px-4 py-2 text-sm text-aura-rose">
            Cancelled membership. This member is no longer using the app.
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          {isFocused ? (
            active ? (
              <GhostButton onClick={onRequestSwap}>Swap focus</GhostButton>
            ) : (
              <PrimaryButton onClick={onRemove}>Free slot</PrimaryButton>
            )
          ) : canFocus ? (
            focusSlotsFull ? (
              <PrimaryButton onClick={onRequestSwap}>Swap into focus →</PrimaryButton>
            ) : (
              <PrimaryButton onClick={onAdd}>Add as focus case →</PrimaryButton>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RedactedBlocks({
  blocks,
}: {
  blocks: ReturnType<typeof buildVisibleMemberProfile>["redactedBlocks"];
}) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="rounded-2xl bg-aura-cream-soft p-3 ring-1 ring-aura-hairline"
        >
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {block.label}
          </p>
          <div className="mt-3 space-y-1.5" aria-hidden>
            {Array.from({ length: block.lineCount }, (_, index) => (
              <span
                key={`${block.id}-${index}`}
                className="block h-2 rounded-pill bg-aura-hairline"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FiledReads({ reads }: { reads: readonly PlayerKnowledgeRecord[] }) {
  if (reads.length === 0) {
    return <p className="mt-2 text-sm text-aura-muted">No player-facing reads filed yet.</p>;
  }

  return (
    <ul className="mt-2 space-y-2">
      {reads.map((read) => (
        <li key={read.id} className="rounded-2xl bg-aura-cream-soft p-3 ring-1 ring-aura-hairline">
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            {read.readKind.replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-sm leading-snug text-aura-ink">{read.readText}</p>
        </li>
      ))}
    </ul>
  );
}
