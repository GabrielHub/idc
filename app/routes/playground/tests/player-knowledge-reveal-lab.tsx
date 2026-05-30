import { useMemo, useState } from "react";

import {
  dateMessageSchema,
  judgeSnapshotSchema,
  pairStateSchema,
  type DateMessage,
  type DateScenario,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type PairState,
  type PlayerKnowledgeRecord,
} from "../../../domain/game";
import { MemberDetailsModal } from "../../../components/member-details-modal";
import { SelectInput } from "../../../components/dashboard-atoms";
import { readKindLabel } from "../../../components/date-view-transcript";
import { starterMembers, starterScenarios } from "../../../fixtures";
import { createSeedGameSave, makePairId, sortMemberIds } from "../../../services/game-seed";
import {
  applyJudgeReveals,
  buildJudgeRevealCandidatePacket,
  buildRevealCandidates,
  buildVisibleMemberProfile,
  filterExchangeEligibleRevealCandidates,
  selectDeterministicRevealIds,
  validateUsedEvidenceIds,
  type RevealCandidate,
} from "../../../services/player-knowledge";
import { evaluateMatchFit } from "../../../services/match-fit";
import { derivePairStats } from "../../../services/pair-stats";
import { TestHeader, TextAreaControl } from "../shared";
import {
  EmptyState,
  LabButton,
  LabEntrance,
  LabPanel,
  LAB_NOW,
  MetricPill,
} from "./gameplay-lab-shared";
import { currentRequestFor } from "./gameplay-loop-lab-common";

type RevealStage = "intake" | "candidates" | "eligible" | "filed";
type AcceptMode = "deterministic" | "manual";

type RevealPreset = {
  id: string;
  label: string;
  memberId: string;
  partnerId: string;
  scenarioId: string;
  transcriptText: string;
};

const REVEAL_STAGES: readonly { id: RevealStage; label: string; hint: string }[] = [
  {
    id: "intake",
    label: "Intake",
    hint: "Only public profile fragments and sealed blocks render.",
  },
  {
    id: "candidates",
    label: "Candidates",
    hint: "Match fit and fixture visibility produce reveal candidates.",
  },
  {
    id: "eligible",
    label: "Eligible",
    hint: "Transcript evidence filters candidates down to what Cupid may file.",
  },
  {
    id: "filed",
    label: "Filed",
    hint: "Validated evidence ids become filed reads in the member file.",
  },
];

const REVEAL_PRESETS: readonly RevealPreset[] = [
  {
    id: "public-boundary",
    label: "Public boundary",
    memberId: "calvin-hewes",
    partnerId: "ryan-doyle",
    scenarioId: "museum-exhibit-mixup",
    transcriptText: [
      "Ryan: The audience is reading the placard and the archive question is already staged.",
      "Calvin: I said no public archive questions. I am not doing this for a crowd.",
      "Ryan: Right. No filming, no posted explanation, and we walk out before it becomes a show.",
    ].join("\n"),
  },
  {
    id: "clear-plan",
    label: "Clear plan",
    memberId: "sienna-bae",
    partnerId: "naia-velorae",
    scenarioId: "diner-eleven-pm",
    transcriptText: [
      "Sienna: I said yes to three places because I panicked and they all had booths.",
      "Naia: Pick one. The plan can be diner, booth four, no manager cameo.",
      "Sienna: The plan helps. One booth after rehearsal, then I ask one real question.",
    ].join("\n"),
  },
  {
    id: "profile-self-disclosure",
    label: "Profile reveal",
    memberId: "jenna-pike",
    partnerId: "vhool",
    scenarioId: "temporal-coffee-shop",
    transcriptText: [
      "Vhool: Your profile says normal dinner like it is a containment ritual.",
      "Jenna: My profile says normal because I need one date where the fork stays a fork.",
      "Vhool: Then the fork stays local and the coffee can be inventory.",
    ].join("\n"),
  },
];

