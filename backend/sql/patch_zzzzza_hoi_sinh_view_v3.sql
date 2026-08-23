-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzza — HỒI SINH BA VIEW CHẾT LÊN NỀN v3 (23/08/2026)
--
-- Rà toàn bộ 34 màn ngày 23/08 cho ra: chỉ còn ĐÚNG BA bảng thật sự chết —
-- `goi_thau_ket_qua_ma` · `goi_thau_tien_do` · `goi_thau_moc` (mô hình trước
-- v3, 0 dòng, không có gì ghi vào nữa). Mọi bảng rỗng khác chỉ là "chưa ai
-- dùng tính năng đó", vẫn còn đường ghi sống.
--
-- Ba view dưới đây đứng trên ba bảng chết đó, nên năm màn đọc chúng đều hiện
-- rỗng mà KHÔNG báo lỗi. Viết lại nền của view là chữa cả năm màn một lượt,
-- không phải sửa từng màn:
--   v_ket_qua_thau_theo_khoa → DanhMucDeXuatKhoa · DanhMucDeXuatLinks ·
--                              ThongBaoRotThau · TongHopKetQuaThau · TienDoGoiThau
--   v_ma_rot_theo_goi        → DanhMucDeXuatKhoa
--   v_tien_do_su_dung        → TienDoSuDung · ThongBaoChamTienDo
--
-- Giữ nguyên TÊN CỘT cũ để không phải sửa lại giao diện.
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Kết quả thầu theo khoa — nền v3
--    Nguồn: phan_bo_trung_v3 (số trúng theo khoa) + ket_qua_rot_v3 (giai đoạn
--    rớt và lý do). `so_luong_de_xuat` nay là Q của khoa — đúng nghĩa "số mang
--    đi thầu", không phải số khoa gõ ban đầu.
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_ket_qua_thau_theo_khoa cascade;
create view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
select
    dg.goi_id,
    gc.nhan                                   as ten_goi,
    d.nam,
    d.loai_mua_sam,
    t.dot_goi_id,
    t.phien_q_id,
    t.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    t.khoa                                    as don_vi,
    case when t.so_luong_trung = 0 then 'khong_trung'
         when t.q_khoa > t.so_luong_trung then 'trung_mot_phan'
         else 'trung' end                     as ket_qua,
    r.giai_doan                               as ma_moc_rot,
    r.ly_do                                   as ly_do_khong_trung,
    t.q_khoa                                  as so_luong_de_xuat,
    t.so_luong_trung,
    greatest(t.q_khoa - t.so_luong_trung, 0)  as so_luong_thieu,
    -- Bản cũ có cờ `khoa_da_xem` ghi thẳng vào bảng kết quả. Nay việc "khoa đã
    -- biết chưa" do HỘP THƯ lo (QĐ D5) — xem xong là xoá noti.
    not exists (
        select 1 from thong_bao tb
        where tb.pham_vi = 'khoa' and tb.khoa = t.khoa
          and tb.loai in ('ma_rot_ve_khoa', 'chuyen_ma')
          and tb.du_lieu ->> 'ma_hang' = t.ma_hang
    )                                          as khoa_da_xem,
    t.updated_at                              as cap_nhat_luc
from phan_bo_trung_v3 t
join chot_q_phien q  on q.id = t.phien_q_id and q.hieu_luc
join dot_goi dg      on dg.id = t.dot_goi_id
join dot_de_xuat d   on d.id = dg.dot_id
join goi_con gc      on gc.goi_id = dg.goi_id
left join vat_tu v   on v.ma_hang = t.ma_hang
left join lateral (
    select k.giai_doan, k.ly_do
    from ket_qua_rot_v3 k
    where k.phien_q_id = t.phien_q_id and k.ma_hang = t.ma_hang and k.hieu_luc
    order by case k.giai_doan when 'danh_gia' then 3 when 'mo_thau' then 2 else 1 end desc
    limit 1
) r on true;

