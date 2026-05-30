import { Eyebrow, Portrait } from "../../../components/dashboard-atoms";
import { Toggle } from "../../../components/form-primitives";
import { MemberAuraLayer, PULSE_AURA_DURATION_SECONDS } from "../../../components/member-aura";
import {
  getMemberAuraConfig,
  isLightAuraKind,
  type MemberAuraConfig,
} from "../../../components/member-aura-registry";
import { type Member, type PortraitMood } from "../../../domain/game";
import { readableTag } from "./all-members-utils";

const PORTRAIT_MOODS: ReadonlyArray<PortraitMood> = ["neutral", "flirty", "confused", "angry"];

type ContactSheetFrame = {
  key: string;
  mood: PortraitMood;
  label: string;
  cutoutPath: string;
  sourcePath: string;
  model: string;
  asset: "portrait" | "avatar";
};

export function ContactSheet({
  member,
  showAura,
  onShowAuraChange,
}: {
  member: Member;
  showAura: boolean;
  onShowAuraChange: (showAura: boolean) => void;
}) {
  const frames = contactSheetFrames(member);
  const variantCount = frames.length - 1;
  const auraConfig = getMemberAuraConfig(member.id);

  return (
    <article className="aura-glass overflow-hidden rounded-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-aura-hairline px-6 py-4">
        <div>
          <Eyebrow>// contact sheet</Eyebrow>
          <h3 className="mt-1 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            Mood variants ({variantCount}/4) and chat avatar.
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AuraPreviewToggle enabled={showAura} onChange={onShowAuraChange} />
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {frames.length} frames
          </span>
        </div>
      </header>
      <AuraSettingsPanel config={auraConfig} />
      <div className="grid gap-3 p-6 md:grid-cols-3 xl:grid-cols-5">
        {frames.map((frame, frameIndex) => (
          <figure
            key={frame.key}
            className="overflow-hidden rounded-tile border border-aura-hairline bg-white/55"
          >
            <div
              className={`relative grid overflow-hidden ${
                frame.asset === "avatar"
                  ? "aspect-square place-items-center bg-gradient-to-b from-aura-mesh-amber/35 via-transparent to-aura-mesh-rose/25"
                  : "aspect-[3/4] bg-gradient-to-b from-aura-mesh-rose/30 via-transparent to-aura-mesh-violet/25"
              }`}
            >
              <span
                aria-hidden
                className="absolute left-3 top-3 z-20 font-mono text-micro font-semibold tabular-nums tracking-[0.04em] text-aura-faint"
              >
                {String(frameIndex + 1).padStart(2, "0")}
              </span>
              {frame.asset === "portrait" ? (
                <PortraitFrame member={member} mood={frame.mood} showAura={showAura} />
              ) : (
                <Portrait member={member} variant="card" asset="avatar" mood={frame.mood} />
              )}
            </div>
            <figcaption className="space-y-1.5 border-t border-aura-hairline px-3 py-3">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
                {frame.label}
              </p>
              <dl className="space-y-1">
                <AssetPathRow label="Cutout" value={frame.cutoutPath} />
                <AssetPathRow label="Source" value={frame.sourcePath} />
                <AssetPathRow label="Model" value={frame.model} />
              </dl>
            </figcaption>
          </figure>
        ))}
      </div>
    </article>
  );
}

function contactSheetFrames(member: Member): ContactSheetFrame[] {
  const frames: ContactSheetFrame[] = [];
  for (const portraitMood of PORTRAIT_MOODS) {
    if (portraitMood === "neutral") {
      frames.push({
        key: "neutral",
        mood: "neutral",
        label: "neutral",
        cutoutPath: member.portraits.neutral.portrait.cutoutPath,
        sourcePath: member.portraits.neutral.portrait.sourcePath,
        model: member.portraits.neutral.portrait.model ?? "unfiled",
        asset: "portrait",
      });
      continue;
    }
    const variant = member.portraits[portraitMood];
    if (variant === undefined) {
      continue;
    }
    frames.push({
      key: portraitMood,
      mood: portraitMood,
      label: portraitMood,
      cutoutPath: variant.portrait.cutoutPath,
      sourcePath: variant.portrait.sourcePath,
      model: variant.portrait.model ?? "unfiled",
      asset: "portrait",
    });
  }
  frames.push({
    key: "avatar",
    mood: "neutral",
    label: "avatar (chat)",
    cutoutPath: member.portraits.neutral.avatar.cutoutPath,
    sourcePath: member.portraits.neutral.avatar.sourcePath,
    model: member.portraits.neutral.avatar.model ?? "unfiled",
    asset: "avatar",
  });
  return frames;
}

