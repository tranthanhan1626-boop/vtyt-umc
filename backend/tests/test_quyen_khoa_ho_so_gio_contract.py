from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH_X = (
    ROOT / "backend/sql/patch_x_quyen_khoa_va_ho_so_theo_gio.sql"
).read_text()
DE_XUAT_KHOA = (ROOT / "frontend/src/features/DeXuatCuaToi.jsx").read_text()
DE_XUAT_PDD = (ROOT / "frontend/src/features/DeXuatTongHop.jsx").read_text()
FUNCTION_1 = (ROOT / "frontend/src/features/Function1.jsx").read_text()


def test_rut_de_xuat_phan_quyen_theo_khoa_khong_theo_email_nguoi_tao():
    assert "p.don_vi is distinct from v_khoa" in PATCH_X
    assert "p.created_by is distinct from v_email" not in PATCH_X
    assert "g.don_vi === profile.khoa" in DE_XUAT_KHOA
    assert "Chỉ account đã tạo hồ sơ này mới được rút." not in DE_XUAT_KHOA


def test_the_gio_khong_con_word_cam_ket_chi_con_link_excel_danh_muc():
    """ĐẢO 25/08/2026 — Word cam kết và Phiếu đề nghị mua bị BỎ HẲN.

    Danh mục đề xuất của khoa đã xác nhận CHÍNH LÀ bộ hồ sơ. Bản trước của test
    này bắt buộc phải CÓ nút cam kết; giữ nguyên thì nó khoá luôn quyết định gỡ.

    Nghiệm thu độc lập 26/08 bắt được đúng chỗ đau: nút vẫn còn trên màn khoa
    (19 nút) nhưng `App.jsx` không truyền `onMoHoSo` nên bấm **chết câm** —
    `npm run build` không bắt được loại lỗi này, chỉ người bấm mới thấy.
    """
    for source in (DE_XUAT_KHOA, DE_XUAT_PDD):
        assert "cam_ket_sl" not in source, "Word cam kết đã bỏ, không được còn nút"
        assert "#danh-muc-de-xuat/" in source, "đường vào bộ hồ sơ thật phải còn"

    assert "onMoHoSo" not in DE_XUAT_KHOA, (
        "bỏ nút thì bỏ luôn prop — để lại là mời người sau gắn nút chết câm khác"
    )
    assert 'maHoSo: "danh_muc_dvsd"' not in DE_XUAT_KHOA
    # Soi TRUY VẤN thật, không soi chữ: chú thích "(Gỡ 25/08) từng đọc
    # phieu_de_nghi ở đây" là thứ nên giữ, nó giải thích chỗ trống.
    for goi_ham in ('from("phieu_de_nghi")', 'from("bieu_mau")', 'href={`?phieu='):
        assert goi_ham not in DE_XUAT_PDD, (
            f"{goi_ham} thuộc tính năng đã bỏ; App.jsx cũng đã gỡ handler ?phieu= "
            "nên giữ lại chỉ còn là nút bấm chết câm"
        )


def test_ma_da_gui_an_den_khi_pdd_chot_da_di_thau():
    assert "maDangChoDiThau" in FUNCTION_1
    assert '.eq("da_di_thau", false)' in FUNCTION_1
    assert "!maDangChoDiThau.has(m.ma_hang)" in FUNCTION_1
    assert "add column if not exists da_di_thau" in PATCH_X
    assert "chot_danh_muc_da_di_thau" in PATCH_X


