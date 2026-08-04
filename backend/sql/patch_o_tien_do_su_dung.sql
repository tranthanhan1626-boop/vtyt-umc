-- Theo dõi TIẾN ĐỘ SỬ DỤNG so với cam kết 80%.
--
-- Khác hẳn A.4 (tiến độ ĐẤU THẦU: 5 mốc chào giá → hàng về). Cái này bắt đầu
-- SAU KHI hàng về, theo dõi khoa có dùng kịp cam kết không:
--     6 tháng  ≥ 20%   ·   12 tháng ≥ 50%   ·   18 tháng ≥ 80%
--
-- KHÔNG tạo bảng lưu số liệu — mọi thứ TÍNH ĐƯỢC từ dữ liệu đã có:
--   số trúng thầu   <- goi_thau_ket_qua_ma.so_luong_trung
--   đã dùng         <- v_usage_monthly (lịch sử xuất kho theo tháng)
--   mốc bắt đầu     <- goi_thau_moc, mốc 'hang_ve_dot_dau'
-- Lưu số liệu tính được là tự tạo ra hai nguồn sự thật lệch nhau.
--
-- Chạy 1 lần trên STAGING.

begin;

-- Ngưỡng cam kết — để bảng thay vì hard-code, đổi được không cần sửa code.
create table if not exists moc_cam_ket_su_dung (
    thang_thu    smallint primary key,
    ty_le_toi_thieu numeric not null,
    ghi_chu      text
);
insert into moc_cam_ket_su_dung (thang_thu, ty_le_toi_thieu, ghi_chu) values
    (6,  0.20, 'Sau 6 tháng phải dùng tối thiểu 20%'),
    (12, 0.50, 'Sau 12 tháng phải dùng tối thiểu 50%'),
    (18, 0.80, 'Hết kỳ 18 tháng phải đạt cam kết 80%')
on conflict (thang_thu) do nothing;

alter table moc_cam_ket_su_dung enable row level security;
create policy "ai cũng xem mốc cam kết" on moc_cam_ket_su_dung
    for select using ((select auth.role()) = 'authenticated');
create policy "PĐD sửa mốc cam kết" on moc_cam_ket_su_dung
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));

create or replace view v_tien_do_su_dung
with (security_invoker = true) as
with nen as (
    select
        k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
        k.ma_hang, k.don_vi,
        coalesce(k.so_luong_trung, 0) as sl_trung,
        -- Mốc "hàng về đợt đầu" là lúc bắt đầu đếm. Chưa về thì chưa tính.
        (select m.ngay from goi_thau_moc m
          where m.goi_id = k.goi_id and m.ma_moc = 'hang_ve_dot_dau'
            and m.trang_thai = 'hoan_thanh') as ngay_bat_dau
    from goi_thau_ket_qua_ma k
    join goi_thau_tien_do g on g.id = k.goi_id
    where coalesce(k.so_luong_trung, 0) > 0
),
dung as (
    select n.goi_id, n.ma_hang, n.don_vi,
           coalesce(sum(u.so_luong), 0) as da_dung
    from nen n
    left join v_usage_monthly u
           on u.ma_hang = n.ma_hang and u.don_vi = n.don_vi
          and n.ngay_bat_dau is not null
          and make_date(u.nam, u.thang, 1) >= date_trunc('month', n.ngay_bat_dau)
    group by n.goi_id, n.ma_hang, n.don_vi
)
select
    n.goi_id, n.ten_goi, n.nam, n.loai_mua_sam,
    n.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, nk.ten_quan_ly,
    n.don_vi, n.sl_trung, n.ngay_bat_dau,
    d.da_dung,
    case when n.sl_trung > 0 then round(d.da_dung / n.sl_trung * 100, 1) end as phan_tram_da_dung,
    -- Số tháng đã trôi kể từ khi hàng về
    case when n.ngay_bat_dau is not null
         then greatest(0, (date_part('year', age(current_date, n.ngay_bat_dau)) * 12
                         + date_part('month', age(current_date, n.ngay_bat_dau)))::int)
    end as thang_da_qua,
    -- Ngưỡng đang phải đạt: lấy mốc CAO NHẤT đã tới hạn
    (select max(m.ty_le_toi_thieu) from moc_cam_ket_su_dung m
      where n.ngay_bat_dau is not null
        and m.thang_thu <= (date_part('year', age(current_date, n.ngay_bat_dau)) * 12
                          + date_part('month', age(current_date, n.ngay_bat_dau)))::int
    ) as nguong_phai_dat
from nen n
join dung d on d.goi_id = n.goi_id and d.ma_hang = n.ma_hang and d.don_vi = n.don_vi
left join vat_tu v on v.ma_hang = n.ma_hang
left join nhom_ky_thuat nk on nk.ma_quan_ly = v.ma_quan_ly;

commit;
