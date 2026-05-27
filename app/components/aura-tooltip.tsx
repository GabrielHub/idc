import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom" | "left" | "right";

type TooltipPosition = {
  top: number;
  left: number;
  placement: Placement;
};

const ARROW_PLACEMENT_CLASSES: Record<Placement, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b",
  bottom: "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 border-t border-l",
  left: "left-full top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45 border-t border-r",
  right: "right-full top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 border-b border-l",
};

const TOOLTIP_GAP = 10;
const VIEWPORT_MARGIN = 12;

export function AuraTooltip({
  label,
  placement = "top",
  delayMs = 120,
  children,
  align = "inline",
}: {
  label: ReactNode;
  placement?: Placement;
  delayMs?: number;
  children: ReactNode;
  align?: "inline" | "block";
}) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current !== null) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const handleShow = useCallback(() => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (visible) return;
    showTimer.current = window.setTimeout(() => setVisible(true), delayMs);
  }, [delayMs, visible]);

  const handleHide = useCallback(() => {
    if (showTimer.current !== null) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    hideTimer.current = window.setTimeout(() => setVisible(false), 60);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (trigger === null || tooltip === null) return;
    setPosition(resolveTooltipPosition(trigger.getBoundingClientRect(), tooltip, placement));
  }, [placement]);

  useEffect(() => clearTimers, [clearTimers]);

  useLayoutEffect(() => {
    if (!visible) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [updatePosition, visible]);

  useEffect(() => {
    if (!visible) return;
    const onUpdate = () => updatePosition();
    window.addEventListener("resize", onUpdate);
    window.addEventListener("scroll", onUpdate, true);
    return () => {
      window.removeEventListener("resize", onUpdate);
      window.removeEventListener("scroll", onUpdate, true);
    };
  }, [updatePosition, visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  const wrapperClass = align === "block" ? "relative inline-block" : "relative inline-flex";

  return (
    <span
      ref={triggerRef}
      className={wrapperClass}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocusCapture={handleShow}
      onBlurCapture={handleHide}
    >
      <span aria-describedby={visible ? tooltipId : undefined} className="contents">
        {children}
      </span>
      {visible
        ? createPortal(
            <span
              ref={tooltipRef}
              role="tooltip"
              id={tooltipId}
              className={`pointer-events-none fixed z-50 max-w-xs whitespace-normal rounded-lg border border-white/15 bg-slate-900/95 px-3 py-2 text-sm leading-snug text-white/95 shadow-[0_22px_60px_-22px_rgba(15,23,42,0.55)] backdrop-blur-md ${
                position === null ? "opacity-0" : "opacity-100"
              }`}
              style={
                position === null
                  ? undefined
                  : {
                      top: position.top,
                      left: position.left,
                    }
              }
            >
              {label}
              {position === null ? null : (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute h-2 w-2 border-white/15 bg-slate-900/95 ${ARROW_PLACEMENT_CLASSES[position.placement]}`}
                />
              )}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

function resolveTooltipPosition(
  trigger: DOMRect,
  tooltip: HTMLElement,
  preferredPlacement: Placement,
): TooltipPosition {
  const tooltipRect = tooltip.getBoundingClientRect();
  const width = tooltipRect.width;
  const height = tooltipRect.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  for (const candidate of orderedPlacements(preferredPlacement)) {
    const position = candidatePosition(candidate, trigger, width, height);
    if (
      position.top >= VIEWPORT_MARGIN &&
      position.left >= VIEWPORT_MARGIN &&
      position.top + height <= viewportHeight - VIEWPORT_MARGIN &&
      position.left + width <= viewportWidth - VIEWPORT_MARGIN
    ) {
      return position;
    }
  }

  const fallback = candidatePosition(preferredPlacement, trigger, width, height);
  return {
    ...fallback,
    top: clampNumber(fallback.top, VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN),
    left: clampNumber(fallback.left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
  };
}

function orderedPlacements(preferredPlacement: Placement): Placement[] {
  const opposite: Record<Placement, Placement> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };
  const candidates: Placement[] = [
    preferredPlacement,
    opposite[preferredPlacement],
    "top",
    "bottom",
    "right",
    "left",
  ];
  return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}

function candidatePosition(
  placement: Placement,
  trigger: DOMRect,
  width: number,
  height: number,
): TooltipPosition {
  if (placement === "bottom") {
    return {
      placement,
      top: trigger.bottom + TOOLTIP_GAP,
      left: trigger.left + trigger.width / 2 - width / 2,
    };
  }
  if (placement === "left") {
    return {
      placement,
      top: trigger.top + trigger.height / 2 - height / 2,
      left: trigger.left - width - TOOLTIP_GAP,
    };
  }
  if (placement === "right") {
    return {
      placement,
      top: trigger.top + trigger.height / 2 - height / 2,
      left: trigger.right + TOOLTIP_GAP,
    };
  }
  return {
    placement,
    top: trigger.top - height - TOOLTIP_GAP,
    left: trigger.left + trigger.width / 2 - width / 2,
  };
}

function clampNumber(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}
