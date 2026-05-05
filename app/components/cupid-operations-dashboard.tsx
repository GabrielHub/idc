import { useMemo, useState } from "react";

import type { CompanyGoal, DateScenario, Member, MemberRequest } from "../domain/game";
import { companyGoals, memberRequests, starterMembers, starterScenarios } from "../fixtures";

const drawnScenarios = starterScenarios.slice(0, 3);
const pinnedGoals = companyGoals.slice(0, 2);
const pinnedRequests = memberRequests.slice(0, 3);

type PairPreview = {
  spark: number;
  strain: number;
  health: number;
  note: string;
};

type TranscriptPreviewMessage = {
  id: string;
  label: string;
  text: string;
  tone: "member" | "scenario" | "cupid" | "judge";
};

export function CupidOperationsDashboard() {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(["jenna-pike", "vhool"]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(drawnScenarios[0]?.id ?? "");

  const selectedMembers = selectedMemberIds.map((id) => findMember(id)).filter(isMember);
  const selectedScenario = drawnScenarios.find((scenario) => scenario.id === selectedScenarioId);
  const pairPreview = useMemo(() => buildPairPreview(selectedMembers), [selectedMembers]);
  const transcriptMessages = buildTranscriptPreview(selectedMembers, selectedScenario);

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }

      if (current.length >= 2) {
        return current;
      }

      return [...current, memberId];
    });
  }

  return (
    <div className="min-h-screen bg-aura-bg text-aura-ink">
      <DashboardHeader />
      <main className="mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-5 px-5 py-5 xl:grid-cols-[260px_minmax(0,1fr)_360px] 2xl:grid-cols-[290px_minmax(0,1fr)_390px] 2xl:px-7">
        <aside className="space-y-5">
          <ShiftStatus />
          <PinnedGoals goals={pinnedGoals} />
          <PinnedRequests requests={pinnedRequests} />
        </aside>

        <section className="space-y-5">
          <MemberBoard
            members={starterMembers}
            selectedMemberIds={selectedMemberIds}
            onToggleMember={toggleMember}
          />
          <ScenarioHand
            scenarios={drawnScenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={setSelectedScenarioId}
          />
        </section>

        <aside className="space-y-5">
          <SelectedMatchPanel
            selectedMembers={selectedMembers}
            selectedScenario={selectedScenario}
            pairPreview={pairPreview}
          />
          <TranscriptPreview messages={transcriptMessages} />
        </aside>
      </main>
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="border-b border-aura-hairline bg-white/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-5 py-4 2xl:px-7">
        <div>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
            Cupid Operations
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-normal text-aura-ink">
            Interdimensional Dating Coach
          </h1>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <StatusChip label="Local model" value="gemma4:26b" tone="rose" />
          <StatusChip label="Shift" value="1 / 1" tone="violet" />
          <StatusChip label="Date slots" value="0 / 3" tone="emerald" />
        </div>
      </div>
    </header>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "rose" | "violet" | "emerald";
}) {
  const toneClass =
    tone === "rose"
      ? "border-aura-rose/20 bg-rose-50 text-aura-rose"
      : tone === "violet"
        ? "border-aura-violet/20 bg-violet-50 text-violet-700"
        : "border-aura-emerald/20 bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`rounded-pill border px-3 py-2 font-mono text-micro uppercase tracking-[0.18em] ${toneClass}`}
    >
      <span className="text-aura-muted">{label}</span>
      <span className="ml-2 font-semibold">{value}</span>
    </div>
  );
}

function ShiftStatus() {
  return (
    <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
      <SectionLabel eyebrow="// shift.01" title="Status" />
      <div className="mt-4 space-y-4">
        <MetricRow label="Date slots used" value="0 / 3" />
        <MetricRow label="Scenario hand" value="3 drawn" />
        <MetricRow label="Interventions" value="1 per date" />
      </div>
      <div className="mt-5 rounded-tile border border-aura-hairline bg-white/60 p-4">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
          Operations note
        </p>
        <p className="mt-2 text-body text-aura-ink">
          Review goals, pick two members, then assign one scenario. Cupid will treat the rest as
          process.
        </p>
      </div>
    </section>
  );
}

