from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATCH = (ROOT / "sql" / "patch_zzzzj_v3_chuan_bi_dot.sql").read_text(encoding="utf-8")


def test_pdd_co_cung_quyen_quan_tri_tai_khoan_voi_admin():
    # QĐ 15 (17/08/2026): PĐD = admin, cùng quyền, không có vai trò thứ ba.
    for lenh in ("select", "insert", "update", "delete"):
        assert f"for {lenh}" in PATCH
    assert PATCH.count("in ('admin', 'dieu_duong')") >= 5
    # Không được đụng vào đường tự đăng ký — người tự đăng ký vẫn phải vào
    # bằng 'dvsd', chỉ PĐD/admin mới nâng quyền.
    assert 'drop policy if exists "user tự đăng ký"' not in PATCH
    assert "create or replace function fn_gac_role_dang_ky" not in PATCH


def test_gan_goi_con_o_cap_ma_quan_ly_chu_khong_phai_ma_hang():
    assert "gan_goi_con_ma_quan_ly_v3(\n    p_ma_quan_ly text,\n    p_goi text\n)" in PATCH
    assert "update vat_tu set goi = p_goi" in PATCH
    assert "where ma_quan_ly = p_ma_quan_ly" in PATCH


def test_gan_goi_con_chi_nhan_goi_con_18_thang_co_that():
    assert "loai_mua_sam = 'dau_thau_rong_rai' and goi = p_goi" in PATCH
    assert "Gói con không hợp lệ" in PATCH


def test_gan_goi_con_bi_khoa_sau_khi_chot_q():
    # Giai đoạn 6: chốt số tham gia đấu thầu khóa phạm vi danh mục.
    assert "from chot_q_dong d" in PATCH
    assert "join chot_q_phien f on f.id = d.phien_id and f.hieu_luc" in PATCH
    assert "phạm vi đã khóa" in PATCH


def test_gan_goi_con_chi_pdd_va_co_audit():
    assert "current_user_role() not in ('dieu_duong', 'admin')" in PATCH
    assert "insert into vat_tu_goi_audit" in PATCH
    assert "revoke execute on function gan_goi_con_ma_quan_ly_v3(text, text) from public, anon" in PATCH


def test_view_phan_goi_bao_duoc_ma_vat_ngang_va_chua_phan():
    assert "create or replace view v_phan_goi_ma_quan_ly" in PATCH
    assert "count(distinct v.goi)" in PATCH
    assert "count(*) filter (where v.goi is null)" in PATCH
    assert "as can_xu_ly" in PATCH


def test_dong_dot_van_dong_het_goi_con():
    assert "new.trang_thai = 'dong' and old.trang_thai is distinct from 'dong'" in PATCH
    assert "set trang_thai = 'dong'" in PATCH


def test_mo_lai_dot_khong_con_tu_mo_het_goi_con():
    # Bản cũ có nhánh `else update dot_goi set trang_thai=new.trang_thai`
    # ghi đè cả 5 gói con — trái mục I.1 "chốt/mở một gói con không được tác
    # động bốn gói con còn lại".
    assert "update dot_goi set trang_thai=new.trang_thai" not in PATCH
    assert "where dot_id = new.id and trang_thai <> 'dong'" in PATCH
