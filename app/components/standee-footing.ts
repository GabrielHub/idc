import {
  DEFAULT_STANDEE_FOOTING,
  STANDEE_FOOTING_BY_CUTOUT_PATH,
} from "./standee-footing.generated";
import type { StandeeFooting } from "./standee-footing.generated";

export { STANDEE_FOOTING_BY_CUTOUT_PATH } from "./standee-footing.generated";

export function resolveStandeeFooting(cutoutPath: string | undefined): StandeeFooting {
  if (cutoutPath === undefined) {
    return DEFAULT_STANDEE_FOOTING;
  }

  return STANDEE_FOOTING_BY_CUTOUT_PATH[cutoutPath] ?? DEFAULT_STANDEE_FOOTING;
}
