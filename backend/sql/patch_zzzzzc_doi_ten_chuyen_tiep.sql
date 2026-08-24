-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzc — ĐỔI THUẬT NGỮ: "chuyển tiếp" → "CHUYỂN TIẾP" (24/08/2026)
--
-- Chủ dự án chốt đổi sang từ chuyên môn. "Chuyển tiếp" thực ra mang nghĩa *làm
-- dứt điểm từng phần theo thứ tự* — không phải nghĩa dự án đang dùng. Việc thật
-- là ĐƯA SỐ CHƯA XỬ LÝ SANG KỲ SAU, nên gọi là **chuyển tiếp**.
--
-- Đổi cả tên đối tượng trong database để không có hai tên cho cùng một thứ.
--   chuyen_tiep_rot_v3        → chuyen_tiep_rot_v3
--   v_theo_doi_chuyen_tiep_v3 → v_theo_doi_chuyen_tiep_v3
--   trạng thái 'da_chuyen_tiep'   → 'da_chuyen_tiep'
--              'chuyen_tiep_hong' → 'chuyen_tiep_hong'
--              'chuyen_tiep_thua' → 'chuyen_tiep_thua'
--
-- Phân biệt với `chuyen_so_rot_v3` (đổ số rớt sang mã tương đương CÙNG ĐỢT):
--   chuyen_so_rot_v3   — đổi MÃ, cùng đợt
--   chuyen_tiep_rot_v3 — đổi ĐỢT, cùng mã
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
    if to_regclass('public.chuyen_tiep_rot_v3') is not null
       and to_regclass('public.chuyen_tiep_rot_v3') is null then
        execute 'alter table chuyen_tiep_rot_v3 rename to chuyen_tiep_rot_v3';
    end if;
end $$;


-- Đổi tên index kèm theo, chỉ khi tên cũ còn tồn tại (chạy lại được).
do $$
begin
    if to_regclass('public.cuon_chieu_rot_v3_uidx') is not null then
        execute 'alter index cuon_chieu_rot_v3_uidx rename to chuyen_tiep_rot_v3_uidx';
    end if;
    if to_regclass('public.cuon_chieu_rot_v3_bo_sung_idx') is not null then
        execute 'alter index cuon_chieu_rot_v3_bo_sung_idx rename to chuyen_tiep_rot_v3_bo_sung_idx';
    end if;
    if to_regclass('public.cuon_chieu_rot_v3_phien_idx') is not null then
        execute 'alter index cuon_chieu_rot_v3_phien_idx rename to chuyen_tiep_rot_v3_phien_idx';
    end if;
end $$;

comment on table chuyen_tiep_rot_v3 is
    'Sổ ghi: phần rớt chưa đổ sang mã tương đương đã được CHUYỂN TIẾP sang đợt bổ sung nào. Ô trống ở màn theo dõi = chuyển tiếp hỏng.';

drop view if exists v_theo_doi_chuyen_tiep_v3 cascade;
drop view if exists v_theo_doi_chuyen_tiep_v3 cascade;

-- v_rot_chua_xu_ly_v3 đọc bảng vừa đổi tên → dựng lại cho chắc.
-- `create or replace view` KHÔNG đổi được tên cột (Postgres từ chối) — phải
-- drop trước. Hai view phụ thuộc cũng drop theo bằng cascade rồi dựng lại.
drop view if exists v_rot_theo_ma_v3 cascade;
drop view if exists v_rot_chua_xu_ly_v3 cascade;

create view v_rot_chua_xu_ly_v3 as
select t.phien_q_id, t.dot_goi_id, t.ma_hang, t.khoa,
       v.ma_quan_ly, v.ten_vat_tu, v.dvt,
       t.q_khoa, t.so_luong_trung,
       (t.q_khoa - t.so_luong_trung)                    as so_rot,
       coalesce(c.da_chuyen, 0)                         as da_chuyen,
       coalesce(cc.da_chuyen_tiep, 0)                   as da_chuyen_tiep,
       (t.q_khoa - t.so_luong_trung
         - coalesce(c.da_chuyen, 0)
         - coalesce(cc.da_chuyen_tiep, 0))              as con_lai
