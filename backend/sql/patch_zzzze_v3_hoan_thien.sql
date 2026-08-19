-- Workflow V3 / hoàn thiện — giới hạn đúng gói có quyền mua thêm và dọn
-- nghiệp vụ Sự kiện nhu cầu đã bị loại khỏi quy trình chính thức.
-- Chạy sau patch_zzzzd_v3_trinh_ky.sql.

begin;

-- Bản đầu của view đã mang đủ khóa revision nhưng chưa loại chỉ định thầu.
-- Chặn ở DB (không chỉ ẩn UI) để không thể gọi RPC trực tiếp mà tạo sai quyền.
create or replace view v_tuy_chon_mua_them_30_v3 with (security_invoker = true) as
with quyen as (
    select p.id phien_trinh_ky_id,p.dot_goi_id,p.revision,p.chot_luc,
           d.khoa,d.ma_quan_ly,
           sum(d.so_luong_trung) so_luong_trung,
           min(d.dvt) dvt,
           min(d.ten_vat_tu) ten_dai_dien
    from chot_trinh_ky_phien_v3 p
    join chot_trinh_ky_dong_v3 d on d.phien_id=p.id
    where p.hieu_luc and d.ma_quan_ly is not null
    group by p.id,p.dot_goi_id,p.revision,p.chot_luc,d.khoa,d.ma_quan_ly
), da_dung as (
    select dot_goi_id,khoa,ma_quan_ly,sum(so_luong_kich_hoat) da_kich_hoat,
           max(created_at) kich_hoat_gan_nhat
    from tuy_chon_mua_them_30_v3 group by dot_goi_id,khoa,ma_quan_ly
)
select q.*,dg.dot_id,dg.goi_id,dd.ten ten_dot,dd.nam,dd.thang_moc,
       gc.loai_mua_sam,n.ten_quan_ly,
       floor(q.so_luong_trung*0.30) tran_mua_them_30,
       coalesce(x.da_kich_hoat,0) da_kich_hoat,
       greatest(floor(q.so_luong_trung*0.30)-coalesce(x.da_kich_hoat,0),0) con_lai,
       x.kich_hoat_gan_nhat
from quyen q
join dot_goi dg on dg.id=q.dot_goi_id
join dot_de_xuat dd on dd.id=dg.dot_id
join goi_con gc on gc.goi_id=dg.goi_id
left join nhom_ky_thuat n on n.ma_quan_ly=q.ma_quan_ly
left join da_dung x on x.dot_goi_id=q.dot_goi_id and x.khoa=q.khoa
                   and x.ma_quan_ly=q.ma_quan_ly
where gc.loai_mua_sam in ('dau_thau_rong_rai','mua_sam_bo_sung');

grant select on v_tuy_chon_mua_them_30_v3 to authenticated;

-- Staging đã được sao lưu và bảng này đang rỗng. Nếu môi trường khác có dữ
-- liệu thật, fail trước khi DROP để người vận hành chủ động lưu/di trú dữ liệu.
do $$
declare v_count bigint;
begin
    if to_regclass('public.su_kien_nhu_cau') is not null then
        execute 'select count(*) from public.su_kien_nhu_cau' into v_count;
        if v_count > 0 then
            raise exception 'su_kien_nhu_cau còn dữ liệu; không tự động xóa.';
        end if;
    end if;
end
$$;

drop table if exists su_kien_nhu_cau;
drop function if exists fn_gac_su_kien_nhu_cau();

commit;
