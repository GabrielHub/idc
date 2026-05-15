import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";

import { EASE_OUT_QUART, MutedLabel, SelectInput } from "../../../components/dashboard-atoms";
import {
  DaterStandee,
  formatMemberHeightLabel,
  resolveStandeeHeightScale,
} from "../../../components/date-reactions";
import { resolveStandeeFooting } from "../../../components/standee-footing";
import { resolveStandeeSourceScale } from "../../../components/standee-source-scale";
import { type Member } from "../../../domain/game";
import { starterMembers } from "../../../fixtures";
import { TestHeader } from "../shared";

type HeightLineupSort = "visible-desc" | "height-desc" | "height-asc" | "roster" | "name";

const HEIGHT_LINEUP_SORT_OPTIONS: ReadonlyArray<{ value: HeightLineupSort; label: string }> = [
  { value: "visible-desc", label: "Visible height" },
  { value: "height-desc", label: "Tallest first" },
  { value: "height-asc", label: "Shortest first" },
  { value: "roster", label: "Roster order" },
  { value: "name", label: "Name" },
];

const HEIGHT_ANCHOR_MEMBER_IDS = [
  "derek-halsey",
  "alex-yoon",
  "gabriel-tan",
  "noah-kim",
  "ryan-doyle",
] as const;
const KNOWN_HEIGHT_ANCHOR_IDS = new Set<string>(HEIGHT_ANCHOR_MEMBER_IDS);
const HEIGHT_GUIDE_IN_INCHES = 72;
const HEIGHT_LINEUP_GUIDE_BOTTOM_CLASS = "bottom-[29.07rem]";
const HEIGHT_LINEUP_Z_CLASSES = [
  "z-[1]",
  "z-[2]",
  "z-[3]",
  "z-[4]",
  "z-[5]",
  "z-[6]",
  "z-[7]",
  "z-[8]",
  "z-[9]",
  "z-[10]",
  "z-[11]",
  "z-[12]",
  "z-[13]",
  "z-[14]",
  "z-[15]",
  "z-[16]",
  "z-[17]",
  "z-[18]",
  "z-[19]",
  "z-[20]",
  "z-[21]",
  "z-[22]",
  "z-[23]",
  "z-[24]",
  "z-[25]",
  "z-[26]",
  "z-[27]",
  "z-[28]",
  "z-[29]",
  "z-[30]",
  "z-[31]",
  "z-[32]",
  "z-[33]",
  "z-[34]",
  "z-[35]",
  "z-[36]",
  "z-[37]",
  "z-[38]",
  "z-[39]",
  "z-[40]",
] as const;
const HEIGHT_LINEUP_BACKGROUND_MEMBER_IDS = new Set<string>(["junie-marrow"]);
const HEIGHT_LINEUP_BACKGROUND_Z_CLASS = "z-0";

