import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DECK_SIZE_MAX, DECK_SIZE_MIN, STARTER_BUDGET_CAP } from "../domain/game";
import type { DateScenario, GameSave, Member, PlayerKnowledgeRecord } from "../domain/game";
import { computeEffectiveCosts, currentDeckSpend } from "../services/budget";
import { STARTER_CATALOG_IDS } from "../services/deck";
import { FOCUS_CASE_LIMIT } from "../services/focus-cases";
import {
  applyMemberRosterFilters,
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  type MemberRosterFilterState,
} from "../services/member-roster-filter";
import { useTutorialStep } from "../services/tutorial";
import { AmbientMesh } from "./ambient-mesh";
import { EASE_OUT_QUART, GhostButton, Portrait, PrimaryButton, Tooltip } from "./dashboard-atoms";
import {
  MemberCard,
  MemberDetailsModal,
  PendingMemberCard,
  rosterGridFillerClasses,
  type MemberCardState,
} from "./member-card";
import { RosterFilterBar, RosterFilterEmptyState } from "./roster-filter-bar";
import { ScenarioCard } from "./scenario-card";
import { ScenarioDetailsModal } from "./scenario-details-modal";
import { TutorialCoachMark, TutorialPulseRing, TutorialSpotlight } from "./tutorial";

export type OnboardingPayload = {
  focusedMemberIds: string[];
  scenarioDeckCardIds: string[];
};

export type OnboardingScreenProps = {
  members: Member[];
  scenarios: DateScenario[];
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
  onConfirm: (payload: OnboardingPayload) => void;
};

type OnboardingStep = "focus" | "deck";

