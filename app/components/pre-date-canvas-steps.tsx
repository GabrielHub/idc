import type { Ref } from "react";

import type { DateScenario, GameSave, Member, MemberRequest } from "../domain/game";
import { getMemberQuitRiskStatus, MEMBER_QUIT_RISK_LABEL } from "../services/date-engine";
import type { ScenarioRoomRead } from "../services/match-fit";
import { isMemberInCooldown } from "../services/shift-planning";
import { GhostButton } from "./dashboard-atoms";
import {
  MemberCard,
  type MemberCardPill,
  type MemberCardState,
  PendingMemberCard,
  rosterGridFillerClasses,
} from "./member-card";
import { ScenarioCard } from "./scenario-card";

function StepHeader({
  index,
  eyebrow,
  title,
  hint,
  rightSlot,
}: {
  index: number;
  eyebrow: string;
  title: string;
  hint: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-full border border-aura-rose/30 bg-white font-display text-base font-semibold text-aura-rose shadow-quiet">
          {index}
        </span>
        <div>
          <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-aura-ink">
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-aura-muted">{hint}</p>
        </div>
      </div>
      {rightSlot === undefined ? null : <div className="flex items-center gap-2">{rightSlot}</div>}
    </header>
  );
}

export function FocusStep({
  sectionRef,
  selectedCardRef,
  focusedMembers,
  activeFocusId,
  playerKnowledge,
  shiftNumber,
  requestForMember,
  revealAllMemberDetails,
  locked,
  onSelect,
  onOpenRoster,
  onExpand,
}: {
  sectionRef: Ref<HTMLElement>;
  selectedCardRef: Ref<HTMLLIElement>;
  focusedMembers: Member[];
  activeFocusId: string | null;
  playerKnowledge: GameSave["playerKnowledge"];
  shiftNumber: number;
  requestForMember: (member: Member) => MemberRequest | undefined;
  revealAllMemberDetails: boolean;
  locked: boolean;
  onSelect: (id: string) => void;
  onOpenRoster: () => void;
  onExpand: (id: string) => void;
}) {
  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={1}
        eyebrow="// step.01.focus"
        title={locked ? "Focus case (locked)" : "Focus case"}
        hint={
          locked
            ? "Pair is committed. Resolve or cancel the booking to reassign focus."
            : "Pick which case you're working tonight. Cooldowns and closed files cannot be picked."
        }
        rightSlot={<GhostButton onClick={onOpenRoster}>Manage roster</GhostButton>}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {focusedMembers.map((member, index) => {
          const isActive = member.id === activeFocusId;
          const isInCooldown = isMemberInCooldown(member, shiftNumber);
          const askPreview =
            member.state.status === "active" ? requestForMember(member)?.text : undefined;
          return (
            <MemberCard
              key={member.id}
              member={member}
              state={focusCardState(member, isActive)}
              density="compact"
              playerKnowledge={playerKnowledge}
              revealAllDetails={revealAllMemberDetails}
              index={index}
              cardRef={isActive ? selectedCardRef : undefined}
              statusPill={buildFocusPill(member, isInCooldown)}
              askPreview={askPreview}
              disabled={locked || member.state.status !== "active" || isInCooldown}
              onClick={() => {
                if (locked) return;
                if (member.state.status === "active" && !isInCooldown) onSelect(member.id);
              }}
              onExpand={() => onExpand(member.id)}
            />
          );
        })}
        {!locked && focusedMembers.length < 4 ? (
          <li className="list-none">
            <button
              type="button"
              onClick={onOpenRoster}
              data-sfx="click"
              className="flex h-full min-h-[5.5rem] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-aura-rose/40 bg-white/40 px-4 py-6 font-mono text-micro uppercase tracking-[0.24em] text-aura-rose transition hover:bg-white/60"
            >
              + add focus case
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export function PartnerStep({
  sectionRef,
  selectedCardRef,
  activeFocus,
  candidatePartners,
  partnerId,
  suggestedPartnerId,
  playerKnowledge,
  revealAllMemberDetails,
  locked,
  onOpenRoster,
  onSelect,
  onExpand,
}: {
  sectionRef: Ref<HTMLElement>;
  selectedCardRef: Ref<HTMLLIElement>;
  activeFocus: Member | null;
  candidatePartners: Member[];
  partnerId: string | null;
  suggestedPartnerId: string | null;
  playerKnowledge: GameSave["playerKnowledge"];
  revealAllMemberDetails: boolean;
  locked: boolean;
  onOpenRoster: () => void;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
}) {
  if (activeFocus === null) {
    return (
      <section ref={sectionRef} className="mt-10">
        <StepHeader
          index={2}
          eyebrow="// step.02.partner"
          title="Partner"
          hint="Pick a focus case first."
        />
      </section>
    );
  }

  if (candidatePartners.length === 0) {
    return (
      <section ref={sectionRef} className="mt-10">
        <StepHeader
          index={2}
          eyebrow="// step.02.partner"
          title={`Partner for ${activeFocus.firstName}`}
          hint="No eligible partners on file. Open the roster to add a focus case or wait out a cooldown."
          rightSlot={<GhostButton onClick={onOpenRoster}>Open roster</GhostButton>}
        />
      </section>
    );
  }

  const effectivePartnerId = partnerId ?? suggestedPartnerId;

  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={2}
        eyebrow="// step.02.partner"
        title={
          locked
            ? `Partner for ${activeFocus.firstName} (locked)`
            : `Partner for ${activeFocus.firstName}`
        }
        hint={
          locked
            ? "Pair is committed. The Date Book and partner are locked until the date resolves."
            : suggestedPartnerId === null
              ? "No clear recommendation on file. Pick any active member."
              : "Cupid found one clear booking recommendation. Tap any active member to override."
        }
        rightSlot={<GhostButton onClick={onOpenRoster}>Manage roster</GhostButton>}
      />
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {candidatePartners.map((member, index) => {
          const isPicked = member.id === effectivePartnerId;
          const isSuggested = member.id === suggestedPartnerId;
          const isUserOverride = isPicked && partnerId !== null;
          const cardState: MemberCardState = isPicked ? "selected" : "default";
          const statusPill: MemberCardPill | undefined = isUserOverride
            ? { tone: "rose", label: "your pick" }
            : isPicked || isSuggested
              ? { tone: "ink", label: "recommended" }
              : undefined;
          return (
            <MemberCard
              key={member.id}
              member={member}
              state={cardState}
              density="standard"
              playerKnowledge={playerKnowledge}
              revealAllDetails={revealAllMemberDetails}
              index={index}
              cardRef={isPicked ? selectedCardRef : undefined}
              statusPill={statusPill}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                onSelect(member.id);
              }}
              onExpand={() => onExpand(member.id)}
            />
          );
        })}
        {rosterGridFillerClasses(candidatePartners.length).map((fillerClass, fillerIndex) => (
          <PendingMemberCard key={`pending-${fillerIndex}`} className={fillerClass} />
        ))}
      </ul>
    </section>
  );
}

