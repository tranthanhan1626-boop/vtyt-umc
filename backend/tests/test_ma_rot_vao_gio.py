"""Khẳng định QĐ 26/08/2026 — mã rớt đi vào GIỎ, không tự thành đề xuất.

Đảo lại QĐ 21/08/2026. Lý do: số lượng mua kỳ tới là chữ ký của khoa, không
phải phép trừ của máy. Không mất số vì `chuyen_tiep_rot_v3` vẫn ghi đủ.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
P_GIO = GOC / "sql" / "patch_zzzzzx_ma_rot_vao_gio.sql"
P_DU = GOC / "sql" / "patch_zzzzzy_gio_rot_du_truong.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql_gio() -> str:
    assert P_GIO.exists()
    return P_GIO.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def sql_du() -> str:
    assert P_DU.exists()
    return P_DU.read_text(encoding="utf-8")


def than_ham(sql: str) -> str:
    return sql.split("function xac_nhan_rot_v3")[1].split("$$;")[0]


def test_khong_con_tu_tao_de_xuat(sql_du: str) -> None:
    than = than_ham(sql_du)
    assert "insert into proposals" not in than, \
        "QĐ 26/08: hệ KHÔNG được tự ký đề xuất thay khoa"
    assert "insert into gio_nhap" in than, "phần rớt phải vào giỏ của khoa"


def test_giu_so_cai_de_khong_bao_gio_mat_so(sql_du: str) -> None:
    than = than_ham(sql_du)
    assert "insert into chuyen_tiep_rot_v3" in than, \
        "sổ cái vẫn phải ghi đủ — đây mới là chỗ chống mất số, không phải proposals"
    assert "proposal_id, created_by)" in than and "p_giai_doan, v_bs, null" in than, \
        "không còn proposal để neo, cột proposal_id phải là null"


def test_cong_don_khong_ghi_de(sql_du: str) -> None:
    than = than_ham(sql_du)
    assert "coalesce(v_dang_co, 0) + r.con_lai" in than, \
        "QĐ D11: mã khoa đã tự gõ thì CỘNG THÊM phần rớt, không ghi đè"
    assert "gio_nhap.noi_dung || excluded.noi_dung" in than, \
        "upsert phải trộn vào giỏ sẵn có, không thay cả giỏ"


def test_muc_gio_du_danh_tinh_man_gio_can(sql_du: str) -> None:
    """Màn giỏ đọc `Object.values(nhapLieu)` rồi lấy `n.ma_hang` — thiếu là dòng
    trống và gửi lên `ma_hang: undefined` (xem BẪY trong 06_DUNG_LAM_LAI)."""
    than = than_ham(sql_du)
    for truong in ("'ma_hang'", "'ten_vat_tu'", "'dvt'", "'ma_quan_ly'",
                   "'ten_quan_ly'", "'goi'", "'soLuong'", "'loaiLyDo'"):
        assert truong in than, f"mục giỏ thiếu {truong}"
    assert "'tuMaRot', true" in than, "cần cờ để màn giỏ đánh dấu mã do rớt đưa về"


def test_view_nhac_chi_dem_phan_chua_gui(sql_gio: str) -> None:
    khoi = sql_gio.split("create view v_ma_rot_trong_gio_v3")[1]
    assert "security_invoker = true" in khoi, \
        "khoa chỉ được thấy dòng của khoa mình — đừng viết lại luật quyền trong view"
    assert "not exists (" in khoi and "from proposals p" in khoi, \
        "đã gửi giỏ (có proposal hiện hành) thì thôi nhắc"
    assert "p.is_current" in khoi


def test_ban_dieu_hanh_nhac_nhung_khong_gui_thay_khoa() -> None:
    man = (FE / "BanDieuHanhPdd.jsx").read_text(encoding="utf-8")
    assert "v_ma_rot_trong_gio_v3" in man, "Bàn điều hành phải đọc sổ nhắc"
    assert "mã rớt nằm trong giỏ" in man
    assert "không gửi thay khoa" in man, "phải nói rõ trên màn"
    assert "submit_proposal_group" not in man, \
        "Bàn điều hành TUYỆT ĐỐI không được có đường gửi giỏ hộ khoa"


def test_man_gio_khoa_danh_dau_ma_do_rot_dua_ve() -> None:
    man = (FE / "Function1.jsx").read_text(encoding="utf-8")
    assert "n.tuMaRot" in man, "dòng giỏ do rớt đưa về phải có nhãn riêng"
    assert "rớt thầu" in man and "gợi ý" in man, \
        "phải nói rõ số đang hiện là GỢI Ý, không phải số khoa đã quyết"
