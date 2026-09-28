-- patch_zzzzzzzi — 28/09/2026 (vòng 1 vá lỗi nghiệm thu, L03 + L04)
--
-- L03 — `v_gio_rot_v3` KHÔNG TRẢ `ghi_chu`
--
-- Lỗi đo được trên DB 28/09/2026: định nghĩa THẬT của `v_gio_rot_v3` (đọc
-- bằng pg_get_viewdef, chép nguyên văn ở dưới) không có cột `ghi_chu`, dù
-- bảng `xu_ly_gio_rot_v3` có cột đó và RPC vẫn ghi vào. `GioRotCuaKhoa.jsx:247`
-- đọc `r.ghi_chu` từ view này nên không bao giờ hiện ghi chú — cột luôn
-- `undefined`, không lỗi không cảnh báo (build ✓, pytest ✓, xem AGENTS.md
-- điều 7).
--
-- Cách sửa: CREATE OR REPLACE view với NGUYÊN VĂN định nghĩa thật, chỉ thêm
-- đúng một cột `x.ghi_chu` vào CUỐI danh sách SELECT (sau x.updated_at).
-- CREATE OR REPLACE chỉ cho thêm cột ở cuối — không đổi thứ tự/kiểu 12 cột cũ
-- (giữ nguyên mọi consumer đang SELECT theo vị trí hoặc theo tên).
--
-- L04 — `v_theo_doi_chuyen_tiep_v3.khoa_da_sua_so` BÁO SAI KHI CHƯA KHOA NÀO GỬI
--
-- Lỗi đo được trên DB 28/09/2026: cột tính bằng
--   pb.so_luong_hien_hanh IS DISTINCT FROM cc.so_luong AS khoa_da_sua_so
-- Từ QĐ 26/08/2026, mã rớt được đẩy vào `gio_nhap` của khoa ở đợt bổ sung với
-- số lượng GỢI Ý, KHÔNG còn insert thẳng vào `proposals`/tạo `phan_bo_khoa`
-- nữa (xem a4292bc). Khoa chưa bấm "Gửi giỏ" thì chưa có dòng `phan_bo_khoa`
-- ⇒ `pb.so_luong_hien_hanh` là NULL ⇒ `NULL IS DISTINCT FROM cc.so_luong` luôn
-- TRUE dù khoa chưa hề đụng vào số. DB 28/09/2026 đo được: 15/15 dòng báo
-- "khoa đã sửa số" trong khi `so_khoa_dang_de_xuat` (chính là pb.so_luong_hien_hanh)
-- NULL cả 15 — chưa khoa nào gửi giỏ.
--
-- Cách sửa: đổi DUY NHẤT biểu thức của cột `khoa_da_sua_so` thành
--   (pb.so_luong_hien_hanh IS NOT NULL AND pb.so_luong_hien_hanh IS DISTINCT FROM cc.so_luong) AS khoa_da_sua_so
-- Chỉ TRUE khi khoa đã thật sự có dòng phan_bo_khoa (đã gửi giỏ) VÀ số đó
-- khác số gợi ý ban đầu. Giữ nguyên kiểu boolean và đúng vị trí cột (không
-- đụng 20 cột còn lại, không đụng danh sách JOIN).
--
-- Cả hai view lấy nguyên văn từ định nghĩa THẬT trên DB (đọc bằng
-- pg_get_viewdef 28/09/2026, không lấy từ repo — AGENTS.md điều 2: repo SQL
-- không phải nguồn chuẩn của schema). Cả hai có reloptions security_invoker
-- = true, owner postgres, không view nào khác phụ thuộc vào chúng.
--
-- Chạy: cd backend && set -a && . ./.env.local && set +a &&
--       .venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzi_vong1_gio_rot_ghi_chu_va_khoa_da_sua.sql
-- Gỡ:   sql/rollback_zzzzzzzi_vong1.sql
--
-- Kiểm lại sau khi chạy (chỉ đọc):
--   -- cột ghi_chu đã có trong v_gio_rot_v3:
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='v_gio_rot_v3'
--    order by ordinal_position;
--
--   -- không còn dòng nào báo "khoa đã sửa số" khi chưa có phan_bo_khoa:
--   select count(*) from v_theo_doi_chuyen_tiep_v3
--    where khoa_da_sua_so and so_khoa_dang_de_xuat is null;
--   -- kỳ vọng sau vá: 0 (trước vá, đo 28/09/2026: 15)

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

-- ── Tự kiểm sau cùng ─────────────────────────────────────────────────────
do $$
declare v_sai int;
begin
    select count(*) into v_sai
    from v_theo_doi_chuyen_tiep_v3
    where khoa_da_sua_so and so_khoa_dang_de_xuat is null;
    if v_sai > 0 then
        raise exception 'Vẫn còn % dòng báo khoa_da_sua_so=true mà so_khoa_dang_de_xuat NULL.', v_sai;
    end if;

    if not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'v_gio_rot_v3' and column_name = 'ghi_chu'
    ) then
        raise exception 'v_gio_rot_v3 vẫn chưa có cột ghi_chu.';
    end if;
end $$;

commit;
