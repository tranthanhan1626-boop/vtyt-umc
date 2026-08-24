"""Khẳng định patch_zzzzzf — số đã đổ sang mã tương đương PHẢI đi tới kết quả.

Lỗi phát hiện 24/08/2026 khi chủ dự án tự test: đổ 460 từ mã 72354 sang 72353.
Sổ `chuyen_so_rot_v3` ghi đúng, nhưng dòng của mã NHẬN không hiện gì trên bảng
Tổng hợp, và `chot_trinh_ky_dong_v3` chỉ đọc `phan_bo_trung_v3` nên Excel trình
ký lẫn hạn mức 30% đều thiếu 460 — bệnh viện sẽ không mua phần đó.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzzf_chuyen_ma_vao_ket_qua.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists()
    return PATCH.read_text(encoding="utf-8")


def test_co_view_ma_nhan(sql: str) -> None:
    for v in ("v_nhan_chuyen_rot_v3", "v_nhan_chuyen_rot_theo_khoa_v3"):
        assert f"create or replace view {v}" in sql, v
    than = sql.split("view v_nhan_chuyen_rot_v3")[1].split(";")[0]
    assert "ma_hang_nhan" in than and "hieu_luc" in than


def test_chot_trinh_ky_cong_phan_da_nhan(sql: str) -> None:
    than = sql.split("create or replace function chot_trinh_ky_toan_bo_v3")[-1].split("$$;")[0]
    assert "v_nhan_chuyen_rot_theo_khoa_v3" in than, \
        "bản đóng băng phải cộng phần đã nhận, nếu không Excel trình ký thiếu"
    assert "so_luong_trung = d.so_luong_trung + n.da_nhan" in than
    # khoa chưa từng đề xuất mã nhận (D9) chưa có dòng để cộng vào
    assert "not exists (select 1 from chot_trinh_ky_dong_v3" in than, \
        "khoa chưa từng dùng mã nhận phải được đẻ dòng mới, nếu không rơi mất"


def test_khong_dung_vao_phan_bo_trung(sql: str) -> None:
    """Cách chữa là CỘNG Ở ĐẦU RA, không ghi vào phan_bo_trung_v3 — nếu ghi thì
    khoá cứng 2 (tổng phân bổ = số trúng) vỡ và luật D14 xung đột."""
    assert "update phan_bo_trung_v3" not in sql.lower()
    assert "insert into phan_bo_trung_v3" not in sql.lower()


def test_gop_thong_bao_theo_gio_viet_nam(sql: str) -> None:
    assert "Asia/Ho_Chi_Minh" in sql
    assert "alter column ngay set default" in sql


def test_giao_dien_hien_phan_nhan() -> None:
    cum = (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")
    assert "v_nhan_chuyen_rot_v3" in cum, "bảng Tổng hợp phải đọc phần đã nhận"
    assert "← nhận" in cum, "dòng mã nhận phải hiện ra, không để trống"
    assert "daNhan" in cum


def test_mo_bang_tong_hop_bang_tab_moi() -> None:
    bd = (FE / "BanDieuHanhPdd.jsx").read_text(encoding="utf-8")
    goi = [d for d in bd.splitlines()
           if "#tong-hop-pdd" in d and "window.location.hash" in d
           and not d.strip().startswith("//")]
    assert not goi, f"phải mở tab trình duyệt mới, không đổi hash tại chỗ: {goi}"
    assert "window.open(" in bd
