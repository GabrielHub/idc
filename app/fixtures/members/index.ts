import { memberSchema } from "../../domain/game";
import { aldricValeMarsh } from "./aldric-vale-marsh";
import { baiWenshu } from "./bai-wenshu";
import { bradyStrait } from "./brady-strait";
import { calvinHewes } from "./calvin-hewes";
import { decimusMariusTullio } from "./decimus-marius-tullio";
import { eleanorAsh } from "./eleanor-ash";
import { gideonGlass } from "./gideon-glass";
import { jennaPike } from "./jenna-pike";
import { kadeSumner } from "./kade-sumner";
import { marcusPellish } from "./marcus-pellish";
import { meiSato } from "./mei-sato";
import { meridianVale } from "./meridian-vale";
import { miraPark } from "./mira-park";
import { mrWhiskers } from "./mr-whiskers";
import { opalSunday } from "./opal-sunday";
import { sanaKarim } from "./sana-karim";
import { seraVohn } from "./sera-vohn";
import { tashaRell } from "./tasha-rell";
import { tobyWenz } from "./toby-wenz";
import { venus } from "./venus";
import { vhool } from "./vhool";

export const starterMembers = memberSchema
  .array()
  .length(21)
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
    miraPark,
    seraVohn,
    meiSato,
    baiWenshu,
  ]);

export {
  aldricValeMarsh,
  baiWenshu,
  bradyStrait,
  calvinHewes,
  decimusMariusTullio,
  eleanorAsh,
  gideonGlass,
  jennaPike,
  kadeSumner,
  marcusPellish,
  meiSato,
  meridianVale,
  miraPark,
  mrWhiskers,
  opalSunday,
  sanaKarim,
  seraVohn,
  tashaRell,
  tobyWenz,
  venus,
  vhool,
};
