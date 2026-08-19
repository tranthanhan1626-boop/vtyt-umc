from pathlib import Path


PATCH = (
    Path(__file__).resolve().parents[1] / "sql" / "patch_zzzzd_v3_trinh_ky.sql"
).read_text()


def test_department_and_aggregate_final_signing_are_separate_checkpoints():
    assert "create table if not exists chot_trinh_ky_khoa_v3" in PATCH
    assert "create table if not exists chot_trinh_ky_phien_v3" in PATCH
    assert "Còn % khoa chưa đủ chốt danh mục ban đầu và chốt trình ký" in PATCH
    assert "chot_trinh_ky_toan_bo_v3" in PATCH


def test_reopening_one_department_invalidates_official_revision():
    assert "mo_chot_trinh_ky_khoa_v3" in PATCH
    assert "hieu_luc = false" in PATCH
    assert "ly_do_vo_hieu = btrim(p_ly_do)" in PATCH
    assert "'vo_hieu'" in PATCH


def test_official_snapshot_is_immutable_and_keeps_final_quantities_and_text():
    assert "create table if not exists chot_trinh_ky_dong_v3" in PATCH
    assert "q_khoa numeric not null" in PATCH
    assert "so_luong_trung numeric not null" in PATCH
    assert "gia_tri_khoa jsonb" in PATCH
    assert "gia_tri_pdd jsonb" in PATCH
    assert "Snapshot trình ký là bất biến" in PATCH


def test_final_signing_requires_three_completed_stages_and_exact_allocation():
    assert "Phải hoàn thành đủ ba giai đoạn đấu thầu" in PATCH
    assert "pb.tong <> k.so_luong_trung" in PATCH
    assert "Phân bổ số trúng chưa khớp kết quả thầu" in PATCH


def test_30_percent_uses_final_winning_allocation_by_department_and_management_code():
    assert "create or replace view v_tuy_chon_mua_them_30_v3" in PATCH
    assert "d.khoa,d.ma_quan_ly" in PATCH
    assert "sum(d.so_luong_trung) so_luong_trung" in PATCH
    assert "floor(q.so_luong_trung*0.30)" in PATCH
    assert "kich_hoat_tuy_chon_mua_them_30_v3" in PATCH


def test_30_percent_usage_survives_revision_changes():
    assert "group by dot_goi_id,khoa,ma_quan_ly" in PATCH
    assert "x.dot_goi_id=q.dot_goi_id" in PATCH
    assert "revision trình ký không còn hiệu lực" in PATCH