export function PlayerKnowledgeRevealLabTest() {
  const [presetId, setPresetId] = useState(REVEAL_PRESETS[0].id);
  const activePreset = REVEAL_PRESETS.find((preset) => preset.id === presetId) ?? REVEAL_PRESETS[0];
  const [memberId, setMemberId] = useState(activePreset.memberId);
  const [partnerId, setPartnerId] = useState(activePreset.partnerId);
  const [scenarioId, setScenarioId] = useState(activePreset.scenarioId);
  const [transcriptText, setTranscriptText] = useState(activePreset.transcriptText);
  const [stage, setStage] = useState<RevealStage>("intake");
  const [acceptMode, setAcceptMode] = useState<AcceptMode>("deterministic");
  const [acceptedId, setAcceptedId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  const model = useMemo(
    () =>
      buildRevealModel({
        memberId,
        partnerId,
        scenarioId,
        transcriptText,
        stage,
        acceptMode,
        acceptedId,
      }),
    [acceptMode, acceptedId, memberId, partnerId, scenarioId, stage, transcriptText],
  );
  const profile = buildVisibleMemberProfile(model.member, model.save.playerKnowledge);
  const candidatePacket = buildJudgeRevealCandidatePacket({ candidates: model.eligibleCandidates });

  function selectPreset(nextPresetId: string) {
    const nextPreset =
      REVEAL_PRESETS.find((preset) => preset.id === nextPresetId) ?? REVEAL_PRESETS[0];
    setPresetId(nextPreset.id);
    setMemberId(nextPreset.memberId);
    setPartnerId(nextPreset.partnerId);
    setScenarioId(nextPreset.scenarioId);
    setTranscriptText(nextPreset.transcriptText);
    setAcceptedId("");
    setStage("intake");
  }

  return (
    <LabEntrance className="space-y-6">
      <TestHeader
        title="Player knowledge reveal lab"
        description="Walk the member file from sealed intake through reveal candidates, transcript eligibility, validated filing, and the actual member details modal."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.38fr)_minmax(0,1fr)]">
        <LabPanel label="setup">
          <div className="space-y-4">
            <SelectInput
              label="Preset"
              value={presetId}
              options={REVEAL_PRESETS.map((preset) => ({ value: preset.id, label: preset.label }))}
              onChange={selectPreset}
            />
            <SelectInput
              label="Member file"
              value={memberId}
              options={starterMembers.map((member) => ({ value: member.id, label: member.name }))}
              onChange={(next) => {
                setMemberId(next);
                if (next === partnerId) setPartnerId(REVEAL_PRESETS[0].partnerId);
              }}
            />
            <SelectInput
              label="Partner"
              value={partnerId}
              options={starterMembers
                .filter((member) => member.id !== memberId)
                .map((member) => ({ value: member.id, label: member.name }))}
              onChange={setPartnerId}
            />
            <SelectInput
              label="Scenario"
              value={scenarioId}
              options={starterScenarios.map((scenario) => ({
                value: scenario.id,
                label: scenario.title,
              }))}
              onChange={setScenarioId}
            />
          </div>
        </LabPanel>

        <LabPanel label="member file state" title={`${model.member.firstName}'s file`}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricPill label="public lines" value={profile.publicFragments.length} />
                <MetricPill label="sealed blocks" value={profile.redactedBlocks.length} />
                <MetricPill label="filed reads" value={profile.revealedReads.length} tone="ink" />
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="aura-cta cursor-pointer rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-5 py-3 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px"
              >
                open member modal
              </button>
              <div className="rounded-card bg-white/60 p-4 ring-1 ring-aura-hairline">
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
                  modal contents at this step
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-aura-muted">
                  {profile.publicFragments.map((fragment) => (
                    <li key={fragment}>{fragment}</li>
                  ))}
                  {profile.redactedBlocks.map((block) => (
                    <li key={block.id} className="text-aura-faint">
                      {block.label}: {block.lineCount} sealed line{block.lineCount === 1 ? "" : "s"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              {REVEAL_STAGES.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={entry.id === stage}
                  onClick={() => setStage(entry.id)}
                  className={`block w-full cursor-pointer rounded-card px-4 py-3 text-left transition ring-1 ${
                    entry.id === stage
                      ? "bg-aura-ink text-white ring-aura-ink"
                      : stageIndex(stage) >= index
                        ? "bg-white/75 text-aura-ink ring-aura-hairline hover:bg-white"
                        : "bg-white/45 text-aura-muted ring-aura-hairline hover:bg-white/75"
                  }`}
                >
                  <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em]">
                    step {index + 1} · {entry.label}
                  </span>
                  <span
                    className={
                      entry.id === stage
                        ? "mt-1 block text-sm text-white/70"
                        : "mt-1 block text-sm text-aura-muted"
                    }
                  >
                    {entry.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </LabPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <LabPanel label="transcript evidence" title={`${model.scenario.title}`}>
          <TextAreaControl
            label="Exchange transcript"
            value={transcriptText}
            rows={6}
            onChange={setTranscriptText}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <MetricPill label="messages" value={model.exchangeMessages.length} />
            <MetricPill label="candidate ids" value={model.candidates.length} />
            <MetricPill label="eligible ids" value={model.eligibleCandidates.length} tone="ink" />
          </div>
        </LabPanel>

        <LabPanel label="filing controls" title="Evidence id selection">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <LabButton
                label="deterministic"
                value="deterministic"
                activeValue={acceptMode}
                onSelect={setAcceptMode}
              />
              <LabButton
                label="manual"
                value="manual"
                activeValue={acceptMode}
                onSelect={setAcceptMode}
              />
            </div>
            {acceptMode === "manual" ? (
              <SelectInput
                label="Accepted id"
                value={model.manualAcceptedId}
                options={model.eligibleCandidates.map((candidate) => ({
                  value: candidate.id,
                  label: `${candidate.readKind}: ${candidate.readText}`,
                }))}
                disabled={model.eligibleCandidates.length === 0}
                placeholder="No eligible ids"
                onChange={setAcceptedId}
              />
            ) : (
              <p className="rounded-card bg-white/60 px-4 py-3 text-sm leading-relaxed text-aura-muted ring-1 ring-aura-hairline">
                Deterministic filing selected {model.acceptedIds.length} id
                {model.acceptedIds.length === 1 ? "" : "s"} from meaningful date movement.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {model.acceptedIds.length === 0 ? (
                <MetricPill label="accepted" value="none" />
              ) : (
                model.acceptedIds.map((id) => (
                  <MetricPill key={id} label="accepted" value={id} tone="good" />
                ))
              )}
            </div>
          </div>
        </LabPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <CandidateColumn
          title="Candidates"
          candidates={stageIndex(stage) >= stageIndex("candidates") ? model.candidates : []}
          filedRecords={model.records}
          empty="Advance to Candidates to see what the prompt packet could offer."
        />
        <CandidateColumn
          title="Eligible"
          candidates={stageIndex(stage) >= stageIndex("eligible") ? model.eligibleCandidates : []}
          filedRecords={model.records}
          empty="Advance to Eligible to apply transcript evidence filtering."
        />
        <LabPanel label="filed reads" title="Player knowledge records">
          {model.records.length === 0 ? (
            <EmptyState>
              Advance to Filed with an accepted id to see member-file records.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {model.records.map((record) => (
                <li
                  key={record.id}
                  className="rounded-card bg-white/60 p-4 ring-1 ring-aura-hairline"
                >
                  <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                    {readKindLabel(record)}
                  </p>
                  <p className="mt-2 text-body leading-relaxed text-aura-ink/85">
                    {record.readText}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </LabPanel>
      </div>

      <LabPanel label="prompt packet" title="Eligible candidates sent to Cupid">
        {candidatePacket.promptLines.length === 0 ? (
          <EmptyState>No eligible candidate packet at this step.</EmptyState>
        ) : (
          <pre className="max-h-72 overflow-auto rounded-card bg-aura-ink p-4 text-sm leading-relaxed text-aura-paper">
            {candidatePacket.promptLines.join("\n")}
          </pre>
        )}
      </LabPanel>

      {modalOpen ? (
        <MemberDetailsModal
          member={model.member}
          playerKnowledge={model.save.playerKnowledge}
          request={model.focusRequest}
          revealAllDetails={false}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </LabEntrance>
  );
}

function CandidateColumn({
  title,
  candidates,
  filedRecords,
  empty,
}: {
  title: string;
  candidates: readonly RevealCandidate[];
  filedRecords: readonly PlayerKnowledgeRecord[];
  empty: string;
}) {
  const filedReadIds = new Set(filedRecords.map((record) => record.readId));
  return (
    <LabPanel label="reveal pipeline" title={title}>
      {candidates.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {candidates.map((candidate) => (
            <li
              key={candidate.id}
              className="rounded-card bg-white/60 p-4 ring-1 ring-aura-hairline"
            >
              <div className="flex flex-wrap items-center gap-2">
                <MetricPill label={candidate.readKind} value={candidate.subjectKind} />
                {filedReadIds.has(candidate.id) ? (
                  <MetricPill label="state" value="filed" tone="good" />
                ) : null}
              </div>
              <p className="mt-3 text-body leading-relaxed text-aura-ink/85">
                {candidate.readText}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-aura-muted">
                {candidate.evidenceText}
              </p>
            </li>
          ))}
        </ul>
      )}
    </LabPanel>
  );
}

type RevealModel = {
  member: Member;
  partner: Member;
  scenario: DateScenario;
  focusRequest: MemberRequest | undefined;
  pairState: PairState;
  exchangeMessages: DateMessage[];
  candidates: RevealCandidate[];
  eligibleCandidates: RevealCandidate[];
  judgeSnapshot: JudgeSnapshot;
  acceptedIds: string[];
  manualAcceptedId: string;
  save: GameSave;
  records: PlayerKnowledgeRecord[];
};

function buildRevealModel({
  memberId,
  partnerId,
  scenarioId,
  transcriptText,
  stage,
  acceptMode,
  acceptedId,
}: {
  memberId: string;
  partnerId: string;
  scenarioId: string;
  transcriptText: string;
  stage: RevealStage;
  acceptMode: AcceptMode;
  acceptedId: string;
}): RevealModel {
  const member = requireMember(memberId);
  const partner =
    member.id === partnerId ? requireMember(REVEAL_PRESETS[0].partnerId) : requireMember(partnerId);
  const scenario = requireScenario(scenarioId);
  const focusRequest = currentRequestFor(member);
  const pairState = buildPairState(member, partner, scenario);
  const matchFit = evaluateMatchFit({
    members: [member, partner],
    scenario,
    pairState,
    activeRequests: focusRequest === undefined ? [] : [focusRequest],
    knownPairReads: [],
  });
  const baseSave = {
    ...createSeedGameSave(new Date(LAB_NOW)),
    pairStates: [pairState],
  };
  const exchangeMessages = buildExchangeMessages(transcriptText, member, partner);
  const candidates = buildRevealCandidates({
    members: [member, partner],
    scenario,
    pairState,
    focusRequest,
    matchFit,
    knownReads: baseSave.playerKnowledge,
  });
  const eligibleCandidates = filterExchangeEligibleRevealCandidates({
    candidates,
    exchangeMessages,
  });
  const judgeSnapshot = makeJudgeSnapshot(member, partner);
  const manualAcceptedId = eligibleCandidates.some((candidate) => candidate.id === acceptedId)
    ? acceptedId
    : (eligibleCandidates[0]?.id ?? "");
  const proposedIds =
    acceptMode === "deterministic"
      ? selectDeterministicRevealIds({ candidates: eligibleCandidates, judgeSnapshot })
      : manualAcceptedId.length === 0
        ? []
        : [manualAcceptedId];
  const acceptedIds =
    stage === "filed" ? validateUsedEvidenceIds(proposedIds, eligibleCandidates) : [];
  const revealResult =
    acceptedIds.length === 0
      ? { save: baseSave, records: [] as PlayerKnowledgeRecord[] }
      : applyJudgeReveals({
          save: baseSave,
          candidates: eligibleCandidates,
          acceptedIds,
          judgeSnapshot,
          revealedAt: LAB_NOW,
        });

  return {
    member,
    partner,
    scenario,
    focusRequest,
    pairState,
    exchangeMessages,
    candidates,
    eligibleCandidates,
    judgeSnapshot,
    acceptedIds,
    manualAcceptedId,
    save: revealResult.save,
    records: revealResult.records,
  };
}

function buildPairState(member: Member, partner: Member, scenario: DateScenario): PairState {
  return pairStateSchema.parse({
    id: makePairId(member.id, partner.id),
    participantIds: sortMemberIds(member.id, partner.id),
    laneStatus: "open",
    stats: derivePairStats({
      chemistry: 58,
      trust: 52,
      stability: 50,
      conflict: 35,
      weirdnessTolerance: 62,
      spark: 55,
      strain: 0,
      relationshipHealth: 0,
    }),
    completedDateIds: [],
    scenarioUseCounts: { [scenario.id]: 0 },
    agreements: [],
    openLoops: [],
  });
}

function buildExchangeMessages(text: string, member: Member, partner: Member): DateMessage[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      const [speakerLabel, ...rest] = line.split(":");
      const body = rest.length === 0 ? line : rest.join(":").trim();
      const normalizedSpeaker = speakerLabel?.trim().toLowerCase() ?? "";
      const speakerId =
        normalizedSpeaker.includes(member.firstName.toLowerCase()) ||
        normalizedSpeaker.includes(member.name.toLowerCase())
          ? member.id
          : partner.id;
      return dateMessageSchema.parse({
        id: `reveal-lab-message-${index + 1}`,
        dateSessionId: "date-reveal-lab",
        kind: "character",
        speakerId,
        turnIndex: index + 1,
        sequenceIndex: index,
        text: body,
        createdAt: LAB_NOW,
      });
    });
}

function makeJudgeSnapshot(member: Member, partner: Member): JudgeSnapshot {
  return judgeSnapshotSchema.parse({
    id: "judge-reveal-lab",
    dateSessionId: "date-reveal-lab",
    exchangeIndex: 1,
    dateHealthDelta: 8,
    statDeltas: { trust: 4, spark: 2 },
    memberMoodDeltas: { [member.id]: 4, [partner.id]: 2 },
    shouldEndEarly: false,
    endSentiment: null,
    notableMoments: ["The transcript included concrete evidence for a filed read."],
    playerSummary: "Cupid found a filed read in the exchange.",
    memoryCandidates: [],
    usedEvidenceIds: [],
    agreementCandidates: [],
    agreementUpdates: [],
    openLoopCandidates: [],
    openLoopUpdates: [],
  });
}

function stageIndex(stage: RevealStage): number {
  return REVEAL_STAGES.findIndex((entry) => entry.id === stage);
}

function requireMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing playground member ${memberId}`);
  }
  return member;
}

function requireScenario(scenarioId: string): DateScenario {
  const scenario = starterScenarios.find((candidate) => candidate.id === scenarioId);
  if (scenario === undefined) {
    throw new Error(`Missing playground scenario ${scenarioId}`);
  }
  return scenario;
}
