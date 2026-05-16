import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import type { DateScenario, Member, MemoryRecord, PairState } from "../domain/game";
import { scrubPlayerSafeCopy } from "../services/player-safe-copy";
import { EASE_OUT_QUART, Eyebrow, pad2, Portrait } from "./dashboard-atoms";
import {
  caseNumberFor,
  formatNoteTimestamp,
  formatStampDate,
  noteCardSubhead,
  noteCardTitle,
  visibleMemoryTagLabels,
} from "./notes-format";
import { paletteForMemory, type ScopePalette } from "./notes-palette";
import { splitLead } from "./pair-board-shared";

export type NotesCardDeps = {
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
};

type CardContext = {
  palette: ScopePalette;
  pairMembers: Member[];
  scenario: DateScenario | undefined;
  title: string;
  subhead: string | null;
  lead: string;
  tail: string;
  caseNumber: string;
  tagLabels: string[];
};

export function NotesArchive({ memories, ...deps }: NotesCardDeps & { memories: MemoryRecord[] }) {
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
        <FeaturedNoteCard memory={featured} rank={memories.length} {...deps} />
      )}

      {rest.length === 0 ? null : (
        <ul className="mt-6 grid gap-5">
          <AnimatePresence initial={false}>
            {rest.map((memory, index) => (
              <NoteCard key={memory.id} memory={memory} index={index} {...deps} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export function NotesEmptyTile({
  title,
  subhead,
  action,
}: {
  title: string;
  subhead: string;
  action?: ReactNode;
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

function resolveCardContext(memory: MemoryRecord, deps: NotesCardDeps): CardContext {
  const palette = paletteForMemory(memory);
  const pairMembers =
    memory.pairId === undefined
      ? []
      : (deps.pairStateById.get(memory.pairId)?.participantIds ?? [])
          .map((id) => deps.memberById.get(id))
          .filter((member): member is Member => member !== undefined);
  const scenario =
    memory.scenarioId === undefined ? undefined : deps.scenarioById.get(memory.scenarioId);
  const title = noteCardTitle(memory, pairMembers, scenario);
  const subhead = noteCardSubhead(memory, scenario);
  const { lead, tail } = splitLead(scrubPlayerSafeCopy(memory.text));
  const caseNumber = caseNumberFor(memory);
  const tagLabels = visibleMemoryTagLabels(memory);
  return { palette, pairMembers, scenario, title, subhead, lead, tail, caseNumber, tagLabels };
}

function FeaturedNoteCard({
  memory,
  rank,
  ...deps
}: NotesCardDeps & { memory: MemoryRecord; rank: number }) {
  const { palette, pairMembers, scenario, title, subhead, lead, tail, caseNumber, tagLabels } =
    resolveCardContext(memory, deps);

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

      <div className="relative z-10 px-6 pb-8 pl-11 pt-0">
        <div className="-mt-px flex items-start justify-between gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-b-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.26em] shadow-quiet ${palette.ribbon}`}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-white/85" />
            {palette.label}
          </span>
          <FiledStamp date={memory.createdAt} />
        </div>

        <div className="mt-6 grid gap-6">
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
            <h3 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-ink">
              {title}
            </h3>
            {subhead === null ? null : (
              <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-rose">
                {subhead}
              </p>
            )}
            <p className="aura-accent mt-5 text-lead leading-snug text-aura-ink/90">{lead}</p>
            {tail === "" ? null : (
              <p className="mt-4 max-w-prose text-body leading-relaxed text-aura-ink/80">{tail}</p>
            )}
            {tagLabels.length === 0 ? null : (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {tagLabels.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2.5 py-1 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                      {tag}
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
  ...deps
}: NotesCardDeps & { memory: MemoryRecord; index: number }) {
  const { palette, pairMembers, scenario, title, subhead, lead, tail, caseNumber, tagLabels } =
    resolveCardContext(memory, deps);

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
            {tagLabels.length === 0 ? (
              <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
                no tags filed
              </span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {tagLabels.slice(0, 3).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2 py-0.5 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-muted">
                      {tag}
                    </span>
                  </li>
                ))}
                {tagLabels.length > 3 ? (
                  <li className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                    +{tagLabels.length - 3}
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
