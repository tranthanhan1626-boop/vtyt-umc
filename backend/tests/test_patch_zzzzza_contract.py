"""Khẳng định patch_zzzzza — hồi sinh ba view chết lên nền v3 (23/08/2026).

Rà 34 màn ngày 23/08 cho ra ĐÚNG BA bảng thật sự chết: goi_thau_ket_qua_ma ·
goi_thau_tien_do · goi_thau_moc. Ba view đứng trên chúng làm năm màn hiện rỗng
mà không báo lỗi — kiểu hỏng khó thấy nhất. Test này giữ cho chúng không bị
viết lùi về nền cũ.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzza_hoi_sinh_view_v3.sql"
FE = GOC.parent / "frontend" / "src" / "features"
BANG_CHET = ("goi_thau_ket_qua_ma", "goi_thau_tien_do", "goi_thau_moc")

# Ba màn được phép còn nhắc tới bảng chết, kèm lý do:
#   TienDoGoiThau     — nhánh sau (QĐ D6), đã gỡ khỏi menu, giữ mã để viết lại
#   QuanLyDuLieuTest  — chỉ còn trong chú thích giải thích vì sao bỏ mục
MAN_DUOC_MIEN = {"TienDoGoiThau"}


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists(), f"Thiếu file patch: {PATCH}"
    return PATCH.read_text(encoding="utf-8")


def test_ba_view_viet_lai_tren_nen_v3(sql: str) -> None:
    for view in ("v_ket_qua_thau_theo_khoa", "v_ma_rot_theo_goi", "v_tien_do_su_dung"):
        assert f"create view {view}" in sql, view
    # nền mới phải là bảng v3
    assert "from phan_bo_trung_v3" in sql
    assert "from ket_qua_rot_v3" in sql
    assert "from chot_trinh_ky_dong_v3" in sql


def test_khong_con_bang_chet_trong_patch(sql: str) -> None:
    for bang in BANG_CHET:
        cau = [d for d in sql.splitlines() if bang in d and not d.strip().startswith("--")]
        assert not cau, f"{bang} còn trong câu lệnh: {cau}"


def test_moi_view_bam_phien_q_con_hieu_luc(sql: str) -> None:
    # Lỗi 24 tái diễn khi hai định nghĩa phạm vi lệch nhau. Mọi view đọc số
    # trúng đều phải join chot_q_phien ... and hieu_luc.
    for view in ("v_ket_qua_thau_theo_khoa", "v_ma_rot_theo_goi", "v_rot_chua_xu_ly_v3"):
        than = sql.split(f"view {view}")[1].split(";")[0]
        assert "chot_q_phien" in than and "hieu_luc" in than, view


def test_tien_do_su_dung_khai_bao_nguon_moc(sql: str) -> None:
    than = sql.split("view v_tien_do_su_dung")[1].split(";")[0]
    assert "nguon_moc" in than, "phải khai đang đếm từ mốc nào, không để người dùng đoán"
    assert "chot_trinh_ky" in than


def test_theo_doi_chuyen_tiep_co_trang_thai_hong(sql: str) -> None:
    than = sql.split("view v_theo_doi_chuyen_tiep_v3")[1].split(";")[0]
    for tt in ("con_no_xu_ly", "da_do_sang_ma", "chuyen_tiep_hong", "da_chuyen_tiep"):
        assert tt in than, tt
    assert "khoa_da_xac_nhan" in than


def test_giao_dien_khong_con_man_song_nao_doc_bang_chet() -> None:
    pham = {}
    for f in sorted(FE.glob("*.jsx")):
        if f.stem in MAN_DUOC_MIEN:
            continue
        dong = [d for d in f.read_text(encoding="utf-8").splitlines()
                if any(f'from("{b}")' in d for b in BANG_CHET)
                and not d.strip().startswith("//")]
        if dong:
            pham[f.stem] = dong
    assert not pham, f"màn còn đọc bảng chết: {pham}"


def test_man_theo_doi_chuyen_tiep_ton_tai() -> None:
    f = FE / "TheoDoiChuyenTiep.jsx"
    assert f.exists()
    noi_dung = f.read_text(encoding="utf-8")
    assert "v_theo_doi_chuyen_tiep_v3" in noi_dung
    assert "xac_nhan_rot_v3" in noi_dung, "phải có nút chạy lại chuyển tiếp"
    assert "CHUYỂN TIẾP HỎNG" in noi_dung, "ô trống phải được gọi đúng tên là hỏng"
