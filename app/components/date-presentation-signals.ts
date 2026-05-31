import type {
  JudgeSnapshot,
  Member,
  MemberDateAffect,
  PortraitAsset,
  PortraitMood,
} from "../domain/game";
import type { ReactionKind } from "./date-reactions";

export const DATE_PORTRAIT_MOODS: readonly PortraitMood[] = [
  "neutral",
  "flirty",
  "confused",
  "angry",
];

type PortraitAssetKind = "avatar" | "portrait";

export type DateAffectReaction = {
  kind: ReactionKind;
  minimumIntensity: number;
  moodSource: "mood" | "magnitude";
};

const DATE_AFFECT_PORTRAIT_MOODS: Partial<Record<MemberDateAffect, PortraitMood>> = {
  angry: "angry",
  overloaded: "angry",
  leaning_in: "flirty",
  warming: "flirty",
  guarded: "confused",
  disappointed: "confused",
  curious: "confused",
};

const DATE_AFFECT_REACTIONS: Partial<Record<MemberDateAffect, DateAffectReaction>> = {
  leaning_in: { kind: "spark", minimumIntensity: 3, moodSource: "mood" },
  warming: { kind: "spark", minimumIntensity: 3, moodSource: "mood" },
  angry: { kind: "anger", minimumIntensity: 4, moodSource: "magnitude" },
  overloaded: { kind: "anger", minimumIntensity: 4, moodSource: "magnitude" },
  guarded: { kind: "warning", minimumIntensity: 2, moodSource: "magnitude" },
  disappointed: { kind: "warning", minimumIntensity: 2, moodSource: "magnitude" },
};

export function selectPortraitMood(
  memberId: string,
  snapshot: JudgeSnapshot | undefined,
): PortraitMood {
  if (snapshot === undefined) {
    return "neutral";
  }

  const affectMood = portraitMoodForDateAffect(snapshot.memberAffects?.[memberId]?.affect);
  if (affectMood !== null) {
    return affectMood;
  }

  const memberMoodDelta = snapshot.memberMoodDeltas[memberId];

  if (memberMoodDelta === undefined || memberMoodDelta === 0) {
    return "neutral";
  }

  const sparkDelta = snapshot.statDeltas.spark ?? 0;
  const chemistryDelta = snapshot.statDeltas.chemistry ?? 0;
  const relationshipDelta = snapshot.statDeltas.relationshipHealth ?? 0;
  const trustDelta = snapshot.statDeltas.trust ?? 0;
  const strainDelta = snapshot.statDeltas.strain ?? 0;
  const conflictDelta = snapshot.statDeltas.conflict ?? 0;

  if (memberMoodDelta < 0 && (snapshot.shouldEndEarly || strainDelta >= 4 || conflictDelta >= 4)) {
    return "angry";
  }

  if (memberMoodDelta >= 2 && (sparkDelta >= 2 || chemistryDelta >= 2 || relationshipDelta >= 4)) {
    return "flirty";
  }

  if (memberMoodDelta < 0 && sparkDelta <= 0 && trustDelta <= 0) {
    return "confused";
  }

  return "neutral";
}

export function portraitMoodForDateAffect(
  affect: MemberDateAffect | undefined,
): PortraitMood | null {
  return affect === undefined ? null : (DATE_AFFECT_PORTRAIT_MOODS[affect] ?? null);
}

export function reactionForDateAffect(
  affect: MemberDateAffect | undefined,
): DateAffectReaction | null {
  return affect === undefined ? null : (DATE_AFFECT_REACTIONS[affect] ?? null);
}

export function selectDominantMood(left: PortraitMood, right: PortraitMood): PortraitMood {
  if (left === "angry" || right === "angry") {
    return "angry";
  }

  if (left === "flirty" || right === "flirty") {
    return "flirty";
  }

  if (left === "confused" || right === "confused") {
    return "confused";
  }

  return "neutral";
}

export type StageHealthBand = "warm" | "steady" | "strained";

/**
 * Maps live date health (0-100) to a coarse atmosphere band. Healthy dates get
 * a warm, soft room; strained dates get a tighter, cooler vignette. Thresholds
 * are deliberately coarse so the stage lighting only shifts on real swings.
 */
export function selectStageHealthBand(dateHealth: number): StageHealthBand {
  if (dateHealth >= 66) {
    return "warm";
  }

  if (dateHealth >= 33) {
    return "steady";
  }

  return "strained";
}

/**
 * Returns a single portrait asset for one-off renders (no layered fallback
 * needed). Use this when you just need the right portrait for a frame; use
 * `selectPortraitAssetCandidates` when you need the full mood→neutral
 * fallback chain so the previous portrait can stay visible while the next
 * one loads.
 */
export function selectPortraitAsset(
  member: Member,
  asset: PortraitAssetKind,
  mood: PortraitMood = "neutral",
): PortraitAsset {
  return selectPortraitAssetCandidates(member, asset, mood)[0];
}

export function selectPortraitAssetCandidates(
  member: Member,
  asset: PortraitAssetKind,
  mood: PortraitMood = "neutral",
): PortraitAsset[] {
  if (asset === "avatar") {
    return [member.portraits.neutral.avatar];
  }

  const neutralPortrait = member.portraits.neutral.portrait;

  if (!isPortraitAssetReady(neutralPortrait)) {
    return [neutralPortrait];
  }

  if (mood !== "neutral") {
    const moodAsset = member.portraits[mood]?.portrait;

    if (moodAsset !== undefined && isPortraitAssetReady(moodAsset)) {
      return uniquePortraitAssets([moodAsset, neutralPortrait]);
    }
  }

  return [neutralPortrait];
}

export function readyPortraitPath(asset: PortraitAsset): string | undefined {
  return isPortraitAssetReady(asset) ? asset.cutoutPath : undefined;
}

export function hasReadyPortraitMood(member: Member, mood: PortraitMood): boolean {
  const neutralPortrait = member.portraits.neutral.portrait;

  if (!isPortraitAssetReady(neutralPortrait)) {
    return false;
  }

  if (mood === "neutral") {
    return true;
  }

  const variant = member.portraits[mood]?.portrait;
  return variant !== undefined && isPortraitAssetReady(variant);
}

export function readyPortraitMoodPaths(member: Member): string[] {
  const paths = new Set<string>();

  for (const mood of DATE_PORTRAIT_MOODS) {
    const path = readyPortraitPath(selectPortraitAsset(member, "portrait", mood));

    if (path !== undefined) {
      paths.add(path);
    }
  }

  return Array.from(paths);
}

function isPortraitAssetReady(asset: PortraitAsset): boolean {
  return asset.model !== "pending";
}

function uniquePortraitAssets(assets: readonly PortraitAsset[]): PortraitAsset[] {
  // cutoutPath is what gets rendered, so two assets with the same cutoutPath
  // are visually identical even if their sourcePaths differ.
  const seen = new Set<string>();
  const uniqueAssets: PortraitAsset[] = [];

  for (const asset of assets) {
    if (seen.has(asset.cutoutPath)) {
      continue;
    }

    seen.add(asset.cutoutPath);
    uniqueAssets.push(asset);
  }

  return uniqueAssets;
}
