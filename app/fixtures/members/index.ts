import { memberSchema } from "../../domain/game";
import { bradyStrait } from "./brady-strait";
import { calvinHewes } from "./calvin-hewes";
import { gideonGlass } from "./gideon-glass";
import { jennaPike } from "./jenna-pike";
import { kadeSumner } from "./kade-sumner";
import { meridianVale } from "./meridian-vale";
import { mrWhiskers } from "./mr-whiskers";
import { opalSunday } from "./opal-sunday";
import { sanaKarim } from "./sana-karim";
import { tashaRell } from "./tasha-rell";
import { tobyWenz } from "./toby-wenz";
import { venus } from "./venus";
import { vhool } from "./vhool";

export const starterMembers = memberSchema
  .array()
  .length(13)
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
    venus,
    calvinHewes,
    bradyStrait,
    tobyWenz,
  ]);

export {
  bradyStrait,
  calvinHewes,
  gideonGlass,
  jennaPike,
  kadeSumner,
  meridianVale,
  mrWhiskers,
  opalSunday,
  sanaKarim,
  tashaRell,
  tobyWenz,
  venus,
  vhool,
};
