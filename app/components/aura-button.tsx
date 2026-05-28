import { forwardRef, type ButtonHTMLAttributes } from "react";

import { AuraTooltip } from "./aura-tooltip";

type TooltipPlacement = "top" | "bottom" | "left" | "right";
type TooltipAlign = "inline" | "block";

type AuraButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  /**
   * Tooltip body. When omitted, the button renders without a tooltip wrapper —
   * the right choice when the visible label already conveys the affordance.
   * When present, it also becomes the default `aria-label` so callers don't
   * need to repeat the same string twice.
   */
  tooltip?: string;
  tooltipPlacement?: TooltipPlacement;
  tooltipAlign?: TooltipAlign;
  tooltipClassName?: string;
};

export const AuraButton = forwardRef<HTMLButtonElement, AuraButtonProps>(function AuraButton(
  { tooltip, tooltipPlacement = "top", tooltipAlign, tooltipClassName, type, ...rest },
  ref,
) {
  const ariaLabel = rest["aria-label"] ?? tooltip;
  const button = <button ref={ref} type={type ?? "button"} {...rest} aria-label={ariaLabel} />;
  if (tooltip === undefined) return button;
  return (
    <AuraTooltip
      label={tooltip}
      placement={tooltipPlacement}
      align={tooltipAlign}
      className={tooltipClassName}
    >
      {button}
    </AuraTooltip>
  );
});
