from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DON = (ROOT / "sql" / "patch_zzzzk_v3_don_dot_kiem_thu.sql").read_text(encoding="utf-8")
GAC = (ROOT / "sql" / "patch_zzzzl_v3_gac_pham_vi_dot_goi.sql").read_text(encoding="utf-8")

# Mọi bảng V3 có khoá ngoại trỏ về proposals/dot_goi/chot_q_phien đều phải bị
# dọn trước khi `xoa_du_lieu_kiem_thu` xoá proposals, nếu không nút "Xóa đợt"
# chết vì phan_bo_khoa_proposal_id_fkey.
BANG_V3_PHAI_DON = (
    "tuy_chon_mua_them_30_v3", "chot_trinh_ky_dong_v3", "chot_trinh_ky_v3_audit",
    "chot_trinh_ky_phien_v3", "chot_trinh_ky_khoa_v3_audit", "chot_trinh_ky_khoa_v3",
    "xu_ly_gio_rot_v3_audit", "xu_ly_gio_rot_v3", "phan_bo_trung_v3_audit",
    "phan_bo_trung_v3", "ket_qua_rot_v3_audit", "ket_qua_rot_v3",
    "giai_doan_thau_v3_audit", "giai_doan_thau_v3", "chot_q_dong", "chot_q_audit",
    "chot_q_phien", "danh_muc_khoa_chot", "danh_muc_khoa_chot_audit",
    "phan_bo_khoa_audit", "phan_bo_khoa",
)


def test_don_dot_xoa_het_bang_v3():
    for bang in BANG_V3_PHAI_DON:
        assert f"delete from {bang} where" in DON, bang


def test_phan_bo_khoa_bi_xoa_truoc_khi_goi_ham_cu():
    # Thứ tự là toàn bộ vấn đề: gọi xoa_du_lieu_kiem_thu trước khi dọn
    # phan_bo_khoa thì vỡ khoá ngoại đúng như lỗi gốc.
    # Tìm LỜI GỌI thật (`('dot_de_xuat', p_...`), không phải dòng chú thích
    # ở đầu file vốn cũng nhắc tới tên hàm.
    assert DON.index("delete from phan_bo_khoa where") < DON.index(
        "xoa_du_lieu_kiem_thu('dot_de_xuat', p_")


def test_hai_duong_don_dung_chung_mot_ham():
    assert DON.count("perform xoa_du_lieu_v3_cua_dot(") == 2
    assert "create or replace function xoa_dot_kiem_thu_v3" in DON
    assert "create or replace function xoa_dot_smoke_v3" in DON


def test_don_smoke_van_giu_dieu_kien_ten_dot():
    assert "v_ten not like 'SMOKE V3 %'" in DON
    assert "p_xac_nhan <> 'XOA-SMOKE-V3'" in DON


def test_ham_don_v3_khong_cap_cho_authenticated():
    # Chỉ hai hàm bọc mới kiểm vai trò + chuỗi xác nhận; hàm dọn trần không
    # được gọi thẳng từ client.
    assert ("revoke execute on function xoa_du_lieu_v3_cua_dot(bigint) "
            "from public, anon, authenticated") in DON
    assert "grant execute on function xoa_dot_kiem_thu_v3(bigint, text) to authenticated" in DON


def test_gac_chan_goi_con_dang_dong():
    assert "v_trang_thai <> 'mo'" in GAC
    assert "đang đóng — không nhận thêm đề xuất" in GAC


def test_gac_chan_khoa_khong_tham_gia():
    assert "from dot_goi_khoa" in GAC
    assert "v_tham_gia is distinct from true" in GAC
    assert "không nằm trong danh sách tham gia" in GAC


def test_gac_bo_qua_dong_chua_co_dot_goi():
    assert "if new.dot_goi_id is null then" in GAC
    assert "return new;" in GAC


def test_gac_phai_bat_ca_update_vi_submit_chen_truoc_roi_moi_set_dot_id():
    # submit_proposal_group_v2 INSERT trước rồi mới UPDATE dot_id (patch_zzzzh),
    # nên trigger chỉ-INSERT không bao giờ nhìn thấy dot_goi_id.
    assert ("before insert or update of dot_id, dot_goi_id, loai_mua_sam, goi "
            "on proposals") in GAC


def test_gac_chay_sau_trigger_gan_dot_goi():
    # Postgres gọi trigger cùng thời điểm theo thứ tự TÊN.
    assert "trg_z_gac_pham_vi_dot_goi_v3" in GAC
    assert "trg_z_gac_pham_vi_dot_goi_v3" > "trg_gan_dot_goi_proposal_v3"


KHOA_SAU_CHOT = (ROOT / "sql" / "patch_zzzzm_v3_khoa_sau_chot.sql").read_text(encoding="utf-8")


def test_chot_danh_muc_khoa_khoa_luon_duong_gui_them():
    # Giai đoạn 3: "Khi đã chốt, toàn bộ phần khoa được sửa bị khóa ở SERVER".
    # Trước patch này khoa vẫn gửi thêm đề xuất mới được sau khi đã chốt.
    assert "from danh_muc_khoa_chot" in KHOA_SAU_CHOT
    assert "if v_chot_luc is not null then" in KHOA_SAU_CHOT
    assert "đã chốt danh mục gói con" in KHOA_SAU_CHOT


def test_thong_bao_chot_neu_ro_ai_chot_luc_nao():
    # Khoa phải biết liên hệ ai, không chỉ bị chặn trống.
    assert "v_chot_boi" in KHOA_SAU_CHOT
    assert "Asia/Ho_Chi_Minh" in KHOA_SAU_CHOT
    assert "Liên hệ Phòng Điều dưỡng qua Teams" in KHOA_SAU_CHOT


def test_sau_chot_q_khong_them_ma_moi():
    # Invariant 12 + Giai đoạn 6 "khóa phạm vi danh mục mang đi thầu".
    assert "from chot_q_phien where dot_goi_id = new.dot_goi_id and hieu_luc" in KHOA_SAU_CHOT
    assert "phạm vi danh mục đã khoá" in KHOA_SAU_CHOT


def test_van_giu_nguyen_hai_phep_gac_cu():
    # Patch này thay cả hàm nên phải mang theo hai điều kiện của patch_zzzzl.
    assert "v_trang_thai <> 'mo'" in KHOA_SAU_CHOT
    assert "v_tham_gia is distinct from true" in KHOA_SAU_CHOT


MO_LAI_GD = (ROOT / "sql" / "patch_zzzzo_v3_mo_lai_giai_doan.sql").read_text(encoding="utf-8")


def test_mo_lai_giai_doan_chi_vo_hieu_cac_giai_doan_phia_sau():
    # Mục V.1: mở lại "làm kết quả các giai đoạn PHÍA SAU hết hiệu lực".
    # Bản cũ dùng >= nên vô hiệu hoá cả ngoại lệ của chính giai đoạn đang mở
    # lại — tức là xoá đúng thứ PĐD vừa mở ra để sửa.
    assert "thu_tu>=v_row.thu_tu" not in MO_LAI_GD
    assert MO_LAI_GD.count("thu_tu>v_row.thu_tu") >= 3


def test_mo_lai_giai_doan_van_bat_ly_do():
    assert "p_ly_do" in MO_LAI_GD
