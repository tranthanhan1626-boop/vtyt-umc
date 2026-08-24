"""Khẳng định patch_zzzzzg — QĐ D15 (24/08/2026): chia tay trên TRÚNG + NHẬN.

Chủ dự án: "nếu nhận 460 rồi thì phải chia lại trên tổng 520+460 chứ, sao đã
chia chỉ có 520? Làm sao để tôi vô chia bằng tay?"

Bốn mảnh phải đi cùng nhau:
  1. số phải chia = trúng + nhận (view + khoá cứng 2 + phép chia theo tỉ lệ)
  2. đổ xong thì mã NHẬN về trống để PĐD chia lại trên tổng mới
  3. cổng chặn ĐỔ khi mã rớt chưa chia — nếu không nó đổ đi CẢ Q
  4. chốt trình ký KHÔNG cộng đôi (số thật đã nằm ở phan_bo_trung_v3)
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzzg_chia_tay_ke_ca_phan_nhan.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists()
    return PATCH.read_text(encoding="utf-8")


def test_phai_chia_gom_ca_phan_nhan(sql: str) -> None:
    than = sql.split("create view v_phan_bo_trung_theo_ma_v3")[1].split("grant")[0]
    assert "phai_chia" in than and "da_nhan" in than
    assert "so_luong_trung + coalesce(n.da_nhan, 0)" in than


def test_khoa_cung_2_tinh_ca_phan_nhan(sql: str) -> None:
    cap = sql.split("create or replace function cap_nhat_phan_bo_trung_v3")[-1].split("$$;")[0]
    assert "phai_chia into v_trung" in cap, "kỳ vọng phải là trúng + nhận"
    assert "fn_nhan_cua_khoa_v3" in cap, "vượt Q cũng phải tính cả phần khoa nhận"
    chot = sql.split("create or replace function chot_trinh_ky_toan_bo_v3")[-1].split("$$;")[0]
    assert "v_phan_bo_trung_theo_ma_v3" in chot and "not m.da_khop" in chot


def test_chia_theo_ti_le_dung_trong_so_gom_phan_nhan(sql: str) -> None:
    than = sql.split("function fn_chia_theo_ti_le_q_v3")[-1].split("$$;")[0]
    assert "phai_chia" in than
    assert "fn_nhan_cua_khoa_v3" in than, \
        "khoa chưa từng đề xuất mã nhận có Q=0; chỉ lấy Q làm trọng số thì phần nhận bốc hơi"


def test_do_xong_thi_ma_nhan_ve_trong(sql: str) -> None:
    than = sql.split("create or replace function day_so_luong_rot_v3")[-1].split("$$;")[0]
    assert "so_luong_trung = 0" in than, "mã nhận phải về trống để PĐD chia lại"
    assert "on conflict (phien_q_id, ma_hang, khoa) do nothing" in than, \
        "khoa chưa từng đề xuất mã nhận phải được đẻ dòng, nếu không phần nhận không có chỗ"


def test_chan_do_khi_chua_chia_va_ma_ngoai_dot(sql: str) -> None:
    than = sql.split("create or replace function day_so_luong_rot_v3")[-1].split("$$;")[0]
    assert "not da_khop" in than, "chưa chia mà đổ thì nó đổ đi CẢ Q"
    assert "không có trong đợt này" in than, "mã nhận phải nằm trong snapshot Q"


def test_chot_trinh_ky_khong_cong_doi(sql: str) -> None:
    chot = sql.split("create or replace function chot_trinh_ky_toan_bo_v3")[-1].split("$$;")[0]
    assert "v_nhan_chuyen_rot_theo_khoa_v3" not in chot, \
        "từ D15 phần nhận đã nằm trong phan_bo_trung_v3 — cộng thêm nữa là cộng đôi"


def test_giao_dien_co_bang_go_tay() -> None:
    cum = (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")
    assert "BangSoTrungTheoKhoa" in cum
    assert "cap_nhat_phan_bo_trung_v3" in cum, "phải có đường gõ tay ngay trên bảng Tổng hợp"
    th = (FE / "TongHopPdd.jsx").read_text(encoding="utf-8")
    assert "BangSoTrungTheoKhoa" in th and "phai_chia" in th


def test_khoa_thay_ket_qua_thau() -> None:
    kh = (FE / "DanhMucDeXuatKhoa.jsx").read_text(encoding="utf-8")
    assert "taiKetQuaThau(bo.loai_mua_sam" in kh, \
        "khoa phải thấy kết quả thầu trên danh mục của mình"
    goi = [d for d in kh.splitlines()
           if 'rpc("day_so_luong_rot"' in d and not d.strip().startswith("//")]
    assert not goi, "nhưng nút Đẩy SL của khoa vẫn phải tắt — việc đó của PĐD"
