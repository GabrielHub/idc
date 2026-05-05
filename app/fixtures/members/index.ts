import { memberSchema } from "../../domain/game";
import { gideonGlass } from "./gideon-glass";
import { jennaPike } from "./jenna-pike";
import { meridianVale } from "./meridian-vale";
import { mrWhiskers } from "./mr-whiskers";
import { opalSunday } from "./opal-sunday";
import { vhool } from "./vhool";

export const starterMembers = memberSchema
  .array()
  .length(6)
  .parse([jennaPike, meridianVale, vhool, mrWhiskers, opalSunday, gideonGlass]);

export { gideonGlass, jennaPike, meridianVale, mrWhiskers, opalSunday, vhool };
