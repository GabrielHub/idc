import { memberSchema } from "../../domain/game";
import { aldricValeMarsh } from "./aldric-vale-marsh";
import { bradyStrait } from "./brady-strait";
import { calvinHewes } from "./calvin-hewes";
import { decimusMariusTullio } from "./decimus-marius-tullio";
import { eleanorAsh } from "./eleanor-ash";
import { gideonGlass } from "./gideon-glass";
import { jennaPike } from "./jenna-pike";
import { kadeSumner } from "./kade-sumner";
import { marcusPellish } from "./marcus-pellish";
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
  .length(17)
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
    marcusPellish,
    aldricValeMarsh,
    eleanorAsh,
    decimusMariusTullio,
  ]);

export {
  aldricValeMarsh,
  bradyStrait,
  calvinHewes,
  decimusMariusTullio,
  eleanorAsh,
  gideonGlass,
  jennaPike,
  kadeSumner,
  marcusPellish,
  meridianVale,
  mrWhiskers,
  opalSunday,
  sanaKarim,
  tashaRell,
  tobyWenz,
  venus,
  vhool,
};