export function OnboardingScreen({
  members,
  scenarios,
  save,
  onTutorialUpdate,
  onConfirm,
}: OnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>("focus");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deckIds, setDeckIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<MemberRosterFilterState>(
    DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  );
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [openScenarioId, setOpenScenarioId] = useState<string | null>(null);
  const firstFocusCardRef = useRef<HTMLLIElement | null>(null);
  const rightmostExpandRef = useRef<HTMLButtonElement | null>(null);
  const buildDateBookCtaRef = useRef<HTMLButtonElement | null>(null);
  const rosterColumnCount = useRosterGridColumnCount();

  const playerKnowledge = useMemo<PlayerKnowledgeRecord[]>(() => [], []);

  const focusPickStep = useTutorialStep(
    save,
    "onboarding.focus.pick",
    selectedIds.length === 0,
    onTutorialUpdate,
  );
  const focusExpandStep = useTutorialStep(
    save,
    "onboarding.focus.expand",
    focusPickStep.done && selectedIds.length > 0 && selectedIds.length < FOCUS_CASE_LIMIT,
    onTutorialUpdate,
  );
  const focusStartStep = useTutorialStep(
    save,
    "onboarding.focus.start",
    selectedIds.length === FOCUS_CASE_LIMIT,
    onTutorialUpdate,
  );

  const eligibleMembers = useMemo(
    () => members.filter((member) => member.state.status === "active"),
    [members],
  );

  const filtered = useMemo(
    () => applyMemberRosterFilters(eligibleMembers, filterState),
    [eligibleMembers, filterState],
  );

  function toggleFocus(memberId: string) {
    const willAdd = !selectedIds.includes(memberId) && selectedIds.length < FOCUS_CASE_LIMIT;
    setSelectedIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      if (current.length >= FOCUS_CASE_LIMIT) {
        return current;
      }
      return [...current, memberId];
    });
    if (willAdd && focusPickStep.active && !focusPickStep.done) {
      focusPickStep.complete();
    }
  }

  function focusStateFor(member: Member): MemberCardState {
    const isSelected = selectedIds.includes(member.id);
    if (isSelected) return "selected";
    if (selectedIds.length >= FOCUS_CASE_LIMIT) return "disabled";
    return "default";
  }

  const canAdvanceToDeck = selectedIds.length === FOCUS_CASE_LIMIT;
  const openMember =
    openMemberId === null ? null : (members.find((member) => member.id === openMemberId) ?? null);
  const openScenario =
    openScenarioId === null
      ? null
      : (scenarios.find((scenario) => scenario.id === openScenarioId) ?? null);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "deck" ? (
        <motion.div
          key="deck"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
        >
          <DeckDraftStep
            scenarios={scenarios}
            deckIds={deckIds}
            focusedMemberIds={selectedIds}
            members={members}
            save={save}
            onTutorialUpdate={onTutorialUpdate}
            onChangeDeck={setDeckIds}
            onBack={() => setStep("focus")}
            onConfirm={() => {
              onConfirm({
                focusedMemberIds: selectedIds,
                scenarioDeckCardIds: deckIds,
              });
            }}
            onExpandScenario={(id) => setOpenScenarioId(id)}
            openScenario={openScenario}
            onCloseScenario={() => setOpenScenarioId(null)}
            onOpenMember={(id) => setOpenMemberId(id)}
            openMember={openMember}
            onCloseMember={() => setOpenMemberId(null)}
            playerKnowledge={playerKnowledge}
          />
        </motion.div>
      ) : (
        <motion.div
          key="focus"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
        >
          <div className="relative isolate min-h-screen w-full overflow-hidden px-6 pb-40 pt-20 lg:px-12">
            <AmbientMesh />

            <div className="relative mx-auto max-w-[88rem]">
              <header className="mb-14 text-center">
                <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
                  // onboarding.cases
                </p>
                <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-aura-ink lg:text-display-md">
                  Pick four cases to focus
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-body text-aura-muted">
                  Cupid keeps four open case files at a time. Closed cases free a slot. Pick the
                  four members whose love lives matter to you most right now.
                </p>
                <p className="aura-accent mx-auto mt-2 max-w-xl text-lead text-aura-faint">
                  Files can be reassigned later from the roster.
                </p>
              </header>

              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <RosterFilterBar filterState={filterState} onChange={setFilterState} />
                <SelectionTally selectedCount={selectedIds.length} />
              </div>

              {filtered.length === 0 ? (
                <RosterFilterEmptyState />
              ) : (
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((member, index) => {
                    const isSelected = selectedIds.includes(member.id);
                    const selectionIndex = selectedIds.indexOf(member.id);
                    const isRightmostInFirstRow =
                      index === Math.min(rosterColumnCount, filtered.length) - 1;
                    return (
                      <MemberCard
                        key={member.id}
                        member={member}
                        state={focusStateFor(member)}
                        density="standard"
                        playerKnowledge={playerKnowledge}
                        index={index}
                        priorityIndex={isSelected ? selectionIndex : undefined}
                        hideSealedSummary
                        cardRef={index === 0 ? firstFocusCardRef : undefined}
                        expandButtonRef={isRightmostInFirstRow ? rightmostExpandRef : undefined}
                        onClick={() => toggleFocus(member.id)}
                        onExpand={() => {
                          if (focusExpandStep.active && !focusExpandStep.done) {
                            focusExpandStep.complete();
                          }
                          setOpenMemberId(member.id);
                        }}
                      />
                    );
                  })}
                  {rosterGridFillerClasses(filtered.length).map((fillerClass, fillerIndex) => (
                    <PendingMemberCard key={`pending-${fillerIndex}`} className={fillerClass} />
                  ))}
                </ul>
              )}

              <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
                <div className="aura-glass-strong pointer-events-auto flex items-center gap-4 rounded-pill px-5 py-3 shadow-aura-soft">
                  <GhostButton
                    onClick={() => setSelectedIds([])}
                    disabled={selectedIds.length === 0}
                  >
                    Clear
                  </GhostButton>
                  <PrimaryButton
                    buttonRef={buildDateBookCtaRef}
                    disabled={!canAdvanceToDeck}
                    onClick={() => {
                      if (canAdvanceToDeck) {
                        if (focusStartStep.active && !focusStartStep.done) {
                          focusStartStep.complete();
                        }
                        setStep("deck");
                      }
                    }}
                  >
                    Build the date book
                    <span className="ml-2 inline-block">→</span>
                  </PrimaryButton>
                </div>
              </div>
            </div>

            {focusPickStep.active ? (
              <>
                <TutorialSpotlight target={firstFocusCardRef} />
                <TutorialCoachMark
                  target={firstFocusCardRef}
                  placement="left"
                  title="Cupid is hiring. You are hired."
                  body="These are members who walked into the office today. Pick four to focus. The rest of the roster waits in the hall, technically supervised."
                  dismissLabel="Skip tour"
                  onDismiss={focusPickStep.dismiss}
                  portrait="portrait"
                />
              </>
            ) : null}

            {focusExpandStep.active ? (
              <>
                <TutorialPulseRing target={rightmostExpandRef} padding={6} radius={18} />
                <TutorialCoachMark
                  target={rightmostExpandRef}
                  placement="right"
                  title="Read the file"
                  body="Tap a card's arrow to open that member's file. Useful for sizing up a case before you commit."
                  dismissLabel="Skip tour"
                  onDismiss={focusExpandStep.dismiss}
                />
              </>
            ) : null}

            {focusStartStep.active ? (
              <>
                <TutorialPulseRing target={buildDateBookCtaRef} padding={6} radius={28} />
                <TutorialCoachMark
                  target={buildDateBookCtaRef}
                  placement="top"
                  title="Build the Date Book"
                  body="Four cases on file. Next, draft the Date Book. Six to twelve rooms, under budget. Cupid will draw a hand from this pool every time you commit a pair."
                  dismissLabel="Skip tour"
                  onDismiss={focusStartStep.dismiss}
                />
              </>
            ) : null}

            {openMember === null ? null : (
              <MemberDetailsModal
                member={openMember}
                playerKnowledge={playerKnowledge}
                isFocused={selectedIds.includes(openMember.id)}
                save={save}
                onTutorialUpdate={onTutorialUpdate}
                onClose={() => setOpenMemberId(null)}
                primaryAction={
                  selectedIds.includes(openMember.id) || selectedIds.length < FOCUS_CASE_LIMIT
                    ? {
                        label: selectedIds.includes(openMember.id)
                          ? "Drop from focus"
                          : "Add to focus →",
                        onClick: () => {
                          toggleFocus(openMember.id);
                          setOpenMemberId(null);
                        },
                      }
                    : undefined
                }
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeckDraftStep({
  scenarios,
  deckIds,
  focusedMemberIds,
  members,
  save,
  onTutorialUpdate,
  onChangeDeck,
  onBack,
  onConfirm,
  onExpandScenario,
  openScenario,
  onCloseScenario,
  onOpenMember,
  openMember,
  onCloseMember,
  playerKnowledge,
}: {
  scenarios: DateScenario[];
  deckIds: string[];
  focusedMemberIds: string[];
  members: Member[];
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
  onChangeDeck: (next: string[]) => void;
  onBack: () => void;
  onConfirm: () => void;
  onExpandScenario: (id: string) => void;
  openScenario: DateScenario | null;
  onCloseScenario: () => void;
  onOpenMember: (id: string) => void;
  openMember: Member | null;
  onCloseMember: () => void;
  playerKnowledge: readonly PlayerKnowledgeRecord[];
}) {
  const catalog = useMemo(() => {
    const ids = new Set(STARTER_CATALOG_IDS);
    return scenarios.filter((scenario) => ids.has(scenario.id));
  }, [scenarios]);

  const effectiveCosts = useMemo(() => computeEffectiveCosts(catalog, []), [catalog]);
  const deckIdSet = useMemo(() => new Set(deckIds), [deckIds]);
  const spend = useMemo(() => currentDeckSpend(deckIds, effectiveCosts), [deckIds, effectiveCosts]);
  const remaining = STARTER_BUDGET_CAP - spend;
  const deckSize = deckIds.length;

  const focusedMembers = useMemo(
    () =>
      focusedMemberIds
        .map((id) => members.find((member) => member.id === id))
        .filter((member): member is Member => member !== undefined),
    [focusedMemberIds, members],
  );

  const canConfirm =
    deckSize >= DECK_SIZE_MIN && deckSize <= DECK_SIZE_MAX && spend <= STARTER_BUDGET_CAP;

  const sortedCatalog = useMemo(
    () => [...catalog].sort((a, b) => a.card.cost - b.card.cost),
    [catalog],
  );

  const firstScenarioCardRef = useRef<HTMLElement | null>(null);
  const rightmostExpandRef = useRef<HTMLButtonElement | null>(null);
  const startShiftCtaRef = useRef<HTMLButtonElement | null>(null);
  const deckColumnCount = useDeckGridColumnCount();
  const deckPickStep = useTutorialStep(
    save,
    "onboarding.deck.pick",
    deckSize === 0,
    onTutorialUpdate,
  );
  const deckExpandStep = useTutorialStep(
    save,
    "onboarding.deck.expand",
    deckPickStep.done && deckSize > 0 && !canConfirm,
    onTutorialUpdate,
  );
  const deckStartStep = useTutorialStep(
    save,
    "onboarding.deck.start",
    canConfirm,
    onTutorialUpdate,
  );

  function toggleCard(scenarioId: string) {
    if (deckIdSet.has(scenarioId)) {
      onChangeDeck(deckIds.filter((id) => id !== scenarioId));
      return;
    }
    const incoming = catalog.find((scenario) => scenario.id === scenarioId);
    if (incoming === undefined) return;
    if (deckSize >= DECK_SIZE_MAX) return;
    const incomingCost = effectiveCosts[scenarioId] ?? incoming.card.cost;
    if (spend + incomingCost > STARTER_BUDGET_CAP) return;
    onChangeDeck([...deckIds, scenarioId]);
    if (deckPickStep.active && !deckPickStep.done) {
      deckPickStep.complete();
    }
  }

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden px-6 pb-40 pt-20 lg:px-12">
      <AmbientMesh />

      <div className="relative mx-auto max-w-[92rem]">
        <DeckDraftHeader />

        {focusedMembers.length === 0 ? null : (
          <CaseLoadStrip members={focusedMembers} onOpenMember={onOpenMember} />
        )}

        <AllocationLedger
          remaining={remaining}
          spend={spend}
          cap={STARTER_BUDGET_CAP}
          deckSize={deckSize}
          deckMin={DECK_SIZE_MIN}
          deckMax={DECK_SIZE_MAX}
        />

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedCatalog.map((scenario, index) => {
            const inDeck = deckIdSet.has(scenario.id);
            const cost = effectiveCosts[scenario.id] ?? scenario.card.cost;
            const cantFit =
              !inDeck && (deckSize >= DECK_SIZE_MAX || spend + cost > STARTER_BUDGET_CAP);
            const isRightmostInFirstRow =
              index === Math.min(deckColumnCount, sortedCatalog.length) - 1;
            return (
              <li key={scenario.id}>
                <ScenarioCard
                  scenario={scenario}
                  size="tile"
                  state={inDeck ? "selected" : cantFit ? "disabled" : "default"}
                  effectiveCost={cost}
                  cardRef={index === 0 ? firstScenarioCardRef : undefined}
                  expandButtonRef={isRightmostInFirstRow ? rightmostExpandRef : undefined}
                  onClick={() => toggleCard(scenario.id)}
                  onExpand={() => {
                    if (deckExpandStep.active && !deckExpandStep.done) {
                      deckExpandStep.complete();
                    }
                    onExpandScenario(scenario.id);
                  }}
                />
              </li>
            );
          })}
        </ul>

        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
          <div className="aura-glass-strong pointer-events-auto flex items-center gap-4 rounded-pill px-5 py-3 shadow-aura-soft">
            <GhostButton onClick={onBack}>← Back to focus cases</GhostButton>
            <Tooltip
              message={
                canConfirm
                  ? "Lock in the starter deck. You can edit it after onboarding from the Date Book."
                  : deckSize < DECK_SIZE_MIN
                    ? `Pick at least ${DECK_SIZE_MIN} cards.`
                    : deckSize > DECK_SIZE_MAX
                      ? `Drop down to ${DECK_SIZE_MAX} cards or fewer.`
                      : `Drop a card. Spend is ${spend} against a ${STARTER_BUDGET_CAP} cap.`
              }
              placement="top-center"
            >
              <PrimaryButton
                buttonRef={startShiftCtaRef}
                onClick={() => {
                  if (canConfirm) {
                    if (deckStartStep.active && !deckStartStep.done) {
                      deckStartStep.complete();
                    }
                    onConfirm();
                  }
                }}
                disabled={!canConfirm}
              >
                Start the shift →
              </PrimaryButton>
            </Tooltip>
          </div>
        </div>
      </div>

      {deckPickStep.active ? (
        <>
          <TutorialSpotlight target={firstScenarioCardRef} />
          <TutorialCoachMark
            target={firstScenarioCardRef}
            placement="left"
            title="Build the Date Book"
            body="This is the pool Cupid draws from. Pick six to twelve rooms and stay under budget. The hand comes later, after you commit two members."
            dismissLabel="Skip tour"
            onDismiss={deckPickStep.dismiss}
          />
        </>
      ) : null}

      {deckExpandStep.active ? (
        <>
          <TutorialPulseRing target={rightmostExpandRef} padding={6} radius={18} />
          <TutorialCoachMark
            target={rightmostExpandRef}
            placement="right"
            title="Scout the room"
            body="Tap a card's arrow to open the room brief. Useful for sizing up vibe and rules before you spend on it."
            dismissLabel="Skip tour"
            onDismiss={deckExpandStep.dismiss}
          />
        </>
      ) : null}

      {deckStartStep.active ? (
        <>
          <TutorialPulseRing target={startShiftCtaRef} padding={6} radius={28} />
          <TutorialCoachMark
            target={startShiftCtaRef}
            placement="top"
            title="Start the shift"
            body="Deck is legal. Start the shift and Cupid opens Live Date. You will pick one focus case, one different partner, then commit. Three scenarios get drawn from this pool."
            primaryLabel="Start the shift"
            onPrimary={() => {
              deckStartStep.complete();
              onConfirm();
            }}
            dismissLabel="Skip tour"
            onDismiss={deckStartStep.dismiss}
          />
        </>
      ) : null}

      {openScenario === null ? null : (
        <ScenarioDetailsModal
          scenario={openScenario}
          eyebrow="// starter catalog"
          save={save}
          onTutorialUpdate={onTutorialUpdate}
          onClose={onCloseScenario}
        />
      )}

      {openMember === null ? null : (
        <MemberDetailsModal
          member={openMember}
          playerKnowledge={playerKnowledge}
          isFocused
          save={save}
          onTutorialUpdate={onTutorialUpdate}
          onClose={onCloseMember}
        />
      )}
    </div>
  );
}

