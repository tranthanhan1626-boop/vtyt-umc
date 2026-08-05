from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SQL_DIR = ROOT / "sql"
BUNDLE = (SQL_DIR / "patch_production_a2_z_20260804.sql").read_text(encoding="utf-8")

SOURCES = (
    "patch_a2_cong_phe_duyet.sql",
    "patch_a4_tien_do_goi_thau.sql",
    "patch_a5_danh_sach_khoa.sql",
    "patch_bc_so_goc_va_so_ghi.sql",
    "patch_h_dot_va_lich_su_xuat.sql",
    "patch_i_rut_va_tong_hop.sql",
    "patch_j_dong_bo_sequence_staging.sql",
    "patch_k_ho_so_cong_tac_truc_tuyen.sql",
    "patch_l_gio_nhap_tren_server.sql",
    "patch_m_ket_qua_thau_ve_khoa.sql",
    "patch_n_dieu_chinh_tieu_chi.sql",
    "patch_o_tien_do_su_dung.sql",
    "patch_p_du_kien_het_hang.sql",
    "patch_q_phan_nhom_abc.sql",
    "patch_r_nhu_cau_bi_nen.sql",
    "patch_s_workflow_ho_so_dvsd.sql",
    "patch_t_tao_nhieu_bo_ho_so.sql",
    "patch_u_kha_dung_hop_dong.sql",
    "patch_v_tuy_chon_mua_them_30.sql",
    "patch_w_ma_rot_thau_ve_dvsd.sql",
    "patch_x_quyen_khoa_va_ho_so_theo_gio.sql",
    "patch_x2_de_xuat_theo_ma_quan_ly.sql",
    "patch_y_khoa_da_di_thau_theo_phien.sql",
    "patch_z_chuyen_trang_thai_bo_ho_so_pdd.sql",
)


def strip_transaction(text: str) -> str:
    return "\n".join(
        line
        for line in text.splitlines()
        if line.strip().lower() not in {"begin;", "commit;"}
    ).strip()


def test_bundle_has_one_transaction_and_all_sources_in_order():
    lines = [line.strip().lower() for line in BUNDLE.splitlines()]
    assert lines.count("begin;") == 1
    assert lines.count("commit;") == 1

    positions = []
    for source in SOURCES:
        marker = f"-- NGUỒN: {source}"
        positions.append(BUNDLE.index(marker))
        original = (SQL_DIR / source).read_text(encoding="utf-8")
        assert strip_transaction(original) in BUNDLE
    assert positions == sorted(positions)


def test_bundle_does_not_enable_staging_delete_rpc_on_production():
    assert "create or replace function xoa_du_lieu_kiem_thu" not in BUNDLE.lower()
    assert "patch_za_xoa_du_lieu_kiem_thu.sql" not in BUNDLE
