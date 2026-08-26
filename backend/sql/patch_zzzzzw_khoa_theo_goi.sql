-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzw — MỘT KHOA ĐANG ĐỀ XUẤT Ở NHỮNG GÓI NÀO (QĐ 26/08/2026)
--
-- Chủ dự án: *"tôi muốn thể hiện thông tin khoa đó đang có đề xuất trong bao
-- nhiêu gói, mỗi gói đề xuất bao nhiêu mã quản lý bao nhiêu mã hàng"* — và nói
-- trước ý sau: *"sau này tôi muốn lọc với mã hàng đó thì khoa đó đã đề xuất
-- trong bao nhiêu gói rồi"*.
--
-- Hai câu hỏi đó cùng một nền: **(khoa × DOT_GOI)** và **(khoa × mã hàng ×
-- DOT_GOI)**. Dựng hai view thay vì để màn hình tự gom ở trình duyệt — Bàn điều
-- hành chỉ nạp dữ liệu của gói con đang đứng, không có cách nào biết khoa đó
-- còn đề xuất ở gói khác.
--
-- Đếm trên `phan_bo_khoa` (số HIỆN HÀNH) chứ không trên `proposals` (dấu vết
-- gốc): số hiện hành mới là cái PĐD đang nhìn, và nó đã gộp mọi lần sửa.
-- Chỉ tính dòng `so_luong_hien_hanh > 0` — dòng về 0 là mã khoa đã bỏ hoặc đã
-- xử lý xong sau rớt, giữ lại thì đếm ra số gói ảo.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Khoa × DOT_GOI — mỗi dòng: khoa này ở gói này có bao nhiêu mã
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_khoa_theo_goi_v3 cascade;
create view v_khoa_theo_goi_v3
with (security_invoker = true) as
select
    pb.khoa,
    pb.dot_goi_id,
    dg.goi_id,
    gc.nhan                                   as ten_goi,
    dg.dot_id,
    d.ten                                     as ten_dot,
    d.nam,
    d.thang_moc,
    d.loai_mua_sam,
    d.trang_thai                              as trang_thai_dot,
    count(distinct v.ma_quan_ly)              as so_ma_quan_ly,
    count(distinct pb.ma_hang)                as so_ma_hang,
    sum(pb.so_luong_hien_hanh)                as tong_so_luong
from phan_bo_khoa pb
join dot_goi dg      on dg.id = pb.dot_goi_id
join dot_de_xuat d   on d.id = dg.dot_id
join goi_con gc      on gc.goi_id = dg.goi_id
left join vat_tu v   on v.ma_hang = pb.ma_hang
where pb.so_luong_hien_hanh > 0
group by pb.khoa, pb.dot_goi_id, dg.goi_id, gc.nhan, dg.dot_id,
         d.ten, d.nam, d.thang_moc, d.loai_mua_sam, d.trang_thai;

comment on view v_khoa_theo_goi_v3 is
    'Mỗi dòng: một khoa đang đề xuất ở một DOT_GOI, kèm số mã quản lý / mã hàng / tổng số lượng. Đếm trên số HIỆN HÀNH, bỏ dòng đã về 0 (QĐ 26/08/2026).';

grant select on v_khoa_theo_goi_v3 to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Khoa × MÃ HÀNG × DOT_GOI — nền cho việc lọc theo mã hàng
--    "Mã này khoa đó đã đề xuất ở những gói nào rồi."
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_ma_hang_theo_goi_v3 cascade;
create view v_ma_hang_theo_goi_v3
with (security_invoker = true) as
select
    pb.ma_hang,
    v.ten_vat_tu,
    v.ma_quan_ly,
    v.dvt,
    pb.khoa,
    pb.dot_goi_id,
    dg.goi_id,
    gc.nhan                                   as ten_goi,
    dg.dot_id,
    d.ten                                     as ten_dot,
    d.nam,
    d.thang_moc,
    d.loai_mua_sam,
    pb.so_luong_hien_hanh                     as so_luong
from phan_bo_khoa pb
join dot_goi dg      on dg.id = pb.dot_goi_id
join dot_de_xuat d   on d.id = dg.dot_id
join goi_con gc      on gc.goi_id = dg.goi_id
left join vat_tu v   on v.ma_hang = pb.ma_hang
where pb.so_luong_hien_hanh > 0;

comment on view v_ma_hang_theo_goi_v3 is
    'Mỗi dòng: một mã hàng của một khoa ở một DOT_GOI. Nền cho câu hỏi "mã này khoa đó đã đề xuất ở những gói nào" (QĐ 26/08/2026).';

grant select on v_ma_hang_theo_goi_v3 to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Chỉ mục cho hai view trên. Không có nó thì mỗi lần mở Bàn điều hành là
--    quét toàn bộ `phan_bo_khoa` — ở quy mô thật bảng này có hàng chục nghìn
--    dòng.
-- ───────────────────────────────────────────────────────────────────────────
create index if not exists phan_bo_khoa_khoa_idx
    on phan_bo_khoa (khoa) where so_luong_hien_hanh > 0;
create index if not exists phan_bo_khoa_ma_hang_idx
    on phan_bo_khoa (ma_hang) where so_luong_hien_hanh > 0;
