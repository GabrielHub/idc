const BARE_ACTION_VERBS = [
  "laughs",
  "smiles",
  "nods",
  "shrugs",
  "pauses",
  "sighs",
  "looks",
  "glances",
  "leans",
  "blinks",
  "winces",
  "grimaces",
  "breathes",
  "swallows",
  "grabs",
  "pours",
  "sips",
  "tilts",
  "gestures",
  "folds",
  "crosses",
  "waves",
  "rubs",
  "scratches",
] as const;

const THIRD_PERSON_ACTION_VERBS = [
  "leans",
  "lean",
  "sits",
  "sit",
  "reaches",
  "reach",
  "shifts",
  "shift",
  "slides",
  "slide",
  "scoots",
  "scoot",
  "grabs",
  "grab",
  "places",
  "place",
  "pours",
  "pour",
  "sips",
  "sip",
  "taps",
  "tap",
  "folds",
  "fold",
  "gestures",
  "gesture",
  "tilts",
  "tilt",
  "lowers",
  "lower",
  "lifts",
  "lift",
  "nods",
  "nod",
  "shrugs",
  "shrug",
  "rubs",
  "rub",
  "brushes",
  "brush",
  "wipes",
  "wipe",
  "scratches",
  "scratch",
  "blinks",
  "blink",
  "winces",
  "wince",
  "grimaces",
  "grimace",
  "swallows",
  "swallow",
  "waves",
  "wave",
] as const;

const EMPHASIS_ONLY_ACTION_VERBS = [
  "looks",
  "look",
  "glances",
  "glance",
  "stares",
  "stare",
  "smiles",
  "smile",
  "laughs",
  "laugh",
  "sighs",
  "sigh",
  "pauses",
  "pause",
  "frowns",
  "frown",
  "smirks",
  "smirk",
  "winks",
  "wink",
  "breathes",
  "breathe",
  "watches",
  "watch",
  "studies",
  "study",
  "scans",
  "scan",
  "points",
  "point",
  "moves",
  "move",
  "holds",
  "hold",
  "drops",
  "drop",
  "puts",
  "put",
] as const;

const FIRST_PERSON_ACTION_VERBS: readonly { base: string; ing: string }[] = [
  { base: "slide", ing: "sliding" },
  { base: "release", ing: "releasing" },
  { base: "press", ing: "pressing" },
  { base: "tap", ing: "tapping" },
  { base: "push", ing: "pushing" },
  { base: "set", ing: "setting" },
  { base: "hand", ing: "handing" },
  { base: "pass", ing: "passing" },
  { base: "open", ing: "opening" },
  { base: "close", ing: "closing" },
  { base: "lift", ing: "lifting" },
  { base: "lower", ing: "lowering" },
  { base: "pull", ing: "pulling" },
  { base: "place", ing: "placing" },
  { base: "pick", ing: "picking" },
  { base: "reach", ing: "reaching" },
  { base: "move", ing: "moving" },
  { base: "turn", ing: "turning" },
  { base: "scroll", ing: "scrolling" },
  { base: "type", ing: "typing" },
  { base: "enter", ing: "entering" },
];

const EMPHASIS_WRAPPED_EXTRA_VERBS = [
  "stands",
  "stand",
  "steps",
  "step",
  "settles",
  "settle",
  "pushes",
  "push",
  "pulls",
  "pull",
  "picks",
  "pick",
  "sets",
  "set",
  "crosses",
  "cross",
  "rolls",
  "roll",
  "presses",
  "press",
  "runs",
  "run",
  "shakes",
  "shake",
  "wraps",
  "wrap",
  "cups",
  "cup",
  "tucks",
  "tuck",
  "grips",
  "grip",
  "squeezes",
  "squeeze",
  "clasps",
  "clasp",
  "drums",
  "drum",
  "traces",
  "trace",
  "exhales",
  "exhale",
  "inhales",
  "inhale",
  "rests",
  "rest",
  "props",
  "prop",
  "slumps",
  "slump",
  "cradles",
  "cradle",
  "fidgets",
  "fidget",
] as const;

const EMPHASIS_WRAPPED_ACTION_PATTERN = new RegExp(
  `\\*+\\s*(?:${[
    ...THIRD_PERSON_ACTION_VERBS,
    ...EMPHASIS_ONLY_ACTION_VERBS,
    ...EMPHASIS_WRAPPED_EXTRA_VERBS,
  ].join("|")})\\b[^*\\n]{0,80}\\*+`,
  "gi",
);

const ACTION_NARRATION_PATTERN = new RegExp(
  "^(?:" +
    `(?:${BARE_ACTION_VERBS.join("|")})` +
    `|(?:he|she|they)(?:'s|'re)?\\s+(?:${THIRD_PERSON_ACTION_VERBS.join("|")})` +
    `|I\\s+(?:(?:${FIRST_PERSON_ACTION_VERBS.map((verb) => verb.base).join(
      "|",
    )})|(?:am|will be)\\s+(?:${FIRST_PERSON_ACTION_VERBS.map((verb) => verb.ing).join("|")}))` +
    ")\\b",
  "i",
);

export function stripPerformerActionNarration(text: string): string {
  const withoutActionSpans = text.replace(EMPHASIS_WRAPPED_ACTION_PATTERN, " ");
  const sentenceMatches = withoutActionSpans.match(/[^.!?]+[.!?]*\s*/g) ?? [withoutActionSpans];
  const keptSentences = sentenceMatches.filter((sentence) => {
    const probe = sentence.replace(/[*_]+/g, "").trim();

    if (probe.length === 0) {
      return sentence.trim().length > 0;
    }

    return !ACTION_NARRATION_PATTERN.test(probe);
  });

  return keptSentences
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function containsPerformerActionNarration(text: string): boolean {
  return normalizeProbe(stripPerformerActionNarration(text)) !== normalizeProbe(text);
}

function normalizeProbe(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
