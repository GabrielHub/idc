import { type Ref } from "react";
import { motion } from "motion/react";

import { EASE_OUT_QUART } from "../dashboard-atoms";
import { RoomCardBack } from "../room-card-back";
import { CathedralCard } from "./cathedral-card";
import { CathedralEmptyState } from "./cathedral-empty-state";
import type { DoorEntry } from "./cathedral-types";

export function AutoDrawStage({
  doors,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onOpenDetail,
  reducedMotion,
  containerRef,
}: {
  doors: DoorEntry[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  reducedMotion: boolean;
  containerRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="pointer-events-auto mx-auto flex h-full max-w-[1200px] items-center justify-center px-4">
      <div ref={containerRef} className="flex w-fit flex-col items-center">
        <AutoDrawHeader count={doors.length} />
        {doors.length === 0 ? (
          <CathedralEmptyState mode="auto" />
        ) : (
          <DealtHand
            doors={doors}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={onHover}
            onSelect={onSelect}
            onOpenDetail={onOpenDetail}
            reducedMotion={reducedMotion}
          />
        )}
      </div>
    </div>
  );
}

function AutoDrawHeader({ count }: { count: number }) {
  return (
    <div className="mb-7 flex flex-col items-center text-center">
      <div className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose/80">
        // pick room - <span className="text-white/55">{count} drawn</span>
      </div>
      <h2 className="mt-2 font-display text-display-md leading-none text-aura-paper">
        Tonight's draw
      </h2>
      <p className="mt-2 font-sans text-label text-white/70">
        Pick the room that leads the pair tonight.
      </p>
    </div>
  );
}

function DealtHand({
  doors,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onOpenDetail,
  reducedMotion,
}: {
  doors: DoorEntry[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  reducedMotion: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {doors.map((entry, index) => (
        <DealtDoor
          key={entry.scenario.id}
          entry={entry}
          index={index}
          total={doors.length}
          selected={selectedId === entry.scenario.id}
          hovered={hoveredId === entry.scenario.id}
          onSelect={() => onSelect(entry.scenario.id)}
          onOpenDetail={() => onOpenDetail(entry.scenario.id)}
          onHoverEnter={() => onHover(entry.scenario.id)}
          onHoverLeave={() => onHover(null)}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

function DealtDoor({
  entry,
  index,
  total,
  selected,
  hovered,
  onSelect,
  onOpenDetail,
  onHoverEnter,
  onHoverLeave,
  reducedMotion,
}: {
  entry: DoorEntry;
  index: number;
  total: number;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  reducedMotion: boolean;
}) {
  const center = (total - 1) / 2;
  const fromX = (center - index) * 48;
  const fan = (index - center) * 5;
  const dealDelay = 0.12 + index * 0.14;
  const dealDuration = 0.5;
  const flipDelay = dealDelay + dealDuration * 0.6;

  return (
    <motion.div
      className="relative aspect-[4/5] w-[clamp(15rem,22vw,19rem)] shrink-0 rounded-card shadow-[0_30px_70px_-32px_rgba(0,0,0,0.92)] will-change-transform [perspective:1400px]"
      initial={reducedMotion ? false : { x: fromX, y: -26, rotate: fan, scale: 0.9, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
      transition={{
        duration: reducedMotion ? 0.001 : dealDuration,
        ease: EASE_OUT_QUART,
        delay: reducedMotion ? 0 : dealDelay,
      }}
      whileHover={reducedMotion ? undefined : { y: -10 }}
    >
      <motion.div
        className="relative size-full will-change-transform [transform-style:preserve-3d]"
        initial={reducedMotion ? false : { rotateY: 180 }}
        animate={{ rotateY: 0 }}
        transition={{
          duration: reducedMotion ? 0.001 : 0.6,
          ease: EASE_OUT_QUART,
          delay: reducedMotion ? 0 : flipDelay,
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <RoomCardBack />
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <CathedralCard
            entry={entry}
            mode="auto"
            fill
            animateIn={false}
            selected={selected}
            hovered={hovered}
            onSelect={onSelect}
            onOpenDetail={onOpenDetail}
            onHoverEnter={onHoverEnter}
            onHoverLeave={onHoverLeave}
            indexDelay={0}
            reducedMotion={reducedMotion}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
