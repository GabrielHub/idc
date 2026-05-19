import type { Member, MemberTag } from "../domain/game";

export type HiddenInfoLeakField =
  | "bio"
  | "secret"
  | "species"
  | "dimension"
  | "reality_status"
  | "origin"
  | "tag";

export type HiddenInfoLeak = {
  memberId: string;
  memberName: string;
  field: HiddenInfoLeakField;
  evidence: string;
  matchKind: "phrase" | "label";
};

export type HiddenInfoLeakOptions = {
  includeSingleLabels?: boolean;
};

type LeakProfile = {
  phrases: Map<string, HiddenInfoLeakField>;
  labelPhrases: Map<string, HiddenInfoLeakField>;
  labels: Map<string, HiddenInfoLeakField>;
};

const LEAK_PHRASE_TOKEN_COUNT = 3;
const LABEL_PHRASE_TOKEN_COUNT = 2;
const MIN_LEAK_TOKEN_LENGTH = 4;
const MIN_SINGLE_LABEL_LENGTH = 6;
const WORD_PATTERN = /[a-z0-9_'-]+/gi;

const COMMON_TOKENS = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "you",
  "your",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "they",
  "them",
  "their",
  "from",
  "into",
  "but",
  "not",
  "any",
  "all",
  "out",
  "what",
  "when",
  "where",
  "who",
  "why",
  "how",
  "will",
  "would",
  "could",
  "should",
  "about",
  "after",
  "before",
  "very",
  "just",
  "more",
  "most",
  "less",
  "than",
  "then",
  "some",
  "still",
  "even",
  "ever",
  "never",
  "always",
  "much",
  "many",
  "few",
  "one",
  "two",
  "three",
  "four",
  "five",
  "first",
  "second",
  "third",
  "really",
  "actually",
  "kind",
  "sort",
  "type",
  "thing",
  "things",
  "people",
  "person",
  "place",
  "places",
  "time",
  "times",
  "day",
  "night",
  "week",
  "year",
  "years",
  "today",
  "tonight",
  "table",
  "human",
  "ordinary",
  "prime",
  "single",
]);

export function detectHiddenInfoLeak(
  text: string,
  members: readonly Member[],
  options: HiddenInfoLeakOptions = {},
): HiddenInfoLeak | null {
  const phraseSet = ngramSet(text, LEAK_PHRASE_TOKEN_COUNT);
  const tokenSet = wordSet(text);
  const includeSingleLabels = options.includeSingleLabels === true;
  const labelPhraseSet = includeSingleLabels ? ngramSet(text, LABEL_PHRASE_TOKEN_COUNT) : null;

  for (const member of members) {
    const profile = buildLeakProfile(member);

    for (const phrase of phraseSet) {
      const field = profile.phrases.get(phrase);
      if (field !== undefined) {
        return {
          memberId: member.id,
          memberName: member.name,
          field,
          evidence: phrase,
          matchKind: "phrase",
        };
      }
    }

    if (labelPhraseSet !== null) {
      for (const phrase of labelPhraseSet) {
        const field = profile.labelPhrases.get(phrase);
        if (field !== undefined) {
          return {
            memberId: member.id,
            memberName: member.name,
            field,
            evidence: phrase,
            matchKind: "label",
          };
        }
      }
    }

    for (const token of tokenSet) {
      const field = profile.labels.get(token);
      if (field === undefined) {
        continue;
      }

      if (includeSingleLabels || field === "tag") {
        return {
          memberId: member.id,
          memberName: member.name,
          field,
          evidence: token,
          matchKind: "label",
        };
      }
    }
  }

  return null;
}

export function describeHiddenInfoLeak(leak: HiddenInfoLeak): string {
  return `${leak.memberName} ${leak.field} ${leak.matchKind} "${leak.evidence}"`;
}

export function extractDistinctiveTriGram(text: string): string {
  const tokens = normalizeTokens(text);
  for (let index = 0; index <= tokens.length - LEAK_PHRASE_TOKEN_COUNT; index += 1) {
    const phrase = tokens.slice(index, index + LEAK_PHRASE_TOKEN_COUNT);
    if (phrase.some((token) => token.length >= MIN_SINGLE_LABEL_LENGTH)) {
      return phrase.join(" ");
    }
  }
  throw new Error("text not long enough for distinctive trigram extraction");
}

