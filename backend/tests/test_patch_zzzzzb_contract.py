"""Khẳng định patch_zzzzzb — sáu lỗi tìm được ở vòng test QUY MÔ THẬT 24/08/2026.

Quy mô đo: 250 mã hàng × 60 khoa = 5.470 dòng đề xuất, 1.608 dòng rớt cấp
(mã × khoa). Sáu lỗi này KHÔNG lộ ra ở quy mô 7 mã × 2 khoa của smoke.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzzb_va_quy_mo_that.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists()
    return PATCH.read_text(encoding="utf-8")


# --- Lỗi 1: ghi không qua JWT vỡ NOT NULL ----------------------------------

def test_co_sua_boi_khoa_khong_bao_gio_null(sql: str) -> None:
    than = sql.split("function fn_phan_bo_danh_dau_ai_sua")[1].split("$$;")[0]
    assert "coalesce(" in than, "thiếu coalesce thì không JWT là NULL → vỡ NOT NULL"
    assert "false)" in than


# --- Lỗi 2: cò trả bảng dài bị PostgREST cắt ở 1.000 -----------------------

def test_co_tra_ve_tom_tat_khong_phai_bang_dai(sql: str) -> None:
    assert "returns jsonb" in sql.split("function xac_nhan_rot_v3")[1][:200], \
        "phải trả tóm tắt, không trả SETOF — PostgREST cắt ở 1.000 dòng"
    than = sql.split("function xac_nhan_rot_v3")[1].split("$$;")[0]
    assert "return next" not in than
    for k in ("'so_dong'", "'so_ma'", "'so_khoa'", "'dot_goi_bo_sung_id'"):
        assert k in than, k


# --- Lỗi 3: proposals UNIQUE (ma_hang, don_vi, nam, version) ---------------

def test_chuyen_tiep_lan_hai_khong_vo_khoa_duy_nhat(sql: str) -> None:
    than = sql.split("function xac_nhan_rot_v3")[1].split("$$;")[0]
    assert "max(version)" in than, "phải lên version mới, không chèn thẳng version 1"
    assert "set is_current = false" in than, "bản cũ phải hạ cờ is_current"


# --- Lỗi 4: một lần bấm đẻ 1.609 dòng thông báo ---------------------------

def test_noti_chuyen_tiep_gop_mot_dong_moi_khoa(sql: str) -> None:
    than = sql.split("function xac_nhan_rot_v3")[1].split("$$;")[0]
    assert "group by khoa" in than, "phải gộp một dòng mỗi khoa, không mỗi (mã × khoa)"
    assert "'so_ma'" in than, "dòng gộp phải khai gói bao nhiêu mã"


# --- Lỗi 5: noti rò sang khoa của đợt khác --------------------------------

def test_noti_o_tong_hop_khoanh_dung_dot(sql: str) -> None:
    than = sql.split("function fn_thong_bao_o_tong_hop")[1].split("$$;")[0]
    assert "split_part(new.goi_id, ':dot:', 2)" in than, \
        "phải khoanh theo đợt của ô vừa sửa, không quét mọi đợt đang mở"
    assert "dg.dot_id = v_dot" in than


# --- Lỗi 6: bảng tổng hợp tải 1.608 dòng chỉ để hiện tổng theo mã ---------

def test_co_view_gop_theo_ma(sql: str) -> None:
    assert "create or replace view v_rot_theo_ma_v3" in sql
    than = sql.split("view v_rot_theo_ma_v3")[1].split(";")[0]
    assert "group by" in than and "r.ma_hang" in than


def test_giao_dien_dung_view_gop_va_phan_trang() -> None:
    cum = (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")
    assert "v_rot_theo_ma_v3" in cum, "cụm cột thầu phải đọc bản đã gộp theo mã"
    goi = [d for d in cum.splitlines()
           if 'from("v_rot_chua_xu_ly_v3")' in d and not d.strip().startswith("*")]
    assert not goi, "cụm cột thầu KHÔNG được đọc cấp (mã × khoa) nữa — 1.608 dòng ở quy mô thật"
    assert "fetchAllRows" in cum, "mọi nguồn nhiều dòng phải phân trang"

    td = (FE / "TheoDoiChuyenTiep.jsx").read_text(encoding="utf-8")
    assert "fetchAllRows" in td, \
        "màn theo dõi đọc cấp (mã × khoa) — 1.608 dòng, thiếu phân trang là mất 38%"


# --- QĐ D11 + D12 (24/08/2026) -------------------------------------------

def test_chuyen_tiep_lan_hai_cong_don_khong_de(sql: str) -> None:
    than = sql.split("create or replace function xac_nhan_rot_v3")[-1].split("$$;")[0]
    assert "v_dang_co" in than, "phải đọc số hiện hành của khoa trước khi ghi"
    assert "coalesce(v_dang_co, 0) + r.con_lai" in than, \
        "QĐ D11: cộng thêm vào số khoa đang có, không đè"
    assert "v_so_cong_don" in than, "phải đếm và báo số dòng cộng dồn"


def test_hien_phan_chuyen_tiep_thua(sql: str) -> None:
    than = sql.split("create view v_theo_doi_chuyen_tiep_v3")[-1] \
        .split("grant select on v_theo_doi_chuyen_tiep_v3")[0]
    assert "thua_so_voi_rot" in than
    assert "chuyen_tiep_thua" in than, \
        "QĐ D12: hệ không tự trừ lại, nhưng phải HIỆN phần thừa ra"
    # và không được có đường tự trừ
    cuoi = sql.split("create or replace function xac_nhan_rot_v3")[-1].split("$$;")[0]
    assert "update phan_bo_khoa" not in cuoi.lower(), \
        "QĐ D12: chuyển tiếp chỉ CỘNG THÊM, không bao giờ trừ đi"
    assert "- r.con_lai" not in cuoi and "-r.con_lai" not in cuoi, "không được trừ"


def test_man_theo_doi_hien_trang_thai_thua() -> None:
    td = (FE / "TheoDoiChuyenTiep.jsx").read_text(encoding="utf-8")
    assert "chuyen_tiep_thua" in td
    assert "thua_so_voi_rot" in td
