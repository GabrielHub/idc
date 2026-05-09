import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type CompanyGoal,
  type DateFinalReport,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type DeckPowerKind,
  type DeckPowerUsage,
  type FollowUpAction,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type MemoryRecord,
  type PairState,
  type PortraitMood,
  type ScenarioEvent,
  type ShiftState,
} from "../domain/game";
import {
  canAddCupidIntervention,
  EVENT_DRAFT_PICKED,
  exchangeIndexForTurn,
  fallbackGoalProgress,
  findScenarioEventById,
  formatCupidInterventionText,
  getMemberQuitRiskStatus,
  isMemberRetained,
  MAX_NUDGES_PER_DATE,
  MEMBER_QUIT_RISK_LABEL,
  type GoalProgressSnapshot,
  type MemberQuitRiskStatus,
} from "../services/date-engine";
import type { MatchFitPublicSignal } from "../services/match-fit";
import type { ScenarioPowerAvailability } from "../services/scenario-powers";
import {
  EASE_OUT_QUART,
  Eyebrow,
  GhostButton,
  Hairline,
  LiveDot,
  Meter,
  MutedLabel,
  pad2,
  Portrait,
  PrimaryButton,
  scoreWidthClass,
  SelectInput,
  Tooltip,
} from "./dashboard-atoms";
import {
  DaterStandee,
  type ReactionIntensity,
  type ReactionKind,
  type ReactionSignal,
} from "./date-reactions";
import { isMemberSpeaking, selectPortraitMood } from "./date-presentation-signals";
import type { SfxCue } from "./sfx-provider";

const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  encourage: "Encourage",
  cool_down: "Cool Down",
  repair: "Repair",
  mark_bad_fit: "Mark Bad Fit",
};

const FOLLOW_UP_PROJECTIONS: Record<FollowUpAction, string> = {
  encourage: "Spark, chemistry, trust up. Retention nudges up.",
  cool_down: "Conflict eases, stability up. Retention recovers.",
  repair: "Trust and stability up, conflict down. Biggest retention bump.",
  mark_bad_fit: "Chemistry and spark crash. Retention recovers; pair logged.",
};

export type PendingDateAction = "advanceExchange" | "completeDate";

/* ================================================================== */
/* Roster                                                             */
/* ================================================================== */

export type RosterProps = {
  members: Member[];
  featuredMembers: Member[];
  featuredRequests: MemberRequest[];
  selectedMemberIds: string[];
  disabled: boolean;
  onSelectFocusMember: (memberId: string) => void;
  onSelectPartnerMember: (memberId: string) => void;
  onContinue: () => void;
};

type KindFilter = "all" | "human" | "non_human" | "picked";
type MoodFilter = "in_a_mood" | "cool_customer" | "open_book" | "guarded";
type SortMode = "default" | "name" | "mood-desc" | "openness-desc";

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "human", label: "humans" },
  { id: "non_human", label: "non-humans" },
  { id: "picked", label: "picked" },
];

const MOOD_FILTER_DEFS: Record<
  MoodFilter,
  { label: string; group: "mood" | "openness"; match: (member: Member) => boolean }
> = {
  in_a_mood: { label: "in a mood", group: "mood", match: (m) => m.state.mood < 50 },
  cool_customer: { label: "cool customer", group: "mood", match: (m) => m.state.mood >= 65 },
  open_book: { label: "open book", group: "openness", match: (m) => m.state.openness >= 65 },
  guarded: { label: "guarded", group: "openness", match: (m) => m.state.openness < 50 },
};

const SORT_MENU: { value: SortMode; label: string }[] = [
  { value: "default", label: "default" },
  { value: "name", label: "by name" },
  { value: "mood-desc", label: "mood, high to low" },
  { value: "openness-desc", label: "openness, high to low" },
];

function firstSentenceOf(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return (match ? match[0] : text).trim();
}

export function RosterView({
  members,
  featuredMembers,
  featuredRequests,
  selectedMemberIds,
  disabled,
  onSelectFocusMember,
  onSelectPartnerMember,
  onContinue,
}: RosterProps) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [moodFilters, setMoodFilters] = useState<MoodFilter[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const selectedMembers = selectedMemberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m));
  const focusMember = selectedMembers[0];
  const partnerMember = selectedMembers[1];
  const partnerMembers = useMemo(
    () => members.filter((member) => member.id !== focusMember?.id),
    [members, focusMember?.id],
  );

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let pool = partnerMembers.filter((member) => {
      if (kindFilter === "human" && !member.tags.includes("ordinary_human")) return false;
      if (kindFilter === "non_human" && !member.tags.includes("non_human")) return false;
      if (kindFilter === "picked" && member.id !== partnerMember?.id) return false;

      for (const moodFilter of moodFilters) {
        if (!MOOD_FILTER_DEFS[moodFilter].match(member)) return false;
      }

      if (query.length > 0) {
        const haystack = [
          member.firstName,
          member.name,
          member.species,
          member.origin,
          member.realityStatus,
          member.bio,
          member.datingProfile,
          ...member.relationshipNeeds,
          ...member.preferences,
          ...member.dealbreakers,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    if (sortMode === "name") {
      pool = [...pool].sort((a, b) => a.firstName.localeCompare(b.firstName));
    } else if (sortMode === "mood-desc") {
      pool = [...pool].sort((a, b) => b.state.mood - a.state.mood);
    } else if (sortMode === "openness-desc") {
      pool = [...pool].sort((a, b) => b.state.openness - a.state.openness);
    }

    return pool;
  }, [partnerMembers, searchQuery, kindFilter, moodFilters, sortMode, partnerMember?.id]);

  const openMember =
    openMemberId === null ? null : (members.find((m) => m.id === openMemberId) ?? null);
  const openMemberRequest =
    openMember === null
      ? undefined
      : (featuredRequests.find((entry) => entry.id === openMember.state.currentRequestId) ??
        featuredRequests.find((entry) => entry.memberId === openMember.id));
  const openMemberIsFeatured =
    openMember !== null && featuredMembers.some((featured) => featured.id === openMember.id);
  const openMemberIsSelected = openMember !== null && selectedMemberIds.includes(openMember.id);
  const selectedMembersCanDate =
    selectedMembers.length === 2 && selectedMembers.every(isMemberRetained);

  function clearFilters() {
    setSearchQuery("");
    setKindFilter("all");
    setMoodFilters([]);
  }

  function handleDossierPick() {
    if (openMember === null) return;
    if (!isMemberRetained(openMember)) return;
    if (openMemberIsFeatured) {
      onSelectFocusMember(openMember.id);
    } else {
      onSelectPartnerMember(openMember.id);
    }
    setOpenMemberId(null);
  }

  const hasActiveFilters = searchQuery.length > 0 || kindFilter !== "all" || moodFilters.length > 0;

  return (
    <ViewFrame wide>
      <SectionHeader
        eyebrow={`// cases.${pad2(featuredMembers.length)}`}
        title="Today's cases"
        meta={`${pad2(featuredMembers.length)} featured`}
        tooltip="One featured member becomes the focus. Their ask guides the match."
      />

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {featuredMembers.map((member, index) => {
          const request = featuredRequests.find((entry) => entry.memberId === member.id);
          return (
            <FeaturedCaseCard
              key={member.id}
              member={member}
              request={request}
              index={index}
              isSelected={selectedMemberIds[0] === member.id}
              disabled={disabled || !isMemberRetained(member)}
              onPick={() => onSelectFocusMember(member.id)}
              onOpenDossier={() => setOpenMemberId(member.id)}
            />
          );
        })}
      </ul>

      <section className="mt-14">
        <SectionHeader
          eyebrow={`// roster.${pad2(members.length)}`}
          title="Partner roster"
          meta={`${pad2(partnerMembers.length)} on file`}
          tooltip={
            focusMember === undefined
              ? "Browse the room. Picks need a focus first."
              : `Pair anyone with ${focusMember.firstName}.`
          }
        />

        <DossierFilterRail
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          kindFilter={kindFilter}
          onKindFilterChange={setKindFilter}
          moodFilters={moodFilters}
          onMoodFiltersChange={setMoodFilters}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          totalCount={partnerMembers.length}
          shownCount={filteredPartners.length}
          partnerPicked={partnerMember !== undefined}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        <RosterSentinel
          totalCount={partnerMembers.length}
          shownCount={filteredPartners.length}
          hasActiveFilters={hasActiveFilters}
          focusPicked={focusMember !== undefined}
        />

        {filteredPartners.length === 0 ? (
          <RosterEmptyTile onClear={clearFilters} />
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {filteredPartners.map((member, index) => (
                <PartnerTile
                  key={member.id}
                  member={member}
                  index={index}
                  isSelected={selectedMemberIds[1] === member.id}
                  disabled={disabled || focusMember === undefined || !isMemberRetained(member)}
                  onPick={() => onSelectPartnerMember(member.id)}
                  onOpenDossier={() => setOpenMemberId(member.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <SelectionBar
        selectedMembers={selectedMembers}
        disabled={disabled || !selectedMembersCanDate}
        onContinue={onContinue}
      />

      <AnimatePresence>
        {openMember === null ? null : (
          <MemberDossier
            key={`roster-dossier-${openMember.id}`}
            member={openMember}
            request={openMemberRequest}
            isSelected={openMemberIsSelected}
            disabled={
              disabled ||
              !isMemberRetained(openMember) ||
              (!openMemberIsFeatured && focusMember === undefined)
            }
            onClose={() => setOpenMemberId(null)}
            onPick={openMemberIsSelected ? undefined : handleDossierPick}
          />
        )}
      </AnimatePresence>
    </ViewFrame>
  );
}

function FeaturedCaseCard({
  member,
  request,
  index,
  isSelected,
  disabled,
  onPick,
  onOpenDossier,
}: {
  member: Member;
  request: MemberRequest | undefined;
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onPick: () => void;
  onOpenDossier: () => void;
}) {
  const hasQuit = !isMemberRetained(member);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 * index, ease: EASE_OUT_QUART }}
      className="list-none"
    >
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-card aura-glass aura-glass-lift ${
          hasQuit ? "opacity-75 grayscale" : ""
        }`}
      >
        <div
          aria-hidden
          className={`aura-glass-ink pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            isSelected ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="relative z-10 flex h-full w-full flex-col">
          <button
            type="button"
            onClick={onPick}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={`Pick ${member.firstName} as today's focus case`}
            className="block w-full flex-1 cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex gap-5 p-5 lg:gap-6 lg:p-6">
              <div className="shrink-0">
                <Portrait member={member} variant="card" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex h-6 items-center justify-between gap-3">
                  <span
                    className={`font-mono text-micro font-semibold uppercase tabular-nums tracking-[0.28em] transition-colors duration-300 ${
                      isSelected ? "text-white/55" : "text-aura-faint"
                    }`}
                  >
                    {`case.${pad2(index + 1)}`}
                  </span>
                  <AnimatePresence>
                    {hasQuit ? (
                      <motion.span
                        key="quit-stamp"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
                        className="origin-right"
                      >
                        <QuitStamp />
                      </motion.span>
                    ) : isSelected ? (
                      <motion.span
                        key="focus-stamp"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
                        className="origin-right"
                      >
                        <FocusStamp />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <h3
                  className={`mt-2 line-clamp-1 font-display text-display-md font-semibold leading-[1.05] tracking-tight transition-colors duration-300 ${
                    isSelected ? "text-white" : "text-aura-ink"
                  }`}
                >
                  {member.firstName}
                </h3>
                {request === undefined ? null : (
                  <p
                    className={`mt-3 line-clamp-2 aura-accent text-lead leading-snug transition-colors duration-300 ${
                      isSelected ? "text-white/85" : "text-aura-ink/80"
                    }`}
                  >
                    &ldquo;{request.text}&rdquo;
                  </p>
                )}
                <CaseStatStrip member={member} inverted={isSelected} />
              </div>
            </div>
          </button>

          <div
            className={`flex items-center justify-between gap-3 border-t px-5 py-2.5 transition-colors duration-300 lg:px-6 ${
              isSelected ? "border-white/15 bg-white/5" : "border-aura-hairline bg-white/35"
            }`}
          >
            <span
              className={`truncate font-mono text-micro uppercase tracking-[0.24em] transition-colors duration-300 ${
                isSelected ? "text-white/55" : "text-aura-faint"
              }`}
            >
              {hasQuit ? "quit app" : isSelected ? "on the desk" : "tap card to focus"}
            </span>
            <button
              type="button"
              onClick={onOpenDossier}
              className={`shrink-0 cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition-colors duration-300 ${
                isSelected
                  ? "text-white/85 hover:bg-white/10"
                  : "text-aura-rose hover:bg-aura-rose/10"
              }`}
            >
              Open file ↗
            </button>
          </div>
        </div>
        {hasQuit ? <QuitMemberMark /> : null}
      </article>
    </motion.li>
  );
}

function CaseStatStrip({ member, inverted }: { member: Member; inverted: boolean }) {
  return (
    <div className="mt-5 space-y-3">
      <div className="grid grid-cols-[auto_auto_minmax(3rem,1fr)] items-center gap-x-3 gap-y-1.5">
        <CaseStat label="Mood" value={member.state.mood} inverted={inverted} tone="rose" />
        <CaseStat
          label="Openness"
          value={member.state.openness}
          inverted={inverted}
          tone="violet"
        />
        <CaseStat label="Burnout" value={member.state.burnout} inverted={inverted} tone="amber" />
      </div>
      <QuitRiskBadge member={member} />
    </div>
  );
}

type CaseStatTone = "rose" | "violet" | "amber";

const CASE_STAT_FILL: Record<CaseStatTone, string> = {
  rose: "from-aura-rose to-aura-fuchsia",
  violet: "from-aura-violet to-aura-fuchsia",
  amber: "from-aura-amber to-aura-rose",
};

function CaseStat({
  label,
  value,
  inverted,
  tone,
}: {
  label: string;
  value: number;
  inverted: boolean;
  tone: CaseStatTone;
}) {
  const fill = CASE_STAT_FILL[tone];
  const widthClass = scoreWidthClass(value);
  return (
    <>
      <span
        className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] transition-colors duration-300 ${
          inverted ? "text-white/55" : "text-aura-faint"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-right font-mono text-micro font-semibold tabular-nums transition-colors duration-300 ${
          inverted ? "text-white" : "text-aura-ink"
        }`}
      >
        {value}
      </span>
      <span
        aria-hidden
        className={`relative block h-1 w-full overflow-hidden rounded-pill transition-colors duration-300 ${
          inverted ? "bg-white/15" : "bg-aura-hairline"
        }`}
      >
        <span
          className={`aura-bar-fill block h-full rounded-pill bg-gradient-to-r ${fill} ${widthClass}`}
        />
      </span>
    </>
  );
}

function FocusStamp() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-white px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-ink shadow-quiet">
      <span aria-hidden className="size-1.5 rounded-full bg-aura-rose" />
      focus
    </span>
  );
}

function QuitStamp() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-aura-ink px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-white shadow-quiet">
      quit
    </span>
  );
}

const QUIT_RISK_BADGE_TONE: Record<MemberQuitRiskStatus, string> = {
  file_stable: "bg-white/65 text-aura-muted",
  client_confidence_low: "bg-aura-amber/95 text-white",
  closed_file_risk: "bg-aura-rose/95 text-white",
  file_closed: "bg-aura-ink text-white",
};

const QUIT_RISK_DOT_TONE: Record<MemberQuitRiskStatus, string> = {
  file_stable: "bg-aura-faint",
  client_confidence_low: "bg-white/85",
  closed_file_risk: "bg-white/85",
  file_closed: "bg-white/70",
};

function QuitRiskBadge({ member }: { member: Member }) {
  const status = getMemberQuitRiskStatus(member);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] shadow-quiet ${QUIT_RISK_BADGE_TONE[status]}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${QUIT_RISK_DOT_TONE[status]}`} />
      {MEMBER_QUIT_RISK_LABEL[status]}
    </span>
  );
}

function QuitMemberMark() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-white/20">
      <span
        aria-hidden
        className="font-display text-[7rem] font-semibold leading-none text-aura-rose/70"
      >
        X
      </span>
    </div>
  );
}

function DossierGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
      <path
        d="M6 4H12V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PartnerTile({
  member,
  index,
  isSelected,
  disabled,
  onPick,
  onOpenDossier,
}: {
  member: Member;
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onPick: () => void;
  onOpenDossier: () => void;
}) {
  const profileTeaser = firstSentenceOf(member.datingProfile);
  const hasQuit = !isMemberRetained(member);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
      transition={{
        duration: 0.32,
        delay: 0.02 * Math.min(index, 14),
        ease: EASE_OUT_QUART,
      }}
      className="list-none"
    >
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-card aura-glass aura-glass-lift ${
          hasQuit ? "opacity-75 grayscale" : ""
        }`}
      >
        <div
          aria-hidden
          className={`aura-glass-ink pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            isSelected ? "opacity-100" : "opacity-0"
          }`}
        />
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          aria-pressed={isSelected}
          aria-label={`Pick ${member.firstName} as the partner`}
          className="relative z-10 flex flex-1 cursor-pointer flex-col gap-3 px-4 py-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start gap-3">
            <Portrait member={member} variant="row" />
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`line-clamp-1 pr-9 font-display text-display-sm font-semibold leading-tight tracking-tight transition-colors duration-300 ${
                  isSelected ? "text-white" : "text-aura-ink"
                }`}
              >
                {member.firstName}
              </h4>
              <p
                className={`line-clamp-2 aura-accent pr-9 text-label leading-snug transition-colors duration-300 ${
                  isSelected ? "text-white/80" : "text-aura-ink/75"
                }`}
              >
                &ldquo;{profileTeaser}&rdquo;
              </p>
            </div>
          </div>
          <div className="mt-auto space-y-3 pt-1">
            <div className="grid grid-cols-[auto_auto_minmax(3rem,1fr)] items-center gap-x-3 gap-y-1.5">
              <CaseStat label="Mood" value={member.state.mood} inverted={isSelected} tone="rose" />
              <CaseStat
                label="Openness"
                value={member.state.openness}
                inverted={isSelected}
                tone="violet"
              />
              <CaseStat
                label="Burnout"
                value={member.state.burnout}
                inverted={isSelected}
                tone="amber"
              />
            </div>
            <QuitRiskBadge member={member} />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenDossier}
          aria-label={`Open ${member.firstName} dossier`}
          title="Open dossier"
          className={`absolute right-3 top-3 z-20 grid size-7 cursor-pointer place-items-center rounded-full transition-colors duration-300 ${
            isSelected
              ? "bg-white/10 text-white/85 hover:bg-white/20 hover:text-white"
              : "bg-white/55 text-aura-muted hover:bg-white hover:text-aura-rose"
          }`}
        >
          <DossierGlyph />
        </button>
        {hasQuit ? <QuitMemberMark /> : null}
      </article>
    </motion.li>
  );
}

function DossierFilterRail({
  searchQuery,
  onSearchChange,
  kindFilter,
  onKindFilterChange,
  moodFilters,
  onMoodFiltersChange,
  sortMode,
  onSortModeChange,
  totalCount,
  shownCount,
  partnerPicked,
  hasActiveFilters,
  onClearFilters,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  kindFilter: KindFilter;
  onKindFilterChange: (value: KindFilter) => void;
  moodFilters: MoodFilter[];
  onMoodFiltersChange: (value: MoodFilter[]) => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  totalCount: number;
  shownCount: number;
  partnerPicked: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  function toggleMood(mood: MoodFilter) {
    if (moodFilters.includes(mood)) {
      onMoodFiltersChange(moodFilters.filter((m) => m !== mood));
      return;
    }
    const sameGroup = (Object.keys(MOOD_FILTER_DEFS) as MoodFilter[]).filter(
      (other) => MOOD_FILTER_DEFS[other].group === MOOD_FILTER_DEFS[mood].group,
    );
    onMoodFiltersChange([...moodFilters.filter((existing) => !sameGroup.includes(existing)), mood]);
  }

  return (
    <div className="sticky top-24 z-20 mt-8 lg:top-28">
      <div className="aura-glass-strong rounded-card px-4 py-3.5 lg:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // room
          </span>
          <FilterSearchInput value={searchQuery} onChange={onSearchChange} />
          <div className="ml-auto flex items-center gap-3">
            <SelectInput
              label="sort"
              value={sortMode}
              options={SORT_MENU}
              layout="toolbar"
              align="right"
              onChange={onSortModeChange}
            />
            <span className="font-mono text-micro font-semibold uppercase tabular-nums tracking-[0.24em] text-aura-faint">
              <span className="text-aura-ink">{pad2(shownCount)}</span>
              <span className="text-aura-faint">{` / ${pad2(totalCount)}`}</span>
            </span>
          </div>
        </div>
        <div className="mt-3 aura-rule" />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div role="group" aria-label="Filter by kind" className="flex items-center gap-1">
            {KIND_FILTERS.map((option) => (
              <FilterChip
                key={option.id}
                active={kindFilter === option.id}
                onClick={() => onKindFilterChange(option.id)}
                disabled={option.id === "picked" && !partnerPicked}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
          <span aria-hidden className="h-4 w-px bg-aura-hairline-strong/40" />
          <div
            role="group"
            aria-label="Filter by mood and openness"
            className="flex flex-wrap items-center gap-1"
          >
            {(Object.keys(MOOD_FILTER_DEFS) as MoodFilter[]).map((id) => (
              <FilterChip key={id} active={moodFilters.includes(id)} onClick={() => toggleMood(id)}>
                {MOOD_FILTER_DEFS[id].label}
              </FilterChip>
            ))}
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-auto cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint transition hover:text-aura-rose"
            >
              clear ✕
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-aura-ink text-white shadow-quiet"
          : "text-aura-muted hover:bg-white/65 hover:text-aura-ink"
      }`}
    >
      {children}
    </button>
  );
}

function FilterSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <label className="flex min-w-[14rem] flex-1 max-w-md items-center gap-2 rounded-pill border border-aura-hairline bg-white/65 px-3.5 py-1.5 transition focus-within:border-aura-rose/40 focus-within:bg-white/85">
      <SearchGlyph />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="search file room"
        className="w-full border-0 bg-transparent font-mono text-label text-aura-ink placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.22em] placeholder:text-aura-faint focus:outline-none"
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="cursor-pointer rounded-full px-1 font-mono text-micro text-aura-faint transition hover:text-aura-rose"
        >
          ✕
        </button>
      ) : (
        <kbd className="hidden rounded border border-aura-hairline bg-white/70 px-1.5 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint sm:inline-block">
          ⌘K
        </kbd>
      )}
    </label>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-aura-faint" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RosterSentinel({
  totalCount,
  shownCount,
  hasActiveFilters,
  focusPicked,
}: {
  totalCount: number;
  shownCount: number;
  hasActiveFilters: boolean;
  focusPicked: boolean;
}) {
  const line = (() => {
    if (totalCount === 0) {
      return "Empty room. Cupid is professionally relieved.";
    }
    if (!focusPicked) {
      return "Browse the room. Picks unlock once a focus is on the desk.";
    }
    if (shownCount === 0) {
      return "Empty room. Cupid blames you, lightly.";
    }
    if (!hasActiveFilters) {
      return `${shownCount} files in the room. Cupid pretends not to keep score.`;
    }
    if (shownCount === 1) {
      return "One file matches. Convenient or alarming.";
    }
    return `${shownCount} of ${totalCount} files match. Cupid quietly approves.`;
  })();

  return <p className="mt-4 aura-accent text-lead text-aura-muted">&ldquo;{line}&rdquo;</p>;
}

function RosterEmptyTile({ onClear }: { onClear: () => void }) {
  return (
    <div className="aura-glass mt-6 rounded-card px-6 py-12 text-center">
      <Eyebrow>// no match</Eyebrow>
      <p className="mt-3 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
        Filed under nothing.
      </p>
      <p className="mt-2 text-body text-aura-muted">
        Loosen the filters or clear the room and try again.
      </p>
      <div className="mt-5">
        <GhostButton onClick={onClear}>Reset filters</GhostButton>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  meta,
  tooltip,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  tooltip: React.ReactNode;
}) {
  return (
    <header className="border-b border-aura-hairline pb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="group relative">
          <h2
            tabIndex={0}
            className="cursor-help font-display text-display-lg font-semibold leading-[0.92] tracking-tight text-aura-ink outline-none focus-visible:text-aura-rose"
          >
            {title}
          </h2>
          <div
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-max max-w-md translate-y-1 rounded-card border border-aura-hairline bg-white/95 px-4 py-2.5 opacity-0 shadow-card backdrop-blur-sm transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            <p className="aura-accent text-lead leading-snug text-aura-muted">
              &ldquo;{tooltip}&rdquo;
            </p>
          </div>
        </div>
        <p className="flex items-baseline gap-2 font-mono text-micro font-semibold uppercase tracking-[0.28em]">
          <span className="text-aura-rose">{eyebrow}</span>
          <span aria-hidden className="text-aura-faint/60">
            ·
          </span>
          <span className="text-aura-faint">{meta}</span>
        </p>
      </div>
    </header>
  );
}

