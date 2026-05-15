import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EASE_OUT_QUART, Eyebrow, MutedLabel, Portrait } from "../../../components/dashboard-atoms";
import {
  HOUSE_BUBBLE_LEFT_CLASS,
  HOUSE_BUBBLE_NAME_CLASS,
  resolveMemberChatBubbleStyle,
} from "../../../components/member-chat-bubble-style";
import { type Member, type PortraitMood } from "../../../domain/game";
import { starterMembers } from "../../../fixtures";
import { TestHeader } from "../shared";

type VoiceSampleGroup = "opener" | "warming" | "cooling" | "crashingOut";

const VOICE_SAMPLE_GROUPS: ReadonlyArray<{ id: VoiceSampleGroup; label: string }> = [
  { id: "opener", label: "Opener" },
  { id: "warming", label: "Warming" },
  { id: "cooling", label: "Cooling" },
  { id: "crashingOut", label: "Crashing out" },
];

const PORTRAIT_MOODS: ReadonlyArray<PortraitMood> = ["neutral", "flirty", "confused", "angry"];

const STATE_GAUGE_FIELDS: ReadonlyArray<{
  id: "mood" | "openness" | "burnout" | "retention";
  label: string;
  accent: string;
}> = [
  { id: "mood", label: "Mood", accent: "from-aura-rose to-aura-fuchsia" },
  { id: "openness", label: "Openness", accent: "from-aura-amber to-aura-rose" },
  { id: "burnout", label: "Burnout", accent: "from-aura-violet to-aura-fuchsia" },
  { id: "retention", label: "Retention", accent: "from-aura-emerald to-aura-amber" },
];

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

function readableTag(tag: string): string {
  return tag.replaceAll("_", " ");
}