export function ScenarioStep({
  sectionRef,
  selectedCardRef,
  drawnScenarios,
  selectedId,
  committed,
  effectiveCostsByScenarioId,
  roomReadByScenarioId,
  onSelect,
  onExpand,
  onOpenDateBook,
}: {
  sectionRef: Ref<HTMLElement>;
  selectedCardRef: Ref<HTMLDivElement>;
  drawnScenarios: DateScenario[];
  selectedId: string | null;
  committed: boolean;
  effectiveCostsByScenarioId: Record<string, number>;
  roomReadByScenarioId: ReadonlyMap<string, ScenarioRoomRead>;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onOpenDateBook: () => void;
}) {
  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={3}
        eyebrow="// step.03.date"
        title={committed ? "Date plan" : "Date plan (locked until commit)"}
        hint={
          committed
            ? "Three cards drawn from your Date Book for this pair. Pick one to start the date."
            : "Commit the pair to draw three cards. Adjust the Date Book first if needed."
        }
        rightSlot={<GhostButton onClick={onOpenDateBook}>Open the date book</GhostButton>}
      />
      {!committed ? (
        <p className="text-sm text-aura-muted">
          Commit a focus and partner to draw three scenarios for this pair.
        </p>
      ) : drawnScenarios.length === 0 ? (
        <p className="text-sm text-aura-muted">
          No drawn hand yet. Cupid is waiting for the booking to settle.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {drawnScenarios.map((scenario) => (
            <div
              key={scenario.id}
              ref={selectedId === scenario.id ? selectedCardRef : undefined}
              className="min-w-0"
            >
              <ScenarioCard
                scenario={scenario}
                size="compact"
                state={selectedId === scenario.id ? "selected" : "default"}
                effectiveCost={effectiveCostsByScenarioId[scenario.id] ?? scenario.card.cost}
                roomRead={roomReadByScenarioId.get(scenario.id)}
                onClick={() => onSelect(scenario.id)}
                onExpand={() => onExpand(scenario.id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function focusCardState(member: Member, isActive: boolean): MemberCardState {
  if (member.state.status === "closed") return "closed";
  if (member.state.status === "quit") return "quit";
  return isActive ? "focused" : "default";
}

function buildFocusPill(member: Member, isInCooldown: boolean): MemberCardPill {
  if (member.state.status !== "active") {
    return { tone: "neutral", label: MEMBER_QUIT_RISK_LABEL[getMemberQuitRiskStatus(member)] };
  }
  if (isInCooldown) {
    return { tone: "amber", label: "cooldown" };
  }
  const status = getMemberQuitRiskStatus(member);
  if (status === "client_confidence_low" || status === "closed_file_risk") {
    return { tone: "rose", label: MEMBER_QUIT_RISK_LABEL[status] };
  }
  return { tone: "emerald", label: "ready" };
}
