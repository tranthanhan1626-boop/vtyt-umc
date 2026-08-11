"""Hợp đồng QĐ workflow theo từng kỳ/đợt thật.

Không để một loại gói (đặc biệt 18 tháng) trở thành khóa dữ liệu: một loại có
thể có nhiều kỳ kế tiếp nhau, còn bổ sung T1/T5/T9 phải độc lập tuyệt đối.
"""
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PATCH = (ROOT / "backend/sql/patch_zz_tach_ky_goi_va_thong_bao_rot.sql").read_text()
FUNCTION_1 = (ROOT / "frontend/src/features/Function1.jsx").read_text()
DANH_MUC = (ROOT / "frontend/src/features/DanhMucDeXuatKhoa.jsx").read_text()
LINKS = (ROOT / "frontend/src/features/DanhMucDeXuatLinks.jsx").read_text()
TONG_HOP = (ROOT / "frontend/src/features/TongHopPdd.jsx").read_text()


def test_chot_va_quyen_mua_them_bam_dung_dot():
    assert "create table if not exists danh_muc_dot_chot" in PATCH
    assert "c.dot_id = v_proposal.dot_id" in PATCH
    assert "PĐD chưa chốt danh mục đi thầu của đúng gói/đợt này" in PATCH
    assert "trang_thai <> 'hoan_thanh'" not in PATCH


def test_ma_dang_trong_gio_chi_chan_cung_dot():
    assert 'q = q.eq("dot_id", dotDung.id)' in FUNCTION_1
    assert 'q = q.neq("dot_id", dotDung.id)' not in FUNCTION_1


def test_danh_muc_va_tong_hop_nhan_dot_id():
    assert "dotId = null" in DANH_MUC
    assert 'q = q.eq("dot_id", Number(dotId))' in DANH_MUC
    assert "dotId = null" in TONG_HOP
    assert "goiScope" in TONG_HOP
    assert "danh_muc_dot_chot" in TONG_HOP


def test_tab_khoa_co_lich_su_va_badge_rot_theo_dot():
    assert "ho_so_cong_tac" in LINKS
    assert "soRot" in LINKS
    assert "danh-muc-de-xuat/${x.goiId}" in LINKS
    assert "x.dot.id" in LINKS
