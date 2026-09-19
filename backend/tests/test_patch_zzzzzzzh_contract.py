"""Khẳng định patch_zzzzzzzh — "bản cũ" của đề xuất chỉ tính TRONG CÙNG ĐỢT.

Lỗi đo 18/09/2026: khoa GMHS gửi 66509, 67260 ở đợt bổ sung #201 thì hai dòng
cùng mã của đợt 18 tháng #200 (327620, 327625) bị tắt is_current, vì
submit_proposal_group tắt theo (mã, khoa, năm) và mọi đợt 2026 cùng
nam_de_xuat = 2027.

Test đọc text SQL (không chạm DB). Hai hàm trong patch phải là bản gốc trên DB
CHỈ THÊM dòng, không sửa/xoá dòng nào — so với bản nguyên văn trong rollback.
"""
from difflib import ndiff
from pathlib import Path
import re

import pytest

GOC = Path(__file__).resolve().parents[1]
PATCH = GOC / "sql" / "patch_zzzzzzzh_is_current_theo_dot.sql"
ROLLBACK = GOC / "sql" / "rollback_zzzzzzzh_is_current_theo_dot.sql"

CHU_KY_TRONG = ("create or replace function public.submit_proposal_group("
                "p_don_vi text, p_nam_de_xuat integer, p_items jsonb)")
CHU_KY_V2 = ("create or replace function public.submit_proposal_group_v2("
             "p_don_vi text, p_nam_de_xuat integer, p_items jsonb, p_dot_id bigint)")


@pytest.fixture(scope="module")
def sql() -> str:
    assert PATCH.exists(), "chưa có patch_zzzzzzzh"
    return PATCH.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def rb() -> str:
    assert ROLLBACK.exists(), "chưa có rollback_zzzzzzzh"
    return ROLLBACK.read_text(encoding="utf-8")


def _ham(text: str, chu_ky: str) -> str:
    thap = text.lower()
    i = thap.index(chu_ky)
    j = thap.index("$function$;", i)
    return text[i:j]


