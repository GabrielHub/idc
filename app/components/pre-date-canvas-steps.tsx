import type { Ref } from "react";

import type {
  DateScenario,
  GameSave,
  MatchmakingIntent,
  Member,
  MemberRequest,
} from "../domain/game";
import { getMemberQuitRiskStatus, MEMBER_QUIT_RISK_LABEL } from "../services/date-engine";
import type { ScenarioRoomRead } from "../services/match-fit";
import {
  MATCHMAKING_INTENT_LABEL,
  MATCHMAKING_INTENT_TOOLTIP,
  MATCHMAKING_INTENTS,
} from "../services/matchmaking-intent";
import { isMemberInCooldown } from "../services/shift-planning";
import { GhostButton, Tooltip } from "./dashboard-atoms";
import {
  MemberCard,
  type MemberCardPill,
  type MemberCardState,
  PendingMemberCard,
  rosterGridFillerClasses,
} from "./member-card";
import { OffTonightSection, type OffTonightEntry } from "./pre-date-canvas-off-tonight";
import { ScenarioCard } from "./scenario-card";

function StepHeader({
  index,
  eyebrow,
  title,
  hint,
  tooltipHint,
  rightSlot,
}: {
  index: number;
  eyebrow: string;
  title: string;
  hint?: string;
  tooltipHint?: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const titleClass = "mt-1 font-display text-lg font-semibold tracking-tight text-aura-ink";
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
          {tooltipHint === undefined ? (
            <h2 className={titleClass}>{title}</h2>
          ) : (
            <Tooltip
              message={tooltipHint}
              placement="bottom-start"
              messageClassName="text-aura-ink"
            >
              <h2
                tabIndex={0}
                className={`${titleClass} cursor-help rounded-sm outline-none focus-visible:text-aura-rose`}
              >
                {title}
              </h2>
            </Tooltip>
          )}
          {hint === undefined ? null : (
            <p className="mt-1 max-w-xl text-sm text-aura-muted">{hint}</p>
          )}
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
  leadRequestId,
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
  leadRequestId: string | undefined;
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
        eyebrow="// step.01.lead"
        title={locked ? "Lead case (locked)" : "Lead case"}
        hint={
          locked
            ? "Pair is committed. Resolve or cancel the booking to reassign the lead."
            : undefined
        }
        tooltipHint={
          locked
            ? undefined
            : "Today's lead runs the shift. Pick one of your four focus cases — the other three wait their turn. Cases in cooldown or closed files can't lead."
        }
        rightSlot={<GhostButton onClick={onOpenRoster}>Manage roster</GhostButton>}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {focusedMembers.map((member, index) => {
          const isActive = member.id === activeFocusId;
          const isInCooldown = isMemberInCooldown(member, shiftNumber);
          const request = member.state.status === "active" ? requestForMember(member) : undefined;
          const askPreview =
            request === undefined
              ? undefined
              : `${request.id === leadRequestId ? "Lead ask" : "Queue"}: ${request.text}`;
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
  unavailablePartners,
  partnerId,
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
  unavailablePartners: ReadonlyArray<OffTonightEntry>;
  partnerId: string | null;
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
          hint="Pick today's lead case first."
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
          title="Tonight's roster"
          hint="No partners are reachable tonight. Open the roster to change focus cases or wait out a cooldown."
          rightSlot={<GhostButton onClick={onOpenRoster}>Open roster</GhostButton>}
        />
        <OffTonightSection
          entries={unavailablePartners}
          playerKnowledge={playerKnowledge}
          revealAllMemberDetails={revealAllMemberDetails}
          onExpand={onExpand}
        />
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={2}
        eyebrow="// step.02.partner"
        title={locked ? "Tonight's roster (locked)" : "Tonight's roster"}
        hint={
          locked
            ? "Pair is committed. The Date Book and partner are locked until the date resolves."
            : undefined
        }
        tooltipHint={
          locked
            ? undefined
            : "Cupid draws a partner board each shift from member schedules, recent activity, and rhythm. Anyone not on it stays visible under Off tonight with a reason. Availability is logistics, not a verdict."
        }
      />
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {candidatePartners.map((member, index) => {
          const isPicked = member.id === partnerId;
          const cardState: MemberCardState = isPicked ? "selected" : "default";
          const statusPill: MemberCardPill | undefined = isPicked
            ? { tone: "rose", label: "your pick" }
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
      <OffTonightSection
        entries={unavailablePartners}
        playerKnowledge={playerKnowledge}
        revealAllMemberDetails={revealAllMemberDetails}
        onExpand={onExpand}
      />
    </section>
  );
}

export function IntentStep({
  sectionRef,
  activeFocus,
  partner,
  selectedIntent,
  locked,
  onSelect,
}: {
  sectionRef: Ref<HTMLElement>;
  activeFocus: Member | null;
  partner: Member | null;
  selectedIntent: MatchmakingIntent | null;
  locked: boolean;
  onSelect: (intent: MatchmakingIntent | null) => void;
}) {
  if (activeFocus === null || partner === null) return null;

  const hint = locked
    ? selectedIntent === null
      ? "No intent on file. Cupid will phrase the post-date note without a stated read."
      : `Filed as ${MATCHMAKING_INTENT_LABEL[selectedIntent].toLowerCase()}.`
    : "Optional. Cupid uses your read to phrase the post-date note.";

  return (
    <section ref={sectionRef} className="mt-10">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
            // intent
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-aura-ink">
            Why this booking?
          </h2>
          <p className="mt-1 max-w-xl text-sm text-aura-muted">{hint}</p>
        </div>
        {locked || selectedIntent === null ? null : (
          <button
            type="button"
            data-sfx="click"
            onClick={() => onSelect(null)}
            className="cursor-pointer font-mono text-micro uppercase tracking-[0.22em] text-aura-faint transition hover:text-aura-rose"
          >
            Clear intent
          </button>
        )}
      </header>
      <ul className="flex flex-wrap gap-2">
        {MATCHMAKING_INTENTS.map((intent) => {
          const isPicked = intent === selectedIntent;
          const dimWhenLocked = locked && !isPicked;
          if (dimWhenLocked) return null;
          const tone = isPicked
            ? "bg-gradient-to-r from-aura-rose/15 via-aura-fuchsia/12 to-aura-violet/15 text-aura-rose ring-1 ring-aura-rose/45"
            : "aura-glass text-aura-muted ring-1 ring-aura-hairline hover:text-aura-ink";
          return (
            <li key={intent}>
              <Tooltip message={MATCHMAKING_INTENT_TOOLTIP[intent]} placement="top-center">
                <button
                  type="button"
                  data-sfx="click"
                  aria-pressed={isPicked}
                  disabled={locked}
                  onClick={() => onSelect(isPicked ? null : intent)}
                  className={`flex items-center gap-2 rounded-pill px-3.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed ${
                    locked ? "" : "cursor-pointer"
                  } ${tone}`}
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
                  <span>{MATCHMAKING_INTENT_LABEL[intent]}</span>
                </button>
              </Tooltip>
            </li>
          );
        })}
      </ul>
      {locked && selectedIntent === null ? (
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          // intent unset
        </p>
      ) : null}
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
  dateBookLockedUntilFirstReport,
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
  dateBookLockedUntilFirstReport: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onOpenDateBook: () => void;
}) {
  const dateBookButton = dateBookLockedUntilFirstReport ? (
    <Tooltip message="Date Book edits open after the first date report." placement="bottom-end">
      <GhostButton disabled>Open the date book</GhostButton>
    </Tooltip>
  ) : (
    <GhostButton onClick={onOpenDateBook}>Open the date book</GhostButton>
  );

  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={3}
        eyebrow="// step.03.date"
        title={committed ? "Date plan" : "Date plan (locked until commit)"}
        hint={
          committed
            ? "Three cards drawn from your Date Book for this pair. Pick one to start the date."
            : dateBookLockedUntilFirstReport
              ? "Commit the pair to draw three cards from Cupid's starter Date Book."
              : "Commit the pair to draw three cards. Adjust the Date Book first if needed."
        }
        rightSlot={dateBookButton}
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
