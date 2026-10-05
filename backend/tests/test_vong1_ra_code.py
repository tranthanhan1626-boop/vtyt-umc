"""Khẳng định các vá vòng 1 (28/09/2026) — L01, L02, L03+L04, L07, L09.

Test chỉ đọc văn bản (jsx + sql), không chạm DB, không chạy build.

- L01: DeXuatTongHop.jsx không còn gọi state `setPhieuTheoNhom` đã bị bỏ ở
  a4292bc (26/08/2026) — khôi phục lại là dựng lại thứ đã bị bỏ.
- L02: TongHopKetQuaThau.jsx không còn dùng `r.id` (view
  `v_ket_qua_thau_theo_khoa` không có cột `id`, chỉ có `ket_qua_id`).
- L03 + L04: patch_zzzzzzzi phải thêm cột `x.ghi_chu` vào v_gio_rot_v3 và sửa
  đúng biểu thức khoa_da_sua_so để loại trường hợp NULL IS DISTINCT FROM số.
- L07: TongHopKetQuaThau.jsx — NHAN_KQ phải khớp giá trị thật của cột
  `ket_qua` (view v_ket_qua_thau_theo_khoa: 'khong_trung' | 'trung_mot_phan'
  | 'trung'), không còn khoá `trung_thau:` của bảng CŨ đã chết.
- L09: BanDieuHanhPdd.jsx — truy vấn `danh_muc_khoa_chot` trong tai() phải xử
  lý đúng trường hợp `dotGoiIds` rỗng (rỗng ⇒ tập rỗng, không bỏ lọc).
- Q01 (28/09/2026, hai QĐ giao diện của chủ dự án): TongHopKetQuaThau.jsx bỏ
  hẳn form sửa kết quả thầu (QĐ A2 — màn chỉ để xem); không còn nút "Nhập kết
  quả".
- Q03 (28/09/2026): GioRotCuaKhoa.jsx — không còn nút/nhãn "Đang lập đề xuất bổ
  sung" (luồng cũ, đã đảo bởi QĐ 26/08/2026 — mã rớt vào giỏ kèm số gợi ý,
  khoa tự gửi). Phần khác của Q03 — "lấy đợt bổ sung sớm nhất đang mở" — chỉ
  đúng tới hết T9/2026 và đã bị L08b (vòng 3, xem test_vong3_ra_code.py) bỏ
  hẳn: KIEM_DINH_DOC_LAP.md #3.
"""
import re
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
FE = GOC.parent / "frontend" / "src" / "features"
DE_XUAT = FE / "DeXuatTongHop.jsx"
KET_QUA_THAU = FE / "TongHopKetQuaThau.jsx"
PATCH = GOC / "sql" / "patch_zzzzzzzi_vong1_gio_rot_ghi_chu_va_khoa_da_sua.sql"
DANH_MUC_DE_XUAT_KHOA = FE / "DanhMucDeXuatKhoa.jsx"
BAN_DIEU_HANH_PDD = FE / "BanDieuHanhPdd.jsx"
GIO_ROT_CUA_KHOA = FE / "GioRotCuaKhoa.jsx"


def test_l01_khong_con_setPhieuTheoNhom():
    text = DE_XUAT.read_text(encoding="utf-8")
    assert "setPhieuTheoNhom" not in text


def test_l02_khong_con_r_cham_id():
    text = KET_QUA_THAU.read_text(encoding="utf-8")
    assert re.search(r"\br\.id\b", text) is None
    # phải có dùng ket_qua_id thay thế, không phải xoá trắng logic
    assert "r.ket_qua_id" in text


def test_l03_patch_them_cot_ghi_chu():
    assert PATCH.exists(), "chưa có patch_zzzzzzzi"
    text = PATCH.read_text(encoding="utf-8")
    assert "x.ghi_chu" in text


def test_l04_patch_sua_bieu_thuc_khoa_da_sua_so():
    text = PATCH.read_text(encoding="utf-8").lower()
    assert "is not null and pb.so_luong_hien_hanh is distinct from cc.so_luong" in text


def test_l05_xemaudit_danh_muc_tong_hop_o_audit_dung_goiScopeTongHop():
    """L05 (28/09/2026): trong hàm xemAudit, truy vấn
    danh_muc_tong_hop_o_audit phải lọc theo goiScopeTongHop (khi có dotId)
    thay vì chỉ like(goiId%) + nam_de_xuat — nếu không, lịch sử của các đợt
    khác nhau cùng gói con (vd hai đợt "bs-t9" #203 và #206) bị trộn."""
    text = DANH_MUC_DE_XUAT_KHOA.read_text(encoding="utf-8")
    m = re.search(r"const xemAudit = async[\s\S]*?\n  };\n", text)
    assert m, "không tìm thấy hàm xemAudit"
    than_ham = m.group(0)
    assert "danh_muc_tong_hop_o_audit" in than_ham
    doan_tong_hop = than_ham.split("danh_muc_tong_hop_o_audit", 1)[1]
    assert "goiScopeTongHop" in doan_tong_hop


def test_l07_nhan_kq_khop_gia_tri_that_cua_view_khong_con_khoa_cu():
    """L07 (28/09/2026): NHAN_KQ (nhãn kết quả thầu theo khoa) phải có khoá
    `trung_mot_phan` — đúng giá trị CASE của v_ket_qua_thau_theo_khoa
    (backend/sql/patch_zzzzzl_view_ket_qua_chay_o_quy_mo_that.sql: 'khong_trung'
    | 'trung_mot_phan' | 'trung') — và KHÔNG còn dùng `trung_thau:` làm khoá
    của NHAN_KQ. `trung_thau`/`cho_ket_qua` là khoá của bảng CŨ đã chết
    (`goi_thau_ket_qua_ma`, xem AGENTS.md "Ba bảng ĐÃ CHẾT"); view v3 không
    bao giờ trả hai giá trị đó nên `NHAN_KQ[r.ket_qua]` từng ném TypeError."""
    text = KET_QUA_THAU.read_text(encoding="utf-8")
    assert "trung_mot_phan" in text
    m = re.search(r"const NHAN_KQ = \{[\s\S]*?\};", text)
    assert m, "không tìm thấy định nghĩa NHAN_KQ"
    than_nhan_kq = m.group(0)
    assert "trung_thau:" not in than_nhan_kq
    assert "trung_mot_phan:" in than_nhan_kq


