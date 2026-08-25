"""Khẳng định biểu mẫu gom dữ liệu sau đấu thầu — miếng 0 (25/08/2026).

Bốn quyết định của chủ dự án đã đóng vào thiết kế biểu mẫu. Test này giữ chúng,
vì cột thừa trong biểu mẫu không làm hỏng gì ngay — nó chỉ khiến người ta gom
sai hàng nghìn dòng rồi mới biết.
"""
import sys
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC / "scripts"))

from tao_mau_gom_du_lieu_sau_thau import SHEETS, build  # noqa: E402


@pytest.fixture(scope="module")
def cot() -> dict[str, dict]:
    return {s.name: {f.name: f for f in s.fields} for s in SHEETS}


def test_du_ba_sheet_va_dung_ten(cot: dict) -> None:
    assert set(cot) == {"HOP_DONG", "HOP_DONG_MA_HANG", "GIAO_HANG"}


def test_khong_co_bat_ky_cot_gia_nao(cot: dict) -> None:
    """QĐ 17/08/2026, xác nhận lại 21/08: web này không quản lý tiền."""
    # So theo TỪNG ĐOẠN ngăn bởi gạch dưới, không so chuỗi con: "gia" nằm trong
    # "ngay_giao" nhưng đó là ngày giao hàng, không phải giá.
    cam = {"gia", "tran", "tien", "vat"}
    pham = [f"{sheet}.{ten}" for sheet, ds in cot.items() for ten in ds
            if cam & set(ten.split("_"))]
    assert not pham, f"biểu mẫu không được có cột giá: {pham}"


def test_khong_co_lo_va_han_dung(cot: dict) -> None:
    """QĐ 25/08/2026: cần truy lô thì tra ở phần mềm kho, không gõ lại ở đây."""
    pham = [t for t in cot["GIAO_HANG"] if "lo" == t or "han_dung" in t or "so_lo" in t]
    assert not pham, f"đã chốt không lưu lô/hạn dùng: {pham}"


def test_khoa_o_giao_hang_de_trong_duoc(cot: dict) -> None:
    """QĐ 25/08/2026: hàng về KHO trước, phần kho→khoa lấy từ HIS."""
    khoa = cot["GIAO_HANG"]["khoa"]
    assert khoa.level == "Tùy chọn", \
        "hàng về kho chung là trường hợp thường gặp — bắt buộc cột này là bắt người dùng bịa"
    assert "kho chung" in khoa.description


def test_giao_hang_la_su_kien_khong_phai_anh_chup_ton_kho(cot: dict) -> None:
    """QĐ 21/08/2026: ghi TỪNG LẦN GIAO. Ảnh chụp tồn kho nặng gấp 10."""
    gh = cot["GIAO_HANG"]
    assert "ngay_giao" in gh and "so_luong_thuc_nhan" in gh
    assert not [t for t in gh if "ton" in t or "ngay_chot" in t], \
        "cột tồn kho là dấu hiệu quay lại phương án ảnh chụp định kỳ"


def test_tach_hai_sheet_vi_moi_nha_thau_mot_hop_dong(cot: dict) -> None:
    """QĐ 25/08/2026. Sheet mã hàng phải nối về hợp đồng bằng số hợp đồng."""
    assert cot["HOP_DONG_MA_HANG"]["so_hop_dong"].level == "Bắt buộc"
    assert cot["GIAO_HANG"]["so_hop_dong"].level == "Bắt buộc"


def test_neo_duoc_ve_dung_dot(cot: dict) -> None:
    """Không neo được đợt thì dữ liệu vào hệ rồi vẫn không biết thuộc kỳ nào —
    đúng lớp lỗi `danh_muc_khoa_o` đã dính trước 20/08/2026."""
    hd = cot["HOP_DONG"]
    assert hd["goi_con"].level == "Bắt buộc" and hd["nam"].level == "Bắt buộc"
    assert "18t-dung-chung" in hd["goi_con"].allowed


def test_sinh_ra_file_mo_lai_duoc(tmp_path: Path) -> None:
    out = tmp_path / "mau.xlsx"
    build(out)              # build() tự mở lại và đối chiếu header, hỏng thì ném
    assert out.stat().st_size > 5_000
