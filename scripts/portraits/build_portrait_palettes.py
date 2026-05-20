from __future__ import annotations

import argparse
from dataclasses import dataclass
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_DIR = ROOT / "public" / "assets" / "portraits"
DEFAULT_OUTPUT_PATH = ROOT / "app" / "components" / "portrait-palettes.generated.ts"
DEFAULT_SOURCE_NAME = "portrait.png"
ALPHA_THRESHOLD = 180
TARGET_WIDTH = 144


@dataclass(frozen=True)
class RgbColor:
    r: int
    g: int
    b: int


@dataclass(frozen=True)
class HslColor:
    h: float
    s: float
    l: float


@dataclass
class Bucket:
    r: int
    g: int
    b: int
    count: int
    score: float


@dataclass(frozen=True)
class ScoredColor:
    r: int
    g: int
    b: int
    h: float
    s: float
    l: float
    chroma: int
    count: int
    score: float


@dataclass(frozen=True)
class PortraitPalette:
    source_path: str
    from_color: str
    via: str
    to: str
    accent: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build the generated member portrait palette manifest.",
    )
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help=f"Directory containing per-member portrait folders. Defaults to {DEFAULT_INPUT_DIR}.",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help=f"Generated TypeScript file to write. Defaults to {DEFAULT_OUTPUT_PATH}.",
    )
    parser.add_argument(
        "--source-name",
        default=DEFAULT_SOURCE_NAME,
        help=f"File name to sample inside each member folder. Defaults to {DEFAULT_SOURCE_NAME}.",
    )
    return parser.parse_args()


def asset_path(path: Path) -> str:
    relative = path.relative_to(ROOT / "public").as_posix()
    return f"/{relative}"


def visible_alpha_bounds(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    return alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0).getbbox()


