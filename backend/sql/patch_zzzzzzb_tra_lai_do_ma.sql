-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzzb — TRẢ LẠI ĐỔ MÃ, GỠ PHẦN GHI ĐÈ (26/08/2026)
--
-- patch_zzzzzza định ghi thẳng phần điều chuyển vào `phan_bo_khoa`. Chạy lên
-- staging mới lộ ra: bảng đó bị **KHOÁ CỨNG 1** chặn —
--
--     trg_khoa_phan_bo_sau_chot_q  BEFORE INSERT/UPDATE/DELETE
--     → 'Số tham gia thầu đã chốt; PĐD phải mở snapshot Q trước.'
--
-- Mà `day_so_luong_rot_v3` bắt buộc phải có `chot_q_phien.hieu_luc`, tức đổ mã
-- LUÔN LUÔN xảy ra sau chốt Q. Nên đường ghi đè không bao giờ đi được, và để
-- nguyên thì mỗi lần PĐD bấm "đổ" đều ăn exception — hỏng hẳn chức năng.
--
-- Gỡ hai lời gọi ghi đè, trả `day_so_luong_rot_v3` và `bo_chuyen_so_rot_v3` về
-- đúng hành vi cũ (giữ lại phần chữ thông báo rõ hơn). `fn_ap_dieu_chuyen…`
-- để nguyên, không ai gọi — chờ chủ dự án quyết cách hiện số.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function day_so_luong_rot_v3(
    p_dot_goi_id bigint, p_ma_hang_rot text, p_ma_hang_nhan text, p_ly_do text)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien bigint; v_mql_rot text; v_mql_nhan text;
    v_dvt_rot text; v_dvt_nhan text; v_ten_nhan text; v_so int := 0; r record;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được đổ số rớt sang mã tương đương.';
    end if;
    if nullif(btrim(p_ly_do),'') is null then
        raise exception 'Phải nhập lý do khi đổ số rớt sang mã khác.';
    end if;
    if btrim(p_ma_hang_rot) = btrim(p_ma_hang_nhan) then
        raise exception 'Mã nhận phải khác mã rớt.';
    end if;

    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    select ma_quan_ly, dvt into v_mql_rot, v_dvt_rot from vat_tu where ma_hang = p_ma_hang_rot;
    select ma_quan_ly, dvt, ten_vat_tu into v_mql_nhan, v_dvt_nhan, v_ten_nhan
    from vat_tu where ma_hang = p_ma_hang_nhan;
    if v_mql_nhan is null then raise exception 'Không có mã hàng %.', p_ma_hang_nhan; end if;

    if v_mql_rot is distinct from v_mql_nhan then
        raise exception 'Mã nhận (%) không cùng mã quản lý với mã rớt (%): % ≠ %.',
            p_ma_hang_nhan, p_ma_hang_rot, coalesce(v_mql_nhan,'—'), coalesce(v_mql_rot,'—');
    end if;

    if not exists (select 1 from v_ket_qua_thau_v3 k
                   where k.phien_q_id = v_phien and k.ma_hang = p_ma_hang_nhan) then
        raise exception 'Mã nhận % không có trong đợt này — chỉ đổ được sang mã cùng nhóm đã mang đi thầu.',
            p_ma_hang_nhan;
    end if;
    if (select so_luong_trung from v_ket_qua_thau_v3
        where phien_q_id = v_phien and ma_hang = p_ma_hang_nhan) <= 0 then
        raise exception 'Mã nhận % cũng đã rớt sạch, không gánh thêm được.', p_ma_hang_nhan;
    end if;

    if coalesce(btrim(v_dvt_rot),'') is distinct from coalesce(btrim(v_dvt_nhan),'') then
        raise exception
            'Lệch đơn vị tính — mã rớt % tính theo "%", mã nhận % tính theo "%". Không đổ tự động; nhập tay số cho mã nhận.',
            p_ma_hang_rot, coalesce(v_dvt_rot,'—'), p_ma_hang_nhan, coalesce(v_dvt_nhan,'—');
    end if;

    if exists (select 1 from v_phan_bo_trung_theo_ma_v3
               where phien_q_id = v_phien and ma_hang = p_ma_hang_rot and not da_khop) then
        raise exception
            'Mã % chưa chia hết số trúng về khoa nên chưa biết mỗi khoa rớt bao nhiêu. Gõ số cho từng khoa hoặc bấm "Chia theo tỉ lệ Q" rồi hãy đổ.',
            p_ma_hang_rot;
    end if;

    for r in
        select khoa, con_lai from v_rot_chua_xu_ly_v3
        where phien_q_id = v_phien and ma_hang = p_ma_hang_rot and con_lai > 0
    loop
        insert into chuyen_so_rot_v3
            (phien_q_id, dot_goi_id, ma_hang_rot, ma_hang_nhan, khoa, so_luong,
             khoa_chua_tung_dung, ly_do, created_by)
        values
            (v_phien, p_dot_goi_id, p_ma_hang_rot, p_ma_hang_nhan, r.khoa, r.con_lai,
             not exists (select 1 from phan_bo_khoa pb
                         where pb.dot_goi_id = p_dot_goi_id
                           and pb.ma_hang = p_ma_hang_nhan and pb.khoa = r.khoa),
             btrim(p_ly_do), coalesce(auth.email(),'system'))
        on conflict (phien_q_id, ma_hang_rot, khoa) where hieu_luc
        do update set ma_hang_nhan = excluded.ma_hang_nhan,
                      so_luong = chuyen_so_rot_v3.so_luong + excluded.so_luong,
                      ly_do = excluded.ly_do, created_at = now();
        v_so := v_so + 1;

        perform fn_ghi_thong_bao(
            'khoa', r.khoa, 'chuyen_ma',
            format('Mã %s rớt — số của khoa chuyển sang mã %s', p_ma_hang_rot, p_ma_hang_nhan),
            format('%s %s đã được chuyển sang mã %s (%s). Số đề xuất mã %s của khoa nay là 0, phần đó đã cộng vào mã %s.%s',
                   r.con_lai, coalesce(v_dvt_rot,''), p_ma_hang_nhan, coalesce(v_ten_nhan,''),
                   p_ma_hang_rot, p_ma_hang_nhan,
                   case when not exists (select 1 from phan_bo_khoa pb
                                         where pb.dot_goi_id = p_dot_goi_id
                                           and pb.ma_hang = p_ma_hang_nhan and pb.khoa = r.khoa)
                        then ' ⚠ Đây là mã khoa CHƯA TỪNG đề xuất — kiểm lại trước khi dùng.'
                        else '' end),
            p_dot_goi_id,
            jsonb_build_object('ma_hang_rot', p_ma_hang_rot, 'ma_hang_nhan', p_ma_hang_nhan,
                               'so_luong', r.con_lai),
            'do');
    end loop;

    insert into phan_bo_trung_v3
        (phien_q_id, dot_goi_id, ma_hang, khoa, q_khoa, so_luong_trung, updated_by)
    select v_phien, p_dot_goi_id, p_ma_hang_nhan, c.khoa, 0, 0,
           coalesce(auth.email(),'system')
    from chuyen_so_rot_v3 c
    where c.phien_q_id = v_phien and c.ma_hang_nhan = p_ma_hang_nhan and c.hieu_luc
    on conflict (phien_q_id, ma_hang, khoa) do nothing;

    update phan_bo_trung_v3
       set so_luong_trung = 0, revision = revision + 1,
           updated_by = coalesce(auth.email(),'system'), updated_at = now()
     where phien_q_id = v_phien and ma_hang = p_ma_hang_nhan and so_luong_trung <> 0;

    if v_so = 0 then
        raise exception 'Mã % không còn phần rớt nào chưa xử lý để đổ.', p_ma_hang_rot;
    end if;

    perform fn_ghi_thong_bao('pdd', null, 'chuyen_ma',
        format('Đã đổ số rớt của mã %s sang mã %s cho %s khoa — số đề xuất hai mã đã cập nhật',
               p_ma_hang_rot, p_ma_hang_nhan, v_so),
        btrim(p_ly_do), p_dot_goi_id,
        jsonb_build_object('ma_hang_rot', p_ma_hang_rot, 'ma_hang_nhan', p_ma_hang_nhan, 'so_khoa', v_so));
    return v_so;
