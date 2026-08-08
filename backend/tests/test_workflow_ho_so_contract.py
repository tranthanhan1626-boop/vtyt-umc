from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH_S = (ROOT / "backend/sql/patch_s_workflow_ho_so_dvsd.sql").read_text()
PATCH_T = (ROOT / "backend/sql/patch_t_tao_nhieu_bo_ho_so.sql").read_text()
PATCH_Q = (ROOT / "backend/sql/patch_x2_de_xuat_theo_ma_quan_ly.sql").read_text()
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


def test_trong_khoang_mac_dinh_lich_su_ngoai_khoang_bat_buoc_ly_do_va_ghi_chu():
    assert 'const CO_GOI_Y_SO_LUONG = (goi) => goi !== "chi_dinh_thau"' in FUNCTION_1
    assert 'tiep.loaiLyDo = "theo_lich_su"' in FUNCTION_1
    assert "LY_DO_GIAI_TRINH_OPTIONS" in FUNCTION_1
    # Chốt sau này: chỉ CHẶN khi vượt P75 (dưới P50 là tiết kiệm, không bắt
    # giải trình). Ràng buộc "ra ngoài dải phải có ghi chú" vẫn còn.
    assert "Số lượng > P75 bắt buộc nhập ghi chú thêm." in FUNCTION_1
    # Câu chặn lúc LƯU cả giỏ (không chỉ lúc gõ từng dòng) — vẫn bắt buộc.
    assert "ghi chú bắt buộc khi chọn ngoài khoảng" in FUNCTION_1
    assert "Ghi chú thêm" in FUNCTION_1
    assert "So với {namCuoi}" not in FUNCTION_1
    assert "canhBaoBienDong" not in FUNCTION_1
    assert "ly_do_khac_phai_co_ghi_chu" in PATCH_Q
    assert "not valid" in PATCH_Q.lower()


def test_de_xuat_cap_ma_quan_ly_quy_doi_phan_bo_va_gio_phan_tang():
    for noi_dung in (
        "dvt_chuan",
        "he_so_quy_doi",
        "so_luong_ma_quan_ly",
        "bang_quy_doi",
    ):
        assert noi_dung in PATCH_Q
    assert "drop function if exists cap_nhat_quy_doi_ma_quan_ly" in PATCH_Q
    assert "create or replace function cap_nhat_quy_doi_ma_quan_ly" not in PATCH_Q
    assert "themMaQuanLyVaoGio" in FUNCTION_1
    assert "Thêm cả mã quản lý vào giỏ" in FUNCTION_1
    assert "gioTheoGoi" in FUNCTION_1
    assert "Tổng mã quản lý" in FUNCTION_1
    assert "nhomDangChoDiThau" in FUNCTION_1
    assert "so_luong_ma_quan_ly" in PATCH_Q
    assert ".eq(\"da_di_thau\", false)" in FUNCTION_1
    assert "ĐVSD chọn ĐVT để chốt tổng cho lần đề xuất này." in FUNCTION_1
    assert "heSoTheoDvt" in FUNCTION_1
    assert "dsDvtNhom.map" in FUNCTION_1
    assert "cap_nhat_quy_doi_ma_quan_ly" not in FUNCTION_1
    assert "ĐVT chuẩn hoặc hệ số quy đổi của mã quản lý không hợp lệ." in PATCH_Q
    assert "Tổng phân bổ sau quy đổi không bằng tổng của mã quản lý." in PATCH_Q


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
    # (Bỏ) aria-label="Loại hồ sơ": nút chuyển Word/Excel đã biến mất từ
    # 07/08/2026 khi Excel danh mục tách sang tab riêng — giờ chỉ còn Word,
    # không còn gì để chuyển. Thay bằng ràng buộc thật sự của test này:
    # mỗi lần bấm + phải sinh một nguon_key MỚI, không ghi đè bộ cũ.
    assert "taoBoHoSoMoi" in XUAT_HO_SO_KHOA
    assert "setNguonDangMo(data.nguon_key)" in XUAT_HO_SO_KHOA
    assert "hoSoTheoLoai.map" in XUAT_HO_SO_KHOA
    assert "nguonKey={nguonDangMo}" in XUAT_HO_SO_KHOA
