from __future__ import annotations

import argparse
from pathlib import Path
import sys


IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}


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
            result = remove(
                source_file.read(),
                session=session,
                force_return_bytes=True,
            )

        target_path.write_bytes(result)
        processed += 1
        print(f"Wrote {target_path}")

    print(f"Processed {processed} image(s) with model '{args.model}'.")
    return 0


def main() -> int:
    return remove_backgrounds(parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
