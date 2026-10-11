"""Dựng bộ slide hướng dẫn sử dụng web VTYT trên template UMC.

Chạy lại (từ gốc repo 9.vtyt). Lần đầu / sau khi dọn thư viện, cài lại:
    python3 -m venv .scratch/test-10-10/slide/.venv
    .scratch/test-10-10/slide/.venv/bin/pip install -r .scratch/test-10-10/slide/requirements.txt
rồi:
    .scratch/test-10-10/slide/.venv/bin/python .scratch/test-10-10/slide/dung_slide.py

Đầu vào : ảnh màn hình .scratch/test-10-10/anh/*.png (1440x900),
          minh hoạ .scratch/test-10-10/minh-hoa/*.png,
          template ~/Downloads/4. Hành chính – đối tác UMC/10.Nhận diện thương hiệu UMC/TEMPLATE SLIDES BỆNH VIỆN.pptx
Đầu ra  : Test và hướng dẫn 10-10-2026/HuongDan_VTYT_10-2026.pptx

Khi thay ảnh chụp lại: giữ đúng tên file trong anh/. Nếu bố cục màn đổi thì
sửa toạ độ khung khoanh (đơn vị: pixel trên ảnh 1440x900) ở hàm của trang đó.
"""
import copy
import os
import re

from lxml import etree
from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.opc.packuri import PackURI
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ANH = os.path.join(HERE, "..", "anh")
MINH = os.path.join(HERE, "..", "minh-hoa")
BUILD = os.path.join(HERE, "build")
TEMPLATE = os.path.expanduser(
    "~/Downloads/4. Hành chính – đối tác UMC/10.Nhận diện thương hiệu UMC/TEMPLATE SLIDES BỆNH VIỆN.pptx")
OUT = os.path.join(ROOT, "Test và hướng dẫn 10-10-2026", "HuongDan_VTYT_10-2026.pptx")
os.makedirs(BUILD, exist_ok=True)

NAVY = RGBColor(0x03, 0x4E, 0xA2)
CYAN = RGBColor(0x00, 0xB2, 0xF4)
ORANGE = RGBColor(0xF3, 0x92, 0x00)
INK = RGBColor(0x1E, 0x29, 0x3B)
MUTED = RGBColor(0x47, 0x55, 0x69)
CARD = RGBColor(0xEA, 0xF6, 0xFD)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
RED = RGBColor(0xC6, 0x28, 0x28)
FONT = "Arial"

SW, SH = 1440, 900  # kích thước ảnh màn hình


# ---------------------------------------------------------------- tiện ích chữ
def _runs(par, text, size, color, bold=False):
    """Viết text vào paragraph; đoạn **...** in đậm."""
    parts = re.split(r"(\*\*[^*]+\*\*)", text)
    for p in parts:
        if not p:
            continue
        r = par.add_run()
        b = bold
        if p.startswith("**") and p.endswith("**"):
            p, b = p[2:-2], True
        r.text = p
        f = r.font
        f.name = FONT
        f.size = Pt(size)
        f.bold = b
        f.color.rgb = color


