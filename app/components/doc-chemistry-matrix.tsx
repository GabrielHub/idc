import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { pad2 } from "../services/utils";

export interface ChemistryMember {
  id: string;
  label: string;
  cluster: string;
  featured?: boolean;
}

export type ChemistryKind =
  | "warm"
  | "clean"
  | "volatile"
  | "surprise"
  | "friction"
  | "hard-stop"
  | "acquisition";

export interface ChemistryPair {
  a: string;
  b: string;
  kind: ChemistryKind;
  note: string;
}

const CHEMISTRY_TONE: Record<ChemistryKind, { fill: string; label: string; dot: string }> = {
  warm: {
    fill: "bg-rose-300/85 hover:bg-rose-400",
    label: "Warm",
    dot: "bg-rose-400",
  },
  clean: {
    fill: "bg-emerald-300/85 hover:bg-emerald-400",
    label: "Clean landing",
    dot: "bg-emerald-400",
  },
  volatile: {
    fill: "bg-fuchsia-400/85 hover:bg-fuchsia-500",
    label: "Volatile warm",
    dot: "bg-fuchsia-500",
  },
  surprise: {
    fill: "bg-violet-300/85 hover:bg-violet-400",
    label: "Surprise warm",
    dot: "bg-violet-400",
  },
  friction: {
    fill: "bg-slate-400/80 hover:bg-slate-500",
    label: "Friction",
    dot: "bg-slate-500",
  },
  "hard-stop": {
    fill: "bg-stone-700/85 hover:bg-stone-800",
    label: "Hard stop",
    dot: "bg-stone-800",
  },
  acquisition: {
    fill: "bg-amber-400/85 hover:bg-amber-500",
    label: "Acquisition register",
    dot: "bg-amber-500",
  },
};