function PinnedGoals({ goals }: { goals: CompanyGoal[] }) {
  return (
    <section>
      <SectionLabel eyebrow="// corporate" title="Pinned goals" />
      <div className="mt-3 space-y-3">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-tile border border-aura-hairline bg-white/65 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-body font-bold text-aura-ink">{goal.title}</h2>
              <span className="rounded-pill bg-rose-50 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose">
                {goal.target}
              </span>
            </div>
            <p className="mt-2 text-label text-aura-muted">{goal.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PinnedRequests({ requests }: { requests: MemberRequest[] }) {
  return (
    <section>
      <SectionLabel eyebrow="// members" title="Pinned requests" />
      <div className="mt-3 space-y-3">
        {requests.map((request) => {
          const member = findMember(request.memberId);

          return (
            <div
              key={request.id}
              className="rounded-tile border border-aura-hairline bg-white/65 p-4"
            >
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
                {member?.name ?? "Member"}
              </p>
              <p className="mt-2 text-label text-aura-ink">{request.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MemberBoard({
  members,
  selectedMemberIds,
  onToggleMember,
}: {
  members: Member[];
  selectedMemberIds: string[];
  onToggleMember: (memberId: string) => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionLabel eyebrow="// pool" title="Member board" />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
          Select 2 members
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {members.map((member) => {
          const isSelected = selectedMemberIds.includes(member.id);
          const isDisabled = selectedMemberIds.length >= 2 && !isSelected;
          const request = memberRequests.find((item) => item.id === member.state.currentRequestId);

          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onToggleMember(member.id)}
              className={`group cursor-pointer rounded-card border p-4 text-left shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-45 ${
                isSelected
                  ? "border-aura-rose/45 bg-white/80 ring-2 ring-aura-rose/20"
                  : "border-white/70 bg-aura-card"
              }`}
            >
              <div className="flex gap-4">
                <Portrait member={member} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-bold tracking-normal text-aura-ink">
                        {member.name}
                      </h2>
                      <p className="mt-1 text-label font-semibold text-aura-muted">
                        {member.species} | {member.origin}
                      </p>
                    </div>
                    <span className="rounded-pill bg-white/80 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose">
                      {member.state.mood}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-body text-aura-ink">
                    {member.datingProfile}
                  </p>

                  <div className="mt-4">
                    <Meter label="Mood" value={member.state.mood} />
                    <Meter label="Openness" value={member.state.openness} />
                  </div>
                </div>
              </div>

              {request ? (
                <p className="mt-4 rounded-tile border border-aura-hairline bg-white/60 p-3 text-label text-aura-muted">
                  {request.text}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Portrait({ member }: { member: Member }) {
  return (
    <div className="grid size-24 shrink-0 place-items-center rounded-card border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-100 to-violet-100 shadow-card">
      <div className="text-center">
        <p className="font-display text-3xl font-bold tracking-normal text-aura-rose">
          {initialsFor(member.name)}
        </p>
        <p className="mt-1 font-mono text-micro font-semibold uppercase tracking-[0.14em] text-aura-muted">
          portrait
        </p>
      </div>
    </div>
  );
}

function ScenarioHand({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
}: {
  scenarios: DateScenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionLabel eyebrow="// today" title="Scenario hand" />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
          Reusable deck cards
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;

          return (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectScenario(scenario.id)}
              className={`cursor-pointer rounded-card border p-4 text-left shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/80 ${
                isSelected
                  ? "border-aura-fuchsia/45 bg-white/85 ring-2 ring-aura-fuchsia/20"
                  : "border-white/70 bg-aura-card"
              }`}
            >
              <div className="space-y-3">
                <RiskPill risk={scenario.card.risk} />
                <h2 className="font-display text-2xl font-bold tracking-normal text-aura-ink">
                  {scenario.title}
                </h2>
              </div>
              <p className="mt-3 text-body text-aura-muted">{scenario.card.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {scenario.card.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill border border-aura-hairline bg-white/65 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-muted"
                  >
                    {tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-label">
                <div>
                  <dt className="font-mono text-micro uppercase tracking-[0.08em] text-aura-faint">
                    Intimacy
                  </dt>
                  <dd className="font-semibold text-aura-ink">{scenario.card.intimacy}</dd>
                </div>
                <div>
                  <dt className="font-mono text-micro uppercase tracking-[0.08em] text-aura-faint">
                    Chaos
                  </dt>
                  <dd className="font-semibold text-aura-ink">{scenario.card.chaos}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SelectedMatchPanel({
  selectedMembers,
  selectedScenario,
  pairPreview,
}: {
  selectedMembers: Member[];
  selectedScenario: DateScenario | undefined;
  pairPreview: PairPreview | null;
}) {
  const canStart = selectedMembers.length === 2 && selectedScenario !== undefined;

  return (
    <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
      <SectionLabel eyebrow="// match" title="Selected match" />
      <div className="mt-4 space-y-4">
        <div className="rounded-tile border border-aura-hairline bg-white/65 p-4">
          {selectedMembers.length === 0 ? (
            <p className="text-body text-aura-muted">
              Select two member cards to build a match preview.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-aura-ink">{member.name}</p>
                    <p className="text-label text-aura-muted">{member.realityStatus}</p>
                  </div>
                  <span className="rounded-pill bg-white/80 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose">
                    mood {member.state.mood}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {pairPreview ? (
          <div className="space-y-3">
            <Meter label="Spark" value={pairPreview.spark} />
            <Meter label="Strain" value={pairPreview.strain} />
            <Meter label="Relationship health" value={pairPreview.health} />
            <p className="rounded-tile border border-aura-hairline bg-white/65 p-3 text-label text-aura-muted">
              {pairPreview.note}
            </p>
          </div>
        ) : null}

        <div className="rounded-tile border border-aura-hairline bg-white/65 p-4">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
            Scenario
          </p>
          <p className="mt-2 text-body font-semibold text-aura-ink">
            {selectedScenario?.title ?? "No scenario selected"}
          </p>
          <p className="mt-1 text-label text-aura-muted">
            {selectedScenario?.publicBrief.location ?? "Choose a scenario from today's hand."}
          </p>
        </div>

        <button
          type="button"
          disabled={!canStart}
          className="w-full cursor-pointer rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-5 py-3.5 text-body font-bold text-white shadow-cta transition hover:-translate-y-0.5 hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          Start static date preview
        </button>
      </div>
    </section>
  );
}

function TranscriptPreview({ messages }: { messages: TranscriptPreviewMessage[] }) {
  return (
    <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
      <SectionLabel eyebrow="// transcript" title="Date preview" />
      <div className="mt-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: TranscriptPreviewMessage }) {
  const toneClass =
    message.tone === "cupid"
      ? "border-aura-rose/25 bg-rose-50 text-aura-ink"
      : message.tone === "scenario"
        ? "border-aura-violet/25 bg-violet-50 text-aura-ink"
        : message.tone === "judge"
          ? "border-aura-emerald/25 bg-emerald-50 text-aura-ink"
          : "border-aura-hairline bg-white/75 text-aura-ink";

  return (
    <article className={`rounded-tile border p-3 ${toneClass}`}>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
        {message.label}
      </p>
      <p className="mt-2 text-body leading-relaxed">{message.text}</p>
    </article>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-muted">
          {label}
        </span>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-faint">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-white/70">
        <div
          className={`h-full rounded-pill bg-gradient-to-r from-aura-rose to-aura-fuchsia ${scoreWidthClass(
            value,
          )}`}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-aura-hairline pb-3 last:border-b-0 last:pb-0">
      <span className="text-label font-semibold text-aura-muted">{label}</span>
      <span className="font-mono text-label font-semibold text-aura-ink">{value}</span>
    </div>
  );
}

function SectionLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-normal text-aura-ink">
        {title}
      </h2>
    </div>
  );
}

function RiskPill({ risk }: { risk: DateScenario["card"]["risk"] }) {
  const riskClass =
    risk === "high"
      ? "bg-rose-50 text-aura-rose"
      : risk === "medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] ${riskClass}`}
    >
      {risk}
    </span>
  );
}

function findMember(memberId: string) {
  return starterMembers.find((member) => member.id === memberId);
}

function isMember(member: Member | undefined): member is Member {
  return member !== undefined;
}

function buildPairPreview(members: Member[]): PairPreview | null {
  if (members.length !== 2) {
    return null;
  }

  const [first, second] = members;
  const spark = clampScore(Math.round((first.state.openness + second.state.openness) / 2));
  const strain = clampScore(Math.round((first.state.burnout + second.state.burnout) / 2));
  const health = clampScore(Math.round((spark + (100 - strain)) / 2));
  const hasRealityGap = first.species !== second.species;
  const note = hasRealityGap
    ? "Cross-reality match. Cupid expects paperwork and useful data."
    : "Same-species match. Cupid still expects paperwork.";

  return { spark, strain, health, note };
}

function buildTranscriptPreview(
  members: Member[],
  scenario: DateScenario | undefined,
): TranscriptPreviewMessage[] {
  if (members.length !== 2 || scenario === undefined) {
    return [
      {
        id: "empty",
        label: "Cupid",
        tone: "cupid",
        text: "Select two members and one scenario to preview the date surface.",
      },
    ];
  }

  const [first, second] = members;

  return [
    {
      id: "scenario",
      label: scenario.title,
      tone: "scenario",
      text: scenario.publicBrief.openingSituation,
    },
    {
      id: first.id,
      label: first.name,
      tone: "member",
      text: first.voice.sampleMessages[0],
    },
    {
      id: second.id,
      label: second.name,
      tone: "member",
      text: second.voice.sampleMessages[0],
    },
    {
      id: "cupid",
      label: "Cupid intervention",
      tone: "cupid",
      text: "Cupid suggests: Ask one real question before the environment becomes a metaphor.",
    },
    {
      id: "judge",
      label: "Judge preview",
      tone: "judge",
      text: "Date Health stable. Spark up. Strain under review.",
    },
  ];
}

function scoreWidthClass(value: number) {
  if (value >= 81) {
    return "w-full";
  }

  if (value >= 61) {
    return "w-4/5";
  }

  if (value >= 41) {
    return "w-3/5";
  }

  if (value >= 21) {
    return "w-2/5";
  }

  return "w-1/5";
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, value));
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part.at(0) ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
