-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzg — CHIA TAY TRÊN TỔNG "TRÚNG + NHẬN" (QĐ D15, 24/08/2026)
--
-- Chủ dự án: *"nếu nhận 460 rồi thì phải chia lại trên tổng 520+460 chứ, sao đã
-- chia chỉ có 520? Làm sao để tôi vô chia bằng tay?"*
--
-- Đúng. Bản trước (patch_zzzzzf) giữ phần nhận ở SỔ RIÊNG rồi cộng vào lúc chốt
-- trình ký. Hậu quả: cột "Đã chia" so với 520 và báo ĐÃ KHỚP, trong khi thực tế
-- bệnh viện sẽ mua 980 mà 460 chưa được chia về khoa nào. PĐD không có đường
-- nào vào chia phần đó.
--
-- QĐ D15: **số phải chia về khoa = số trúng + phần nhận từ mã rớt cùng nhóm.**
-- Khoá cứng 2 nới đúng bằng phần nhận đó, không nới thêm gì khác.
-- `chuyen_so_rot_v3` trở lại đúng vai sổ dấu vết: ghi mã nào rớt, chuyển sang
-- mã nào, cho khoa nào, vì sao. Con số thật nằm ở `phan_bo_trung_v3` như mọi
-- mã khác — một nguồn duy nhất, không cộng dồn ở hai nơi.
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Số PHẢI CHIA của một mã = trúng + nhận
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_phan_bo_trung_theo_ma_v3 cascade;
create view v_phan_bo_trung_theo_ma_v3 as
select k.phien_q_id, k.dot_goi_id, k.ma_hang,
       k.q, k.so_luong_trung                              as trung,
       coalesce(n.da_nhan, 0)                             as da_nhan,
       k.so_luong_trung + coalesce(n.da_nhan, 0)          as phai_chia,
       coalesce(sum(t.so_luong_trung), 0)                 as da_chia,
       (k.so_luong_trung + coalesce(n.da_nhan, 0)
         - coalesce(sum(t.so_luong_trung), 0))            as lech,
       (k.so_luong_trung + coalesce(n.da_nhan, 0)
         = coalesce(sum(t.so_luong_trung), 0))            as da_khop,
       count(t.khoa)                                      as so_khoa
from v_ket_qua_thau_v3 k
left join v_nhan_chuyen_rot_v3 n
       on n.phien_q_id = k.phien_q_id and n.ma_hang = k.ma_hang
left join phan_bo_trung_v3 t
       on t.phien_q_id = k.phien_q_id and t.ma_hang = k.ma_hang
group by k.phien_q_id, k.dot_goi_id, k.ma_hang, k.q, k.so_luong_trung, n.da_nhan;

comment on view v_phan_bo_trung_theo_ma_v3 is
    'phai_chia = số trúng + phần nhận từ mã rớt cùng nhóm (QĐ D15). da_khop = false là dòng PĐD còn phải gõ.';

grant select on v_phan_bo_trung_theo_ma_v3 to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Chia theo tỉ lệ Q — chia TỔNG PHẢI CHIA, trọng số gồm cả phần khoa nhận
--    Khoa chưa từng đề xuất mã nhận có q_khoa = 0; nếu chỉ lấy Q làm trọng số
--    thì khoa đó được chia 0 và phần nhận của họ bốc hơi.
-- ───────────────────────────────────────────────────────────────────────────
-- Phần một khoa NHẬN được ở một mã, dùng làm trọng số khi chia và làm mức sàn
-- khi kiểm khoá cứng 2.
create or replace function fn_nhan_cua_khoa_v3(p_phien bigint, p_ma text, p_khoa text)
returns numeric language sql stable set search_path = public as $$
    select coalesce(sum(so_luong), 0) from chuyen_so_rot_v3
    where phien_q_id = p_phien and ma_hang_nhan = p_ma and khoa = p_khoa and hieu_luc;
$$;

