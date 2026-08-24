"""Khẳng định patch_zzzzze — QĐ D14 (24/08/2026): bỏ tự chia số trúng.

Đây là thi công QĐ A3 ngày 21/08/2026, chốt từ lâu mà chưa làm.

Ba mảnh PHẢI đi cùng nhau, thiếu một là hỏng nặng:
  1. ghi/bỏ rớt → XOÁ TRẮNG ô số trúng theo khoa
  2. nút "Chia theo tỉ lệ Q" — phép chia cũ, chỉ chạy khi bấm
  3. cò "Xác nhận rớt" CHẶN khi còn dòng chưa chia
Thiếu mảnh 3: ô trống nghĩa là so_luong_trung = 0, mà con_lai = q_khoa − 0,
nên hệ sẽ chuyển tiếp TOÀN BỘ Q sang đợt bổ sung.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzze_pdd_go_tay_so_trung.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists()
    return PATCH.read_text(encoding="utf-8")


def test_ghi_rot_xoa_trang_khong_chia_lai(sql: str) -> None:
    than = sql.split("create or replace function fn_dong_bo_phan_bo_trung_v3")[1].split("$$;")[0]
    assert "so_luong_trung = 0" in than, "phải XOÁ TRẮNG"
    assert "floor(" not in than, "không được còn phép chia theo tỉ lệ ở đây"


def test_phep_chia_cu_van_con_nhung_chi_khi_bam(sql: str) -> None:
    assert "create or replace function fn_chia_theo_ti_le_q_v3" in sql
    than = sql.split("function fn_chia_theo_ti_le_q_v3")[1].split("$$;")[0]
    assert "floor(v_trung * q_khoa / v_q)" in than, "giữ nguyên phép chia cũ"
    assert "create or replace function chia_theo_ti_le_q_v3" in sql, "phải có RPC cho nút"
    assert "grant execute on function chia_theo_ti_le_q_v3" in sql


def test_co_chan_khi_chua_chia_xong(sql: str) -> None:
    than = sql.split("create or replace function xac_nhan_rot_v3")[-1].split("$$;")[0]
    assert "v_phan_bo_trung_theo_ma_v3" in than, "cò phải soi bảng đã chia hay chưa"
    assert "not da_khop" in than
    assert "raise exception" in than
    assert "Chia theo tỉ lệ Q" in than, "báo lỗi phải chỉ đúng nút cần bấm"
    # cổng phải đứng TRƯỚC vòng lặp ghi, không phải sau
    assert than.index("v_chua_chia") < than.index("insert into chuyen_tiep_rot_v3"), \
        "phải chặn TRƯỚC khi ghi dòng nào"


def test_co_view_da_chia(sql: str) -> None:
    assert "create or replace view v_phan_bo_trung_theo_ma_v3" in sql
    than = sql.split("view v_phan_bo_trung_theo_ma_v3")[1].split(";")[0]
    for c in ("da_chia", "lech", "da_khop"):
        assert c in than, c


def test_giao_dien_co_cot_da_chia_va_nut_chia() -> None:
    cum = (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")
    assert "v_phan_bo_trung_theo_ma_v3" in cum
    assert "soChuaChia" in cum, "thanh giai đoạn phải báo còn bao nhiêu mã chưa chia"
    assert "onChiaTiLe" in cum
    th = (FE / "TongHopPdd.jsx").read_text(encoding="utf-8")
    assert "chia_theo_ti_le_q_v3" in th, "nút phải gọi RPC"
    assert "Đã chia" in th, "bảng phải có cột Đã chia"


def test_khong_con_duong_tu_chia_khi_ghi_rot() -> None:
    """Bốn hàm cũ vẫn gọi fn_dong_bo_phan_bo_trung_v3 — nhưng hàm đó nay xoá
    trắng. Nếu ai đó đổi chúng sang gọi thẳng phép chia là quay lại lỗi cũ."""
    sql_dir = GOC / "sql"
    pham = []
    for f in sql_dir.glob("*.sql"):
        if f.name >= "patch_zzzzze":
            continue
        for i, d in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if "fn_chia_theo_ti_le_q_v3" in d and not d.strip().startswith("--"):
                pham.append(f"{f.name}:{i}")
    assert not pham, f"patch cũ không được gọi phép chia trực tiếp: {pham}"
