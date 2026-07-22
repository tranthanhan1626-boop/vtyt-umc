import sys
sys.path.insert(0, "..")
sys.path.insert(0, ".")

from pydantic import ValidationError
from app.schemas.proposal import ProposalIn, ProposalReasonIn


def full_year(value=100):
    return {str(m): value for m in range(1, 13)}


def test_ky_thuat_moi_thieu_ten_bi_chan():
    try:
        ProposalReasonIn(loai_ly_do="ky_thuat_moi", ten_ky_thuat_moi=None)
        assert False, "phải raise ValidationError"
    except ValidationError as e:
        assert "ten_ky_thuat_moi" in str(e) or "kỹ thuật mới" in str(e)
        print("OK: ky_thuat_moi thiếu tên -> 422 (ValidationError)")


def test_ky_thuat_moi_co_ten_hop_le():
    r = ProposalReasonIn(loai_ly_do="ky_thuat_moi", ten_ky_thuat_moi="Nội soi ABC", uoc_ca_thang=20)
    assert r.ten_ky_thuat_moi == "Nội soi ABC"
    print("OK: ky_thuat_moi có tên -> hợp lệ")


def test_thieu_thang_bi_chan():
    data = full_year()
    del data["12"]
    try:
        ProposalIn(
            ma_hang="66114", don_vi="Khoa A", nam_de_xuat=2027,
            so_luong_thang=data, created_by="a@umc.edu.vn",
            reason=ProposalReasonIn(loai_ly_do="theo_lich_su"),
        )
        assert False, "phải raise ValidationError"
    except ValidationError:
        print("OK: thiếu tháng 12 -> bị chặn")


def test_du_12_thang_hop_le():
    p = ProposalIn(
        ma_hang="66114", don_vi="Khoa A", nam_de_xuat=2027,
        so_luong_thang=full_year(), created_by="a@umc.edu.vn",
        reason=ProposalReasonIn(loai_ly_do="theo_lich_su"),
    )
    assert len(p.so_luong_thang) == 12
    print("OK: đủ 12 tháng -> hợp lệ")


if __name__ == "__main__":
    test_ky_thuat_moi_thieu_ten_bi_chan()
    test_ky_thuat_moi_co_ten_hop_le()
    test_thieu_thang_bi_chan()
    test_du_12_thang_hop_le()
    print("\nTất cả test PASS.")
