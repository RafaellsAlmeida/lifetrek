from pathlib import Path
import sys

from PIL import Image


def cover_crop_resize(src: Path, dst: Path, size=(1080, 1350)) -> None:
    image = Image.open(src).convert("RGB")
    target_w, target_h = size
    src_w, src_h = image.size
    src_ratio = src_w / src_h
    target_ratio = target_w / target_h

    if src_ratio > target_ratio:
        new_w = int(src_h * target_ratio)
        left = (src_w - new_w) // 2
        box = (left, 0, left + new_w, src_h)
    else:
        new_h = int(src_w / target_ratio)
        top = (src_h - new_h) // 2
        box = (0, top, src_w, top + new_h)

    cropped = image.crop(box).resize(size, Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dst, "PNG", optimize=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: normalize_may_image.py <src> <dst>")
    cover_crop_resize(Path(sys.argv[1]), Path(sys.argv[2]))