def text(slide, x, y, w, h, lines, size=14, color=INK, bold=False, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, space_after=4, margin=0.0):
    """lines: chuỗi hoặc danh sách chuỗi (mỗi chuỗi một đoạn). Có thể truyền
    tuple (chuỗi, cỡ, màu, đậm) để đổi kiểu từng đoạn."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    for side in ("margin_left", "margin_right", "margin_top", "margin_bottom"):
        setattr(tf, side, Inches(margin))
    tf.vertical_anchor = anchor
    if isinstance(lines, str):
        lines = [lines]
    for i, ln in enumerate(lines):
        par = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        par.alignment = align
        par.space_after = Pt(space_after)
        if isinstance(ln, tuple):
            t, s, c, b = (list(ln) + [None, None, None])[:4]
            _runs(par, t, s or size, c or color, bool(b) if b is not None else bold)
        else:
            _runs(par, ln, size, color, bold)
    return tb


def lead(slide, s, y=1.17):
    """Câu dẫn ngắn đầu trang: trang này làm gì."""
    return text(slide, 0.5, y, 9.0, 0.36, s, size=15, color=NAVY, bold=True)


def badge(slide, cx, cy, n, d=0.27, fill=ORANGE, size=12):
    """Vòng tròn số (tâm cx, cy, inch)."""
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx - d / 2), Inches(cy - d / 2), Inches(d), Inches(d))
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.color.rgb = WHITE
    sh.line.width = Pt(1.25)
    sh.shadow.inherit = False
    tf = sh.text_frame
    for side in ("margin_left", "margin_right", "margin_top", "margin_bottom"):
        setattr(tf, side, 0)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    _runs(p, str(n), size, WHITE, True)
    return sh


def est_h(s, w, size):
    """Ước chiều cao khối chữ (inch) theo độ dài — để các bước không đè nhau."""
    import math
    plain = s.replace("**", "")
    cpl = max(8, int(w * 72 / (size * 0.53)))
    words, lines, cur = plain.split(), 1, 0
    for wd in words:
        if cur and cur + 1 + len(wd) > cpl:
            lines, cur = lines + 1, len(wd)
        else:
            cur += (1 if cur else 0) + len(wd)
    return lines * size * 1.22 / 72 + 0.04


def steps(slide, x, y, w, items, size=13, gap=0.1, row_h=None, d=0.27):
    """Danh sách bước có vòng số. items: (số, chữ, chiều cao dòng tuỳ chọn)."""
    cy = y
    for it in items:
        n, s = it[0], it[1]
        hh = it[2] if len(it) > 2 else (row_h or 0.5)
        hh = max(hh, est_h(s, w - d - 0.1, size))
        if n:
            badge(slide, x + d / 2, cy + d / 2 + 0.01, n, d=d)
        text(slide, x + d + 0.1, cy, w - d - 0.1, hh, s, size=size)
        cy += hh + gap
    return cy


def card(slide, x, y, w, h, fill=CARD, line=None, radius=0.08):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.adjustments[0] = radius
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(1)
    sh.shadow.inherit = False
    return sh


def arrow(slide, x, y, w, h, color=CYAN, kind=MSO_SHAPE.RIGHT_ARROW):
    sh = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


# ---------------------------------------------------------------- tiện ích ảnh
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"


def _style_pic(pic, adj=4000, shadow=True):
    """Bo góc nhẹ + đổ bóng xanh nhạt (0B2E5C, alpha 22%) như ảnh trong bộ slide gốc."""
    spPr = pic._element.spPr
    geom = spPr.find(qn("a:prstGeom"))
    geom.set("prst", "roundRect")
    av = geom.find(qn("a:avLst"))
    if av is None:
        av = etree.SubElement(geom, qn("a:avLst"))
    for c in list(av):
        av.remove(c)
    gd = etree.SubElement(av, qn("a:gd"))
    gd.set("name", "adj")
    gd.set("fmla", f"val {adj}")
    if shadow:
        eff = etree.SubElement(spPr, qn("a:effectLst"))
        sd = etree.SubElement(eff, qn("a:outerShdw"))
        for k, v in (("blurRad", "76200"), ("dist", "25400"), ("dir", "5400000"), ("algn", "t"),
                     ("rotWithShape", "0")):
            sd.set(k, v)
        clr = etree.SubElement(sd, qn("a:srgbClr"))
        clr.set("val", "0B2E5C")
        al = etree.SubElement(clr, qn("a:alpha"))
        al.set("val", "22000")
    # viền mảnh cho ảnh màn hình nền trắng khỏi lẫn vào nền slide
    ln = spPr.find(qn("a:ln"))
    if ln is None:
        ln = etree.Element(qn("a:ln"))
        if spPr.find(qn("a:effectLst")) is not None:
            spPr.find(qn("a:effectLst")).addprevious(ln)
        else:
            spPr.append(ln)
    ln.set("w", "6350")
    sf = etree.SubElement(ln, qn("a:solidFill"))
    c2 = etree.SubElement(sf, qn("a:srgbClr"))
    c2.set("val", "C9DDF0")


class Shot:
    """Ảnh màn hình đặt trên slide + hàm đổi pixel → inch để khoanh nút."""

    def __init__(self, slide, name, x, y, w=None, h=None, crop=(0, 0, 0, 0), path=None, size=(SW, SH)):
        self.slide = slide
        self.W, self.H = size
        l, t, r, b = crop
        assert (l + r) / self.W <= 0.185 and (t + b) / self.H <= 0.185, f"cắt quá 18%: {name}"
        self.l, self.t = l, t
        self.vw, self.vh = self.W - l - r, self.H - t - b
        if w is None:
            w = h * self.vw / self.vh
        if h is None:
            h = w * self.vh / self.vw
        self.x, self.y, self.w, self.h = x, y, w, h
        path = path or os.path.join(ANH, name + ".png")
        pic = slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))
        pic.crop_left, pic.crop_top = l / self.W, t / self.H
        pic.crop_right, pic.crop_bottom = r / self.W, b / self.H
        _style_pic(pic)
        self.pic = pic

    def X(self, px):
        return self.x + (px - self.l) * self.w / self.vw

    def Y(self, py):
        return self.y + (py - self.t) * self.h / self.vh

    def mark(self, box, n=None, pos="tl", pad=4, d=0.27):
        """Khung bo góc viền cam quanh vùng box=(x0,y0,x1,y1) px + vòng số."""
        x0, y0, x1, y1 = box
        X0, Y0 = self.X(x0 - pad), self.Y(y0 - pad)
        X1, Y1 = self.X(x1 + pad), self.Y(y1 + pad)
        sh = self.slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(X0), Inches(Y0),
                                         Inches(X1 - X0), Inches(Y1 - Y0))
        sh.adjustments[0] = min(0.3, 0.06 / max(0.01, min(X1 - X0, Y1 - Y0)))
        sh.fill.background()
        sh.line.color.rgb = ORANGE
        sh.line.width = Pt(2.25)
        sh.shadow.inherit = False
        if n is not None:
            r = d / 2
            cx = {"tl": X0, "tr": X1, "bl": X0, "br": X1, "l": X0 - r - 0.02, "r": X1 + r + 0.02,
                  "t": (X0 + X1) / 2, "b": (X0 + X1) / 2}[pos]
            cy = {"tl": Y0, "tr": Y0, "bl": Y1, "br": Y1, "l": (Y0 + Y1) / 2, "r": (Y0 + Y1) / 2,
                  "t": Y0 - r - 0.02, "b": Y1 + r + 0.02}[pos]
            badge(self.slide, cx, cy, n, d=d)
        return sh


def below(*shots, gap=0.12):
    """Toạ độ y ngay dưới ảnh thấp nhất."""
    return max(sh.y + sh.h for sh in shots) + gap


def zoom(name, box, out_w=None):
    """Cắt riêng một vùng ảnh để làm ô phóng to (ảnh gốc vẫn hiện đủ cạnh bên)."""
    im = Image.open(os.path.join(ANH, name + ".png")).convert("RGB")
    c = im.crop(box)
    p = os.path.join(BUILD, f"zoom_{name}_{box[0]}_{box[1]}.png")
    c.save(p)
    return p, c.size


def picture(slide, path, x, y, w=None, h=None, crop_px=None, adj=4000, shadow=True):
    im = Image.open(path)
    W, H = im.size
    l, t, r, b = crop_px or (0, 0, 0, 0)
    vw, vh = W - l - r, H - t - b
    if w is None:
        w = h * vw / vh
    if h is None:
        h = w * vh / vw
    pic = slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))
    pic.crop_left, pic.crop_top, pic.crop_right, pic.crop_bottom = l / W, t / H, r / W, b / H
    _style_pic(pic, adj=adj, shadow=shadow)
    return pic, w, h


def minh(name):
    """Minh hoạ 2k PNG → JPEG 1600px trong build/ cho nhẹ file pptx."""
    out = os.path.join(BUILD, name + ".jpg")
    src = os.path.join(MINH, name + ".png")
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
        im = Image.open(src).convert("RGB")
        im.thumbnail((1600, 1600), Image.LANCZOS)
        im.save(out, quality=90)
    return out


# ---------------------------------------------------------------- khung slide
prs = Presentation(TEMPLATE)
LAYOUT = [l for l in prs.slide_layouts if l.name == "Title Only"][0]
sldIdLst = prs.slides._sldIdLst
ids = list(sldIdLst)
cover_id, thanks_id = ids[0], ids[-1]
for sid in ids[1:-1]:
    prs.part.drop_rel(sid.get(qn("r:id")))
    sldIdLst.remove(sid)
# đổi tên phần slide "cảm ơn" để slide mới không trùng tên file trong gói
prs.part.related_part(thanks_id.get(qn("r:id"))).partname = PackURI("/ppt/slides/slide999.xml")


def new_slide(title):
    s = prs.slides.add_slide(LAYOUT)
    for ph in list(s.placeholders):
        if ph.placeholder_format.type != 1:  # chỉ giữ tiêu đề
            ph._element.getparent().remove(ph._element)
    t = s.shapes.title
    t.left, t.top, t.width, t.height = Inches(0.42), Inches(0.31), Inches(7.35), Inches(0.7)
    tf = t.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.word_wrap = True
    tf.text = ""
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = title
    r.font.size = Pt(24)
    r.font.bold = True
    r.font.name = FONT  # Avenir Black của master thiếu dấu tiếng Việt ghép
    r.font.color.rgb = WHITE
    for tag in ("a:cs",):
        el = r.font._rPr.find(qn(tag))
        if el is None:
            el = etree.SubElement(r.font._rPr, qn(tag))
        el.set("typeface", FONT)
    return s


def section_tag(slide, s):
    """Nhãn nhỏ góc phải dưới thanh tiêu đề: ai làm trang này."""
    text(slide, 8.05, 0.47, 1.0, 0.3, s, size=12, color=NAVY, bold=True, align=PP_ALIGN.RIGHT)


# ================================================================ TRANG 1 — BÌA
cover = prs.slides[0]
for sh in cover.shapes:
    if sh.has_text_frame and sh.text_frame.text.strip() == "[TEXT]":
        sh.left, sh.width = Inches(1.0), Inches(6.15)
        sh.top, sh.height = Inches(1.92), Inches(1.95)
        tf = sh.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p0 = tf.paragraphs[0]
        for r in list(p0.runs):
            r._r.getparent().remove(r._r)
        p0.alignment = PP_ALIGN.CENTER
        _runs(p0, "DỰ TRÙ & ĐẤU THẦU", 28, RGBColor(0x0B, 0x28, 0x7F), True)
        pz = tf.add_paragraph()
        pz.alignment = PP_ALIGN.CENTER
        _runs(pz, "VẬT TƯ Y TẾ", 28, RGBColor(0x0B, 0x28, 0x7F), True)
        p1 = tf.add_paragraph()
        p1.alignment = PP_ALIGN.CENTER
        p1.space_before = Pt(6)
        _runs(p1, "Hướng dẫn sử dụng", 20, NAVY, True)
        p2 = tf.add_paragraph()
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(10)
        _runs(p2, "Phòng Điều dưỡng · 10/2026", 14, MUTED, False)

# ================================================================ TRANG 2 — BIG PICTURE 1
s = new_slide("Đi chợ online cho vật tư y tế")
lead(s, "Web giống một ứng dụng đi chợ: khoa chọn món, PĐD gác cổng trước khi chốt đơn.")
imgs = ["1_khoa_di_cho", "2_pdd_cong_kiem", "3_hang_ve", "4_doc_thuc"]
heads = ["Khoa đi chợ", "PĐD gác cổng", "Đấu thầu, hàng về", "Dùng và đốc thúc"]
bodies = [
    "Chọn món, bỏ giỏ, gửi đề xuất.",
    "So với **lượng dùng các năm trước** và **thông số kỹ thuật**, rồi chốt số.",
    "Món rớt thầu: đổi sang **mã tương đương** hoặc chuyển sang **đợt bổ sung**.",
    "PĐD theo dõi **tiến độ dùng**, nhắc khoa dùng chậm.",
]
IW, GAP = 2.07, 0.24
x0 = (10 - (4 * IW + 3 * GAP)) / 2
for i in range(4):
    x = x0 + i * (IW + GAP)
    picture(s, minh(imgs[i]), x, 1.62, w=IW)
    badge(s, x + 0.2, 1.62 + 0.2, i + 1, d=0.32, fill=NAVY, size=14)
    text(s, x, 3.3, IW, 0.32, heads[i], size=15, color=NAVY, bold=True)
    text(s, x, 3.64, IW, 1.3, bodies[i], size=13, color=INK)
    if i < 3:
        arrow(s, x + IW + 0.04, 1.62 + IW * 0.75 / 2 - 0.09, GAP - 0.08, 0.18)
text(s, x0, 4.88, 9.0, 0.32,
     "Khoa = người đi chợ  ·  Web = ứng dụng đi chợ  ·  PĐD = cổng kiểm và người đốc thúc",
     size=12, color=MUTED)

# ================================================================ TRANG 3 — BIG PICTURE 2
s = new_slide("Hai vai, một vòng")
lead(s, "Khoa lo phần đề xuất và dùng; PĐD lo phần kiểm, chốt và theo dõi.")
# cột Khoa
card(s, 0.45, 1.62, 3.35, 3.6)
p1 = os.path.join(BUILD, "chan_dung_khoa.png")
Image.open(os.path.join(MINH, "1_khoa_di_cho.png")).crop((420, 300, 1320, 1200)).save(p1)
picture(s, p1, 0.62, 1.76, w=0.95, adj=50000, shadow=False)
text(s, 1.7, 1.86, 2.0, 0.7, [("KHOA", 18, NAVY, True), ("người đi chợ", 13, MUTED, False)], space_after=0)
steps(s, 0.62, 2.85, 3.05, [
    (1, "Đề xuất số lượng, gửi giỏ", 0.3),
    (2, "Xác nhận danh mục của khoa", 0.3),
    (3, "Xử lý mã rớt: đề xuất lại hoặc báo không còn nhu cầu", 0.5),
    (4, "Đọc hộp thư thông báo (chuông)", 0.5),
], size=13, gap=0.08)
# cột PĐD
card(s, 6.2, 1.62, 3.35, 3.6)
p2 = os.path.join(BUILD, "chan_dung_pdd.png")
Image.open(os.path.join(MINH, "2_pdd_cong_kiem.png")).crop((560, 260, 1460, 1160)).save(p2)
picture(s, p2, 6.37, 1.76, w=0.95, adj=50000, shadow=False)
text(s, 7.45, 1.86, 2.0, 0.7, [("PĐD", 18, NAVY, True), ("cổng kiểm, người đốc thúc", 13, MUTED, False)],
     space_after=0)
steps(s, 6.37, 2.85, 3.05, [
    (1, "Tạo đợt, mở gói con", 0.3),
    (2, "Kiểm số, chốt số đi thầu", 0.3),
    (3, "Ghi kết quả thầu: rớt, chia số trúng, đổ mã", 0.5),
    (4, "Chốt trình ký; theo dõi tiến độ dùng", 0.5),
], size=13, gap=0.08)
# vòng giữa
cxm = 5.0
b1 = card(s, cxm - 1.05, 1.68, 2.1, 0.82, fill=NAVY)
text(s, cxm - 1.05, 1.68, 2.1, 0.82, [("Gói 18 tháng", 15, WHITE, True), ("5 gói con", 12, WHITE, False)],
     align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, space_after=0)
arrow(s, cxm - 0.13, 2.56, 0.26, 0.36, kind=MSO_SHAPE.DOWN_ARROW)
text(s, cxm - 1.1, 2.97, 2.2, 0.5, "mã rớt tự vào giỏ đợt bổ sung gần nhất", size=12, color=MUTED,
     align=PP_ALIGN.CENTER)
arrow(s, cxm - 0.13, 3.48, 0.26, 0.36, kind=MSO_SHAPE.DOWN_ARROW)
card(s, cxm - 1.05, 3.9, 2.1, 0.82, fill=CYAN)
text(s, cxm - 1.05, 3.9, 2.1, 0.82, [("Đợt bổ sung", 15, WHITE, True), ("3 đợt/năm · T1, T5, T9", 12, WHITE, False)],
     align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, space_after=0)
text(s, cxm - 1.1, 4.78, 2.2, 0.45, "đi lại đúng các bước như gói 18 tháng", size=12, color=MUTED,
     align=PP_ALIGN.CENTER)

# ================================================================ TRANG 4 — BẮT ĐẦU
s = new_slide("Bắt đầu")
lead(s, "Đăng nhập bằng tài khoản được cấp; trang chính của khoa cho biết việc cần làm.")
sh = Shot(s, "khoa_01_man_chao", 0.5, 1.62, w=5.75)
sh.mark((40, 150, 272, 600), 1, "tr")
sh.mark((1272, 20, 1306, 54), 2, "bl")
sh.mark((1420, 812, 1440, 876), 3, "l")
steps(s, 6.55, 1.7, 3.0, [
    (1, "Menu trái **Việc chính**: ① Đề xuất số lượng → ② Danh mục của khoa → ③ Mã rớt.", 0.95),
    (2, "**Chuông**: hộp thư thông báo. Số đỏ = thư chưa xem.", 0.7),
    (3, "Thẻ xanh mép phải: **Trợ giúp** — bấm câu hỏi để đọc câu trả lời theo tình trạng gói đang xem.", 1.15),
], size=13, gap=0.1)

# ================================================================ TRANG 5 — KHOA: CHỌN GÓI CON
s = new_slide("Chọn gói con")
section_tag(s, "KHOA")
lead(s, "Chọn Gói rồi Gói con; thanh 5 bước cho biết khoa đang ở đâu.")
sh = Shot(s, "khoa_02_chon_goi_con", 0.5, 1.62, w=6.0, crop=(0, 0, 0, 120))
sh.mark((329, 289, 503, 323), 1, "tl")
sh.mark((1025, 289, 1092, 323), 2, "tr")
sh.mark((329, 357, 1398, 404), 3, "bl")
sh.mark((1237, 412, 1398, 447), 4, "br")
steps(s, 6.8, 1.7, 2.75, [
    (1, "Bấm **Gói 18 tháng** (đang mở).", 0.5),
    (2, "Bấm tên **gói con**, ví dụ GMHS.", 0.5),
    (3, "Thanh **5 bước**: Đề xuất → Gửi → Xác nhận danh mục → Chờ PĐD chốt số → Kết quả thầu.", 1.15),
    (4, "Bấm **Mở Đề xuất số lượng**.", 0.5),
], size=13, gap=0.08)

# ================================================================ TRANG 6 — BƯỚC ② TỔNG SỐ
s = new_slide("Bước ②: gõ tổng số")
section_tag(s, "KHOA")
lead(s, "Bấm một nhóm vật tư, gõ tổng số cho cả nhóm, hoặc bấm một mức gợi ý.")
sh = Shot(s, "khoa_03_buoc2_nhap_tong_so", 0.5, 1.62, w=5.9)
sh.mark((322, 583, 652, 642), 1, "tl")
sh.mark((744, 481, 967, 523), 2, "tl")
sh.mark((744, 600, 1401, 654), 3, "bl")
steps(s, 6.7, 1.68, 2.85, [
    (1, "Bấm **nhóm vật tư** ở cột trái.", 0.5),
    (2, "Gõ **Tổng số** cho cả nhóm, Enter để đi tiếp.", 0.5),
    (3, "Hoặc bấm một ô **gợi ý theo lịch sử của khoa**, ví dụ Mức thường dùng.", 0.75),
], size=13, gap=0.08)
text(s, 6.7, 3.62, 2.85, 0.28, "Gói Dùng chung cũng có 4 mức gợi ý:", size=12, color=MUTED)
sh2 = Shot(s, "khoa_10_ma_dung_chung_goi_y_theo_lich_su", 6.7, 3.92, w=2.1)
sh2.mark((744, 600, 1401, 654), None, pad=6)

# ================================================================ TRANG 7 — BƯỚC ③ CHIA MÃ HÀNG
s = new_slide("Bước ③: chia cho mã hàng")
section_tag(s, "KHOA")
lead(s, "Chia tổng cho từng mã hàng; cộng lại phải bằng tổng thì mới vào giỏ.")
sh = Shot(s, "khoa_05_chia_du_khop_20_tren_20", 0.5, 1.62, w=4.45, crop=(0, 72, 0, 0))
sh.mark((1116, 492, 1266, 616), 1, "tl")
sh.mark((1270, 660, 1405, 684), 2, "br")
sh.mark((971, 839, 1159, 879), 3, "tl")
sh2 = Shot(s, "khoa_11_chia_ma_hang_quy_doi_dvt", 5.1, 1.62, w=4.45, crop=(0, 72, 0, 0))
sh2.mark((1116, 492, 1266, 822), 4, "tl")
sh2.mark((1300, 492, 1405, 822), 5, "tr")
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Gõ số cho từng mã (Enter sang ô kế).", 0.3),
    (2, "Đủ **20 / 20 ✓** → ③ **Thêm cả nhóm vào giỏ** (hoặc Enter).", 0.5),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Nhóm có mã khác đơn vị: gõ theo **đơn vị của từng mã**.", 0.5),
    (5, "Cột **Quy ra Cái** tự quy đổi để so với tổng.", 0.3),
], size=13, gap=0.05)

# ================================================================ TRANG 8 — VƯỢT MỨC / CHIA THIẾU
s = new_slide("Khi vượt mức, khi chia thiếu")
section_tag(s, "KHOA")
lead(s, "Web báo ngay dưới thanh giỏ; sửa xong mới vào giỏ được.")
sh = Shot(s, "khoa_07_vuot_muc_phai_chon_ly_do", 0.5, 1.62, w=4.45)
sh.mark((703, 612, 1401, 648), 1, "tl")
sh.mark((701, 682, 1116, 728), 2, "bl")
sh.mark((1138, 685, 1401, 724), 3, "br")
sh2 = Shot(s, "khoa_14_chia_thieu_bi_chan", 5.1, 1.62, w=4.45)
sh2.mark((1095, 700, 1405, 726), 4, "tl")
sh2.mark((320, 857, 690, 880), 5, "tr")
text(s, 0.5, 4.48, 4.45, 0.3, "Tổng cao hơn cận trên thông thường", size=14, color=NAVY, bold=True)
steps(s, 0.5, 4.82, 4.45, [
    (2, "Chọn **lý do**, rồi ③ gõ **ghi chú** (căn cứ chọn tổng này).", 0.5),
], size=13)
text(s, 5.1, 4.48, 4.45, 0.3, "Chia chưa đủ tổng", size=14, color=NAVY, bold=True)
steps(s, 5.1, 4.82, 4.45, [
    (4, "Dòng **Đã chia** đỏ, ghi còn thiếu bao nhiêu; ⑤ dải đỏ dưới thanh giỏ nhắc lại.", 0.5),
], size=13)

# ================================================================ TRANG 9 — GIỎ VÀ GỬI
s = new_slide("Xem giỏ và gửi")
section_tag(s, "KHOA")
lead(s, "Giỏ chưa phải đề xuất: phải bấm Gửi đề xuất thì PĐD mới thấy.")
sh = Shot(s, "khoa_08_xem_gio_truoc_khi_gui", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 0))
sh.mark((1320, 143, 1410, 170), 1, "l")
sh.mark((880, 808, 1360, 832), 2, "tl")
sh.mark((1098, 844, 1424, 884), 3, "bl")
sh2 = Shot(s, "khoa_09_da_gui_de_xuat", 5.1, 1.62, w=4.45, crop=(0, 72, 0, 0))
sh2.mark((587, 145, 713, 196), 4, "tr")
sh2.mark((528, 846, 985, 872), 5, "tl")
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "**Bỏ khỏi giỏ** nhóm không muốn gửi. ② Số trong giỏ không sửa ở đây.", 0.5),
    (3, "Bấm **Gửi đề xuất (N nhóm)**.", 0.3),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Đã gửi: thanh bước chuyển sang **Xác nhận**.", 0.3),
    (5, "Dải đáy báo **Đã gửi N nhóm vào đợt…**", 0.3),
], size=13, gap=0.05)

# ================================================================ TRANG 10 — KHÔNG PHÁT SINH
s = new_slide("Gói con không cần gì")
section_tag(s, "KHOA")
lead(s, "Khoa không cần vật tư nào trong gói con này thì báo cho PĐD biết, đừng bỏ trống.")
z1, (zw, zh) = zoom("khoa_12_goi_con_trong_khong_phat_sinh", (760, 40, 1440, 120))
z2, _ = zoom("khoa_13_da_xac_nhan_khong_phat_sinh", (0, 40, 760, 120))
sh = Shot(s, "khoa_12_goi_con_trong_khong_phat_sinh", 0.5, 1.62, w=3.3, crop=(0, 0, 0, 160))
sh.mark((1242, 51, 1424, 83), 1, "bl", pad=6)
sh2 = Shot(s, "khoa_13_da_xac_nhan_khong_phat_sinh", 0.5, 3.55, w=3.3, crop=(0, 0, 0, 160))
sh2.mark((18, 92, 575, 110), 2, "br", pad=6)
# ô phóng to
_, w1, h1 = picture(s, z1, 4.15, 1.68, w=5.4, shadow=True)
Z1 = Shot.__new__(Shot)
Z1.slide, Z1.l, Z1.t, Z1.vw, Z1.vh, Z1.x, Z1.y, Z1.w, Z1.h = s, 760, 40, 680, 80, 4.15, 1.68, w1, h1
Z1.mark((1242, 51, 1424, 83), 1, "l", pad=4)
text(s, 4.15, 1.68 + h1 + 0.08, 5.4, 0.55,
     "Ở **Danh mục đề xuất** của gói con, bấm **Không phát sinh nhu cầu** (góc phải trên).", size=13)
_, w2, h2 = picture(s, z2, 4.15, 3.6, w=5.4, shadow=True)
Z2 = Shot.__new__(Shot)
Z2.slide, Z2.l, Z2.t, Z2.vw, Z2.vh, Z2.x, Z2.y, Z2.w, Z2.h = s, 0, 40, 760, 80, 4.15, 3.6, w2, h2
Z2.mark((18, 92, 575, 110), 2, "l", pad=4)
text(s, 4.15, 3.6 + h2 + 0.08, 5.4, 0.55,
     "Web ghi **Đã xác nhận lần 1 · Không phát sinh nhu cầu**. PĐD thấy khoa này báo không cần.",
     size=13)

# ================================================================ TRANG 11 — XÁC NHẬN DANH MỤC
s = new_slide("Xác nhận danh mục")
section_tag(s, "KHOA")
lead(s, "Gửi xong, xem lại Danh mục đề xuất của khoa rồi bấm xác nhận.")
a = Shot(s, "khoa_15_danh_muc_xem_nhanh_truoc_xac_nhan", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 150))
a.mark((1199, 51, 1424, 83), 1, "bl", pad=4)
steps(s, 0.5, below(a), 4.45, [(1, "Xem lại bảng, bấm **Xác nhận thông tin đề xuất lần 1**.", 0.5)], size=13)


def inset(slide, name, box, x, y, w):
    """Ô phóng to một vùng của ảnh (ảnh đầy đủ có ở trang/ô khác)."""
    pth, _ = zoom(name, box)
    _, ww, hh = picture(slide, pth, x, y, w=w)
    z = Shot.__new__(Shot)
    z.slide, z.l, z.t = slide, box[0], box[1]
    z.vw, z.vh = box[2] - box[0], box[3] - box[1]
    z.x, z.y, z.w, z.h = x, y, ww, hh
    return z


z1 = inset(s, "khoa_16_da_xac_nhan_lan_1", (0, 40, 760, 120), 5.1, 1.62, 4.45)
z1.mark((18, 92, 437, 110), 2, "r", pad=3)
steps(s, 5.1, below(z1, gap=0.08), 4.45, [(2, "Dải xanh: **Đã xác nhận lần 1**. Ô số vẫn sửa được.", 0.3)], size=13)
z2 = inset(s, "khoa_18_sua_so_sau_xac_nhan_phai_xac_nhan_lai", (0, 40, 760, 120), 5.1, 2.72, 4.45)
z2.mark((18, 92, 760, 110), 3, "b", pad=3)
z3 = inset(s, "khoa_18_sua_so_sau_xac_nhan_phai_xac_nhan_lai", (680, 40, 1440, 120), 5.1, 3.58, 4.45)
z3.mark((1196, 51, 1424, 83), 4, "l", pad=3)
steps(s, 5.1, below(z3, gap=0.08), 4.45, [
    (3, "Sửa số sau khi xác nhận: dải vàng báo **lần 1 hết hiệu lực** → ④ bấm **lần 2**.", 0.5)], size=13)
card(s, 0.5, 4.72, 4.45, 0.5, fill=CARD)
text(s, 0.62, 4.72, 4.25, 0.5, "PĐD chỉ chốt số khi **mọi khoa đã gửi đều xác nhận**.",
     size=12, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)

# ================================================================ TRANG 12 — SAU KHI PĐD CHỐT SỐ
s = new_slide("Sau khi PĐD chốt số")
section_tag(s, "KHOA")
lead(s, "PĐD chốt số đi thầu thì số của khoa khoá lại; khoa chưa cần làm gì.")
sh = Shot(s, "khoa_19_sau_khi_pdd_chot_so", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh.mark((990, 357, 1185, 402), 1, "tl")
sh.mark((329, 418, 870, 440), 2, "bl")
sh2 = Shot(s, "khoa_20_so_bi_khoa_sau_khi_pdd_chot", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh2.mark((444, 92, 758, 110), 3, "tr", pad=6)
sh2.mark((722, 178, 872, 505), 4, "br")
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Bước 4: **PĐD đã chốt số**.", 0.3),
    (2, "Việc tiếp theo: **khoa chưa cần thao tác**.", 0.3),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (3, "Dải cam: **PĐD đã chốt số đi thầu, không sửa được ở đây**.", 0.5),
    (4, "Cột số lượng khoá.", 0.3),
], size=13, gap=0.05)

# ================================================================ TRANG 13 — MÃ RỚT
s = new_slide("Có mã rớt thầu")
section_tag(s, "KHOA")
lead(s, "Mã rớt hiện nhãn đỏ ở menu; mở ③ Mã rớt để xem từng mục.")
sh = Shot(s, "khoa_21_menu_goi_bo_sung_nhan_do_5_ma_rot", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh.mark((40, 322, 272, 388), 1, "tr")
sh.mark((1268, 22, 1308, 52), 2, "bl")
sh.mark((1203, 357, 1398, 402), 3, "bl")
sh2 = Shot(s, "khoa_22_ma_rot_gio_rot_co_ten_vat_tu", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh2.mark((38, 590, 270, 628), 4, "tr")
sh2.mark((308, 202, 678, 258), 5, "tr")
sh2.mark((320, 328, 575, 346), 6, "bl", pad=5)
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Menu **Gói bổ sung** có nhãn đỏ **N mã rớt**.", 0.3),
    (2, "Chuông có thư mới. ③ Bước 5: **Kết quả thầu**.", 0.5),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Mở **Mã rớt**. ⑤ Số mục, chưa xử lý, tổng thiếu.", 0.5),
    (6, "Mỗi mục: mang đi thầu · trúng · **thiếu**.", 0.3),
], size=13, gap=0.05)

# ================================================================ TRANG 14 — XỬ LÝ MÃ RỚT
s = new_slide("Xử lý mã rớt")
section_tag(s, "KHOA")
lead(s, "Mỗi mã rớt chọn một trong hai: đề xuất lại ở đợt bổ sung, hoặc báo không còn nhu cầu.")
sh = Shot(s, "khoa_24_nhap_ly_do_khong_con_nhu_cau", 0.5, 1.62, w=4.3)
sh.mark((762, 792, 948, 823), 1, "tl", pad=3)
sh.mark((321, 838, 1262, 868), 2, "bl", pad=3)
sh.mark((1271, 838, 1407, 868), 3, "tr", pad=3)
b = Shot(s, "khoa_23_goi_bo_sung_6_ma_trong_gio", 5.1, 1.62, w=4.4)
b.mark((1173, 839, 1351, 879), 4, "tl")
steps(s, 0.5, below(sh, gap=0.1), 4.3, [
    (1, "**Sang đợt này để đề xuất lại** → vào giỏ bổ sung.", 0.3),
    (2, "Hoặc gõ ghi chú, ③ bấm **Không còn nhu cầu**.", 0.3),
], size=13, gap=0.05)
steps(s, 5.1, below(b, gap=0.1), 4.4, [
    (4, "Ở **Gói bổ sung**, mã đã nằm sẵn trong giỏ: kiểm rồi bấm **Gửi đề xuất**.", 0.5),
], size=13)
text(s, 5.1, below(b, gap=0.1) + 0.55, 4.4, 0.3,
     "Báo không còn nhu cầu: mục chuyển xám **Đã xử lý**.", size=12, color=MUTED)

# ================================================================ TRANG 15 — DẢI ĐỎ + HỘP THƯ
s = new_slide("Danh mục sau thầu, hộp thư")
section_tag(s, "KHOA")
lead(s, "Danh mục của khoa ghi rõ mã nào rớt, mã nào đã đổ; chuông báo từng việc.")
sh = Shot(s, "khoa_30_danh_muc_dung_chung_dai_do_ma_rot", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh.mark((765, 92, 1197, 110), 1, "tr", pad=6)
sh.mark((75, 224, 270, 240), 2, "r", pad=4)
sh.mark((75, 295, 270, 384), 3, "r", pad=4)
sh2 = Shot(s, "khoa_31_hop_thu_khoa_ma_rot_do_ma", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh2.mark((1268, 22, 1308, 52), 4, "l")
sh2.mark((895, 100, 1307, 285), 5, "bl", pad=2)
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Dải đỏ tóm tắt **N mã rớt**.", 0.3),
    (2, "Nhãn trên dòng: **Rớt N ở … · trúng M**. ③ **↪ đã đổ… / ↩ nhận…**", 0.5),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Bấm **chuông** mở hộp thư khoa.", 0.3),
    (5, "Thư đỏ: mã rớt đã vào giỏ; số chuyển sang mã khác. Bấm ✓ khi đã đọc.", 0.5),
], size=13, gap=0.05)

# ================================================================ TRANG 16 — PĐD: TẠO ĐỢT
s = new_slide("Tạo đợt, mở gói con")
section_tag(s, "PĐD")
lead(s, "Nghiệp vụ dùng chung → Quản lý đợt đề xuất. Mỗi gói con phải mở riêng.")
W3, G3 = 2.9, 0.15
xs = [0.5, 0.5 + W3 + G3, 0.5 + 2 * (W3 + G3)]
a = Shot(s, "pdd_01_tao_dot_moi", xs[0], 1.62, w=W3, crop=(0, 0, 0, 80))
a.mark((38, 652, 270, 691), 1, "tr")
a.mark((321, 231, 1407, 307), 2, "tl", pad=3)
a.mark((321, 316, 393, 345), 3, "br", pad=3)
b = Shot(s, "pdd_02_dot_goi_con_truoc_khi_mo", xs[1], 1.62, w=W3, crop=(0, 0, 0, 80))
b.mark((1295, 368, 1396, 608), 4, "l", pad=3)
c = Shot(s, "pdd_03_dot_da_mo_5_goi_con", xs[2], 1.62, w=W3, crop=(0, 0, 0, 80))
c.mark((1110, 372, 1180, 604), 5, "l", pad=3)
yb = below(a, b, c)
steps(s, xs[0], yb, W3, [
    (1, "Mở **Nghiệp vụ dùng chung** → Quản lý đợt đề xuất.", 0.5),
    (2, "Chọn loại gói, năm, gõ tên đợt. ③ **Tạo đợt**.", 0.5),
], size=13, gap=0.05)
steps(s, xs[1], yb, W3, [
    (4, "Đợt đã mở nhưng gói con còn **Đã đóng**: bấm **Mở gói con** từng dòng.", 0.75),
], size=13)
steps(s, xs[2], yb, W3, [
    (5, "Cả 5 gói con **Đang mở**: khoa bắt đầu đề xuất được.", 0.5),
], size=13)
card(s, 0.5, 4.75, 9.0, 0.45, fill=CARD)
text(s, 0.65, 4.75, 8.7, 0.45, "Đóng đợt là chốt sổ và đóng luôn mọi gói con. Mở lại đợt thì phải mở lại từng gói.",
     size=12, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)

# ================================================================ TRANG 17 — BÀN ĐIỀU HÀNH
s = new_slide("Bàn điều hành")
section_tag(s, "PĐD")
lead(s, "Nhìn mọi gói con một lượt: mỗi gói con một hàng 7 ô, từ Đề xuất tới Trình ký.")
sh = Shot(s, "pdd_04_ban_dieu_hanh_tien_trinh_5_goi_con", 0.5, 1.62, w=5.6, crop=(0, 0, 0, 100))
sh.mark((386, 160, 528, 196), 1, "tl")
sh.mark((458, 286, 1287, 355), 2, "bl")
sh.mark((1296, 305, 1390, 337), 3, "tr")
sh2 = Shot(s, "pdd_05_ban_dieu_hanh_chon_goi_con_gmhs", 6.35, 1.62, w=3.15, crop=(0, 0, 0, 100))
sh2.mark((700, 208, 791, 244), 4, "tl", pad=3)
sh2.mark((326, 676, 1402, 733), 5, "bl", pad=3)
steps(s, 6.35, below(sh2), 3.15, [
    (1, "Chọn **Loại gói** và đợt.", 0.28),
    (2, "Mỗi gói con **7 ô**; ô đang làm tô đậm.", 0.5),
    (3, "Nút **Tổng hợp** mở bảng làm việc.", 0.28),
    (4, "Bấm tên gói con → ⑤ **số khoa** tham gia, đã/chưa đề xuất, đã xác nhận.", 0.7),
], size=12, gap=0.04, d=0.25)

# ================================================================ TRANG 18 — CỔNG CỨNG
s = new_slide("Cổng kiểm trước khi chốt số")
section_tag(s, "PĐD")
lead(s, "Danh mục tổng hợp chỉ cho chốt số khi mọi khoa đã gửi đều xác nhận.")
sh = Shot(s, "pdd_06_tong_hop_cong_cung_chua_chot_duoc", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh.mark((97, 203, 541, 231), 1, "bl")
sh.mark((1278, 197, 1424, 237), 2, "bl")
sh2 = Shot(s, "pdd_09_tong_hop_cong_mo_chot_so_di_thau", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh2.mark((98, 190, 327, 212), 3, "bl")
sh2.mark((1278, 181, 1424, 221), 4, "bl")
text(s, 0.5, 4.1, 4.45, 0.3, "Chưa đủ: nút mờ", size=14, color=RED, bold=True)
steps(s, 0.5, 4.45, 4.45, [
    (1, "Dải vàng ghi **tên khoa chưa xác nhận** để nhắc.", 0.3),
    (2, "**Chốt số đi thầu** mờ.", 0.3),
], size=13, gap=0.05)
text(s, 5.1, 4.1, 4.45, 0.3, "Đủ: nút sáng", size=14, color=RGBColor(0x1B, 0x7F, 0x3B), bold=True)
steps(s, 5.1, 4.45, 4.45, [
    (3, "**Mọi khoa đã xác nhận bản hiện tại**.", 0.3),
    (4, "Bấm **Chốt số đi thầu** — chốt ngay, không hỏi lại.", 0.5),
], size=13, gap=0.05)

# ================================================================ TRANG 19 — XEM TỪNG KHOA
s = new_slide("Xem từng khoa, hai cách xem")
section_tag(s, "PĐD")
lead(s, "Bấm mũi tên đầu dòng để thấy từng khoa đề xuất bao nhiêu; đổi cách xem theo việc.")
sh = Shot(s, "pdd_08_so_xuong_xem_tung_khoa", 0.5, 1.62, w=4.75, crop=(0, 0, 0, 130))
sh.mark((3, 360, 32, 386), 1, "l")
sh.mark((60, 440, 510, 518), 2, "br")
b = Shot(s, "pdd_07_cach_xem_theo_viec_dang_lam", 5.45, 1.62, w=4.05, crop=(0, 0, 0, 160))
b.mark((845, 130, 1005, 166), 3, "bl")
c = Shot(s, "pdd_30_cach_xem_du_cot_sau_thau", 5.45, 3.86, w=2.35, crop=(0, 0, 0, 160))
c.mark((1005, 114, 1077, 150), 4, "bl")
steps(s, 0.5, 4.72, 4.75, [
    (1, "Mũi tên đầu dòng → ② bảng **từng khoa**: SL gốc, SL hiện hành, trạng thái.", 0.5),
], size=13)
text(s, 7.92, 3.86, 1.6, 1.45,
     [("③ **Theo việc đang làm**: chỉ hiện cột đang cần.", 12, INK, False),
      ("④ **Đủ cột**: có cả cột kết quả đấu thầu.", 12, INK, False)], space_after=4)

# ================================================================ TRANG 20 — CHỐT SỐ → CHÀO GIÁ
s = new_slide("Chốt số, bắt đầu Chào giá")
section_tag(s, "PĐD")
lead(s, "Chốt số xong thì hiện cột kết quả thầu; ba giai đoạn: Chào giá → Mở thầu → Đánh giá.")
sh = Shot(s, "pdd_10_da_chot_so_di_thau_cho_bat_dau_chao_gia", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh.mark((218, 154, 585, 175), 1, "tl", pad=5)
sh.mark((486, 184, 652, 218), 2, "br")
sh.mark((790, 230, 1420, 318), 3, "bl")
sh2 = Shot(s, "pdd_17_bat_dau_chao_gia_dung_chung", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh2.mark((120, 185, 318, 217), 4, "bl")
sh2.mark((892, 331, 928, 353), 5, "r", pad=6)
sh2.mark((569, 184, 760, 218), 6, "tr")
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Nhãn **Đã chốt số đi thầu · bản số 1**.", 0.3),
    (2, "Bấm **Bắt đầu Chào giá**. ③ Cột kết quả thầu.", 0.5),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Chào giá **đang gõ số rớt**. ⑤ Ô **+** ở cột Rớt.", 0.5),
    (6, "Gõ xong: **Hoàn thành Chào giá**.", 0.3),
], size=13, gap=0.05)

# ================================================================ TRANG 21 — GHI SỐ RỚT
s = new_slide("Ghi số rớt")
section_tag(s, "PĐD")
lead(s, "Mặc định mọi mã là trúng. Chỉ ghi những mã rớt, ở đúng giai đoạn rớt.")
sh = Shot(s, "pdd_18_hop_ghi_so_rot_chao_gia", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh.mark((510, 404, 790, 426), 1, "tl", pad=5)
sh.mark((512, 481, 930, 522), 2, "bl")
sh.mark((837, 532, 928, 568), 3, "br")
sh2 = Shot(s, "pdd_20_ghi_rot_mot_phan_2_khoa", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh2.mark((512, 433, 928, 474), 4, "tl")
sh2.mark((771, 184, 939, 218), 5, "tr")
yb = below(sh, sh2)
text(s, 0.5, yb, 4.45, 0.3, "Rớt hết", size=14, color=NAVY, bold=True)
steps(s, 0.5, yb + 0.34, 4.45, [
    (1, "Tích **Rớt toàn bộ phần còn lại**. ② Lý do (bắt buộc). ③ **Ghi số rớt**.", 0.5),
], size=13)
text(s, 5.1, yb, 4.45, 0.3, "Rớt một phần", size=14, color=NAVY, bold=True)
steps(s, 5.1, yb + 0.34, 4.45, [
    (4, "Gõ **số lượng rớt** và lý do. ⑤ Nút đỏ **Xác nhận rớt (N)** hiện ra — chưa bấm vội.", 0.5),
], size=13)

# ================================================================ TRANG 22 — CHIA SỐ TRÚNG
s = new_slide("Chia số trúng về khoa")
section_tag(s, "PĐD")
lead(s, "Mã rớt một phần: phải chia số trúng về từng khoa trước khi làm bước khác.")
sh = Shot(s, "pdd_23_bang_chia_so_trung_ve_khoa", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh.mark((767, 184, 1237, 218), 1, "tl")
sh.mark((1195, 330, 1237, 354), 2, "r", pad=5)
sh.mark((65, 390, 475, 412), 3, "bl")
sh2 = Shot(s, "pdd_24_chia_du_820_nut_xac_nhan_chia", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh2.mark((1240, 450, 1395, 478), 4, "l")
sh2.mark((67, 533, 190, 570), 5, "bl")
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Dải vàng: **còn N mã chưa chia đủ số trúng**.", 0.3),
    (2, "Bấm **Chia** (hoặc mũi tên đầu dòng). ③ Phải chia bao nhiêu.", 0.5),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Gõ số cho từng khoa tới khi **đã gõ** = **phải chia**.", 0.5),
    (5, "Bấm **Xác nhận chia**.", 0.3),
], size=13, gap=0.05)

# ================================================================ TRANG 23 — ĐỔ MÃ TƯƠNG ĐƯƠNG
s = new_slide("Đổ sang mã tương đương")
section_tag(s, "PĐD")
lead(s, "Phần rớt có thể đổ sang một mã cùng mã quản lý đã trúng; số của từng khoa giữ nguyên.")
sh = Shot(s, "pdd_25_hop_do_so_rot_sang_ma_tuong_duong", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh.mark((480, 473, 960, 507), 1, "tl")
sh.mark((480, 514, 962, 551), 2, "bl")
sh.mark((842, 560, 960, 591), 3, "br")
sh2 = Shot(s, "pdd_26_sau_khi_do_ma_nhan_ve_trong", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 120))
sh2.mark((80, 427, 222, 447), 4, "bl", pad=5)
sh2.mark((1196, 474, 1236, 498), 5, "l", pad=5)
sh2.mark((1256, 485, 1382, 505), 6, "b", pad=5)
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Chọn **mã tương đương** (mã khác đơn vị bị mờ). ② Gõ lý do.", 0.5),
    (3, "Bấm **Đổ sang mã này**.", 0.3),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Mã cho: **↪ đã đổ N sang …**, vẫn ở bảng.", 0.3),
    (5, "Mã nhận về trống → bấm **Chia** lại. ⑥ **↩ nhận N từ …**", 0.5),
], size=13, gap=0.05)

# ================================================================ TRANG 24a — HOÀN THÀNH GIAI ĐOẠN
s = new_slide("Hoàn thành từng giai đoạn")
section_tag(s, "PĐD")
lead(s, "Gõ xong số rớt của giai đoạn nào thì bấm Hoàn thành giai đoạn đó, rồi sang giai đoạn sau.")
sh = Shot(s, "pdd_27_hoi_hoan_thanh_chao_gia", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 160))
sh.mark((569, 184, 760, 218), 1, "tl")
sh.mark((823, 474, 929, 511), 2, "br")
sh2 = Shot(s, "pdd_28_ghi_rot_danh_gia", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 160))
sh2.mark((118, 184, 318, 218), 3, "bl")
sh2.mark((322, 184, 520, 218), 4, "tr")
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "**Hoàn thành Chào giá** → ② hỏi lại → **Hoàn thành**.", 0.3),
    (0, "Xong rồi thì số rớt giai đoạn đó chỉ còn đọc; mở lại phải ghi lý do.", 0.5),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (3, "Giai đoạn đã xong có dấu ✓, chỉ đọc.", 0.3),
    (4, "Giai đoạn đang làm: **đang gõ số rớt** (ở đây là Đánh giá).", 0.5),
], size=13, gap=0.05)

# ================================================================ TRANG 24b — XÁC NHẬN RỚT
s = new_slide("Xác nhận rớt")
section_tag(s, "PĐD")
lead(s, "Xong ba giai đoạn thì bấm Xác nhận rớt: phần rớt chưa đổ vào giỏ khoa ở đợt bổ sung.")
sh = Shot(s, "pdd_31_hoi_xac_nhan_rot_day_vao_gio", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 160))
sh.mark((431, 185, 590, 220), 1, "tl")
sh.mark((764, 484, 929, 521), 2, "br")
sh2 = Shot(s, "pdd_32_sau_xac_nhan_rot_thong_bao_da_vao_gio", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 160))
sh2.mark((16, 231, 730, 256), 3, "bl", pad=4)
sh2.mark((1252, 358, 1345, 600), 4, "l", pad=2)
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "**Xác nhận rớt (N)** → ② **Đồng ý, đẩy vào giỏ**.", 0.3),
    (0, "Số vào giỏ là **số gợi ý**, chưa phải đề xuất.", 0.3),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (3, "Dải xanh báo đã đưa vào giỏ đợt bổ sung.", 0.3),
    (4, "Cột Xử lý rớt: **↻ bổ sung N**.", 0.3),
], size=13, gap=0.05)
card(s, 0.5, 4.86, 9.0, 0.4, fill=CARD)
text(s, 0.65, 4.86, 8.7, 0.4,
     "Đợt bổ sung **hệ tự tạo** khi bấm Xác nhận rớt lần đầu. Khoa nhận thư đỏ, mở giỏ, kiểm rồi tự bấm Gửi.",
     size=12, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)

# ================================================================ TRANG 25 — CHỐT TRÌNH KÝ
s = new_slide("Chốt trình ký, xuất Excel")
section_tag(s, "PĐD")
lead(s, "Chốt trình ký đóng băng gói con thành bản chính thức; sau đó xuất Excel chính thức.")
sh = Shot(s, "pdd_34_hoi_chot_trinh_ky_khi_chua_xac_nhan_rot", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh.mark((1273, 183, 1424, 223), 1, "bl")
sh.mark((891, 314, 1096, 353), 2, "bl")
sh.mark((813, 484, 929, 521), 3, "br")
sh2 = Shot(s, "pdd_37_dung_chung_da_chot_trinh_ky_excel_chinh_thuc", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh2.mark((1177, 199, 1424, 239), 4, "bl")
sh2.mark((1067, 130, 1378, 166), 5, "tl")
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "**Chốt trình ký ▾** → ② **CHỐT TRÌNH KÝ TOÀN BỘ**.", 0.5),
    (3, "Hộp hỏi lại → **Chốt trình ký**.", 0.3),
], size=13, gap=0.05)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (4, "Nút đổi thành **Đã chốt trình ký — bản số 1**.", 0.3),
    (5, "Bấm **Xuất Excel CHÍNH THỨC**.", 0.3),
], size=13, gap=0.05)

# ================================================================ TRANG 26 — THEO DÕI
s = new_slide("Theo dõi sau thầu")
section_tag(s, "PĐD")
lead(s, "Ba màn chỉ để xem và nhắc: mã rớt đi đâu, kết quả thầu, giỏ rớt của các khoa.")
W3, G3 = 2.9, 0.15
xs = [0.5, 0.5 + W3 + G3, 0.5 + 2 * (W3 + G3)]
a = Shot(s, "pdd_39_theo_doi_chuyen_tiep_ma_rot", xs[0], 1.62, w=W3)
a.mark((38, 461, 270, 500), 1, "tr")
a.mark((1210, 340, 1370, 880), 2, "l", pad=2)
b = Shot(s, "pdd_40_tong_hop_ket_qua_thau", xs[1], 1.62, w=W3)
b.mark((38, 412, 270, 451), 3, "tr")
b.mark((308, 103, 1420, 268), 4, "bl", pad=2)
c = Shot(s, "pdd_42_gio_rot_cua_cac_khoa", xs[2], 1.62, w=W3)
c.mark((308, 194, 704, 250), 5, "bl", pad=3)
c.mark((1336, 274, 1407, 305), 6, "l", pad=4)
steps(s, xs[0], 3.55, W3, [
    (1, "**Theo dõi chuyển tiếp mã rớt** → ② trạng thái: đã vào đợt bổ sung / đã đổ sang mã khác.", 0.95)],
    size=12, d=0.25)
steps(s, xs[1], 3.55, W3, [
    (3, "**Tổng hợp kết quả thầu** → ④ mở dòng: đề xuất → trúng của từng khoa, rớt ở đâu, lý do.", 0.95)],
    size=12, d=0.25)
steps(s, xs[2], 3.55, W3, [
    (5, "**Giỏ rớt của các khoa**: khoa còn nợ xử lý, tổng thiếu. ⑥ **Nhắc** từng khoa.", 0.95)],
    size=12, d=0.25)
text(s, 0.5, 4.72, 9.0, 0.5, "Hai màn đầu mở từ menu trái; Giỏ rớt của các khoa mở từ **Nghiệp vụ dùng chung**.",
     size=12, color=MUTED)

# ================================================================ TRANG 27 — 30% + TIẾN ĐỘ
s = new_slide("Mua thêm 30%, tiến độ sử dụng")
section_tag(s, "PĐD")
lead(s, "Sau khi chốt trình ký: xem trần mua thêm và theo dõi khoa dùng có đúng cam kết.")
sh = Shot(s, "pdd_41_goi_tuy_chon_mua_them_30", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh.mark((38, 307, 270, 398), 1, "tr")
sh.mark((325, 282, 1402, 383), 2, "bl", pad=3)
sh2 = Shot(s, "pdd_44_tien_do_su_dung_sau_chot_trinh_ky", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 150))
sh2.mark((308, 162, 1420, 202), 3, "tl", pad=4)
sh2.mark((528, 217, 695, 247), 4, "bl", pad=3)
sh2.mark((38, 557, 270, 596), 5, "tr")
steps(s, 0.5, 4.1, 4.45, [
    (1, "**Gói tùy chọn mua thêm**: trần = **30% số trúng** của từng khoa × mã quản lý (làm tròn xuống).", 0.7),
    (2, "Mỗi gói con một thẻ: **Trần · Đã kích hoạt**.", 0.3),
], size=13, gap=0.05)
steps(s, 5.1, 4.1, 4.45, [
    (3, "Cam kết dùng: **6 tháng ≥20% · 12 tháng ≥50% · 18 tháng ≥80%**.", 0.5),
    (4, "Tích **Chỉ hiện mã cần xử lý** để lọc. ⑤ Menu **Tiến độ sử dụng**.", 0.5),
], size=13, gap=0.05)

# ================================================================ TRANG 28 — THẺ NHỚ
s = new_slide("Thẻ nhớ: thứ tự sau khi có kết quả thầu")
section_tag(s, "PĐD")
lead(s, "Làm đúng thứ tự này. Làm sai thứ tự, web chặn và báo bằng dải vàng.")
st = [("Gõ số rớt", "ở đúng giai đoạn rớt"),
      ("Chia số trúng", "về từng khoa"),
      ("Đổ mã", "sang mã tương đương (nếu có)"),
      ("Chia lại", "cho mã nhận"),
      ("Xác nhận rớt", "phần còn lại vào giỏ đợt bổ sung")]
BW, BG = 1.62, 0.22
bx0 = (10 - (5 * BW + 4 * BG)) / 2
for i, (h1, h2) in enumerate(st):
    x = bx0 + i * (BW + BG)
    card(s, x, 1.85, BW, 1.75, fill=NAVY if i in (0, 4) else CARD)
    col = WHITE if i in (0, 4) else NAVY
    badge(s, x + BW / 2, 1.85, i + 1, d=0.42, size=16)
    text(s, x + 0.08, 2.2, BW - 0.16, 0.5, h1, size=16, color=col, bold=True, align=PP_ALIGN.CENTER)
    text(s, x + 0.08, 2.72, BW - 0.16, 0.8, h2, size=13, color=WHITE if i in (0, 4) else INK,
         align=PP_ALIGN.CENTER)
    if i < 4:
        arrow(s, x + BW + 0.03, 2.62, BG - 0.06, 0.22)
card(s, 0.5, 3.95, 9.0, 1.25, fill=RGBColor(0xFF, 0xF4, 0xE0))
text(s, 0.7, 4.02, 8.6, 1.15, [
    ("Web chặn khi làm sai thứ tự", 14, RGBColor(0xA4, 0x5A, 0x00), True),
    ("Mã rớt một phần **chưa chia số trúng**: chưa đổ mã được, nút Xác nhận rớt ẩn, dải vàng "
     "\"Còn N mã chưa chia đủ số trúng\".", 13, INK, False),
    ("Mã **nhận về sau khi đổ** còn trống: phải **Chia lại** rồi mới Xác nhận rớt được.", 13, INK, False),
], space_after=3)

# ================================================================ TRANG 29 — CẦN GIÚP
s = new_slide("Cần giúp")
lead(s, "Hỏi ngay trên web: thẻ Trợ giúp mép phải và hộp thư ở chuông.")
sh = Shot(s, "pdd_16_tro_giup_tra_loi_theo_tinh_trang", 0.5, 1.62, w=4.45, crop=(0, 0, 0, 20))
sh.mark((1420, 812, 1440, 876), 1, "l")
sh.mark((1082, 613, 1410, 738), 2, "l", pad=3)
sh2 = Shot(s, "pdd_15_hop_thu_khoa_vua_sua_so", 5.1, 1.62, w=4.45, crop=(0, 0, 0, 20))
sh2.mark((1268, 22, 1308, 52), 3, "bl")
sh2.mark((1263, 423, 1299, 459), 4, "l", pad=3)
steps(s, 0.5, below(sh, sh2), 4.45, [
    (1, "Thẻ xanh mép phải mở **Trợ giúp**. ② Bấm câu hỏi; trả lời theo tình trạng gói đang xem. Esc để đóng.", 0.7),
], size=13)
steps(s, 5.1, below(sh, sh2), 4.45, [
    (3, "**Chuông**: thư hai chiều khoa ↔ PĐD. ④ Bấm ✓ khi đã xem (thư xoá khỏi hộp, vết sửa vẫn lưu).", 0.7),
], size=13)

# ================================================================ sắp lại: bìa đầu, cảm ơn cuối
# trang "Trân trọng cảm ơn" của template không có trong dàn → bỏ
prs.part.drop_rel(thanks_id.get(qn("r:id")))
sldIdLst.remove(thanks_id)

for i, sid in enumerate(sldIdLst, 1):
    prs.part.related_part(sid.get(qn("r:id"))).partname = PackURI(f"/ppt/slides/slide{i}.xml")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
prs.save(OUT)
print("Đã ghi", OUT, "—", len(prs.slides), "trang")
