from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
PORTRAIT_ROOT = ROOT / "public" / "assets" / "portraits"
OUTPUT_PATH = ROOT / "app" / "components" / "standee-footing.generated.ts"
STANDEE_ASPECT_RATIO = 887 / 1774
ALPHA_THRESHOLD = 0


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    return alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0).getbbox()


def rendered_footing(path: Path) -> tuple[int, int, int, int, int, float, float]:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    bounds = alpha_bounds(image)
    if bounds is None:
        return width, height, height, height, 0, 100.0, 0.0

    top_transparent_pixels = bounds[1]
    bottom_transparent_pixels = height - bounds[3]
    visible_height_pixels = bounds[3] - bounds[1]
    image_aspect_ratio = width / height
    rendered_height_ratio = min(1.0, STANDEE_ASPECT_RATIO / image_aspect_ratio)
    translate_percent = (bottom_transparent_pixels / height) * rendered_height_ratio * 100
    rendered_visible_height_ratio = (visible_height_pixels / height) * rendered_height_ratio
    return (
        width,
        height,
        top_transparent_pixels,
        bottom_transparent_pixels,
        visible_height_pixels,
        translate_percent,
        rendered_visible_height_ratio,
    )


def tailwind_translate_class(translate_percent: float) -> str:
    if translate_percent <= 0:
        return "translate-y-0"

    return f"translate-y-[{translate_percent:.2f}%]"


def typescript_number(value: float) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".")


def typescript_ratio(value: float) -> str:
    return f"{value:.4f}".rstrip("0").rstrip(".")


def asset_path(path: Path) -> str:
    relative = path.relative_to(ROOT / "public").as_posix()
    return f"/{relative}"


def main() -> None:
    entries = []
    for path in sorted(PORTRAIT_ROOT.glob("*/portrait*.png")):
        (
            width,
            height,
            top_pixels,
            bottom_pixels,
            visible_height_pixels,
            translate_percent,
            rendered_visible_height_ratio,
        ) = rendered_footing(path)
        entries.append(
            (
                asset_path(path),
                width,
                height,
                top_pixels,
                bottom_pixels,
                visible_height_pixels,
                translate_percent,
                rendered_visible_height_ratio,
            ),
        )

    lines = [
        "export type StandeeFooting = {",
        "  topTransparentPixels: number;",
        "  bottomTransparentPixels: number;",
        "  visibleHeightPixels: number;",
        "  renderedVisibleHeightRatio: number;",
        "  className: string;",
        "  renderedCanvasTranslatePercent: number;",
        "};",
        "",
        "export const DEFAULT_STANDEE_FOOTING = {",
        "  topTransparentPixels: 0,",
        "  bottomTransparentPixels: 0,",
        "  visibleHeightPixels: 0,",
        "  renderedVisibleHeightRatio: 1,",
        '  className: "translate-y-0",',
        "  renderedCanvasTranslatePercent: 0,",
        "} as const satisfies StandeeFooting;",
        "",
        "export const STANDEE_FOOTING_BY_CUTOUT_PATH: Readonly<Record<string, StandeeFooting>> = {",
    ]

    for (
        path,
        width,
        height,
        top_pixels,
        bottom_pixels,
        visible_height_pixels,
        translate_percent,
        rendered_visible_height_ratio,
    ) in entries:
        lines.extend(
            [
                f'  "{path}": {{',
                f"    topTransparentPixels: {top_pixels},",
                f"    bottomTransparentPixels: {bottom_pixels},",
                f"    visibleHeightPixels: {visible_height_pixels},",
                f"    renderedVisibleHeightRatio: {typescript_ratio(rendered_visible_height_ratio)},",
                f'    className: "{tailwind_translate_class(translate_percent)}",',
                f"    renderedCanvasTranslatePercent: {typescript_number(translate_percent)},",
                "  },",
            ],
        )

    lines.extend(
        [
            "};",
        ],
    )

    OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
