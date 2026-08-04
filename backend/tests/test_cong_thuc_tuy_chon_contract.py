from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONG_THUC = (ROOT / "frontend/src/lib/congThucSoLuong.js").read_text()
GOI_Y = (ROOT / "frontend/src/features/GoiYSoLuong.jsx").read_text()
FUNCTION_1 = (ROOT / "frontend/src/features/Function1.jsx").read_text()
HUONG_DAN = (ROOT / "Tổng quan/02_CONG_THUC_SO_LUONG.md").read_text()
QUYET_DINH = (ROOT / "Tổng quan/01_NGHIEP_VU_VA_QUYET_DINH.md").read_text()


def test_dai_thong_thuong_la_p50_p75_va_mac_dinh_p75():
    assert 'export const MUC_MAC_DINH = "P75"' in CONG_THUC
    assert "den: kq.muc.P75" in CONG_THUC
    assert "so > kq.muc.P75" in CONG_THUC
    assert "den: kq.muc.P95" not in CONG_THUC


def test_p90_p95_la_muc_cao_can_giai_trinh():
    assert 'nhan: "P90 mức cao"' in CONG_THUC
    assert 'nhan: "P95 ngoại lệ"' in CONG_THUC
    assert "Dải thông thường P50–P75" in GOI_Y
    assert "bắt buộc ghi rõ căn cứ" in GOI_Y


def test_tuy_chon_30_la_tran_khong_tu_dong_mua():
    assert "không tự động mua" in GOI_Y
    assert "Trần tùy chọn 30%" in FUNCTION_1
    assert "không tự động cộng vào số mua" in FUNCTION_1


def test_p50_khong_nhan_lai_tang_truong_cua_hai_cua_so():
    assert "export function mucDuBaoTsb" in CONG_THUC
    assert "const TSB_ALPHA = 0.30" in CONG_THUC
    assert 'phuongPhap: "TSB"' in CONG_THUC
    assert "const heSoTang = 1" in CONG_THUC
    assert "const muDuBao = ch.mu" in CONG_THUC
    assert "Math.pow(1 + ch.tangTruong" not in CONG_THUC
    assert "(chỉ cảnh báo)" in GOI_Y


def test_huong_dan_khop_cong_thuc_production_qd34():
    assert "TSB dùng `α = 0,30`" in HUONG_DAN
    assert "24 tháng liên tục gần nhất" in HUONG_DAN
    assert "Dải thông thường: **P50–P75**" in HUONG_DAN
    assert "Mặc định: **P75**" in HUONG_DAN
    assert "Phần 30% không tự mua" in HUONG_DAN
    assert "## 7. Tùy chọn mua thêm 30%" in QUYET_DINH
