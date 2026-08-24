-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzb — VÁ LỖI TÌM ĐƯỢC Ở VÒNG TEST QUY MÔ THẬT (24/08/2026)
-- 250 mã hàng × 60 khoa · 5.470 dòng đề xuất
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- LỖI 1 — Ghi phan_bo_khoa KHÔNG QUA JWT là vỡ NOT NULL
--
-- `fn_phan_bo_danh_dau_ai_sua` gán:
--     new.sua_boi_khoa := (current_user_role() = 'dvsd');
-- Không có JWT thì `current_user_role()` trả NULL, mà `NULL = 'dvsd'` ra NULL
-- chứ không ra false. Cột `sua_boi_khoa` là NOT NULL nên toàn bộ câu ghi vỡ.
--
-- Cột có DEFAULT false, nhưng trigger BEFORE ghi đè default bằng NULL — nên
-- default không cứu được.
--
-- Ai dính: mọi đường ghi không mang JWT — script nạp dữ liệu, service role,
-- migration, và bất cứ job nền nào sau này. Người dùng thật không dính vì luôn
-- có JWT, nên lỗi này nằm im cho tới khi có ai đó nạp dữ liệu bằng script.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_phan_bo_danh_dau_ai_sua()
returns trigger language plpgsql set search_path to 'public', 'auth' as $$
begin
    -- coalesce: không có JWT thì coi như KHÔNG PHẢI khoa sửa. Đúng nghĩa —
    -- script và service role không phải là khoa.
    new.sua_boi_khoa := coalesce(current_user_role() = 'dvsd', false);
    return new;
end;
$$;

drop trigger if exists trg_phan_bo_danh_dau_ai_sua on phan_bo_khoa;
create trigger trg_phan_bo_danh_dau_ai_sua
before insert or update of so_luong_hien_hanh on phan_bo_khoa
for each row execute function fn_phan_bo_danh_dau_ai_sua();

-- ───────────────────────────────────────────────────────────────────────────
-- LỖI 2 — Cò trả về MỘT DÒNG cho mỗi (mã × khoa), PostgREST cắt ở 1.000
--
-- Đo thật: 1.608 dòng cần cuốn chiếu, DB ghi đủ 1.608, nhưng RPC chỉ TRẢ VỀ
-- 1.000 nên giao diện báo "Đã cuốn chiếu 1.000 dòng". Số liệu không mất, nhưng
-- người dùng đọc thấy hụt 608 dòng và sẽ tưởng cò chạy sót.
--
-- Sửa: trả về TÓM TẮT (mấy dòng, mấy mã, mấy khoa, đợt nào) thay vì bảng dài.
-- Cần chi tiết thì đã có màn Theo dõi cuốn chiếu đọc v_theo_doi_cuon_chieu_v3.
-- ───────────────────────────────────────────────────────────────────────────
drop function if exists xac_nhan_rot_v3(bigint, text, text);

create or replace function xac_nhan_rot_v3(
    p_dot_goi_id bigint, p_giai_doan text default null, p_ma_hang text default null)
returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien bigint; v_bs bigint; v_nam int; v_prop bigint; v_ver int; r record;
    v_so_dong int := 0; v_khoa_set text[] := '{}'; v_ma_set text[] := '{}';
    v_nhan text; v_thang smallint; v_nam_bs int;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được xác nhận rớt.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    v_bs := fn_dot_bo_sung_gan_nhat();
    select d.nam, d.thang_moc, gc.nhan into v_nam, v_thang, v_nhan
    from dot_goi dg join dot_de_xuat d on d.id = dg.dot_id
    join goi_con gc on gc.goi_id = dg.goi_id where dg.id = v_bs;
    v_nam_bs := v_nam;

    for r in
        select v.ma_hang, v.khoa, v.con_lai, v.ten_vat_tu, v.dvt
        from v_rot_chua_xu_ly_v3 v
        where v.phien_q_id = v_phien and v.con_lai > 0
          and (p_ma_hang is null or v.ma_hang = p_ma_hang)
        order by v.ma_hang, v.khoa
    loop
        insert into dot_goi_khoa (dot_goi_id, khoa, tham_gia, updated_by)
        values (v_bs, r.khoa, true, coalesce(auth.email(),'system'))
        on conflict (dot_goi_id, khoa) do update set tham_gia = true;

        -- LỖI 3 — `proposals` có UNIQUE (ma_hang, don_vi, nam_de_xuat, version).
        -- Bản cũ chèn thẳng version mặc định 1 nên VỠ ngay khi khoa đã có đề
        -- xuất mã đó trong năm ấy — xảy ra ở hai tình huống RẤT THƯỜNG:
        --   · mã rớt thêm ở giai đoạn sau, PĐD bấm Xác nhận rớt lần hai;
        --   · khoa đã tự đề xuất mã đó trong đợt bổ sung trước khi nó rớt.
        -- Đo thật ở quy mô 250×60: cò vỡ hoàn toàn, KHÔNG cuốn chiếu được dòng nào.
        -- Sửa: lên version mới, hạ cờ is_current của bản cũ.
        select coalesce(max(version), 0) + 1 into v_ver
        from proposals where ma_hang = r.ma_hang and don_vi = r.khoa and nam_de_xuat = v_nam;

        update proposals set is_current = false
        where ma_hang = r.ma_hang and don_vi = r.khoa and nam_de_xuat = v_nam and is_current;

        insert into proposals (ma_hang, don_vi, nam_de_xuat, version, so_luong,
                               loai_mua_sam, dot_id, dot_goi_id, created_by, is_current)
        select r.ma_hang, r.khoa, v_nam, v_ver, r.con_lai, 'mua_sam_bo_sung',
               dg.dot_id, v_bs, coalesce(auth.email(),'system'), true
        from dot_goi dg where dg.id = v_bs
        returning id into v_prop;

        insert into cuon_chieu_rot_v3
            (phien_q_id, dot_goi_id_goc, ma_hang, khoa, so_luong,
             giai_doan_phat_sinh, dot_goi_bo_sung_id, proposal_id, created_by)
        values (v_phien, p_dot_goi_id, r.ma_hang, r.khoa, r.con_lai,
                p_giai_doan, v_bs, v_prop, coalesce(auth.email(),'system'))
        on conflict (phien_q_id, ma_hang, khoa) do update set
            so_luong = cuon_chieu_rot_v3.so_luong + excluded.so_luong,
            dot_goi_bo_sung_id = excluded.dot_goi_bo_sung_id,
            proposal_id = excluded.proposal_id;

        if not (r.khoa = any(v_khoa_set)) then v_khoa_set := v_khoa_set || r.khoa; end if;
        if not (r.ma_hang = any(v_ma_set)) then v_ma_set := v_ma_set || r.ma_hang; end if;
        v_so_dong := v_so_dong + 1;
    end loop;

    -- LỖI 4 — Bản cũ ghi MỘT thông báo cho mỗi (mã × khoa). Đo thật: một lần
    -- bấm đẻ 1.609 dòng, mỗi khoa ~27 dòng. Đó là ngập, trái hẳn QĐ D5.
    -- Sửa: gộp MỘT dòng cho mỗi khoa, kèm danh sách mã trong `du_lieu`.
    if v_so_dong > 0 then
        insert into thong_bao (pham_vi, khoa, loai, tieu_de, noi_dung, dot_goi_id, du_lieu, mau, created_by)
        select 'khoa', k.khoa, 'ma_rot_ve_khoa',
               format('%s mã rớt thầu — đã đưa vào %s', k.so_ma, coalesce(v_nhan, 'đợt bổ sung')),
               format('Tổng %s đơn vị đã được đưa sẵn vào đợt bổ sung tháng %s/%s với số lượng mặc định bằng số rớt. Khoa vào sửa lại nếu cần — khoa quyết số cuối cùng.',
                      k.tong, v_thang, v_nam_bs),
               v_bs,
               jsonb_build_object('so_ma', k.so_ma, 'tong', k.tong, 'ma_hang', k.ds,
                                  'dot_goi_goc', p_dot_goi_id),
               'do', coalesce(auth.email(),'system')
        from (
            select khoa, count(*) so_ma, sum(so_luong) tong,
                   array_agg(ma_hang order by ma_hang) ds
            from cuon_chieu_rot_v3
            where phien_q_id = v_phien and dot_goi_bo_sung_id = v_bs and khoa = any(v_khoa_set)
            group by khoa
        ) k;

        perform fn_ghi_thong_bao('pdd', null, 'ma_rot_ve_khoa',
            format('Đã cuốn chiếu %s dòng rớt (%s mã × %s khoa) về %s',
                   v_so_dong, array_length(v_ma_set,1), array_length(v_khoa_set,1),
                   coalesce(v_nhan,'đợt bổ sung')),
            null, p_dot_goi_id,
            jsonb_build_object('so_dong', v_so_dong, 'so_ma', array_length(v_ma_set,1),
                               'so_khoa', array_length(v_khoa_set,1),
                               'dot_goi_bo_sung_id', v_bs), 'do');
    end if;

    return jsonb_build_object(
        'so_dong', v_so_dong,
        'so_ma', coalesce(array_length(v_ma_set,1), 0),
        'so_khoa', coalesce(array_length(v_khoa_set,1), 0),
        'dot_goi_bo_sung_id', v_bs,
        'ten_dot', v_nhan,
        'thang', v_thang, 'nam', v_nam_bs);
