"""Chuyển PDF sang PNG từng trang: python pdf2png.py file.pdf thu_muc_ra [dpi] [tiền_tố]"""
import sys, os, fitz
pdf, out = sys.argv[1], sys.argv[2]
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 110
pre = sys.argv[4] if len(sys.argv) > 4 else "trang"
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.startswith(pre + "_") and f.endswith(".png"):
        os.remove(os.path.join(out, f))
doc = fitz.open(pdf)
for i, p in enumerate(doc, 1):
    p.get_pixmap(dpi=dpi).save(os.path.join(out, f"{pre}_{i:02d}.png"))
print(len(doc), "trang")
