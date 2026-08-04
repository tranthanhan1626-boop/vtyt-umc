from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH = (ROOT / "backend/sql/patch_za_xoa_du_lieu_kiem_thu.sql").read_text()
APP = (ROOT / "frontend/src/App.jsx").read_text()
QUAN_LY = (ROOT / "frontend/src/features/QuanLyDuLieuTest.jsx").read_text()
NUT_XOA = (ROOT / "frontend/src/components/NutXoaDuLieuTest.jsx").read_text()
CLIENT = (ROOT / "frontend/src/lib/xoaDuLieuTest.js").read_text()
DE_XUAT_KHOA = (ROOT / "frontend/src/features/DeXuatCuaToi.jsx").read_text()
DE_XUAT_PDD = (ROOT / "frontend/src/features/DeXuatTongHop.jsx").read_text()
HO_SO = (ROOT / "frontend/src/features/HoSoTrucTuyen.jsx").read_text()
LICH_SU = (ROOT / "frontend/src/features/LichSuXuatHoSo.jsx").read_text()


def test_rpc_chi_chay_dung_staging_va_can_cum_xac_nhan():
    assert "ihgfafubwyxnbubmppbj" in PATCH
    assert "auth.jwt() ->> 'iss'" in PATCH
    assert "XOA-DU-LIEU-TEST" in PATCH
    assert "Chức năng xóa dữ liệu kiểm thử chỉ được phép trên STAGING" in PATCH
    assert "p_xac_nhan: \"XOA-DU-LIEU-TEST\"" in CLIENT


def test_xoa_theo_khoa_va_pdd_khong_bi_khoa_theo_tai_khoan_tao():
    assert "v_role not in ('dvsd', 'dieu_duong', 'admin')" in PATCH
    assert "v_don_vi is distinct from v_khoa" in PATCH
    assert "created_by is distinct from v_email" not in PATCH
    assert "ĐVSD chỉ được xóa dữ liệu của khoa mình" in PATCH


def test_xoa_de_xuat_don_du_file_va_cac_fk_phu_thuoc():
    required = (
        "delete from lan_xuat_ho_so",
        "delete from ho_so_cong_tac_lich_su",
        "delete from ho_so_cong_tac",
        "delete from tuy_chon_mua_them_kich_hoat",
        "delete from goi_thau_ket_qua_ma",
        "delete from proposals",
    )
    for statement in required:
        assert statement in PATCH
    assert "danh_muc_di_thau_id = null" in PATCH
    assert "app.xoa_du_lieu_test" in PATCH
    assert "app.di_thau" in PATCH
    assert "v_phien_ids" in PATCH
    assert "delete from phien_tong_hop where id = any(v_phien_ids)" in PATCH


def test_khong_co_nhanh_xoa_du_lieu_nen_benh_vien():
    forbidden = (
        "delete from vat_tu",
        "delete from usage_history",
        "delete from users",
        "delete from bieu_mau",
        "truncate ",
    )
    lowered = PATCH.lower()
    for statement in forbidden:
        assert statement not in lowered


def test_dau_xoa_co_mat_toan_app_va_truc_tiep_tai_de_xuat_file():
    assert "<QuanLyDuLieuTest profile={profile}" in APP
    assert "Dọn dữ liệu kiểm thử" in QUAN_LY
    assert "Đề xuất / giỏ đã gửi" in QUAN_LY
    assert "File Word / Excel đang cộng tác" in QUAN_LY
    assert "Lịch sử xuất Word / Excel" in QUAN_LY
    assert "XÓA VĨNH VIỄN DỮ LIỆU KIỂM THỬ" in NUT_XOA
    for source in (DE_XUAT_KHOA, DE_XUAT_PDD):
        assert 'loai="nhom_de_xuat"' in source
        assert "Xóa hẳn dữ liệu test" in source
    assert 'loai="ho_so_cong_tac"' in HO_SO
    assert 'loai="lan_xuat_ho_so"' in LICH_SU


def test_ui_xoa_test_tu_an_o_production():
    assert "import.meta.env.DEV" in CLIENT
    assert "supabaseUrl.includes(MA_DU_AN_STAGING)" in CLIENT
    assert "VITE_ENABLE_TEST_DELETE" in CLIENT
    assert "if (!BAT_XOA_DU_LIEU_TEST" in NUT_XOA
