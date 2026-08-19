from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATCH = (ROOT / "sql" / "patch_zzzza_v3_phan_bo_khoa.sql").read_text(encoding="utf-8")
PATCH_SAU_GAN_DOT = ROOT / "sql" / "patch_zzzzh_v3_phan_bo_sau_gan_dot.sql"
FIX = PATCH_SAU_GAN_DOT.read_text(encoding="utf-8") if PATCH_SAU_GAN_DOT.exists() else ""
PATCH_GAN_GIAN_TIEP = ROOT / "sql" / "patch_zzzzi_v3_trigger_phan_bo_nghe_dot_id.sql"
FIX_GAN_GIAN_TIEP = (
    PATCH_GAN_GIAN_TIEP.read_text(encoding="utf-8")
    if PATCH_GAN_GIAN_TIEP.exists()
    else ""
)


def test_proposals_are_only_the_immutable_source_for_initial_allocation():
    assert "proposal_id        bigint not null references proposals(id)" in PATCH
    assert "so_luong_goc" in PATCH
    assert "so_luong_hien_hanh" in PATCH
    assert "on conflict (dot_goi_id, ma_hang, khoa) do update" in PATCH


def test_aggregate_quantity_is_a_sum_view():
    assert "create or replace view v_phan_bo_tong_hop" in PATCH
    assert "sum(pb.so_luong_hien_hanh)" in PATCH
    assert "group by pb.dot_goi_id, pb.ma_hang" in PATCH


def test_auto_distribution_floors_and_assigns_remainder():
    assert "floor(p_tong_moi * so_luong_goc / v_tong_goc)" in PATCH
    assert "order by so_luong_goc desc, khoa limit 1" in PATCH
    assert "so_luong_hien_hanh + v_con_lai" in PATCH


def test_manual_distribution_enforces_exact_total_and_existing_departments():
    assert "Phân bổ tay phải có đúng mọi khoa" in PATCH
    assert "Tổng phân bổ % không khớp tổng mới %" in PATCH
    assert "v_tong_sau <> p_tong_moi" in PATCH


def test_reason_is_required_after_department_checkpoint():
    assert "danh_muc_khoa_chot" in PATCH
    assert "Phải nhập lý do vì có khoa đã chốt danh mục" in PATCH


def test_allocation_is_created_after_v2_wrapper_assigns_dot_goi():
    assert (
        "after insert or update of dot_goi_id, is_current, da_rut, so_luong on proposals"
        in FIX
    )
    assert "delete from phan_bo_khoa" in FIX
    assert "insert into phan_bo_khoa" in FIX


def test_allocation_trigger_listens_to_columns_updated_by_v2_wrapper():
    assert (
        "after insert or update of dot_id, dot_goi_id, loai_mua_sam, goi, "
        "is_current, da_rut, so_luong on proposals"
        in FIX_GAN_GIAN_TIEP
    )