create or replace function fn_chia_theo_ti_le_q_v3(p_phien bigint, p_ma text)
returns void language plpgsql security definer set search_path = public as $$
declare v_phai_chia numeric; v_tong_trong_so numeric; v_con numeric; v_khoa text;
begin
    select phai_chia into v_phai_chia from v_phan_bo_trung_theo_ma_v3
    where phien_q_id = p_phien and ma_hang = p_ma;
    if v_phai_chia is null then return; end if;

    -- Trọng số của một khoa = Q của khoa + phần khoa đó NHẬN từ mã rớt.
    -- Khoa chưa từng đề xuất mã nhận có Q = 0; nếu chỉ lấy Q làm trọng số thì
    -- khoa đó được chia 0 và phần nhận của họ bốc hơi.
    select sum(p.q_khoa + fn_nhan_cua_khoa_v3(p_phien, p_ma, p.khoa))
      into v_tong_trong_so
    from phan_bo_trung_v3 p
    where p.phien_q_id = p_phien and p.ma_hang = p_ma;

    update phan_bo_trung_v3 p
       set so_luong_trung = case when v_tong_trong_so > 0
             then floor(v_phai_chia
                        * (p.q_khoa + fn_nhan_cua_khoa_v3(p_phien, p_ma, p.khoa))
                        / v_tong_trong_so)
             else 0 end,
           revision = revision + 1,
           updated_by = coalesce(auth.email(),'system'), updated_at = now()
     where p.phien_q_id = p_phien and p.ma_hang = p_ma;

    -- phần dư do làm tròn xuống dồn vào khoa có trọng số lớn nhất
    select v_phai_chia - sum(so_luong_trung) into v_con from phan_bo_trung_v3
    where phien_q_id = p_phien and ma_hang = p_ma;
    select p.khoa into v_khoa from phan_bo_trung_v3 p
    where p.phien_q_id = p_phien and p.ma_hang = p_ma
    order by p.q_khoa + fn_nhan_cua_khoa_v3(p_phien, p_ma, p.khoa) desc, p.khoa
    limit 1;
    if v_khoa is not null and coalesce(v_con, 0) <> 0 then
        update phan_bo_trung_v3 set so_luong_trung = so_luong_trung + v_con
        where phien_q_id = p_phien and ma_hang = p_ma and khoa = v_khoa;
    end if;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. PĐD gõ tay: kỳ vọng là TRÚNG + NHẬN, và "vượt Q" cũng tính cả phần nhận
-- ───────────────────────────────────────────────────────────────────────────
create or replace function cap_nhat_phan_bo_trung_v3(p_dot_goi_id bigint,p_ma_hang text,p_phan_bo jsonb,p_ly_do text default null)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_phien bigint;v_trung numeric;v_tong numeric;v_truoc jsonb;v_sau jsonb;
begin
 if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được phân bổ số trúng.'; end if;
 select id into v_phien from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc;
 -- QĐ D15 (24/08/2026): kỳ vọng là TRÚNG + NHẬN, không phải trúng thuần.
 select phai_chia into v_trung from v_phan_bo_trung_theo_ma_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 if jsonb_typeof(p_phan_bo)<>'object' then raise exception 'Phân bổ phải là object khoa:số.'; end if;
 if exists(select 1 from jsonb_each_text(p_phan_bo) where value!~'^\d+$') then raise exception 'Số phân bổ phải là số nguyên không âm.'; end if;
 if (select count(*) from jsonb_each(p_phan_bo))<>(select count(*) from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang) or exists(select 1 from jsonb_object_keys(p_phan_bo) as keys(khoa) where not exists(select 1 from phan_bo_trung_v3 p where p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=keys.khoa)) then raise exception 'Chỉ được phân bổ cho đúng các khoa có trong Q.'; end if;
 select sum(value::numeric) into v_tong from jsonb_each_text(p_phan_bo);if v_tong<>v_trung then raise exception 'Tổng phân bổ % phải bằng số phải chia % (số trúng cộng phần nhận từ mã rớt cùng nhóm).',v_tong,v_trung;end if;
 if exists(select 1 from jsonb_each_text(p_phan_bo) j join phan_bo_trung_v3 p on p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key where j.value::numeric>p.q_khoa+fn_nhan_cua_khoa_v3(v_phien,p_ma_hang,p.khoa)) and nullif(btrim(p_ly_do),'') is null then raise exception 'Phân bổ vượt Q của khoa phải nhập lý do.';end if;
 select jsonb_object_agg(khoa,so_luong_trung) into v_truoc from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 update phan_bo_trung_v3 p set so_luong_trung=j.value::numeric,revision=revision+1,updated_by=auth.email(),updated_at=now() from jsonb_each_text(p_phan_bo) j where p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key;
 select jsonb_object_agg(khoa,so_luong_trung) into v_sau from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 insert into phan_bo_trung_v3_audit(phien_q_id,dot_goi_id,ma_hang,truoc,sau,tong_trung,ly_do,nguoi_sua) values(v_phien,p_dot_goi_id,p_ma_hang,v_truoc,v_sau,v_trung,nullif(btrim(p_ly_do),''),auth.email());return v_sau;
