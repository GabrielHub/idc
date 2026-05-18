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

type VoiceSampleGroup = "greeting" | "hingeBits" | "warming" | "cooling" | "crashingOut";

const VOICE_SAMPLE_GROUPS: ReadonlyArray<{ id: VoiceSampleGroup; label: string }> = [
  { id: "greeting", label: "Greeting" },
  { id: "hingeBits", label: "Hinge bits" },
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
  { id: "openness", label: "Open", accent: "from-aura-amber to-aura-rose" },
  { id: "burnout", label: "Burn", accent: "from-aura-violet to-aura-fuchsia" },
  { id: "retention", label: "Hold", accent: "from-aura-emerald to-aura-amber" },
];

const ALPHABET_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

function readableTag(tag: string): string {
  return tag.replaceAll("_", " ");
}

function startLetter(member: Member): string {
  return member.firstName.charAt(0).toUpperCase();
}

export function AllMembersTest() {
  const [selectedId, setSelectedId] = useState<string>(starterMembers[0].id);
  const [search, setSearch] = useState("");
  const [voiceGroup, setVoiceGroup] = useState<VoiceSampleGroup>("greeting");
  const [mood, setMood] = useState<PortraitMood>("neutral");
  const rosterScrollRef = useRef<HTMLDivElement>(null);

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

  const groupedMembers = useMemo(() => {
    const groups: Array<{ letter: string; members: Member[] }> = [];
    const seen = new Map<string, Member[]>();
    for (const member of filteredMembers) {
      const letter = startLetter(member);
      const existing = seen.get(letter);
      if (existing === undefined) {
        const list: Member[] = [member];
        seen.set(letter, list);
        groups.push({ letter, members: list });
      } else {
        existing.push(member);
      }
    }
    return groups;
  }, [filteredMembers]);

  const activeLetters = useMemo(() => {
    return new Set(groupedMembers.map((group) => group.letter));
  }, [groupedMembers]);

  const selected = useMemo(
    () => starterMembers.find((member) => member.id === selectedId) ?? starterMembers[0],
    [selectedId],
  );

  const selectedIndex = useMemo(
    () => sortedMembers.findIndex((member) => member.id === selectedId),
    [sortedMembers, selectedId],
  );

  useEffect(() => {
    setVoiceGroup("greeting");
    setMood("neutral");
  }, [selectedId]);

  useEffect(() => {
    const rosterEl = rosterScrollRef.current;
    if (rosterEl === null) {
      return;
    }
    const row = rosterEl.querySelector<HTMLElement>(`[data-roster-id="${selectedId}"]`);
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

  function handleJumpToLetter(letter: string) {
    const rosterEl = rosterScrollRef.current;
    if (rosterEl === null) {
      return;
    }
    const section = rosterEl.querySelector<HTMLElement>(`[data-letter-section="${letter}"]`);
    if (section === null) {
      return;
    }
    section.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const currentLetter = startLetter(selected);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Member dossier"
        description="Forty-two case files filed under the Aura cream wash. The spine on the left jumps the index. The rail loads a file. Riffle through the file with page scroll."
      />

      <div
        onKeyDown={handleArrowNavigation}
        tabIndex={-1}
        className="grid gap-4 outline-none lg:grid-cols-[2.75rem_14rem_minmax(0,1fr)]"
      >
        <AlphabetRail
          activeLetters={activeLetters}
          currentLetter={currentLetter}
          onJump={handleJumpToLetter}
        />
        <RosterPanel
          rosterScrollRef={rosterScrollRef}
          groups={groupedMembers}
          totalCount={starterMembers.length}
          shownCount={filteredMembers.length}
          search={search}
          selectedId={selectedId}
          onSearch={setSearch}
          onSelect={setSelectedId}
        />

        <div className="min-w-0 space-y-6">
          <CoverSpread
            member={selected}
            mood={mood}
            onMoodChange={setMood}
            index={selectedIndex}
            total={sortedMembers.length}
          />
          <PageMarker label="page 02" subtitle="voice and boundaries" />
          <VoiceSpread member={selected} group={voiceGroup} onGroupChange={setVoiceGroup} />
          <BoundariesQuad member={selected} />
          <PageMarker label="page 03" subtitle="visuals and chat" />
          <ContactSheet member={selected} />
          <BubbleTest member={selected} />
        </div>
      </div>
    </motion.section>
  );
}

/* ================================================================== */
/* Alphabet spine                                                     */
/* ================================================================== */

function AlphabetRail({
  activeLetters,
  currentLetter,
  onJump,
}: {
  activeLetters: ReadonlySet<string>;
  currentLetter: string;
  onJump: (letter: string) => void;
}) {
  return (
    <aside className="aura-glass sticky top-28 flex h-[calc(100vh-9rem)] flex-col items-center justify-between rounded-card px-1 py-3">
      <span
        aria-hidden
        className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint"
      >
        a
      </span>
      <ol className="flex flex-1 flex-col items-center justify-center gap-px py-2">
        {ALPHABET_LETTERS.map((letter) => {
          const enabled = activeLetters.has(letter);
          const current = enabled && letter === currentLetter;
          const toneClass = current
            ? "bg-aura-ink text-white shadow-[0_6px_18px_-10px_rgba(15,23,42,0.6)]"
            : enabled
              ? "text-aura-muted hover:text-aura-rose"
              : "text-aura-faint/40";
          return (
            <li key={letter}>
              <button
                type="button"
                onClick={enabled ? () => onJump(letter) : undefined}
                disabled={!enabled}
                aria-label={`Jump to ${letter}`}
                aria-current={current ? "true" : undefined}
                className={`grid size-6 place-items-center rounded-pill font-mono text-micro font-semibold uppercase tracking-[0.04em] transition ${
                  enabled ? "cursor-pointer" : "cursor-not-allowed"
                } ${toneClass}`}
              >
                {letter}
              </button>
            </li>
          );
        })}
      </ol>
      <span
        aria-hidden
        className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint"
      >
        z
      </span>
    </aside>
  );
}

/* ================================================================== */
/* Roster panel                                                       */
/* ================================================================== */

function RosterPanel({
  rosterScrollRef,
  groups,
  totalCount,
  shownCount,
  search,
  selectedId,
  onSearch,
  onSelect,
}: {
  rosterScrollRef: React.RefObject<HTMLDivElement | null>;
  groups: ReadonlyArray<{ letter: string; members: Member[] }>;
  totalCount: number;
  shownCount: number;
  search: string;
  selectedId: string;
  onSearch: (value: string) => void;
  onSelect: (memberId: string) => void;
}) {
  return (
    <aside className="aura-glass sticky top-28 flex h-[calc(100vh-9rem)] flex-col rounded-card p-3">
      <header className="flex items-baseline justify-between gap-3 px-2 pt-1">
        <MutedLabel>index</MutedLabel>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint tabular-nums">
          {shownCount}/{totalCount}
        </span>
      </header>

      <label className="relative mt-3 block px-1">
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
          placeholder="filter"
          className="block w-full rounded-pill border border-aura-hairline bg-white/65 py-2 pl-8 pr-3 font-mono text-micro uppercase tracking-[0.18em] text-aura-ink outline-none placeholder:text-aura-faint focus:border-aura-rose"
        />
      </label>

      <div
        ref={rosterScrollRef}
        role="listbox"
        aria-label="Member roster"
        className="-mr-2 mt-3 flex-1 overflow-y-auto pr-2"
      >
        {shownCount === 0 ? (
          <p className="px-3 py-6 text-center text-label text-aura-faint">No files match.</p>
        ) : (
          groups.map((group) => (
            <section key={group.letter} data-letter-section={group.letter} className="mb-2">
              <header className="sticky top-0 z-10 -mx-1 mb-1 bg-aura-veil/90 px-3 py-1 backdrop-blur">
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
                  {group.letter}
                </p>
              </header>
              <ul className="space-y-1">
                {group.members.map((member) => (
                  <RosterRow
                    key={member.id}
                    member={member}
                    selected={member.id === selectedId}
                    onSelect={() => onSelect(member.id)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <footer className="px-3 pb-1 pt-2 font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
        <span className="text-aura-muted">arrows</span> walk the file
      </footer>
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
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        data-roster-id={member.id}
        onClick={onSelect}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-tile px-1.5 py-1.5 text-left transition ${
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
          className={`shrink-0 font-mono text-micro tabular-nums tracking-[0.04em] ${
            selected ? "text-white/80" : "text-aura-muted"
          }`}
        >
          {formatHeight(member.characterHeightInInches)}
        </span>
      </button>
    </li>
  );
}

/* ================================================================== */
/* Page marker                                                        */
/* ================================================================== */

function PageMarker({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <span aria-hidden className="h-px w-8 bg-aura-hairline-strong" />
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
        // {label}
      </span>
      <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        {subtitle}
      </span>
      <span aria-hidden className="h-px flex-1 bg-aura-hairline-strong" />
    </div>
  );
}

/* ================================================================== */
/* Cover spread                                                       */
/*   Hero + identity + state + bio + tags, in one composite panel.    */
/* ================================================================== */

function CoverSpread({
  member,
  mood,
  onMoodChange,
  index,
  total,
}: {
  member: Member;
  mood: PortraitMood;
  onMoodChange: (mood: PortraitMood) => void;
  index: number;
  total: number;
}) {
  const availableMoods = PORTRAIT_MOODS.filter((entry) => {
    if (entry === "neutral") {
      return true;
    }
    return member.portraits[entry] !== undefined;
  });
  const lifecycle = member.state.status;
  const stampToneClass =
    lifecycle === "active"
      ? "text-aura-emerald ring-aura-emerald/40 bg-aura-emerald/10"
      : lifecycle === "closed"
        ? "text-aura-faint ring-aura-faint/40 bg-aura-faint/10"
        : "text-aura-rose ring-aura-rose/40 bg-aura-rose/10";

  return (
    <motion.article
      key={`cover-${member.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
      className="aura-glass relative overflow-hidden rounded-card"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-16 size-96 rounded-full bg-aura-mesh-rose/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 size-96 rounded-full bg-aura-mesh-violet/45 blur-3xl" />
        <div className="absolute inset-0 aura-dot-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-aura-hairline px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // case file
          </span>
          <span className="font-mono text-micro tabular-nums tracking-[0.22em] text-aura-faint">
            no. {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}
          </span>
        </div>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
          file.{member.id}
        </span>
      </header>

      <div className="relative grid gap-6 p-6 md:p-7 lg:grid-cols-[15rem_minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <Portrait member={member} variant="hero" asset="portrait" mood={mood} priority />
          <MoodSwatchRow available={availableMoods} active={mood} onChange={onMoodChange} />
        </div>

        <div className="min-w-0 space-y-4">
          <Eyebrow>// subject</Eyebrow>
          <h2 className="font-display text-display-lg font-semibold leading-[0.95] tracking-tight text-aura-ink">
            {member.firstName}
            <span className="aura-accent text-display-lg text-aura-rose">.</span>
          </h2>
          <p className="font-display text-body font-semibold tracking-tight text-aura-muted">
            {member.name}
          </p>

          <dl className="space-y-1.5">
            <DotLeaderRow label="Species" value={member.species} />
            <DotLeaderRow label="Dimension" value={member.dimension} />
            <DotLeaderRow label="Origin" value={member.origin} />
            <DotLeaderRow label="Reality" value={member.realityStatus} />
            <DotLeaderRow
              label="Height"
              value={`${formatHeight(member.characterHeightInInches)} (${member.characterHeightInInches}")`}
            />
            <DotLeaderRow
              label="Standee"
              value={`${formatHeight(member.standeeRenderHeightInInches)} (${member.standeeRenderHeightInInches}")`}
            />
          </dl>

          <ul className="flex flex-wrap gap-1.5 pt-2">
            {member.tags.map((tag) => {
              const isIdentity = tag === "ordinary_human" || tag === "non_human";
              return (
                <li
                  key={tag}
                  className={`rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] ring-1 ${
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
        </div>

        <div className="relative min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <Eyebrow>// state</Eyebrow>
            <span
              aria-hidden
              className={`rotate-3 rounded-tile px-3 py-1 font-eldritch text-body tracking-[0.18em] ring-1 ${stampToneClass}`}
            >
              {lifecycle.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2.5">
            {STATE_GAUGE_FIELDS.map((field) => (
              <MiniGauge
                key={field.id}
                label={field.label}
                value={member.state[field.id]}
                accent={field.accent}
              />
            ))}
          </div>

          <dl className="space-y-1.5">
            <DotLeaderRow label="Status" value={member.state.status} />
            <DotLeaderRow label="Request" value={member.state.currentRequestId ?? "(none)"} />
            <DotLeaderRow
              label="Last shift"
              value={
                member.state.lastDateShift === undefined
                  ? "(none)"
                  : `shift ${member.state.lastDateShift}`
              }
            />
            <DotLeaderRow label="Result" value={member.state.recentDateResult ?? "(none)"} />
          </dl>
        </div>
      </div>

      <div className="relative grid gap-5 border-t border-aura-hairline bg-white/30 p-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
        <BioColumn label="Bio">
          <p className="text-body leading-relaxed text-aura-ink/90">{member.bio}</p>
        </BioColumn>
        <BioColumn label="Dating profile" tone="violet">
          <p className="text-body italic leading-relaxed text-aura-ink/85">
            {member.datingProfile}
          </p>
        </BioColumn>
        <BioColumn label="Visual description" tone="amber">
          <p className="text-label leading-relaxed text-aura-muted">{member.visualDescription}</p>
        </BioColumn>
      </div>
    </motion.article>
  );
}

function DotLeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </dt>
      <span aria-hidden className="aura-doc-leader" />
      <dd className="min-w-0 max-w-[65%] truncate text-right font-display text-sm font-semibold tracking-tight text-aura-ink">
        {value}
      </dd>
    </div>
  );
}

function MoodSwatchRow({
  available,
  active,
  onChange,
}: {
  available: ReadonlyArray<PortraitMood>;
  active: PortraitMood;
  onChange: (mood: PortraitMood) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {available.map((entry) => {
        const selected = entry === active;
        return (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro uppercase tracking-[0.18em] transition ${
              selected
                ? "bg-aura-ink text-white"
                : "border border-aura-hairline bg-white/60 text-aura-muted hover:text-aura-ink"
            }`}
          >
            {entry}
          </button>
        );
      })}
    </div>
  );
}

function MiniGauge({ label, value, accent }: { label: string; value: number; accent: string }) {
  const widthClass = stateGaugeWidthClass(value);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          {label}
        </span>
        <span className="font-mono text-body font-semibold tabular-nums tracking-tight text-aura-ink">
          {value}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-pill bg-aura-ink/5">
        <div className={`h-full rounded-pill bg-gradient-to-r ${accent} ${widthClass}`} />
      </div>
    </div>
  );
}

function BioColumn({
  label,
  tone = "rose",
  children,
}: {
  label: string;
  tone?: "rose" | "violet" | "amber";
  children: React.ReactNode;
}) {
  const labelClass =
    tone === "violet"
      ? "text-aura-violet"
      : tone === "amber"
        ? "text-aura-amber"
        : "text-aura-rose/85";
  return (
    <section>
      <p className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${labelClass}`}>
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/* ================================================================== */
/* Voice spread                                                       */
/* ================================================================== */

function VoiceSpread({
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
    <article className="aura-glass overflow-hidden rounded-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-aura-hairline px-6 py-4">
        <div>
          <Eyebrow>// voice</Eyebrow>
          <h3 className="mt-1 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            How this file talks on the line.
          </h3>
        </div>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          register, patterns, tics, samples
        </span>
      </header>

      <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="space-y-3">
          <RegisterCard register={member.voice.register} />
          <PatternStrip
            title="Patterns used"
            tone="positive"
            patterns={member.voice.patternsUsed}
          />
          <PatternStrip
            title="Patterns refused"
            tone="negative"
            patterns={member.voice.patternsRefused}
          />
          <TicsList tics={member.voice.tics} />
        </div>

        <div className="relative overflow-hidden rounded-tile border border-aura-amber/30 bg-gradient-to-b from-[#fff6cf] to-[#ffe994] shadow-quiet">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-aura-amber/30 px-4 py-3">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-amber">
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

          <ol className="divide-y divide-aura-amber/25">
            {samples.map((sample, sampleIndex) => (
              <li
                key={`${group}-${sampleIndex}`}
                className="flex items-start gap-4 px-4 py-3 text-body italic leading-relaxed text-aura-ink/90"
              >
                <span
                  aria-hidden
                  className="mt-1 font-mono text-micro not-italic tabular-nums tracking-[0.18em] text-aura-amber/80"
                >
                  {String(sampleIndex + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{sample}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

function RegisterCard({ register }: { register: string }) {
  return (
    <div className="rounded-tile border border-aura-hairline bg-white/60 p-4">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
        Register
      </p>
      <p className="mt-2 font-display text-body font-semibold tracking-tight text-aura-ink">
        {register}
      </p>
    </div>
  );
}

function PatternStrip({
  title,
  tone,
  patterns,
}: {
  title: string;
  tone: "positive" | "negative";
  patterns: readonly string[];
}) {
  const chipClass =
    tone === "positive"
      ? "bg-aura-emerald/10 text-aura-emerald ring-aura-emerald/25"
      : "bg-aura-faint/15 text-aura-muted ring-aura-hairline-strong line-through decoration-aura-rose/50";

  return (
    <div className="rounded-tile border border-aura-hairline bg-white/60 p-4">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
        {title}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {patterns.map((pattern) => (
          <li
            key={pattern}
            className={`rounded-pill px-2.5 py-1 font-mono text-micro uppercase tracking-[0.16em] ring-1 ${chipClass}`}
          >
            {readableTag(pattern)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TicsList({ tics }: { tics: readonly string[] }) {
  return (
    <div className="rounded-tile border border-aura-hairline bg-white/60 p-4">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
        Tics
      </p>
      <ul className="mt-2 space-y-1.5">
        {tics.map((tic) => (
          <li
            key={tic}
            className="flex items-start gap-2.5 text-label leading-snug text-aura-ink/90"
          >
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-aura-fuchsia" />
            <span>{tic}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* Boundaries quad                                                    */
/* ================================================================== */

function BoundariesQuad({ member }: { member: Member }) {
  return (
    <article className="aura-glass overflow-hidden rounded-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-aura-hairline px-6 py-4">
        <div>
          <Eyebrow>// wants and boundaries</Eyebrow>
          <h3 className="mt-1 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            What this file wants on file.
          </h3>
        </div>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          needs, prefs, dealbreakers, secrets
        </span>
      </header>
      <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-4">
        <BoundaryPanel
          title="Looking for"
          accent="rose"
          items={member.relationshipNeeds}
          emptyText="No needs on file."
        />
        <BoundaryPanel
          title="Preferences"
          accent="amber"
          items={member.preferences}
          emptyText="No soft reads filed."
        />
        <BoundaryPanel
          title="Dealbreakers"
          accent="ink"
          items={member.dealbreakers}
          emptyText="None on file."
        />
        <BoundaryPanel
          title="Secrets"
          accent="violet"
          items={member.secrets}
          emptyText="No secrets on file."
        />
      </div>
    </article>
  );
}

function BoundaryPanel({
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
          {String(items.length).padStart(2, "0")}
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
/* Contact sheet                                                      */
/* ================================================================== */

function ContactSheet({ member }: { member: Member }) {
  type Frame = {
    key: string;
    mood: PortraitMood;
    label: string;
    cutoutPath: string;
    sourcePath: string;
    asset: "portrait" | "avatar";
  };
  const frames: Frame[] = [];
  for (const portraitMood of PORTRAIT_MOODS) {
    if (portraitMood === "neutral") {
      frames.push({
        key: "neutral",
        mood: "neutral",
        label: "neutral",
        cutoutPath: member.portraits.neutral.portrait.cutoutPath,
        sourcePath: member.portraits.neutral.portrait.sourcePath,
        asset: "portrait",
      });
      continue;
    }
    const variant = member.portraits[portraitMood];
    if (variant === undefined) {
      continue;
    }
    frames.push({
      key: portraitMood,
      mood: portraitMood,
      label: portraitMood,
      cutoutPath: variant.portrait.cutoutPath,
      sourcePath: variant.portrait.sourcePath,
      asset: "portrait",
    });
  }
  frames.push({
    key: "avatar",
    mood: "neutral",
    label: "avatar (chat)",
    cutoutPath: member.portraits.neutral.avatar.cutoutPath,
    sourcePath: member.portraits.neutral.avatar.sourcePath,
    asset: "avatar",
  });

  const variantCount = frames.length - 1;

  return (
    <article className="aura-glass overflow-hidden rounded-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-aura-hairline px-6 py-4">
        <div>
          <Eyebrow>// contact sheet</Eyebrow>
          <h3 className="mt-1 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            Mood variants ({variantCount}/4) and chat avatar.
          </h3>
        </div>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {frames.length} frames
        </span>
      </header>
      <div className="grid gap-3 p-6 md:grid-cols-3 xl:grid-cols-5">
        {frames.map((frame, frameIndex) => (
          <figure
            key={frame.key}
            className="overflow-hidden rounded-tile border border-aura-hairline bg-white/55"
          >
            <div
              className={`relative grid aspect-square place-items-center ${
                frame.asset === "avatar"
                  ? "bg-gradient-to-b from-aura-mesh-amber/35 via-transparent to-aura-mesh-rose/25"
                  : "bg-gradient-to-b from-aura-mesh-rose/30 via-transparent to-aura-mesh-violet/25"
              }`}
            >
              <span
                aria-hidden
                className="absolute left-3 top-3 font-mono text-micro font-semibold tabular-nums tracking-[0.04em] text-aura-faint"
              >
                {String(frameIndex + 1).padStart(2, "0")}
              </span>
              <Portrait member={member} variant="card" asset={frame.asset} mood={frame.mood} />
            </div>
            <figcaption className="space-y-1.5 border-t border-aura-hairline px-3 py-3">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
                {frame.label}
              </p>
              <p className="break-all font-mono text-micro leading-tight tracking-[0.02em] text-aura-ink/75">
                {frame.cutoutPath}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </article>
  );
}

/* ================================================================== */
/* Bubble test                                                        */
/* ================================================================== */

function BubbleTest({ member }: { member: Member }) {
  const customBubble = member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const bubbleClass = customBubble ? customBubble.className : HOUSE_BUBBLE_LEFT_CLASS;
  const bubbleStyle = customBubble?.style;
  const accentStyle = customBubble?.accentStyle;
  const textColorClass = customBubble ? "" : "text-white";
  const nameClass = customBubble
    ? "text-[color:var(--member-bubble-accent)] opacity-80"
    : HOUSE_BUBBLE_NAME_CLASS;

  const sample =
    member.voice.sampleMessages.hingeBits[0] ??
    member.voice.sampleMessages.greeting[0] ??
    "Saturday works. Pick the place once, confirm the hour, and let the room stay quiet.";

  const axes = describeBubbleAxes(member);

  return (
    <article className="aura-glass overflow-hidden rounded-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-aura-hairline px-6 py-4">
        <div>
          <Eyebrow>// bubble test</Eyebrow>
          <h3 className="mt-1 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            {customBubble ? "Custom bubble style." : "Uses house default."}
          </h3>
        </div>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {axes.length === 0 ? "0 axes" : `${axes.length} axes on file`}
        </span>
      </header>
      <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-tile border border-aura-hairline bg-aura-paper p-5 shadow-quiet">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
            Preview
          </p>
          <div className="mt-4 flex justify-start">
            <div className="flex max-w-[88%] flex-col items-start gap-2" style={accentStyle}>
              <span
                className={`relative z-20 px-3 text-left font-mono text-micro font-semibold uppercase tracking-[0.24em] ${nameClass}`}
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
    </article>
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
        : `gradient ${bubble.background.angle}deg, ${bubble.background.stops.length} stops`,
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
/* Gauge width helpers                                                */
/* ================================================================== */

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
  const clamped = Math.max(0, Math.min(100, score));
  const index = Math.round(clamped / 5);
  return STATE_GAUGE_WIDTH_CLASSES[index] ?? "w-full";
}
