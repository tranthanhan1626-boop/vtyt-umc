import sys
sys.path.insert(0, "..")
sys.path.insert(0, ".")

from pydantic import ValidationError
from app.schemas.proposal import ProposalIn, ProposalReasonIn


def proposal(**overrides):
    data = {
        "ma_hang": "66114",
        "don_vi": "Khoa A",
        "nam_de_xuat": 2027,
        "so_luong": 100,
        "loai_mua_sam": "mua_sam_bo_sung",
        "tu_thang": 1,
        "tu_nam": 2027,
        "den_thang": 12,
        "den_nam": 2027,
        "created_by": "a@umc.edu.vn",
        "reason": ProposalReasonIn(loai_ly_do="theo_lich_su"),
    }
    data.update(overrides)
    return ProposalIn(**data)


def test_ky_thuat_moi_thieu_ten_bi_chan():
    try:
        ProposalReasonIn(loai_ly_do="ky_thuat_moi", ten_ky_thuat_moi=None)
        assert False, "phải raise ValidationError"
    except ValidationError as e:
        assert "ten_ky_thuat_moi" in str(e) or "kỹ thuật mới" in str(e)
        print("OK: ky_thuat_moi thiếu tên -> 422 (ValidationError)")


def test_ky_thuat_moi_co_ten_hop_le():
    r = ProposalReasonIn(
        loai_ly_do="ky_thuat_moi",
        ten_ky_thuat_moi="Nội soi ABC",
        uoc_ca_thang=20,
        ghi_chu="Dự kiến triển khai kỹ thuật mới từ quý 1.",
    )
    assert r.ten_ky_thuat_moi == "Nội soi ABC"
    print("OK: ky_thuat_moi có tên -> hợp lệ")


def test_ly_do_khac_thieu_ghi_chu_bi_chan():
    try:
        ProposalReasonIn(loai_ly_do="khac", ghi_chu=" ")
        assert False, "phải raise ValidationError"
    except ValidationError:
        print("OK: lý do ngoài lịch sử thiếu ghi chú -> bị chặn")


def test_so_luong_khong_duong_bi_chan():
    try:
        proposal(so_luong=0)
        assert False, "phải raise ValidationError"
    except ValidationError:
        print("OK: số lượng không dương -> bị chặn")


def test_ky_nguoc_bi_chan():
    try:
        proposal(tu_thang=12, tu_nam=2027, den_thang=1, den_nam=2027)
        assert False, "phải raise ValidationError"
    except ValidationError:
        print("OK: kỳ kết thúc trước kỳ bắt đầu -> bị chặn")


def test_ky_hop_le_tu_tinh_so_thang():
    p = proposal(tu_thang=10, tu_nam=2027, den_thang=3, den_nam=2028)
    assert p.so_thang_du_kien == 6
    print("OK: kỳ T10/2027-T3/2028 -> tự tính 6 tháng")


def test_snapshot_quy_doi_cap_ma_quan_ly_hop_le():
    p = proposal(
        so_luong_ma_quan_ly=120,
        dvt_ma_quan_ly="Cái",
        he_so_quy_doi=20,
        bang_quy_doi={"Cái": 1, "Hộp": 20},
    )
    assert p.bang_quy_doi == {"Cái": 1, "Hộp": 20}


def test_snapshot_quy_doi_thieu_hoac_dvt_chuan_khac_1_bi_chan():
    for bang in ({"Hộp": 20}, {"Cái": 2, "Hộp": 20}):
        try:
            proposal(
                so_luong_ma_quan_ly=120,
                dvt_ma_quan_ly="Cái",
                he_so_quy_doi=20,
                bang_quy_doi=bang,
            )
            assert False, "phải chặn bảng quy đổi thiếu/sai hệ số ĐVT chuẩn"
        except ValidationError:
            pass


if __name__ == "__main__":
    test_ky_thuat_moi_thieu_ten_bi_chan()
    test_ky_thuat_moi_co_ten_hop_le()
    test_so_luong_khong_duong_bi_chan()
    test_ky_nguoc_bi_chan()
    test_ky_hop_le_tu_tinh_so_thang()
    print("\nTất cả test PASS.")
