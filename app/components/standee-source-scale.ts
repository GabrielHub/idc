export type StandeeSourceScale = {
  className: string;
  value: number;
};

export const DEFAULT_STANDEE_SOURCE_SCALE: StandeeSourceScale = {
  className: "scale-100",
  value: 1,
};

const STANDEE_SOURCE_SCALE_BY_MEMBER_ID: Readonly<Partial<Record<string, StandeeSourceScale>>> = {
  aegis: { className: "scale-[1.22]", value: 1.22 },
  "aldric-vale-marsh": { className: "scale-[1.26]", value: 1.26 },
  anubis: { className: "scale-[1.05]", value: 1.05 },
  "brady-strait": { className: "scale-[0.94]", value: 0.94 },
  "cassia-six": { className: "scale-[1.15]", value: 1.15 },
  "cassie-conners": { className: "scale-[1.09]", value: 1.09 },
  concord: { className: "scale-[1.05]", value: 1.05 },
  "decimus-marius-tullio": { className: "scale-[1.03]", value: 1.03 },
  epsy: { className: "scale-[1.05]", value: 1.05 },
  "imani-wallace": { className: "scale-[0.93]", value: 0.93 },
  "junie-marrow": { className: "scale-[2.35]", value: 2.35 },
  "marcus-pellish": { className: "scale-[1.04]", value: 1.04 },
  maeve: { className: "scale-[1.24]", value: 1.24 },
  "meridian-vale": { className: "scale-[0.96]", value: 0.96 },
  mjolnir: { className: "scale-[1.76]", value: 1.76 },
  "mr-whiskers": { className: "scale-[1.26]", value: 1.26 },
  rostin: { className: "scale-[0.93]", value: 0.93 },
  ruby: { className: "scale-[1.1]", value: 1.1 },
  "ryan-doyle": { className: "scale-[1.06]", value: 1.06 },
  "saffron-vex": { className: "scale-[0.93]", value: 0.93 },
  "sana-karim": { className: "scale-[1.05]", value: 1.05 },
  "sienna-bae": { className: "scale-[1.15]", value: 1.15 },
  "toastimus-crouton-vance": { className: "scale-[0.68]", value: 0.68 },
  "toby-wenz": { className: "scale-[0.87]", value: 0.87 },
  venus: { className: "scale-[1.02]", value: 1.02 },
  vhool: { className: "scale-[1.09]", value: 1.09 },
  "cha-yusung": { className: "scale-[1.13]", value: 1.13 },
};

export function resolveStandeeSourceScale(memberId: string): StandeeSourceScale {
  return STANDEE_SOURCE_SCALE_BY_MEMBER_ID[memberId] ?? DEFAULT_STANDEE_SOURCE_SCALE;
}