function MemberDossier({
  member,
  request,
  isSelected,
  disabled,
  onClose,
  onPick,
}: {
  member: Member;
  request: MemberRequest | undefined;
  isSelected: boolean;
  disabled: boolean;
  onClose: () => void;
  onPick?: () => void;
}) {
  const hasQuit = !isMemberRetained(member);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
      onClick={onClose}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/55 px-4 py-10 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
        onClick={(event) => event.stopPropagation()}
        className="aura-glass-strong relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${member.firstName} dossier`}
      >
        <ModalCloseButton onClose={onClose} label="Close dossier" />

        <div className="overflow-y-auto px-6 pb-6 pt-8 lg:px-10 lg:pb-8 lg:pt-10">
          <div className="space-y-7">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
              <span className="relative inline-block">
                <Portrait member={member} variant="stage" />
                {hasQuit ? <QuitMemberMark /> : null}
              </span>
              <div className="min-w-0 space-y-2">
                <Eyebrow>{hasQuit ? "// dossier.closed" : "// dossier"}</Eyebrow>
                <h2 className="font-display text-display-md font-semibold tracking-tight text-aura-ink">
                  {member.firstName}
                </h2>
                <p className="text-lead text-aura-muted">{member.datingProfile}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Meter label="Mood" value={member.state.mood} size="md" />
              <Meter label="Openness" value={member.state.openness} tone="violet" size="md" />
              <Meter label="Burnout" value={member.state.burnout} tone="amber" size="md" />
            </div>

            <DossierBlock eyebrow="// status">
              <QuitRiskBadge member={member} />
            </DossierBlock>

            {request === undefined ? null : (
              <DossierBlock eyebrow="// ask">
                <p className="text-body text-aura-ink/90">{request.text}</p>
              </DossierBlock>
            )}

            <DossierBlock eyebrow="// looking for">
              <ul className="space-y-1.5 text-label text-aura-ink/85">
                {member.relationshipNeeds.map((need) => (
                  <li key={need} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-aura-rose"
                    />
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            </DossierBlock>

            {member.preferences.length === 0 ? null : (
              <DossierBlock eyebrow="// preferences">
                <p className="text-label text-aura-ink/85">{member.preferences.join(" · ")}</p>
              </DossierBlock>
            )}

            {member.dealbreakers.length === 0 ? null : (
              <DossierBlock eyebrow="// dealbreakers">
                <p className="text-label text-aura-rose/85">{member.dealbreakers.join(" · ")}</p>
              </DossierBlock>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-aura-hairline px-6 py-4 lg:px-10 lg:py-5">
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {hasQuit
              ? "Client file closed"
              : isSelected
                ? "On the call sheet"
                : "Awaiting your call"}
          </p>
          {onPick === undefined ? null : isSelected ? (
            <GhostButton onClick={onPick} disabled={disabled} ariaPressed>
              Remove from date
            </GhostButton>
          ) : (
            <PrimaryButton onClick={onPick} disabled={disabled}>
              Pick for date
              <span className="ml-2 inline-block">→</span>
            </PrimaryButton>
          )}
        </div>
      </motion.div>
    </motion.aside>
  );
}

function ModalCloseButton({
  onClose,
  label,
  sfx,
}: {
  onClose: () => void;
  label: string;
  sfx?: SfxCue;
}) {
  return (
    <button
      type="button"
      data-sfx={sfx}
      onClick={onClose}
      aria-label={label}
      className="absolute right-4 top-4 z-10 grid size-8 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
        <path
          d="M3 3L13 13M13 3L3 13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

function DossierBlock({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function SelectionBar({
  selectedMembers,
  disabled,
  onContinue,
}: {
  selectedMembers: Member[];
  disabled: boolean;
  onContinue: () => void;
}) {
  const hasClosedMember = selectedMembers.some((member) => !isMemberRetained(member));
  const statusLabel = hasClosedMember
    ? "closed file selected"
    : selectedMembers.length === 2
      ? "focus and partner"
      : "focus selected";

  return (
    <AnimatePresence>
      {selectedMembers.length > 0 ? (
        <motion.div
          key="selection-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
          className="pointer-events-none fixed inset-x-0 bottom-6 z-30 px-6 lg:bottom-8"
        >
          <div className="aura-glass-strong pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-between gap-6 rounded-pill px-3 py-2.5 pl-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="rounded-full border-2 border-white/90 bg-white shadow-sm"
                  >
                    <Portrait member={member} variant="thumb" />
                  </span>
                ))}
              </div>
              <div className="leading-tight">
                <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
                  {statusLabel}
                </p>
                <p className="text-body font-semibold text-aura-ink">
                  {selectedMembers.length === 2
                    ? `${selectedMembers[0].firstName} and ${selectedMembers[1].firstName}`
                    : `${selectedMembers[0].firstName}, awaiting partner`}
                </p>
              </div>
            </div>
            <PrimaryButton disabled={disabled} onClick={onContinue}>
              Continue to brief
              <span className="ml-2 inline-block">→</span>
            </PrimaryButton>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ================================================================== */
/* Brief                                                              */
/* ================================================================== */

export type PreviousFile = {
  totalDates: number;
  scenarioRepeatCount: number;
  expectsCallbacks: boolean;
};

export type BriefProps = {
  shift: ShiftState;
  selectedMembers: Member[];
  scenarios: DateScenario[];
  selectedScenario: DateScenario | undefined;
  pairState: PairState | null;
  pairNote: string | null;
  previousFile: PreviousFile | null;
  fitSignal: MatchFitPublicSignal | null;
  riskNotes: string[];
  goals: CompanyGoal[];
  goalProgress: GoalProgressSnapshot[];
  requests: MemberRequest[];
  members: Member[];
  canStart: boolean;
  localAiStatus: LocalAiBriefStatus;
  isActionPending: boolean;
  deckPowerAvailability: ScenarioPowerAvailability;
  carriedHeldScenario: DateScenario | undefined;
  onSelectScenario: (id: string) => void;
  onStart: () => void;
  onRetryLocalAi: () => void;
  onBack: () => void;
  onHoldScenario: (scenarioId: string) => void;
  onDiscardScenario: (scenarioId: string) => void;
  onRequestLowPressure: (scenarioId: string) => void;
};

export type LocalAiBriefStatus = {
  status: "checking" | "ready" | "unavailable";
  message: string;
};

const RISK_CHIP: Record<
  DateScenario["card"]["risk"],
  { bg: string; text: string; ring: string; dot: string }
> = {
  high: {
    bg: "bg-aura-rose/10",
    text: "text-aura-rose",
    ring: "ring-aura-rose/30",
    dot: "bg-aura-rose",
  },
  medium: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    ring: "ring-amber-500/30",
    dot: "bg-amber-500",
  },
  low: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
};

export function BriefView({
  shift,
  selectedMembers,
  scenarios,
  selectedScenario,
  pairState,
  pairNote,
  previousFile,
  fitSignal,
  riskNotes,
  goals,
  goalProgress,
  requests,
  members,
  canStart,
  localAiStatus,
  isActionPending,
  deckPowerAvailability,
  carriedHeldScenario,
  onSelectScenario,
  onStart,
  onRetryLocalAi,
  onBack,
  onHoldScenario,
  onDiscardScenario,
  onRequestLowPressure,
}: BriefProps) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  if (selectedMembers.length !== 2) {
    return (
      <ViewFrame wide>
        <EmptyState
          eyebrow={`// brief.${pad2(shift.shiftNumber)}`}
          title="Pick a pair first"
          subhead="The brief assembles itself once Cupid has two members on file. Return to the roster."
          action={<PrimaryButton onClick={onBack}>← Back to roster</PrimaryButton>}
        />
      </ViewFrame>
    );
  }

  const [first, second] = selectedMembers;
  const openMember =
    openMemberId === null ? null : (members.find((m) => m.id === openMemberId) ?? null);
  const openMemberRequest =
    openMember === null
      ? undefined
      : requests.find((entry) => entry.id === openMember.state.currentRequestId);

  return (
    <ViewFrame wide>
      <BriefHeader
        shiftNumber={shift.shiftNumber}
        scenarioCount={scenarios.length}
        dateSlotsUsed={shift.dateSlotsUsed}
        dateSlotsTotal={shift.dateSlotsTotal}
      />

      <Hairline className="mt-8" />

      <section className="mt-12">
        <PairStage
          first={first}
          second={second}
          pairState={pairState}
          note={pairNote}
          previousFile={previousFile}
          onMemberClick={setOpenMemberId}
        />
      </section>

      <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <ScenarioDeck
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            onSelect={onSelectScenario}
            carriedHeldScenarioId={carriedHeldScenario?.id}
          />

          <DeckPowersPanel
            shift={shift}
            selectedScenario={selectedScenario}
            availability={deckPowerAvailability}
            carriedHeldScenario={carriedHeldScenario}
            isActionPending={isActionPending}
            onHold={onHoldScenario}
            onDiscard={onDiscardScenario}
            onRequestLowPressure={onRequestLowPressure}
          />
        </div>

        <aside className="space-y-6">
          <PinnedGoalsCard goals={goals} progress={goalProgress} />
        </aside>
      </div>

      <BriefDock
        selectedScenario={selectedScenario}
        fitSignal={fitSignal}
        riskNotes={riskNotes}
        canStart={canStart}
        localAiStatus={localAiStatus}
        isActionPending={isActionPending}
        onStart={onStart}
        onRetryLocalAi={onRetryLocalAi}
      />

      <AnimatePresence>
        {openMember === null ? null : (
          <MemberDossier
            key={`brief-dossier-${openMember.id}`}
            member={openMember}
            request={openMemberRequest}
            isSelected={selectedMembers.some((m) => m.id === openMember.id)}
            disabled={false}
            onClose={() => setOpenMemberId(null)}
          />
        )}
      </AnimatePresence>
    </ViewFrame>
  );
}

function BriefHeader({
  shiftNumber,
  scenarioCount,
  dateSlotsUsed,
  dateSlotsTotal,
}: {
  shiftNumber: number;
  scenarioCount: number;
  dateSlotsUsed: number;
  dateSlotsTotal: number;
}) {
  return (
    <header className="max-w-2xl space-y-3">
      <Eyebrow>{`// brief.${pad2(shiftNumber)}`}</Eyebrow>
      <h1 className="font-display text-display-lg font-semibold leading-[0.95] tracking-tight text-aura-ink">
        Tonight&rsquo;s brief
      </h1>
      <p className="max-w-xl text-body text-aura-muted">
        {dateSlotsUsed} / {dateSlotsTotal} reservations assigned. {scenarioCount} rooms on the desk.
        Cupid will not begin without paperwork.
      </p>
    </header>
  );
}

function BriefDock({
  selectedScenario,
  fitSignal,
  riskNotes,
  canStart,
  localAiStatus,
  isActionPending,
  onStart,
  onRetryLocalAi,
}: {
  selectedScenario: DateScenario | undefined;
  fitSignal: MatchFitPublicSignal | null;
  riskNotes: string[];
  canStart: boolean;
  localAiStatus: LocalAiBriefStatus;
  isActionPending: boolean;
  onStart: () => void;
  onRetryLocalAi: () => void;
}) {
  const localAiBlocksStart = localAiStatus.status !== "ready";
  const statusLabel = localAiBlocksStart
    ? localAiStatus.status === "checking"
      ? "ai check"
      : "ai blocked"
    : selectedScenario === undefined
      ? "no reservation"
      : "reservation locked";
  const statusText = localAiBlocksStart
    ? localAiStatus.message
    : selectedScenario === undefined
      ? "Pick a venue. Cupid will not begin without one."
      : selectedScenario.title;
  const buttonLabel = isActionPending
    ? "Booking the table..."
    : localAiStatus.status === "checking"
      ? "Checking AI"
      : "Begin date";
  const dotTone = localAiStatus.status === "ready" ? "rose" : "amber";
  const fallbackRiskNote = briefRiskNote(fitSignal);
  const dockRiskNotes =
    riskNotes.length > 0
      ? riskNotes.slice(0, 2)
      : fallbackRiskNote === null
        ? []
        : [fallbackRiskNote];

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 px-6 lg:bottom-8"
    >
      <div className="aura-glass-strong pointer-events-auto mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-card px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <LiveDot tone={dotTone} />
          <div className="min-w-0 leading-tight">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
              {statusLabel}
            </p>
            <p className="truncate text-body font-semibold text-aura-ink">{statusText}</p>
            {dockRiskNotes.length === 0 ? null : (
              <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
                why this is dangerous
              </p>
            )}
            {dockRiskNotes.map((note) => (
              <p key={note} className="mt-1 max-w-md text-label leading-snug text-aura-muted">
                {note}
              </p>
            ))}
          </div>
        </div>
        <FitSignalStrip signal={fitSignal} />
        <div className="flex shrink-0 items-center gap-2">
          {localAiStatus.status === "unavailable" ? (
            <GhostButton disabled={isActionPending} onClick={onRetryLocalAi}>
              Retry AI
            </GhostButton>
          ) : null}
          <PrimaryButton disabled={!canStart} onClick={onStart}>
            {buttonLabel}
            <span className="ml-2 inline-block">→</span>
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}

function briefRiskNote(signal: MatchFitPublicSignal | null): string | null {
  if (signal === null) {
    return null;
  }

  if (signal.askSignal === "blocked") {
    return "Ask blocked. Expect strain or an early report.";
  }

  if (signal.fitLevel === "risky") {
    return "Risky fit. Watch the first exchange closely.";
  }

  if (signal.pressureLevel === "high") {
    return "High pressure room. Good pairs can still file bruises.";
  }

  return null;
}

const FIT_SIGNAL_LABELS: Record<MatchFitPublicSignal["fitLevel"], string> = {
  strong: "strong",
  neutral: "neutral",
  risky: "risky",
};

const PRESSURE_SIGNAL_LABELS: Record<MatchFitPublicSignal["pressureLevel"], string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

const ASK_SIGNAL_LABELS: Record<MatchFitPublicSignal["askSignal"], string> = {
  covered: "covered",
  uncertain: "unclear",
  blocked: "blocked",
  none: "none",
};

function FitSignalStrip({ signal }: { signal: MatchFitPublicSignal | null }) {
  if (signal === null) {
    return null;
  }

  return (
    <ul className="flex flex-wrap items-center gap-2">
      <FitSignalPill
        label="fit"
        value={FIT_SIGNAL_LABELS[signal.fitLevel]}
        tone={signal.fitLevel}
      />
      <FitSignalPill
        label="pressure"
        value={PRESSURE_SIGNAL_LABELS[signal.pressureLevel]}
        tone={signal.pressureLevel}
      />
      <FitSignalPill
        label="ask"
        value={ASK_SIGNAL_LABELS[signal.askSignal]}
        tone={signal.askSignal}
      />
    </ul>
  );
}

function FitSignalPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone:
    | MatchFitPublicSignal["fitLevel"]
    | MatchFitPublicSignal["pressureLevel"]
    | MatchFitPublicSignal["askSignal"];
}) {
  const toneClass =
    tone === "strong" || tone === "low" || tone === "covered"
      ? "text-emerald-700"
      : tone === "risky" || tone === "high" || tone === "blocked"
        ? "text-aura-rose"
        : "text-aura-muted";

  return (
    <li className="rounded-pill bg-white/65 px-2.5 py-1 ring-1 ring-aura-hairline">
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-aura-faint">
        {label}{" "}
      </span>
      <span className={`font-mono text-xs font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
        {value}
      </span>
    </li>
  );
}

function PairStage({
  first,
  second,
  pairState,
  note,
  previousFile,
  onMemberClick,
}: {
  first: Member;
  second: Member;
  pairState: PairState | null;
  note: string | null;
  previousFile: PreviousFile | null;
  onMemberClick: (memberId: string) => void;
}) {
  return (
    <div className="relative">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-10">
        <ClickablePairMember member={first} align="end" onClick={() => onMemberClick(first.id)} />
        <PairBond />
        <ClickablePairMember
          member={second}
          align="start"
          onClick={() => onMemberClick(second.id)}
        />
      </div>

      {note === null ? null : (
        <p className="mx-auto mt-10 max-w-xl text-center aura-accent text-2xl leading-snug text-aura-muted">
          &ldquo;{note}&rdquo;
        </p>
      )}

      <PreviousFileLine previousFile={previousFile} />

      {pairState === null ? null : (
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-8">
          <Meter label="Spark" value={pairState.stats.spark} />
          <Meter label="Strain" value={pairState.stats.strain} tone="amber" />
          <Meter label="Health" value={pairState.stats.relationshipHealth} tone="emerald" />
        </div>
      )}
    </div>
  );
}

function PreviousFileLine({ previousFile }: { previousFile: PreviousFile | null }) {
  if (previousFile === null) {
    return null;
  }
  const segments: { tone: "ink" | "rose"; text: string }[] = [
    {
      tone: "ink",
      text:
        previousFile.totalDates === 1
          ? "1 date on record"
          : `${previousFile.totalDates} dates on record`,
    },
  ];
  if (previousFile.scenarioRepeatCount > 0) {
    segments.push({
      tone: "ink",
      text: `${ordinal(previousFile.scenarioRepeatCount + 1)} visit to this room`,
    });
  }
  if (previousFile.expectsCallbacks) {
    segments.push({ tone: "rose", text: "Cupid expects callbacks" });
  }
  return (
    <p className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-mono text-micro font-semibold uppercase tracking-[0.22em]">
      <span className="text-aura-muted">Previous file</span>
      {segments.flatMap((segment, index) => [
        <span aria-hidden key={`sep-${index}`} className="text-aura-faint/60">
          ·
        </span>,
        <span
          key={`seg-${index}`}
          className={segment.tone === "rose" ? "text-aura-rose" : "text-aura-ink"}
        >
          {segment.text}
        </span>,
      ])}
    </p>
  );
}

function ordinal(value: number): string {
  const remainder100 = value % 100;
  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${value}th`;
  }
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function PairBond() {
  return (
    <div aria-hidden className="flex h-44 items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="block h-px w-12 bg-gradient-to-r from-transparent via-aura-rose/35 to-aura-rose/65 sm:w-16" />
        <span className="relative flex size-12 items-center justify-center">
          <span className="absolute -inset-3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.38),rgba(217,70,239,0.22)_55%,transparent_75%)] blur-md" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet shadow-quiet" />
          <span className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white via-rose-50/70 to-white/90" />
          <svg viewBox="0 0 24 24" fill="none" className="relative size-[22px]" aria-hidden>
            <defs>
              <linearGradient id="pair-bond-sparkle" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="55%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path
              d="M12 2 C 12.6 9.4 14.6 11.4 22 12 C 14.6 12.6 12.6 14.6 12 22 C 11.4 14.6 9.4 12.6 2 12 C 9.4 11.4 11.4 9.4 12 2 Z"
              fill="url(#pair-bond-sparkle)"
            />
          </svg>
        </span>
        <span className="block h-px w-12 bg-gradient-to-r from-aura-rose/65 via-aura-rose/35 to-transparent sm:w-16" />
      </div>
    </div>
  );
}

function ClickablePairMember({
  member,
  align,
  onClick,
}: {
  member: Member;
  align: "start" | "end";
  onClick: () => void;
}) {
  const itemsAlign = align === "end" ? "sm:items-end" : "sm:items-start";
  const textAlign = align === "end" ? "sm:text-right" : "sm:text-left";
  const hasQuit = !isMemberRetained(member);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${member.firstName} dossier`}
      className={`group relative flex cursor-pointer flex-col items-center gap-4 rounded-card p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/40 ${itemsAlign}`}
    >
      <span className="relative inline-block">
        <span
          aria-hidden
          className="absolute -inset-3 rounded-full bg-gradient-to-br from-aura-rose/0 via-aura-fuchsia/0 to-aura-violet/0 opacity-0 blur-md transition-all duration-300 group-hover:from-aura-rose/30 group-hover:via-aura-fuchsia/30 group-hover:to-aura-violet/30 group-hover:opacity-100"
        />
        <span className="relative inline-block transition-transform duration-300 group-hover:-translate-y-0.5">
          <Portrait member={member} variant="stage" />
        </span>
        {hasQuit ? <QuitMemberMark /> : null}
        <span
          aria-hidden
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-pill bg-aura-ink/85 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.2em] text-white/85 opacity-0 shadow-quiet transition-opacity duration-200 group-hover:opacity-100"
        >
          open dossier
        </span>
      </span>
      <span
        className={`text-center font-display text-display-md font-semibold tracking-tight text-aura-ink ${textAlign}`}
      >
        {member.firstName}
      </span>
    </button>
  );
}

function ScenarioDeck({
  scenarios,
  selectedScenario,
  carriedHeldScenarioId,
  onSelect,
}: {
  scenarios: DateScenario[];
  selectedScenario: DateScenario | undefined;
  carriedHeldScenarioId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const indexInDeck =
    selectedScenario === undefined
      ? -1
      : scenarios.findIndex((scenario) => scenario.id === selectedScenario.id);

  return (
    <section className="space-y-5">
      <header className="flex items-baseline justify-between gap-4">
        <Eyebrow>// scenario deck</Eyebrow>
        <MutedLabel>{`${pad2(scenarios.length)} drawn`}</MutedLabel>
      </header>
      <ul className="grid gap-3 sm:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <ScenarioDeckTab
            key={scenario.id}
            scenario={scenario}
            index={index}
            total={scenarios.length}
            isSelected={scenario.id === selectedScenario?.id}
            isHeldOver={scenario.id === carriedHeldScenarioId}
            onSelect={() => onSelect(scenario.id)}
          />
        ))}
      </ul>
      <FeaturedScenarioCard
        scenario={selectedScenario}
        indexInDeck={indexInDeck}
        totalScenarios={scenarios.length}
      />
    </section>
  );
}

function ScenarioDeckTab({
  scenario,
  index,
  total,
  isSelected,
  isHeldOver,
  onSelect,
}: {
  scenario: DateScenario;
  index: number;
  total: number;
  isSelected: boolean;
  isHeldOver: boolean;
  onSelect: () => void;
}) {
  const indexLabel = `${pad2(index + 1)}/${pad2(total)}`;
  const chip = RISK_CHIP[scenario.card.risk];
  return (
    <li className="list-none">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className={`group relative flex h-full w-full cursor-pointer flex-col gap-3 rounded-card px-4 py-4 text-left transition aura-glass-lift ${
          isSelected ? "aura-glass-ink" : "aura-glass"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-mono text-micro font-semibold uppercase tabular-nums tracking-[0.22em] ${isSelected ? "text-white/55" : "text-aura-faint"}`}
          >
            {indexLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${isSelected ? "text-white/85" : chip.text}`}
          >
            <span className={`size-1.5 rounded-full ${chip.dot}`} />
            {scenario.card.risk}
          </span>
        </div>
        <h4
          className={`font-display text-lead font-semibold leading-snug tracking-tight ${isSelected ? "text-white" : "text-aura-ink"}`}
        >
          {scenario.title}
        </h4>
        {isHeldOver ? (
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${isSelected ? "bg-white/20 text-white/85" : "bg-aura-rose/10 text-aura-rose"}`}
          >
            <span className="size-1.5 rounded-full bg-aura-rose" />
            held over
          </span>
        ) : null}
        {isSelected ? (
          <motion.span
            layoutId="brief-active-deck"
            aria-hidden
            className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-pill bg-gradient-to-r from-aura-rose to-aura-fuchsia"
            transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
          />
        ) : null}
      </button>
    </li>
  );
}

function FeaturedScenarioCard({
  scenario,
  indexInDeck,
  totalScenarios,
}: {
  scenario: DateScenario | undefined;
  indexInDeck: number;
  totalScenarios: number;
}) {
  if (scenario === undefined) {
    return (
      <div className="aura-glass relative grid min-h-72 place-items-center overflow-hidden rounded-card px-8 py-14 text-center">
        <ScenarioCardWatermark />
        <div className="relative space-y-3">
          <Eyebrow>// no reservation</Eyebrow>
          <p className="text-lead text-aura-muted">
            Tap a card above to feature it. Cupid keeps three on the desk at a time.
          </p>
        </div>
      </div>
    );
  }

  const indexLabel = `${pad2(indexInDeck + 1)} / ${pad2(totalScenarios)}`;
  const chip = RISK_CHIP[scenario.card.risk];

  return (
    <motion.article
      key={scenario.id}
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
      className="aura-glass-strong relative overflow-hidden rounded-card shadow-card ring-1 ring-aura-rose/30"
    >
      <ScenarioCardWatermark />
      <div className="relative z-10 px-7 pb-8 pt-7 lg:px-9 lg:pb-10 lg:pt-9">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
            // reservation {indexLabel}
          </span>
          <RiskStamp risk={scenario.card.risk} chip={chip} />
        </div>

        <h2 className="mt-5 font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
          {scenario.title}
        </h2>
        <p className="mt-3 aura-accent text-lead leading-snug text-aura-rose/85">
          {scenario.publicBrief.location}
        </p>
        <p className="mt-4 max-w-2xl text-body leading-relaxed text-aura-ink/85">
          {scenario.publicBrief.premise}
        </p>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {scenario.card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill bg-white/65 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted"
            >
              {tag.replaceAll("_", " ")}
            </span>
          ))}
        </div>

        <div className="mt-7 flex items-center gap-3 border-t border-aura-hairline pt-5">
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-full bg-aura-rose/15 text-aura-rose"
          >
            <svg viewBox="0 0 16 16" className="size-3" fill="none">
              <path
                d="M3 8.4L6.6 12L13 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
            filed for review. confirm at the dock.
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function ScenarioCardWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-12 -right-10 size-56 opacity-[0.06]"
    >
      <svg viewBox="0 0 100 100" className="size-full text-aura-rose" fill="currentColor">
        <path d="M50 8 L60 38 L92 40 L66 60 L74 92 L50 74 L26 92 L34 60 L8 40 L40 38 Z" />
      </svg>
    </div>
  );
}

function RiskStamp({
  risk,
  chip,
}: {
  risk: DateScenario["card"]["risk"];
  chip: { bg: string; text: string; ring: string; dot: string };
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] ring-1 ${chip.bg} ${chip.text} ${chip.ring}`}
    >
      <span className={`size-1.5 rounded-full ${chip.dot}`} />
      {risk} risk
    </span>
  );
}

const DECK_POWER_LABEL: Record<DeckPowerKind, string> = {
  hold: "Held",
  discard: "Discarded",
  request_low_pressure: "Quiet swap",
};

const DECK_POWER_FILED_DESCRIPTION: Record<DeckPowerKind, string> = {
  hold: "Held one room for tomorrow.",
  discard: "Discarded one drawn room.",
  request_low_pressure: "Swapped a high-pressure room for a quiet one.",
};

function DeckPowersPanel({
  shift,
  selectedScenario,
  availability,
  carriedHeldScenario,
  isActionPending,
  onHold,
  onDiscard,
  onRequestLowPressure,
}: {
  shift: ShiftState;
  selectedScenario: DateScenario | undefined;
  availability: ScenarioPowerAvailability;
  carriedHeldScenario: DateScenario | undefined;
  isActionPending: boolean;
  onHold: (scenarioId: string) => void;
  onDiscard: (scenarioId: string) => void;
  onRequestLowPressure: (scenarioId: string) => void;
}) {
  const filed = shift.deckPower;
  const isFiled = filed !== undefined;
  const selectionId = selectedScenario?.id;
  const baseDisabled = isActionPending || isFiled || selectionId === undefined;
  const status = deckPowerStatusDisplay(isFiled, selectionId, availability);
  const fire = (handler: (id: string) => void) => () => {
    if (selectionId !== undefined) {
      handler(selectionId);
    }
  };

  return (
    <section className="aura-glass rounded-card px-5 py-5">
      <header className="flex items-baseline justify-between gap-4">
        <Eyebrow>// procurement levers</Eyebrow>
        <span
          className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${status.tone}`}
        >
          {status.label}
        </span>
      </header>
      <p className="mt-2 max-w-2xl text-label leading-snug text-aura-muted">
        One lever per shift. Pick a card above, then file Cupid&rsquo;s move.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <DeckPowerButton
          label="Hold for tomorrow"
          hint="Reserve this room. It opens the next shift."
          disabled={baseDisabled || !availability.canHold}
          onClick={fire(onHold)}
        />
        <DeckPowerButton
          label="Discard this room"
          hint="Pull the booking from today. The date slot stays open."
          disabled={baseDisabled || !availability.canDiscard}
          onClick={fire(onDiscard)}
        />
        <DeckPowerButton
          label="Request a quiet room"
          hint="Swap a high-pressure card for a low-pressure one."
          disabled={baseDisabled || !availability.canRequestLowPressure}
          onClick={fire(onRequestLowPressure)}
        />
      </div>
      {filed !== undefined ? (
        <DeckPowerFiledLine usage={filed} />
      ) : carriedHeldScenario === undefined ? null : (
        <p className="mt-4 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/80">
          Carried over: {carriedHeldScenario.title}
        </p>
      )}
    </section>
  );
}

function deckPowerStatusDisplay(
  isFiled: boolean,
  selectionId: string | undefined,
  availability: ScenarioPowerAvailability,
): { label: string; tone: string } {
  if (isFiled) {
    return { label: "filed", tone: "text-aura-rose" };
  }
  if (selectionId === undefined) {
    return { label: "pick a card", tone: "text-aura-faint" };
  }
  if (availability.reason === undefined) {
    return { label: "ready", tone: "text-emerald-700" };
  }
  return { label: availability.reason, tone: "text-aura-muted" };
}

function DeckPowerButton({
  label,
  hint,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-full cursor-pointer flex-col items-start gap-1 rounded-chip bg-aura-ink px-3 py-2.5 text-left text-white transition hover:bg-aura-rose disabled:cursor-not-allowed disabled:bg-white/55 disabled:text-aura-faint"
    >
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em]">
        {label}
      </span>
      <span className="text-label leading-snug text-white/75 group-disabled:text-aura-faint">
        {hint}
      </span>
    </button>
  );
}

function DeckPowerFiledLine({ usage }: { usage: DeckPowerUsage }) {
  return (
    <p className="mt-4 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
      <span className="rounded-pill bg-aura-rose/10 px-2 py-0.5">
        {DECK_POWER_LABEL[usage.kind]}
      </span>
      <span className="ml-2 text-aura-muted">{DECK_POWER_FILED_DESCRIPTION[usage.kind]}</span>
    </p>
  );
}

function PinnedGoalsCard({
  goals,
  progress,
}: {
  goals: CompanyGoal[];
  progress: GoalProgressSnapshot[];
}) {
  return (
    <PinnedCard eyebrow="// goals" title="Pinned goals" count={goals.length}>
      <ul className="space-y-2.5">
        {goals.map((goal) => {
          const snapshot =
            progress.find((entry) => entry.goalId === goal.id) ?? fallbackGoalProgress(goal);
          const status = snapshot.status;
          const tone =
            status === "missed"
              ? "bg-aura-rose/10 text-aura-rose"
              : status === "met"
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-white/65 text-aura-faint";
          return (
            <li key={goal.id} className="flex items-start gap-3">
              <span
                className={`inline-flex h-5 shrink-0 items-center rounded-pill px-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${tone}`}
              >
                {status}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label leading-snug text-aura-ink/85">{goal.title}</p>
                <p className="mt-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
                  {snapshot.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </PinnedCard>
  );
}

function PinnedCard({
  eyebrow,
  title,
  count,
  defaultOpen = true,
  children,
}: {
  eyebrow: string;
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="relative">
      <PinHead />
      <div className="aura-glass overflow-hidden rounded-card">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="group flex w-full cursor-pointer items-start justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="space-y-1.5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h3 className="font-display text-lead font-semibold leading-tight tracking-tight text-aura-ink">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <span className="font-mono text-micro font-semibold uppercase tabular-nums tracking-[0.22em] text-aura-faint">
              {pad2(count)}
            </span>
            <ChevronToggle open={open} />
          </div>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
              className="overflow-hidden"
            >
              <div className="border-t border-aura-hairline px-5 py-4">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function PinHead() {
  return (
    <span
      aria-hidden
      className="absolute -top-1.5 left-7 z-10 grid size-3.5 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-rose shadow-[0_3px_8px_rgba(244,63,94,0.45)] ring-2 ring-white/85"
    >
      <span className="size-1 rounded-full bg-white/90" />
    </span>
  );
}

function ChevronToggle({ open }: { open: boolean }) {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-white/55 text-aura-muted transition group-hover:bg-white group-hover:text-aura-ink">
      <svg
        viewBox="0 0 16 16"
        className={`size-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        fill="none"
        aria-hidden
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* ================================================================== */
/* Date                                                               */
/* ================================================================== */

export type DateProps = {
  session: DateSession;
  scenario: DateScenario | undefined;
  members: Member[];
  interventionText: string;
  interventionTargetMemberId: string;
  canAdvance: boolean;
  canIntervene: boolean;
  isActionPending: boolean;
  pendingDateAction: PendingDateAction | null;
  streamingDrafts: StreamingDraftMessage[];
  onInterventionTextChange: (text: string) => void;
  onInterventionTargetChange: (memberId: string) => void;
  onAdvance: (turnCount: 1 | 2) => void;
  onComplete: () => void;
  onCancel: () => void;
  onIntervene: () => void;
  onFollowUp: (action: FollowUpAction) => void;
  onPickEvents: (eventIds: string[]) => void;
  onTriggerEvent: (eventId: string) => void;
  onTogglePlayback: (next: "playing" | "paused") => void;
  onBack: () => void;
};

export type StreamingDraftMessage = {
  id: string;
  speakerId: string;
  speakerName: string;
  sequenceIndex: number;
  turnIndex: number;
  text: string;
  reasoningText: string;
  status: "streaming" | "done";
};

export function DateView({
  session,
  scenario,
  members,
  interventionText,
  interventionTargetMemberId,
  canAdvance,
  canIntervene,
  isActionPending,
  pendingDateAction,
  streamingDrafts,
  onInterventionTextChange,
  onInterventionTargetChange,
  onAdvance,
  onComplete,
  onCancel,
  onIntervene,
  onFollowUp,
  onPickEvents,
  onTriggerEvent,
  onTogglePlayback,
  onBack,
}: DateProps) {
  const transcript = buildTranscriptItems(session, members, scenario, streamingDrafts);
  const displayedCurrentTurn = Math.max(
    session.currentTurn,
    ...streamingDrafts.map((draft) => draft.turnIndex),
  );
  const participants = useMemo(
    () =>
      session.participants
        .map((id) => members.find((m) => m.id === id))
        .filter((m): m is Member => Boolean(m)),
    [session.participants, members],
  );
  const [leftMember, rightMember] = participants;
  const reactionSignals = useMemo(
    () =>
      leftMember === undefined || rightMember === undefined
        ? []
        : buildReactionSignals(session.judgeSnapshots, leftMember.id, rightMember.id),
    [session.judgeSnapshots, leftMember, rightMember],
  );
  const nudgeSuggestions = useMemo(
    () => buildNudgeSuggestions(session.judgeSnapshots),
    [session.judgeSnapshots],
  );
  const latestJudge = session.judgeSnapshots.at(-1);
  const leftMood =
    leftMember === undefined ? "neutral" : selectPortraitMood(leftMember.id, latestJudge);
  const rightMood =
    rightMember === undefined ? "neutral" : selectPortraitMood(rightMember.id, latestJudge);
  const leftSpeaking = leftMember !== undefined && isMemberSpeaking(leftMember.id, streamingDrafts);
  const rightSpeaking =
    rightMember !== undefined && isMemberSpeaking(rightMember.id, streamingDrafts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className="relative w-full"
    >
      {leftMember !== undefined && rightMember !== undefined ? (
        <DateStandeeFrame
          leftMember={leftMember}
          rightMember={rightMember}
          leftMood={leftMood}
          rightMood={rightMood}
          leftSpeaking={leftSpeaking}
          rightSpeaking={rightSpeaking}
          listening={pendingDateAction === "advanceExchange"}
          reactions={reactionSignals}
        />
      ) : null}

      <DateHeader
        scenario={scenario}
        session={session}
        participants={participants}
        onBack={onBack}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-6 pb-40 lg:px-10 lg:pb-44">
        {session.playbackState === "drafting" && scenario !== undefined ? (
          <DraftScreen
            scenario={scenario}
            session={session}
            isActionPending={isActionPending}
            onPickEvents={onPickEvents}
          />
        ) : (
          <ChatStream
            items={transcript}
            session={session}
            leftMemberId={leftMember?.id}
            pendingDateAction={pendingDateAction}
          />
        )}

        {session.finalReport === undefined ? null : (
          <FinalReportPanel
            report={session.finalReport}
            session={session}
            isActionPending={isActionPending}
            onFollowUp={onFollowUp}
          />
        )}
      </div>

      {session.status === "active" && session.playbackState !== "drafting" ? (
        <DateFooter
          session={session}
          scenario={scenario}
          interventionText={interventionText}
          interventionTargetMemberId={interventionTargetMemberId}
          participants={participants}
          displayedCurrentTurn={displayedCurrentTurn}
          canAdvance={canAdvance}
          canIntervene={canIntervene}
          pendingDateAction={pendingDateAction}
          nudgeSuggestions={nudgeSuggestions}
          onInterventionTextChange={onInterventionTextChange}
          onInterventionTargetChange={onInterventionTargetChange}
          onAdvance={onAdvance}
          onComplete={onComplete}
          onCancel={onCancel}
          onIntervene={onIntervene}
          onTriggerEvent={onTriggerEvent}
          onTogglePlayback={onTogglePlayback}
        />
      ) : null}
    </motion.div>
  );
}

const STATUS_TONE_TEXT = {
  rose: "text-aura-rose",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
} as const;

function DateHeader({
  scenario,
  session,
  participants,
  onBack,
}: {
  scenario: DateScenario | undefined;
  session: DateSession;
  participants: Member[];
  onBack: () => void;
}) {
  const statusLabel =
    session.status === "ended_early"
      ? "ended early"
      : session.status === "completed"
        ? "wrapped"
        : session.playbackState === "drafting"
          ? "drafting"
          : session.playbackState === "playing"
            ? "live"
            : "paused";
  const statusTone: keyof typeof STATUS_TONE_TEXT =
    session.status === "ended_early"
      ? "amber"
      : session.status === "completed"
        ? "emerald"
        : session.playbackState === "playing"
          ? "rose"
          : "amber";
  const isDrafting = session.playbackState === "drafting";
  const positionClass = isDrafting ? "relative mb-6" : "sticky top-24 mb-2 lg:top-28 lg:mb-3";
  const memberLine = participants.map((m) => m.firstName).join(" / ");
  const locationLine = scenario?.publicBrief.location;

  return (
    <header
      data-date-header
      className={`${positionClass} z-20 border-b border-aura-hairline bg-aura-bg/72 backdrop-blur-xl`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-2.5 lg:gap-5 lg:px-10">
        <button
          type="button"
          data-sfx="click"
          onClick={onBack}
          aria-label="Back to brief"
          title="Back to brief"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path
              d="M9.5 3 L4.5 8 L9.5 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span aria-hidden className="hidden h-5 w-px bg-aura-hairline lg:inline-block" />
        <div className="flex min-w-0 flex-1 items-baseline gap-3 lg:gap-4">
          <span className="shrink-0 font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // {pad2(session.currentTurn)}
          </span>
          <h1 className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-aura-ink lg:text-lead">
            {scenario?.title ?? "Date in session"}
          </h1>
          <span aria-hidden className="hidden h-3 w-px bg-aura-hairline lg:inline-block" />
          <p className="hidden min-w-0 truncate font-mono text-micro uppercase tracking-[0.24em] text-aura-faint lg:block">
            {memberLine}
            {locationLine === undefined ? "" : ` / ${locationLine}`}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.24em]">
          <LiveDot tone={statusTone} />
          <span className={STATUS_TONE_TEXT[statusTone]}>{statusLabel}</span>
        </span>
      </div>
    </header>
  );
}

type TranscriptItem = {
  id: string;
  order: number;
  label: string;
  text: string;
  tone: "member" | "scenario" | "cupid" | "system" | "judge";
  member?: Member;
  targetName?: string;
  isDraft?: boolean;
  isStreaming?: boolean;
};

function DateStandeeFrame({
  leftMember,
  rightMember,
  leftMood,
  rightMood,
  leftSpeaking,
  rightSpeaking,
  listening,
  reactions,
}: {
  leftMember: Member;
  rightMember: Member;
  leftMood: PortraitMood;
  rightMood: PortraitMood;
  leftSpeaking: boolean;
  rightSpeaking: boolean;
  listening: boolean;
  reactions: ReactionSignal[];
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden xl:block">
      <div className="relative mx-auto h-full w-full max-w-2xl">
        <DaterStandee
          member={leftMember}
          placement="bottom-left"
          mood={leftMood}
          speaking={leftSpeaking}
          listening={listening && !rightSpeaking}
          reactions={reactions.filter((reaction) => reaction.side === "left")}
          className="absolute bottom-0 right-full mr-3 h-[78vh] w-56 2xl:mr-8 2xl:w-72"
        />
        <DaterStandee
          member={rightMember}
          placement="top-right"
          mood={rightMood}
          speaking={rightSpeaking}
          listening={listening && !leftSpeaking}
          reactions={reactions.filter((reaction) => reaction.side === "right")}
          className="absolute top-40 left-full ml-3 h-[72vh] w-56 lg:top-44 2xl:ml-8 2xl:w-72"
        />
      </div>
    </div>
  );
}

type ChatStreamAnimation = {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease: typeof EASE_OUT_QUART; delay: number };
};

function ChatStream({
  items,
  session,
  leftMemberId,
  pendingDateAction,
}: {
  items: TranscriptItem[];
  session: DateSession;
  leftMemberId: string | undefined;
  pendingDateAction: PendingDateAction | null;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const tailRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const previousItemCountRef = useRef(items.length);
  const latestText = items.at(-1)?.text ?? "";

  useEffect(() => {
    const itemCountIncreased = items.length > previousItemCountRef.current;
    previousItemCountRef.current = items.length;
    const behavior: ScrollBehavior = itemCountIncreased ? "smooth" : "auto";
    const resolveStickyEl = (current: HTMLElement | null, selector: string): HTMLElement | null => {
      if (current !== null && document.contains(current)) {
        return current;
      }
      return document.querySelector<HTMLElement>(selector);
    };
    const scroll = () => {
      headerRef.current = resolveStickyEl(headerRef.current, "[data-date-header]");
      footerRef.current = resolveStickyEl(footerRef.current, "[data-date-footer]");
      scrollLatestTranscriptItemIntoClearance(
        listRef.current,
        tailRef.current,
        headerRef.current,
        footerRef.current,
        behavior,
      );
    };
    const animationFrame = window.requestAnimationFrame(scroll);
    const retryTimeout = itemCountIncreased === true ? window.setTimeout(scroll, 180) : undefined;

    return () => {
      window.cancelAnimationFrame(animationFrame);

      if (retryTimeout !== undefined) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, [items.length, latestText]);

  const statusCue =
    session.status === "active" ? <DateStatusCue pendingDateAction={pendingDateAction} /> : null;

  if (items.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // awaiting first exchange
        </p>
        <p className="max-w-sm text-label text-aura-muted">
          Cupid does not record silence. Advance the exchange to begin the transcript.
        </p>
        {statusCue === null ? null : <div className="mt-3">{statusCue}</div>}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ol ref={listRef} className="space-y-4">
        {items.map((item, index) => {
          const previous = items[index - 1];
          return (
            <ChatStreamItem
              key={item.id}
              item={item}
              previous={previous}
              index={index}
              leftMemberId={leftMemberId}
            />
          );
        })}
      </ol>

      {statusCue === null ? null : (
        <div ref={tailRef} className="mt-5 flex justify-start">
          {statusCue}
        </div>
      )}
    </div>
  );
}

function scrollLatestTranscriptItemIntoClearance(
  listElement: HTMLOListElement | null,
  tailElement: HTMLDivElement | null,
  headerElement: HTMLElement | null,
  footerElement: HTMLElement | null,
  behavior: ScrollBehavior,
): void {
  const latestItem = listElement?.lastElementChild;

  if (!(latestItem instanceof HTMLElement)) {
    return;
  }

  const headerBottom = headerElement?.getBoundingClientRect().bottom ?? 0;
  const footerTop = footerElement?.getBoundingClientRect().top ?? window.innerHeight;
  const topLimit = headerBottom + 16;
  const bottomLimit = footerTop - 20;

  if (bottomLimit <= topLimit) {
    latestItem.scrollIntoView({ behavior, block: "nearest" });
    return;
  }

  const itemRect = latestItem.getBoundingClientRect();
  const tailRect = tailElement?.getBoundingClientRect() ?? itemRect;
  const neededDownScroll = Math.max(0, tailRect.bottom - bottomLimit);
  const allowedDownScroll = Math.max(0, itemRect.top - topLimit);
  const downScroll = Math.min(neededDownScroll, allowedDownScroll);

  if (downScroll > 0) {
    window.scrollBy({ top: downScroll, behavior });
    return;
  }

  if (itemRect.top < topLimit) {
    window.scrollBy({ top: itemRect.top - topLimit, behavior });
  }
}

function ChatStreamItem({
  item,
  previous,
  index,
  leftMemberId,
}: {
  item: TranscriptItem;
  previous: TranscriptItem | undefined;
  index: number;
  leftMemberId: string | undefined;
}) {
  const animation: ChatStreamAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE_OUT_QUART, delay: Math.min(index * 0.04, 0.5) },
  };

  if (item.tone === "member" && item.member !== undefined) {
    const isLeft = item.member.id === leftMemberId;
    const previousIsSameSpeaker =
      previous?.tone === "member" && previous.member?.id === item.member.id;
    return (
      <ChatBubble
        item={item}
        member={item.member}
        side={isLeft ? "left" : "right"}
        showName={!previousIsSameSpeaker}
        tight={previousIsSameSpeaker}
        animation={animation}
      />
    );
  }

  if (item.tone === "scenario") {
    return <NarratorBeat item={item} animation={animation} />;
  }

  if (item.tone === "cupid") {
    return <CupidPin item={item} animation={animation} />;
  }

  if (item.tone === "judge") {
    return <JudgeNote item={item} animation={animation} />;
  }

  return <SystemNote item={item} animation={animation} />;
}

function ChatBubble({
  item,
  member,
  side,
  showName,
  tight,
  animation,
}: {
  item: TranscriptItem;
  member: Member;
  side: "left" | "right";
  showName: boolean;
  tight: boolean;
  animation: ChatStreamAnimation;
}) {
  const isLeft = side === "left";
  const justify = isLeft ? "justify-start" : "justify-end";
  const tightClass = tight ? "!mt-1" : "";
  const itemsAlign = isLeft ? "items-start" : "items-end";
  const nameAlign = isLeft ? "text-left text-aura-faint" : "text-right text-aura-rose/75";
  const bubbleClass = isLeft
    ? "rounded-[22px] rounded-bl-md bg-white/85 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md"
    : "rounded-[22px] rounded-br-md bg-gradient-to-br from-aura-rose to-aura-fuchsia px-4 py-2.5 shadow-cta ring-1 ring-white/30 ring-inset";
  const textColor = isLeft ? "text-aura-ink" : "text-white";
  const caretColor = isLeft ? "bg-aura-rose/70" : "bg-white/85";
  const draftClass = item.isDraft === true ? "opacity-95" : "";

  return (
    <motion.li {...animation} className={`flex ${justify} ${tightClass}`}>
      <div className={`flex max-w-[78%] flex-col gap-1 ${itemsAlign}`}>
        {showName ? (
          <span
            className={`px-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] ${nameAlign}`}
          >
            {member.firstName}
          </span>
        ) : null}
        <div className={`${bubbleClass} ${draftClass}`}>
          <p className={`text-body leading-relaxed ${textColor}`}>
            {item.text}
            {item.isStreaming === true ? (
              <span
                aria-hidden
                className={`ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full ${caretColor}`}
              />
            ) : null}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function NarratorBeat({
  item,
  animation,
}: {
  item: TranscriptItem;
  animation: ChatStreamAnimation;
}) {
  return (
    <motion.li {...animation} className="!my-7">
      <div className="flex flex-col items-center gap-2 px-2 text-center">
        <div className="flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-aura-violet/40 to-transparent" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-violet">
            {item.label}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-aura-violet/40 via-transparent to-transparent" />
        </div>
        <p className="aura-accent max-w-md text-lead leading-snug text-aura-muted">
          &ldquo;{item.text}&rdquo;
        </p>
      </div>
    </motion.li>
  );
}

function CupidPin({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="!my-6 flex justify-center">
      <div className="aura-glass-rose relative max-w-md rounded-card px-5 pt-5 pb-3.5 text-center">
        <span
          aria-hidden
          className="absolute -top-1.5 left-1/2 grid size-3.5 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-rose shadow-[0_3px_8px_rgba(244,63,94,0.45)] ring-2 ring-white/85"
        >
          <span className="size-1 rounded-full bg-white/90" />
        </span>
        <div className="flex items-center justify-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          <span>// {item.label}</span>
          {item.targetName === undefined ? null : (
            <span className="rounded-full bg-aura-rose/15 px-2 py-0.5 tracking-[0.24em] text-aura-rose">
              → {item.targetName}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-label leading-snug text-aura-ink/85">{item.text}</p>
      </div>
    </motion.li>
  );
}

function JudgeNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="flex justify-center">
      <div className="max-w-md rounded-tile bg-emerald-50/80 px-3.5 py-2 ring-1 ring-emerald-500/20">
        <p className="text-center font-mono text-micro font-semibold uppercase tracking-[0.24em] text-emerald-700">
          {item.label}
        </p>
        <p className="mt-0.5 text-center text-label leading-snug text-emerald-900/80">
          {item.text}
        </p>
      </div>
    </motion.li>
  );
}

function SystemNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="flex justify-center">
      <p className="max-w-md text-center font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        {item.text}
      </p>
    </motion.li>
  );
}

function DateStatusCue({ pendingDateAction }: { pendingDateAction: PendingDateAction | null }) {
  if (pendingDateAction === null) {
    return (
      <CupidStatusPill
        label="Next exchange ready"
        leading={<span aria-hidden className="size-1.5 rounded-full bg-aura-emerald" />}
      />
    );
  }

  const label = pendingDateAction === "completeDate" ? "Resolving date" : "Cupid is listening";

  return (
    <CupidStatusPill
      label={label}
      leading={
        <span aria-hidden className="flex items-center gap-1">
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/55 [animation-delay:0ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/65 [animation-delay:180ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/75 [animation-delay:360ms]" />
        </span>
      }
    />
  );
}

function CupidStatusPill({ label, leading }: { label: string; leading: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-[22px] rounded-bl-md bg-white/70 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md">
      {leading}
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
    </div>
  );
}

function FinalReportPanel({
  report,
  session,
  isActionPending,
  onFollowUp,
}: {
  report: DateFinalReport;
  session: DateSession;
  isActionPending: boolean;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  const followUpKeys = Object.keys(FOLLOW_UP_LABELS) as FollowUpAction[];
  const sentimentBadge = describeEndSentiment(session);
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      className="mt-10 border-t border-aura-hairline pt-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Eyebrow>// final report</Eyebrow>
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] ${sentimentBadge.tone}`}
        >
          <span aria-hidden className={`size-1.5 rounded-full ${sentimentBadge.dot}`} />
          {sentimentBadge.label}
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-lead text-aura-ink">{report.summary}</p>
      <p className="mt-2 max-w-2xl text-label text-aura-muted">{report.statSummary}</p>
      <p className="mt-4 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        Recommended follow-up:{" "}
        <span className="text-aura-rose">{FOLLOW_UP_LABELS[report.recommendedFollowUp]}</span>
      </p>
      {report.appliedFollowUp === undefined ? (
        <div className="mt-5 flex flex-wrap gap-x-3 gap-y-5">
          {followUpKeys.map((action) => (
            <div key={action} className="flex max-w-[16rem] flex-col items-start gap-2">
              <GhostButton disabled={isActionPending} onClick={() => onFollowUp(action)}>
                {FOLLOW_UP_LABELS[action]}
              </GhostButton>
              <p className="text-label leading-snug text-aura-muted">
                {FOLLOW_UP_PROJECTIONS[action]}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 font-mono text-micro uppercase tracking-[0.24em] text-emerald-600">
          Filed: {FOLLOW_UP_LABELS[report.appliedFollowUp]}
        </p>
      )}
    </motion.section>
  );
}

function DraftScreen({
  scenario,
  session,
  isActionPending,
  onPickEvents,
}: {
  scenario: DateScenario;
  session: DateSession;
  isActionPending: boolean;
  onPickEvents: (eventIds: string[]) => void;
}) {
  const offered = session.eventDraft.offered;
  const offeredEvents = offered
    .map((id) => findScenarioEventById(scenario, id))
    .filter((event): event is ScenarioEvent => event !== undefined);
  const targetCount = Math.min(EVENT_DRAFT_PICKED, offeredEvents.length);
  const [picks, setPicks] = useState<string[]>([]);
  const canLockIn = picks.length === targetCount;

  function togglePick(eventId: string) {
    setPicks((current) => {
      if (current.includes(eventId)) {
        return current.filter((id) => id !== eventId);
      }

      if (current.length >= targetCount) {
        return current;
      }

      return [...current, eventId];
    });
  }

  return (
    <motion.section
      key="draft-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      className="mt-10"
    >
      <div className="space-y-3 text-center">
        <Eyebrow>// scene draft</Eyebrow>
        <h2 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-ink lg:text-display-lg">
          Pick three <span className="aura-accent text-aura-rose">scene cards</span>
        </h2>
        <p className="mx-auto max-w-md text-label text-aura-muted">
          Cupid drafts six possible turns of fate for {scenario.title}. Choose the three you want to
          drop into this date. The unpicked three sit out.
        </p>
      </div>

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offeredEvents.map((event, index) => {
          const pickIndex = picks.indexOf(event.id);
          const selected = pickIndex >= 0;
          return (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                ease: EASE_OUT_QUART,
                delay: 0.08 + index * 0.05,
              }}
            >
              <button
                type="button"
                data-sfx="click"
                aria-pressed={selected}
                disabled={isActionPending}
                onClick={() => togglePick(event.id)}
                className={`aura-glass-lift flex h-full w-full flex-col gap-3 rounded-card px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? "aura-glass-strong cursor-pointer ring-2 ring-aura-rose/55 shadow-cta"
                    : "aura-glass cursor-pointer shadow-card hover:ring-1 hover:ring-aura-violet/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
                    // scene {pad2(index + 1)}
                  </span>
                  <DraftPickPip selected={selected} pickIndex={pickIndex} />
                </div>
                <h3 className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
                  {event.title}
                </h3>
                <p className="text-label leading-relaxed text-aura-muted">{event.event}</p>
              </button>
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-9 flex flex-col items-center gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          {picks.length} of {targetCount} drafted
        </span>
        <PrimaryButton disabled={!canLockIn || isActionPending} onClick={() => onPickEvents(picks)}>
          {canLockIn ? "Lock the lineup" : `Pick ${targetCount - picks.length} more to begin`}
        </PrimaryButton>
        <p className="max-w-sm text-center text-label text-aura-faint">
          You can drop these three scenes anytime the date is paused. Cupid never auto-fires them.
        </p>
      </div>
    </motion.section>
  );
}

function DraftPickPip({ selected, pickIndex }: { selected: boolean; pickIndex: number }) {
  if (!selected) {
    return (
      <span
        aria-hidden
        className="grid size-5 place-items-center rounded-full border border-dashed border-aura-faint/60 text-aura-faint"
      >
        <span className="size-1.5 rounded-full bg-aura-faint/40" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-5 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet font-mono text-xs font-semibold leading-none text-white shadow-cta"
    >
      {pickIndex + 1}
    </span>
  );
}

const END_SENTIMENT_BADGES: Record<string, { label: string; tone: string; dot: string }> = {
  positive: {
    label: "positive end",
    tone: "bg-emerald-50/85 text-emerald-700 ring-1 ring-emerald-500/30",
    dot: "bg-aura-emerald",
  },
  negative: {
    label: "shut it down",
    tone: "bg-rose-50/85 text-aura-rose ring-1 ring-rose-500/30",
    dot: "bg-aura-rose",
  },
  natural: {
    label: "ran the clock",
    tone: "bg-violet-50/85 text-aura-violet ring-1 ring-violet-500/30",
    dot: "bg-aura-violet",
  },
};

function describeEndSentiment(session: DateSession): {
  label: string;
  tone: string;
  dot: string;
} {
  if (session.status === "completed") {
    if (session.endSentiment === "positive") {
      return END_SENTIMENT_BADGES.positive;
    }

    return END_SENTIMENT_BADGES.natural;
  }

  if (session.status === "ended_early") {
    return session.endSentiment === "positive"
      ? END_SENTIMENT_BADGES.positive
      : END_SENTIMENT_BADGES.negative;
  }

  return END_SENTIMENT_BADGES.natural;
}

function DateFooter({
  session,
  scenario,
  interventionText,
  interventionTargetMemberId,
  participants,
  displayedCurrentTurn,
  canAdvance,
  canIntervene,
  pendingDateAction,
  nudgeSuggestions,
  onInterventionTextChange,
  onInterventionTargetChange,
  onAdvance,
  onComplete,
  onCancel,
  onIntervene,
  onTriggerEvent,
  onTogglePlayback,
}: {
  session: DateSession;
  scenario: DateScenario | undefined;
  interventionText: string;
  interventionTargetMemberId: string;
  participants: Member[];
  displayedCurrentTurn: number;
  canAdvance: boolean;
  canIntervene: boolean;
  pendingDateAction: PendingDateAction | null;
  nudgeSuggestions: string[];
  onInterventionTextChange: (text: string) => void;
  onInterventionTargetChange: (memberId: string) => void;
  onAdvance: (turnCount: 1 | 2) => void;
  onComplete: () => void;
  onCancel: () => void;
  onIntervene: () => void;
  onTriggerEvent: (eventId: string) => void;
  onTogglePlayback: (next: "playing" | "paused") => void;
}) {
  const isPlaying = session.playbackState === "playing";
  const isPaused = session.playbackState === "paused";
  const interventionSlotAvailable = canAddCupidIntervention(session);
  const interventionDisabled = !canAdvance || !interventionSlotAvailable;
  const nudgeButtonEnabled = isPaused && !interventionDisabled;
  const isStreaming = pendingDateAction !== null;
  const playbackBusy = !isPlaying && isStreaming;
  const togglePlayback = () => onTogglePlayback(isPlaying ? "paused" : "playing");
  const nudgesUsed = session.interventions.length;
  const nudgesRemaining = Math.max(0, MAX_NUDGES_PER_DATE - nudgesUsed);
  const picks = session.eventDraft.picked ?? [];
  const dropsEnabled =
    isPaused &&
    canAdvance &&
    scenario !== undefined &&
    picks.some((eventId) => !session.eventsTriggered.includes(eventId));

  const [composerOpen, setComposerOpen] = useState(false);

  // Auto-close the composer if conditions change out from under it.
  useEffect(() => {
    if (composerOpen && !nudgeButtonEnabled) {
      setComposerOpen(false);
    }
  }, [composerOpen, nudgeButtonEnabled]);

  const openComposer = () => {
    if (!nudgeButtonEnabled) return;
    setComposerOpen(true);
  };
  const closeComposer = () => setComposerOpen(false);
  const fileNudge = () => {
    onIntervene();
    setComposerOpen(false);
  };

  // Space bar toggles playback when no input is focused. Director's instinct beats clicking.
  const playbackHandlerRef = useRef<() => void>(() => undefined);
  playbackHandlerRef.current = () => {
    if (playbackBusy) return;
    togglePlayback();
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true
      ) {
        return;
      }
      event.preventDefault();
      playbackHandlerRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <motion.footer
        data-date-footer
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 lg:bottom-6 lg:px-8"
      >
        <div className="aura-glass-strong pointer-events-auto mx-auto flex w-full max-w-5xl items-stretch gap-3 rounded-card px-3 py-2.5 lg:gap-5 lg:px-5 lg:py-3">
          <StatusGauges
            dateHealth={session.dateHealth}
            displayedCurrentTurn={displayedCurrentTurn}
            turnLimit={session.turnLimit}
            judgePasses={session.judgeSnapshots.length}
            nudgesRemaining={nudgesRemaining}
            nudgeButtonEnabled={nudgeButtonEnabled}
            onComposeNudge={openComposer}
            picks={picks}
            eventsTriggered={session.eventsTriggered}
            scenario={scenario}
            dropsEnabled={dropsEnabled}
            onTriggerEvent={onTriggerEvent}
          />
          <span aria-hidden className="hidden w-px self-stretch bg-aura-hairline lg:block" />
          <div className="flex min-w-0 flex-1 items-center">
            {isPaused ? (
              <PausedBanner
                interventionSlotAvailable={interventionSlotAvailable}
                dropsEnabled={dropsEnabled}
              />
            ) : (
              <PlaybackBanner pendingDateAction={pendingDateAction} />
            )}
          </div>
          <span aria-hidden className="w-px self-stretch bg-aura-hairline" />
          <TransportCluster
            isPlaying={isPlaying}
            isPaused={isPaused}
            isStreaming={isStreaming}
            playbackBusy={playbackBusy}
            canAdvance={canAdvance}
            pendingDateAction={pendingDateAction}
            onAdvance={onAdvance}
            onComplete={onComplete}
            onCancel={onCancel}
            onTogglePlayback={togglePlayback}
          />
        </div>
      </motion.footer>
      <AnimatePresence>
        {composerOpen ? (
          <NudgeComposerModal
            key="nudge-composer-modal"
            participants={participants}
            recipientId={interventionTargetMemberId}
            text={interventionText}
            suggestions={nudgeSuggestions}
            nudgesRemaining={nudgesRemaining}
            canIntervene={canIntervene}
            onTextChange={onInterventionTextChange}
            onRecipientChange={onInterventionTargetChange}
            onFile={fileNudge}
            onClose={closeComposer}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: status gauges                                    */
/* ------------------------------------------------------------------ */

function StatusGauges({
  dateHealth,
  displayedCurrentTurn,
  turnLimit,
  judgePasses,
  nudgesRemaining,
  nudgeButtonEnabled,
  onComposeNudge,
  picks,
  eventsTriggered,
  scenario,
  dropsEnabled,
  onTriggerEvent,
}: {
  dateHealth: number;
  displayedCurrentTurn: number;
  turnLimit: number;
  judgePasses: number;
  nudgesRemaining: number;
  nudgeButtonEnabled: boolean;
  onComposeNudge: () => void;
  picks: string[];
  eventsTriggered: string[];
  scenario: DateScenario | undefined;
  dropsEnabled: boolean;
  onTriggerEvent: (eventId: string) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-1 lg:gap-4 lg:px-2">
      <HealthGauge value={dateHealth} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <TurnGauge current={displayedCurrentTurn} total={turnLimit} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <JudgeGauge passes={judgePasses} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <NudgeGauge
        remaining={nudgesRemaining}
        enabled={nudgeButtonEnabled}
        onCompose={onComposeNudge}
      />
      {picks.length > 0 ? (
        <>
          <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
          <ScenesGauge
            picks={picks}
            eventsTriggered={eventsTriggered}
            scenario={scenario}
            enabled={dropsEnabled}
            onTriggerEvent={onTriggerEvent}
          />
        </>
      ) : null}
    </div>
  );
}

function GaugeLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-micro font-semibold uppercase leading-none tracking-[0.22em] text-aura-faint">
      {children}
    </span>
  );
}

function GaugeColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-start gap-1.5">{children}</div>;
}

function HealthGauge({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  const tipMessage = `Date health: ${safeValue} of 100. Drops with conflict, lifts with chemistry.`;

  return (
    <Tooltip placement="top-center" message={tipMessage}>
      <GaugeColumn>
        <GaugeLabel>Health</GaugeLabel>
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-label font-semibold tabular-nums leading-none text-aura-ink">
            {safeValue}
          </span>
          <span
            aria-hidden
            className="block h-1 w-12 overflow-hidden rounded-pill bg-aura-hairline"
          >
            <span
              className={`block h-full rounded-pill bg-gradient-to-r from-aura-emerald via-aura-rose to-aura-violet ${scoreWidthClass(safeValue)}`}
            />
          </span>
        </span>
      </GaugeColumn>
    </Tooltip>
  );
}

function TurnGauge({ current, total }: { current: number; total: number }) {
  const tipMessage = `Turn ${current} of ${total}. Judges sweep at every sixth turn.`;
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));

  return (
    <Tooltip placement="top-center" message={tipMessage}>
      <GaugeColumn>
        <GaugeLabel>Turn</GaugeLabel>
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-label font-semibold tabular-nums leading-none text-aura-ink">
            {current}
            <span className="text-aura-faint">/{total}</span>
          </span>
          <span
            aria-hidden
            className="block h-1 w-12 overflow-hidden rounded-pill bg-aura-hairline"
          >
            <span
              className={`block h-full rounded-pill bg-aura-violet/80 ${scoreWidthClass(pct)}`}
            />
          </span>
        </span>
      </GaugeColumn>
    </Tooltip>
  );
}

function JudgeGauge({ passes }: { passes: number }) {
  const tipMessage = `${passes} judge ${passes === 1 ? "pass" : "passes"} on file. Each pass logs how the date is reading.`;

  return (
    <Tooltip placement="top-center" message={tipMessage}>
      <GaugeColumn>
        <GaugeLabel>Judge</GaugeLabel>
        <span className="inline-flex items-center gap-1.5 font-mono text-label font-semibold tabular-nums leading-none text-aura-violet">
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
            <path
              d="M6 1.5 L7.4 4.6 L10.7 5 L8.3 7.3 L8.9 10.6 L6 9 L3.1 10.6 L3.7 7.3 L1.3 5 L4.6 4.6 Z"
              fill="currentColor"
            />
          </svg>
          {passes}
        </span>
      </GaugeColumn>
    </Tooltip>
  );
}

function NudgeGauge({
  remaining,
  enabled,
  onCompose,
}: {
  remaining: number;
  enabled: boolean;
  onCompose: () => void;
}) {
  const total = MAX_NUDGES_PER_DATE;
  const tipMessage = enabled
    ? `Whisper a nudge. ${remaining} of ${total} left.`
    : remaining === 0
      ? "Every nudge slot used."
      : `${remaining} of ${total} ${remaining === 1 ? "nudge" : "nudges"} left. Pause to whisper.`;

  return (
    <Tooltip placement="top-center" message={tipMessage}>
      <button
        type="button"
        data-sfx={enabled ? "click" : undefined}
        disabled={!enabled}
        onClick={onCompose}
        aria-label={tipMessage}
        className="group -mx-1.5 -my-1 flex cursor-pointer flex-col items-start gap-1.5 rounded-chip px-1.5 py-1 transition disabled:cursor-not-allowed enabled:hover:bg-white/55 enabled:hover:shadow-quiet"
      >
        <GaugeLabel>
          <span className="inline-flex items-center gap-1">
            <span>Nudges</span>
            <svg
              viewBox="0 0 8 8"
              aria-hidden
              className="size-2 text-aura-rose/60 opacity-0 transition group-enabled:group-hover:opacity-100"
            >
              <path
                d="M1.5 4 H6 M4.2 1.8 L6.4 4 L4.2 6.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </GaugeLabel>
        <span className="inline-flex items-center gap-1">
          {Array.from({ length: total }).map((_, index) => {
            const filled = index < remaining;
            return (
              <svg
                key={`nudge-pip-${index}`}
                viewBox="0 0 12 12"
                aria-hidden
                className={`size-3 transition ${filled ? "text-aura-rose group-enabled:group-hover:scale-110" : "text-aura-rose/25"}`}
              >
                <path
                  d="M6 10.4 C6 10.4 1.4 7.7 1.4 4.6 C1.4 3.1 2.55 1.95 4.05 1.95 C4.95 1.95 5.65 2.45 6 3.2 C6.35 2.45 7.05 1.95 7.95 1.95 C9.45 1.95 10.6 3.1 10.6 4.6 C10.6 7.7 6 10.4 6 10.4 Z"
                  fill="currentColor"
                />
              </svg>
            );
          })}
        </span>
      </button>
    </Tooltip>
  );
}

function ScenesGauge({
  picks,
  eventsTriggered,
  scenario,
  enabled,
  onTriggerEvent,
}: {
  picks: string[];
  eventsTriggered: string[];
  scenario: DateScenario | undefined;
  enabled: boolean;
  onTriggerEvent: (eventId: string) => void;
}) {
  return (
    <GaugeColumn>
      <GaugeLabel>Scenes</GaugeLabel>
      <span className="inline-flex items-center gap-1">
        {picks.map((eventId) => {
          const event =
            scenario === undefined ? undefined : findScenarioEventById(scenario, eventId);
          const dropped = eventsTriggered.includes(eventId);
          const interactive = enabled && !dropped && event !== undefined;
          const title = event?.title ?? "Scene";
          const tipMessage = dropped
            ? `${title} dropped.`
            : interactive
              ? `Drop scene: ${title}. Click to trigger now.`
              : `${title}. Pause and stop streaming to drop.`;
          return (
            <Tooltip key={eventId} placement="top-center" message={tipMessage}>
              <button
                type="button"
                data-sfx={interactive ? "click" : undefined}
                disabled={!interactive}
                onClick={() => {
                  if (!interactive) return;
                  onTriggerEvent(eventId);
                }}
                aria-label={tipMessage}
                className={`grid size-5 cursor-pointer place-items-center rounded transition disabled:cursor-not-allowed ${
                  dropped
                    ? "text-aura-emerald/80"
                    : interactive
                      ? "text-aura-violet hover:scale-110 hover:text-aura-fuchsia"
                      : "text-aura-violet/40"
                }`}
              >
                {dropped ? (
                  <svg viewBox="0 0 12 12" className="size-full" aria-hidden>
                    <path
                      d="M2.5 6.5 L5 9 L9.5 3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 12 12" className="size-full" aria-hidden>
                    <path d="M6 1.2 L10.8 6 L6 10.8 L1.2 6 Z" fill="currentColor" />
                  </svg>
                )}
              </button>
            </Tooltip>
          );
        })}
      </span>
    </GaugeColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: nudge composer modal                             */
/* ------------------------------------------------------------------ */

const NUDGE_MAX_CHARS = 240;

function NudgeComposerModal({
  participants,
  recipientId,
  text,
  suggestions,
  nudgesRemaining,
  canIntervene,
  onTextChange,
  onRecipientChange,
  onFile,
  onClose,
}: {
  participants: Member[];
  recipientId: string;
  text: string;
  suggestions: string[];
  nudgesRemaining: number;
  canIntervene: boolean;
  onTextChange: (text: string) => void;
  onRecipientChange: (memberId: string) => void;
  onFile: () => void;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recipient = participants.find((member) => member.id === recipientId);
  const recipientName = recipient?.firstName ?? "one";
  const sendDisabled = !canIntervene || text.trim().length === 0;
  const swapEnabled = participants.length >= 2;
  const totalSlots = MAX_NUDGES_PER_DATE;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Autofocus and place the cursor at the end of any prior draft.
  useEffect(() => {
    const node = textareaRef.current;
    if (node === null) return;
    node.focus();
    const length = node.value.length;
    node.setSelectionRange(length, length);
  }, []);

  const swapRecipient = () => {
    if (!swapEnabled) return;
    const next = participants.find((member) => member.id !== recipientId);
    if (next === undefined) return;
    onRecipientChange(next.id);
  };

  const fileNudge = () => {
    if (sendDisabled) return;
    onFile();
  };

  return (
    <motion.aside
      key="nudge-composer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
      onClick={onClose}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/55 px-4 py-10 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Whisper a nudge to ${recipientName}`}
        className="aura-glass-strong relative w-full max-w-xl overflow-hidden rounded-card"
      >
        <ModalCloseButton onClose={onClose} label="Close nudge composer" sfx="dismiss" />
        <div className="relative flex flex-col gap-6 px-7 py-7 lg:px-9 lg:py-8">
          <header className="flex flex-col gap-3">
            <Eyebrow>{"// nudge.compose"}</Eyebrow>
            <h2 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink lg:text-display-md">
              Whisper to {recipientName}
            </h2>
            <p className="aura-accent text-lead text-aura-muted">
              One slip, then they hear it. They will not know it came from you.
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              to
            </span>
            <button
              type="button"
              data-sfx="toggle"
              onClick={swapRecipient}
              disabled={!swapEnabled}
              aria-label={`Whisper recipient: ${recipientName}. ${swapEnabled ? "Click to swap." : ""}`}
              title={swapEnabled ? "Swap recipient" : undefined}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-aura-rose px-4 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-quiet transition hover:bg-aura-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {recipientName}
              {swapEnabled ? (
                <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
                  <path
                    d="M2 4 L10 4 M7 1 L10 4 L7 7 M10 8 L2 8 M5 11 L2 8 L5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
            <span aria-hidden className="h-3 w-px bg-aura-hairline-strong/50" />
            <NudgeSlotMeter remaining={nudgesRemaining} total={totalSlots} />
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              maxLength={NUDGE_MAX_CHARS}
              rows={4}
              onChange={(event) => onTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  fileNudge();
                }
              }}
              placeholder={`What should ${recipientName} do next?`}
              aria-label={`Nudge for ${recipientName}`}
              className="block min-h-[7.5rem] w-full resize-none rounded-card border border-aura-hairline bg-white/70 px-5 py-4 font-sans text-body text-aura-ink shadow-quiet outline-none transition placeholder:text-aura-faint focus:border-aura-rose/55 focus:bg-white focus:shadow-card"
            />
            <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-micro tabular-nums text-aura-faint">
              {text.length} / {NUDGE_MAX_CHARS}
            </span>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>{"// quick nudges"}</Eyebrow>
              <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
                tap to draft
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {suggestions.map((suggestion) => {
                const isActive = text.trim() === suggestion.trim();
                return (
                  <button
                    key={suggestion}
                    type="button"
                    data-sfx="click"
                    onClick={() => {
                      onTextChange(suggestion);
                      const node = textareaRef.current;
                      if (node !== null) {
                        node.focus();
                        const length = suggestion.length;
                        node.setSelectionRange(length, length);
                      }
                    }}
                    aria-pressed={isActive}
                    className={`group flex h-full cursor-pointer flex-col items-start gap-2 rounded-chip border px-3.5 py-3 text-left transition ${
                      isActive
                        ? "border-aura-rose/60 bg-aura-rose/10 shadow-quiet"
                        : "border-aura-hairline bg-white/60 hover:-translate-y-px hover:border-aura-rose/40 hover:bg-white hover:shadow-quiet"
                    }`}
                  >
                    <span
                      className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                        isActive ? "text-aura-rose" : "text-aura-faint group-hover:text-aura-rose"
                      }`}
                    >
                      {suggestionLabel(suggestion)}
                    </span>
                    <span className="text-label leading-snug text-aura-ink/85">{suggestion}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-aura-hairline bg-white/40 px-7 py-4 lg:px-9 lg:py-5">
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span className="text-aura-muted">Enter</span> to file ·{" "}
            <span className="text-aura-muted">Shift+Enter</span> for line break ·{" "}
            <span className="text-aura-muted">Esc</span> to close
          </p>
          <div className="flex items-center gap-3">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <button
              type="button"
              data-sfx="primary"
              onClick={fileNudge}
              disabled={sendDisabled}
              aria-label="File whisper"
              className="aura-cta inline-flex cursor-pointer items-center gap-2 rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <span>File whisper</span>
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path d="M2 8 L14 2 L11 14 L7.5 9 L2 8 Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}

function NudgeSlotMeter({ remaining, total }: { remaining: number; total: number }) {
  const usedLabel = total - remaining;
  const message =
    remaining === 0
      ? "every slot spent"
      : `${remaining} of ${total} ${remaining === 1 ? "slot" : "slots"} left`;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1">
        {Array.from({ length: total }).map((_, index) => {
          const filled = index < remaining;
          return (
            <svg
              key={`composer-pip-${index}`}
              viewBox="0 0 12 12"
              aria-hidden
              className={`size-3 transition ${filled ? "text-aura-rose" : "text-aura-rose/25"}`}
            >
              <path
                d="M6 10.4 C6 10.4 1.4 7.7 1.4 4.6 C1.4 3.1 2.55 1.95 4.05 1.95 C4.95 1.95 5.65 2.45 6 3.2 C6.35 2.45 7.05 1.95 7.95 1.95 C9.45 1.95 10.6 3.1 10.6 4.6 C10.6 7.7 6 10.4 6 10.4 Z"
                fill="currentColor"
              />
            </svg>
          );
        })}
      </span>
      <span
        className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint"
        aria-label={`${usedLabel} of ${total} used. ${message}.`}
      >
        {message}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: paused-state hint                                */
/* ------------------------------------------------------------------ */

function PausedBanner({
  interventionSlotAvailable,
  dropsEnabled,
}: {
  interventionSlotAvailable: boolean;
  dropsEnabled: boolean;
}) {
  const message = !interventionSlotAvailable
    ? "Held. Every nudge spent. Drop a scene or advance the beat."
    : dropsEnabled
      ? "Held. Tap a heart to whisper, drop a scene, or advance the beat."
      : "Held. Tap a heart to whisper, or advance the beat.";

  return (
    <div className="flex w-full items-center gap-3 px-2">
      <span aria-hidden className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-aura-rose/65" />
        <span className="size-1.5 rounded-full bg-aura-rose/45" />
        <span className="size-1.5 rounded-full bg-aura-rose/25" />
      </span>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
        {message}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: playback banner shown when the date is in motion */
/* ------------------------------------------------------------------ */

function PlaybackBanner({ pendingDateAction }: { pendingDateAction: PendingDateAction | null }) {
  const message =
    pendingDateAction === "completeDate"
      ? "Cupid is wrapping the date."
      : pendingDateAction === "advanceExchange"
        ? "Date is in motion. Pause to direct."
        : "Autoplay is rolling. Pause to direct.";

  return (
    <div className="flex w-full items-center gap-3 px-2">
      <span aria-hidden className="flex items-center gap-1">
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-violet/55 [animation-delay:0ms]" />
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-violet/65 [animation-delay:180ms]" />
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-violet/75 [animation-delay:360ms]" />
      </span>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-violet">
        {message}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: transport cluster                                */
/* ------------------------------------------------------------------ */

function TransportCluster({
  isPlaying,
  isPaused,
  isStreaming,
  playbackBusy,
  canAdvance,
  pendingDateAction,
  onAdvance,
  onComplete,
  onCancel,
  onTogglePlayback,
}: {
  isPlaying: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  playbackBusy: boolean;
  canAdvance: boolean;
  pendingDateAction: PendingDateAction | null;
  onAdvance: (turnCount: 1 | 2) => void;
  onComplete: () => void;
  onCancel: () => void;
  onTogglePlayback: () => void;
}) {
  const advanceTip =
    pendingDateAction === "advanceExchange" ? "Streaming next beat..." : "Advance one beat";
  const resolveTip = pendingDateAction === "completeDate" ? "Resolving date..." : "Resolve date";
  const playTip = isPlaying ? "Pause autoplay (space)" : "Start autoplay (space)";
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {isPaused ? (
        <Tooltip placement="top-center" message={resolveTip}>
          <TransportButton
            kind="ghost"
            disabled={!canAdvance}
            onClick={onComplete}
            ariaLabel={resolveTip}
          >
            <ResolveIcon />
          </TransportButton>
        </Tooltip>
      ) : null}
      {isPaused ? (
        <Tooltip placement="top-center" message={advanceTip}>
          <TransportButton
            kind="ghost"
            disabled={!canAdvance}
            onClick={() => onAdvance(2)}
            ariaLabel={advanceTip}
          >
            <AdvanceIcon />
          </TransportButton>
        </Tooltip>
      ) : null}
      {isPaused && isStreaming ? (
        <Tooltip placement="top-center" message="Stop streaming">
          <TransportButton
            kind="stop"
            disabled={false}
            onClick={onCancel}
            ariaLabel="Stop streaming"
          >
            <StopIcon />
          </TransportButton>
        </Tooltip>
      ) : null}
      <Tooltip placement="top-center" message={playTip}>
        <TransportButton
          kind={isPlaying ? "ghost-active" : "primary"}
          disabled={playbackBusy}
          onClick={onTogglePlayback}
          ariaLabel={playTip}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </TransportButton>
      </Tooltip>
    </div>
  );
}

function TransportButton({
  kind,
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  kind: "ghost" | "ghost-active" | "primary" | "stop";
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  const baseClass =
    "relative grid size-10 cursor-pointer place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40";
  const toneClass =
    kind === "primary"
      ? "aura-cta bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet text-white shadow-cta ring-1 ring-white/40 ring-inset hover:-translate-y-px hover:shadow-cta-hover"
      : kind === "ghost-active"
        ? "bg-white/85 text-aura-violet ring-1 ring-aura-violet/40 hover:bg-white"
        : kind === "stop"
          ? "bg-aura-rose/15 text-aura-rose ring-1 ring-aura-rose/40 hover:bg-aura-rose hover:text-white"
          : "text-aura-muted ring-1 ring-aura-hairline hover:bg-white/55 hover:text-aura-ink";
  const sfxCue: SfxCue = kind === "primary" ? "primary" : kind === "stop" ? "dismiss" : "click";
  return (
    <button
      type="button"
      data-sfx={sfxCue}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClass} ${toneClass}`}
    >
      {kind === "ghost-active" ? (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-aura-violet/20 aura-pulse"
        />
      ) : null}
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path d="M3.8 2.4 L11.6 7 L3.8 11.6 Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <rect x="3" y="2.5" width="2.6" height="9" rx="0.7" fill="currentColor" />
      <rect x="8.4" y="2.5" width="2.6" height="9" rx="0.7" fill="currentColor" />
    </svg>
  );
}

function AdvanceIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path d="M2.5 2.5 L9 7 L2.5 11.5 Z" fill="currentColor" />
      <rect x="9.6" y="2.5" width="1.7" height="9" rx="0.7" fill="currentColor" />
    </svg>
  );
}

function ResolveIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path
        d="M3 3 L11 11 M11 3 L3 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function suggestionLabel(suggestion: string): string {
  if (suggestion.includes("boundary")) {
    return "Name boundary";
  }

  if (suggestion.includes("logistics")) {
    return "Move past logistics";
  }

  if (suggestion.includes("follow-up")) {
    return "Ask follow-up";
  }

  return "Ground it";
}

/* ================================================================== */
/* Notes                                                              */
/* ================================================================== */

export type NotesProps = {
  memories: MemoryRecord[];
  members: Member[];
  pairStates: PairState[];
  scenarios: DateScenario[];
  shiftCount: number;
};

type NotesScopeFilter = "all" | "pairs" | "scenarios";

const NOTES_SCOPE_FILTERS: { id: NotesScopeFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "pairs", label: "pairs" },
  { id: "scenarios", label: "scenarios" },
];

const PAIR_NOTE_SCOPES = new Set<MemoryRecord["scope"]>(["pair", "date"]);

export function NotesView({ memories, members, pairStates, scenarios, shiftCount }: NotesProps) {
  const [scopeFilter, setScopeFilter] = useState<NotesScopeFilter>("all");
  const [selectedPairId, setSelectedPairId] = useState<string | "any">("any");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | "any">("any");

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const pairStateById = useMemo(
    () => new Map(pairStates.map((pair) => [pair.id, pair])),
    [pairStates],
  );
  const scenarioById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario])),
    [scenarios],
  );

  const visibleMemories = useMemo(
    () => memories.filter(isPlayerVisibleNote).sort(sortMemoriesNewestFirst),
    [memories],
  );

  const pairOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const memory of visibleMemories) {
      if (!PAIR_NOTE_SCOPES.has(memory.scope) || memory.pairId === undefined) continue;
      if (seen.has(memory.pairId)) continue;
      seen.set(memory.pairId, {
        id: memory.pairId,
        label: pairLabel(memory.pairId, memberById, pairStateById),
      });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleMemories, memberById, pairStateById]);

  const scenarioOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const memory of visibleMemories) {
      if (memory.scope !== "scenario" || memory.scenarioId === undefined) continue;
      if (seen.has(memory.scenarioId)) continue;
      const scenario = scenarioById.get(memory.scenarioId);
      seen.set(memory.scenarioId, {
        id: memory.scenarioId,
        label: scenario?.title ?? memory.scenarioId,
      });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleMemories, scenarioById]);

  const filteredMemories = useMemo(() => {
    return visibleMemories.filter((memory) => {
      if (scopeFilter === "pairs" && !PAIR_NOTE_SCOPES.has(memory.scope)) return false;
      if (scopeFilter === "scenarios" && memory.scope !== "scenario") return false;
      if (selectedPairId !== "any" && memory.pairId !== selectedPairId) return false;
      if (selectedScenarioId !== "any" && memory.scenarioId !== selectedScenarioId) return false;
      return true;
    });
  }, [visibleMemories, scopeFilter, selectedPairId, selectedScenarioId]);

  const totalCount = visibleMemories.length;
  const shownCount = filteredMemories.length;
  const hasFilters =
    scopeFilter !== "all" || selectedPairId !== "any" || selectedScenarioId !== "any";

  function clearNotesFilters() {
    setScopeFilter("all");
    setSelectedPairId("any");
    setSelectedScenarioId("any");
  }

  return (
    <ViewFrame wide>
      <SectionHeader
        eyebrow={`// notes.${pad2(shiftCount)}`}
        title="Case notes"
        meta={`${pad2(totalCount)} on file`}
        tooltip="Public pair and scenario memories Cupid can share. Private member files and judge-only records stay sealed."
      />

      <NotesFilterRail
        scopeFilter={scopeFilter}
        onScopeFilterChange={(next) => {
          setScopeFilter(next);
          if (next === "pairs") setSelectedScenarioId("any");
          if (next === "scenarios") setSelectedPairId("any");
        }}
        pairOptions={pairOptions}
        selectedPairId={selectedPairId}
        onSelectedPairChange={setSelectedPairId}
        scenarioOptions={scenarioOptions}
        selectedScenarioId={selectedScenarioId}
        onSelectedScenarioChange={setSelectedScenarioId}
        totalCount={totalCount}
        shownCount={shownCount}
        hasFilters={hasFilters}
        onClearFilters={clearNotesFilters}
      />

      {totalCount === 0 ? (
        <NotesEmptyTile
          title="No public notes yet"
          subhead="Cupid files pair and scenario memories after dates wrap. Run a shift to start the archive."
        />
      ) : filteredMemories.length === 0 ? (
        <NotesEmptyTile
          title="No notes match this filter"
          subhead="Loosen the filter to see more of the case archive."
          action={<GhostButton onClick={clearNotesFilters}>Reset filters</GhostButton>}
        />
      ) : (
        <NotesArchive
          memories={filteredMemories}
          memberById={memberById}
          pairStateById={pairStateById}
          scenarioById={scenarioById}
        />
      )}
    </ViewFrame>
  );
}

function NotesArchive({
  memories,
  memberById,
  pairStateById,
  scenarioById,
}: {
  memories: MemoryRecord[];
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
}) {
  const [featured, ...rest] = memories;

  return (
    <div className="relative mt-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-3 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-aura-rose/45 via-aura-hairline-strong to-transparent lg:block"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[14px] top-3 hidden size-2 rounded-full bg-aura-rose/70 shadow-[0_0_0_4px_rgba(255,253,249,0.85)] lg:block"
      />

      {featured === undefined ? null : (
        <FeaturedNoteCard
          memory={featured}
          memberById={memberById}
          pairStateById={pairStateById}
          scenarioById={scenarioById}
          rank={memories.length}
        />
      )}

      {rest.length === 0 ? null : (
        <ul className="mt-6 grid gap-5 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {rest.map((memory, index) => (
              <NoteCard
                key={memory.id}
                memory={memory}
                index={index}
                memberById={memberById}
                pairStateById={pairStateById}
                scenarioById={scenarioById}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function NotesFilterRail({
  scopeFilter,
  onScopeFilterChange,
  pairOptions,
  selectedPairId,
  onSelectedPairChange,
  scenarioOptions,
  selectedScenarioId,
  onSelectedScenarioChange,
  totalCount,
  shownCount,
  hasFilters,
  onClearFilters,
}: {
  scopeFilter: NotesScopeFilter;
  onScopeFilterChange: (next: NotesScopeFilter) => void;
  pairOptions: { id: string; label: string }[];
  selectedPairId: string | "any";
  onSelectedPairChange: (id: string | "any") => void;
  scenarioOptions: { id: string; label: string }[];
  selectedScenarioId: string | "any";
  onSelectedScenarioChange: (id: string | "any") => void;
  totalCount: number;
  shownCount: number;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const showPairPicker = scopeFilter !== "scenarios" && pairOptions.length > 0;
  const showScenarioPicker = scopeFilter !== "pairs" && scenarioOptions.length > 0;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="inline-flex items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
        {NOTES_SCOPE_FILTERS.map((filter) => {
          const active = scopeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              data-sfx="click"
              onClick={() => onScopeFilterChange(filter.id)}
              aria-pressed={active}
              className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                active
                  ? "bg-aura-ink text-white shadow-quiet"
                  : "text-aura-muted hover:text-aura-ink"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {showPairPicker ? (
        <NotesScopePicker
          label="Pair"
          value={selectedPairId}
          options={pairOptions}
          onChange={onSelectedPairChange}
        />
      ) : null}

      {showScenarioPicker ? (
        <NotesScopePicker
          label="Scenario"
          value={selectedScenarioId}
          options={scenarioOptions}
          onChange={onSelectedScenarioChange}
        />
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {pad2(shownCount)} of {pad2(totalCount)} shown
        </span>
        {hasFilters ? <GhostButton onClick={onClearFilters}>Reset filters</GhostButton> : null}
      </div>
    </div>
  );
}

function NotesScopePicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | "any";
  options: { id: string; label: string }[];
  onChange: (id: string | "any") => void;
}) {
  const selectOptions = [
    { value: "any", label: "any" },
    ...options.map((option) => ({ value: option.id, label: option.label })),
  ];

  return (
    <SelectInput
      label={label}
      value={value}
      options={selectOptions}
      layout="inline"
      onChange={onChange}
    />
  );
}

type NoteScopeKey = "pair" | "date" | "scenario";

type ScopePalette = {
  label: string;
  ribbon: string;
  rail: string;
  watermark: string;
  glyphRing: string;
  glyphFill: string;
  caseDot: string;
};

const NOTE_SCOPE_PALETTE: Record<NoteScopeKey, ScopePalette> = {
  pair: {
    label: "PAIR FILE",
    ribbon: "bg-aura-rose/95 text-white",
    rail: "bg-aura-rose",
    watermark: "text-aura-rose",
    glyphRing: "ring-aura-rose/35",
    glyphFill: "from-rose-100 via-aura-paper to-fuchsia-50",
    caseDot: "bg-aura-rose",
  },
  date: {
    label: "DATE FILE",
    ribbon: "bg-aura-fuchsia/95 text-white",
    rail: "bg-aura-fuchsia",
    watermark: "text-aura-fuchsia",
    glyphRing: "ring-aura-fuchsia/35",
    glyphFill: "from-fuchsia-100 via-aura-paper to-violet-50",
    caseDot: "bg-aura-fuchsia",
  },
  scenario: {
    label: "SCENARIO FILE",
    ribbon: "bg-aura-amber/95 text-white",
    rail: "bg-aura-amber",
    watermark: "text-aura-amber",
    glyphRing: "ring-aura-amber/40",
    glyphFill: "from-amber-100 via-aura-paper to-rose-50",
    caseDot: "bg-aura-amber",
  },
};

function paletteForScope(scope: MemoryRecord["scope"]): ScopePalette {
  if (scope === "pair" || scope === "date" || scope === "scenario") {
    return NOTE_SCOPE_PALETTE[scope];
  }
  return NOTE_SCOPE_PALETTE.pair;
}

function caseNumberFor(memory: MemoryRecord): string {
  const prefix = memory.scope === "pair" ? "PR" : memory.scope === "date" ? "DT" : "SC";
  const cleaned = memory.id.replace(/[^0-9a-zA-Z]/g, "");
  const tail = cleaned.slice(-4).toUpperCase().padStart(4, "0");
  return `C-${prefix}-${tail}`;
}

function splitNoteLead(text: string): { lead: string; tail: string } {
  const trimmed = text.trim();
  const breaks = [". ", "? ", "! "]
    .map((token) => trimmed.indexOf(token))
    .filter((index) => index > 0);
  if (breaks.length === 0) {
    return { lead: trimmed, tail: "" };
  }
  const cut = Math.min(...breaks);
  return { lead: trimmed.slice(0, cut + 1), tail: trimmed.slice(cut + 2) };
}

function FeaturedNoteCard({
  memory,
  memberById,
  pairStateById,
  scenarioById,
  rank,
}: {
  memory: MemoryRecord;
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
  rank: number;
}) {
  const palette = paletteForScope(memory.scope);
  const pairMembers =
    memory.pairId === undefined
      ? []
      : (pairStateById.get(memory.pairId)?.participantIds ?? [])
          .map((id) => memberById.get(id))
          .filter((m): m is Member => Boolean(m));
  const scenario =
    memory.scenarioId === undefined ? undefined : scenarioById.get(memory.scenarioId);
  const title = noteCardTitle(memory, pairMembers, scenario);
  const subhead = noteCardSubhead(memory, scenario);
  const { lead, tail } = splitNoteLead(memory.text);
  const caseNumber = caseNumberFor(memory);

  return (
    <motion.article
      key={memory.id}
      layout
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.46, ease: EASE_OUT_QUART }}
      className={`aura-glass-strong relative overflow-hidden rounded-card ring-1 ${palette.glyphRing}`}
    >
      <NoteCardWatermark palette={palette} scope={memory.scope} large />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 ${palette.rail} opacity-60`}
      />
      <ImportanceRail value={memory.importance} palette={palette} large />

      <div className="relative z-10 px-7 pb-9 pl-12 pt-0 lg:px-9 lg:pb-11 lg:pl-14">
        <div className="-mt-px flex items-start justify-between gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-b-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.26em] shadow-quiet ${palette.ribbon}`}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-white/85" />
            {palette.label}
          </span>
          <FiledStamp date={memory.createdAt} />
        </div>

        <div className="mt-6 grid gap-7 lg:grid-cols-[auto_1fr] lg:gap-9">
          <div className="flex flex-col items-start gap-3">
            {pairMembers.length > 0 ? (
              <div className="flex -space-x-5">
                {pairMembers.map((member, idx) => (
                  <span
                    key={member.id}
                    className={`rounded-full border-[3px] border-white/90 bg-white shadow-quiet ${idx === 0 ? "rotate-[-3deg]" : "rotate-[2deg]"}`}
                  >
                    <Portrait member={member} variant="card" />
                  </span>
                ))}
              </div>
            ) : (
              <ScenarioGlyph
                title={scenario?.title ?? memory.scenarioId ?? "S"}
                palette={palette}
                large
              />
            )}
            <div className="space-y-1">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
                Filed {formatNoteTimestamp(memory.createdAt)}
              </p>
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-muted">
                Lead case · {pad2(rank)} on file
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-display text-display-lg font-semibold leading-[0.98] tracking-tight text-aura-ink">
              {title}
            </h3>
            {subhead === null ? null : (
              <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-rose">
                {subhead}
              </p>
            )}
            <p className="aura-accent mt-5 text-display-sm leading-snug text-aura-ink/90">{lead}</p>
            {tail === "" ? null : (
              <p className="mt-4 max-w-prose text-body leading-relaxed text-aura-ink/80">{tail}</p>
            )}
            {memory.tags.length === 0 ? null : (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {memory.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2.5 py-1 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                      {tag.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4 border-t border-aura-hairline pt-4">
          <p className="flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
            <span aria-hidden className={`size-1.5 rounded-full ${palette.caseDot}`} />
            Reviewed by Cupid
          </p>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted">
            ref · {caseNumber}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function NoteCard({
  memory,
  index,
  memberById,
  pairStateById,
  scenarioById,
}: {
  memory: MemoryRecord;
  index: number;
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
}) {
  const palette = paletteForScope(memory.scope);
  const pairMembers =
    memory.pairId === undefined
      ? []
      : (pairStateById.get(memory.pairId)?.participantIds ?? [])
          .map((id) => memberById.get(id))
          .filter((m): m is Member => Boolean(m));
  const scenario =
    memory.scenarioId === undefined ? undefined : scenarioById.get(memory.scenarioId);
  const title = noteCardTitle(memory, pairMembers, scenario);
  const subhead = noteCardSubhead(memory, scenario);
  const { lead, tail } = splitNoteLead(memory.text);
  const caseNumber = caseNumberFor(memory);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.34, delay: Math.min(index, 6) * 0.04, ease: EASE_OUT_QUART }}
      className="list-none"
    >
      <article
        className={`aura-glass aura-glass-lift relative h-full overflow-hidden rounded-card ring-1 ${palette.glyphRing}`}
      >
        <NoteCardWatermark palette={palette} scope={memory.scope} />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${palette.rail} opacity-55`}
        />
        <ImportanceRail value={memory.importance} palette={palette} />

        <div className="relative z-10 flex h-full min-h-full flex-col gap-4 px-5 pb-5 pl-9 pt-0 lg:px-6 lg:pl-11">
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-b-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] shadow-quiet ${palette.ribbon}`}
            >
              <span aria-hidden className="size-1 rounded-full bg-white/85" />
              {palette.label}
            </span>
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
              {caseNumber}
            </span>
          </div>

          <div className="flex items-start gap-4">
            {pairMembers.length > 0 ? (
              <div className="flex shrink-0 -space-x-3">
                {pairMembers.map((member, idx) => (
                  <span
                    key={member.id}
                    className={`rounded-full border-2 border-white/90 bg-white shadow-quiet ${idx === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"}`}
                  >
                    <Portrait member={member} variant="thumb" />
                  </span>
                ))}
              </div>
            ) : (
              <ScenarioGlyph
                title={scenario?.title ?? memory.scenarioId ?? "S"}
                palette={palette}
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 font-display text-display-sm font-semibold leading-[1.05] tracking-tight text-aura-ink">
                {title}
              </h3>
              {subhead === null ? null : (
                <p className="mt-1 line-clamp-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
                  {subhead}
                </p>
              )}
              <p className="mt-1 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
                Filed {formatNoteTimestamp(memory.createdAt)}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="aura-accent line-clamp-2 text-lead leading-snug text-aura-ink/90">
              {lead}
            </p>
            {tail === "" ? null : (
              <p className="mt-2 line-clamp-2 text-body leading-relaxed text-aura-ink/75">{tail}</p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-aura-hairline pt-3">
            {memory.tags.length === 0 ? (
              <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
                no tags filed
              </span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {memory.tags.slice(0, 3).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2 py-0.5 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-muted">
                      {tag.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
                {memory.tags.length > 3 ? (
                  <li className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                    +{memory.tags.length - 3}
                  </li>
                ) : null}
              </ul>
            )}
            <span className="flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              <span aria-hidden className={`size-1 rounded-full ${palette.caseDot}`} />
              {pad2(memory.importance)}/05
            </span>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

function ImportanceRail({
  value,
  palette,
  large = false,
}: {
  value: number;
  palette: ScopePalette;
  large?: boolean;
}) {
  const filled = Math.max(1, Math.min(5, value));
  return (
    <div
      aria-label={`Importance ${filled} of 5`}
      title={`Importance ${filled} of 5`}
      className={`pointer-events-none absolute left-3 flex flex-col gap-1 ${large ? "inset-y-9 w-[3px]" : "inset-y-7 w-[2.5px]"}`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const isLit = 5 - i <= filled;
        return (
          <span
            key={i}
            aria-hidden
            className={`flex-1 rounded-full ${isLit ? palette.rail : "bg-aura-hairline"}`}
          />
        );
      })}
    </div>
  );
}

function FiledStamp({ date }: { date: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none inline-flex -rotate-[7deg] flex-col items-center justify-center gap-0.5 rounded-md border-2 border-aura-rose/45 px-3 py-1.5 font-mono font-semibold uppercase tracking-[0.32em] text-aura-rose/65"
    >
      <span className="text-micro leading-none">Filed</span>
      <span className="text-micro leading-none tracking-[0.18em] text-aura-rose/55">
        {formatStampDate(date)}
      </span>
    </span>
  );
}

function formatStampDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  const day = parsed.toLocaleDateString(undefined, { day: "2-digit" });
  const month = parsed.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  return `${day} ${month}`;
}

function NoteCardWatermark({
  palette,
  scope,
  large = false,
}: {
  palette: ScopePalette;
  scope: MemoryRecord["scope"];
  large?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute opacity-[0.07] ${large ? "-bottom-12 -right-10 size-64" : "-bottom-10 -right-8 size-44"}`}
    >
      <svg viewBox="0 0 100 100" className={`size-full ${palette.watermark}`} fill="currentColor">
        {scope === "scenario" ? (
          <path d="M50 8 L60 38 L92 40 L66 60 L74 92 L50 74 L26 92 L34 60 L8 40 L40 38 Z" />
        ) : (
          <path d="M50 86 C22 64 12 48 12 33 C12 22 22 14 32 14 C40 14 47 19 50 26 C53 19 60 14 68 14 C78 14 88 22 88 33 C88 48 78 64 50 86 Z" />
        )}
      </svg>
    </div>
  );
}

function ScenarioGlyph({
  title,
  palette,
  large = false,
}: {
  title: string;
  palette: ScopePalette;
  large?: boolean;
}) {
  const initials =
    title
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part.replace(/[^a-zA-Z0-9]/g, "").charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";

  return (
    <div
      aria-hidden
      className={`relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br ring-2 ${palette.glyphFill} ${palette.glyphRing} ${large ? "size-28 shadow-quiet" : "size-12"}`}
    >
      <span aria-hidden className="absolute inset-1 rounded-full ring-1 ring-white/60" />
      <span aria-hidden className="absolute inset-2.5 rounded-full ring-1 ring-aura-hairline" />
      <span
        className={`relative font-display font-semibold tracking-tight text-aura-ink/85 ${large ? "text-display-md" : "text-base"}`}
      >
        {initials}
      </span>
    </div>
  );
}

function NotesEmptyTile({
  title,
  subhead,
  action,
}: {
  title: string;
  subhead: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-10 grid place-items-center rounded-card border border-dashed border-aura-hairline bg-white/40 px-6 py-12 text-center">
      <div className="max-w-md space-y-3">
        <Eyebrow>// archive.empty</Eyebrow>
        <h3 className="font-display text-display-md font-semibold tracking-tight text-aura-ink">
          {title}
        </h3>
        <p className="text-label text-aura-muted">{subhead}</p>
        {action === undefined ? null : <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

function isPlayerVisibleNote(memory: MemoryRecord): boolean {
  if (memory.visibility !== "public") return false;
  return memory.scope === "pair" || memory.scope === "date" || memory.scope === "scenario";
}

function sortMemoriesNewestFirst(first: MemoryRecord, second: MemoryRecord): number {
  if (first.createdAt === second.createdAt) {
    return second.importance - first.importance;
  }
  return first.createdAt < second.createdAt ? 1 : -1;
}

function noteCardTitle(
  memory: MemoryRecord,
  pairMembers: Member[],
  scenario: DateScenario | undefined,
): string {
  if (memory.scope === "scenario") {
    return scenario?.title ?? memory.scenarioId ?? "Scenario file";
  }
  return (
    joinPairFirstNames(pairMembers.map((member) => member.firstName)) ??
    memory.pairId ??
    "Pair file"
  );
}

function noteCardSubhead(memory: MemoryRecord, scenario: DateScenario | undefined): string | null {
  if (memory.scope === "scenario") {
    return null;
  }
  if (scenario === undefined) {
    return null;
  }
  return scenario.title;
}

function pairLabel(
  pairId: string,
  memberById: Map<string, Member>,
  pairStateById: Map<string, PairState>,
): string {
  const participantIds = pairStateById.get(pairId)?.participantIds ?? [];
  const names = participantIds
    .map((id) => memberById.get(id)?.firstName)
    .filter((name): name is string => name !== undefined);
  return joinPairFirstNames(names) ?? pairId;
}

function joinPairFirstNames(names: readonly string[]): string | null {
  if (names.length >= 2) return `${names[0]} & ${names[1]}`;
  if (names.length === 1) return names[0];
  return null;
}

function formatNoteTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ================================================================== */
/* Shared pieces                                                      */
/* ================================================================== */

export function ViewFrame({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-4xl"} px-6 pb-40 pt-6 lg:px-10`}
    >
      {children}
    </motion.div>
  );
}

function EmptyState({
  eyebrow,
  title,
  subhead,
  action,
}: {
  eyebrow: string;
  title: string;
  subhead: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="max-w-md space-y-5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          {title}
        </h1>
        <p className="text-lead text-aura-muted">{subhead}</p>
        <div className="pt-2">{action}</div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Shift report overlay                                               */
/* ================================================================== */

export function ShiftReportPanel({
  shift,
  members,
  isActionPending,
  onOpenNextShift,
}: {
  shift: ShiftState;
  members: Member[];
  isActionPending: boolean;
  onOpenNextShift: () => void;
}) {
  if (shift.status !== "completed" || shift.report === undefined) {
    return null;
  }

  const report = shift.report;

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/60 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_QUART }}
        className="aura-glass-strong mx-6 w-full max-w-2xl rounded-card p-10"
      >
        <Eyebrow>{`// shift.${pad2(shift.shiftNumber)} closed`}</Eyebrow>
        <h2 className="mt-3 font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          Shift filed
        </h2>
        <p className="mt-3 text-lead text-aura-muted">{report.summary}</p>

        <ul className="mt-8 space-y-3">
          {report.goalResults.map((result) => (
            <li key={result.goalId} className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-label uppercase tracking-[0.18em] text-aura-faint">
                {result.summary}
              </span>
              <span
                className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${
                  result.status === "met" ? "text-emerald-600" : "text-aura-rose"
                }`}
              >
                {result.status}
              </span>
            </li>
          ))}
        </ul>

        {report.hrNote === undefined ? null : (
          <div className="mt-8 rounded-card border border-aura-hairline bg-white/45 p-5">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
              // hr.note
            </p>
            <p className="mt-2 text-body text-aura-ink">{report.hrNote}</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-label text-aura-muted">
            {members.length} members on file. Cupid keeps the receipts.
          </p>
          <PrimaryButton disabled={isActionPending} onClick={onOpenNextShift}>
            Open next shift
          </PrimaryButton>
        </div>
      </motion.div>
    </motion.aside>
  );
}

/* ================================================================== */
/* Loading                                                            */
/* ================================================================== */

export function DashboardLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-aura-bg text-aura-ink">
      <div className="flex flex-col items-center gap-3">
        <LiveDot />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          Cupid Operations
        </p>
        <p className="text-body text-aura-muted">Reaching across timelines. One moment.</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

export function buildTranscriptItems(
  session: DateSession,
  members: Member[],
  scenario: DateScenario | undefined,
  streamingDrafts: StreamingDraftMessage[],
): TranscriptItem[] {
  const messageItems: TranscriptItem[] = session.transcript.map((message) => {
    if (message.kind === "character") {
      const member = members.find((candidate) => candidate.id === message.speakerId);
      return {
        id: `turn-${message.sequenceIndex}`,
        order: message.sequenceIndex * 10,
        label: member?.firstName ?? "Member",
        tone: "member",
        text: message.text,
        member,
      };
    }

    return {
      id: `turn-${message.sequenceIndex}`,
      order: message.sequenceIndex * 10,
      ...buildNonCharacterLabel(message, session, members, scenario),
      tone: message.kind,
      text: message.text,
    };
  });
  const lastSequenceByExchange = new Map<number, number>();
  for (const message of session.transcript) {
    if (message.kind !== "character") {
      continue;
    }
    const exchangeIndex = exchangeIndexForTurn(message.turnIndex);
    const previous = lastSequenceByExchange.get(exchangeIndex) ?? 0;
    if (message.sequenceIndex > previous) {
      lastSequenceByExchange.set(exchangeIndex, message.sequenceIndex);
    }
  }
  const judgeItems: TranscriptItem[] = session.judgeSnapshots.map((snapshot) => ({
    id: `turn-judge-${snapshot.exchangeIndex}`,
    order: (lastSequenceByExchange.get(snapshot.exchangeIndex) ?? 0) * 10 + 5,
    label: "Judge note",
    tone: "judge",
    text: snapshot.playerSummary,
  }));
  const committedSequenceIndexes = new Set(
    session.transcript.map((message) => message.sequenceIndex),
  );
  const draftItems: TranscriptItem[] = streamingDrafts
    .filter((draft) => !committedSequenceIndexes.has(draft.sequenceIndex))
    .map((draft) => {
      const member = members.find((candidate) => candidate.id === draft.speakerId);

      return {
        id: draft.id,
        order: draft.sequenceIndex * 10,
        label: member?.firstName ?? draft.speakerName,
        tone: "member",
        text: draft.text,
        member,
        isDraft: true,
        isStreaming: draft.status === "streaming",
      };
    });

  return [...messageItems, ...draftItems, ...judgeItems].sort(
    (first, second) => first.order - second.order,
  );
}

function buildNonCharacterLabel(
  message: Extract<DateMessage, { kind: "scenario" | "cupid" | "system" }>,
  session: DateSession,
  members: Member[],
  scenario: DateScenario | undefined,
): { label: string; targetName?: string } {
  if (message.kind === "scenario") {
    return { label: scenario?.title ?? "Scenario" };
  }

  if (message.kind === "cupid") {
    const matchingIntervention = session.interventions.find(
      (intervention) =>
        message.turnIndex === intervention.usedAtTurn &&
        message.text === formatCupidInterventionText(intervention.text),
    );
    const targetId = message.targetMemberId ?? matchingIntervention?.targetMemberId;
    const target =
      targetId === undefined ? undefined : members.find((member) => member.id === targetId);

    return { label: "private nudge", targetName: target?.firstName };
  }

  return { label: "System" };
}

function buildReactionSignals(
  judgeSnapshots: readonly JudgeSnapshot[],
  leftMemberId: string,
  rightMemberId: string,
): ReactionSignal[] {
  const latestJudge = judgeSnapshots.at(-1);

  if (latestJudge === undefined) {
    return [];
  }

  const signals: ReactionSignal[] = [];
  const participants = [
    { memberId: leftMemberId, side: "left" as const },
    { memberId: rightMemberId, side: "right" as const },
  ];
  const dateDelta = latestJudge.dateHealthDelta;
  const sparkDelta = latestJudge.statDeltas.spark ?? 0;
  const chemistryDelta = latestJudge.statDeltas.chemistry ?? 0;
  const trustDelta = latestJudge.statDeltas.trust ?? 0;
  const stabilityDelta = latestJudge.statDeltas.stability ?? 0;
  const relationshipDelta = latestJudge.statDeltas.relationshipHealth ?? 0;
  const strainDelta = latestJudge.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge.statDeltas.conflict ?? 0;
  const textSignal = [latestJudge.playerSummary, ...latestJudge.notableMoments]
    .join(" ")
    .toLowerCase();
  const sharedPositive = Math.max(dateDelta, sparkDelta, chemistryDelta, relationshipDelta);
  const sharedCare = Math.max(trustDelta, stabilityDelta);
  const sharedTrouble = Math.max(-dateDelta, strainDelta, conflictDelta);

  for (const participant of participants) {
    const moodDelta = latestJudge.memberMoodDeltas[participant.memberId] ?? 0;

    if (sharedPositive > 0 || moodDelta > 0) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "spark",
        Math.max(sharedPositive, moodDelta),
      );
    }

    if (sparkDelta >= 3 || chemistryDelta >= 3 || moodDelta >= 3) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "love",
        Math.max(sparkDelta, chemistryDelta, moodDelta),
      );
    }

    if (sharedCare >= 3) {
      pushReaction(signals, latestJudge, participant.side, "love", sharedCare);
    }

    if (
      textSignal.includes("laugh") ||
      textSignal.includes("joke") ||
      textSignal.includes("funny")
    ) {
      pushReaction(signals, latestJudge, participant.side, "laugh", 3);
    }

    if (sharedTrouble >= 4 || latestJudge.shouldEndEarly) {
      pushReaction(signals, latestJudge, participant.side, "anger", sharedTrouble);
    } else if (sharedTrouble > 0) {
      pushReaction(signals, latestJudge, participant.side, "warning", sharedTrouble);
    }

    if (moodDelta <= -3) {
      pushReaction(signals, latestJudge, participant.side, "cry", Math.abs(moodDelta));
    }
  }

  return signals;
}

function buildNudgeSuggestions(judgeSnapshots: readonly JudgeSnapshot[]): string[] {
  const latestJudge = judgeSnapshots.at(-1);
  const baseSuggestions = [
    "Ask one specific follow-up before changing topic.",
    "Move past logistics and name one honest feeling.",
    "Ground the room in a practical choice both people can answer.",
  ];

  if (latestJudge === undefined) {
    return baseSuggestions;
  }

  const strainDelta = latestJudge.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge.statDeltas.conflict ?? 0;
  const sparkDelta = latestJudge.statDeltas.spark ?? 0;
  const trustDelta = latestJudge.statDeltas.trust ?? 0;

  if (latestJudge.shouldEndEarly || strainDelta >= 4 || conflictDelta >= 4) {
    return [
      "Name the boundary and offer a clean exit.",
      "Ask one specific follow-up before changing topic.",
      "Ground the room in a practical choice both people can answer.",
    ];
  }

  if (sparkDelta <= 0 && trustDelta <= 0) {
    return [
      "Ask one specific follow-up before changing topic.",
      "Move past logistics and name one honest feeling.",
      "Let the partner choose the next small plan.",
    ];
  }

  return baseSuggestions;
}

function pushReaction(
  signals: ReactionSignal[],
  judgeSnapshot: JudgeSnapshot,
  side: ReactionSignal["side"],
  kind: ReactionKind,
  value: number,
) {
  const sideCount = signals.filter((signal) => signal.side === side).length;

  if (sideCount >= 4 || signals.some((signal) => signal.side === side && signal.kind === kind)) {
    return;
  }

  signals.push({
    id: `${judgeSnapshot.id}-${side}-${kind}`,
    side,
    kind,
    intensity: reactionIntensity(value),
  });
}

function reactionIntensity(value: number): ReactionIntensity {
  const magnitude = Math.abs(value);

  if (magnitude >= 6) {
    return 3;
  }

  if (magnitude >= 3) {
    return 2;
  }

  return 1;
}
