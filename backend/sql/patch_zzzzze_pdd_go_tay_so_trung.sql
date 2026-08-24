-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzze — BỎ TỰ CHIA SỐ TRÚNG, PĐD GÕ TAY (QĐ D14, 24/08/2026)
--
-- Đây là thi công QĐ **A3 ngày 21/08/2026** — chốt từ lâu nhưng chưa làm:
--   "Sau tích rớt: ô số lượng từng khoa ĐỂ TRỐNG, PĐD gõ tay. Thêm một nút
--    'chia theo tỉ lệ Q' bấm khi không muốn gõ."
--
-- Vì sao phải bỏ tự chia — đo thật 24/08/2026:
--   `fn_dong_bo_phan_bo_trung_v3` chia lại số trúng theo tỉ lệ Q cho MỌI khoa,
--   mỗi lần ghi hoặc bỏ ngoại lệ rớt. Hậu quả:
--     · XOÁ mất phân bổ PĐD đã chỉnh tay (smoke phải đặt lại 140/10 mới đo tiếp được);
--     · tỉ lệ giữa các khoa KHÔNG đứng yên qua ba giai đoạn, nên phần đã chuyển
--       tiếp theo tỉ lệ cũ bị vênh — khoa B từng thừa 23 đơn vị.
--
-- Chủ dự án chốt: "không cần đồng bộ phân bổ số trúng nữa, PĐD gõ tay hết".
--
-- BA MẢNH PHẢI ĐI CÙNG NHAU, thiếu một là hỏng:
--   1. Ghi/bỏ rớt → XOÁ TRẮNG ô số trúng theo khoa của mã đó (thay vì chia lại)
--   2. Nút "Chia theo tỉ lệ Q" — cùng phép chia cũ, nhưng CHỈ khi PĐD bấm
--   3. Cò "Xác nhận rớt" phải CHẶN khi còn dòng chưa chia xong.
--      Không có mảnh 3 thì thảm hoạ: ô trống nghĩa là so_luong_trung = 0, mà
--      `con_lai = q_khoa − so_luong_trung` nên hệ sẽ tưởng khoa rớt TOÀN BỘ Q
--      và chuyển tiếp cả Q sang đợt bổ sung.
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Phép chia theo tỉ lệ Q — GIỮ NGUYÊN, nhưng từ nay chỉ chạy KHI ĐƯỢC BẤM
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_chia_theo_ti_le_q_v3(p_phien bigint, p_ma text)
returns void language plpgsql security definer set search_path = public as $$
declare v_q numeric; v_trung numeric; v_con numeric; v_khoa text;
begin
    select q, so_luong_trung into v_q, v_trung from v_ket_qua_thau_v3
    where phien_q_id = p_phien and ma_hang = p_ma;
    if not found then return; end if;
    update phan_bo_trung_v3 set so_luong_trung = case
        when v_q > 0 then floor(v_trung * q_khoa / v_q) else 0 end,
        revision = revision + 1, updated_by = coalesce(auth.email(),'system'), updated_at = now()
    where phien_q_id = p_phien and ma_hang = p_ma;
    -- phần dư do làm tròn xuống dồn vào khoa có Q lớn nhất
    select v_trung - sum(so_luong_trung) into v_con from phan_bo_trung_v3
    where phien_q_id = p_phien and ma_hang = p_ma;
    select khoa into v_khoa from phan_bo_trung_v3
    where phien_q_id = p_phien and ma_hang = p_ma order by q_khoa desc, khoa limit 1;
    update phan_bo_trung_v3 set so_luong_trung = so_luong_trung + v_con
    where phien_q_id = p_phien and ma_hang = p_ma and khoa = v_khoa;
end;
$$;

-- RPC cho nút trên giao diện.
create or replace function chia_theo_ti_le_q_v3(p_dot_goi_id bigint, p_ma_hang text)
returns numeric language plpgsql security definer set search_path = public, auth as $$
declare v_phien bigint; v_tong numeric;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chia số trúng.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;
    perform fn_chia_theo_ti_le_q_v3(v_phien, p_ma_hang);
    select sum(so_luong_trung) into v_tong from phan_bo_trung_v3
    where phien_q_id = v_phien and ma_hang = p_ma_hang;
    return coalesce(v_tong, 0);
