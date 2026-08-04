from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH_S = (ROOT / "backend/sql/patch_s_workflow_ho_so_dvsd.sql").read_text()
PATCH_T = (ROOT / "backend/sql/patch_t_tao_nhieu_bo_ho_so.sql").read_text()
FUNCTION_1 = (ROOT / "frontend/src/features/Function1.jsx").read_text()
HO_SO = (ROOT / "frontend/src/features/HoSoTrucTuyen.jsx").read_text()
XUAT_HO_SO_KHOA = (ROOT / "frontend/src/features/XuatHoSo.jsx").read_text()
LICH_SU = (ROOT / "frontend/src/features/LichSuXuatHoSo.jsx").read_text()
XUAT_HO_SO = (ROOT / "frontend/src/lib/xuatHoSo.js").read_text()


def test_patch_s_co_du_vong_trang_thai_va_audit():
    for trang_thai in (
        "ban_nhap",
        "cho_pdd",
        "dang_xet_duyet",
        "pdd_da_sua",
        "tu_choi",
        "da_duyet",
    ):
        assert f"'{trang_thai}'" in PATCH_S

    for hanh_dong in (
        "gui_pdd",
        "bat_dau_xet_duyet",
        "tu_choi",
        "hoan_thanh",
    ):
        assert f"'{hanh_dong}'" in PATCH_S

    assert "insert into ho_so_cong_tac_lich_su" in PATCH_S
    assert "app.workflow_ho_so" in PATCH_S
    assert "('tu_choi', 'de_xuat')" in PATCH_S


def test_ngoai_khoang_bat_buoc_ly_do_nhung_ghi_chu_tuy_chon():
    assert 'const CO_GOI_Y_SO_LUONG = (goi) => goi !== "chi_dinh_thau"' in FUNCTION_1
    assert 'n.ngoaiKhoang && n.loaiLyDo === "theo_lich_su"' in FUNCTION_1
    assert "Ghi chú thêm" in FUNCTION_1
    assert "(không bắt buộc)" in FUNCTION_1


def test_ho_so_chuyen_theo_ca_bo_va_excel_sort_dung_ma():
    assert 'chuyenCaBo("gui_pdd")' in HO_SO
    assert 'chuyenCaBo("bat_dau_xet_duyet")' in HO_SO
    assert 'chuyenCaBo("tu_choi")' in HO_SO
    assert 'chuyenCaBo("hoan_thanh")' in HO_SO
    assert "Lịch sử & xuất file" not in HO_SO
    assert 'const SO_DONG_PREVIEW = 10' in LICH_SU
    assert "1. Loại tài liệu" in LICH_SU
    assert "2. Gói thầu" in LICH_SU
    assert "<PreviewChiDoc row={dangChon}" in LICH_SU
    assert "a.ma_quan_ly" in XUAT_HO_SO
    assert "a.ma_hang" in XUAT_HO_SO


def test_tao_nhieu_bo_ho_so_khong_ghi_de_lich_su():
    assert "tao_bo_ho_so_moi" in PATCH_T
    assert "'bo:' || gen_random_uuid()" in PATCH_T
    assert "insert into ho_so_cong_tac_lich_su" in PATCH_T
    assert "Tạo hồ sơ mới" in XUAT_HO_SO_KHOA
    assert "Chọn biểu mẫu" in XUAT_HO_SO_KHOA
    assert 'aria-label="Loại hồ sơ"' in XUAT_HO_SO_KHOA
    assert "hoSoTheoLoai.map" in XUAT_HO_SO_KHOA
    assert "nguonKey={nguonDangMo}" in XUAT_HO_SO_KHOA
