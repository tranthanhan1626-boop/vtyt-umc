-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzy — MỤC RỚT TRONG GIỎ PHẢI ĐỦ TRƯỜNG NHƯ KHOA TỰ BỎ VÀO
--                (vá tiếp patch_zzzzzx, cùng ngày 26/08/2026)
--
-- patch_zzzzzx ghi vào `gio_nhap.noi_dung` một mục CHỈ CÓ số lượng và mốc
-- tháng. Nhưng màn giỏ của khoa (`Function1.jsx`) đọc giỏ bằng
-- `Object.values(nhapLieu)` — nó cần chính mục đó mang sẵn danh tính:
--
--     ma_hang · ten_vat_tu · dvt · ma_quan_ly · ten_quan_ly · goi
--
--     gioHang     (:1255) → `Object.values(nhapLieu)` rồi đọc `n.ma_hang`
--     nhomTrongGio(:796)  → đọc `n.ma_quan_ly`
--     submit()    (:1361) → gửi `ma_hang` lên `submit_proposal_group_v2`
--
-- Thiếu mấy trường này thì giỏ hiện dòng trống và bấm "Gửi giỏ" đẩy lên
-- `ma_hang: undefined`. Tức là mã rớt vào giỏ nhưng khoa KHÔNG gửi đi được —
-- đúng cái vòng mà QĐ 26/08 muốn nối liền.
--
-- ⚠️ Bài học ghi vào 06_DUNG_LAM_LAI: hễ server ghi thẳng vào một cấu trúc mà
-- frontend dựng, phải đọc chỗ frontend TIÊU THỤ cấu trúc đó, không chỉ chỗ nó
-- GHI ra. `MAC_DINH_NHAP()` chỉ là phần mặc định; danh tính mã hàng được gắn
-- sau, ở chỗ bỏ mã vào giỏ.
--
-- Chạy lại được nhiều lần. Chỉ đổi phần dựng jsonb trong vòng lặp.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function xac_nhan_rot_v3(
    p_dot_goi_id bigint, p_giai_doan text default null, p_ma_hang text default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien bigint; v_bs bigint; v_nam int; r record;
    v_so_dong int := 0; v_khoa_set text[] := '{}'; v_ma_set text[] := '{}';
    v_nhan text; v_thang smallint; v_nam_bs int; v_dot_id_bs bigint;
    v_dang_co numeric; v_so_moi numeric; v_so_cong_don int := 0;
    v_chua_chia text[];
    v_do_qua text[];
    v_email text := coalesce(auth.email(), 'system');
    v_vt record;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được xác nhận rớt.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    -- QĐ D14 — cổng chặn: chưa chia hết số trúng thì mọi khoa trông như rớt cả Q.
    select coalesce(array_agg(ma_hang order by ma_hang), '{}')
      into v_chua_chia
    from v_phan_bo_trung_theo_ma_v3
    where phien_q_id = v_phien and not da_khop
      and (p_ma_hang is null or ma_hang = p_ma_hang)
      and ma_hang in (select distinct ma_hang from v_rot_chua_xu_ly_v3
                      where phien_q_id = v_phien and con_lai > 0);
    if array_length(v_chua_chia, 1) > 0 then
        raise exception
            'Còn % mã chưa chia hết số trúng về khoa: %. Gõ số cho từng khoa hoặc bấm "Chia theo tỉ lệ Q" rồi hãy xác nhận rớt.',
            array_length(v_chua_chia, 1),
            array_to_string(v_chua_chia[1:8], ', ')
            || case when array_length(v_chua_chia,1) > 8 then ' …' else '' end;
    end if;

    -- Bịt điểm mù (patch_zzzzzs) — giữ nguyên.
    select coalesce(array_agg(v.ma_hang || ' / ' || v.khoa || ' (giữ ' || v.dang_giu
                              || ' + đổ ' || v.da_do || ' + chuyển tiếp ' || v.da_chuyen_tiep
                              || ' > được quyền ' || v.duoc_quyen || ')'), '{}')
      into v_do_qua
    from fn_dong_vuot_quyen_v3(v_phien, p_ma_hang) v;
    if array_length(v_do_qua, 1) > 0 then
        raise exception
            'Có % dòng khoa GIỮ NHIỀU HƠN QUYỀN: %. Xảy ra khi một mã vừa đổ đi '
            'vừa nhận về rồi được chia lại — sổ đổ giữ số cũ trong khi số rớt đã giảm. '
            'Bỏ ngoại lệ đổ của các mã đó (bo_ngoai_le_rot_v3) rồi làm lại theo thứ tự: '
            'chia số trúng → đổ mã → chia lại mã nhận → xác nhận rớt.',
            array_length(v_do_qua, 1),
            array_to_string(v_do_qua[1:6], '; ')
            || case when array_length(v_do_qua,1) > 6 then ' …' else '' end;
    end if;

    v_bs := fn_dot_bo_sung_gan_nhat();
    select d.id, d.nam, d.thang_moc, gc.nhan into v_dot_id_bs, v_nam, v_thang, v_nhan
    from dot_goi dg join dot_de_xuat d on d.id = dg.dot_id
    join goi_con gc on gc.goi_id = dg.goi_id where dg.id = v_bs;
    v_nam_bs := v_nam;

    for r in
        select v.ma_hang, v.khoa, v.con_lai
        from v_rot_chua_xu_ly_v3 v
        where v.phien_q_id = v_phien and v.con_lai > 0
          and (p_ma_hang is null or v.ma_hang = p_ma_hang)
        order by v.ma_hang, v.khoa
    loop
        insert into dot_goi_khoa (dot_goi_id, khoa, tham_gia, updated_by)
        values (v_bs, r.khoa, true, v_email)
        on conflict (dot_goi_id, khoa) do update set tham_gia = true;

        -- Danh tính mã hàng — giỏ của khoa cần đủ chừng này mới hiện và gửi được.
        select vt.ma_hang, vt.ten_vat_tu, vt.dvt, vt.ma_quan_ly, vt.goi,
               coalesce(nk.ten_quan_ly, '') as ten_quan_ly
          into v_vt
        from vat_tu vt
        left join nhom_ky_thuat nk on nk.ma_quan_ly = vt.ma_quan_ly
        where vt.ma_hang = r.ma_hang;

        -- QĐ D11 — cộng dồn vào số khoa đã tự gõ (nếu có).
        select nullif(g.noi_dung -> r.ma_hang ->> 'soLuong', '')::numeric
          into v_dang_co
        from gio_nhap g where g.don_vi = r.khoa and g.dot_id = v_dot_id_bs;
        v_so_moi := coalesce(v_dang_co, 0) + r.con_lai;
        if coalesce(v_dang_co, 0) > 0 then v_so_cong_don := v_so_cong_don + 1; end if;

        insert into gio_nhap (don_vi, dot_id, loai_mua_sam, noi_dung, cap_nhat_boi, cap_nhat_luc)
        values (r.khoa, v_dot_id_bs, 'mua_sam_bo_sung',
                jsonb_build_object(r.ma_hang, jsonb_strip_nulls(jsonb_build_object(
                    -- danh tính (đúng khuôn màn giỏ dựng khi khoa tự bỏ mã vào)
                    'ma_hang',     r.ma_hang,
                    'ten_vat_tu',  coalesce(v_vt.ten_vat_tu, r.ma_hang),
                    'dvt',         coalesce(v_vt.dvt, ''),
                    'ma_quan_ly',  v_vt.ma_quan_ly,
                    'ten_quan_ly', coalesce(v_vt.ten_quan_ly, ''),
                    'goi',         v_vt.goi,
                    -- số lượng GỢI Ý + kỳ mua
                    'soLuong',  v_so_moi,
                    'tuThang',  v_thang, 'tuNam',  v_nam_bs,
                    'denThang', 12,      'denNam', v_nam_bs,
                    -- lý do: "khác" + giải trình bằng chữ, vì đây không phải
                    -- con số suy từ lịch sử dùng mà là phần thầu trước không mua được
                    'loaiLyDo', 'khac',
                    'tenKyThuatMoi', '', 'uocCaThang', '',
                    'ghiChu', format('Mã rớt thầu chuyển tiếp %s đơn vị (đợt gốc #%s). Khoa tự quyết số cuối cùng rồi bấm "Gửi giỏ".',
                                     r.con_lai, p_dot_goi_id),
                    -- cờ để màn giỏ đánh dấu "mã này do rớt thầu đưa về"
                    'tuMaRot', true,
                    'soRotGoc', r.con_lai))),
                v_email, now())
        on conflict (don_vi, dot_id) do update
           set noi_dung = gio_nhap.noi_dung || excluded.noi_dung,
               cap_nhat_boi = excluded.cap_nhat_boi,
               cap_nhat_luc = now();

        insert into chuyen_tiep_rot_v3
            (phien_q_id, dot_goi_id_goc, ma_hang, khoa, so_luong,
             giai_doan_phat_sinh, dot_goi_bo_sung_id, proposal_id, created_by)
        values (v_phien, p_dot_goi_id, r.ma_hang, r.khoa, r.con_lai,
                p_giai_doan, v_bs, null, v_email)
        on conflict (phien_q_id, ma_hang, khoa) do update set
            so_luong = chuyen_tiep_rot_v3.so_luong + excluded.so_luong,
            dot_goi_bo_sung_id = excluded.dot_goi_bo_sung_id;

        if not (r.khoa = any(v_khoa_set)) then v_khoa_set := v_khoa_set || r.khoa; end if;
        if not (r.ma_hang = any(v_ma_set)) then v_ma_set := v_ma_set || r.ma_hang; end if;
        v_so_dong := v_so_dong + 1;
    end loop;

    if v_so_dong > 0 then
        insert into thong_bao (pham_vi, khoa, loai, tieu_de, noi_dung, dot_goi_id, du_lieu, mau, created_by)
        select 'khoa', k.khoa, 'ma_rot_ve_khoa',
               format('%s mã rớt thầu — đã để sẵn trong GIỎ %s', k.so_ma, coalesce(v_nhan, 'đợt bổ sung')),
               format('Tổng %s đơn vị nằm trong giỏ đợt bổ sung tháng %s/%s, số lượng mới là GỢI Ý. '
                      'Khoa mở giỏ, sửa lại cho đúng nhu cầu rồi bấm "Gửi giỏ" thì mới thành đề xuất chính thức. '
                      'Chưa gửi thì chưa có gì được tính.',
                      k.tong, v_thang, v_nam_bs),
               v_bs,
               jsonb_build_object('so_ma', k.so_ma, 'tong', k.tong, 'ma_hang', k.ds,
                                  'dot_goi_goc', p_dot_goi_id, 'vao_gio', true),
               'do', v_email
        from (
            select khoa, count(*) so_ma, sum(so_luong) tong,
                   array_agg(ma_hang order by ma_hang) ds
            from chuyen_tiep_rot_v3
            where phien_q_id = v_phien and dot_goi_bo_sung_id = v_bs and khoa = any(v_khoa_set)
            group by khoa
        ) k;

        perform fn_ghi_thong_bao('pdd', null, 'ma_rot_ve_khoa',
            format('Đã đẩy %s dòng rớt (%s mã × %s khoa) vào GIỎ của khoa ở %s. Khoa phải tự bấm "Gửi giỏ" — Bàn điều hành theo dõi số chưa gửi.',
                   v_so_dong, array_length(v_ma_set,1), array_length(v_khoa_set,1),
                   coalesce(v_nhan,'đợt bổ sung')),
            null, p_dot_goi_id,
            jsonb_build_object('so_dong', v_so_dong, 'so_cong_don', v_so_cong_don,
                               'dot_goi_bo_sung_id', v_bs, 'vao_gio', true), 'do');
    end if;

    return jsonb_build_object(
        'so_dong', v_so_dong,
        'so_ma', coalesce(array_length(v_ma_set,1), 0),
        'so_khoa', coalesce(array_length(v_khoa_set,1), 0),
        'so_cong_don', v_so_cong_don,
        'vao_gio', true,
        'dot_goi_bo_sung_id', v_bs,
        'ten_dot', v_nhan,
        'thang', v_thang, 'nam', v_nam_bs);
end;
$$;
