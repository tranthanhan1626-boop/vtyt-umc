-- patch_zzzzzzzv_rot_ca_ma_sau_trinh_ky.sql — 28/10/2026, chủ dự án duyệt "miếng 3".
--
-- Mở thầu / Kết quả đánh giá (sau chốt trình ký): PĐD chỉ cập nhật kết quả.
-- Thường mọi mã trúng theo danh sách đã trình ký; mã KHÔNG CÓ NHÀ THẦU tham dự
-- thì đánh rớt CẢ MÃ, rồi bấm "Xác nhận rớt" (có sẵn) để số đã trình ký của
-- từng khoa vào giỏ đợt bổ sung + báo khoa (xac_nhan_rot_v3 không đụng bảng bị
-- khoá sau trình ký, giữ nguyên).
--
--   * rot_ca_ma_sau_trinh_ky_v3   — đánh rớt cả mã ở mo_thau / danh_gia (giai
--     đoạn đó đang chạy, đã có bản trình ký hiệu lực). Gọi ghi_ngoai_le_rot_v3
--     với p_rot_toan_bo; số trúng các khoa của mã về 0 (fn_dong_bo_phan_bo_trung_v3).
--   * bo_rot_ca_ma_sau_trinh_ky_v3 — bấm nhầm: bỏ rớt, trả số trúng từng khoa về
--     đúng bản trình ký (chot_trinh_ky_dong_v3). Chỉ khi CHƯA Xác nhận rớt.
--   * Trigger khoá sau trình ký (ket_qua_rot_v3, phan_bo_trung_v3) chừa đúng hai
--     hàm trên: chúng bật cờ giao dịch `vtyt.rot_ca_ma_sau_trinh_ky`. Cờ chỉ đặt
--     được từ trong hàm (PostgREST không mở set_config ra ngoài).
--   * v_ket_qua_thau_v3: thêm hai cột CUỐI r_mo_thau, r_danh_gia; số trúng trừ
--     cả hai. Bản trình ký đã in (chot_trinh_ky_dong_v3) KHÔNG đổi.
-- Lùi: rollback_zzzzzzzv_rot_ca_ma_sau_trinh_ky.sql.

-- ── 1. Trigger khoá sau trình ký: chừa cờ của hai hàm rớt cả mã ────────────
create or replace function fn_khoa_ket_qua_sau_chot_trinh_ky_v3()
returns trigger language plpgsql set search_path to 'public' as $function$
declare v_dot_goi_id bigint;
begin
    -- 28/10/2026 (miếng 3): rớt cả mã ở Mở thầu / Kết quả đánh giá.
    if current_setting('vtyt.rot_ca_ma_sau_trinh_ky', true) = 'on' then
        return case when TG_OP = 'DELETE' then old else new end;
    end if;
    v_dot_goi_id := case when TG_OP = 'DELETE' then old.dot_goi_id else new.dot_goi_id end;
    if exists (select 1 from chot_trinh_ky_khoa_v3
               where dot_goi_id = v_dot_goi_id) then
        raise exception 'Đã có bảng khoa chốt trình ký; phải mở chốt trình ký trước khi sửa kết quả.';
    end if;
    return case when TG_OP = 'DELETE' then old else new end;
end;
$function$;

-- ── 2. Kết quả thầu theo mã: thêm rớt ở Mở thầu / Kết quả đánh giá ─────────
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
            COALESCE(sum(k.so_luong_rot) FILTER (WHERE k.giai_doan = 'hoi_dong' AND k.hieu_luc), 0::numeric) AS r3,
            COALESCE(sum(k.so_luong_rot) FILTER (WHERE k.giai_doan = 'mo_thau' AND k.hieu_luc), 0::numeric) AS r4,
            COALESCE(sum(k.so_luong_rot) FILTER (WHERE k.giai_doan = 'danh_gia' AND k.hieu_luc), 0::numeric) AS r5
           FROM ket_qua_rot_v3 k
          GROUP BY k.phien_q_id, k.ma_hang
        ), t AS (
         SELECT q.*,
            COALESCE(r.r1, 0::numeric) AS r1, COALESCE(r.r2, 0::numeric) AS r2, COALESCE(r.r3, 0::numeric) AS r3,
            COALESCE(r.r4, 0::numeric) AS r4, COALESCE(r.r5, 0::numeric) AS r5
           FROM q LEFT JOIN r ON r.phien_q_id = q.phien_q_id AND r.ma_hang = q.ma_hang
        )
 SELECT t.phien_q_id, t.dot_goi_id, t.revision, t.ma_hang, t.q,
    t.r1, t.r2, t.r3,
    t.q - t.r1 - t.r2 - t.r3 - t.r4 - t.r5 AS so_luong_trung,
    (t.r1 + t.r2 + t.r3 + t.r4 + t.r5) > 0::numeric AS co_rot,
    t.q = (t.r1 + t.r2 + t.r3 + t.r4 + t.r5) AS rot_toan_bo,
    t.r4 AS r_mo_thau,
    t.r5 AS r_danh_gia
   FROM t;