end;
$$;

grant execute on function xac_nhan_rot_v3(bigint, text, text) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- LỖI 5 — Sửa một ô cột chữ báo cho khoa của MỌI ĐỢT ĐANG MỞ
--
-- Đo thật: một lần sửa ô đẻ 120 dòng noti khi có 2 đợt đang mở — khoa ở đợt
-- KHÁC cũng bị báo, dù ô vừa sửa không liên quan gì tới đợt của họ.
-- `danh_muc_tong_hop_o.goi_id` mang sẵn hậu tố ':dot:<id>' nên khoanh được.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_thong_bao_o_tong_hop() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare v_role text := current_user_role(); v_dot bigint; k record;
begin
    if v_role not in ('dieu_duong','admin') then return new; end if;
    -- Chỉ báo cho khoa TRONG ĐÚNG ĐỢT của ô vừa sửa.
    v_dot := nullif(split_part(new.goi_id, ':dot:', 2), '')::bigint;
    for k in
        select distinct pb.khoa, pb.dot_goi_id
        from phan_bo_khoa pb
        join dot_goi dg on dg.id = pb.dot_goi_id and dg.trang_thai = 'mo'
        where pb.ma_hang = new.ma_hang
          and (v_dot is null or dg.dot_id = v_dot)
    loop
        perform fn_ghi_thong_bao('khoa', k.khoa, 'pdd_sua',
            'Phòng Điều dưỡng vừa sửa nội dung trên danh mục tổng hợp',
            'Mở lại Danh mục đề xuất của khoa để xem nội dung mới.',
            k.dot_goi_id, jsonb_build_object('ma_hang', new.ma_hang, 'cot', new.cot));
    end loop;
    return new;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- LỖI 6 — Bảng tổng hợp tải 1.608 dòng cấp (mã × khoa) chỉ để hiện tổng theo MÃ
--
-- Đo thật 24/08/2026 trên trình duyệt, 250 mã × 60 khoa:
--   v_rot_chua_xu_ly_v3  2.053 ms + 1.342 ms (hai lượt phân trang)
--   → chiếm quá nửa thời gian mở bảng (tổng ~9 s)
-- Mà cụm cột thầu chỉ hiện MỘT con số cho mỗi mã hàng. Gộp ở server là bỏ được
-- 4 truy vấn và ~1.350 dòng truyền qua mạng.
-- ───────────────────────────────────────────────────────────────────────────
create index if not exists chuyen_so_rot_v3_phien_idx
    on chuyen_so_rot_v3 (phien_q_id, ma_hang_rot) where hieu_luc;
create index if not exists cuon_chieu_rot_v3_phien_idx
    on cuon_chieu_rot_v3 (phien_q_id, ma_hang);

create or replace view v_rot_theo_ma_v3 as
select
    r.phien_q_id, r.dot_goi_id, r.ma_hang,
    sum(r.so_rot)         as so_rot,
    sum(r.da_chuyen)      as da_chuyen,
    sum(r.da_cuon_chieu)  as da_cuon_chieu,
    sum(r.con_lai)        as con_lai,
    count(*)              as so_khoa,
    (select string_agg(distinct c.ma_hang_nhan, ', ')
       from chuyen_so_rot_v3 c
      where c.phien_q_id = r.phien_q_id and c.ma_hang_rot = r.ma_hang and c.hieu_luc)
                          as ma_hang_nhan,
    coalesce((select bool_or(c.khoa_chua_tung_dung)
       from chuyen_so_rot_v3 c
      where c.phien_q_id = r.phien_q_id and c.ma_hang_rot = r.ma_hang and c.hieu_luc), false)
                          as co_khoa_chua_tung_dung
from v_rot_chua_xu_ly_v3 r
group by r.phien_q_id, r.dot_goi_id, r.ma_hang;

comment on view v_rot_theo_ma_v3 is
    'Tổng phần rớt theo TỪNG MÃ HÀNG — nguồn của cụm cột thầu trên bảng Tổng hợp. Cấp mã × khoa nằm ở v_rot_chua_xu_ly_v3, chỉ dùng cho màn theo dõi.';

grant select on v_rot_theo_ma_v3 to authenticated;
