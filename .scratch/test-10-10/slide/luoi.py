"""Vẽ lưới toạ độ lên ảnh màn hình để đọc vị trí nút: python luoi.py ten_anh [ten_anh...]"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
SRC = os.path.join(os.path.dirname(__file__), "..", "anh")
OUT = os.path.join(os.path.dirname(__file__), "render", "luoi")
os.makedirs(OUT, exist_ok=True)
f = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 13)
for n in sys.argv[1:]:
    im = Image.open(os.path.join(SRC, n + ".png")).convert("RGB")
    d = ImageDraw.Draw(im, "RGBA")
    W, H = im.size
    for x in range(0, W, 50):
        d.line([(x, 0), (x, H)], fill=(255, 0, 0, 90 if x % 100 == 0 else 35))
        if x % 100 == 0: d.text((x + 2, 2), str(x), fill=(220, 0, 0), font=f)
    for y in range(0, H, 50):
        d.line([(0, y), (W, y)], fill=(255, 0, 0, 90 if y % 100 == 0 else 35))
        if y % 100 == 0: d.text((2, y + 2), str(y), fill=(220, 0, 0), font=f)
    im.save(os.path.join(OUT, n + ".png"))
