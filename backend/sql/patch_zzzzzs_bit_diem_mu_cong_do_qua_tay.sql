-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzs — BỊT ĐIỂM MÙ CỦA CỔNG "ĐỔ QUÁ TAY" (25/08/2026)
--
-- `patch_zzzzzn` sáng nay đọc `v_rot_chua_xu_ly_v3` để tìm dòng `con_lai < 0`.
-- Rà soát độc lập chỉ ra view đó có `where t.q_khoa > t.so_luong_trung` ở cuối:
-- **mọi dòng khoa được chia BẰNG hoặc HƠN Q của mình đều không nằm trong view**,
-- nên cổng không nhìn thấy chúng.
--
-- Đo trên staging ngày 25/08: 36.165 dòng phân bổ, **26 dòng vượt quyền**, và
-- cổng cũ nhìn thấy **0**. Điểm mù là toàn phần, không phải một phần.
--
-- Nay tính thẳng từ `phan_bo_trung_v3` và hai sổ, không đi qua view nào:
--
--     đang giữ + đã đổ đi + đã chuyển tiếp  >  Q của khoa + phần khoa nhận
--     (và chỉ soi dòng THẬT SỰ CÓ SỔ đổ/chuyển tiếp — xem chú thích trong hàm)
--
-- Vế phải gồm `nhận` vì QĐ D15 đã chốt "số phải chia = trúng + phần nhận" —
-- khoa nhận về thì đúng là được giữ nhiều hơn Q của mình. Bất biến này ĐÚNG
-- BẤT KỂ chọn cách sửa gốc nào (hạ sổ đổ theo số rớt, hay đổi trọng số chia),
-- nên bịt điểm mù ở đây không phải là chọn phe trong câu hỏi còn mở.
--
-- Đặt phép kiểm ở CẢ HAI cổng. Trước nay chỉ `xac_nhan_rot_v3` có, mà
-- **chốt trình ký không đòi phải xác nhận rớt trước** — tức con số sai vẫn có
-- một đường đi thẳng lên giấy trình ký.
--
-- Vẫn KHÔNG sửa gốc: gốc nằm ở trọng số của `fn_chia_theo_ti_le_q_v3`
-- (không trừ phần khoa đã đổ đi). Sửa gốc đổi con số chia ra nên phải chủ dự
-- án chốt — xem khuyến nghị trong `05_TRANG_THAI_VA_VIEC_TIEP_THEO.md`.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- Một nguồn duy nhất cho phép kiểm, để hai cổng không bao giờ lệch nhau.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_dong_vuot_quyen_v3(p_phien bigint, p_ma text default null)
returns table (ma_hang text, khoa text, dang_giu numeric, da_do numeric,
               da_chuyen_tiep numeric, duoc_quyen numeric)
language sql stable security definer set search_path = public as $$
    select t.ma_hang, t.khoa, t.so_luong_trung,
           coalesce(c.da_do, 0), coalesce(ct.da_ct, 0),
           t.q_khoa + coalesce(n.nhan, 0)
    from phan_bo_trung_v3 t
    left join lateral (select sum(x.so_luong) da_do from chuyen_so_rot_v3 x
        where x.phien_q_id = t.phien_q_id and x.ma_hang_rot = t.ma_hang
          and x.khoa = t.khoa and x.hieu_luc) c on true
    left join lateral (select sum(x.so_luong) da_ct from chuyen_tiep_rot_v3 x
        where x.phien_q_id = t.phien_q_id and x.ma_hang = t.ma_hang
          and x.khoa = t.khoa) ct on true
    left join lateral (select sum(x.so_luong) nhan from chuyen_so_rot_v3 x
        where x.phien_q_id = t.phien_q_id and x.ma_hang_nhan = t.ma_hang
          and x.khoa = t.khoa and x.hieu_luc) n on true
    where t.phien_q_id = p_phien
      and (p_ma is null or t.ma_hang = p_ma)
      -- CHỈ soi dòng CÓ SỔ. PĐD chia cho một khoa vượt Q của khoa đó là hợp lệ
      -- khi có lý do (`cap_nhat_phan_bo_trung_v3`), nên vượt mà chưa đổ đi gì
      -- KHÔNG phải lỗi. Thiếu điều kiện này thì cổng chặn nhầm việc đúng —
      -- đo thật 25/08: bắt nhầm dòng "giữ 100 · đổ 0 · chuyển tiếp 0".
      and coalesce(c.da_do, 0) + coalesce(ct.da_ct, 0) > 0
      and t.so_luong_trung + coalesce(c.da_do, 0) + coalesce(ct.da_ct, 0)
          > t.q_khoa + coalesce(n.nhan, 0);
