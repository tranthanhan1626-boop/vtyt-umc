"""Hàm làm sạch của `nap_de_xuat_ky_truoc.py` (QĐ 18/09/2026 mục p).

Không đụng DB, không đọc `de_xuat.xlsx` — chỉ kiểm các luật làm sạch đã chốt.
"""
import sys
from decimal import Decimal
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC / "scripts"))

from nap_de_xuat_ky_truoc import (  # noqa: E402
    BO_THEO_CHOT, chuan_hoa_ma, chuan_hoa_qd, chuan_hoa_so, ghep_ten_khoa, lam_sach,
)

DS_KHOA = [
    "Khoa Chấn thương chỉnh hình",
    "Khoa Ngoại thần kinh",
    "Khoa Lồng ngực mạch máu",
    "Khoa GMHS - Phòng mổ",
    "Khoa GMHS - Phòng mổ tim",
    "Đơn nguyên GMHS Sản phụ - Phòng mổ",
    "Khoa Phẫu thuật tim mạch",
]


def test_qd_doi_eth_sang_d_viet():
    assert chuan_hoa_qd("3455/QÐ-BVÐHYD") == "3455/QĐ-BVĐHYD"
    assert "Ð" not in chuan_hoa_qd(" 1599/QÐ-BVÐHYD ")


def test_ma_hang_ve_text_va_cat_xuong_dong():
    assert chuan_hoa_ma(62717) == "62717"
    assert chuan_hoa_ma("63631\n\n") == "63631"
    assert chuan_hoa_ma("\n68693") == "68693"
    assert chuan_hoa_ma(62717) == chuan_hoa_ma("62717")
    assert chuan_hoa_ma("00123") == "00123"  # không mất số 0 đầu
    assert chuan_hoa_ma(None) is None
    assert chuan_hoa_ma("  ") is None


def test_so_luong_sua_nbsp_va_giu_so_le():
    assert chuan_hoa_so("5\xa0") == Decimal(5)
    assert chuan_hoa_so(1728) == Decimal(1728)
    assert chuan_hoa_so(0.96) == Decimal("0.96")
    assert chuan_hoa_so("abc") is None
    assert chuan_hoa_so(None) is None


def test_ghep_ten_hoa_ve_khoa_that():
    assert ghep_ten_khoa("KHOA CHẤN THƯƠNG CHỈNH HÌNH", DS_KHOA) == ("Khoa Chấn thương chỉnh hình", "ghep")
    assert ghep_ten_khoa("KHOA NGOẠI THẦN KINH", DS_KHOA) == ("Khoa Ngoại thần kinh", "ghep")
    assert ghep_ten_khoa("KHOA LỒNG NGỰC MẠCH MÁU", DS_KHOA) == ("Khoa Lồng ngực mạch máu", "ghep")
    assert ghep_ten_khoa("Khoa Phẫu thuật tim mạch", DS_KHOA) == ("Khoa Phẫu thuật tim mạch", "khop")


def test_ten_khong_chac_thi_bo_khong_doan():
    # Tên lạ không có ghép tay thì bỏ, không đoán. ("Phòng mổ 2A" nay có ghép
    # tay theo QĐ 18/09/2026 — xem test_ghep_tay_phong_mo_2a.)
    assert ghep_ten_khoa("KHOA GMHS (PHÒNG MỔ 9Z)", DS_KHOA) == (None, "khong_khop")


def test_nam_don_vi_chot_bo():
    assert BO_THEO_CHOT == {
        "Cơ sở 2", "Cơ sở 3", "Khoa GMHS - Hồi tỉnh", "Khoa Tuyến vú", "Đơn vị Hình ảnh tim mạch",
    }
    for ten in BO_THEO_CHOT:
        # bỏ kể cả khi DB có tên đó
        assert ghep_ten_khoa(ten, DS_KHOA + [ten]) == (None, "bo_theo_chot")


def test_lam_sach_ca_dong_va_bao_cao():
    tho = [
        (2, "Khoa Phẫu thuật tim mạch", "3455/QÐ-BVÐHYD", 62911, 1728),
        (3, "Khoa Phẫu thuật tim mạch", "1599/QÐ-BVÐHYD", "62911\n", 12.5),
        (4, "KHOA NGOẠI THẦN KINH", "3309/QÐ-BVÐHYD", "74985", 500),
        (5, "Cơ sở 2", "1599/QÐ-BVÐHYD", 1, 1),
        (6, "KHOA GMHS (PHÒNG MỔ 2A)", "3309/QÐ-BVÐHYD", "74982", 13000),
        (7, "Khoa Phẫu thuật tim mạch", "1599/QÐ-BVÐHYD", 63000, "5\xa0"),
        (8, None, None, None, None),  # dòng trống cuối file
    ]
    sach, bc = lam_sach(tho, DS_KHOA)
    assert bc.tong_dong == 6
    assert bc.giu == 5
    assert bc.bo == {"bo_theo_chot": 1}
    assert bc.ghep == {"KHOA NGOẠI THẦN KINH": "Khoa Ngoại thần kinh",
                       "KHOA GMHS (PHÒNG MỔ 2A)": "Khoa GMHS - Phòng mổ"}
    assert bc.so_le == 1
    assert bc.ma_co_khoang_trang == 1
    assert [(d, g) for d, g, _ in bc.so_sua] == [(7, "5\xa0")]
    assert bc.trung == []
    assert all("Ð" not in r["so_quyet_dinh"] for r in sach)
    assert all(isinstance(r["ma_hang"], str) for r in sach)


def test_trung_khoa_ma_qd_bi_bat():
    tho = [
        (2, "Khoa Phẫu thuật tim mạch", "3455/QÐ-BVÐHYD", 62911, 1),
        (3, "Khoa Phẫu thuật tim mạch", "3455/QĐ-BVĐHYD", "62911 ", 2),
    ]
    _, bc = lam_sach(tho, DS_KHOA)
    assert bc.trung == [("Khoa Phẫu thuật tim mạch", "62911", "3455/QĐ-BVĐHYD", [2, 3])]


def test_patch_rls_boc_select_va_khong_co_policy_ghi():
    sql = (GOC / "sql" / "patch_zzzzzzzg_de_xuat_ky_truoc.sql").read_text(encoding="utf-8")
    assert "(select current_user_role())" in sql
    assert "khoa = (select current_user_khoa())" in sql
    assert "security_invoker = true" in sql
    low = sql.lower()
    for lenh in ("for insert", "for update", "for delete", "for all"):
        assert lenh not in low
    assert "unique (khoa, ma_hang, so_quyet_dinh)" in sql


def test_ghep_tay_phong_mo_2a():
    from scripts.nap_de_xuat_ky_truoc import ghep_ten_khoa
    ds = ["Khoa GMHS - Phòng mổ", "Khoa GMHS - Phòng mổ tim"]
    assert ghep_ten_khoa("KHOA GMHS (PHÒNG MỔ 2A)", ds) == ("Khoa GMHS - Phòng mổ", "ghep")
    # Đích không có trên DB thì không ghép bừa.
    assert ghep_ten_khoa("KHOA GMHS (PHÒNG MỔ 2A)", ["Khoa khác"])[0] is None
