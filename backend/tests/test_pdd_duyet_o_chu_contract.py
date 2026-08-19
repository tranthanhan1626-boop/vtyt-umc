import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH = (ROOT / "backend/sql/patch_zzzzp_v3_pdd_duyet_o_chu.sql").read_text(encoding="utf-8")
PATCH_V2 = (ROOT / "backend/sql/patch_zzzzr_v2_cot_chu_mot_gia_tri.sql").read_text(encoding="utf-8")
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


def test_v2_go_han_luat_khoa_o_theo_duyet():
    """V2 (19/08/2026 chiều) — "đừng có PĐD xong là khoá ô".

    Luật cũ (patch_zzzzp mục 3) khoá ô của khoa ngay khi PĐD gõ. Chủ dự án bỏ
    luật đó: ai sửa sau đè, việc đóng băng dời sang chốt trình ký.
    """
    assert "drop trigger if exists trg_z_khoa_o_khoa_khi_pdd_da_duyet" in PATCH_V2
    assert "drop function if exists fn_khoa_o_khoa_khi_pdd_da_duyet()" in PATCH_V2
    # Bước "khoa chốt danh mục" cũng bị bỏ, nên trigger khoá theo nó phải đi.
    assert "drop trigger if exists trg_chan_o_khoa_da_chot" in PATCH_V2


def test_v2_khoa_ghi_duoc_bang_chung_nhung_chi_ma_cua_minh():
    """Một khoa sửa TSKT của mã mình không dùng là sửa hồ sơ của khoa khác."""
    assert "create or replace function khoa_duoc_sua_o_tong_hop" in PATCH_V2
    assert "pb.khoa = (select current_user_khoa())" in PATCH_V2
    # goi_id bên bản tổng hợp mang hậu tố ':dot:N' — Lỗi 24.
    assert "dg.goi_id || ':dot:' || dg.dot_id::text" in PATCH_V2
    assert 'create policy "khoa tạo ô tổng hợp cho mã của mình"' in PATCH_V2
    assert 'create policy "khoa sửa ô tổng hợp cho mã của mình"' in PATCH_V2
    # Hai cột không phải giá trị chung: giải trình (bản riêng PĐD) và cột SỐ.
    assert "not cot_khong_link_xuong_khoa(p_cot)" in PATCH_V2


def test_v2_khoa_o_chi_con_giu_giai_trinh():
    """Quên một đường ghi cũ là dữ liệu lại tách hai bản — đúng kiểu Lỗi 24."""
    assert "create or replace function fn_khoa_o_chi_nhan_giai_trinh" in PATCH_V2
    assert "trg_khoa_o_chi_nhan_giai_trinh" in PATCH_V2
    assert "k <> 'giai_trinh_2627'" in PATCH_V2


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


def test_v2_o_ben_khoa_sua_duoc_va_doc_tu_dong():
    """Ô không còn chỉ đọc, và giá trị chung phải được áp LÊN DÒNG lúc tải.

    Nếu chỉ bỏ `readonly` mà vẫn lấy giá trị chung lúc VẼ ô thì khoa gõ vào sẽ
    không thấy chữ đổi — bản cũ đọc `pddDuyet.gia_tri` ngay trong hàm vẽ.
    """
    assert "const value = r[c.key];" in KHOA_JSX
    assert 'c.readonly || !canSua ? "readonly" : "",' in KHOA_JSX
    assert "canSua && setODangChon" in KHOA_JSX
    assert "apGiaTriChung(dong)" in KHOA_JSX
    assert "pddDuyet" not in KHOA_JSX


def test_v2_cot_chu_ghi_thang_vao_bang_chung():
    assert 'const laGiaiTrinh = colKey === "giai_trinh_2627";' in KHOA_JSX
    assert 'await supabase.from("danh_muc_tong_hop_o").upsert({' in KHOA_JSX
    # Một chỗ duy nhất dựng khoá phạm vi — Lỗi 24 sinh ra vì mỗi nơi ghép một kiểu.
    assert "const goiScopeTongHop = dotId ?" in KHOA_JSX


def test_hai_chieu_doi_ten_cot_dung_chung_mot_bang_tra():
    assert "export function cotPddSangKhoa(colKey)" in COT_CHUAN
    assert "Object.entries(COT_KHOA_DOI_TEN).map(([khoa, pdd]) => [pdd, khoa])" in COT_CHUAN


def test_comment_loi_thoi_da_duoc_sua():
    # Comment cũ khẳng định cột chữ của khoa chưa có bảng lưu thật — sai từ
    # patch_zm, và sai hẳn từ patch_zzzzp.
    assert "CHỈ lưu state cục bộ trong phiên" not in KHOA_JSX
    assert "(LỖI THỜI, sửa 19/08/2026)" in KHOA_JSX