export function AllMembersTest() {
  const [selectedId, setSelectedId] = useState<string>(starterMembers[0].id);
  const [search, setSearch] = useState("");
  const [voiceGroup, setVoiceGroup] = useState<VoiceSampleGroup>("opener");
  const [mood, setMood] = useState<PortraitMood>("neutral");
  const rosterRef = useRef<HTMLDivElement>(null);
  const dossierScrollRef = useRef<HTMLDivElement>(null);

  const sortedMembers = useMemo(
    () =>
      [...starterMembers].sort((first, second) => first.firstName.localeCompare(second.firstName)),
    [],
  );

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return sortedMembers;
    }
    return sortedMembers.filter((member) => {
      return (
        member.name.toLowerCase().includes(query) ||
        member.firstName.toLowerCase().includes(query) ||
        member.species.toLowerCase().includes(query) ||
        member.dimension.toLowerCase().includes(query) ||
        member.origin.toLowerCase().includes(query) ||
        member.tags.some((tag) => tag.includes(query))
      );
    });
  }, [sortedMembers, search]);

  const selected = useMemo(
    () => starterMembers.find((member) => member.id === selectedId) ?? starterMembers[0],
    [selectedId],
  );

  useEffect(() => {
    setVoiceGroup("opener");
    setMood("neutral");
    const dossierEl = dossierScrollRef.current;
    if (dossierEl !== null) {
      dossierEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedId]);

  useEffect(() => {
    const roster = rosterRef.current;
    if (roster === null) {
      return;
    }
    const row = roster.querySelector<HTMLElement>(`[data-roster-id="${selectedId}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  function handleArrowNavigation(event: React.KeyboardEvent<HTMLDivElement>) {
    if (filteredMembers.length === 0) {
      return;
    }
    const currentIndex = filteredMembers.findIndex((member) => member.id === selectedId);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex =
        currentIndex === -1 ? 0 : Math.min(currentIndex + 1, filteredMembers.length - 1);
      setSelectedId(filteredMembers[nextIndex].id);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
      setSelectedId(filteredMembers[nextIndex].id);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Member dossier"
        description="Every field from every member fixture, in one developer-grade reading view. Use the rail to flip between files. Avatars on the left help when names go fuzzy."
      />

      <div
        onKeyDown={handleArrowNavigation}
        tabIndex={-1}
        className="grid gap-5 outline-none lg:grid-cols-[20rem_minmax(0,1fr)]"
      >
        <RosterRail
          rosterRef={rosterRef}
          members={filteredMembers}
          totalCount={starterMembers.length}
          search={search}
          selectedId={selectedId}
          onSearch={setSearch}
          onSelect={setSelectedId}
        />

        <div
          ref={dossierScrollRef}
          className="max-h-[calc(100vh-12rem)] min-w-0 space-y-5 overflow-y-auto pr-1"
        >
          <DossierHero member={selected} mood={mood} onMoodChange={setMood} />
          <DossierBio member={selected} />
          <DossierTags member={selected} />
          <DossierWantsAndBoundaries member={selected} />
          <DossierVoice member={selected} group={voiceGroup} onGroupChange={setVoiceGroup} />
          <DossierState member={selected} />
          <DossierPortraitGallery member={selected} />
          <DossierChatBubble member={selected} />
        </div>
      </div>
    </motion.section>
  );
}

/* ================================================================== */
/* Roster rail                                                        */
/* ================================================================== */

function RosterRail({
  rosterRef,
  members,
  totalCount,
  search,
  selectedId,
  onSearch,
  onSelect,
}: {
  rosterRef: React.RefObject<HTMLDivElement | null>;
  members: readonly Member[];
  totalCount: number;
  search: string;
  selectedId: string;
  onSearch: (value: string) => void;
  onSelect: (memberId: string) => void;
}) {
  return (
    <aside className="aura-glass sticky top-28 flex h-[calc(100vh-9rem)] flex-col gap-3 rounded-card p-3">
      <div className="flex items-baseline justify-between gap-3 px-2 pt-1">
        <MutedLabel>roster</MutedLabel>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint tabular-nums">
          {members.length}/{totalCount}
        </span>
      </div>

      <label className="relative block px-1">
        <span className="sr-only">Search members</span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint"
        >
          /
        </span>
        <input
          type="text"
          value={search}
          onChange={(event) => onSearch(event.currentTarget.value)}
          placeholder="filter name, species, tag"
          className="block w-full rounded-pill border border-aura-hairline bg-white/65 py-2 pl-8 pr-3 font-mono text-micro uppercase tracking-[0.18em] text-aura-ink outline-none placeholder:text-aura-faint focus:border-aura-rose"
        />
      </label>

      <div
        ref={rosterRef}
        role="listbox"
        aria-label="Member roster"
        className="-mr-2 flex-1 space-y-1 overflow-y-auto pr-2"
      >
        {members.length === 0 ? (
          <p className="px-3 py-6 text-center text-label text-aura-faint">
            No members match that filter.
          </p>
        ) : (
          members.map((member) => (
            <RosterRow
              key={member.id}
              member={member}
              selected={member.id === selectedId}
              onSelect={() => onSelect(member.id)}
            />
          ))
        )}
      </div>

      <p className="px-3 pb-1 font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
        <span className="text-aura-muted">arrow keys</span> walk the rail
      </p>
    </aside>
  );
}

function RosterRow({
  member,
  selected,
  onSelect,
}: {
  member: Member;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-roster-id={member.id}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-tile px-2.5 py-2 text-left transition ${
        selected
          ? "aura-glass-ink shadow-[0_10px_30px_-16px_rgba(15,23,42,0.6)]"
          : "hover:bg-white/55"
      }`}
    >
      <div className={selected ? "ring-2 ring-white/70" : "ring-1 ring-white/70"}>
        <Portrait member={member} variant="thumb" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-display text-body font-semibold tracking-tight ${
            selected ? "text-white" : "text-aura-ink"
          }`}
        >
          {member.firstName}
        </p>
        <p
          className={`truncate font-mono text-micro uppercase tracking-[0.18em] ${
            selected ? "text-white/70" : "text-aura-faint"
          }`}
        >
          {member.species}
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-micro tabular-nums tracking-[0.1em] ${
          selected ? "text-white/80" : "text-aura-muted"
        }`}
      >
        {formatHeight(member.characterHeightInInches)}
      </span>
    </button>
  );
}

