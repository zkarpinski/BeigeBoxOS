#!/usr/bin/env python3
"""
Extracts images from Windows 98 screensaver DLL/SCR files.

Usage:
    python3 extract_win98_screensaver.py <dll_or_scr_file> [output_dir]

Outputs:
    - PNG files for each bitmap resource (with chroma key transparency applied)
    - A sprite_info.json with frame counts and dimensions for animated sprites
    - Original BMP files in a bmp/ subfolder for reference

Requirements:
    pip install pefile pillow
"""

import struct
import json
import sys
import os
from pathlib import Path

try:
    import pefile
except ImportError:
    sys.exit("Missing dependency: pip install pefile")

try:
    from PIL import Image
    import io
except ImportError:
    sys.exit("Missing dependency: pip install pillow")


RT_BITMAP = 2

# Windows resource type for chroma-key / sprite metadata (Win98 screensaver SDK)
RT_SPRITE_META = 257  # Maps bitmap IDs to frame count + chroma key color


def read_bitmaps(dll: pefile.PE) -> dict[int, bytes]:
    """Extract raw DIB (BITMAPINFOHEADER + palette + pixels) for each RT_BITMAP resource."""
    bitmaps = {}
    if not hasattr(dll, "DIRECTORY_ENTRY_RESOURCE"):
        return bitmaps
    for res_type in dll.DIRECTORY_ENTRY_RESOURCE.entries:
        if res_type.id != RT_BITMAP:
            continue
        for res_id in res_type.directory.entries:
            for res_lang in res_id.directory.entries:
                rva = res_lang.data.struct.OffsetToData
                size = res_lang.data.struct.Size
                bitmaps[res_id.id] = dll.get_data(rva, size)
    return bitmaps


def read_sprite_meta(dll: pefile.PE) -> dict[int, dict]:
    """
    Extract sprite metadata (frame count, chroma key) from type-257 resources.
    Each 12-byte record maps: [2 pad][2 bitmap_id][3 chroma_rgb][1 pad][4 frame_count]
    """
    sprites = {}
    if not hasattr(dll, "DIRECTORY_ENTRY_RESOURCE"):
        return sprites
    for res_type in dll.DIRECTORY_ENTRY_RESOURCE.entries:
        if res_type.id != RT_SPRITE_META:
            continue
        for res_id in res_type.directory.entries:
            for res_lang in res_id.directory.entries:
                rva = res_lang.data.struct.OffsetToData
                size = res_lang.data.struct.Size
                data = dll.get_data(rva, size)
                if size < 12:
                    continue
                bitmap_id = struct.unpack_from("<H", data, 2)[0]
                chroma_r, chroma_g, chroma_b = data[4], data[5], data[6]
                frame_count = struct.unpack_from("<I", data, 8)[0]
                sprites[res_id.id] = {
                    "bitmap_id": bitmap_id,
                    "chroma": (chroma_r, chroma_g, chroma_b),
                    "frame_count": max(1, frame_count),
                }
    return sprites


def dib_to_pil(dib_data: bytes) -> Image.Image:
    """Convert a raw DIB (no BITMAPFILEHEADER) to a PIL Image."""
    header_size = struct.unpack_from("<I", dib_data, 0)[0]
    bit_count = struct.unpack_from("<H", dib_data, 14)[0]

    # Determine palette size
    num_colors = struct.unpack_from("<I", dib_data, 32)[0]  # biClrUsed
    if num_colors == 0 and bit_count <= 8:
        num_colors = 1 << bit_count

    palette_size = num_colors * 4  # RGBQUAD = 4 bytes each
    pixel_offset = header_size + palette_size

    # Build a valid BITMAPFILEHEADER to prepend
    file_size = 14 + len(dib_data)
    bf_header = struct.pack("<2sIHHI", b"BM", file_size, 0, 0, 14 + pixel_offset)

    bmp_bytes = bf_header + dib_data
    return Image.open(io.BytesIO(bmp_bytes))


def apply_chroma_key(img: Image.Image, chroma_rgb: tuple[int, int, int]) -> Image.Image:
    """Replace a chroma key color with full transparency."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    cr, cg, cb = chroma_rgb
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r == cr and g == cg and b == cb:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def extract(dll_path: str, output_dir: str) -> None:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    bmp_dir = out / "bmp"
    bmp_dir.mkdir(exist_ok=True)

    dll = pefile.PE(dll_path)
    bitmaps = read_bitmaps(dll)
    sprite_meta = read_sprite_meta(dll)

    if not bitmaps:
        print("No RT_BITMAP resources found.")
        return

    print(f"Found {len(bitmaps)} bitmap(s), {len(sprite_meta)} sprite definition(s)")

    # Build lookup: bitmap_id -> sprite metadata
    bitmap_to_sprite: dict[int, dict] = {}
    for sprite_id, meta in sprite_meta.items():
        bitmap_to_sprite[meta["bitmap_id"]] = meta

    sprite_info_out = {}

    for bmp_id, dib_data in sorted(bitmaps.items()):
        # Save raw BMP for reference
        header_size = struct.unpack_from("<I", dib_data, 0)[0]
        bit_count = struct.unpack_from("<H", dib_data, 14)[0]
        num_colors = struct.unpack_from("<I", dib_data, 32)[0]
        if num_colors == 0 and bit_count <= 8:
            num_colors = 1 << bit_count
        palette_size = num_colors * 4
        pixel_offset = header_size + palette_size
        file_size = 14 + len(dib_data)
        bf_header = struct.pack("<2sIHHI", b"BM", file_size, 0, 0, 14 + pixel_offset)
        bmp_path = bmp_dir / f"bitmap_{bmp_id}.bmp"
        bmp_path.write_bytes(bf_header + dib_data)

        # Convert to PIL
        try:
            img = dib_to_pil(dib_data)
        except Exception as e:
            print(f"  [WARN] Could not decode bitmap {bmp_id}: {e}")
            continue

        total_w, total_h = img.size
        meta = bitmap_to_sprite.get(bmp_id)
        chroma = meta["chroma"] if meta else (0xFF, 0x00, 0xFF)  # default: magenta
        frame_count = meta["frame_count"] if meta else 1

        # Apply chroma key
        rgba = apply_chroma_key(img, chroma)

        frame_w = total_w // frame_count

        # Save full sprite sheet as PNG
        sheet_name = f"bitmap_{bmp_id}.png"
        rgba.save(out / sheet_name)

        sprite_info_out[str(bmp_id)] = {
            "file": sheet_name,
            "total_width": total_w,
            "height": total_h,
            "frame_count": frame_count,
            "frame_width": frame_w,
            "chroma": f"#{chroma[0]:02x}{chroma[1]:02x}{chroma[2]:02x}",
        }

        print(
            f"  bitmap_{bmp_id}.png  {total_w}x{total_h}  "
            f"{frame_count} frame(s) @ {frame_w}x{total_h}"
        )

        # If multi-frame, also export individual frames
        if frame_count > 1:
            frames_dir = out / f"bitmap_{bmp_id}_frames"
            frames_dir.mkdir(exist_ok=True)
            for i in range(frame_count):
                frame = rgba.crop((i * frame_w, 0, (i + 1) * frame_w, total_h))
                frame.save(frames_dir / f"frame_{i:02d}.png")

    # Write sprite info JSON
    json_path = out / "sprite_info.json"
    json_path.write_text(json.dumps(sprite_info_out, indent=2))
    print(f"\nSprite info written to {json_path}")
    print(f"Output directory: {out.resolve()}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    dll_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else Path(dll_path).stem + "_extracted"
    extract(dll_path, output_dir)
