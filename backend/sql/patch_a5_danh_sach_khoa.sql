-- Sửa lỗi: Phòng Điều dưỡng không chọn được hết các khoa.
--
-- NGUYÊN NHÂN GỐC: v_don_vi và v_danh_sach_khoa suy DUY NHẤT từ
-- usage_history_current. Hệ quả:
--   - Khoa chưa có lịch sử xuất kho -> PĐD không bao giờ chọn được
--   - Khoa mới mở -> người của khoa đó không đăng ký được (dropdown rỗng)
--   - Trên staging (chưa nạp 150k dòng lịch sử) -> rỗng hoàn toàn
--
-- SỬA: hợp 4 nguồn. Khoa xuất hiện ở BẤT KỲ đâu trong hệ thống đều được liệt kê.

begin;

create or replace view v_don_vi
with (security_invoker = true) as
select don_vi from (
    select distinct don_vi from usage_history_current
    union
    select distinct khoa   from users             where khoa   is not null
    union
    select distinct don_vi from proposals         where don_vi is not null
    union
    select distinct don_vi from khoa_nhom_ky_thuat where don_vi is not null
) t
where nullif(trim(don_vi), '') is not null
order by don_vi;

-- v_danh_sach_khoa: dropdown lúc ĐĂNG KÝ, phải đọc được khi CHƯA đăng nhập.
-- CỐ Ý không có security_invoker (bẫy 5.13) — thêm vào là anon bị RLS của
-- usage_history_current chặn, dropdown đăng ký rỗng. Đừng "sửa cho nhất quán".
create or replace view v_danh_sach_khoa as
select don_vi from (
    select distinct don_vi from usage_history_current
    union
    select distinct khoa   from users             where khoa   is not null
    union
    select distinct don_vi from proposals         where don_vi is not null
    union
    select distinct don_vi from khoa_nhom_ky_thuat where don_vi is not null
) t
where nullif(trim(don_vi), '') is not null
order by don_vi;

grant select on v_danh_sach_khoa to anon;

commit;