end;
$$;

grant execute on function cap_nhat_phan_bo_trung_v3(bigint, text, jsonb, text) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Đổ xong thì mã NHẬN về trống để PĐD chia lại trên tổng mới
-- ───────────────────────────────────────────────────────────────────────────
create or replace function day_so_luong_rot_v3(
    p_dot_goi_id bigint, p_ma_hang_rot text, p_ma_hang_nhan text, p_ly_do text)
returns int
language plpgsql security definer set search_path = public, auth as $$
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

    select id into v_phien from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    select ma_quan_ly, dvt into v_mql_rot, v_dvt_rot from vat_tu where ma_hang = p_ma_hang_rot;
    select ma_quan_ly, dvt, ten_vat_tu into v_mql_nhan, v_dvt_nhan, v_ten_nhan
    from vat_tu where ma_hang = p_ma_hang_nhan;
    if v_mql_nhan is null then raise exception 'Không có mã hàng %.', p_ma_hang_nhan; end if;

    -- Cùng mã quản lý mới đổ được — giữ nguyên khoá "tổng mã quản lý không đổi".
    if v_mql_rot is distinct from v_mql_nhan then
        raise exception 'Mã nhận (%) không cùng mã quản lý với mã rớt (%): % ≠ %.',
            p_ma_hang_nhan, p_ma_hang_rot, coalesce(v_mql_nhan,'—'), coalesce(v_mql_rot,'—');
    end if;

    -- D7 — lệch ĐVT thì CHẶN, PĐD gõ tay ở đợt bổ sung thay vì đổ nguyên số.
    -- Đo thật 23/08/2026: 68/446 nhóm nhiều mã hàng lệch ĐVT trong cùng nhóm.
    if coalesce(btrim(v_dvt_rot),'') is distinct from coalesce(btrim(v_dvt_nhan),'') then
        raise exception
            'Lệch đơn vị tính — mã rớt % tính theo "%", mã nhận % tính theo "%". Không đổ tự động; nhập tay số cho mã nhận.',
            p_ma_hang_rot, coalesce(v_dvt_rot,'—'), p_ma_hang_nhan, coalesce(v_dvt_nhan,'—');
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

        -- D9 — noti phải nói rõ khi khoa chưa từng dùng mã nhận.
        perform fn_ghi_thong_bao(
            'khoa', r.khoa, 'chuyen_ma',
            format('Mã %s rớt — số của khoa chuyển sang mã %s', p_ma_hang_rot, p_ma_hang_nhan),
            format('%s %s đã được chuyển sang mã %s (%s).%s',
                   r.con_lai, coalesce(v_dvt_rot,''), p_ma_hang_nhan, coalesce(v_ten_nhan,''),
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

    -- QĐ D15 (24/08/2026) — sau khi đổ, MÃ NHẬN phải được chia lại trên tổng
    -- mới (trúng + nhận). Hai việc:
    --   a) khoa chưa từng đề xuất mã nhận thì chưa có dòng phân bổ nào — đẻ ra
    --      với q_khoa = 0, nếu không phần nhận của khoa đó không có chỗ đứng;
    --   b) xoá trắng ô số trúng của mã nhận để PĐD gõ lại, đúng luật D14.
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
        format('Đã đổ số rớt của mã %s sang mã %s cho %s khoa', p_ma_hang_rot, p_ma_hang_nhan, v_so),
        btrim(p_ly_do), p_dot_goi_id,
        jsonb_build_object('ma_hang_rot', p_ma_hang_rot, 'ma_hang_nhan', p_ma_hang_nhan, 'so_khoa', v_so));
    return v_so;
