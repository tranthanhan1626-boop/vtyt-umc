"""Chốt trình ký PHẢI có đường bấm trên giao diện.

Ngày 24/08/2026 gỡ hai tab khỏi Bàn điều hành với ghi chú "mã giữ nguyên, chỉ
không vào menu". Ba nút chốt trình ký nằm trong tab bị gỡ và không được dời đi
đâu — suốt một ngày rưỡi KHÔNG có đường nào bấm chốt trình ký. Đây là nơi duy
nhất khoá cứng 2 được thi hành, và là điều kiện của Excel chính thức lẫn gói 30%.

Test này canh để chuyện đó không lặp lại.
"""
from pathlib import Path

import pytest

FE = Path(__file__).resolve().parents[2] / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def cum() -> str:
    return (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")


def test_co_component_chot_trinh_ky_tren_tong_hop(cum: str) -> None:
    assert "export function ChotTrinhKyTongHop" in cum
    than = cum.split("export function ChotTrinhKyTongHop")[1]
    for rpc in ("chot_trinh_ky_khoa_v3", "mo_chot_trinh_ky_khoa_v3",
                "chot_trinh_ky_toan_bo_v3", "khoa_chua_du_chot_trinh_ky"):
        assert rpc in than, f"thiếu {rpc}"


def test_tong_hop_thuc_su_render_component_do() -> None:
    """Import mà không render thì vẫn là mã chết — đúng lỗi 24/08."""
    th = (FE / "TongHopPdd.jsx").read_text(encoding="utf-8")
    assert "ChotTrinhKyTongHop," in th, "phải import"
    assert "<ChotTrinhKyTongHop" in th, "phải RENDER, không chỉ import"


def test_khong_doc_duoc_cong_thi_khoa_nut(cum: str) -> None:
    """Đoán 'chắc là đủ' là cách nhanh nhất để chốt một bản trình ký thiếu khoa."""
    than = cum.split("export function ChotTrinhKyTongHop")[1]
    assert "setKhoaThieu(null)" in than
    # Nút tự chạy vòng lặp nên nó ĐƯỢC sáng khi còn khoa thiếu. Cái phải khoá là
    # trường hợp KHÔNG ĐỌC ĐƯỢC cổng (`khoaThieu === null`) — lúc đó ta không
    # biết có bao nhiêu khoa thiếu, chốt bừa là ra bản trình ký hụt khoa.
    assert "soThieu !== null" in than, "không đọc được cổng thì phải khoá nút"


def test_MOT_nut_khong_phai_50(cum: str) -> None:
    """QĐ 21/08/2026 bỏ hẳn 49 nút chốt từng bảng khoa (06_DUNG_LAM_LAI dòng 41).

    Bản đầu của panel dựng lại đúng 50 nút đó — rà soát độc lập bắt được. Server
    vẫn đòi chốt từng khoa trước khi chốt toàn bộ, nên đường đúng là MỘT nút,
    máy tự chạy vòng lặp.
    """
    than = cum.split("export function ChotTrinhKyTongHop")[1]
    assert "for (let i = 0; i < khoaThieu.length" in than, \
        "một nút phải tự chạy vòng lặp qua các khoa còn thiếu"
    assert 'x.textContent.trim()' not in than
    assert than.count("CHỐT TRÌNH KÝ TOÀN BỘ") == 1
    # Không được có nút "chốt" theo từng khoa nữa
    assert ">chốt<" not in than and "chốt</button>" not in than


def test_mo_lai_la_mot_o_chon_khong_phai_50_nut(cum: str) -> None:
    """Revision 2 tầng vẫn giữ, nhưng bằng MỘT ô chọn khoa."""
    than = cum.split("export function ChotTrinhKyTongHop")[1]
    assert "<select value={moLai.khoa}" in than
    assert "mo_chot_trinh_ky_khoa_v3" in than


def test_dung_ngay_o_khoa_dau_tien_loi(cum: str) -> None:
    """Chốt được nửa chừng rồi im lặng là trạng thái khó gỡ nhất."""
    than = cum.split("export function ChotTrinhKyTongHop")[1]
    assert 'Dừng ở khoa "${k}"' in than


def test_khong_dung_window_prompt(cum: str) -> None:
    """Hộp thoại trình duyệt khoá cả trang và không để lại dấu vết (23/08)."""
    than = cum.split("export function ChotTrinhKyTongHop")[1]
    assert "window.prompt(" not in than, "chỉ cấm LỜI GỌI; nhắc tên nó trong chú thích thì không sao"
    assert "Lý do mở lại (bắt buộc)" in than


def test_loi_thao_tac_o_lai_trong_panel(cum: str) -> None:
    """Đẩy lên ô lỗi của màn cha là xoá trắng cả bảng đang xem (mắc 25/08)."""
    than = cum.split("export function ChotTrinhKyTongHop")[1]
    assert "onLoi" not in than, "panel không được đẩy lỗi thao tác lên màn cha"