/* ================================================================== */
/* Hero band                                                          */
/* ================================================================== */

function DossierHero({
  member,
  mood,
  onMoodChange,
}: {
  member: Member;
  mood: PortraitMood;
  onMoodChange: (mood: PortraitMood) => void;
}) {
  const availableMoods = PORTRAIT_MOODS.filter((entry) => {
    if (entry === "neutral") {
      return true;
    }
    return member.portraits[entry] !== undefined;
  });
  const lifecycle = member.state.status;
  const lifecycleClass =
    lifecycle === "active"
      ? "bg-aura-emerald/15 text-aura-emerald ring-aura-emerald/30"
      : lifecycle === "closed"
        ? "bg-aura-faint/15 text-aura-muted ring-aura-faint/30"
        : "bg-aura-rose/15 text-aura-rose ring-aura-rose/30";

  return (
    <motion.article
      key={`hero-${member.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
      className="aura-glass relative overflow-hidden rounded-card"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-12 size-72 rounded-full bg-aura-mesh-rose/40 blur-3xl" />
        <div className="absolute -bottom-20 right-0 size-72 rounded-full bg-aura-mesh-violet/45 blur-3xl" />
      </div>

      <div className="relative grid gap-6 p-6 md:grid-cols-[14rem_minmax(0,1fr)] md:p-7">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Portrait member={member} variant="hero" asset="portrait" mood={mood} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {availableMoods.map((entry) => {
              const active = entry === mood;
              return (
                <button
                  key={entry}
                  type="button"
                  onClick={() => onMoodChange(entry)}
                  className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro uppercase tracking-[0.18em] transition ${
                    active
                      ? "bg-aura-ink text-white"
                      : "border border-aura-hairline bg-white/60 text-aura-muted hover:text-aura-ink"
                  }`}
                >
                  {entry}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <Eyebrow>// file.{member.id}</Eyebrow>
            <span
              className={`rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] ring-1 ${lifecycleClass}`}
            >
              {lifecycle}
            </span>
          </div>

          <h2 className="font-display text-display-lg font-semibold leading-[0.95] tracking-tight text-aura-ink">
            {member.firstName}
            <span className="aura-accent text-display-lg text-aura-rose">.</span>
          </h2>

          <p className="font-display text-body font-semibold tracking-tight text-aura-muted">
            {member.name}
          </p>

          <dl className="grid gap-2 sm:grid-cols-2">
            <IdentityRow label="Species" value={member.species} />
            <IdentityRow label="Dimension" value={member.dimension} />
            <IdentityRow label="Origin" value={member.origin} />
            <IdentityRow label="Reality" value={member.realityStatus} />
            <IdentityRow
              label="Height"
              value={`${formatHeight(member.characterHeightInInches)} (${member.characterHeightInInches}")`}
            />
            <IdentityRow
              label="Standee"
              value={`${formatHeight(member.standeeRenderHeightInInches)} (${member.standeeRenderHeightInInches}")`}
            />
          </dl>
        </div>
      </div>
    </motion.article>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-tile border border-aura-hairline bg-white/55 px-3 py-2">
      <dt className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-sm font-semibold leading-snug tracking-tight text-aura-ink">
        {value}
      </dd>
    </div>
  );
}

/* ================================================================== */
/* Bio + dating profile + visual description                          */
/* ================================================================== */

