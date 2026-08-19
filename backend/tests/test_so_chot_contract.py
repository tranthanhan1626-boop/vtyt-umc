"""Hợp đồng cho patch_zs — "số chốt" là nguồn số lượng DUY NHẤT.

Hai quyết định của chủ dự án ngày 08/08/2026 mà bộ test này canh:
  a) PĐD sửa gì thì khoa THẤY HẾT.
  b) Bấm chốt danh sách là KHOÁ, mở chốt mới sửa được tiếp.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATCH_ZS = (ROOT / "backend/sql/patch_zs_so_chot_va_khoa_sau_chot.sql").read_text()
# `goi_con` được seed ở NHIỀU patch, không chỉ patch_zs: bản v3 thêm dòng
# `chi-dinh-thau`. Đọc thiếu patch v3 thì test này và `kiem_truoc_deploy.py`
# (vốn đọc DB THẬT) nói ngược nhau — sửa bên nào cũng làm đỏ bên kia.
SEED_GOI_CON = PATCH_ZS + (ROOT / "backend/sql/patch_zzzz_v3_dot_goi.sql").read_text()
COT_CHUAN = (ROOT / "frontend/src/lib/cotChuan.js").read_text()
DANH_MUC_KHOA = (ROOT / "frontend/src/features/DanhMucDeXuatKhoa.jsx").read_text()
TONG_HOP_PDD = (ROOT / "frontend/src/features/TongHopPdd.jsx").read_text()


def test_bang_goi_con_khop_GOI_ID_MAP_ben_frontend():
    """`goi_con` (SQL) và `GOI_ID_MAP` (JS) mô tả CÙNG một thứ ở hai nơi.

    Lệch nhau thì view số chốt gom sai đề xuất vào sai gói con — sai số đi
    thầu mà không có thông báo lỗi nào. Đây chính là loại lỗi đã gây ra bẫy 16.
    """
    js = dict(re.findall(
        r'"([\w-]+)":\s*\{\s*loai_mua_sam:\s*"(\w+)"', COT_CHUAN))
    sql = dict(re.findall(
        r"\('([\w-]+)',\s*'(\w+)',", SEED_GOI_CON))
    assert js, "không đọc được GOI_ID_MAP"
    assert sql, "không đọc được seed goi_con"
    assert js == sql, (
        f"goi_con và GOI_ID_MAP lệch nhau.\n"
        f"  chỉ có ở JS : {sorted(set(js) - set(sql))}\n"
        f"  chỉ có ở SQL: {sorted(set(sql) - set(js))}"
    )


def test_view_so_chot_uu_tien_o_pdd_sua_de():
    assert "create or replace view v_so_chot_de_xuat" in PATCH_ZS
    assert "coalesce(s.so_luong_sua_de, k.so_luong_khoa_cong) as so_luong_chot" in PATCH_ZS
    # Chỉ nhận chuỗi số sạch. Nếu ép bừa, PĐD gõ nhầm chữ sẽ thành 0 và đi
    # thầu bằng số 0 — hỏng nặng hơn là bỏ qua ô đó.
    assert r"'^\s*-?\d+(\.\d+)?\s*$'" in PATCH_ZS
    # KHÔNG được lộ chiều khoa: view chạy bằng quyền owner để khoa xem được
    # tổng toàn viện, nên thêm don_vi vào là rò dữ liệu khoa khác.
    than = PATCH_ZS.split("create or replace view v_so_chot_de_xuat")[1].split("commit;")[0]
    assert "security_invoker" not in than, (
        "view phải chạy bằng quyền owner — xem chú thích trong patch"
    )
    assert re.search(r"^\s*don_vi\b", than, re.M) is None, (
        "v_so_chot_de_xuat không được có cột don_vi"
    )


def test_khoa_doc_duoc_o_pdd_sua_de_nhung_khong_ghi_duoc():
    """QĐ (a) — minh bạch một chiều: mở ĐỌC, không mở GHI."""
    assert 'create policy "khoa đọc ô tổng hợp để đối chiếu" on danh_muc_tong_hop_o' in PATCH_ZS
    assert 'create policy "khoa đọc audit ô tổng hợp" on danh_muc_tong_hop_o_audit' in PATCH_ZS
    for hanh_dong in ("for insert", "for update", "for delete"):
        assert f"on danh_muc_tong_hop_o\n    {hanh_dong}" not in PATCH_ZS, (
            f"patch_zs không được mở quyền {hanh_dong} cho khoa"
        )
    # Màn khoa phải thật sự đọc và hiện ra, không chỉ mở policy rồi để đó.
    assert "danh_muc_tong_hop_o" in DANH_MUC_KHOA
    assert "cotKhoaSangPdd" in DANH_MUC_KHOA
    assert "pdd-sua" in DANH_MUC_KHOA


def test_chot_la_khoa_sua_o_ca_hai_man():
    """QĐ (b) — chặn ở SERVER, không chỉ ẩn nút ở giao diện."""
    assert "Danh mục tổng hợp đã được CHỐT" in PATCH_ZS
    assert "fn_chan_o_khoa_da_chot" in PATCH_ZS
    # Xoá ô (bỏ sửa đè) cũng là sửa — chốt phải chặn nốt, nếu không chốt chỉ
    # khoá được một nửa.
    assert "fn_chan_xoa_o_da_chot" in PATCH_ZS
    assert "before delete on danh_muc_tong_hop_o" in PATCH_ZS
    assert "before insert or update or delete on danh_muc_khoa_o" in PATCH_ZS
    # Lớp giao diện (chỉ để người dùng thấy sớm, không phải lớp bảo vệ)
    assert "&& !trangThaiChot" in DANH_MUC_KHOA
    assert "!chot && !cotLocked.has(col.key)" in TONG_HOP_PDD


def test_don_cuoi_dot_mo_chot_truoc_khong_tu_chan_chinh_no():
    """Trigger chốt chặn cả DELETE, mà dọn cuối đợt chính là DELETE."""
    than = PATCH_ZS.split("PHẦN 6")[1]
    i_chot = than.index("delete from danh_muc_khoa_chot")
    i_o = than.index("delete from danh_muc_khoa_o")
    assert i_chot < i_o, "phải xoá dòng chốt TRƯỚC khi xoá ô, nếu không trigger tự chặn"
    assert "delete from danh_muc_tong_hop_chot" in than
