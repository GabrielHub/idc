import { memberSchema } from "../../domain/game";
import { aldricValeMarsh } from "./aldric-vale-marsh";
import { alexYoon } from "./alex-yoon";
import { baiWenshu } from "./bai-wenshu";
import { bradyStrait } from "./brady-strait";
import { calvinHewes } from "./calvin-hewes";
import { cassieConners } from "./cassie-conners";
import { chaYusung } from "./cha-yusung";
import { cthala } from "./cthala";
import { decimusMariusTullio } from "./decimus-marius-tullio";
import { derekHalsey } from "./derek-halsey";
import { eleanorAsh } from "./eleanor-ash";
import { epsy } from "./epsy";
import { gabrielTan } from "./gabriel-tan";
import { gideonGlass } from "./gideon-glass";
import { idrisMahari } from "./idris-mahari";
import { jennaPike } from "./jenna-pike";
import { kadeSumner } from "./kade-sumner";
import { marcusPellish } from "./marcus-pellish";
import { meiSato } from "./mei-sato";
import { meridianVale } from "./meridian-vale";
import { miraPark } from "./mira-park";
import { mrWhiskers } from "./mr-whiskers";
import { naiaVelorae } from "./naia-velorae";
import { noahKim } from "./noah-kim";
import { opalSunday } from "./opal-sunday";
import { reaver } from "./reaver";
import { ryanDoyle } from "./ryan-doyle";
import { sanaKarim } from "./sana-karim";
import { seraVohn } from "./sera-vohn";
import { tashaRell } from "./tasha-rell";
import { tobyWenz } from "./toby-wenz";
import { venus } from "./venus";
import { vhool } from "./vhool";

export const starterMembers = memberSchema
  .array()
  .length(33)
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
    chaYusung,
    epsy,
    cassieConners,
    idrisMahari,
    reaver,
    cthala,
    naiaVelorae,
    gabrielTan,
    noahKim,
    derekHalsey,
    ryanDoyle,
    alexYoon,
  ]);

export {
  aldricValeMarsh,
  alexYoon,
  baiWenshu,
  bradyStrait,
  calvinHewes,
  cassieConners,
  chaYusung,
  cthala,
  decimusMariusTullio,
  derekHalsey,
  eleanorAsh,
  epsy,
  gabrielTan,
  gideonGlass,
  idrisMahari,
  jennaPike,
  kadeSumner,
  marcusPellish,
  meiSato,
  meridianVale,
  miraPark,
  mrWhiskers,
  naiaVelorae,
  noahKim,
  opalSunday,
  reaver,
  ryanDoyle,
  sanaKarim,
  seraVohn,
  tashaRell,
  tobyWenz,
  venus,
  vhool,
};