end;
$$;

grant execute on function chia_theo_ti_le_q_v3(bigint, text) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Ghi/bỏ rớt nay XOÁ TRẮNG thay vì chia lại
--
--    Giữ nguyên TÊN `fn_dong_bo_phan_bo_trung_v3` để không phải dựng lại bốn
--    hàm đang gọi nó (ghi_ngoai_le_rot_v3 · bo_ngoai_le_rot_v3 ·
--    rot_toan_bo_ma_quan_ly_v3 · cap_nhat_giai_doan_thau_v3). Tên nay mang
--    nghĩa lịch sử — việc nó làm là XOÁ TRẮNG, đọc mã phải nhớ điều này.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_dong_bo_phan_bo_trung_v3(p_phien bigint, p_ma text)
returns void language plpgsql security definer set search_path = public as $$
begin
    -- QĐ D14 (24/08/2026): KHÔNG chia lại nữa. Số trúng của mã vừa đổi thì ô
    -- của từng khoa về TRỐNG, PĐD gõ tay hoặc bấm "Chia theo tỉ lệ Q".
    -- Mã chưa từng rớt thì hàm này không được gọi tới, nên phân bổ mặc định
    -- "trúng toàn bộ" lúc chốt Q vẫn giữ nguyên.
    update phan_bo_trung_v3
       set so_luong_trung = 0,
           revision = revision + 1,
           updated_by = coalesce(auth.email(),'system'),
           updated_at = now()
     where phien_q_id = p_phien and ma_hang = p_ma
       and so_luong_trung <> 0;
end;
$$;

comment on function fn_dong_bo_phan_bo_trung_v3(bigint, text) is
    'TÊN MANG NGHĨA LỊCH SỬ. Từ QĐ D14 (24/08/2026) hàm này XOÁ TRẮNG ô số trúng theo khoa, KHÔNG chia lại theo tỉ lệ Q nữa. Phép chia cũ nằm ở fn_chia_theo_ti_le_q_v3, chỉ chạy khi PĐD bấm nút.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Xem dòng nào đã chia xong, dòng nào chưa — nguồn của cột "Đã chia"
-- ───────────────────────────────────────────────────────────────────────────
create or replace view v_phan_bo_trung_theo_ma_v3 as
select k.phien_q_id, k.dot_goi_id, k.ma_hang,
       k.q, k.so_luong_trung                         as trung,
       coalesce(sum(t.so_luong_trung), 0)            as da_chia,
       (k.so_luong_trung - coalesce(sum(t.so_luong_trung), 0)) as lech,
       (k.so_luong_trung = coalesce(sum(t.so_luong_trung), 0)) as da_khop,
       count(t.khoa)                                 as so_khoa
from v_ket_qua_thau_v3 k
left join phan_bo_trung_v3 t
       on t.phien_q_id = k.phien_q_id and t.ma_hang = k.ma_hang
group by k.phien_q_id, k.dot_goi_id, k.ma_hang, k.q, k.so_luong_trung;

comment on view v_phan_bo_trung_theo_ma_v3 is
    'Đã chia bao nhiêu về khoa so với số trúng của mã. `da_khop = false` là dòng PĐD còn phải gõ (khoá cứng 2).';

grant select on v_phan_bo_trung_theo_ma_v3 to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Cò "Xác nhận rớt" — thêm cổng chặn khi chưa chia xong
-- ───────────────────────────────────────────────────────────────────────────
create or replace function xac_nhan_rot_v3(
    p_dot_goi_id bigint, p_giai_doan text default null, p_ma_hang text default null)
returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien bigint; v_bs bigint; v_nam int; v_prop bigint; v_ver int; r record;
    v_so_dong int := 0; v_khoa_set text[] := '{}'; v_ma_set text[] := '{}';
    v_nhan text; v_thang smallint; v_nam_bs int;
    v_dang_co numeric; v_so_moi numeric; v_so_cong_don int := 0;
    v_chua_chia text[];
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
$$;

grant execute on function xac_nhan_rot_v3(bigint, text, text) to authenticated;
