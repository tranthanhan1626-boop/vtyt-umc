-- rollback_zzzzzzzi — 28/09/2026
--
-- Gỡ patch_zzzzzzzi_vong1_gio_rot_ghi_chu_va_khoa_da_sua.sql: trả hai view về
-- ĐÚNG nguyên văn định nghĩa thật đọc trên DB ngày 28/09/2026 (trước patch).
--
-- v_theo_doi_chuyen_tiep_v3: patch chỉ đổi BIỂU THỨC của cột khoa_da_sua_so,
-- không đổi số cột/thứ tự cột → CREATE OR REPLACE là đủ, không mất quyền đã
-- cấp (Postgres giữ nguyên ACL của view khi CREATE OR REPLACE không đổi danh
-- sách cột).
--
-- v_gio_rot_v3: patch THÊM cột ghi_chu ở cuối. CREATE OR REPLACE không thể bỏ
-- bớt cột, nên rollback phải DROP VIEW rồi CREATE VIEW lại theo đúng 12 cột
-- gốc. DROP VIEW xoá luôn mọi GRANT đã cấp trên view đó — khác với
-- v_theo_doi_chuyen_tiep_v3. Để không tự bịa danh sách quyền (AGENTS.md điều
-- 8 — không rõ thì hỏi, đừng điền vào chỗ trống), script TỰ ĐỌC ACL hiện có
-- của v_gio_rot_v3 từ pg_class.relacl NGAY TRƯỚC KHI DROP, giữ vào bảng tạm,
-- rồi phát lại y nguyên từng (grantee, quyền) sau khi tạo lại view — không
-- hard-code "anon/authenticated/service_role" hay suy đoán insert/update/
-- delete. Nếu ACL đọc được không có gì (ví dụ do đã bị đổi trước khi rollback
-- chạy), script sẽ KHÔNG cấp lại quyền nào và raise notice để người chạy tự
-- kiểm — xem mục "ĐIỂM CẦN TỰ KIỂM" cuối file.
--
-- ĐIỀU KIỆN — khi nào rollback KHÔNG chạy được (file tự dừng, không ghi gì):
--   Có view khác phụ thuộc vào v_gio_rot_v3 (đo 28/09/2026: không có, nhưng
--   nếu từ lúc patch chạy tới lúc rollback có view mới được tạo dựa trên cột
--   ghi_chu thì DROP sẽ lỗi/hoặc cần CASCADE — script kiểm trước, KHÔNG tự ý
--   dùng CASCADE.
--
-- Chạy: cd backend && set -a && . ./.env.local && set +a &&
--       .venv/bin/python scripts/chay_patch.py sql/rollback_zzzzzzzi_vong1.sql

begin;

-- ── 0. Chặn sớm: không được có view khác phụ thuộc v_gio_rot_v3 ───────────
do $$
declare v_so int; v_ds text;
begin
    select count(*), string_agg(dep_v.relname, ', ')
      into v_so, v_ds
    from pg_depend d
    join pg_rewrite r on r.oid = d.objid
    join pg_class dep_v on dep_v.oid = r.ev_class
    join pg_class src_v on src_v.oid = d.refobjid
    where src_v.relname = 'v_gio_rot_v3'
      and src_v.relnamespace = 'public'::regnamespace
      and dep_v.oid <> src_v.oid
      and d.deptype = 'n';
    if v_so > 0 then
        raise exception 'Có % view phụ thuộc v_gio_rot_v3 (%) — dừng, không tự CASCADE.', v_so, v_ds;
    end if;
end $$;

-- ── 1. Đọc & giữ ACL hiện có của v_gio_rot_v3 trước khi DROP ───────────────
create temp table _acl_zzzzzzzi_gio_rot (grantee text, privilege text) on commit drop;

do $$
declare r record;
begin
    for r in
        select pg_catalog.pg_get_userbyid(a.grantee) as grantee, a.privilege_type
        from pg_class c, lateral aclexplode(c.relacl) a
        where c.relname = 'v_gio_rot_v3'
          and c.relnamespace = 'public'::regnamespace
          and a.grantee <> 0  -- bỏ dòng "PUBLIC" giả (grantee=0), xử lý riêng nếu có bên dưới
    loop
        insert into _acl_zzzzzzzi_gio_rot values (r.grantee, r.privilege_type);
    end loop;

    -- Dòng cấp cho PUBLIC (nếu có) có grantee = 0, pg_get_userbyid lỗi trên đó
    -- nên gom riêng.
    if exists (
        select 1 from pg_class c, lateral aclexplode(c.relacl) a
        where c.relname = 'v_gio_rot_v3' and c.relnamespace = 'public'::regnamespace
          and a.grantee = 0
    ) then
        insert into _acl_zzzzzzzi_gio_rot
        select 'PUBLIC', a.privilege_type
        from pg_class c, lateral aclexplode(c.relacl) a
        where c.relname = 'v_gio_rot_v3' and c.relnamespace = 'public'::regnamespace
          and a.grantee = 0;
    end if;

    raise notice 'rollback_zzzzzzzi: ACL đọc được trên v_gio_rot_v3 trước khi drop = %',
        (select string_agg(grantee || ':' || privilege, ', ') from _acl_zzzzzzzi_gio_rot);
end $$;

-- ── 2. Trả v_theo_doi_chuyen_tiep_v3 về biểu thức gốc (không cần drop) ─────
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
    pb.so_luong_hien_hanh IS DISTINCT FROM cc.so_luong AS khoa_da_sua_so,
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

-- ── 3. Drop + tạo lại v_gio_rot_v3 đúng 12 cột gốc (bỏ ghi_chu) ────────────
DROP VIEW public.v_gio_rot_v3;

CREATE VIEW public.v_gio_rot_v3 WITH (security_invoker = true) AS
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
    x.updated_at
   FROM g
     LEFT JOIN xu_ly_gio_rot_v3 x ON x.phien_q_id = g.phien_q_id AND x.ma_quan_ly = g.ma_quan_ly AND x.khoa = g.khoa
  WHERE g.so_luong_trung < g.so_luong_q;

-- ── 4. Phát lại đúng ACL đã đọc được ở bước 1 ──────────────────────────────
do $$
declare r record;
begin
    for r in select grantee, privilege from _acl_zzzzzzzi_gio_rot
    loop
        if r.grantee = 'PUBLIC' then
            execute format('grant %s on public.v_gio_rot_v3 to public', r.privilege);
        else
            execute format('grant %s on public.v_gio_rot_v3 to %I', r.privilege, r.grantee);
        end if;
    end loop;

    if not exists (select 1 from _acl_zzzzzzzi_gio_rot) then
        raise notice 'rollback_zzzzzzzi: KHÔNG đọc được ACL nào trước khi drop — view mới tạo chỉ có quyền mặc định của owner. Tự kiểm và grant lại tay nếu cần (xem đầu file).';
    end if;
end $$;

-- ── 5. Tự kiểm sau cùng ─────────────────────────────────────────────────────
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'v_gio_rot_v3' and column_name = 'ghi_chu'
    ) then
        raise exception 'v_gio_rot_v3 vẫn còn cột ghi_chu sau rollback.';
    end if;
end $$;

commit;

-- ĐIỂM CẦN TỰ KIỂM (không tự động hoá được — đọc kỹ trước khi coi rollback xong):
--   1. Xem lại NOTICE "ACL đọc được trên v_gio_rot_v3 trước khi drop" khi chạy
--      — đối chiếu bằng mắt với quyền mong đợi (ví dụ nếu dự án chủ trương
--      anon/authenticated/service_role đều có đủ select/insert/update/delete
--      trên view này thì phải thấy đủ các dòng đó trong NOTICE; thiếu dòng
--      nào nghĩa là ACL thật trên DB khác với chủ trương — hỏi chủ dự án,
--      đừng tự thêm).
--   2. Quyền cấp qua ROLE cha (ví dụ authenticated là thành viên của một role
--      khác đang giữ quyền) không hiện trực tiếp trong relacl của view —
--      kiểm thêm bằng `\dp v_gio_rot_v3` sau khi rollback chạy xong.
