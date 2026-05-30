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
  { base: "lean", ing: "leaning" },
  { base: "reach", ing: "reaching" },
  { base: "move", ing: "moving" },
  { base: "turn", ing: "turning" },
  { base: "scroll", ing: "scrolling" },
  { base: "type", ing: "typing" },
  { base: "enter", ing: "entering" },
  { base: "clock", ing: "clocking" },
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

const EMPHASIS_WRAPPED_SCENE_NARRATION_PATTERN =
  /\*+\s*(?:(?:the\s+)?(?:first\s+few\s+bars|room|screen|tablet|title|countdown|track|song|mic|microphone|lights?|speakers?|cursor|machine)\b[^*\n]{0,120}|(?:i|he|she|they)\s+(?:clock|tap|press|hit|start|sing|grab|pick)\b[^*\n]{0,120})\*+/gi;

const QUOTED_CONTENT_THEN_ACTION_PATTERN =
  /((?:"\*[^"\n]{1,100}\*"|\*[^*\n]{1,100}\*)\.?)\s+I\s+(?:set|place|put|slide|hand|pass|turn|tap|press|pick|lift|lower)\b[^.!?\n]*[.!?]?/gi;

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

const DIRECTIONAL_ACTION_NARRATION_PATTERN =
  /^(?:he|she|they)(?:'s|'re)?\s+steps?\s+(?:forward|back|toward|away|across|onto|off|around)\b/i;

const NAMED_ACTION_NARRATION_PATTERN =
  /^(?!(?:He|She|They)\b)(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:glances|looks(?!\s+like\b)|leans|reaches|shifts|slides|scoots|grabs|places|pours|sips|taps|folds|gestures|tilts|lowers|lifts|nods|shrugs|rubs|brushes|wipes|scratches|blinks|winces|grimaces|swallows|waves)\b/;

const NAMED_ACTION_WITH_SPEECH_PATTERN =
  /\band\s+(?:asks|says|tells|admits|names|offers|answers|refuses|invites|wonders|lets)\b/i;

const SCENE_DIRECTION_NARRATION_PATTERN =
  /^(?:a|an|the)?\s*(?:first\s+few\s+bars|room|screen|tablet|title|countdown|track|song|mic|microphone|lights?|speakers?|cursor|machine|board|controller|pieces?|pawn|rook|bishop|queen|king|knight)\s+(?:dims?|appears?|starts?|begins?|loads?|displays?|reads?|flashes?|cycles?|fades?|nudges?|prints?|slides?|plays?|waits?|rests?|glows?|pulses?|hits?|squelches?|locks?|opens?|goes\s+quiet|lights?\s+up|turns?\s+on|steps?|stepped|moves?|moved|walks?|walked|slid|accepts?|accepted|blinks?|blinked)\b/i;

const PAUSE_NARRATION_PATTERN = /^(?:a\s+)?(?:pause|beat|silence)\.?$/i;

export function stripPerformerActionNarration(text: string): string {
  const withoutActionSpans = text
    .replace(EMPHASIS_WRAPPED_ACTION_PATTERN, " ")
    .replace(EMPHASIS_WRAPPED_SCENE_NARRATION_PATTERN, " ")
    .replace(QUOTED_CONTENT_THEN_ACTION_PATTERN, "$1");
  const sentenceMatches = withoutActionSpans.match(/[^.!?]+[.!?]*\s*/g) ?? [withoutActionSpans];
  const keptSentences = sentenceMatches.filter((sentence) => {
    const probe = sentence.replace(/[*_]+/g, "").trim();

    if (probe.length === 0) {
      return sentence.trim().length > 0;
    }

    return (
      !ACTION_NARRATION_PATTERN.test(probe) &&
      !DIRECTIONAL_ACTION_NARRATION_PATTERN.test(probe) &&
      !(
        NAMED_ACTION_NARRATION_PATTERN.test(probe) && !NAMED_ACTION_WITH_SPEECH_PATTERN.test(probe)
      ) &&
      !SCENE_DIRECTION_NARRATION_PATTERN.test(probe) &&
      !PAUSE_NARRATION_PATTERN.test(probe)
    );
  });

  return keptSentences
    .join("")
    .replace(/"(\*[^"\n]+\*)"/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function containsPerformerActionNarration(text: string): boolean {
  return normalizeProbe(stripPerformerActionNarration(text)) !== normalizeProbe(text);
}

function normalizeProbe(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
