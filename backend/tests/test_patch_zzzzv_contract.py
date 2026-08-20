"""Khẳng định patch_zzzzv giữ đúng hai điều đã sửa ngày 20/08/2026.

Vòng test full 20/08 tìm ra:
  - Lỗi 2: cổng "Chốt trình ký toàn bộ" đếm MỌI khoa tham gia, nên gói có 49
    khoa tham gia mà chỉ 2 khoa gửi đề xuất thì nút không bao giờ sáng.
  - Lỗi 3: `xoa_du_lieu_v3_cua_dot` bỏ quên hai bảng ô sửa tay, nên xoá đợt
    xong `danh_muc_khoa_o` vẫn sống và đợt sau đọc trúng dữ liệu đợt trước.

Test đọc thẳng file patch — cùng kiểu với các test contract khác của dự án,
không cần kết nối database.
"""
from pathlib import Path

import pytest

PATCH = (Path(__file__).resolve().parents[1]
         / "sql" / "patch_zzzzv_noi_chot_trinh_ky_va_don_o_sua_tay.sql")


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists(), f"Thiếu file patch: {PATCH}"
    return PATCH.read_text(encoding="utf-8")


def test_co_ham_liet_ke_khoa_chua_du_chot(sql: str) -> None:
    assert "create or replace function khoa_chua_du_chot_trinh_ky" in sql
    assert "grant execute on function khoa_chua_du_chot_trinh_ky(bigint) to authenticated" in sql


def test_cong_chot_trinh_ky_chi_tinh_khoa_da_gui(sql: str) -> None:
    """Vế 'đã gửi đề xuất thật' phải nằm trong hàm liệt kê khoa còn thiếu.

    Đây chính là vế mà cổng cũ không có. Nếu ai đó gỡ nó ra, gói 49 khoa lại
    kẹt như trước.
    """
    i = sql.index("khoa_chua_du_chot_trinh_ky")
    than = sql[i:sql.index("$$;", i)]
    assert "from phan_bo_khoa pb" in than
    assert "pb.so_luong_hien_hanh > 0" in than
    assert "dk.tham_gia" in than


def test_chot_trinh_ky_toan_bo_dung_ham_moi_va_khong_chan_khoa_im_lang(sql: str) -> None:
    i = sql.index("create or replace function chot_trinh_ky_toan_bo_v3")
    than = sql[i:sql.index("$$;", i)]
    # cổng cứng lấy từ hàm mới
    assert "from khoa_chua_du_chot_trinh_ky(p_dot_goi_id)" in than
    # khoa chưa gửi chỉ vào audit, không raise
    assert "v_chua_gui" in than
    # `hanh_dong` có CHECK chỉ nhận 'chot'/'vo_hieu' — số khoa im lặng phải ghi
    # vào `ly_do`. Smoke đã bắt được đúng lỗi này một lần, giữ test để khỏi tái.
    assert "'chot'," in than
    assert "Khoa tham gia chưa gửi đề xuất (không chặn): " in than
    # không được quay lại cách đếm cũ trên dot_goi_khoa làm điều kiện chặn
    assert "Còn % khoa chưa đủ chốt danh mục ban đầu và chốt trình ký." not in than


def test_don_dot_co_don_hai_bang_o_sua_tay(sql: str) -> None:
    i = sql.index("create or replace function xoa_du_lieu_v3_cua_dot")
    than = sql[i:sql.index("$$;", i)]
    for bang in ("danh_muc_tong_hop_o", "danh_muc_tong_hop_o_audit",
                 "danh_muc_khoa_o", "danh_muc_khoa_o_audit"):
        assert f"delete from {bang}" in than, f"chưa dọn {bang}"


def test_don_ban_tong_hop_tach_dung_dot(sql: str) -> None:
    """Bản tổng hợp khoá theo '<goi>:dot:<id>' nên phải tách theo đúng chuỗi đó,
    không được xoá theo goi_id trần (sẽ ăn mất đợt khác cùng gói con)."""
    i = sql.index("create or replace function xoa_du_lieu_v3_cua_dot")
    than = sql[i:sql.index("$$;", i)]
    assert "dg.goi_id || ':dot:' || dg.dot_id::text" in than


def test_don_ban_khoa_chi_khi_goi_con_co_dung_mot_dot(sql: str) -> None:
    """`danh_muc_khoa_o` không có neo đợt. Chỉ được xoá khi (gói con, năm) có
    đúng một đợt — nếu không sẽ xoá nhầm dữ liệu của đợt đang sống."""
    i = sql.index("create or replace function xoa_du_lieu_v3_cua_dot")
    than = sql[i:sql.index("$$;", i)]
    assert than.count("1 = (select count(*) from dot_goi x join dot_de_xuat y") == 2


def test_trigger_chan_xoa_o_co_duong_thoat_don_kiem_thu(sql: str) -> None:
    """Không nới trigger thì chính câu delete thêm ở trên sẽ vỡ với những đợt
    đã chốt danh mục tổng hợp."""
    i = sql.index("create or replace function fn_chan_xoa_o_da_chot")
    than = sql[i:sql.index("$$;", i)]
    assert "current_setting('app.don_smoke_v3', true)" in than
    # vẫn phải giữ nguyên chốt chặn cho đường dùng thật
    assert "Danh mục tổng hợp đã được CHỐT" in than


def test_patch_chay_lai_duoc(sql: str) -> None:
    assert sql.count("create or replace function") >= 4
    assert "begin;" in sql and "commit;" in sql
