from pathlib import Path


PATCH = (
    Path(__file__).resolve().parents[1] / "sql" / "patch_zzzze_v3_hoan_thien.sql"
).read_text()


def test_30_percent_is_restricted_at_database_layer_to_supported_packages():
    assert "where gc.loai_mua_sam in ('dau_thau_rong_rai','mua_sam_bo_sung')" in PATCH
    assert "create or replace view v_tuy_chon_mua_them_30_v3" in PATCH


def test_removed_demand_event_table_fails_closed_if_it_contains_data():
    assert "count(*) from public.su_kien_nhu_cau" in PATCH
    assert "còn dữ liệu; không tự động xóa" in PATCH
    assert "drop table if exists su_kien_nhu_cau" in PATCH
