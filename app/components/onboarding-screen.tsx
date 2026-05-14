import { useMemo, useState } from "react";

import { DECK_SIZE_MAX, DECK_SIZE_MIN, STARTER_BUDGET_CAP } from "../domain/game";
import type { DateScenario, Member, PlayerKnowledgeRecord } from "../domain/game";
import { computeEffectiveCosts, currentDeckSpend } from "../services/budget";
import { STARTER_CATALOG_IDS } from "../services/deck";
import { FOCUS_CASE_LIMIT } from "../services/focus-cases";
import {
  applyMemberRosterFilters,
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  type MemberRosterFilterState,
} from "../services/member-roster-filter";
import { AmbientMesh } from "./ambient-mesh";
import { GhostButton, PrimaryButton, Tooltip } from "./dashboard-atoms";
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

export type OnboardingPayload = {
  focusedMemberIds: string[];
  scenarioDeckCardIds: string[];
};

export type OnboardingScreenProps = {
  members: Member[];
  scenarios: DateScenario[];
  onConfirm: (payload: OnboardingPayload) => void;
};

type OnboardingStep = "focus" | "deck";

export function OnboardingScreen({ members, scenarios, onConfirm }: OnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>("focus");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deckIds, setDeckIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<MemberRosterFilterState>(
    DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  );
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [openScenarioId, setOpenScenarioId] = useState<string | null>(null);

  const playerKnowledge = useMemo<PlayerKnowledgeRecord[]>(() => [], []);

  const eligibleMembers = useMemo(
    () => members.filter((member) => member.state.status === "active"),
    [members],
  );

  const filtered = useMemo(
    () => applyMemberRosterFilters(eligibleMembers, filterState),
    [eligibleMembers, filterState],
  );

  function toggleFocus(memberId: string) {
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

  if (step === "deck") {
    return (
      <DeckDraftStep
        scenarios={scenarios}
        deckIds={deckIds}
        focusedMemberIds={selectedIds}
        members={members}
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
      />
    );
  }

  return (
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
            Cupid keeps four open case files at a time. Closed cases free a slot. Pick the four
            members whose love lives matter to you most right now.
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
                  onClick={() => toggleFocus(member.id)}
                  onExpand={() => setOpenMemberId(member.id)}
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
            <GhostButton onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>
              Clear
            </GhostButton>
            <PrimaryButton
              disabled={!canAdvanceToDeck}
              onClick={() => {
                if (canAdvanceToDeck) {
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
                    toggleFocus(openMember.id);
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

function DeckDraftStep({
  scenarios,
  deckIds,
  focusedMemberIds,
  members,
  onChangeDeck,
  onBack,
  onConfirm,
  onExpandScenario,
  openScenario,
  onCloseScenario,
}: {
  scenarios: DateScenario[];
  deckIds: string[];
  focusedMemberIds: string[];
  members: Member[];
  onChangeDeck: (next: string[]) => void;
  onBack: () => void;
  onConfirm: () => void;
  onExpandScenario: (id: string) => void;
  openScenario: DateScenario | null;
  onCloseScenario: () => void;
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

  const focusedNames = focusedMemberIds
    .map((id) => members.find((member) => member.id === id)?.firstName)
    .filter((name): name is string => name !== undefined);

  const canConfirm =
    deckSize >= DECK_SIZE_MIN && deckSize <= DECK_SIZE_MAX && spend <= STARTER_BUDGET_CAP;

  const sortedCatalog = useMemo(
    () => [...catalog].sort((a, b) => a.card.cost - b.card.cost),
    [catalog],
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
  }

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden px-6 pb-40 pt-20 lg:px-12">
      <AmbientMesh />

      <div className="relative mx-auto max-w-[92rem]">
        <header className="mb-10 text-center">
          <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
            // onboarding.deck
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-aura-ink lg:text-display-md">
            Build your date book
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-body text-aura-muted">
            Allocate {STARTER_BUDGET_CAP} budget points across {DECK_SIZE_MIN} to {DECK_SIZE_MAX}{" "}
            scenarios. Cupid will draw three from this pool every time you commit a pair.
          </p>
          {focusedNames.length === 0 ? null : (
            <p className="mx-auto mt-2 max-w-xl font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
              focus cases: {focusedNames.join(", ")}
            </p>
          )}
        </header>

        <div className="mb-8 grid gap-3 sm:grid-cols-4">
          <BudgetStat
            label="Remaining"
            value={`${remaining}`}
            tone={remaining < 0 ? "rose" : remaining <= 5 ? "amber" : "ink"}
          />
          <BudgetStat label="Spent" value={`${spend} / ${STARTER_BUDGET_CAP}`} tone="ink" />
          <BudgetStat
            label="Slots"
            value={`${deckSize} / ${DECK_SIZE_MAX}`}
            tone={deckSize < DECK_SIZE_MIN ? "amber" : deckSize > DECK_SIZE_MAX ? "rose" : "ink"}
          />
          <BudgetStat label="Min draft size" value={`${DECK_SIZE_MIN}`} tone="ink" />
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedCatalog.map((scenario) => {
            const inDeck = deckIdSet.has(scenario.id);
            const cost = effectiveCosts[scenario.id] ?? scenario.card.cost;
            const cantFit =
              !inDeck && (deckSize >= DECK_SIZE_MAX || spend + cost > STARTER_BUDGET_CAP);
            return (
              <li key={scenario.id}>
                <ScenarioCard
                  scenario={scenario}
                  size="tile"
                  state={inDeck ? "selected" : cantFit ? "disabled" : "default"}
                  effectiveCost={cost}
                  onClick={() => toggleCard(scenario.id)}
                  onExpand={() => onExpandScenario(scenario.id)}
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
              <PrimaryButton onClick={onConfirm} disabled={!canConfirm}>
                Start the shift →
              </PrimaryButton>
            </Tooltip>
          </div>
        </div>
      </div>

      {openScenario === null ? null : (
        <ScenarioDetailsModal
          scenario={openScenario}
          eyebrow="// starter catalog"
          onClose={onCloseScenario}
        />
      )}
    </div>
  );
}

function BudgetStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ink" | "amber" | "rose";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/60 bg-amber-50/80 text-amber-800"
      : tone === "rose"
        ? "border-aura-rose/30 bg-aura-rose/10 text-aura-rose"
        : "border-aura-hairline bg-white/70 text-aura-ink";
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-card border px-4 py-3 font-mono text-micro uppercase tracking-[0.22em] ${toneClass}`}
    >
      <span className="text-aura-faint">{label}</span>
      <span className="font-display text-lg font-semibold tracking-tight">{value}</span>
    </div>
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
