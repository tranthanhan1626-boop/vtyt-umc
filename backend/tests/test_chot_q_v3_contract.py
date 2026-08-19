from pathlib import Path

PATCH = (Path(__file__).resolve().parents[1] / "sql" / "patch_zzzzb_v3_chot_q.sql").read_text()


def test_q_snapshot_has_revision_and_immutable_rows():
    assert "unique (dot_goi_id, revision)" in PATCH
    assert "where hieu_luc" in PATCH
    assert "Snapshot Q là bất biến" in PATCH


def test_soft_gate_records_unsubmitted_department_count():
    assert "so_khoa_chua_chot" in PATCH
    assert "not exists (select 1 from danh_muc_khoa_chot" in PATCH
    assert "raise exception 'DOT_GOI đã có snapshot Q hiệu lực.'" in PATCH


def test_department_can_close_no_demand_but_cannot_reopen_itself():
    assert "p_khong_phat_sinh boolean default false" in PATCH
    assert "Khoa đang có số lượng hiện hành" in PATCH
    assert "Chỉ Phòng Điều dưỡng được mở lại danh mục khoa" in PATCH
    assert 'drop policy if exists "mở chốt danh mục đúng khoa hoặc pđd"' in PATCH
    assert "mo_chot_danh_muc_khoa_v3(bigint,text,text)" in PATCH
    assert "mo_chot_danh_muc_khoa_v3(bigint,text)," not in PATCH


def test_active_q_locks_allocations_and_text_overrides():
    assert "trg_khoa_phan_bo_sau_chot_q" in PATCH
    assert "trg_khoa_o_tong_hop_sau_chot_q" in PATCH
    assert "PĐD phải mở snapshot Q trước" in PATCH
