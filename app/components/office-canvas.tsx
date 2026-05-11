import { useEffect, useMemo, useState } from "react";

import type {
  DateScenario,
  GameSave,
  Member,
  MemberRequest,
  PairState,
  ShiftState,
} from "../domain/game";
import { getMemberQuitRiskStatus, MEMBER_QUIT_RISK_LABEL } from "../services/date-engine";
import { findScenarioFixture, softComposeWarnings } from "../services/deck";
import { isMemberInCooldown } from "../services/shift-planning";
import { evaluateMatchFit } from "../services/match-fit";
import { makePairId } from "../services/game-seed";
import { GhostButton, Hairline, Portrait, PrimaryButton } from "./dashboard-atoms";
import { ScenarioCard } from "./scenario-card";

export type OfficeCanvasProps = {
  save: GameSave;
  shift: ShiftState;
  focusedMembers: Member[];
  scenarios: DateScenario[];
  drawnScenarios: DateScenario[];
  memberRequests: MemberRequest[];
  pairStates: PairState[];
  isActionPending: boolean;
  aiReady: boolean;
  onStartDate: (input: {
    focusMemberId: string;
    partnerMemberId: string;
    scenarioId: string;
  }) => void;
  onOpenCasebook: () => void;
  onOpenGallery: () => void;
  onCloseShift: () => void;
  onStartNextShift: () => void;
  onResolveLibraryPick: () => void;
};

