-- patch_zzzzzzzg — 18/09/2026
--
-- SỐ ĐỀ XUẤT KỲ TRƯỚC — CHỈ ĐỂ XEM (QĐ 18/09 mục p)
--
-- Nguồn: `de_xuat.xlsx` ở gốc repo (4 cột: Đơn vị · Quyết định · Mã hàng ·
-- Số lượng đề xuất). Chủ dự án xác nhận 18/09/2026: đây là SỐ KHOA GÕ BAN ĐẦU
-- của kỳ thầu trước, tính cho 18 tháng. Một mã có thể nằm ở nhiều quyết định
-- (9 số QĐ) nên lưu theo (khoa, mã hàng, số QĐ) và gộp bằng view.
--
-- Nạp bằng `backend/scripts/nap_de_xuat_ky_truoc.py` (xem trước bằng `--kiem`,
-- ghi bằng `--that-su-nap --xac-nhan-staging`). Web KHÔNG ghi bảng này.
--
-- `so_luong` tính theo ĐVT của MÃ HÀNG. Cộng qua các mã khác ĐVT là sai, nên
-- view chỉ gộp theo (khoa, ma_hang), không gộp lên mã quản lý.
--
-- Quyền đọc: PĐD/admin xem hết; khoa chỉ xem dòng của khoa mình (khuôn
-- patch_zzzzzq). Hàm bọc `(select ...)` để chạy một lần cho cả câu
-- (patch_zzzzzm). Không có policy INSERT/UPDATE/DELETE.
--
-- Chạy lại được nhiều lần.

begin;

create table if not exists de_xuat_ky_truoc (
    id             bigserial primary key,
    khoa           text        not null,
    ma_hang        text        not null,
    -- Dạng chuẩn hoá: chữ Đ U+0110. File gốc viết bằng Ð U+00D0 (chữ Eth
    -- Iceland), trông giống hệt nhưng so chuỗi thì khác.
    so_quyet_dinh  text        not null
        check (position(chr(208) in so_quyet_dinh) = 0),
    so_luong       numeric     not null check (so_luong >= 0),
    nguon          text,
    nap_luc        timestamptz not null default now(),
    constraint de_xuat_ky_truoc_khoa_ma_qd_key unique (khoa, ma_hang, so_quyet_dinh)
);

comment on table de_xuat_ky_truoc is
    'Số khoa gõ ban đầu ở kỳ thầu trước (18 tháng), theo quyết định. Chỉ để xem; nạp bằng scripts/nap_de_xuat_ky_truoc.py (QĐ 18/09/2026 mục p).';
comment on column de_xuat_ky_truoc.so_luong is
    'Theo ĐVT của mã hàng. Không cộng qua các mã khác ĐVT.';

alter table de_xuat_ky_truoc enable row level security;

drop policy if exists "khoa xem de xuat ky truoc cua minh" on de_xuat_ky_truoc;
create policy "khoa xem de xuat ky truoc cua minh" on de_xuat_ky_truoc
    for select to authenticated
    using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

-- Không có policy ghi. Thu thêm quyền ghi cho chắc: RLS không policy đã chặn,
-- nhưng revoke thì lỗi báo rõ "permission denied" thay vì lặng lẽ 0 dòng.
revoke all on de_xuat_ky_truoc from anon;
revoke insert, update, delete, truncate on de_xuat_ky_truoc from authenticated;
grant select on de_xuat_ky_truoc to authenticated;

-- View gộp theo (khoa, ma_hang). security_invoker để RLS của bảng áp theo
-- người gọi — khoa vẫn chỉ thấy dòng của mình qua view.
-- `chi_tiet` = mảng [{ "qd": "1599/QĐ-BVĐHYD", "so": 1200 }, ...] cho tooltip,
-- xếp theo số QĐ.
drop view if exists v_de_xuat_ky_truoc;
create view v_de_xuat_ky_truoc
with (security_invoker = true) as
select
    khoa,
    ma_hang,
    sum(so_luong)                                   as tong_so_luong,
    count(*)::int                                   as so_quyet_dinh_dem,
    jsonb_agg(jsonb_build_object('qd', so_quyet_dinh, 'so', so_luong)
              order by so_quyet_dinh)               as chi_tiet
from de_xuat_ky_truoc
group by khoa, ma_hang;

comment on view v_de_xuat_ky_truoc is
    'Tổng số đề xuất kỳ trước theo (khoa, mã hàng) + chi tiết từng QĐ. Chỉ để xem.';

revoke all on v_de_xuat_ky_truoc from anon;
grant select on v_de_xuat_ky_truoc to authenticated;

commit;

-- Kiểm sau khi chạy:
--   select count(*) from de_xuat_ky_truoc;
--   select * from v_de_xuat_ky_truoc order by khoa, ma_hang limit 5;
--   select polname, pg_get_expr(polqual, polrelid) from pg_policy
--   where polrelid = 'de_xuat_ky_truoc'::regclass;