function DossierBio({ member }: { member: Member }) {
  return (
    <section className="aura-glass space-y-5 rounded-card p-6 md:p-7">
      <SectionHeader label="// narrative" title="Bio, profile, visual" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <BodyBlock title="Bio">
          <p className="text-body leading-relaxed text-aura-ink/90">{member.bio}</p>
        </BodyBlock>
        <BodyBlock title="Dating profile">
          <p className="text-body italic leading-relaxed text-aura-ink/85">
            {member.datingProfile}
          </p>
        </BodyBlock>
        <BodyBlock title="Visual description">
          <p className="text-body leading-relaxed text-aura-muted">{member.visualDescription}</p>
        </BodyBlock>
      </div>
    </section>
  );
}

function BodyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-tile border border-aura-hairline bg-white/55 p-4">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </article>
  );
}

/* ================================================================== */
/* Tags                                                                */
/* ================================================================== */

function DossierTags({ member }: { member: Member }) {
  return (
    <section className="aura-glass rounded-card p-6 md:p-7">
      <SectionHeader label="// gameplay tags" title="Identity and dispositions" />
      <ul className="mt-4 flex flex-wrap gap-2">
        {member.tags.map((tag) => {
          const isIdentity = tag === "ordinary_human" || tag === "non_human";
          return (
            <li
              key={tag}
              className={`rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] ring-1 ${
                isIdentity
                  ? "bg-aura-ink text-white ring-aura-ink"
                  : "bg-aura-rose/10 text-aura-rose ring-aura-rose/25"
              }`}
            >
              {readableTag(tag)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ================================================================== */
/* Wants & boundaries (needs/preferences/dealbreakers/secrets)         */
/* ================================================================== */

function DossierWantsAndBoundaries({ member }: { member: Member }) {
  return (
    <section className="aura-glass space-y-5 rounded-card p-6 md:p-7">
      <SectionHeader label="// wants and boundaries" title="What this file wants on file" />
      <div className="grid gap-4 lg:grid-cols-2">
        <ListPanel
          title="Looking for"
          accent="rose"
          items={member.relationshipNeeds}
          emptyText="No needs on file."
        />
        <ListPanel
          title="Preferences"
          accent="amber"
          items={member.preferences}
          emptyText="No soft reads filed."
        />
        <ListPanel
          title="Dealbreakers"
          accent="ink"
          items={member.dealbreakers}
          emptyText="None on file."
        />
        <ListPanel
          title="Secrets"
          accent="violet"
          items={member.secrets}
          emptyText="No secrets on file."
        />
      </div>
    </section>
  );
}

function ListPanel({
  title,
  items,
  emptyText,
  accent,
}: {
  title: string;
  items: readonly string[];
  emptyText: string;
  accent: "rose" | "amber" | "ink" | "violet";
}) {
  const accentClass =
    accent === "rose"
      ? "text-aura-rose"
      : accent === "amber"
        ? "text-aura-amber"
        : accent === "violet"
          ? "text-aura-violet"
          : "text-aura-ink";
  const bulletClass =
    accent === "rose"
      ? "bg-aura-rose"
      : accent === "amber"
        ? "bg-aura-amber"
        : accent === "violet"
          ? "bg-aura-violet"
          : "bg-aura-ink";

  return (
    <article className="rounded-tile border border-aura-hairline bg-white/55 p-4">
      <header className="flex items-baseline justify-between">
        <p
          className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${accentClass}`}
        >
          {title}
        </p>
        <span className="font-mono text-micro tabular-nums tracking-[0.18em] text-aura-faint">
          {items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <p className="mt-3 text-label italic text-aura-faint">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((entry) => (
            <li
              key={entry}
              className="flex items-start gap-2.5 text-label leading-snug text-aura-ink/90"
            >
              <span aria-hidden className={`mt-2 size-1.5 shrink-0 rounded-full ${bulletClass}`} />
              <span className="min-w-0 flex-1">{entry}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ================================================================== */
/* Voice                                                              */
/* ================================================================== */

function DossierVoice({
  member,
  group,
  onGroupChange,
}: {
  member: Member;
  group: VoiceSampleGroup;
  onGroupChange: (group: VoiceSampleGroup) => void;
}) {
  const samples = member.voice.sampleMessages[group];

  return (
    <section className="aura-glass space-y-5 rounded-card p-6 md:p-7">
      <SectionHeader label="// voice" title="How this file talks on the line" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <article className="rounded-tile border border-aura-hairline bg-white/55 p-4">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
              Register
            </p>
            <p className="mt-2 font-display text-base font-semibold tracking-tight text-aura-ink">
              {member.voice.register}
            </p>
          </article>

          <PatternChips
            title="Patterns used"
            tone="positive"
            patterns={member.voice.patternsUsed}
          />
          <PatternChips
            title="Patterns refused"
            tone="negative"
            patterns={member.voice.patternsRefused}
          />

          <article className="rounded-tile border border-aura-hairline bg-white/55 p-4">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
              Tics
            </p>
            <ul className="mt-2 space-y-1.5">
              {member.voice.tics.map((tic) => (
                <li
                  key={tic}
                  className="flex items-start gap-2.5 text-label leading-snug text-aura-ink/90"
                >
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-aura-fuchsia"
                  />
                  <span>{tic}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="rounded-tile border border-aura-hairline bg-white/55 p-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
              Sample messages
            </p>
            <div className="inline-flex items-center gap-1 rounded-pill bg-aura-ink/5 p-1">
              {VOICE_SAMPLE_GROUPS.map((entry) => {
                const active = entry.id === group;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onGroupChange(entry.id)}
                    className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] transition ${
                      active ? "bg-aura-ink text-white" : "text-aura-muted hover:text-aura-ink"
                    }`}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </header>

          <ul className="mt-4 space-y-3">
            {samples.map((sample, index) => (
              <li
                key={`${group}-${index}`}
                className="rounded-tile border border-aura-hairline bg-aura-paper px-4 py-3 text-body italic leading-relaxed text-aura-ink/90 shadow-quiet"
              >
                <span
                  aria-hidden
                  className="mr-2 font-mono text-micro not-italic tracking-[0.18em] text-aura-faint"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {sample}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PatternChips({
  title,
  tone,
  patterns,
}: {
  title: string;
  tone: "positive" | "negative";
  patterns: readonly string[];
}) {
  const baseClass =
    tone === "positive"
      ? "bg-aura-emerald/10 text-aura-emerald ring-aura-emerald/25"
      : "bg-aura-faint/15 text-aura-muted ring-aura-hairline-strong line-through decoration-aura-rose/50";

  return (
    <article className="rounded-tile border border-aura-hairline bg-white/55 p-4">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
        {title}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {patterns.map((pattern) => (
          <li
            key={pattern}
            className={`rounded-pill px-2.5 py-1 font-mono text-micro uppercase tracking-[0.16em] ring-1 ${baseClass}`}
          >
            {readableTag(pattern)}
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ================================================================== */
/* State                                                              */
/* ================================================================== */

function DossierState({ member }: { member: Member }) {
  return (
    <section className="aura-glass space-y-5 rounded-card p-6 md:p-7">
      <SectionHeader label="// state" title="Live runtime values" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATE_GAUGE_FIELDS.map((field) => (
          <StateGauge
            key={field.id}
            label={field.label}
            value={member.state[field.id]}
            accent={field.accent}
          />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <KeyValueRow label="Status" value={member.state.status} />
        <KeyValueRow label="Current request" value={member.state.currentRequestId ?? "(none)"} />
        <KeyValueRow
          label="Last shift"
          value={
            member.state.lastDateShift === undefined
              ? "(none)"
              : `shift ${member.state.lastDateShift}`
          }
        />
        <KeyValueRow label="Recent date result" value={member.state.recentDateResult ?? "(none)"} />
      </div>
    </section>
  );
}

function StateGauge({ label, value, accent }: { label: string; value: number; accent: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const widthClass = stateGaugeWidthClass(clamped);

  return (
    <article className="rounded-tile border border-aura-hairline bg-white/55 p-4">
      <header className="flex items-baseline justify-between">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
          {label}
        </p>
        <span className="font-mono text-base font-semibold tabular-nums text-aura-ink">
          {value}
        </span>
      </header>
      <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-aura-ink/5">
        <div className={`h-full rounded-pill bg-gradient-to-r ${accent} ${widthClass}`} />
      </div>
    </article>
  );
}

const STATE_GAUGE_WIDTH_CLASSES = [
  "w-0",
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-[50%]",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-full",
] as const;

function stateGaugeWidthClass(score: number): (typeof STATE_GAUGE_WIDTH_CLASSES)[number] {
  const index = Math.round(score / 5);
  return STATE_GAUGE_WIDTH_CLASSES[index] ?? "w-full";
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 rounded-tile border border-aura-hairline bg-white/55 px-3 py-2">
      <span className="shrink-0 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold tracking-tight text-aura-ink">
        {value}
      </span>
    </div>
  );
}

/* ================================================================== */
/* Portrait gallery                                                   */
/* ================================================================== */

function DossierPortraitGallery({ member }: { member: Member }) {
  type GalleryEntry = { mood: PortraitMood; sourcePath: string; cutoutPath: string };
  const entries: GalleryEntry[] = [];
  for (const mood of PORTRAIT_MOODS) {
    if (mood === "neutral") {
      entries.push({
        mood,
        sourcePath: member.portraits.neutral.portrait.sourcePath,
        cutoutPath: member.portraits.neutral.portrait.cutoutPath,
      });
      continue;
    }
    const variant = member.portraits[mood];
    if (variant === undefined) {
      continue;
    }
    entries.push({
      mood,
      sourcePath: variant.portrait.sourcePath,
      cutoutPath: variant.portrait.cutoutPath,
    });
  }

  return (
    <section className="aura-glass space-y-5 rounded-card p-6 md:p-7">
      <SectionHeader label="// portraits" title={`Mood variants (${entries.length}/4)`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entries.map((entry) => (
          <article
            key={entry.mood}
            className="overflow-hidden rounded-tile border border-aura-hairline bg-white/55"
          >
            <div className="grid h-44 place-items-center bg-gradient-to-b from-aura-mesh-rose/30 via-transparent to-aura-mesh-violet/25">
              <Portrait member={member} variant="card" asset="portrait" mood={entry.mood} />
            </div>
            <div className="space-y-2 border-t border-aura-hairline px-3 py-3">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
                {entry.mood}
              </p>
              <PathLine label="src" path={entry.sourcePath} />
              <PathLine label="cut" path={entry.cutoutPath} />
            </div>
          </article>
        ))}
        <article className="overflow-hidden rounded-tile border border-aura-hairline bg-white/55">
          <div className="grid h-44 place-items-center bg-gradient-to-b from-aura-mesh-amber/30 via-transparent to-aura-mesh-rose/20">
            <Portrait member={member} variant="card" asset="avatar" />
          </div>
          <div className="space-y-2 border-t border-aura-hairline px-3 py-3">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
              avatar (chat)
            </p>
            <PathLine label="src" path={member.portraits.neutral.avatar.sourcePath} />
            <PathLine label="cut" path={member.portraits.neutral.avatar.cutoutPath} />
          </div>
        </article>
      </div>
    </section>
  );
}

function PathLine({ label, path }: { label: string; path: string }) {
  return (
    <p className="flex items-baseline gap-2 font-mono text-micro leading-tight tracking-[0.04em]">
      <span className="shrink-0 font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-all text-aura-ink/80">{path}</span>
    </p>
  );
}

/* ================================================================== */
/* Chat bubble                                                        */
/* ================================================================== */

function DossierChatBubble({ member }: { member: Member }) {
  const customBubble = member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const bubbleClass = customBubble ? customBubble.className : HOUSE_BUBBLE_LEFT_CLASS;
  const bubbleStyle = customBubble?.style;
  const accentStyle = customBubble?.accentStyle;
  const textColorClass = customBubble ? "" : "text-white";
  const nameClass = customBubble
    ? "text-[color:var(--member-bubble-accent)] opacity-80"
    : HOUSE_BUBBLE_NAME_CLASS;

  const sample =
    member.voice.sampleMessages.opener[0] ??
    "Saturday works. Pick the place once, confirm the hour, and let the room stay quiet.";

  const axes = describeBubbleAxes(member);

  return (
    <section className="aura-glass space-y-5 rounded-card p-6 md:p-7">
      <SectionHeader
        label="// chat bubble"
        title={customBubble ? "Custom bubble style" : "Uses house default"}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-tile border border-aura-hairline bg-aura-paper p-5 shadow-quiet">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
            Preview
          </p>
          <div className="mt-4 flex justify-start">
            <div className="flex max-w-[88%] flex-col items-start gap-2" style={accentStyle}>
              <span
                className={`relative z-20 px-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-left ${nameClass}`}
              >
                {member.firstName}
              </span>
              <div className={bubbleClass} style={bubbleStyle}>
                <p className={`text-body leading-relaxed ${textColorClass}`}>{sample}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-tile border border-aura-hairline bg-white/55 p-4">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
            Axes
          </p>
          {axes.length === 0 ? (
            <p className="mt-3 text-label italic text-aura-faint">
              No custom bubble. Falls through to the house default (blue gradient, rounded shape).
            </p>
          ) : (
            <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {axes.map((axis) => (
                <div
                  key={axis.label}
                  className="flex items-baseline gap-2 rounded-pill border border-aura-hairline bg-white/65 px-3 py-1.5"
                >
                  <dt className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                    {axis.label}
                  </dt>
                  <dd className="min-w-0 flex-1 truncate font-mono text-micro uppercase tracking-[0.18em] text-aura-ink">
                    {axis.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function describeBubbleAxes(member: Member): ReadonlyArray<{ label: string; value: string }> {
  const bubble = member.chatBubble;
  if (bubble === undefined) {
    return [];
  }
  const axes: Array<{ label: string; value: string }> = [];
  axes.push({
    label: "bg",
    value:
      bubble.background.kind === "solid"
        ? `solid ${bubble.background.color}`
        : `gradient ${bubble.background.angle}deg · ${bubble.background.stops.length} stops`,
  });
  axes.push({ label: "shape", value: bubble.shape });
  axes.push({ label: "text", value: bubble.textColor });
  if (bubble.tail !== undefined) {
    axes.push({ label: "tail", value: bubble.tail });
  }
  if (bubble.border !== undefined && bubble.border !== "none") {
    axes.push({ label: "border", value: bubble.border });
  }
  if (bubble.glow !== undefined) {
    axes.push({ label: "glow", value: `${bubble.glow.intensity} ${bubble.glow.color}` });
  }
  if (bubble.texture !== undefined) {
    axes.push({ label: "texture", value: bubble.texture });
  }
  if (bubble.entryAnimation !== undefined) {
    axes.push({ label: "anim", value: bubble.entryAnimation });
  }
  if (bubble.fontFamily !== undefined) {
    axes.push({ label: "font", value: bubble.fontFamily });
  }
  if (bubble.textEffect !== undefined) {
    axes.push({ label: "fx", value: bubble.textEffect });
  }
  if (bubble.accentColor !== undefined) {
    axes.push({ label: "accent", value: bubble.accentColor });
  }
  return axes;
}

/* ================================================================== */
/* Section header helper                                              */
/* ================================================================== */

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <header className="space-y-1">
      <Eyebrow>{label}</Eyebrow>
      <h3 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
        {title}
      </h3>
    </header>
  );
}
