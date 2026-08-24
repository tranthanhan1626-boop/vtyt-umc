"""Khẳng định patch_zzzzzh — miếng 1c: nới khoá cứng 2 ở ĐƯỜNG GHI.

Chủ dự án 24/08/2026: cho lưu bản chia còn dở rồi mai làm tiếp.

Nới một trong ba khoá cứng toán học thì phải chứng minh được HAI cổng còn
lại vẫn chặn. Test này là cái chứng minh đó — nó đọc luôn hai patch kia, nên
ai gỡ cổng ở đó sẽ làm đỏ test này chứ không im lặng đi qua.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzzh_noi_khoa_cung_2.sql"
CONG_XAC_NHAN_ROT = GOC / "sql" / "patch_zzzzze_pdd_go_tay_so_trung.sql"
CONG_TRINH_KY = GOC / "sql" / "patch_zzzzzg_chia_tay_ke_ca_phan_nhan.sql"
FE = GOC.parent / "frontend" / "src" / "features"


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists(), "chưa có patch nới khoá cứng 2"
    return PATCH.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def than(sql: str) -> str:
    return sql.split("create or replace function cap_nhat_phan_bo_trung_v3")[-1].split("$$;")[0]


# ── Đường ghi: nới đúng một câu, không nới gì thêm ──────────────────────────

def test_thieu_thi_luu_duoc_du_thi_chan(than: str) -> None:
    assert "if v_tong > v_trung then raise" in than, \
        "miếng 1c: chỉ chặn khi VƯỢT số phải chia"
    assert "v_tong<>v_trung" not in than.replace(" ", ""), \
        "câu chặn cũ (tổng phải bằng đúng) phải biến mất, nếu không nới bằng thừa"


def test_van_giu_ky_vong_la_trung_cong_nhan(than: str) -> None:
    assert "phai_chia into v_trung" in than, \
        "QĐ D15 vẫn hiệu lực: mốc so sánh là trúng + nhận, không phải trúng thuần"


def test_van_bat_ly_do_khi_mot_khoa_vuot_phan_cua_khoa(than: str) -> None:
    assert "fn_nhan_cua_khoa_v3" in than and "vượt Q của khoa phải nhập lý do" in than, \
        "1c chỉ nới khoá TỔNG; luật lý do theo từng khoa giữ nguyên chặn ngay"


def test_van_giu_cac_chan_con_lai(than: str) -> None:
    assert "Chỉ PĐD được phân bổ số trúng" in than
    assert "số nguyên không âm" in than
    assert "đúng các khoa có trong Q" in than
    assert "phan_bo_trung_v3_audit" in than, "mọi lần ghi, kể cả nháp lệch, phải để lại dấu vết"


# ── Hai cổng phải còn sống, nếu không thì không được nới ────────────────────

def test_cong_xac_nhan_rot_van_chan() -> None:
    than = CONG_XAC_NHAN_ROT.read_text(encoding="utf-8")
    than = than.split("create or replace function xac_nhan_rot_v3")[-1].split("$$;")[0]
    assert "not da_khop" in than, \
        "gỡ cổng này thì cả Q bị chuyển tiếp sang đợt bổ sung (con_lai = q_khoa − so_luong_trung)"
    assert "chưa chia hết số trúng về khoa" in than


def test_cong_chot_trinh_ky_van_chan() -> None:
    than = CONG_TRINH_KY.read_text(encoding="utf-8")
    than = than.split("create or replace function chot_trinh_ky_toan_bo_v3")[-1].split("$$;")[0]
    assert "v_phan_bo_trung_theo_ma_v3" in than and "not m.da_khop" in than, \
        "cổng cuối trước khi số lên giấy trình ký — nới đường ghi mà gỡ cổng này là ra số sai"
    assert "Phân bổ số trúng chưa khớp" in than


# ── Giao diện phải nới theo, nếu không nới server là vô hình ────────────────

def test_giao_dien_cho_luu_ban_thieu() -> None:
    src = (FE / "CumThauTongHop.jsx").read_text(encoding="utf-8")
    than = src.split("export function BangSoTrungTheoKhoa")[-1]
    assert "disabled={dangLuu || lech < 0}" in than, \
        "nút phải bật khi còn THIẾU (lech > 0) và chỉ tắt khi DƯ (lech < 0)"
    assert "lech !== 0" not in than, "điều kiện tắt nút cũ phải biến mất"