export function OfficeCanvas({
  save,
  shift,
  focusedMembers,
  scenarios,
  drawnScenarios,
  memberRequests: requests,
  pairStates,
  isActionPending,
  aiReady,
  onStartDate,
  onOpenCasebook,
  onOpenGallery,
  onCloseShift,
  onStartNextShift,
  onResolveLibraryPick,
}: OfficeCanvasProps) {
  const eligibleFocus = useMemo(
    () =>
      focusedMembers.filter(
        (member) =>
          member.state.status === "active" && !isMemberInCooldown(member, shift.shiftNumber),
      ),
    [focusedMembers, shift.shiftNumber],
  );
  const [activeFocusId, setActiveFocusId] = useState<string | null>(eligibleFocus[0]?.id ?? null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(drawnScenarios[0]?.id ?? null);

  useEffect(() => {
    if (activeFocusId !== null && eligibleFocus.some((member) => member.id === activeFocusId)) {
      return;
    }

    setActiveFocusId(eligibleFocus[0]?.id ?? null);
  }, [activeFocusId, eligibleFocus]);

  const activeFocus = useMemo(
    () => save.members.find((member) => member.id === activeFocusId) ?? null,
    [save.members, activeFocusId],
  );

  const candidatePartners = useMemo(() => {
    if (activeFocus === null) return [];
    return save.members.filter(
      (member) =>
        member.id !== activeFocus.id &&
        member.state.status === "active" &&
        !isMemberInCooldown(member, shift.shiftNumber),
    );
  }, [save.members, activeFocus, shift.shiftNumber]);

  const suggestedPartner = useMemo(() => {
    if (activeFocus === null) return null;
    let best: Member | null = null;
    let bestScore = -Infinity;
    const scenario =
      scenarios.find((candidate) => candidate.id === scenarioId) ?? drawnScenarios[0];
    if (scenario === undefined) return null;
    const pairStateById = new Map(pairStates.map((state) => [state.id, state]));
    for (const candidate of candidatePartners) {
      const pairState = pairStateById.get(makePairId(activeFocus.id, candidate.id));
      if (pairState === undefined) continue;
      try {
        const fit = evaluateMatchFit({
          members: [activeFocus, candidate],
          scenario,
          pairState,
          activeRequests: [],
        });
        const score = fit.startingDateHealthDelta;
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      } catch {
        continue;
      }
    }
    return best;
  }, [activeFocus, candidatePartners, drawnScenarios, scenarios, scenarioId, pairStates]);

  const effectivePartner = useMemo(
    () =>
      partnerId === null
        ? suggestedPartner
        : (save.members.find((member) => member.id === partnerId) ?? null),
    [partnerId, suggestedPartner, save.members],
  );

  const selectedScenario =
    drawnScenarios.find((scenario) => scenario.id === scenarioId) ?? drawnScenarios[0];

  const shiftClosed = shift.status === "completed";
  const slotsRemaining = shift.dateSlotsTotal - shift.dateSlotsUsed;
  const pendingLibraryPick = save.scenarioDeck.pendingLibraryPick;
  const warnings = useMemo(
    () => softComposeWarnings(save.scenarioDeck, scenarios),
    [save.scenarioDeck, scenarios],
  );

  const canStart =
    aiReady &&
    !isActionPending &&
    !shiftClosed &&
    pendingLibraryPick === undefined &&
    slotsRemaining > 0 &&
    activeFocus !== null &&
    effectivePartner !== null &&
    selectedScenario !== undefined &&
    activeFocus.state.status === "active" &&
    effectivePartner.state.status === "active";

  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 pb-32 pt-12 lg:px-12">
      <header className="mb-10">
        <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
          // office.shift.{String(shift.shiftNumber).padStart(2, "0")}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-aura-ink lg:text-4xl">
            Cupid's desk
          </h1>
          <div className="flex items-center gap-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <span>
              {shiftClosed
                ? "shift closed"
                : `${slotsRemaining} slot${slotsRemaining === 1 ? "" : "s"} left`}
            </span>
            <span aria-hidden>•</span>
            <span>
              {eligibleFocus.length} ready / {focusedMembers.length} on file
            </span>
          </div>
        </div>
      </header>

      <Hairline />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
            Focus cases
          </h2>
          <p className="mt-1 text-xs text-aura-muted">
            Tap a slot to make that case the focus. Closed members open the gallery for a read-only
            sheet.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {focusedMembers.map((member) => {
              const inCooldown = isMemberInCooldown(member, shift.shiftNumber);
              const status = getMemberQuitRiskStatus(member);
              const request = requests.find((entry) => entry.id === member.state.currentRequestId);
              const isActive = member.id === activeFocusId;
              return (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => setActiveFocusId(member.id)}
                    disabled={member.state.status !== "active"}
                    data-sfx="click"
                    className={`flex w-full cursor-pointer gap-3 rounded-2xl border bg-white p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isActive
                        ? "border-aura-rose/60 ring-2 ring-aura-rose/30 shadow-aura-soft"
                        : "border-aura-hairline hover:border-aura-rose/30 hover:shadow-aura-soft"
                    }`}
                  >
                    <Portrait member={member} variant="row" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-semibold tracking-tight">
                          {member.firstName}
                        </h3>
                        {member.state.status !== "active" ? (
                          <span className="rounded-pill bg-aura-cream px-2 py-0.5 text-micro uppercase tracking-[0.18em] text-aura-faint">
                            {member.state.status}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-micro font-mono uppercase tracking-[0.18em] text-aura-faint">
                        {MEMBER_QUIT_RISK_LABEL[status]}
                      </p>
                      {request !== undefined ? (
                        <p className="mt-1 line-clamp-2 text-xs text-aura-muted">{request.text}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {inCooldown ? (
                          <Chip tone="amber">cooldown</Chip>
                        ) : (
                          <Chip tone="emerald">ready</Chip>
                        )}
                        {member.state.recentDateResult !== undefined ? (
                          <span className="text-micro font-mono uppercase tracking-[0.18em] text-aura-faint">
                            last: {summarizeRecent(member.state.recentDateResult)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {focusedMembers.length < 4 ? (
              <li>
                <button
                  type="button"
                  onClick={onOpenGallery}
                  data-sfx="click"
                  className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-aura-rose/40 bg-white/40 px-4 py-6 font-mono text-micro uppercase tracking-[0.24em] text-aura-rose transition hover:bg-white/60"
                >
                  + add focus case
                </button>
              </li>
            ) : null}
          </ul>
        </section>

        <aside>
          <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">Deck</h2>
          <p className="mt-1 text-xs text-aura-muted">
            Twelve cards on deck. Today's draw shows the three you can book. Tap to open the
            casebook.
          </p>
          <button
            type="button"
            onClick={onOpenCasebook}
            data-sfx="click"
            className="mt-4 grid w-full cursor-pointer grid-cols-3 gap-2 rounded-3xl border border-aura-hairline bg-aura-cream-soft p-3 text-left transition hover:border-aura-rose/40"
          >
            {save.scenarioDeck.cardIds.map((cardId) => {
              const scenario = findScenarioFixture(cardId);
              return (
                <div
                  key={cardId}
                  className="relative aspect-[2/3] overflow-hidden rounded-xl border border-aura-hairline bg-white px-2 py-2 text-aura-ink shadow-quiet"
                >
                  <p className="font-display text-xs font-semibold leading-tight">
                    {scenario?.title ?? cardId}
                  </p>
                  <p className="absolute bottom-1 left-1 font-mono text-xs uppercase tracking-[0.18em] text-aura-faint">
                    {scenario?.card.risk ?? "?"}
                  </p>
                </div>
              );
            })}
            {pendingLibraryPick !== undefined ? (
              <div className="grid aspect-[2/3] place-items-center rounded-xl border border-dashed border-aura-rose/40 bg-white/50 text-center font-mono text-xs uppercase tracking-[0.18em] text-aura-rose">
                pick library
              </div>
            ) : null}
          </button>
          {pendingLibraryPick !== undefined ? (
            <button
              type="button"
              onClick={onResolveLibraryPick}
              data-sfx="click"
              className="mt-3 w-full cursor-pointer rounded-pill border border-aura-rose/40 bg-white px-4 py-2 font-mono text-micro uppercase tracking-[0.24em] text-aura-rose transition hover:bg-aura-rose/5"
            >
              Pick a library card →
            </button>
          ) : null}
          {warnings.length > 0 ? (
            <ul className="mt-4 space-y-1 text-xs text-aura-muted">
              {warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>

      <Hairline className="mt-12" />

      <section className="mt-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
              Today's shift card
            </h2>
            <p className="mt-1 text-xs text-aura-muted">
              Cupid prefills the most date-overdue focus case, your best match-fit partner, and the
              top hand card.
            </p>
          </div>
          {shiftClosed ? (
            <PrimaryButton onClick={onStartNextShift} disabled={isActionPending}>
              Open next shift →
            </PrimaryButton>
          ) : slotsRemaining > 0 ? (
            <GhostButton onClick={onCloseShift} disabled={isActionPending}>
              File the shift
            </GhostButton>
          ) : (
            <PrimaryButton onClick={onCloseShift} disabled={isActionPending}>
              Close the shift →
            </PrimaryButton>
          )}
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-aura-hairline bg-white p-6 shadow-aura-soft">
            <h3 className="font-mono text-micro uppercase tracking-[0.24em] text-aura-rose">
              Focus
            </h3>
            {activeFocus === null ? (
              <p className="mt-2 text-sm text-aura-muted">
                Pick a focus case from the slots above.
              </p>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <Portrait member={activeFocus} variant="card" />
                <div>
                  <h4 className="font-display text-lg font-semibold tracking-tight">
                    {activeFocus.firstName}
                  </h4>
                  <p className="text-xs text-aura-muted">Focus case</p>
                  <p className="mt-1 text-micro font-mono uppercase tracking-[0.18em] text-aura-faint">
                    {MEMBER_QUIT_RISK_LABEL[getMemberQuitRiskStatus(activeFocus)]}
                  </p>
                </div>
              </div>
            )}

            <h3 className="mt-6 font-mono text-micro uppercase tracking-[0.24em] text-aura-rose">
              Suggested partner
            </h3>
            {effectivePartner === null ? (
              <p className="mt-2 text-sm text-aura-muted">
                No eligible partner found for this focus.
              </p>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Portrait member={effectivePartner} variant="card" />
                  <div>
                    <h4 className="font-display text-lg font-semibold tracking-tight">
                      {effectivePartner.firstName}
                    </h4>
                    <p className="text-xs text-aura-muted">Eligible partner</p>
                  </div>
                </div>
                <select
                  value={effectivePartner.id}
                  onChange={(event) => setPartnerId(event.target.value)}
                  className="aura-glass rounded-pill px-3 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-ink focus:outline-none focus:ring-2 focus:ring-aura-rose/40"
                  data-sfx="click"
                >
                  {candidatePartners.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-aura-hairline bg-white p-6 shadow-aura-soft">
            <h3 className="font-mono text-micro uppercase tracking-[0.24em] text-aura-rose">
              Suggested scenario
            </h3>
            {selectedScenario === undefined ? (
              <p className="mt-2 text-sm text-aura-muted">No drawn hand yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <ScenarioCard scenario={selectedScenario} state="selected" />
                <div className="grid grid-cols-3 gap-2">
                  {drawnScenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => setScenarioId(scenario.id)}
                      data-sfx="click"
                      className={`cursor-pointer rounded-xl border px-2 py-2 text-left text-xs transition ${
                        selectedScenario.id === scenario.id
                          ? "border-aura-rose/60 bg-aura-rose/5"
                          : "border-aura-hairline bg-white hover:border-aura-rose/30"
                      }`}
                    >
                      <p className="font-display font-semibold tracking-tight">{scenario.title}</p>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-aura-faint">
                        {scenario.card.risk}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <PrimaryButton
                disabled={!canStart}
                onClick={() => {
                  if (
                    activeFocus !== null &&
                    effectivePartner !== null &&
                    selectedScenario !== undefined
                  ) {
                    onStartDate({
                      focusMemberId: activeFocus.id,
                      partnerMemberId: effectivePartner.id,
                      scenarioId: selectedScenario.id,
                    });
                  }
                }}
              >
                Begin date →
              </PrimaryButton>
            </div>
            {!aiReady ? (
              <p className="mt-3 text-right text-micro font-mono uppercase tracking-[0.18em] text-aura-faint">
                ai not ready
              </p>
            ) : null}
            {pendingLibraryPick !== undefined ? (
              <p className="mt-3 text-right text-micro font-mono uppercase tracking-[0.18em] text-aura-rose">
                resolve the pending library pick first
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "emerald" | "rose";
}) {
  const toneClass = {
    amber: "bg-amber-500/10 text-amber-700",
    emerald: "bg-emerald-500/10 text-emerald-700",
    rose: "bg-aura-rose/10 text-aura-rose",
  }[tone];
  return (
    <span
      className={`rounded-pill px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function summarizeRecent(text: string): string {
  if (text.length <= 28) return text;
  return `${text.slice(0, 25)}…`;
}
