import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH = (ROOT / "backend/sql/patch_zzzzp_v3_pdd_duyet_o_chu.sql").read_text(encoding="utf-8")
KHOA_JSX = (ROOT / "frontend/src/features/DanhMucDeXuatKhoa.jsx").read_text(encoding="utf-8")
TONG_HOP_JSX = (ROOT / "frontend/src/features/TongHopPdd.jsx").read_text(encoding="utf-8")
COT_CHUAN = (ROOT / "frontend/src/lib/cotChuan.js").read_text(encoding="utf-8")


def test_anh_xa_cot_hai_ben_khop_nhau():
    """`cot_pdd_sang_khoa` (SQL) là chiều ngược của `cotKhoaSangPdd` (JS).

    Lệch nhau thì trigger khoá nhầm ô, hoặc bỏ sót ô đáng khoá — mà cả hai đều
    im lặng, không có thông báo lỗi nào.
    """
    for cot_khoa, cot_pdd in [
        ("sl_de_xuat_18t", "sl_de_xuat_2627"),
        ("giai_trinh_2627", "giai_trinh"),
        ("ma_sp_2627", "ma_sp"),
        ("hang_sx_2627", "hang_sx"),
        ("nuoc_sx_2627", "nuoc_sx"),
    ]:
        assert re.search(rf"{cot_khoa}:\s*\"{cot_pdd}\"", COT_CHUAN), cot_khoa
        # Patch căn cột bằng khoảng trắng nên không so chuỗi cứng được.
        assert re.search(rf"when\s+'{cot_pdd}'\s+then\s+'{cot_khoa}'", PATCH), cot_pdd


def test_hai_cot_khong_bao_gio_link_xuong_khoa():
    # `giai_trinh` là tiếng nói của từng khoa (QĐ 19/08/2026).
    # `sl_de_xuat_2627` là cột SỐ, đã đi đường riêng qua `phan_bo_khoa`.
    assert "select p_cot in ('giai_trinh', 'sl_de_xuat_2627')" in PATCH
    assert 'COT_KHONG_NHAN_DUYET = new Set(["giai_trinh_2627", "sl_de_xuat_18t"])' in KHOA_JSX


def test_sau_chot_q_chi_khoa_cot_so():
    """QĐ 19/08/2026 — cột CHỮ sửa được tới khi chốt trình ký, không phải chốt Q.

    Bản cũ chặn mọi cột ngay khi chốt Q, buộc PĐD mở lại snapshot Q chỉ để sửa
    một dòng TSKT theo biên bản làm rõ với nhà thầu.
    """
    assert "if v_row.cot = 'sl_de_xuat_2627' and exists (" in PATCH
    assert "from chot_q_phien q" in PATCH
    assert "if v_row.cot <> 'sl_de_xuat_2627' and exists (" in PATCH
    assert "from chot_trinh_ky_phien_v3 t" in PATCH
    assert "Đã chốt dữ liệu trình ký" in PATCH


def test_khoa_khong_sua_duoc_o_pdd_da_duyet():
    assert "create or replace function fn_khoa_o_khoa_khi_pdd_da_duyet" in PATCH
    assert "đã được Phòng Điều dưỡng duyệt trên bản Tổng hợp" in PATCH
    # Chỉ chặn đúng ô bị đổi — cả dòng nằm chung một JSONB, khoa vẫn phải sửa
    # được những ô khác trên cùng dòng.
    assert "(v_cu -> v_cot_khoa) is distinct from (v_moi -> v_cot_khoa)" in PATCH


def test_pdd_van_sua_thay_khoa_duoc():
    assert "if current_user_role() in ('dieu_duong', 'admin') then" in PATCH
    assert "return v_row;" in PATCH


def test_trigger_chay_sau_cac_trigger_chan_san_co():
    # Postgres gọi trigger cùng thời điểm theo THỨ TỰ TÊN.
    assert "trg_z_khoa_o_khoa_khi_pdd_da_duyet" in PATCH
    assert "trg_z_khoa_o_khoa_khi_pdd_da_duyet" > "trg_chan_o_khoa_da_chot"


def test_tong_hop_doc_duoc_o_khoa_da_sua():
    """Mảnh nặng nhất: trước 19/08/2026 màn Tổng hợp không hề đọc bảng này."""
    assert 'supabase.from("danh_muc_khoa_o")' in TONG_HOP_JSX
    # goi_id bên khoa KHÔNG mang hậu tố ':dot:N'.
    assert 'String(goiId).split(":dot:")[0]' in TONG_HOP_JSX
    assert "oKhoaTheoMa" in TONG_HOP_JSX


def test_tong_hop_bao_co_khi_cac_khoa_ghi_lech_nhau():
    assert "const soGiaTriKhac = new Set(dsKhoaGhi.map((x) => x.giaTri)).size" in TONG_HOP_JSX
    assert "khoaLech" in TONG_HOP_JSX
    assert "giá trị khác nhau" in TONG_HOP_JSX


def test_o_ben_khoa_nhan_gia_tri_duyet_va_thanh_chi_doc():
    assert "const value = pddDuyet ? pddDuyet.gia_tri : r[c.key];" in KHOA_JSX
    assert "c.readonly || !canSua || pddDuyet ? \"readonly\" : \"\"," in KHOA_JSX
    assert "canSua && !pddDuyet && setODangChon" in KHOA_JSX


def test_comment_loi_thoi_da_duoc_sua():
    # Comment cũ khẳng định cột chữ của khoa chưa có bảng lưu thật — sai từ
    # patch_zm, và sai hẳn từ patch_zzzzp.
    assert "CHỈ lưu state cục bộ trong phiên" not in KHOA_JSX
    assert "(LỖI THỜI, sửa 19/08/2026)" in KHOA_JSX
