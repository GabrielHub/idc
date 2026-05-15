import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { EASE_OUT_QUART, LiveDot, Tooltip } from "../dashboard-atoms";
import type { AiBootState } from "./shared";

const FIRST_SHIFT_SUBHEAD =
  "First day on the floor. The hopefuls are in the lobby. Reality is, mostly, in one piece.";

const RETURNING_SUBHEAD =
  "The interns left the universe in roughly the same shape you found it. Mostly.";

const BOOT_FINALE_AT_MS = 1100;
const BOOT_HEAD_DELAY_S = 0.08;
const BOOT_TAIL_DELAY_S = 0.32;
const BOOT_SUBHEAD_DELAY_S = 0.45;
const BOOT_QUOTE_DELAY_S = 0.6;
const BOOT_ROW_BASE_DELAY_MS = 380;
const BOOT_ROW_STAGGER_MS = 90;
const BOOT_ROW_RESOLVE_STAGGER_MS = 55;

export function EditorialColumn({
  hasSave,
  aiBoot,
  aiMessage,
  onConfigureAi,
}: {
  hasSave: boolean;
  aiBoot: AiBootState;
  aiMessage: string;
  onConfigureAi: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: 0.1 }}
      className="relative space-y-7"
    >
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
        // reality.cupid.gateway
      </p>

      <Headline hasSave={hasSave} />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_QUART, delay: BOOT_SUBHEAD_DELAY_S }}
        className="max-w-[36ch] text-lead text-aura-muted"
      >
        {hasSave ? RETURNING_SUBHEAD : FIRST_SHIFT_SUBHEAD}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_QUART, delay: BOOT_SUBHEAD_DELAY_S + 0.05 }}
        className="aura-rule max-w-md origin-left"
      />

      <PullQuote />

      <SystemStatusList aiBoot={aiBoot} aiMessage={aiMessage} onConfigureAi={onConfigureAi} />
    </motion.section>
  );
}

function Headline({ hasSave }: { hasSave: boolean }) {
  const head = hasSave ? "Welcome" : "Clock";
  const tail = hasSave ? "back." : "in.";

  return (
    <h1 className="font-display text-display-xl font-semibold leading-[0.95] tracking-tight text-aura-ink">
      <motion.span
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: BOOT_HEAD_DELAY_S }}
        className="inline-block"
      >
        {head}
      </motion.span>{" "}
      <motion.span
        initial={{ opacity: 0, y: -34, scale: 1.5, rotate: -7 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_QUART, delay: BOOT_TAIL_DELAY_S }}
        className="aura-accent inline-block text-display-xl text-aura-rose"
      >
        {tail}
      </motion.span>
    </h1>
  );
}

function PullQuote() {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_QUART, delay: BOOT_QUOTE_DELAY_S }}
      className="max-w-sm"
    >
      <blockquote className="aura-accent text-label italic leading-relaxed text-aura-muted">
        &ldquo;Match made, paperwork filed.&rdquo;
      </blockquote>
      <figcaption className="mt-1 font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
        Cupid handbook, page 1
      </figcaption>
    </motion.figure>
  );
}

type StatusRowKind = "static" | "ai";

type StatusRowDef = {
  id: string;
  kind: StatusRowKind;
  label: string;
  finalTone: "rose" | "emerald" | "amber";
  finalValue: string;
};

function SystemStatusList({
  aiBoot,
  aiMessage,
  onConfigureAi,
}: {
  aiBoot: AiBootState;
  aiMessage: string;
  onConfigureAi: () => void;
}) {
  const aiTone: "emerald" | "amber" = aiBoot === "ready" ? "emerald" : "amber";
  const aiValue = aiBoot === "ready" ? "ready" : "configure";

  const rows: StatusRowDef[] = [
    {
      id: "reality",
      kind: "static",
      label: "reality bridge",
      finalTone: "emerald",
      finalValue: "stable",
    },
    {
      id: "prophecy",
      kind: "static",
      label: "prophecy ledger",
      finalTone: "emerald",
      finalValue: "sealed",
    },
    {
      id: "ai",
      kind: "ai",
      label: "ai system",
      finalTone: aiTone,
      finalValue: aiValue,
    },
    {
      id: "coffee",
      kind: "static",
      label: "coffee inventory",
      finalTone: "amber",
      finalValue: "critically low",
    },
  ];

  return (
    <ul className="space-y-1.5 pt-2 font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
      {rows.map((row, index) => (
        <SystemRow
          key={row.id}
          row={row}
          enterDelayMs={BOOT_ROW_BASE_DELAY_MS + index * BOOT_ROW_STAGGER_MS}
          resolveAtMs={BOOT_FINALE_AT_MS + index * BOOT_ROW_RESOLVE_STAGGER_MS}
          aiBoot={aiBoot}
          aiMessage={aiMessage}
          onConfigureAi={onConfigureAi}
        />
      ))}
    </ul>
  );
}

function SystemRow({
  row,
  enterDelayMs,
  resolveAtMs,
  aiBoot,
  aiMessage,
  onConfigureAi,
}: {
  row: StatusRowDef;
  enterDelayMs: number;
  resolveAtMs: number;
  aiBoot: AiBootState;
  aiMessage: string;
  onConfigureAi: () => void;
}) {
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setResolved(true), resolveAtMs);
    return () => window.clearTimeout(id);
  }, [resolveAtMs]);

  const showStaticFinal = resolved && row.kind === "static";
  const showAiFinal = resolved && row.kind === "ai" && aiBoot !== "checking";

  const tone = showStaticFinal || showAiFinal ? row.finalTone : "amber";
  const valueText = showStaticFinal ? row.finalValue : showAiFinal ? row.finalValue : "checking";

  const aiActionable = row.kind === "ai" && resolved && aiBoot === "missing";
  const labelNode = <span className="text-aura-faint">{row.label}</span>;

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_QUART, delay: enterDelayMs / 1000 }}
      className="flex items-center gap-3"
    >
      <LiveDot tone={tone} />
      {row.kind === "ai" ? (
        <Tooltip message={aiMessage} placement="bottom-start">
          <span
            tabIndex={0}
            className="cursor-help rounded-sm outline-none focus-visible:text-aura-rose"
          >
            {row.label}
          </span>
        </Tooltip>
      ) : (
        labelNode
      )}
      <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
      {aiActionable ? (
        <button
          type="button"
          data-sfx="click"
          onClick={onConfigureAi}
          className="group inline-flex cursor-pointer items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose transition hover:text-aura-fuchsia"
        >
          <span className="border-b border-dotted border-current/50 pb-0.5 transition group-hover:border-current">
            configure
          </span>
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </button>
      ) : (
        <span className={`font-semibold ${valueColorClass(tone, valueText)}`}>{valueText}</span>
      )}
    </motion.li>
  );
}

function valueColorClass(tone: "rose" | "emerald" | "amber", value: string): string {
  if (value === "checking") {
    return "text-aura-amber";
  }
  if (tone === "emerald") {
    return "text-aura-ink";
  }
  if (tone === "amber") {
    return "text-aura-amber";
  }
  return "text-aura-rose";
}