export function HeightLineupTest() {
  const [sort, setSort] = useState<HeightLineupSort>("visible-desc");
  const [showHeightGuide, setShowHeightGuide] = useState(true);
  const stageScrollRef = useRef<HTMLDivElement>(null);
  const sortedMembers = useMemo(() => sortHeightLineupMembers(starterMembers, sort), [sort]);
  const shortestMember = sortedMembers.reduce((shortest, member) =>
    member.characterHeightInInches < shortest.characterHeightInInches ? member : shortest,
  );
  const tallestMember = sortedMembers.reduce((tallest, member) =>
    member.characterHeightInInches > tallest.characterHeightInInches ? member : tallest,
  );

  function scrollToMember(memberId: string) {
    const stage = stageScrollRef.current;
    if (stage === null) {
      return;
    }
    const target = stage.querySelector<HTMLElement>(`[data-member-id="${memberId}"]`);
    target?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Height lineup"
        description="Neutral cutouts rendered through the live date standee path. Derek anchors the 6 ft guide from his 6 ft 4 in visual height."
      />

      <div className="aura-glass relative z-20 flex flex-wrap items-center justify-between gap-4 rounded-card px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <MutedLabel>height canon</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{starterMembers.length}</span> members
            <span aria-hidden> · </span>
            {formatMemberHeightLabel(shortestMember.characterHeightInInches)}
            <span aria-hidden> to </span>
            {formatMemberHeightLabel(tallestMember.characterHeightInInches)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={showHeightGuide}
            onClick={() => setShowHeightGuide((current) => !current)}
            className={`cursor-pointer rounded-pill px-3 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
              showHeightGuide
                ? "bg-aura-ink text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.55)]"
                : "border border-aura-hairline bg-white/55 text-aura-muted hover:border-aura-hairline-strong hover:text-aura-ink"
            }`}
          >
            {showHeightGuide ? "6 ft guide on" : "6 ft guide off"}
          </button>
          <SelectInput<HeightLineupSort>
            label="sort"
            value={sort}
            options={HEIGHT_LINEUP_SORT_OPTIONS}
            onChange={setSort}
            layout="inline"
            align="right"
          />
        </div>
      </div>

      <HeightAnchorStrip onSelect={scrollToMember} />
      <div className="relative left-1/2 w-screen -translate-x-1/2 px-6">
        <HeightLineupStage
          members={sortedMembers}
          showHeightGuide={showHeightGuide}
          scrollRef={stageScrollRef}
        />
      </div>
    </motion.section>
  );
}

function sortHeightLineupMembers(
  members: readonly Member[],
  sort: HeightLineupSort,
): readonly Member[] {
  const indexedMembers = members.map((member, index) => ({ member, index }));

  indexedMembers.sort((first, second) => {
    if (sort === "visible-desc") {
      return (
        resolveHeightLineupVisibleHeight(second.member) -
          resolveHeightLineupVisibleHeight(first.member) || first.index - second.index
      );
    }
    if (sort === "height-desc") {
      return (
        second.member.characterHeightInInches - first.member.characterHeightInInches ||
        first.index - second.index
      );
    }
    if (sort === "height-asc") {
      return (
        first.member.characterHeightInInches - second.member.characterHeightInInches ||
        first.index - second.index
      );
    }
    if (sort === "name") {
      return first.member.name.localeCompare(second.member.name);
    }
    return first.index - second.index;
  });

  return indexedMembers.map((entry) => entry.member);
}

function resolveHeightLineupVisibleHeight(member: Member): number {
  const heightScale = resolveStandeeHeightScale(member.standeeRenderHeightInInches).value;
  const sourceScale = resolveStandeeSourceScale(member.id).value;
  const footing = resolveStandeeFooting(member.portraits.neutral.portrait.cutoutPath);
  return footing.renderedVisibleHeightRatio * heightScale * sourceScale;
}

function buildHeightLineupZClassByMemberId(
  members: readonly Member[],
): ReadonlyMap<string, string> {
  const sortedMembers = [...members].sort(
    (first, second) =>
      resolveHeightLineupVisibleHeight(first) - resolveHeightLineupVisibleHeight(second) ||
      first.name.localeCompare(second.name),
  );
  const zClassByMemberId = new Map<string, string>();
  const maxIndex = HEIGHT_LINEUP_Z_CLASSES.length - 1;
  let foregroundIndex = 0;

  sortedMembers.forEach((member) => {
    if (HEIGHT_LINEUP_BACKGROUND_MEMBER_IDS.has(member.id)) {
      zClassByMemberId.set(member.id, HEIGHT_LINEUP_BACKGROUND_Z_CLASS);
      return;
    }

    zClassByMemberId.set(member.id, HEIGHT_LINEUP_Z_CLASSES[Math.min(foregroundIndex, maxIndex)]);
    foregroundIndex += 1;
  });

  return zClassByMemberId;
}

function HeightAnchorStrip({ onSelect }: { onSelect: (memberId: string) => void }) {
  const anchorMembers = HEIGHT_ANCHOR_MEMBER_IDS.map((memberId) =>
    starterMembers.find((member) => member.id === memberId),
  ).filter((member): member is Member => member !== undefined);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {anchorMembers.map((member) => {
        const scale = resolveStandeeHeightScale(member.standeeRenderHeightInInches);
        const sourceScale = resolveStandeeSourceScale(member.id);
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            aria-label={`Scroll stage to ${member.name}`}
            className="aura-glass group cursor-pointer rounded-card px-3 py-2.5 text-left outline-none transition hover:border-aura-rose/40 hover:shadow-card focus-visible:border-aura-rose"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-body font-semibold tracking-tight text-aura-ink">
                  {member.name}
                </span>
                <span className="mt-1 block whitespace-nowrap font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
                  locked anchor
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-pill bg-aura-rose/10 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.14em] text-aura-rose ring-1 ring-aura-rose/20">
                {formatMemberHeightLabel(member.characterHeightInInches)}
              </span>
            </span>
            <span className="mt-2 block whitespace-nowrap font-mono text-micro uppercase tracking-[0.18em] text-aura-muted">
              h scale <span className="tabular-nums text-aura-ink">{scale.value.toFixed(2)}</span>
              <span aria-hidden> · </span>
              src <span className="tabular-nums text-aura-ink">{sourceScale.value.toFixed(2)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function HeightLineupStage({
  members,
  showHeightGuide,
  scrollRef,
}: {
  members: readonly Member[];
  showHeightGuide: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const zClassByMemberId = useMemo(() => buildHeightLineupZClassByMemberId(members), [members]);

  return (
    <div className="aura-glass overflow-hidden rounded-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-aura-hairline px-5 py-4">
        <div>
          <MutedLabel>standee stage</MutedLabel>
          <p className="mt-1 text-label text-aura-muted">
            Uniform scale, bottom anchored. The guide line and anchor faces expose source-scale
            drift.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showHeightGuide ? (
            <span className="rounded-pill bg-aura-rose/10 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose ring-1 ring-aura-rose/20">
              guide {formatMemberHeightLabel(HEIGHT_GUIDE_IN_INCHES)}
            </span>
          ) : null}
          <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            horizontal audit
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden scroll-smooth">
        <div className="relative flex min-w-max items-end px-10 pb-6 pt-10">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 bottom-[5.5rem] z-0 h-px bg-aura-hairline-strong"
          />
          {showHeightGuide ? (
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-x-10 ${HEIGHT_LINEUP_GUIDE_BOTTOM_CLASS} z-0 h-px bg-aura-rose/60 shadow-[0_0_18px_rgba(244,63,94,0.28)]`}
            />
          ) : null}
          {members.map((member) => (
            <HeightLineupMember
              key={member.id}
              member={member}
              zClass={zClassByMemberId.get(member.id) ?? HEIGHT_LINEUP_Z_CLASSES[0]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeightLineupMember({ member, zClass }: { member: Member; zClass: string }) {
  const scale = resolveStandeeHeightScale(member.standeeRenderHeightInInches);
  const sourceScale = resolveStandeeSourceScale(member.id);
  const isKnownAnchor = KNOWN_HEIGHT_ANCHOR_IDS.has(member.id);

  return (
    <article
      data-member-id={member.id}
      className={`relative -ml-7 h-[36rem] w-36 shrink-0 scroll-mx-10 first:ml-0 ${zClass}`}
    >
      {isKnownAnchor ? (
        <span className="absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded-pill bg-aura-rose/10 px-1.5 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose ring-1 ring-aura-rose/20 backdrop-blur-sm">
          anchor
        </span>
      ) : null}
      <DaterStandee
        member={member}
        placement="bottom-left"
        reactions={[]}
        className="absolute bottom-20 left-1/2 h-96 w-48 -translate-x-1/2 origin-bottom"
      />
      <footer className="absolute bottom-1 left-1/2 w-[6.75rem] -translate-x-1/2 rounded-tile bg-white/70 px-2 py-1 text-center ring-1 ring-aura-hairline backdrop-blur-sm">
        <p className="truncate font-display text-sm font-semibold leading-tight tracking-tight text-aura-ink">
          {member.firstName}
        </p>
        <p className="mt-0.5 whitespace-nowrap font-mono text-micro uppercase leading-tight tracking-[0.08em] text-aura-faint">
          {formatMemberHeightLabel(member.characterHeightInInches)}
        </p>
        <div className="mx-auto mt-1 grid w-fit grid-cols-[auto_auto] gap-x-1.5 font-mono text-micro uppercase leading-tight tracking-[0.06em] text-aura-muted">
          <span>h</span>
          <span className="tabular-nums text-aura-ink">{scale.value.toFixed(2)}</span>
          <span>src</span>
          <span className="tabular-nums text-aura-ink">{sourceScale.value.toFixed(2)}</span>
        </div>
      </footer>
    </article>
  );
}
