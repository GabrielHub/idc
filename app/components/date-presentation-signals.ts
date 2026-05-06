import type { JudgeSnapshot, Member, PortraitAsset, PortraitMood } from "../domain/game";

export const DATE_PORTRAIT_MOODS: readonly PortraitMood[] = [
  "neutral",
  "flirty",
  "confused",
  "angry",
];

type PortraitAssetKind = "avatar" | "portrait";

type StreamingSpeakerDraft = {
  speakerId: string;
  status: "streaming" | "done";
  reasoningText?: string;
};

export function selectPortraitMood(
  memberId: string,
  snapshot: JudgeSnapshot | undefined,
): PortraitMood {
  if (snapshot === undefined) {
    return "neutral";
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

  if (memberMoodDelta > 0 && (sparkDelta > 0 || chemistryDelta > 0 || relationshipDelta > 0)) {
    return "flirty";
  }

  if (memberMoodDelta < 0 && sparkDelta <= 0 && trustDelta <= 0) {
    return "confused";
  }

  return "neutral";
}

export function isMemberSpeaking(
  memberId: string,
  streamingDrafts: readonly StreamingSpeakerDraft[],
): boolean {
  return streamingDrafts.some(
    (draft) => draft.speakerId === memberId && draft.status === "streaming",
  );
}

export function memberStreamingReasoningText(
  memberId: string,
  streamingDrafts: readonly StreamingSpeakerDraft[],
): string {
  const draft = streamingDrafts.find(
    (candidate) => candidate.speakerId === memberId && candidate.status === "streaming",
  );

  return draft?.reasoningText?.trim() ?? "";
}

export function selectPortraitAsset(
  member: Member,
  asset: PortraitAssetKind,
  mood: PortraitMood = "neutral",
): PortraitAsset {
  if (asset === "avatar") {
    return member.portraits.neutral.avatar;
  }

  if (mood !== "neutral") {
    const moodAsset = member.portraits[mood]?.portrait;

    if (moodAsset !== undefined && isPortraitAssetReady(moodAsset)) {
      return moodAsset;
    }
  }

  return member.portraits.neutral.portrait;
}

export function readyPortraitPath(asset: PortraitAsset): string | undefined {
  return isPortraitAssetReady(asset) ? asset.cutoutPath : undefined;
}

export function hasReadyPortraitMood(member: Member, mood: PortraitMood): boolean {
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
