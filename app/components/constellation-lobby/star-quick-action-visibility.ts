import type { StarMark, StarQuickAction } from "./types";

export function shouldShowStarQuickActions({
  tier,
  clustered,
  actions,
}: {
  tier: StarMark["tier"];
  clustered: boolean;
  actions: readonly StarQuickAction[] | undefined;
}): boolean {
  return actions !== undefined && actions.length > 0 && (tier !== "background" || clustered);
}
