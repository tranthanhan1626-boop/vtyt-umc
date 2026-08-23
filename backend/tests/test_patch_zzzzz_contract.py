"""Khẳng định patch_zzzzz — bản VÒNG KHÉP KÍN, QĐ 23/08/2026.

Nhánh rớt → đổ sang mã tương đương → cuốn chiếu về đợt bổ sung → báo khoa đã
từng được xây đầu tháng 8 trên mô hình TRƯỚC v3 rồi chết khi thay xương sống.
Test này giữ cho bản viết lại không bị viết lùi về nền cũ, và giữ đúng 4 quyết
định dễ bị bào mòn nhất: D4 (cuốn chiếu MỌI phần rớt chưa xử lý), D7 (lệch ĐVT
thì chặn), D9 (khoa chưa từng dùng mã nhận vẫn ghi + noti), D10 (đợt bổ sung
luôn mở sẵn theo lịch T1/T5/T9).
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzz_vong_khep_kin.sql"
FE = GOC.parent / "frontend" / "src" / "features"

BANG_CHET = ("goi_thau_ket_qua_ma", "goi_thau_tien_do", "goi_thau_moc")


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists(), f"Thiếu file patch: {PATCH}"
    return PATCH.read_text(encoding="utf-8")


# --- Nền: không được đọc lại ba bảng đã chết -------------------------------

def test_khong_dung_lai_bang_truoc_v3(sql: str) -> None:
    for bang in BANG_CHET:
        # chỉ cho phép xuất hiện trong phần chú thích giải thích vì sao bỏ
        cau_lenh = [d for d in sql.splitlines()
                    if bang in d and not d.strip().startswith("--")]
        assert not cau_lenh, f"patch còn câu lệnh đụng bảng chết {bang}: {cau_lenh}"


def test_chay_lai_duoc(sql: str) -> None:
    assert sql.count("create table if not exists") >= 3
    for ten in ("day_so_luong_rot_v3", "xac_nhan_rot_v3", "fn_dot_bo_sung_gan_nhat",
                "fn_ghi_thong_bao", "danh_dau_da_xem_thong_bao"):
        assert f"create or replace function {ten}" in sql, ten
    # policy phải drop trước khi create, nếu không chạy lần hai là lỗi
    assert sql.count("drop policy if exists") >= 3
    assert sql.count("drop trigger if exists") >= 3


# --- D3: giữ nguyên số theo khoa, cùng mã quản lý --------------------------

def test_do_sang_ma_giu_so_theo_khoa(sql: str) -> None:
    than = sql.split("function day_so_luong_rot_v3")[1].split("$$;")[0]
    assert "v_rot_chua_xu_ly_v3" in than, "phải lấy phần rớt theo TỪNG KHOA"
    assert "con_lai" in than
    assert "ma_quan_ly" in than, "phải chặn mã nhận khác mã quản lý"


def test_khong_dung_vao_phan_bo_trung(sql: str) -> None:
    # Cả ba khoá cứng toán học dựa trên phan_bo_trung_v3 / ket_qua_rot_v3.
    # Patch này chỉ được GHI THÊM sổ, không sửa hai bảng đó.
    for bang in ("phan_bo_trung_v3", "ket_qua_rot_v3", "chot_q_dong"):
        assert f"update {bang}" not in sql.lower(), f"patch sửa {bang} — hỏng khoá cứng"
        assert f"insert into {bang}" not in sql.lower(), f"patch ghi {bang} — hỏng khoá cứng"


# --- D7: lệch ĐVT thì chặn --------------------------------------------------

def test_chan_lech_dvt(sql: str) -> None:
    than = sql.split("function day_so_luong_rot_v3")[1].split("$$;")[0]
    assert "dvt" in than and "raise exception" in than
    assert "Lệch đơn vị tính" in than, "phải báo rõ lệch ĐVT chứ không im lặng đổ"


# --- D9: khoa chưa từng dùng mã nhận ---------------------------------------

def test_khoa_chua_tung_dung_van_ghi_va_noti(sql: str) -> None:
    assert "khoa_chua_tung_dung" in sql
    than = sql.split("function day_so_luong_rot_v3")[1].split("$$;")[0]
    assert "CHƯA TỪNG" in than, "noti phải nói rõ đây là mã khoa chưa từng đề xuất"


# --- D4: cuốn chiếu MỌI phần rớt chưa xử lý --------------------------------

def test_cuon_chieu_theo_con_lai_khong_phai_rot_100(sql: str) -> None:
    than = sql.split("function xac_nhan_rot_v3")[1].split("$$;")[0]
    assert "con_lai > 0" in than, "cò phải bắn theo phần còn lại, không theo rớt toàn bộ"
    assert "rot_toan_bo" not in than, "không được quay lại điều kiện rớt 100%"
    assert "insert into proposals" in than, "phải đẻ dòng đề xuất ở đợt bổ sung"
    assert "cuon_chieu_rot_v3" in than


def test_so_mac_dinh_bang_so_rot(sql: str) -> None:
    than = sql.split("function xac_nhan_rot_v3")[1].split("$$;")[0]
    khoi = than.split("insert into proposals")[1].split(";")[0]
    assert "r.con_lai" in khoi, "số mặc định ở đợt bổ sung phải bằng đúng số rớt"


# --- D10: đợt bổ sung luôn mở sẵn, lịch T1/T5/T9 ---------------------------

def test_lich_bo_sung_va_luon_mo(sql: str) -> None:
    than = sql.split("function fn_dot_bo_sung_gan_nhat")[1].split("$$;")[0]
    assert "array[1,5,9]" in than, "phải giữ lịch cố định T1/T5/T9"
    assert "'bs-t'" in than
    assert "insert into dot_de_xuat" in than, "thiếu đợt thì hệ tự tạo"
    assert "chot_q_phien" in than, "đợt đã chốt Q thì phải nhảy sang mốc kế"
    assert "trang_thai = 'mo'" in than, "đợt phải LUÔN MỞ SẴN, không đợi PĐD mở"


# --- D5: hộp thư gộp theo phiên, xem xong là xoá ---------------------------

def test_hop_thu_gop_va_xoa(sql: str) -> None:
    assert "so_lan = thong_bao.so_lan + 1" in sql, "sửa vặt phải gộp, không mỗi ô một dòng"
    than = sql.split("function danh_dau_da_xem_thong_bao")[1].split("$$;")[0]
    assert "delete from thong_bao" in than, "xác nhận đã xem là XOÁ (D5)"
    assert "current_user_khoa()" in than, "khoa chỉ được xoá hộp thư của khoa mình"


# --- Giao diện: không còn cửa dẫn vào ngõ cụt ------------------------------

def test_man_khoa_khong_con_goi_rpc_chet() -> None:
    f = FE / "DanhMucDeXuatKhoa.jsx"
    noi_dung = f.read_text(encoding="utf-8")
    goi = [d for d in noi_dung.splitlines()
           if 'rpc("day_so_luong_rot"' in d and not d.strip().startswith("//")]
    assert not goi, f"màn khoa vẫn gọi RPC đã chết: {goi}"


def test_tong_hop_co_cum_thau() -> None:
    noi_dung = (FE / "TongHopPdd.jsx").read_text(encoding="utf-8")
    assert "OThauCuaDong" in noi_dung, "bảng Tổng hợp phải có cụm cột thầu (D1)"
    assert "ThanhGiaiDoanThau" in noi_dung
    cum = (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")
    for rpc in ("ghi_ngoai_le_rot_v3", "day_so_luong_rot_v3", "xac_nhan_rot_v3"):
        assert rpc in cum, rpc
