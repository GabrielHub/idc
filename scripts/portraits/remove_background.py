from __future__ import annotations

import argparse
from io import BytesIO
from pathlib import Path
import sys


IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}
EDGE_ALPHA_CUTOFF = 8


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove portrait backgrounds with rembg and write transparent PNGs."
    )
    parser.add_argument(
        "--input",
        "-i",
        required=True,
        type=Path,
        help="Source image file or directory.",
    )
    parser.add_argument(
        "--output",
        "-o",
        required=True,
        type=Path,
        help="Output image file or directory.",
    )
    parser.add_argument(
        "--model",
        "-m",
        default="bria-rmbg",
        help="rembg model name. Defaults to bria-rmbg.",
    )
    parser.add_argument(
        "--recursive",
        "-r",
        action="store_true",
        help="When input is a directory, process nested folders.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing output files.",
    )
    return parser.parse_args()


def iter_images(input_path: Path, recursive: bool) -> list[Path]:
    if input_path.is_file():
        if input_path.suffix.lower() not in IMAGE_SUFFIXES:
            raise SystemExit(f"Unsupported image type: {input_path}")
        return [input_path]

    if not input_path.is_dir():
        raise SystemExit(f"Input does not exist: {input_path}")

    pattern = "**/*" if recursive else "*"
    return [
        path
        for path in input_path.glob(pattern)
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    ]


def output_path_for(input_root: Path, output_root: Path, image_path: Path) -> Path:
    if input_root.is_file():
        return output_root if output_root.suffix else output_root / f"{input_root.stem}.png"

    relative = image_path.relative_to(input_root)
    return output_root / relative.with_suffix(".png")


def estimate_background_rgb(image: "Image.Image") -> tuple[int, int, int]:
    from PIL import ImageStat

    width, height = image.size
    sample_width = max(width // 12, 1)
    sample_height = max(height // 12, 1)
    boxes = [
        (0, 0, sample_width, sample_height),
        (width - sample_width, 0, width, sample_height),
        (0, height - sample_height, sample_width, height),
        (width - sample_width, height - sample_height, width, height),
    ]
    channels = [0.0, 0.0, 0.0]

    for box in boxes:
        mean = ImageStat.Stat(image.crop(box)).mean[:3]
        channels = [channel + mean[index] for index, channel in enumerate(channels)]

    return tuple(round(channel / len(boxes)) for channel in channels)


def remove_matte_channel(source_channel: int, matte_channel: int, alpha: int) -> int:
    alpha_ratio = alpha / 255
    value = (source_channel - matte_channel * (1 - alpha_ratio)) / alpha_ratio
    return max(0, min(255, round(value)))


def clean_alpha_edges(source_bytes: bytes, result_bytes: bytes) -> bytes:
    from PIL import Image

    source = Image.open(BytesIO(source_bytes)).convert("RGBA")
    cutout = Image.open(BytesIO(result_bytes)).convert("RGBA")

    if source.size != cutout.size:
        return result_bytes

    matte_rgb = estimate_background_rgb(source)
    source_pixels = source.load()
    cutout_pixels = cutout.load()
    width, height = cutout.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = cutout_pixels[x, y]

            if alpha == 255:
                continue

            source_red, source_green, source_blue, _ = source_pixels[x, y]

            if alpha <= EDGE_ALPHA_CUTOFF:
                cutout_pixels[x, y] = (source_red, source_green, source_blue, 0)
                continue

            cutout_pixels[x, y] = (
                remove_matte_channel(source_red, matte_rgb[0], alpha),
                remove_matte_channel(source_green, matte_rgb[1], alpha),
                remove_matte_channel(source_blue, matte_rgb[2], alpha),
                alpha,
            )

    output = BytesIO()
    cutout.save(output, format="PNG")
    return output.getvalue()


def remove_backgrounds(args: argparse.Namespace) -> int:
    try:
        from rembg import new_session, remove
    except ImportError as error:
        raise SystemExit(
            "rembg is not installed. Run: python -m pip install -r requirements/portraits.txt"
        ) from error

    input_path = args.input.resolve()
    output_path = args.output.resolve()
    images = iter_images(input_path, args.recursive)

    if not images:
        print(f"No images found in {input_path}", file=sys.stderr)
        return 1

    session = new_session(args.model)
    processed = 0

    for image_path in images:
        target_path = output_path_for(input_path, output_path, image_path)

        if target_path.exists() and not args.overwrite:
            print(f"Skipping existing file: {target_path}")
            continue

        target_path.parent.mkdir(parents=True, exist_ok=True)

        with image_path.open("rb") as source_file:
            source_bytes = source_file.read()
            result = remove(
                source_bytes,
                session=session,
                force_return_bytes=True,
            )

        target_path.write_bytes(clean_alpha_edges(source_bytes, result))
        processed += 1
        print(f"Wrote {target_path}")

    print(f"Processed {processed} image(s) with model '{args.model}'.")
    return 0


def main() -> int:
    return remove_backgrounds(parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
