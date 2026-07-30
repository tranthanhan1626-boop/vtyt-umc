-- Sửa lỗi: Phòng Điều dưỡng không chọn được hết các khoa.
--
-- NGUYÊN NHÂN GỐC: v_don_vi và v_danh_sach_khoa suy DUY NHẤT từ
-- usage_history_current. Hệ quả:
--   - Khoa chưa có lịch sử xuất kho -> PĐD không bao giờ chọn được
--   - Khoa mới mở -> người khoa đó không đăng ký được (dropdown rỗng)
--   - Trên staging (chưa nạp lịch sử) -> rỗng hoàn toàn
--
-- SỬA: hợp 4 nguồn — khoa xuất hiện ở BẤT KỲ đâu đều được liệt kê.
--
-- ⚠️ BẪY ĐÃ SUÝT MẮC (30/07/2026): bản đầu của patch này giữ
-- `security_invoker = true` trên v_don_vi. Nhưng RLS bảng users là
-- `email = auth.email() OR role = 'admin'` -> dieu_duong CHỈ đọc được dòng
-- của chính mình. Với security_invoker, view chạy bằng quyền người gọi nên
-- Phòng Điều dưỡng VẪN chỉ thấy đúng khoa mình — không sửa được đúng người
-- cần sửa. Phải BỎ security_invoker, giống v_danh_sach_khoa (bẫy 5.13).
--
-- An toàn vì view chỉ lộ TÊN KHOA, không lộ bất kỳ số liệu sử dụng nào.
-- Đừng "sửa cho nhất quán" bằng cách thêm lại security_invoker.

begin;

drop view if exists v_don_vi;

create view v_don_vi as
select don_vi from (
    select distinct don_vi from usage_history_current
    union
    select distinct khoa   from users              where khoa   is not null
    union
    select distinct don_vi from proposals          where don_vi is not null
    union
    select distinct don_vi from khoa_nhom_ky_thuat where don_vi is not null
) t
where nullif(trim(don_vi), '') is not null
order by don_vi;

grant select on v_don_vi to authenticated;

-- v_danh_sach_khoa: dropdown lúc ĐĂNG KÝ, phải đọc được khi CHƯA đăng nhập.
-- Vốn đã cố ý không có security_invoker — giữ nguyên như vậy.
create or replace view v_danh_sach_khoa as
select don_vi from (
    select distinct don_vi from usage_history_current
    union
    select distinct khoa   from users              where khoa   is not null
    union
    select distinct don_vi from proposals          where don_vi is not null
    union
    select distinct don_vi from khoa_nhom_ky_thuat where don_vi is not null
) t
where nullif(trim(don_vi), '') is not null
order by don_vi;

grant select on v_danh_sach_khoa to anon, authenticated;

commit;
