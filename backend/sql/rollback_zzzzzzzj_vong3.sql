-- rollback_zzzzzzzj — 28/09/2026
--
-- Gỡ patch_zzzzzzzj_vong3_gio_rot_theo_so_trung_va_xac_nhan_hieu_luc.sql: trả
-- cả hai view về ĐÚNG nguyên văn định nghĩa thật đọc trên DB 28/09/2026 (sau
-- patch_zzzzzzzi, TRƯỚC patch_zzzzzzzj — chép ở
-- .scratch/test-toan-bo/vong3_viewdef_that.sql).
--
-- Cả hai view GIỮ NGUYÊN số cột/thứ tự/kiểu so với trước patch_zzzzzzzj (patch
-- chỉ đổi nguồn CTE của v_gio_rot_v3 và thêm một điều kiện AND vào EXISTS của
-- v_theo_doi_chuyen_tiep_v3 — không thêm/bớt cột nào) → CREATE OR REPLACE là
-- đủ cho cả hai, không cần DROP VIEW, không đụng ACL đã cấp.
--
-- Chạy: cd backend && set -a && . ./.env.local && set +a &&
--       .venv/bin/python scripts/chay_patch.py sql/rollback_zzzzzzzj_vong3.sql

begin;

CREATE OR REPLACE VIEW public.v_gio_rot_v3 WITH (security_invoker = true) AS
 WITH g AS (
         SELECT q.id AS phien_q_id,
            q.dot_goi_id,
            v.ma_quan_ly,
            d.khoa,
            sum(d.q) AS so_luong_q,
            sum(COALESCE(p.so_luong_trung, 0::numeric)) AS so_luong_trung
           FROM chot_q_phien q
             JOIN chot_q_dong d ON d.phien_id = q.id
             JOIN vat_tu v ON v.ma_hang = d.ma_hang
             LEFT JOIN phan_bo_trung_v3 p ON p.phien_q_id = d.phien_id AND p.ma_hang = d.ma_hang AND p.khoa = d.khoa
          WHERE q.hieu_luc
          GROUP BY q.id, q.dot_goi_id, v.ma_quan_ly, d.khoa
        )
 SELECT g.phien_q_id,
    g.dot_goi_id,
    g.ma_quan_ly,
    g.khoa,
    g.so_luong_q,
    g.so_luong_trung,
    g.so_luong_q - g.so_luong_trung AS so_luong_thieu,
    g.so_luong_trung = 0::numeric AS rot_toan_bo,
    COALESCE(x.trang_thai, 'cho_xu_ly'::text) AS trang_thai,
    x.dot_goi_bo_sung_id,
    x.proposal_bo_sung_id,
    x.updated_at,
    x.ghi_chu
   FROM g
     LEFT JOIN xu_ly_gio_rot_v3 x ON x.phien_q_id = g.phien_q_id AND x.ma_quan_ly = g.ma_quan_ly AND x.khoa = g.khoa
  WHERE g.so_luong_trung < g.so_luong_q;

CREATE OR REPLACE VIEW public.v_theo_doi_chuyen_tiep_v3 WITH (security_invoker = true) AS
 SELECT r.phien_q_id,
    r.dot_goi_id,
    r.ma_hang,
    r.ten_vat_tu,
    r.dvt,
    r.ma_quan_ly,
    r.khoa,
    r.so_rot,
    r.da_chuyen,
    r.da_chuyen_tiep,
    r.con_lai,
    GREATEST(r.da_chuyen + r.da_chuyen_tiep - r.so_rot, 0::numeric) AS thua_so_voi_rot,
    ch.ma_hang_nhan,
    ch.khoa_chua_tung_dung,
    cc.dot_goi_bo_sung_id,
    gc.nhan AS goi_bo_sung,
    dd.nam AS nam_bo_sung,
    dd.thang_moc AS thang_bo_sung,
    pb.so_luong_hien_hanh AS so_khoa_dang_de_xuat,
    (pb.so_luong_hien_hanh IS NOT NULL AND pb.so_luong_hien_hanh IS DISTINCT FROM cc.so_luong) AS khoa_da_sua_so,
    (EXISTS ( SELECT 1
           FROM danh_muc_khoa_chot dk
          WHERE dk.dot_goi_id = cc.dot_goi_bo_sung_id AND dk.khoa = r.khoa)) AS khoa_da_xac_nhan,
        CASE
            WHEN (r.da_chuyen + r.da_chuyen_tiep - r.so_rot) > 0::numeric THEN 'chuyen_tiep_thua'::text
            WHEN r.con_lai > 0::numeric THEN 'con_no_xu_ly'::text
            WHEN ch.ma_hang_nhan IS NOT NULL AND cc.dot_goi_bo_sung_id IS NULL THEN 'da_do_sang_ma'::text
            WHEN cc.dot_goi_bo_sung_id IS NULL THEN 'chuyen_tiep_hong'::text
            ELSE 'da_chuyen_tiep'::text
        END AS trang_thai
   FROM v_rot_chua_xu_ly_v3 r
     LEFT JOIN chuyen_tiep_rot_v3 cc ON cc.phien_q_id = r.phien_q_id AND cc.ma_hang = r.ma_hang AND cc.khoa = r.khoa
     LEFT JOIN chuyen_so_rot_v3 ch ON ch.phien_q_id = r.phien_q_id AND ch.ma_hang_rot = r.ma_hang AND ch.khoa = r.khoa AND ch.hieu_luc
     LEFT JOIN dot_goi dg ON dg.id = cc.dot_goi_bo_sung_id
     LEFT JOIN goi_con gc ON gc.goi_id = dg.goi_id
     LEFT JOIN dot_de_xuat dd ON dd.id = dg.dot_id
     LEFT JOIN phan_bo_khoa pb ON pb.dot_goi_id = cc.dot_goi_bo_sung_id AND pb.ma_hang = r.ma_hang AND pb.khoa = r.khoa;

-- ── Tự kiểm sau cùng: đã trả về đúng bản trước patch_zzzzzzzj ─────────────
do $$
declare v_dinh_nghia text;
begin
    select pg_get_viewdef('public.v_gio_rot_v3'::regclass, true) into v_dinh_nghia;
    if v_dinh_nghia !~ 'chot_q_dong' then
        raise exception 'v_gio_rot_v3 sau rollback vẫn chưa thấy lại chot_q_dong trong định nghĩa — rollback có thể chưa đúng.';
    end if;

    select pg_get_viewdef('public.v_theo_doi_chuyen_tiep_v3'::regclass, true) into v_dinh_nghia;
    if v_dinh_nghia ~ 'dk\.hieu_luc' then
        raise exception 'v_theo_doi_chuyen_tiep_v3 sau rollback vẫn còn dk.hieu_luc — rollback có thể chưa đúng.';
    end if;
end $$;

commit;