end;
$$;

-- ── Bỏ đổ: TRẢ SỐ VỀ ───────────────────────────────────────────────────────
-- Đây là phần bịt điểm yếu của "ghi đè": không có nó thì bỏ ngoại lệ đổ xong,
-- mã A vẫn nằm 0 và mã B vẫn giữ phần nhận — PĐD phải gõ tay lại từng khoa.
create or replace function bo_chuyen_so_rot_v3(
    p_dot_goi_id bigint, p_ma_hang_rot text, p_ly_do text)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare v_phien bigint; v_so int := 0; r record;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được bỏ chuyển số rớt.';
    end if;
    if nullif(btrim(p_ly_do),'') is null then
        raise exception 'Phải nhập lý do bỏ.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    for r in
        select ma_hang_nhan, khoa, so_luong from chuyen_so_rot_v3
        where phien_q_id = v_phien and ma_hang_rot = p_ma_hang_rot and hieu_luc
    loop
        v_so := v_so + 1;
    end loop;

    update chuyen_so_rot_v3
       set hieu_luc = false, invalidated_by = coalesce(auth.email(),'system'),
           invalidated_at = now()
     where phien_q_id = v_phien and ma_hang_rot = p_ma_hang_rot and hieu_luc;
    return v_so;
end;
$$;