grant select on v_ket_qua_thau_theo_khoa to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Mã đang rớt theo gói — nền v3
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_ma_rot_theo_goi cascade;
create view v_ma_rot_theo_goi
with (security_invoker = true) as
select distinct
    dg.goi_id, k.dot_goi_id, k.ma_hang, k.giai_doan as ma_moc_rot
from ket_qua_rot_v3 k
join chot_q_phien q on q.id = k.phien_q_id and q.hieu_luc
join dot_goi dg     on dg.id = k.dot_goi_id
where k.hieu_luc;

grant select on v_ma_rot_theo_goi to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Tiến độ sử dụng theo cam kết 20/50/80 — nền v3
--
--    Bản cũ đếm từ mốc `hang_ve_dot_dau` trong `goi_thau_moc`. Mốc đó thuộc
--    nhánh SAU THẦU chưa build (QĐ D6: hợp đồng · số quyết định · giao hàng).
--    Tới khi nhánh đó có, mốc bắt đầu đếm tạm lấy NGÀY CHỐT TRÌNH KÝ — đó là
--    thời điểm sớm nhất hệ biết chắc "đã mua bao nhiêu cho khoa nào".
--    Cột `nguon_moc` khai thẳng ra đang đếm từ mốc nào, để không ai tưởng đây
--    là ngày hàng thực về.
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_tien_do_su_dung cascade;
create view v_tien_do_su_dung
with (security_invoker = true) as
with nen as (
    select
        dg.goi_id, gc.nhan as ten_goi, d.nam, d.loai_mua_sam,
        c.ma_hang, c.khoa as don_vi,
        sum(c.so_luong_trung)::numeric as sl_trung,
        max(p.chot_luc)                as ngay_bat_dau,
        'chot_trinh_ky'::text          as nguon_moc
    from chot_trinh_ky_dong_v3 c
    join chot_trinh_ky_phien_v3 p on p.id = c.phien_id and p.hieu_luc
    join dot_goi dg    on dg.id = c.dot_goi_id
    join dot_de_xuat d on d.id = dg.dot_id
    join goi_con gc    on gc.goi_id = dg.goi_id
    group by dg.goi_id, gc.nhan, d.nam, d.loai_mua_sam, c.ma_hang, c.khoa
    having sum(c.so_luong_trung) > 0
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
    n.goi_id, n.ten_goi, n.nam, n.loai_mua_sam, n.nguon_moc,
    n.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, nk.ten_quan_ly,
    n.don_vi, n.sl_trung, n.ngay_bat_dau,
    d.da_dung,
    case when n.sl_trung > 0 then round(d.da_dung / n.sl_trung * 100, 1) end as phan_tram_da_dung,
    case when n.ngay_bat_dau is not null
         then greatest(0, (date_part('year', age(current_date, n.ngay_bat_dau)) * 12
                         + date_part('month', age(current_date, n.ngay_bat_dau)))::int)
    end as thang_da_qua,
    (select max(m.ty_le_toi_thieu) from moc_cam_ket_su_dung m
      where n.ngay_bat_dau is not null
        and m.thang_thu <= (date_part('year', age(current_date, n.ngay_bat_dau)) * 12
                          + date_part('month', age(current_date, n.ngay_bat_dau)))::int
    ) as nguong_phai_dat
from nen n
join dung d on d.goi_id = n.goi_id and d.ma_hang = n.ma_hang and d.don_vi = n.don_vi
left join vat_tu v on v.ma_hang = n.ma_hang
left join nhom_ky_thuat nk on nk.ma_quan_ly = v.ma_quan_ly;

grant select on v_tien_do_su_dung to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Màn theo dõi cuốn chiếu — thêm cột trạng thái khoa (QĐ B3, B8)
--    Đọc theo TỪNG MÃ HÀNG RỚT: khoa nào rớt mã đó, đã vào đợt bổ sung nào,
--    khoa đã sửa số chưa, khoa đã xác nhận danh mục ở đợt bổ sung chưa.
--    Ô TRỐNG ở `dot_goi_bo_sung_id` = CUỐN CHIẾU HỎNG, không phải chờ khoa.
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_theo_doi_cuon_chieu_v3 cascade;
create view v_theo_doi_cuon_chieu_v3
with (security_invoker = true) as
select r.phien_q_id, r.dot_goi_id, r.ma_hang, r.ten_vat_tu, r.dvt,
       r.ma_quan_ly, r.khoa,
       r.so_rot, r.da_chuyen, r.da_cuon_chieu, r.con_lai,
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
         when r.con_lai > 0                     then 'con_no_xu_ly'
         when ch.ma_hang_nhan is not null
              and cc.dot_goi_bo_sung_id is null then 'da_do_sang_ma'
         when cc.dot_goi_bo_sung_id is null     then 'cuon_chieu_hong'
         else 'da_cuon_chieu'
       end                as trang_thai
from v_rot_chua_xu_ly_v3 r
left join cuon_chieu_rot_v3 cc
       on cc.phien_q_id = r.phien_q_id and cc.ma_hang = r.ma_hang and cc.khoa = r.khoa
left join chuyen_so_rot_v3 ch
       on ch.phien_q_id = r.phien_q_id and ch.ma_hang_rot = r.ma_hang
      and ch.khoa = r.khoa and ch.hieu_luc
left join dot_goi dg  on dg.id = cc.dot_goi_bo_sung_id
left join goi_con gc  on gc.goi_id = dg.goi_id
left join dot_de_xuat dd on dd.id = dg.dot_id
left join phan_bo_khoa pb
       on pb.dot_goi_id = cc.dot_goi_bo_sung_id and pb.ma_hang = r.ma_hang and pb.khoa = r.khoa;

grant select on v_theo_doi_cuon_chieu_v3 to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Vá v_rot_chua_xu_ly_v3 — phải bám PHIÊN Q CÒN HIỆU LỰC
--    Đo thật 23/08: PĐD bấm "mở chốt" xong, phiên Q thành hieu_luc=false mà
--    phan_bo_trung_v3 vẫn còn dòng, nên màn theo dõi vẫn hiện mã rớt của một
--    phiên đã bị huỷ. Cùng lớp lỗi với Lỗi 24 (hai định nghĩa phạm vi lệch nhau).
-- ───────────────────────────────────────────────────────────────────────────
create or replace view v_rot_chua_xu_ly_v3 as
select t.phien_q_id, t.dot_goi_id, t.ma_hang, t.khoa,
       v.ma_quan_ly, v.ten_vat_tu, v.dvt,
       t.q_khoa, t.so_luong_trung,
       (t.q_khoa - t.so_luong_trung)                    as so_rot,
       coalesce(c.da_chuyen, 0)                         as da_chuyen,
       coalesce(cc.da_cuon_chieu, 0)                    as da_cuon_chieu,
       (t.q_khoa - t.so_luong_trung
         - coalesce(c.da_chuyen, 0)
         - coalesce(cc.da_cuon_chieu, 0))               as con_lai
from phan_bo_trung_v3 t
join chot_q_phien q on q.id = t.phien_q_id and q.hieu_luc
join vat_tu v on v.ma_hang = t.ma_hang
left join (
    select phien_q_id, ma_hang_rot, khoa, sum(so_luong) da_chuyen
    from chuyen_so_rot_v3 where hieu_luc group by 1,2,3
) c on c.phien_q_id = t.phien_q_id and c.ma_hang_rot = t.ma_hang and c.khoa = t.khoa
left join (
    select phien_q_id, ma_hang, khoa, sum(so_luong) da_cuon_chieu
    from cuon_chieu_rot_v3 group by 1,2,3
) cc on cc.phien_q_id = t.phien_q_id and cc.ma_hang = t.ma_hang and cc.khoa = t.khoa
where t.q_khoa > t.so_luong_trung;

grant select on v_rot_chua_xu_ly_v3 to authenticated;