function AuraSettingsPanel({ config }: { config: MemberAuraConfig | undefined }) {
  if (config === undefined) {
    return (
      <div className="border-b border-aura-hairline bg-white/30 px-6 py-3">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          Aura registry
        </p>
        <p className="mt-1 text-label italic text-aura-faint">No aura config on file.</p>
      </div>
    );
  }

  const lightKind = isLightAuraKind(config.kind);
  const slotSummary = lightKind ? "back plus front glow" : "back plus front particles";
  const modeSummary = lightKind ? "anchored light" : "broad ambient";

  return (
    <div className="grid gap-3 border-b border-aura-hairline bg-white/30 px-6 py-3 md:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          Aura registry
        </span>
        <span className="rounded-pill bg-aura-ink px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-white">
          {readableTag(config.kind)}
        </span>
      </div>
      <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <AuraSettingValue label="Mode" value={modeSummary} />
        <AuraSettingValue label="Slots" value={slotSummary} />
        <AuraSettingValue label="Motion" value={auraMotionSummary(config.kind)} />
        <AuraSettingValue label="Primary" value={config.tint.primary} />
        <AuraSettingValue label="Glow" value={config.tint.glow} />
      </dl>
    </div>
  );
}

function auraMotionSummary(kind: MemberAuraConfig["kind"]): string {
  switch (kind) {
    case "pulse":
      return `${PULSE_AURA_DURATION_SECONDS}s breathe`;
    case "prism":
      return `${PULSE_AURA_DURATION_SECONDS}s breathe / 14s hue`;
    case "godray":
      return "18-30s shafts";
    case "ectoplasm":
      return "seeded drift";
    case "fieldmote":
      return "seeded motes";
    case "rune":
      return "seeded runes";
    case "petal":
      return "seeded petals";
    case "pixelrain":
      return "seeded rain";
    case "ember":
      return "seeded embers";
  }
}

function AuraSettingValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-tile border border-aura-hairline bg-white/55 px-3 py-2">
      <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
        {label}
      </dt>
      <dd className="mt-1 truncate font-mono text-micro tracking-[0.04em] text-aura-ink/80">
        {value}
      </dd>
    </div>
  );
}

function AssetPathRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
        {label}
      </dt>
      <dd className="break-all font-mono text-micro leading-tight tracking-[0.02em] text-aura-ink/75">
        {value}
      </dd>
    </div>
  );
}

function AuraPreviewToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-pill border border-aura-hairline bg-white/65 px-3 py-1.5 transition hover:border-aura-rose/35">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
        Aura
      </span>
      <Toggle checked={enabled} onChange={onChange} label="Aura preview" />
    </div>
  );
}

function PortraitFrame({
  member,
  mood,
  showAura,
}: {
  member: Member;
  mood: PortraitMood;
  showAura: boolean;
}) {
  return (
    <>
      {showAura ? (
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <MemberAuraLayer member={member} density="card" slot="back" />
        </div>
      ) : null}
      <div className="absolute inset-0 z-[2]">
        <Portrait member={member} variant="standee-bottom" asset="portrait" mood={mood} />
      </div>
      {showAura ? (
        <div className="pointer-events-none absolute inset-0 z-[3]">
          <MemberAuraLayer member={member} density="card" slot="front" />
        </div>
      ) : null}
    </>
  );
}