from phan_bo_trung_v3 t
join chot_q_phien q on q.id = t.phien_q_id and q.hieu_luc
join vat_tu v on v.ma_hang = t.ma_hang
left join (
    select phien_q_id, ma_hang_rot, khoa, sum(so_luong) da_chuyen
    from chuyen_so_rot_v3 where hieu_luc group by 1,2,3
) c on c.phien_q_id = t.phien_q_id and c.ma_hang_rot = t.ma_hang and c.khoa = t.khoa
left join (
    select phien_q_id, ma_hang, khoa, sum(so_luong) da_chuyen_tiep
    from chuyen_tiep_rot_v3 group by 1,2,3
) cc on cc.phien_q_id = t.phien_q_id and cc.ma_hang = t.ma_hang and cc.khoa = t.khoa
where t.q_khoa > t.so_luong_trung;

grant select on v_rot_chua_xu_ly_v3 to authenticated;

create view v_rot_theo_ma_v3 as
select
    r.phien_q_id, r.dot_goi_id, r.ma_hang,
    sum(r.so_rot)          as so_rot,
    sum(r.da_chuyen)       as da_chuyen,
    sum(r.da_chuyen_tiep)  as da_chuyen_tiep,
    sum(r.con_lai)         as con_lai,
    count(*)               as so_khoa,
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

grant select on v_rot_theo_ma_v3 to authenticated;

create view v_theo_doi_chuyen_tiep_v3
with (security_invoker = true) as
select r.phien_q_id, r.dot_goi_id, r.ma_hang, r.ten_vat_tu, r.dvt,
       r.ma_quan_ly, r.khoa,
       r.so_rot, r.da_chuyen, r.da_chuyen_tiep, r.con_lai,
       greatest(r.da_chuyen + r.da_chuyen_tiep - r.so_rot, 0) as thua_so_voi_rot,
       ch.ma_hang_nhan,
       ch.khoa_chua_tung_dung,
       cc.dot_goi_bo_sung_id,
       gc.nhan            as goi_bo_sung,
       dd.nam             as nam_bo_sung,
       dd.thang_moc       as thang_bo_sung,
       pb.so_luong_hien_hanh as so_khoa_dang_de_xuat,
       (pb.so_luong_hien_hanh is distinct from cc.so_luong) as khoa_da_sua_so,
       exists (select 1 from danh_muc_khoa_chot dk
               where dk.dot_goi_id = cc.dot_goi_bo_sung_id and dk.khoa = r.khoa)
                          as khoa_da_xac_nhan,
       case
         when r.da_chuyen + r.da_chuyen_tiep - r.so_rot > 0 then 'chuyen_tiep_thua'
         when r.con_lai > 0                     then 'con_no_xu_ly'
         when ch.ma_hang_nhan is not null
              and cc.dot_goi_bo_sung_id is null then 'da_do_sang_ma'
         when cc.dot_goi_bo_sung_id is null     then 'chuyen_tiep_hong'
         else 'da_chuyen_tiep'
       end                as trang_thai
from v_rot_chua_xu_ly_v3 r
left join chuyen_tiep_rot_v3 cc
       on cc.phien_q_id = r.phien_q_id and cc.ma_hang = r.ma_hang and cc.khoa = r.khoa
left join chuyen_so_rot_v3 ch
       on ch.phien_q_id = r.phien_q_id and ch.ma_hang_rot = r.ma_hang
      and ch.khoa = r.khoa and ch.hieu_luc
left join dot_goi dg  on dg.id = cc.dot_goi_bo_sung_id
left join goi_con gc  on gc.goi_id = dg.goi_id
left join dot_de_xuat dd on dd.id = dg.dot_id
left join phan_bo_khoa pb
       on pb.dot_goi_id = cc.dot_goi_bo_sung_id and pb.ma_hang = r.ma_hang and pb.khoa = r.khoa;

grant select on v_theo_doi_chuyen_tiep_v3 to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- Dựng lại cò theo tên bảng mới. Nội dung nghiệp vụ GIỮ NGUYÊN (D11 + D12) —
-- chỉ đổi tên bảng và thuật ngữ trong câu chữ gửi ra cho người dùng.
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
