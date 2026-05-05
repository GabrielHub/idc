import { memberSchema } from "../../domain/game";
import { gideonGlass } from "./gideon-glass";
import { jennaPike } from "./jenna-pike";
import { kadeSumner } from "./kade-sumner";
import { meridianVale } from "./meridian-vale";
import { mrWhiskers } from "./mr-whiskers";
import { opalSunday } from "./opal-sunday";
import { sanaKarim } from "./sana-karim";
import { tashaRell } from "./tasha-rell";
import { vhool } from "./vhool";

export const starterMembers = memberSchema
  .array()
  .length(9)
  .parse([
    jennaPike,
    meridianVale,
    vhool,
    mrWhiskers,
    opalSunday,
    gideonGlass,
    sanaKarim,
    kadeSumner,
    tashaRell,
  ]);

export {
  gideonGlass,
  jennaPike,
  kadeSumner,
  meridianVale,
  mrWhiskers,
  opalSunday,
  sanaKarim,
  tashaRell,
  vhool,
};
