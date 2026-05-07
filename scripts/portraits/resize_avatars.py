from __future__ import annotations

import argparse
from pathlib import Path
import sys


# Must match AVATAR_SRCSET_WIDTHS in app/components/dashboard-atoms.tsx.
DEFAULT_VARIANT_WIDTHS = (128, 256, 512)
DEFAULT_INPUT_DIR = Path("public/assets/portraits")
DEFAULT_SOURCE_NAME = "avatar.png"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Resize each member's avatar.png into width-tagged variants for "
            "srcset (e.g. avatar-128.png, avatar-256.png, avatar-512.png)."
        ),
    )
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help=(
            "Directory containing per-member portrait folders. Defaults to "
            f"{DEFAULT_INPUT_DIR}."
        ),
    )
    parser.add_argument(
        "--source-name",
        default=DEFAULT_SOURCE_NAME,
        help=f"File name to read inside each member folder. Defaults to {DEFAULT_SOURCE_NAME}.",
    )
    parser.add_argument(
        "--widths",
        "-w",
        type=int,
        nargs="+",
        default=list(DEFAULT_VARIANT_WIDTHS),
        help=f"Variant widths to emit. Defaults to {list(DEFAULT_VARIANT_WIDTHS)}.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Always rewrite variants, even if they are newer than the source.",
    )
    return parser.parse_args()


def variant_path_for(source_path: Path, width: int) -> Path:
    return source_path.with_name(f"{source_path.stem}-{width}{source_path.suffix}")


def write_variants(source_path: Path, widths: list[int], overwrite: bool) -> int:
    from PIL import Image

    written = 0

    with Image.open(source_path) as image:
        if image.mode != "RGBA":
            image = image.convert("RGBA")

        original_width, original_height = image.size

        for width in widths:
            target_path = variant_path_for(source_path, width)

            if (
                not overwrite
                and target_path.exists()
                and target_path.stat().st_mtime >= source_path.stat().st_mtime
            ):
                continue

            if width >= original_width:
                target_path.write_bytes(source_path.read_bytes())
                written += 1
                print(f"Copied {target_path} (source already <= {width}px wide)")
                continue

            ratio = width / original_width
            target_height = max(1, round(original_height * ratio))
            resized = image.resize((width, target_height), Image.LANCZOS)
            resized.save(target_path, format="PNG", optimize=True)
            written += 1
            print(f"Wrote   {target_path} ({width}x{target_height})")

    return written


def resize_avatars(args: argparse.Namespace) -> int:
    try:
        import PIL  # noqa: F401
    except ImportError as error:
        raise SystemExit(
            "Pillow is not installed. Run: python -m pip install -r requirements/portraits.txt"
        ) from error

    input_dir = args.input.resolve()

    if not input_dir.is_dir():
        raise SystemExit(f"Input directory does not exist: {input_dir}")

    sources = sorted(
        path for path in input_dir.glob(f"*/{args.source_name}") if path.is_file()
    )

    if not sources:
        print(f"No '{args.source_name}' files found in {input_dir}", file=sys.stderr)
        return 1

    widths = sorted(set(args.widths))
    total_written = 0

    for source_path in sources:
        total_written += write_variants(source_path, widths, args.overwrite)

    print(f"Processed {len(sources)} member(s); wrote {total_written} variant(s).")
    return 0


def main() -> int:
    return resize_avatars(parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
