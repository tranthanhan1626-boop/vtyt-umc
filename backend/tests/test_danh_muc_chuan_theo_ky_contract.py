"""Hợp đồng của patch_zzzzzzd — DANH MỤC CHUẨN THEO KỲ (QĐ 27/08/2026).

Test văn bản, không nối DB. Nó canh những điều dễ bị phá nhất khi ai đó viết
lại patch này: ghi nhầm cột số, đọc nhầm nguồn, hoặc gỡ mất cổng chặn.
"""
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATCH = (ROOT / "sql" / "patch_zzzzzzd_danh_muc_chuan_theo_ky.sql").read_text(encoding="utf-8")
FE = ROOT.parent / "frontend" / "src" / "features"
TONG_HOP = (FE / "TongHopPdd.jsx").read_text(encoding="utf-8")
KHOA = (FE / "DanhMucDeXuatKhoa.jsx").read_text(encoding="utf-8")

# Mười lăm cột được phép ghi xuống danh mục chuẩn — thuộc tính của MÃ HÀNG.
COT_CHO_PHEP = [
    "ten_vt_2627", "tskt_2627", "dvt", "ten_tm_2627", "ma_sp", "hang_sx", "nuoc_sx",
    "ma_tt04", "ten_tt04", "his_1599", "his_957",
    "ma_kt", "quy_cach", "co_dinh_276", "phan_nhom_tt14",
]
# Cột TÍNH RA. Ghi đè chúng là hỏng công thức số lượng.
COT_CAM = [
    "sl_de_xuat_2627", "dai_p50_p75", "mua_them_30", "giai_trinh",
    "theo_18t_2024", "theo_18t_2025", "ma_nhom", "ten_nhom_ql",
]


def test_du_15_cot_duoc_phep():
    khoi = PATCH[PATCH.index("create or replace function cot_danh_muc_chuan()"):]
    khoi = khoi[: khoi.index("$$;")]
    for cot in COT_CHO_PHEP:
        assert f"'{cot}'" in khoi, cot


def test_khong_cot_tinh_ra_nao_lot_vao_danh_sach():
    khoi = PATCH[PATCH.index("create or replace function cot_danh_muc_chuan()"):]
    khoi = khoi[: khoi.index("$$;")]
    for cot in COT_CAM:
        assert f"'{cot}'" not in khoi, f"cột tính ra {cot} lọt vào danh mục chuẩn"


def test_check_constraint_chan_o_tang_bang():
    # Không chỉ lọc lúc ghi — bảng phải tự chặn, kể cả khi có ai insert tay.
    assert "constraint danh_muc_chot_ky_cot_hop_le" in PATCH
    assert "check (cot = any (cot_danh_muc_chuan()))" in PATCH


def test_khong_ai_ghi_duoc_tu_client():
    # Chỉ có policy SELECT. Ghi đi qua `day_ky_ve_danh_muc` (security definer).
    assert "for select using ((select auth.role()) = 'authenticated')" in PATCH
    for lenh in ("for insert", "for update", "for delete"):
        assert lenh not in PATCH, f"bảng chốt không được có policy {lenh}"
    assert "enable row level security" in PATCH


def test_rls_goi_ham_mot_lan_cho_ca_cau():
    # Bài học patch_zzzzzm: không bọc trong (select …) thì hàm chạy lại từng dòng.
    assert "(select auth.role())" in PATCH
    assert "using (auth.role()" not in PATCH


def test_thu_tu_la_thoi_diem_CHOT_khong_phai_thoi_gian_hieu_luc():
    # QĐ chủ dự án 27/08: "thầu nào làm sau thì thầu đó xác nhận thông tin
    # chính xác nhất… xét thời gian phát sinh làm thầu".
    assert "order by chot_luc desc" in PATCH
    # `thang_moc` là mốc tháng để đặt nhãn/sắp xếp, KHÔNG phải khoảng hiệu lực.
    assert "thang_moc" not in PATCH


def test_chi_ghi_o_that_su_doi():
    assert "gia_tri_chuan_hien_hanh(o.ma_hang, o.cot)" in PATCH
    assert "is distinct from" in PATCH


def test_doc_dung_scope_co_hau_to_dot():
    # `danh_muc_tong_hop_o.goi_id` mang hậu tố ':dot:N' (Lỗi 24, 19/08/2026).
    assert "':dot:' || v_dot_id::text" in PATCH


def test_view_uu_tien_ban_chot_roi_moi_tut_ve_nen_his():
    assert "coalesce(m.j ->> 'tskt_2627',   v.tieu_chi_ky_thuat) as tskt_2627" in PATCH
    assert "coalesce(m.j ->> 'ten_vt_2627', v.ten_vat_tu)        as ten_vt_2627" in PATCH