export function DocChemistryMatrix({
  members,
  pairs,
}: {
  members: ChemistryMember[];
  pairs: ChemistryPair[];
}) {
  const [selected, setSelected] = useState<ChemistryPair | null>(null);
  const [focusMember, setFocusMember] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const orderedMembers = useMemo(() => {
    const grouped = new Map<string, ChemistryMember[]>();
    for (const member of members) {
      const list = grouped.get(member.cluster) ?? [];
      list.push(member);
      grouped.set(member.cluster, list);
    }
    return Array.from(grouped.values()).flat();
  }, [members]);

  const previewMembers = useMemo(() => {
    const featuredMembers = orderedMembers.filter((member) => member.featured === true);
    if (featuredMembers.length > 0) return featuredMembers;
    return orderedMembers.slice(0, Math.min(orderedMembers.length, 24));
  }, [orderedMembers]);

  const memberById = useMemo(() => new Map(orderedMembers.map((m) => [m.id, m])), [orderedMembers]);

  const pairLookup = useMemo(() => {
    const map = new Map<string, ChemistryPair>();
    for (const pair of pairs) {
      map.set(pairKey(pair.a, pair.b), pair);
    }
    return map;
  }, [pairs]);

  const handleCellClick = (a: string, b: string) => {
    if (a === b) return;
    const pair = pairLookup.get(pairKey(a, b));
    if (pair) {
      setSelected(pair);
      setFocusMember(null);
      return;
    }
    setSelected(null);
  };

  const handleMemberClick = (id: string) => {
    setFocusMember((prev) => (prev === id ? null : id));
    setSelected(null);
  };

  const handleReset = () => {
    setFocusMember(null);
    setSelected(null);
  };

  const handleCloseExpanded = () => {
    setExpanded(false);
    handleReset();
  };

  useEffect(() => {
    if (!expanded) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousActive =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, [expanded]);

  return (
    <>
      <figure className="my-3 flex flex-col gap-4">
        <ChemistryMatrixPanel
          visibleMembers={previewMembers}
          totalMembers={orderedMembers.length}
          pairs={pairs}
          pairLookup={pairLookup}
          focusMember={focusMember}
          selectedPair={selected}
          memberById={memberById}
          variant="preview"
          onCellClick={handleCellClick}
          onMemberClick={handleMemberClick}
          onOpenExpanded={() => setExpanded(true)}
          onReset={focusMember || selected ? handleReset : undefined}
        />
      </figure>

      {expanded ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Full roster chemistry matrix"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              handleCloseExpanded();
            }
          }}
          className="fixed inset-0 z-50 bg-aura-ink/35 p-3 backdrop-blur-sm sm:p-5"
        >
          <div className="flex h-full flex-col overflow-hidden rounded-card border border-aura-hairline bg-aura-bg shadow-2xl">
            <ChemistryMatrixPanel
              visibleMembers={orderedMembers}
              totalMembers={orderedMembers.length}
              pairs={pairs}
              pairLookup={pairLookup}
              focusMember={focusMember}
              selectedPair={selected}
              memberById={memberById}
              variant="expanded"
              onCellClick={handleCellClick}
              onMemberClick={handleMemberClick}
              onCloseExpanded={handleCloseExpanded}
              onReset={focusMember || selected ? handleReset : undefined}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ChemistryMatrixPanel({
  visibleMembers,
  totalMembers,
  pairs,
  pairLookup,
  focusMember,
  selectedPair,
  memberById,
  variant,
  onCellClick,
  onMemberClick,
  onOpenExpanded,
  onCloseExpanded,
  onReset,
}: {
  visibleMembers: ChemistryMember[];
  totalMembers: number;
  pairs: ChemistryPair[];
  pairLookup: Map<string, ChemistryPair>;
  focusMember: string | null;
  selectedPair: ChemistryPair | null;
  memberById: Map<string, ChemistryMember>;
  variant: "preview" | "expanded";
  onCellClick: (a: string, b: string) => void;
  onMemberClick: (id: string) => void;
  onOpenExpanded?: () => void;
  onCloseExpanded?: () => void;
  onReset?: () => void;
}) {
  const filteredMembers = focusMember
    ? visibleMembers.filter(
        (m) =>
          m.id === focusMember ||
          pairs.some(
            (p) => (p.a === focusMember && p.b === m.id) || (p.b === focusMember && p.a === m.id),
          ),
      )
    : visibleMembers;
  const expanded = variant === "expanded";

  return (
    <div className={`flex flex-col gap-4 ${expanded ? "min-h-0 flex-1 p-4 sm:p-5" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
        <span>// roster chemistry matrix</span>
        <span className="flex flex-wrap items-center gap-2 tracking-[0.18em]">
          <span className="rounded-pill border border-aura-hairline bg-white/70 px-2 py-0.5 text-aura-muted">
            {pad2(visibleMembers.length)} / {pad2(totalMembers)}
          </span>
          {onReset ? (
            <MatrixChip tone="neutral" onClick={onReset}>
              reset
            </MatrixChip>
          ) : null}
          {onOpenExpanded ? (
            <MatrixChip tone="rose" onClick={onOpenExpanded}>
              expand
            </MatrixChip>
          ) : null}
          {onCloseExpanded ? (
            <MatrixChip tone="neutral" onClick={onCloseExpanded}>
              close
            </MatrixChip>
          ) : null}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-micro">
        {(Object.keys(CHEMISTRY_TONE) as ChemistryKind[]).map((kind) => (
          <span
            key={kind}
            className="inline-flex items-center gap-1.5 rounded-pill border border-aura-hairline bg-white/70 px-2 py-0.5 font-mono uppercase tracking-[0.18em] text-aura-muted"
          >
            <span aria-hidden className={`size-2 rounded-sm ${CHEMISTRY_TONE[kind].dot}`} />
            <span className="normal-case tracking-normal text-aura-ink">
              {CHEMISTRY_TONE[kind].label}
            </span>
          </span>
        ))}
      </div>

      <div
        className={`overflow-auto rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-aura-bg/55 p-4 ${
          expanded ? "min-h-0 flex-1" : ""
        }`}
      >
        <div className="inline-grid gap-[1px]">
          <ChemistryMatrixGrid
            members={filteredMembers}
            pairLookup={pairLookup}
            focusMember={focusMember}
            onCellClick={onCellClick}
            onMemberClick={onMemberClick}
            selectedPair={selectedPair}
            variant={variant}
          />
        </div>
      </div>

      <ChemistryDetail pair={selectedPair} memberById={memberById} />
    </div>
  );
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function ChemistryMatrixGrid({
  members,
  pairLookup,
  focusMember,
  selectedPair,
  onCellClick,
  onMemberClick,
  variant,
}: {
  members: ChemistryMember[];
  pairLookup: Map<string, ChemistryPair>;
  focusMember: string | null;
  selectedPair: ChemistryPair | null;
  onCellClick: (a: string, b: string) => void;
  onMemberClick: (id: string) => void;
  variant: "preview" | "expanded";
}) {
  const cellSize = variant === "expanded" ? 24 : 22;
  const labelSize = variant === "expanded" ? 150 : 130;
  const gridTemplateColumns = `${labelSize}px repeat(${members.length}, ${cellSize}px)`;

  return (
    <div className="grid" style={{ gridTemplateColumns }}>
      <div />
      {members.map((member) => (
        <button
          key={`col-${member.id}`}
          type="button"
          onClick={() => onMemberClick(member.id)}
          className="cursor-pointer origin-bottom-left -rotate-45 whitespace-nowrap py-1 text-left font-mono text-micro uppercase tracking-[0.04em] text-aura-muted hover:text-aura-rose"
          title={member.label}
          style={{ width: cellSize, transformOrigin: "bottom left" }}
        >
          {member.label}
        </button>
      ))}
      {members.map((row) => (
        <Fragment key={`row-${row.id}`}>
          <button
            type="button"
            onClick={() => onMemberClick(row.id)}
            className={`cursor-pointer truncate pr-2 text-right font-mono text-micro uppercase tracking-[0.04em] transition ${
              focusMember === row.id ? "text-aura-rose" : "text-aura-muted hover:text-aura-rose"
            }`}
            style={{ height: cellSize, lineHeight: `${cellSize}px` }}
            title={row.label}
          >
            {row.label}
          </button>
          {members.map((col) => {
            if (row.id === col.id) {
              return (
                <div
                  key={`${row.id}-${col.id}`}
                  className="rounded-[2px] bg-aura-hairline/40"
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            }
            const pair = pairLookup.get(pairKey(row.id, col.id));
            const isSelected =
              selectedPair !== null &&
              pairKey(selectedPair.a, selectedPair.b) === pairKey(row.id, col.id);
            if (!pair) {
              return (
                <div
                  key={`${row.id}-${col.id}`}
                  className="rounded-[2px] bg-white/35"
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            }
            const tone = CHEMISTRY_TONE[pair.kind];
            return (
              <button
                key={`${row.id}-${col.id}`}
                type="button"
                onClick={() => onCellClick(row.id, col.id)}
                className={`group relative cursor-pointer rounded-[2px] ${tone.fill} transition ${
                  isSelected ? "ring-2 ring-aura-ink ring-offset-1 ring-offset-aura-bg" : ""
                }`}
                style={{ width: cellSize, height: cellSize }}
                title={`${row.label} x ${col.label}: ${tone.label}`}
                aria-label={`${row.label} x ${col.label}: ${tone.label}`}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function ChemistryDetail({
  pair,
  memberById,
}: {
  pair: ChemistryPair | null;
  memberById: Map<string, ChemistryMember>;
}) {
  if (!pair) {
    return (
      <p className="rounded-tile border border-dashed border-aura-hairline bg-white/55 px-4 py-3 font-serif text-label italic leading-snug text-aura-muted">
        Click a cell or a member label to read the pressure note. Row x column maps to the cluster
        sort, so warm cells concentrate along clusters and friction spreads off-diagonal.
      </p>
    );
  }

  const a = memberById.get(pair.a)?.label ?? pair.a;
  const b = memberById.get(pair.b)?.label ?? pair.b;
  const tone = CHEMISTRY_TONE[pair.kind];

  return (
    <article className="rounded-card border border-aura-hairline bg-white/72 px-5 py-4">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <p className="font-display text-lead font-semibold text-aura-ink">
          {a} <span className="text-aura-faint">x</span> {b}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-aura-hairline bg-white/80 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink">
          <span aria-hidden className={`size-2 rounded-sm ${tone.dot}`} />
          {tone.label}
        </span>
      </header>
      <p className="text-label leading-[1.65] text-aura-ink/86">{pair.note}</p>
    </article>
  );
}

function MatrixChip({
  tone,
  onClick,
  children,
}: {
  tone: "neutral" | "rose";
  onClick: () => void;
  children: ReactNode;
}) {
  const toneClass =
    tone === "rose"
      ? "border-aura-rose/30 bg-aura-rose/10 text-aura-rose hover:bg-aura-rose hover:text-aura-paper"
      : "border-aura-hairline bg-white/70 text-aura-muted hover:border-aura-rose/30 hover:text-aura-rose";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-pill border px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${toneClass}`}
    >
      {children}
    </button>
  );
}
