-- rollback_zzzzzzzv_rot_ca_ma_sau_trinh_ky.sql — lùi patch_zzzzzzzv.
-- Chỉ lùi được khi không còn dòng rớt hiệu lực ở Mở thầu / Kết quả đánh giá.
-- v_ket_qua_thau_v3 GIỮ hai cột cuối r_mo_thau / r_danh_gia (bỏ cột view phải
-- drop cả v_phan_bo_trung_theo_ma_v3) nhưng số trúng quay về q − r1 − r2 − r3.
do $$
begin
    if exists (select 1 from ket_qua_rot_v3 where hieu_luc and giai_doan in ('mo_thau','danh_gia')) then
        raise exception 'Còn mã rớt ở Mở thầu / Kết quả đánh giá — bỏ rớt trước khi lùi.';
    end if;
end $$;

drop function if exists rot_ca_ma_sau_trinh_ky_v3(bigint, text, text, text);
drop function if exists bo_rot_ca_ma_sau_trinh_ky_v3(bigint, text, text, text);

CREATE OR REPLACE FUNCTION public.fn_khoa_ket_qua_sau_chot_trinh_ky_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_dot_goi_id bigint;
begin
    v_dot_goi_id := case when TG_OP = 'DELETE' then old.dot_goi_id else new.dot_goi_id end;
    if exists (select 1 from chot_trinh_ky_khoa_v3
               where dot_goi_id = v_dot_goi_id) then
        raise exception 'Đã có bảng khoa chốt trình ký; phải mở chốt trình ký trước khi sửa kết quả.';
    end if;
    return case when TG_OP = 'DELETE' then old else new end;
end;
$function$;

create or replace view v_ket_qua_thau_v3 as
 WITH q AS (
         SELECT p.id AS phien_q_id, p.dot_goi_id, p.revision, d.ma_hang, sum(d.q) AS q
           FROM chot_q_phien p JOIN chot_q_dong d ON d.phien_id = p.id
          WHERE p.hieu_luc
          GROUP BY p.id, p.dot_goi_id, p.revision, d.ma_hang
        ), r AS (
         SELECT k.phien_q_id, k.ma_hang,
            COALESCE(sum(k.so_luong_rot) FILTER (WHERE k.giai_doan = 'chao_gia' AND k.hieu_luc), 0::numeric) AS r1,
            COALESCE(sum(k.so_luong_rot) FILTER (WHERE k.giai_doan = 'kiem_tra_dvdt' AND k.hieu_luc), 0::numeric) AS r2,
            COALESCE(sum(k.so_luong_rot) FILTER (WHERE k.giai_doan = 'hoi_dong' AND k.hieu_luc), 0::numeric) AS r3
           FROM ket_qua_rot_v3 k
          GROUP BY k.phien_q_id, k.ma_hang
        ), t AS (
         SELECT q.*, COALESCE(r.r1, 0::numeric) AS r1, COALESCE(r.r2, 0::numeric) AS r2, COALESCE(r.r3, 0::numeric) AS r3
           FROM q LEFT JOIN r ON r.phien_q_id = q.phien_q_id AND r.ma_hang = q.ma_hang
        )
 SELECT t.phien_q_id, t.dot_goi_id, t.revision, t.ma_hang, t.q, t.r1, t.r2, t.r3,
    t.q - t.r1 - t.r2 - t.r3 AS so_luong_trung,
    (t.r1 + t.r2 + t.r3) > 0::numeric AS co_rot,
    t.q = (t.r1 + t.r2 + t.r3) AS rot_toan_bo,
    0::numeric AS r_mo_thau,
    0::numeric AS r_danh_gia
   FROM t;