def test_view_co_khoi_ky_truoc_cho_sau_cot_2526():
    assert "where hang = 2" in PATCH
    for cot in ("ten_vt_2526", "tskt_2526", "ten_tm_2526",
                "ma_sp_2526", "hang_sx_2526", "nuoc_sx_2526"):
        assert f"as {cot}" in PATCH, cot


def test_hook_nam_trong_chot_trinh_ky_va_khong_sua_cong_chan_nao():
    assert "perform day_ky_ve_danh_muc(p_dot_goi_id);" in PATCH
    # Mọi cổng chặn của bản đang chạy phải còn nguyên trong bản chép lại.
    for cong in (
        "Chỉ Phòng Điều dưỡng được chốt trình ký toàn bộ.",
        "DOT_GOI đã có revision trình ký hiệu lực.",
        "Không có snapshot Q hiệu lực.",
        "Phải hoàn thành đủ ba giai đoạn đấu thầu.",
        "Phân bổ số trúng chưa khớp",
    ):
        assert cong in PATCH, cong


# ── Hai màn phải đọc đúng nguồn mới ────────────────────────────────────────

def test_hai_man_doc_danh_muc_chuan_chu_khong_phai_vat_tu():
    for ten, mn in (("TongHopPdd", TONG_HOP), ("DanhMucDeXuatKhoa", KHOA)):
        assert 'from("v_danh_muc_chuan")' in mn, ten


def test_khong_phan_trang_bang_id_tren_view_gop():
    # Bẫy 26/08/2026: view gộp không có cột `id`, `fetchAllRows` mặc định
    # `order: "id"` làm chết cả màn.
    for ten, mn in (("TongHopPdd", TONG_HOP), ("DanhMucDeXuatKhoa", KHOA)):
        khoi = mn[mn.index('from("v_danh_muc_chuan")'):]
        khoi = khoi[: khoi.index("});")]
        assert 'order: "ma_hang"' in khoi, ten
        assert 'order: "id"' not in khoi, ten


def test_select_xin_du_moi_cot_cho_ve():
    # Bài học 26/08: thiếu một cột trong `.select()` là sai LẶNG LẼ.
    khoi = TONG_HOP[TONG_HOP.index('from("v_danh_muc_chuan")'):]
    khoi = khoi[: khoi.index("});")]
    for cot in COT_CHO_PHEP + ["ma_hang", "ma_quan_ly"]:
        assert cot in khoi, f"TongHopPdd quên xin cột {cot}"


def test_man_khoa_xin_ca_khoi_ky_truoc():
    khoi = KHOA[KHOA.index('from("v_danh_muc_chuan")'):]
    khoi = khoi[: khoi.index("});")]
    for cot in ("ten_vt_2526", "tskt_2526", "ten_tm_2526",
                "ma_sp_2526", "hang_sx_2526", "nuoc_sx_2526"):
        assert cot in khoi, f"màn khoa quên xin cột kỳ trước {cot}"


def test_row_khong_con_doc_ten_cot_cu_cua_vat_tu():
    # `row` dựng từng field một, không spread — đọc tên cột cũ là ra undefined
    # rồi hiện "NaN"/trống mà không lỗi (bài học 26/08).
    for ten, mn in (("TongHopPdd", TONG_HOP), ("DanhMucDeXuatKhoa", KHOA)):
        for cu in ("vt.tieu_chi_ky_thuat", "vt.ten_thuong_mai",
                   "vt.ky_ma_hieu", "vt.nuoc_san_xuat"):
            assert cu not in mn, f"{ten} còn đọc tên cột cũ {cu}"


def test_tam_cot_cu_khong_con_bi_ep_null():
    assert "COT_TU_DANH_MUC_CHUAN.forEach((k) => { row[k] = vt[k] ?? null; });" in TONG_HOP
    assert "COT_TU_DANH_MUC_CHUAN_KHOA.forEach((k) => { row[k] = vt[k] ?? null; });" in KHOA


def test_ba_cot_that_su_chua_co_nguon_van_de_trong_khong_bia():
    khoi = KHOA[KHOA.index("const NGUON_KHONG_CO_KHOA = new Set(["):]
    khoi = khoi[: khoi.index("]);")]
    for cot in ("ma_his_2023", "ly_do_rot_2025", "ly_do_rot_ct"):
        assert f'"{cot}"' in khoi, cot
    # Sáu cột 2526 đã có nguồn — không được nằm trong danh sách "để trống" nữa.
    for cot in ("tskt_2526", "ten_vt_2526"):
        assert f'"{cot}"' not in khoi, f"{cot} đã có nguồn, đừng ép null"
