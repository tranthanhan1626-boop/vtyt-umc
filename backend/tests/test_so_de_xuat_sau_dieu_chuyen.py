"""QĐ 26/08/2026 — đổ mã A sang mã tương đương B thì SỐ ĐỀ XUẤT hiện theo đó.

    66510 · GMHS  20.000 → 0        74372 · GMHS  40.000 → 60.000

Tính lúc hiện, KHÔNG ghi đè: `phan_bo_khoa` bị khoá cứng 1 chặn sau chốt Q, mà
đổ mã luôn xảy ra sau chốt Q. Đã thử đường ghi đè (patch_zzzzzza) và phải trả
lại (patch_zzzzzzb) vì nó làm hỏng hẳn chức năng đổ.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzzzc_so_de_xuat_sau_dieu_chuyen.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists()
    return PATCH.read_text(encoding="utf-8")


def test_cong_thuc_dung_ba_ve(sql: str) -> None:
    than = sql.split("create or replace view v_phan_bo_sau_dieu_chuyen_v3")[1]
    assert "greatest(pb.so_luong_hien_hanh - coalesce(di.so_luong, 0), 0)" in than, \
        "phải TRỪ phần đã đổ đi và kẹp không âm"
    assert "+ coalesce(ve.so_luong, 0)" in than, "phải CỘNG phần nhận về"
    assert "where hieu_luc" in than, \
        "chỉ tính dòng còn hiệu lực — bỏ ngoại lệ đổ thì số phải tự về như cũ"


def test_khoa_nhan_ma_chua_tung_de_xuat_van_co_dong(sql: str) -> None:
    than = sql.split("create or replace view v_phan_bo_sau_dieu_chuyen_v3")[1]
    assert "union all" in than and "not exists (" in than, (
        "khoa nhận mà chưa từng đề xuất mã đó thì không có dòng phan_bo_khoa — "
        "thiếu nhánh này là phần nhận bốc hơi khỏi bảng")


def test_khong_goi_ham_theo_tung_dong(sql: str) -> None:
    """Bài học patch_zzzzzm: gọi hàm mỗi dòng làm bảng Tổng hợp mất 15,9 giây."""
    than = sql.split("create or replace view v_phan_bo_sau_dieu_chuyen_v3")[1]
    for ham in ("fn_da_dua_di_cua_khoa_v3", "fn_nhan_cua_khoa_v3"):
        assert ham not in than, f"{ham} chạy theo từng dòng — phải gộp bằng JOIN"
    assert "group by dot_goi_id" in than


def test_bang_tong_hop_pdd_doc_so_da_dieu_chuyen(sql: str) -> None:
    than = sql.split("create or replace view v_phan_bo_tong_hop")[1]
    assert "from v_phan_bo_sau_dieu_chuyen_v3" in than, \
        "Tổng hợp PĐD phải đọc số sau điều chuyển, không đọc thẳng phan_bo_khoa"
    for truong in ("'da_do_di'", "'nhan_ve'", "'do_sang_ma'", "'nhan_tu_ma'"):
        assert truong in than, f"thiếu {truong} thì màn không hiện được nhãn đã đổ"


def test_khong_ghi_de_phan_bo_khoa(sql: str) -> None:
    assert "update phan_bo_khoa" not in sql.lower(), \
        "khoá cứng 1: số đã mang đi thầu không được sửa sau khi biết kết quả"


@pytest.mark.parametrize("man", ["TongHopPdd.jsx", "DanhMucDeXuatKhoa.jsx"])
def test_hai_man_cung_doc_mot_nguon(man: str) -> None:
    src = (FE / man).read_text(encoding="utf-8")
    assert 'from("v_phan_bo_sau_dieu_chuyen_v3")' in src, \
        f"{man} còn đọc thẳng phan_bo_khoa — hai màn sẽ hiện hai số khác nhau"


def test_man_khoa_giu_dong_ma_da_do_va_co_nhan() -> None:
    src = (FE / "DanhMucDeXuatKhoa.jsx").read_text(encoding="utf-8")
    assert ".filter((r) => !ketQuaTheoMa.get(r.ma_hang)?.da_xu_ly)" not in src, \
        "không được ẩn mã đã đổ: khoa thấy đề xuất biến mất, không biết số đi đâu"
    assert "đã đổ {fmt(r.da_do_di)} sang {r.do_sang_ma}" in src
    assert "nhận {fmt(r.nhan_ve)} từ {r.nhan_tu_ma}" in src
