-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzd — GÓI TÙY CHỌN MUA THÊM 30% CHỈ GIỮ MÃ ĐÃ TRÚNG (24/08/2026)
--
-- Chủ dự án chốt: "gói tuỳ chọn mua thêm chỉ giữ lại những mã hàng đã trúng
-- thầu sau cả 3 giai đoạn rớt".
--
-- Bản cũ gom `chot_trinh_ky_dong_v3` theo (khoa × mã quản lý) mà KHÔNG lọc
-- dòng có số trúng = 0. Hậu quả: mã rớt sạch vẫn hiện trong danh sách 30% với
-- trần 0 — người dùng phải tự đọc số mới biết mã đó không mua thêm được, và
-- danh sách dài gấp nhiều lần cần thiết ở quy mô thật.
--
-- Sửa: lọc `d.so_luong_trung > 0` ngay ở CTE gốc. Mã quản lý mà mọi mã hàng
-- đều rớt sạch thì biến mất khỏi danh sách, thay vì hiện một dòng trần 0.
-- ═══════════════════════════════════════════════════════════════════════════
-- Thêm cột mới nên phải drop trước: create or replace view không đổi được
-- danh sách cột.
drop view if exists v_tuy_chon_mua_them_30_v3 cascade;
create view v_tuy_chon_mua_them_30_v3 with (security_invoker = true) as
with quyen as (
    select p.id phien_trinh_ky_id, p.dot_goi_id, p.revision, p.chot_luc,
           d.khoa, d.ma_quan_ly,
           sum(d.so_luong_trung) so_luong_trung,
           min(d.dvt) dvt,
           min(d.ten_vat_tu) ten_dai_dien,
           count(*) so_ma_trung
    from chot_trinh_ky_phien_v3 p
    join chot_trinh_ky_dong_v3 d on d.phien_id = p.id
    where p.hieu_luc and d.ma_quan_ly is not null
      -- QĐ 24/08/2026: chỉ mã ĐÃ TRÚNG sau cả ba giai đoạn rớt mới vào gói 30%.
      and d.so_luong_trung > 0
    group by p.id, p.dot_goi_id, p.revision, p.chot_luc, d.khoa, d.ma_quan_ly
    having sum(d.so_luong_trung) > 0
), da_dung as (
    select dot_goi_id, khoa, ma_quan_ly, sum(so_luong_kich_hoat) da_kich_hoat,
           max(created_at) kich_hoat_gan_nhat
    from tuy_chon_mua_them_30_v3 group by dot_goi_id, khoa, ma_quan_ly
)
select q.*, dg.dot_id, dg.goi_id, dd.ten ten_dot, dd.nam, dd.thang_moc,
       gc.loai_mua_sam, n.ten_quan_ly,
       floor(q.so_luong_trung * 0.30) tran_mua_them_30,
       coalesce(x.da_kich_hoat, 0) da_kich_hoat,
       greatest(floor(q.so_luong_trung * 0.30) - coalesce(x.da_kich_hoat, 0), 0) con_lai,
       x.kich_hoat_gan_nhat
from quyen q
join dot_goi dg on dg.id = q.dot_goi_id
join dot_de_xuat dd on dd.id = dg.dot_id
join goi_con gc on gc.goi_id = dg.goi_id
left join nhom_ky_thuat n on n.ma_quan_ly = q.ma_quan_ly
left join da_dung x on x.dot_goi_id = q.dot_goi_id and x.khoa = q.khoa
                   and x.ma_quan_ly = q.ma_quan_ly;

grant select on v_tuy_chon_mua_them_30_v3 to authenticated;
