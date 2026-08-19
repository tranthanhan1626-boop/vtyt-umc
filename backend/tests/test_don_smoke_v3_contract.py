from pathlib import Path


PATCH = (
    Path(__file__).resolve().parents[1] / "sql" / "patch_zzzzg_v3_don_smoke.sql"
).read_text()


def test_cleanup_is_strictly_limited_to_named_smoke_rounds():
    assert "p_xac_nhan <> 'XOA-SMOKE-V3'" in PATCH
    assert "v_ten not like 'SMOKE V3 %'" in PATCH
    assert "current_user_role() not in ('dieu_duong','admin')" in PATCH


def test_immutable_snapshots_only_allow_transaction_local_smoke_cleanup_flag():
    assert "current_setting('app.don_smoke_v3',true)='1'" in PATCH
    assert "set_config('app.don_smoke_v3','1',true)" in PATCH
    assert "Snapshot Q là bất biến" in PATCH
    assert "Snapshot trình ký là bất biến" in PATCH


def test_cleanup_deletes_v3_leaves_before_legacy_round_cleanup():
    assert PATCH.index("delete from chot_trinh_ky_dong_v3") < PATCH.index("delete from chot_q_dong")
    assert PATCH.index("delete from chot_q_dong") < PATCH.index("delete from phan_bo_khoa")
    assert "perform xoa_du_lieu_kiem_thu('dot_de_xuat'" in PATCH
