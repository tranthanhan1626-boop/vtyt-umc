"""Khẳng định QĐ 25/08/2026 — trọng số chia TRỪ phần khoa đã đưa đi.

Đây là lần sửa GỐC của lỗi "đổ quá tay". Trước đó chỉ chặn được ở hai cổng.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzzt_trong_so_tru_phan_da_do.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists()
    return PATCH.read_text(encoding="utf-8")


def test_da_dua_di_gom_ca_do_ma_va_chuyen_tiep(sql: str) -> None:
    than = sql.split("function fn_da_dua_di_cua_khoa_v3")[1].split("$$;")[0]
    assert "chuyen_so_rot_v3" in than and "ma_hang_rot" in than, "phần đổ sang mã tương đương"
    assert "chuyen_tiep_rot_v3" in than, "phần chuyển tiếp về đợt bổ sung cũng là đã đưa đi"


def test_trong_so_tru_phan_da_dua_di_va_kep_khong_am(sql: str) -> None:
    than = sql.split("function fn_trong_so_chia_v3")[1].split("$$;")[0]
    assert "greatest(p_q - fn_da_dua_di_cua_khoa_v3" in than, \
        "phải TRỪ phần đã đưa đi — đây chính là chỗ sửa gốc"
    assert "greatest(" in than, "kẹp không âm: đổ đi nhiều hơn Q thì trọng số là 0, không âm"
    assert "fn_nhan_cua_khoa_v3" in than, "phần nhận vẫn được cộng, nếu không nó bốc hơi"


def test_chia_tu_dong_dung_trong_so_moi(sql: str) -> None:
    than = sql.split("function fn_chia_theo_ti_le_q_v3")[1].split("$$;")[0]
    assert than.count("fn_trong_so_chia_v3") >= 3, \
        "cả tổng trọng số, phép chia, và chỗ dồn số dư đều phải dùng cùng công thức"
    assert "p.q_khoa + fn_nhan_cua_khoa_v3" not in than, "công thức cũ phải biến mất"


def test_go_tay_dung_CUNG_tran_voi_chia_tu_dong(sql: str) -> None:
    """Không sửa chỗ này thì chia tự động cho khoa 7 mà gõ tay 8 vẫn im lặng."""
    than = sql.split("create or replace function cap_nhat_phan_bo_trung_v3")[1].split("$$;")[0]
    assert "fn_trong_so_chia_v3" in than
    assert "p.q_khoa+fn_nhan_cua_khoa_v3" not in than.replace(" ", "")


def test_khoa_cung_2_khong_doi(sql: str) -> None:
    """Sửa trọng số KHÔNG được đụng khoá cứng 2 (tổng phải chia = trúng + nhận)."""
    than = sql.split("create or replace function cap_nhat_phan_bo_trung_v3")[1].split("$$;")[0]
    assert "phai_chia into v_trung" in than
    assert "if v_tong > v_trung then raise" in than, "miếng 1c vẫn nguyên: thiếu lưu được, dư chặn"


def test_giao_dien_hien_phan_da_dua_di(sql: str) -> None:
    """PĐD phải thấy vì sao con số của một khoa nhỏ đi."""
    assert "da_dua_di" in sql and "phan_cua_khoa" in sql, "view phải trả hai cột đó"
    cum = (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")
    than = cum.split("export function BangSoTrungTheoKhoa")[-1]
    assert "Đã đưa đi" in than, "bảng chia phải có cột Đã đưa đi"
    assert "r.da_dua_di" in than
