from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATCH = (ROOT / "sql" / "patch_zzzz_v3_dot_goi.sql").read_text(encoding="utf-8")


def test_dot_goi_has_the_business_key_and_rls():
    assert "unique (dot_id, goi_id)" in PATCH
    assert "alter table dot_goi enable row level security" in PATCH
    assert "current_user_role()) in ('dieu_duong', 'admin')" in PATCH


def test_all_procurement_types_are_backfilled():
    assert "dau_thau_rong_rai" in PATCH
    assert "mua_sam_bo_sung" in PATCH
    assert "chi_dinh_thau" in PATCH
    assert "g.thang_moc = d.thang_moc" in PATCH


def test_migration_refuses_silent_unmapped_proposals():
    assert "dot_id is not null and dot_goi_id is null" in PATCH
    assert "raise exception" in PATCH
    assert "having count(*) = 1" in PATCH


def test_current_version_is_scoped_by_dot_goi():
    assert "one_current_proposal_dot_goi" in PATCH
    assert "(ma_hang, don_vi, dot_goi_id)" in PATCH
    assert "where is_current and dot_goi_id is not null" in PATCH
