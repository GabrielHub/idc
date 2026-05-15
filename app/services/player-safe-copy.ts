/**
 * Player-safe copy scrubbing.
 *
 * Runtime AI occasionally echoes internal system terminology or stat numbers
 * back into player-facing text. These helpers strip both kinds of leak so
 * anything the player reads stays in-fiction.
 *
 * Narrative surfaces (memories, judge summaries, pair notes) call
 * scrubPlayerSafeCopy for the full strip. Dialogue uses cleanMemberFacingText
 * alone, since characters can legitimately mention numbers.
 */

const FORBIDDEN_DASH_PATTERN = /[\u2014\u2013]/u;

const STAT_NAME_GROUP =
  "Spark|Strain|Chemistry|Trust|Stability|Conflict|Weirdness\\s+Tolerance|Relationship\\s+Health|Health";

const STAT_WITH_NUMBER_PATTERN = new RegExp(
  `\\b(?:${STAT_NAME_GROUP})\\s*[:=]?\\s*[-+]?\\d+%?\\.?\\s*`,
  "giu",
);

const DATE_HEALTH_BARE_NUMBER_PATTERN = /\bDate Health\s*[:=]?\s*[-+]?\d+%?\.?\s*/giu;

const DATE_HEALTH_DELTA_BARE_PATTERN = /\bDate Health delta\s*[-+]?\d+%?\.?\s*/giu;

const FINAL_DATE_HEALTH_PATTERN = /\bFinal Date Health was [-+]?\d+%?\.?/giu;

const DATE_HEALTH_DELTA_WITH_PREFIX_PATTERN = /\bwith Date Health delta [-+]?\d+%?\.?/giu;

const MEMBER_FACING_TERMS_GATE =
  /\b(?:scenarios?|transcripts?|turns?|Date Health|gameplay|simulation|sim)\b/iu;

const NUMERIC_STAT_GATE = new RegExp(`\\b(?:Date Health|${STAT_NAME_GROUP})\\b`, "iu");

export function stripForbiddenPunctuation(text: string): string {
  if (!FORBIDDEN_DASH_PATTERN.test(text)) {
    return text;
  }

  return text
    .replace(/[\u2014\u2013]/gu, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .replace(/\s{2,}/g, " ");
}

export function cleanMemberFacingText(text: string): string {
  if (!MEMBER_FACING_TERMS_GATE.test(text)) {
    return text;
  }
  return text
    .replace(/\bscenario\b/gi, "date")
    .replace(/\bscenarios\b/gi, "dates")
    .replace(/\btranscript\b/gi, "conversation")
    .replace(/\btranscripts\b/gi, "conversations")
    .replace(/\bturn\b/gi, "message")
    .replace(/\bturns\b/gi, "messages")
    .replace(/\bDate Health\b/g, "comfort")
    .replace(/\bgameplay\b/gi, "date")
    .replace(/\bsimulation\b/gi, "date")
    .replace(/\bsim\b/gi, "date");
}

function stripNumericStatLanguage(text: string): string {
  if (!NUMERIC_STAT_GATE.test(text)) {
    return text;
  }
  return text
    .replace(FINAL_DATE_HEALTH_PATTERN, "Cupid filed a nonnumeric comfort note.")
    .replace(DATE_HEALTH_DELTA_WITH_PREFIX_PATTERN, "with a filed comfort movement.")
    .replace(DATE_HEALTH_DELTA_BARE_PATTERN, "")
    .replace(DATE_HEALTH_BARE_NUMBER_PATTERN, "")
    .replace(STAT_WITH_NUMBER_PATTERN, "");
}

export function scrubPlayerSafeCopy(text: string): string {
  const punctuationCleaned = stripForbiddenPunctuation(text);
  const numericsStripped = stripNumericStatLanguage(punctuationCleaned);
  const terminologyReplaced = cleanMemberFacingText(numericsStripped);

  return terminologyReplaced
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*,/g, ".")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,\s]+/, "")
    .trim();
}
