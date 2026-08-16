#!/usr/bin/env python3
"""
scripts/remove_bg.py

Small CLI wrapper around the `rembg` Python library, used by
app/api/tools/remove-background/route.ts via child_process.

Usage:
    python3 remove_bg.py <input_path> <output_path>

Reads an image from <input_path>, removes its background using rembg's
default U^2-Net based model, and writes a transparent PNG to <output_path>.

Setup (see README.md "Background Remover setup" for full details):
    python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
    pip install rembg pillow onnxruntime --break-system-packages

The first time rembg runs, it downloads a ~170MB model file to
~/.u2net/ — this requires internet access on first run only.
"""
import sys
import os


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python3 remove_bg.py <input_path> <output_path>", file=sys.stderr)
        return 2

    input_path, output_path = sys.argv[1], sys.argv[2]

    if not os.path.isfile(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        return 2

    try:
        from rembg import remove
        from PIL import Image
    except ImportError as e:
        print(
            "Missing dependency. Install with:\n"
            "  pip install rembg pillow onnxruntime --break-system-packages\n"
            f"Original error: {e}",
            file=sys.stderr,
        )
        return 3

    try:
        with open(input_path, "rb") as f:
            input_bytes = f.read()

        output_bytes = remove(input_bytes)

        with open(output_path, "wb") as f:
            f.write(output_bytes)

        # Sanity check: make sure we wrote a valid, openable image.
        with Image.open(output_path) as img:
            img.verify()

        print(f"OK: wrote {output_path}")
        return 0
    except Exception as e:  # noqa: BLE001 - surface any failure to the caller
        print(f"Background removal failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
