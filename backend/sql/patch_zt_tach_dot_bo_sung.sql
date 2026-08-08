-- ZT — Tách 3 đợt bổ sung T1/T5/T9 (dứt điểm bẫy 16)
--
-- ============================== VÌ SAO ==============================
-- Menu gói bổ sung sinh link `#tong-hop-pdd/bs-t1 | bs-t5 | bs-t9`. Ngày
-- 08/08/2026 đã vá tạm: 3 khoá đó trỏ đúng `mua_sam_bo_sung` thay vì lặng lẽ
-- rơi về gói 18T. Nhưng cả 3 vẫn cho ra CÙNG một rổ dữ liệu — bấm "Bổ sung
-- tháng 1" hay "tháng 9" đều thấy y hệt nhau, gồm cả đề xuất của đợt khác.
--
-- Ba đợt phân biệt nhau bằng `dot_de_xuat.thang_moc` (1 / 5 / 9), không phải
-- bằng cột `proposals.goi`. Vì vậy `goi_con` phải mang thêm chiều đợt.
--
--   dot_de_xuat: id=3 thang_moc=1 · id=4 thang_moc=5 · id=5 thang_moc=9
--
-- `bo-sung` (khoá tổng) GIỮ NGUYÊN nghĩa "tất cả các đợt bổ sung" — vẫn cần
-- khi PĐD muốn nhìn gộp cả năm.

begin;

alter table goi_con add column if not exists thang_moc int;

comment on column goi_con.thang_moc is
    'Chỉ dùng cho gói bổ sung: lọc đúng đợt theo dot_de_xuat.thang_moc. '
    'NULL = không lọc theo đợt (gói 18T, hoặc khoá "bo-sung" gộp cả 3 đợt).';

update goi_con set thang_moc = 1 where goi_id = 'bs-t1';
update goi_con set thang_moc = 5 where goi_id = 'bs-t5';
update goi_con set thang_moc = 9 where goi_id = 'bs-t9';
update goi_con set thang_moc = null
 where goi_id not in ('bs-t1', 'bs-t5', 'bs-t9');

-- ----------------------------------------------------------------------------
-- View số chốt phải lọc theo đợt, nếu không "số chốt của đợt T1" lại gồm cả
-- đề xuất của T5 và T9.
-- ----------------------------------------------------------------------------
create or replace view v_so_chot_de_xuat as
with khoa_cong as (
    select
        g.goi_id,
        p.nam_de_xuat,
        p.ma_hang,
        sum(p.so_luong)          as so_luong_khoa_cong,
        count(distinct p.don_vi) as so_khoa
    from proposals p
    join goi_con g
      on g.loai_mua_sam = p.loai_mua_sam
     and (g.goi is null or g.goi = p.goi)
    -- Chỉ nối sang đợt khi gói con CÓ ràng buộc đợt. left join để đề xuất cũ
    -- chưa gắn dot_id không biến mất khỏi khoá tổng "bo-sung".
    left join dot_de_xuat d on d.id = p.dot_id
    where p.is_current and not p.da_rut
      and (g.thang_moc is null or d.thang_moc = g.thang_moc)
    group by g.goi_id, p.nam_de_xuat, p.ma_hang
),
sua_de as (
    select
        o.goi_id, o.nam_de_xuat, o.ma_hang,
        case when o.gia_tri ~ '^\s*-?\d+(\.\d+)?\s*$'
             then trim(o.gia_tri)::numeric end as so_luong_sua_de,
        o.updated_by, o.updated_at
    from danh_muc_tong_hop_o o
    where o.cot = 'sl_de_xuat_2627'
)
select
    k.goi_id,
    k.nam_de_xuat,
    k.ma_hang,
    k.so_luong_khoa_cong,
    k.so_khoa,
    s.so_luong_sua_de,
    coalesce(s.so_luong_sua_de, k.so_luong_khoa_cong) as so_luong_chot,
    (s.so_luong_sua_de is not null)                   as pdd_da_sua_de,
    s.updated_by  as sua_de_boi,
    s.updated_at  as sua_de_luc,
    (c.goi_id is not null) as da_chot,
    c.chot_boi,
    c.chot_luc
from khoa_cong k
left join sua_de s
       on s.goi_id = k.goi_id and s.nam_de_xuat = k.nam_de_xuat and s.ma_hang = k.ma_hang
left join danh_muc_tong_hop_chot c
       on c.goi_id = k.goi_id and c.nam_de_xuat = k.nam_de_xuat;

grant select on v_so_chot_de_xuat to authenticated;

commit;
