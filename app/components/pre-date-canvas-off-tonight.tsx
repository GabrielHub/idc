import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import type { GameSave, Member } from "../domain/game";
import type { ShiftPartnerUnavailableReason } from "../services/shift-availability";
import { MemberCard, type MemberCardPill, type MemberCardState } from "./member-card";

export type OffTonightEntry = {
  member: Member;
  reason: ShiftPartnerUnavailableReason;
};

export function OffTonightSection({
  entries,
  playerKnowledge,
  revealAllMemberDetails,
  onExpand,
}: {
  entries: ReadonlyArray<OffTonightEntry>;
  playerKnowledge: GameSave["playerKnowledge"];
  revealAllMemberDetails: boolean;
  onExpand: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const gridId = useId();

  if (entries.length === 0) {
    return null;
  }

  const countLabel = `${entries.length} ${entries.length === 1 ? "case" : "cases"}`;

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={gridId}
        data-sfx="menu"
        className="group flex w-full cursor-pointer items-center gap-4 text-left focus:outline-none"
      >
        <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
        <span className="inline-flex items-center gap-2.5 rounded-pill bg-white/70 px-4 py-1.5 ring-1 ring-aura-hairline transition group-hover:bg-white/90 group-hover:ring-aura-rose/40 group-focus-visible:ring-aura-rose/60">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
            Off tonight
          </span>
          <span aria-hidden className="h-3 w-px bg-aura-hairline" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
            {countLabel}
          </span>
          <span className="ml-0.5 inline-flex items-center text-aura-muted transition group-hover:text-aura-rose">
            <OffTonightChevron open={isOpen} />
          </span>
        </span>
        <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={gridId}
            key="off-tonight-grid"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {entries.map(({ member, reason }, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  state={disabledPartnerCardState(member)}
                  density="standard"
                  playerKnowledge={playerKnowledge}
                  revealAllDetails={revealAllMemberDetails}
                  index={index}
                  statusPill={UNAVAILABLE_REASON_PILL[reason]}
                  disabled
                  onExpand={() => onExpand(member.id)}
                />
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function OffTonightChevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6.5L8 10.5L12 6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const UNAVAILABLE_REASON_PILL: Record<ShiftPartnerUnavailableReason, MemberCardPill> = {
  cooldown: { tone: "amber", label: "cooldown" },
  focus_case: { tone: "ink", label: "focus case" },
  closed: { tone: "neutral", label: "closed" },
  quit: { tone: "neutral", label: "cancelled" },
  off_shift: { tone: "neutral", label: "off tonight" },
};

function disabledPartnerCardState(member: Member): MemberCardState {
  if (member.state.status === "closed") return "closed";
  if (member.state.status === "quit") return "quit";
  return "disabled";
}