def resized_visible_image(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    bounds = visible_alpha_bounds(image)
    if bounds is not None:
        image = image.crop(bounds)

    width, height = image.size
    if width <= TARGET_WIDTH:
        return image

    target_height = max(1, round(height * (TARGET_WIDTH / width)))
    return image.resize((TARGET_WIDTH, target_height), Image.Resampling.LANCZOS)


def sample_palette(path: Path) -> PortraitPalette:
    image = resized_visible_image(path)
    buckets: dict[str, Bucket] = {}

    for r, g, b, a in image.get_flattened_data():
        if a < ALPHA_THRESHOLD:
            continue

        color = RgbColor(r, g, b)
        chroma = max(r, g, b) - min(r, g, b)
        luma = relative_luma(color)
        hsl = rgb_to_hsl(color)

        if luma > 250:
            continue
        if luma < 12 and chroma < 28:
            continue
        if not is_useful_color(hsl, chroma, luma):
            continue

        add_bucket_pixel(buckets, color_bucket_key(hsl), color, pixel_score(hsl, chroma))

    candidates = bucket_candidates(buckets)
    picks = select_palette_picks(candidates)
    if not picks:
        raise SystemExit(f"No usable palette colors found in {path}")

    from_color = picks[0]
    via = picks[1] if len(picks) > 1 else derive_companion_color(from_color, 1)
    to = picks[2] if len(picks) > 2 else derive_companion_color(from_color, 2)
    accent = most_saturated([from_color, via, to])

    return PortraitPalette(
        source_path=asset_path(path),
        from_color=rgb_to_css(aura_stop(from_color, 0.82, 0.76, 0.34, 0.68)),
        via=rgb_to_css(aura_stop(via, 0.86, 0.72, 0.3, 0.64)),
        to=rgb_to_css(aura_stop(to, 0.83, 0.72, 0.32, 0.66)),
        accent=rgb_to_css(aura_stop(accent, 0.63, 0.95, 0.46, 0.84)),
    )


def add_bucket_pixel(
    buckets: dict[str, Bucket],
    key: str,
    color: RgbColor,
    score: float,
) -> None:
    existing = buckets.get(key)
    if existing is not None:
        existing.r += color.r
        existing.g += color.g
        existing.b += color.b
        existing.count += 1
        existing.score += score
        return

    buckets[key] = Bucket(color.r, color.g, color.b, 1, score)


def bucket_candidates(buckets: dict[str, Bucket]) -> list[ScoredColor]:
    candidates: list[ScoredColor] = []
    for bucket in buckets.values():
        color = RgbColor(
            round(bucket.r / bucket.count),
            round(bucket.g / bucket.count),
            round(bucket.b / bucket.count),
        )
        hsl = rgb_to_hsl(color)
        chroma = max(color.r, color.g, color.b) - min(color.r, color.g, color.b)
        candidates.append(
            ScoredColor(
                color.r,
                color.g,
                color.b,
                hsl.h,
                hsl.s,
                hsl.l,
                chroma,
                bucket.count,
                math.sqrt(bucket.count) * (bucket.score / bucket.count),
            ),
        )

    return sorted(candidates, key=lambda candidate: candidate.score, reverse=True)


def select_palette_picks(candidates: list[ScoredColor]) -> list[RgbColor]:
    picks: list[ScoredColor] = []
    collect_diverse_picks(candidates, picks, 48)
    if len(picks) < 3:
        collect_diverse_picks(candidates, picks, 30)

    colors = [RgbColor(pick.r, pick.g, pick.b) for pick in picks]
    while colors and len(colors) < 3:
        colors.append(derive_companion_color(colors[0], len(colors)))

    return colors[:3]


def collect_diverse_picks(
    candidates: list[ScoredColor],
    picks: list[ScoredColor],
    min_distance: int,
) -> None:
    for candidate in candidates:
        if len(picks) >= 3:
            return
        if any(same_candidate(pick, candidate) for pick in picks):
            continue
        if all(separates_from_pick(candidate, pick, min_distance) for pick in picks):
            picks.append(candidate)


def same_candidate(a: ScoredColor, b: ScoredColor) -> bool:
    return a.r == b.r and a.g == b.g and a.b == b.b


def separates_from_pick(candidate: ScoredColor, pick: ScoredColor, min_distance: int) -> bool:
    distance = color_distance(candidate, pick)
    hue_gap = hue_distance(candidate.h, pick.h)
    return distance >= min_distance and (hue_gap >= 18 or abs(candidate.l - pick.l) >= 0.18)


def most_saturated(colors: list[RgbColor]) -> RgbColor:
    return max(
        colors,
        key=lambda color: rgb_to_hsl(color).s
        + (max(color.r, color.g, color.b) - min(color.r, color.g, color.b)) / 255,
    )


def aura_stop(
    color: RgbColor,
    lightness: float,
    saturation_scale: float,
    min_saturation: float,
    max_saturation: float,
) -> RgbColor:
    hsl = rgb_to_hsl(color)
    saturation = clamp(hsl.s * saturation_scale + 0.08, min_saturation, max_saturation)
    return hsl_to_rgb(hsl.h, saturation, lightness)


def derive_companion_color(color: RgbColor, index: int) -> RgbColor:
    hsl = rgb_to_hsl(color)
    hue_offset = 34 if index == 1 else -42
    saturation = clamp(max(hsl.s, 0.38) * (0.88 if index == 1 else 0.76), 0.32, 0.72)
    lightness = clamp(hsl.l + (0.04 if index == 1 else 0.14), 0.36, 0.7)
    return hsl_to_rgb(hsl.h + hue_offset, saturation, lightness)


def is_useful_color(hsl: HslColor, chroma: int, luma: float) -> bool:
    if hsl.s >= 0.18 and chroma >= 26 and luma <= 244:
        return True
    return hsl.s >= 0.12 and chroma >= 18 and luma <= 236


def color_bucket_key(hsl: HslColor) -> str:
    hue = round(hsl.h / 16)
    saturation = round(hsl.s * 5)
    lightness = round(hsl.l * 6)
    return f"{hue},{saturation},{lightness}"


def pixel_score(hsl: HslColor, chroma: int) -> float:
    midtone = clamp(1 - abs(hsl.l - 0.54) * 1.35, 0.38, 1)
    chroma_boost = 0.65 + hsl.s * 2.6 + min(chroma / 64, 1.6)
    vivid_boost = 1.25 if hsl.s > 0.55 else 1
    skin_penalty = 0.42 if is_likely_skin_or_tan(hsl, chroma) else 1
    neutral_penalty = 0.62 if hsl.s < 0.24 and chroma < 44 else 1
    pale_penalty = 0.78 if hsl.l > 0.82 and hsl.s < 0.42 else 1
    return midtone * chroma_boost * vivid_boost * skin_penalty * neutral_penalty * pale_penalty


def is_likely_skin_or_tan(hsl: HslColor, chroma: int) -> bool:
    return 14 <= hsl.h <= 48 and 0.16 <= hsl.s <= 0.68 and 0.34 <= hsl.l <= 0.82 and chroma < 150


def color_distance(a: ScoredColor, b: ScoredColor) -> float:
    dr = a.r - b.r
    dg = a.g - b.g
    db = a.b - b.b
    return math.sqrt(dr * dr + dg * dg + db * db)


def hue_distance(a: float, b: float) -> float:
    raw = abs(normalize_hue(a) - normalize_hue(b))
    return min(raw, 360 - raw)


def rgb_to_hsl(color: RgbColor) -> HslColor:
    r = color.r / 255
    g = color.g / 255
    b = color.b / 255
    max_channel = max(r, g, b)
    min_channel = min(r, g, b)
    chroma = max_channel - min_channel
    lightness = (max_channel + min_channel) / 2

    if chroma == 0:
        return HslColor(0, 0, lightness)

    saturation = chroma / (1 - abs(2 * lightness - 1))
    if max_channel == r:
        hue = ((g - b) / chroma) % 6
    elif max_channel == g:
        hue = (b - r) / chroma + 2
    else:
        hue = (r - g) / chroma + 4

    return HslColor(normalize_hue(hue * 60), saturation, lightness)


def hsl_to_rgb(hue: float, saturation: float, lightness: float) -> RgbColor:
    normalized_hue = normalize_hue(hue)
    chroma = (1 - abs(2 * lightness - 1)) * saturation
    hue_prime = normalized_hue / 60
    second = chroma * (1 - abs((hue_prime % 2) - 1))

    r1 = 0.0
    g1 = 0.0
    b1 = 0.0
    if hue_prime < 1:
        r1 = chroma
        g1 = second
    elif hue_prime < 2:
        r1 = second
        g1 = chroma
    elif hue_prime < 3:
        g1 = chroma
        b1 = second
    elif hue_prime < 4:
        g1 = second
        b1 = chroma
    elif hue_prime < 5:
        r1 = second
        b1 = chroma
    else:
        r1 = chroma
        b1 = second

    match = lightness - chroma / 2
    return RgbColor(
        round((r1 + match) * 255),
        round((g1 + match) * 255),
        round((b1 + match) * 255),
    )


def normalize_hue(hue: float) -> float:
    return ((hue % 360) + 360) % 360


def relative_luma(color: RgbColor) -> float:
    return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722


def rgb_to_css(color: RgbColor) -> str:
    return f"rgb({color.r}, {color.g}, {color.b})"


def clamp(value: float, min_value: float, max_value: float) -> float:
    return min(max(value, min_value), max_value)


def typescript_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def write_manifest(output_path: Path, palettes: dict[str, PortraitPalette]) -> None:
    lines = [
        'import type { PortraitPalette } from "./portrait-palette";',
        "",
        "export const PRECOMPUTED_PORTRAIT_PALETTES: Readonly<Record<string, PortraitPalette>> = {",
    ]

    for member_id, palette in sorted(palettes.items()):
        lines.extend(
            [
                f"  {typescript_string(member_id)}: {{",
                f"    from: {typescript_string(palette.from_color)},",
                f"    via: {typescript_string(palette.via)},",
                f"    to: {typescript_string(palette.to)},",
                f"    accent: {typescript_string(palette.accent)},",
                "  },",
            ],
        )

    lines.extend(["};", ""])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8", newline="\n")


def build_palettes(input_dir: Path, source_name: str) -> dict[str, PortraitPalette]:
    sources = sorted(path for path in input_dir.glob(f"*/{source_name}") if path.is_file())
    if not sources:
        raise SystemExit(f"No '{source_name}' files found in {input_dir}")

    palettes: dict[str, PortraitPalette] = {}
    for source_path in sources:
        member_id = source_path.parent.name
        palettes[member_id] = sample_palette(source_path)

    return palettes


def main() -> int:
    args = parse_args()
    input_dir = args.input.resolve()
    output_path = args.output.resolve()
    palettes = build_palettes(input_dir, args.source_name)
    write_manifest(output_path, palettes)
    print(f"Wrote {len(palettes)} portrait palette(s) to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
