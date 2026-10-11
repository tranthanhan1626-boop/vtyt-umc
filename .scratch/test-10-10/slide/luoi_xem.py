"""Ghép các trang xem/trang_*.png thành tờ lưới để soát nhanh."""
import glob
from PIL import Image, ImageDraw
fs = sorted(glob.glob("xem/trang_*.png"))
for k in range(0, len(fs), 6):
    grp = fs[k:k + 6]
    ims = [Image.open(f) for f in grp]
    w, h = 1000, 562
    g = Image.new("RGB", (w * 2, h * 3), "white")
    for i, im in enumerate(ims):
        g.paste(im.resize((w, h)), ((i % 2) * w, (i // 2) * h))
        ImageDraw.Draw(g).rectangle([(i % 2) * w, (i // 2) * h, (i % 2) * w + w - 1, (i // 2) * h + h - 1], outline="black")
    g.save(f"render/to_{k // 6 + 1}.png")