function DeckDraftHeader() {
  return (
    <header className="mb-7">
      <div className="flex items-center gap-3">
        <span aria-hidden className="aura-pulse size-1.5 rounded-full bg-aura-rose" />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          // onboarding.deck
        </span>
        <span
          aria-hidden
          className="h-px w-14 bg-gradient-to-r from-aura-rose/55 via-aura-rose/25 to-transparent"
        />
        <span className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
          phase 02 / 02
        </span>
      </div>
      <h1 className="mt-4 font-display text-display-md font-semibold leading-[1.02] tracking-tight text-aura-ink lg:text-display-lg">
        Build your <span className="aura-accent font-serif text-aura-fuchsia">date book</span>
      </h1>
      <p className="mt-4 max-w-2xl text-body text-aura-muted">
        {STARTER_BUDGET_CAP} budget points stretched across {DECK_SIZE_MIN} to {DECK_SIZE_MAX}{" "}
        rooms. Cupid draws three from this pool every time you commit a pair.
      </p>
    </header>
  );
}

function CaseLoadStrip({
  members,
  onOpenMember,
}: {
  members: ReadonlyArray<Member>;
  onOpenMember: (id: string) => void;
}) {
  return (
    <section
      aria-label="Case load this shift"
      className="aura-glass relative mb-7 overflow-hidden rounded-card px-6 py-5 lg:px-8"
    >
      <span
        aria-hidden
        className="aura-dot-grid pointer-events-none absolute inset-0 rounded-card opacity-25"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-aura-mesh-violet opacity-25 blur-3xl"
      />

      <div className="relative mb-5 flex items-center gap-3">
        <span aria-hidden className="size-1.5 rounded-sm bg-aura-violet" />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-violet">
          Cupid&apos;s case load · this shift
        </span>
        <span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-r from-aura-hairline-strong via-aura-hairline to-transparent"
        />
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint tabular-nums">
          {String(members.length).padStart(2, "0")} open · 00 closed
        </span>
      </div>

      <ul className="relative grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:gap-6">
        {members.map((member, index) => (
          <CaseFileCard
            key={member.id}
            member={member}
            index={index}
            onOpen={() => onOpenMember(member.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function CaseFileCard({
  member,
  index,
  onOpen,
}: {
  member: Member;
  index: number;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${member.firstName}'s case file`}
        className="group relative flex w-full cursor-pointer items-center gap-4 rounded-chip border border-aura-hairline bg-white/55 px-3.5 py-3 text-left shadow-quiet transition hover:border-aura-rose/35 hover:bg-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/40"
      >
        <div className="relative shrink-0">
          <Portrait member={member} variant="row" asset="avatar" />
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-aura-rose to-aura-fuchsia font-mono text-sm font-bold leading-none text-white shadow-quiet"
          >
            {index + 1}
          </span>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-display text-lg font-semibold tracking-tight text-aura-ink">
            {member.firstName}
          </p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span>case · {String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden className="text-aura-faint/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-aura-emerald">
              <span aria-hidden className="aura-pulse size-1 rounded-full bg-aura-emerald" />
              open
            </span>
          </p>
        </div>
      </button>
    </li>
  );
}

function AllocationLedger({
  remaining,
  spend,
  cap,
  deckSize,
  deckMin,
  deckMax,
}: {
  remaining: number;
  spend: number;
  cap: number;
  deckSize: number;
  deckMin: number;
  deckMax: number;
}) {
  const overBudget = remaining < 0;
  const tight = !overBudget && remaining <= 5;
  const fillPct = Math.max(0, Math.min(100, (spend / cap) * 100));
  const remainingTone = overBudget ? "text-aura-rose" : tight ? "text-amber-700" : "text-aura-ink";
  const meterGradient = overBudget
    ? "from-aura-rose via-rose-500 to-rose-700"
    : "from-aura-rose via-aura-fuchsia to-aura-violet";
  const slotsTone =
    deckSize > deckMax ? "text-aura-rose" : deckSize < deckMin ? "text-amber-700" : "text-aura-ink";

  return (
    <section
      aria-label="Date book allocation"
      className="aura-glass relative mb-9 overflow-hidden rounded-card px-6 py-7 lg:px-9 lg:py-8"
    >
      <span
        aria-hidden
        className="aura-dot-grid pointer-events-none absolute inset-0 rounded-card opacity-30"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-16 size-64 rounded-full bg-aura-mesh-rose opacity-30 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-aura-mesh-violet opacity-25 blur-3xl"
      />

      <div className="relative mb-7 flex items-center gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          Allocation ledger
        </span>
        <span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-r from-aura-hairline-strong via-aura-hairline to-transparent"
        />
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          ref · f02 / starter draft
        </span>
      </div>

      <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.1fr)] lg:items-start lg:gap-10">
        <BudgetCoffer
          remaining={remaining}
          spend={spend}
          cap={cap}
          fillPct={fillPct}
          remainingTone={remainingTone}
          meterGradient={meterGradient}
          overBudget={overBudget}
        />

        <div
          aria-hidden
          className="hidden h-full w-px bg-gradient-to-b from-transparent via-aura-hairline-strong to-transparent lg:block"
        />
        <div aria-hidden className="block h-px w-full bg-aura-hairline lg:hidden" />

        <DeckManifest
          deckSize={deckSize}
          deckMin={deckMin}
          deckMax={deckMax}
          slotsTone={slotsTone}
        />
      </div>
    </section>
  );
}

function BudgetCoffer({
  remaining,
  spend,
  cap,
  fillPct,
  remainingTone,
  meterGradient,
  overBudget,
}: {
  remaining: number;
  spend: number;
  cap: number;
  fillPct: number;
  remainingTone: string;
  meterGradient: string;
  overBudget: boolean;
}) {
  const displayRemaining = remaining < 0 ? `-${Math.abs(remaining)}` : `${remaining}`;
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="aura-pulse size-1.5 rounded-full bg-aura-rose" />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.3em] text-aura-rose">
          Budget coffer
        </span>
      </div>

      <div className="mt-5 flex items-end gap-4">
        <motion.span
          key={displayRemaining}
          initial={{ y: 4, opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
          className={`font-display text-display-lg font-semibold leading-[0.9] tabular-nums tracking-tight lg:text-display-xl ${remainingTone}`}
        >
          {displayRemaining}
        </motion.span>
        <div className="pb-2 leading-tight">
          <span className="block font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-muted">
            remaining
          </span>
          <span className="block font-mono text-micro uppercase tracking-[0.22em] text-aura-faint tabular-nums">
            of {cap} cap
          </span>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative h-3.5 overflow-hidden rounded-pill bg-aura-ink/[0.06] ring-1 ring-inset ring-aura-hairline">
          <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="border-r border-aura-hairline/70 last:border-r-0" />
            ))}
          </div>
          <motion.div
            className={`relative h-full rounded-pill bg-gradient-to-r ${meterGradient} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)]`}
            initial={false}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          />
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="flex items-baseline gap-2 font-mono text-micro uppercase tracking-[0.22em]">
            <span
              className={`font-display text-lg font-semibold leading-none tabular-nums ${
                overBudget ? "text-aura-rose" : "text-aura-ink"
              }`}
            >
              {spend}
            </span>
            <span className="text-aura-faint">spent</span>
          </span>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span className="tabular-nums">{Math.round(fillPct)}</span>
            <span className="ml-0.5">% allocated</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function DeckManifest({
  deckSize,
  deckMin,
  deckMax,
  slotsTone,
}: {
  deckSize: number;
  deckMin: number;
  deckMax: number;
  slotsTone: string;
}) {
  const minMarkerLeft = `${(deckMin / deckMax) * 100}%`;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="size-1.5 rounded-sm bg-aura-violet" />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.3em] text-aura-violet">
          Deck manifest
        </span>
        <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
        <span
          className={`font-mono text-micro uppercase tracking-[0.22em] tabular-nums ${slotsTone}`}
        >
          <span className="font-display text-base font-semibold leading-none">{deckSize}</span>
          <span className="ml-1 text-aura-faint">/ {deckMax} rooms</span>
        </span>
      </div>

      <div className="relative mt-5">
        <ul className="relative grid grid-cols-12 gap-1.5">
          {Array.from({ length: deckMax }).map((_, i) => {
            const filled = i < deckSize;
            return (
              <li key={i} className="relative">
                <motion.span
                  aria-hidden
                  className={`block aspect-[5/7] overflow-hidden rounded-[5px] ${
                    filled
                      ? "bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet shadow-quiet ring-1 ring-white/55"
                      : "border border-dashed border-aura-ink/18 bg-white/55"
                  }`}
                  initial={false}
                  animate={{ scale: filled ? 1 : 0.94, y: filled ? -1 : 0 }}
                  transition={{ duration: 0.26, ease: EASE_OUT_QUART }}
                >
                  {filled ? (
                    <span
                      aria-hidden
                      className="block size-full bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.45)_0%,transparent_55%)]"
                    />
                  ) : null}
                </motion.span>
              </li>
            );
          })}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-y-1.5 w-px bg-gradient-to-b from-aura-faint/0 via-aura-faint/70 to-aura-faint/0"
            initial={false}
            animate={{ left: minMarkerLeft }}
            transition={{ duration: 0.26, ease: EASE_OUT_QUART }}
          />
        </ul>

        <div className="relative mt-2.5 h-3">
          <motion.span
            aria-hidden
            className="absolute top-0 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap font-mono text-micro uppercase tracking-[0.2em] text-aura-faint"
            initial={false}
            animate={{ left: minMarkerLeft }}
            transition={{ duration: 0.26, ease: EASE_OUT_QUART }}
          >
            <span aria-hidden className="text-aura-faint/80">
              ↑
            </span>
            min draft · {deckMin}
          </motion.span>
        </div>
      </div>

      <div className="mt-7 flex items-center gap-4 rounded-chip border border-dashed border-aura-hairline-strong/55 bg-white/40 px-4 py-3">
        <DrawFan />
        <div className="leading-tight">
          <p className="font-display text-base font-semibold tracking-tight text-aura-ink">
            Cupid pulls three
          </p>
          <p className="mt-0.5 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            from this pool · every committed pair
          </p>
        </div>
      </div>
    </div>
  );
}

function DrawFan() {
  const cards = [
    { rotate: -18, tx: -16, ty: 6, zClass: "z-[1]" },
    { rotate: 0, tx: 0, ty: 0, zClass: "z-[3]" },
    { rotate: 18, tx: 16, ty: 6, zClass: "z-[2]" },
  ];
  return (
    <div className="relative grid h-12 w-[80px] place-items-center">
      {cards.map((card, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ x: 0, y: card.ty + 10, opacity: 0, rotate: 0 }}
          animate={{ x: card.tx, y: card.ty, opacity: 1, rotate: card.rotate }}
          transition={{ duration: 0.55, ease: EASE_OUT_QUART, delay: 0.08 + i * 0.09 }}
          className={`absolute grid aspect-[5/7] h-11 place-items-center rounded-[5px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.45),inset_0_1px_0_0_rgba(255,255,255,0.14)] ring-1 ring-white/25 ${card.zClass}`}
        >
          <span
            aria-hidden
            className="block size-3.5 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.6)_0%,rgba(217,70,239,0.28)_45%,transparent_75%)]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[3px] rounded-[3px] ring-1 ring-rose-300/20"
          />
        </motion.span>
      ))}
    </div>
  );
}

function rosterColumnsForWidth(width: number): number {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function deckColumnsForWidth(width: number): number {
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

function useResponsiveColumnCount(forWidth: (width: number) => number): number {
  const [count, setCount] = useState(() =>
    forWidth(typeof window === "undefined" ? 1920 : window.innerWidth),
  );
  useEffect(() => {
    function update() {
      setCount(forWidth(window.innerWidth));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [forWidth]);
  return count;
}

function useRosterGridColumnCount(): number {
  return useResponsiveColumnCount(rosterColumnsForWidth);
}

function useDeckGridColumnCount(): number {
  return useResponsiveColumnCount(deckColumnsForWidth);
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
