-- Tiến độ sử dụng nhìn theo GÓI THẦU + dự kiến tháng nào hết hàng.
--
-- Bổ sung vào `v_tien_do_su_dung` (patch O) 5 cột ở CUỐI:
--   sl_de_xuat        số khoa ĐỀ XUẤT (để đối chiếu với số thực trúng)
--   tb_thang          trung bình dùng mỗi tháng kể từ khi hàng về
--   con_lai           số còn lại chưa dùng
--   thang_con_lai     còn dùng được bao nhiêu tháng nữa với nhịp hiện tại
--   ngay_du_kien_het  ngày dự kiến hết hàng
--
-- ⚠️ Cột mới BẮT BUỘC nằm cuối: `create or replace view` chèn cột vào giữa sẽ
-- lỗi 42P16 (CLAUDE.md bẫy 5.3). 16 cột đầu giữ nguyên thứ tự của patch O.
--
-- Vì sao cần: ĐVSD phải biết TRƯỚC khi hết hàng để kịp làm thầu bổ sung. Biết
-- lúc kho báo hết là đã muộn 3-4 tháng — đúng cái vòng lặp sinh ra gói bổ sung.
--
-- Cách tính nhịp dùng: `đã dùng / số tháng đã trôi`, KHÔNG phải trung bình của
-- các tháng có phát sinh. Tháng nào không dùng gì vẫn phải tính là 0 — bỏ nó ra
-- sẽ thổi phồng nhịp dùng và báo hết hàng sớm hơn thực tế.
--
-- Chạy 1 lần trên STAGING.

begin;

create or replace view v_tien_do_su_dung
with (security_invoker = true) as
with nen as (
    select
        k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
        k.ma_hang, k.don_vi,
        coalesce(k.so_luong_trung, 0) as sl_trung,
        k.so_luong_de_xuat            as sl_de_xuat,
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
),
ghep as (
    select
        n.goi_id, n.ten_goi, n.nam, n.loai_mua_sam,
        n.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, nk.ten_quan_ly,
        n.don_vi, n.sl_trung, n.ngay_bat_dau, n.sl_de_xuat,
        d.da_dung,
        case when n.ngay_bat_dau is not null
             then greatest(0, (date_part('year',  age(current_date, n.ngay_bat_dau)) * 12
                             + date_part('month', age(current_date, n.ngay_bat_dau)))::int)
        end as thang_da_qua
    from nen n
    join dung d on d.goi_id = n.goi_id and d.ma_hang = n.ma_hang and d.don_vi = n.don_vi
    left join vat_tu v on v.ma_hang = n.ma_hang
    left join nhom_ky_thuat nk on nk.ma_quan_ly = v.ma_quan_ly
),
nhip as (
    select g.*,
           -- Chưa qua tháng nào thì chưa có nhịp để suy ra gì.
           case when g.thang_da_qua > 0 then g.da_dung::numeric / g.thang_da_qua end as tb_thang,
           greatest(0, g.sl_trung - g.da_dung) as con_lai
      from ghep g
)
select
    goi_id, ten_goi, nam, loai_mua_sam,
    ma_hang, ten_vat_tu, dvt, ma_quan_ly, ten_quan_ly,
    don_vi, sl_trung, ngay_bat_dau,
    da_dung,
    case when sl_trung > 0 then round(da_dung / sl_trung * 100, 1) end as phan_tram_da_dung,
    thang_da_qua,
    (select max(m.ty_le_toi_thieu) from moc_cam_ket_su_dung m
      where thang_da_qua is not null and m.thang_thu <= thang_da_qua) as nguong_phai_dat,
    -- 5 cột mới, luôn ở cuối
    sl_de_xuat,
    round(tb_thang, 1) as tb_thang,
    con_lai,
    case when tb_thang > 0 then round(con_lai / tb_thang, 1) end as thang_con_lai,
    case when tb_thang > 0 and con_lai > 0
         then current_date + (round(con_lai / tb_thang * 30.44))::int
    end as ngay_du_kien_het
from nhip;

commit;