end;
$$;

grant execute on function day_so_luong_rot_v3(bigint, text, text, text) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Chốt trình ký: BỎ phần cộng thêm của patch_zzzzzf
--
--    Bản zzzzzf cộng `da_nhan` vào lúc đóng băng, vì khi đó phần nhận nằm ngoài
--    `phan_bo_trung_v3`. Từ QĐ D15 phần nhận ĐÃ nằm trong đó (PĐD tự chia), nên
--    cộng thêm lần nữa là CỘNG ĐÔI. Trả `chot_trinh_ky_toan_bo_v3` về bản gốc,
--    chỉ đổi phép kiểm khoá cứng 2 sang so với "số phải chia".
-- ───────────────────────────────────────────────────────────────────────────
create or replace function chot_trinh_ky_toan_bo_v3(p_dot_goi_id bigint)
returns chot_trinh_ky_phien_v3
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
    v_q chot_q_phien%rowtype;
    v_phien chot_trinh_ky_phien_v3%rowtype;
    v_revision int;
    v_thieu text[];
    v_chua_gui int;
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
$$;

grant execute on function chot_trinh_ky_toan_bo_v3(bigint) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Chặn đổ sang mã KHÔNG có trong đợt (phát hiện khi chạy smoke 24/08)
-- ───────────────────────────────────────────────────────────────────────────
create or replace function day_so_luong_rot_v3(
    p_dot_goi_id bigint, p_ma_hang_rot text, p_ma_hang_nhan text, p_ly_do text)
