import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";

import type { DateScenario, GameSave, Member, PlayerKnowledgeRecord } from "../domain/game";
import { FOCUS_CASE_LIMIT } from "../services/focus-cases";
import {
  applyMemberRosterFilters,
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  type MemberRosterFilterState,
} from "../services/member-roster-filter";
import { useTutorialStep } from "../services/tutorial";
import { AmbientMesh } from "./ambient-mesh";
import { EASE_OUT_QUART, GhostButton, PrimaryButton } from "./dashboard-atoms";
import {
  MemberCard,
  MemberDetailsModal,
  PendingMemberCard,
  rosterGridFillerClasses,
  type MemberCardState,
} from "./member-card";
import { DeckDraftStep } from "./onboarding-screen-deck";
import { useResponsiveColumnCount } from "./onboarding-screen-utils";
import { RosterFilterBar, RosterFilterEmptyState } from "./roster-filter-bar";
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

function rosterColumnsForWidth(width: number): number {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function useRosterGridColumnCount(): number {
  return useResponsiveColumnCount(rosterColumnsForWidth);
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
