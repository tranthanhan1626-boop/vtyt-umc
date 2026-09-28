-- patch_zzzzzzzj — 28/09/2026 (vòng 3 vá theo kiểm định độc lập KĐ#1, KĐ#9)
--
-- L10 — `v_gio_rot_v3` BÁO "THIẾU" GIẢ CHO PHẦN ĐÃ ĐỔ SANG MÃ TƯƠNG ĐƯƠNG
--
-- Lỗi đo được trên DB 28/09/2026 (KIEM_DINH_DOC_LAP.md #1, mức chắc a): màn
-- ③ Mã rớt của dvsd1 báo K00.08.000.02 "Mang đi thầu 78 · trúng 58 · thiếu
-- 20" cho 10 khoa, trong khi PĐD đã đổ đúng 20 của mã 68407 sang mã tương
-- đương 68408 cho chính các khoa đó (`chuyen_so_rot_v3` id 1888, GMHS,
-- 68407→68408, 20, `khoa_chua_tung_dung = true`). SQL kiểm chứng:
--   select khoa, so_luong_q, so_luong_trung, so_luong_thieu
--     from v_gio_rot_v3 where ma_quan_ly = 'K00.08.000.02';
--   -- trước vá: 10 dòng "thiếu 20"
-- Gốc: định nghĩa THẬT (sau patch_zzzzzzzi) của `v_gio_rot_v3` cộng số từ
-- `chot_q_dong d LEFT JOIN phan_bo_trung_v3 p` — với 10 khoa "chưa từng dùng
-- mã nhận" (`khoa_chua_tung_dung = true`), `chot_q_dong` không có dòng nào
-- cho mã 68408 ở khoa đó (khoa chưa từng đề xuất mã này), nên phần "nhận về"
-- 20 nằm trong `phan_bo_trung_v3` (đã được `cap_nhat_phan_bo_trung_v3` ghi
-- khi PĐD đổ mã) không bao giờ được `d` join tới ⇒ bị bỏ sót, view báo thiếu
-- 20 một cách giả.
-- Đọc DB 28/09/2026 (mức a): `phan_bo_trung_v3` đã có ĐỦ 2488/2488 dòng của
-- `chot_q_dong` ở các phiên hiệu lực (q_khoa khớp 100% với `chot_q_dong.q`),
-- cộng thêm đúng 10 dòng "nhận về" (q_khoa = 0, so_luong_trung = 20) của các
-- khoa chưa từng dùng mã nhận. Nghĩa là lấy nền trực tiếp từ
-- `phan_bo_trung_v3` (không qua `chot_q_dong`) vừa đủ vừa đúng, không cần sổ
-- `chuyen_so_rot_v3` để trừ bù.
--
-- Cách sửa: trong CTE `g` của `v_gio_rot_v3`, đổi nguồn từ
--   chot_q_phien q JOIN chot_q_dong d ON d.phien_id = q.id
--     JOIN vat_tu v ON v.ma_hang = d.ma_hang
--     LEFT JOIN phan_bo_trung_v3 p ON p.phien_q_id = d.phien_id
--       AND p.ma_hang = d.ma_hang AND p.khoa = d.khoa
--   WHERE q.hieu_luc GROUP BY q.id, q.dot_goi_id, v.ma_quan_ly, d.khoa
-- thành
--   phan_bo_trung_v3 p JOIN chot_q_phien q ON q.id = p.phien_q_id AND q.hieu_luc
--     JOIN vat_tu v ON v.ma_hang = p.ma_hang
--   GROUP BY q.id, q.dot_goi_id, v.ma_quan_ly, p.khoa
-- với so_luong_q = sum(p.q_khoa), so_luong_trung = sum(coalesce(p.so_luong_trung,0)).
-- GIỮ NGUYÊN 13 cột ra của view (tên, thứ tự, kiểu — so_luong_q/so_luong_trung
-- vẫn numeric do sum()); GIỮ NGUYÊN q.dot_goi_id (không đổi sang
-- p.dot_goi_id — cả hai cột cùng giá trị vì phan_bo_trung_v3.dot_goi_id được
-- ghi từ đúng dot_goi của phiên Q lúc khởi tạo (trigger
-- fn_khoi_tao_phan_bo_trung_v3), nhưng q.dot_goi_id là cột "chốt cứng" của
-- phiên đã hiệu lực nên an toàn hơn để tham chiếu — không có lý do nghiệp vụ
-- nào đòi đổi, giữ nguyên như bản cũ).
--
-- L11 — `v_theo_doi_chuyen_tiep_v3.khoa_da_xac_nhan` KHÔNG LỌC `hieu_luc`
--
-- Lỗi đo được trên DB 28/09/2026 (KIEM_DINH_DOC_LAP.md #9, mức chắc b — hiện
-- 117/117 dòng còn hiệu lực nên chưa lộ trên màn, nhưng logic đã sai):
-- `pg_get_viewdef('v_theo_doi_chuyen_tiep_v3')` cho thấy cột tính bằng
--   EXISTS (SELECT 1 FROM danh_muc_khoa_chot dk
--            WHERE dk.dot_goi_id = cc.dot_goi_bo_sung_id AND dk.khoa = r.khoa)
-- không có điều kiện `dk.hieu_luc`, trong khi Bàn điều hành (từ V2 19/08)
-- luôn lọc `hieu_luc = true` khi đếm "đã xác nhận". Khi khoa sửa một ô SAU
-- khi đã xác nhận, `fn_huy_xac_nhan_khi_o_doi` gọi `huy_xac_nhan_theo_ma` huỷ
-- xác nhận — về nguyên lý là đặt `hieu_luc = false` cho dòng
-- `danh_muc_khoa_chot` cũ (và có thể ghi dòng huỷ mới) — nhưng vì EXISTS ở
-- đây không lọc hieu_luc, dòng đã bị huỷ vẫn làm cho EXISTS true, nên màn
-- Theo dõi chuyển tiếp tiếp tục ghi "rồi" dù xác nhận đã bị huỷ.
--
-- Cách sửa: thêm DUY NHẤT điều kiện `AND dk.hieu_luc` vào WHERE của EXISTS
-- nói trên. Không đụng cột nào khác, không đổi số cột/thứ tự/kiểu (vẫn 22
-- cột như định nghĩa thật — N8 28/09/2026: đếm lại danh sách "cột:" trong
-- .scratch/test-toan-bo/vong3_viewdef_that.sql ra 22, chú thích cũ ghi nhầm
-- 21; chỉ sửa chữ chú thích, không đụng SQL chạy).
--
-- Cả hai view lấy nguyên văn định nghĩa THẬT đọc trên DB 28/09/2026 (sau
-- patch_zzzzzzzi, chép ở .scratch/test-toan-bo/vong3_viewdef_that.sql —
-- AGENTS.md điều 2: repo SQL không phải nguồn chuẩn của schema) làm gốc, chỉ
-- đổi đúng phần nêu trên. Cả hai còn `security_invoker = true`.
--
-- Chạy: cd backend && set -a && . ./.env.local && set +a &&
--       .venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzj_vong3_gio_rot_theo_so_trung_va_xac_nhan_hieu_luc.sql
-- Gỡ:   sql/rollback_zzzzzzzj_vong3.sql
--
-- Kiểm lại sau khi chạy (chỉ đọc):
--   -- L10: K00.08.000.02 hết báo thiếu giả (kỳ vọng 0 dòng, trước vá: 10)
--   select khoa, so_luong_q, so_luong_trung, so_luong_thieu
--     from v_gio_rot_v3 where ma_quan_ly = 'K00.08.000.02' and so_luong_thieu > 0;
--
--   -- L11: khoa_da_xac_nhan không còn true khi dòng danh_muc_khoa_chot đã hết hiệu lực
--   select count(*) from v_theo_doi_chuyen_tiep_v3 t
--    where t.khoa_da_xac_nhan
--      and not exists (
--          select 1 from danh_muc_khoa_chot dk
--           where dk.dot_goi_id = t.dot_goi_bo_sung_id and dk.khoa = t.khoa and dk.hieu_luc);
--   -- kỳ vọng: 0

begin;

CREATE OR REPLACE VIEW public.v_gio_rot_v3 WITH (security_invoker = true) AS
 WITH g AS (
         SELECT q.id AS phien_q_id,
            q.dot_goi_id,
            v.ma_quan_ly,
            p.khoa,
            sum(p.q_khoa) AS so_luong_q,
            sum(COALESCE(p.so_luong_trung, 0::numeric)) AS so_luong_trung
           FROM phan_bo_trung_v3 p
             JOIN chot_q_phien q ON q.id = p.phien_q_id AND q.hieu_luc
             JOIN vat_tu v ON v.ma_hang = p.ma_hang
          GROUP BY q.id, q.dot_goi_id, v.ma_quan_ly, p.khoa
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
          WHERE dk.dot_goi_id = cc.dot_goi_bo_sung_id AND dk.khoa = r.khoa AND dk.hieu_luc)) AS khoa_da_xac_nhan,
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

-- ── Tự kiểm cuối patch (raise exception ⇒ rollback transaction) ───────────

-- (1) K00.08.000.02 hết báo "thiếu" giả.
do $$
declare v_con int;
begin
    select count(*) into v_con
    from v_gio_rot_v3
    where ma_quan_ly = 'K00.08.000.02' and so_luong_thieu > 0;

    if v_con > 0 then
        raise exception 'v_gio_rot_v3: còn % dòng K00.08.000.02 báo so_luong_thieu > 0 sau vá (kỳ vọng 0).', v_con;
    end if;
end $$;

-- (2) Với mọi (phien_q_id, ma_quan_ly, khoa) KHÔNG dính chuyen_so_rot_v3
--     hiệu lực, cách tính mới (nền phan_bo_trung_v3) phải khớp TUYỆT ĐỐI
--     cách tính cũ (nền chot_q_dong) — chỉ nhóm có đổ mã mới được phép đổi.
do $$
declare v_le int;
begin
    with g_cu as (
        SELECT q.id AS phien_q_id, q.dot_goi_id, v.ma_quan_ly, d.khoa,
            sum(d.q) AS so_luong_q,
            sum(COALESCE(p.so_luong_trung, 0::numeric)) AS so_luong_trung
        FROM chot_q_phien q
            JOIN chot_q_dong d ON d.phien_id = q.id
            JOIN vat_tu v ON v.ma_hang = d.ma_hang
            LEFT JOIN phan_bo_trung_v3 p ON p.phien_q_id = d.phien_id AND p.ma_hang = d.ma_hang AND p.khoa = d.khoa
        WHERE q.hieu_luc
        GROUP BY q.id, q.dot_goi_id, v.ma_quan_ly, d.khoa
    ),
    g_moi as (
        SELECT q.id AS phien_q_id, q.dot_goi_id, v.ma_quan_ly, p.khoa,
            sum(p.q_khoa) AS so_luong_q,
            sum(COALESCE(p.so_luong_trung, 0::numeric)) AS so_luong_trung
        FROM phan_bo_trung_v3 p
            JOIN chot_q_phien q ON q.id = p.phien_q_id AND q.hieu_luc
            JOIN vat_tu v ON v.ma_hang = p.ma_hang
        GROUP BY q.id, q.dot_goi_id, v.ma_quan_ly, p.khoa
    ),
    khop as (
        SELECT coalesce(c.phien_q_id, m.phien_q_id) AS phien_q_id,
               coalesce(c.ma_quan_ly, m.ma_quan_ly) AS ma_quan_ly,
               coalesce(c.khoa, m.khoa) AS khoa,
               c.so_luong_q AS q_cu, c.so_luong_trung AS trung_cu,
               m.so_luong_q AS q_moi, m.so_luong_trung AS trung_moi
        FROM g_cu c
        FULL OUTER JOIN g_moi m
            ON m.phien_q_id = c.phien_q_id AND m.ma_quan_ly = c.ma_quan_ly AND m.khoa = c.khoa
    ),
    khong_do as (
        SELECT k.* FROM khop k
        WHERE NOT EXISTS (
            SELECT 1 FROM chuyen_so_rot_v3 ch
                JOIN vat_tu v_rot ON v_rot.ma_hang = ch.ma_hang_rot
                JOIN vat_tu v_nhan ON v_nhan.ma_hang = ch.ma_hang_nhan
            WHERE ch.hieu_luc
              AND ch.phien_q_id = k.phien_q_id
              AND ch.khoa = k.khoa
              AND (v_rot.ma_quan_ly = k.ma_quan_ly OR v_nhan.ma_quan_ly = k.ma_quan_ly)
        )
    )
    select count(*) into v_le
    from khong_do
    where q_cu IS DISTINCT FROM q_moi OR trung_cu IS DISTINCT FROM trung_moi;

    if v_le > 0 then
        raise exception 'Có % nhóm (phien_q_id, ma_quan_ly, khoa) KHÔNG dính chuyen_so_rot_v3 hiệu lực mà cách tính mới lệch cách tính cũ — vá sai phạm vi.', v_le;
    end if;
end $$;

-- (3) khoa_da_xac_nhan không bao giờ true khi không có dòng hieu_luc.
do $$
declare v_sai int;
begin
    select count(*) into v_sai
    from v_theo_doi_chuyen_tiep_v3 t
    where t.khoa_da_xac_nhan
      and not exists (
          select 1 from danh_muc_khoa_chot dk
           where dk.dot_goi_id = t.dot_goi_bo_sung_id and dk.khoa = t.khoa and dk.hieu_luc
      );

    if v_sai > 0 then
        raise exception 'v_theo_doi_chuyen_tiep_v3: còn % dòng khoa_da_xac_nhan=true mà không có danh_muc_khoa_chot hiệu lực tương ứng.', v_sai;
    end if;
end $$;

commit;
