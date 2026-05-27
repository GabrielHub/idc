import { memberSchema } from "../../domain/game";
import { aegis } from "./aegis";
import { aldricValeMarsh } from "./aldric-vale-marsh";
import { alexYoon } from "./alex-yoon";
import { anansi } from "./anansi";
import { anubis } from "./anubis";
import { baiWenshu } from "./bai-wenshu";
import { bradyStrait } from "./brady-strait";
import { calvinHewes } from "./calvin-hewes";
import { cassiaSix } from "./cassia-six";
import { cassieConners } from "./cassie-conners";
import { chaYusung } from "./cha-yusung";
import { concord } from "./concord";
import { cthala } from "./cthala";
import { daivenPatel } from "./daiven-patel";
import { decimusMariusTullio } from "./decimus-marius-tullio";
import { derekHalsey } from "./derek-halsey";
import { eleanorAsh } from "./eleanor-ash";
import { epsy } from "./epsy";
import { fredStavropoulos } from "./fred-stavropoulos";
import { gabrielTan } from "./gabriel-tan";
import { gideonGlass } from "./gideon-glass";
import { idrisMahari } from "./idris-mahari";
import { imaniWallace } from "./imani-wallace";
import { jennaPike } from "./jenna-pike";
import { johnPork } from "./john-pork";
import { junieMarrow } from "./junie-marrow";
import { kadeSumner } from "./kade-sumner";
import { maeve } from "./maeve";
import { marcusPellish } from "./marcus-pellish";
import { marleeHines } from "./marlee-hines";
import { meiSato } from "./mei-sato";
import { meridianVale } from "./meridian-vale";
import { miraPark } from "./mira-park";
import { mjolnir } from "./mjolnir";
import { mrWhiskers } from "./mr-whiskers";
import { naiaVelorae } from "./naia-velorae";
import { nawalMarrash } from "./nawal-marrash";
import { noahKim } from "./noah-kim";
import { opalSunday } from "./opal-sunday";
import { reaver } from "./reaver";
import { rostin } from "./rostin";
import { ruby } from "./ruby";
import { ryanDoyle } from "./ryan-doyle";
import { saffronVex } from "./saffron-vex";
import { sanaKarim } from "./sana-karim";
import { seraVohn } from "./sera-vohn";
import { siennaBae } from "./sienna-bae";
import { tashaRell } from "./tasha-rell";
import { toastimusCroutonVance } from "./toastimus-crouton-vance";
import { tobyWenz } from "./toby-wenz";
import { venus } from "./venus";
import { vhool } from "./vhool";

export const starterMembers = memberSchema
  .array()
  .length(52)
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
    anansi,
    nawalMarrash,
    imaniWallace,
    siennaBae,
    maeve,
    junieMarrow,
    anubis,
    johnPork,
    cassiaSix,
    aegis,
    saffronVex,
    mjolnir,
    concord,
    rostin,
    fredStavropoulos,
    marleeHines,
    ruby,
    toastimusCroutonVance,
    daivenPatel,
  ]);

export {
  aegis,
  aldricValeMarsh,
  alexYoon,
  anansi,
  anubis,
  baiWenshu,
  bradyStrait,
  calvinHewes,
  cassiaSix,
  cassieConners,
  chaYusung,
  concord,
  cthala,
  daivenPatel,
  decimusMariusTullio,
  derekHalsey,
  eleanorAsh,
  epsy,
  fredStavropoulos,
  gabrielTan,
  gideonGlass,
  idrisMahari,
  imaniWallace,
  jennaPike,
  johnPork,
  junieMarrow,
  kadeSumner,
  maeve,
  marcusPellish,
  marleeHines,
  meiSato,
  meridianVale,
  miraPark,
  mjolnir,
  mrWhiskers,
  naiaVelorae,
  nawalMarrash,
  noahKim,
  opalSunday,
  reaver,
  rostin,
  ruby,
  ryanDoyle,
  saffronVex,
  sanaKarim,
  seraVohn,
  siennaBae,
  tashaRell,
  toastimusCroutonVance,
  tobyWenz,
  venus,
  vhool,
};