returns int
language plpgsql security definer set search_path = public, auth as $$
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

    select id into v_phien from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    select ma_quan_ly, dvt into v_mql_rot, v_dvt_rot from vat_tu where ma_hang = p_ma_hang_rot;
    select ma_quan_ly, dvt, ten_vat_tu into v_mql_nhan, v_dvt_nhan, v_ten_nhan
    from vat_tu where ma_hang = p_ma_hang_nhan;
    if v_mql_nhan is null then raise exception 'Không có mã hàng %.', p_ma_hang_nhan; end if;

    -- Cùng mã quản lý mới đổ được — giữ nguyên khoá "tổng mã quản lý không đổi".
    if v_mql_rot is distinct from v_mql_nhan then
        raise exception 'Mã nhận (%) không cùng mã quản lý với mã rớt (%): % ≠ %.',
            p_ma_hang_nhan, p_ma_hang_rot, coalesce(v_mql_nhan,'—'), coalesce(v_mql_rot,'—');
    end if;

    -- 24/08/2026 — MÃ NHẬN PHẢI CÓ TRONG ĐỢT NÀY.
    -- Giao diện vốn chỉ liệt kê mã anh em đang có trong đợt, nhưng RPC thì
    -- không kiểm — gọi thẳng vẫn đổ được sang một mã chưa hề mang đi thầu.
    -- Khi đó phần nhận không có chỗ đứng: mã đó không nằm trong snapshot Q nên
    -- không hiện trên bảng, cổng khoá cứng 2 cũng không thấy để chặn.
    if not exists (select 1 from v_ket_qua_thau_v3 k
                   where k.phien_q_id = v_phien and k.ma_hang = p_ma_hang_nhan) then
        raise exception 'Mã nhận % không có trong đợt này — chỉ đổ được sang mã cùng nhóm đã mang đi thầu.',
            p_ma_hang_nhan;
    end if;
    if (select so_luong_trung from v_ket_qua_thau_v3
        where phien_q_id = v_phien and ma_hang = p_ma_hang_nhan) <= 0 then
        raise exception 'Mã nhận % cũng đã rớt sạch, không gánh thêm được.', p_ma_hang_nhan;
    end if;

    -- D7 — lệch ĐVT thì CHẶN, PĐD gõ tay ở đợt bổ sung thay vì đổ nguyên số.
    -- Đo thật 23/08/2026: 68/446 nhóm nhiều mã hàng lệch ĐVT trong cùng nhóm.
    if coalesce(btrim(v_dvt_rot),'') is distinct from coalesce(btrim(v_dvt_nhan),'') then
        raise exception
            'Lệch đơn vị tính — mã rớt % tính theo "%", mã nhận % tính theo "%". Không đổ tự động; nhập tay số cho mã nhận.',
            p_ma_hang_rot, coalesce(v_dvt_rot,'—'), p_ma_hang_nhan, coalesce(v_dvt_nhan,'—');
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

        -- D9 — noti phải nói rõ khi khoa chưa từng dùng mã nhận.
        perform fn_ghi_thong_bao(
            'khoa', r.khoa, 'chuyen_ma',
            format('Mã %s rớt — số của khoa chuyển sang mã %s', p_ma_hang_rot, p_ma_hang_nhan),
            format('%s %s đã được chuyển sang mã %s (%s).%s',
                   r.con_lai, coalesce(v_dvt_rot,''), p_ma_hang_nhan, coalesce(v_ten_nhan,''),
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

    -- QĐ D15 (24/08/2026) — sau khi đổ, MÃ NHẬN phải được chia lại trên tổng
    -- mới (trúng + nhận). Hai việc:
    --   a) khoa chưa từng đề xuất mã nhận thì chưa có dòng phân bổ nào — đẻ ra
    --      với q_khoa = 0, nếu không phần nhận của khoa đó không có chỗ đứng;
    --   b) xoá trắng ô số trúng của mã nhận để PĐD gõ lại, đúng luật D14.
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
        format('Đã đổ số rớt của mã %s sang mã %s cho %s khoa', p_ma_hang_rot, p_ma_hang_nhan, v_so),
        btrim(p_ly_do), p_dot_goi_id,
        jsonb_build_object('ma_hang_rot', p_ma_hang_rot, 'ma_hang_nhan', p_ma_hang_nhan, 'so_khoa', v_so));
    return v_so;
end;
$$;

grant execute on function day_so_luong_rot_v3(bigint, text, text, text) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Chặn ĐỔ khi mã rớt chưa chia xong — nếu không nó đổ đi CẢ Q
-- ───────────────────────────────────────────────────────────────────────────
create or replace function day_so_luong_rot_v3(
    p_dot_goi_id bigint, p_ma_hang_rot text, p_ma_hang_nhan text, p_ly_do text)