-- ── 3. Đánh rớt cả mã ─────────────────────────────────────────────────────
create or replace function rot_ca_ma_sau_trinh_ky_v3(p_dot_goi_id bigint, p_ma_hang text, p_giai_doan text, p_ly_do text)
returns ket_qua_rot_v3 language plpgsql security definer set search_path to 'public', 'auth' as $function$
declare v_con numeric; v_row ket_qua_rot_v3%rowtype;
begin
    if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được đánh rớt mã.'; end if;
    if p_giai_doan not in ('mo_thau','danh_gia') then
        raise exception 'Chỉ đánh rớt cả mã ở Mở thầu hoặc Kết quả đánh giá.';
    end if;
    if not exists (select 1 from chot_trinh_ky_phien_v3 where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'Phải chốt trình ký trước khi Mở thầu.';
    end if;
    select so_luong_trung into v_con from v_ket_qua_thau_v3
    where dot_goi_id = p_dot_goi_id and ma_hang = btrim(p_ma_hang);
    if not found then raise exception 'Mã không có trong danh sách đi thầu của gói con.'; end if;
    if v_con <= 0 then raise exception 'Mã này đã rớt hết, không còn gì để đánh rớt.'; end if;
    perform set_config('vtyt.rot_ca_ma_sau_trinh_ky', 'on', true);
    -- ghi_ngoai_le_rot_v3 tự kiểm giai đoạn đang chạy, lý do bắt buộc, ghi audit.
    v_row := ghi_ngoai_le_rot_v3(p_dot_goi_id, btrim(p_ma_hang), p_giai_doan, null, true, p_ly_do);
    perform set_config('vtyt.rot_ca_ma_sau_trinh_ky', 'off', true);
    return v_row;
end;
$function$;
revoke all on function rot_ca_ma_sau_trinh_ky_v3(bigint, text, text, text) from public, anon;
grant execute on function rot_ca_ma_sau_trinh_ky_v3(bigint, text, text, text) to authenticated;

-- ── 4. Bỏ rớt cả mã (bấm nhầm, chưa Xác nhận rớt) ──────────────────────────
create or replace function bo_rot_ca_ma_sau_trinh_ky_v3(p_dot_goi_id bigint, p_ma_hang text, p_giai_doan text, p_ly_do text)
returns boolean language plpgsql security definer set search_path to 'public', 'auth' as $function$
declare v_tk bigint; v_phien bigint; v_con_lai numeric; v_da_ky numeric;
begin
    if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được bỏ rớt mã.'; end if;
    if p_giai_doan not in ('mo_thau','danh_gia') then
        raise exception 'Chỉ bỏ rớt cả mã ở Mở thầu hoặc Kết quả đánh giá.';
    end if;
    if not exists (select 1 from giai_doan_thau_v3
                   where dot_goi_id = p_dot_goi_id and giai_doan = p_giai_doan and trang_thai = 'dang_thuc_hien') then
        raise exception 'Giai đoạn phải ở trạng thái đang thực hiện.';
    end if;
    select id into v_tk from chot_trinh_ky_phien_v3 where dot_goi_id = p_dot_goi_id and hieu_luc;
    if v_tk is null then raise exception 'Gói con chưa có bản trình ký hiệu lực.'; end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    -- Đã Xác nhận rớt thì số đã vào giỏ bổ sung của khoa — không bỏ ở đây được.
    select coalesce(sum(con_lai), 0) into v_con_lai from v_rot_chua_xu_ly_v3
    where phien_q_id = v_phien and ma_hang = btrim(p_ma_hang);
    select coalesce(sum(so_luong_trung), 0) into v_da_ky from chot_trinh_ky_dong_v3
    where phien_id = v_tk and ma_hang = btrim(p_ma_hang);
    if v_con_lai < v_da_ky then
        raise exception 'Mã đã Xác nhận rớt (số đã vào giỏ bổ sung của khoa) — không bỏ rớt được nữa.';
    end if;
    perform set_config('vtyt.rot_ca_ma_sau_trinh_ky', 'on', true);
    if not bo_ngoai_le_rot_v3(p_dot_goi_id, btrim(p_ma_hang), p_giai_doan, p_ly_do) then
        perform set_config('vtyt.rot_ca_ma_sau_trinh_ky', 'off', true);
        return false;
    end if;
    -- Trả số trúng từng khoa về đúng bản đã trình ký.
    update phan_bo_trung_v3 t
       set so_luong_trung = d.so_luong_trung, revision = t.revision + 1,
           updated_by = coalesce(auth.email(), 'system'), updated_at = now()
      from chot_trinh_ky_dong_v3 d
     where d.phien_id = v_tk and d.ma_hang = btrim(p_ma_hang)
       and t.phien_q_id = d.phien_q_id and t.ma_hang = d.ma_hang and t.khoa = d.khoa;
    perform set_config('vtyt.rot_ca_ma_sau_trinh_ky', 'off', true);
    return true;
end;
$function$;
revoke all on function bo_rot_ca_ma_sau_trinh_ky_v3(bigint, text, text, text) from public, anon;
grant execute on function bo_rot_ca_ma_sau_trinh_ky_v3(bigint, text, text, text) to authenticated;
