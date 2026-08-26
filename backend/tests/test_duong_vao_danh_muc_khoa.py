"""Mọi đường vào Danh mục đề xuất của khoa phải kèm ĐỦ gói con VÀ mã đợt.

Thiếu một trong hai là màn kia tra hụt `dot_goi`, rơi về đường `proposals` cũ và
hiện "0 mã hàng" kèm băng "đợt này chưa đi đường v3" — không báo lỗi gì.

Chủ dự án gặp đúng chỗ này ngày 26/08/2026: mở gói bổ sung bằng dvsd1/dvsd2,
danh mục trống trơn trong khi database có 16 và 11 mã hàng.
"""
from pathlib import Path

import pytest

FE = Path(__file__).resolve().parents[2] / "frontend" / "src"


@pytest.fixture(scope="module")
def f1() -> str:
    return (FE / "features" / "Function1.jsx").read_text(encoding="utf-8")


def test_khong_sinh_duong_dan_thieu_ma_dot(f1: str) -> None:
    """Thà không có nút còn hơn có nút dẫn vào màn rỗng."""
    assert "goiIdDanhMuc && dotDung?.id && (" in f1, \
        "nút mở danh mục phải đòi có dotDung.id"
    assert "Chọn đợt ở ô" in f1, "chưa chọn đợt thì phải NÓI RA, đừng im lặng ẩn nút"


def test_loc_dot_theo_goi_con_dang_dung(f1: str) -> None:
    """Bấm "Tháng 1" là đã nói rõ tháng mốc — đừng mời chọn Tháng 9."""
    assert "thangMocCuaGoiCon" in f1
    assert 'String(d.thang_moc) === thangMocCuaGoiCon' in f1
    assert "{dsDotHopLe.map((d) =>" in f1, "ô chọn đợt phải dùng danh sách ĐÃ LỌC"


def test_con_mot_dot_thi_tu_lay(f1: str) -> None:
    """Bắt chọn trong danh sách một phần tử là bắt thao tác thừa."""
    assert "dsDotHopLe.length > 1" in f1
    assert "(dsDotHopLe[0] ||" in f1


def test_moi_duong_vao_deu_dung_goiConCuaDot() -> None:
    """`bo-sung` là bí danh; `dot_goi.goi_id` thật là bs-t1|t5|t9."""
    for ten in ("DanhMucDeXuatLinks.jsx", "DeXuatCuaToi.jsx",
                "DeXuatTongHop.jsx", "Function1.jsx"):
        src = (FE / "features" / ten).read_text(encoding="utf-8")
        assert "goiConCuaDot" in src, f"{ten} chưa quy chuẩn khoá gói con"


def test_moi_link_danh_muc_deu_kem_dot() -> None:
    """Quét mọi chỗ dựng hash `#danh-muc-de-xuat/` — phải có phần đợt ở cuối."""
    thieu = []
    for f in (FE / "features").glob("*.jsx"):
        src = f.read_text(encoding="utf-8")
        for dong in src.splitlines():
            if "#danh-muc-de-xuat/" not in dong or dong.strip().startswith("//"):
                continue
            # Dạng đúng: .../${khoa}/${dotId} hoặc truyền qua moDanhMucDeXuat(...)
            if "moDanhMucDeXuat(" in dong:
                continue
            if dong.rstrip().endswith("`") and dong.count("${") < 3:
                thieu.append(f"{f.name}: {dong.strip()[:90]}")
    assert not thieu, "link danh mục thiếu mã đợt:\n" + "\n".join(thieu)
