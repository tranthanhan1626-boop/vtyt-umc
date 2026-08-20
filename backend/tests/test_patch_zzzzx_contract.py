"""Khẳng định patch_zzzzx — QĐ 20/08/2026.

A. Huỷ xác nhận CHỈ với khoa vừa sửa (đổi luật V2 ngày 19/08).
B. Nút "Kết thúc đợt & dọn" không được xoá xuyên đợt nữa.

Đường thành công của A đã đo thật trong smoke (`smoke_workflow_v3_staging.py`,
bước "huỷ xác nhận đúng phạm vi"): khoa A sửa cột chữ -> chỉ khoa A mất xác
nhận, khoa B giữ nguyên; PĐD sửa -> không khoa nào mất. Test dưới đây giữ cho
patch không bị viết lùi.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzx_huy_xac_nhan_theo_khoa_va_don_theo_dot.sql"
SMOKE = GOC / "scripts" / "smoke_workflow_v3_staging.py"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists(), f"Thiếu file patch: {PATCH}"
    return PATCH.read_text(encoding="utf-8")


# --- A. Huỷ xác nhận theo khoa ---------------------------------------------

def test_ham_huy_co_tham_so_gioi_han_theo_khoa(sql: str) -> None:
    # bài học 10: phải drop chữ ký cũ, nếu không PostgREST trả PGRST203
    assert "drop function if exists huy_xac_nhan_theo_ma(bigint, text, text);" in sql
    i = sql.index("create or replace function huy_xac_nhan_theo_ma(")
    than = sql[i:sql.index("$$;", i)]
    assert "p_chi_khoa text default null" in than
    assert "(p_chi_khoa is null or c.khoa = p_chi_khoa)" in than


def test_cot_chu_doi_thi_chi_khoa_sua_mat_xac_nhan(sql: str) -> None:
    i = sql.index("create or replace function fn_huy_xac_nhan_khi_o_doi()")
    than = sql[i:sql.index("$$;", i)]
    # nhánh khoa: giới hạn đúng khoa của người sửa
    assert "if v_vai_tro = 'dvsd' then" in than
    assert "v_khoa_sua := current_user_khoa();" in than
    assert "v_khoa_sua)" in than
    # nhánh PĐD: KHÔNG huỷ của ai
    assert "if v_vai_tro in ('dieu_duong', 'admin') then" in than
    # nhánh không rõ vai trò: giữ luật cũ, huỷ hết (thà thừa còn hơn sót)
    assert than.rindex("huy_xac_nhan_theo_ma") > than.index("if v_vai_tro in ('dieu_duong', 'admin') then")


def test_so_doi_thi_chi_khoa_cua_dong_do(sql: str) -> None:
    i = sql.index("create or replace function fn_huy_xac_nhan_khi_so_doi()")
    than = sql[i:sql.index("$$;", i)]
    assert "new.khoa);" in than
    # vẫn giữ chốt chặn "chỉ huỷ khi SỐ HIỆN HÀNH thật sự đổi"
    assert "new.so_luong_hien_hanh is not distinct from old.so_luong_hien_hanh" in than


def test_smoke_co_do_pham_vi_huy_xac_nhan() -> None:
    """Không có bước smoke này thì luật mới không ai canh."""
    src = SMOKE.read_text(encoding="utf-8")
    assert "huỷ xác nhận đúng phạm vi" in src
    assert "khoa A sửa cột chữ mà khoa B cũng mất xác nhận" in src
    assert "PĐD sửa cột chữ mà khoa mất xác nhận" in src


# --- B. Dọn dữ liệu theo đợt ------------------------------------------------

def test_dem_va_don_deu_nhan_dot_goi(sql: str) -> None:
    assert "drop function if exists dem_du_lieu_lam_viec(text, integer);" in sql
    assert "drop function if exists don_du_lieu_lam_viec(text, integer);" in sql
    for ten in ("dem_du_lieu_lam_viec", "don_du_lieu_lam_viec"):
        i = sql.index(f"create or replace function {ten}(")
        than = sql[i:sql.index("$$;", i)]
        assert "p_dot_goi_id bigint default null" in than, ten


def test_don_tu_choi_khi_thieu_dot(sql: str) -> None:
    """Thiếu đợt thì phải từ chối, KHÔNG được rơi về xoá theo (gói, năm) —
    đó đúng là hành vi cũ đã gây xoá xuyên đợt."""
    i = sql.index("create or replace function don_du_lieu_lam_viec(")
    than = sql[i:sql.index("$$;", i)]
    assert "Thiếu DOT_GOI — nút dọn phải chỉ rõ dọn đợt nào." in than
    # ba bảng có neo đợt phải xoá theo đợt
    assert "delete from danh_muc_khoa_chot where dot_goi_id = p_dot_goi_id" in than
    assert "delete from danh_muc_khoa_o where dot_goi_id = p_dot_goi_id" in than
    assert "where goi_id = v_goi_tong_hop and nam_de_xuat = p_nam_de_xuat" in than


def test_giao_dien_truyen_dot_goi_va_noi_ro_phan_chua_neo_dot() -> None:
    src = (FE / "BanDieuHanhPdd.jsx").read_text(encoding="utf-8")
    assert "p_dot_goi_id: dotGoiHienTai.id," in src
    assert "p_dot_goi_id: dotGoiHienTai?.id ?? null," in src
    # hộp xác nhận phải nói rõ dòng nào theo đợt, dòng nào chưa
    assert "chưa neo theo đợt" in src
    assert "xac_nhan_khoa" in src