$$;

comment on function fn_dong_vuot_quyen_v3(bigint, text) is
    'Dòng mà khoa đang giữ + đã đổ đi + đã chuyển tiếp VƯỢT Q của khoa cộng phần nhận. Nguồn duy nhất cho cổng xác nhận rớt và cổng chốt trình ký (25/08/2026).';

grant execute on function fn_dong_vuot_quyen_v3(bigint, text) to authenticated;

CREATE OR REPLACE FUNCTION public.xac_nhan_rot_v3(p_dot_goi_id bigint, p_giai_doan text DEFAULT NULL::text, p_ma_hang text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_phien bigint; v_bs bigint; v_nam int; v_prop bigint; v_ver int; r record;
    v_so_dong int := 0; v_khoa_set text[] := '{}'; v_ma_set text[] := '{}';
    v_nhan text; v_thang smallint; v_nam_bs int;
    v_dang_co numeric; v_so_moi numeric; v_so_cong_don int := 0;
    v_chua_chia text[];
    v_do_qua text[];
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được xác nhận rớt.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    -- QĐ D14 (24/08/2026) — CỔNG CHẶN BẮT BUỘC.
    -- Từ khi bỏ tự chia, ghi rớt xong là ô số trúng theo khoa về TRỐNG. Mà
    -- `con_lai = q_khoa − so_luong_trung`, nên nếu cò chạy lúc chưa chia thì
    -- mọi khoa trông như rớt TOÀN BỘ Q và cả Q bị chuyển tiếp sang đợt bổ sung.
    -- Đây là khoá cứng 2 đặt ở cổng, đúng tinh thần QĐ A4.
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

    -- ── Bịt điểm mù (patch_zzzzzs, 25/08/2026) ───────────────────────────
    -- Tính thẳng từ bảng và hai sổ. Bản trước đọc `v_rot_chua_xu_ly_v3`, mà
    -- view đó bỏ mọi dòng `so_luong_trung >= q_khoa` — đo thật: 26 dòng vượt,
    -- cổng cũ thấy 0.
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
    select d.nam, d.thang_moc, gc.nhan into v_nam, v_thang, v_nhan
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
        values (v_bs, r.khoa, true, coalesce(auth.email(),'system'))
        on conflict (dot_goi_id, khoa) do update set tham_gia = true;

        -- QĐ D11 — CỘNG DỒN. Đọc số hiện hành của khoa ở đợt bổ sung; có rồi
        -- thì cộng thêm phần rớt mới, chưa có thì bằng đúng phần rớt.
        select so_luong_hien_hanh into v_dang_co
        from phan_bo_khoa
        where dot_goi_id = v_bs and ma_hang = r.ma_hang and khoa = r.khoa;
        v_so_moi := coalesce(v_dang_co, 0) + r.con_lai;
        if v_dang_co is not null then v_so_cong_don := v_so_cong_don + 1; end if;

        select coalesce(max(version), 0) + 1 into v_ver
        from proposals where ma_hang = r.ma_hang and don_vi = r.khoa and nam_de_xuat = v_nam;

        update proposals set is_current = false
        where ma_hang = r.ma_hang and don_vi = r.khoa and nam_de_xuat = v_nam and is_current;

        insert into proposals (ma_hang, don_vi, nam_de_xuat, version, so_luong,
                               loai_mua_sam, dot_id, dot_goi_id, created_by, is_current)
        select r.ma_hang, r.khoa, v_nam, v_ver, v_so_moi, 'mua_sam_bo_sung',
               dg.dot_id, v_bs, coalesce(auth.email(),'system'), true
        from dot_goi dg where dg.id = v_bs
        returning id into v_prop;

        insert into chuyen_tiep_rot_v3
            (phien_q_id, dot_goi_id_goc, ma_hang, khoa, so_luong,
             giai_doan_phat_sinh, dot_goi_bo_sung_id, proposal_id, created_by)
        values (v_phien, p_dot_goi_id, r.ma_hang, r.khoa, r.con_lai,
                p_giai_doan, v_bs, v_prop, coalesce(auth.email(),'system'))
        on conflict (phien_q_id, ma_hang, khoa) do update set
            so_luong = chuyen_tiep_rot_v3.so_luong + excluded.so_luong,
            dot_goi_bo_sung_id = excluded.dot_goi_bo_sung_id,
            proposal_id = excluded.proposal_id;

        if not (r.khoa = any(v_khoa_set)) then v_khoa_set := v_khoa_set || r.khoa; end if;
        if not (r.ma_hang = any(v_ma_set)) then v_ma_set := v_ma_set || r.ma_hang; end if;
        v_so_dong := v_so_dong + 1;
    end loop;

    if v_so_dong > 0 then
        insert into thong_bao (pham_vi, khoa, loai, tieu_de, noi_dung, dot_goi_id, du_lieu, mau, created_by)
        select 'khoa', k.khoa, 'ma_rot_ve_khoa',
               format('%s mã rớt thầu — đã đưa vào %s', k.so_ma, coalesce(v_nhan, 'đợt bổ sung')),
               format('Thêm %s đơn vị vào đợt bổ sung tháng %s/%s. Mã nào khoa đã có số sẵn thì phần rớt được CỘNG THÊM, không ghi đè. Khoa vào sửa lại nếu cần — khoa quyết số cuối cùng.',
                      k.tong, v_thang, v_nam_bs),
               v_bs,
               jsonb_build_object('so_ma', k.so_ma, 'tong', k.tong, 'ma_hang', k.ds,
                                  'dot_goi_goc', p_dot_goi_id),
               'do', coalesce(auth.email(),'system')
        from (
            select khoa, count(*) so_ma, sum(so_luong) tong,
                   array_agg(ma_hang order by ma_hang) ds
            from chuyen_tiep_rot_v3
            where phien_q_id = v_phien and dot_goi_bo_sung_id = v_bs and khoa = any(v_khoa_set)
            group by khoa
        ) k;

        perform fn_ghi_thong_bao('pdd', null, 'ma_rot_ve_khoa',
            format('Đã chuyển tiếp %s dòng rớt (%s mã × %s khoa) về %s%s',
                   v_so_dong, array_length(v_ma_set,1), array_length(v_khoa_set,1),
                   coalesce(v_nhan,'đợt bổ sung'),
                   case when v_so_cong_don > 0
                        then format(' — %s dòng CỘNG DỒN vào số khoa đã có', v_so_cong_don)
                        else '' end),
            null, p_dot_goi_id,
            jsonb_build_object('so_dong', v_so_dong, 'so_cong_don', v_so_cong_don,
                               'dot_goi_bo_sung_id', v_bs), 'do');
    end if;

    return jsonb_build_object(
        'so_dong', v_so_dong,
        'so_ma', coalesce(array_length(v_ma_set,1), 0),
        'so_khoa', coalesce(array_length(v_khoa_set,1), 0),
        'so_cong_don', v_so_cong_don,
        'dot_goi_bo_sung_id', v_bs,
        'ten_dot', v_nhan,
        'thang', v_thang, 'nam', v_nam_bs);
end;
$function$;


CREATE OR REPLACE FUNCTION public.chot_trinh_ky_toan_bo_v3(p_dot_goi_id bigint)
 RETURNS chot_trinh_ky_phien_v3
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_q chot_q_phien%rowtype;
    v_phien chot_trinh_ky_phien_v3%rowtype;
    v_revision int;
    v_thieu text[];
    v_chua_gui int;
    v_do_qua text[];
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chốt trình ký toàn bộ.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('chot_trinh_ky:' || p_dot_goi_id, 0));
    if exists (select 1 from chot_trinh_ky_phien_v3
               where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'DOT_GOI đã có revision trình ký hiệu lực.';
    end if;
    select * into v_q from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Không có snapshot Q hiệu lực.'; end if;
    if exists (select 1 from giai_doan_thau_v3
               where dot_goi_id = p_dot_goi_id and trang_thai <> 'hoan_thanh')
       or (select count(*) from giai_doan_thau_v3
           where dot_goi_id = p_dot_goi_id) <> 3 then
        raise exception 'Phải hoàn thành đủ ba giai đoạn đấu thầu.';
    end if;

    -- LỖI 2 (20/08/2026): chỉ tính khoa ĐÃ GỬI đề xuất.
    select coalesce(array_agg(khoa), '{}'::text[]) into v_thieu
    from khoa_chua_du_chot_trinh_ky(p_dot_goi_id);
    if array_length(v_thieu, 1) > 0 then
        raise exception
            'Còn % khoa đã gửi đề xuất nhưng chưa đủ chốt danh mục và chốt trình ký: %.',
            array_length(v_thieu, 1), array_to_string(v_thieu, ', ');
    end if;

    -- Khoa tham gia mà chưa gửi gì: CHỈ ghi vào audit, không chặn.
    select count(*) into v_chua_gui
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      and not exists (select 1 from phan_bo_khoa pb
                      where pb.dot_goi_id = dk.dot_goi_id and pb.khoa = dk.khoa
                        and pb.so_luong_hien_hanh > 0);

    -- ── Bịt điểm mù (patch_zzzzzs, 25/08/2026) ───────────────────────────
    -- Tính thẳng từ bảng và hai sổ. Bản trước đọc `v_rot_chua_xu_ly_v3`, mà
    -- view đó bỏ mọi dòng `so_luong_trung >= q_khoa` — đo thật: 26 dòng vượt,
    -- cổng cũ thấy 0.
    select coalesce(array_agg(v.ma_hang || ' / ' || v.khoa || ' (giữ ' || v.dang_giu
                              || ' + đổ ' || v.da_do || ' + chuyển tiếp ' || v.da_chuyen_tiep
                              || ' > được quyền ' || v.duoc_quyen || ')'), '{}')
      into v_do_qua
    from fn_dong_vuot_quyen_v3(v_q.id, null) v;
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

    -- QĐ D15 (24/08/2026): khoá cứng 2 so với SỐ PHẢI CHIA = trúng + phần nhận
    -- từ mã rớt cùng nhóm, không phải trúng thuần.
    if exists (
        select 1 from v_phan_bo_trung_theo_ma_v3 m
        where m.phien_q_id = v_q.id and not m.da_khop
    ) then
        raise exception 'Phân bổ số trúng chưa khớp: còn % mã lệch (%). Gõ số cho từng khoa hoặc bấm "Chia theo tỉ lệ Q".',
            (select count(*) from v_phan_bo_trung_theo_ma_v3 m
              where m.phien_q_id = v_q.id and not m.da_khop),
            (select string_agg(m.ma_hang, ', ' order by m.ma_hang)
               from (select ma_hang from v_phan_bo_trung_theo_ma_v3
                      where phien_q_id = v_q.id and not da_khop limit 8) m);
    end if;

    select coalesce(max(revision),0)+1 into v_revision
    from chot_trinh_ky_phien_v3 where dot_goi_id = p_dot_goi_id;
    insert into chot_trinh_ky_phien_v3
        (dot_goi_id,phien_q_id,revision,chot_boi)
    values (p_dot_goi_id,v_q.id,v_revision,auth.email())
    returning * into v_phien;

    insert into chot_trinh_ky_dong_v3
        (phien_id,dot_goi_id,phien_q_id,ma_hang,khoa,q_khoa,
         so_luong_trung,ma_quan_ly,ten_vat_tu,dvt,gia_tri_khoa,gia_tri_pdd)
    select v_phien.id,p.dot_goi_id,p.phien_q_id,p.ma_hang,p.khoa,p.q_khoa,
           p.so_luong_trung,v.ma_quan_ly,v.ten_vat_tu,v.dvt,
           coalesce(ok.gia_tri,'{}'::jsonb),
           coalesce(op.gia_tri,'{}'::jsonb)
    from phan_bo_trung_v3 p
    join vat_tu v on v.ma_hang = p.ma_hang
    join dot_goi dg on dg.id = p.dot_goi_id
    join dot_de_xuat d on d.id = dg.dot_id
    left join danh_muc_khoa_o ok
      on ok.goi_id = dg.goi_id and ok.nam_de_xuat = d.nam
     and ok.khoa = p.khoa and ok.ma_hang = p.ma_hang
    left join lateral (
        select jsonb_object_agg(o.cot,o.gia_tri) gia_tri
        from danh_muc_tong_hop_o o
        where o.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
          and o.nam_de_xuat = d.nam and o.ma_hang = p.ma_hang
    ) op on true
    where p.phien_q_id = v_q.id;

    -- `hanh_dong` có CHECK chỉ nhận 'chot'/'vo_hieu' — số khoa im lặng ghi vào
    -- `ly_do`, không được nhét vào `hanh_dong`.
    insert into chot_trinh_ky_v3_audit
        (phien_id,dot_goi_id,revision,hanh_dong,ly_do,nguoi_lam)
    values (v_phien.id,p_dot_goi_id,v_revision,'chot',
            'Khoa tham gia chưa gửi đề xuất (không chặn): ' || v_chua_gui,
            auth.email());
    return v_phien;
end;
$function$;


grant execute on function xac_nhan_rot_v3(bigint,text,text) to authenticated;
grant execute on function chot_trinh_ky_toan_bo_v3(bigint) to authenticated;
