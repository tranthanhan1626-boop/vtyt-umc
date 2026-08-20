"""Khẳng định patch_zzzzw giữ đúng việc neo đợt cho `danh_muc_khoa_o`.

Lỗi được vá: bảng khoá theo (goi_id, nam_de_xuat, khoa, ma_hang), KHÔNG có neo
đợt nào. Frontend hardcode `goi_id = 'bo-sung'` cho MỌI đợt bổ sung (5 chỗ), mà
3 đợt/năm lại cùng `nam_de_xuat` — nên ba đợt dùng chung MỘT dòng giải trình.

Đo thật 20/08/2026 sau khi vá: hai đợt bổ sung 2027 cùng ghi
goi_id='bo-sung' + cùng khoa + cùng mã hàng -> giữ được 2 dòng riêng; xoá một
đợt thì dòng của đợt kia còn nguyên.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzw_neo_dot_cho_danh_muc_khoa_o.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists(), f"Thiếu file patch: {PATCH}"
    return PATCH.read_text(encoding="utf-8")


def test_them_cot_va_khoa_ngoai_cascade(sql: str) -> None:
    for bang in ("danh_muc_khoa_o", "danh_muc_khoa_o_audit"):
        assert f"alter table {bang}" in sql or f"alter table {bang.ljust(len(bang))}" in sql
    assert "add column if not exists dot_goi_id bigint" in sql
    # CASCADE là chỗ vá thật: xoá DOT_GOI thì ô đi theo, không ai phải nhớ dọn.
    assert sql.count("references dot_goi(id) on delete cascade") == 2
    assert "alter table danh_muc_khoa_o alter column dot_goi_id set not null" in sql


def test_khoa_duy_nhat_phai_gom_dot(sql: str) -> None:
    """Không gồm đợt thì hai đợt cùng gói con vẫn đè nhau — đúng lỗi đang vá."""
    assert "drop constraint if exists danh_muc_khoa_o_goi_id_nam_de_xuat_khoa_ma_hang_key" in sql
    assert "unique (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang)" in sql


def test_trigger_chan_xoa_nhuong_duong_cho_cascade(sql: str) -> None:
    """`fn_chan_o_cot_khoa_sua` raise khi dòng có cột khoá sửa. Không nới thì
    cascade bị chính nó chặn -> không xoá được đợt nữa."""
    i = sql.index("create or replace function fn_chan_o_cot_khoa_sua()")
    than = sql[i:sql.index("$$;", i)]
    assert "current_setting('app.don_smoke_v3', true)" in than
    assert "not exists (select 1 from dot_goi where id = old.dot_goi_id)" in than
    # vẫn phải giữ nguyên chốt chặn cho đường người dùng xoá tay
    assert "đang KHOÁ SỬA" in than


def test_trigger_audit_mang_theo_dot_va_khong_ghi_khi_cha_da_chet(sql: str) -> None:
    i = sql.index("create or replace function fn_log_danh_muc_khoa_o()")
    than = sql[i:sql.index("$$;", i)]
    assert "(dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang, cot," in than
    assert "v_row.dot_goi_id" in than
    # ghi audit trong lúc cascade sẽ vi phạm khoá ngoại vì DOT_GOI vừa bị xoá
    assert "not exists (select 1 from dot_goi where id = v_row.dot_goi_id)" in than


def test_ham_ghi_o_bat_buoc_co_dot(sql: str) -> None:
    # bài học 10: phải drop chữ ký cũ, nếu không PostgREST trả PGRST203 cho MỌI lần gọi
    assert "drop function if exists luu_o_danh_muc_khoa(text, integer, text, text, text, text);" in sql
    i = sql.index("create or replace function luu_o_danh_muc_khoa(")
    than = sql[i:sql.index("$$;", i)]
    assert "p_dot_goi_id bigint" in than
    assert "Thiếu DOT_GOI khi lưu ô danh mục khoa." in than
    assert "on conflict (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang)" in than


def test_ban_trinh_ky_lay_giai_trinh_dung_dot(sql: str) -> None:
    """Join thiếu đợt thì snapshot trình ký nuốt giải trình của đợt khác."""
    i = sql.index("create or replace function chot_trinh_ky_toan_bo_v3(")
    than = sql[i:sql.index("$$;", i)]
    assert "on ok.dot_goi_id = p.dot_goi_id" in than
    # không được quay lại join theo goi_id + nam
    assert "on ok.goi_id = dg.goi_id and ok.nam_de_xuat = d.nam" not in than


def test_don_dot_xoa_chinh_xac_theo_dot(sql: str) -> None:
    """Trước patch phải đoán 'chỉ khi gói con + năm có đúng một đợt'."""
    i = sql.index("create or replace function xoa_du_lieu_v3_cua_dot(")
    than = sql[i:sql.index("$$;", i)]
    for bang in ("danh_muc_khoa_o_audit", "danh_muc_khoa_o"):
        assert f"delete from {bang} where dot_goi_id in" in than
    assert "1 = (select count(*) from dot_goi x join dot_de_xuat y" not in than


# --- tầng giao diện: khoá đọc/ghi hai bên PHẢI giống nhau (bài học 9) --------

def test_man_khoa_doc_va_ghi_deu_neo_dot() -> None:
    src = (FE / "DanhMucDeXuatKhoa.jsx").read_text(encoding="utf-8")
    assert '.eq("dot_goi_id", dotGoiId).eq("khoa", khoaHienTai)' in src
    assert "p_dot_goi_id: dotGoiId," in src
    # Truy vấn `danh_muc_khoa_o` không được quay về khoá cũ (goi_id, nam, khoa).
    # Lưu ý: `danh_muc_khoa_cot_cau_hinh` (cấu hình khoá/ẩn cột) VẪN dùng bộ
    # khoá đó — bảng khác, chưa neo đợt, đã ghi vào mục việc còn nợ.
    i = src.index('from("danh_muc_khoa_o")')
    truy_van = src[i:i + 320]
    assert '.eq("dot_goi_id", dotGoiId)' in truy_van
    assert 'nam_de_xuat' not in truy_van


def test_man_tong_hop_doc_o_khoa_theo_dot() -> None:
    src = (FE / "TongHopPdd.jsx").read_text(encoding="utf-8")
    assert '.eq("dot_goi_id", dotGoiIdKhoa)' in src
    assert '.eq("goi_id", goiIdKhoa).eq("nam_de_xuat", namDeXuat)' not in src
