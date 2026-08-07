-- ZI — Khóa CỘT KHÔNG CHO SỬA trên Danh mục đề xuất của khoa
-- (frontend/src/features/DanhMucDeXuatKhoa.jsx). Bổ sung cho patch_zh.
--
-- PHÂN BIỆT 2 khái niệm "khóa" trên cùng bảng danh_muc_khoa_cot_cau_hinh —
-- ĐỪNG nhầm, hai cột này độc lập hoàn toàn:
--   * `khoa_cot`  = GHIM cột khi cuộn ngang (freeze/sticky). Chỉ ảnh hưởng
--                   hiển thị, vẫn sửa được nội dung ô bình thường.
--   * `khoa_sua`  = KHÓA SỬA (patch này). Cột bị khóa thì KHÔNG AI sửa được
--                   ô trong cột đó (kể cả PĐD, phải mở khóa trước) — đúng
--                   nguyên tắc "cột đã lock: không ai sửa" ở mục 3.1 tài
--                   liệu nghiệp vụ.
--
-- Ai khóa được: cả ĐVSD (đúng khoa mình) và PĐD — theo QĐ 07/08/2026 ở
-- `Tổng quan/01_NGHIEP_VU_VA_QUYET_DINH.md` mục 9 (ngoại lệ riêng cho màn
-- Danh mục đề xuất khoa; Danh mục TỔNG HỢP vẫn chỉ PĐD lock, xem patch_zd).
--
-- Chạy SAU patch_zh_danh_muc_khoa_cot_cau_hinh.sql.

-- ----------------------------------------------------------------------------
-- 1. Cột mới trên bảng cấu hình + bảng audit (patch_zh đã tạo 2 bảng này).
-- ----------------------------------------------------------------------------
alter table danh_muc_khoa_cot_cau_hinh
    add column khoa_sua boolean not null default false;

alter table danh_muc_khoa_cot_audit
    add column khoa_sua_cu  boolean,
    add column khoa_sua_moi boolean;

-- ----------------------------------------------------------------------------
-- 2. Trigger audit — ghi thêm thay đổi của khoa_sua. Thay thế bản ở patch_zh
--    (create or replace, không cần drop trigger vì trigger trỏ tới tên hàm).
-- ----------------------------------------------------------------------------
create or replace function fn_log_khoa_cot_cau_hinh_change() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
    if TG_OP = 'INSERT' then
        insert into danh_muc_khoa_cot_audit
            (goi_id, nam_de_xuat, khoa, cot, an_cu, an_moi, khoa_cu, khoa_moi,
             khoa_sua_cu, khoa_sua_moi, nguoi_sua)
        values
            (new.goi_id, new.nam_de_xuat, new.khoa, new.cot, null, new.an,
             null, new.khoa_cot, null, new.khoa_sua, new.updated_by);
    elsif TG_OP = 'UPDATE'
        and (new.an is distinct from old.an
             or new.khoa_cot is distinct from old.khoa_cot
             or new.khoa_sua is distinct from old.khoa_sua) then
        insert into danh_muc_khoa_cot_audit
            (goi_id, nam_de_xuat, khoa, cot, an_cu, an_moi, khoa_cu, khoa_moi,
             khoa_sua_cu, khoa_sua_moi, nguoi_sua)
        values
            (new.goi_id, new.nam_de_xuat, new.khoa, new.cot, old.an, new.an,
             old.khoa_cot, new.khoa_cot, old.khoa_sua, new.khoa_sua, new.updated_by);
    end if;
    return new;
end;
$$;

-- RLS: không cần policy mới — cột mới nằm trên bảng đã có đủ policy select/
-- insert/update từ patch_zh (dieu_duong/admin toàn viện, dvsd đúng khoa mình).
--
-- LƯU Ý: enforce "cột khóa thì không sửa được" hiện CHỈ ở frontend, vì các ô
-- chữ trên màn này còn lưu state cục bộ trong phiên (chưa có bảng lưu giá trị
-- ô như danh_muc_tong_hop_o của Tổng hợp PĐD). Khi nào nối bảng lưu ô thật,
-- phải thêm trigger chặn ghi giống fn_chan_o_da_lock trong patch_zd —
-- ẩn/khóa nút trên giao diện KHÔNG được coi là phân quyền (mục 9 tài liệu).
