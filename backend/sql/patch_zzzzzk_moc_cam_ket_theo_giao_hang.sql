-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzk — MỐC ĐẾM CAM KẾT 20/50/80 TÍNH TỪ NGÀY HÀNG VỀ THẬT
--                (miếng 3, mảng 3 · 25/08/2026)
--
-- Cam kết sử dụng đếm 6/12/18 tháng KỂ TỪ KHI CÓ HÀNG. Bản trước
-- (`patch_zzzzza`, 23/08) tạm lấy **ngày chốt trình ký** làm mốc, vì lúc đó
-- chưa có bảng nào ghi ngày hàng về — mốc cũ `goi_thau_moc` đã chết từ 17/08.
--
-- Ngày chốt trình ký SỚM HƠN ngày hàng về, thường vài tháng. Dùng nó làm mốc
-- thì đồng hồ chạy trước lúc khoa có hàng để dùng, và mọi khoa đều trông như
-- đang chậm cam kết. Đây là loại sai không ai bắt được bằng mắt: view vẫn ra
-- số, chỉ là số sai theo một hướng.
--
-- Nay `giao_hang` đã có (patch_zzzzzj), nên:
--
--     mốc = min(giao_hang.ngay_giao) của (đợt × mã hàng)
--     chưa có dòng giao nào → LÙI VỀ ngày chốt trình ký như trước
--
-- Cột `nguon_moc` nói rõ mốc đang lấy từ đâu — `giao_hang` hay `chot_trinh_ky`
-- — để người xem biết con số đáng tin tới mức nào. Cột này đã có sẵn trong
-- view, chỉ nay mới có hai giá trị thật.
--
-- Giữ NGUYÊN TÊN VÀ THỨ TỰ MỌI CỘT. Bài học 24/08: viết lại view mà rớt cột
-- làm vỡ ba màn mà `build` lẫn `pytest` đều không thấy.
-- Thêm hai cột mới ở CUỐI (`ngay_chot_trinh_ky`, `so_lan_giao`) — thêm ở cuối
-- thì màn cũ không việc gì.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

drop view if exists v_tien_do_su_dung cascade;
create view v_tien_do_su_dung
with (security_invoker = true) as
with nen as (
    select
        dg.goi_id,
        gc.nhan                       as ten_goi,
        d.nam,
        d.loai_mua_sam,
        c.dot_goi_id,
        c.ma_hang,
        c.khoa                        as don_vi,
        sum(c.so_luong_trung)         as sl_trung,
        max(p.chot_luc)               as ngay_chot_trinh_ky
    from chot_trinh_ky_dong_v3 c
    join chot_trinh_ky_phien_v3 p on p.id = c.phien_id and p.hieu_luc
    join dot_goi dg      on dg.id = c.dot_goi_id
    join dot_de_xuat d   on d.id = dg.dot_id
    join goi_con gc      on gc.goi_id = dg.goi_id
    group by dg.goi_id, gc.nhan, d.nam, d.loai_mua_sam, c.dot_goi_id, c.ma_hang, c.khoa
    having sum(c.so_luong_trung) > 0
),
-- Ngày hàng về đầu tiên của (đợt × mã hàng). Lấy theo MÃ chứ không theo khoa:
-- hàng về kho chung thì dòng giao không có khoa (QĐ 25/08), nên mốc của mọi
-- khoa dùng chung một mã là như nhau.
giao as (
    select dot_goi_id, ma_hang,
           min(ngay_giao) as lan_giao_dau,
           count(*)       as so_lan_giao
    from giao_hang
    group by dot_goi_id, ma_hang
),
moc as (
    select n.*,
           g.lan_giao_dau,
           coalesce(g.so_lan_giao, 0) as so_lan_giao,
           coalesce(g.lan_giao_dau::timestamptz, n.ngay_chot_trinh_ky) as ngay_bat_dau,
           case when g.lan_giao_dau is not null
                then 'giao_hang' else 'chot_trinh_ky' end as nguon_moc
    from nen n
    left join giao g on g.dot_goi_id = n.dot_goi_id and g.ma_hang = n.ma_hang
),
dung as (
    select m.goi_id, m.ma_hang, m.don_vi,
           coalesce(sum(u.so_luong), 0) as da_dung
    from moc m
    left join v_usage_monthly u
           on u.ma_hang = m.ma_hang and u.don_vi = m.don_vi
          and m.ngay_bat_dau is not null
          and make_date(u.nam, u.thang, 1) >= date_trunc('month', m.ngay_bat_dau)
    group by m.goi_id, m.ma_hang, m.don_vi
)
select
    n.goi_id,
    n.ten_goi,
    n.nam,
    n.loai_mua_sam,
    n.nguon_moc,
    n.ma_hang,
    v.ten_vat_tu,
    v.dvt,
    v.ma_quan_ly,
    nk.ten_quan_ly,
    n.don_vi,
    n.sl_trung,
    n.ngay_bat_dau,
    d.da_dung,
    case when n.sl_trung > 0
         then round(d.da_dung / n.sl_trung * 100, 1) end            as phan_tram_da_dung,
    case when n.ngay_bat_dau is not null then greatest(0,
         (date_part('year',  age(current_date, n.ngay_bat_dau)) * 12
        + date_part('month', age(current_date, n.ngay_bat_dau)))::int) end as thang_da_qua,
    (select max(m.ty_le_toi_thieu) from moc_cam_ket_su_dung m
      where n.ngay_bat_dau is not null
        and m.thang_thu <= (date_part('year',  age(current_date, n.ngay_bat_dau)) * 12
                          + date_part('month', age(current_date, n.ngay_bat_dau)))::int)
                                                                     as nguong_phai_dat,
    -- Hai cột MỚI, đặt ở CUỐI để màn cũ không việc gì.
    n.ngay_chot_trinh_ky,
    n.so_lan_giao
from moc n
join dung d on d.goi_id = n.goi_id and d.ma_hang = n.ma_hang and d.don_vi = n.don_vi
left join vat_tu v      on v.ma_hang = n.ma_hang
left join nhom_ky_thuat nk on nk.ma_quan_ly = v.ma_quan_ly;

comment on view v_tien_do_su_dung is
    'Cam kết 20/50/80. Mốc đếm = ngày hàng về đầu tiên (giao_hang); chưa có dòng giao nào thì lùi về ngày chốt trình ký. Cột nguon_moc nói rõ đang lấy mốc nào (QĐ 25/08/2026).';

grant select on v_tien_do_su_dung to authenticated;
