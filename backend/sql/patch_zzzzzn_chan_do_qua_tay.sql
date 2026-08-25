-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzn — CHẶN "ĐỔ QUÁ TAY": sổ đổ lớn hơn số rớt thật (25/08/2026)
--
-- Tìm ra bằng vòng test FULL PIPELINE ở quy mô thật (1.586 mã × 50 khoa).
-- Một mã VỪA ĐỔ ĐI VỪA NHẬN VỀ là chuyện bình thường trong một nhóm mã tương
-- đương. Nhưng khi nó nhận về, `day_so_luong_rot_v3` đặt phân bổ của nó về 0
-- (QĐ D15) và PĐD chia lại trên tổng mới → số trúng từng khoa TĂNG → số rớt
-- GIẢM. `chuyen_so_rot_v3` thì đã ghi cứng con số cũ, không giảm theo.
--
-- Chuỗi đo được, gói 18t-ctch-ntk, mã 64453:
--     Q của khoa 10 · trúng 7 · rớt 3  →  đổ 3 sang 66647   (sổ ghi 3)
--     66572 rớt     →  đổ sang 64453   (64453 thành mã NHẬN)
--     64453 về 0, chia lại trên tổng mới  →  trúng lên 8, rớt còn 2
--     ⇒ khoa có 8 (giữ) + 3 (đã đổ đi) = 11 trên Q 10. SỐ BỊ THỔI LÊN 1.
--
-- `v_rot_chua_xu_ly_v3.con_lai` khi đó ÂM. Cổng cũ trong `xac_nhan_rot_v3` chỉ
-- nhìn `con_lai > 0` (chưa xử lý hết), nên tình huống này lọt qua IM LẶNG và đi
-- thẳng vào bản trình ký.
--
-- Đây KHÔNG phải cổng chặn quy trình mới — nó là nửa còn thiếu của khoá cứng
-- đang có. Trước: chặn khi xử lý THIẾU. Nay: chặn cả khi xử lý THỪA.
--
-- ⚠️ Bản vá này chỉ CHẶN, chưa sửa gốc. Câu hỏi nghiệp vụ còn mở: khi một mã
-- nhận về rồi chia lại, phần đã đổ đi của chính nó nên bị hạ theo (sổ đổ chạy
-- theo số rớt), hay nên cấm chia lại mã đang có dòng đổ đi? Chủ dự án chốt.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

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

    -- ── CỔNG MỚI 25/08/2026: SỔ ĐỔ LỚN HƠN SỐ RỚT THẬT ───────────────────
    -- Tìm ra bằng vòng test quy mô thật. Một mã hoàn toàn có thể VỪA ĐỔ ĐI
    -- VỪA NHẬN VỀ trong cùng một nhóm mã tương đương. Khi nó nhận về,
    -- `day_so_luong_rot_v3` đặt phân bổ của nó về 0 (QĐ D15) và PĐD chia lại
    -- trên tổng mới — số trúng của từng khoa TĂNG, nên số rớt GIẢM. Nhưng
    -- `chuyen_so_rot_v3` đã ghi cứng con số cũ và không giảm theo.
    --
    -- Đo thật: mã 64453, Q của khoa 10, trúng 7 → rớt 3, đổ 3 sang 66647.
    -- Sau khi 64453 nhận từ 66572 và chia lại, trúng lên 8 → rớt còn 2. Khoa
    -- thành ra có 8 + 3 = 11 trên Q 10. **Số bị thổi lên 1.**
    --
    -- `con_lai` âm nghĩa là đúng tình huống đó. Cổng cũ chỉ nhìn `con_lai > 0`
    -- nên nó lọt qua im lặng và đi thẳng vào bản trình ký. Đây KHÔNG phải cổng
    -- chặn quy trình mới — nó là phần còn thiếu của chính khoá cứng đang có.
    select coalesce(array_agg(distinct v.ma_hang || ' / ' || v.khoa
                              || ' (đổ ' || abs(v.con_lai) || ' quá tay)'), '{}')
      into v_do_qua
    from v_rot_chua_xu_ly_v3 v
    where v.phien_q_id = v_phien and v.con_lai < 0
      and (p_ma_hang is null or v.ma_hang = p_ma_hang);
    if array_length(v_do_qua, 1) > 0 then
        raise exception
            'Số đã đổ sang mã tương đương LỚN HƠN số rớt thật ở % dòng: %. '
            'Xảy ra khi một mã vừa đổ đi vừa nhận về rồi được chia lại. '
            'Bỏ ngoại lệ đổ của các mã này (bo_ngoai_le_rot_v3) rồi làm lại theo '
            'thứ tự: chia số trúng → đổ mã → chia lại mã nhận → xác nhận rớt.',
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
$function$