def _bo_comment(text: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", d) for d in text.splitlines())


# ── Hàm trong: chỉ tắt bản cũ cùng đợt ──────────────────────────────────────

def test_ham_trong_doc_dot_tu_bien_phien(sql: str) -> None:
    than = _ham(sql, CHU_KY_TRONG)
    assert ("v_dot_id bigint := nullif(current_setting('app.submit_dot_id', true), '')::bigint;"
            in than)


def test_ham_trong_tat_is_current_co_dieu_kien_dot(sql: str) -> None:
    than = _bo_comment(_ham(sql, CHU_KY_TRONG))
    cau = than.split("set is_current = false")[1].split(";")[0]
    assert "p.dot_id is not distinct from v_dot_id" in cau, \
        "UPDATE tắt bản cũ phải lọc đúng đợt đang gửi"
    assert "p.is_current" in cau
    # Version vẫn tăng theo cả năm vì còn unique (mã, khoa, năm, version).
    ver = than.split("into v_version")[1].split(";")[0]
    assert "dot_id" not in ver, "không được đổi cách tăng version"


def test_v2_dat_roi_xoa_bien_phien_quanh_loi_goi(sql: str) -> None:
    than = _ham(sql, CHU_KY_V2)
    dat = than.index("perform set_config('app.submit_dot_id', p_dot_id::text, true);")
    goi = than.index("select * from submit_proposal_group(p_don_vi, p_nam_de_xuat, p_items)")
    xoa = than.index("perform set_config('app.submit_dot_id', '', true);")
    assert dat < goi < xoa


def test_giu_nguyen_chu_ky_frontend_goi(sql: str) -> None:
    thap = sql.lower()
    assert CHU_KY_V2 in thap
    assert CHU_KY_TRONG in thap, "đường fallback 3 tham số của Function1.jsx vẫn phải còn"
    assert "drop function" not in thap


def test_hai_ham_chi_them_dong_khong_sua_ban_goc(sql: str, rb: str) -> None:
    for chu_ky in (CHU_KY_TRONG, CHU_KY_V2):
        goc = _ham(rb, chu_ky).splitlines()
        moi = _ham(sql, chu_ky).splitlines()
        bot = [d for d in ndiff(goc, moi) if d.startswith("- ")]
        assert not bot, f"patch sửa/xoá dòng gốc của {chu_ky[:60]}…: {bot}"


# ── Index ───────────────────────────────────────────────────────────────────

def test_doi_index_theo_dot(sql: str) -> None:
    thap = " ".join(_bo_comment(sql).lower().split())
    assert "drop index if exists one_current_proposal;" in thap
    assert ("create unique index one_current_proposal_theo_dot "
            "on proposals (ma_hang, don_vi, dot_id) where is_current;") in thap
    assert "nulls not distinct" not in thap, \
        "_v2 INSERT dòng dot_id NULL rồi mới gắn đợt — NULL phải được coi là khác nhau"
    assert thap.index("drop index if exists one_current_proposal;") \
        < thap.index("set is_current = true"), \
        "phải bỏ index theo năm trước khi bật lại dòng, nếu không vi phạm ngay"


def test_chan_som_neu_du_lieu_khong_tao_duoc_index(sql: str) -> None:
    dau = sql.split("create or replace function")[0]
    assert "group by ma_hang, don_vi, dot_id having count(*) > 1" in dau
    assert "raise exception" in dau


# ── Vá dữ liệu ──────────────────────────────────────────────────────────────

def test_co_doan_va_du_lieu_tong_quat(sql: str) -> None:
    va = sql.split("create temp table _bat_lai")[1].split("alter table proposals disable")[0]
    assert "not p.is_current" in va
    assert "q.dot_id = p.dot_id and q.is_current" in va, \
        "chỉ bật khi trong cùng đợt không còn dòng hiện hành nào"
    assert "is distinct from p.dot_id" in va, "chỉ dòng bị tắt bởi lần gửi ở ĐỢT KHÁC"
    assert "update proposals p\nset is_current = true\nfrom _bat_lai b" in sql
    than = _bo_comment(sql.split("begin;", 1)[1])
    assert "327620" not in than and "327625" not in than, "không hard-code id"


def test_bo_qua_trigger_phan_bo_co_kiem_va_bat_lai(sql: str) -> None:
    tat = sql.index("alter table proposals disable trigger trg_khoi_tao_phan_bo_khoa;")
    cap = sql.index("set is_current = true")
    bat = sql.index("alter table proposals enable trigger trg_khoi_tao_phan_bo_khoa;")
    assert tat < cap < bat
    kiem = sql.index("mất dòng phan_bo_khoa tương ứng")
    assert kiem < tat, "phải kiểm phan_bo_khoa còn nguyên trước khi tắt trigger"


def test_mot_transaction(sql: str) -> None:
    lenh = [d.strip().lower() for d in _bo_comment(sql).splitlines() if d.strip()]
    assert lenh[0] == "begin;" and lenh[-1] == "commit;"
    assert lenh.count("begin;") == 1 and lenh.count("commit;") == 1


# ── Rollback ────────────────────────────────────────────────────────────────

def test_rollback_co_ham_cu_nguyen_van(rb: str) -> None:
    trong = _bo_comment(_ham(rb, CHU_KY_TRONG))
    assert "dot_id is not distinct from" not in trong
    assert "app.submit_dot_id" not in trong
    assert ("update proposals p\n        set is_current = false\n"
            "        where p.ma_hang = v_ma_hang\n          and p.don_vi = p_don_vi\n"
            "          and p.nam_de_xuat = p_nam_de_xuat\n          and p.is_current;") in trong
    assert "app.submit_dot_id" not in _ham(rb, CHU_KY_V2)


def test_rollback_tra_index_cu_va_chan_khi_du_lieu_da_di_tiep(rb: str) -> None:
    thap = " ".join(_bo_comment(rb).lower().split())
    assert "drop index if exists one_current_proposal_theo_dot;" in thap
    assert ("create unique index one_current_proposal on proposals "
            "(ma_hang, don_vi, nam_de_xuat) where is_current;") in thap
    assert "không rollback được" in thap
    assert thap.index("không rollback được") < thap.index("create unique index one_current_proposal")
    lenh = [d.strip().lower() for d in _bo_comment(rb).splitlines() if d.strip()]
    assert lenh[0] == "begin;" and lenh[-1] == "commit;"
