from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH_X = (
    ROOT / "backend/sql/patch_x_quyen_khoa_va_ho_so_theo_gio.sql"
).read_text()
DE_XUAT_KHOA = (ROOT / "frontend/src/features/DeXuatCuaToi.jsx").read_text()
DE_XUAT_PDD = (ROOT / "frontend/src/features/DeXuatTongHop.jsx").read_text()
XUAT_HO_SO = (ROOT / "frontend/src/features/XuatHoSo.jsx").read_text()
HO_SO = (ROOT / "frontend/src/features/HoSoTrucTuyen.jsx").read_text()
FUNCTION_1 = (ROOT / "frontend/src/features/Function1.jsx").read_text()


def test_rut_de_xuat_phan_quyen_theo_khoa_khong_theo_email_nguoi_tao():
    assert "p.don_vi is distinct from v_khoa" in PATCH_X
    assert "p.created_by is distinct from v_email" not in PATCH_X
    assert "g.don_vi === profile.khoa" in DE_XUAT_KHOA
    assert "Chỉ account đã tạo hồ sơ này mới được rút." not in DE_XUAT_KHOA


def test_the_gio_co_nut_word_cam_ket_va_link_excel_danh_muc():
    """Thẻ giỏ (màn khoa và màn PĐD) phải mở được cả Word cam kết lẫn Excel
    danh mục.

    ĐỔI 08/08/2026, hai lần:
      1. Excel danh mục KHÔNG còn là tài liệu trong bộ hồ sơ (chốt 07/08) nên
         nút cũ `onMoHoSo("danh_muc_dvsd")` mở ra một hồ sơ không bao giờ tồn
         tại. Giờ là link sang tab riêng `#danh-muc-de-xuat/...`.
      2. Không còn chờ `hoan_thanh`: gửi giỏ là mở được cam kết luôn
         (patch_zq) — nên KHÔNG được khoá nút sau trạng thái đó nữa.
    """
    for source in (DE_XUAT_KHOA, DE_XUAT_PDD):
        assert "cam_ket_sl" in source
        assert "#danh-muc-de-xuat/" in source
        assert 'trangThai === "hoan_thanh" && goi !== "chi_dinh_thau"' not in source, (
            "patch_zq: không được chặn nút cam kết theo trạng thái duyệt nữa"
        )

    # Chỉ soi màn khoa cho nút Excel chết: màn PĐD vẫn dùng hợp lệ mã hồ sơ
    # `danh_muc_dvsd` cho chức năng GỘP Excel nhiều giỏ (nguon_key "gop:...",
    # RPC gop_excel_danh_muc_de_xuat) — cái đó là hồ sơ có thật, đừng cấm nhầm.
    assert 'maHoSo: "danh_muc_dvsd"' not in DE_XUAT_KHOA, (
        "nút Excel cũ trên thẻ giỏ mở một hồ sơ không bao giờ tồn tại — "
        "phải là link sang tab Danh mục đề xuất"
    )


def test_bo_ho_so_neo_dung_gio_va_tao_nguyen_tu_hai_file():
    assert "tao_ho_so_tu_gio_da_duyet" in PATCH_X
    assert "'gio:' || p_nhom::text" in PATCH_X
    assert "array_agg(p.id order by p.id)" in PATCH_X
    assert "v_doc_ids is distinct from v_source_ids" in PATCH_X
    assert "Word cam kết và Excel danh mục" in PATCH_X
    assert 'supabase.rpc("tao_ho_so_tu_gio_da_duyet"' in XUAT_HO_SO
    assert "rowsDangMo" in XUAT_HO_SO


def test_pdd_duoc_sua_truc_tiep_va_van_ghi_revision():
    assert "pddCoTheSua" in HO_SO
    assert 'luu("pdd_sua")' in HO_SO
    assert "ho_so_cong_tac_lich_su" in PATCH_X


def test_ma_da_gui_an_den_khi_pdd_chot_da_di_thau():
    assert "maDangChoDiThau" in FUNCTION_1
    assert '.eq("da_di_thau", false)' in FUNCTION_1
    assert "!maDangChoDiThau.has(m.ma_hang)" in FUNCTION_1
    assert "add column if not exists da_di_thau" in PATCH_X
    assert "chot_danh_muc_da_di_thau" in PATCH_X


def test_gop_excel_nhieu_gio_va_khoa_bat_bien():
    assert "gop_excel_danh_muc_de_xuat" in PATCH_X
    assert "'gop:' || gen_random_uuid()" in PATCH_X
    assert "fn_khoa_danh_muc_da_di_thau" in PATCH_X
    assert "'di_thau'" in PATCH_X
    assert "danh_muc_di_thau_id" in PATCH_X
    assert "Chọn đã đi thầu" in HO_SO
