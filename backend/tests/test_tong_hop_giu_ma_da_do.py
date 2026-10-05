"""QĐ Q-A 05/10/2026 (đúng 01_NGHIEP_VU_HIEN_HANH.md 5.3b) — mã đã ĐỔ HẾT phần rớt
sang mã tương đương phải Ở LẠI bảng Tổng hợp PĐD và file Excel với số 0 + nhãn
"↪ đã đổ … sang …".

Lỗi đo được 05/10: bộ lọc `so_luong_hien_hanh > 0` (có từ 11/08) bỏ sạch dòng của
66326 sau khi đổ hết sang 66142 → bảng 9 mã còn 8, Excel mất theo.
"""
from pathlib import Path

FE = Path(__file__).resolve().parents[2] / "frontend" / "src" / "features"
TONG_HOP = (FE / "TongHopPdd.jsx").read_text(encoding="utf-8")


def test_bo_loc_giu_dong_da_do():
    assert "function giuDongPhanBo" in TONG_HOP
    assert "Number(r.da_do_di) > 0" in TONG_HOP


def test_select_lay_cot_da_do():
    # Đổi chỗ VẼ thì soi .select() nuôi nó (AGENTS.md điều 7).
    assert "da_do_di" in TONG_HOP and "do_sang_ma" in TONG_HOP


def test_nhan_da_do_vao_ca_bang_lan_excel():
    assert "function nhanDaDo" in TONG_HOP
    assert TONG_HOP.count("nhanDaDo(") >= 3  # định nghĩa + bảng + Excel