returns int
language plpgsql security definer set search_path = public, auth as $$
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

    select id into v_phien from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    select ma_quan_ly, dvt into v_mql_rot, v_dvt_rot from vat_tu where ma_hang = p_ma_hang_rot;
    select ma_quan_ly, dvt, ten_vat_tu into v_mql_nhan, v_dvt_nhan, v_ten_nhan
    from vat_tu where ma_hang = p_ma_hang_nhan;
    if v_mql_nhan is null then raise exception 'Không có mã hàng %.', p_ma_hang_nhan; end if;

    -- Cùng mã quản lý mới đổ được — giữ nguyên khoá "tổng mã quản lý không đổi".
    if v_mql_rot is distinct from v_mql_nhan then
        raise exception 'Mã nhận (%) không cùng mã quản lý với mã rớt (%): % ≠ %.',
            p_ma_hang_nhan, p_ma_hang_rot, coalesce(v_mql_nhan,'—'), coalesce(v_mql_rot,'—');
    end if;

    -- 24/08/2026 — MÃ NHẬN PHẢI CÓ TRONG ĐỢT NÀY.
    -- Giao diện vốn chỉ liệt kê mã anh em đang có trong đợt, nhưng RPC thì
    -- không kiểm — gọi thẳng vẫn đổ được sang một mã chưa hề mang đi thầu.
    -- Khi đó phần nhận không có chỗ đứng: mã đó không nằm trong snapshot Q nên
    -- không hiện trên bảng, cổng khoá cứng 2 cũng không thấy để chặn.
    if not exists (select 1 from v_ket_qua_thau_v3 k
                   where k.phien_q_id = v_phien and k.ma_hang = p_ma_hang_nhan) then
        raise exception 'Mã nhận % không có trong đợt này — chỉ đổ được sang mã cùng nhóm đã mang đi thầu.',
            p_ma_hang_nhan;
    end if;
    if (select so_luong_trung from v_ket_qua_thau_v3
        where phien_q_id = v_phien and ma_hang = p_ma_hang_nhan) <= 0 then
        raise exception 'Mã nhận % cũng đã rớt sạch, không gánh thêm được.', p_ma_hang_nhan;
    end if;

    -- D7 — lệch ĐVT thì CHẶN, PĐD gõ tay ở đợt bổ sung thay vì đổ nguyên số.
    -- Đo thật 23/08/2026: 68/446 nhóm nhiều mã hàng lệch ĐVT trong cùng nhóm.
    if coalesce(btrim(v_dvt_rot),'') is distinct from coalesce(btrim(v_dvt_nhan),'') then
        raise exception
            'Lệch đơn vị tính — mã rớt % tính theo "%", mã nhận % tính theo "%". Không đổ tự động; nhập tay số cho mã nhận.',
            p_ma_hang_rot, coalesce(v_dvt_rot,'—'), p_ma_hang_nhan, coalesce(v_dvt_nhan,'—');
    end if;

    -- 24/08/2026 — CỔNG CHẶN, cùng lớp với cổng của `xac_nhan_rot_v3`.
    -- Phần rớt của một khoa tính bằng `q_khoa − so_luong_trung`. Từ luật D14,
    -- ghi rớt xong là ô số trúng theo khoa về TRỐNG (= 0), nên nếu đổ lúc đó
    -- thì con_lai = q_khoa và hệ chuyển ĐI CẢ Q thay vì phần rớt.
    -- Đo thật: mã Q=200, rớt 80, chưa chia → đổ đi 200. Phải chia trước đã.
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

        -- D9 — noti phải nói rõ khi khoa chưa từng dùng mã nhận.
        perform fn_ghi_thong_bao(
            'khoa', r.khoa, 'chuyen_ma',
            format('Mã %s rớt — số của khoa chuyển sang mã %s', p_ma_hang_rot, p_ma_hang_nhan),
            format('%s %s đã được chuyển sang mã %s (%s).%s',
                   r.con_lai, coalesce(v_dvt_rot,''), p_ma_hang_nhan, coalesce(v_ten_nhan,''),
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

    -- QĐ D15 (24/08/2026) — sau khi đổ, MÃ NHẬN phải được chia lại trên tổng
    -- mới (trúng + nhận). Hai việc:
    --   a) khoa chưa từng đề xuất mã nhận thì chưa có dòng phân bổ nào — đẻ ra
    --      với q_khoa = 0, nếu không phần nhận của khoa đó không có chỗ đứng;
    --   b) xoá trắng ô số trúng của mã nhận để PĐD gõ lại, đúng luật D14.
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
        format('Đã đổ số rớt của mã %s sang mã %s cho %s khoa', p_ma_hang_rot, p_ma_hang_nhan, v_so),
        btrim(p_ly_do), p_dot_goi_id,
        jsonb_build_object('ma_hang_rot', p_ma_hang_rot, 'ma_hang_nhan', p_ma_hang_nhan, 'so_khoa', v_so));
    return v_so;
end;
$$;

grant execute on function day_so_luong_rot_v3(bigint, text, text, text) to authenticated;