const leakProfileCache = new WeakMap<Member, LeakProfile>();

function buildLeakProfile(member: Member): LeakProfile {
  const cached = leakProfileCache.get(member);
  if (cached !== undefined) {
    return cached;
  }

  const profile = computeLeakProfile(member);
  leakProfileCache.set(member, profile);
  return profile;
}

function computeLeakProfile(member: Member): LeakProfile {
  const publicCorpus = [
    member.datingProfile,
    member.visualDescription,
    member.name,
    member.firstName,
  ].join(" \n ");
  const publicPhrases = ngramSet(publicCorpus, LEAK_PHRASE_TOKEN_COUNT);
  const publicLabelPhrases = ngramSet(publicCorpus, LABEL_PHRASE_TOKEN_COUNT);
  const publicTokens = wordSet(publicCorpus);
  const phrases = new Map<string, HiddenInfoLeakField>();
  const labelPhrases = new Map<string, HiddenInfoLeakField>();
  const labels = new Map<string, HiddenInfoLeakField>();

  for (const source of hiddenTextSources(member)) {
    for (const phrase of ngramSet(source.text, LEAK_PHRASE_TOKEN_COUNT)) {
      if (publicPhrases.has(phrase) || containsOnlyCommonTokens(phrase)) {
        continue;
      }
      if (!phrases.has(phrase)) {
        phrases.set(phrase, source.field);
      }
    }
  }

  for (const source of hiddenLabelSources(member)) {
    const sourceTokens = normalizeTokens(source.text);
    for (const phrase of ngramSet(source.text, LABEL_PHRASE_TOKEN_COUNT)) {
      if (publicLabelPhrases.has(phrase) || containsOnlyCommonTokens(phrase)) {
        continue;
      }
      if (!labelPhrases.has(phrase)) {
        labelPhrases.set(phrase, source.field);
      }
    }

    for (const token of wordSet(source.text)) {
      const sourceIsSingleToken = sourceTokens.length === 1;
      if (token.length < MIN_SINGLE_LABEL_LENGTH && !sourceIsSingleToken) {
        continue;
      }
      if (token.length < 3 || COMMON_TOKENS.has(token) || publicTokens.has(token)) {
        continue;
      }
      labels.set(token, source.field);
    }
  }

  for (const tag of member.tags) {
    labels.set(normalizeTag(tag), "tag");
  }

  return { phrases, labelPhrases, labels };
}

function hiddenTextSources(member: Member): Array<{ text: string; field: HiddenInfoLeakField }> {
  return [
    { text: member.bio, field: "bio" },
    ...member.secrets.map((secret) => ({ text: secret, field: "secret" as const })),
    { text: member.species, field: "species" },
    { text: member.dimension, field: "dimension" },
    { text: member.realityStatus, field: "reality_status" },
    { text: member.origin, field: "origin" },
  ];
}

function hiddenLabelSources(member: Member): Array<{ text: string; field: HiddenInfoLeakField }> {
  return [
    { text: member.species, field: "species" },
    { text: member.dimension, field: "dimension" },
    { text: member.realityStatus, field: "reality_status" },
    { text: member.origin, field: "origin" },
  ];
}

function normalizeTag(tag: MemberTag): string {
  return normalizeTokens(tag).join(" ");
}

export function ngramSet(text: string, size: number): Set<string> {
  const tokens = normalizeTokens(text);
  if (tokens.length < size) return new Set();
  const result = new Set<string>();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

function wordSet(text: string): Set<string> {
  return new Set(normalizeTokens(text));
}

function normalizeTokens(text: string): string[] {
  const matches = text.toLowerCase().match(WORD_PATTERN);
  return matches === null ? [] : matches.filter((token) => token.length >= 2);
}

function containsOnlyCommonTokens(phrase: string): boolean {
  const tokens = phrase.split(" ");
  return tokens.every((token) => COMMON_TOKENS.has(token) || token.length < MIN_LEAK_TOKEN_LENGTH);
}