def test_l09_truy_van_danh_muc_khoa_chot_xu_ly_dotGoiIds_rong():
    """L09(b) (28/09/2026): đoạn truy vấn bảng `danh_muc_khoa_chot` trong hàm
    tai() của BanDieuHanhPdd.jsx không được bỏ điều kiện `.in("dot_goi_id",
    dotGoiIds)` khi `dotGoiIds` rỗng. Trước vá, code viết
    `if (dotGoiIds.length) qChot = qChot.in(...)` rồi LUÔN chạy `qChot` —
    dotGoiIds rỗng thì lấy xác nhận của MỌI đợt (đo DB 28/09: đợt #206 chỉ 1
    khoa xác nhận nhưng màn hiện ✓ cho nhiều khoa). Kiểm bằng regex: đoạn code
    quanh lời gọi `.from("danh_muc_khoa_chot")` phải có nhánh
    `if (dotGoiIds.length) { ... }` bao quanh việc gọi query (không phải gán
    `.in` rời rạc, độc lập với một `await` đã chạy trước đó), và nhánh else
    phải dọn cả hai state `khoaDaChot`/`chotDanhMucV3` về rỗng."""
    text = BAN_DIEU_HANH_PDD.read_text(encoding="utf-8")
    idx = text.index('.from("danh_muc_khoa_chot")')
    doan = text[idx - 400: idx + 1400]
    assert re.search(r"if\s*\(\s*dotGoiIds\.length\s*\)\s*\{", doan)
    # `.in("dot_goi_id", dotGoiIds)` phải nằm TRONG khối if, tức là phải xuất
    # hiện sau vị trí "if (dotGoiIds.length) {" trong cùng đoạn trích.
    vi_tri_if = doan.index("if (dotGoiIds.length) {")
    vi_tri_in = doan.index('.in("dot_goi_id", dotGoiIds)')
    assert vi_tri_in > vi_tri_if
    assert "setKhoaDaChot(new Set())" in doan
    # 05/10/2026 (chủ dự án duyệt gỡ code chết): state `chotDanhMucV3` chỉ
    # nuôi tab "Kết quả thầu" (TabKetQua) — tab đó không còn đường vào từ QĐ A2
    # 21/08/2026 và đã gỡ hẳn khỏi BanDieuHanhPdd.jsx, nên bỏ điều kiện
    # `setChotDanhMucV3([])`. Cái L09 bảo vệ (dotGoiIds rỗng ⇒ ✓ "Đã xác
    # nhận" rỗng) vẫn nằm ở `khoaDaChot`, kiểm ngay dòng trên.


def test_q01_khong_con_form_sua_nut_nhap_ket_qua():
    """Q01 (QĐ A2 23/08/2026, chủ dự án chốt 28/09/2026): màn Tổng hợp kết quả
    thầu chỉ còn để xem — bỏ hẳn nút "Nhập kết quả" và form sửa từng dòng đi
    kèm (đường ghi cũ vào `goi_thau_ket_qua_ma`, bảng đã chết)."""
    text = KET_QUA_THAU.read_text(encoding="utf-8")
    assert "Nhập kết quả" not in text


def test_l08b_dot_that_tu_chuyen_tiep_khong_con_doan_ascending():
    """L08b (28/09/2026, KIEM_DINH_DOC_LAP.md #3): bản Q03 ở trên chỉ đúng tới
    hết T9/2026 — `.order(..., { ascending: true })` trên `dot_de_xuat` đoán
    "đợt sớm nhất đang mở" nhưng không khớp `fn_dot_bo_sung_gan_nhat` sau khi
    mốc đích đổi (mốc đã qua/đã chốt Q bị bỏ qua theo NGÀY, không theo thứ tự
    liệt kê). L08b bỏ hẳn cách đoán này: mỗi mục đọc ĐÚNG đợt thật đã ghi ở
    `chuyen_tiep_rot_v3.dot_goi_bo_sung_id` khi `xac_nhan_rot_v3` chạy."""
    text = GIO_ROT_CUA_KHOA.read_text(encoding="utf-8")
    assert 'from("dot_de_xuat")' not in text
    assert '.order("nam", { ascending: true })' not in text
    assert 'from("chuyen_tiep_rot_v3")' in text
    assert "dot_goi_bo_sung_id" in text


def test_q03_khong_con_nut_dang_lap_de_xuat_bo_sung():
    """Q03 (28/09/2026, đảo QĐ luồng cũ): nút/nhãn "Đang lập đề xuất bổ sung"
    đã bỏ. Từ QĐ 26/08/2026, mã rớt được đẩy thẳng vào GIỎ của khoa kèm số gợi
    ý (patch_zzzzzx_ma_rot_vao_gio.sql); khoa tự sửa số rồi bấm "Gửi đề xuất"
    (tên nút thật, xem Function1.jsx) — không còn bước trung gian "đang lập
    đề xuất" do khoa tự bấm ở màn này."""
    text = GIO_ROT_CUA_KHOA.read_text(encoding="utf-8")
    assert "Đang lập đề xuất bổ sung" not in text
    assert 'doiTrangThai(r, "da_vao_gio_nhap")' not in text
