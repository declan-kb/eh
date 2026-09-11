#!/usr/bin/env python3
"""
Remove a plain white/near-white background from an image and save as WEBP.

Usage:
    python3 scripts/remove-bg.py input.png [output.webp]

If output is omitted, it's written next to the input with a .webp extension.
Assumes a flat white (or near-white) background reachable from the image
border - typical of CAD/renderer screenshots. Not a general-purpose
background remover (won't help with photos or busy backgrounds).
"""
import sys
from pathlib import Path
from collections import deque

from PIL import Image, ImageFilter
import numpy as np

THRESH = 250   # min channel value to count as "background white"
TOL = 6        # how much darker a pixel can be than THRESH once inside the flood fill
BLUR = 0.6     # softens the cut edge by this many pixels


def remove_bg(in_path: Path, out_path: Path, thresh=THRESH, tol=TOL, blur=BLUR):
    img = Image.open(in_path).convert("RGB")
    arr = np.array(img)
    h, w = arr.shape[:2]
    min_chan = arr.min(axis=-1)

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if min_chan[y, x] >= thresh:
                q.append((y, x)); visited[y, x] = True
    for y in range(h):
        for x in (0, w - 1):
            if min_chan[y, x] >= thresh and not visited[y, x]:
                q.append((y, x)); visited[y, x] = True

    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if min_chan[ny, nx] >= thresh - tol:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    mask = (~visited).astype(np.uint8) * 255  # 255 = keep opaque, 0 = background
    mask_img = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(radius=blur))
    alpha = np.array(mask_img)

    out = np.dstack([arr, alpha]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(out_path, "WEBP", lossless=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    in_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else in_path.with_suffix(".webp")

    remove_bg(in_path, out_path)
    print(f"wrote {out_path}")
