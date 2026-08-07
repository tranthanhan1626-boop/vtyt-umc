-- ZL — Cho phép BỎ SỬA ĐÈ, đưa ô về lại số gốc (Danh mục tổng hợp PĐD)
--
-- Lỗ hổng phát hiện 07/08/2026 khi test: `patch_zd` tạo `danh_muc_tong_hop_o`
-- với đủ policy select/insert/update nhưng **KHÔNG có policy DELETE**. Hậu quả
-- đúng như bẫy số 5 trong Tổng quan/04_VAN_HANH_KY_THUAT.md: lệnh xoá trả về
-- HTTP 200 nhưng **không xoá được dòng nào** — thất bại âm thầm.
--
-- Vì sao cần: từ 07/08/2026 PĐD sửa được MỌI ô trên bản tổng hợp (kể cả cột
-- lịch sử HIS và cột công thức). Gõ nhầm một ô là chuyện thường, mà không có
-- đường lùi thì con số sai sẽ đi thẳng vào file trình ký. Xoá dòng override =
-- ô trở lại đúng giá trị hệ thống tính ra.
--
-- Chạy SAU patch_zd_danh_muc_tong_hop_o.sql.

create policy "dieu_duong/admin bỏ sửa đè ô tổng hợp" on danh_muc_tong_hop_o
    for delete using ((select current_user_role()) in ('dieu_duong', 'admin'));

-- Ghi vết việc bỏ sửa đè vào cùng bảng audit. Trigger cũ (fn_log_o_pdd_change)
-- chỉ bắt INSERT/UPDATE nên khôi phục sẽ không để lại dấu vết gì — trái
-- nguyên tắc 3 (mọi thay đổi phải truy ngược được).
create or replace function fn_log_o_pdd_xoa() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
    insert into danh_muc_tong_hop_o_audit
        (goi_id, nam_de_xuat, ma_hang, cot, gia_tri_cu, gia_tri_moi, nguoi_sua)
    values
        (old.goi_id, old.nam_de_xuat, old.ma_hang, old.cot, old.gia_tri, null,
         coalesce(auth.email(), old.updated_by));
    return old;
end;
$$;

create trigger trg_log_o_pdd_xoa
after delete on danh_muc_tong_hop_o
for each row execute function fn_log_o_pdd_xoa();

-- Đọc audit: `gia_tri_moi IS NULL` nghĩa là "đã bỏ sửa đè, ô về lại số gốc"
-- (khác với `gia_tri_cu IS NULL` = lần đầu ghi đè).
comment on table danh_muc_tong_hop_o_audit is
    'Lịch sử sửa ô của Danh mục tổng hợp PĐD. gia_tri_cu NULL = lần đầu ghi đè; gia_tri_moi NULL = bỏ sửa đè, ô trả về giá trị gốc hệ thống tính.';

-- ----------------------------------------------------------------------------
-- CÙNG LỖ HỔNG ở bảng cấu hình cột của Danh mục đề xuất khoa (patch_zh)
-- ----------------------------------------------------------------------------
-- `patch_zh` cũng chỉ có policy select/insert/update cho
-- `danh_muc_khoa_cot_cau_hinh` — không xoá được dòng cấu hình ẩn/khóa cột.
-- Hiện tại vẫn dùng được vì "Hiện tất cả" / "mở khóa" là UPDATE về false, để
-- lại dòng trơ vô hại. Nhưng khi cần DỌN sạch (vd sau đợt kiểm thử) thì lại
-- vướng, và cũng thất bại âm thầm y hệt. Vá luôn cho đồng bộ.
create policy "xoá cấu hình cột đúng khoa hoặc pđd" on danh_muc_khoa_cot_cau_hinh
    for delete using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );

-- ----------------------------------------------------------------------------
-- Dọn 2 ô sửa đè do phiên kiểm thử 07/08/2026 để lại (mã 66160). Chạy được
-- ngay sau khi policy trên có hiệu lực; nếu staging đã sạch thì câu này không
-- xoá gì, vô hại.
-- ----------------------------------------------------------------------------
delete from danh_muc_tong_hop_o
where ma_hang = '66160' and cot in ('sl_2024', 'ten_vt_2627');
