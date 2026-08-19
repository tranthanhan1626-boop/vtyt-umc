from pathlib import Path


PATCH = (
    Path(__file__).resolve().parents[1] / "sql" / "patch_zzzzf_v3_tu_dong_dot_goi.sql"
).read_text()


def test_new_round_creates_business_scopes_and_participant_departments():
    assert "after insert or update of trang_thai,ngay_mo,ngay_dong on dot_de_xuat" in PATCH
    assert "after insert on dot_goi" in PATCH
    assert "from v_don_vi v" in PATCH
    assert "g.thang_moc=new.thang_moc" in PATCH


def test_new_proposal_is_scoped_before_allocation_trigger_runs():
    assert "before insert or update of dot_id,loai_mua_sam,goi on proposals" in PATCH
    assert "new.dot_goi_id:=v_dot_goi_id" in PATCH
    assert "Không ánh xạ được proposal sang DOT_GOI" in PATCH


def test_gap_between_migrations_is_backfilled():
    assert "where p.dot_id is not null and p.dot_goi_id is null" in PATCH
    assert "insert into phan_bo_khoa" in PATCH
