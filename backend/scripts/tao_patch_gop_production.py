#!/usr/bin/env python3
"""Gộp patch A2→Z thành một transaction SQL duy nhất cho production.

ZA cố ý không nằm trong danh sách vì đó là RPC xóa dữ liệu kiểm thử chỉ được
phép chạy trên project staging đã định danh.
"""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SQL_DIR = ROOT / "sql"
OUTPUT = SQL_DIR / "patch_production_a2_z_20260804.sql"

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
    "patch_y_khoa_da_di_thau_theo_phien.sql",
    "patch_z_chuyen_trang_thai_bo_ho_so_pdd.sql",
)


def without_outer_transaction(source: Path) -> str:
    text = source.read_text(encoding="utf-8")
    lines = text.splitlines()
    begin_lines = [i for i, line in enumerate(lines) if line.strip().lower() == "begin;"]
    commit_lines = [i for i, line in enumerate(lines) if line.strip().lower() == "commit;"]
    if len(begin_lines) != 1 or len(commit_lines) != 1:
        raise RuntimeError(
            f"{source.name}: cần đúng 1 BEGIN và 1 COMMIT cấp file, "
            f"thực tế {len(begin_lines)}/{len(commit_lines)}"
        )
    if begin_lines[0] >= commit_lines[0]:
        raise RuntimeError(f"{source.name}: BEGIN/COMMIT sai thứ tự")
    return "\n".join(
        line
        for i, line in enumerate(lines)
        if i not in {begin_lines[0], commit_lines[0]}
    ).strip()


def main() -> None:
    sections = []
    for name in SOURCES:
        source = SQL_DIR / name
        if not source.exists():
            raise FileNotFoundError(source)
        sections.append(
            "\n".join(
                (
                    "",
                    "-- " + "=" * 76,
                    f"-- NGUỒN: {name}",
                    "-- " + "=" * 76,
                    without_outer_transaction(source),
                    "",
                )
            )
        )

    header = """-- PATCH PRODUCTION GỘP A2 → Z — 04/08/2026
--
-- Đầu vào bắt buộc: production đang ở schema nền trước patch A2.
-- File này gộp nguyên văn 23 patch nguồn theo đúng thứ tự và bọc trong MỘT
-- transaction. Bất kỳ lỗi nào cũng rollback toàn bộ A2→Z.
--
-- KHÔNG chứa patch ZA. ZA là RPC xóa dữ liệu kiểm thử, bị khóa cứng theo JWT
-- issuer của project staging ihgfafubwyxnbubmppbj.
--
-- Trước khi chạy:
--   1. Có backup production đầy đủ.
--   2. Chạy trong Supabase SQL Editor của project production.
--   3. Không chạy schema.sql hoặc rls_policies.sql trên database đang có dữ liệu.

begin;
"""
    footer = """
commit;

-- Sau khi thành công, đối chiếu OpenAPI/PostgREST rồi mới push nhánh main.
"""
    OUTPUT.write_text(header + "".join(sections) + footer, encoding="utf-8")
    print(f"{len(SOURCES)} patch -> {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
